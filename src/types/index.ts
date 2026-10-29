// src/types/index.ts
export interface ProfileData {
  id: string;
  d1: number | null;
  d2: number | null;
  axe: number | null;
  g1: number | null;
  g2: number | null;
  coteProjet: number | null;
  distance: number | null;
  devers: number | null;
  observation: string;
}

export type HeaderData = Partial<
  Pick<ProjectState, 'receptionNumber' | 'vNumber' | 'pNumber' | 'date' | 'typeIntervention'>
>;

export type ReferenceData = Partial<
  Pick<ProjectState, 'repere' | 'alt' | 'lectureArriere'>
>;

export interface ProjectState {
  // Step 1: Header
  receptionNumber: string;
  vNumber: string;
  pNumber: string;
  date: string;
  typeIntervention: string;

  // Step 2: Reference
  repere: string;
  alt: number | null;
  lectureArriere: number | null;
  pc: number | null; // Calculated

  // Step 3: Profiles
  profiles: ProfileData[];

  // Step 4: Signatures (base64 PNG strings, null = not signed)
  signatureEntreprise: string | null;
  signatureBureau: string | null;
  signatureClient: string | null;

  // Actions
  setHeader: (data: HeaderData) => void;
  setReference: (data: ReferenceData) => void;
  addProfile: (profile: ProfileData) => void;
  updateProfile: (id: string, data: Partial<ProfileData>) => void;
  deleteProfile: (id: string) => void;
  duplicateProfile: (id: string) => void;
  setSignature: (party: 'entreprise' | 'bureau' | 'client', base64: string | null) => void;
  resetProject: () => void;
}

// ── Multi-project types ──────────────────────────────────────────────────────

export type ProjectStatus = 'En cours' | 'Validé' | 'Archivé';

/** A saved project record stored in the project list. */
export interface SavedProject {
  id: string;
  name: string;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  status: ProjectStatus;
  // All the survey data fields (mirrors the persisted slice of ProjectState)
  receptionNumber: string;
  vNumber: string;
  pNumber: string;
  date: string;
  typeIntervention: string;
  repere: string;
  alt: number | null;
  lectureArriere: number | null;
  pc: number | null;
  profiles: ProfileData[];
}

export interface ProjectsState {
  projects: SavedProject[];
  activeProjectId: string | null;

  // Actions
  createProject: (name: string) => string; // returns new id
  openProject: (id: string) => void;
  saveActiveProject: (data: Partial<Omit<SavedProject, 'id' | 'createdAt'>>) => void;
  updateProjectStatus: (id: string, status: ProjectStatus) => void;
  deleteProject: (id: string) => void;
  archiveProject: (id: string) => void;
}
