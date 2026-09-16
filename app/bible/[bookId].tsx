import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';

import { Screen, Text } from '@/components/ui';
import { scriptureService } from '@/services/scripture/ScriptureService';

export default function BibleBookScreen() {
  const router = useRouter();
  const { bookId } = useLocalSearchParams<{ bookId: string }>();
  const book = scriptureService.getBook(bookId ?? '');
  if (!book) return <Screen><Text variant="heading">Book unavailable.</Text></Screen>;

  return (
    <Screen contentContainerStyle={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <Text variant="caption" style={styles.kicker}>Berean Standard Bible · BSB</Text>
      <Text variant="display">{book.name}</Text>
      <Text variant="body" style={styles.muted}>Choose a chapter.</Text>
      {Array.from({ length: book.chapterCount }, (_, index) => index + 1).map((chapter) => (
        <Pressable key={chapter} style={styles.chapterRow} onPress={() => router.push({ pathname: '/bible/[bookId]/[chapter]', params: { bookId: book.id, chapter: String(chapter) } })} accessibilityRole="button">
          <Text variant="subheading">Chapter {chapter}</Text>
        </Pressable>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { gap: 12 },
  kicker: { color: '#77726A', letterSpacing: 1.1, textTransform: 'uppercase' },
  muted: { color: '#77726A' },
  chapterRow: { paddingVertical: 16, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#D9CDB7' },
});