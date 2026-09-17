import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Button, Card, Chip, EditorialLabel, Screen, Text } from '@/components/ui';
import { useOnboarding } from '@/context/OnboardingContext';

const feelings = ['Peaceful', 'Grateful', 'Hopeful', 'Anxious', 'Low', 'Frustrated', 'Lonely', 'Lost', 'Prefer not to say'];

export default function FeelingScreen() {
  const router = useRouter();
  const { state, setCurrentFeeling } = useOnboarding();

  return (
    <Screen contentContainerStyle={styles.container}>
      <EditorialLabel>Step 3 of 6</EditorialLabel>
      <Text variant="displaySerif">How are you feeling today?</Text>
      <Text variant="body" style={styles.subtleText}>This helps personalize what you see today.</Text>

      <Card style={styles.optionCard}>
        <View style={styles.optionGrid}>
          {feelings.map((option) => (
            <Chip
              key={option}
              label={option}
              selected={state.currentFeeling === option}
              onPress={() => setCurrentFeeling(option)}
            />
          ))}
        </View>
      </Card>

      <View style={styles.footer}>
        <Button
          title="Continue"
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
