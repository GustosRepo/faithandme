export type ThemeMode = 'light' | 'dark';

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
} as const;

export const radii = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 22,
  full: 999,
} as const;

export type ThemeColors = {
  background: string;
  surface: string;
  surfaceSecondary: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  accent: string;
  accentSoft: string;
  success: string;
  warning: string;
};

export type AppTheme = {
  mode: ThemeMode;
  colors: ThemeColors;
  spacing: typeof spacing;
  radii: typeof radii;
};

export const theme: Record<ThemeMode, AppTheme> = {
  light: {
    mode: 'light',
    colors: {
      background: '#F5F0E7',
      surface: '#F9F4EE',
      surfaceSecondary: '#F0E8DD',
      text: '#1E1D1A',
      textSecondary: '#4E4945',
      textMuted: '#7A736C',
      border: '#E1D5C2',
      accent: '#596B4D',
      accentSoft: '#E2E8DB',
      success: '#4A745C',
      warning: '#C98C45',
    },
    spacing,
    radii,
  },
  dark: {
    mode: 'dark',
    colors: {
      background: '#1A1917',
      surface: '#221F1D',
      surfaceSecondary: '#2A2624',
      text: '#F3EEE8',
      textSecondary: '#DCD2C8',
      textMuted: '#B7AEA2',
      border: '#3C3632',
      accent: '#A9B796',
      accentSoft: '#2E352E',
      success: '#8AB89C',
      warning: '#D6A86D',
    },
    spacing,
    radii,
  },
};
