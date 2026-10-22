-- Compte membre de test durable (conservé pour les essais manuels)
-- Email : membre.test@fimf.ci
--
-- Le mot de passe n'est plus stocké en base : l'approbation de la demande
-- crée le compte (Edge Function member-activate) et envoie un lien sécurisé
-- « définir mon mot de passe » à l'adresse indiquée.
-- Pour un essai manuel, définir le mot de passe depuis le dashboard
-- (Authentication → Users → membre.test@fimf.ci) ou via le lien reçu.
insert into public.member_requests (full_name, email, status)
values ('Membre Test', 'membre.test@fimf.ci', 'nouvelle')
on conflict (email) do update set status = 'nouvelle', full_name = excluded.full_name;

update public.member_requests
set status = 'approuvée'
where email = 'membre.test@fimf.ci' and auth_user_id is null;
