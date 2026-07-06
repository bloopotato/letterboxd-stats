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
