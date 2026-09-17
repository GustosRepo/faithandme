import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { BrandMark } from '@/components/BrandMark';
import { Button, EditorialLabel, Screen, Text } from '@/components/ui';

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <Screen contentContainerStyle={styles.container}>
      <BrandMark size="medium" />
      <EditorialLabel>Faith & Me</EditorialLabel>
      <Text variant="displaySerif" style={styles.headline}>Scripture for what you're going through.</Text>
      <Text variant="body" style={styles.subtleText}>Take a few moments to make Faith & Me yours.</Text>

      <View style={styles.footer}>
        <Button title="Get Started" onPress={() => router.push('/(onboarding)/goals')} />
        <Text variant="caption" style={styles.helperText}>You can change these choices later.</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    gap: 18,
  },
  headline: {
    maxWidth: 340,
  },
  subtleText: {
    maxWidth: 320,
  },
  footer: {
    marginTop: 8,
    gap: 10,
  },
  helperText: {
    textAlign: 'center',
    opacity: 0.8,
  },
});
