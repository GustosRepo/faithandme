import type { BibleBook } from '@/services/scripture/types';

export function parseReference(reference: string) {
  const match = /^(\w{3})\.(\d+)\.(\d+)(?:-(\d+))?$/.exec(reference.trim().toUpperCase());
  if (!match) return null;
  return { bookId: match[1], chapter: Number(match[2]), verseStart: Number(match[3]), verseEnd: Number(match[4] ?? match[3]) };
}

export function formatReference(book: BibleBook, chapter: number, verseStart: number, verseEnd = verseStart) {
  return `${book.name} ${chapter}:${verseStart}${verseEnd === verseStart ? '' : `–${verseEnd}`}`;
}