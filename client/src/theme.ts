import { createTheme } from '@mui/material/styles';

// Design tokens from the "TMS - Dark" handoff.
const ACCENT = '#6d5cf0';
const SURFACE = 'rgba(20,24,33,0.84)';
const BORDER = 'rgba(255,255,255,0.1)';
const BORDER2 = 'rgba(255,255,255,0.17)';

export const COLORS = {
  accent: ACCENT,
  accentText: '#a99bff',
  accentSoft: 'rgba(109,92,240,0.14)',
  accentBorder: 'rgba(109,92,240,0.4)',
  accentGlow: 'rgba(109,92,240,0.32)',
  surface: SURFACE,
  surface2: 'rgba(27,32,42,0.8)',
  surface3: 'rgba(44,50,63,0.86)',
  border: BORDER,
  border2: BORDER2,
  text: '#f4f4f5',
  text2: '#a1a1aa',
  text3: '#71717a',
  text4: '#52525b',
  rose: '#fb7185',
  amber: '#fbbf24',
  emerald: '#34d399',
  sky: '#38bdf8',
  mono: "'Geist Mono', ui-monospace, monospace",
};

export const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: ACCENT, contrastText: '#ffffff' },
    error: { main: '#fb7185' },
    warning: { main: '#fbbf24' },
    success: { main: '#34d399' },
    info: { main: '#38bdf8' },
    background: { default: '#0a0d14', paper: SURFACE },
    text: { primary: '#f4f4f5', secondary: '#a1a1aa' },
    divider: BORDER,
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: "'Geist', 'Segoe UI', sans-serif",
    fontSize: 14,
    button: { textTransform: 'none', fontWeight: 600 },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: '#0a0d14',
          backgroundImage:
            "linear-gradient(180deg, rgba(8,11,18,0.5), rgba(7,11,20,0.74)), url('/bg.jpeg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
          backgroundRepeat: 'no-repeat',
          WebkitFontSmoothing: 'antialiased',
        },
        '::selection': { background: 'rgba(109,92,240,0.3)' },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: SURFACE,
          backdropFilter: 'blur(20px) saturate(1.3)',
          WebkitBackdropFilter: 'blur(20px) saturate(1.3)',
          border: `1px solid ${BORDER}`,
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.07), 0 10px 34px rgba(0,0,0,0.22)',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(10,13,20,0.5)',
          backgroundImage: 'none',
          backdropFilter: 'blur(22px) saturate(1.4)',
          WebkitBackdropFilter: 'blur(22px) saturate(1.4)',
          borderBottom: `1px solid ${BORDER}`,
          boxShadow: 'none',
          color: '#f4f4f5',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          '&.MuiButton-containedPrimary': {
            boxShadow: '0 8px 24px rgba(109,92,240,0.32)',
            '&:hover': { boxShadow: '0 10px 26px rgba(109,92,240,0.42)', filter: 'brightness(1.08)' },
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: { borderColor: BORDER },
        head: { color: '#a1a1aa', fontWeight: 600 },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        notchedOutline: { borderColor: BORDER2 },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: { backgroundColor: 'rgba(44,50,63,0.96)', fontSize: 12, border: `1px solid ${BORDER}` },
      },
    },
  },
});
