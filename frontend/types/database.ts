export interface MovieLookup {
  title: string;
  year?: number;
  letterboxd_uri?: string | null;
}

// Details retrieved from Supabase cache
export interface BulkMovieLookupResult {
  id: number;
  title: string;
  original_title: string;
  release_date: string | null;
  poster_path: string | null;
  vote_average: number;
  letterboxd_uri: string | null;
  matched_by: 'uri' | 'title_year';
}

export type BulkMovieLookupRow = {
  input_title: string;
  input_letterboxd_uri: string | null;
} & BulkMovieLookupResult;

// ==================== SUPABASE TABLES ====================

// -------------------- tmdb_countries --------------------
export interface TMDBCountryRow {
  iso_3166_1: string;
  name: string;
}

// -------------------- tmdb_credits --------------------
export interface TMDBCreditRow {
  movie_id: number;
  person_id: number;
  department: string | null;
  job: string | null;
  character: string | null;
  cast_order: number | null;
}

export interface TMDBCredits {
  cast: TMDBCastMember[];
  crew: TMDBCrewMember[];
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

// -------------------- tmdb_genres --------------------

export interface TMDBGenreRow {
  id: number;
  name: string;
}

export interface TMDBGenre {
  id: number;
  name: string;
}

// -------------------- tmdb_languages --------------------

export interface TMDBLanguageRow {
  iso_639_1: string;
  english_name: string;
  name: string;
}

export interface TMDBSpokenLanguage {
  english_name: string;
  iso_639_1: string;
  name: string;
}

// -------------------- tmdb_languages --------------------
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
  letterboxd_uri?: string | null;
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
  letterboxd_uri: string | null;
  raw: TMDBMovieDetails;
}
