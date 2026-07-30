# AFRIMED — Application médicale (MVP)

Progressive Web App pour la consultation médicale structurée au Burkina Faso.

## Stack

- **React 18** + **TypeScript** + **Vite**
- **Tailwind CSS** — charte bleu nuit / teal / terracotta
- **Supabase** — auth, base de données (Phase 1)
- **PWA** — installable sur tablette

## Démarrage rapide (mode démo)

```bash
npm install
npm run dev
```

Sans fichier `.env.local`, l'app fonctionne en **mode démo** avec les comptes ci-dessous.

## Comptes démo (sans Supabase)

| Profil | Email | Mot de passe |
|--------|-------|--------------|
| Admin | admin@afrimed.bf | demo1234 |
| Médecin | medecin@afrimed.bf | demo1234 |
| Laborantin | labo@afrimed.bf | demo1234 |

**Patient** : code `AF7K2M` (ou tout code 4+ caractères en mode démo)

## Configuration Supabase (Phase 1)

1. Créer un projet sur [supabase.com](https://supabase.com)
2. Copier `.env.example` → `.env.local` et renseigner les clés
3. Exécuter `supabase/migrations/001_initial_schema.sql` dans le SQL Editor
4. Dans **Authentication → Users**, créer l'admin `admin@afrimed.bf`
5. Lier le profil admin (voir commentaire en fin de migration SQL)
6. Désactiver la confirmation email : **Authentication → Providers → Email**

## Phases livrées

### Phase 0
- Splash, login, navigation multi-profils, PWA

### Phase 1
- Auth Supabase (staff) avec session persistée
- Accès patient par code (table `patients`)
- Admin : liste utilisateurs, création médecin/labo, activation/désactivation
- Fallback mode démo si Supabase non configuré

### Phase 2 (à venir)
- Dossier patient complet

## Scripts

```bash
npm run dev      # développement
npm run build    # build production
npm run preview  # prévisualiser le build
```

## Documents projet

- `AFRIMED_Proposition_MVP.pdf` — périmètre fonctionnel
- `CAHIER DES CHARGES.pdf` — spécifications complètes
- `formulaire_medicaments_essentiels.xlsx` — base médicaments
