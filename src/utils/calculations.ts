// src/utils/calculations.ts
export const calculatePC = (alt: number, lectureArriere: number): number => {
  return alt + lectureArriere;
};

export const calculateCotePratique = (pc: number, lectureAvant: number): number => {
  return pc - lectureAvant;
};

export const calculateDifference = (coteProjet: number, cotePratique: number): number => {
  return coteProjet - cotePratique;
};