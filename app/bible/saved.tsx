import { Ionicons } from '@expo/vector-icons';
import { Stack, useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Button, Chip, EditorialLabel, Screen, Text } from '@/components/ui';
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

type SavedMode = 'all' | 'bookmarks' | 'highlights';
type SavedVerseItem = BibleSavedVerse & {
  savedKind: 'bookmark' | 'highlight';
  color?: BibleHighlightedVerse['color'];
};

function sortSavedVerses<T extends BibleSavedVerse>(verses: T[]): T[] {
  return [...verses].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}

function getSavedReference(verse: BibleSavedVerse) {
  const book = scriptureService.getBook(verse.bookId);
  return book ? `${book.name} ${verse.chapter}:${verse.verse}` : verse.reference;
}

export default function SavedBibleScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const [mode, setMode] = useState<SavedMode>('all');
  const [activity, setActivity] = useState<BibleActivityState>(defaultBibleActivityState);
  const [searchQuery, setSearchQuery] = useState('');

  useFocusEffect(
    useCallback(() => {
      void loadBibleActivityState().then(setActivity);
    }, []),
  );

  const bookmarks = useMemo(() => sortSavedVerses(Object.values(activity.bookmarks)), [activity.bookmarks]);
  const highlights = useMemo(() => sortSavedVerses(Object.values(activity.highlights)), [activity.highlights]);
  const savedItems = useMemo<SavedVerseItem[]>(() => {
    const bookmarkItems = bookmarks.map((verse): SavedVerseItem => ({ ...verse, savedKind: 'bookmark' }));
    const highlightItems = highlights.map((verse): SavedVerseItem => ({ ...verse, savedKind: 'highlight', color: verse.color }));
    return sortSavedVerses([...bookmarkItems, ...highlightItems]);
  }, [bookmarks, highlights]);
  const normalizedSearch = searchQuery.trim().toLowerCase();
  const visibleVerses = useMemo(() => {
    const base = mode === 'all'
      ? savedItems
      : mode === 'bookmarks'
        ? bookmarks.map((verse): SavedVerseItem => ({ ...verse, savedKind: 'bookmark' }))
        : highlights.map((verse): SavedVerseItem => ({ ...verse, savedKind: 'highlight', color: verse.color }));

    if (!normalizedSearch) return base;

    return base.filter((verse) => [
      getSavedReference(verse),
      verse.reference,
      verse.text,
      verse.savedKind,
    ].join(' ').toLowerCase().includes(normalizedSearch));
  }, [bookmarks, highlights, mode, normalizedSearch, savedItems]);

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

      <View style={[styles.searchBlock, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}>
        <View style={styles.searchRow}>
          <Ionicons name="search-outline" size={17} color={theme.colors.textMuted} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search saved Scripture"
            placeholderTextColor={theme.colors.textMuted}
            style={[styles.searchInput, { color: theme.colors.text }]}
            accessibilityLabel="Search saved Scripture"
            returnKeyType="search"
          />
          {searchQuery ? (
            <Pressable accessibilityRole="button" accessibilityLabel="Clear saved Scripture search" hitSlop={10} onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={17} color={theme.colors.textMuted} />
            </Pressable>
          ) : null}
        </View>
        <View style={styles.filtersRow}>
          <Chip label="All" selected={mode === 'all'} onPress={() => setMode('all')} />
          <Chip label="Bookmarks" selected={mode === 'bookmarks'} onPress={() => setMode('bookmarks')} />
          <Chip label="Highlights" selected={mode === 'highlights'} onPress={() => setMode('highlights')} />
        </View>
      </View>

      {visibleVerses.length > 0 ? (
        <View style={styles.list}>
          {visibleVerses.map((verse) => {
            const reference = getSavedReference(verse);
            return (
              <View key={`${verse.savedKind}-${verse.reference}`} style={[styles.savedRow, { borderColor: theme.colors.rule }]}>
                <Pressable accessibilityRole="button" onPress={() => openVerse(verse)} style={styles.savedCopy}>
                  <EditorialLabel>{verse.savedKind === 'bookmark' ? 'BOOKMARK' : 'HIGHLIGHT'} · {reference}</EditorialLabel>
                  <Text variant="headingSerif" style={styles.savedText} numberOfLines={4}>
                    {verse.text}
                  </Text>
                </Pressable>
                <View style={styles.rowActions}>
                  <Button title="Open chapter" variant="secondary" onPress={() => openVerse(verse)} />
                  {verse.savedKind === 'bookmark' ? (
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
          <Text variant="headingSerif">{bookmarks.length || highlights.length ? 'Nothing matched.' : 'No saved Scripture yet.'}</Text>
          <Text variant="body" style={{ color: theme.colors.textSecondary }}>
            {bookmarks.length || highlights.length ? 'Try a different word or filter.' : 'Open a chapter, tap a verse, then save or highlight it here.'}
          </Text>
          <Button title="Browse Bible" variant="secondary" onPress={() => router.push('/(tabs)/bible')} />
        </View>
      )}
    </Screen>
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
  searchBlock: {
    borderWidth: 1,
    borderRadius: 12,
    gap: 12,
    padding: 14,
  },
  searchRow: {
    minHeight: 36,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  searchInput: {
    flex: 1,
    padding: 0,
    fontSize: 16,
    lineHeight: 22,
  },
  filtersRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
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
