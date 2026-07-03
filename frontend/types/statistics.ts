export interface watchedEvent {
  name: string;
}

export interface userFilmMap {
  watchedEvents: watchedEvent[];
  watched: boolean;
  inWatchlist: boolean;
  rating: number | null;
  rewatch: boolean;
  tags: string[];
}
