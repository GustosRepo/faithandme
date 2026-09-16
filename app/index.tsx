import { Redirect } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { useOnboarding } from '@/context/OnboardingContext';
import { useAppTheme } from '@/hooks/useAppTheme';

export default function IndexRoute() {
  const { hydrated, onboardingCompleted } = useOnboarding();
  const theme = useAppTheme();

  if (!hydrated) {
    return (
      <View style={[styles.loader, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="small" color={theme.colors.accent} />
      </View>
    );
  }

  if (onboardingCompleted) {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/(onboarding)/welcome" />;
}

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
