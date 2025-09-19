# Kart Relay App

Interface mobile (Next.js + Supabase) pour organiser les relais des pilotes lors des courses de karting.

## Fonctionnalités
- Gestion des courses (qualification, sprint, finale, etc.)
- Pilotes avec couleurs personnalisées
- Relais (durée en minutes) et heures de passage calculées automatiquement
- Édition en temps réel (ajout/suppression, permutation, drag via flèches, swap entre deux pilotes)
- Sync en temps réel via Supabase Realtime
- UI optimisée smartphone (TailwindCSS)

## Démarrage local
```bash
npm i
cp .env.example .env.local # puis renseignez vos variables
npm run dev
```
Ouvrez http://localhost:3000

## Déploiement Vercel
- Poussez le dépôt sur GitHub, importez sur Vercel.
- Ajoutez les variables d'environnement `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_ANON_KEY` dans Vercel.
- Build command: `npm run build`

## Schéma Supabase
Exécutez le SQL suivant dans le SQL Editor Supabase :
```
{
schema_sql
}
```

## Tables écoutées en temps réel
- `drivers`
- `races`
- `stints`

## Notes
- Le calcul des heures de passage se base sur `races.start_time` et la somme des durées des relais.
- Les modifications sont optimistes côté client avec confirmation via Realtime.
