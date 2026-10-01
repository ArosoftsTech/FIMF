-- =====================================================================
-- FIMF — Activation des comptes membres approuvés
-- Quand une demande passe à « approuvée », l'Edge Function member-activate
-- crée le compte auth.users (email + mot de passe choisi), envoie l'email
-- de bienvenue, puis purge le mot de passe stocké dans member_requests.
-- Exécution : SBP=<token> node supabase/run-sql.mjs supabase/migrate-member-activation.sql
-- =====================================================================

-- 1. Colonnes d'activation
alter table public.member_requests add column if not exists auth_user_id uuid references auth.users(id) on delete set null;
alter table public.member_requests add column if not exists activated_at timestamptz;

-- 2. Trigger : UPDATE status → 'approuvée' (une seule fois) → webhook
create or replace function public.notify_member_activation()
returns trigger
language plpgsql
security definer
set search_path = extensions, public, net, private
as $$
declare
  v_secret text;
  v_url    text := coalesce(
    (select value from private.webhook_config where key = 'functions_url'),
    'https://qyyclgiiecertaantjna.supabase.co/functions/v1/'
  );
begin
  if NEW.status = 'approuvée'
     and OLD.status is distinct from 'approuvée'
     and NEW.auth_user_id is null
  then
    select value into v_secret from private.webhook_config where key = 'sponsor_webhook_secret';
    perform net.http_post(
      url := v_url || 'member-activate',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-webhook-secret', v_secret
      ),
      body := jsonb_build_object(
        'type', TG_OP,
        'table', TG_TABLE_NAME,
        'record', row_to_json(NEW)
      ),
      timeout_milliseconds := 8000
    );
  end if;
  return NEW;
end;
$$;

drop trigger if exists member_requests_activate on public.member_requests;
create trigger member_requests_activate
  after update on public.member_requests
  for each row
  execute function public.notify_member_activation();
