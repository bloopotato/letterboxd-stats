import type {
  LetterboxdDiaryEntry,
  LetterboxdWatchlistEntry,
  LetterboxdLookupEntry,
} from './types';

export function normaliseFromDiary(entries: LetterboxdDiaryEntry[]): LetterboxdLookupEntry[] {
  return entries.map((e) => ({
    title: e.Name,
    year: e.Year || undefined,
    letterboxdUri: e['Letterboxd URI'] || undefined,
    rating: e.Rating ?? undefined,
    rewatch: e.Rewatch ? true : false,
    tags: e.Tags ?? undefined,
    watchedDate: e['Watched Date'] ?? undefined,
  }));
}

export function normaliseFromWatchlist(
  entries: LetterboxdWatchlistEntry[]
): LetterboxdLookupEntry[] {
  return entries.map((e) => ({
    title: e.Name,
    year: e.Year || undefined,
    letterboxdUri: e['Letterboxd URI'] || undefined,
  }));
}

export function mergeCollections(
  diaryFilms: LetterboxdLookupEntry[],
  watchlistFilms: LetterboxdLookupEntry[]
) {
  const map = new Map<string, LetterboxdLookupEntry>();
  function key(f: LetterboxdLookupEntry) {
    return `${f.title.toLowerCase()}|${f.year ?? ''}`;
  }

  for (const f of diaryFilms)
    map.set(key(f), { ...f, _source: 'diary' } as LetterboxdLookupEntry & { _source?: string });
  for (const f of watchlistFilms) {
    const k = key(f);
    if (map.has(k)) {
      const existing = map.get(k)!;
      map.set(k, { ...existing, ...f });
    } else {
      map.set(k, { ...f, _source: 'watchlist' } as LetterboxdLookupEntry & { _source?: string });
    }
  }

  return Array.from(map.values()) as LetterboxdLookupEntry[];
}

const normalise = { normaliseFromDiary, normaliseFromWatchlist, mergeCollections };

export default normalise;
