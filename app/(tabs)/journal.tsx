import { StyleSheet, View } from 'react-native';

import { Button, Divider, Screen, SectionHeader, Text } from '@/components/ui';
import { useAppTheme } from '@/hooks/useAppTheme';

const journalEntries = [
  {
    title: 'PRAYER',
    date: 'Today',
    content: 'Lord, help me to trust You in the middle of this uncertainty.',
  },
  {
    title: 'REFLECTION',
    date: 'Yesterday',
    content: 'Today I noticed how small acts of peace changed my mood and my pace.',
  },
  {
    title: 'GRATITUDE',
    date: 'Sep 13',
    content: 'I am thankful for steadiness, stillness, and the people who speak hope into my life.',
  },
];

export default function JournalScreen() {
  const theme = useAppTheme();

  return (
    <Screen contentContainerStyle={styles.container}>
      <Text variant="display">Journal</Text>
      <Text variant="body" style={{ color: theme.colors.textSecondary }}>
        Private reflection and prayer.
      </Text>

      <View style={styles.actionsRow}>
        <Button title="Prayer" variant="secondary" onPress={() => undefined} />
        <Button title="Reflection" variant="secondary" onPress={() => undefined} />
        <Button title="Gratitude" variant="secondary" onPress={() => undefined} />
      </View>

      <SectionHeader title="Recent entries" secondary="Mock data" />
      <View style={styles.entriesList}>
        {journalEntries.map((entry, index) => (
          <View key={entry.title}>
            <View style={styles.entryRow}>
              <Text variant="caption" style={{ color: theme.colors.textMuted }}>{entry.title}</Text>
              <Text variant="caption" style={{ color: theme.colors.textMuted }}>{entry.date}</Text>
            </View>
            <Text variant="body" style={{ color: theme.colors.textSecondary, marginTop: 8 }}>
              “{entry.content}”
            </Text>
            {index < journalEntries.length - 1 ? <Divider /> : null}
          </View>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  entriesList: {
    gap: 12,
    paddingTop: 4,
  },
  entryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
});
