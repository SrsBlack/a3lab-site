export type ContentType = 'photo' | 'video' | 'text';

export type ReactionType = 'felt_that' | 'respect' | 'real_one';

export interface CaptureMeta {
  gpsLat?: number;
  gpsLng?: number;
  timestamp: string;
  deviceId: string;
  accelerometer?: { x: number; y: number; z: number };
  ambientLight?: number;
  signature: string;
}

export interface Post {
  id: string;
  authorId: string;
  contentType: ContentType;
  textBody?: string;
  mediaUrl?: string;
  integrityHash: string;
  captureMeta: CaptureMeta;
  /** 0.0 = human */
  aiScore: number;
  isAuthentic: boolean;
  createdAt: string;
}

export interface Reaction {
  id: string;
  postId: string;
  userId: string;
  reactionType: ReactionType;
  createdAt: string;
}

export type FlagReason =
  | 'ai_content'
  | 'edited'
  | 'fake'
  | 'spam'
  | 'commercial';

export interface Flag {
  id: string;
  postId: string;
  reporterId: string;
  reason: FlagReason;
  status: string;
  reviewedBy?: string;
  createdAt: string;
}

export const FEED_RULES = {
  MAX_FOLLOWING: 150,
  POSTS_PER_PAGE: 20,
  NO_LINKS: true,
  NO_HASHTAGS: true,
  NO_RESHARES: true,
} as const;
