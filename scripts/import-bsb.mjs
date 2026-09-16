import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

const BOOKS = [
  ['GEN', 'Genesis', 'OT'], ['EXO', 'Exodus', 'OT'], ['LEV', 'Leviticus', 'OT'], ['NUM', 'Numbers', 'OT'], ['DEU', 'Deuteronomy', 'OT'],
  ['JOS', 'Joshua', 'OT'], ['JDG', 'Judges', 'OT'], ['RUT', 'Ruth', 'OT'], ['1SA', '1 Samuel', 'OT'], ['2SA', '2 Samuel', 'OT'],
  ['1KI', '1 Kings', 'OT'], ['2KI', '2 Kings', 'OT'], ['1CH', '1 Chronicles', 'OT'], ['2CH', '2 Chronicles', 'OT'], ['EZR', 'Ezra', 'OT'],
  ['NEH', 'Nehemiah', 'OT'], ['EST', 'Esther', 'OT'], ['JOB', 'Job', 'OT'], ['PSA', 'Psalms', 'OT'], ['PRO', 'Proverbs', 'OT'],
  ['ECC', 'Ecclesiastes', 'OT'], ['SNG', 'Song of Solomon', 'OT'], ['ISA', 'Isaiah', 'OT'], ['JER', 'Jeremiah', 'OT'], ['LAM', 'Lamentations', 'OT'],
  ['EZK', 'Ezekiel', 'OT'], ['DAN', 'Daniel', 'OT'], ['HOS', 'Hosea', 'OT'], ['JOL', 'Joel', 'OT'], ['AMO', 'Amos', 'OT'],
  ['OBA', 'Obadiah', 'OT'], ['JON', 'Jonah', 'OT'], ['MIC', 'Micah', 'OT'], ['NAM', 'Nahum', 'OT'], ['HAB', 'Habakkuk', 'OT'],
  ['ZEP', 'Zephaniah', 'OT'], ['HAG', 'Haggai', 'OT'], ['ZEC', 'Zechariah', 'OT'], ['MAL', 'Malachi', 'OT'], ['MAT', 'Matthew', 'NT'],
  ['MRK', 'Mark', 'NT'], ['LUK', 'Luke', 'NT'], ['JHN', 'John', 'NT'], ['ACT', 'Acts', 'NT'], ['ROM', 'Romans', 'NT'], ['1CO', '1 Corinthians', 'NT'],
  ['2CO', '2 Corinthians', 'NT'], ['GAL', 'Galatians', 'NT'], ['EPH', 'Ephesians', 'NT'], ['PHP', 'Philippians', 'NT'], ['COL', 'Colossians', 'NT'],
  ['1TH', '1 Thessalonians', 'NT'], ['2TH', '2 Thessalonians', 'NT'], ['1TI', '1 Timothy', 'NT'], ['2TI', '2 Timothy', 'NT'], ['TIT', 'Titus', 'NT'],
  ['PHM', 'Philemon', 'NT'], ['HEB', 'Hebrews', 'NT'], ['JAS', 'James', 'NT'], ['1PE', '1 Peter', 'NT'], ['2PE', '2 Peter', 'NT'],
  ['1JN', '1 John', 'NT'], ['2JN', '2 John', 'NT'], ['3JN', '3 John', 'NT'], ['JUD', 'Jude', 'NT'], ['REV', 'Revelation', 'NT'],
];

function cleanVerse(raw) {
  return raw
    .replace(/\\f[\s\S]*?\\f\*/g, ' ')
    .replace(/\\x[\s\S]*?\\x\*/g, ' ')
    .replace(/\\[a-z0-9]+\*?/gi, ' ')
    .replace(/[\u0000-\u001f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseUsfm(source, [id, name, testament], order) {
  const normalized = source.replace(/\r?\n/g, ' ');
  const chapters = [];
  const chapterMatches = [...normalized.matchAll(/\\c\s+(\d+)/g)];

  for (let chapterIndex = 0; chapterIndex < chapterMatches.length; chapterIndex += 1) {
    const chapterNumber = Number(chapterMatches[chapterIndex][1]);
    const start = chapterMatches[chapterIndex].index + chapterMatches[chapterIndex][0].length;
    const end = chapterMatches[chapterIndex + 1]?.index ?? normalized.length;
    const chapterText = normalized.slice(start, end);
    const verseMatches = [...chapterText.matchAll(/\\v\s+(\d+)(?:\s+|$)/g)];
    const verses = verseMatches.map((match, verseIndex) => {
      const verse = Number(match[1]);
      const verseStart = match.index + match[0].length;
      const verseEnd = verseMatches[verseIndex + 1]?.index ?? chapterText.length;
      return { reference: `${id}.${chapterNumber}.${verse}`, bookId: id, chapter: chapterNumber, verse, text: cleanVerse(chapterText.slice(verseStart, verseEnd)) };
    });
    chapters.push({ bookId: id, chapter: chapterNumber, verses });
  }

  return { id, name, abbreviation: id, testament, order, chapterCount: chapters.length, chapters };
}

const [sourceDirectory = '/tmp/faithandme-bsb/bsb_usfm', outputPath = 'data/bsb.json'] = process.argv.slice(2);
const books = [];
for (const [index, book] of BOOKS.entries()) {
  const source = await readFile(`${sourceDirectory}/${book[0]}.usfm`, 'utf8');
  books.push(parseUsfm(source, book, index + 1));
}
await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify({ id: 'bsb', name: 'Berean Standard Bible', abbreviation: 'BSB', language: 'en', publicDomain: true, books })}\n`);
console.log(`Imported ${books.length} books to ${outputPath}`);