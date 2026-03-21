import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth';
import { prisma } from '../db';

/**
 * Factory that creates middleware to check block status.
 * Looks up the target user ID from the specified request param.
 */
export function blockCheck(paramName: string = 'id') {
  return async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const userId = req.user!.userId;
    const targetId = req.params[paramName];

    if (!targetId || userId === targetId) {
      next();
      return;
    }

    const block = await prisma.block.findFirst({
      where: {
        OR: [
          { blockerId: userId, blockedId: targetId },
          { blockerId: targetId, blockedId: userId },
        ],
      },
    });

    if (block) {
      res.status(403).json({ error: 'This action is not available' });
      return;
    }

    next();
  };
}
