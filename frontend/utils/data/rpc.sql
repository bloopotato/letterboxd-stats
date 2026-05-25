create or replace function search_movies_bulk(entries jsonb)
returns table (
  input_title text,
  id bigint,
  title text,
  original_title text,
  release_date date,
  poster_path text,
  vote_average double precision
)
language sql
as $$
select
    e->>'title' as input_title,
    m.id,
    m.title,
    m.original_title,
    m.release_date,
    m.poster_path,
    m.vote_average
from jsonb_array_elements(entries) as e
    left join lateral (
    select *
    from tmdb_movies m
    where
    m.title ilike '%' || (e->>'title') || '%'
    and (
    e->>'year' is null
    or extract(year from m.release_date) = (e->>'year')::int
    )
    order by
    similarity(m.title, e->>'title') desc
    limit 1
    ) m on true;
$$;