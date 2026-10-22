-- =====================================================================
-- FIMF — Jeux & Pronostics membres (périodes, lots, tirages, bourses)
-- Ré-exécutable. Exécution :
--   SBP=<token> node supabase/run-sql.mjs supabase/migrate-games.sql
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) PÉRIODES DE JEU
-- ---------------------------------------------------------------------
create table if not exists public.game_periods (
  id bigint generated always as identity primary key,
  name text not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  -- top_n : les N meilleurs pronostiqueurs de la période se qualifient pour le tirage des lots
  top_n int not null default 10,
  status text not null default 'à venir'
    check (status in ('à venir', 'en cours', 'clôturée')),
  created_at timestamptz not null default now(),
  check (ends_at > starts_at)
);

-- ---------------------------------------------------------------------
-- 2) LOTS PAR PÉRIODE
-- ---------------------------------------------------------------------
create table if not exists public.game_prizes (
  id bigint generated always as identity primary key,
  period_id bigint not null references public.game_periods(id) on delete cascade,
  label text not null,
  description text,
  image_ref text,
  rank_from int not null default 1, -- le rang 1 du tirage gagne ce lot, etc.
  rank_to int not null default 1,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 3) PRONOSTICS DES MEMBRES (un par (user, match), modifiable jusqu'au coup d'envoi)
-- ---------------------------------------------------------------------
create table if not exists public.match_predictions (
  user_id uuid not null references auth.users(id) on delete cascade,
  match_id text not null,
  period_id bigint not null references public.game_periods(id) on delete cascade,
  predicted_home int not null check (predicted_home >= 0),
  predicted_away int not null check (predicted_away >= 0),
  points int, -- rempli par l'évaluation après le match
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, match_id)
);

create index if not exists idx_predictions_period on public.match_predictions(period_id);
create index if not exists idx_predictions_user_period on public.match_predictions(user_id, period_id);

-- ---------------------------------------------------------------------
-- 4) TIRAGES AU SORT (lots de période + bourses d'études Angleterre)
-- ---------------------------------------------------------------------
create table if not exists public.prize_draws (
  id bigint generated always as identity primary key,
  -- kind : 'period' = tirage des lots d'une période de pronostics ;
  --        'scholarship' = bourses d'études en Angleterre (réseaux sociaux)
  kind text not null check (kind in ('period', 'scholarship')),
  period_id bigint references public.game_periods(id) on delete cascade,
  title text not null,
  description text,
  -- winners_count : nb de gagnants ; winners : user_ids des gagnants (ou emails externes)
  winners_count int not null default 1,
  seed text, -- graine du RNG pour la reproductibilité / l'audit
  status text not null default 'planifié' check (status in ('planifié', 'terminé')),
  drawn_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.draw_winners (
  id bigint generated always as identity primary key,
  draw_id bigint not null references public.prize_draws(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  external_name text, -- gagnant hors-compte (p.ex. abonné réseaux sociaux)
  rank int not null default 1,
  prize_id bigint references public.game_prizes(id) on delete set null,
  -- Photo du gagnant (référence dans le bucket fimf-media, uploadée par l'admin)
  photo_ref text,
  drawn_at timestamptz not null default now()
);

-- Table déjà créée avant l'ajout de la colonne photo : migration idempotente
alter table public.draw_winners add column if not exists photo_ref text;

-- ---------------------------------------------------------------------
-- 5) TICKETS DE TIRAGE BOURSE (couplés aux points : 1 ticket / 10 pts)
-- ---------------------------------------------------------------------
-- Tickets pondérés : un membre peut détenir PLUSIEURS tickets (1 / 10 points
-- cumulés). Pas de contrainte d'unicité : le poids au tirage = le nb de tickets.
create table if not exists public.draw_tickets (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  draw_id bigint not null references public.prize_draws(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- HELPERS
-- ---------------------------------------------------------------------

-- Parse « Sam. 28 Sept. 2025 » + « 16h00 » → timestamptz (null si illisible)
create or replace function public.parse_match_date(p_date text, p_time text)
returns timestamptz
language plpgsql
immutable
as $$
declare
  months text[] := array['janv','fev','mars','avr','mai','juin','juil','aout','sept','oct','nov','dec'];
  m int;
  d int;
  y int;
  hh int;
  mm int;
  norm text;
begin
  norm := lower(replace(replace(replace(coalesce(p_date, ''), 'é', 'e'), 'û', 'u'), '.', ' '));
  -- normalise aussi le mois accentué via untranslate simple
  norm := replace(norm, 'fév', 'fev');
  norm := replace(norm, 'aoû', 'aou');
  if norm ~ '\d' then
    d := (regexp_match(norm, '\d+'))[1]::int;
    y := (regexp_match(norm, '\d{4}'))[1]::int;
    for i in 1..12 loop
      if norm like '%' || months[i] || '%' then
        m := i;
        exit;
      end if;
    end loop;
  end if;
  if m is null or d is null or y is null then
    return null;
  end if;
  hh := coalesce(nullif((regexp_match(coalesce(p_time, ''), '(\d{1,2})h'))[1]::int, 0), 0);
  mm := coalesce(nullif((regexp_match(coalesce(p_time, ''), 'h(\d{2})'))[1]::int, 0), 0);
  return make_timestamptz(y, m, d, hh, mm, 0, 'Africa/Abidjan');
end;
$$;

-- Évalue les points d'un pronostic (3 exact, 1 bonne issue, 0 sinon)
create or replace function public.eval_prediction_points(
  p_pred_home int, p_pred_away int, p_actual_home int, p_actual_away int
) returns int
language sql
immutable
as $$
  select case
    when p_pred_home = p_actual_home and p_pred_away = p_actual_away then 3
    when sign(p_pred_home - p_pred_away) = sign(p_actual_home - p_actual_away) then 1
    else 0
  end;
$$;

-- Met à jour les points des pronostics d'une période dont les matchs sont terminés.
-- Retourne le nombre de lignes évaluées. Exécuté par un admin avant le tirage.
create or replace function public.admin_evaluate_period_predictions(p_period_id bigint)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  affected int;
begin
  if not public.is_fimf_admin() then
    raise exception 'Réservé aux admins FIMF';
  end if;

  with finished as (
    select m.id as match_id, m.score_home, m.score_away
    from public.matches m
    where m.status = 'finished'
      and m.score_home is not null and m.score_away is not null
  ),
  upd as (
    update public.match_predictions p
    set points = public.eval_prediction_points(
          p.predicted_home, p.predicted_away, f.score_home, f.score_away
        ),
        updated_at = now()
    from finished f
    where p.match_id = f.match_id
      and p.period_id = p_period_id
      and (p.points is distinct from public.eval_prediction_points(
             p.predicted_home, p.predicted_away, f.score_home, f.score_away))
    returning 1
  )
  select count(*) into affected from upd;

  return affected;
end;
$$;

-- Classement d'une période (exécuté par un admin pour le tirage) :
-- retourne user_id, total_points, nb de pronostics, rang.
-- Garde is_fimf_admin() en base : la fonction est security definer et expose
-- les identifiants de tous les membres, elle ne doit jamais être publique.
create or replace function public.admin_period_leaderboard(p_period_id bigint)
returns table (rank bigint, user_id uuid, total_points bigint, predictions bigint)
language plpgsql
stable
security definer
set search_path = public
as $$
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
$$;

-- Tirage au sort reproductible : attribue les rangs 1..winners_count parmi les
-- participants qualifiés (top N du classement de la période) et enregistre les
-- gagnants avec les lots correspondants.
create or replace function public.admin_run_period_draw(
  p_draw_id bigint,
  p_seed text
) returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_draw public.prize_draws%rowtype;
  v_participants record;
  v_rank int := 0;
  v_rng double precision;
  v_pool text[] := '{}'; -- user_ids restants
  v_pick int;
  v_winner uuid;
  v_prize record;
begin
  if not public.is_fimf_admin() then
    raise exception 'Réservé aux admins FIMF';
  end if;

  select * into v_draw from public.prize_draws where id = p_draw_id;
  if not found then
    raise exception 'Tirage introuvable';
  end if;
  if v_draw.kind <> 'period' or v_draw.period_id is null then
    raise exception 'Ce tirage n''est pas un tirage de période';
  end if;
  if v_draw.status = 'terminé' then
    raise exception 'Tirage déjà effectué';
  end if;

  -- Qualifiés : top_n du classement de la période (avec points > 0)
  for v_participants in
    select * from public.admin_period_leaderboard(v_draw.period_id)
    where total_points > 0
    order by rank
    limit (select top_n from public.game_periods where id = v_draw.period_id)
  loop
    v_pool := v_pool || v_participants.user_id::text;
  end loop;

  if array_length(v_pool, 1) is null then
    raise exception 'Aucun participant qualifié pour cette période';
  end if;

  -- Mélange Fisher-Yates reproductible (graine textuelle + nonce par étape)
  for i in reverse array_length(v_pool, 1)..2 loop
    v_rng := public.fimf_rand(coalesce(p_seed, v_draw.id::text || '-' || v_draw.created_at::text), i);
    v_pick := 1 + floor(v_rng * i)::int;
    v_winner := v_pool[v_pick]::uuid;
    v_pool[v_pick] := v_pool[i];
    v_pool[i] := v_winner::text;
  end loop;

  -- Les `winners_count` premiers du mélange gagnent, rangs 1..N avec les lots
  -- correspondants (rank_from/rank_to du lot)
  v_rank := 0;
  while v_rank < least(v_draw.winners_count, array_length(v_pool, 1)) loop
    v_rank := v_rank + 1;
    select id into v_prize
    from public.game_prizes
    where period_id = v_draw.period_id
      and v_rank between rank_from and rank_to
    order by rank_from
    limit 1;

    insert into public.draw_winners (draw_id, user_id, rank, prize_id)
    values (p_draw_id, v_pool[v_rank]::uuid, v_rank, v_prize.id)
    on conflict do nothing;
  end loop;

  update public.prize_draws
  set status = 'terminé', drawn_at = now(), seed = coalesce(p_seed, seed)
  where id = p_draw_id;

  return v_rank;
end;
$$;

-- RNG déterministe (LCG 31 bits, Numerical Recipes) dérivé d'une graine textuelle.
-- Retourne une valeur dans [0,1), reproductible pour (p_seed, p_nonce).
create or replace function public.fimf_rand(p_seed text, p_nonce int)
returns double precision
language plpgsql
immutable
as $$
declare
  state bigint := 5381;
  i int;
  step int;
begin
  -- Hash de la graine (djb2 borné 2^31)
  for i in 0..length(coalesce(p_seed, ''))-1 loop
    state := (state * 33 + ascii(substr(p_seed, i+1, 1))) % 2147483648;
  end loop;
  state := (state + p_nonce) % 2147483648;
  -- Quelques tours de LCG pour bien mélanger
  for step in 1..4 loop
    state := (state * 1103515245 + 12345) % 2147483648;
  end loop;
  return state / 2147483648.0;
end;
$$;

-- Tirage bourse : attribution des tickets (1 ticket / 10 points cumulés), puis
-- sélection reproductible de winners_count gagnants parmi tous les tickets
-- (tirage pondéré : plus de points = plus de chances).
create or replace function public.admin_run_scholarship_draw(
  p_draw_id bigint,
  p_seed text
) returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_draw public.prize_draws%rowtype;
  v_holders record;
  v_rank int := 0;
  v_pool text[] := '{}';
  v_pick int;
  v_winner uuid;
begin
  if not public.is_fimf_admin() then
    raise exception 'Réservé aux admins FIMF';
  end if;

  select * into v_draw from public.prize_draws where id = p_draw_id;
  if not found then
    raise exception 'Tirage introuvable';
  end if;
  if v_draw.kind <> 'scholarship' then
    raise exception 'Ce tirage n''est pas un tirage de bourse';
  end if;
  if v_draw.status = 'terminé' then
    raise exception 'Tirage déjà effectué';
  end if;

  delete from public.draw_tickets where draw_id = p_draw_id;

  -- 1 ticket par tranche de 10 points cumulés sur toutes les périodes
  insert into public.draw_tickets (user_id, draw_id)
  select t.user_id, p_draw_id
  from (
    select p.user_id, floor(sum(coalesce(p.points, 0)) / 10.0)::int as n
    from public.match_predictions p
    group by p.user_id
  ) t,
  generate_series(1, greatest(t.n, 0))
  where t.n > 0;

  for v_holders in
    select user_id from public.draw_tickets where draw_id = p_draw_id order by user_id
  loop
    v_pool := v_pool || v_holders.user_id::text;
  end loop;

  if array_length(v_pool, 1) is null then
    raise exception 'Aucun ticket éligible (10 points minimum requis)';
  end if;

  -- Mélange Fisher-Yates avec le même RNG déterministe
  for i in reverse array_length(v_pool, 1)..2 loop
    v_pick := 1 + floor(public.fimf_rand(coalesce(p_seed, v_draw.id::text || '-' || v_draw.created_at::text), i) * i)::int;
    v_winner := v_pool[v_pick]::uuid;
    v_pool[v_pick] := v_pool[i];
    v_pool[i] := v_winner::text;
  end loop;

  v_rank := 0;
  while v_rank < least(v_draw.winners_count, array_length(v_pool, 1)) loop
    v_rank := v_rank + 1;
    insert into public.draw_winners (draw_id, user_id, rank)
    values (p_draw_id, v_pool[v_rank]::uuid, v_rank)
    on conflict do nothing;
  end loop;

  update public.prize_draws
  set status = 'terminé', drawn_at = now(), seed = coalesce(p_seed, seed)
  where id = p_draw_id;

  return v_rank;
end;
$$;

-- Classement visible par le membre connecté : son propre rang toujours ;
-- le classement complet une fois la période clôturée (publication).
create or replace function public.member_period_leaderboard(p_period_id bigint)
returns table (rank bigint, user_id uuid, total_points bigint, predictions bigint)
language sql
stable
security definer
set search_path = public
as $$
  with agg as (
    select user_id,
           sum(coalesce(points, 0))::bigint as total_points,
           count(*)::bigint as predictions
    from public.match_predictions
    where period_id = p_period_id
    group by user_id
  ),
  ranked as (
    select *, row_number() over (order by total_points desc, predictions desc) as rnk
    from agg
  )
  select rnk, user_id, total_points, predictions
  from ranked
  where user_id = auth.uid()
     or exists (
       select 1 from public.game_periods gp
       where gp.id = p_period_id and gp.status = 'clôturée'
     );
$$;

-- Gagnants publiés d'un tirage (nom affichable via member_requests, lot associé).
-- Sécurité definer : ne expose que nom + lot, jamais les emails/user_ids.
drop function if exists public.draw_winners_public(bigint);
create or replace function public.draw_winners_public(p_draw_id bigint)
returns table (id bigint, rank int, display_name text, prize_label text, photo_ref text)
language sql
security definer
set search_path = public
as $$
  select w.id,
         w.rank,
         coalesce(
           (select mr.full_name from public.member_requests mr
            where mr.auth_user_id = w.user_id limit 1),
           w.external_name,
           'Gagnant FIMF'
         ) as display_name,
         gp.label as prize_label,
         w.photo_ref
  from public.draw_winners w
  left join public.game_prizes gp on gp.id = w.prize_id
  where w.draw_id = p_draw_id
  order by w.rank;
$$;

-- ---------------------------------------------------------------------
-- TRANSITION AUTOMATIQUE DES STATUTS (pg_cron, toutes les 15 minutes)
-- ---------------------------------------------------------------------
-- - « à venir » → « en cours » dès que starts_at est atteint
-- - « en cours » → « clôturée » dès que ends_at est passé
-- Monotone : une période clôturée manuellement (en avance) n'est jamais
-- réouverte ; le classement/gagnants deviennent publics automatiquement.
create or replace function public.fimf_auto_transition_periods()
returns jsonb
language plpgsql
as $$
declare
  v_started int;
  v_closed int;
begin
  update public.game_periods
  set status = 'en cours'
  where status = 'à venir' and starts_at <= now();
  get diagnostics v_started = row_count;

  update public.game_periods
  set status = 'clôturée'
  where status = 'en cours' and ends_at < now();
  get diagnostics v_closed = row_count;

  return jsonb_build_object('started', v_started, 'closed', v_closed);
end;
$$;

-- Extension de planification (Supabase : pg_cron dans pg_catalog)
create extension if not exists pg_cron with schema pg_catalog;

-- (Re)planification idempotente du job
select cron.unschedule(jobid) from cron.job where jobname = 'fimf-period-transitions';

select cron.schedule(
  'fimf-period-transitions',
  '*/15 * * * *',
  $$ select public.fimf_auto_transition_periods(); $$
);

-- ---------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------
alter table public.game_periods enable row level security;
alter table public.game_prizes enable row level security;
alter table public.match_predictions enable row level security;
alter table public.prize_draws enable row level security;
alter table public.draw_winners enable row level security;
alter table public.draw_tickets enable row level security;

-- Périodes et lots : lisibles par tous (vitrine), écritures réservées aux admins
drop policy if exists "periods readable by all" on public.game_periods;
create policy "periods readable by all" on public.game_periods
  for select to anon, authenticated using (true);
drop policy if exists "periods managed by admins" on public.game_periods;
create policy "periods managed by admins" on public.game_periods
  for all to authenticated using (public.is_fimf_admin()) with check (public.is_fimf_admin());

drop policy if exists "prizes readable by all" on public.game_prizes;
create policy "prizes readable by all" on public.game_prizes
  for select to anon, authenticated using (true);
drop policy if exists "prizes managed by admins" on public.game_prizes;
create policy "prizes managed by admins" on public.game_prizes
  for all to authenticated using (public.is_fimf_admin()) with check (public.is_fimf_admin());

-- Pronostics : chaque membre ne voit et gère que les siens
drop policy if exists "members manage own predictions" on public.match_predictions;
create policy "members manage own predictions" on public.match_predictions
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Tirages : statut/gagnants visibles de tous ; détail (seed) réservé aux admins.
-- NB : la table expose les gagnants publiés, le seed sert d'audit interne.
drop policy if exists "draws readable by all" on public.prize_draws;
create policy "draws readable by all" on public.prize_draws
  for select to anon, authenticated using (true);
drop policy if exists "draws managed by admins" on public.prize_draws;
create policy "draws managed by admins" on public.prize_draws
  for all to authenticated using (public.is_fimf_admin()) with check (public.is_fimf_admin());

drop policy if exists "winners readable by all" on public.draw_winners;
create policy "winners readable by all" on public.draw_winners
  for select to anon, authenticated using (true);
drop policy if exists "winners managed by admins" on public.draw_winners;
create policy "winners managed by admins" on public.draw_winners
  for all to authenticated using (public.is_fimf_admin()) with check (public.is_fimf_admin());

-- Tickets : réservés à leur propriétaire (le tirage est security definer)
drop policy if exists "members read own tickets" on public.draw_tickets;
create policy "members read own tickets" on public.draw_tickets
  for select to authenticated using (user_id = auth.uid());

-- ---------------------------------------------------------------------
-- ACCÈS ADMIN FONCTIONS SENSIBLES
--   Les RPC admin sont security definer : on révoque l'exécution publique
--   (anon) mais on la conserve pour « authenticated », car le dashboard
--   admin s'authentifie normalement et chaque fonction vérifie elle-même
--   public.is_fimf_admin() avant d'agir.
-- ---------------------------------------------------------------------
revoke all on function public.admin_evaluate_period_predictions(bigint) from public;
revoke all on function public.admin_period_leaderboard(bigint) from public;
revoke all on function public.admin_run_period_draw(bigint, text) from public;
revoke all on function public.admin_run_scholarship_draw(bigint, text) from public;

grant execute on function public.admin_evaluate_period_predictions(bigint) to authenticated;
grant execute on function public.admin_period_leaderboard(bigint) to authenticated;
grant execute on function public.admin_run_period_draw(bigint, text) to authenticated;
grant execute on function public.admin_run_scholarship_draw(bigint, text) to authenticated;
grant execute on function public.is_fimf_admin() to anon, authenticated;

grant execute on function public.member_period_leaderboard(bigint) to authenticated;
grant execute on function public.draw_winners_public(bigint) to anon, authenticated;
