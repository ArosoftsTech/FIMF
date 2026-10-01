-- Compte membre de test durable (conservé pour les essais manuels)
-- Email : membre.test@fimf.ci — Mot de passe : ***REMOVED***
insert into public.member_requests (full_name, email, password, status)
values ('Membre Test', 'membre.test@fimf.ci', '***REMOVED***', 'nouvelle')
on conflict (email) do update set password = excluded.password, status = 'nouvelle';

update public.member_requests
set status = 'approuvée'
where email = 'membre.test@fimf.ci' and auth_user_id is null;
