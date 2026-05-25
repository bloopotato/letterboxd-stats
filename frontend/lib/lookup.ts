import 'server-only';

import { createClient } from '@supabase/supabase-js';
import type { LetterboxdLookupEntry } from '@/utils/data/types';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);

/**
 * Bulk search movies in supabase
 */
export async function bulkSearchMovies(entries: LetterboxdLookupEntry[]) {
  const { data, error } = await supabase.rpc('search_movies_bulk', {
    entries: entries.map((e) => ({
      title: e.title,
      year: e.year ?? null,
    })),
  });

  if (error) {
    throw new Error(`RPC search_movies_bulk failed: ${error.message}`);
  }

  return data as Array<{
    input_title: string;
    id: number;
    title: string;
    release_date: string;
  }>;
}
