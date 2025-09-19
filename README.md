
# Kart Relay (Next.js + Supabase)

Application mobile-first pour organiser les relais karting. Format 24h strict, multi-équipes, courses, pilotes, couleurs, surbrillance du relais en cours.

## Lancement local
```bash
npm i
cp .env.local.example .env.local
npm run dev
```

## Vercel
- Importer le repo, framework auto: Next.js.
- Variables d'env (optionnel, pour persistance Supabase) :
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Pour forcer la **démo** même avec Supabase : `NEXT_PUBLIC_FORCE_DEMO=1`

## Seed automatique Supabase
Au premier démarrage avec Supabase, si la table `teams` est **vide**, l'app **insère automatiquement** les données de démo (Équipe A/B, pilotes, courses, relais).

## Seed manuel (SQL)
Utilisez `seed-demo.sql` dans le SQL Editor Supabase si vous préférez.
