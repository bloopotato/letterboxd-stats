import {
  LetterboxdDiaryCsvRow,
  LetterboxdWatchedCsvRow,
  LetterboxdWatchlistCsvRow,
  LetterboxdRatingsCsvRow,
} from '@/types/letterboxd';
import { UserFilm } from '@/types/statistics';

// Helper function to generate unique key for film
function filmKey(title: string, year?: number) {
  return `${title.toLowerCase()}|${year ?? ''}`;
}

function createUserFilm(): UserFilm {
  return {
    name: '',
    year: 0,
    watched: false,
    inWatchlist: false,
    rating: null,
    watchedEvents: [],
    letterboxdUri: null,
    tmdbId: null,
    runtime: null,
    cached: false,
  };
}

export function buildUserFilmMap(
  diary: LetterboxdDiaryCsvRow[],
  watchlist: LetterboxdWatchlistCsvRow[],
  watched: LetterboxdWatchedCsvRow[],
  ratings: LetterboxdRatingsCsvRow[]
): Map<string, UserFilm> {
  const films = new Map<string, UserFilm>();

  // 1. watched.csv
  for (const movie of watched) {
    const key = filmKey(movie.Name, movie.Year);
    films.set(key, {
      name: movie.Name,
      year: movie.Year,
      watched: true,
      inWatchlist: false,
      rating: null,
      watchedEvents: [],
      letterboxdUri: movie['Letterboxd URI'] || null,
      tmdbId: null,
      runtime: null,
      cached: false,
    });
  }

  // 2. ratings.csv
  for (const movie of ratings) {
    const key = filmKey(movie.Name, movie.Year);
    const existing = films.get(key) ?? createUserFilm();
    existing.name = movie.Name;
    existing.year = movie.Year;
    existing.rating = movie.Rating ?? null;
    existing.letterboxdUri = movie['Letterboxd URI'] || null;
    films.set(key, existing);
  }

  // 3. watchlist.csv
  for (const movie of watchlist) {
    const key = filmKey(movie.Name, movie.Year);
    const existing = films.get(key) ?? createUserFilm();
    existing.name = movie.Name;
    existing.year = movie.Year;
    existing.inWatchlist = true;
    existing.letterboxdUri = movie['Letterboxd URI'] || null;
    films.set(key, existing);
  }

  // 4. diary.csv
  for (const movie of diary) {
    const key = filmKey(movie.Name, movie.Year);
    const existing = films.get(key) ?? createUserFilm();
    existing.name = movie.Name;
    existing.year = movie.Year;
    existing.watched = true;
    existing.watchedEvents.push({
      date: movie.Date,
      rating: movie.Rating ?? null,
      rewatch: !!movie.Rewatch,
      tags: movie.Tags ? movie.Tags.split(',').map((t) => t.trim()) : [],
      letterboxdUri: movie['Letterboxd URI'] || null,
    });
    films.set(key, existing);
  }

  return films;
}
