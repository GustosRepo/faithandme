import { Ionicons } from '@expo/vector-icons';
import { Stack, useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Button, Chip, EditorialLabel, Screen, Text } from '@/components/ui';
import { useLanguage } from '@/context/LanguageContext';
import { useAppTheme } from '@/hooks/useAppTheme';
import { getScriptureService } from '@/services/scripture/ScriptureService';
import type { ScriptureProvider } from '@/services/scripture/types';
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

function getSavedReference(verse: BibleSavedVerse, scriptureService: ScriptureProvider) {
  const book = scriptureService.getBook(verse.bookId);
  return book ? `${book.name} ${verse.chapter}:${verse.verse}` : verse.reference;
}

function getSavedText(verse: BibleSavedVerse, scriptureService: ScriptureProvider) {
  return scriptureService.getVerse(verse.reference)?.text ?? verse.text;
}

export default function SavedBibleScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const { language, t } = useLanguage();
  const scriptureService = getScriptureService(language);
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
      getSavedReference(verse, scriptureService),
      verse.reference,
      getSavedText(verse, scriptureService),
      verse.savedKind,
    ].join(' ').toLowerCase().includes(normalizedSearch));
  }, [bookmarks, highlights, mode, normalizedSearch, savedItems, scriptureService]);

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
      <EditorialLabel>{t('savedBible.label')}</EditorialLabel>
      <Text variant="displaySerif">{t('savedBible.title')}</Text>
      <Text variant="body" style={{ color: theme.colors.textSecondary }}>
        {t('savedBible.subtitle')}
      </Text>
      <Button title={t('savedBible.back')} variant="secondary" onPress={() => router.push('/(tabs)/bible')} />

      <View style={[styles.summary, { borderColor: theme.colors.rule }]}>
        <View style={styles.summaryItem}>
          <Text variant="headingSerif">{bookmarks.length}</Text>
          <Text variant="caption" style={{ color: theme.colors.textMuted }}>{t('bible.bookmarks')}</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text variant="headingSerif">{highlights.length}</Text>
          <Text variant="caption" style={{ color: theme.colors.textMuted }}>{t('bible.highlights')}</Text>
        </View>
      </View>

      <View style={[styles.searchBlock, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}>
        <View style={styles.searchRow}>
          <Ionicons name="search-outline" size={17} color={theme.colors.textMuted} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={t('savedBible.search')}
            placeholderTextColor={theme.colors.textMuted}
            style={[styles.searchInput, { color: theme.colors.text }]}
            accessibilityLabel={t('savedBible.searchLabel')}
            returnKeyType="search"
          />
          {searchQuery ? (
            <Pressable accessibilityRole="button" accessibilityLabel={t('savedBible.clearSearch')} hitSlop={10} onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={17} color={theme.colors.textMuted} />
            </Pressable>
          ) : null}
        </View>
        <View style={styles.filtersRow}>
          <Chip label={t('savedBible.all')} selected={mode === 'all'} onPress={() => setMode('all')} />
          <Chip label={t('bible.bookmarks')} selected={mode === 'bookmarks'} onPress={() => setMode('bookmarks')} />
          <Chip label={t('bible.highlights')} selected={mode === 'highlights'} onPress={() => setMode('highlights')} />
        </View>
      </View>

      {visibleVerses.length > 0 ? (
        <View style={styles.list}>
          {visibleVerses.map((verse) => {
            const reference = getSavedReference(verse, scriptureService);
            const text = getSavedText(verse, scriptureService);
            return (
              <View key={`${verse.savedKind}-${verse.reference}`} style={[styles.savedRow, { borderColor: theme.colors.rule }]}>
                <Pressable accessibilityRole="button" onPress={() => openVerse(verse)} style={styles.savedCopy}>
                  <EditorialLabel>{verse.savedKind === 'bookmark' ? t('savedBible.bookmarkLabel') : t('savedBible.highlightLabel')} · {reference}</EditorialLabel>
                  <Text variant="headingSerif" style={styles.savedText} numberOfLines={4}>
                    {text}
                  </Text>
                </Pressable>
                <View style={styles.rowActions}>
                  <Button title={t('savedBible.openChapter')} variant="secondary" onPress={() => openVerse(verse)} />
                  {verse.savedKind === 'bookmark' ? (
                    <Button title={t('bible.unsave')} variant="ghost" onPress={() => removeBookmark(verse)} />
                  ) : (
                    <Button title={t('bible.unhighlight')} variant="ghost" onPress={() => removeHighlight(verse as BibleHighlightedVerse)} />
                  )}
                </View>
              </View>
            );
          })}
        </View>
      ) : (
        <View style={[styles.emptyState, { borderColor: theme.colors.rule }]}>
          <Text variant="headingSerif">{bookmarks.length || highlights.length ? t('journal.noMatchTitle') : t('savedBible.noSavedTitle')}</Text>
          <Text variant="body" style={{ color: theme.colors.textSecondary }}>
            {bookmarks.length || highlights.length ? t('journal.noMatchBody') : t('savedBible.noSavedBody')}
          </Text>
          <Button title={t('savedBible.browse')} variant="secondary" onPress={() => router.push('/(tabs)/bible')} />
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
