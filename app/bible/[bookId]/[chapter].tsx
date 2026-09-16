import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button, Screen, Text } from '@/components/ui';
import { scriptureService } from '@/services/scripture/ScriptureService';
import { saveBibleReadingPosition } from '@/storage/bibleReading';

export default function BibleChapterScreen() {
  const router = useRouter();
  const { bookId, chapter: chapterParam } = useLocalSearchParams<{ bookId: string; chapter: string }>();
  const chapterNumber = Number(chapterParam);
  const book = scriptureService.getBook(bookId ?? '');
  const chapter = scriptureService.getChapter(bookId ?? '', chapterNumber);

  useEffect(() => {
    if (book && chapter) void saveBibleReadingPosition({ bookId: book.id, chapter: chapter.chapter });
  }, [book, chapter]);

  if (!book || !chapter) return <Screen><Text variant="heading">Chapter unavailable.</Text></Screen>;
  const previous = chapter.chapter > 1 ? chapter.chapter - 1 : null;
  const next = chapter.chapter < book.chapterCount ? chapter.chapter + 1 : null;
  const openChapter = (number: number) => router.replace({ pathname: '/bible/[bookId]/[chapter]', params: { bookId: book.id, chapter: String(number) } });

  return (
    <Screen contentContainerStyle={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <Text variant="caption" style={styles.kicker}>Berean Standard Bible · BSB</Text>
      <Text variant="display">{book.name} {chapter.chapter}</Text>
      <View style={styles.verses}>
        {chapter.verses.map((verse) => (
          <Text key={verse.reference} variant="scripture" style={styles.verse}><Text variant="bodySmall" style={styles.number}>{verse.verse} </Text>{verse.text}</Text>
        ))}
      </View>
      <View style={styles.navigation}>
        <Button title="Previous Chapter" variant="secondary" disabled={!previous} onPress={() => previous && openChapter(previous)} />
        <Button title="Next Chapter" disabled={!next} onPress={() => next && openChapter(next)} />
      </View>
      <Text variant="caption" style={styles.about}>Berean Standard Bible (BSB). Dedicated to the public domain at berean.bible.</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { gap: 16 },
  kicker: { color: '#77726A', letterSpacing: 1.1, textTransform: 'uppercase' },
  verses: { gap: 14, marginTop: 8 },
  verse: { fontSize: 22, lineHeight: 34 },
  number: { color: '#596B4D', fontWeight: '700' },
  navigation: { gap: 10, marginTop: 20 },
  about: { color: '#77726A', lineHeight: 18, marginTop: 8 },
});