import { Router, Response } from 'express';
import { AuthenticatedRequest, authMiddleware } from '../middleware/auth';
import { prisma } from '../db';
import { savePushToken } from '../services/notifications';

const router = Router();

/**
 * POST /notifications/register
 * Save an Expo push token for the authenticated user.
 */
router.post(
  '/register',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const { token } = req.body;

      if (!token || typeof token !== 'string') {
        res.status(400).json({ error: 'Push token is required' });
        return;
      }

      await savePushToken(userId, token);

      res.json({ message: 'Push token registered' });
    } catch (err: any) {
      if (err.message === 'Invalid Expo push token') {
        res.status(400).json({ error: err.message });
        return;
      }
      console.error('Error registering push token:', err);
      res.status(500).json({ error: 'Failed to register push token' });
    }
  }
);

/**
 * GET /notifications/preferences
 * Get the authenticated user's notification preferences.
 */
router.get(
  '/preferences',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user!.userId;

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          notifyReactions: true,
          notifyVouches: true,
          notifyModeration: true,
        },
      });

      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      res.json({
        reactions: user.notifyReactions,
        vouches: user.notifyVouches,
        moderation: user.notifyModeration,
      });
    } catch (err) {
      console.error('Error fetching notification preferences:', err);
      res.status(500).json({ error: 'Failed to fetch notification preferences' });
    }
  }
);

/**
 * PUT /notifications/preferences
 * Update the authenticated user's notification preferences.
 */
router.put(
  '/preferences',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const { reactions, vouches, moderation } = req.body;

      // Build update object with only provided fields
      const update: Record<string, boolean> = {};

      if (typeof reactions === 'boolean') {
        update.notifyReactions = reactions;
      }
      if (typeof vouches === 'boolean') {
        update.notifyVouches = vouches;
      }
      if (typeof moderation === 'boolean') {
        update.notifyModeration = moderation;
      }

      if (Object.keys(update).length === 0) {
        res.status(400).json({
          error: 'At least one preference must be provided (reactions, vouches, moderation)',
        });
        return;
      }

      await prisma.user.update({
        where: { id: userId },
        data: update,
      });

      // Return the full updated preferences
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          notifyReactions: true,
          notifyVouches: true,
          notifyModeration: true,
        },
      });

      res.json({
        reactions: user!.notifyReactions,
        vouches: user!.notifyVouches,
        moderation: user!.notifyModeration,
      });
    } catch (err) {
      console.error('Error updating notification preferences:', err);
      res.status(500).json({ error: 'Failed to update notification preferences' });
    }
  }
);

export default router;
