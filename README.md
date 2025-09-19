
# Kart Relay (Next.js + Supabase)

Mobile-first, format 24h, multi-équipes, tri chrono, surbrillance relais en cours, palette 10 couleurs, équilibrage par pilote.

## Démarrer
```bash
npm i
cp .env.local.example .env.local
npm run dev
```

## Vercel
- Importer le repo ; framework auto: Next.js.
- Variables d'env (optionnel, pour persistance Supabase) :
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Pour **voir la démo en prod** même avec Supabase configuré: `NEXT_PUBLIC_FORCE_DEMO=1`.

## Supabase
1) Exécuter **supabase-schema.sql** dans le SQL Editor (création des tables + RLS permissif).
2) (Optionnel) Exécuter **seed-demo.sql** pour insérer Équipe A/B, pilotes, courses, relais.
3) Mettre `NEXT_PUBLIC_FORCE_DEMO=0` pour utiliser la base.
