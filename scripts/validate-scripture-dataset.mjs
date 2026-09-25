import { readFile } from 'node:fs/promises';

const EXPECTED_CHAPTERS = 1189;

const datasetPath = process.argv[2] ?? 'data/bsb.json';
const dataset = JSON.parse(await readFile(datasetPath, 'utf8'));
const references = new Set();
const duplicates = [];
const emptyVerses = [];
const malformedRecords = [];
let chapters = 0;
let verses = 0;

for (const book of dataset.books ?? []) {
  chapters += book.chapters?.length ?? 0;
  for (const chapter of book.chapters ?? []) {
    for (const verse of chapter.verses ?? []) {
      verses += 1;
      if (!/^([1-3]?[A-Z]{2,3})\.\d+\.\d+$/.test(verse.reference) || verse.bookId !== book.id || verse.chapter !== chapter.chapter || typeof verse.verse !== 'number') {
        malformedRecords.push(verse.reference ?? '(missing reference)');
      }
      if (!verse.text?.trim()) emptyVerses.push(verse.reference);
      if (references.has(verse.reference)) duplicates.push(verse.reference);
      references.add(verse.reference);
    }
  }
}

const summary = {
  id: dataset.id,
  abbreviation: dataset.abbreviation,
  language: dataset.language,
  publicDomain: dataset.publicDomain,
  books: dataset.books?.length ?? 0,
  chapters,
  verses,
  duplicates,
  emptyVerses,
  malformedRecords,
};

console.log(JSON.stringify(summary, null, 2));
if (summary.books !== 66 || summary.chapters !== EXPECTED_CHAPTERS || duplicates.length || emptyVerses.length || malformedRecords.length) process.exitCode = 1;
