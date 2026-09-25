import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Button, Card, Chip, EditorialLabel, Screen, Text } from '@/components/ui';
import { useLanguage, type TranslationKey } from '@/context/LanguageContext';
import { useOnboarding } from '@/context/OnboardingContext';

const feelings = ['Peaceful', 'Grateful', 'Hopeful', 'Anxious', 'Low', 'Frustrated', 'Lonely', 'Lost', 'Prefer not to say'];

const feelingLabelKeys: Record<string, TranslationKey> = {
  Peaceful: 'onboarding.feeling.peaceful',
  Grateful: 'onboarding.feeling.grateful',
  Hopeful: 'onboarding.feeling.hopeful',
  Anxious: 'onboarding.feeling.anxious',
  Low: 'onboarding.feeling.low',
  Frustrated: 'onboarding.feeling.frustrated',
  Lonely: 'onboarding.feeling.lonely',
  Lost: 'onboarding.feeling.lost',
  'Prefer not to say': 'onboarding.feeling.skip',
};

export default function FeelingScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const { state, setCurrentFeeling } = useOnboarding();

  return (
    <Screen contentContainerStyle={styles.container}>
      <EditorialLabel>{t('onboarding.step', { current: 3, total: 6 })}</EditorialLabel>
      <Text variant="displaySerif">{t('onboarding.feeling.title')}</Text>
      <Text variant="body" style={styles.subtleText}>{t('onboarding.feeling.subtitle')}</Text>

      <Card style={styles.optionCard}>
        <View style={styles.optionGrid}>
          {feelings.map((option) => (
            <Chip
              key={option}
              label={t(feelingLabelKeys[option])}
              selected={state.currentFeeling === option}
              onPress={() => setCurrentFeeling(option)}
            />
          ))}
        </View>
      </Card>

      <View style={styles.footer}>
        <Button
          title={t('common.continue')}
          disabled={!state.currentFeeling}
          onPress={() => router.push('/(onboarding)/reminder')}
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
