// src/store/useProjectStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { ProjectState } from '../types';
import { zustandStorage } from './storage';
import { toLocalISODate } from '../utils/date';

const createInitialState = () => ({
  receptionNumber: '',
  vNumber: '',
  pNumber: '',
  date: toLocalISODate(),
  typeIntervention: '',
  repere: '',
  alt: null as number | null,
  lectureArriere: null as number | null,
  pc: null as number | null,
  profiles: [] as ProjectState['profiles'],
});

export const useProjectStore = create<ProjectState>()(
  persist(
    (set) => ({
      ...createInitialState(),

      setHeader: (data) => set((state) => ({ ...state, ...data })),

      setReference: (data) =>
        set((state) => {
          const newAlt = data.alt !== undefined ? data.alt : state.alt;
          const newLec =
            data.lectureArriere !== undefined
              ? data.lectureArriere
              : state.lectureArriere;
          // Auto-calculate PC when Alt or Lecture Arrière changes
          const newPc =
            newAlt !== null && newLec !== null ? newAlt + newLec : null;
          return { ...state, ...data, alt: newAlt, lectureArriere: newLec, pc: newPc };
        }),

      addProfile: (profile) =>
        set((state) => ({
          profiles: [...state.profiles, profile],
        })),

      updateProfile: (id, data) =>
        set((state) => ({
          profiles: state.profiles.map((p) =>
            p.id === id ? { ...p, ...data } : p
          ),
        })),

      deleteProfile: (id) =>
        set((state) => ({
          profiles: state.profiles.filter((p) => p.id !== id),
        })),

      duplicateProfile: (id) =>
        set((state) => {
          const source = state.profiles.find((p) => p.id === id);
          if (!source) return state;
          // Generate a new UUID-like id using Math.random (expo-crypto not available in store context)
          const newId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
          const clone: import('../types').ProfileData = {
            ...source,
            id: newId,
            observation: source.observation,
          };
          // Insert clone right after the source profile
          const idx = state.profiles.findIndex((p) => p.id === id);
          const newProfiles = [...state.profiles];
          newProfiles.splice(idx + 1, 0, clone);
          return { profiles: newProfiles };
        }),

      resetProject: () => set(createInitialState()),
    }),
    {
      name: 'fiche-reception-project',
      storage: createJSONStorage(() => zustandStorage),
      version: 1,
      // Bump `version` and handle older shapes here whenever the schema changes.
      migrate: (persistedState: unknown, _version: number) => persistedState as ProjectState,
      // Only persist data fields, not action functions
      partialize: (state) => ({
        receptionNumber: state.receptionNumber,
        vNumber: state.vNumber,
        pNumber: state.pNumber,
        date: state.date,
        typeIntervention: state.typeIntervention,
        repere: state.repere,
        alt: state.alt,
        lectureArriere: state.lectureArriere,
        pc: state.pc,
        profiles: state.profiles,
      }),
    }
  )
);
