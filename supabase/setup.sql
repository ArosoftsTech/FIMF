-- =====================================================================
-- FIMF — Fédération Ivoirienne de Mini-Football
-- Schéma complet Supabase : tables, RLS, realtime, storage, seed
-- Exécutable plusieurs fois (idempotent)
-- =====================================================================

-- ---------------------------------------------------------------------
-- 0. Nettoyage table de test éventuelle
-- ---------------------------------------------------------------------
drop table if exists public._test_multi;

-- ---------------------------------------------------------------------
-- 1. TABLES
-- ---------------------------------------------------------------------
create table if not exists public.clubs (
  id text primary key,
  name text not null,
  short_name text not null,
  city text not null,
  commune text not null,
  region text not null,
  division text not null,
  founded integer not null,
  president text not null,
  coach text not null,
  stadium text not null,
  primary_color text not null,
  secondary_color text not null,
  badge_bg text not null,
  badge_border text not null,
  badge_icon text not null,
  logo_url text,
  stats jsonb not null default '{}'::jsonb,
  form jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.players (
  id uuid primary key default gen_random_uuid(),
  club_id text not null references public.clubs(id) on delete cascade,
  number integer not null,
  name text not null,
  position text not null,
  age integer not null,
  goals integer not null default 0,
  assists integer,
  clean_sheets integer,
  matches_played integer,
  rating numeric(3,1),
  created_at timestamptz not null default now()
);

create table if not exists public.matches (
  id text primary key,
  journee integer not null,
  date_str text not null,
  time_str text not null,
  home_team_id text not null references public.clubs(id),
  away_team_id text not null references public.clubs(id),
  venue text not null,
  status text not null default 'scheduled',
  competition_id text,
  competition_name text,
  round_name text,
  score_home integer,
  score_away integer,
  referee text,
  scorers jsonb,
  events jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.news_articles (
  id text primary key,
  title text not null,
  category text not null,
  date_str text not null,
  timestamp date not null,
  read_time text,
  image text,
  excerpt text,
  content jsonb not null default '[]'::jsonb,
  tags jsonb not null default '[]'::jsonb,
  author text,
  created_at timestamptz not null default now()
);

create table if not exists public.competitions (
  id text primary key,
  title text not null,
  type text not null,
  category text not null,
  subtitle text,
  description text,
  image text,
  participants_count integer,
  current_holder text,
  period text,
  rules_highlight jsonb not null default '[]'::jsonb,
  is_major boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.gallery_photos (
  id text primary key,
  title text not null,
  category text not null,
  image text,
  caption text,
  date_str text,
  venue text,
  created_at timestamptz not null default now()
);

create table if not exists public.site_stats (
  id integer primary key default 1 check (id = 1),
  clubs_count text, clubs_label text,
  players_count text, players_label text,
  referees_count text, referees_label text,
  pitches_count text, pitches_label text
);

create table if not exists public.partners (
  id text primary key,
  name text not null,
  category text not null
);

create table if not exists public.officials (
  id text primary key,
  name text not null,
  role text not null,
  department text not null,
  email text,
  phone text,
  mandate_start text,
  mandate_end text,
  status text not null default 'Actif',
  bio text,
  photo_url text,
  powers jsonb
);

create table if not exists public.commissions (
  id text primary key,
  name text not null,
  president text not null,
  members_count integer not null default 0,
  description text,
  meeting_frequency text,
  next_meeting text,
  status text not null default 'Active'
);

create table if not exists public.audit_logs (
  id text primary key,
  timestamp timestamptz not null default now(),
  action text not null,
  target text,
  author text
);

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

-- ---------------------------------------------------------------------
-- 2. ROW LEVEL SECURITY
--    Lecture publique, écriture réservée aux administrateurs fédéraux
--    (table public.fimf_admins — voir aussi supabase/club-users-rls.sql)
-- ---------------------------------------------------------------------
create table if not exists public.fimf_admins (
  user_id uuid not null primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.fimf_admins enable row level security;

drop policy if exists "read own admin row" on public.fimf_admins;
create policy "read own admin row" on public.fimf_admins
  for select to authenticated using (user_id = auth.uid());

-- security definer : évite la récursion des policies sur fimf_admins
create or replace function public.is_fimf_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.fimf_admins where user_id = auth.uid());
$$;

alter table public.clubs          enable row level security;
alter table public.players        enable row level security;
alter table public.matches        enable row level security;
alter table public.news_articles  enable row level security;
alter table public.competitions   enable row level security;
alter table public.gallery_photos enable row level security;
alter table public.site_stats     enable row level security;
alter table public.partners       enable row level security;
alter table public.officials      enable row level security;
alter table public.commissions    enable row level security;
alter table public.audit_logs     enable row level security;
alter table public.sponsor_requests enable row level security;

-- Lecture publique
do $$
declare t text;
begin
  foreach t in array array['clubs','players','matches','news_articles','competitions','gallery_photos','site_stats','partners','officials','commissions']
  loop
    execute format('drop policy if exists "public read %1$s" on public.%1$I;', t);
    execute format('create policy "public read %1$s" on public.%1$I for select using (true);', t);
  end loop;
end $$;

-- Écriture réservée aux admins fédéraux (fimf_admins).
-- Les dirigeants de club sont traités par supabase/security-hardening.sql
-- (clubs / players / matches restreints à leur club via public.owns_club).
do $$
declare t text;
begin
  foreach t in array array['clubs','players','matches','news_articles','competitions','gallery_photos','site_stats','partners','officials','commissions']
  loop
    execute format('drop policy if exists "admin write %1$s" on public.%1$I;', t);
    execute format(
      'create policy "admin write %1$s" on public.%1$I for all to authenticated using (public.is_fimf_admin()) with check (public.is_fimf_admin());',
      t
    );
  end loop;
end $$;

-- Logs d'audit : lecture réservée à l'admin, écriture aux comptes authentifiés
drop policy if exists "admins read audit logs" on public.audit_logs;
create policy "admins read audit logs" on public.audit_logs for select to authenticated using (public.is_fimf_admin());

drop policy if exists "anyone insert audit logs" on public.audit_logs;
drop policy if exists "authenticated insert audit logs" on public.audit_logs;
create policy "authenticated insert audit logs" on public.audit_logs for insert to authenticated with check (true);

-- Demandes de sponsoring : insertion publique (formulaire),
-- lecture/édition réservées à l'admin (données personnelles : email, téléphone)
drop policy if exists "anyone can submit sponsor request" on public.sponsor_requests;
create policy "anyone can submit sponsor request" on public.sponsor_requests for insert to anon, authenticated with check (status = 'nouvelle');

drop policy if exists "admins read sponsor requests" on public.sponsor_requests;
create policy "admins read sponsor requests" on public.sponsor_requests for select to authenticated using (public.is_fimf_admin());

drop policy if exists "admins update sponsor requests" on public.sponsor_requests;
create policy "admins update sponsor requests" on public.sponsor_requests for update to authenticated using (public.is_fimf_admin()) with check (public.is_fimf_admin());

drop policy if exists "admins delete sponsor requests" on public.sponsor_requests;
create policy "admins delete sponsor requests" on public.sponsor_requests for delete to authenticated using (public.is_fimf_admin());

-- ---------------------------------------------------------------------
-- 3. REALTIME (scores et classement en direct)
-- ---------------------------------------------------------------------
do $$
begin
  alter publication supabase_realtime add table public.matches;
exception when others then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.clubs;
exception when others then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.news_articles;
exception when others then null;
end $$;

-- ---------------------------------------------------------------------
-- 4. STORAGE — bucket public pour photos/logos
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit)
values ('fimf-media', 'fimf-media', true, 10485760)
on conflict (id) do update set public = true;

drop policy if exists "fimf media public read" on storage.objects;
create policy "fimf media public read" on storage.objects
  for select using (bucket_id = 'fimf-media');

drop policy if exists "fimf media admin write" on storage.objects;
create policy "fimf media admin write" on storage.objects
  for all to authenticated
  using (bucket_id = 'fimf-media' and public.is_fimf_admin())
  with check (bucket_id = 'fimf-media' and public.is_fimf_admin());

-- ---------------------------------------------------------------------
-- 5. SEED — purge puis insertion des données officielles
-- ---------------------------------------------------------------------
delete from public.players;
delete from public.matches;
delete from public.news_articles;
delete from public.gallery_photos;
delete from public.competitions;
delete from public.officials;
delete from public.commissions;
delete from public.partners;
delete from public.clubs;
delete from public.site_stats;

-- Images hébergées sur le bucket public
insert into public.site_stats (id, clubs_count, clubs_label, players_count, players_label, referees_count, referees_label, pitches_count, pitches_label)
values (1, '+ 100', 'CLUBS AFFILIÉS', '+ 2 000', 'JOUEURS LICENCIÉS', '+ 100', 'ARBITRES FORMÉS', '10', 'TERRAINS HOMOLOGUÉS');

insert into public.partners (id, name, category) values
  ('1', 'Ministère des Sports', 'Institutionnel'),
  ('2', 'LONACI', 'Partenaire Officiel'),
  ('3', 'Orange Côte d''Ivoire', 'Télécom'),
  ('4', 'SOTRA', 'Mobilité'),
  ('5', 'CIE & SODECI', 'Énergie & Eau'),
  ('6', 'FIF', 'Fédération Partenaire'),
  ('7', 'WMF World Minifootball', 'International');

insert into public.clubs (id, name, short_name, city, commune, region, division, founded, president, coach, stadium, primary_color, secondary_color, badge_bg, badge_border, badge_icon, stats, form) values
  ('as-plateau','AS PLATEAU','Plateau','Abidjan','Plateau','Abidjan','Division 1',2018,'Kouamé N''Guessan','Jean-Luc Gondo','Complexe Sportif de Bingerville','#006039','#ffffff','bg-emerald-900','border-emerald-600','tower',
   '{"rank":1,"played":3,"won":2,"drawn":1,"lost":0,"goalsFor":8,"goalsAgainst":3,"goalDiff":5,"points":7,"homeRank":1,"awayRank":2}', '["W","D","W"]'),
  ('fc-riviera','FC RIVIERA','Riviera','Abidjan','Cocody Riviera','Abidjan','Division 1',2019,'Patrice Diallo','Mamadou Keïta','Terrain Riviera Golf','#059669','#10b981','bg-teal-900','border-teal-500','shield-green',
   '{"rank":2,"played":3,"won":2,"drawn":0,"lost":1,"goalsFor":6,"goalsAgainst":3,"goalDiff":3,"points":6,"homeRank":2,"awayRank":1}', '["W","W","L"]'),
  ('olympique-yop','OLYMPIQUE YOP','O. Yopougon','Abidjan','Yopougon','Abidjan','Division 1',2020,'Lambert Kouassi','Guy Dembélé','Terrain Complexe Yopougon','#1d4ed8','#f59e0b','bg-blue-900','border-blue-500','flame',
   '{"rank":3,"played":3,"won":1,"drawn":1,"lost":1,"goalsFor":5,"goalsAgainst":4,"goalDiff":1,"points":4,"homeRank":3,"awayRank":4}', '["L","W","D"]'),
  ('sc-marcory','SC MARCORY','Marcory','Abidjan','Marcory','Abidjan','Division 1',2017,'Drissa Ouattara','Hervé Bamba','Terrain Jesse Jackson Marcory','#b91c1c','#111827','bg-red-950','border-red-600','panther',
   '{"rank":4,"played":3,"won":1,"drawn":1,"lost":1,"goalsFor":4,"goalsAgainst":4,"goalDiff":0,"points":4,"homeRank":4,"awayRank":3}', '["W","L","D"]'),
  ('fc-cocody','FC COCODY','Cocody','Abidjan','Cocody','Abidjan','Division 1',2021,'Benoît Doffou','David Adepo','Terrain de l''Université Cocody','#581c87','#fbbf24','bg-purple-950','border-purple-600','crown',
   '{"rank":5,"played":3,"won":1,"drawn":0,"lost":2,"goalsFor":3,"goalsAgainst":5,"goalDiff":-2,"points":3,"homeRank":5,"awayRank":6}', '["L","W","L"]'),
  ('us-abidjan','US ABIDJAN','US Abidjan','Abidjan','Treichville','Abidjan','Division 1',2016,'Salif Sanogo','Charles Kouassi','Terrain Treichville Arras','#0f172a','#e2e8f0','bg-slate-900','border-slate-500','eagle',
   '{"rank":6,"played":3,"won":0,"drawn":2,"lost":1,"goalsFor":2,"goalsAgainst":4,"goalDiff":-2,"points":2,"homeRank":6,"awayRank":5}', '["D","D","L"]'),
  ('afad','AFAD','AFAD Djekanou','Abidjan','Attécoubé','Abidjan','Division 1',2015,'Jacques Anoma Jr.','Maxime Gouaméné','Complexe d''Attécoubé','#047857','#fbbf24','bg-emerald-950','border-amber-500','shield-star',
   '{"rank":7,"played":3,"won":0,"drawn":1,"lost":2,"goalsFor":2,"goalsAgainst":6,"goalDiff":-4,"points":1,"homeRank":7,"awayRank":7}', '["L","D","L"]'),
  ('sol-fc','SOL FC','SOL FC','Abidjan','Abobo','Abidjan','Division 1',2020,'Hamed Bakayoko','Lacina Traoré','Terrain Municipal d''Abobo','#ea580c','#0284c7','bg-orange-950','border-orange-500','sun',
   '{"rank":8,"played":3,"won":0,"drawn":1,"lost":2,"goalsFor":1,"goalsAgainst":6,"goalDiff":-5,"points":1,"homeRank":8,"awayRank":8}', '["L","L","D"]');

insert into public.players (club_id, number, name, position, age, goals, assists, clean_sheets, matches_played, rating) values
  -- AS PLATEAU
  ('as-plateau', 1, 'Sylvain Cissé', 'Gardien', 24, 0, 0, 2, 3, 8.2),
  ('as-plateau', 4, 'Armand Bamba', 'Défenseur', 26, 1, 1, 2, 3, 7.6),
  ('as-plateau', 7, 'Christian Yao', 'Milieu', 23, 3, 2, 0, 3, 8.5),
  ('as-plateau', 9, 'Ibrahim Touré', 'Attaquant', 25, 4, 1, 0, 3, 9.0),
  ('as-plateau', 10, 'Moussa Bakayoko', 'Milieu', 27, 0, 3, 0, 3, 7.9),
  ('as-plateau', 11, 'Serge Diomandé', 'Attaquant', 22, 0, 1, 0, 2, 6.8),
  -- FC RIVIERA
  ('fc-riviera', 16, 'Alain Dago', 'Gardien', 25, 0, 0, 1, 3, 7.8),
  ('fc-riviera', 3, 'Eric Bohui', 'Défenseur', 27, 0, 1, 1, 3, 7.4),
  ('fc-riviera', 8, 'Franck Kassi', 'Milieu', 24, 2, 2, 0, 3, 8.3),
  ('fc-riviera', 10, 'Yannick Gnahoré', 'Attaquant', 26, 3, 1, 0, 3, 8.7),
  ('fc-riviera', 14, 'Didier Koffi', 'Milieu', 21, 1, 1, 0, 3, 7.2),
  -- OLYMPIQUE YOP
  ('olympique-yop', 1, 'Stéphane Badji', 'Gardien', 23, 0, 0, 1, 3, 7.5),
  ('olympique-yop', 5, 'Gérard Zokora', 'Défenseur', 28, 1, 0, 1, 3, 7.3),
  ('olympique-yop', 6, 'Boris Konan', 'Milieu', 25, 1, 2, 0, 3, 7.9),
  ('olympique-yop', 9, 'Arsène Traoré', 'Attaquant', 24, 3, 0, 0, 3, 8.4),
  -- SC MARCORY
  ('sc-marcory', 1, 'Mohamed Sylla', 'Gardien', 26, 0, 0, 1, 3, 7.2),
  ('sc-marcory', 2, 'Kouassi Assalé', 'Défenseur', 23, 0, 1, 1, 3, 7.0),
  ('sc-marcory', 8, 'Abdoulaye Fofana', 'Milieu', 25, 2, 1, 0, 3, 7.8),
  ('sc-marcory', 11, 'Cédric Tano', 'Attaquant', 22, 2, 1, 0, 3, 8.1),
  -- FC COCODY
  ('fc-cocody', 12, 'Junior N''Da', 'Gardien', 22, 0, 0, 0, 3, 6.9),
  ('fc-cocody', 4, 'Marc Boni', 'Défenseur', 24, 0, 0, 0, 3, 6.7),
  ('fc-cocody', 10, 'Arthur Seri', 'Attaquant', 25, 3, 0, 0, 3, 8.2),
  -- US ABIDJAN
  ('us-abidjan', 1, 'Fabrice Gouaméné', 'Gardien', 27, 0, 0, 1, 3, 7.3),
  ('us-abidjan', 6, 'Landry Djiré', 'Milieu', 24, 1, 1, 0, 3, 7.1),
  ('us-abidjan', 9, 'Gervais Doumbia', 'Attaquant', 23, 1, 0, 0, 3, 7.0),
  -- AFAD
  ('afad', 1, 'Arnaud Coulibaly', 'Gardien', 23, 0, 0, 0, 3, 6.8),
  ('afad', 7, 'Yaya Sanogo', 'Milieu', 21, 1, 1, 0, 3, 7.2),
  ('afad', 11, 'Roméo Kouadio', 'Attaquant', 24, 1, 0, 0, 3, 6.9),
  -- SOL FC
  ('sol-fc', 16, 'Ibrahim Koné', 'Gardien', 22, 0, 0, 0, 3, 6.6),
  ('sol-fc', 5, 'Ousmane Touré', 'Défenseur', 25, 0, 0, 0, 3, 6.7),
  ('sol-fc', 10, 'Bakary Soro', 'Attaquant', 23, 1, 0, 0, 3, 7.1);

insert into public.matches (id, journee, date_str, time_str, home_team_id, away_team_id, venue, status, competition_id, competition_name, round_name, score_home, score_away, referee, scorers, events) values
  -- Journée 3 (à venir)
  ('m-j3-1', 3, 'Sam. 28 Sept. 2025', '16h00', 'as-plateau', 'fc-riviera', 'Complexe Sportif de Bingerville', 'scheduled', 'champ-national', 'Championnat National', '3ème Journée', null, null, 'Kouassi Kouamé (Arbitre National FIMF)', null, '[]'),
  ('m-j3-2', 3, 'Sam. 28 Sept. 2025', '18h00', 'sc-marcory', 'olympique-yop', 'Terrain Yopougon', 'scheduled', 'champ-national', 'Championnat National', '3ème Journée', null, null, 'Mamadou Diabaté (Arbitre Régional)', null, '[]'),
  ('m-j3-3', 3, 'Dim. 29 Sept. 2025', '16h00', 'fc-cocody', 'us-abidjan', 'Terrain Cocody', 'scheduled', 'champ-national', 'Championnat National', '3ème Journée', null, null, 'Bertin Gnagne (Arbitre FIMF)', null, '[]'),
  ('m-j3-4', 3, 'Dim. 29 Sept. 2025', '18h00', 'afad', 'sol-fc', 'Terrain Attécoubé', 'scheduled', 'champ-national', 'Championnat National', '3ème Journée', null, null, 'Adama Fofana', null, '[]'),
  -- Journée 4
  ('m-j4-1', 4, 'Sam. 05 Oct. 2025', '16h00', 'fc-riviera', 'sc-marcory', 'Terrain Riviera', 'scheduled', 'champ-national', 'Championnat National', '4ème Journée', null, null, 'Armel Kra', null, '[]'),
  ('m-j4-2', 4, 'Sam. 05 Oct. 2025', '18h00', 'olympique-yop', 'as-plateau', 'Terrain Yopougon', 'scheduled', 'champ-national', 'Championnat National', '4ème Journée', null, null, 'Séraphin Koffi', null, '[]'),
  ('m-j4-3', 4, 'Dim. 06 Oct. 2025', '16h00', 'us-abidjan', 'fc-cocody', 'Terrain Abidjan', 'scheduled', 'champ-national', 'Championnat National', '4ème Journée', null, null, 'Jean-Marc Dago', null, '[]'),
  ('m-j4-4', 4, 'Dim. 06 Oct. 2025', '18h00', 'sol-fc', 'afad', 'Terrain Municipal Abobo', 'scheduled', 'champ-national', 'Championnat National', '4ème Journée', null, null, 'Yves Aka', null, '[]'),
  -- Coupe Nationale
  ('m-cup-1', 1, 'Mer. 09 Oct. 2025', '17h00', 'as-plateau', 'us-abidjan', 'Complexe Bingerville', 'scheduled', 'coupe-nationale', 'Coupe Nationale', '16èmes de Finale', null, null, 'Kouassi Kouamé', null, '[]'),
  ('m-cup-2', 1, 'Jeu. 10 Oct. 2025', '19h00', 'fc-riviera', 'olympique-yop', 'Terrain Riviera Golf', 'scheduled', 'coupe-nationale', 'Coupe Nationale', '16èmes de Finale', null, null, 'Adama Fofana', null, '[]'),
  ('m-cup-3', 1, 'Ven. 11 Oct. 2025', '18h00', 'sc-marcory', 'sol-fc', 'Terrain Jesse Jackson', 'scheduled', 'coupe-nationale', 'Coupe Nationale', '16èmes de Finale', null, null, 'Mamadou Diabaté', null, '[]'),
  -- U20
  ('m-u20-1', 1, 'Sam. 12 Oct. 2025', '10h00', 'sol-fc', 'afad', 'Terrain Municipal Abobo', 'scheduled', 'champ-u20', 'Championnat U20', 'Phase de Groupes', null, null, 'Armel Kra', null, '[]'),
  ('m-u20-2', 1, 'Sam. 12 Oct. 2025', '11h30', 'fc-cocody', 'as-plateau', 'Terrain Cocody', 'scheduled', 'champ-u20', 'Championnat U20', 'Phase de Groupes', null, null, 'Bertin Gnagne', null, '[]'),
  -- Sélection
  ('m-sel-1', 1, 'Mer. 15 Oct. 2025', '19h30', 'as-plateau', 'fc-riviera', 'Palais des Sports de Treichville (Annexe)', 'scheduled', 'selections-nationales', 'Sélections Nationales', 'Match International Amical', null, null, 'Kouassi Kouamé (Arbitre International WMF)', null, '[]'),
  -- Journée 2 (terminée)
  ('m-j2-1', 2, 'Sam. 21 Sept. 2025', '16h00', 'as-plateau', 'fc-cocody', 'Complexe Bingerville', 'finished', 'champ-national', 'Championnat National', '2ème Journée', 3, 1, 'Mamadou Diabaté',
   '[{"player":"Ibrahim Touré","team":"AS PLATEAU","min":14},{"player":"Christian Yao","team":"AS PLATEAU","min":28},{"player":"Arthur Seri","team":"FC COCODY","min":39},{"player":"Ibrahim Touré","team":"AS PLATEAU","min":46}]', null),
  ('m-j2-2', 2, 'Sam. 21 Sept. 2025', '18h00', 'fc-riviera', 'sol-fc', 'Terrain Riviera Golf', 'finished', 'champ-national', 'Championnat National', '2ème Journée', 2, 0, 'Kouassi Kouamé',
   '[{"player":"Yannick Gnahoré","team":"FC RIVIERA","min":22},{"player":"Franck Kassi","team":"FC RIVIERA","min":41}]', null),
  ('m-j2-3', 2, 'Dim. 22 Sept. 2025', '16h00', 'sc-marcory', 'us-abidjan', 'Terrain Jesse Jackson', 'finished', 'champ-national', 'Championnat National', '2ème Journée', 1, 1, 'Bertin Gnagne',
   '[{"player":"Abdoulaye Fofana","team":"SC MARCORY","min":18},{"player":"Gervais Doumbia","team":"US ABIDJAN","min":44}]', null),
  ('m-j2-4', 2, 'Dim. 22 Sept. 2025', '18h00', 'olympique-yop', 'afad', 'Terrain Yopougon', 'finished', 'champ-national', 'Championnat National', '2ème Journée', 3, 1, 'Adama Fofana',
   '[{"player":"Arsène Traoré","team":"OLYMPIQUE YOP","min":8},{"player":"Boris Konan","team":"OLYMPIQUE YOP","min":25},{"player":"Yaya Sanogo","team":"AFAD","min":32},{"player":"Arsène Traoré","team":"OLYMPIQUE YOP","min":48}]', null);

insert into public.competitions (id, title, type, category, subtitle, description, image, participants_count, current_holder, period, rules_highlight, is_major) values
  ('champ-national','CHAMPIONNAT NATIONAL','national','Championnat national','La compétition officielle des clubs ivoiriens.',
   'Le sommet du mini-football de club en Côte d''Ivoire. Les meilleures équipes du pays s''affrontent sur 14 journées régulières suivies d''un Final Four palpitant pour sacrer le champion national qualifié pour la Ligue des Champions Africaine WMF.',
   'championship_trophy_gold_1790335980246.jpg', 8, 'AS PLATEAU', 'Septembre - Décembre 2025',
   '["Format 6 contre 6 (5 joueurs de champ + 1 gardien)","2 mi-temps de 25 minutes avec chrono arrêté lors des arrêts de jeu majeurs","Changements illimités en zone technique dédiée","Terrains synthétiques homologués par la FIMF"]', true),
  ('coupe-nationale','COUPE NATIONALE','cup','Coupe nationale','La compétition nationale à élimination directe.',
   'Le tournoi de tous les défis ! Ouverte à l''ensemble des clubs affiliés de Division 1, Division 2 et clubs régionaux. Chaque match est décisif : en cas d''égalité à la fin du temps réglementaire, place à la séance de tirs au but sous haute tension.',
   'championship_trophy_gold_1790335980246.jpg', 32, 'FC RIVIERA', 'Octobre - Novembre 2025',
   '["Matchs à élimination directe","Tirage au sort intégral dès les 16èmes de finale","Séance de 3 tirs au but en cas d''égalité","Trophée prestigieux remis par les autorités sportives ivoiriennes"]', true),
  ('selections-nationales','SÉLECTIONS NATIONALES','selection','Sélections nationales','Les équipes nationales représentant la Côte d''Ivoire.',
   'Les Éléphants du mini-football portent fièrement les couleurs ivoiriennes sur la scène continentale et mondiale. La FIMF encadre la sélection seniors hommes, la sélection féminine et les espoirs U20.',
   'team_huddle_elephants_1790335968616.jpg', 1, 'Côte d''Ivoire (Vice-championne de la zone Ouest)', 'Toute l''année selon calendrier WMF',
   '["Regroupements réguliers et stages à Abidjan","Participation aux tournois de la Coupe d''Afrique WMF","Encadrement médical et diététique de haut niveau","Vivier issu des clubs du Championnat National FIMF"]', true),
  ('champ-u20','CHAMPIONNAT U20','youth','Championnat national','Développement des jeunes talents.',
   'La pépinière du mini-football ivoirien. Ce championnat réservé aux moins de 20 ans favorise l''éclosion des futurs grands espoirs nationaux et encourage les clubs à structurer leurs centres de formation.',
   'hero_ivory_coast_minifootball_1790335944178.jpg', 16, 'Académie Sol FC Abobo', 'Octobre - Janvier',
   '["Licences jeunes certifiées avec contrôle d''identité strict","Sensibilisation au fair-play et à l''esprit sportif","Détection pour l''équipe nationale espoir"]', false),
  ('champ-feminin','CHAMPIONNAT FÉMININ','women','Championnat national','Le mini-football au féminin.',
   'La vitrine de l''excellence féminine dans le sport ivoirien. Une compétition dynamique et engagée qui rassemble les meilleurs talents féminins de toutes les communes d''Abidjan et de l''intérieur.',
   'hero_ivory_coast_minifootball_1790335944178.jpg', 10, 'Cocody Stars Féminines', 'Novembre - Février',
   '["Promotion de l''inclusion et de la pratique féminine","Accompagnement matériel et bourses d''équipement aux clubs","Couverture médiatique dédiée"]', false),
  ('tournois-regionaux','TOURNOIS RÉGIONAUX','regional','Compétitions internationales','Compétitions inter-régionales.',
   'Des tournois disputés à Bouaké, San Pedro, Korhogo, Daloa et Yamoussoukro pour faire rayonner la discipline au-delà de la capitale économique et dénicher les pépites de tout le territoire ivoirien.',
   'fimf_headquarters_building_1790335956733.jpg', 24, 'Éléphants de Yamoussoukro', 'Saison régulière',
   '["Circuits qualificatifs régionaux pour les play-offs d''accession","Valorisation des terrains locaux homologués"]', false);

insert into public.news_articles (id, title, category, date_str, timestamp, read_time, image, excerpt, content, tags, author) values
  ('news-1','Lancement officiel du Championnat National de Mini-Football','Championnat','20 Sept. 2025','2025-09-20','3 min','hero_ivory_coast_minifootball_1790335944178.jpg',
   'La première journée du Championnat National a tenu toutes ses promesses avec des rencontres intenses et un engouement populaire remarquable à Bingerville et Abidjan.',
   '["Le coup d''envoi officiel de l''édition 2025 du Championnat National de Mini-Football de Côte d''Ivoire a été donné ce week-end dans une ferveur exceptionnelle.","Devant un public nombreux et enthousiaste au Complexe Sportif de Bingerville, les meilleurs clubs de la capitale et des régions ont offert des duels de haute intensité technique.","Le Président de la FIMF a salué l''engagement exemplaire des dirigeants de clubs, des arbitres formés selon les normes internationales et le comportement exemplaire des supporters.","Cette saison marque une étape décisive dans la structuration des compétitions nationales, avec des diffusions en direct et un suivi statistique rigoureux de toutes les rencontres."]',
   '["Championnat","Saison 2025","Bingerville","FIMF"]','Direction de la Communication FIMF'),
  ('news-2','La FIMF renforce la formation des arbitres','Formation','15 Sept. 2025','2025-09-15','4 min','referee_training_session_1790335992555.jpg',
   'Un stage de perfectionnement intensif a réuni plus de 100 arbitres et officiels techniques à Abidjan sous l''égide des instructeurs certifiés WMF.',
   '["Dans le cadre de son plan de développement technique, la Fédération Ivoirienne de Mini-Football a clôturé ce dimanche une session nationale de formation et d''homologation des arbitres.","Pendant cinq jours, les participants ont alterné ateliers théoriques sur les lois du jeu spécifiques au mini-football (dimensions réduites, gestion du temps, règles de relance) et mises en situation pratique sur le terrain.","À l''issue des évaluations physiques et écrites, les lauréats ont reçu leurs écussons officiels FIMF pour la saison 2024-2025.","« L''arbitrage est le garant de la justice sportive et du spectacle sur nos terrains », a rappelé le président de la Commission Centrale des Arbitres."]',
   '["Arbitrage","Formation","Règlement","Technique"]','Commission Centrale des Arbitres'),
  ('news-3','Sélection nationale : début du stage de préparation','Sélections','10 Sept. 2025','2025-09-10','3 min','team_huddle_elephants_1790335968616.jpg',
   'Les Éléphants du mini-football ont entamé leur premier regroupement en vue des prochaines échéances continentales et du Championnat d''Afrique.',
   '["Le sélectionneur national a convoqué un groupe de 18 joueurs d''élite pour une semaine d''entraînement intensif à Abidjan.","L''accent est mis sur la condition physique, la rapidité des transitions et la cohésion tactique spécifique au format 6 contre 6.","L''objectif affiché est clair : hisser la Côte d''Ivoire sur le podium africain et décrocher une qualification historique pour la prochaine Coupe du Monde de Mini-Football.","Deux matchs amicaux d''application contre une sélection régionale sont programmés à huis clos."]',
   '["Éléphants","Sélection Nationale","Stage","Afrique"]','Cellule Média Éléphants'),
  ('news-4','Signature d''un partenariat pour le développement du mini-football','Institutionnel','05 Sept. 2025','2025-09-05','2 min','fimf_headquarters_building_1790335956733.jpg',
   'La FIMF a paraphé un accord stratégique tripartite avec les collectivités locales et les partenaires économiques pour financer de nouveaux terrains.',
   '["La Fédération Ivoirienne de Mini-Football franchit un nouveau palier dans sa politique d''infrastructures de proximité.","Ce partenariat permettra la réhabilitation et l''homologation de 10 nouveaux complexes synthétiques dans les communes de Yopougon, Abobo, Koumassi et dans l''intérieur du pays.","Ce programme vise à offrir aux jeunes et aux clubs des conditions de pratique sécurisées et modernes, accessibles à tous les licenciés."]',
   '["Partenariat","Infrastructures","Terrains","Développement"]','Secrétariat Général FIMF'),
  ('news-5','Calendrier officiel de la saison 2024-2025 dévoilé','Championnat','28 Août 2025','2025-08-28','3 min','championship_trophy_gold_1790335980246.jpg',
   'Retrouvez le programme complet des 14 journées de la phase régulière ainsi que les dates de la phase finale des play-offs.',
   '["La commission des compétitions a validé le calendrier de la nouvelle saison sportive.","Avec 8 clubs engagés en Division 1 et des compétitions régionales en forte expansion, le rythme des rencontres sera soutenu chaque week-end.","La finale du championnat est programmée pour le mois de décembre au Complexe Sportif de Bingerville."]',
   '["Calendrier","Play-offs","Division 1"]','Commission des Compétitions'),
  ('news-6','Homologation de 10 nouveaux terrains de mini-football','Compétitions','14 Août 2025','2025-08-14','3 min','fimf_headquarters_building_1790335956733.jpg',
   'La commission technique de la FIMF a certifié les normes de sécurité et de traçage de 10 aires de jeux synthétiques à travers le pays.',
   '["Après une série d''inspections minutieuses, 10 complexes ont reçu le label fédéral de conformité.","Ces terrains garantissent des dimensions officielles (40m x 20m), un éclairage nocturne aux normes et des vestiaires équipés pour accueillir les rencontres officielles du championnat national.","Les clubs affiliés peuvent désormais programmer leurs matchs officiels sur ces installations homologuées."]',
   '["Homologation","Terrains","Normes"]','Direction Technique Nationale');

insert into public.gallery_photos (id, title, category, image, caption, date_str, venue) values
  ('g-1','Action offensive en plein soleil','Compétitions','hero_ivory_coast_minifootball_1790335944178.jpg','Attaque tranchante lors de la 1ère journée du Championnat National à Bingerville.','20 Sept. 2025','Complexe Sportif de Bingerville'),
  ('g-2','Solidarité et esprit d''équipe','Sélections','team_huddle_elephants_1790335968616.jpg','Les Éléphants numéro 8, 10 et 18 soudés avant l''entrée en jeu.','10 Sept. 2025','Stade Robert Champroux'),
  ('g-3','Le siège moderne de la FIMF','Événements','fimf_headquarters_building_1790335956733.jpg','Vue extérieure de la Maison du Mini-Football Ivoirien à Abidjan.','05 Sept. 2025','Cocody Riviera, Abidjan'),
  ('g-4','La formation des officiels de match','Événements','referee_training_session_1790335992555.jpg','Promotion 2025 des arbitres homologués FIMF après le stage pratique.','15 Sept. 2025','Centre Technique National'),
  ('g-5','Le trophée officiel du Championnat','Compétitions','championship_trophy_gold_1790335980246.jpg','La coupe dorée tant convoitée par les 8 formations de l''élite ivoirienne.','01 Sept. 2025','Salon d''honneur FIMF'),
  ('g-6','Duel acharné au milieu de terrain','Équipes','hero_ivory_coast_minifootball_1790335944178.jpg','Pression constante et intensité maximale entre AS Plateau et FC Riviera.','20 Sept. 2025','Terrain Riviera Golf'),
  ('g-7','Cérémonie de remise des diplômes d''arbitrage','Événements','referee_training_session_1790335992555.jpg','Moment solennel de remise des écussons officiels FIMF.','15 Sept. 2025','Auditorium FIMF'),
  ('g-8','Concentration maximale avant le coup d''envoi','Sélections','team_huddle_elephants_1790335968616.jpg','Consignes tactiques du staff technique avant le match de préparation.','12 Sept. 2025','Complexe Sportif de Bingerville');

insert into public.officials (id, name, role, department, email, phone, mandate_start, mandate_end, status, bio, photo_url, powers) values
  ('off-1','Alain Kouassi','Président de la FIMF','Comité Exécutif','president@fimf.ci','+225 07 07 12 34 56','2023','2027','Actif',
   'Fondateur & Membre du Comité Exécutif WMF Afrique. Supervise la stratégie nationale.', null,
   '["Signature des conventions","Représentation WMF/AMF","Agrément fédéral"]'),
  ('off-2','Dr. Éric Bamba','1er Vice-Président','Comité Exécutif','eric.bamba@fimf.ci','+225 05 05 23 45 67','2023','2027','Actif',
   'Chargé des Compétitions, de l''Arbitrage et des relations avec les ligues régionales.', null,
   '["Homologation des calendriers","Coordination arbitrage"]'),
  ('off-3','Martial N''Dri','Secrétaire Général','Secrétariat Général','secretariat@fimf.ci','+225 01 02 34 56 78','2022','2026','Actif',
   'Gestion de l''administration générale, délivrance des affiliations et correspondances ministérielles.', null,
   '["Délivrance licences","Comptes-rendus AG","Correspondance ministérielle"]'),
  ('off-4','Mamadou Diop','Directeur Technique National (DTN)','Direction Technique','dtn@fimf.ci','+225 07 48 99 11 22','2022','2026','Actif',
   'Pilote le développement sportif, les sélections nationales Éléphants Mini-Foot et la formation des entraîneurs.', null,
   '["Sélections nationales","Homologation entraîneurs","Stages techniques"]'),
  ('off-5','Dr. Sylvie Konan','Présidente Commission Médicale','Commission Médicale','medical@fimf.ci','+225 07 11 22 33 44','2023','2027','Actif',
   'Suivi sanitaire des athlètes, protocole d''urgence sur les terrains et lutte anti-dopage.', null,
   '["Validation certificats médicaux","Protocole secours terrain"]'),
  ('off-6','Patrick Anoma','Trésorier Général','Comité Exécutif','tresorerie@fimf.ci','+225 05 99 88 77 66','2023','2027','Actif',
   'Gestion financière, budget fédéral et conformité des subventions et partenariats.', null,
   '["Comptabilité générale","Gestion des primes fédérales"]'),
  ('off-7','Bertin Gnagne','Responsable Commission Centrale des Arbitres (CCA)','Arbitrage','arbitrage@fimf.ci','+225 01 44 55 66 77','2023','2027','Actif',
   'Désignation hebdomadaire du corps arbitral pour les championnats et coupes nationales.', null,
   '["Désignation arbitres","Sanctions disciplinaires terrain","Examens d''arbitrage"]');

insert into public.commissions (id, name, president, members_count, description, meeting_frequency, next_meeting, status) values
  ('com-1','Commission d''Organisation des Compétitions (COC)','Dr. Éric Bamba',6,'Organisation matérielle, homologation des résultats et gestion des recours sportifs.','Hebdomadaire (Chaque Mardi)','30 Septembre 2025','Active'),
  ('com-2','Commission Centrale des Arbitres (CCA)','Bertin Gnagne',8,'Formation, notation, tests physiques et affectations des arbitres officiels.','Bimensuelle','02 Octobre 2025','Active'),
  ('com-3','Commission Juridique et de Discipline','Me Kouadio Koffi',5,'Traitement des réclamations, litiges inter-clubs et sanctions disciplinaires.','Sur saisine','08 Octobre 2025','En session'),
  ('com-4','Commission Médicale et Anti-Dopage','Dr. Sylvie Konan',4,'Protocoles de réanimation, visites médicales préalables aux licences et contrôle anti-dopage.','Mensuelle','15 Octobre 2025','Active');

-- ---------------------------------------------------------------------
-- 6. VÉRIFICATION
-- ---------------------------------------------------------------------
select 'clubs' as table, count(*) from public.clubs
union all select 'players', count(*) from public.players
union all select 'matches', count(*) from public.matches
union all select 'news_articles', count(*) from public.news_articles
union all select 'competitions', count(*) from public.competitions
union all select 'gallery_photos', count(*) from public.gallery_photos
union all select 'partners', count(*) from public.partners
union all select 'officials', count(*) from public.officials
union all select 'commissions', count(*) from public.commissions
union all select 'site_stats', count(*) from public.site_stats;
