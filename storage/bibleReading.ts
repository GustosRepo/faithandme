import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'faithandme.bible-reading.v1';

export type BibleReadingPosition = { bookId: string; chapter: number };

export async function loadBibleReadingPosition(): Promise<BibleReadingPosition | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const value = JSON.parse(raw) as Partial<BibleReadingPosition>;
    if (typeof value.bookId !== 'string' || typeof value.chapter !== 'number') return null;
    return { bookId: value.bookId, chapter: value.chapter };
  } catch { return null; }
}

export async function saveBibleReadingPosition(position: BibleReadingPosition): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(position));
}