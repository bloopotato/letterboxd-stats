'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import type { UserFilm, RpcStats, PersonStats } from '@/types/statistics';
import { getPosterUrl } from '@/utils/tmdb';
import PersonModal from '@/app/components/PersonModal';

type CastSectionProps = {
  importedItems: UserFilm[] | null;
};

type CollaboratorCategory = 'cast' | 'director';

type CollaboratorGroupProps = {
  title: string;
  eyebrow: string;
  people: PersonStats[];
  category: CollaboratorCategory;
  showAll: boolean;
  onToggleShowAll: () => void;
  onSelectPerson: (person: PersonStats) => void;
};

const EMPTY_STATS: RpcStats = {
  watchedCount: 0,
  topCast: [],
  topDirectors: [],
  topGenres: [],
};

function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function CollaboratorGroup({
  title,
  eyebrow,
  people,
  category,
  showAll,
  onToggleShowAll,
  onSelectPerson,
}: CollaboratorGroupProps) {
  const [featured, ...remaining] = people;
  const visibleRemaining = showAll ? remaining : remaining.slice(0, 4);

  return (
    <section className="border-t border-border pt-6">
      <header className="mb-6 flex items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-accent">{eyebrow}</p>
          <h3 className="mt-2 font-serif text-3xl font-normal tracking-tight text-foreground sm:text-4xl">
            {title}
          </h3>
        </div>

        <span className="shrink-0 font-mono text-[10px] text-muted">
          {String(people.length).padStart(2, '0')} PEOPLE
        </span>
      </header>

      {featured ? (
        <div className="grid min-w-0 gap-8 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
          {/* Featured collaborator on the left */}
          <button
            type="button"
            onClick={() => onSelectPerson(featured)}
            aria-label={`View films featuring ${featured.name}`}
            className="group flex min-w-0 items-start gap-4 border-b border-border pb-6 text-left sm:gap-5 lg:flex-col lg:border-b-0 lg:pb-0"
          >
            <div className="relative h-36 w-28 shrink-0 overflow-hidden border border-border bg-surface sm:h-44 sm:w-36 lg:aspect-[3/4] lg:h-auto lg:w-full lg:max-w-56">
              {featured.profile_path ? (
                <Image
                  src={getPosterUrl(featured.profile_path, 'w342')}
                  alt={featured.name}
                  fill
                  sizes="(max-width: 1024px) 144px, 224px"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center font-serif text-4xl text-accent">
                  {getInitials(featured.name)}
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1 lg:w-full">
              <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted">
                Most watched {category === 'cast' ? 'cast member' : 'director'}
              </p>

              <h4 className="mt-3 break-words font-serif text-2xl leading-tight text-foreground transition-colors group-hover:text-accent sm:text-3xl">
                {featured.name}
              </h4>

              <p className="mt-3 text-sm text-muted">
                {featured.count} {featured.count === 1 ? 'film' : 'films'} in your diary
              </p>

              <span className="mt-5 inline-flex items-center gap-2 border-b border-accent pb-1 text-xs text-accent">
                Explore film credits <span aria-hidden="true">↗</span>
              </span>
            </div>
          </button>

          {/* Remaining collaborators on the right */}
          <div className="min-w-0">
            <div className="mb-2 flex items-center justify-between gap-3 border-b border-border pb-3">
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted">
                Also in your archive
              </p>
              <span className="font-mono text-[10px] text-muted">{remaining.length} MORE</span>
            </div>

            <div className="divide-y divide-border">
              {visibleRemaining.map((person, index) => (
                <button
                  key={`${category}-${person.id}`}
                  type="button"
                  onClick={() => onSelectPerson(person)}
                  aria-label={`View films featuring ${person.name}`}
                  className="group grid w-full grid-cols-[1.5rem_3rem_minmax(0,1fr)_2rem] items-center gap-3 py-3 text-left transition-colors hover:bg-surface-hover sm:grid-cols-[2rem_3.5rem_minmax(0,1fr)_2rem] sm:gap-4 sm:px-2"
                >
                  <span className="font-mono text-[10px] tabular-nums text-muted">
                    {String(index + 2).padStart(2, '0')}
                  </span>

                  <div className="relative h-11 w-11 overflow-hidden border border-border bg-surface sm:h-14 sm:w-14">
                    {person.profile_path ? (
                      <Image
                        src={getPosterUrl(person.profile_path, 'w185')}
                        alt={person.name}
                        fill
                        sizes="56px"
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center font-serif text-base text-accent">
                        {getInitials(person.name)}
                      </div>
                    )}
                  </div>

                  <div className="min-w-0">
                    <p className="truncate font-serif text-base text-foreground transition-colors group-hover:text-accent">
                      {person.name}
                    </p>
                    <p className="mt-1 text-[10px] text-muted">
                      {person.count} {person.count === 1 ? 'film' : 'films'}
                    </p>
                  </div>

                  <span
                    aria-hidden="true"
                    className="text-right text-sm text-accent opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    ↗
                  </span>
                </button>
              ))}

              {remaining.length === 0 && (
                <p className="py-6 text-sm text-muted">
                  No other collaborators in this category yet.
                </p>
              )}
            </div>

            {remaining.length > 4 && (
              <button
                type="button"
                onClick={onToggleShowAll}
                className="mt-3 border-b border-border py-2 text-xs text-muted transition-colors hover:border-accent hover:text-accent"
              >
                {showAll ? 'Show fewer collaborators ↑' : `View all ${remaining.length} more ↓`}
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="border-b border-border py-8">
          <p className="font-serif text-xl text-foreground">
            No {category === 'cast' ? 'cast' : 'director'} data yet.
          </p>
          <p className="mt-2 text-sm leading-6 text-muted">
            Collaborator statistics will appear when credits are available for your watched films.
          </p>
        </div>
      )}
    </section>
  );
}

export default function CastSection({ importedItems }: CastSectionProps) {
  const [stats, setStats] = useState<RpcStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const [selectedYears, setSelectedYears] = useState<number[]>([]);
  const [showAllCast, setShowAllCast] = useState(false);
  const [showAllDirectors, setShowAllDirectors] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<PersonStats | null>(null);

  const availableYears = useMemo(() => {
    const years = new Set<number>();

    for (const film of importedItems ?? []) {
      if (!film.watched) continue;

      for (const event of film.watchedEvents ?? []) {
        const year = Number(event.date?.slice(0, 4));

        if (Number.isInteger(year) && year > 0) {
          years.add(year);
        }
      }
    }

    return [...years].sort((a, b) => b - a);
  }, [importedItems]);

  const visibleItems = useMemo(() => {
    return (importedItems ?? []).filter((film) => {
      if (!film.watched) return false;
      if (selectedYears.length === 0) return true;

      return (film.watchedEvents ?? []).some((event) =>
        selectedYears.includes(Number(event.date?.slice(0, 4)))
      );
    });
  }, [importedItems, selectedYears]);

  useEffect(() => {
    let cancelled = false;

    async function fetchStats() {
      const tmdbIds = [
        ...new Set(
          visibleItems
            .map((film) => film.tmdbId)
            .filter((id): id is number => typeof id === 'number')
        ),
      ];

      if (tmdbIds.length === 0) {
        setStats(EMPTY_STATS);
        setError(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/stats', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: tmdbIds.map((tmdbId) => ({ tmdbId })),
          }),
        });

        if (!response.ok) {
          throw new Error(`Failed to load statistics (${response.status})`);
        }

        const json: { stats?: RpcStats; error?: string } = await response.json();

        if (!json.stats) {
          throw new Error(json.error || 'Statistics response was empty.');
        }

        if (!cancelled) setStats(json.stats);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Unable to load statistics.');
          setStats(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void fetchStats();

    return () => {
      cancelled = true;
    };
  }, [visibleItems, retryCount]);

  function toggleYear(year: number) {
    setSelectedYears((current) =>
      current.includes(year)
        ? current.filter((item) => item !== year)
        : [...current, year].sort((a, b) => b - a)
    );
  }

  const castPeople = stats?.topCast ?? [];
  const directorPeople = stats?.topDirectors ?? [];

  const topDirector = directorPeople[0] ?? null;

  const directorFilmIds = useMemo(
    () => new Set(topDirector?.movies.map((movie) => movie.id) ?? []),
    [topDirector]
  );

  const directorEvents = useMemo(() => {
    if (!topDirector) return [];

    return visibleItems.flatMap((film) => {
      if (typeof film.tmdbId !== 'number' || !directorFilmIds.has(film.tmdbId)) {
        return [];
      }

      return (film.watchedEvents ?? []).filter((event) => {
        if (selectedYears.length === 0) return true;

        return selectedYears.includes(Number(event.date?.slice(0, 4)));
      });
    });
  }, [topDirector, visibleItems, directorFilmIds, selectedYears]);

  const topDirectorAverageRating = useMemo(() => {
    const ratings = directorEvents
      .map((event) => event.rating)
      .filter(
        (rating): rating is number =>
          typeof rating === 'number' && Number.isFinite(rating) && rating > 0
      );

    if (ratings.length === 0) return null;

    return ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
  }, [directorEvents]);

  return (
    <section id="cast" className="flex w-full flex-col gap-8 text-foreground">
      <header className="border-b border-border pb-6">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-accent">
          Your film archive / 05
        </p>

        <div className="mt-5">
          <h2 className="font-serif text-4xl font-normal leading-tight tracking-tight sm:text-5xl lg:text-6xl">
            Behind the frame.
          </h2>
          <p className="mt-3 max-w-lg text-sm leading-6 text-muted">
            The actors and directors who appear most often in your personal history of cinema.
          </p>
        </div>
      </header>

      {/* Shared year filters */}
      {availableYears.length > 0 && (
        <div>
          <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
            Filter by diary year
          </p>

          <div className="flex flex-wrap gap-x-5 gap-y-2">
            <button
              type="button"
              onClick={() => setSelectedYears([])}
              aria-pressed={selectedYears.length === 0}
              className={`border-b py-2 text-xs transition-colors ${
                selectedYears.length === 0
                  ? 'border-accent text-accent'
                  : 'border-transparent text-muted hover:text-foreground'
              }`}
            >
              All years
            </button>

            {availableYears.map((year) => {
              const active = selectedYears.includes(year);

              return (
                <button
                  type="button"
                  key={year}
                  onClick={() => toggleYear(year)}
                  aria-pressed={active}
                  className={`border-b py-2 font-mono text-xs transition-colors ${
                    active
                      ? 'border-accent text-accent'
                      : 'border-transparent text-muted hover:text-foreground'
                  }`}
                >
                  {year}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="flex min-h-40 items-center gap-4 border-y border-border py-8">
          <span className="h-5 w-5 animate-spin border-2 border-border border-t-accent" />
          <div>
            <p className="font-serif text-xl text-foreground">Looking through the credits.</p>
            <p className="mt-1 text-xs text-muted">Gathering cast and director statistics…</p>
          </div>
        </div>
      )}

      {/* Error state */}
      {!loading && error && (
        <div className="border-y border-border py-8">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-accent">
            Archive lookup failed
          </p>
          <p className="mt-3 text-sm text-muted">{error}</p>
          <button
            type="button"
            onClick={() => setRetryCount((count) => count + 1)}
            className="mt-4 border-b border-accent pb-1 text-sm text-accent hover:opacity-70"
          >
            Try again ↻
          </button>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && visibleItems.length === 0 && (
        <div className="border-y border-border py-12">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-accent">
            No screenings found
          </p>
          <h3 className="mt-3 font-serif text-2xl text-foreground">Nothing in the frame yet.</h3>
          <p className="mt-2 text-sm leading-6 text-muted">
            Import your Letterboxd diary or choose another year to explore your cast and directors.
          </p>
        </div>
      )}

      {/* Cast first, directors second */}
      {!loading && !error && visibleItems.length > 0 && (
        <div className="flex flex-col gap-10">
          <CollaboratorGroup
            title="Cast"
            eyebrow="In front of the camera / 01"
            people={castPeople}
            category="cast"
            showAll={showAllCast}
            onToggleShowAll={() => setShowAllCast((current) => !current)}
            onSelectPerson={setSelectedPerson}
          />

          <CollaboratorGroup
            title="Directors"
            eyebrow="Behind the camera / 02"
            people={directorPeople}
            category="director"
            showAll={showAllDirectors}
            onToggleShowAll={() => setShowAllDirectors((current) => !current)}
            onSelectPerson={setSelectedPerson}
          />

          {/* Featured director viewing statistics */}
          {topDirector && (
            <div className="grid grid-cols-2 border-y border-border py-4 sm:grid-cols-3">
              <div className="pr-4">
                <p className="font-mono text-[10px] uppercase tracking-wider text-muted">
                  Favourite director
                </p>
                <p className="mt-2 truncate font-serif text-lg text-foreground">
                  {topDirector.name}
                </p>
              </div>

              <div className="border-l border-border px-4">
                <p className="font-mono text-[10px] uppercase tracking-wider text-muted">
                  Total views
                </p>
                <p className="mt-2 font-serif text-2xl text-foreground">{directorEvents.length}</p>
              </div>

              <div className="col-span-2 mt-4 border-t border-border pt-4 sm:col-span-1 sm:mt-0 sm:border-l sm:border-t-0 sm:pl-4 sm:pt-0">
                <p className="font-mono text-[10px] uppercase tracking-wider text-muted">
                  Average rating
                </p>
                <p className="mt-2 font-serif text-2xl text-foreground">
                  {topDirectorAverageRating !== null ? topDirectorAverageRating.toFixed(1) : '—'}
                  <span className="ml-1 font-mono text-[10px] text-muted">/ 5</span>
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {selectedPerson && (
        <PersonModal
          person={selectedPerson}
          films={importedItems ?? []}
          onClose={() => setSelectedPerson(null)}
        />
      )}
    </section>
  );
}
