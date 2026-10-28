// src/store/useProjectStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { ProjectState } from '../types';
import { zustandStorage } from './storage';

const initialState = {
  receptionNumber: '',
  vNumber: '',
  pNumber: '',
  date: new Date().toISOString().split('T')[0],
  typeIntervention: '',
  repere: '',
  alt: null as number | null,
  lectureArriere: null as number | null,
  pc: null as number | null,
  profiles: [] as ProjectState['profiles'],
};

export const useProjectStore = create<ProjectState>()(
  persist(
    (set) => ({
      ...initialState,

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

      resetProject: () => set(initialState),
    }),
    {
      name: 'fiche-reception-project',
      storage: createJSONStorage(() => zustandStorage),
      version: 1,
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
