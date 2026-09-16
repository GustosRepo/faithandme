export type BibleMetadata = {
  id: string;
  name: string;
  abbreviation: string;
  language: string;
  publicDomain: boolean;
};

export type BibleVerse = {
  reference: string;
  bookId: string;
  chapter: number;
  verse: number;
  text: string;
};

export type BibleChapter = {
  bookId: string;
  chapter: number;
  verses: BibleVerse[];
};

export type BibleBook = {
  id: string;
  name: string;
  abbreviation: string;
  testament: 'OT' | 'NT';
  order: number;
  chapterCount: number;
};

export type ScripturePassage = {
  reference: string;
  displayReference: string;
  verses: BibleVerse[];
  text: string;
  translation: string;
};

export type ScriptureProvider = {
  getBibleMetadata(): BibleMetadata;
  getBooks(): BibleBook[];
  getBook(bookId: string): BibleBook | undefined;
  getChapters(bookId: string): BibleChapter[];
  getChapter(bookId: string, chapterNumber: number): BibleChapter | undefined;
  getVerse(reference: string): BibleVerse | undefined;
  getPassage(reference: string): ScripturePassage | undefined;
  searchExact(query: string): BibleVerse[];
};