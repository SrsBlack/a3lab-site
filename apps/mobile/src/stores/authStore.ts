import { create } from 'zustand';

export interface User {
  id: string;
  username: string;
  phone: string;
  isVerified: boolean;
  trustScore: number;
  createdAt: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  setToken: (token: string) => void;
  setUser: (user: User) => void;
  login: (token: string, user: User) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
  updateTrustScore: (score: number) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  isAuthenticated: false,
  isLoading: true,

  setToken: (token) => set({ token }),

  setUser: (user) => set({ user }),

  login: (token, user) =>
    set({
      token,
      user,
      isAuthenticated: true,
      isLoading: false,
    }),

  logout: () =>
    set({
      token: null,
      user: null,
      isAuthenticated: false,
      isLoading: false,
    }),

  setLoading: (isLoading) => set({ isLoading }),

  updateTrustScore: (score) =>
    set((state) => ({
      user: state.user ? { ...state.user, trustScore: score } : null,
    })),
}));
