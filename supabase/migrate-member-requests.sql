-- =====================================================================
-- FIMF — Demandes d'adhésion / membres (popup « Devenir membre »)
-- Ré-exécutable. Exécution :
--   SBP=<token> node supabase/run-sql.mjs supabase/migrate-member-requests.sql
-- =====================================================================

create table if not exists public.member_requests (
  id bigint generated always as identity primary key,
  full_name text not null,
  email text not null unique,
  -- Aucun mot de passe n'est stocké ici : le compte est créé à l'approbation
  -- (Edge Function member-activate) et le membre définit son mot de passe via
  -- un lien sécurisé envoyé par email.
  status text not null default 'nouvelle'
    check (status in ('nouvelle', 'approuvée', 'refusée')),
  created_at timestamptz not null default now()
);

alter table public.member_requests enable row level security;

-- Le public peut soumettre une demande (formulaire « Devenir membre »).
-- Le statut et les colonnes d'activation restent imposés par le serveur :
-- un visiteur ne peut pas s'auto-approuver.
drop policy if exists "anyone can submit member request" on public.member_requests;
create policy "anyone can submit member request"
  on public.member_requests
  for insert
  to anon, authenticated
  with check (status = 'nouvelle');

-- Lecture/réservation aux admins fédéraux (cohérent avec fimf_admins)
drop policy if exists "admins read member requests" on public.member_requests;
create policy "admins read member requests"
  on public.member_requests
  for select
  to authenticated
  using (public.is_fimf_admin());

drop policy if exists "admins manage member requests" on public.member_requests;
create policy "admins manage member requests"
  on public.member_requests
  for all
  to authenticated
  using (public.is_fimf_admin())
  with check (public.is_fimf_admin());
