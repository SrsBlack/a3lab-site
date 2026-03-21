import type { User } from './user';
import type { ContentType, CaptureMeta } from './post';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

export interface PaginatedResponse<T> extends ApiResponse<T> {
  pagination: {
    page: number;
    perPage: number;
    total: number;
    hasMore: boolean;
  };
}

export interface AuthResponse {
  token: string;
  user: User;
  isNewUser: boolean;
}

export interface CreatePostRequest {
  contentType: ContentType;
  textBody?: string;
  media?: Blob;
  integrityHash: string;
  captureMeta: CaptureMeta;
}

export interface LivenessChallenge {
  challengeId: string;
  /** e.g. "hold up 3 fingers" */
  prompt: string;
  expiresAt: string;
}

export interface LivenessResponse {
  challengeId: string;
  /** base64-encoded selfie */
  selfieData: string;
  deviceFingerprint: string;
}
