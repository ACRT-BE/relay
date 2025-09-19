
-- Tables
create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique,
  created_at timestamp with time zone default now()
);

create table if not exists public.drivers (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  name text not null,
  color text not null default '#3b82f6'
);

create table if not exists public.races (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  name text not null,
  type text not null default 'race',
  date date not null,
  start time not null,
  finish time not null
);

create table if not exists public.stints (
  id uuid primary key default gen_random_uuid(),
  race_id uuid not null references public.races(id) on delete cascade,
  driver_id uuid not null references public.drivers(id) on delete cascade,
  duration_minutes integer not null check (duration_minutes > 0),
  pos integer not null default 0
);

-- RLS
alter table public.teams enable row level security;
alter table public.drivers enable row level security;
alter table public.races enable row level security;
alter table public.stints enable row level security;

-- Lecture publique, écriture autorisée pour anon (à ajuster en prod)
create policy if not exists "teams read" on public.teams for select using (true);
create policy if not exists "teams write" on public.teams for insert with check (true);
create policy if not exists "teams update" on public.teams for update using (true);
create policy if not exists "teams delete" on public.teams for delete using (true);

create policy if not exists "drivers read" on public.drivers for select using (true);
create policy if not exists "drivers write" on public.drivers for insert with check (true);
create policy if not exists "drivers update" on public.drivers for update using (true);
create policy if not exists "drivers delete" on public.drivers for delete using (true);

create policy if not exists "races read" on public.races for select using (true);
create policy if not exists "races write" on public.races for insert with check (true);
create policy if not exists "races update" on public.races for update using (true);
create policy if not exists "races delete" on public.races for delete using (true);

create policy if not exists "stints read" on public.stints for select using (true);
create policy if not exists "stints write" on public.stints for insert with check (true);
create policy if not exists "stints update" on public.stints for update using (true);
create policy if not exists "stints delete" on public.stints for delete using (true);
