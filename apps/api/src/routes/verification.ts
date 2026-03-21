import { Router, Response } from 'express';
import crypto from 'crypto';
import { AuthenticatedRequest, authMiddleware } from '../middleware/auth';
import { rateLimit } from '../middleware/rateLimit';
import { prisma } from '../db';
import { getTrustBreakdown, recalculateTrustScore } from '../services/trustEngine';

const router = Router();

// In-memory challenge store (replace with Redis in production)
const pendingChallenges = new Map<
  string,
  {
    userId: string;
    type: string;
    instruction: string;
    expiresAt: number;
  }
>();

// Available liveness challenge types
const CHALLENGE_TYPES = [
  { type: 'turn_left', instruction: 'Turn your head slowly to the left' },
  { type: 'turn_right', instruction: 'Turn your head slowly to the right' },
  { type: 'blink', instruction: 'Blink twice slowly' },
  { type: 'smile', instruction: 'Give a natural smile' },
  { type: 'nod', instruction: 'Nod your head slowly' },
  { type: 'look_up', instruction: 'Look up briefly then back at the camera' },
];

/**
 * GET /verification/challenge
 * Get a new liveness challenge for selfie verification.
 */
router.get(
  '/challenge',
  authMiddleware,
  rateLimit(60 * 1000, 5),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user!.userId;

      // Check if user already passed selfie verification
      const existingSelfie = await prisma.identityCheck.findFirst({
        where: {
          userId,
          checkType: 'SELFIE',
          status: 'PASSED',
        },
      });

      if (existingSelfie) {
        res.status(400).json({
          error: 'You have already passed selfie verification',
        });
        return;
      }

      // Pick a random challenge
      const challenge =
        CHALLENGE_TYPES[Math.floor(Math.random() * CHALLENGE_TYPES.length)];
      const challengeId = crypto.randomUUID();

      pendingChallenges.set(challengeId, {
        userId,
        type: challenge.type,
        instruction: challenge.instruction,
        expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes
      });

      res.json({
        challengeId,
        type: challenge.type,
        instruction: challenge.instruction,
        expiresInSeconds: 300,
      });
    } catch (err) {
      console.error('Error generating challenge:', err);
      res.status(500).json({ error: 'Failed to generate challenge' });
    }
  }
);

/**
 * POST /verification/selfie
 * Submit a liveness selfie challenge response.
 */
router.post(
  '/selfie',
  authMiddleware,
  rateLimit(60 * 1000, 3),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const { challengeId, selfieData } = req.body;

      if (!challengeId || !selfieData) {
        res.status(400).json({
          error: 'Challenge ID and selfie data are required',
        });
        return;
      }

      // Validate the challenge
      const challenge = pendingChallenges.get(challengeId);

      if (!challenge) {
        res.status(400).json({ error: 'Invalid or expired challenge' });
        return;
      }

      if (challenge.userId !== userId) {
        res.status(403).json({ error: 'This challenge belongs to another user' });
        return;
      }

      if (challenge.expiresAt < Date.now()) {
        pendingChallenges.delete(challengeId);
        res.status(400).json({ error: 'Challenge has expired. Request a new one.' });
        return;
      }

      // Clean up the challenge
      pendingChallenges.delete(challengeId);

      // Check if user already has a pending selfie check
      const pendingCheck = await prisma.identityCheck.findFirst({
        where: {
          userId,
          checkType: 'SELFIE',
          status: 'PENDING',
        },
      });

      if (pendingCheck) {
        res.status(400).json({
          error: 'You already have a pending selfie verification',
          checkId: pendingCheck.id,
        });
        return;
      }

      // Create the identity check
      const check = await prisma.identityCheck.create({
        data: {
          userId,
          checkType: 'SELFIE',
          status: 'PENDING',
          scoreAwarded: 0,
        },
      });

      // TODO: In production, process the selfie asynchronously:
      // 1. Verify it's a live camera feed (not a photo of a photo)
      // 2. Check the challenge was performed (e.g., head turn detected)
      // 3. Compare with any previous selfies for consistency
      // 4. Run anti-spoofing checks

      // For development, auto-approve
      if (process.env.NODE_ENV === 'development') {
        await prisma.identityCheck.update({
          where: { id: check.id },
          data: {
            status: 'PASSED',
            scoreAwarded: 25,
          },
        });
        await recalculateTrustScore(userId);
      }

      res.status(201).json({
        checkId: check.id,
        status: 'PENDING',
        message: 'Selfie submitted for verification. This may take a few moments.',
      });
    } catch (err) {
      console.error('Error processing selfie:', err);
      res.status(500).json({ error: 'Failed to process selfie verification' });
    }
  }
);

/**
 * GET /verification/trust-score
 * Get YOUR OWN trust score breakdown. This is PRIVATE - you can only see your own.
 */
router.get(
  '/trust-score',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user!.userId;

      const breakdown = await getTrustBreakdown(userId);

      // Get list of checks with their status
      const checks = await prisma.identityCheck.findMany({
        where: { userId },
        select: {
          checkType: true,
          status: true,
          scoreAwarded: true,
          checkedAt: true,
        },
        orderBy: { checkedAt: 'desc' },
      });

      res.json({
        trustScore: breakdown.total,
        isVerified: breakdown.isVerified,
        verifiedThreshold: 35,
        breakdown: {
          phone: { points: breakdown.phone, maxPoints: 10 },
          selfie: { points: breakdown.selfie, maxPoints: 25 },
          vouch: { points: breakdown.vouch, maxPoints: 45 },
          consistency: { points: breakdown.consistency, maxPoints: 20 },
          device: { points: breakdown.device, maxPoints: 10 },
          behavioral: { points: breakdown.behavioral, maxPoints: 10 },
        },
        checks: checks.map((c) => ({
          type: c.checkType,
          status: c.status,
          points: c.scoreAwarded,
          date: c.checkedAt,
        })),
      });
    } catch (err) {
      console.error('Error fetching trust score:', err);
      res.status(500).json({ error: 'Failed to fetch trust score' });
    }
  }
);

export default router;
