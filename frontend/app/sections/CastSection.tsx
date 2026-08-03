'use client';

import { useEffect, useMemo, useState } from 'react';
import type { UserFilm, RpcStats, PersonStats } from '@/types/statistics';
import PersonCard from '../components/PersonCard';
import PersonModal from '../components/PersonModal';
import { motion, AnimatePresence } from 'framer-motion';

type CastSectionProps = {
  importedItems: UserFilm[] | null;
  stats: RpcStats | null;
  loading: boolean;
};

function formatCount(count: number) {
  return `${count} film${count === 1 ? '' : 's'}`;
}

// Stat card to display key metrics
function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-border/70 bg-white/80 p-4 shadow-sm backdrop-blur">
      <p className="text-xs uppercase tracking-[0.22em] text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">{value}</p>
    </div>
  );
}

function filterByWatchYears<T extends { movies: { id: number }[] }>(
  people: T[],
  selectedYears: number[] | null,
  movieWatchYears: Map<number, Set<number>>
) {
  return people
    .map((person) => {
      const movies = person.movies.filter((movie) => {
        const watchYears = movieWatchYears.get(movie.id);

        // Film isn't in the user's watched films
        if (!watchYears) return false;

        // All years = any watched film
        if (selectedYears === null) {
          return true;
        }

        // Selected years = watched in at least one selected year
        return selectedYears.some((year) => watchYears.has(year));
      });

      return {
        ...person,
        movies,
        count: movies.length,
      };
    })
    .filter((person) => person.count > 0)
    .sort((a, b) => b.count - a.count);
}

function getFilmsForPerson(
  person: PersonStats,
  selectedYears: number[] | null,
  filmsByTmdbId: Map<number, UserFilm>
) {
  return person.movies.flatMap((movie) => {
    const film = filmsByTmdbId.get(movie.id);

    if (!film || !film.watched) return [];

    // All years: keep all diary entries
    if (selectedYears === null) {
      return [film];
    }

    // Only keep diary entries from the selected year(s)
    const watchedEvents = film.watchedEvents.filter((event) =>
      selectedYears.includes(new Date(event.date).getFullYear())
    );

    // Don't include the film if it has no diary entry in the selected year
    if (watchedEvents.length === 0) return [];

    return [
      {
        ...film,
        watchedEvents,
      },
    ];
  });
}

export default function CastSection({ importedItems, stats, loading }: CastSectionProps) {
  const [error, setError] = useState<string | null>(null);
  /** Selected diary years (null = "All years") */
  const [selectedYears, setSelectedYears] = useState<number[] | null>(null);
  const items = useMemo(() => importedItems ?? [], [importedItems]);
  const hasItems = items.length > 0;
  const [visibleCast, setVisibleCast] = useState(5);
  const [prevVisibleCast, setPrevVisibleCast] = useState(5);
  const [visibleDirectors, setVisibleDirectors] = useState(5);
  const [prevVisibleDirectors, setPrevVisibleDirectors] = useState(5);
  const [selectedPerson, setSelectedPerson] = useState<{
    person: PersonStats;
    films: UserFilm[];
  } | null>(null);

  const filmsByTmdbId = useMemo(
    () =>
      new Map(
        items
          .filter((film): film is UserFilm & { tmdbId: number } => film.tmdbId != null)
          .map((film) => [film.tmdbId, film])
      ),
    [items]
  );

  // Compute available diary years from diary-only items.
  const availableYears = useMemo(() => {
    const years = new Set<number>();

    for (const film of items) {
      for (const event of film.watchedEvents) {
        years.add(new Date(event.date).getFullYear());
      }
    }

    return [...years].sort((a, b) => b - a);
  }, [items]);

  function toggleYear(year: number) {
    setSelectedYears((current) => {
      const currentYears = current ?? [];

      if (currentYears.includes(year)) {
        const next = currentYears.filter((value) => value !== year);
        return next.length ? next : null;
      }

      return [...currentYears, year].sort((left, right) => right - left);
    });
  }

  const movieWatchYears = useMemo(() => {
    const map = new Map<number, Set<number>>();

    for (const film of items) {
      if (film.tmdbId == null || !film.watched) continue;

      const years = new Set<number>();

      for (const event of film.watchedEvents) {
        years.add(new Date(event.date).getFullYear());
      }

      map.set(film.tmdbId, years);
    }

    return map;
  }, [items]);

  const filteredCast = useMemo(
    () => filterByWatchYears(stats?.topCast ?? [], selectedYears, movieWatchYears),
    [stats, selectedYears, movieWatchYears]
  );

  const filteredDirectors = useMemo(
    () => filterByWatchYears(stats?.topDirectors ?? [], selectedYears, movieWatchYears),
    [stats, selectedYears, movieWatchYears]
  );

  return (
    <section className="flex flex-col gap-4">
      <h1 className="text-4xl font-semibold tracking-tight">Cast & Directors</h1>
      {availableYears.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setSelectedYears(null)}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
              selectedYears === null
                ? 'border-slate-900 bg-slate-900 text-white'
                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
            }`}
          >
            All years
          </button>
          {availableYears.map((year) => {
            const active = selectedYears === null ? false : selectedYears.includes(year);

            return (
              <button
                key={year}
                type="button"
                onClick={() => toggleYear(year)}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                  active
                    ? 'border-emerald-700 bg-emerald-700 text-white'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                }`}
              >
                {year}
              </button>
            );
          })}
        </div>
      )}
      <div className="flex items-center justify-between gap-4">
        {loading && <p className="text-sm text-slate-500">Refreshing…</p>}
      </div>

      {error && (
        <p className="mt-4 rounded-2xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      {hasItems && !error && stats && (
        <div className="mt-5 space-y-5">
          <div className="flex flex-col gap-4">
            <div className="rounded-3xl border border-border/70 bg-card p-4 shadow-sm">
              <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Top cast</p>
              <div className="mt-3">
                {filteredCast.length ? (
                  <>
                    <motion.div
                      layout
                      transition={{
                        layout: {
                          duration: 0.35,
                          ease: 'easeInOut',
                        },
                      }}
                      className="grid grid-cols-5 gap-4"
                    >
                      <AnimatePresence>
                        {filteredCast.slice(0, visibleCast).map((person) => (
                          <motion.div
                            key={person.id}
                            layout
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ duration: 0.25 }}
                          >
                            <PersonCard
                              person={person}
                              onClick={() =>
                                setSelectedPerson({
                                  person,
                                  films: getFilmsForPerson(person, selectedYears, filmsByTmdbId),
                                })
                              }
                            />
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </motion.div>

                    <div className="mt-4 flex justify-center gap-3">
                      {visibleCast > 5 && (
                        <button
                          onClick={() => setVisibleCast(5)}
                          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-100"
                        >
                          Show less
                        </button>
                      )}

                      {visibleCast < filteredCast.length && (
                        <button
                          onClick={() => {
                            if (visibleCast === 5 && prevVisibleCast > 5) {
                              setVisibleCast(prevVisibleCast);
                            } else {
                              setVisibleCast((prev) => {
                                const next = Math.min(filteredCast.length, prev + 10);
                                setPrevVisibleCast(next);
                                return next;
                              });
                            }
                          }}
                          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-100"
                        >
                          Show more
                        </button>
                      )}
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-slate-500">No cast data yet.</p>
                )}
              </div>
            </div>

            <div className="rounded-3xl border border-border/70 bg-card p-4 shadow-sm">
              <p className="text-xs uppercase tracking-[0.22em] text-subtitle">Top directors</p>
              <div className="mt-3">
                {filteredDirectors.length ? (
                  <>
                    <motion.div
                      layout
                      transition={{
                        layout: {
                          duration: 0.35,
                          ease: 'easeInOut',
                        },
                      }}
                      className="grid grid-cols-5 gap-4"
                    >
                      <AnimatePresence>
                        {filteredDirectors.slice(0, visibleDirectors).map((person) => (
                          <motion.div
                            key={person.id}
                            layout
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ duration: 0.25 }}
                          >
                            <PersonCard
                              person={person}
                              onClick={() =>
                                setSelectedPerson({
                                  person,
                                  films: getFilmsForPerson(person, selectedYears, filmsByTmdbId),
                                })
                              }
                            />
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </motion.div>

                    <div className="mt-4 flex justify-center gap-3">
                      {visibleDirectors > 5 && (
                        <button
                          onClick={() => setVisibleDirectors(5)}
                          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-100"
                        >
                          Show less
                        </button>
                      )}

                      {visibleDirectors < filteredDirectors.length && (
                        <button
                          onClick={() => {
                            if (visibleDirectors === 5 && prevVisibleDirectors > 5) {
                              setVisibleDirectors(prevVisibleDirectors);
                            } else {
                              setVisibleDirectors((prev) => {
                                const next = Math.min(filteredDirectors.length, prev + 10);
                                setPrevVisibleDirectors(next);
                                return next;
                              });
                            }
                          }}
                          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-100"
                        >
                          Show more
                        </button>
                      )}
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-slate-500">No director data yet.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {!hasItems && !loading && !error && (
        <p className="mt-4 text-sm text-slate-500">Import a ZIP export to populate cast stats.</p>
      )}
      {selectedPerson && (
        <PersonModal
          person={selectedPerson.person}
          films={selectedPerson.films}
          onClose={() => setSelectedPerson(null)}
        />
      )}
    </section>
  );
}
