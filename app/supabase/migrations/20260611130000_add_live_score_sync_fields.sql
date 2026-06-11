alter table public.matches
  add column if not exists external_provider text,
  add column if not exists external_fixture_id text,
  add column if not exists external_status text,
  add column if not exists external_updated_at timestamptz,
  add column if not exists awaiting_admin_confirmation boolean not null default false;

create unique index if not exists matches_external_fixture_unique
  on public.matches (external_provider, external_fixture_id)
  where external_provider is not null
    and external_fixture_id is not null;

comment on column public.matches.external_provider is
  'Live-score provider identifier, for example sportmonks.';
comment on column public.matches.external_fixture_id is
  'Fixture identifier assigned by the external live-score provider.';
comment on column public.matches.external_status is
  'Last raw/normalized match state received from the external provider.';
comment on column public.matches.external_updated_at is
  'Timestamp of the latest accepted update from the external provider.';
comment on column public.matches.awaiting_admin_confirmation is
  'True when the provider reports full time but an admin has not approved finished status.';
