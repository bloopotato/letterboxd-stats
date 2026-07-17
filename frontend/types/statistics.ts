export interface WatchedEvent {
  date: string;
  rating: number | null;
  rewatch: boolean;
  tags: string[];
  letterboxdUri: string | null;
}

export interface UserFilm {
  name: string;
  year: number;
  watchedEvents: WatchedEvent[];
  watched: boolean;
  inWatchlist: boolean;
  rating: number | null;
  letterboxdUri: string | null;

  // Non-letterboxd data
  tmdbId: number | null;
  runtime: number | null;
  posterPath: string | null;

  cached: boolean;
}

// -------------------- CAST STATS -------------------

export interface CastMovie {
  id: number;
  year: number;
  title: string;
  letterboxdUri: string | null;
}

export interface PersonStats {
  category: 'cast' | 'director';
  id: number;
  name: string;
  count: number;
  movies: CastMovie[];
  profile_path: string | null;
}

export interface CastStats {
  watchedCount: number;
  topCast: PersonStats[];
  topDirectors: PersonStats[];
}
