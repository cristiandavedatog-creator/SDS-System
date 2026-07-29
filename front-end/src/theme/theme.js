// Single source of truth for MUI styling (palette, typography, component chrome).
// Keeps every page/card/table/button/chip visually consistent instead of each
// file picking its own hex colors and radii.
//
// Palette is tailored from the DepEd SDO Camarines Norte seal (navy/blue,
// muted gold, green, red) rather than arbitrary brand colors.
import { createTheme } from '@mui/material/styles';
import { TRAVEL_STATUS_COLORS } from './travelStatus';

export const BRAND = {
  navy: '#1e293b',
  navyDark: '#0f172a',
  navyLight: '#334155',
  accent: '#b8801f', // muted gold, from the seal's sunburst
  paper: '#eef2f8',  // page background — cool blue-grey, not warm cream
  line: '#dbe2ee',
  tableHead: '#f1f5f9',  // shared slate background for table headers / sticky cells
  hoverBg: '#f8f9fa',    // subtle hover background for inputs
  muted: '#64748b',      // shared slate-grey for secondary/neutral text & borders
  amber: '#F39C12',      // shared amber accent (warning status, "National" travel area)
  violet: '#9B59B6',     // "Abroad" travel area accent
  chartFill: 'rgba(56, 189, 248, 0.3)',
  chartFillMuted: 'rgba(56, 189, 248, 0.2)',
};

const theme = createTheme({
  palette: {
    primary: {
      main: BRAND.navy,
      dark: BRAND.navyDark,
      light: BRAND.navyLight,
      contrastText: '#ffffff',
    },
    secondary: {
      main: BRAND.accent,
      contrastText: '#ffffff',
    },
    success: {
      main: TRAVEL_STATUS_COLORS.completed.border,
    },
    info: {
      main: TRAVEL_STATUS_COLORS.ongoing.border,
    },
    error: {
      main: TRAVEL_STATUS_COLORS.upcoming.border,
    },
    warning: {
      main: TRAVEL_STATUS_COLORS.total.border,
    },
    background: {
      default: BRAND.paper,
    },
  },
  shape: {
    borderRadius: 12,
  },
  typography: {
    fontFamily: [
      'Inter',
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      'Helvetica',
      'Arial',
      'sans-serif',
    ].join(','),
    h4: { fontWeight: 700 },
    h5: { fontWeight: 700 },
    h6: { fontWeight: 600 },
  },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 600,
          transition: 'transform 0.15s ease, box-shadow 0.15s ease, background-color 0.15s ease',
        },
        containedPrimary: {
          '&:hover': {
            backgroundColor: BRAND.navyLight,
            boxShadow: '0 6px 16px -4px rgba(15,23,42,0.45)',
            transform: 'translateY(-1px)',
          },
          '&:active': { transform: 'translateY(0)' },
        },
        containedSecondary: {
          '&:hover': {
            boxShadow: '0 6px 16px -4px rgba(184,128,31,0.5)',
            transform: 'translateY(-1px)',
          },
          '&:active': { transform: 'translateY(0)' },
        },
        outlined: {
          transition: 'transform 0.15s ease, background-color 0.15s ease, border-color 0.15s ease',
          '&:hover': { transform: 'translateY(-1px)' },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          transition: 'background-color 0.15s ease, transform 0.15s ease',
          '&:hover': { backgroundColor: 'rgba(30,41,59,0.06)' },
          '&:active': { transform: 'scale(0.92)' },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 14,
          boxShadow: '0 1px 2px rgba(22,35,61,0.06), 0 8px 24px -12px rgba(22,35,61,0.18)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 14,
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: BRAND.navy,
          boxShadow: 'none',
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          transition: 'box-shadow 0.15s ease, border-color 0.15s ease',
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: BRAND.navyLight,
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: BRAND.navy,
            borderWidth: 1.5,
          },
          '&.Mui-focused': {
            boxShadow: '0 0 0 3px rgba(30,41,59,0.08)',
          },
        },
      },
    },
    MuiCircularProgress: {
      styleOverrides: {
        root: {
          color: BRAND.accent,
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: BRAND.navyDark,
          fontSize: '0.72rem',
          fontWeight: 600,
          padding: '6px 10px',
          borderRadius: 6,
        },
        arrow: {
          color: BRAND.navyDark,
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          borderRadius: 10,
          marginTop: 4,
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontWeight: 800,
          fontSize: '0.78rem',
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
          backgroundColor: BRAND.tableHead,
          color: BRAND.navyDark,
        },
        body: {
          fontSize: '0.875rem',
          fontWeight: 500,
          color: BRAND.navy,
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          transition: 'background-color 0.15s ease',
          '&:hover': {
            backgroundColor: 'rgba(184, 128, 31, 0.06)',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 700,
          transition: 'background-color 0.15s ease, color 0.15s ease, box-shadow 0.15s ease',
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          fontWeight: 800,
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 16,
        },
      },
    },
    MuiBackdrop: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(15,23,42,0.45)',
          backdropFilter: 'blur(2px)',
        },
      },
    },
  },
});

export default theme;
