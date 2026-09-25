import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { BrandMark } from '@/components/BrandMark';
import { Button, EditorialLabel, Screen, Text } from '@/components/ui';
import { useLanguage } from '@/context/LanguageContext';

export default function WelcomeScreen() {
  const router = useRouter();
  const { t } = useLanguage();

  return (
    <Screen contentContainerStyle={styles.container}>
      <BrandMark size="medium" />
      <EditorialLabel>Faith & Me</EditorialLabel>
      <Text variant="displaySerif" style={styles.headline}>{t('onboarding.welcome.title')}</Text>
      <Text variant="body" style={styles.subtleText}>{t('onboarding.welcome.subtitle')}</Text>

      <View style={styles.footer}>
        <Button title={t('onboarding.welcome.start')} onPress={() => router.push('/(onboarding)/goals')} />
        <Text variant="caption" style={styles.helperText}>{t('onboarding.welcome.helper')}</Text>
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
