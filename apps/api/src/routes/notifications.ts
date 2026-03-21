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

/**
 * GET /notifications
 * List notifications for the authenticated user (paginated, newest first).
 */
router.get(
  '/',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const cursor = req.query.cursor as string | undefined;
      const limit = Math.min(parseInt(req.query.limit as string) || 30, 50);

      const whereClause: any = { userId };

      if (cursor) {
        whereClause.createdAt = { lt: new Date(cursor) };
      }

      const notifications = await prisma.notification.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        take: limit + 1,
      });

      const hasMore = notifications.length > limit;
      const page = hasMore ? notifications.slice(0, limit) : notifications;
      const nextCursor = hasMore
        ? page[page.length - 1].createdAt.toISOString()
        : null;

      res.json({
        notifications: page.map((n) => ({
          id: n.id,
          type: n.type,
          title: n.title,
          body: n.body,
          data: n.data,
          read: n.read,
          createdAt: n.createdAt,
        })),
        nextCursor,
        hasMore,
      });
    } catch (err) {
      console.error('Error fetching notifications:', err);
      res.status(500).json({ error: 'Failed to fetch notifications' });
    }
  }
);

/**
 * POST /notifications/:id/read
 * Mark a single notification as read.
 */
router.post(
  '/:id/read',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const notifId = req.params.id;

      const notif = await prisma.notification.findUnique({
        where: { id: notifId },
      });

      if (!notif || notif.userId !== userId) {
        res.status(404).json({ error: 'Notification not found' });
        return;
      }

      await prisma.notification.update({
        where: { id: notifId },
        data: { read: true },
      });

      res.json({ message: 'Notification marked as read' });
    } catch (err) {
      console.error('Error marking notification read:', err);
      res.status(500).json({ error: 'Failed to mark notification as read' });
    }
  }
);

/**
 * POST /notifications/read-all
 * Mark all notifications as read for the authenticated user.
 */
router.post(
  '/read-all',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user!.userId;

      await prisma.notification.updateMany({
        where: { userId, read: false },
        data: { read: true },
      });

      res.json({ message: 'All notifications marked as read' });
    } catch (err) {
      console.error('Error marking all notifications read:', err);
      res.status(500).json({ error: 'Failed to mark all notifications as read' });
    }
  }
);

export default router;
