/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { Theme } from '@mui/material';

export default function componentStyleOverrides(theme: Theme) {
  return {
    MuiDialog: {
      styleOverrides: {
        paper: {}
      }
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          fontSize: '1.4rem',
          padding: '0.8rem'
        }
      }
    },
    MuiDialogContent: {
      styleOverrides: {
        root: {
          padding: '1rem 2rem 1rem 2rem'
        }
      }
    },
    MuiDialogActions: {
      styleOverrides: {
        root: {
          padding: '0.9rem 1.27rem 0.9rem 0.5rem',
          gap: '1.2rem'
        }
      }
    },
    MuiButton: {
      styleOverrides: {
        root: {
          fontSize: '17px',
          fontWeight: 600,
          boxShadow: 'none',
          borderRadius: '0px'
        },
        contained: {
          color: theme.palette.primary.contrastText,
          backgroundColor: theme.palette.primary.main,
          fontWeight: 'normal',
          boxShadow: 'none',
          borderRadius: 'none'
        },
        outlined: {}
      }
    }
  };
}
