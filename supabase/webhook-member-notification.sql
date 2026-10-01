-- Database Webhook : notifie l'Edge Function "member-notification" à chaque INSERT
-- dans public.member_requests (même mécanique que sponsor-notification).
--
-- Le secret est réutilisé depuis private.webhook_config (sponsor_webhook_secret) :
-- la fonction Edge valide l'en-tête x-webhook-secret avec WEBHOOK_SECRET.
-- Exécution : SBP=<token> node supabase/run-sql.mjs supabase/webhook-member-notification.sql

-- pg_net est déjà activé (webhook-sponsor-notification.sql)

create or replace function public.notify_member_request()
returns trigger
language plpgsql
security definer
set search_path = extensions, public, net, private
as $$
declare
  v_secret text;
  v_url    text := coalesce(
    (select value from private.webhook_config where key = 'functions_url'),
    'https://qyyclgiiecertaantjna.supabase.co/functions/v1/member-notification'
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

drop trigger if exists member_requests_notify on public.member_requests;
create trigger member_requests_notify
  after insert on public.member_requests
  for each row
  execute function public.notify_member_request();
