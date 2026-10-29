// src/store/useSettingsStore.ts
// Persists app-wide settings: company logo, PDF tolerance threshold.
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandStorage } from './storage';

export interface SettingsState {
  /** Base64-encoded company logo image (data URI without prefix), or null */
  logoBase64: string | null;
  /** Tolerance in metres for the ✓/⚠ indicator (default 0.02 = 2 cm) */
  toleranceM: number;

  // Actions
  setLogo: (base64: string | null) => void;
  setTolerance: (m: number) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      logoBase64: null,
      toleranceM: 0.02, // 2 cm default

      setLogo: (base64) => set({ logoBase64: base64 }),
      setTolerance: (m) => set({ toleranceM: m }),
    }),
    {
      name: 'fiche-reception-settings',
      storage: createJSONStorage(() => zustandStorage),
      version: 1,
      migrate: (persistedState: unknown, _version: number) =>
        persistedState as SettingsState,
      partialize: (state) => ({
        logoBase64: state.logoBase64,
        toleranceM: state.toleranceM,
      }),
    }
  )
);

