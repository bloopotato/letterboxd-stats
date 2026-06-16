import {
  LetterboxdDiaryCsvRow,
  LetterboxdFilm,
  LetterboxdWatchlistCsvRow,
} from '@/types/letterboxd';

export function normaliseFromDiary(entries: LetterboxdDiaryCsvRow[]): LetterboxdFilm[] {
  return entries.map((e) => ({
    title: e.Name,
    year: e.Year || undefined,
    letterboxdUri: e['Letterboxd URI'] || undefined,
    diaryDate: e.Date || undefined,
    rating: e.Rating ?? undefined,
    rewatch: !!e.Rewatch,
    tags: e.Tags ?? undefined,
    watchedDate: e['Watched Date'] ?? undefined,
  }));
}

export function normaliseFromWatchlist(entries: LetterboxdWatchlistCsvRow[]): LetterboxdFilm[] {
  return entries.map((e) => ({
    title: e.Name,
    year: e.Year || undefined,
    letterboxdUri: e['Letterboxd URI'] || undefined,
  }));
}

export function mergeCollections(diaryFilms: LetterboxdFilm[], watchlistFilms: LetterboxdFilm[]) {
  const map = new Map<string, LetterboxdFilm>();
  function key(f: LetterboxdFilm) {
    return `${f.title.toLowerCase()}|${f.year ?? ''}`;
  }

  for (const f of diaryFilms)
    map.set(key(f), { ...f, source: 'diary' } as LetterboxdFilm & { source?: string });
  for (const f of watchlistFilms) {
    const k = key(f);
    if (map.has(k)) {
      const existing = map.get(k)!;
      map.set(k, { ...existing, ...f });
    } else {
      map.set(k, { ...f, source: 'watchlist' } as LetterboxdFilm & {
        source?: string;
      });
    }
  }

  return Array.from(map.values()) as LetterboxdFilm[];
}

const normalise = { normaliseFromDiary, normaliseFromWatchlist, mergeCollections };

export default normalise;
