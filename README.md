# AFRIMED

Application medicale PWA (consultation structuree).

## Stack

- React 18 + TypeScript + Vite
- Tailwind CSS
- Supabase
- PWA installable
- Hebergement: Vercel

## URL

https://afrimed-wpa.vercel.app

## Demarrage local

```bash
npm install
npm run dev
```

Sans `.env.local`, mode demo.

## Comptes

| Profil | Email | Mot de passe |
|--------|-------|--------------|
| Admin | admin@afrimed.bf | demo1234 |
| Medecin | medecin@afrimed.bf | demo1234 |
| Laborantin | labo@afrimed.bf | demo1234 |

Patient: code `AF7K2M`

## Configuration Supabase

1. Copier `.env.example` vers `.env.local`
2. Renseigner `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`
3. Executer les migrations SQL (`001`, puis `002` si besoin, puis `003`)
4. Activer le provider Email (sans confirmation)
5. `npm run fix:supabase`

## Scripts

```bash
npm run dev
npm run build
npm run fix:supabase
npm run e2e
npm run deploy
```

## Docs

- `suivi.md`
- `AFRIMED_Proposition_MVP.pdf`
- `CAHIER DES CHARGES.pdf`
