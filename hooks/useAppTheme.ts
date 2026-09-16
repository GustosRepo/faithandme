import { useMemo } from 'react';
import { useColorScheme } from 'react-native';

import { AppTheme, ThemeMode, theme } from '@/constants/theme';

export function useAppTheme(): AppTheme {
  const colorScheme = useColorScheme();
  const mode: ThemeMode = colorScheme === 'dark' ? 'dark' : 'light';

  return useMemo(() => theme[mode], [mode]);
}
