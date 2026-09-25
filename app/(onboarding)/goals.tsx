import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Button, Card, Chip, EditorialLabel, Screen, Text } from '@/components/ui';
import { useLanguage, type TranslationKey } from '@/context/LanguageContext';
import { useOnboarding } from '@/context/OnboardingContext';

const goalOptions = [
  'Grow closer to God',
  'Understand the Bible',
  'Build a daily habit',
  'Find guidance',
  'Pray more',
  'Find peace',
  'Get through something difficult',
];

const goalLabelKeys: Record<string, TranslationKey> = {
  'Grow closer to God': 'onboarding.goal.closer',
  'Understand the Bible': 'onboarding.goal.understand',
  'Build a daily habit': 'onboarding.goal.habit',
  'Find guidance': 'onboarding.goal.guidance',
  'Pray more': 'onboarding.goal.pray',
  'Find peace': 'onboarding.goal.peace',
  'Get through something difficult': 'onboarding.goal.difficult',
};

export default function GoalsScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const { state, toggleGoal } = useOnboarding();

  return (
    <Screen contentContainerStyle={styles.container}>
      <EditorialLabel>{t('onboarding.step', { current: 1, total: 6 })}</EditorialLabel>
      <Text variant="displaySerif">{t('onboarding.goals.title')}</Text>
      <Text variant="body" style={styles.subtleText}>{t('onboarding.goals.subtitle')}</Text>

      <Card style={styles.optionCard}>
        <View style={styles.optionGrid}>
          {goalOptions.map((option) => (
            <Chip
              key={option}
              label={t(goalLabelKeys[option])}
              selected={state.goals.includes(option)}
              onPress={() => toggleGoal(option)}
            />
          ))}
        </View>
      </Card>

      <View style={styles.footer}>
        <Button
          title={t('common.continue')}
          disabled={state.goals.length === 0}
          onPress={() => router.push('/(onboarding)/situation')}
        />
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
    maxWidth: 320,
  },
  optionCard: {
    paddingVertical: 18,
  },
  optionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  footer: {
    marginTop: 12,
  },
});
