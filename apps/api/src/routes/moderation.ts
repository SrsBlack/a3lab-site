import { Router, Response } from 'express';
import { AuthenticatedRequest, authMiddleware } from '../middleware/auth';
import { prisma } from '../db';

const router = Router();

/**
 * GET /moderation/queue
 * Get posts flagged for review. Only verified users can moderate.
 */
router.get(
  '/queue',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user!.userId;

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { isVerified: true, trustScore: true },
      });

      if (!user?.isVerified || user.trustScore < 50) {
        res.status(403).json({
          error: 'You must be verified with a trust score of 50+ to moderate',
        });
        return;
      }

      const flags = await prisma.flag.findMany({
        where: { status: 'PENDING' },
        orderBy: { createdAt: 'asc' },
        take: 20,
        include: {
          post: {
            select: {
              id: true,
              contentType: true,
              textBody: true,
              mediaUrl: true,
              createdAt: true,
              author: {
                select: {
                  id: true,
                  username: true,
                  isVerified: true,
                },
              },
            },
          },
          reporter: {
            select: {
              id: true,
              username: true,
            },
          },
        },
      });

      res.json({
        queue: flags.map((f) => ({
          flagId: f.id,
          reason: f.reason,
          flaggedAt: f.createdAt,
          reporter: f.reporter,
          post: f.post,
        })),
      });
    } catch (err) {
      console.error('Error fetching moderation queue:', err);
      res.status(500).json({ error: 'Failed to fetch moderation queue' });
    }
  }
);

/**
 * POST /moderation/:id
 * Review a flagged post. Accepts { decision: 'uphold' | 'dismiss' }.
 */
router.post(
  '/:id',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const flagId = req.params.id;
      const { decision } = req.body;

      if (!decision || !['uphold', 'dismiss', 'approve', 'remove'].includes(decision)) {
        res.status(400).json({
          error: 'Decision must be uphold/dismiss or approve/remove',
        });
        return;
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { isVerified: true, trustScore: true },
      });

      if (!user?.isVerified || user.trustScore < 50) {
        res.status(403).json({
          error: 'You must be verified with a trust score of 50+ to moderate',
        });
        return;
      }

      const flag = await prisma.flag.findUnique({
        where: { id: flagId },
        include: { post: { select: { id: true } } },
      });

      if (!flag) {
        res.status(404).json({ error: 'Flag not found' });
        return;
      }

      if (flag.status !== 'PENDING') {
        res.status(409).json({ error: 'This flag has already been reviewed' });
        return;
      }

      // Normalize decision: approve/remove -> dismiss/uphold
      const shouldRemove = decision === 'uphold' || decision === 'remove';

      await prisma.flag.update({
        where: { id: flagId },
        data: {
          status: 'REVIEWED',
          reviewedBy: userId,
        },
      });

      // If upholding, mark the post as not authentic
      if (shouldRemove) {
        await prisma.post.update({
          where: { id: flag.postId },
          data: { isAuthentic: false },
        });
      }

      res.json({
        message: shouldRemove
          ? 'Flag upheld — post removed from feeds'
          : 'Flag dismissed — post remains visible',
        flagId,
        decision: shouldRemove ? 'upheld' : 'dismissed',
      });
    } catch (err) {
      console.error('Error reviewing flag:', err);
      res.status(500).json({ error: 'Failed to review flag' });
    }
  }
);

export default router;
