# RAAC PROMs – Polyclinique Côte Basque Sud

Suivi des patients RAAC (Oxford, WOMAC, Douleur VAS, Qualité de vie VAS, Satisfaction /10) avec rappels e‑mail, portails patient/médecin, export CSV/ZIP par chirurgien et synchronisation mensuelle de l'annuaire.

## Déploiement Netlify

1. **Variables d'environnement** (`.env` ou panneau Netlify):
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://...supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=
   SUPABASE_SERVICE_ROLE=
   NEXT_PUBLIC_SITE_URL=https://raac-ortho-pcbs.netlify.app
   NEXT_PUBLIC_FUNCTIONS_BASE=/.netlify/functions
   RESEND_API_KEY=
   MAIL_FROM="RAAC PCBS <noreply@pcbs.fr>"
   TIMEZONE=Europe/Paris
   SURGEON_DIRECTORY_URL=https://polyclinique-cotebasquesud.fr/annuaire/
   ```
2. **Build**
   - `node scripts/verify-env.mjs && npm run build`
3. **Fonctions planifiées** (déjà déclarées dans `netlify.toml`)
   - `send-reminders` : `0 5 * * *`
   - `surgeon-sync` : `0 2 1 * *`

## Scripts

- `scripts/verify-env.mjs` → stoppe le build si des variables critiques manquent.

## Export par chirurgien

```
GET /.netlify/functions/export-by-surgeon
```
Retourne une archive ZIP contenant un CSV par chirurgien :
`patient_id,patient_email,surgeon,timepoint,created_at,oxford_total,oxford_q1..12,womac_total,womac_pain,womac_stiffness,womac_function,womac_q1..24,qol_vas,pain_vas,satisfaction,extra`

*Satisfaction est notée sur 10 : 0 = très insatisfait, 10 = très satisfait.*

## Portails

- `/portal/patient?patient_id=...&token=...`
- `/portal/medecin` (auth Supabase)
- `/portal/admin`

## Licence

MIT
