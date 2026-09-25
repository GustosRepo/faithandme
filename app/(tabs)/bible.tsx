import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Button, Divider, EditorialLabel, ProgressBar, Screen, Text } from '@/components/ui';
import { useLanguage } from '@/context/LanguageContext';
import { useAppTheme } from '@/hooks/useAppTheme';
import { getScriptureService } from '@/services/scripture/ScriptureService';
import { defaultBibleActivityState, loadBibleActivityState, type BibleActivityState } from '@/storage/bibleActivity';

export default function BibleScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const { language, t } = useLanguage();
  const scriptureService = getScriptureService(language);
  const metadata = scriptureService.getBibleMetadata();
  const books = scriptureService.getBooks();
  const [activity, setActivity] = useState<BibleActivityState>(defaultBibleActivityState);

  useFocusEffect(
    useCallback(() => {
      void loadBibleActivityState().then(setActivity);
    }, []),
  );

  const lastRead = activity.lastPosition;
  const lastBook = lastRead ? scriptureService.getBook(lastRead.bookId) : undefined;
  const completedCount = Object.values(activity.completedChapters).reduce((total, chapters) => total + chapters.length, 0);
  const savedCount = Object.keys(activity.bookmarks).length;
  const highlightCount = Object.keys(activity.highlights).length;

  return (
    <Screen contentContainerStyle={styles.container}>
      <EditorialLabel>{t('bible.label')}</EditorialLabel>
      <Text variant="displaySerif">{metadata.name}</Text>
      <Text variant="body" style={{ color: theme.colors.textSecondary }}>{metadata.name} · {metadata.abbreviation}</Text>

      <View style={styles.section}>
        <EditorialLabel>{t('bible.continueReading')}</EditorialLabel>
        {lastBook && lastRead ? (
          <View style={[styles.continueBlock, { borderColor: theme.colors.rule }]}>
            <View>
              <Text variant="headingSerif">{lastBook.name}</Text>
              <Text variant="bodySmall" style={{ color: theme.colors.textMuted }}>
                {t('bible.chapter', { chapter: lastRead.chapter })}{lastRead.verse ? `:${lastRead.verse}` : ''}
              </Text>
            </View>
            <Button title={t('bible.continue')} onPress={() => router.push({ pathname: '/bible/[bookId]/[chapter]', params: { bookId: lastBook.id, chapter: String(lastRead.chapter) } })} />
          </View>
        ) : (
          <Text variant="body" style={{ color: theme.colors.textMuted }}>{t('bible.start')}</Text>
        )}
      </View>

      <View style={[styles.statsBlock, { borderColor: theme.colors.rule }]}>
        <View style={styles.statItem}>
          <Text variant="headingSerif">{completedCount}</Text>
          <Text variant="caption" style={{ color: theme.colors.textMuted }}>{t('bible.chaptersRead')}</Text>
        </View>
        <View style={styles.statItem}>
          <Text variant="headingSerif">{savedCount}</Text>
          <Text variant="caption" style={{ color: theme.colors.textMuted }}>{t('bible.bookmarks')}</Text>
        </View>
        <View style={styles.statItem}>
          <Text variant="headingSerif">{highlightCount}</Text>
          <Text variant="caption" style={{ color: theme.colors.textMuted }}>{t('bible.highlights')}</Text>
        </View>
      </View>
      <Button title={t('bible.savedHighlights')} variant="secondary" onPress={() => router.push('/bible/saved')} />

      <Divider />
      {(['OT', 'NT'] as const).map((testament) => (
        <View key={testament} style={styles.group}>
          <EditorialLabel>{testament === 'OT' ? t('bible.oldTestament') : t('bible.newTestament')}</EditorialLabel>
          {books.filter((book) => book.testament === testament).map((book) => {
            const chaptersRead = activity.completedChapters[book.id]?.length ?? 0;
            const progress = chaptersRead / book.chapterCount;
            return (
              <Pressable
                key={book.id}
                onPress={() => router.push({ pathname: '/bible/[bookId]', params: { bookId: book.id } })}
                style={[styles.readingRow, { borderBottomColor: theme.colors.rule }]}
              >
                <View style={styles.rowHeader}>
                  <Text variant="body">{book.name}</Text>
                  <Text variant="bodySmall" style={{ color: theme.colors.textMuted }}>
                    {chaptersRead}/{book.chapterCount}
                  </Text>
                </View>
                <ProgressBar progress={progress} />
              </Pressable>
            );
          })}
        </View>
      ))}
      <Text variant="caption" style={{ color: theme.colors.textMuted }}>{t('bible.sourceNote', { translation: metadata.name, abbreviation: metadata.abbreviation })}</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 14,
  },
  section: { gap: 12, marginTop: 12 },
  statsBlock: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    paddingVertical: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  statItem: {
    flex: 1,
    gap: 3,
  },
  group: { gap: 2, marginBottom: 18 },
  continueBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: 16,
  },
  readingRow: {
    gap: 8,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
});
