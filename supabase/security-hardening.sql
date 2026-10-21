-- =====================================================================
-- FIMF — Durcissement sécurité (RLS, colonnes sensibles, RPC)
-- À exécuter sur une base DÉJÀ initialisée (setup.sql + migrations) :
--   SBP=<token> node supabase/run-sql.mjs supabase/security-hardening.sql
--
-- Corrige :
--   1. « admin write * » : n'importe quel compte authentifié pouvait
--      modifier/supprimer tout le contenu du site (setup.sql).
--   2. Données personnelles : sponsor_requests et audit_logs lisibles par
--      tous les comptes membres.
--   3. member_requests.password : mot de passe stocké EN CLAIR.
--   4. member_requests : statut auto-attribuable à l'insertion (auto-approbation).
--   5. Bucket de stockage : écriture ouverte à tout compte authentifié.
--   6. RPC admin : EXECUTE révoqué (dashboard cassé) sans garde sur
--      admin_period_leaderboard.
-- Ré-exécutable sans perte de données.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 0. RÔLES (idempotent — cf. club-users-rls.sql)
-- ---------------------------------------------------------------------
create table if not exists public.fimf_admins (
  user_id uuid not null primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.fimf_admins enable row level security;

drop policy if exists "read own admin row" on public.fimf_admins;
create policy "read own admin row" on public.fimf_admins
  for select to authenticated using (user_id = auth.uid());

create table if not exists public.club_users (
  user_id uuid not null references auth.users(id) on delete cascade,
  club_id text not null references public.clubs(id) on delete cascade,
  role text not null default 'dirigeant' check (role in ('dirigeant', 'admin')),
  created_at timestamptz not null default now(),
  primary key (user_id, club_id)
);

alter table public.club_users enable row level security;

drop policy if exists "read own club links" on public.club_users;
create policy "read own club links" on public.club_users
  for select to authenticated using (
    user_id = auth.uid()
    or exists (select 1 from public.fimf_admins fa where fa.user_id = auth.uid())
  );

drop policy if exists "admin manage club links" on public.club_users;
create policy "admin manage club links" on public.club_users
  for all to authenticated
  using (exists (select 1 from public.fimf_admins fa where fa.user_id = auth.uid()))
  with check (exists (select 1 from public.fimf_admins fa where fa.user_id = auth.uid()));

create or replace function public.is_fimf_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.fimf_admins where user_id = auth.uid());
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

grant execute on function public.is_fimf_admin() to anon, authenticated;
grant execute on function public.owns_club(text) to anon, authenticated;
grant execute on function public.can_edit_row(text) to anon, authenticated;

-- ---------------------------------------------------------------------
-- 1. CONTENU FÉDÉRAL : écriture réservée aux admins fédéraux
-- ---------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'news_articles','competitions','gallery_photos','hero_slides',
    'site_stats','partners','officials','commissions'
  ]
  loop
    -- Certaines tables sont optionnelles (hero_slides selon les installations)
    if to_regclass('public.' || t) is null then
      raise notice 'Table % absente : ignorée', t;
      continue;
    end if;
    execute format('alter table public.%I enable row level security;', t);
    execute format('drop policy if exists "admin write %1$s" on public.%1$I;', t);
    execute format(
      'create policy "admin write %1$s" on public.%1$I for all to authenticated
         using (public.is_fimf_admin()) with check (public.is_fimf_admin());',
      t
    );
  end loop;
end $$;

-- Horaires du carrousel : lecture publique, écriture admin (policy déjà
-- admin-only dans hero-slides.sql — on évite juste un doublon de policy)
drop policy if exists "hero_slides_admin_write" on public.hero_slides;
create policy "hero_slides_admin_write" on public.hero_slides
  for all to authenticated
  using (public.is_fimf_admin()) with check (public.is_fimf_admin());

drop policy if exists "hero_slides_public_read" on public.hero_slides;
create policy "hero_slides_public_read" on public.hero_slides
  for select to anon, authenticated using (true);

-- ---------------------------------------------------------------------
-- 2. DONNÉES DE CLUB : admin fédéral, ou dirigeant de SON club
-- ---------------------------------------------------------------------
drop policy if exists "admin write clubs" on public.clubs;
create policy "admin write clubs" on public.clubs
  for all to authenticated
  using (public.is_fimf_admin() or public.owns_club(id))
  with check (public.is_fimf_admin() or public.owns_club(id));

drop policy if exists "admin write players" on public.players;
create policy "admin write players" on public.players
  for all to authenticated
  using (public.can_edit_row(club_id))
  with check (public.can_edit_row(club_id));

drop policy if exists "admin write matches" on public.matches;
create policy "admin write matches" on public.matches
  for all to authenticated
  using (
    public.is_fimf_admin()
    or public.owns_club(home_team_id)
    or public.owns_club(away_team_id)
  )
  with check (
    public.is_fimf_admin()
    or public.owns_club(home_team_id)
    or public.owns_club(away_team_id)
  );

-- ---------------------------------------------------------------------
-- 3. DEMANDES DE SPONSORING : données personnelles → admin uniquement
-- ---------------------------------------------------------------------
alter table public.sponsor_requests enable row level security;

drop policy if exists "anyone can submit sponsor request" on public.sponsor_requests;
create policy "anyone can submit sponsor request" on public.sponsor_requests
  for insert to anon, authenticated
  with check (status = 'nouvelle');   -- le formulaire ne choisit pas le statut

drop policy if exists "admins read sponsor requests" on public.sponsor_requests;
create policy "admins read sponsor requests" on public.sponsor_requests
  for select to authenticated using (public.is_fimf_admin());

drop policy if exists "admins update sponsor requests" on public.sponsor_requests;
create policy "admins update sponsor requests" on public.sponsor_requests
  for update to authenticated
  using (public.is_fimf_admin()) with check (public.is_fimf_admin());

drop policy if exists "admins delete sponsor requests" on public.sponsor_requests;
create policy "admins delete sponsor requests" on public.sponsor_requests
  for delete to authenticated using (public.is_fimf_admin());

-- ---------------------------------------------------------------------
-- 4. DEMANDES D'ADHÉSION
--    4a. Plus aucun mot de passe stocké : le compte est créé à
--        l'approbation et le membre définit son mot de passe via un lien
--        sécurisé (voir supabase/functions/member-activate).
--    4b. Le statut reste imposé par le serveur : le formulaire public ne
--        peut insérer qu'une demande « nouvelle ».
-- ---------------------------------------------------------------------
alter table public.member_requests
  add column if not exists auth_user_id uuid references auth.users(id) on delete set null;
alter table public.member_requests
  add column if not exists activated_at timestamptz;

alter table public.member_requests drop column if exists password;

alter table public.member_requests enable row level security;

drop policy if exists "anyone can submit member request" on public.member_requests;
create policy "anyone can submit member request" on public.member_requests
  for insert to anon, authenticated
  with check (
    status = 'nouvelle'
    and auth_user_id is null
    and activated_at is null
  );

drop policy if exists "admins read member requests" on public.member_requests;
create policy "admins read member requests" on public.member_requests
  for select to authenticated using (public.is_fimf_admin());

drop policy if exists "admins manage member requests" on public.member_requests;
create policy "admins manage member requests" on public.member_requests
  for all to authenticated
  using (public.is_fimf_admin()) with check (public.is_fimf_admin());

-- ---------------------------------------------------------------------
-- 5. JOURNAL D'AUDIT : lecture admin, écriture authentifiée uniquement
-- ---------------------------------------------------------------------
alter table public.audit_logs enable row level security;

drop policy if exists "anyone insert audit logs" on public.audit_logs;
drop policy if exists "authenticated insert audit logs" on public.audit_logs;
create policy "authenticated insert audit logs" on public.audit_logs
  for insert to authenticated with check (true);

drop policy if exists "admins read audit logs" on public.audit_logs;
create policy "admins read audit logs" on public.audit_logs
  for select to authenticated using (public.is_fimf_admin());

-- ---------------------------------------------------------------------
-- 6. STORAGE : écriture réservée aux admins fédéraux
-- ---------------------------------------------------------------------
drop policy if exists "fimf media admin write" on storage.objects;
create policy "fimf media admin write" on storage.objects
  for all to authenticated
  using (bucket_id = 'fimf-media' and public.is_fimf_admin())
  with check (bucket_id = 'fimf-media' and public.is_fimf_admin());

-- ---------------------------------------------------------------------
-- 7. RPC ADMIN : garde en base + droits cohérents
--    (migrate-games.sql révoquait EXECUTE à « authenticated », ce qui
--    cassait l'évaluation des pronostics et les tirages dans le dashboard)
-- ---------------------------------------------------------------------
-- Le module « jeux » (migrate-games.sql) est optionnel : on ne touche à rien
-- s'il n'a pas été exécuté sur cette base.
do $$
begin
  if to_regclass('public.match_predictions') is null then
    raise notice 'Module jeux absent : section RPC ignorée';
    return;
  end if;

  execute $f$
    create or replace function public.admin_period_leaderboard(p_period_id bigint)
    returns table (rank bigint, user_id uuid, total_points bigint, predictions bigint)
    language plpgsql
    stable
    security definer
    set search_path = public
    as $body$
    begin
      if not public.is_fimf_admin() then
        raise exception 'Réservé aux admins FIMF';
      end if;

      return query
        select
          (row_number() over (order by sum(coalesce(mp.points, 0)) desc, count(*) desc))::bigint,
          mp.user_id,
          sum(coalesce(mp.points, 0))::bigint,
          count(*)::bigint
        from public.match_predictions mp
        where mp.period_id = p_period_id
        group by mp.user_id
        order by 1;
    end;
    $body$;
  $f$;

  if to_regprocedure('public.admin_evaluate_period_predictions(bigint)') is not null then
    revoke all on function public.admin_evaluate_period_predictions(bigint) from public;
    grant execute on function public.admin_evaluate_period_predictions(bigint) to authenticated;
  end if;

  revoke all on function public.admin_period_leaderboard(bigint) from public;
  grant execute on function public.admin_period_leaderboard(bigint) to authenticated;

  if to_regprocedure('public.admin_run_period_draw(bigint, text)') is not null then
    revoke all on function public.admin_run_period_draw(bigint, text) from public;
    grant execute on function public.admin_run_period_draw(bigint, text) to authenticated;
  end if;

  if to_regprocedure('public.admin_run_scholarship_draw(bigint, text)') is not null then
    revoke all on function public.admin_run_scholarship_draw(bigint, text) from public;
    grant execute on function public.admin_run_scholarship_draw(bigint, text) to authenticated;
  end if;
end $$;

-- ---------------------------------------------------------------------
-- 8. VÉRIFICATION (lecture seule)
-- ---------------------------------------------------------------------
select schemaname, tablename, policyname, cmd, roles::text, qual, with_check
from pg_policies
where schemaname in ('public', 'storage')
order by tablename, policyname;
