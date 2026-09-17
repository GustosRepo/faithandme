import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Button, EditorialLabel, Screen, Text } from '@/components/ui';
import { useOnboarding } from '@/context/OnboardingContext';
import { useAppTheme } from '@/hooks/useAppTheme';

function deriveFocusChips(state: ReturnType<typeof useOnboarding>['state']): string[] {
  const valueMap: Record<string, string[]> = {
    'Grow closer to God': ['Faith', 'Peace', 'Guidance'],
    'Understand the Bible': ['Guidance', 'Faith', 'Strength'],
    'Build a daily habit': ['Strength', 'Peace', 'Faith'],
    'Find guidance': ['Guidance', 'Faith', 'Hope'],
    'Pray more': ['Faith', 'Peace', 'Hope'],
    'Find peace': ['Peace', 'Hope', 'Faith'],
    'Get through something difficult': ['Strength', 'Hope', 'Peace'],
    Anxiety: ['Peace', 'Strength', 'Hope'],
    Relationships: ['Love', 'Peace', 'Faith'],
    Marriage: ['Love', 'Peace', 'Guidance'],
    Purpose: ['Guidance', 'Faith', 'Courage'],
    Temptation: ['Strength', 'Guidance', 'Faith'],
    Anger: ['Peace', 'Forgiveness', 'Guidance'],
    Grief: ['Peace', 'Hope', 'Faith'],
    Loneliness: ['Love', 'Hope', 'Peace'],
    Stress: ['Peace', 'Strength', 'Hope'],
    Discipline: ['Strength', 'Guidance', 'Faith'],
    Finances: ['Peace', 'Guidance', 'Strength'],
    Parenting: ['Peace', 'Guidance', 'Faith'],
    Faith: ['Faith', 'Guidance', 'Hope'],
  };

  const combined = [...state.goals, ...state.situations]
    .flatMap((entry) => valueMap[entry] ?? [])
    .filter(Boolean);

  return Array.from(new Set(combined)).slice(0, 3);
}

export default function ReadyScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const { completeOnboarding, state } = useOnboarding();
  const focusChips = deriveFocusChips(state);

  const summary =
    state.situations.includes('Anxiety')
      ? "We'll help you make space for peace, Scripture, and reflection each day."
      : state.situations.includes('Purpose')
        ? "We'll help you make space for guidance, Scripture, and intentional reflection."
        : state.goals.includes('Find peace')
          ? "We'll help you make space for peace, Scripture, and steady hope."
          : "We'll help you make space for Scripture, prayer, and reflection each day.";

  const handleStart = () => {
    completeOnboarding();
    router.replace('/(tabs)');
  };

  return (
    <Screen contentContainerStyle={styles.container}>
      <EditorialLabel>Step 6 of 6</EditorialLabel>
      <Text variant="displaySerif">Faith & Me is ready for you.</Text>
      <Text variant="body" style={styles.subtleText}>{summary}</Text>

      <View style={styles.focusBlock}>
        <EditorialLabel>Your Focus</EditorialLabel>
        <View style={styles.chipRow}>
          {focusChips.length > 0 ? (
            focusChips.map((chip) => (
              <View key={chip} style={[styles.focusChip, { borderColor: theme.colors.rule }]}>
                <Text variant="bodySmall">{chip}</Text>
              </View>
            ))
          ) : (
            <View style={[styles.focusChip, { borderColor: theme.colors.rule }]}>
              <Text variant="bodySmall">Peace</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.footer}>
        <Button title="Start my journey" onPress={handleStart} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'space-between',
    gap: 18,
  },
  subtleText: {
    maxWidth: 300,
  },
  focusBlock: {
    gap: 12,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  focusChip: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
  },
  footer: {
    marginTop: 12,
  },
});
