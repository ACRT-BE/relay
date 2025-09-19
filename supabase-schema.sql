
create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique,
  created_at timestamp with time zone default now()
);

create table if not exists public.drivers (
  id uuid primary key default gen_random_uuid(),
  team_id uuid references public.teams(id) on delete cascade,
  name text not null,
  color text not null default '#3b82f6',
  created_at timestamp with time zone default now()
);

create table if not exists public.races (
  id uuid primary key default gen_random_uuid(),
  team_id uuid references public.teams(id) on delete cascade,
  name text not null,
  type text not null default 'race',
  date date not null,
  start text not null,   -- 'HH:mm'
  finish text not null,  -- 'HH:mm'
  created_at timestamp with time zone default now()
);

create table if not exists public.stints (
  id uuid primary key default gen_random_uuid(),
  race_id uuid references public.races(id) on delete cascade,
  driver_id uuid references public.drivers(id) on delete set null,
  duration_minutes int not null default 10,
  pos int not null default 0,
  created_at timestamp with time zone default now()
);

-- RLS permissif (anonyme lecture/écriture) pour le PoC (ajustez selon besoin)
alter table public.teams enable row level security;
alter table public.drivers enable row level security;
alter table public.races enable row level security;
alter table public.stints enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename='teams' and policyname='p_teams_all') then
    create policy p_teams_all on public.teams for all using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where tablename='drivers' and policyname='p_drivers_all') then
    create policy p_drivers_all on public.drivers for all using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where tablename='races' and policyname='p_races_all') then
    create policy p_races_all on public.races for all using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where tablename='stints' and policyname='p_stints_all') then
    create policy p_stints_all on public.stints for all using (true) with check (true);
  end if;
end $$;
