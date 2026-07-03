export interface MovieLookup {
  title: string;
  year?: number;
}

// Details retrieved from Supabase cache
export interface BulkMovieLookupResult {
  id: number;
  title: string;
  original_title: string;
  release_date: string | null;
  poster_path: string | null;
  vote_average: number;
}

export type BulkMovieLookupRow = {
  input_title: string;
} & BulkMovieLookupResult;
