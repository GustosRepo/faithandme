import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Button, Card, Chip, EditorialLabel, Screen, Text } from '@/components/ui';
import { useOnboarding } from '@/context/OnboardingContext';

const reminderOptions = [
  { label: 'Morning', time: '7:00 AM' },
  { label: 'Afternoon', time: '1:00 PM' },
  { label: 'Evening', time: '8:00 PM' },
  { label: "I'll decide later", time: null },
];

export default function ReminderScreen() {
  const router = useRouter();
  const { state, setReminderPreference } = useOnboarding();
  const selected = reminderOptions.find((option) => option.label === state.reminderPreference)?.label ?? 'Morning';
  const selectedTime = reminderOptions.find((option) => option.label === selected)?.time;

  return (
    <Screen contentContainerStyle={styles.container}>
      <EditorialLabel>Step 4 of 6</EditorialLabel>
      <Text variant="displaySerif">When would you like a moment with God?</Text>

      <Card style={styles.optionCard}>
        <View style={styles.optionGrid}>
          {reminderOptions.map((option) => (
            <Chip
              key={option.label}
              label={option.label}
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
        <Button title="Continue" onPress={() => router.push('/(onboarding)/preview')} />
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
