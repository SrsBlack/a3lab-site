import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

const SETTINGS_KEY = 'proof_settings';

interface Settings {
  notifyReactions: boolean;
  notifyVouches: boolean;
  notifyModeration: boolean;
}

interface SettingsState {
  settings: Settings;
  isLoading: boolean;

  loadSettings: () => Promise<void>;
  updateSetting: (key: keyof Settings, value: boolean) => void;
  setLoading: (loading: boolean) => void;
}

const defaultSettings: Settings = {
  notifyReactions: true,
  notifyVouches: true,
  notifyModeration: true,
};

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: defaultSettings,
  isLoading: false,

  loadSettings: async () => {
    try {
      const stored = await SecureStore.getItemAsync(SETTINGS_KEY);
      if (stored) {
        set({ settings: { ...defaultSettings, ...JSON.parse(stored) } });
      }
    } catch {
      // Use defaults
    }
  },

  updateSetting: (key, value) => {
    const newSettings = { ...get().settings, [key]: value };
    set({ settings: newSettings });
    SecureStore.setItemAsync(SETTINGS_KEY, JSON.stringify(newSettings)).catch(() => {});
  },

  setLoading: (isLoading) => set({ isLoading }),
}));
