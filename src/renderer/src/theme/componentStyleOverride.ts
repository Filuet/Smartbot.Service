/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { Theme } from '@mui/material';

export default function componentStyleOverrides(theme: Theme) {
  return {
    MuiButton: {
      styleOverrides: {
        root: {
          fontSize: '17px'
        },
        contained: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: 'none'
          }
        },
        outlined: {
          color: theme.palette.primary.contrastText,
          backgroundColor: theme.palette.primary.main,
          borderRadius: '50px',
          width: '272px',
          height: '64px',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: 'none'
          }
        }
      }
    }
  };
}
