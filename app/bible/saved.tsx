import { Stack, useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Button, EditorialLabel, Screen, Text } from '@/components/ui';
import { useAppTheme } from '@/hooks/useAppTheme';
import { scriptureService } from '@/services/scripture/ScriptureService';
import {
  defaultBibleActivityState,
  loadBibleActivityState,
  saveBibleActivityState,
  toggleBibleBookmark,
  toggleBibleHighlight,
  type BibleActivityState,
  type BibleHighlightedVerse,
  type BibleSavedVerse,
} from '@/storage/bibleActivity';

type SavedMode = 'bookmarks' | 'highlights';

function sortSavedVerses<T extends BibleSavedVerse>(verses: T[]): T[] {
  return [...verses].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}

export default function SavedBibleScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const [mode, setMode] = useState<SavedMode>('bookmarks');
  const [activity, setActivity] = useState<BibleActivityState>(defaultBibleActivityState);

  useFocusEffect(
    useCallback(() => {
      void loadBibleActivityState().then(setActivity);
    }, []),
  );

  const bookmarks = useMemo(() => sortSavedVerses(Object.values(activity.bookmarks)), [activity.bookmarks]);
  const highlights = useMemo(() => sortSavedVerses(Object.values(activity.highlights)), [activity.highlights]);
  const visibleVerses = mode === 'bookmarks' ? bookmarks : highlights;

  const persistActivity = async (nextActivity: BibleActivityState) => {
    setActivity(nextActivity);
    await saveBibleActivityState(nextActivity);
  };

  const openVerse = (verse: BibleSavedVerse) => {
    router.push({ pathname: '/bible/[bookId]/[chapter]', params: { bookId: verse.bookId, chapter: String(verse.chapter) } });
  };

  const removeBookmark = async (verse: BibleSavedVerse) => {
    await persistActivity(toggleBibleBookmark(activity, verse));
  };

  const removeHighlight = async (verse: BibleHighlightedVerse) => {
    await persistActivity(toggleBibleHighlight(activity, verse));
  };

  return (
    <Screen contentContainerStyle={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <EditorialLabel>Bible Library</EditorialLabel>
      <Text variant="displaySerif">Saved Scripture</Text>
      <Text variant="body" style={{ color: theme.colors.textSecondary }}>
        Keep verses close while you read. Everything here stays on this device.
      </Text>
      <Button title="Back to Bible" variant="secondary" onPress={() => router.push('/(tabs)/bible')} />

      <View style={[styles.summary, { borderColor: theme.colors.rule }]}>
        <View style={styles.summaryItem}>
          <Text variant="headingSerif">{bookmarks.length}</Text>
          <Text variant="caption" style={{ color: theme.colors.textMuted }}>Bookmarks</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text variant="headingSerif">{highlights.length}</Text>
          <Text variant="caption" style={{ color: theme.colors.textMuted }}>Highlights</Text>
        </View>
      </View>

      <View style={styles.segmentedControl}>
        <SegmentButton label="Bookmarks" selected={mode === 'bookmarks'} onPress={() => setMode('bookmarks')} />
        <SegmentButton label="Highlights" selected={mode === 'highlights'} onPress={() => setMode('highlights')} />
      </View>

      {visibleVerses.length > 0 ? (
        <View style={styles.list}>
          {visibleVerses.map((verse) => {
            const book = scriptureService.getBook(verse.bookId);
            const reference = book ? `${book.name} ${verse.chapter}:${verse.verse}` : verse.reference;
            return (
              <View key={`${mode}-${verse.reference}`} style={[styles.savedRow, { borderColor: theme.colors.rule }]}>
                <Pressable accessibilityRole="button" onPress={() => openVerse(verse)} style={styles.savedCopy}>
                  <EditorialLabel>{reference}</EditorialLabel>
                  <Text variant="headingSerif" style={styles.savedText} numberOfLines={4}>
                    {verse.text}
                  </Text>
                </Pressable>
                <View style={styles.rowActions}>
                  <Button title="Open chapter" variant="secondary" onPress={() => openVerse(verse)} />
                  {mode === 'bookmarks' ? (
                    <Button title="Unsave" variant="ghost" onPress={() => removeBookmark(verse)} />
                  ) : (
                    <Button title="Unhighlight" variant="ghost" onPress={() => removeHighlight(verse as BibleHighlightedVerse)} />
                  )}
                </View>
              </View>
            );
          })}
        </View>
      ) : (
        <View style={[styles.emptyState, { borderColor: theme.colors.rule }]}>
          <Text variant="headingSerif">{mode === 'bookmarks' ? 'No bookmarks yet.' : 'No highlights yet.'}</Text>
          <Text variant="body" style={{ color: theme.colors.textSecondary }}>
            Open a chapter, tap a verse, then save or highlight it here.
          </Text>
          <Button title="Browse Bible" variant="secondary" onPress={() => router.push('/(tabs)/bible')} />
        </View>
      )}
    </Screen>
  );
}

function SegmentButton({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  const theme = useAppTheme();

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.segmentButton,
        {
          backgroundColor: selected ? theme.colors.accentSoft : 'transparent',
          borderColor: selected ? theme.colors.accent : theme.colors.rule,
          opacity: pressed ? 0.84 : 1,
        },
      ]}
    >
      <Text variant="bodySmall" style={{ color: selected ? theme.colors.accent : theme.colors.textSecondary }}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  summary: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: 18,
    paddingVertical: 16,
  },
  summaryItem: {
    flex: 1,
    gap: 3,
  },
  segmentedControl: {
    flexDirection: 'row',
    gap: 10,
  },
  segmentButton: {
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    minHeight: 42,
    paddingHorizontal: 12,
  },
  list: {
    gap: 16,
  },
  savedRow: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 12,
    paddingVertical: 16,
  },
  savedCopy: {
    gap: 8,
  },
  savedText: {
    fontSize: 25,
    lineHeight: 33,
  },
  rowActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  emptyState: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 12,
    paddingVertical: 18,
  },
});
