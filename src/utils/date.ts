// Local-time date helpers (avoid UTC shifts from toISOString()).

const pad = (n: number) => String(n).padStart(2, '0');

/** Returns YYYY-MM-DD for the given date in the device's local timezone. */
export function toLocalISODate(d: Date = new Date()): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Parses a YYYY-MM-DD string as a local date (not UTC). Returns null if invalid. */
export function parseLocalISODate(iso: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return isNaN(d.getTime()) ? null : d;
}

/** Formats YYYY-MM-DD as DD/MM/YYYY. Returns '' if empty/invalid. */
export function formatDateFR(iso: string): string {
  const d = parseLocalISODate(iso);
  return d ? `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}` : '';
}
