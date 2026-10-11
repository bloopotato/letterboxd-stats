'use client';

import Image from 'next/image';
import type { PersonStats } from '@/types/statistics';
import { getPosterUrl } from '@/utils/tmdb';

export default function PersonCard({
  person,
  onClick,
}: {
  person: PersonStats;
  onClick: () => void;
}) {
  const profileUrl = getPosterUrl(person.profile_path, 'w342');

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`View films featuring ${person.name}`}
      className="group flex w-full min-w-0 flex-col gap-3 p-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
    >
      <div className="relative aspect-[2/3] w-full max-w-32 overflow-hidden border border-border bg-surface">
        {profileUrl ? (
          <Image
            src={profileUrl}
            alt={person.name}
            fill
            sizes="(max-width: 640px) 35vw, (max-width: 1024px) 20vw, 140px"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center font-serif text-2xl text-accent">
            {person.name.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
      </div>

      <div className="w-full min-w-0">
        <p className="truncate font-serif text-sm text-foreground transition-colors group-hover:text-accent">
          {person.name}
        </p>
        <p className="mt-1 font-mono text-[10px] text-muted">
          {person.count} {person.count === 1 ? 'film' : 'films'}
        </p>
      </div>
    </button>
  );
}
