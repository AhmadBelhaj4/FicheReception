// src/theme/colors.ts
// Semantic color tokens for dark and light mode.

export const darkColors = {
  bg: '#0f172a',          // slate-900
  card: '#1e293b',        // slate-800
  cardBorder: '#334155',  // slate-700
  inputBg: '#334155',     // slate-700
  inputBorder: '#475569', // slate-600
  surface: '#0f172a',     // deep slate
  text: '#f8fafc',        // slate-50
  textMuted: '#94a3b8',   // slate-400
  textDim: '#64748b',     // slate-500
  accent: '#f59e0b',      // amber-500
  accentMuted: 'rgba(245, 158, 11, 0.2)',
  accentBorder: 'rgba(245, 158, 11, 0.4)',
  divider: '#334155',
  danger: '#f87171',
  dangerBg: 'rgba(239, 68, 68, 0.15)',
  success: '#34d399',
};

export const lightColors = {
  bg: '#f8fafc',          // slate-50
  card: '#ffffff',        // white
  cardBorder: '#e2e8f0',  // slate-200
  inputBg: '#f1f5f9',     // slate-100
  inputBorder: '#cbd5e1', // slate-300
  surface: '#f1f5f9',     // soft light slate
  text: '#0f172a',        // slate-900
  textMuted: '#475569',   // slate-600
  textDim: '#94a3b8',     // slate-400
  accent: '#d97706',      // amber-600
  accentMuted: 'rgba(217, 119, 6, 0.15)',
  accentBorder: 'rgba(217, 119, 6, 0.4)',
  divider: '#e2e8f0',
  danger: '#ef4444',
  dangerBg: 'rgba(239, 68, 68, 0.1)',
  success: '#059669',
};

export type ThemeColors = typeof darkColors;
