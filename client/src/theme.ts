import { createTheme } from '@mui/material/styles';

// ── Framer-style dark "artboard" tokens (from DESIGN-framer.md) ───────────────
const ACCENT = '#0099ff'; // single chromatic accent — links / focus / selection only
const CANVAS = '#090909';
const SURFACE_1 = '#141414';
const SURFACE_2 = '#1c1c1c';
const HAIRLINE = '#262626';

const GEIST = "'Geist', 'Mona Sans', 'Segoe UI', sans-serif"; // GT Walsheim substitute
const INTER = "'Inter', 'Inter Variable', 'Segoe UI', Roboto, sans-serif";

// Shared palette consumed directly by feature components via `COLORS`.
export const COLORS = {
  accent: ACCENT,
  accentText: ACCENT,
  accentSoft: 'rgba(0,153,255,0.12)',
  accentBorder: 'rgba(0,153,255,0.40)',
  accentGlow: 'rgba(0,153,255,0.25)',
  canvas: CANVAS,
  surface: SURFACE_1,
  surface2: SURFACE_2,
  surface3: '#262626',
  border: HAIRLINE,
  border2: '#333333',
  text: '#ffffff',
  text2: '#999999',
  text3: '#7a7a7a',
  text4: '#5a5a5a',
  // Semantic / data-viz accents (priority + status dots, etc.)
  rose: '#ff5577',
  amber: '#fbbf24',
  emerald: '#22c55e',
  sky: '#0099ff',
  // Signature gradient spotlight family
  gradientViolet: '#6a4cf5',
  gradientMagenta: '#d44df0',
  gradientOrange: '#ff7a3d',
  gradientCoral: '#ff5577',
  mono: "'Geist Mono', ui-monospace, monospace",
};

export const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#ffffff', contrastText: '#000000' }, // white pill CTAs
    info: { main: ACCENT },
    error: { main: '#ff5577' },
    warning: { main: '#fbbf24' },
    success: { main: '#22c55e' },
    background: { default: CANVAS, paper: SURFACE_1 },
    text: { primary: '#ffffff', secondary: '#999999' },
    divider: HAIRLINE,
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: INTER,
    fontSize: 14,
    // Display tier — Geist with aggressive negative tracking (poster cadence).
    h1: { fontFamily: GEIST, fontWeight: 600, letterSpacing: '-0.045em', lineHeight: 0.95 },
    h2: { fontFamily: GEIST, fontWeight: 600, letterSpacing: '-0.04em', lineHeight: 1.0 },
    h3: { fontFamily: GEIST, fontWeight: 600, letterSpacing: '-0.035em', lineHeight: 1.05 },
    h4: { fontFamily: GEIST, fontWeight: 600, letterSpacing: '-0.03em', lineHeight: 1.1 },
    h5: { fontFamily: GEIST, fontWeight: 600, letterSpacing: '-0.02em', lineHeight: 1.15 },
    h6: { fontFamily: GEIST, fontWeight: 600, letterSpacing: '-0.02em', lineHeight: 1.2 },
    body1: { letterSpacing: '-0.01em' },
    body2: { letterSpacing: '-0.01em' },
    button: { textTransform: 'none', fontWeight: 500, letterSpacing: '-0.01em' },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: CANVAS,
          color: '#ffffff',
          fontFamily: INTER,
          // Inter character variants — Framer's bespoke body voice.
          fontFeatureSettings: "'cv01','cv05','cv09','cv11','ss03'",
          WebkitFontSmoothing: 'antialiased',
        },
        '::selection': { background: 'rgba(0,153,255,0.30)' },
      },
    },
    // Flat charcoal surfaces — no glass blur, depth comes from surface lift.
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: SURFACE_1,
          border: `1px solid ${HAIRLINE}`,
          boxShadow: 'none',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: CANVAS,
          backgroundImage: 'none',
          borderBottom: `1px solid ${HAIRLINE}`,
          boxShadow: 'none',
          color: '#ffffff',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 100, // pill
          textTransform: 'none',
          fontWeight: 500,
          transition: 'background-color .15s ease, transform .1s ease',
          '&:active': { transform: 'scale(0.97)' },
          '&.MuiButton-containedPrimary': {
            backgroundColor: '#ffffff',
            color: '#000000',
            boxShadow: 'none',
            '&:hover': { backgroundColor: '#ededed', boxShadow: 'none' },
          },
        },
      },
    },
    MuiLink: {
      styleOverrides: {
        root: { color: ACCENT },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        notchedOutline: { borderColor: HAIRLINE },
        root: {
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: ACCENT,
            borderWidth: 1,
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: { borderColor: HAIRLINE },
        head: { color: '#999999', fontWeight: 600 },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: { backgroundColor: SURFACE_2, border: `1px solid ${HAIRLINE}`, fontSize: 12 },
      },
    },
  },
});
