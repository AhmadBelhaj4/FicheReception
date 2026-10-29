// src/store/useProjectsStore.ts
// Manages the list of saved projects (multi-project architecture).
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { ProjectsState, SavedProject, ProjectStatus } from '../types';
import { zustandStorage } from './storage';
import { toLocalISODate } from '../utils/date';

export const useProjectsStore = create<ProjectsState>()(
  persist(
    (set, get) => ({
      projects: [],
      activeProjectId: null,

      createProject: (name: string) => {
        const id = `proj-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        const now = toLocalISODate();
        const newProject: SavedProject = {
          id,
          name,
          createdAt: now,
          updatedAt: now,
          status: 'En cours',
          receptionNumber: '',
          vNumber: '',
          pNumber: '',
          date: now,
          typeIntervention: '',
          repere: '',
          alt: null,
          lectureArriere: null,
          pc: null,
          profiles: [],
        };
        set((state) => ({
          projects: [newProject, ...state.projects],
          activeProjectId: id,
        }));
        return id;
      },

      openProject: (id: string) => {
        set({ activeProjectId: id });
      },

      saveActiveProject: (data) => {
        const { activeProjectId } = get();
        if (!activeProjectId) return;
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === activeProjectId
              ? { ...p, ...data, updatedAt: toLocalISODate() }
              : p
          ),
        }));
      },

      updateProjectStatus: (id: string, status: ProjectStatus) => {
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === id ? { ...p, status, updatedAt: toLocalISODate() } : p
          ),
        }));
      },

      deleteProject: (id: string) => {
        set((state) => ({
          projects: state.projects.filter((p) => p.id !== id),
          activeProjectId: state.activeProjectId === id ? null : state.activeProjectId,
        }));
      },

      archiveProject: (id: string) => {
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === id ? { ...p, status: 'Archivé' as ProjectStatus, updatedAt: toLocalISODate() } : p
          ),
        }));
      },
    }),
    {
      name: 'fiche-reception-projects',
      storage: createJSONStorage(() => zustandStorage),
      version: 1,
      migrate: (persistedState: unknown, _version: number) => persistedState as ProjectsState,
      partialize: (state) => ({
        projects: state.projects,
        activeProjectId: state.activeProjectId,
      }),
    }
  )
);
