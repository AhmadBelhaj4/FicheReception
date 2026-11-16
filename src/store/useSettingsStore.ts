// src/store/useSettingsStore.ts
// Persists app-wide settings: theme, company logo, PDF tolerance threshold.
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandStorage } from './storage';
import { DEFAULT_LOGO_SAMED } from '../assets/defaultLogos';

export type AppTheme = 'system' | 'light' | 'dark';

export interface SettingsState {
  /** Theme preference: 'system' | 'light' | 'dark' */
  theme: AppTheme;
  /** Base64-encoded company logo image (data URI without prefix), or null */
  logoBase64: string | null;
  /** Tolerance in metres for the ✓/⚠ indicator (default 0.02 = 2 cm) */
  toleranceM: number;

  // Actions
  setTheme: (theme: AppTheme) => void;
  setLogo: (base64: string | null) => void;
  setTolerance: (m: number) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: 'system',
      logoBase64: DEFAULT_LOGO_SAMED,
      toleranceM: 0.02, // 2 cm default

      setTheme: (theme) => set({ theme }),
      setLogo: (base64) => set({ logoBase64: base64 }),
      setTolerance: (m) => set({ toleranceM: m }),
    }),
    {
      name: 'fiche-reception-settings',
      storage: createJSONStorage(() => zustandStorage),
      version: 3, // v3: theme support ('system' | 'light' | 'dark')
      migrate: (persistedState: unknown, _version: number) => {
        const s = (persistedState ?? {}) as Partial<SettingsState>;
        return {
          ...s,
          theme: s.theme ?? 'system',
          logoBase64: s.logoBase64 ?? DEFAULT_LOGO_SAMED,
          toleranceM: s.toleranceM ?? 0.02,
        } as SettingsState;
      },
      partialize: (state) => ({
        theme: state.theme,
        logoBase64: state.logoBase64,
        toleranceM: state.toleranceM,
      }),
    }
  )
);
