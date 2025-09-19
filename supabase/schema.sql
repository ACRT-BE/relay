create extension if not exists "uuid-ossp";

create table if not exists drivers (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz default now(),
  name text not null,
  color text
);

create table if not exists races (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz default now(),
  name text not null,
  type text not null default 'race',
  start_time timestamptz,
  notes text
);

create table if not exists stints (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz default now(),
  race_id uuid references races(id) on delete cascade,
  driver_id uuid references drivers(id) on delete set null,
  order_index int not null default 0,
  duration_minutes int not null default 10
);

-- Enable Realtime
alter publication supabase_realtime add table drivers;
alter publication supabase_realtime add table races;
alter publication supabase_realtime add table stints;

-- RLS policies
alter table drivers enable row level security;
alter table races enable row level security;
alter table stints enable row level security;

create policy "Public read drivers" on drivers for select using (true);
create policy "Public write drivers" on drivers for insert with check (true);
create policy "Public update drivers" on drivers for update using (true);
create policy "Public delete drivers" on drivers for delete using (true);

create policy "Public read races" on races for select using (true);
create policy "Public write races" on races for insert with check (true);
create policy "Public update races" on races for update using (true);
create policy "Public delete races" on races for delete using (true);

create policy "Public read stints" on stints for select using (true);
create policy "Public write stints" on stints for insert with check (true);
create policy "Public update stints" on stints for update using (true);
create policy "Public delete stints" on stints for delete using (true);
