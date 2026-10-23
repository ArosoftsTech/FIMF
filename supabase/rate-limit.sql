-- =====================================================================
-- FIMF — Limitation de débit des formulaires publics
-- Audit sécurité FIMF, constat 13 (anti-abus des formulaires).
--
-- `member_requests` et `sponsor_requests` acceptent une insertion en `anon` :
-- un robot pouvait les remplir en boucle, ce qui déclenchait autant d'emails
-- (pg_net → Resend) que de demandes à traiter à la main.
--
-- Ce script installe un quota d'insertions par adresse IP et par formulaire.
-- L'application se fait dans la base : elle protège donc aussi les clients
-- qui ignorent le JavaScript, et ne dépend d'aucun service externe.
--
-- Ré-exécutable sur la base existante, sans perte de données.
-- Aucune donnée existante n'est modifiée.
--
-- Application :
--   SBP=<token-management> node supabase/run-sql.mjs supabase/rate-limit.sql
-- =====================================================================

-- ─────────────────────────────────────────────────────────────
-- 1. PARAMÈTRES DU QUOTA
--
-- Une ligne par formulaire public. Les valeurs sont ajustables par
-- l'exploitant (UPDATE) sans redéployer quoi que ce soit : le trigger
-- relit la table à chaque insertion.
-- ─────────────────────────────────────────────────────────────

create table if not exists public.form_rate_limit_settings (
  form_key text primary key,
  -- Nombre maximum d'insertions autorisées sur la fenêtre.
  max_requests integer not null default 3 check (max_requests > 0),
  -- Durée de la fenêtre, en secondes (900 = 15 minutes).
  window_seconds integer not null default 900 check (window_seconds > 0),
  updated_at timestamptz not null default now()
);

-- `on conflict do nothing` : un quota ajusté par l'exploitant est conservé
-- lors d'une ré-exécution du script.
insert into public.form_rate_limit_settings (form_key, max_requests, window_seconds)
values
  ('member_requests', 3, 900),
  ('sponsor_requests', 3, 900)
on conflict (form_key) do nothing;

-- Table de configuration : consultation réservée à l'exploitant.
-- Le déclencheur y accède en `security definer`.
revoke all on table public.form_rate_limit_settings from anon, authenticated;

-- ─────────────────────────────────────────────────────────────
-- 2. COMPTEUR
--
-- Une ligne par envoi accepté. La table est purgée au-delà de la fenêtre.
-- ─────────────────────────────────────────────────────────────

create table if not exists public.form_rate_limit (
  id bigint generated always as identity primary key,
  form_key text not null,
  client_ip text not null,
  created_at timestamptz not null default now()
);

create index if not exists form_rate_limit_lookup
  on public.form_rate_limit (form_key, client_ip, created_at desc);

-- Table technique : aucun accès direct depuis le client.
-- Le trigger passe par une fonction `security definer` (voir plus bas).
alter table public.form_rate_limit enable row level security;

revoke all on table public.form_rate_limit from anon, authenticated;

-- ─────────────────────────────────────────────────────────────
-- 3. ADRESSE IP DU DEMANDEUR
--
-- PostgREST expose les en-têtes HTTP via le GUC `request.headers`.
-- `x-forwarded-for` porte l'adresse du client (Supabase le relaie en amont) ;
-- `x-real-ip` sert de repli. À défaut, tous les appels partagent la clé
-- « unknown » : le quota devient global, ce qui reste mieux que rien.
-- ─────────────────────────────────────────────────────────────

create or replace function public.form_rate_limit_client_ip()
returns text
language plpgsql
stable
security invoker
set search_path = public
as $$
declare
  headers jsonb := '{}'::jsonb;
  forwarded text;
begin
  begin
    headers := coalesce(nullif(current_setting('request.headers', true), '')::jsonb, '{}'::jsonb);
  exception when others then
    headers := '{}'::jsonb;
  end;

  forwarded := coalesce(headers ->> 'x-forwarded-for', headers ->> 'x-real-ip', '');

  if forwarded = '' then
    return 'unknown';
  end if;

  -- x-forwarded-for peut contenir une chaîne de proxys : le premier
  -- élément est l'adresse du client d'origine.
  return btrim(split_part(forwarded, ',', 1));
end;
$$;

grant execute on function public.form_rate_limit_client_ip() to anon, authenticated;

-- Aucun droit de lecture n'est accordé sur `form_rate_limit` : la table
-- contient les adresses IP des visiteurs, elle n'est pas exposée au client.
-- Le compteur affiché à l'utilisateur est local (voir `src/lib/rateLimit.ts`).

-- ─────────────────────────────────────────────────────────────
-- 4. DÉCLENCHEUR DE GARDE
--
-- `security definer` : le déclencheur écrit dans le compteur même si
-- le rôle appelant (anon) n'a aucun droit dessus.
-- Le rôle `service_role` / `postgres` n'est pas limité : ce sont des
-- écritures de confiance (scripts d'exploitation, back-office).
-- ─────────────────────────────────────────────────────────────

create or replace function public.enforce_form_rate_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_form text := tg_table_name;
  v_ip text := public.form_rate_limit_client_ip();
  v_role text := coalesce(current_setting('role', true), '');
  v_limit integer;
  v_window integer;
  v_count integer;
begin
  -- Écritures de confiance : non limitées.
  --   - rôle de service (Edge Functions, back-office) ;
  --   - session SQL directe de l'exploitant (aucun en-tête HTTP) : on
  --     distingue ce cas de PostgREST, qui expose toujours request.headers.
  if v_role in ('service_role', 'postgres', 'supabase_admin') then
    return new;
  end if;

  if nullif(coalesce(current_setting('request.headers', true), ''), '') is null then
    return new;
  end if;

  select s.max_requests, s.window_seconds
    into v_limit, v_window
  from public.form_rate_limit_settings s
  where s.form_key = v_form;

  -- Aucun quota défini pour cette table : on laisse passer.
  if v_limit is null then
    return new;
  end if;

  select count(*) into v_count
  from public.form_rate_limit
  where form_key = v_form
    and client_ip = v_ip
    and created_at > now() - make_interval(secs => v_window);

  if v_count >= v_limit then
    raise exception 'RATE_LIMIT'
      using errcode = 'P0001',
            detail = format(
              'Limite de %s envois atteinte pour %s sur une fenêtre de %s secondes.',
              v_limit, v_form, v_window
            );
  end if;

  -- Purge des envois hors fenêtre pour cette IP (garde la table petite).
  delete from public.form_rate_limit
  where form_key = v_form
    and client_ip = v_ip
    and created_at <= now() - make_interval(secs => v_window);

  insert into public.form_rate_limit (form_key, client_ip)
  values (v_form, v_ip);

  return new;
end;
$$;

-- ─────────────────────────────────────────────────────────────
-- 5. BRANCHEMENT SUR LES FORMULAIRES PUBLICS
-- ─────────────────────────────────────────────────────────────

-- Les déclencheurs ne sont posés que sur les tables existantes : le script
-- reste applicable dans n'importe quel ordre (setup.sql d'abord, ou les
-- migrations de tables ensuite).
do $$
declare
  t text;
begin
  foreach t in array array['member_requests', 'sponsor_requests'] loop
    if to_regclass('public.' || t) is not null then
      execute format('drop trigger if exists trg_form_rate_limit_%s on public.%s', t, t);
      execute format(
        'create trigger trg_form_rate_limit_%s before insert on public.%s '
        'for each row execute function public.enforce_form_rate_limit()',
        t, t
      );
    end if;
  end loop;
end;
$$;

-- ─────────────────────────────────────────────────────────────
-- 6. NETTOYAGE PÉRIODIQUE
--
-- pg_cron purge les compteurs trop anciens. Le job est créé une seule fois
-- (pg_cron refuse un nom déjà utilisé) et l'appel est sans danger si
-- l'extension n'est pas disponible.
-- ─────────────────────────────────────────────────────────────

do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    if not exists (select 1 from cron.job where jobname = 'fimf-clean-rate-limit') then
      perform cron.schedule(
        'fimf-clean-rate-limit',
        '17 3 * * *',
        'delete from public.form_rate_limit where created_at < now() - interval ''1 day'';'
      );
    end if;
  end if;
exception when others then
  -- pg_cron absent ou droits insuffisants : la purge ponctuelle du
  -- déclencheur (section 4) suffit à maintenir la table propre.
  null;
end;
$$;
