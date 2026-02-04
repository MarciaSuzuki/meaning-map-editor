import type { BHSABook, BHSAVerse, BHSAClause } from './types';

// ---------------------------------------------------------------------------
// BHSA Data Loader
// ---------------------------------------------------------------------------
// BHSA JSON files are bundled in /data/bhsa/ as static assets.
// This loader reads them at build time (server) or via fetch (client).
// The clause segmentation is the structural spine of every Meaning Map.
// ---------------------------------------------------------------------------

// Cache for loaded books (server-side, persists across requests in dev)
const bookCache = new Map<string, BHSABook>();

/**
 * Load a BHSA book by name (e.g., 'genesis', 'ruth').
 * Server-side: uses dynamic import.
 * Returns null if book not found.
 */
export async function loadBook(bookName: string): Promise<BHSABook | null> {
  const key = bookName.toLowerCase();

  if (bookCache.has(key)) {
    return bookCache.get(key)!;
  }

  try {
    // Dynamic import of the JSON file from /data/bhsa/
    const data = await import(`@/data/bhsa/${key}.json`);
    const book: BHSABook = data.default ?? data;
    bookCache.set(key, book);
    return book;
  } catch {
    console.warn(`BHSA book not found: ${key}`);
    return null;
  }
}

/**
 * Get verses for a specific range within a book.
 */
export function getVerseRange(
  book: BHSABook,
  chapterStart: number,
  verseStart: number,
  chapterEnd: number,
  verseEnd: number
): BHSAVerse[] {
  return book.verses.filter((v) => {
    if (v.chapter < chapterStart || v.chapter > chapterEnd) return false;
    if (v.chapter === chapterStart && v.verse < verseStart) return false;
    if (v.chapter === chapterEnd && v.verse > verseEnd) return false;
    return true;
  });
}

/**
 * Get all clauses from a verse range, flattened.
 */
export function getClausesFromRange(
  book: BHSABook,
  chapterStart: number,
  verseStart: number,
  chapterEnd: number,
  verseEnd: number
): BHSAClause[] {
  const verses = getVerseRange(book, chapterStart, verseStart, chapterEnd, verseEnd);
  return verses.flatMap((v) => v.clauses);
}

/**
 * List all available book names from the data directory.
 * Used on the project creation screen.
 */
export const AVAILABLE_BOOKS = [
  'genesis', 'exodus', 'leviticus', 'numbers', 'deuteronomy',
  'joshua', 'judges', 'ruth',
  '1_samuel', '2_samuel', '1_kings', '2_kings',
  '1_chronicles', '2_chronicles',
  'ezra', 'nehemiah', 'esther',
  'job', 'psalms', 'proverbs', 'ecclesiastes', 'song_of_songs',
  'isaiah', 'jeremiah', 'lamentations', 'ezekiel', 'daniel',
  'hosea', 'joel', 'amos', 'obadiah', 'jonah', 'micah',
  'nahum', 'habakkuk', 'zephaniah', 'haggai', 'zechariah', 'malachi',
] as const;

export type BookName = (typeof AVAILABLE_BOOKS)[number];
