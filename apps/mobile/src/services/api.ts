import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '../stores/authStore';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://api.proof.social';

const client: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach auth token to every request
client.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = useAuthStore.getState().token;
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 globally — force logout
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  }
);

// ─── Auth ─────────────────────────────────────────────

export const authAPI = {
  requestOTP: (phone: string) =>
    client.post('/auth/otp/request', { phone }),

  verifyOTP: (phone: string, code: string) =>
    client.post<{ token: string; user: any }>('/auth/otp/verify', { phone, code }),

  submitLiveness: (selfieData: string) =>
    client.post('/auth/liveness', { selfie: selfieData }),

  getMe: () =>
    client.get('/auth/me'),
};

// ─── Feed ─────────────────────────────────────────────

export const feedAPI = {
  getFeed: (cursor?: string, limit: number = 20) =>
    client.get('/feed', { params: { cursor, limit } }),

  getPost: (postId: string) =>
    client.get(`/posts/${postId}`),
};

// ─── Posts ────────────────────────────────────────────

export interface CreatePostPayload {
  contentType: 'photo' | 'video' | 'text';
  media?: string; // base64 or presigned upload reference
  textContent?: string;
  caption?: string;
  integrityHash: string;
  captureMeta: Record<string, any>;
  signature: string;
}

export const postsAPI = {
  create: (payload: CreatePostPayload) =>
    client.post('/posts', payload),

  delete: (postId: string) =>
    client.delete(`/posts/${postId}`),

  getUserPosts: (userId: string, cursor?: string) =>
    client.get(`/users/${userId}/posts`, { params: { cursor } }),
};

// ─── Reactions ────────────────────────────────────────

export const reactionsAPI = {
  react: (postId: string, type: 'felt_that' | 'respect' | 'real_one') =>
    client.post(`/posts/${postId}/reactions`, { type }),

  unreact: (postId: string, type: string) =>
    client.delete(`/posts/${postId}/reactions/${type}`),
};

// ─── Trust ────────────────────────────────────────────

export const trustAPI = {
  getScore: () =>
    client.get('/trust/score'),

  getBreakdown: () =>
    client.get<{
      score: number;
      checks: Array<{ name: string; passed: boolean; weight: number }>;
    }>('/trust/breakdown'),

  submitSelfieChallenge: (selfieData: string) =>
    client.post('/trust/selfie-challenge', { selfie: selfieData }),

  requestVouch: (friendPhone: string) =>
    client.post('/trust/vouch/request', { phone: friendPhone }),

  getModerationQueue: () =>
    client.get('/moderation/queue'),

  submitModeration: (postId: string, decision: 'approve' | 'remove') =>
    client.post(`/moderation/${postId}`, { decision }),
};

// ─── Social ───────────────────────────────────────────

export const socialAPI = {
  follow: (userId: string) =>
    client.post(`/users/${userId}/follow`),

  unfollow: (userId: string) =>
    client.delete(`/users/${userId}/follow`),

  getProfile: (userId: string) =>
    client.get(`/users/${userId}`),

  flag: (postId: string, reason: string) =>
    client.post(`/posts/${postId}/flag`, { reason }),
};

export default client;
