'use client';

import type { UserFilm } from '@/types/statistics';

type LanguagesSectionProps = {
  importedItems: UserFilm[];
};

export default function LanguagesSection({ importedItems }: LanguagesSectionProps) {
  return (
    <section id="languages" className="flex w-full flex-col gap-8 text-foreground">
      {/* Section heading */}
      <header className="border-b border-border pb-6">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-accent">
          Lost in translation / 07
        </p>

        <h2 className="mt-4 font-serif text-4xl font-normal tracking-tight sm:text-5xl lg:text-6xl">
          The language of film.
        </h2>

        <p className="mt-3 max-w-lg text-sm leading-6 text-muted">
          The languages that shape your viewing history, from familiar voices to cinema beyond your
          usual orbit.
        </p>
      </header>

      {/* Summary figures */}
      <div className="grid grid-cols-2 border-y border-border sm:grid-cols-3">
        <div className="py-5 pr-4">
          <p className="font-mono text-[10px] uppercase tracking-wider text-muted">Languages</p>
          <p className="mt-3 font-serif text-3xl text-foreground sm:text-4xl">—</p>
        </div>

        <div className="border-l border-border py-5 pl-4 sm:px-6">
          <p className="font-mono text-[10px] uppercase tracking-wider text-muted">Most watched</p>
          <p className="mt-3 font-serif text-2xl text-foreground sm:text-3xl">—</p>
        </div>

        <div className="col-span-2 mt-4 border-t border-border py-5 sm:col-span-1 sm:mt-0 sm:border-l sm:border-t-0 sm:pl-6">
          <p className="font-mono text-[10px] uppercase tracking-wider text-muted">
            International films
          </p>
          <p className="mt-3 font-serif text-3xl text-foreground sm:text-4xl">—</p>
        </div>
      </div>

      {/* Language distribution */}
      <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="min-w-0">
          <header className="border-b border-border pb-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-accent">
              01 / Language index
            </p>
            <h3 className="mt-3 font-serif text-2xl sm:text-3xl">Your linguistic landscape.</h3>
          </header>

          {/* Ranked language list */}
          <div className="mt-2 divide-y divide-border">{/* Language rows will go here */}</div>
        </div>

        {/* Selected language */}
        <div className="min-w-0 border-t border-border pt-6 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
          <header className="border-b border-border pb-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-accent">
              02 / Language spotlight
            </p>
            <h3 className="mt-3 font-serif text-2xl sm:text-3xl">A closer listen.</h3>
            <p className="mt-2 text-xs leading-5 text-muted">
              Select a language to explore the films in your diary.
            </p>
          </header>

          {/* Selected language summary */}
          <div className="mt-5 border-b border-border pb-5">
            <p className="font-serif text-3xl text-foreground">Selected language</p>
            <p className="mt-2 text-sm text-muted">Film count and share of your viewing history.</p>
          </div>

          {/* Selected language films */}
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-2">
            {/* Film cards will go here */}
          </div>
        </div>
      </div>
    </section>
  );
}
