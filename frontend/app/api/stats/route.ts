import { NextResponse } from 'next/server';
import { RpcStats, GenreStats, PersonStats } from '@/types/statistics';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;

type CastInputItem = {
  tmdbId?: number | null;
};

type CastRequestBody = {
  items?: CastInputItem[];
  films?: CastInputItem[];
  years?: number[];
  releaseYears?: number[];
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

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const typedBody = body as CastRequestBody;
    const items: CastInputItem[] = typedBody.items || typedBody.films || [];

    const tmdbIds = Array.from(
      new Set(items.map((item) => item.tmdbId).filter((id): id is number => typeof id === 'number'))
    );
    const years = Array.from(
      new Set(
        (typedBody.years || typedBody.releaseYears || []).filter(
          (year): year is number => typeof year === 'number'
        )
      )
    );

    if (!tmdbIds.length) {
      const emptyStats: RpcStats = {
        watchedCount: items.length,
        topCast: [],
        topDirectors: [],
        topGenres: [],
      };

      return NextResponse.json({ ok: true, stats: emptyStats });
    }

    const [peopleRows, genreRows] = await Promise.all([
      fetchSupabaseRpc<PersonStats>('top_people_for_movies', {
        movie_ids: tmdbIds,
        release_years: years.length ? years : null,
        limit_count: 50,
      }),
      fetchSupabaseRpc<GenreStats>('top_genres_for_movies', {
        movie_ids: tmdbIds,
        release_years: years.length ? years : null,
        limit_count: 50,
      }),
    ]);

    console.log('[RPC top_people_for_movies INPUT]', {
      movie_ids: tmdbIds,
      release_years: years.length ? years : null,
      limit_count: 50,
    });

    console.log('[RPC top_people_for_movies OUTPUT]', peopleRows);

    const topCast = peopleRows.filter((row) => row.category === 'cast');
    const topDirectors = peopleRows.filter((row) => row.category === 'director');

    const stats: RpcStats = {
      watchedCount: items.length,
      topCast,
      topDirectors,
      topGenres: genreRows,
    };

    return NextResponse.json({ ok: true, stats });
  } catch (error) {
    return NextResponse.json({ ok: false, error: String(error) }, { status: 500 });
  }
}
