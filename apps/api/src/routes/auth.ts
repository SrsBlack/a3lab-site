import { Router, Response } from 'express';
import bcrypt from 'bcrypt';
import { prisma } from '../db';
import { AuthenticatedRequest, authMiddleware, generateToken } from '../middleware/auth';
import { rateLimit } from '../middleware/rateLimit';
import { recalculateTrustScore } from '../services/trustEngine';
import { sendVerificationCode } from '../services/sms';

const router = Router();

// In-memory verification code store (replace with Redis + real SMS in production)
const pendingCodes = new Map<string, { code: string; expiresAt: number }>();

/**
 * POST /auth/request-code
 * Send an SMS verification code to a phone number.
 */
router.post(
  '/request-code',
  rateLimit(60 * 1000, 5), // 5 requests per minute
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { phoneNumber } = req.body;

      if (!phoneNumber || typeof phoneNumber !== 'string') {
        res.status(400).json({ error: 'Phone number is required' });
        return;
      }

      // Generate a 6-digit code
      const code = Math.floor(100000 + Math.random() * 900000).toString();

      // Hash the phone number for storage (we never store raw phone numbers)
      const phoneHash = await bcrypt.hash(phoneNumber, 10);

      // Store the pending verification
      pendingCodes.set(phoneHash, {
        code,
        expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
      });

      // Send SMS via Twilio (or log in dev mode)
      const smsResult = await sendVerificationCode(phoneNumber, code);
      if (!smsResult.success) {
        console.error('SMS delivery failed for', phoneNumber);
        // Still proceed in development — code was logged by stub
      }

      res.json({
        message: 'Verification code sent',
        phoneHash, // Client needs this to verify
        // DEV ONLY - remove in production:
        ...(process.env.NODE_ENV === 'development' && { devCode: code }),
      });
    } catch (err) {
      console.error('Error requesting code:', err);
      res.status(500).json({ error: 'Failed to send verification code' });
    }
  }
);

/**
 * POST /auth/verify-code
 * Verify the SMS code. Creates a new user if first time, returns JWT.
 */
router.post(
  '/verify-code',
  rateLimit(60 * 1000, 10),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { phoneHash, code, username, deviceFingerprint } = req.body;

      if (!phoneHash || !code) {
        res.status(400).json({ error: 'Phone hash and code are required' });
        return;
      }

      // Check the pending code
      const pending = pendingCodes.get(phoneHash);

      if (!pending) {
        res.status(400).json({ error: 'No pending verification for this phone' });
        return;
      }

      if (pending.expiresAt < Date.now()) {
        pendingCodes.delete(phoneHash);
        res.status(400).json({ error: 'Verification code expired' });
        return;
      }

      if (pending.code !== code) {
        res.status(400).json({ error: 'Invalid verification code' });
        return;
      }

      // Code is valid, clean up
      pendingCodes.delete(phoneHash);

      // Check if user already exists with this phone hash
      let user = await prisma.user.findFirst({
        where: { phoneHash },
      });

      if (!user) {
        // New user - username is required
        if (!username || typeof username !== 'string') {
          res.status(400).json({ error: 'Username is required for new users' });
          return;
        }

        if (username.length > 30) {
          res.status(400).json({ error: 'Username must be 30 characters or fewer' });
          return;
        }

        if (!/^[a-zA-Z0-9_]+$/.test(username)) {
          res.status(400).json({ error: 'Username can only contain letters, numbers, and underscores' });
          return;
        }

        // Check username uniqueness
        const existingUsername = await prisma.user.findUnique({
          where: { username },
        });

        if (existingUsername) {
          res.status(409).json({ error: 'Username is already taken' });
          return;
        }

        // Create the user
        user = await prisma.user.create({
          data: {
            username,
            phoneHash,
            deviceFingerprint: deviceFingerprint || null,
          },
        });

        // Create the phone identity check (passed since we verified the code)
        await prisma.identityCheck.create({
          data: {
            userId: user.id,
            checkType: 'PHONE',
            status: 'PASSED',
            scoreAwarded: 10,
          },
        });

        // Recalculate trust score
        await recalculateTrustScore(user.id);

        // If device fingerprint provided, create device check
        if (deviceFingerprint) {
          await prisma.identityCheck.create({
            data: {
              userId: user.id,
              checkType: 'DEVICE',
              status: 'PASSED',
              scoreAwarded: 10,
            },
          });
          await recalculateTrustScore(user.id);
        }
      }

      const token = generateToken({
        userId: user.id,
        username: user.username,
      });

      res.json({
        token,
        user: {
          id: user.id,
          username: user.username,
          isVerified: user.isVerified,
        },
      });
    } catch (err) {
      console.error('Error verifying code:', err);
      res.status(500).json({ error: 'Verification failed' });
    }
  }
);

/**
 * POST /auth/liveness-check
 * Submit the result of a selfie liveness challenge.
 */
router.post(
  '/liveness-check',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const { challengeId, selfieData, challengeResponse } = req.body;

      if (!challengeId || !selfieData) {
        res.status(400).json({ error: 'Challenge ID and selfie data are required' });
        return;
      }

      // TODO: Implement actual liveness detection
      // - Compare selfie with challenge requirements (turn head, blink, etc.)
      // - Verify it's a live camera feed, not a photo of a photo
      // - Use ML model for face liveness detection

      // For now, create a pending selfie identity check
      const check = await prisma.identityCheck.create({
        data: {
          userId,
          checkType: 'SELFIE',
          status: 'PENDING',
          scoreAwarded: 0,
        },
      });

      // Simulate processing (in production, this would be async)
      // Mark as passed for development
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

      res.json({
        checkId: check.id,
        status: 'PENDING',
        message: 'Liveness check submitted for processing',
      });
    } catch (err) {
      console.error('Error in liveness check:', err);
      res.status(500).json({ error: 'Liveness check failed' });
    }
  }
);

/**
 * POST /auth/otp/request
 * Alias for /auth/request-code (mobile client compatibility).
 */
router.post(
  '/otp/request',
  rateLimit(60 * 1000, 5),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    // Normalize field name: mobile sends "phone", backend expects "phoneNumber"
    req.body.phoneNumber = req.body.phoneNumber || req.body.phone;
    // Forward to the request-code handler by re-dispatching
    const { phoneNumber } = req.body;

    if (!phoneNumber || typeof phoneNumber !== 'string') {
      res.status(400).json({ error: 'Phone number is required' });
      return;
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const phoneHash = await bcrypt.hash(phoneNumber, 10);

    pendingCodes.set(phoneHash, {
      code,
      expiresAt: Date.now() + 10 * 60 * 1000,
    });

    const smsResult = await sendVerificationCode(phoneNumber, code);
    if (!smsResult.success) {
      console.error('SMS delivery failed for', phoneNumber);
    }

    res.json({
      message: 'Verification code sent',
      phoneHash,
      ...(process.env.NODE_ENV === 'development' && { devCode: code }),
    });
  }
);

/**
 * POST /auth/otp/verify
 * Alias for /auth/verify-code (mobile client compatibility).
 */
router.post(
  '/otp/verify',
  rateLimit(60 * 1000, 10),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    // Normalize field names from mobile client
    req.body.phoneHash = req.body.phoneHash || req.body.phone;
    const { phoneHash, code, username, deviceFingerprint } = req.body;

    if (!phoneHash || !code) {
      res.status(400).json({ error: 'Phone hash and code are required' });
      return;
    }

    const pending = pendingCodes.get(phoneHash);

    if (!pending) {
      res.status(400).json({ error: 'No pending verification for this phone' });
      return;
    }

    if (pending.expiresAt < Date.now()) {
      pendingCodes.delete(phoneHash);
      res.status(400).json({ error: 'Verification code expired' });
      return;
    }

    if (pending.code !== code) {
      res.status(400).json({ error: 'Invalid verification code' });
      return;
    }

    pendingCodes.delete(phoneHash);

    let user = await prisma.user.findFirst({
      where: { phoneHash },
    });

    if (!user) {
      if (!username || typeof username !== 'string') {
        res.status(400).json({ error: 'Username is required for new users' });
        return;
      }

      if (username.length > 30) {
        res.status(400).json({ error: 'Username must be 30 characters or fewer' });
        return;
      }

      if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        res.status(400).json({ error: 'Username can only contain letters, numbers, and underscores' });
        return;
      }

      const existingUsername = await prisma.user.findUnique({
        where: { username },
      });

      if (existingUsername) {
        res.status(409).json({ error: 'Username is already taken' });
        return;
      }

      user = await prisma.user.create({
        data: {
          username,
          phoneHash,
          deviceFingerprint: deviceFingerprint || null,
        },
      });

      await prisma.identityCheck.create({
        data: {
          userId: user.id,
          checkType: 'PHONE',
          status: 'PASSED',
          scoreAwarded: 10,
        },
      });

      await recalculateTrustScore(user.id);

      if (deviceFingerprint) {
        await prisma.identityCheck.create({
          data: {
            userId: user.id,
            checkType: 'DEVICE',
            status: 'PASSED',
            scoreAwarded: 10,
          },
        });
        await recalculateTrustScore(user.id);
      }
    }

    const token = generateToken({
      userId: user.id,
      username: user.username,
    });

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        isVerified: user.isVerified,
      },
    });
  }
);

/**
 * POST /auth/liveness
 * Alias for /auth/liveness-check (mobile client compatibility).
 */
router.post(
  '/liveness',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.user!.userId;
    const { selfie, challengeId, selfieData } = req.body;
    const selfiePayload = selfie || selfieData;

    if (!selfiePayload) {
      res.status(400).json({ error: 'Selfie data is required' });
      return;
    }

    const check = await prisma.identityCheck.create({
      data: {
        userId,
        checkType: 'SELFIE',
        status: 'PENDING',
        scoreAwarded: 0,
      },
    });

    if (process.env.NODE_ENV === 'development') {
      await prisma.identityCheck.update({
        where: { id: check.id },
        data: { status: 'PASSED', scoreAwarded: 25 },
      });
      await recalculateTrustScore(userId);
    }

    res.json({
      checkId: check.id,
      status: 'PENDING',
      message: 'Liveness check submitted for processing',
    });
  }
);

/**
 * GET /auth/me
 * Get the authenticated user's profile.
 */
router.get(
  '/me',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user!.userId;

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          username: true,
          displayName: true,
          bio: true,
          avatarUrl: true,
          isVerified: true,
          trustScore: true,
          createdAt: true,
          _count: {
            select: {
              posts: true,
              followers: true,
              following: true,
              vouchesReceived: true,
            },
          },
        },
      });

      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      res.json({
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        bio: user.bio,
        avatarUrl: user.avatarUrl,
        isVerified: user.isVerified,
        trustScore: user.trustScore,
        createdAt: user.createdAt,
        postCount: user._count.posts,
        followerCount: user._count.followers,
        followingCount: user._count.following,
        vouchCount: user._count.vouchesReceived,
      });
    } catch (err) {
      console.error('Error fetching user:', err);
      res.status(500).json({ error: 'Failed to fetch user' });
    }
  }
);

export default router;
