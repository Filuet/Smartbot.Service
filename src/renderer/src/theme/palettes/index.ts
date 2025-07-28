import { createTheme, Theme } from '@mui/material/styles';

import { lightDefault } from './paletteDefault/lightDefault';
import { darkDefault } from './paletteDefault/darkDefault';
import { herbalifeDark } from './paletteHerbalife/herbalifeDark';
import { herbalifeLight } from './paletteHerbalife/herbalifeLight';

declare module '@mui/material/styles' {
  interface TypeText {
    hint?: string;
  }
}

// ==============================|| THEME CREATION FUNCTION ||============================== //

const Palette = (presetColor: string, mode: 'light' | 'dark'): Theme => {
  let colors;
  if (presetColor === 'themeHerbalife') {
    colors = mode === 'dark' ? herbalifeDark : herbalifeLight;
  } else {
    colors = mode === 'dark' ? darkDefault : lightDefault;
  }

  return createTheme({
    palette: {
      mode,
      common: {
        black: colors.commonBlack,
        white: colors.commonWhite
      },
      primary: {
        light: colors.primaryLight,
        main: colors.primaryMain,
        dark: colors.primaryDark,
        contrastText: colors.primaryContrastText
      },
      secondary: {
        light: colors.secondaryLight,
        main: colors.secondaryMain,
        dark: colors.secondaryDark,
        contrastText: colors.secondaryContrastText
      },
      error: {
        light: colors.errorLight,
        main: colors.errorMain,
        dark: colors.errorDark,
        contrastText: colors.errorContrastText
      },
      warning: {
        light: colors.warningLight,
        main: colors.warningMain,
        dark: colors.warningDark,
        contrastText: colors.warningContrastText
      },
      info: {
        light: colors.infoLight,
        main: colors.infoMain,
        dark: colors.infoDark,
        contrastText: colors.infoContrastText
      },
      success: {
        light: colors.successLight,
        main: colors.successMain,
        dark: colors.successDark,
        contrastText: colors.successContrastText
      },
      text: {
        primary: colors.textPrimary,
        secondary: colors.textSecondary,
        disabled: colors.textDisabled,
        hint: colors.textHint
      },
      background: {
        default: colors.backgroundDefault,
        paper: colors.backgroundPaper
      },
      divider: colors.divider,
      action: {
        active: colors.actionActive,
        hover: colors.actionHover,
        selected: colors.actionSelected,
        selectedOpacity: colors.selectedOpacity,
        disabled: colors.actionDisabled,
        disabledBackground: colors.actionDisabledBackground,
        disabledOpacity: colors.actionDisabledOpacity,
        focus: colors.focus,
        focusOpacity: colors.focusOpacity,
        activatedOpacity: colors.activatedOpacity
      }
    }
  });
};

export default Palette;
