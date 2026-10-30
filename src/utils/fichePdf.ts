// src/utils/fichePdf.ts
//
// Pixel-faithful HTML template of the official "FICHE DE RÉCEPTION TOPOGRAPHIQUE"
// (A4 portrait, 5 profiles per page, header repeated on every page).
//
// Every coordinate below was measured on the original PDF (ENNOUR, 595.32 × 841.92 pt),
// and every page is drawn the way the original is: filled rectangles, thin 0.48 pt
// rules, and text boxes at fixed positions. Nothing flows, so the output cannot drift.
//
// This module is intentionally self-contained (no imports): it is unit-tested with the
// Node runner and receives the embedded fonts / glyph metrics from the caller.

// ─── Public types ────────────────────────────────────────────────────────────

export type FicheFont = 'FicheSerif' | 'FicheSerifBold' | 'FicheSans';
/** Advance width per character, in em. See scripts/build-fiche-assets.py. */
export type FicheMetrics = Record<FicheFont, Record<string, number>>;

export interface FichePoint {
  /** Lecture AV (staff reading). */
  lav: number | null;
  /** Cote réception (pratique) = P.C. − LAV. */
  pratique: number | null;
  /** Différence = Z théorique − Z pratique. */
  diff: number | null;
  /** True when |diff| is beyond the tolerance (printed in red). */
  out: boolean;
}

export interface FicheProfileModel {
  /** Order: D1, D2 (F), Axe, G1, G2 (F). */
  points: [FichePoint, FichePoint, FichePoint, FichePoint, FichePoint];
  coteProjet: number | null;
  distance: number | null;
  devers: number | null;
  observation: string;
}

export interface FicheInput {
  /** The four lines of the institutional box (2 small + 2 large). */
  institution: [string, string, string, string];
  receptionNumber: string;
  vNumber: string;
  /** Already formatted, e.g. "29/10/2026". */
  dateFr: string;
  typeIntervention: string;
  repere: string;
  alt: number | null;
  lectureArriere: number | null;
  pc: number | null;
  profiles: FicheProfileModel[];
  /** Data URIs. Left: client (ARRU) then enterprise; right: bureau de contrôle. */
  logos: { client?: string | null; enterprise?: string | null; bureau?: string | null };
}

export interface FicheAssets {
  /** @font-face CSS declaring FicheSerif (400/700) and FicheSans. */
  fontCss: string;
  metrics: FicheMetrics;
}

export interface FicheOptions {
  /**
   * CSS unit that equals one PDF point in the target print engine.
   * Android (Chromium) honours physical units: 'pt'.
   * iOS (WKWebView) lays pages out at 1 CSS px = 1 pt: 'px'.
   */
  unit?: 'pt' | 'px';
}

// ─── Geometry measured on the original ───────────────────────────────────────

export const PAGE_W = 595.32;
export const PAGE_H = 841.92;
export const PROFILES_PER_PAGE = 5;

const RULE = 0.48; // thin rule thickness used by the original grid
const GREY_HEAD = '#bfbfbf'; // 0.749
const GREY_ROW = '#d9d9d9'; // 0.851
const RED = '#c00000';

/** Column edges of the main grid. */
const X = [21.2, 70.9, 120.6, 191.4, 269.4, 340.4, 411.2, 475.1, 574.3];
/** Row edges of each 5-row profile block (D1, D2, Axe, G1, G2). */
const BLOCKS: number[][] = [
  [239.9, 257.9, 275.9, 294.0, 312.0, 330.2],
  [330.2, 348.2, 366.2, 384.3, 402.3, 420.4],
  [420.4, 438.4, 456.5, 474.5, 492.5, 510.7],
  [510.7, 528.7, 546.8, 564.8, 582.8, 600.9],
  [600.9, 618.9, 637.1, 655.1, 673.2, 691.2],
];
const POINT_LABELS = ['D1', 'D2 (F)', 'Axe', 'G1', 'G2 (F)'];
/** D2 (F) and G2 (F) rows are shaded in the data columns. */
const SHADED_ROWS = new Set([1, 4]);

/** Placeholder dots, exactly as printed on the blank original. */
const DOTS = {
  reception: '…'.repeat(16),
  v: '…'.repeat(4) + '...',
  date: '…'.repeat(9),
  type: '…'.repeat(29) + '...',
  repere: '…'.repeat(3) + '..',
  alt: '…'.repeat(4),
  lar: '…'.repeat(13) + '.',
  pc: '…'.repeat(16) + '..',
  profil: '…'.repeat(4) + '.',
};

/** The institutional box text is "condensed by 1 pt" in the original. */
const INST_LS = -1;

/** Default institutional box text, exactly as printed on the original (spacing included). */
export const DEFAULT_INSTITUTION: [string, string, string, string] = [
  'REPUBLIQUE TUNISIENNE',
  'AGENCE DE  RÉHABILITATION  ET   DE  RENOVATION   URBAINE',
  'TRAVAUX DE REHABILITATION DU QUARTIER ENNOUR',
  'DANS LA COMMUNE DE KASSERINE',
];

/** Word anchors text near the top of the 18 pt rows: ink sits 2.3 pt above CSS centring. */
const ROW_DY = -2.3;

const FOOT_DY = 1.8;

// Calibrated so that glyph ink lands where it does in the original (see verification notes).
const DY_SERIF = 0.0;
const DY_SANS = 0.0;

// ─── Small helpers ───────────────────────────────────────────────────────────

const esc = (v: string | number | null | undefined): string =>
  v === null || v === undefined
    ? ''
    : String(v)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');

const r3 = (n: number) => Math.round(n * 1000) / 1000;
const oneLine = (s: string) => String(s ?? '').replace(/\s+/g, ' ').trim();

/** 3-decimal number, never "-0.000". */
const fmt3 = (n: number | null): string => {
  if (n === null || !Number.isFinite(n)) return '';
  const v = Math.round(n * 1000) / 1000;
  return (Object.is(v, -0) ? 0 : v).toFixed(3);
};
const fmtDiff = (n: number | null): string => {
  const s = fmt3(n);
  return s !== '' && n !== null && Math.round(n * 1000) > 0 ? `+${s}` : s;
};
const fmtShort = (n: number): string => String(Math.round(n * 1000) / 1000);

// Text measuring (for shrink-to-fit) ------------------------------------------

function textWidth(m: FicheMetrics, font: FicheFont, text: string, size: number, ls = 0): number {
  const t = m[font];
  let w = 0;
  let n = 0;
  for (const ch of text) {
    w += t[ch] ?? 0.5;
    n += 1;
  }
  return w * size + n * ls;
}

function fitSingleLine(
  m: FicheMetrics, font: FicheFont, text: string, base: number, min: number, maxW: number, ls = 0
): number {
  let s = base;
  while (s > min && textWidth(m, font, text, s, ls) > maxW) s = r3(s - 0.25);
  return s;
}

function countLines(m: FicheMetrics, font: FicheFont, text: string, size: number, maxW: number): number {
  let lines = 0;
  for (const para of text.split('\n')) {
    let cur = 0;
    let n = 1;
    const space = textWidth(m, font, ' ', size);
    for (const word of para.split(' ')) {
      const w = textWidth(m, font, word, size);
      if (cur === 0) cur = w;
      else if (cur + space + w <= maxW) cur += space + w;
      else {
        n += 1;
        cur = w;
      }
      if (w > maxW) n += Math.floor(w / maxW); // very long word gets broken
    }
    lines += n;
  }
  return lines;
}

function fitBlock(
  m: FicheMetrics, font: FicheFont, text: string,
  base: number, min: number, maxW: number, maxH: number, lh: number
): number {
  let s = base;
  while (s > min && countLines(m, font, text, s, maxW) * s * lh > maxH) s = r3(s - 0.25);
  return s;
}

// ─── Page renderer ───────────────────────────────────────────────────────────

interface TxtOpts {
  font?: FicheFont;
  size: number;
  align?: 'c' | 'l';
  bold?: boolean;
  color?: string;
  wrap?: boolean;
  /** Line height in pt (defaults to the box height for single lines). */
  lh?: number;
  padL?: number;
  padR?: number;
  dy?: number;
  /** Vertical anchor inside the box. */
  v?: 'm' | 't';
  /** Letter spacing in pt (the original header is "condensed by 1 pt"). */
  ls?: number;
  /** Keep runs of spaces (white-space: pre). */
  pre?: boolean;
}

function renderPage(
  input: FicheInput,
  assets: FicheAssets,
  pageNo: number,
  pageCount: number,
  slice: FicheProfileModel[],
  firstNumber: number,
  u: (n: number) => string
): string {
  const m = assets.metrics;
  const fills: string[] = [];
  const imgs: string[] = [];
  const texts: string[] = [];
  const rules = new Set<string>();

  const rect = (x0: number, y0: number, x1: number, y1: number, color: string) =>
    fills.push(
      `<i style="left:${u(x0)};top:${u(y0)};width:${u(x1 - x0)};height:${u(y1 - y0)};background:${color}"></i>`
    );
  const hl = (x0: number, x1: number, y: number, t = RULE) =>
    rules.add(`<i class="k" style="left:${u(r3(x0 - t / 2))};top:${u(r3(y - t / 2))};width:${u(r3(x1 - x0 + t))};height:${u(t)}"></i>`);
  const vl = (x: number, y0: number, y1: number, t = RULE) =>
    rules.add(`<i class="k" style="left:${u(r3(x - t / 2))};top:${u(r3(y0 - t / 2))};width:${u(t)};height:${u(r3(y1 - y0 + t))}"></i>`);
  const cell = (x0: number, y0: number, x1: number, y1: number, t = RULE) => {
    hl(x0, x1, y0, t); hl(x0, x1, y1, t); vl(x0, y0, y1, t); vl(x1, y0, y1, t);
  };
  const logo = (src: string | null | undefined, x: number, y: number, w: number, h: number) => {
    if (!src) return;
    imgs.push(
      `<img src="${esc(src)}" alt="" style="left:${u(x)};top:${u(y)};width:${u(w)};height:${u(h)}">`
    );
  };
  const txt = (x0: number, y0: number, x1: number, y1: number, html: string, o: TxtOpts) => {
    const font = o.font ?? 'FicheSerif';
    const sans = font === 'FicheSans';
    const dy = (o.dy ?? 0) + (sans ? DY_SANS : DY_SERIF);
    const h = y1 - y0;
    const lh = o.lh ?? h;
    const style = [
      `left:${u(x0)}`, `top:${u(r3(y0 + dy))}`, `width:${u(x1 - x0)}`, `height:${u(h)}`,
      `font-size:${u(o.size)}`, `line-height:${u(lh)}`,
      `justify-content:${o.align === 'l' ? 'flex-start' : 'center'}`,
      `text-align:${o.align === 'l' ? 'left' : 'center'}`,
      `align-items:${o.v === 't' ? 'flex-start' : 'center'}`,
      o.padL ? `padding-left:${u(o.padL)}` : '',
      o.padR ? `padding-right:${u(o.padR)}` : '',
      o.bold ? 'font-weight:700' : '',
      o.color ? `color:${o.color}` : '',
      sans ? "font-family:'FicheSans',Calibri,Carlito,sans-serif" : '',
      o.wrap ? 'white-space:normal' : '',
      o.pre ? 'white-space:pre' : '',
      o.ls ? `letter-spacing:${u(o.ls)}` : '',
    ].filter(Boolean).join(';');
    texts.push(`<div class="t" style="${style}"><span>${html}</span></div>`);
  };

  // ── Logos (original slots: ARRU 39.4², SAMED 80.7×46.1, SOIT 72²) ──
  logo(input.logos.client, 31.8, 28.3, 39.4, 39.4);
  logo(input.logos.enterprise, 71.2, 26.6, 80.7, 46.1);
  logo(input.logos.bureau, 490.9, 10.4, 72.0, 72.0);

  // ── Institutional double box ──
  rect(151.05, 11.85, 464.35, 43.0, '#fff');
  rect(151.15, 42.95, 464.75, 80.75, '#fff');
  for (const [x0, y0, x1, y1] of [
    [151.05, 11.85, 464.35, 43.0],
    [151.15, 42.95, 464.75, 80.75],
  ]) {
    hl(x0, x1, y0, 0.75); hl(x0, x1, y1, 0.75); vl(x0, y0, y1, 0.75); vl(x1, y0, y1, 0.75);
  }
  // Header lines keep their inner spacing (the original uses double spaces) – trim only.
  const inst = input.institution.map((l) => String(l ?? '').replace(/[\r\n]+/g, ' ').trim().toUpperCase());
  const instSpec: Array<{ cy: number; base: number; min: number; x0: number; x1: number }> = [
    { cy: 22.8, base: 10, min: 6.5, x0: 154, x1: 461.4 },
    { cy: 35.05, base: 10, min: 6.5, x0: 154, x1: 461.4 },
    { cy: 54.95, base: 13, min: 7.5, x0: 154, x1: 461.8 },
    { cy: 70.55, base: 13, min: 7.5, x0: 154, x1: 461.8 },
  ];
  inst.forEach((line, i) => {
    if (!line) return;
    const sp = instSpec[i];
    const size = fitSingleLine(m, 'FicheSans', line, sp.base, sp.min, sp.x1 - sp.x0 - 4, INST_LS);
    txt(sp.x0, sp.cy - 7, sp.x1, sp.cy + 7, esc(line), { font: 'FicheSans', size, ls: INST_LS, pre: true });
  });

  // ── Title ──
  txt(21.2, 87.0, 574.3, 104.0, 'FICHE DE RECEPTION TOPOGRAPHIQUE', { size: 14, dy: 1.0 });

  // ── Row 1: RÉCEPTION · V · P · Date ──
  const R1 = [115.0, 140.9];
  const R2 = [140.9, 164.2];
  cell(X[0], R1[0], X[4], R1[1]);
  cell(X[4], R1[0], X[5], R1[1]);
  cell(X[5], R1[0], X[6], R1[1]);
  cell(X[6], R1[0], X[7], R1[1]);
  cell(X[7], R1[0], X[8], R1[1]);

  const rec = oneLine(input.receptionNumber);
  const recSize = rec ? fitSingleLine(m, 'FicheSerifBold', rec, 11, 7, 241.6 - 63.5) : 11;
  txt(X[0], R1[0], X[4], R1[1],
    `RÉCEPTION&nbsp;${rec ? `<b style="font-size:${u(recSize)}">${esc(rec)}</b>` : DOTS.reception}`,
    { size: 11, align: 'l', padL: 3.6, dy: 0.8 });

  const v = oneLine(input.vNumber);
  const vSize = v ? fitSingleLine(m, 'FicheSerifBold', 'V ' + v, 11, 6.5, X[5] - X[4] - 8) : 11;
  txt(X[4], R1[0], X[5], R1[1],
    `<b style="font-size:${u(vSize)}">V${v ? '&nbsp;' + esc(v) : DOTS.v}</b>`,
    { size: 11, dy: 0.4 });

  txt(X[5], R1[0], X[6], R1[1], `P&nbsp;(${pageNo}/${pageCount})`, { size: 11, dy: 1.4 });
  txt(X[6], R1[0], X[7], R1[1], 'Date', { size: 11, dy: 1.5 });
  const date = oneLine(input.dateFr);
  txt(X[7], R1[0], X[8], R1[1],
    date ? `<b>${esc(date)}</b>` : DOTS.date, { size: 10, dy: 0.7 });

  // ── Row 2: TYPE D'INTERVENTION ──
  cell(X[0], R2[0], X[4], R2[1]);
  cell(X[4], R2[0], X[8], R2[1]);
  txt(X[0], R2[0], X[4], R2[1], "TYPE D'INTERVENTION VOIRIE PROJETEE", { size: 11, align: 'l', padL: 3.6, dy: 1.0 });
  const typ = oneLine(input.typeIntervention);
  if (typ) {
    const maxW = X[8] - X[4] - 8;
    const size = fitBlock(m, 'FicheSerif', typ, 10, 6.5, maxW, R2[1] - R2[0] - 2, 1.12);
    txt(X[4], R2[0], X[8], R2[1], esc(typ), { size, align: 'l', padL: 3.7, padR: 3, wrap: true, lh: r3(size * 1.12) });
  } else {
    txt(X[4], R2[0], X[8], R2[1], DOTS.type, { size: 10, align: 'l', padL: 3.7 });
  }

  // ── Column header ──
  const H = [164.2, 199.1];
  const head: Array<[number, number, string]> = [
    [X[0], X[2], 'N° PROFIL'],
    [X[2], X[3], 'LECTURE AV'],
    [X[3], X[4], 'COTE<br>RECEPTION<br>(PRATIQUE)'],
    [X[4], X[5], 'COTE<br>PROJET<br>(THÉORIQUE)'],
    [X[5], X[6], 'DIFFÉRENCE<br>(Z.Théo -Z.pr)'],
    [X[6], X[7], 'DISTANCE<br><b>/</b><br>DEVERS (%)'],
    [X[7], X[8], 'OBSERVATION /<br>OBSTACLE'],
  ];
  head.forEach(([x0, x1, label]) => {
    cell(x0, H[0], x1, H[1]);
    txt(x0, H[0], x1, H[1], label, { size: 10, lh: 11.5 });
  });

  // ── Repère / ALT / Lecture arrière / P.C. (grey band) ──
  const B = [199.1, 239.9];
  const BM = 219.5;
  rect(X[0], B[0], X[1], B[1], GREY_HEAD);
  rect(X[1], B[0], X[2], B[1], GREY_HEAD);
  rect(X[2], B[0], X[4], BM, GREY_HEAD);
  rect(X[4], B[0], X[7], BM, GREY_HEAD);
  rect(X[2], BM, X[4], B[1], GREY_HEAD);
  rect(X[4], BM, X[7], B[1], GREY_HEAD);
  rect(X[7], B[0], X[8], B[1], GREY_HEAD);
  cell(X[0], B[0], X[1], B[1]);
  cell(X[1], B[0], X[2], B[1]);
  cell(X[2], B[0], X[4], BM);
  cell(X[4], B[0], X[7], BM);
  cell(X[2], BM, X[4], B[1]);
  cell(X[4], BM, X[7], B[1]);
  cell(X[7], B[0], X[8], B[1]);

  txt(X[0], B[0] + 0.4, X[1], B[0] + 11.9, 'REPERE :', { size: 10, dy: -0.3 });
  txt(X[1], B[0] + 0.4, X[2], B[0] + 11.9, 'ALT (Z) :', { size: 10, dy: -0.2 });

  const repere = oneLine(input.repere);
  if (repere) {
    const w = X[1] - X[0] - 5;
    const size = fitBlock(m, 'FicheSerifBold', repere, 10, 6, w, 26, 1.1);
    txt(X[0], B[0] + 11.6, X[1], B[1] - 0.6, `<b>${esc(repere)}</b>`,
      { size, wrap: true, lh: r3(size * 1.1) });
  } else {
    txt(X[0], 222.4, X[1], 233.9, DOTS.repere, { size: 10 });
  }
  if (input.alt !== null) {
    const s = `${fmt3(input.alt)} m`;
    const size = fitSingleLine(m, 'FicheSerifBold', s, 10, 6.5, X[2] - X[1] - 4);
    txt(X[1], 222.4, X[2], 233.9, `<b>${s}</b>`, { size });
  } else {
    txt(X[1], 222.4, X[2], 233.9, DOTS.alt, { size: 10 });
  }

  txt(X[2], B[0], X[4], BM, 'Lecture arrière :', { size: 12, dy: 1.5 });
  txt(X[4], B[0], X[7], BM,
    input.lectureArriere !== null ? `<b>${fmt3(input.lectureArriere)} m</b>` : DOTS.lar, { size: 12, dy: 1.5 });
  txt(X[2], BM, X[4], B[1], 'P.C :', { size: 10, dy: 0.8 });
  txt(X[4], BM, X[7], B[1],
    input.pc !== null ? `<b>${fmt3(input.pc)} m</b>` : DOTS.pc,
    { size: input.pc !== null ? 12 : 10, dy: 0.75 });

  // ── Profile blocks ──
  for (let b = 0; b < PROFILES_PER_PAGE; b++) {
    const ys = BLOCKS[b];
    const p = slice[b];
    const top = ys[0];
    const bot = ys[5];

    // shaded rows first (so rules sit on top)
    for (let r = 0; r < 5; r++) {
      if (SHADED_ROWS.has(r)) rect(X[2], ys[r], X[7], ys[r + 1], GREY_ROW);
    }

    // merged: N° PROFIL and OBSERVATION
    cell(X[0], top, X[1], bot);
    cell(X[7], top, X[8], bot);
    txt(X[0], top, X[1], bot,
      p ? `<b>${firstNumber + b}</b>` : DOTS.profil, { size: p ? 11 : 10, dy: 0.7 });

    if (p && oneLine(p.observation)) {
      const obs = p.observation.replace(/\r/g, '').trim();
      const maxW = X[8] - X[7] - 7;
      const size = fitBlock(m, 'FicheSerif', obs, 10, 6, maxW, bot - top - 4, 1.12);
      txt(X[7], top, X[8], bot, esc(obs).replace(/\n/g, '<br>'),
        { size, align: 'l', padL: 3.5, padR: 3.5, wrap: true, lh: r3(size * 1.12), dy: ROW_DY });
    }

    for (let r = 0; r < 5; r++) {
      const y0 = ys[r];
      const y1 = ys[r + 1];
      for (let c = 1; c <= 6; c++) cell(X[c], y0, X[c + 1], y1);

      txt(X[1], y0, X[2], y1, POINT_LABELS[r], { size: 10, align: 'l', padL: 3.5, dy: ROW_DY });
      if (!p) continue;

      const pt = p.points[r];
      if (pt.lav !== null) txt(X[2], y0, X[3], y1, fmt3(pt.lav), { size: 10, dy: ROW_DY });
      if (pt.pratique !== null) txt(X[3], y0, X[4], y1, fmt3(pt.pratique), { size: 10, dy: ROW_DY });
      if (p.coteProjet !== null) txt(X[4], y0, X[5], y1, fmt3(p.coteProjet), { size: 10, dy: ROW_DY });
      if (pt.diff !== null) {
        txt(X[5], y0, X[6], y1, fmtDiff(pt.diff),
          { size: 10, bold: pt.out, color: pt.out ? RED : undefined, dy: ROW_DY });
      }
    }

    // Dévers (%) / Distance (m): one value per profile → written once, on the Axe row.
    if (p) {
      const parts: string[] = [];
      if (p.devers !== null) parts.push(`${fmtShort(p.devers)} %`);
      if (p.distance !== null) parts.push(`${fmtShort(p.distance)} m`);
      if (parts.length) {
        const s = parts.join(' / ');
        const size = fitSingleLine(m, 'FicheSerif', s, 10, 6.5, X[7] - X[6] - 4);
        txt(X[6], ys[2], X[7], ys[3], esc(s), { size, dy: ROW_DY });
      }
    }
  }

  // ── NOTA box ──
  const N = [691.2, 717.2];
  rect(X[0], N[0], X[8], N[1], GREY_HEAD);
  cell(X[0], N[0], X[8], N[1]);
  const nota =
    'NOTA 1&nbsp; : LA CASE DEVERS (%) : LIGNE ROUGE PROJTÉE PAR RAPPORT À DES CANIVEAUX EXISTANTS À CONSERVER (V-EX)<br>' +
    'NOTA 2&nbsp; : D2 ET G2 SONT LES LECTURES DE LA COUCHE DE BASE SOUS CANIVEAUX';
  txt(X[0], N[0] + 2.4, X[8], N[1] - 1.8, nota, { size: 9, align: 'l', padL: 5.9, lh: 10.3, dy: 0.7 });

  // ── Signature labels (Calibri 14 pt, condensed by 1 pt, baseline ≈ 730.2) ──
  for (const [x, label] of [
    [43.6, 'BUREAU DE CONTROLE'],
    [283.9, 'ARRU'],
    [475.4, 'ENTREPRISE'],
  ] as Array<[number, string]>) {
    txt(x, 716.87, x + 150, 733.96, label, { font: 'FicheSans', size: 14, align: 'l', ls: INST_LS, dy: FOOT_DY });
  }

  return `<section class="pg">${fills.join('')}${imgs.join('')}${texts.join('')}${[...rules].join('')}</section>`;
}

// ─── Public entry point ──────────────────────────────────────────────────────

/** Number of A4 pages needed for `profileCount` profiles (at least one). */
export const countPages = (profileCount: number): number =>
  Math.max(1, Math.ceil(profileCount / PROFILES_PER_PAGE));

export function buildFicheHtml(
  input: FicheInput,
  assets: FicheAssets,
  options: FicheOptions = {}
): { html: string; pageCount: number } {
  const unit = options.unit ?? 'pt';
  const u = (n: number) => `${r3(n)}${unit}`;
  const pageCount = countPages(input.profiles.length);

  const pages: string[] = [];
  for (let i = 0; i < pageCount; i++) {
    const slice = input.profiles.slice(i * PROFILES_PER_PAGE, (i + 1) * PROFILES_PER_PAGE);
    pages.push(renderPage(input, assets, i + 1, pageCount, slice, i * PROFILES_PER_PAGE + 1, u));
  }

  const html = `<!DOCTYPE html>
<html lang="fr"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Fiche de Réception Topographique</title>
<style>
${assets.fontCss}
@page{size:${u(PAGE_W)} ${u(PAGE_H)};margin:0}
*{box-sizing:border-box;-webkit-print-color-adjust:exact;print-color-adjust:exact}
html,body{margin:0;padding:0;background:#fff}
body{font-family:'FicheSerif','Times New Roman',Times,serif;color:#000;
  font-kerning:none;font-variant-ligatures:none;text-rendering:geometricPrecision;
  -webkit-text-size-adjust:100%}
.pg{position:relative;width:${u(PAGE_W)};height:${u(PAGE_H - 1)};overflow:hidden;
  page-break-after:always;break-after:page}
.pg:last-child{page-break-after:auto;break-after:auto}
.pg>i,.pg>img,.pg>div{position:absolute}
.pg>i,.pg>img{display:block}
.pg>i.k{background:#000}
.pg>img{object-fit:contain}
.pg>.t{display:flex;overflow:hidden;white-space:nowrap}
.t>span{display:block;max-width:100%}
b{font-weight:700}
</style></head>
<body>${pages.join('')}</body></html>`;

  return { html, pageCount };
}
