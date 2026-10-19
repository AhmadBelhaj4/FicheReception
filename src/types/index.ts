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

  // Actions
  setHeader: (data: HeaderData) => void;
  setReference: (data: ReferenceData) => void;
  addProfile: (profile: ProfileData) => void;
  updateProfile: (id: string, data: Partial<ProfileData>) => void;
  deleteProfile: (id: string) => void;
  resetProject: () => void;
}