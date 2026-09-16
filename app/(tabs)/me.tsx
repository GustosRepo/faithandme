import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Button, Card, Divider, Screen, SectionHeader, Text } from '@/components/ui';
import { useOnboarding } from '@/context/OnboardingContext';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useDailySession } from '@/hooks/useDailySession';

export default function MeScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const { state, resetOnboarding } = useOnboarding();
  const { resetToday, resetStreak } = useDailySession();

  const handleReset = () => {
    resetOnboarding();
    router.replace('/(onboarding)/welcome');
  };

  const handleResetToday = async () => {
    await resetToday();
  };

  const handleResetStreak = async () => {
    await resetStreak();
  };

  return (
    <Screen contentContainerStyle={styles.container}>
      <Text variant="display">Me</Text>

      <Card style={styles.profileCard}>
        <Text variant="subheading">Your Journey</Text>
        <View style={styles.infoRow}>
          <Text variant="body">Current focus</Text>
          <Text variant="bodySmall" style={{ color: theme.colors.textSecondary }}>
            {state.goals[0] ?? 'Peace'}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text variant="body">Feeling</Text>
          <Text variant="bodySmall" style={{ color: theme.colors.textSecondary }}>
            {state.currentFeeling ?? 'Open'}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text variant="body">Saved verses</Text>
          <Text variant="bodySmall" style={{ color: theme.colors.textSecondary }}>18</Text>
        </View>
      </Card>

      <SectionHeader title="Preferences" />
      <Card style={styles.preferenceCard}>
        <View style={styles.infoRow}>
          <Text variant="body">Bible translation</Text>
          <Text variant="bodySmall" style={{ color: theme.colors.textSecondary }}>Berean Standard Bible (BSB)</Text>
        </View>
        <Divider />
        <View style={styles.infoRow}>
          <Text variant="body">Daily reminder</Text>
          <Text variant="bodySmall" style={{ color: theme.colors.textSecondary }}>{state.reminderPreference}</Text>
        </View>
        <Divider />
        <View style={styles.infoRow}>
          <Text variant="body">Appearance</Text>
          <Text variant="bodySmall" style={{ color: theme.colors.textSecondary }}>System</Text>
        </View>
      </Card>

      {__DEV__ ? (
        <Card style={styles.devCard}>
          <Text variant="subheading">Developer</Text>
          <Text variant="body" style={{ color: theme.colors.textSecondary }}>
            Clear onboarding state and reset the local daily moment state.
          </Text>
          <Button title="Reset onboarding" variant="secondary" onPress={handleReset} />
          <Button title="Reset today's moment" variant="secondary" onPress={handleResetToday} />
          <Button title="Reset streak" variant="secondary" onPress={handleResetStreak} />
        </Card>
      ) : null}

      <Card style={styles.proCard}>
        <Text variant="subheading">Faith & Me Pro</Text>
        <Text variant="body" style={{ color: theme.colors.textSecondary }}>
          Premium widgets • Unlimited Ask Scripture • Personalization
        </Text>
        <Button title="View Pro" variant="secondary" onPress={() => undefined} />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  profileCard: {
    gap: 12,
    paddingVertical: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  preferenceCard: {
    gap: 8,
    paddingVertical: 16,
  },
  devCard: {
    gap: 12,
    paddingVertical: 18,
  },
  proCard: {
    gap: 12,
    paddingVertical: 18,
  },
});
