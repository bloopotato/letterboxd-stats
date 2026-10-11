'use client';

import type { UserFilm } from '@/types/statistics';

type MovieMapSectionProps = {
  importedItems: UserFilm[];
};

export default function MovieMapSection({ importedItems }: MovieMapSectionProps) {
  return (
    <section id="movie-map" className="flex w-full flex-col gap-8 text-foreground">
      {/* Section heading */}
      <header className="border-b border-border pb-6">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-accent">
          Cinema without borders / 06
        </p>

        <h2 className="mt-4 font-serif text-4xl font-normal tracking-tight sm:text-5xl lg:text-6xl">
          A world of cinema.
        </h2>

        <p className="mt-3 max-w-lg text-sm leading-6 text-muted">
          Explore the countries behind the films in your personal archive.
        </p>
      </header>

      {/* Summary figures */}
      <div className="grid grid-cols-2 border-y border-border sm:grid-cols-3">
        <div className="py-5 pr-4">
          <p className="font-mono text-[10px] uppercase tracking-wider text-muted">Countries</p>
          <p className="mt-3 font-serif text-3xl text-foreground sm:text-4xl">—</p>
        </div>

        <div className="border-l border-border py-5 pl-4 sm:px-6">
          <p className="font-mono text-[10px] uppercase tracking-wider text-muted">
            Films represented
          </p>
          <p className="mt-3 font-serif text-3xl text-foreground sm:text-4xl">—</p>
        </div>

        <div className="col-span-2 mt-4 border-t border-border py-5 sm:col-span-1 sm:mt-0 sm:border-l sm:border-t-0 sm:pl-6">
          <p className="font-mono text-[10px] uppercase tracking-wider text-muted">Top country</p>
          <p className="mt-3 font-serif text-2xl text-foreground sm:text-3xl">—</p>
        </div>
      </div>

      {/* Map visualisation placeholder */}
      <div className="relative flex min-h-[360px] items-center justify-center border border-border bg-surface p-6 sm:min-h-[480px]">
        <div className="text-center">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-accent">
            Interactive atlas
          </p>
          <h3 className="mt-3 font-serif text-2xl text-foreground">The world map goes here.</h3>
          <p className="mt-2 text-sm text-muted">Countries will be highlighted by film count.</p>
        </div>
      </div>

      {/* Selected country details */}
      <div className="border-t border-border pt-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted">
              Country spotlight
            </p>
            <h3 className="mt-2 font-serif text-3xl text-foreground">Explore a country.</h3>
          </div>

          <span className="font-mono text-[10px] text-muted">FILMOGRAPHY</span>
        </div>

        {/* Selected country films placeholder */}
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {/* Film cards will go here */}
        </div>
      </div>
    </section>
  );
}
