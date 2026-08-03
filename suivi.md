# AFRIMED - Suivi d'avancement

Dernière mise à jour : 2026-08-03
Références : AFRIMED_Proposition_MVP.pdf | CAHIER DES CHARGES.pdf
Règle : source de vérité. Mettre à jour à chaque lot. Pas d'emoji. Optimiser les tokens.

---

## Objectif MVP

Flux consultation bout en bout sur 1 etablissement :
Admin comptes → Medecin patient+code → Consultation → IA → Diagnostic → Labo → Ordonnance PDF → Suivi → Patient lit son dossier.

Stack : React + Tailwind + PWA + Supabase + Gemini + Vercel.

---

## Etat global

Statut : MVP EN LIGNE.
URL production : https://afrimed-wpa.vercel.app
Schema 003 OK. E2E OK. Deploy Vercel OK.

---

## Hebergement

Durable gratuit cible : Vercel (front + API serverless, 0 euro).
Script : `scripts/deploy-vercel.mjs` / `npm run deploy`
Une action humaine obligatoire : `npx vercel login` (compte gratuit).

Tunnel temp (jury/dev) : Cloudflare Quick Tunnel tant que le PC tourne.

---

## Fait (code)

### Phase 0-1
- [x] PWA, auth, admin users API, bootstrap comptes

### Phase 2 - Dossier patient
- [x] Recherche / creation / code unique / antecedents / allergies / traitements / detail dossier

### Phase 3 - Consultation guidee
- [x] Motif, histoire, constantes, revue systemes, examen, cloture diagnostic/report, suivi

### Phase 4 - IA
- [x] Suggestions heuristiques + Gemini si GEMINI_API_KEY

### Phase 5 - Prescription
- [x] Medicaments, alerte allergies + override, PDF jspdf

### Phase 6 - Laboratoire
- [x] Demandes, saisie resultats, listes labo

### Phase 7 - Espace patient
- [x] Dossier / ordonnances / suivi via code

### Phase 8 - Pilotage
- [x] Dashboards medecin/admin + stats

### Infra code
- [x] API `/api/clinical/*` + `/api/admin/*`
- [x] Migration 003 ecrite
- [x] Comptes seed admin/medecin/labo
- [x] Appliquer 003 en base live
- [ ] Optionnel GEMINI_API_KEY
- [ ] Optionnel DATABASE_URL pour auto-migrations
- [ ] Deploy Vercel avec env

---

## Hors MVP (V2)

Offline, infirmier, SMS/email, dashboard national, vaccination/imagerie completes, multi-etablissements.

---

## Identifiants

- admin@afrimed.bf / demo1234
- medecin@afrimed.bf / demo1234
- labo@afrimed.bf / demo1234
- Patient demo : AF7K2M

---

## Action immediate

Tester le flux :
1. `npm run dev` (redemarrer si deja lance)
2. Login medecin@afrimed.bf
3. Creer patient → consultation → demande labo → ordo
4. Login labo → saisir resultat
5. Patient code AF7K2M

---

## Journal

- 2026-08-03 : Phase 0-1 Supabase OK.
- 2026-08-03 : MVP code Phases 2-8 livre. Build OK.
- 2026-08-03 : Schema 003 applique. 40 medicaments. Comptes verifies.
- 2026-08-03 : E2E flux OK apres fix allergies create + blocage prescription (accents).
- 2026-08-03 : Deploy Vercel https://afrimed-wpa.vercel.app + fix route patient-portal.
