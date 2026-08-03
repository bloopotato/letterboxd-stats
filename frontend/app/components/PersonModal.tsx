'use client';

import Image from 'next/image';
import { PersonStats, UserFilm } from '@/types/statistics';
import { getPosterUrl } from '@/utils/tmdb';
import FilmCard from './FilmCard';

type PersonModalProps = {
  person: PersonStats;
  films: UserFilm[];
  onClose: () => void;
};

export default function PersonModal({ person, films, onClose }: PersonModalProps) {
  const profileUrl = getPosterUrl(person.profile_path, 'w342');

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-[60vw] overflow-y-auto rounded-3xl bg-card p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex gap-5">
            <div className="relative h-32 w-24 overflow-hidden rounded-2xl">
              <Image
                src={profileUrl}
                alt={person.name}
                fill
                sizes="96px"
                className="object-cover"
              />
            </div>

            <div>
              <h2 className="text-3xl font-bold">{person.name}</h2>
              <p className="mt-2 text-slate-500">Appears in {films.length} watched films</p>
            </div>
          </div>

          <button onClick={onClose} className="rounded-lg p-2 hover:bg-slate-100">
            ✕
          </button>
        </div>

        {/* Films */}
        <div className="mt-8">
          <h3 className="mb-4 text-lg font-semibold">Films</h3>

          <div className="grid grid-cols-6 gap-4">
            {films.map((film) => (
              <FilmCard key={film.tmdbId} film={film} watchedEvent={film.watchedEvents[0]} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
