// src/store/useProjectStore.ts
import { create } from 'zustand';
import { ProjectState } from '../types';

const initialState = {
  receptionNumber: '',
  vNumber: '',
  pNumber: '',
  date: new Date().toISOString().split('T')[0],
  typeIntervention: '',
  repere: '',
  alt: null,
  lectureArriere: null,
  pc: null,
  profiles: [],
};

export const useProjectStore = create<ProjectState>((set) => ({
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
}));