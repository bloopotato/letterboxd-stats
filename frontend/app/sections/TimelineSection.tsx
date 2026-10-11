'use client';

import { useMemo, useState } from 'react';
import type { UserFilm } from '@/types/statistics';

type DayCell = {
  date: Date;
  key: string;
  count: number;
};

function getWatchedEvents(films: UserFilm[]) {
  return films.flatMap((film) =>
    film.watchedEvents.map((event) => ({
      film,
      watchedEvent: event,
    }))
  );
}

function getDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function getEventDateKey(date: string) {
  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) return null;

  return getDateKey(parsedDate);
}

function getFirstSunday(year: number) {
  const firstDay = new Date(year, 0, 1);
  const firstSunday = new Date(firstDay);

  firstSunday.setDate(firstDay.getDate() - firstDay.getDay());
  firstSunday.setHours(0, 0, 0, 0);

  return firstSunday;
}

function getLastSaturday(year: number) {
  const lastDay = new Date(year, 11, 31);
  const lastSaturday = new Date(lastDay);

  lastSaturday.setDate(lastDay.getDate() + (6 - lastDay.getDay()));
  lastSaturday.setHours(0, 0, 0, 0);

  return lastSaturday;
}

function buildYearGrid(year: number, counts: Map<string, number>) {
  const firstSunday = getFirstSunday(year);
  const lastSaturday = getLastSaturday(year);
  const cells: DayCell[] = [];

  const current = new Date(firstSunday);

  while (current <= lastSaturday) {
    const key = getDateKey(current);
    const isWithinYear = current.getFullYear() === year;

    cells.push({
      date: new Date(current),
      key,
      count: isWithinYear ? (counts.get(key) ?? 0) : 0,
    });

    current.setDate(current.getDate() + 1);
  }

  return cells;
}

function getIntensityClass(count: number) {
  if (count === 0) return 'bg-surface border-border';
  if (count === 1) return 'bg-accent/15 border-accent/25';
  if (count === 2) return 'bg-accent/35 border-accent/45';
  if (count <= 4) return 'bg-accent/65 border-accent/70';

  return 'bg-accent border-accent';
}

function formatYearLabel(year: number) {
  return year.toString();
}

export default function TimelineSection({ importedItems }: { importedItems: UserFilm[] }) {
  const allEntries = useMemo(() => getWatchedEvents(importedItems), [importedItems]);

  const years = useMemo(() => {
    return Array.from(
      new Set(
        allEntries
          .map(({ watchedEvent }) => new Date(watchedEvent.date).getFullYear())
          .filter((year) => !Number.isNaN(year))
      )
    ).sort((left, right) => right - left);
  }, [allEntries]);

  const [selectedYear, setSelectedYear] = useState<number>(
    () => years[0] ?? new Date().getFullYear()
  );

  const activeYear = years.includes(selectedYear)
    ? selectedYear
    : (years[0] ?? new Date().getFullYear());

  const selectedEntries = useMemo(
    () =>
      allEntries.filter(({ watchedEvent }) => {
        const eventYear = new Date(watchedEvent.date).getFullYear();

        return eventYear === activeYear;
      }),
    [allEntries, activeYear]
  );

  const dayCounts = useMemo(() => {
    const counts = new Map<string, number>();

    selectedEntries.forEach(({ watchedEvent }) => {
      const key = getEventDateKey(watchedEvent.date);

      if (!key) return;

      counts.set(key, (counts.get(key) ?? 0) + 1);
    });

    return counts;
  }, [selectedEntries]);

  const gridCells = useMemo(() => buildYearGrid(activeYear, dayCounts), [activeYear, dayCounts]);

  const totalLoggedDays = dayCounts.size;
  const totalWatchEvents = selectedEntries.length;

  const maxCount = useMemo(() => Math.max(0, ...Array.from(dayCounts.values())), [dayCounts]);

  const weekdayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
    <section id="timeline" className="flex w-full flex-col gap-8">
      {/* Editorial heading */}
      <header className="border-b border-border pb-6">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-accent">
          Your film archive / 03
        </p>

        <div className="mt-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h2 className="font-serif text-4xl font-normal leading-tight tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              Time, in frames.
            </h2>
            <p className="mt-3 max-w-lg text-sm leading-6 text-muted">
              A year at a glance. Each mark represents a day you logged one or more films.
            </p>
          </div>

          <div className="flex gap-5 font-mono text-[10px] uppercase tracking-wider text-muted">
            <span>{totalWatchEvents} screenings</span>
            <span>{totalLoggedDays} active days</span>
          </div>
        </div>
      </header>

      <div className="grid gap-8 lg:grid-cols-[150px_minmax(0,1fr)]">
        {/* Year index */}
        <aside className="min-w-0">
          <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.2em] text-muted">
            Select a year
          </p>

          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:flex lg:flex-col lg:gap-0">
            {years.length ? (
              years.map((year) => {
                const active = year === activeYear;

                const yearCount = allEntries.filter(({ watchedEvent }) => {
                  return new Date(watchedEvent.date).getFullYear() === year;
                }).length;

                return (
                  <button
                    key={year}
                    type="button"
                    onClick={() => setSelectedYear(year)}
                    aria-pressed={active}
                    className={`flex items-center justify-between gap-2 border-b px-2 py-3 text-left transition-colors lg:px-1 ${
                      active
                        ? 'border-accent text-accent'
                        : 'border-border text-muted hover:text-foreground'
                    }`}
                  >
                    <span className={`font-serif text-xl ${active ? 'italic' : ''}`}>
                      {formatYearLabel(year)}
                    </span>
                    <span className="font-mono text-[10px]">{yearCount}</span>
                  </button>
                );
              })
            ) : (
              <p className="col-span-full py-4 text-sm text-muted">No watched events found.</p>
            )}
          </div>
        </aside>

        {/* Heatmap */}
        <div className="min-w-0 border-y border-border py-5">
          {years.length ? (
            <>
              <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-accent">
                    Annual screening record
                  </p>
                  <p className="mt-2 font-serif text-4xl font-normal text-foreground">
                    {activeYear}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted">Less</span>
                  {[0, 1, 2, 3, 5].map((count) => (
                    <span
                      key={count}
                      title={
                        count === 0
                          ? 'No screenings'
                          : `${count} screening${count === 1 ? '' : 's'}`
                      }
                      className={`h-3 w-3 border ${getIntensityClass(count)}`}
                    />
                  ))}
                  <span className="text-[10px] text-muted">More</span>
                </div>
              </div>

              <div className="overflow-x-auto pb-3">
                <div className="min-w-[620px]">
                  {/* Week labels */}
                  <div className="grid grid-cols-[24px_repeat(53,minmax(0,1fr))] gap-[3px]">
                    <span />

                    {Array.from({ length: 53 }, (_, index) => (
                      <span key={index} className="text-center font-mono text-[9px] text-muted">
                        {index % 4 === 0 ? index + 1 : ''}
                      </span>
                    ))}
                  </div>

                  {/* Calendar cells */}
                  <div className="mt-2 grid grid-cols-[24px_repeat(53,minmax(0,1fr))] gap-[3px]">
                    {weekdayLabels.map((label, rowIndex) => (
                      <span
                        key={`${label}-${rowIndex}`}
                        className="flex h-3 items-center font-mono text-[9px] text-muted"
                        style={{
                          gridRow: rowIndex + 2,
                          gridColumn: 1,
                        }}
                      >
                        {rowIndex % 2 === 0 ? label : ''}
                      </span>
                    ))}

                    {gridCells.map((cell) => {
                      const weekIndex = Math.floor(
                        (cell.date.getTime() - getFirstSunday(activeYear).getTime()) /
                          (1000 * 60 * 60 * 24 * 7)
                      );

                      const rowIndex = cell.date.getDay();

                      return (
                        <button
                          key={cell.key}
                          type="button"
                          title={`${cell.key}: ${cell.count} watch event${cell.count === 1 ? '' : 's'}`}
                          aria-label={`${cell.key}: ${cell.count} watch event${cell.count === 1 ? '' : 's'}`}
                          className={`aspect-square w-full min-w-0 border transition-opacity hover:opacity-70 ${getIntensityClass(cell.count)}`}
                          style={{
                            gridColumn: weekIndex + 2,
                            gridRow: rowIndex + 2,
                          }}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Year summary */}
              <div className="mt-6 grid grid-cols-3 border-t border-border pt-4">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-wider text-muted">
                    Screenings
                  </p>
                  <p className="mt-2 font-serif text-2xl text-foreground">{totalWatchEvents}</p>
                </div>

                <div className="border-l border-border pl-4">
                  <p className="font-mono text-[10px] uppercase tracking-wider text-muted">
                    Active days
                  </p>
                  <p className="mt-2 font-serif text-2xl text-foreground">{totalLoggedDays}</p>
                </div>

                <div className="border-l border-border pl-4">
                  <p className="font-mono text-[10px] uppercase tracking-wider text-muted">
                    Peak in a day
                  </p>
                  <p className="mt-2 font-serif text-2xl text-foreground">{maxCount}</p>
                </div>
              </div>
            </>
          ) : (
            <div className="py-12">
              <p className="font-mono text-xs text-accent">NO SCREENING RECORD</p>
              <p className="mt-3 font-serif text-2xl text-foreground">
                The timeline begins with your first entry.
              </p>
              <p className="mt-2 text-sm text-muted">
                Import your archive to see your watching activity.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
