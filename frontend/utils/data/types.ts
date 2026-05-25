export interface LetterboxdDiaryEntry {
  Date: string;
  Name: string;
  Year: number;
  'Letterboxd URI': string;
  Rating: number | null;
  Rewatch: string | null;
  Tags: string | null;
  'Watched Date': string | null;
}

export interface LetterboxdWatchlistEntry {
  Date: string;
  Name: string;
  Year: number;
  'Letterboxd URI': string;
}

export interface LetterboxdLookupEntry {
  title: string;
  year?: number;
  letterboxdUri?: string;
  _source?: 'diary' | 'watchlist';
  rating?: number | null;
  rewatch?: boolean;
  tags?: string | null;
  watchedDate?: string | null;
}

export interface TMDBGenre {
  id: number;
  name: string;
}

export interface TMDBCollectionSummary {
  id: number;
  name: string;
  poster_path: string | null;
  backdrop_path: string | null;
}

export interface TMDBProductionCompany {
  id: number;
  logo_path: string | null;
  name: string;
  origin_country: string;
}

export interface TMDBProductionCountry {
  iso_3166_1: string;
  name: string;
}

export interface TMDBSpokenLanguage {
  english_name: string;
  iso_639_1: string;
  name: string;
}

export interface TMDBSearchMovie {
  adult: boolean;
  backdrop_path: string | null;
  genre_ids: number[];
  id: number;
  title: string;
  original_language: string;
  original_title: string;
  overview: string;
  popularity: number;
  poster_path: string | null;
  release_date: string | null;
  softcore?: boolean;
  video: boolean;
  vote_average: number;
  vote_count: number;
}

export interface TMDBSearchResponse {
  page: number;
  results: TMDBSearchMovie[];
  total_pages: number;
  total_results: number;
}

export interface TMDBMovieDetails {
  adult: boolean;
  backdrop_path: string | null;
  belongs_to_collection: TMDBCollectionSummary | null;
  genres: TMDBGenre[];
  id: number;
  imdb_id: string | null;
  origin_country: string[];
  original_language: string;
  original_title: string;
  overview: string;
  popularity: number;
  poster_path: string | null;
  production_companies: TMDBProductionCompany[];
  production_countries: TMDBProductionCountry[];
  release_date: string | null;
  runtime: number | null;
  spoken_languages: TMDBSpokenLanguage[];
  status: string;
  tagline: string | null;
  title: string;
  video: boolean;
  vote_average: number;
  vote_count: number;
}

export interface EnrichedLookupEntry extends LetterboxdLookupEntry {
  tmdbCached?: boolean;
  tmdbId?: number | null;
  tmdb?: TMDBMovieDetails | null;
}

export interface TMDBMovieRow {
  id: number;
  imdb_id: string | null;
  title: string;
  original_title: string;
  original_language: string;
  overview: string;
  release_date: string | null;
  runtime: number | null;
  popularity: number;
  poster_path: string | null;
  status: string;
  vote_average: number;
  vote_count: number;
  raw: TMDBMovieDetails;
}

export interface TMDBGenreRow {
  id: number;
  name: string;
}

export interface TMDBLanguageRow {
  iso_639_1: string;
  english_name: string;
  name: string;
}

export interface TMDBCountryRow {
  iso_3166_1: string;
  name: string;
}

export interface TMDBProductionCompanyRow {
  id: number;
  name: string;
  logo_path: string | null;
  origin_country: string | null;
}

export interface OverviewTopItem {
  name: string;
  count: number;
}

export interface OverviewStats {
  watchedCount: number;
  averageRating: number | null;
  averageRuntime: number | null;
  topGenres: OverviewTopItem[];
  topLanguages: OverviewTopItem[];
}
