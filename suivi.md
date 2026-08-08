# AFRIMED - Suivi d'avancement

Derniere mise a jour : 2026-08-08
References : AFRIMED_Proposition_MVP.pdf | CAHIER DES CHARGES.pdf
Regle : source de verite. Mettre a jour a chaque lot. Pas d'emoji. Optimiser les tokens.

---

## Objectif MVP

Flux consultation bout en bout sur 1 etablissement :
Admin comptes -> Medecin patient+code -> Consultation -> IA -> Diagnostic -> Labo -> Ordonnance PDF -> Suivi -> Patient lit son dossier.

Stack : React + Tailwind + PWA + Supabase + Gemini + Vercel.

---

## Etat global

Statut : MVP LIVRE ET STABLE EN PROD.
URL : https://afrimed-wpa.vercel.app
GitHub : https://github.com/Afrimed1/afrimed_wpa
Schema 001-004 OK (medical_history applique). E2E 19/19. Smoke HTTP prod OK (dossier/consultation/labo/portail).

---

## Fait

### Phase 0-1
- [x] PWA, auth, admin users API, bootstrap comptes

### Phase 2 - Dossier patient
- [x] Recherche / creation / code unique / antecedents / allergies / traitements / detail dossier
- [x] Age revolu (calcule/remplit date naissance)
- [x] Motif + histoire maladie avant antecedents (cree consultation initiale)
- [x] Antecedents personnels / medicaux / familiaux / traitements
- [x] Fix creation dossier (null dates, allergies en 1 requete, sanitize payload)
- [x] Colonne medical_history (migration 004)

### Phase 3 - Consultation guidee
- [x] Motif, histoire, constantes, revue systemes, examen, cloture diagnostic/report, suivi

### Phase 4 - IA
- [x] Suggestions heuristiques + Gemini si GEMINI_API_KEY

### Phase 5 - Prescription
- [x] Medicaments, alerte allergies + override, PDF

### Phase 6 - Laboratoire
- [x] Demandes, saisie resultats, listes labo

### Phase 7 - Espace patient
- [x] Dossier / ordonnances / suivi via code

### Phase 8 - Pilotage
- [x] Dashboards medecin/admin + stats

### Infra
- [x] API `/api/clinical/*` + `/api/admin/*`
- [x] Fix Vercel routes imbriquees (404 patients/:id) via rewrite + handlers explicites
- [x] Migrations 001/002/003/004
- [x] Comptes seed admin/medecin/labo
- [x] Deploy Vercel + variables env
- [x] Repo GitHub a jour
- [x] IDENTIFIANTS_DEMO.txt ignore (local seul)
- [ ] Optionnel : GEMINI_API_KEY
- [ ] Optionnel : DATABASE_URL pour auto-migrations

---

## Hors MVP (V2)

Offline, infirmier, SMS/email, dashboard national, vaccination/imagerie completes, multi-etablissements.

---

## Identifiants (voir aussi IDENTIFIANTS_DEMO.txt local)

- admin@afrimed.bf / demo1234
- medecin@afrimed.bf / demo1234
- labo@afrimed.bf / demo1234
- Patient demo : AF7K2M

---

## Prochaine action utile

1. Optionnel : GEMINI_API_KEY sur Vercel pour IA Gemini reelle
2. Optionnel : DATABASE_URL pour auto-apply des migrations suivantes
3. Recueillir prochains retours client / jury

---

## Journal

- 2026-08-08 : Affiche motif + histoire maladie sur le dossier (apres infos admin, style cartes).
- 2026-08-08 : Suivi aligne. Migration 004 appliquee. Fix 404 Vercel. Smoke prod OK. Push + deploy.
- 2026-08-08 : Fix 404 dossier patient sur Vercel (routes API imbriquees + rewrite clinical-handler).
- 2026-08-07 : Audit + correctifs dossier (age, motif/histoire, personnels/medicaux, sanitize create, E2E 19/19, deploy).
- 2026-08-07 : Retours client dossier : age revolu, motif/histoire avant antecedents, personnels vs medicaux, fix erreur creation.
- 2026-08-03 : Phase 0-1 Supabase OK.
- 2026-08-03 : MVP code Phases 2-8. Build OK.
- 2026-08-03 : Schema 003 applique. 40 medicaments. Comptes verifies.
- 2026-08-03 : E2E OK (fix allergies + blocage prescription).
- 2026-08-03 : Deploy Vercel https://afrimed-wpa.vercel.app.
- 2026-08-03 : Push GitHub. IDENTIFIANTS_DEMO.txt ignore. suivi aligne.
