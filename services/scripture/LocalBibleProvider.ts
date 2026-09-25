import { formatReference, parseReference } from '@/services/scripture/references';
import type { BibleBook, BibleChapter, BibleMetadata, BibleVerse, ScripturePassage, ScriptureProvider } from '@/services/scripture/types';

type DatasetBook = BibleBook & { chapters: BibleChapter[] };
export type ScriptureDataset = { id: string; name: string; abbreviation: string; language: string; publicDomain: boolean; books: DatasetBook[] };

export class LocalBibleProvider implements ScriptureProvider {
  constructor(private readonly dataset: ScriptureDataset) {}

  getBibleMetadata(): BibleMetadata {
    return {
      id: this.dataset.id,
      name: this.dataset.name,
      abbreviation: this.dataset.abbreviation,
      language: this.dataset.language,
      publicDomain: this.dataset.publicDomain,
    };
  }
  getBooks(): BibleBook[] { return this.dataset.books; }
  getBook(bookId: string): BibleBook | undefined { return this.dataset.books.find((book) => book.id === bookId.toUpperCase()); }
  getChapters(bookId: string): BibleChapter[] { return this.dataset.books.find((book) => book.id === bookId.toUpperCase())?.chapters ?? []; }
  getChapter(bookId: string, chapterNumber: number): BibleChapter | undefined { return this.getChapters(bookId).find((chapter) => chapter.chapter === chapterNumber); }
  getVerse(reference: string): BibleVerse | undefined { return this.getPassage(reference)?.verses[0]; }
  getPassage(reference: string): ScripturePassage | undefined {
    const parsed = parseReference(reference);
    if (!parsed) return undefined;
    const book = this.getBook(parsed.bookId);
    const chapter = this.getChapter(parsed.bookId, parsed.chapter);
    if (!book || !chapter) return undefined;
    const verses = chapter.verses.filter((verse) => verse.verse >= parsed.verseStart && verse.verse <= parsed.verseEnd);
    if (verses.length !== parsed.verseEnd - parsed.verseStart + 1) return undefined;
    return { reference, displayReference: formatReference(book, parsed.chapter, parsed.verseStart, parsed.verseEnd), verses, text: verses.map((verse) => verse.text).join(' '), translation: this.dataset.abbreviation };
  }
  searchExact(query: string): BibleVerse[] {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return [];
    return this.dataset.books.flatMap((book) => book.chapters.flatMap((chapter) => chapter.verses)).filter((verse) => verse.text.toLowerCase().includes(normalized));
  }
}
