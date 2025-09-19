
# Kart Relay (Next.js + Supabase)

Application mobile-first pour organiser les relais en karting : courses, pilotes, durées, ordre des relais, surbrillance du relais en cours, profils d'équipes multiples (renommage, ajout, suppression).

## Démarrage local

```bash
npm i
cp .env.local.example .env.local
# Remplissez NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY
npm run dev
```

## Déploiement Vercel

1. Pousser ce repo sur GitHub.
2. Sur Vercel, **Import Project** → Framework **Next.js**.
3. Variables d'environnement (Project Settings → Environment Variables) :  
   - `NEXT_PUBLIC_SUPABASE_URL`  
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Déployer.

## Schéma Supabase

Exécutez `supabase-schema.sql` dans votre base (SQL Editor) pour créer les tables et contraintes. Des RLS simples sont incluses (lecture publique, écriture avec anon key — à adapter selon vos besoins).

## Notes

- Le format d'heure est **strictement `HH:mm`** côté UI (sans expressions régulières).
- Si les variables Supabase ne sont pas configurées, l'app fonctionne en **local (in-memory)**.
