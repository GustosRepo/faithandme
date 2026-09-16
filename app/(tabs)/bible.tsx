import { Pressable, StyleSheet, View } from 'react-native';

import { Button, Card, Screen, SectionHeader, Text } from '@/components/ui';
import { useAppTheme } from '@/hooks/useAppTheme';
import { scriptureService } from '@/services/scripture/ScriptureService';
import { loadBibleReadingPosition } from '@/storage/bibleReading';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';

export default function BibleScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const books = scriptureService.getBooks();
  const [lastRead, setLastRead] = useState<{ bookId: string; chapter: number } | null>(null);

  useEffect(() => { void loadBibleReadingPosition().then(setLastRead); }, []);
  const lastBook = lastRead ? scriptureService.getBook(lastRead.bookId) : undefined;

  return (
    <Screen contentContainerStyle={styles.container}>
      <Text variant="display">Bible</Text>
      <Text variant="body" style={{ color: theme.colors.textSecondary }}>Berean Standard Bible · BSB</Text>

      <SectionHeader title="Continue Reading" />
      {lastBook && lastRead ? <Card style={styles.continueCard}><View><Text variant="subheading">{lastBook.name}</Text><Text variant="bodySmall" style={{ color: theme.colors.textMuted }}>Chapter {lastRead.chapter}</Text></View><Button title="Continue" onPress={() => router.push({ pathname: '/bible/[bookId]/[chapter]', params: { bookId: lastBook.id, chapter: String(lastRead.chapter) } })} /></Card> : <Text variant="body" style={{ color: theme.colors.textMuted }}>Open a chapter to begin reading.</Text>}

      <SectionHeader title="Browse the Bible" />
      {(['OT', 'NT'] as const).map((testament) => <View key={testament} style={styles.group}><Text variant="subheading">{testament === 'OT' ? 'Old Testament' : 'New Testament'}</Text>{books.filter((book) => book.testament === testament).map((book) => <Pressable key={book.id} onPress={() => router.push({ pathname: '/bible/[bookId]', params: { bookId: book.id } })} style={styles.readingRow}><Text variant="body">{book.name}</Text><Text variant="bodySmall" style={{ color: theme.colors.textMuted }}>{book.chapterCount} chapters</Text></Pressable>)}</View>)}
      <Text variant="caption" style={{ color: theme.colors.textMuted }}>The Berean Standard Bible is dedicated to the public domain and bundled for offline reading.</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  group: { gap: 2, marginBottom: 14 },
  continueCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  readingRow: {
    gap: 2,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#D9CDB7',
  },
});
