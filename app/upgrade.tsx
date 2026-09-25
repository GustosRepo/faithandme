import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { Button, Divider, EditorialLabel, Screen, Text } from '@/components/ui';
import { useAppTheme } from '@/hooks/useAppTheme';

const plusFeatures = [
  {
    icon: 'sparkles-outline',
    title: 'More Ask Scripture each day',
    body: 'A higher daily limit with room for follow-up questions like go deeper, context, prayer, and a 3-day plan.',
  },
  {
    icon: 'journal-outline',
    title: 'Guided reflection tools',
    body: 'Journal prompts, search, filters, and saved Ask answers that help you return to what God has been showing you.',
  },
  {
    icon: 'leaf-outline',
    title: 'Weekly review and paths',
    body: 'Spiritual reviews and devotional paths for themes like anxiety, forgiveness, purpose, grief, and trust.',
  },
] as const;

const freeStaysFree = [
  'Full Bible access',
  'Daily 5 Minutes With God',
  'Basic Journal',
  'Saved Scripture and highlights',
  'Safety support',
];

export default function UpgradeScreen() {
  const theme = useAppTheme();
  const router = useRouter();

  const handleStartUpgrade = () => {
    Alert.alert(
      'Subscription setup coming next',
      'The upgrade path is visible now. App Store subscription products and purchase handling still need to be wired before release.',
    );
  };

  return (
    <Screen contentContainerStyle={styles.container}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Close upgrade"
        hitSlop={10}
        onPress={() => router.back()}
        style={({ pressed }) => [styles.closeButton, { backgroundColor: theme.colors.surfaceSecondary, opacity: pressed ? 0.75 : 1 }]}
      >
        <Ionicons name="close" size={18} color={theme.colors.textSecondary} />
      </Pressable>

      <View style={styles.hero}>
        <EditorialLabel>Faith & Me Plus</EditorialLabel>
        <Text variant="displaySerif">More Ask Scripture + guided reflection tools.</Text>
        <Text variant="body" style={{ color: theme.colors.textSecondary }}>
          Plus is for depth, continuity, and convenience. The essentials stay free.
        </Text>
      </View>

      <View style={[styles.planBlock, { borderColor: theme.colors.rule }]}>
        <View style={styles.planHeader}>
          <View>
            <Text variant="headingSerif">Plus</Text>
            <Text variant="bodySmall" style={{ color: theme.colors.textSecondary }}>Planned subscription</Text>
          </View>
          <Text variant="headingSerif">$4.99/mo</Text>
        </View>
        <Divider />
        {plusFeatures.map((feature) => (
          <View key={feature.title} style={styles.featureRow}>
            <View style={[styles.featureIcon, { backgroundColor: theme.colors.accentSoft }]}>
              <Ionicons name={feature.icon} size={18} color={theme.colors.accent} />
            </View>
            <View style={styles.featureText}>
              <Text variant="body">{feature.title}</Text>
              <Text variant="bodySmall" style={{ color: theme.colors.textSecondary }}>{feature.body}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={[styles.freeBlock, { borderColor: theme.colors.rule }]}>
        <EditorialLabel>Always free</EditorialLabel>
        <View style={styles.freeGrid}>
          {freeStaysFree.map((item) => (
            <View key={item} style={styles.freeItem}>
              <Ionicons name="checkmark-circle-outline" size={17} color={theme.colors.success} />
              <Text variant="bodySmall" style={{ color: theme.colors.textSecondary }}>{item}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.actions}>
        <Button title="Start upgrade" onPress={handleStartUpgrade} />
        <Button title="Restore purchase" variant="secondary" onPress={handleStartUpgrade} />
      </View>

      <Text variant="caption" style={{ color: theme.colors.textMuted }}>
        Purchase handling is not active yet. This screen is ready for RevenueCat/App Store subscription wiring.
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
