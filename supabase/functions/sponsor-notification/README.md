# Notification email — demandes de sponsoring

À chaque nouvelle demande soumise via le formulaire public `/sponsoring`, la
fonction envoie **deux emails** : l'équipe FIMF (destinataire =
`sponsor_settings.notify_email`, modifiable dans l'admin → Sponsoring →
Paramètres de la page ; repli `PARTNER_INBOX`) et un accusé de réception au
demandeur. Le libellé du package est résolu dynamiquement : table
`sponsor_packages` (slug → nom) puis repli statique (bronze/argent/or/diamant,
et les anciennes valeurs silver/gold/platinum).

## Architecture (déployée et testée E2E ✅)

```
Formulaire site → INSERT sponsor_requests (Postgres)
                      │  trigger sponsor_requests_notify (pg_net)
                      ▼
        Edge Function sponsor-notification  (+ secret x-webhook-secret)
                      │  (API Resend)
                      ▼
             partenaires@fimf.ci
```

## Configuration en place

Secrets Edge Function (via API management `POST /v1/projects/{ref}/secrets`) :

| Secret           | Rôle                                                              |
| ---------------- | ----------------------------------------------------------------- |
| `RESEND_API_KEY` | Clé API Resend (requise)                                          |
| `WEBHOOK_SECRET` | Authentifie le trigger SQL (en-tête `x-webhook-secret`)            |
| `PARTNER_INBOX`  | **Mode test** : `reuvenethank3@gmail.com` (limite compte Resend)   |
| `RESEND_FROM`    | **Mode test** : `FIMF Partenariats <onboarding@resend.dev>`        |

Côté base, le secret du webhook vit dans `private.webhook_config` (schéma inaccessible
aux rôles anon/authenticated), clé `sponsor_webhook_secret`.

## Déploiement / mise à jour de la fonction

```bash
SBP=<token sbp_v0_...> node supabase/deploy-function.mjs sponsor-notification
```

(Équivalent CLI si installé : `supabase functions deploy sponsor-notification`.)

## Webhook SQL

Fichier : `supabase/webhook-sponsor-notification.sql` (trigger + fonction `pg_net`).
La même valeur de secret doit figurer dans `private.webhook_config` et dans le secret
Edge Function `WEBHOOK_SECRET`.

## Passage en production

La clé Resend actuelle est restreinte à l'envoi et le compte ne peut tester qu vers
l'adresse du propriétaire. Pour expédier réellement à `partenaires@fimf.ci` depuis
`notifications@fimf.ci` :

1. Vérifier le domaine `fimf.ci` dans Resend (Domains) — DNS SPF/DKIM.
2. Supprimer les secrets de test :
   ```bash
   # DELETE /v1/projects/qyyclgiiecertaantjna/secrets  body: ["PARTNER_INBOX","MEMBER_INBOX","RESEND_FROM"]
   ```
   Les fonctions retombent alors sur `partenaires@fimf.ci` + `notifications@fimf.ci`.

## Fonctions associées

| Fonction              | Déclencheur                                   | Effet                                    |
| --------------------- | --------------------------------------------- | ---------------------------------------- |
| `sponsor-notification`| INSERT `sponsor_requests`                     | Email équipe FIMF + accusé demandeur     |
| `sponsor-reminders`   | Cron quotidien (secret `x-reminders-secret`)  | Rappel des contrats finissant sous 30 j  |
| `member-notification` | INSERT `member_requests`                      | Email à la fédération                    |
| `member-activate`     | UPDATE `member_requests` → « approuvée »      | Crée `auth.users`, email de bienvenue, purge du mot de passe |

Redéploiement : `SBP=<token> node supabase/deploy-function.mjs <nom>`

## Alternative sans Resend

La fonction utilise l'API REST de Resend (un simple `fetch`). Pour basculer vers
SendGrid/Postmark/Brevo, remplace uniquement l'appel `fetch('https://api.resend.com/emails')`
par l'endpoint correspondant — le reste ne change pas.
