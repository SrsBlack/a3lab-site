import { Router, Response } from 'express';
import { AuthenticatedRequest, authMiddleware } from '../middleware/auth';
import { prisma } from '../db';
import { config } from '../config';
import { recalculateTrustScore } from '../services/trustEngine';

const router = Router();

/**
 * GET /users/:id
 * Get a user's public profile.
 * DOES NOT return trust score or follower count (by design).
 */
router.get(
  '/:id',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const requesterId = req.user!.userId;
      const targetId = req.params.id;

      const user = await prisma.user.findUnique({
        where: { id: targetId },
        select: {
          id: true,
          username: true,
          isVerified: true,
          createdAt: true,
          _count: {
            select: {
              posts: true,
              vouchesReceived: true,
            },
          },
        },
      });

      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      // Check if requester follows this user
      const followRelation = await prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: requesterId,
            followingId: targetId,
          },
        },
      });

      // Check if requester has vouched for this user
      const vouchRelation = await prisma.vouch.findUnique({
        where: {
          voucherId_voucheeId: {
            voucherId: requesterId,
            voucheeId: targetId,
          },
        },
      });

      // Public profile - NO trust score, NO follower count
      res.json({
        id: user.id,
        username: user.username,
        isVerified: user.isVerified,
        joinedAt: user.createdAt,
        postCount: user._count.posts,
        vouchCount: user._count.vouchesReceived,
        isFollowing: !!followRelation,
        hasVouched: !!vouchRelation,
      });
    } catch (err) {
      console.error('Error fetching user profile:', err);
      res.status(500).json({ error: 'Failed to fetch profile' });
    }
  }
);

/**
 * GET /users/:id/posts
 * Get a user's posts (paginated).
 */
router.get(
  '/:id/posts',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const requesterId = req.user!.userId;
      const targetId = req.params.id;
      const cursor = req.query.cursor as string | undefined;
      const limit = Math.min(
        parseInt(req.query.limit as string) || config.feedPageSize,
        50
      );

      // Verify user exists
      const user = await prisma.user.findUnique({
        where: { id: targetId },
        select: { id: true },
      });

      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      const whereClause: any = {
        authorId: targetId,
        isAuthentic: true,
      };

      if (cursor) {
        whereClause.createdAt = { lt: new Date(cursor) };
      }

      const posts = await prisma.post.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        take: limit + 1,
        include: {
          author: {
            select: {
              id: true,
              username: true,
              isVerified: true,
            },
          },
          _count: {
            select: { reactions: true },
          },
          reactions: {
            where: { userId: requesterId },
            select: { reactionType: true },
            take: 1,
          },
        },
      });

      const hasMore = posts.length > limit;
      const pagePosts = hasMore ? posts.slice(0, limit) : posts;
      const nextCursor = hasMore
        ? pagePosts[pagePosts.length - 1].createdAt.toISOString()
        : null;

      res.json({
        posts: pagePosts.map((post) => ({
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
      console.error('Error fetching user posts:', err);
      res.status(500).json({ error: 'Failed to fetch posts' });
    }
  }
);

/**
 * POST /users/:id/follow
 * Follow a user. Enforces the 150 follow cap (Dunbar's number).
 */
router.post(
  '/:id/follow',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const followerId = req.user!.userId;
      const followingId = req.params.id;

      // Can't follow yourself
      if (followerId === followingId) {
        res.status(400).json({ error: 'You cannot follow yourself' });
        return;
      }

      // Verify target user exists
      const targetUser = await prisma.user.findUnique({
        where: { id: followingId },
        select: { id: true },
      });

      if (!targetUser) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      // Check if already following
      const existing = await prisma.follow.findUnique({
        where: {
          followerId_followingId: { followerId, followingId },
        },
      });

      if (existing) {
        res.status(409).json({ error: 'You are already following this user' });
        return;
      }

      // Enforce the 150 follow cap (Dunbar's number)
      const followCount = await prisma.follow.count({
        where: { followerId },
      });

      if (followCount >= config.maxFollows) {
        res.status(403).json({
          error: `You cannot follow more than ${config.maxFollows} people. Unfollow someone first.`,
          currentFollowCount: followCount,
          maxFollows: config.maxFollows,
        });
        return;
      }

      await prisma.follow.create({
        data: { followerId, followingId },
      });

      res.status(201).json({
        message: 'Now following user',
        followingId,
      });
    } catch (err) {
      console.error('Error following user:', err);
      res.status(500).json({ error: 'Failed to follow user' });
    }
  }
);

/**
 * DELETE /users/:id/follow
 * Unfollow a user.
 */
router.delete(
  '/:id/follow',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const followerId = req.user!.userId;
      const followingId = req.params.id;

      const existing = await prisma.follow.findUnique({
        where: {
          followerId_followingId: { followerId, followingId },
        },
      });

      if (!existing) {
        res.status(404).json({ error: 'You are not following this user' });
        return;
      }

      await prisma.follow.delete({
        where: {
          followerId_followingId: { followerId, followingId },
        },
      });

      res.json({ message: 'Unfollowed user', unfollowedId: followingId });
    } catch (err) {
      console.error('Error unfollowing user:', err);
      res.status(500).json({ error: 'Failed to unfollow user' });
    }
  }
);

/**
 * POST /users/:id/vouch
 * Vouch for a user's authenticity. Max 3 vouches given per user.
 */
router.post(
  '/:id/vouch',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const voucherId = req.user!.userId;
      const voucheeId = req.params.id;

      // Can't vouch for yourself
      if (voucherId === voucheeId) {
        res.status(400).json({ error: 'You cannot vouch for yourself' });
        return;
      }

      // Verify target user exists
      const targetUser = await prisma.user.findUnique({
        where: { id: voucheeId },
        select: { id: true },
      });

      if (!targetUser) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      // Check if already vouched
      const existing = await prisma.vouch.findUnique({
        where: {
          voucherId_voucheeId: { voucherId, voucheeId },
        },
      });

      if (existing) {
        res.status(409).json({ error: 'You have already vouched for this user' });
        return;
      }

      // Enforce max 3 vouches given
      const vouchCount = await prisma.vouch.count({
        where: { voucherId },
      });

      if (vouchCount >= config.maxVouchesGiven) {
        res.status(403).json({
          error: `You can only vouch for ${config.maxVouchesGiven} people total. Choose wisely.`,
          currentVouchCount: vouchCount,
          maxVouches: config.maxVouchesGiven,
        });
        return;
      }

      // Voucher must be verified to vouch
      const voucher = await prisma.user.findUnique({
        where: { id: voucherId },
        select: { isVerified: true },
      });

      if (!voucher?.isVerified) {
        res.status(403).json({
          error: 'You must be verified to vouch for others',
        });
        return;
      }

      // Create the vouch
      await prisma.vouch.create({
        data: { voucherId, voucheeId },
      });

      // Create an identity check for the vouchee
      await prisma.identityCheck.create({
        data: {
          userId: voucheeId,
          checkType: 'VOUCH',
          status: 'PASSED',
          scoreAwarded: 15,
        },
      });

      // Recalculate the vouchee's trust score
      const newScore = await recalculateTrustScore(voucheeId);

      res.status(201).json({
        message: 'Vouch recorded',
        voucheeId,
        vouchesGivenRemaining: config.maxVouchesGiven - vouchCount - 1,
      });
    } catch (err) {
      console.error('Error vouching for user:', err);
      res.status(500).json({ error: 'Failed to vouch for user' });
    }
  }
);

export default router;
