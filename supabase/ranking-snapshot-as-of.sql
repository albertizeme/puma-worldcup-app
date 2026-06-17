-- As-of ranking snapshots for the World Cup prediction game.
-- Run this in the Supabase SQL editor after reviewing it for your project.

create table if not exists public.ranking_snapshot_runs (
  snapshot_key text primary key,
  snapshot_label text,
  cutoff_at timestamptz not null,
  generated_at timestamptz not null default now(),
  require_complete boolean not null default true
);

create or replace function public.generate_ranking_snapshot_as_of(
  p_snapshot_key text,
  p_snapshot_label text,
  p_cutoff_at timestamptz,
  p_require_complete boolean default true
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_incomplete_count integer;
  v_columns text;
begin
  if nullif(trim(p_snapshot_key), '') is null then
    raise exception 'Snapshot key is required';
  end if;

  if p_cutoff_at is null then
    raise exception 'Snapshot cutoff is required';
  end if;

  if p_require_complete then
    select count(*)
    into v_incomplete_count
    from public.matches m
    where m.match_datetime is not null
      and m.match_datetime < p_cutoff_at
      and (
        m.status is distinct from 'finished'
        or m.home_score is null
        or m.away_score is null
      );

    if v_incomplete_count > 0 then
      raise exception 'Cannot generate snapshot %. % match(es) before cutoff are not finished or are missing scores.',
        p_snapshot_key,
        v_incomplete_count;
    end if;
  end if;

  delete from public.ranking_snapshots
  where snapshot_key = p_snapshot_key;

  drop table if exists pg_temp.snapshot_rows;

  create temp table snapshot_rows on commit drop as
  with scored_predictions as (
    select
      p.user_id,
      case
        when p.home_score_pred = m.home_score
          and p.away_score_pred = m.away_score
          then 3
        when sign(p.home_score_pred - p.away_score_pred) = sign(m.home_score - m.away_score)
          then 1
        else 0
      end as base_points,
      case
        when p.home_score_pred = m.home_score
          and p.away_score_pred = m.away_score
          then 1
        else 0
      end as exact_hit,
      case
        when not (
          p.home_score_pred = m.home_score
          and p.away_score_pred = m.away_score
        )
        and sign(p.home_score_pred - p.away_score_pred) = sign(m.home_score - m.away_score)
          then 1
        else 0
      end as tendency_hit,
      coalesce(m.is_puma_match, false) as is_puma_match
    from public.predictions p
    join public.matches m on m.id = p.match_id
    where m.match_datetime is not null
      and m.match_datetime < p_cutoff_at
      and m.status = 'finished'
      and m.home_score is not null
      and m.away_score is not null
      and p.home_score_pred is not null
      and p.away_score_pred is not null
  ),
  user_scores as (
    select
      p.user_id,
      coalesce(max(pr.display_name), '') as display_name,
      sum(p.base_points + case when p.base_points > 0 and p.is_puma_match then 1 else 0 end)::integer as total_points,
      sum(p.exact_hit)::integer as exact_hits,
      sum(p.tendency_hit)::integer as tendency_hits,
      0::integer as champion_bonus_points
    from scored_predictions p
    left join public.profiles pr on pr.id = p.user_id
    group by p.user_id
  ),
  ranked as (
    select
      user_id,
      total_points,
      exact_hits,
      tendency_hits,
      champion_bonus_points,
      rank() over (order by total_points desc)::integer as position
    from user_scores
  )
  select
    p_snapshot_key::text as snapshot_key,
    nullif(trim(coalesce(p_snapshot_label, '')), '')::text as snapshot_label,
    user_id,
    position,
    total_points,
    exact_hits,
    tendency_hits,
    champion_bonus_points,
    now()::timestamptz as created_at
  from ranked;

  select string_agg(quote_ident(c.column_name), ', ' order by array_position(
    array[
      'snapshot_key',
      'snapshot_label',
      'user_id',
      'position',
      'total_points',
      'exact_hits',
      'tendency_hits',
      'champion_bonus_points',
      'created_at'
    ],
    c.column_name
  ))
  into v_columns
  from information_schema.columns c
  where c.table_schema = 'public'
    and c.table_name = 'ranking_snapshots'
    and c.column_name = any(array[
      'snapshot_key',
      'snapshot_label',
      'user_id',
      'position',
      'total_points',
      'exact_hits',
      'tendency_hits',
      'champion_bonus_points',
      'created_at'
    ]);

  if v_columns is null then
    raise exception 'Could not detect writable columns on public.ranking_snapshots';
  end if;

  execute format(
    'insert into public.ranking_snapshots (%s) select %s from pg_temp.snapshot_rows',
    v_columns,
    v_columns
  );

  insert into public.ranking_snapshot_runs (
    snapshot_key,
    snapshot_label,
    cutoff_at,
    generated_at,
    require_complete
  ) values (
    p_snapshot_key,
    nullif(trim(coalesce(p_snapshot_label, '')), ''),
    p_cutoff_at,
    now(),
    p_require_complete
  )
  on conflict (snapshot_key) do update
  set
    snapshot_label = excluded.snapshot_label,
    cutoff_at = excluded.cutoff_at,
    generated_at = excluded.generated_at,
    require_complete = excluded.require_complete;
end;
$$;

create or replace function public.generate_daily_ranking_snapshot(
  p_snapshot_date date,
  p_require_complete boolean default true
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_snapshot_key text;
  v_snapshot_label text;
  v_cutoff_at timestamptz;
begin
  if p_snapshot_date is null then
    raise exception 'Snapshot date is required';
  end if;

  v_snapshot_key := 'day_' || to_char(p_snapshot_date, 'YYYY_MM_DD');
  v_snapshot_label := to_char(p_snapshot_date, 'DD-MM-YYYY');
  v_cutoff_at := ((p_snapshot_date + 1)::timestamp at time zone 'Europe/Madrid');

  perform public.generate_ranking_snapshot_as_of(
    v_snapshot_key,
    v_snapshot_label,
    v_cutoff_at,
    p_require_complete
  );
end;
$$;

-- Keep the existing app RPC name working. For keys like day_2026_06_16,
-- this now snapshots standings as of midnight after that date in Europe/Madrid.
drop function if exists public.generate_ranking_snapshot(text, text);

create function public.generate_ranking_snapshot(
  p_snapshot_key text,
  p_snapshot_label text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_snapshot_date date;
  v_cutoff_at timestamptz;
begin
  if p_snapshot_key ~ '^day_[0-9]{4}_[0-9]{2}_[0-9]{2}$' then
    v_snapshot_date := to_date(replace(substr(p_snapshot_key, 5), '_', '-'), 'YYYY-MM-DD');
    v_cutoff_at := ((v_snapshot_date + 1)::timestamp at time zone 'Europe/Madrid');
  else
    v_cutoff_at := now();
  end if;

  perform public.generate_ranking_snapshot_as_of(
    p_snapshot_key,
    p_snapshot_label,
    v_cutoff_at,
    true
  );
end;
$$;
