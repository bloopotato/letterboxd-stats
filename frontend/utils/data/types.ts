import { LetterboxdLookupEntryTemp } from '@/types/letterboxd';

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

export interface TMDBCastMember {
  id: number;
  character: string | null;
  known_for_department?: string | null;
  name: string;
  order: number | null;
  profile_path: string | null;
}

export interface TMDBCrewMember {
  id: number;
  department: string | null;
  job: string | null;
  name: string;
  order: number | null;
  profile_path: string | null;
}

export interface TMDBCredits {
  cast: TMDBCastMember[];
  crew: TMDBCrewMember[];
}

export interface MovieData {
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
  results: MovieData[];
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
  credits?: TMDBCredits;
  spoken_languages: TMDBSpokenLanguage[];
  status: string;
  tagline: string | null;
  title: string;
  video: boolean;
  vote_average: number;
  vote_count: number;
}

export interface EnrichedLookupEntry extends LetterboxdLookupEntryTemp {
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

export interface CastTopItem {
  id: number;
  name: string;
  count: number;
}

export interface TMDBPersonRow {
  id: number;
  name: string;
  profile_path: string | null;
  known_for_department?: string | null;
  popularity?: number | null;
}

export interface TMDBCreditRow {
  movie_id: number;
  person_id: number;
  department: string | null;
  job: string | null;
  character: string | null;
  cast_order: number | null;
}

export interface OverviewStats {
  watchedCount: number;
  averageRating: number | null;
  averageRuntime: number | null;
  topGenres: OverviewTopItem[];
  topLanguages: OverviewTopItem[];
}

export interface CastStats {
  watchedCount: number;
  topCast: CastTopItem[];
  topDirectors: CastTopItem[];
}
