import { PersonStats } from '@/types/statistics';
import { getPosterUrl } from '@/utils/tmdb';
import Image from 'next/image';

export default function PersonCard({
  person,
  onClick,
}: {
  person: PersonStats;
  onClick: () => void;
}) {
  const profileUrl = getPosterUrl(person.profile_path, 'w342');

  return (
    <div
      className="flex flex-col items-center gap-2 cursor-pointer transition hover:scale-105"
      onClick={onClick}
    >
      <div className="relative h-24 w-16 overflow-hidden rounded-xl">
        <Image src={profileUrl} alt={person.name} fill sizes="64px" className="object-cover" />
      </div>

      <p className="text-center text-sm font-medium text-slate-800">{person.name}</p>
    </div>
  );
}
