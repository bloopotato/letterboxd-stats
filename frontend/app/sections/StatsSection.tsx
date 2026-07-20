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
  '#0081a7',
  '#f4a261',
  '#2a9d8f',
  '#e76f51',
  '#6c7ae0',
  '#f77f00',
  '#3d5a80',
  '#90be6d',
];

function filmIdentity(film: UserFilm) {
  return film.tmdbId != null ? `tmdb:${film.tmdbId}` : `${film.name}|${film.year}`;
}

export default function StatsSection({ importedItems }: { importedItems: UserFilm[] }) {
  const [timeframe, setTimeframe] = useState<Timeframe>('All');
  const [groupBy, setGroupBy] = useState<Grouping>('Year');
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);

  // Flatten all diary entries
  const watchedEvents: WatchedEventWithFilm[] = useMemo(() => {
    return importedItems.flatMap((film) =>
      film.watchedEvents.map((event) => ({
        ...event,
        film,
      }))
    );
  }, [importedItems]);

  // Available years
  const years = useMemo(() => {
    const set = new Set<number>();

    watchedEvents.forEach((event) => {
      set.add(new Date(event.date).getFullYear());
    });

    return [...set].sort((a, b) => b - a);
  }, [watchedEvents]);

  // Filter by selected year
  const filteredEvents = useMemo(() => {
    if (timeframe === 'All') return watchedEvents;

    return watchedEvents.filter((event) => new Date(event.date).getFullYear() === timeframe);
  }, [watchedEvents, timeframe]);

  const genreData: GenreSlice[] = useMemo(() => {
    const counts = new Map<string, number>();

    filteredEvents.forEach(({ film }) => {
      const uniqueGenres = new Set(
        film.genreNames.map((genre) => genre.trim()).filter((genre) => genre.length > 0)
      );

      uniqueGenres.forEach((genre) => {
        counts.set(genre, (counts.get(genre) ?? 0) + 1);
      });
    });

    return [...counts.entries()]
      .sort((left, right) => right[1] - left[1])
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
      if (!event.film.genreNames.includes(activeSelectedGenre)) {
        return;
      }

      const key = filmIdentity(event.film);
      const current = latestByFilm.get(key);
      const eventTime = new Date(event.date).getTime();
      const currentTime = current ? new Date(current.date).getTime() : Number.NEGATIVE_INFINITY;

      if (!current || eventTime > currentTime) {
        latestByFilm.set(key, event);
      }
    });

    return [...latestByFilm.values()]
      .sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime())
      .slice(0, 4);
  }, [activeSelectedGenre, filteredEvents]);

  // Build chart data
  const chartData = useMemo(() => {
    const counts = new Map<string, number>();

    // Month names in correct order
    const monthNames = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];

    const weekdayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    filteredEvents.forEach((event) => {
      const date = new Date(event.date);

      let key = '';

      switch (groupBy) {
        case 'Year':
          key = String(date.getFullYear());
          break;

        case 'Month':
          key = monthNames[date.getMonth()];
          break;

        case 'Day':
          key = weekdayNames[date.getDay()];
          break;
      }

      counts.set(key, (counts.get(key) ?? 0) + 1);
    });

    if (groupBy === 'Month') {
      return monthNames.map((month) => ({
        label: month,
        watched: counts.get(month) ?? 0,
      }));
    }

    if (groupBy === 'Day') {
      return weekdayNames.map((day) => ({
        label: day,
        watched: counts.get(day) ?? 0,
      }));
    }

    return [...counts.entries()]
      .sort((a, b) => Number(a[0]) - Number(b[0]))
      .map(([label, watched]) => ({
        label,
        watched,
      }));
  }, [filteredEvents, groupBy]);

  const totalGenreWatched = genreData.reduce((sum, item) => sum + item.watched, 0);

  const activeGenreColor =
    genreData.find((genre) => genre.label === activeSelectedGenre)?.color ?? GENRE_COLORS[0];

  return (
    <section className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Films Watched</h2>
          <p className="mt-1 text-sm text-slate-500">
            Track volume and genre mix across your diary.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-4">
        <select
          value={String(timeframe)}
          onChange={(e) => {
            const value = e.target.value;

            setTimeframe(value === 'All' ? 'All' : Number(value));
          }}
          className="rounded-full border border-border/70 bg-white px-4 py-2 text-sm shadow-sm"
        >
          <option value="All">All</option>

          {years.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>

        <select
          value={groupBy}
          onChange={(e) => setGroupBy(e.target.value as Grouping)}
          className="rounded-full border border-border/70 bg-white px-4 py-2 text-sm shadow-sm"
        >
          <option value="Year">Year</option>
          <option value="Month">Month</option>
          <option value="Day">Day</option>
        </select>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-3xl border border-border/70 bg-white/80 p-4 shadow-sm backdrop-blur">
          <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Watch volume</p>

          <div className="mt-4 h-88">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />

                <XAxis dataKey="label" />

                <YAxis allowDecimals={false} />

                <Tooltip />

                <Bar dataKey="watched" radius={[6, 6, 0, 0]} fill="#0081a7" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-3xl border border-border/70 bg-white/80 p-4 shadow-sm backdrop-blur">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Genre mix</p>
              <p className="mt-1 text-sm text-slate-500">Click a slice to see recent films.</p>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
              {totalGenreWatched} watches
            </span>
          </div>

          <div className="mt-4 h-72">
            {genreData.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip />
                  <Pie
                    data={genreData}
                    dataKey="watched"
                    nameKey="label"
                    innerRadius="58%"
                    outerRadius="82%"
                    paddingAngle={2}
                    stroke="transparent"
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
                        stroke={
                          genre.label === activeSelectedGenre ? activeGenreColor : 'transparent'
                        }
                        strokeWidth={genre.label === activeSelectedGenre ? 3 : 0}
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50/70 px-6 text-center text-sm text-slate-500">
                No genre data for the current timeframe yet.
              </div>
            )}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {genreData.slice(0, 6).map((genre) => {
              const active = activeSelectedGenre === genre.label;

              return (
                <button
                  key={genre.label}
                  type="button"
                  onClick={() => setSelectedGenre(genre.label)}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                    active
                      ? 'border-slate-900 bg-slate-900 text-white'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                  }`}
                >
                  {genre.label} · {genre.watched}
                </button>
              );
            })}
          </div>

          <div className="mt-5 rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
            {activeSelectedGenre ? (
              <>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.22em] text-slate-500">
                      Selected genre
                    </p>
                    <h3 className="mt-1 text-xl font-semibold text-slate-900">
                      {activeSelectedGenre}
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedGenre(null)}
                    className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 hover:border-slate-300"
                  >
                    Clear
                  </button>
                </div>

                <p className="mt-2 text-sm text-slate-500">
                  {selectedGenreFilms.length
                    ? `Showing the 4 most recent films in ${activeSelectedGenre}.`
                    : `No films found for ${activeSelectedGenre} in the current timeframe.`}
                </p>

                {selectedGenreFilms.length ? (
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    {selectedGenreFilms.map((event) => (
                      <FilmCard
                        key={`${filmIdentity(event.film)}:${event.date}`}
                        film={event.film}
                        watchedEvent={event}
                      />
                    ))}
                  </div>
                ) : null}
              </>
            ) : (
              <p className="text-sm text-slate-500">
                Click a donut slice or genre chip to inspect the latest watches.
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
