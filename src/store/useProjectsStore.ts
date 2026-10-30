// src/store/useProjectsStore.ts
// Manages the list of saved projects (multi-project architecture).
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { ProjectsState, SavedProject, ProjectStatus } from '../types';
import { zustandStorage } from './storage';
import { toLocalISODate } from '../utils/date';
import { DEFAULT_INSTITUTION } from '../utils/fichePdf';
import { DEFAULT_LOGO_ARRU, DEFAULT_LOGO_SOIT } from '../assets/defaultLogos';

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
          date: now,
          typeIntervention: '',
          institutionLines: [...DEFAULT_INSTITUTION],
          repere: '',
          alt: null,
          lectureArriere: null,
          pc: null,
          profiles: [],
          logoClient: DEFAULT_LOGO_ARRU,
          logoBureau: DEFAULT_LOGO_SOIT,
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

      saveOrUpdateProject: (data) => {
        const { activeProjectId, projects } = get();
        const targetId = data.id || activeProjectId;
        const now = toLocalISODate();

        if (targetId && projects.some((p) => p.id === targetId)) {
          // Update existing project
          const { id: _ignoreId, ...restData } = data;
          set((state) => ({
            projects: state.projects.map((p) =>
              p.id === targetId
                ? {
                    ...p,
                    ...restData,
                    id: p.id,
                    name: data.name || p.name,
                    updatedAt: now,
                  }
                : p
            ),
          }));
          return targetId;
        }

        // Create new saved project
        const newId = `proj-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        const fallbackName = data.receptionNumber
          ? `Chantier N° ${data.receptionNumber}`
          : `Chantier du ${now}`;
        const newProject: SavedProject = {
          id: newId,
          name: data.name || fallbackName,
          createdAt: now,
          updatedAt: now,
          status: 'En cours',
          receptionNumber: data.receptionNumber || '',
          vNumber: data.vNumber || '',
          date: data.date || now,
          typeIntervention: data.typeIntervention || '',
          institutionLines: data.institutionLines ?? [...DEFAULT_INSTITUTION],
          repere: data.repere || '',
          alt: data.alt ?? null,
          lectureArriere: data.lectureArriere ?? null,
          pc: data.pc ?? null,
          profiles: data.profiles || [],
          logoClient: data.logoClient ?? null,
          logoBureau: data.logoBureau ?? null,
        };

        set((state) => ({
          projects: [newProject, ...state.projects],
          activeProjectId: newId,
        }));
        return newId;
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
      version: 1, // saved projects: missing `institutionLines` is handled at load time
      migrate: (persistedState: unknown, _version: number) => persistedState as ProjectsState,
      partialize: (state) => ({
        projects: state.projects,
        activeProjectId: state.activeProjectId,
      }),
    }
  )
);
