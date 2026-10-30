// src/store/useProjectStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { ProjectState, ProfileData } from '../types';
import { zustandStorage } from './storage';
import { toLocalISODate } from '../utils/date';
import { DEFAULT_INSTITUTION } from '../utils/fichePdf';
import { DEFAULT_LOGO_ARRU, DEFAULT_LOGO_SOIT } from '../assets/defaultLogos';

const createInitialState = () => ({
  receptionNumber: '',
  vNumber: '',
  date: toLocalISODate(),
  typeIntervention: '',
  institutionLines: [...DEFAULT_INSTITUTION] as [string, string, string, string],
  repere: '',
  alt: null as number | null,
  lectureArriere: null as number | null,
  pc: null as number | null,
  profiles: [] as ProfileData[],
  logoClient: DEFAULT_LOGO_ARRU as string | null,
  logoBureau: DEFAULT_LOGO_SOIT as string | null,
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
          const newId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
          const clone: ProfileData = {
            ...source,
            id: newId,
            observation: source.observation,
          };
          const idx = state.profiles.findIndex((p) => p.id === id);
          const newProfiles = [...state.profiles];
          newProfiles.splice(idx + 1, 0, clone);
          return { profiles: newProfiles };
        }),

      setLogos: (logos) =>
        set((state) => ({ ...state, ...logos })),

      resetProject: () => set(createInitialState()),
    }),
    {
      name: 'fiche-reception-project',
      storage: createJSONStorage(() => zustandStorage),
      version: 2,
      // v2: `pNumber` removed (page numbers are automatic), `institutionLines` added,
      // original ENNOUR logos pre-filled when none was chosen.
      migrate: (persistedState: unknown, _version: number) => {
        const { pNumber: _drop, ...rest } = (persistedState ?? {}) as Record<string, unknown>;
        return {
          ...rest,
          institutionLines: Array.isArray(rest.institutionLines)
            ? rest.institutionLines
            : [...DEFAULT_INSTITUTION],
          logoClient: rest.logoClient ?? DEFAULT_LOGO_ARRU,
          logoBureau: rest.logoBureau ?? DEFAULT_LOGO_SOIT,
        } as unknown as ProjectState;
      },
      partialize: (state) => ({
        receptionNumber: state.receptionNumber,
        vNumber: state.vNumber,
        date: state.date,
        typeIntervention: state.typeIntervention,
        institutionLines: state.institutionLines,
        repere: state.repere,
        alt: state.alt,
        lectureArriere: state.lectureArriere,
        pc: state.pc,
        profiles: state.profiles,
        logoClient: state.logoClient,
        logoBureau: state.logoBureau,
      }),
    }
  )
);
