import { Router, Response } from 'express';
import { AuthenticatedRequest, authMiddleware } from '../middleware/auth';
import { rateLimit } from '../middleware/rateLimit';
import { prisma } from '../db';
import { config } from '../config';
import {
  validatePostContent,
  generateIntegrityHash,
  detectAIContent,
} from '../services/integrityEngine';
import { flagPost } from '../services/contentModerator';
import { ContentType, ReactionType, FlagReason } from '@prisma/client';

const router = Router();

/**
 * POST /posts
 * Create a new post. Enforces all content rules.
 */
router.post(
  '/',
  authMiddleware,
  rateLimit(60 * 1000, 10),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const { contentType, textBody, mediaUrl, captureMeta } = req.body;

      // Validate content type
      if (!contentType || !['PHOTO', 'VIDEO', 'TEXT'].includes(contentType)) {
        res.status(400).json({ error: 'Invalid content type. Must be PHOTO, VIDEO, or TEXT' });
        return;
      }

      // Text posts require textBody
      if (contentType === 'TEXT' && (!textBody || typeof textBody !== 'string')) {
        res.status(400).json({ error: 'Text body is required for text posts' });
        return;
      }

      // Media posts require mediaUrl
      if ((contentType === 'PHOTO' || contentType === 'VIDEO') && !mediaUrl) {
        res.status(400).json({ error: 'Media URL is required for photo/video posts' });
        return;
      }

      // Enforce text length
      if (textBody && textBody.length > config.maxPostTextLength) {
        res.status(400).json({
          error: `Text body must be ${config.maxPostTextLength} characters or fewer`,
        });
        return;
      }

      // Run content validation (no links, no hashtags, no commercial content)
      const validation = validatePostContent(textBody);
      if (!validation.valid) {
        res.status(422).json({
          error: 'Content validation failed',
          issues: validation.issues,
        });
        return;
      }

      // Verify user exists and is verified enough to post
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { trustScore: true, isVerified: true },
      });

      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      // Generate integrity hash
      const integrityHash = generateIntegrityHash({
        contentType,
        textBody: textBody || undefined,
        captureMeta: captureMeta || undefined,
        timestamp: Date.now(),
      });

      // AI detection score (stub for now)
      let aiScore = 0;
      // In production, if mediaUrl points to uploaded media:
      // const mediaBuffer = await fetchMediaBuffer(mediaUrl);
      // const aiResult = await detectAIContent(mediaBuffer);
      // aiScore = aiResult.score;

      const post = await prisma.post.create({
        data: {
          authorId: userId,
          contentType: contentType as ContentType,
          textBody: textBody || null,
          mediaUrl: mediaUrl || null,
          integrityHash,
          captureMeta: captureMeta || {},
          aiScore,
          isAuthentic: aiScore < 0.7, // Flag as not authentic if AI score is high
        },
        include: {
          author: {
            select: {
              id: true,
              username: true,
              isVerified: true,
            },
          },
        },
      });

      res.status(201).json({
        id: post.id,
        contentType: post.contentType,
        textBody: post.textBody,
        mediaUrl: post.mediaUrl,
        integrityHash: post.integrityHash,
        isAuthentic: post.isAuthentic,
        createdAt: post.createdAt,
        author: post.author,
      });
    } catch (err) {
      console.error('Error creating post:', err);
      res.status(500).json({ error: 'Failed to create post' });
    }
  }
);

/**
 * GET /posts/feed
 * Chronological feed of posts from followed users. Paginated.
 */
router.get(
  '/feed',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const cursor = req.query.cursor as string | undefined;
      const limit = Math.min(
        parseInt(req.query.limit as string) || config.feedPageSize,
        50
      );

      // Get list of followed user IDs
      const follows = await prisma.follow.findMany({
        where: { followerId: userId },
        select: { followingId: true },
      });

      const followingIds = follows.map((f) => f.followingId);

      // Include own posts in the feed
      followingIds.push(userId);

      const whereClause: any = {
        authorId: { in: followingIds },
        isAuthentic: true,
      };

      if (cursor) {
        whereClause.createdAt = { lt: new Date(cursor) };
      }

      const posts = await prisma.post.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        take: limit + 1, // Fetch one extra to determine if there's a next page
        include: {
          author: {
            select: {
              id: true,
              username: true,
              isVerified: true,
            },
          },
          _count: {
            select: { reactions: true, flags: true },
          },
          reactions: {
            where: { userId },
            select: { reactionType: true },
            take: 1,
          },
        },
      });

      const hasMore = posts.length > limit;
      const feedPosts = hasMore ? posts.slice(0, limit) : posts;
      const nextCursor = hasMore
        ? feedPosts[feedPosts.length - 1].createdAt.toISOString()
        : null;

      res.json({
        posts: feedPosts.map((post) => ({
          id: post.id,
          contentType: post.contentType,
          textBody: post.textBody,
          mediaUrl: post.mediaUrl,
          isAuthentic: post.isAuthentic,
          createdAt: post.createdAt,
          author: post.author,
          reactionCount: post._count.reactions,
          myReaction: post.reactions[0]?.reactionType || null,
        })),
        nextCursor,
        hasMore,
      });
    } catch (err) {
      console.error('Error fetching feed:', err);
      res.status(500).json({ error: 'Failed to fetch feed' });
    }
  }
);

/**
 * GET /posts/:id
 * Get a single post by ID.
 */
router.get(
  '/:id',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const postId = req.params.id;

      const post = await prisma.post.findUnique({
        where: { id: postId },
        include: {
          author: {
            select: {
              id: true,
              username: true,
              isVerified: true,
            },
          },
          reactions: {
            select: {
              reactionType: true,
              userId: true,
            },
          },
          _count: {
            select: { reactions: true, flags: true },
          },
        },
      });

      if (!post) {
        res.status(404).json({ error: 'Post not found' });
        return;
      }

      // Group reactions by type
      const reactionCounts: Record<string, number> = {};
      for (const r of post.reactions) {
        reactionCounts[r.reactionType] = (reactionCounts[r.reactionType] || 0) + 1;
      }

      const myReaction = post.reactions.find((r) => r.userId === userId);

      res.json({
        id: post.id,
        contentType: post.contentType,
        textBody: post.textBody,
        mediaUrl: post.mediaUrl,
        integrityHash: post.integrityHash,
        isAuthentic: post.isAuthentic,
        createdAt: post.createdAt,
        author: post.author,
        reactionCounts,
        totalReactions: post._count.reactions,
        myReaction: myReaction?.reactionType || null,
      });
    } catch (err) {
      console.error('Error fetching post:', err);
      res.status(500).json({ error: 'Failed to fetch post' });
    }
  }
);

/**
 * DELETE /posts/:id
 * Permanently delete a post. Only the author can delete.
 */
router.delete(
  '/:id',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const postId = req.params.id;

      const post = await prisma.post.findUnique({
        where: { id: postId },
        select: { authorId: true },
      });

      if (!post) {
        res.status(404).json({ error: 'Post not found' });
        return;
      }

      if (post.authorId !== userId) {
        res.status(403).json({ error: 'You can only delete your own posts' });
        return;
      }

      // Permanent delete - cascades to reactions and flags
      await prisma.post.delete({
        where: { id: postId },
      });

      res.json({ message: 'Post permanently deleted' });
    } catch (err) {
      console.error('Error deleting post:', err);
      res.status(500).json({ error: 'Failed to delete post' });
    }
  }
);

/**
 * POST /posts/:id/react
 * Add a reaction to a post.
 */
router.post(
  '/:id/react',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const postId = req.params.id;
      const { reactionType } = req.body;

      if (!reactionType || !['FELT_THAT', 'RESPECT', 'REAL_ONE'].includes(reactionType)) {
        res.status(400).json({
          error: 'Invalid reaction type. Must be FELT_THAT, RESPECT, or REAL_ONE',
        });
        return;
      }

      // Verify post exists
      const post = await prisma.post.findUnique({
        where: { id: postId },
        select: { id: true, authorId: true },
      });

      if (!post) {
        res.status(404).json({ error: 'Post not found' });
        return;
      }

      // Upsert the reaction (one reaction per user per post)
      const reaction = await prisma.reaction.upsert({
        where: {
          postId_userId: { postId, userId },
        },
        update: {
          reactionType: reactionType as ReactionType,
        },
        create: {
          postId,
          userId,
          reactionType: reactionType as ReactionType,
        },
      });

      res.json({
        id: reaction.id,
        reactionType: reaction.reactionType,
        postId: reaction.postId,
      });
    } catch (err) {
      console.error('Error adding reaction:', err);
      res.status(500).json({ error: 'Failed to add reaction' });
    }
  }
);

/**
 * POST /posts/:id/flag
 * Flag a post as suspicious.
 */
router.post(
  '/:id/flag',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const postId = req.params.id;
      const { reason } = req.body;

      if (
        !reason ||
        !['AI_CONTENT', 'EDITED', 'FAKE', 'SPAM', 'COMMERCIAL'].includes(reason)
      ) {
        res.status(400).json({
          error: 'Invalid flag reason. Must be AI_CONTENT, EDITED, FAKE, SPAM, or COMMERCIAL',
        });
        return;
      }

      const result = await flagPost(postId, userId, reason as FlagReason);

      res.status(201).json({
        flagId: result.id,
        message: 'Post has been flagged for review',
      });
    } catch (err: any) {
      if (err.message === 'You have already flagged this post') {
        res.status(409).json({ error: err.message });
        return;
      }
      if (err.message === 'Post not found') {
        res.status(404).json({ error: err.message });
        return;
      }
      if (err.message === 'You cannot flag your own post') {
        res.status(403).json({ error: err.message });
        return;
      }
      console.error('Error flagging post:', err);
      res.status(500).json({ error: 'Failed to flag post' });
    }
  }
);

export default router;
