import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#0a84ff', // azul suave tipo Apple
    },
    background: {
      default: '#f5f7fb',
      paper: '#ffffff'
    },
    text: {
      primary: '#0b1220',
      secondary: '#5f6873'
    }
  },
  shape: {
    borderRadius: 12
  },
  components: {
    MuiModal: {
      defaultProps: {
        // Evita que MUI modifique el body (overflow/padding-right) al abrir Dialog/Menu/Popover
        disableScrollLock: true
      }
    },
    MuiDialog: {
      defaultProps: {
        disableScrollLock: true
      }
    },
    MuiPopover: {
      defaultProps: {
        disableScrollLock: true
      }
    },
    MuiMenu: {
      defaultProps: {
        disableScrollLock: true
      }
    },
    MuiSelect: {
      defaultProps: {
        MenuProps: { disableScrollLock: true }
      }
    },
    MuiButton: {
      defaultProps: {
        disableElevation: true
      },
      styleOverrides: {
        root: {
          borderRadius: 999,
          textTransform: 'none'
        }
      }
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 14
        }
      }
    }
  },
  typography: {
    fontFamily: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial'].join(','),
    h4: {
      fontWeight: 700
    }
  }
});

export default theme;
