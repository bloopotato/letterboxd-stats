'use client';

import { useMemo, useState } from 'react';
import type { UserFilm, WatchedEvent } from '@/types/statistics';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import FilmCard from '../components/FilmCard';

type Timeframe = 'All' | number;
type Grouping = 'Year' | 'Month' | 'Day';
type WatchedEventWithFilm = WatchedEvent & { film: UserFilm };

type GenreSlice = {
  label: string;
  watched: number;
  color: string;
};

const GENRE_COLORS = [
  'var(--accent)',
  'var(--accent-orange)',
  'var(--accent-blue)',
  '#8b9d77',
  '#c7839d',
  '#d2b66f',
  '#8b83c7',
  '#6ba9a1',
];

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function parseDate(date: string): number {
  const timestamp = Date.parse(date);
  return Number.isNaN(timestamp) ? Number.NEGATIVE_INFINITY : timestamp;
}

function filmIdentity(film: UserFilm): string {
  return film.tmdbId != null ? `tmdb:${film.tmdbId}` : `${film.name}|${film.year ?? ''}`;
}

function normaliseGenres(genres: string[]): string[] {
  return [...new Set(genres.map((genre) => genre.trim()).filter(Boolean))];
}

const tooltipStyle = {
  backgroundColor: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: '0px',
  color: 'var(--text)',
  fontSize: '12px',
};

const selectClass =
  'min-w-0 border-b border-border bg-transparent px-1 py-2 text-xs text-foreground outline-none transition-colors hover:border-accent focus:border-accent';

export default function StatsSection({ importedItems }: { importedItems: UserFilm[] }) {
  const [timeframe, setTimeframe] = useState<Timeframe>('All');
  const [groupBy, setGroupBy] = useState<Grouping>('Year');
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);

  const watchedEvents = useMemo<WatchedEventWithFilm[]>(() => {
    return importedItems.flatMap((film) =>
      (film.watchedEvents ?? []).map((event) => ({
        ...event,
        film,
      }))
    );
  }, [importedItems]);

  const years = useMemo(() => {
    const availableYears = new Set<number>();

    watchedEvents.forEach((event) => {
      const timestamp = parseDate(event.date);
      if (timestamp === Number.NEGATIVE_INFINITY) return;

      availableYears.add(new Date(timestamp).getFullYear());
    });

    return [...availableYears].sort((a, b) => b - a);
  }, [watchedEvents]);

  const filteredEvents = useMemo(() => {
    if (timeframe === 'All') return watchedEvents;

    return watchedEvents.filter((event) => {
      const timestamp = parseDate(event.date);

      return (
        timestamp !== Number.NEGATIVE_INFINITY && new Date(timestamp).getFullYear() === timeframe
      );
    });
  }, [watchedEvents, timeframe]);

  const genreData = useMemo<GenreSlice[]>(() => {
    const counts = new Map<string, number>();

    filteredEvents.forEach(({ film }) => {
      for (const genre of normaliseGenres(film.genreNames ?? [])) {
        counts.set(genre, (counts.get(genre) ?? 0) + 1);
      }
    });

    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([label, watched], index) => ({
        label,
        watched,
        color: GENRE_COLORS[index % GENRE_COLORS.length],
      }));
  }, [filteredEvents]);

  const activeSelectedGenre = useMemo(() => {
    if (!selectedGenre) return null;

    return genreData.some((genre) => genre.label === selectedGenre) ? selectedGenre : null;
  }, [genreData, selectedGenre]);

  const selectedGenreFilms = useMemo(() => {
    if (!activeSelectedGenre) return [];

    const latestByFilm = new Map<string, WatchedEventWithFilm>();

    filteredEvents.forEach((event) => {
      const genres = normaliseGenres(event.film.genreNames ?? []);
      if (!genres.includes(activeSelectedGenre)) return;

      const key = filmIdentity(event.film);
      const current = latestByFilm.get(key);

      if (!current || parseDate(event.date) > parseDate(current.date)) {
        latestByFilm.set(key, event);
      }
    });

    return [...latestByFilm.values()]
      .sort((a, b) => parseDate(b.date) - parseDate(a.date))
      .slice(0, 4);
  }, [activeSelectedGenre, filteredEvents]);

  const chartData = useMemo(() => {
    const counts = new Map<string, number>();

    filteredEvents.forEach((event) => {
      const timestamp = parseDate(event.date);
      if (timestamp === Number.NEGATIVE_INFINITY) return;

      const date = new Date(timestamp);
      let label: string;

      switch (groupBy) {
        case 'Year':
          label = String(date.getFullYear());
          break;
        case 'Month':
          label = MONTHS[date.getMonth()];
          break;
        case 'Day':
          label = WEEKDAYS[date.getDay()];
          break;
      }

      counts.set(label, (counts.get(label) ?? 0) + 1);
    });

    if (groupBy === 'Month') {
      return MONTHS.map((label) => ({
        label,
        watched: counts.get(label) ?? 0,
      }));
    }

    if (groupBy === 'Day') {
      return WEEKDAYS.map((label) => ({
        label,
        watched: counts.get(label) ?? 0,
      }));
    }

    return [...counts.entries()]
      .sort((a, b) => Number(a[0]) - Number(b[0]))
      .map(([label, watched]) => ({ label, watched }));
  }, [filteredEvents, groupBy]);

  const totalGenreWatched = genreData.reduce((sum, genre) => sum + genre.watched, 0);

  const activeGenreColor =
    genreData.find((genre) => genre.label === activeSelectedGenre)?.color ?? 'var(--accent)';

  return (
    <section id="statistics" className="flex w-full flex-col gap-8 text-foreground">
      {/* Editorial heading */}
      <header className="flex flex-col justify-between gap-5 border-b border-border pb-6 sm:flex-row sm:items-end">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-accent">
            By the numbers / 03
          </p>

          <h2 className="mt-4 font-serif text-4xl font-normal leading-tight tracking-tight sm:text-5xl lg:text-6xl">
            Films watched.
          </h2>

          <p className="mt-3 max-w-lg text-sm leading-6 text-muted">
            A closer look at your viewing habits, from annual rituals to the genres you return to.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <label className="flex items-center gap-2">
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted">
              Period
            </span>
            <select
              value={String(timeframe)}
              onChange={(event) => {
                const value = event.target.value;
                setTimeframe(value === 'All' ? 'All' : Number(value));
              }}
              className={selectClass}
              aria-label="Filter statistics by year"
            >
              <option value="All">All time</option>
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </label>

          <label className="flex items-center gap-2">
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted">Group</span>
            <select
              value={groupBy}
              onChange={(event) => setGroupBy(event.target.value as Grouping)}
              className={selectClass}
              aria-label="Group watch activity by"
            >
              <option value="Year">Year</option>
              <option value="Month">Month</option>
              <option value="Day">Weekday</option>
            </select>
          </label>
        </div>
      </header>

      {/* Summary figures */}
      <div className="grid grid-cols-2 border-y border-border sm:grid-cols-3">
        <div className="py-5 pr-4 sm:pr-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted">
            Diary entries
          </p>
          <p className="mt-3 font-serif text-3xl tabular-nums text-foreground sm:text-4xl">
            {filteredEvents.length.toLocaleString('en-GB')}
          </p>
          <p className="mt-1 text-xs text-muted">
            {timeframe === 'All' ? 'Across all years' : `In ${timeframe}`}
          </p>
        </div>

        <div className="border-l border-border py-5 pl-4 sm:px-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted">
            Genres explored
          </p>
          <p className="mt-3 font-serif text-3xl tabular-nums text-foreground sm:text-4xl">
            {genreData.length.toLocaleString('en-GB')}
          </p>
          <p className="mt-1 text-xs text-muted">Distinct categories</p>
        </div>

        <div className="col-span-2 mt-4 border-t border-border py-5 sm:col-span-1 sm:mt-0 sm:border-l sm:border-t-0 sm:pl-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted">
            Most watched genre
          </p>
          <p className="mt-3 truncate font-serif text-2xl text-foreground sm:text-3xl">
            {genreData[0]?.label ?? '—'}
          </p>
          {genreData[0] && (
            <p className="mt-1 text-xs text-muted">
              {genreData[0].watched.toLocaleString('en-GB')} diary entries
            </p>
          )}
        </div>
      </div>

      {/* Charts */}
      <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        {/* Viewing activity */}
        <article className="min-w-0">
          <header className="flex items-start justify-between gap-4 border-b border-border pb-4">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-accent">
                01 / Viewing activity
              </p>
              <h3 className="mt-3 font-serif text-2xl sm:text-3xl">Watch volume</h3>
              <p className="mt-2 text-xs leading-5 text-muted">
                {groupBy === 'Year'
                  ? 'Diary entries by year'
                  : groupBy === 'Month'
                    ? 'Diary entries by calendar month'
                    : 'Diary entries by day of the week'}
              </p>
            </div>

            <span className="shrink-0 pt-1 font-mono text-[10px] uppercase tracking-wider text-muted">
              {timeframe === 'All' ? 'All time' : timeframe}
            </span>
          </header>

          <div className="mt-5 h-[22rem]">
            {filteredEvents.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 8, right: 8, left: -20, bottom: 4 }}>
                  <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="2 5" />
                  <XAxis
                    dataKey="label"
                    tick={{ fill: 'var(--muted)', fontSize: 10 }}
                    axisLine={{ stroke: 'var(--border)' }}
                    tickLine={false}
                    dy={8}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fill: 'var(--muted)', fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    cursor={{ fill: 'var(--surface-hover)' }}
                    formatter={(value) => [value, 'Diary entries']}
                  />
                  <Bar
                    dataKey="watched"
                    name="Diary entries"
                    fill="var(--accent)"
                    radius={[0, 0, 0, 0]}
                    maxBarSize={40}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full flex-col items-center justify-center border-y border-border text-center">
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-accent">
                  Nothing to chart
                </p>
                <p className="mt-3 font-serif text-xl text-foreground">No screenings recorded.</p>
                <p className="mt-2 text-sm text-muted">Try another period or import your diary.</p>
              </div>
            )}
          </div>
        </article>

        {/* Genre mix */}
        <article className="min-w-0">
          <header className="flex items-start justify-between gap-3 border-b border-border pb-4">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-accent">
                02 / Your taste in film
              </p>
              <h3 className="mt-3 font-serif text-2xl sm:text-3xl">Genre mix</h3>
              <p className="mt-2 text-xs leading-5 text-muted">
                Select a genre to explore its films.
              </p>
            </div>

            <span className="shrink-0 pt-1 font-mono text-[10px] uppercase tracking-wider text-muted">
              {totalGenreWatched.toLocaleString('en-GB')} watches
            </span>
          </header>

          <div className="mt-4 h-64">
            {genreData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip contentStyle={tooltipStyle} formatter={(value, name) => [value, name]} />
                  <Pie
                    data={genreData}
                    dataKey="watched"
                    nameKey="label"
                    innerRadius="57%"
                    outerRadius="80%"
                    paddingAngle={2}
                    stroke="var(--background)"
                    strokeWidth={2}
                    onClick={(_, index) => {
                      const nextGenre = genreData[index]?.label ?? null;
                      setSelectedGenre(nextGenre);
                    }}
                  >
                    {genreData.map((genre) => (
                      <Cell
                        key={genre.label}
                        fill={genre.color}
                        cursor="pointer"
                        opacity={
                          activeSelectedGenre && genre.label !== activeSelectedGenre ? 0.35 : 1
                        }
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center border-y border-border px-6 text-center text-sm text-muted">
                No genre data for this period.
              </div>
            )}
          </div>

          {/* Genre selector */}
          <div className="flex flex-wrap gap-x-4 gap-y-2 border-b border-border pb-5">
            {genreData.slice(0, 8).map((genre) => {
              const active = activeSelectedGenre === genre.label;

              return (
                <button
                  key={genre.label}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setSelectedGenre(active ? null : genre.label)}
                  className={`flex items-center gap-2 border-b py-2 text-xs transition-colors ${
                    active
                      ? 'border-accent text-accent'
                      : 'border-transparent text-muted hover:text-foreground'
                  }`}
                >
                  <span className="h-2 w-2 shrink-0" style={{ backgroundColor: genre.color }} />
                  <span>{genre.label}</span>
                  <span className="font-mono text-[10px] opacity-70">{genre.watched}</span>
                </button>
              );
            })}
          </div>

          {/* Selected genre films */}
          <div className="mt-5">
            {activeSelectedGenre ? (
              <>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
                      Selected genre
                    </p>
                    <h4 className="mt-2 font-serif text-xl" style={{ color: activeGenreColor }}>
                      {activeSelectedGenre}
                    </h4>
                    <p className="mt-1 text-xs text-muted">
                      {selectedGenreFilms.length > 0
                        ? 'Your latest films in this genre'
                        : 'No films in this period'}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedGenre(null)}
                    className="border-b border-border py-1 text-xs text-muted transition-colors hover:border-accent hover:text-accent"
                  >
                    Clear selection ×
                  </button>
                </div>

                {selectedGenreFilms.length > 0 && (
                  <div className="mt-4 grid grid-cols-2 gap-4">
                    {selectedGenreFilms.map((event) => (
                      <FilmCard
                        key={`${filmIdentity(event.film)}:${event.date}`}
                        film={event.film}
                        watchedEvent={event}
                      />
                    ))}
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm leading-6 text-muted">
                Choose a slice or genre above to see the four most recently watched films in that
                genre.
              </p>
            )}
          </div>
        </article>
      </div>
    </section>
  );
}
