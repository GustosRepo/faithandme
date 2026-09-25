import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { Button, Divider, EditorialLabel, Screen, Text } from '@/components/ui';
import { useLanguage } from '@/context/LanguageContext';
import { useAppTheme } from '@/hooks/useAppTheme';

const plusFeatures = [
  {
    icon: 'sparkles-outline',
    titleKey: 'upgrade.feature.ask.title',
    bodyKey: 'upgrade.feature.ask.body',
  },
  {
    icon: 'journal-outline',
    titleKey: 'upgrade.feature.journal.title',
    bodyKey: 'upgrade.feature.journal.body',
  },
  {
    icon: 'leaf-outline',
    titleKey: 'upgrade.feature.paths.title',
    bodyKey: 'upgrade.feature.paths.body',
  },
] as const;

const freeStaysFree = [
  'upgrade.free.bible',
  'upgrade.free.daily',
  'upgrade.free.journal',
  'upgrade.free.saved',
  'upgrade.free.safety',
] as const;

export default function UpgradeScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const { t } = useLanguage();

  const handleStartUpgrade = () => {
    Alert.alert(
      t('upgrade.alert.title'),
      t('upgrade.alert.body'),
    );
  };

  return (
    <Screen contentContainerStyle={styles.container}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('upgrade.close')}
        hitSlop={10}
        onPress={() => router.back()}
        style={({ pressed }) => [styles.closeButton, { backgroundColor: theme.colors.surfaceSecondary, opacity: pressed ? 0.75 : 1 }]}
      >
        <Ionicons name="close" size={18} color={theme.colors.textSecondary} />
      </Pressable>

      <View style={styles.hero}>
        <EditorialLabel>{t('upgrade.label')}</EditorialLabel>
        <Text variant="displaySerif">{t('upgrade.title')}</Text>
        <Text variant="body" style={{ color: theme.colors.textSecondary }}>
          {t('upgrade.subtitle')}
        </Text>
      </View>

      <View style={[styles.planBlock, { borderColor: theme.colors.rule }]}>
        <View style={styles.planHeader}>
          <View>
            <Text variant="headingSerif">{t('upgrade.planName')}</Text>
            <Text variant="bodySmall" style={{ color: theme.colors.textSecondary }}>{t('upgrade.plannedSubscription')}</Text>
          </View>
          <Text variant="headingSerif">{t('upgrade.price')}</Text>
        </View>
        <Divider />
        {plusFeatures.map((feature) => (
          <View key={feature.titleKey} style={styles.featureRow}>
            <View style={[styles.featureIcon, { backgroundColor: theme.colors.accentSoft }]}>
              <Ionicons name={feature.icon} size={18} color={theme.colors.accent} />
            </View>
            <View style={styles.featureText}>
              <Text variant="body">{t(feature.titleKey)}</Text>
              <Text variant="bodySmall" style={{ color: theme.colors.textSecondary }}>{t(feature.bodyKey)}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={[styles.freeBlock, { borderColor: theme.colors.rule }]}>
        <EditorialLabel>{t('upgrade.alwaysFree')}</EditorialLabel>
        <View style={styles.freeGrid}>
          {freeStaysFree.map((item) => (
            <View key={item} style={styles.freeItem}>
              <Ionicons name="checkmark-circle-outline" size={17} color={theme.colors.success} />
              <Text variant="bodySmall" style={{ color: theme.colors.textSecondary }}>{t(item)}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.actions}>
        <Button title={t('upgrade.start')} onPress={handleStartUpgrade} />
        <Button title={t('upgrade.restore')} variant="secondary" onPress={handleStartUpgrade} />
      </View>

      <Text variant="caption" style={{ color: theme.colors.textMuted }}>
        {t('upgrade.disclaimer')}
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 18,
    paddingBottom: 92,
  },
  closeButton: {
    alignSelf: 'flex-end',
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hero: {
    gap: 10,
  },
  planBlock: {
    gap: 14,
    paddingVertical: 18,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 16,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  featureIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: {
    flex: 1,
    gap: 3,
  },
  freeBlock: {
    gap: 12,
    paddingVertical: 18,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  freeGrid: {
    gap: 10,
  },
  freeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  actions: {
    gap: 10,
  },
});
