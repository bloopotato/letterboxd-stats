import { NextResponse } from 'next/server';
import { CastStats } from '@/utils/data/types';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;

type CastInputItem = {
  tmdbId?: number | null;
  source?: string | null; // (e.g. 'diary' | 'watchlist')
};

type CastRequestBody = {
  items?: CastInputItem[];
  films?: CastInputItem[];
  years?: number[];
  releaseYears?: number[];
};

type TopPeopleRow = {
  category: 'cast' | 'director';
  id: number;
  name: string;
  count: number;
};

type RankedPerson = {
  id: number;
  name: string;
  count: number;
};

async function fetchSupabaseRpc<T>(functionName: string, body: object): Promise<T[]> {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE) return [];

  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${functionName}`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_SERVICE_ROLE,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Supabase RPC ${functionName} failed: ${response.status} ${message}`);
  }

  return (await response.json()) as T[];
}

function topPeople(counts: Map<number, RankedPerson>, limit = 10) {
  return Array.from(counts.values())
    .sort((left, right) => right.count - left.count)
    .slice(0, limit);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const typedBody = body as CastRequestBody;
    const items: CastInputItem[] = typedBody.items || typedBody.films || [];

    // enforce diary-only items server-side (defensive in case client includes watchlist)
    // Treat items with no `source` field as diary entries (client may only send `{ tmdbId }`).
    const diaryItems = items.filter((it) => {
      if (!it) return false;
      if (it.source == null) return true; // Assume diary when source not provided
      return String(it.source).toLowerCase() === 'diary';
    });

    const tmdbIds = Array.from(
      new Set(
        diaryItems.map((item) => item.tmdbId).filter((id): id is number => typeof id === 'number')
      )
    );
    const years = Array.from(
      new Set(
        (typedBody.years || typedBody.releaseYears || []).filter(
          (year): year is number => typeof year === 'number'
        )
      )
    );

    if (!tmdbIds.length) {
      const emptyStats: CastStats = {
        // watchedCount should reflect diary items only
        watchedCount: diaryItems.length,
        topCast: [],
        topDirectors: [],
      };

      return NextResponse.json({ ok: true, stats: emptyStats });
    }

    const topPeopleRows = await fetchSupabaseRpc<TopPeopleRow>('top_people_for_movies', {
      movie_ids: tmdbIds,
      release_years: years.length ? years : null,
      limit_count: 10,
    });

    console.log('[RPC top_people_for_movies INPUT]', {
      movie_ids: tmdbIds,
      release_years: years.length ? years : null,
      limit_count: 10,
    });

    console.log('[RPC top_people_for_movies OUTPUT]', topPeopleRows);

    const castCounts = new Map<number, RankedPerson>();
    const directorCounts = new Map<number, RankedPerson>();

    // RPC should return aggregated counts per person, but be defensive and sum if duplicates arrive
    for (const person of topPeopleRows) {
      const target = person.category === 'cast' ? castCounts : directorCounts;
      const existing = target.get(person.id);
      if (existing) {
        existing.count = existing.count + person.count;
      } else {
        target.set(person.id, { id: person.id, name: person.name, count: person.count });
      }
    }

    const stats: CastStats = {
      // watchedCount should reflect diary items only
      watchedCount: diaryItems.length,
      topCast: topPeople(castCounts),
      topDirectors: topPeople(directorCounts),
    };

    return NextResponse.json({ ok: true, stats });
  } catch (error) {
    return NextResponse.json({ ok: false, error: String(error) }, { status: 500 });
  }
}
