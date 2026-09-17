import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button, Divider, EditorialLabel, Screen, Text } from '@/components/ui';
import { useOnboarding } from '@/context/OnboardingContext';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useDailySession } from '@/hooks/useDailySession';
import { defaultBibleActivityState, loadBibleActivityState, type BibleActivityState } from '@/storage/bibleActivity';

export default function MeScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const { state, resetOnboarding } = useOnboarding();
  const { resetToday, resetStreak } = useDailySession();
  const [bibleActivity, setBibleActivity] = useState<BibleActivityState>(defaultBibleActivityState);

  useFocusEffect(
    useCallback(() => {
      void loadBibleActivityState().then(setBibleActivity);
    }, []),
  );

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
      <EditorialLabel>Me</EditorialLabel>
      <Text variant="displaySerif">Your walk.</Text>

      <View style={[styles.profileBlock, { borderColor: theme.colors.rule }]}>
        <Text variant="headingSerif">Your Journey</Text>
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
          <Text variant="bodySmall" style={{ color: theme.colors.textSecondary }}>
            {Object.keys(bibleActivity.bookmarks).length}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text variant="body">Highlighted verses</Text>
          <Text variant="bodySmall" style={{ color: theme.colors.textSecondary }}>
            {Object.keys(bibleActivity.highlights).length}
          </Text>
        </View>
        <Button title="Open saved Scripture" variant="secondary" onPress={() => router.push('/bible/saved')} />
      </View>

      <EditorialLabel>Preferences</EditorialLabel>
      <View style={[styles.preferenceBlock, { borderColor: theme.colors.rule }]}>
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
      </View>

      {__DEV__ ? (
        <View style={[styles.devBlock, { borderColor: theme.colors.rule }]}>
          <Text variant="headingSerif">Developer</Text>
          <Text variant="body" style={{ color: theme.colors.textSecondary }}>
            Clear onboarding state and reset the local daily moment state.
          </Text>
          <Button title="Reset onboarding" variant="secondary" onPress={handleReset} />
          <Button title="Reset today's moment" variant="secondary" onPress={handleResetToday} />
          <Button title="Reset streak" variant="secondary" onPress={handleResetStreak} />
        </View>
      ) : null}

      <View style={[styles.proBlock, { borderColor: theme.colors.rule }]}>
        <Text variant="headingSerif">Faith & Me Pro</Text>
        <Text variant="body" style={{ color: theme.colors.textSecondary }}>
          Premium widgets • Unlimited Ask Scripture • Personalization
        </Text>
        <Button title="View Pro" variant="secondary" onPress={() => undefined} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  profileBlock: {
    gap: 12,
    paddingVertical: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  preferenceBlock: {
    gap: 8,
    paddingVertical: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  devBlock: {
    gap: 12,
    paddingVertical: 18,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  proBlock: {
    gap: 12,
    paddingVertical: 18,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
