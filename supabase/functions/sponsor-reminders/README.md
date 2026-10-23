# Rappels automatiques — contrats de sponsoring

Edge Function `sponsor-reminders` : rappelle à l'équipe partenaires les
contrats de sponsors finissant **sous 30 jours**. À exécuter quotidiennement.

## Déclencheur (cron)

Deux options équivalentes :

1. **Intégrations → Cron du Dashboard Supabase** : `POST <url-fonction>`
   tous les jours à 08:00 UTC avec l'en-tête `x-reminders-secret: <valeur>`.
2. **pg_cron + pg_net** (SQL Editor) :

```sql
select cron.schedule(
  'sponsor-reminders',
  '0 7 * * *',
  $$ select net.http_post(
    url := 'https://qyyclgiiecertaantjna.supabase.co/functions/v1/sponsor-reminders',
    headers := '{"x-reminders-secret": "__REMINDERS_SECRET__"}'::jsonb
  ) $$
);
```

## Secrets requis (Dashboard → Edge Functions → Secrets)

| Secret                     | Rôle                                                       |
| -------------------------- | ---------------------------------------------------------- |
| `RESEND_API_KEY`           | Envoi email (requis)                                       |
| `REMINDERS_SECRET`         | Authentifie l'appel cron (requis, fail-closed)              |
| `SUPABASE_SERVICE_ROLE_KEY`| Lecture des contrats (`sponsor_clients` protégé par RLS admin) |
| `RESEND_FROM`, `PARTNER_INBOX` | Test / expédition (optionnels)                          |

Le destinataire est `sponsor_settings.notify_email` (paramétrable dans
l'admin → Sponsoring → Paramètres de la page), repli `PARTNER_INBOX`.

## Déploiement

```bash
SBP=<token> node supabase/deploy-function.mjs sponsor-reminders
```

## Comportement

- Aucun contrat à échéance → réponse `{ ok: true, reminded: 0 }` sans email.
- Sinon, un email de synthèse (tableau : sponsor, fin, montant, paiement).

Le tableau de bord du module affiche aussi ces contrats en alerte
(lecture client directe, indépendante de cette fonction).
