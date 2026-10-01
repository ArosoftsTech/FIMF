-- =====================================================================
-- FIMF — Clubs favoris des membres (persistance par compte)
-- Chaque utilisateur connecté gère ses propres favoris.
-- Ré-exécutable. Exécution :
--   SBP=<token> node supabase/run-sql.mjs supabase/migrate-member-favorites.sql
-- =====================================================================

create table if not exists public.member_favorite_clubs (
  user_id uuid not null references auth.users(id) on delete cascade,
  club_id text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, club_id)
);

alter table public.member_favorite_clubs enable row level security;

-- Chaque membre ne voit et ne gère que ses propres favoris
drop policy if exists "members manage own favorite clubs" on public.member_favorite_clubs;
create policy "members manage own favorite clubs"
  on public.member_favorite_clubs
  for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
