import 'server-only';

import { createClient } from '@supabase/supabase-js';

import { BulkMovieLookupRow, MovieLookup } from '@/types/database';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);

/**
 * Bulk search movies in supabase
 */
export async function bulkSearchMovies(entries: MovieLookup[]): Promise<BulkMovieLookupRow[]> {
  console.log('bulkSearchMovies called with entries:', entries);
  const { data, error } = await supabase.rpc('search_movies_bulk', {
    entries: entries.map((e) => ({
      title: e.title,
      year: e.year ?? null,
      letterboxd_uri: e.letterboxd_uri ?? null,
    })),
  });

  if (error) {
    throw new Error(`RPC search_movies_bulk failed: ${error.message}`);
  }
  console.log('RPC search_movies_bulk result:', data);

  return data as BulkMovieLookupRow[];
}
