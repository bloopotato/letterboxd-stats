'use client';

import { useMemo } from 'react';
import type { UserFilm } from '@/types/statistics';
import FilmCard from '@/app/components/FilmCard';

type WatchedEvent = UserFilm['watchedEvents'][number];

type WatchedEntry = {
  film: UserFilm;
  watchedEvent: WatchedEvent;
  index: number;
};

function getWatchedEvents(films: UserFilm[]): WatchedEntry[] {
  return films.flatMap((film, index) =>
    (film.watchedEvents ?? []).map((watchedEvent) => ({
      film,
      watchedEvent,
      index,
    }))
  );
}

function getRecentWatchedEvents(films: UserFilm[], limit = 4): WatchedEntry[] {
  return getWatchedEvents(films)
    .sort((a, b) => {
      const dateA = Date.parse(a.watchedEvent.date);
      const dateB = Date.parse(b.watchedEvent.date);

      const safeDateA = Number.isNaN(dateA) ? Number.NEGATIVE_INFINITY : dateA;
      const safeDateB = Number.isNaN(dateB) ? Number.NEGATIVE_INFINITY : dateB;

      return safeDateB - safeDateA || b.index - a.index;
    })
    .slice(0, limit);
}

export default function RecentsSection({ importedItems }: { importedItems: UserFilm[] }) {
  const recents = useMemo(() => getRecentWatchedEvents(importedItems ?? []), [importedItems]);

  return (
    <section id="recents" className="flex w-full flex-col gap-6 text-foreground">
      <header className="flex flex-col justify-between gap-4 border-b border-border pb-6 sm:flex-row sm:items-end">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-accent">
            The latest screenings / 02
          </p>

          <h2 className="mt-4 font-serif text-4xl font-normal leading-tight tracking-tight sm:text-5xl lg:text-6xl">
            Your recents.
          </h2>

          <p className="mt-3 max-w-md text-sm leading-6 text-muted">
            A running record of the films that made it into your diary most recently.
          </p>
        </div>

        <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted">
          {String(recents.length).padStart(2, '0')} / Recent entries
        </span>
      </header>

      {recents.length > 0 ? (
        <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 sm:gap-x-5 lg:grid-cols-4 lg:gap-x-6">
          {recents.map(({ film, watchedEvent, index }, position) => (
            <div
              key={`${film.tmdbId ?? film.name}-${watchedEvent.date}-${index}-${position}`}
              className="min-w-0"
            >
              <FilmCard film={film} watchedEvent={watchedEvent} />
            </div>
          ))}
        </div>
      ) : (
        <div className="flex min-h-44 flex-col items-center justify-center border-y border-border px-6 py-12 text-center">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-accent">
            No screenings yet
          </p>

          <h3 className="mt-3 font-serif text-2xl text-foreground">The story starts here.</h3>

          <p className="mt-2 max-w-sm text-sm leading-6 text-muted">
            Import your Letterboxd diary to see your latest watches here.
          </p>
        </div>
      )}
    </section>
  );
}
