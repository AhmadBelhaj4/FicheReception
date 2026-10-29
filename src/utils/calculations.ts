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
// ─── Rounding, tolerance & sanity checks ─────────────────────────────────────

/** Default acceptance tolerance on the Z difference, in metres (±2 cm). */
export const DEFAULT_TOLERANCE_M = 0.02;

/** Rounds to millimetres (3 decimals), as given by optical/digital levels. */
export const roundMm = (value: number): number => Math.round(value * 1000) / 1000;

export type Conformity = 'ok' | 'out';

/** A point conforms when |difference| ≤ tolerance (compared in whole mm to avoid float noise). */
export const getConformity = (
  difference: number,
  tolerance: number = DEFAULT_TOLERANCE_M
): Conformity =>
  Math.round(Math.abs(difference) * 1000) <= Math.round(tolerance * 1000) ? 'ok' : 'out';

/** Staff readings are normally between 0 and 5 m; flag anything outside that. */
export const MAX_PLAUSIBLE_READING_M = 5;
/** Flag a Z difference larger than this: very likely a typing error. */
export const MAX_PLAUSIBLE_DIFFERENCE_M = 0.5;

/** Returns a French warning for a suspicious staff reading, or null. */
export const checkReading = (reading: number | null): string | null => {
  if (reading === null) return null;
  if (reading < 0) return 'Lecture négative : vérifiez la saisie.';
  if (reading > MAX_PLAUSIBLE_READING_M)
    return `Lecture > ${MAX_PLAUSIBLE_READING_M} m : virgule mal placée ?`;
  return null;
};

/** Returns a French warning when a difference is implausibly large, or null. */
export const checkDifference = (difference: number | null): string | null => {
  if (difference === null) return null;
  if (Math.abs(difference) > MAX_PLAUSIBLE_DIFFERENCE_M)
    return `Écart de ${Math.abs(difference).toFixed(3)} m (> ${MAX_PLAUSIBLE_DIFFERENCE_M} m) : vérifiez lectures et cote projet.`;
  return null;
};
