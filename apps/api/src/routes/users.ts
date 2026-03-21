import { Router, Response } from 'express';
import { AuthenticatedRequest, authMiddleware } from '../middleware/auth';
import { prisma } from '../db';
import { config } from '../config';
import { recalculateTrustScore } from '../services/trustEngine';

const router = Router();

/**
 * PUT /users/me
 * Edit own profile (displayName, bio, avatarUrl).
 */
router.put(
  '/me',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const { displayName, bio, avatarUrl } = req.body;

      const update: Record<string, any> = {};

      if (displayName !== undefined) {
        if (displayName !== null && typeof displayName !== 'string') {
          res.status(400).json({ error: 'displayName must be a string or null' });
          return;
        }
        if (displayName && displayName.length > 50) {
          res.status(400).json({ error: 'displayName must be 50 characters or fewer' });
          return;
        }
        update.displayName = displayName || null;
      }

      if (bio !== undefined) {
        if (bio !== null && typeof bio !== 'string') {
          res.status(400).json({ error: 'bio must be a string or null' });
          return;
        }
        if (bio && bio.length > 160) {
          res.status(400).json({ error: 'bio must be 160 characters or fewer' });
          return;
        }
        update.bio = bio || null;
      }

      if (avatarUrl !== undefined) {
        if (avatarUrl !== null && typeof avatarUrl !== 'string') {
          res.status(400).json({ error: 'avatarUrl must be a string or null' });
          return;
        }
        update.avatarUrl = avatarUrl || null;
      }

      if (Object.keys(update).length === 0) {
        res.status(400).json({ error: 'At least one field must be provided (displayName, bio, avatarUrl)' });
        return;
      }

      const user = await prisma.user.update({
        where: { id: userId },
        data: update,
        select: {
          id: true,
          username: true,
          displayName: true,
          bio: true,
          avatarUrl: true,
        },
      });

      res.json(user);
    } catch (err) {
      console.error('Error updating profile:', err);
      res.status(500).json({ error: 'Failed to update profile' });
    }
  }
);

/**
 * GET /users/search
 * Search users by username.
 */
router.get(
  '/search',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const q = req.query.q as string | undefined;

      if (!q || typeof q !== 'string' || q.trim().length === 0) {
        res.status(400).json({ error: 'Query parameter "q" is required' });
        return;
      }

      const users = await prisma.user.findMany({
        where: {
          username: {
            contains: q.trim(),
            mode: 'insensitive',
          },
        },
        select: {
          id: true,
          username: true,
          displayName: true,
          isVerified: true,
          avatarUrl: true,
        },
        take: 20,
      });

      res.json({ users });
    } catch (err) {
      console.error('Error searching users:', err);
      res.status(500).json({ error: 'Failed to search users' });
    }
  }
);

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

/**
 * GET /users/:id/followers
 * List a user's followers (paginated, limit 50).
 */
router.get(
  '/:id/followers',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const targetId = req.params.id;
      const cursor = req.query.cursor as string | undefined;
      const limit = Math.min(
        parseInt(req.query.limit as string) || 50,
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
        followingId: targetId,
      };

      if (cursor) {
        whereClause.createdAt = { lt: new Date(cursor) };
      }

      const follows = await prisma.follow.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        take: limit + 1,
        include: {
          follower: {
            select: {
              id: true,
              username: true,
              isVerified: true,
            },
          },
        },
      });

      const hasMore = follows.length > limit;
      const pageFollows = hasMore ? follows.slice(0, limit) : follows;
      const nextCursor = hasMore
        ? pageFollows[pageFollows.length - 1].createdAt.toISOString()
        : null;

      res.json({
        followers: pageFollows.map((f) => f.follower),
        nextCursor,
        hasMore,
      });
    } catch (err) {
      console.error('Error fetching followers:', err);
      res.status(500).json({ error: 'Failed to fetch followers' });
    }
  }
);

/**
 * GET /users/:id/following
 * List who a user follows (paginated, limit 50).
 */
router.get(
  '/:id/following',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const targetId = req.params.id;
      const cursor = req.query.cursor as string | undefined;
      const limit = Math.min(
        parseInt(req.query.limit as string) || 50,
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
        followerId: targetId,
      };

      if (cursor) {
        whereClause.createdAt = { lt: new Date(cursor) };
      }

      const follows = await prisma.follow.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        take: limit + 1,
        include: {
          following: {
            select: {
              id: true,
              username: true,
              isVerified: true,
            },
          },
        },
      });

      const hasMore = follows.length > limit;
      const pageFollows = hasMore ? follows.slice(0, limit) : follows;
      const nextCursor = hasMore
        ? pageFollows[pageFollows.length - 1].createdAt.toISOString()
        : null;

      res.json({
        following: pageFollows.map((f) => f.following),
        nextCursor,
        hasMore,
      });
    } catch (err) {
      console.error('Error fetching following:', err);
      res.status(500).json({ error: 'Failed to fetch following' });
    }
  }
);

/**
 * POST /users/:id/block
 * Block a user. Deletes any follow/vouch relationships.
 */
router.post(
  '/:id/block',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const blockerId = req.user!.userId;
      const blockedId = req.params.id;

      if (blockerId === blockedId) {
        res.status(400).json({ error: 'You cannot block yourself' });
        return;
      }

      // Verify target user exists
      const targetUser = await prisma.user.findUnique({
        where: { id: blockedId },
        select: { id: true },
      });

      if (!targetUser) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      // Check if already blocked
      const existing = await prisma.block.findUnique({
        where: {
          blockerId_blockedId: { blockerId, blockedId },
        },
      });

      if (existing) {
        res.status(409).json({ error: 'You have already blocked this user' });
        return;
      }

      // Create block and remove follow/vouch relationships in a transaction
      await prisma.$transaction([
        prisma.block.create({
          data: { blockerId, blockedId },
        }),
        // Remove follow relationships in both directions
        prisma.follow.deleteMany({
          where: {
            OR: [
              { followerId: blockerId, followingId: blockedId },
              { followerId: blockedId, followingId: blockerId },
            ],
          },
        }),
        // Remove vouch relationships in both directions
        prisma.vouch.deleteMany({
          where: {
            OR: [
              { voucherId: blockerId, voucheeId: blockedId },
              { voucherId: blockedId, voucheeId: blockerId },
            ],
          },
        }),
      ]);

      res.status(201).json({ message: 'User blocked', blockedId });
    } catch (err) {
      console.error('Error blocking user:', err);
      res.status(500).json({ error: 'Failed to block user' });
    }
  }
);

/**
 * DELETE /users/:id/block
 * Unblock a user.
 */
router.delete(
  '/:id/block',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const blockerId = req.user!.userId;
      const blockedId = req.params.id;

      const existing = await prisma.block.findUnique({
        where: {
          blockerId_blockedId: { blockerId, blockedId },
        },
      });

      if (!existing) {
        res.status(404).json({ error: 'You have not blocked this user' });
        return;
      }

      await prisma.block.delete({
        where: {
          blockerId_blockedId: { blockerId, blockedId },
        },
      });

      res.json({ message: 'User unblocked', unblockedId: blockedId });
    } catch (err) {
      console.error('Error unblocking user:', err);
      res.status(500).json({ error: 'Failed to unblock user' });
    }
  }
);

export default router;
