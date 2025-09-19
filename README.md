
# Kart Relay — Next.js + Supabase

## Variables d'environnement (Vercel)
- `NEXT_PUBLIC_SUPABASE_URL` = votre URL Supabase (ex: https://xxx.supabase.co)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` = votre clé anonyme

## SQL à exécuter dans Supabase (SQL Editor)
```sql
create table if not exists public.profiles (
  id text primary key,
  name text not null,
  data jsonb not null default '{}',
  updated_at timestamptz not null default now()
);
alter publication supabase_realtime add table public.profiles;
alter table public.profiles enable row level security;
create policy "profiles_read"   on public.profiles for select using (true);
create policy "profiles_insert" on public.profiles for insert with check (true);
create policy "profiles_update" on public.profiles for update using (true) with check (true);
create policy "profiles_delete" on public.profiles for delete using (true);
```

## Dev
```bash
npm i
npm run dev
```
