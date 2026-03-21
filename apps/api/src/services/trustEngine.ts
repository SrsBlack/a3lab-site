import { prisma } from '../db';
import { config } from '../config';

/**
 * Trust score point values for each identity check type.
 * Maximum possible score: 10 + 25 + 45 + 20 + 10 + 10 = 120
 */
export const TRUST_POINTS = {
  PHONE: 10,
  SELFIE: 25,
  VOUCH: 15,       // max 3 vouches received = 45 total
  CONSISTENCY: 1,  // 1 per week, max 20
  DEVICE: 10,
  BEHAVIORAL: 10,
} as const;

export const TRUST_CAPS = {
  VOUCH: 45,        // 3 vouches * 15 points
  CONSISTENCY: 20,  // 20 weeks
} as const;

/**
 * Calculate the total trust score for a user based on their passed identity checks.
 */
export async function calculateTrustScore(userId: string): Promise<number> {
  const checks = await prisma.identityCheck.findMany({
    where: {
      userId,
      status: 'PASSED',
    },
  });

  let score = 0;
  let vouchPoints = 0;
  let consistencyPoints = 0;

  for (const check of checks) {
    switch (check.checkType) {
      case 'PHONE':
        score += TRUST_POINTS.PHONE;
        break;
      case 'SELFIE':
        score += TRUST_POINTS.SELFIE;
        break;
      case 'VOUCH':
        vouchPoints += TRUST_POINTS.VOUCH;
        if (vouchPoints > TRUST_CAPS.VOUCH) vouchPoints = TRUST_CAPS.VOUCH;
        break;
      case 'CONSISTENCY':
        consistencyPoints += TRUST_POINTS.CONSISTENCY;
        if (consistencyPoints > TRUST_CAPS.CONSISTENCY) consistencyPoints = TRUST_CAPS.CONSISTENCY;
        break;
      case 'DEVICE':
        score += TRUST_POINTS.DEVICE;
        break;
      case 'BEHAVIORAL':
        score += TRUST_POINTS.BEHAVIORAL;
        break;
    }
  }

  score += vouchPoints + consistencyPoints;

  return score;
}

/**
 * Recalculate and persist the trust score for a user.
 * Also updates their verification status.
 */
export async function recalculateTrustScore(userId: string): Promise<number> {
  const score = await calculateTrustScore(userId);

  await prisma.user.update({
    where: { id: userId },
    data: {
      trustScore: score,
      isVerified: score >= config.verifiedThreshold,
    },
  });

  return score;
}

/**
 * Update verification status based on current trust score.
 */
export async function updateVerificationStatus(userId: string): Promise<boolean> {
  const score = await calculateTrustScore(userId);
  const isVerified = score >= config.verifiedThreshold;

  await prisma.user.update({
    where: { id: userId },
    data: {
      trustScore: score,
      isVerified,
    },
  });

  return isVerified;
}

/**
 * Get a detailed breakdown of trust score components for a user.
 */
export async function getTrustBreakdown(userId: string): Promise<{
  total: number;
  phone: number;
  selfie: number;
  vouch: number;
  consistency: number;
  device: number;
  behavioral: number;
  isVerified: boolean;
}> {
  const checks = await prisma.identityCheck.findMany({
    where: {
      userId,
      status: 'PASSED',
    },
  });

  let phone = 0;
  let selfie = 0;
  let vouch = 0;
  let consistency = 0;
  let device = 0;
  let behavioral = 0;

  for (const check of checks) {
    switch (check.checkType) {
      case 'PHONE':
        phone = TRUST_POINTS.PHONE;
        break;
      case 'SELFIE':
        selfie = TRUST_POINTS.SELFIE;
        break;
      case 'VOUCH':
        vouch += TRUST_POINTS.VOUCH;
        if (vouch > TRUST_CAPS.VOUCH) vouch = TRUST_CAPS.VOUCH;
        break;
      case 'CONSISTENCY':
        consistency += TRUST_POINTS.CONSISTENCY;
        if (consistency > TRUST_CAPS.CONSISTENCY) consistency = TRUST_CAPS.CONSISTENCY;
        break;
      case 'DEVICE':
        device = TRUST_POINTS.DEVICE;
        break;
      case 'BEHAVIORAL':
        behavioral = TRUST_POINTS.BEHAVIORAL;
        break;
    }
  }

  const total = phone + selfie + vouch + consistency + device + behavioral;

  return {
    total,
    phone,
    selfie,
    vouch,
    consistency,
    device,
    behavioral,
    isVerified: total >= config.verifiedThreshold,
  };
}
