-- ============================================================
-- FIMF — Table hero_slides (carrousel de la page d'accueil)
-- Slides administrables depuis le dashboard admin FIMF.
-- Exécution : supabase/run-sql.mjs ou SQL Editor Supabase.
-- ============================================================

-- 1. Création de la table
create table if not exists public.hero_slides (
  id text primary key,
  title text not null,
  highlight text not null default '',
  subtitle text not null default '',
  image text not null default '',
  cta_label text,
  cta_page text,
  cta_secondary_label text,
  cta_secondary_page text,
  sort_order integer not null default 1,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- 2. RLS : lecture publique, écriture réservée aux admins FIMF
alter table public.hero_slides enable row level security;

drop policy if exists "hero_slides_public_read" on public.hero_slides;
create policy "hero_slides_public_read"
  on public.hero_slides for select
  to anon, authenticated
  using (true);

drop policy if exists "hero_slides_admin_write" on public.hero_slides;
create policy "hero_slides_admin_write"
  on public.hero_slides for all
  to authenticated
  using (
    exists (select 1 from public.fimf_admins f where f.user_id = auth.uid())
  )
  with check (
    exists (select 1 from public.fimf_admins f where f.user_id = auth.uid())
  );

-- 3. Seed : slides par défaut (images du dossier src/assets, servies en statique)
insert into public.hero_slides (id, title, highlight, subtitle, image, cta_label, cta_page, cta_secondary_label, cta_secondary_page, sort_order, active)
values
  (
    'hero-1',
    'LE MINI-FOOTBALL',
    'IVOIRIEN',
    'Une fédération engagée pour le développement, la structuration et la promotion du mini-football en Côte d''Ivoire.',
    'hero_ivory_coast_minifootball_1790335944178.jpg',
    'VOIR LE CHAMPIONNAT',
    'championnat',
    'DÉCOUVRIR LA FIMF',
    'la-fimf',
    1,
    true
  ),
  (
    'hero-2',
    'CAN MINI FOOTBALL',
    'GUINÉE 2027',
    'Coup d''envoi le 09 janvier 2027 à Conakry : les Éléphants, champions d''Afrique 2018, visent un second titre continental.',
    'team_huddle_elephants_1790335968616.jpg',
    'LES ÉCHÉANCES',
    'la-fimf',
    'LA SÉLECTION',
    'competitions',
    2,
    true
  ),
  (
    'hero-3',
    'CHAMPIONNAT NATIONAL',
    'ÉDITION 2026',
    '12 équipes, 4 week-ends de compétition et 26 matchs au Temple du Foot de l''Université d''Abidjan. Entrée libre !',
    'championship_trophy_gold_1790335980246.jpg',
    'LE CHAMPIONNAT',
    'championnat',
    'LES CLUBS',
    'equipes',
    3,
    true
  )
on conflict (id) do nothing;

-- Note : les images statiques (noms de fichiers sans http) sont résolues côté
-- client par mediaUrl(), qui ne préfixe que les références bucket. Les valeurs
-- ci-dessus sans http sont des fichiers locaux de src/assets/images — si vous
-- souhaitez les gérer depuis le dashboard, téléversez vos propres images via
-- le champ d'upload (elles seront stockées dans le bucket fimf-media).
