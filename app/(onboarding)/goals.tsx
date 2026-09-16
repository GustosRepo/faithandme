import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Button, Card, Chip, Screen, Text } from '@/components/ui';
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

export default function GoalsScreen() {
  const router = useRouter();
  const { state, toggleGoal } = useOnboarding();

  return (
    <Screen contentContainerStyle={styles.container}>
      <Text variant="caption" style={styles.kicker}>Step 1 of 6</Text>
      <Text variant="display">What brings you here?</Text>
      <Text variant="body" style={styles.subtleText}>Choose everything that feels true for you.</Text>

      <Card style={styles.optionCard}>
        <View style={styles.optionGrid}>
          {goalOptions.map((option) => (
            <Chip
              key={option}
              label={option}
              selected={state.goals.includes(option)}
              onPress={() => toggleGoal(option)}
            />
          ))}
        </View>
      </Card>

      <View style={styles.footer}>
        <Button
          title="Continue"
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
  kicker: {
    letterSpacing: 1.4,
    textTransform: 'uppercase',
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
