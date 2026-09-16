import { StyleSheet, View } from 'react-native';

import { Button, Chip, Screen, Text } from '@/components/ui';
import { useAppTheme } from '@/hooks/useAppTheme';

const prompts = ['Anxiety', 'Forgiveness', 'Relationships', 'Purpose', 'Money', 'Faith'];

export default function AskScreen() {
  const theme = useAppTheme();

  return (
    <Screen contentContainerStyle={styles.container}>
      <Text variant="display">Ask Scripture</Text>
      <Text variant="body" style={{ color: theme.colors.textSecondary }}>
        What’s on your heart?
      </Text>
      <Text variant="bodySmall" style={{ color: theme.colors.textMuted, marginTop: -4 }}>
        Ask about Scripture, faith, or something you’re going through.
      </Text>

      <View style={styles.composer}>
        <Text variant="body" style={{ color: theme.colors.textMuted }}>
          I’m struggling with...
        </Text>
        <View style={styles.sendButton} accessibilityLabel="Send question" pointerEvents="none">
          <Text variant="caption">→</Text>
        </View>
      </View>

      <Text variant="caption" style={{ color: theme.colors.textMuted, marginTop: 4 }}>
        People often ask
      </Text>

      <View style={styles.suggestionsRow}>
        {prompts.map((prompt) => (
          <Chip key={prompt} label={prompt} onPress={() => undefined} />
        ))}
      </View>

      <Button title="Send" variant="primary" disabled onPress={() => undefined} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 14,
  },
  composer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 76,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#D9CDB7',
    backgroundColor: '#F7F1E7',
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#D9CDB7',
    backgroundColor: '#F1E5D7',
  },
  suggestionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 10,
    columnGap: 10,
    marginTop: 2,
  },
});
