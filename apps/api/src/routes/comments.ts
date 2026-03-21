import { Router, Response } from 'express';
import { AuthenticatedRequest, authMiddleware } from '../middleware/auth';
import { prisma } from '../db';
import { config } from '../config';
import { validatePostContent } from '../services/integrityEngine';

const router = Router();

/**
 * GET /posts/:postId/comments
 * Get comments for a post (paginated, oldest first).
 */
router.get(
  '/posts/:postId/comments',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const postId = req.params.postId;
      const cursor = req.query.cursor as string | undefined;
      const limit = Math.min(
        parseInt(req.query.limit as string) || config.feedPageSize,
        50
      );

      // Verify post exists
      const post = await prisma.post.findUnique({
        where: { id: postId },
        select: { id: true },
      });

      if (!post) {
        res.status(404).json({ error: 'Post not found' });
        return;
      }

      const whereClause: any = {
        postId,
      };

      if (cursor) {
        whereClause.createdAt = { gt: new Date(cursor) };
      }

      const comments = await prisma.comment.findMany({
        where: whereClause,
        orderBy: { createdAt: 'asc' },
        take: limit + 1,
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

      const hasMore = comments.length > limit;
      const pageComments = hasMore ? comments.slice(0, limit) : comments;
      const nextCursor = hasMore
        ? pageComments[pageComments.length - 1].createdAt.toISOString()
        : null;

      res.json({
        comments: pageComments.map((c) => ({
          id: c.id,
          body: c.body,
          createdAt: c.createdAt,
          author: c.author,
        })),
        nextCursor,
        hasMore,
      });
    } catch (err) {
      console.error('Error fetching comments:', err);
      res.status(500).json({ error: 'Failed to fetch comments' });
    }
  }
);

/**
 * POST /posts/:postId/comments
 * Add a comment to a post.
 */
router.post(
  '/posts/:postId/comments',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const postId = req.params.postId;
      const { body } = req.body;

      // Validate body
      if (!body || typeof body !== 'string' || body.trim().length === 0) {
        res.status(400).json({ error: 'Comment body is required' });
        return;
      }

      if (body.length > 500) {
        res.status(400).json({ error: 'Comment body must be 500 characters or fewer' });
        return;
      }

      // Run content validation (no links, no hashtags, no commercial content)
      const validation = validatePostContent(body);
      if (!validation.valid) {
        res.status(422).json({
          error: 'Content validation failed',
          issues: validation.issues,
        });
        return;
      }

      // Verify post exists and get author
      const post = await prisma.post.findUnique({
        where: { id: postId },
        select: { id: true, authorId: true },
      });

      if (!post) {
        res.status(404).json({ error: 'Post not found' });
        return;
      }

      // Check if the post author has blocked the commenter
      const blocked = await prisma.block.findUnique({
        where: {
          blockerId_blockedId: {
            blockerId: post.authorId,
            blockedId: userId,
          },
        },
      });

      if (blocked) {
        res.status(403).json({ error: 'You cannot comment on this post' });
        return;
      }

      const comment = await prisma.comment.create({
        data: {
          postId,
          authorId: userId,
          body: body.trim(),
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
        id: comment.id,
        body: comment.body,
        createdAt: comment.createdAt,
        author: comment.author,
      });
    } catch (err) {
      console.error('Error creating comment:', err);
      res.status(500).json({ error: 'Failed to create comment' });
    }
  }
);

/**
 * DELETE /comments/:id
 * Delete own comment.
 */
router.delete(
  '/comments/:id',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const commentId = req.params.id;

      const comment = await prisma.comment.findUnique({
        where: { id: commentId },
        select: { authorId: true },
      });

      if (!comment) {
        res.status(404).json({ error: 'Comment not found' });
        return;
      }

      if (comment.authorId !== userId) {
        res.status(403).json({ error: 'You can only delete your own comments' });
        return;
      }

      await prisma.comment.delete({
        where: { id: commentId },
      });

      res.json({ message: 'Comment deleted' });
    } catch (err) {
      console.error('Error deleting comment:', err);
      res.status(500).json({ error: 'Failed to delete comment' });
    }
  }
);

export default router;
