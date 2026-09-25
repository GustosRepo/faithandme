import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Button, Card, Chip, EditorialLabel, Screen, Text } from '@/components/ui';
import { useLanguage, type TranslationKey } from '@/context/LanguageContext';
import { useOnboarding } from '@/context/OnboardingContext';

const reminderOptions = [
  { label: 'Morning', labelKey: 'onboarding.reminder.morning', time: '7:00 AM' },
  { label: 'Afternoon', labelKey: 'onboarding.reminder.afternoon', time: '1:00 PM' },
  { label: 'Evening', labelKey: 'onboarding.reminder.evening', time: '8:00 PM' },
  { label: "I'll decide later", labelKey: 'onboarding.reminder.later', time: null },
] as const satisfies ReadonlyArray<{ label: string; labelKey: TranslationKey; time: string | null }>;

export default function ReminderScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const { state, setReminderPreference } = useOnboarding();
  const selected = reminderOptions.find((option) => option.label === state.reminderPreference)?.label ?? 'Morning';
  const selectedTime = reminderOptions.find((option) => option.label === selected)?.time;

  return (
    <Screen contentContainerStyle={styles.container}>
      <EditorialLabel>{t('onboarding.step', { current: 4, total: 6 })}</EditorialLabel>
      <Text variant="displaySerif">{t('onboarding.reminder.title')}</Text>

      <Card style={styles.optionCard}>
        <View style={styles.optionGrid}>
          {reminderOptions.map((option) => (
            <Chip
              key={option.label}
              label={t(option.labelKey)}
              selected={state.reminderPreference === option.label}
              onPress={() => setReminderPreference(option.label)}
            />
          ))}
        </View>
        {selectedTime ? (
          <Text variant="bodySmall" style={styles.timeHint}>{selectedTime}</Text>
        ) : null}
      </Card>

      <View style={styles.footer}>
        <Button title={t('common.continue')} onPress={() => router.push('/(onboarding)/preview')} />
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
  optionCard: {
    paddingVertical: 18,
    gap: 12,
  },
  optionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  timeHint: {
    alignSelf: 'flex-start',
  },
  footer: {
    marginTop: 12,
  },
});
