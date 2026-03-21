import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

export interface User {
  id: string;
  username: string;
  phone: string;
  isVerified: boolean;
  trustScore: number;
  createdAt: string;
}

const TOKEN_KEY = 'proof_auth_token';
const USER_KEY = 'proof_auth_user';

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
  restoreSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  isAuthenticated: false,
  isLoading: true,

  setToken: (token) => set({ token }),

  setUser: (user) => set({ user }),

  login: (token, user) => {
    // Persist to secure storage
    SecureStore.setItemAsync(TOKEN_KEY, token).catch(() => {});
    SecureStore.setItemAsync(USER_KEY, JSON.stringify(user)).catch(() => {});

    set({
      token,
      user,
      isAuthenticated: true,
      isLoading: false,
    });
  },

  logout: () => {
    // Clear secure storage
    SecureStore.deleteItemAsync(TOKEN_KEY).catch(() => {});
    SecureStore.deleteItemAsync(USER_KEY).catch(() => {});

    set({
      token: null,
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
  },

  setLoading: (isLoading) => set({ isLoading }),

  updateTrustScore: (score) =>
    set((state) => {
      const updatedUser = state.user ? { ...state.user, trustScore: score } : null;
      if (updatedUser) {
        SecureStore.setItemAsync(USER_KEY, JSON.stringify(updatedUser)).catch(() => {});
      }
      return { user: updatedUser };
    }),

  restoreSession: async () => {
    try {
      const [token, userJson] = await Promise.all([
        SecureStore.getItemAsync(TOKEN_KEY),
        SecureStore.getItemAsync(USER_KEY),
      ]);

      if (token && userJson) {
        const user = JSON.parse(userJson) as User;
        set({ token, user, isAuthenticated: true, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch {
      set({ isLoading: false });
    }
  },
}));
