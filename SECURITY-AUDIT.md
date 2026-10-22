# Audit sécurité FIMF — constats et corrections

**Périmètre** : dépôt `ArosoftsTech/FIMF` @ `main` (`ab28798`) — frontend React 19 + Vite 8,
back-end Supabase (SQL/RLS, Storage, 3 Edge Functions), scripts d'exploitation.
**Date** : 21 octobre 2026.

Chaque constat indique la sévérité, la preuve, l'impact et l'état du correctif.
Les correctifs SQL sont regroupés dans [`supabase/security-hardening.sql`](supabase/security-hardening.sql),
ré-exécutable, à appliquer sur la base existante **sans re-seed**.
La limitation de débit des formulaires publics est un script distinct,
[`supabase/rate-limit.sql`](supabase/rate-limit.sql), également ré-exécutable.

---

## 1. Synthèse

| # | Sévérité | Constat | État |
|---|---|---|---|
| 1 | 🔴 Critique | Tout compte authentifié pouvait modifier/supprimer l'intégralité du contenu fédéral | ✅ Corrigé |
| 2 | 🔴 Critique | Mots de passe des membres stockés **en clair** dans `member_requests.password` | ✅ Corrigé |
| 3 | 🔴 Critique | Mot de passe admin de production et mot de passe commun des dirigeants en dur dans le dépôt | ✅ Corrigé (admin réinitialisé, historique purgé) |
| 4 | 🟠 Élevé | Demandes de sponsoring (email + téléphone) lisibles par tout compte membre | ✅ Corrigé |
| 5 | 🟠 Élevé | Journal d'audit alimentable par n'importe qui (anon) et lisible par tout compte | ✅ Corrigé |
| 6 | 🟠 Élevé | Bucket `fimf-media` : écriture ouverte à tout compte authentifié | ✅ Corrigé |
| 7 | 🟠 Élevé | Edge Functions « fail-open » si `WEBHOOK_SECRET` n'est pas configuré | ✅ Corrigé |
| 8 | 🟠 Élevé | Auto-approbation d'une demande d'adhésion (`status` contrôlé par le client) | ✅ Corrigé |
| 9 | 🟠 Élevé | RPC admin inutilisables par les admins (`EXECUTE` révoqué) → dashboard cassé | ✅ Corrigé |
| 10 | 🟡 Moyen | `admin_period_leaderboard` (security definer) sans garde admin | ✅ Corrigé |
| 11 | 🟡 Moyen | Injection HTML dans les emails transactionnels (nom, entreprise, message) | ✅ Corrigé |
| 12 | 🟡 Moyen | `.env.example` sans `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` (crash au démarrage) | ✅ Corrigé |
| 13 | 🟡 Moyen | Aucune limitation de débit sur les formulaires publics → spam d'emails et de comptes | ✅ Corrigé |
| 14 | 🟡 Moyen | Échecs d'écriture admin avalés (`console.error`) : l'UI affiche un succès alors que la base a refusé | ✅ Corrigé |
| 15 | 🟡 Moyen | 2 vulnérabilités npm « high » (`vite`, `source-map-js`) | ✅ Corrigé |
| 16 | 🟢 Faible | Images du hero ~4,5 Mo non compressées (LCP mobile) | ✅ Corrigé |
| 17 | 🟢 Faible | `fimfApi.ts` importé statiquement **et** dynamiquement → code splitting inopérant | ⚠️ Recommandation |
| 18 | 🟢 Faible | `officials` expose email/téléphone des dirigeants en lecture publique (à confirmer comme voulu) | ℹ️ À décider |

---

## 2. Détail des constats

### 1. 🔴 RLS permissive sur tout le contenu fédéral

`supabase/setup.sql` créait, pour `clubs`, `players`, `matches`, `news_articles`, `competitions`,
`gallery_photos`, `site_stats`, `partners`, `officials`, `commissions` :

```sql
create policy "admin write <table>" ... for all to authenticated
  using (true) with check (true);      -- ← n'importe quel compte connecté
```

Comme n'importe quel visiteur peut créer un compte membre (« Devenir membre »), cela revenait à
donner à **toute personne** le droit de réécrire le site, de supprimer le championnat ou de
falsifier les résultats. Les policies correctes existaient déjà dans `supabase/club-users-rls.sql`,
mais un rejeu de `setup.sql` les écrasait.

**Correctif** : `setup.sql` crée désormais `public.fimf_admins` + `public.is_fimf_admin()` et
toutes les écritures passent par cette garde. `security-hardening.sql` ajoute la granularité
« dirigeant » (club + effectif + matchs de son club uniquement) via `owns_club()`.

### 2. 🔴 Mots de passe en clair

`supabase/migrate-member-requests.sql` créait une colonne `password text` alimentée directement
par le formulaire public (`AuthChoiceModal`), purgée seulement à l'approbation. Toute fuite de
base (sauvegarde, dump, accès admin, clé `service_role`) exposait les mots de passe réels des
membres — souvent réutilisés ailleurs.

**Correctif** :
- colonne supprimée (`alter table ... drop column if exists password`) ;
- le formulaire ne demande plus de mot de passe ;
- à l'approbation, `member-activate` crée le compte avec un mot de passe aléatoire **jamais
  communiqué**, puis envoie un lien Supabase de type `recovery` (« définir mon mot de passe »)
  via Resend.

### 3. 🔴 Identifiants en dur dans le dépôt

- `supabase/test-rls.mjs` : mot de passe admin de production en valeur de repli
  (`process.env.ADMIN_PASSWORD ?? '…'`).
- `supabase/create-club-users.mjs` : `TEMP_PASSWORD = '***REMOVED***'`, commun aux 8 comptes
  dirigeants.

**Correctif** : les deux scripts exigent désormais les variables d'environnement
(`ADMIN_PASSWORD`, `TEST_CLUB_PASSWORD`, `CLUB_TEMP_PASSWORD`) et s'arrêtent sinon.
**Action requise côté exploitant** : ces secrets ont été versionnés, donc considérés comme
compromis → réinitialiser le mot de passe admin et ceux des 8 dirigeants, puis révoquer les
sessions actives.

### 4. 🟠 Données personnelles des sponsors

`sponsor_requests` : `for select to authenticated using (true)` → tout membre voyait les emails,
téléphones et messages des entreprises partenaires (prospection, RGPD/loi ivoirienne 2013-450).

**Correctif** : `select`/`update`/`delete` réservés à `is_fimf_admin()` ; l'insertion publique
impose `status = 'nouvelle'`.

### 5. 🟠 Journal d'audit

`audit_logs` : insertion autorisée à `anon` (`with check (true)`) et lecture par tout compte
authentifié. Un attaquant pouvait noyer ou falsifier la piste d'audit, et tout membre lire
l'activité administrative.

**Correctif** : insertion réservée aux comptes authentifiés, lecture réservée aux admins fédéraux.

### 6. 🟠 Bucket de stockage

`storage.objects` : `for all to authenticated` sur `fimf-media`, bucket **public**. N'importe quel
membre pouvait téléverser (ou supprimer) des fichiers servis publiquement sous le domaine de la
fédération.

**Correctif** : écriture restreinte à `public.is_fimf_admin()` ; lecture publique inchangée.

### 7. 🟠 Edge Functions fail-open

Dans les trois fonctions :

```ts
const secret = Deno.env.get('WEBHOOK_SECRET');
if (secret && req.headers.get('x-webhook-secret') !== secret) { … }
```

Si le secret n'était pas défini (oubli de configuration, rotation ratée), la fonction acceptait
**tous** les appels. `member-notification` / `sponsor-notification` envoient alors des emails
« officiels » FIMF à l'adresse de la fédération, et `member-activate` crée des comptes
`auth.users` avec la clé `service_role` (aucune fonction n'a `verify_jwt`, cf.
`deploy-function.mjs`).

**Correctif** : refus systématique (`503`) si `WEBHOOK_SECRET` est absent, `401` si l'en-tête ne
correspond pas. Le secret reste partagé avec `private.webhook_config` côté base.

### 8. 🟠 Auto-approbation d'adhésion

`member_requests` : `for insert to anon, authenticated with check (true)` → un visiteur pouvait
insérer directement `status = 'approuvée'`, déclenchant la création du compte par la fonction
d'activation sans validation humaine.

**Correctif** : `with check (status = 'nouvelle' and auth_user_id is null and activated_at is null)`.

### 9. 🟠 Dashboard admin cassé par un durcissement mal ciblé

`migrate-games.sql` faisait :

```sql
revoke execute on function public.admin_run_period_draw(bigint, text) from anon, authenticated;
```

Le dashboard appelle ces RPC en tant qu'admin authentifié → **évaluation des pronostics et tirages
au sort échouaient** (permission denied), alors que chaque fonction vérifie déjà `is_fimf_admin()`
en interne.

**Correctif** : `revoke … from public` + `grant execute … to authenticated`, garde interne
conservée. Le même correctif est rejoué par `security-hardening.sql` (section 7).

### 10. 🟡 Fonction security definer sans garde

`admin_period_leaderboard` exposait `user_id`, points et nombre de pronostics de tous les membres,
sans vérification de rôle. Elle était inatteignable par accident (cf. constat 9), mais le jour où
les droits étaient rétablis elle fuyait l'activité de tous les membres.

**Correctif** : réécrite en `plpgsql` avec `raise exception 'Réservé aux admins FIMF'`.

### 11. 🟡 Injection HTML dans les emails

`member-notification` et `sponsor-notification` interpolaient `full_name`, `company`,
`contact_name`, `message` directement dans le HTML. Un formulaire public permettait donc d'injecter
du balisage (faux bouton « Réinitialiser le mot de passe », image de tracking, etc.) dans la boîte
de réception de la fédération.

**Correctif** : helper `esc()` appliqué à toutes les valeurs d'origine externe ; les `subject`
sont nettoyés des retours à la ligne.

### 12. 🟡 Configuration incomplète

`supabaseClient.ts` lève une exception si `VITE_SUPABASE_URL` ou `VITE_SUPABASE_ANON_KEY` manque,
mais `.env.example` ne les déclarait pas : suivre la documentation produisait une page blanche.

**Correctif** : `.env.example` documente les deux variables (et rappelle que seules des valeurs
publiques doivent y figurer).

### 13. 🟡 Anti-abus des formulaires — CORRIGÉ

`member_requests` / `sponsor_requests` restent ouverts à `anon` et chaque insertion déclenche un
email (pg_net → Resend) : un robot pouvait remplir le formulaire en boucle et déclencher autant
d'emails que de demandes à traiter à la main.

**Correctif** : limitation de débit appliquée **en base** par `supabase/rate-limit.sql`.

- Un déclencheur `BEFORE INSERT` (`enforce_form_rate_limit`) refuse la demande au-delà du quota.
- Quota par IP et par formulaire, lisible et ajustable par l'exploitant
  (`form_rate_limit_settings`) : 3 envois / 15 minutes par défaut, modifiables par `UPDATE` sans
  redéploiement.
- L'adresse IP est lue dans `request.headers` (`x-forwarded-for`, repli `x-real-ip`).
- Les écritures de confiance (`service_role`, `postgres`) et les sessions SQL directes ne sont pas
  limitées : l'administration et les scripts d'exploitation restent utilisables.
- Le compteur est purgé hors fenêtre par le déclencheur lui-même, et par `pg_cron` s'il est
  disponible.
- Côté client, `src/lib/rateLimit.ts` évite qu'un double clic consomme le quota serveur, et
  traduit l'erreur `RATE_LIMIT` en message lisible dans les deux formulaires.

**Reporté** : le CAPTCHA (hCaptcha/Turnstile) reste la seule protection contre un bot distribué
sur plusieurs IP. La limitation de débit couvre le cas d'un robot depuis une adresse unique.

### 14. 🟡 Erreurs silencieuses — CORRIGÉ

`useAdminData` faisait `api.upsertX().catch(e => console.error(e.message))` après avoir mis à jour
l'état local : en cas de refus RLS, l'admin voyait « enregistré » alors que rien n'était écrit.

**Correctif** : 22 écritures passent désormais par un helper `persist(label, rollback, promise)` :

- l'état optimiste est **annulé** en cas d'échec (snapshot de la liste avant mutation) ;
- l'erreur remonte dans un **toast** (`ToastProvider`, `role="alert"`, 9 s) au lieu d'être avalée
  dans la console ;
- le journal d'activité n'est alimenté qu'en cas de succès.

`AdminGamesTab` et `AdminDashboardView` utilisent le même canal : le bandeau vert existant est
réservé aux succès, les erreurs passent par le toast — le bandeau était `hidden md:flex`, donc
invisible sur mobile.

### 16. 🟡 Poids des images — CORRIGÉ

5 JPG de 843–986 Ko (~4,5 Mo) étaient servis sans redimensionnement ; `optimizeImage` ne
s'appliquait qu'aux uploads admin.

**Correctif** : conversion au build (`tools/optimize-hero-images.py`) + composant
`<ResponsiveImage>`.

- Chaque image est ré-encodée en JPEG progressif (qualité 78) et déclinaison en **3 largeurs**
  (640 / 1024 / pleine largeur), en **JPEG et WebP** — 30 fichiers générés.
- `<ResponsiveImage>` rend un `<picture>` avec `<source type="image/webp">` + `srcset` + `sizes`,
  et `loading`/`fetchpriority` selon que l'image est la LCP de la page.
- 25 `<img>` du site ont migré vers ce composant (bandeaux, galerie, actus, calendrier,
  championnat, fiche article, lightbox…).
- Le carrousel hero sert désormais les variantes **locales** (le fichier du bucket pesait 955 Ko
  par slide) ; les images téléversées par l'admin restent servies par le bucket.
- Gain : **4,6 Mo → 941 Ko** en JPEG pleine largeur, et **~47 Ko** en WebP pour une image mobile.

**Reproductible** : `python tools/optimize-hero-images.py` (nécessite Pillow).

### 17–18. Points ouverts (non corrigés dans cette passe)

- **17. Code splitting.** `vite build` signale `INEFFECTIVE_DYNAMIC_IMPORT` sur `fimfApi.ts`.
  Recommandation : un point d'entrée d'API unique importé statiquement, ou des imports dynamiques
  cohérents.
- **18. Annuaire public.** `officials` expose `email` et `phone` en lecture `anon` — vérifier que
  c'est bien la politique éditoriale de la fédération.

---

## 3. Vérifications exécutées

| Contrôle | Commande | Résultat |
|---|---|---|
| Typecheck | `npx tsc --noEmit` | ✅ 0 erreur |
| Build production | `npm run build` | ✅ 2330 modules, `dist/` généré |
| Dépendances | `npm audit` | ✅ 0 vulnérabilité (avant : 2 « high » — `vite`, `source-map-js`) |
| Syntaxe Edge Functions | `npx esbuild supabase/functions/*/index.ts` | ✅ 3/3 transpilées |
| Schéma SQL + RLS | `npm run test:rls` (PGlite) appliquant `setup.sql`, `club-users-rls.sql`, `hero-slides.sql`, `migrate-sponsor-requests.sql`, `migrate-member-requests.sql`, `migrate-member-favorites.sql`, `migrate-players-photo.sql`, `migrate-member-activation.sql`, `security-hardening.sql` | ✅ 40/40 assertions |
| Idempotence | `security-hardening.sql` rejoué deux fois | ✅ sans erreur |
| Limitation de débit | `npm run test:rate-limit` (PGlite, `supabase/rate-limit.sql`) | ✅ 12/12 assertions |
| Idempotence quota | `rate-limit.sql` rejoué 3 fois | ✅ sans erreur, quota ajusté conservé |
| Détection RATE_LIMIT | 8 cas d'erreur Supabase simulés | ✅ 8/8 (RATE_LIMIT détecté, 23505/42501 réseau non confondus) |
| Rendu du toast | Chrome headless sur le serveur de dev, `role="alert"` | ✅ toast présent dans le DOM avec titre et message |
| Images | `python tools/optimize-hero-images.py` puis `<picture>` inspecté via Chrome headless | ✅ `<source type="image/webp">` + `srcset` 640/1024/pleine largeur |
| Serveur de dev | `npm run dev` + requête sur le module `AuthChoiceModal.tsx` | ✅ 200, nouveau formulaire servi (plus d'envoi de mot de passe) |

Assertions RLS validées par `npm run test:rls` : lecture publique conservée (clubs, actus,
carrousel, dirigeants) ; `anon` ne peut rien écrire ni lire sponsors/demandes/audit/admins ; membre
simple bloqué en écriture sur clubs et clubs d'autrui ; dirigeant limité à son club (club, effectif,
pas d'auto-attribution) et incapable d'agir sur un autre club ; `anon` et membre peuvent déposer une
demande d'adhésion « nouvelle » mais **pas** s'auto-approuver ; `member_requests` ne contient plus
de colonne `password` ; sponsors et journal d'audit illisibles par un membre ; favoris strictement
limités à leur propriétaire ; upload `storage.objects` refusé à un membre, accepté à l'admin ;
l'admin fédéral peut tout modifier. Le module jeux (`migrate-games.sql`, `pg_cron`) reste hors du
harnais : `admin_period_leaderboard` n'y est donc pas couvert.

Non vérifié ici : l'exécution réelle sur le projet Supabase (`run-sql.mjs` requiert le token de
management) et les tests de bout en bout `supabase/test-rls.mjs` (nécessitent des comptes réels).

---

## 4. Mise en œuvre

```bash
# 1. Schéma : durcissement de la base existante (aucune donnée supprimée)
SBP=<token-management> node supabase/run-sql.mjs supabase/security-hardening.sql

# 1 bis. Limitation de débit des formulaires publics
SBP=<token-management> node supabase/run-sql.mjs supabase/rate-limit.sql

# 2. Edge Functions
SBP=<token-management> node supabase/deploy-function.mjs member-activate
SBP=<token-management> node supabase/deploy-function.mjs member-notification
SBP=<token-management> node supabase/deploy-function.mjs sponsor-notification

# 3. Secrets Edge Functions (dashboard → Edge Functions → Secrets)
#    WEBHOOK_SECRET doit être identique à private.webhook_config.sponsor_webhook_secret
#    + RESEND_API_KEY, RESEND_FROM, SITE_URL, MEMBER_INBOX / PARTNER_INBOX

# 4. Frontend
cp .env.example .env.local   # puis renseigner VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY
npm ci && npm run build

# 5. Tests locaux (aucun accès réseau requis)
npm run test:rls             # RLS et durcissement, 40 assertions
npm run test:rate-limit      # limitation de débit, 12 assertions
python tools/optimize-hero-images.py   # régénère les variantes d'images (Pillow requis)
```

**Ordre imposé** : appliquer l'étape 1 **avant** de déployer le frontend, sinon l'insertion dans
`member_requests` échoue (colonne `password` absente). L'étape 1 bis est indépendante : elle peut
être appliquée à tout moment, avant ou après le déploiement.

**À faire par l'exploitant** (hors dépôt) :

1. Le mot de passe `admin@fimf.ci` a été réinitialisé et ses autres sessions révoquées. Restent à
   réinitialiser les mots de passe des 8 comptes dirigeants (créés avec `create-club-users.mjs`),
   puis à révoquer leurs sessions (Dashboard → Authentication → « Revoke all sessions »).
2. Définir `CLUB_TEMP_PASSWORD` au moment de rejouer `create-club-users.mjs` si de nouveaux clubs
   sont créés.
3. Vérifier que `WEBHOOK_SECRET` est bien défini côté Edge Functions (sinon les notifications
   renvoient `503` — comportement volontaire, visible dans les logs).
4. Prévenir les demandes d'adhésion en attente : elles recevront un lien « définir mon mot de passe »
   à l'approbation (les anciens mots de passe ne sont plus conservés).
5. Ajuster les quotas si nécessaire :
   `update public.form_rate_limit_settings set max_requests = 5, window_seconds = 3600;`
   (appliqué immédiatement, sans redéploiement).

---

## 5. Limites de cet audit

- Pas d'accès au projet Supabase réel : les policies ont été validées sur un PostgreSQL local avec
  des stubs (`auth.users`, `auth.uid()`, `storage`, `net`, publication realtime). Les extensions
  `pg_cron` / `pg_net` n'y sont pas disponibles, le module jeux a donc été simulé.
- `rate-limit.sql` est validé sur PGlite (`npm run test:rate-limit`, 12/12) : le comportement du
  déclencheur et du compteur est reproduit fidèlement, mais PostgREST et le rôle `anon` réel ne
  sont pas simulés. La lecture de `request.headers` (IP cliente) reste à confirmer sur le projet
  réel — c'est le seul point qui dépend de l'infrastructure.
- Pas de test de charge ni de revue de l'infrastructure (WAF, quotas Resend, sauvegardes,
  rotation des clés).
- Le rendu visuel n'a pas pu être capturé (bibliothèques système de Chromium absentes de
  l'environnement, sans accès root) : la vérification UI s'est limitée au HTML/module servi.
- L'historique Git a été réécrit (`git filter-repo`) : les mots de passe en dur ont été remplacés
  dans tous les commits, puis l'historique réécrit a été force-poussé. Tant que GitHub n'a pas
  ramassé les objets non référencés, d'anciens commits peuvent rester joignables par URL directe :
  il est possible de demander à GitHub Support de purger le cache du dépôt. La **rotation des mots
  de passe** reste la seule protection réellement fiable — celle de l'admin est faite, celle des
  dirigeants reste à faire.
