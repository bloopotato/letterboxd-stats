create or replace function search_movies_bulk(entries jsonb)
returns table (
  input_title text,
  input_letterboxd_uri text,
  id bigint,
  title text,
  original_title text,
  release_date date,
  poster_path text,
  vote_average double precision,
  letterboxd_uri text,
  matched_by text
)
language sql
as $$
select
    e->>'title' as input_title,
    nullif(trim(e->>'letterboxd_uri'), '') as input_letterboxd_uri,
    m.id,
    m.title,
    m.original_title,
    m.release_date,
    m.poster_path,
    m.vote_average,
    m.letterboxd_uri,
    m.matched_by
from jsonb_array_elements(entries) as e
    left join lateral (
    select
      m.id,
      m.title,
      m.original_title,
      m.release_date,
      m.poster_path,
      m.vote_average,
      m.letterboxd_uri,
      case
        when nullif(trim(e->>'letterboxd_uri'), '') is not null
             and m.letterboxd_uri = nullif(trim(e->>'letterboxd_uri'), '')
          then 'uri'
        else 'title_year'
      end as matched_by
    from tmdb_movies m
    where
      (
        nullif(trim(e->>'letterboxd_uri'), '') is not null
        and m.letterboxd_uri = nullif(trim(e->>'letterboxd_uri'), '')
      )
      or (
        m.title ilike '%' || (e->>'title') || '%'
        and (
          e->>'year' is null
          or extract(year from m.release_date) = (e->>'year')::int
        )
      )
    order by
      case
        when nullif(trim(e->>'letterboxd_uri'), '') is not null
             and m.letterboxd_uri = nullif(trim(e->>'letterboxd_uri'), '')
          then 0
        else 1
      end,
      similarity(m.title, e->>'title') desc
    limit 1
    ) m on true;
$$;

create or replace function top_people_for_movies(
  movie_ids bigint[],
  release_years int[] default null,
  limit_count int default 5
)
returns table (
  category text,
  id bigint,
  name text,
  count bigint
)
language sql
stable
as $$
with filtered_movies as (
  select m.id
  from tmdb_movies m
  where m.id = any(movie_ids)
    and (
      release_years is null
      or cardinality(release_years) = 0
      or extract(year from m.release_date)::int = any(release_years)
    )
), cast_people as (
  select
    p.id,
    p.name,
    count(distinct c.movie_id)::bigint as count
  from tmdb_credits c
  join filtered_movies fm on fm.id = c.movie_id
  join tmdb_people p on p.id = c.person_id
  where c.department = 'Acting'
  group by p.id, p.name
  order by count desc, p.name asc
  limit limit_count
), director_people as (
  select
    p.id,
    p.name,
    count(distinct c.movie_id)::bigint as count
  from tmdb_credits c
  join filtered_movies fm on fm.id = c.movie_id
  join tmdb_people p on p.id = c.person_id
  where c.job = 'Director'
  group by p.id, p.name
  order by count desc, p.name asc
  limit limit_count
)
select 'cast'::text as category, id, name, count from cast_people
union all
select 'director'::text as category, id, name, count from director_people;
$$;