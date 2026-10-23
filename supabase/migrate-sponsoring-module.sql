-- ═══════════════════════════════════════════════════════════════════════
-- MODULE SPONSORING FIMF — Migration complète
-- Exécution : Supabase Dashboard → SQL Editor (cf. migrate-sponsor-requests.sql)
-- Idempotente : ré-exécutable sans risque (create if not exists / do nothing).
--
-- Crée :
--   · sponsor_packages           : packages affichés sur la page publique
--   · sponsor_partners           : logos « Ils nous font confiance »
--   · ALTER sponsor_requests     : suivi complet (statuts, assignation, activité)
--   · sponsor_request_events     : historique (notes, changements de statut…)
--   · sponsor_clients            : sponsors contractés (contrats, paiements)
--   · sponsor_client_documents   : contrats / factures / reçus
--   · sponsor_settings           : textes, contacts, e-mail de notification,
--                                  activation de la page / du formulaire
--
-- RLS : lecture publique des éléments actifs, écriture réservée aux
-- administrateurs fédéraux (fonction is_fimf_admin(), cf. supabase/setup.sql).
-- ═══════════════════════════════════════════════════════════════════════

-- ── Helper : maintained updated_at ─────────────────────────────────────
create or replace function public.fimf_set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ── 1. PACKAGES ────────────────────────────────────────────────────────
create table if not exists public.sponsor_packages (
  id                uuid primary key default gen_random_uuid(),
  slug              text not null unique,
  name              text not null,
  -- Trophée affiché : identique aux illustrations du site ou image sur-mesure
  trophy_kind       text not null default 'or'
                    check (trophy_kind in ('bronze','argent','or','diamant','custom')),
  custom_image_url  text,
  tagline           text not null default '',
  price_amount      numeric(12,0),
  currency          text not null default 'FCFA',
  is_on_demand      boolean not null default false,
  duration          text not null default '',
  perks             jsonb not null default '[]'::jsonb,
  badge             text,
  is_popular        boolean not null default false,
  max_sponsors      integer,
  active            boolean not null default true,
  sort_order        integer not null default 0,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  constraint price_or_on_demand check (is_on_demand or price_amount is not null)
);

create trigger trg_sponsor_packages_updated
  before update on public.sponsor_packages
  for each row execute function public.fimf_set_updated_at();

-- Seed par défaut (ne réécrase jamais les éditions admin : ON CONFLICT DO NOTHING)
insert into public.sponsor_packages
  (slug, name, trophy_kind, tagline, price_amount, is_on_demand, duration, perks, badge, is_popular, sort_order)
values
  ('bronze', 'Bronze', 'bronze',
   'Premier pas de votre marque sur le mini football ivoirien',
   500000, false, 'Une saison (12 mois)',
   '["Logo dans l''annuaire des partenaires du site officiel",
     "Mentions de votre marque sur les réseaux sociaux de la FIMF",
     "Badge « Partenaire officiel FIMF » pour vos supports",
     "2 invitations VIP par journée de championnat"]'::jsonb,
   null, false, 1),
  ('argent', 'Argent', 'argent',
   'Une visibilité constante sur tous les supports officiels',
   1500000, false, 'Une saison (12 mois)',
   '["Tous les avantages du pack Bronze",
     "Logo sur les communiqués et affiches officiels",
     "Panneaux publicitaires au bord des terrains (D1)",
     "4 invitations VIP par journée de championnat",
     "Logo intégré aux visuels des photos officielles"]'::jsonb,
   null, false, 2),
  ('or', 'Or', 'or',
   'Le partenariat complet : maillots, digital et cérémonies',
   4500000, false, 'Une saison (12 mois)',
   '["Tous les avantages du pack Argent",
     "Logo sur les maillots des rencontres officielles",
     "Publications dédiées chaque mois sur les réseaux FIMF",
     "Logo premium en tête du site officiel",
     "Espace de marque lors des remises de trophées",
     "8 invitations VIP par journée de championnat"]'::jsonb,
   'LE PLUS POPULAIRE', true, 3),
  ('diamant', 'Diamant', 'diamant',
   'Le partenariat exclusif — votre marque au cœur de la FIMF',
   null, true, 'Sur mesure (12 à 36 mois)',
   '["Tous les avantages du pack Or",
     "Votre nom associé au championnat (« présenté par … »)",
     "Stand partenaire sur tous les sites d''événements",
     "Trophée personnalisé et gravé à votre marque",
     "Contenus vidéo dédiés avec l''équipe média FIMF",
     "Rencontre annuelle avec les dirigeants de la Fédération"]'::jsonb,
   'PRESTIGE MAXIMAL', false, 4)
on conflict (slug) do nothing;

-- ── 2. PARTENAIRES (section publique « Ils nous font confiance ») ─────
create table if not exists public.sponsor_partners (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  logo_url      text,
  category      text not null default '',
  display_order integer not null default 0,
  visible       boolean not null default true,
  created_at    timestamptz not null default now()
);

-- Seed initial (badges placeholder tant qu'aucun logo n'est téléversé)
insert into public.sponsor_partners (name, category, display_order, visible)
values
  ('Ministère des Sports', 'Institutionnel', 1, true),
  ('LONACI', 'Partenaire Officiel', 2, true),
  ('Orange Côte d''Ivoire', 'Télécom', 3, true),
  ('SOTRA', 'Mobilité', 4, true),
  ('CIE & SODECI', 'Énergie & Eau', 5, true),
  ('FIF', 'Fédération Partenaire', 6, true),
  ('WMF World Minifootball', 'International', 7, true)
on conflict do nothing;

-- ── 3. DEMANDES : extension du suivi ──────────────────────────────────
alter table public.sponsor_requests
  add column if not exists assigned_to uuid;
alter table public.sponsor_requests
  add column if not exists last_activity_at timestamptz not null default now();

-- Statuts élargis (les anciennes valeurs 'en cours' / 'signée' restent lisibles)
alter table public.sponsor_requests
  drop constraint if exists chk_sponsor_requests_status;
alter table public.sponsor_requests
  add constraint chk_sponsor_requests_status
  check (status in ('nouvelle','en cours','contactée','en négociation',
                    'acceptée','signée','refusée','archivée'));

create index if not exists idx_sponsor_requests_created
  on public.sponsor_requests (created_at desc);
create index if not exists idx_sponsor_requests_status
  on public.sponsor_requests (status);

-- Historique (notes internes, changements de statut, assignations…)
create table if not exists public.sponsor_request_events (
  id           bigint generated always as identity primary key,
  request_id   bigint not null references public.sponsor_requests(id) on delete cascade,
  kind         text not null default 'note'
               check (kind in ('creation','statut','assignation','note','conversion')),
  payload      jsonb not null default '{}'::jsonb,
  author_email text not null default '',
  created_at   timestamptz not null default now()
);
create index if not exists idx_sponsor_events_request
  on public.sponsor_request_events (request_id, created_at);

-- ── 4. SPONSORS CONTRACTÉS ────────────────────────────────────────────
create table if not exists public.sponsor_clients (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  contact_name   text not null default '',
  contact_email  text not null default '',
  contact_phone  text not null default '',
  package_id     uuid references public.sponsor_packages(id) on delete set null,
  logo_url       text,
  start_date     date,
  end_date       date,
  amount         numeric(12,0) not null default 0,
  currency       text not null default 'FCFA',
  amount_paid    numeric(12,0) not null default 0,
  payment_status text not null default 'attente'
                 check (payment_status in ('attente','partiel','paye')),
  public_visible boolean not null default false,
  display_order  integer not null default 0,
  notes          text not null default '',
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create trigger trg_sponsor_clients_updated
  before update on public.sponsor_clients
  for each row execute function public.fimf_set_updated_at();

create table if not exists public.sponsor_client_documents (
  id          uuid primary key default gen_random_uuid(),
  client_id   uuid not null references public.sponsor_clients(id) on delete cascade,
  kind        text not null default 'autre'
              check (kind in ('contrat','facture','recu','autre')),
  name        text not null,
  url         text not null,
  uploaded_at timestamptz not null default now()
);
create index if not exists idx_sponsor_docs_client
  on public.sponsor_client_documents (client_id);

-- ── 5. PARAMÈTRES DU MODULE (ligne unique id = 1) ─────────────────────
create table if not exists public.sponsor_settings (
  id               integer primary key default 1 check (id = 1),
  hero_badge       text not null default 'Partenariats & Sponsoring — Saison 2026',
  hero_title       text not null default 'Devenez partenaire de la FIMF',
  hero_subtitle    text not null default
    'Offrez à votre marque une visibilité nationale sur les terrains, les écrans et les réseaux sociaux — au cœur d''une discipline qui fait vibrer la jeunesse ivoirienne chaque week-end.',
  arguments        jsonb not null default
    '[{"icon":"eye","title":"Une visibilité nationale","text":"Logo présent sur le site officiel, les supports, les terrains et les réseaux sociaux auprès de milliers de supporters dans tout le pays."},
      {"icon":"trending","title":"Une image jeune et gagnante","text":"Associez votre marque à une discipline en pleine croissance et une fédération championne d''Afrique 2018."},
      {"icon":"heart","title":"Un impact sur la jeunesse","text":"Votre soutien finance la formation des jeunes talents, l''arbitrage et la construction de terrains homologués."},
      {"icon":"users","title":"Une communauté engagée","text":"Plus de 100 clubs, 2 000 joueurs licenciés et des familles mobilisées chaque week-end sur nos compétitions."}]'::jsonb,
  faq              jsonb not null default
    '[{"q":"Comment se lance un partenariat avec la FIMF ?","a":"Remplissez le formulaire de la page (2 minutes) en choisissant un package. La commission partenariats vous recontacte sous 72 heures ouvrées avec la proposition contractuelle. La visibilité digitale est activée dès la signature."},
      {"q":"Peut-on personnaliser un package ?","a":"Oui. Les avantages des packages Or et Diamant peuvent être ajustés à vos objectifs (territoire, durée, activations spécifiques). Choisissez « Sur devis » dans le formulaire et décrivez votre projet."},
      {"q":"Quels sont les délais de visibilité ?","a":"Canal et site : actifs sous 72 h après signature. Supports imprimés et panneaux : activation sous 15 jours. Équipements de match : à partir de la journée suivante du championnat."},
      {"q":"Le partenariat couvre-t-il tout le territoire ?","a":"Oui. La FIMF fédère plus de 100 clubs dans plusieurs districts et communes, la sélection nationale et une médiature nationale. Vos droits de marque s''appliquent sur l''ensemble des événements fédéraux."},
      {"q":"Quels indicateurs de retour vais-je recevoir ?","a":"Chaque saison, un rapport de visibilité vous est remis : audience des chaînes de la FIMF, compte-rendu média, photos d''activation sur les sites d''événements et retombées presse."}]'::jsonb,
  contact_email    text not null default 'fimf.infos@gmail.com',
  contact_phone    text not null default '(+225) 27 22 41 35 94',
  contact_whatsapp text not null default '+225 07 08 56 35 36',
  contact_address  text not null default 'Cocody Deux Plateaux Vallons, Abidjan — Côte d''Ivoire',
  contact_hours    text not null default 'Commission partenariats : du lundi au vendredi, 9 h – 17 h',
  notify_email     text not null default 'partenaires@fimf.ci',
  page_enabled     boolean not null default true,
  form_enabled     boolean not null default true,
  updated_at       timestamptz not null default now()
);

create trigger trg_sponsor_settings_updated
  before update on public.sponsor_settings
  for each row execute function public.fimf_set_updated_at();

insert into public.sponsor_settings (id) values (1) on conflict do nothing;

-- ═══════════════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- Lecture publique : contenu actif/visible uniquement.
-- Écriture : is_fimf_admin() uniquement (les dirigeants de club restent
-- en lecture seule côté serveur).
-- ═══════════════════════════════════════════════════════════════════════

-- PACKAGES ---------------------------------------------------------------
alter table public.sponsor_packages enable row level security;
drop policy if exists "public read active packages" on public.sponsor_packages;
create policy "public read active packages"
  on public.sponsor_packages for select
  to anon, authenticated
  using (active = true or public.is_fimf_admin());

drop policy if exists "admins write packages" on public.sponsor_packages;
create policy "admins write packages"
  on public.sponsor_packages for all
  to authenticated
  using (public.is_fimf_admin()) with check (public.is_fimf_admin());

-- PARTNERS (logos publics) -----------------------------------------------
alter table public.sponsor_partners enable row level security;
drop policy if exists "public read visible partners" on public.sponsor_partners;
create policy "public read visible partners"
  on public.sponsor_partners for select
  to anon, authenticated
  using (visible = true or public.is_fimf_admin());

drop policy if exists "admins write partners" on public.sponsor_partners;
create policy "admins write partners"
  on public.sponsor_partners for all
  to authenticated
  using (public.is_fimf_admin()) with check (public.is_fimf_admin());

-- DEMANDES (déjà protégée — voir migrate-sponsor-requests.sql) ------------
-- PUBLIC : select/update/delete déjà réservés à is_fimf_admin().

-- ÉVÉNEMENTS DES DEMANDES ------------------------------------------------
alter table public.sponsor_request_events enable row level security;
drop policy if exists "admins read events" on public.sponsor_request_events;
create policy "admins read events"
  on public.sponsor_request_events for select
  to authenticated using (public.is_fimf_admin());
drop policy if exists "admins write events" on public.sponsor_request_events;
create policy "admins write events"
  on public.sponsor_request_events for insert
  to authenticated with check (public.is_fimf_admin());
drop policy if exists "admins delete events" on public.sponsor_request_events;
create policy "admins delete events"
  on public.sponsor_request_events for delete
  to authenticated using (public.is_fimf_admin());

-- SPONSORS CONTRACTÉS (données financières : jamais publiques) -----------
alter table public.sponsor_clients enable row level security;
drop policy if exists "admins read clients" on public.sponsor_clients;
create policy "admins read clients"
  on public.sponsor_clients for select
  to authenticated using (public.is_fimf_admin());
drop policy if exists "admins write clients" on public.sponsor_clients;
create policy "admins write clients"
  on public.sponsor_clients for all
  to authenticated
  using (public.is_fimf_admin()) with check (public.is_fimf_admin());

-- DOCUMENTS DE SPONSORS (contrats : confidentiels) -----------------------
alter table public.sponsor_client_documents enable row level security;
drop policy if exists "admins read docs" on public.sponsor_client_documents;
create policy "admins read docs"
  on public.sponsor_client_documents for select
  to authenticated using (public.is_fimf_admin());
drop policy if exists "admins write docs" on public.sponsor_client_documents;
create policy "admins write docs"
  on public.sponsor_client_documents for all
  to authenticated
  using (public.is_fimf_admin()) with check (public.is_fimf_admin());

-- PARAMÈTRES -------------------------------------------------------------
alter table public.sponsor_settings enable row level security;
drop policy if exists "public read settings" on public.sponsor_settings;
create policy "public read settings"
  on public.sponsor_settings for select
  to anon, authenticated using (true);
drop policy if exists "admins write settings" on public.sponsor_settings;
create policy "admins write settings"
  on public.sponsor_settings for update
  to authenticated
  using (public.is_fimf_admin()) with check (public.is_fimf_admin());
drop policy if exists "admins insert settings" on public.sponsor_settings;
create policy "admins insert settings"
  on public.sponsor_settings for insert
  to authenticated with check (public.is_fimf_admin());

-- ── Sécurité renforcée (cf. security-hardening.sql) ───────────────────
-- NB : la permission sur le schéma public des rôles anon/authenticated est
-- déjà gérée par setup.sql / security-hardening.sql ; les policies ci-dessus
-- suffisent à protéger les données sensibles du module.
