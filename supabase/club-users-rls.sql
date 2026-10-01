-- =====================================================================
-- FIMF — Comptes dirigeants par club + RLS granulaire
-- Ré-exécutable
-- =====================================================================

-- ---------------------------------------------------------------------
-- 0. TABLE fimf_admins (admins fédéraux, non rattachés à un club)
-- ---------------------------------------------------------------------
create table if not exists public.fimf_admins (
  user_id uuid not null primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.fimf_admins enable row level security;

drop policy if exists "read own admin row" on public.fimf_admins;
create policy "read own admin row" on public.fimf_admins
  for select using (user_id = auth.uid());

-- ---------------------------------------------------------------------
-- 1. TABLE club_users (liaison auth.users <-> club, rôle dirigeant)
-- ---------------------------------------------------------------------
create table if not exists public.club_users (
  user_id uuid not null references auth.users(id) on delete cascade,
  club_id text not null references public.clubs(id) on delete cascade,
  role text not null default 'dirigeant' check (role in ('dirigeant', 'admin')),
  created_at timestamptz not null default now(),
  primary key (user_id, club_id)
);

alter table public.club_users enable row level security;

-- Un utilisateur voit ses propres liaisons ; l'admin fédéral voit tout
drop policy if exists "read own club links" on public.club_users;
create policy "read own club links" on public.club_users
  for select using (
    user_id = auth.uid()
    or exists (select 1 from public.fimf_admins fa where fa.user_id = auth.uid())
  );

-- L'admin fédéral gère les liaisons ; un dirigeant ne peut pas s'auto-attribuer de club
drop policy if exists "admin manage club links" on public.club_users;
create policy "admin manage club links" on public.club_users
  for all to authenticated
  using (exists (select 1 from public.fimf_admins fa where fa.user_id = auth.uid()))
  with check (exists (select 1 from public.fimf_admins fa where fa.user_id = auth.uid()));

-- ---------------------------------------------------------------------
-- 2. FONCTIONS HELPER (security definer pour éviter la récursion RLS)
-- ---------------------------------------------------------------------
create or replace function public.is_fimf_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.fimf_admins
    where user_id = auth.uid()
  );
$$;

create or replace function public.owns_club(target_club_id text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.club_users
    where user_id = auth.uid()
      and club_id = target_club_id
      and role in ('dirigeant', 'admin')
  );
$$;

create or replace function public.can_edit_row(club_id_col text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_fimf_admin() or public.owns_club(club_id_col);
$$;

-- ---------------------------------------------------------------------
-- 3. POLITIQUES GRANULAIRES
--    - admin fédéral (fimf_admins) : tout
--    - dirigeant (club_users.role='dirigeant') : uniquement son club et ses dépendances
-- ---------------------------------------------------------------------

-- 3a. CLUBS
drop policy if exists "admin write clubs" on public.clubs;
create policy "admin write clubs" on public.clubs
  for all to authenticated
  using (public.is_fimf_admin() or public.owns_club(id))
  with check (public.is_fimf_admin() or public.owns_club(id));

-- 3b. PLAYERS (dépend du club via club_id)
drop policy if exists "admin write players" on public.players;
create policy "admin write players" on public.players
  for all to authenticated
  using (public.can_edit_row(club_id))
  with check (public.can_edit_row(club_id));

-- 3c. MATCHS : le dirigeant ne peut toucher que les matchs de SON club
--     (domicile OU extérieur), et ne peut pas créer un match entre deux autres clubs
drop policy if exists "admin write matches" on public.matches;
create policy "admin write matches" on public.matches
  for all to authenticated
  using (public.is_fimf_admin() or public.owns_club(home_team_id) or public.owns_club(away_team_id))
  with check (
    public.is_fimf_admin()
    or (public.owns_club(home_team_id) and public.owns_club(away_team_id))  -- faux en pratique
    or (public.owns_club(home_team_id) and not public.owns_club(away_team_id) and true)
    or (public.owns_club(away_team_id) and not public.owns_club(home_team_id) and true)
  );

-- Note : la politique with-check ci-dessus autorise un dirigeant à insérer un
-- match impliquant son club (adversaire quelconque) — la désignation officielle
-- des rencontres reste du ressort fédéral via le dashboard admin.

-- 3d. CONTENU FÉDÉRAL : news, compétitions, galerie, stats, partenaires,
--     officiels, commissions → réservé à l'admin fédéral
do $$
declare t text;
begin
  foreach t in array array['news_articles','competitions','gallery_photos','site_stats','partners','officials','commissions']
  loop
    execute format('drop policy if exists "admin write %1$s" on public.%1$I;', t);
    execute format(
      'create policy "admin write %1$s" on public.%1$I for all to authenticated using (public.is_fimf_admin()) with check (public.is_fimf_admin());',
      t
    );
  end loop;
end $$;

-- Logs d'audit : lecture réservée admin (déjà le cas), insertion OK
-- 3e. Vues realtime inchangées

-- ---------------------------------------------------------------------
-- 4. LIAISONS DES COMPTES DIRIGEANTS
--    Les comptes auth sont créés via l'API admin (voir script node).
--    Les UUID seront insérés par le script après création.
-- ---------------------------------------------------------------------
