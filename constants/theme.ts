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
  sm: 6,
  md: 10,
  lg: 14,
  xl: 18,
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
  wine: string;
  rule: string;
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
      background: '#F4EFE5',
      surface: '#FBF7F0',
      surfaceSecondary: '#ECE4D6',
      text: '#24231F',
      textSecondary: '#514C43',
      textMuted: '#7C7468',
      border: '#D8CCB8',
      accent: '#4D5738',
      accentSoft: '#DDE1D1',
      wine: '#743C35',
      rule: '#D1C4AE',
      success: '#526A43',
      warning: '#A76534',
    },
    spacing,
    radii,
  },
  dark: {
    mode: 'dark',
    colors: {
      background: '#181612',
      surface: '#211E19',
      surfaceSecondary: '#2B261F',
      text: '#F2EBDD',
      textSecondary: '#D8CCB9',
      textMuted: '#AFA391',
      border: '#40382E',
      accent: '#B5C09A',
      accentSoft: '#303727',
      wine: '#C08A80',
      rule: '#4A4135',
      success: '#9CB58A',
      warning: '#D09A64',
    },
    spacing,
    radii,
  },
};
