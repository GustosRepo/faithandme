import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { serverConfig } from '../config.js';

export type BibleLanguage = 'en' | 'es';

export type CanonicalPassage = {
  reference: string;
  displayReference: string;
  text: string;
};

type DatasetVerse = { verse: number; text: string };
type DatasetChapter = { chapter: number; verses: DatasetVerse[] };
type DatasetBook = { id: string; name: string; chapters: DatasetChapter[] };
type Dataset = { books: DatasetBook[] };

const datasetFiles: Record<BibleLanguage, string> = {
  en: 'bsb.json',
  es: 'rv1909.json',
};

const datasets = new Map<BibleLanguage, Dataset>();

function resolveDataDir() {
  const candidates = [
    serverConfig.bibleDataDir,
    resolve(process.cwd(), 'data'),
    resolve(process.cwd(), '../data'),
  ].filter((candidate): candidate is string => Boolean(candidate));

  for (const candidate of candidates) {
    if (existsSync(resolve(candidate, datasetFiles.en))) return candidate;
  }

  throw new Error('Bible data directory not found. Set BIBLE_DATA_DIR to the folder containing bsb.json.');
}

function getDataset(language: BibleLanguage): Dataset {
  const existing = datasets.get(language);
  if (existing) return existing;

  const path = resolve(resolveDataDir(), datasetFiles[language]);
  const dataset = JSON.parse(readFileSync(path, 'utf8')) as Dataset;
  datasets.set(language, dataset);
  return dataset;
}

function parseReference(reference: string) {
  const match = /^([0-9A-Z]{3})\.(\d+)\.(\d+)(?:-(\d+))?$/.exec(reference.trim().toUpperCase());
  if (!match) return null;
  return { bookId: match[1]!, chapter: Number(match[2]), verseStart: Number(match[3]), verseEnd: Number(match[4] ?? match[3]) };
}

/**
 * Resolves the canonical passage text for a reference. Client-supplied passage text is
 * never trusted or forwarded to the model; this is the single source of Scripture truth.
 */
export function getCanonicalPassage(reference: string, language: BibleLanguage = 'en'): CanonicalPassage | null {
  const parsed = parseReference(reference);
  if (!parsed || parsed.verseEnd < parsed.verseStart) return null;

  const dataset = getDataset(language);
  const book = dataset.books.find((candidate) => candidate.id === parsed.bookId);
  const chapter = book?.chapters.find((candidate) => candidate.chapter === parsed.chapter);
  if (!book || !chapter) return null;

  const verses = chapter.verses.filter((verse) => verse.verse >= parsed.verseStart && verse.verse <= parsed.verseEnd);
  if (verses.length !== parsed.verseEnd - parsed.verseStart + 1) return null;

  const range = parsed.verseEnd === parsed.verseStart ? `${parsed.verseStart}` : `${parsed.verseStart}–${parsed.verseEnd}`;
  return {
    reference: `${parsed.bookId}.${parsed.chapter}.${parsed.verseStart}${parsed.verseEnd === parsed.verseStart ? '' : `-${parsed.verseEnd}`}`,
    displayReference: `${book.name} ${parsed.chapter}:${range}`,
    text: verses.map((verse) => verse.text).join(' '),
  };
}
