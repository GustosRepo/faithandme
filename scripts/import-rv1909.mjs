import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

const BOOKS = [
  ['GEN', 'Génesis', 'Gn', 'OT'], ['EXO', 'Éxodo', 'Ex', 'OT'], ['LEV', 'Levítico', 'Lv', 'OT'], ['NUM', 'Números', 'Nm', 'OT'], ['DEU', 'Deuteronomio', 'Dt', 'OT'],
  ['JOS', 'Josué', 'Jos', 'OT'], ['JDG', 'Jueces', 'Jue', 'OT'], ['RUT', 'Rut', 'Rt', 'OT'], ['1SA', '1 Samuel', '1 S', 'OT'], ['2SA', '2 Samuel', '2 S', 'OT'],
  ['1KI', '1 Reyes', '1 R', 'OT'], ['2KI', '2 Reyes', '2 R', 'OT'], ['1CH', '1 Crónicas', '1 Cr', 'OT'], ['2CH', '2 Crónicas', '2 Cr', 'OT'], ['EZR', 'Esdras', 'Esd', 'OT'],
  ['NEH', 'Nehemías', 'Neh', 'OT'], ['EST', 'Ester', 'Est', 'OT'], ['JOB', 'Job', 'Job', 'OT'], ['PSA', 'Salmos', 'Sal', 'OT'], ['PRO', 'Proverbios', 'Pr', 'OT'],
  ['ECC', 'Eclesiastés', 'Ec', 'OT'], ['SNG', 'Cantar de los Cantares', 'Cnt', 'OT'], ['ISA', 'Isaías', 'Is', 'OT'], ['JER', 'Jeremías', 'Jer', 'OT'], ['LAM', 'Lamentaciones', 'Lm', 'OT'],
  ['EZK', 'Ezequiel', 'Ez', 'OT'], ['DAN', 'Daniel', 'Dn', 'OT'], ['HOS', 'Oseas', 'Os', 'OT'], ['JOL', 'Joel', 'Jl', 'OT'], ['AMO', 'Amós', 'Am', 'OT'],
  ['OBA', 'Abdías', 'Abd', 'OT'], ['JON', 'Jonás', 'Jon', 'OT'], ['MIC', 'Miqueas', 'Mi', 'OT'], ['NAM', 'Nahum', 'Nah', 'OT'], ['HAB', 'Habacuc', 'Hab', 'OT'],
  ['ZEP', 'Sofonías', 'Sof', 'OT'], ['HAG', 'Hageo', 'Hag', 'OT'], ['ZEC', 'Zacarías', 'Zac', 'OT'], ['MAL', 'Malaquías', 'Mal', 'OT'], ['MAT', 'Mateo', 'Mt', 'NT'],
  ['MRK', 'Marcos', 'Mr', 'NT'], ['LUK', 'Lucas', 'Lc', 'NT'], ['JHN', 'Juan', 'Jn', 'NT'], ['ACT', 'Hechos', 'Hch', 'NT'], ['ROM', 'Romanos', 'Ro', 'NT'], ['1CO', '1 Corintios', '1 Co', 'NT'],
  ['2CO', '2 Corintios', '2 Co', 'NT'], ['GAL', 'Gálatas', 'Ga', 'NT'], ['EPH', 'Efesios', 'Ef', 'NT'], ['PHP', 'Filipenses', 'Fil', 'NT'], ['COL', 'Colosenses', 'Col', 'NT'],
  ['1TH', '1 Tesalonicenses', '1 Ts', 'NT'], ['2TH', '2 Tesalonicenses', '2 Ts', 'NT'], ['1TI', '1 Timoteo', '1 Ti', 'NT'], ['2TI', '2 Timoteo', '2 Ti', 'NT'], ['TIT', 'Tito', 'Tit', 'NT'],
  ['PHM', 'Filemón', 'Flm', 'NT'], ['HEB', 'Hebreos', 'Heb', 'NT'], ['JAS', 'Santiago', 'Stg', 'NT'], ['1PE', '1 Pedro', '1 P', 'NT'], ['2PE', '2 Pedro', '2 P', 'NT'],
  ['1JN', '1 Juan', '1 Jn', 'NT'], ['2JN', '2 Juan', '2 Jn', 'NT'], ['3JN', '3 Juan', '3 Jn', 'NT'], ['JUD', 'Judas', 'Jud', 'NT'], ['REV', 'Apocalipsis', 'Ap', 'NT'],
];

function cleanVerse(raw) {
  return raw
    .replace(/\\f[\s\S]*?\\f\*/g, ' ')
    .replace(/\\x[\s\S]*?\\x\*/g, ' ')
    .replace(/\\w\s+([^|\\]*?)(?:\|[^\\]*?)?\\w\*/g, '$1')
    .replace(/\\add\s+([^\\]*?)\\add\*/g, '$1')
    .replace(/\|strong="[^"]*"/g, '')
    .replace(/\\[a-z0-9+]+\*?/gi, ' ')
    .replace(/[\u0000-\u001f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseUsfm(source, [id, name, abbreviation, testament], order) {
  const normalized = source.replace(/\r?\n/g, ' ');
  const chapters = [];
  const chapterMatches = [...normalized.matchAll(/\\c\s+(\d+)/g)];

  for (let chapterIndex = 0; chapterIndex < chapterMatches.length; chapterIndex += 1) {
    const chapterNumber = Number(chapterMatches[chapterIndex][1]);
    const start = chapterMatches[chapterIndex].index + chapterMatches[chapterIndex][0].length;
    const end = chapterMatches[chapterIndex + 1]?.index ?? normalized.length;
    const chapterText = normalized.slice(start, end);
    const verseMatches = [...chapterText.matchAll(/\\v\s+(\d+)(?:\s+|$)/g)];
    const verses = verseMatches
      .map((match, verseIndex) => {
        const verse = Number(match[1]);
        const verseStart = match.index + match[0].length;
        const verseEnd = verseMatches[verseIndex + 1]?.index ?? chapterText.length;
        return { reference: `${id}.${chapterNumber}.${verse}`, bookId: id, chapter: chapterNumber, verse, text: cleanVerse(chapterText.slice(verseStart, verseEnd)) };
      })
      .filter((verse) => verse.text.length > 0);
    chapters.push({ bookId: id, chapter: chapterNumber, verses });
  }

  return { id, name, abbreviation, testament, order, chapterCount: chapters.length, chapters };
}

async function findBookPath(sourceDirectory, bookId) {
  const files = await readdir(sourceDirectory);
  const file = files.find((name) => name.endsWith(`${bookId}spaRV1909.usfm`));
  if (!file) throw new Error(`Missing RV1909 USFM file for ${bookId}`);
  return `${sourceDirectory}/${file}`;
}

const [sourceDirectory = '/tmp/spaRV1909_usfm', outputPath = 'data/rv1909.json'] = process.argv.slice(2);
const books = [];
for (const [index, book] of BOOKS.entries()) {
  const source = await readFile(await findBookPath(sourceDirectory, book[0]), 'utf8');
  books.push(parseUsfm(source, book, index + 1));
}

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify({ id: 'rv1909', name: 'Reina-Valera 1909', abbreviation: 'RV1909', language: 'es', publicDomain: true, books })}\n`);
console.log(`Imported ${books.length} books to ${outputPath}`);
