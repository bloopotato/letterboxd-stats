import JSZip from 'jszip';
import Papa from 'papaparse';
import { LetterboxdDiaryCsvRow, LetterboxdWatchlistCsvRow } from '@/types/letterboxd';

const REQUIRED_FILES = ['diary.csv', 'watchlist.csv'] as const;

export type ParsedZipResult = {
  diary: LetterboxdDiaryCsvRow[];
  watchlist: LetterboxdWatchlistCsvRow[];
};

function parseNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  return Number.isNaN(n) ? null : n;
}

export async function parseLetterboxdZip(file: File): Promise<ParsedZipResult> {
  const zip = await JSZip.loadAsync(file);

  const diary: LetterboxdDiaryCsvRow[] = [];
  const watchlist: LetterboxdWatchlistCsvRow[] = [];
  const requiredFileSet = new Set<string>(REQUIRED_FILES as readonly string[]);

  console.log('Files in ZIP:', Object.keys(zip.files));

  for (const zipFile of Object.values(zip.files)) {
    if (zipFile.dir) continue;

    const filename = zipFile.name.split('/').pop() ?? zipFile.name;
    if (!requiredFileSet.has(filename)) continue;

    const csvText = await zipFile.async('text');
    const parsed = Papa.parse<Record<string, string>>(csvText, {
      header: true,
      skipEmptyLines: true,
    });

    const rows = parsed.data || [];

    if (filename === 'diary.csv') {
      for (const r of rows) {
        diary.push({
          Date: r['Date'] || '',
          Name: r['Name'] || '',
          Year: parseNumber(r['Year']) ?? 0,
          'Letterboxd URI': r['Letterboxd URI'] || '',
          Rating: parseNumber(r['Rating']),
          Rewatch: r['Rewatch'] || null,
          Tags: r['Tags'] || null,
          'Watched Date': r['Watched Date'] || null,
        });
      }
    }

    if (filename === 'watchlist.csv') {
      for (const r of rows) {
        watchlist.push({
          Date: r['Date'] || '',
          Name: r['Name'] || '',
          Year: parseNumber(r['Year']) ?? 0,
          'Letterboxd URI': r['Letterboxd URI'] || '',
        });
      }
    }
  }

  console.log(`Parsed ${diary.length} diary entries and ${watchlist.length} watchlist entries`);

  return { diary, watchlist };
}
