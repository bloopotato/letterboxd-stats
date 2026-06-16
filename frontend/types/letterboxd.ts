// -------------------- LETTERBOXD CSV COLUMNS --------------------

import { BulkMovieLookupResult } from '@/types/database';
import { TMDBMovieDetails } from '@/utils/data/types';

export interface LetterboxdDiaryCsvRow {
  Date: string;
  Name: string;
  Year: number;
  'Letterboxd URI': string;
  Rating: number | null;
  Rewatch: string | null;
  Tags: string | null;
  'Watched Date': string | null;
}

export interface LetterboxdWatchlistCsvRow {
  Date: string;
  Name: string;
  Year: number;
  'Letterboxd URI': string;
}

export interface LetterboxdLookupEntry {
  title: string;
  year?: number;
}

export interface LetterboxdFilm {
  title: string;
  year?: number;
  letterboxdUri?: string;

  source?: 'diary' | 'watchlist';

  // Diary-only fields
  diaryDate?: string | null;
  rating?: number | null;
  rewatch?: boolean;
  tags?: string | null;
  watchedDate?: string | null;
}

export interface LetterboxdLookupEntryTemp {
  title: string;
  year?: number;
  letterboxdUri?: string;
  _source?: 'diary' | 'watchlist';
  diaryDate?: string | null;
  rating?: number | null;
  rewatch?: boolean;
  tags?: string | null;
  watchedDate?: string | null;
}

export interface EnrichedLetterboxdFilm extends LetterboxdFilm {
  film: BulkMovieLookupResult | null;
  tmdb?: TMDBMovieDetails | null;
  cached: boolean;
}

export interface FullEnrichedFilm {
  base: LetterboxdFilm;
  cached: BulkMovieLookupResult | null;
  tmdb: TMDBMovieDetails | null;
}
