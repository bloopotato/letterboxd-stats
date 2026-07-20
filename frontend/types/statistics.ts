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
  genreNames: string[];

  // Non-letterboxd data
  tmdbId: number | null;
  runtime: number | null;
  posterPath: string | null;

  cached: boolean;
}

export interface StatsMovie {
  id: number;
  year: number;
  title: string;
  letterboxdUri: string | null;
}

// -------------------- CAST STATS -------------------

export interface PersonStats {
  category: 'cast' | 'director';
  id: number;
  name: string;
  count: number;
  movies: StatsMovie[];
  profile_path: string | null;
}

// -------------------- GENRE STATS -------------------

export interface GenreStats {
  id: number;
  name: string;
  count: number;
  movies: StatsMovie[];
}

export interface RpcStats {
  watchedCount: number;
  topCast: PersonStats[];
  topDirectors: PersonStats[];
  topGenres: GenreStats[];
}
