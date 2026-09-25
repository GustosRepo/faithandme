import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Button, Card, Chip, EditorialLabel, Screen, Text } from '@/components/ui';
import { useLanguage, type TranslationKey } from '@/context/LanguageContext';
import { useOnboarding } from '@/context/OnboardingContext';

const situations = [
  'Anxiety',
  'Relationships',
  'Marriage',
  'Purpose',
  'Temptation',
  'Anger',
  'Grief',
  'Loneliness',
  'Stress',
  'Discipline',
  'Finances',
  'Parenting',
  'Faith',
  'Nothing specific right now',
];

const situationLabelKeys: Record<string, TranslationKey> = {
  Anxiety: 'topics.anxiety',
  Relationships: 'topics.relationships',
  Marriage: 'onboarding.situation.marriage',
  Purpose: 'topics.purpose',
  Temptation: 'onboarding.situation.temptation',
  Anger: 'onboarding.situation.anger',
  Grief: 'onboarding.situation.grief',
  Loneliness: 'onboarding.situation.loneliness',
  Stress: 'onboarding.situation.stress',
  Discipline: 'onboarding.situation.discipline',
  Finances: 'onboarding.situation.finances',
  Parenting: 'onboarding.situation.parenting',
  Faith: 'topics.faith',
  'Nothing specific right now': 'onboarding.situation.none',
};

export default function SituationScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const { state, toggleSituation } = useOnboarding();

  return (
    <Screen contentContainerStyle={styles.container}>
      <EditorialLabel>{t('onboarding.step', { current: 2, total: 6 })}</EditorialLabel>
      <Text variant="displaySerif">{t('onboarding.situation.title')}</Text>
      <Text variant="body" style={styles.subtleText}>{t('onboarding.situation.subtitle')}</Text>

      <Card style={styles.optionCard}>
        <View style={styles.optionGrid}>
          {situations.map((option) => (
            <Chip
              key={option}
              label={t(situationLabelKeys[option])}
              selected={state.situations.includes(option)}
              onPress={() => toggleSituation(option)}
            />
          ))}
        </View>
      </Card>

      <View style={styles.footer}>
        <Button
          title={t('common.continue')}
          disabled={state.situations.length === 0}
          onPress={() => router.push('/(onboarding)/feeling')}
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
