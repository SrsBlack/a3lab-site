export type TrustCheckType =
  | 'phone'
  | 'selfie'
  | 'vouch'
  | 'consistency'
  | 'device'
  | 'behavioral';

export type TrustCheckStatus = 'pending' | 'passed' | 'failed';

export interface User {
  id: string;
  username: string;
  phoneHash: string;
  trustScore: number;
  /** true if trustScore >= 35 */
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IdentityCheck {
  id: string;
  userId: string;
  checkType: TrustCheckType;
  status: TrustCheckStatus;
  scoreAwarded: number;
  checkedAt: string;
}

export interface PublicProfile {
  id: string;
  username: string;
  /** Just the boolean — no score visible */
  isVerified: boolean;
  postCount: number;
  joinedAt: string;
}

export const TRUST_THRESHOLDS = {
  VERIFIED: 35,
  MODERATOR: 75,
  MAX: 100,
} as const;

export const TRUST_POINTS: Record<TrustCheckType, number> = {
  phone: 10,
  selfie: 25,
  vouch: 15,
  consistency: 1,
  device: 10,
  behavioral: 10,
} as const;
