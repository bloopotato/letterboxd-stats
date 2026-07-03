import {
  LetterboxdDiaryCsvRow,
  LetterboxdEntry,
  LetterboxdWatchedCsvRow,
  LetterboxdWatchlistCsvRow,
  LetterboxdRatingsCsvRow,
} from '@/types/letterboxd';

export function normaliseFromDiary(entries: LetterboxdDiaryCsvRow[]): LetterboxdEntry[] {
  return entries.map((e) => ({
    title: e.Name,
    year: e.Year || undefined,
    letterboxdUri: e['Letterboxd URI'] || undefined,
    date: e.Date || undefined,
    watchedDate: e['Watched Date'] ?? undefined,
    rating: e.Rating ?? undefined,
    rewatch: !!e.Rewatch,
    tags: e.Tags ?? undefined,
  }));
}

export function normaliseFromWatchlist(entries: LetterboxdWatchlistCsvRow[]): LetterboxdEntry[] {
  return entries.map((e) => ({
    title: e.Name,
    year: e.Year || undefined,
    letterboxdUri: e['Letterboxd URI'] || undefined,
    date: e.Date || undefined,
  }));
}

export function normaliseFromWatched(entries: LetterboxdWatchedCsvRow[]): LetterboxdEntry[] {
  return entries.map((e) => ({
    title: e.Name,
    year: e.Year || undefined,
    letterboxdUri: e['Letterboxd URI'] || undefined,
    date: e.Date || undefined,
  }));
}

export function normaliseFromRatings(entries: LetterboxdRatingsCsvRow[]): LetterboxdEntry[] {
  return entries.map((e) => ({
    title: e.Name,
    year: e.Year || undefined,
    letterboxdUri: e['Letterboxd URI'] || undefined,
    date: e.Date || undefined,
    rating: e.Rating ?? undefined,
  }));
}

export function mergeCollections(
  diaryFilms: LetterboxdEntry[],
  watchlistFilms: LetterboxdEntry[],
  watchedFilms: LetterboxdEntry[],
  ratingsFilms: LetterboxdEntry[]
): LetterboxdEntry[] {
  const map = new Map<string, LetterboxdEntry>();
  function key(f: LetterboxdEntry) {
    return `${f.title.toLowerCase()}|${f.year ?? ''}`;
  }

  for (const f of diaryFilms)
    map.set(key(f), { ...f, source: 'diary' } as LetterboxdEntry & { source?: string });
  for (const f of watchlistFilms) {
    const k = key(f);
    if (map.has(k)) {
      const existing = map.get(k)!;
      map.set(k, { ...existing, ...f });
    } else {
      map.set(k, { ...f, source: 'watchlist' } as LetterboxdEntry & {
        source?: string;
      });
    }
  }
  for (const f of watchedFilms) {
    const k = key(f);
    if (map.has(k)) {
      const existing = map.get(k)!;
      map.set(k, { ...existing, ...f });
    } else {
      map.set(k, { ...f, source: 'watched' } as LetterboxdEntry & {
        source?: string;
      });
    }
  }
  for (const f of ratingsFilms) {
    const k = key(f);
    if (map.has(k)) {
      const existing = map.get(k)!;
      map.set(k, { ...existing, ...f });
    } else {
      map.set(k, { ...f, source: 'ratings' } as LetterboxdEntry & {
        source?: string;
      });
    }
  }

  return Array.from(map.values()) as LetterboxdEntry[];
}

const normalise = {
  normaliseFromDiary,
  normaliseFromWatchlist,
  normaliseFromWatched,
  normaliseFromRatings,
  mergeCollections,
};

export default normalise;
