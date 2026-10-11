'use client';

import { useEffect, useMemo } from 'react';
import Image from 'next/image';
import type { PersonStats, UserFilm } from '@/types/statistics';
import { getPosterUrl } from '@/utils/tmdb';
import FilmCard from './FilmCard';

type PersonModalProps = {
  person: PersonStats;
  films: UserFilm[];
  onClose: () => void;
};

export default function PersonModal({ person, films, onClose }: PersonModalProps) {
  const profileUrl = getPosterUrl(person.profile_path, 'w342');

  const personFilms = useMemo(() => {
    const filmIds = new Set(person.movies.map((movie) => movie.id));

    return films
      .filter((film) => typeof film.tmdbId === 'number' && filmIds.has(film.tmdbId) && film.watched)
      .map((film) => {
        const events = [...(film.watchedEvents ?? [])].sort((a, b) =>
          (b.date ?? '').localeCompare(a.date ?? '')
        );

        return { film, latestEvent: events[0] };
      })
      .filter(
        (
          entry
        ): entry is {
          film: UserFilm;
          latestEvent: NonNullable<UserFilm['watchedEvents']>[number];
        } => Boolean(entry.latestEvent)
      )
      .sort((a, b) => {
        const dateComparison = (b.latestEvent.date ?? '').localeCompare(a.latestEvent.date ?? '');

        return dateComparison || a.film.name.localeCompare(b.film.name);
      });
  }, [films, person.movies]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-2 backdrop-blur-sm sm:p-5"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="person-modal-title"
        className="flex max-h-[92dvh] w-full max-w-6xl flex-col overflow-hidden border border-border bg-background text-foreground shadow-2xl"
      >
        {/* Modal toolbar */}
        <header className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3 sm:px-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted">
            Film archive / Personnel file
          </p>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close person details"
            className="flex h-9 w-9 items-center justify-center border border-border text-muted transition-colors hover:border-accent hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <span aria-hidden="true">✕</span>
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {/* Profile dossier */}
          <div className="grid border-b border-border md:grid-cols-[220px_minmax(0,1fr)] lg:grid-cols-[280px_minmax(0,1fr)]">
            <div className="relative flex min-h-52 items-center justify-center overflow-hidden border-b border-border bg-surface p-6 md:min-h-0 md:border-b-0 md:border-r">
              <span className="absolute left-4 top-4 font-mono text-[10px] uppercase tracking-wider text-muted">
                Profile / 01
              </span>

              {profileUrl ? (
                <div className="relative mt-5 aspect-[2/3] w-32 shrink-0 overflow-hidden border border-border sm:w-36 md:w-full md:max-w-48">
                  <Image
                    src={profileUrl}
                    alt={person.name}
                    fill
                    sizes="(max-width: 768px) 144px, 192px"
                    className="object-cover"
                    priority
                  />
                </div>
              ) : (
                <div className="mt-5 flex aspect-[2/3] w-32 items-center justify-center border border-border bg-background font-serif text-5xl text-accent sm:w-36 md:w-full md:max-w-48">
                  {person.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            <div className="flex min-w-0 flex-col justify-center p-5 sm:p-8 lg:p-10">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-accent">
                A familiar name
              </p>

              <h2
                id="person-modal-title"
                className="mt-4 break-words font-serif text-3xl leading-tight tracking-tight sm:text-4xl lg:text-5xl"
              >
                {person.name}
              </h2>

              <p className="mt-3 text-sm text-muted">A recurring presence in your film diary.</p>

              <div className="mt-8 grid grid-cols-2 border-y border-border">
                <div className="py-4 pr-4">
                  <p className="font-mono text-[10px] uppercase tracking-wider text-muted">
                    Films together
                  </p>
                  <p className="mt-2 font-serif text-3xl">{person.count.toLocaleString('en-GB')}</p>
                </div>

                <div className="border-l border-border py-4 pl-4 sm:pl-6">
                  <p className="font-mono text-[10px] uppercase tracking-wider text-muted">
                    In your archive
                  </p>
                  <p className="mt-2 font-serif text-3xl">
                    {personFilms.length.toLocaleString('en-GB')}
                  </p>
                </div>
              </div>

              <p className="mt-4 text-xs leading-5 text-muted">
                Showing matching films from your imported Letterboxd diary, ordered by your most
                recent watch.
              </p>
            </div>
          </div>

          {/* Filmography */}
          <div className="p-4 sm:p-6 lg:p-8">
            <div className="mb-6 flex flex-wrap items-end justify-between gap-3 border-b border-border pb-4">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-accent">
                  Your screening record / 02
                </p>
                <h3 className="mt-2 font-serif text-2xl sm:text-3xl">Films in your diary.</h3>
              </div>

              <span className="font-mono text-[10px] text-muted">
                {String(personFilms.length).padStart(2, '0')} TITLES
              </span>
            </div>

            {personFilms.length > 0 ? (
              <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 sm:gap-x-5 md:grid-cols-4 lg:grid-cols-5">
                {personFilms.map(({ film, latestEvent }) => (
                  <FilmCard
                    key={film.tmdbId ?? `${film.name}-${film.year}`}
                    film={film}
                    watchedEvent={latestEvent}
                  />
                ))}
              </div>
            ) : (
              <div className="border border-dashed border-border px-5 py-12 text-center">
                <p className="font-serif text-xl">No matching films found.</p>
                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">
                  This person has credits in the statistics, but no matching watched films were
                  found in the imported archive.
                </p>
              </div>
            )}
          </div>
        </div>

        <footer className="flex shrink-0 items-center justify-between gap-3 border-t border-border px-4 py-3 sm:px-6">
          <span className="font-mono text-[10px] uppercase tracking-wider text-muted">
            Personal film archive
          </span>
          <button
            type="button"
            onClick={onClose}
            className="border-b border-accent pb-1 text-xs text-accent hover:opacity-70"
          >
            Close dossier ↗
          </button>
        </footer>
      </section>
    </div>
  );
}
