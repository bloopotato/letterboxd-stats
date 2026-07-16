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
  if (count === 0) return 'bg-white/6 border-white/8';
  if (count === 1) return 'bg-[#17302d] border-[#214741]';
  if (count === 2) return 'bg-[#1f5d4d] border-[#2d7a67]';
  if (count <= 4) return 'bg-[#2f8a69] border-[#46a985]';
  return 'bg-[#59d19d] border-[#59d19d]';
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
    <section className="rounded-4xl border border-border/70 bg-card/60 p-5 shadow-sm backdrop-blur">
      <div className="flex flex-col gap-2 border-b border-border/60 pb-5">
        <p className="text-xs uppercase tracking-[0.24em] text-muted">Timeline</p>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight text-foreground">
              Watch activity
            </h2>
            <p className="mt-1 text-sm text-muted">
              Every square represents a day with one or more logged watch events.
            </p>
          </div>
          <div className="rounded-full border border-border/70 bg-background/40 px-4 py-2 text-sm text-muted">
            {totalWatchEvents} watch events · {totalLoggedDays} active days
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[180px_minmax(0,1fr)]">
        <aside className="rounded-3xl border border-border/60 bg-background/40 p-4 lg:sticky lg:top-6 lg:self-start">
          <p className="text-xs uppercase tracking-[0.22em] text-muted">Year</p>
          <div className="mt-4 flex flex-col gap-2">
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
                    className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-left text-sm transition-all duration-200 ${
                      active
                        ? 'border-primary/70 bg-primary/15 text-foreground shadow-sm'
                        : 'border-border/60 bg-card/30 text-muted hover:border-border hover:bg-card/50 hover:text-foreground'
                    }`}
                  >
                    <span className="font-medium">{formatYearLabel(year)}</span>
                    <span className="text-xs uppercase tracking-[0.18em] text-muted">
                      {yearCount}
                    </span>
                  </button>
                );
              })
            ) : (
              <div className="rounded-2xl border border-dashed border-border/60 px-4 py-6 text-sm text-muted">
                No watched events found.
              </div>
            )}
          </div>
        </aside>

        <div className="rounded-3xl border border-border/60 bg-background/30 p-4">
          {years.length ? (
            <>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-muted">Selected year</p>
                  <p className="text-2xl font-semibold tracking-tight text-foreground">
                    {activeYear}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted">
                  <span>Less</span>
                  <span className={`h-3 w-3 rounded-sm border ${getIntensityClass(0)}`} />
                  <span className={`h-3 w-3 rounded-sm border ${getIntensityClass(1)}`} />
                  <span className={`h-3 w-3 rounded-sm border ${getIntensityClass(2)}`} />
                  <span className={`h-3 w-3 rounded-sm border ${getIntensityClass(3)}`} />
                  <span className={`h-3 w-3 rounded-sm border ${getIntensityClass(5)}`} />
                  <span>More</span>
                </div>
              </div>

              <div className="overflow-x-auto pb-2">
                <div className="min-w-210">
                  <div className="grid grid-cols-[2rem_repeat(53,minmax(0,1fr))] gap-1 text-[10px] uppercase tracking-[0.2em] text-muted">
                    <span />
                    {Array.from({ length: 53 }, (_, index) => (
                      <span key={index} className="text-center">
                        {index % 4 === 0 ? index + 1 : ''}
                      </span>
                    ))}
                  </div>

                  <div className="mt-2 grid grid-cols-[2rem_repeat(53,minmax(0,1fr))] gap-1">
                    {weekdayLabels.map((label, rowIndex) => (
                      <span
                        key={label + rowIndex}
                        className="flex h-3 items-center justify-end pr-1 text-[10px] uppercase tracking-[0.18em] text-muted"
                        style={{ gridRow: rowIndex + 2, gridColumn: 1 }}
                      >
                        {rowIndex % 2 === 0 ? label : ''}
                      </span>
                    ))}

                    {gridCells.map((cell) => {
                      const weekIndex = Math.floor(
                        (cell.date.getTime() - getFirstSunday(selectedYear).getTime()) /
                          (1000 * 60 * 60 * 24 * 7)
                      );
                      const rowIndex = cell.date.getDay();

                      return (
                        <button
                          key={cell.key}
                          type="button"
                          title={`${cell.key}: ${cell.count} watch event${cell.count === 1 ? '' : 's'}`}
                          className={`h-3 w-3 rounded-sm border transition-transform duration-200 hover:-translate-y-0.5 hover:scale-110 ${getIntensityClass(cell.count)}`}
                          style={{ gridColumn: weekIndex + 2, gridRow: rowIndex + 2 }}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted">
                <span className="rounded-full border border-border/60 bg-background/40 px-3 py-1">
                  Peak day: {maxCount}
                </span>
                <span className="rounded-full border border-border/60 bg-background/40 px-3 py-1">
                  Logged days: {totalLoggedDays}
                </span>
                <span className="rounded-full border border-border/60 bg-background/40 px-3 py-1">
                  Events: {totalWatchEvents}
                </span>
              </div>
            </>
          ) : (
            <div className="flex min-h-65 items-center justify-center rounded-2xl border border-dashed border-border/60 text-sm text-muted">
              Import data to see your watch timeline.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
