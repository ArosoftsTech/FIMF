-- Database Webhook : notifie l'Edge Function "sponsor-notification" à chaque INSERT
-- dans public.sponsor_requests (équivalent du "Database Webhooks" du dashboard, en SQL).
--
-- Le secret est stocké dans private.webhook_config (schéma inaccessible aux rôles
-- anon/authenticated) et transmis à la fonction via l'en-tête x-webhook-secret.
-- La même valeur doit être définie comme secret Edge Function WEBHOOK_SECRET.
--
-- Exécution (remplacer __WEBHOOK_SECRET__ par la valeur réelle, jamais committée) :
--   node supabase/run-sql.mjs <fichier-substitué>.sql

create extension if not exists pg_net with schema extensions;

-- Stockage privé du secret
create schema if not exists private;
create table if not exists private.webhook_config (
  key   text primary key,
  value text not null
);
insert into private.webhook_config (key, value) values
  ('sponsor_webhook_secret', '__WEBHOOK_SECRET__')
on conflict (key) do update set value = excluded.value;
revoke all on schema private from anon, authenticated;
revoke all on all tables in schema private from anon, authenticated;

create or replace function public.notify_sponsor_request()
returns trigger
language plpgsql
security definer
set search_path = extensions, public, net, private
as $$
declare
  v_secret text;
  v_url    text := coalesce(
    (select value from private.webhook_config where key = 'functions_url'),
    'https://qyyclgiiecertaantjna.supabase.co/functions/v1/sponsor-notification'
  );
begin
  select value into v_secret from private.webhook_config where key = 'sponsor_webhook_secret';
  perform net.http_post(
    url := v_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-webhook-secret', v_secret
    ),
    body := jsonb_build_object(
      'type', TG_OP,
      'table', TG_TABLE_NAME,
      'record', row_to_json(NEW)
    ),
    timeout_milliseconds := 5000
  );
  return NEW;
end;
$$;

drop trigger if exists sponsor_requests_notify on public.sponsor_requests;
create trigger sponsor_requests_notify
  after insert on public.sponsor_requests
  for each row
  execute function public.notify_sponsor_request();
