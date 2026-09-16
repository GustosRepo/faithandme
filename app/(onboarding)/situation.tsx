import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Button, Card, Chip, Screen, Text } from '@/components/ui';
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

export default function SituationScreen() {
  const router = useRouter();
  const { state, toggleSituation } = useOnboarding();

  return (
    <Screen contentContainerStyle={styles.container}>
      <Text variant="caption" style={styles.kicker}>Step 2 of 6</Text>
      <Text variant="display">What are you going through?</Text>
      <Text variant="body" style={styles.subtleText}>You can choose more than one.</Text>

      <Card style={styles.optionCard}>
        <View style={styles.optionGrid}>
          {situations.map((option) => (
            <Chip
              key={option}
              label={option}
              selected={state.situations.includes(option)}
              onPress={() => toggleSituation(option)}
            />
          ))}
        </View>
      </Card>

      <View style={styles.footer}>
        <Button
          title="Continue"
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
