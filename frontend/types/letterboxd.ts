// -------------------- LETTERBOXD CSV COLUMNS --------------------

import { BulkMovieLookupResult } from '@/types/database';
import { TMDBMovieDetails } from '@/utils/data/types';

// diary.csv
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

// watchlist.csv
export interface LetterboxdWatchlistCsvRow {
  Date: string;
  Name: string;
  Year: number;
  'Letterboxd URI': string;
}

// watched.csv
export interface LetterboxdWatchedCsvRow {
  Date: string;
  Name: string;
  Year: number;
  'Letterboxd URI': string;
}

// ratings.csv
export interface LetterboxdRatingsCsvRow {
  Date: string;
  Name: string;
  Year: number;
  'Letterboxd URI': string;
  Rating: number | null;
}

// Normalised entry from the CSVs
export interface LetterboxdEntry {
  title: string;
  year?: number;
  letterboxdUri?: string;

  source?: 'diary' | 'watchlist' | 'watched' | 'ratings';

  date?: string | null;
  watchedDate?: string | null;
  rating?: number | null;
  rewatch?: boolean;
  tags?: string | null;
}

// Lookup entry to query database
export interface LetterboxdLookupEntry {
  title: string;
  year?: number;
}

export interface EnrichedLetterboxdFilm extends LetterboxdEntry {
  film: BulkMovieLookupResult | null;
  tmdb?: TMDBMovieDetails | null;
  cached: boolean;
}

export interface FullEnrichedFilm {
  base: LetterboxdEntry;
  cached: BulkMovieLookupResult | null;
  tmdb: TMDBMovieDetails | null;
}
