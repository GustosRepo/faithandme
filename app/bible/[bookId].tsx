import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { EditorialLabel, ProgressBar, Screen, Text } from '@/components/ui';
import { useAppTheme } from '@/hooks/useAppTheme';
import { scriptureService } from '@/services/scripture/ScriptureService';
import { defaultBibleActivityState, loadBibleActivityState, type BibleActivityState } from '@/storage/bibleActivity';

export default function BibleBookScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const { bookId } = useLocalSearchParams<{ bookId: string }>();
  const [activity, setActivity] = useState<BibleActivityState>(defaultBibleActivityState);
  const book = scriptureService.getBook(bookId ?? '');

  useFocusEffect(
    useCallback(() => {
      void loadBibleActivityState().then(setActivity);
    }, []),
  );

  if (!book) return <Screen><Text variant="heading">Book unavailable.</Text></Screen>;
  const completedChapters = activity.completedChapters[book.id] ?? [];
  const completedSet = new Set(completedChapters);
  const progress = completedChapters.length / book.chapterCount;
  const currentChapter = activity.lastPosition?.bookId === book.id ? activity.lastPosition.chapter : null;

  return (
    <Screen contentContainerStyle={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <EditorialLabel>Berean Standard Bible · BSB</EditorialLabel>
      <Text variant="displaySerif">{book.name}</Text>
      <Text variant="body" style={styles.muted}>
        {completedChapters.length} of {book.chapterCount} chapters read.
      </Text>
      <View style={styles.progressWrap}>
        <ProgressBar progress={progress} />
      </View>
      {Array.from({ length: book.chapterCount }, (_, index) => index + 1).map((chapter) => (
        <Pressable
          key={chapter}
          style={[styles.chapterRow, { borderBottomColor: theme.colors.rule }]}
          onPress={() => router.push({ pathname: '/bible/[bookId]/[chapter]', params: { bookId: book.id, chapter: String(chapter) } })}
          accessibilityRole="button"
        >
          <View>
            <Text variant="headingSerif">Chapter {chapter}</Text>
            {currentChapter === chapter ? (
              <Text variant="caption" style={{ color: theme.colors.accent }}>Current chapter</Text>
            ) : null}
          </View>
          <Text variant="bodySmall" style={{ color: completedSet.has(chapter) ? theme.colors.success : theme.colors.textMuted }}>
            {completedSet.has(chapter) ? 'Read' : 'Open'}
          </Text>
        </Pressable>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { gap: 12 },
  muted: { opacity: 0.72 },
  progressWrap: { marginBottom: 6 },
  chapterRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
