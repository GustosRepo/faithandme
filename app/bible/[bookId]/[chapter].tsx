import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { Button, EditorialLabel, Screen, Text } from '@/components/ui';
import { useAppTheme } from '@/hooks/useAppTheme';
import { scriptureService } from '@/services/scripture/ScriptureService';
import type { BibleVerse } from '@/services/scripture/types';
import {
  defaultBibleActivityState,
  loadBibleActivityState,
  markBibleChapterComplete,
  recordBibleReadingPosition,
  saveBibleActivityState,
  toggleBibleBookmark,
  toggleBibleHighlight,
  updateBibleReaderSettings,
  type BibleActivityState,
} from '@/storage/bibleActivity';
import { saveBibleReadingPosition } from '@/storage/bibleReading';

const highlightColor = 'rgba(181, 192, 154, 0.18)';

function getReaderFont(fontFamily: 'serif' | 'sans') {
  if (fontFamily === 'sans') {
    return Platform.select({ ios: 'System', android: 'sans-serif', web: 'system-ui' });
  }

  return Platform.select({ ios: 'Georgia', android: 'serif', web: 'Georgia' });
}

export default function BibleChapterScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const { bookId, chapter: chapterParam } = useLocalSearchParams<{ bookId: string; chapter: string }>();
  const chapterNumber = Number(chapterParam);
  const book = scriptureService.getBook(bookId ?? '');
  const chapter = scriptureService.getChapter(bookId ?? '', chapterNumber);
  const [activity, setActivity] = useState<BibleActivityState>(defaultBibleActivityState);
  const [selectedReference, setSelectedReference] = useState<string | null>(null);

  useEffect(() => {
    if (!book || !chapter) return;

    void loadBibleActivityState().then(async (loaded) => {
      const next = recordBibleReadingPosition(loaded, { bookId: book.id, chapter: chapter.chapter });
      setActivity(next);
      await saveBibleActivityState(next);
      await saveBibleReadingPosition({ bookId: book.id, chapter: chapter.chapter });
    });
  }, [book, chapter]);

  if (!book || !chapter) return <Screen background="plain"><Text variant="heading">Chapter unavailable.</Text></Screen>;
  const previous = chapter.chapter > 1 ? chapter.chapter - 1 : null;
  const next = chapter.chapter < book.chapterCount ? chapter.chapter + 1 : null;
  const openChapter = (number: number) => router.replace({ pathname: '/bible/[bookId]/[chapter]', params: { bookId: book.id, chapter: String(number) } });
  const selectedVerse = selectedReference ? chapter.verses.find((verse) => verse.reference === selectedReference) : null;
  const chapterComplete = Boolean(activity.completedChapters[book.id]?.includes(chapter.chapter));
  const readerFont = useMemo(() => getReaderFont(activity.readerSettings.fontFamily), [activity.readerSettings.fontFamily]);
  const savedInChapter = chapter.verses.filter((verse) => activity.bookmarks[verse.reference]).length;
  const highlightedInChapter = chapter.verses.filter((verse) => activity.highlights[verse.reference]).length;
  const completedInBook = activity.completedChapters[book.id]?.length ?? 0;
  const bookProgress = completedInBook / book.chapterCount;

  const persistActivity = async (nextActivity: BibleActivityState) => {
    setActivity(nextActivity);
    await saveBibleActivityState(nextActivity);
  };

  const handleVersePress = async (verse: BibleVerse) => {
    setSelectedReference((current) => current === verse.reference ? null : verse.reference);
    await persistActivity(recordBibleReadingPosition(activity, { bookId: book.id, chapter: chapter.chapter, verse: verse.verse }));
  };

  const handleBookmark = async () => {
    if (!selectedVerse) return;
    await persistActivity(toggleBibleBookmark(activity, selectedVerse));
  };

  const handleHighlight = async () => {
    if (!selectedVerse) return;
    await persistActivity(toggleBibleHighlight(activity, selectedVerse));
  };

  const handleMarkComplete = async () => {
    await persistActivity(markBibleChapterComplete(activity, book.id, chapter.chapter));
  };

  const handleFontSizeChange = async (delta: number) => {
    const fontSize = Math.min(Math.max(activity.readerSettings.fontSize + delta, 16), 22);
    await persistActivity(updateBibleReaderSettings(activity, { fontSize, lineHeight: Math.round(fontSize * 1.72) }));
  };

  const handleToggleFont = async () => {
    await persistActivity(updateBibleReaderSettings(activity, { fontFamily: activity.readerSettings.fontFamily === 'serif' ? 'sans' : 'serif' }));
  };

  return (
    <Screen background="plain" contentContainerStyle={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <EditorialLabel>Berean Standard Bible · BSB</EditorialLabel>
      <Text variant="displaySerif" style={styles.bookTitle}>{book.name}</Text>
      <Text variant="headingSerif" style={{ color: theme.colors.textSecondary }}>Chapter {chapter.chapter}</Text>

      <View style={[styles.progressPanel, { borderColor: theme.colors.rule }]}>
        <View style={styles.progressHeader}>
          <Text variant="bodySmall" style={{ color: theme.colors.textSecondary }}>
            {completedInBook} of {book.chapterCount} chapters read
          </Text>
          <Text variant="caption" style={{ color: theme.colors.textMuted }}>
            {Math.round(bookProgress * 100)}%
          </Text>
        </View>
        <View style={[styles.readerProgressTrack, { backgroundColor: theme.colors.surfaceSecondary }]}>
          <View style={[styles.readerProgressFill, { width: `${Math.min(Math.max(bookProgress, 0), 1) * 100}%`, backgroundColor: theme.colors.accent }]} />
        </View>
        <View style={styles.chapterStats}>
          <Text variant="caption" style={{ color: theme.colors.textMuted }}>{highlightedInChapter} highlighted</Text>
          <Text variant="caption" style={{ color: theme.colors.textMuted }}>{savedInChapter} bookmarked</Text>
        </View>
      </View>

      <View style={[styles.readerTools, { borderColor: theme.colors.rule }]}>
        <ToolPill label="A-" onPress={() => handleFontSizeChange(-1)} />
        <Text variant="caption" style={{ color: theme.colors.textMuted }}>
          {activity.readerSettings.fontSize}px
        </Text>
        <ToolPill label="A+" onPress={() => handleFontSizeChange(1)} />
        <ToolPill label={activity.readerSettings.fontFamily === 'serif' ? 'Serif' : 'Sans'} onPress={handleToggleFont} selected />
      </View>

      {selectedVerse ? (
        <View style={[styles.selectionBar, { borderColor: theme.colors.rule }]}>
          <View style={styles.selectionCopy}>
            <EditorialLabel>{book.name} {chapter.chapter}:{selectedVerse.verse}</EditorialLabel>
            <Text variant="bodySmall" style={{ color: theme.colors.textSecondary }} numberOfLines={2}>
              {selectedVerse.text}
            </Text>
          </View>
          <View style={styles.selectionActions}>
            <Button
              title={activity.highlights[selectedVerse.reference] ? 'Unhighlight' : 'Highlight'}
              variant="secondary"
              onPress={handleHighlight}
            />
            <Button
              title={activity.bookmarks[selectedVerse.reference] ? 'Unsave' : 'Bookmark'}
              variant="secondary"
              onPress={handleBookmark}
            />
          </View>
        </View>
      ) : null}

      <View style={[styles.verses, { borderColor: theme.colors.rule }]}>
        {chapter.verses.map((verse) => (
          <Pressable
            key={verse.reference}
            onPress={() => handleVersePress(verse)}
            style={[
              styles.verseRow,
              {
                backgroundColor: activity.highlights[verse.reference] ? highlightColor : 'transparent',
                borderColor: selectedReference === verse.reference ? theme.colors.accent : 'transparent',
              },
            ]}
          >
            <Text
              maxFontSizeMultiplier={1.12}
              variant="body"
              style={[
                styles.verse,
                {
                  fontFamily: readerFont,
                  fontSize: activity.readerSettings.fontSize,
                  lineHeight: activity.readerSettings.lineHeight,
                },
              ]}
            >
              <Text
                maxFontSizeMultiplier={1.05}
                variant="caption"
                style={[styles.number, { color: theme.colors.accent }]}
              >
                {verse.verse}{' '}
              </Text>
              {verse.text}
            </Text>
            {activity.bookmarks[verse.reference] ? (
              <Text variant="caption" style={[styles.savedLabel, { color: theme.colors.accent }]}>Bookmarked</Text>
            ) : null}
          </Pressable>
        ))}
      </View>
      <Button
        title={chapterComplete ? 'Chapter marked read' : 'Mark chapter read'}
        variant={chapterComplete ? 'secondary' : 'primary'}
        onPress={handleMarkComplete}
      />
      <View style={styles.navigation}>
        <Button title="Previous Chapter" variant="secondary" disabled={!previous} onPress={() => previous && openChapter(previous)} />
        <Button title="Next Chapter" disabled={!next} onPress={() => next && openChapter(next)} />
      </View>
      <Text variant="caption" style={[styles.about, { color: theme.colors.textMuted }]}>Berean Standard Bible (BSB). Dedicated to the public domain at berean.bible.</Text>
    </Screen>
  );
}

function ToolPill({ label, onPress, selected = false }: { label: string; onPress: () => void; selected?: boolean }) {
  const theme = useAppTheme();

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.toolPill,
        {
          backgroundColor: selected ? theme.colors.accentSoft : 'transparent',
          borderColor: selected ? theme.colors.accent : theme.colors.rule,
          opacity: pressed ? 0.82 : 1,
        },
      ]}
    >
      <Text variant="caption" style={{ color: selected ? theme.colors.accent : theme.colors.textSecondary }}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { gap: 14, paddingHorizontal: 26 },
  bookTitle: { marginTop: 6 },
  progressPanel: {
    gap: 9,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingVertical: 12,
  },
  progressHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  readerProgressTrack: {
    height: 8,
    overflow: 'hidden',
    borderRadius: 999,
  },
  readerProgressFill: {
    height: '100%',
    borderRadius: 999,
  },
  chapterStats: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  verses: {
    gap: 10,
    marginTop: 12,
    paddingTop: 22,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  verseRow: {
    gap: 4,
    borderLeftWidth: 3,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 9,
  },
  verse: {
    fontWeight: '400',
  },
  number: {
    fontSize: 12,
    lineHeight: 20,
    fontWeight: '700',
  },
  savedLabel: {
    alignSelf: 'flex-start',
  },
  readerTools: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'flex-start',
    paddingBottom: 4,
  },
  toolPill: {
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 34,
    minWidth: 48,
    paddingHorizontal: 12,
  },
  selectionBar: {
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingVertical: 14,
  },
  selectionCopy: {
    gap: 6,
  },
  selectionActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  navigation: { gap: 10, marginTop: 20 },
  about: { lineHeight: 18, marginTop: 8 },
});
