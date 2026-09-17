import AsyncStorage from '@react-native-async-storage/async-storage';

import type { BibleVerse } from '@/services/scripture/types';
import { loadBibleReadingPosition } from '@/storage/bibleReading';

const STORAGE_KEY = 'faithandme.bible-activity.v1';

export type BibleHighlightColor = 'olive' | 'gold' | 'rose';
export type BibleReaderFont = 'serif' | 'sans';

export type BibleReadingPosition = {
  bookId: string;
  chapter: number;
  verse?: number;
};

export type BibleSavedVerse = {
  bookId: string;
  chapter: number;
  createdAt: string;
  reference: string;
  text: string;
  verse: number;
};

export type BibleHighlightedVerse = BibleSavedVerse & {
  color: BibleHighlightColor;
};

export type BibleReaderSettings = {
  fontFamily: BibleReaderFont;
  fontSize: number;
  lineHeight: number;
};

export type BibleActivityState = {
  bookmarks: Record<string, BibleSavedVerse>;
  completedChapters: Record<string, number[]>;
  highlights: Record<string, BibleHighlightedVerse>;
  lastPosition: BibleReadingPosition | null;
  readerSettings: BibleReaderSettings;
};

export const defaultBibleReaderSettings: BibleReaderSettings = {
  fontFamily: 'serif',
  fontSize: 18,
  lineHeight: 31,
};

export const defaultBibleActivityState: BibleActivityState = {
  bookmarks: {},
  completedChapters: {},
  highlights: {},
  lastPosition: null,
  readerSettings: defaultBibleReaderSettings,
};

function normalizePositiveInteger(value: unknown): number | null {
  return typeof value === 'number' && Number.isInteger(value) && value > 0 ? value : null;
}

function normalizePosition(value: unknown): BibleReadingPosition | null {
  if (!value || typeof value !== 'object') return null;
  const partial = value as Partial<BibleReadingPosition>;
  const chapter = normalizePositiveInteger(partial.chapter);
  if (typeof partial.bookId !== 'string' || !chapter) return null;

  const verse = normalizePositiveInteger(partial.verse);
  return { bookId: partial.bookId, chapter, ...(verse ? { verse } : {}) };
}

function normalizeCompletedChapters(value: unknown): Record<string, number[]> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};

  return Object.entries(value as Record<string, unknown>).reduce<Record<string, number[]>>((acc, [bookId, chapters]) => {
    if (!Array.isArray(chapters)) return acc;
    const normalized = Array.from(new Set(chapters.map(normalizePositiveInteger).filter((chapter): chapter is number => Boolean(chapter)))).sort((a, b) => a - b);
    if (normalized.length > 0) acc[bookId] = normalized;
    return acc;
  }, {});
}

function normalizeSavedVerse(value: unknown): BibleSavedVerse | null {
  if (!value || typeof value !== 'object') return null;
  const partial = value as Partial<BibleSavedVerse>;
  const chapter = normalizePositiveInteger(partial.chapter);
  const verse = normalizePositiveInteger(partial.verse);
  if (
    typeof partial.bookId !== 'string' ||
    !chapter ||
    !verse ||
    typeof partial.reference !== 'string' ||
    typeof partial.text !== 'string'
  ) {
    return null;
  }

  return {
    bookId: partial.bookId,
    chapter,
    createdAt: typeof partial.createdAt === 'string' ? partial.createdAt : new Date().toISOString(),
    reference: partial.reference,
    text: partial.text,
    verse,
  };
}

function normalizeBookmarks(value: unknown): Record<string, BibleSavedVerse> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};

  return Object.entries(value as Record<string, unknown>).reduce<Record<string, BibleSavedVerse>>((acc, [reference, saved]) => {
    const normalized = normalizeSavedVerse(saved);
    if (normalized) acc[reference] = normalized;
    return acc;
  }, {});
}

function normalizeHighlights(value: unknown): Record<string, BibleHighlightedVerse> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};

  return Object.entries(value as Record<string, unknown>).reduce<Record<string, BibleHighlightedVerse>>((acc, [reference, saved]) => {
    const normalized = normalizeSavedVerse(saved);
    if (!normalized || typeof (saved as Partial<BibleHighlightedVerse>).color !== 'string') return acc;
    const color = (saved as Partial<BibleHighlightedVerse>).color;
    if (color !== 'olive' && color !== 'gold' && color !== 'rose') return acc;
    acc[reference] = { ...normalized, color };
    return acc;
  }, {});
}

function normalizeReaderSettings(value: unknown): BibleReaderSettings {
  if (!value || typeof value !== 'object') return defaultBibleReaderSettings;
  const partial = value as Partial<BibleReaderSettings>;
  const fontSize = typeof partial.fontSize === 'number' ? Math.min(Math.max(partial.fontSize, 16), 22) : defaultBibleReaderSettings.fontSize;
  const lineHeight = typeof partial.lineHeight === 'number' ? Math.min(Math.max(partial.lineHeight, fontSize + 9), fontSize + 16) : Math.round(fontSize * 1.72);
  const fontFamily = partial.fontFamily === 'sans' ? 'sans' : 'serif';

  return { fontFamily, fontSize, lineHeight };
}

function normalizeBibleActivityState(value: unknown): BibleActivityState {
  if (!value || typeof value !== 'object') return defaultBibleActivityState;
  const partial = value as Partial<BibleActivityState>;

  return {
    bookmarks: normalizeBookmarks(partial.bookmarks),
    completedChapters: normalizeCompletedChapters(partial.completedChapters),
    highlights: normalizeHighlights(partial.highlights),
    lastPosition: normalizePosition(partial.lastPosition),
    readerSettings: normalizeReaderSettings(partial.readerSettings),
  };
}

function createSavedVerse(verse: BibleVerse): BibleSavedVerse {
  return {
    bookId: verse.bookId,
    chapter: verse.chapter,
    createdAt: new Date().toISOString(),
    reference: verse.reference,
    text: verse.text,
    verse: verse.verse,
  };
}

export async function loadBibleActivityState(): Promise<BibleActivityState> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) return normalizeBibleActivityState(JSON.parse(raw));

    const legacyPosition = await loadBibleReadingPosition();
    if (legacyPosition) {
      return { ...defaultBibleActivityState, lastPosition: legacyPosition };
    }
  } catch {
    return defaultBibleActivityState;
  }

  return defaultBibleActivityState;
}

export async function saveBibleActivityState(state: BibleActivityState): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function recordBibleReadingPosition(state: BibleActivityState, position: BibleReadingPosition): BibleActivityState {
  return {
    ...state,
    lastPosition: position,
  };
}

export function markBibleChapterComplete(state: BibleActivityState, bookId: string, chapter: number): BibleActivityState {
  const current = state.completedChapters[bookId] ?? [];
  const next = Array.from(new Set([...current, chapter])).sort((a, b) => a - b);

  return {
    ...state,
    completedChapters: {
      ...state.completedChapters,
      [bookId]: next,
    },
    lastPosition: { bookId, chapter },
  };
}

export function toggleBibleBookmark(state: BibleActivityState, verse: BibleVerse): BibleActivityState {
  const bookmarks = { ...state.bookmarks };
  if (bookmarks[verse.reference]) {
    delete bookmarks[verse.reference];
  } else {
    bookmarks[verse.reference] = createSavedVerse(verse);
  }

  return { ...state, bookmarks };
}

export function toggleBibleHighlight(state: BibleActivityState, verse: BibleVerse, color: BibleHighlightColor = 'olive'): BibleActivityState {
  const highlights = { ...state.highlights };
  if (highlights[verse.reference]) {
    delete highlights[verse.reference];
  } else {
    highlights[verse.reference] = { ...createSavedVerse(verse), color };
  }

  return { ...state, highlights };
}

export function updateBibleReaderSettings(state: BibleActivityState, settings: Partial<BibleReaderSettings>): BibleActivityState {
  return {
    ...state,
    readerSettings: normalizeReaderSettings({ ...state.readerSettings, ...settings }),
  };
}
