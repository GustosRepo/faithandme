import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Button, EditorialLabel, Screen, Text } from '@/components/ui';
import { useLanguage, type TranslationKey } from '@/context/LanguageContext';
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

const focusLabelKeys: Record<string, TranslationKey> = {
  Faith: 'topics.faith',
  Peace: 'topics.peace',
  Guidance: 'topics.guidance',
  Strength: 'topics.strength',
  Hope: 'topics.hope',
  Love: 'topics.love',
  Courage: 'topics.courage',
  Forgiveness: 'topics.forgiveness',
};

export default function ReadyScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const { t } = useLanguage();
  const { completeOnboarding, state } = useOnboarding();
  const focusChips = deriveFocusChips(state);

  const summary =
    state.situations.includes('Anxiety')
      ? t('onboarding.ready.summary.anxiety')
      : state.situations.includes('Purpose')
        ? t('onboarding.ready.summary.purpose')
        : state.goals.includes('Find peace')
          ? t('onboarding.ready.summary.peace')
          : t('onboarding.ready.summary.default');

  const handleStart = () => {
    completeOnboarding();
    router.replace('/(tabs)');
  };

  return (
    <Screen contentContainerStyle={styles.container}>
      <EditorialLabel>{t('onboarding.step', { current: 6, total: 6 })}</EditorialLabel>
      <Text variant="displaySerif">{t('onboarding.ready.title')}</Text>
      <Text variant="body" style={styles.subtleText}>{summary}</Text>

      <View style={styles.focusBlock}>
        <EditorialLabel>{t('onboarding.ready.focus')}</EditorialLabel>
        <View style={styles.chipRow}>
          {focusChips.length > 0 ? (
            focusChips.map((chip) => (
              <View key={chip} style={[styles.focusChip, { borderColor: theme.colors.rule }]}>
                <Text variant="bodySmall">{t(focusLabelKeys[chip])}</Text>
              </View>
            ))
          ) : (
            <View style={[styles.focusChip, { borderColor: theme.colors.rule }]}>
              <Text variant="bodySmall">{t('topics.peace')}</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.footer}>
        <Button title={t('onboarding.ready.start')} onPress={handleStart} />
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
