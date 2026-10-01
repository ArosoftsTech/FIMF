-- Migration : demandes de sponsoring / partenariat
-- Exécution : SQL Editor Supabase (la clé sb_secret_ du .env.local n'est pas
-- acceptée par l'API management pour le DDL).
-- Fusionnée aussi dans supabase/setup.sql pour les futurs environnements.

create table if not exists public.sponsor_requests (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  company text not null,
  contact_name text not null,
  email text not null,
  phone text,
  pack text not null default 'platinum',
  message text,
  status text not null default 'nouvelle'
);

alter table public.sponsor_requests enable row level security;

-- Formulaire public : insertion autorisée pour tous
drop policy if exists "anyone can submit sponsor request" on public.sponsor_requests;
create policy "anyone can submit sponsor request"
  on public.sponsor_requests for insert
  to anon, authenticated with check (true);

-- Lecture réservée aux utilisateurs authentifiés (console admin)
drop policy if exists "admins read sponsor requests" on public.sponsor_requests;
create policy "admins read sponsor requests"
  on public.sponsor_requests for select
  to authenticated using (true);
