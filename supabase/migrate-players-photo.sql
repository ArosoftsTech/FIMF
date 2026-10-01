-- Migration : photo de profil des joueurs + unicité des numéros de maillot par club
-- Exécution : node supabase/run-sql.mjs supabase/migrate-players-photo.sql
-- (ou copier-coller dans le SQL Editor de Supabase)

-- 1. Colonne photo de profil (référence bucket fimf-media ou URL)
alter table public.players add column if not exists photo_url text;

-- 2. Un numéro de maillot est unique au sein d'un même club
--    (l'effectif est resynchronisé en masse à chaque enregistrement, la
--    contrainte empêche aussi les doublons côté base).
alter table public.players drop constraint if exists players_club_id_number_key;
alter table public.players drop constraint if exists players_unique_number_per_club;
alter table public.players
  add constraint players_unique_number_per_club unique (club_id, number);
