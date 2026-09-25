import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Button, Card, EditorialLabel, Screen, Text } from '@/components/ui';
import { useLanguage } from '@/context/LanguageContext';

export default function PreviewScreen() {
  const router = useRouter();
  const { t } = useLanguage();

  return (
    <Screen contentContainerStyle={styles.container}>
      <EditorialLabel>{t('onboarding.step', { current: 5, total: 6 })}</EditorialLabel>
      <Text variant="displaySerif">{t('onboarding.preview.title')}</Text>
      <Text variant="body" style={styles.subtleText}>{t('onboarding.preview.subtitle')}</Text>

      <Card style={styles.widgetShell}>
        <View style={styles.widgetPreview}>
          <Text variant="scripture" style={styles.widgetVerse}>{t('onboarding.preview.verse')}</Text>
          <Text variant="scriptureReference" style={styles.widgetReference}>{t('onboarding.preview.reference')}</Text>
          <Text variant="bodySmall" style={styles.widgetBrand}>Faith & Me</Text>
        </View>
      </Card>

      <Text variant="bodySmall" style={styles.subtleText}>{t('onboarding.preview.free')}</Text>

      <View style={styles.footer}>
        <Button title={t('common.continue')} onPress={() => router.push('/(onboarding)/ready')} />
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
    maxWidth: 300,
  },
  widgetShell: {
    padding: 0,
    overflow: 'hidden',
    borderRadius: 28,
  },
  widgetPreview: {
    padding: 22,
    minHeight: 220,
    justifyContent: 'space-between',
    backgroundColor: '#F7F2EA',
  },
  widgetVerse: {
    fontSize: 26,
    lineHeight: 36,
    marginBottom: 8,
    color: '#1E1D1A',
  },
  widgetReference: {
    color: '#4E4945',
    marginTop: 8,
  },
  widgetBrand: {
    alignSelf: 'flex-end',
    color: '#596B4D',
    marginTop: 18,
  },
  footer: {
    marginTop: 12,
  },
});
