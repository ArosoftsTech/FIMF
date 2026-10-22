/**
 * FIMF — Harnais de test RLS / durcissement, sans dépendance au projet Supabase.
 *
 * Rejoue les vrais scripts SQL du dossier supabase/ sur un PostgreSQL local
 * (PGlite, WASM) avec un prélude qui imite le minimum de Supabase
 * (schémas auth/storage, rôles anon/authenticated, auth.uid(), pg_net),
 * puis vérifie le comportement réel des politiques RLS.
 *
 *   npm run test:rls
 *
 * Aucun secret, aucune connexion réseau : tout se passe en mémoire.
 */
import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const sql = (name) => readFileSync(path.join(here, name), 'utf8');

/* ------------------------------------------------------------------ */
/* Prélude : imitation minimale de Supabase                            */
/* ------------------------------------------------------------------ */
const PRELUDE = `
create role anon nologin;
create role authenticated nologin;
create role fimf_owner nologin;

create schema auth;
create table auth.users (
  id uuid primary key,
  email text unique
);

create schema storage;
create table storage.buckets (
  id text primary key,
  name text not null,
  public boolean default false,
  file_size_limit bigint
);
create table storage.objects (
  id uuid primary key default gen_random_uuid(),
  bucket_id text,
  name text,
  owner uuid
);
alter table storage.objects enable row level security;

create schema extensions;
create schema net;
create schema private;
create table private.webhook_config (key text primary key, value text);
create or replace function net.http_post(
  url text, headers jsonb default '{}'::jsonb, body jsonb default '{}'::jsonb,
  timeout_milliseconds int default 5000
) returns bigint language sql as $$ select 1::bigint $$;

grant usage, create on schema public to fimf_owner;
grant usage on schema auth to fimf_owner;
grant references, select, insert, update, delete on auth.users to fimf_owner;
grant usage on schema storage to fimf_owner;
grant all on storage.buckets, storage.objects to fimf_owner;
alter table storage.objects owner to fimf_owner;
alter table storage.buckets owner to fimf_owner;
`;

/* auth.uid() doit exister AVANT les scripts (policies le référencent) et être
   lisible par anon/authenticated. On le crée côté superutilisateur. */
const AUTH_UID = `
create or replace function auth.uid() returns uuid
language sql stable
as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
grant usage on schema auth to anon, authenticated;
grant execute on function auth.uid() to anon, authenticated;
`;

/* Les scripts sont exécutés en tant que propriétaire non-superutilisateur :
   comme sur Supabase, le propriétaire des tables contourne la RLS, mais les
   rôles anon/authenticated y sont soumis. */
const SCRIPTS = [
  'setup.sql',
  'club-users-rls.sql',
  'hero-slides.sql',
  'migrate-sponsor-requests.sql',
  'migrate-member-requests.sql',
  'migrate-member-favorites.sql',
  'migrate-players-photo.sql',
  'migrate-member-activation.sql',
  'security-hardening.sql',
];

const GRANTS = `
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to anon, authenticated;
grant usage, select on all sequences in schema public to anon, authenticated;
grant execute on all functions in schema public to anon, authenticated;
grant usage on schema storage to anon, authenticated;
grant all on storage.buckets, storage.objects to anon, authenticated;
`;

const SEED = `
insert into public.clubs (id, name, short_name, city, commune, region, division, founded,
  president, coach, stadium, primary_color, secondary_color, badge_bg, badge_border, badge_icon)
values
  ('club-a', 'Club A', 'A', 'Abidjan', 'Cocody', 'Abidjan', 'D1', 2000,
   'P', 'C', 'S', '#000', '#fff', '#eee', '#111', 'shield'),
  ('club-b', 'Club B', 'B', 'Bouaké', 'Centre', 'Vallée', 'D1', 2001,
   'P', 'C', 'S', '#000', '#fff', '#eee', '#111', 'shield')
on conflict (id) do nothing;

insert into public.players (club_id, number, name, position, age)
select 'club-a', 7, 'Joueur A', 'Attaquant', 25
where not exists (select 1 from public.players where club_id = 'club-a' and number = 7);

insert into public.sponsor_requests (company, contact_name, email, status)
select 'Sponsor SA', 'Contact', 'sponsor@test.ci', 'nouvelle'
where not exists (select 1 from public.sponsor_requests where email = 'sponsor@test.ci');

insert into public.member_requests (full_name, email, status)
select 'Membre Existant', 'existant@test.ci', 'nouvelle'
where not exists (select 1 from public.member_requests where email = 'existant@test.ci');

insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'membre@test.ci'),
  ('22222222-2222-2222-2222-222222222222', 'dirigeant@test.ci'),
  ('33333333-3333-3333-3333-333333333333', 'admin@test.ci')
on conflict (id) do nothing;

insert into public.member_favorite_clubs (user_id, club_id)
select '11111111-1111-1111-1111-111111111111', 'club-a'
where not exists (
  select 1 from public.member_favorite_clubs
  where user_id = '11111111-1111-1111-1111-111111111111' and club_id = 'club-a'
);

insert into public.club_users (user_id, club_id, role)
select '22222222-2222-2222-2222-222222222222', 'club-a', 'dirigeant'
where not exists (
  select 1 from public.club_users
  where user_id = '22222222-2222-2222-2222-222222222222' and club_id = 'club-a'
);

insert into public.fimf_admins (user_id)
select '33333333-3333-3333-3333-333333333333'
where not exists (
  select 1 from public.fimf_admins where user_id = '33333333-3333-3333-3333-333333333333'
);
`;

const MEMBER = '11111111-1111-1111-1111-111111111111';
const DIRIGEANT = '22222222-2222-2222-2222-222222222222';
const ADMIN = '33333333-3333-3333-3333-333333333333';

let passed = 0;
let failed = 0;

function check(label, ok, detail = '') {
  if (ok) {
    passed += 1;
    console.log(`  ok   ${label}`);
  } else {
    failed += 1;
    console.log(`  FAIL ${label}${detail ? ` — ${detail}` : ''}`);
  }
}

/** Exécute fn dans une transaction annulée à la fin, sous un rôle donné. */
async function as(db, role, userId, fn) {
  await db.exec('begin');
  try {
    await db.exec(`set local role ${role}`);
    if (userId) {
      await db.query(`select set_config('request.jwt.claim.sub', $1, true)`, [userId]);
    }
    const result = await fn();
    return { ok: true, result };
  } catch (error) {
    return { ok: false, error: String(error.message || error) };
  } finally {
    await db.exec('rollback');
  }
}

const count = async (db, table) => {
  const { rows } = await db.query(`select count(*)::int as n from public.${table}`);
  return rows[0].n;
};

const main = async () => {
  const db = new PGlite();
  await db.waitReady;

  console.log('Prélude Supabase (auth, storage, rôles, pg_net)…');
  await db.exec(PRELUDE);
  await db.exec(AUTH_UID);

  console.log('Application des scripts SQL du dépôt…');
  await db.exec('set role fimf_owner');
  for (const script of SCRIPTS) {
    try {
      await db.exec(sql(script));
    } catch (error) {
      console.error(`\nÉchec de ${script} : ${error.message}`);
      throw error;
    }
  }
  await db.exec('reset role');
  await db.exec(GRANTS);
  await db.exec(SEED);

  console.log('\nLecture publique');
  {
    const r = await as(db, 'anon', null, () => count(db, 'clubs'));
    check('anon lit les clubs', r.ok && r.result >= 2, r.error);

    const n = await as(db, 'anon', null, () => count(db, 'news_articles'));
    check('anon lit les actualités', n.ok, n.error);

    const h = await as(db, 'anon', null, () => count(db, 'hero_slides'));
    check('anon lit le carrousel', h.ok && h.result >= 1, h.error);

    const o = await as(db, 'anon', null, () => count(db, 'officials'));
    check('anon lit les dirigeants', o.ok, o.error);
  }

  console.log('\nAnonyme : aucune écriture, aucune donnée personnelle');
  {
    const w = await as(db, 'anon', null, () =>
      db.query(`insert into public.clubs (id, name, short_name, city, commune, region, division, founded, president, coach, stadium, primary_color, secondary_color, badge_bg, badge_border, badge_icon) values ('x','x','x','x','x','x','x',1,'x','x','x','x','x','x','x','x')`)
    );
    check('anon ne peut pas créer un club', !w.ok);

    const u = await as(db, 'anon', null, () =>
      db.query(`update public.clubs set name = 'pirate' where id = 'club-a'`)
    );
    check('anon ne peut pas modifier un club', !u.ok || u.result.affectedRows === 0);

    const s = await as(db, 'anon', null, () => count(db, 'sponsor_requests'));
    check('anon ne lit pas les demandes de sponsoring', s.ok && s.result === 0, s.error);

    const m = await as(db, 'anon', null, () => count(db, 'member_requests'));
    check('anon ne lit pas les demandes d’adhésion', m.ok && m.result === 0, m.error);

    const a = await as(db, 'anon', null, () => count(db, 'audit_logs'));
    check('anon ne lit pas le journal d’audit', a.ok && a.result === 0, a.error);

    const ad = await as(db, 'anon', null, () => count(db, 'fimf_admins'));
    check('anon ne lit pas la table des admins', ad.ok && ad.result === 0, ad.error);
  }

  console.log('\nMembre authentifié (non admin)');
  {
    const r = await as(db, 'authenticated', MEMBER, () => count(db, 'clubs'));
    check('membre lit les clubs', r.ok && r.result >= 2, r.error);

    const u = await as(db, 'authenticated', MEMBER, () =>
      db.query(`update public.clubs set name = 'pirate' where id = 'club-a'`)
    );
    check('membre ne peut pas modifier un club', !u.ok || u.result.affectedRows === 0);

    const d = await as(db, 'authenticated', MEMBER, () =>
      db.query(`delete from public.clubs where id = 'club-a'`)
    );
    check('membre ne peut pas supprimer un club', !d.ok || d.result.affectedRows === 0);

    const s = await as(db, 'authenticated', MEMBER, () => count(db, 'sponsor_requests'));
    check('membre ne lit pas les demandes de sponsoring', s.ok && s.result === 0, s.error);

    const su = await as(db, 'authenticated', MEMBER, () =>
      db.query(`update public.sponsor_requests set status = 'approuvée'`)
    );
    check('membre ne peut pas traiter une demande de sponsoring', !su.ok || su.result.affectedRows === 0);

    const m = await as(db, 'authenticated', MEMBER, () => count(db, 'member_requests'));
    check('membre ne lit pas les demandes d’adhésion', m.ok && m.result === 0, m.error);

    const a = await as(db, 'authenticated', MEMBER, () => count(db, 'audit_logs'));
    check('membre ne lit pas le journal d’audit', a.ok && a.result === 0, a.error);

    const ai = await as(db, 'authenticated', MEMBER, () =>
      db.query(`insert into public.audit_logs (id, action) values ('log-test', 'test')`)
    );
    check('membre peut écrire un log d’audit', ai.ok, ai.error);

    const self = await as(db, 'authenticated', MEMBER, () =>
      db.query(`insert into public.member_requests (full_name, email, status) values ('Pirate', 'pirate@test.ci', 'approuvée')`)
    );
    check('membre ne peut pas s’auto-approuver', !self.ok);

    const ok = await as(db, 'authenticated', MEMBER, () =>
      db.query(`insert into public.member_requests (full_name, email, status) values ('Candidat', 'candidat@test.ci', 'nouvelle')`)
    );
    check('membre peut soumettre une demande « nouvelle »', ok.ok, ok.error);

    const adm = await as(db, 'authenticated', MEMBER, () => count(db, 'fimf_admins'));
    check('membre ne lit pas la table des admins', adm.ok && adm.result === 0, adm.error);

    const fav = await as(db, 'authenticated', MEMBER, () =>
      db.query(`insert into public.member_favorite_clubs (user_id, club_id) values ('${MEMBER}', 'club-b')`)
    );
    check('membre gère ses propres favoris', fav.ok, fav.error);

    const favOther = await as(db, 'authenticated', MEMBER, () =>
      db.query(`insert into public.member_favorite_clubs (user_id, club_id) values ('${DIRIGEANT}', 'club-b')`)
    );
    check('membre ne peut pas écrire les favoris d’un autre', !favOther.ok);

    const favRead = await as(db, 'authenticated', MEMBER, () => count(db, 'member_favorite_clubs'));
    check('membre ne voit que ses favoris', favRead.ok && favRead.result === 1, favRead.error);

    const pl = await as(db, 'authenticated', MEMBER, () =>
      db.query(`insert into public.players (club_id, number, name, position, age) values ('club-a', 9, 'Pirate', 'Attaquant', 20)`)
    );
    check('membre ne peut pas recruter un joueur', !pl.ok);

    const obj = await as(db, 'authenticated', MEMBER, () =>
      db.query(`insert into storage.objects (bucket_id, name) values ('fimf-media', 'pirate.png')`)
    );
    check('membre ne peut pas écrire dans le bucket', !obj.ok);
  }

  console.log('\nDirigeant (club-a uniquement)');
  {
    const own = await as(db, 'authenticated', DIRIGEANT, () =>
      db.query(`update public.clubs set name = 'Club A (dirigeant)' where id = 'club-a'`)
    );
    check('dirigeant modifie son club', own.ok && own.result.affectedRows === 1, own.error);

    const other = await as(db, 'authenticated', DIRIGEANT, () =>
      db.query(`update public.clubs set name = 'pirate' where id = 'club-b'`)
    );
    check('dirigeant ne modifie pas un autre club', !other.ok || other.result.affectedRows === 0);

    const playerOwn = await as(db, 'authenticated', DIRIGEANT, () =>
      db.query(`insert into public.players (club_id, number, name, position, age) values ('club-a', 11, 'Recrue', 'Milieu', 22)`)
    );
    check('dirigeant recrute dans son club', playerOwn.ok, playerOwn.error);

    const playerOther = await as(db, 'authenticated', DIRIGEANT, () =>
      db.query(`insert into public.players (club_id, number, name, position, age) values ('club-b', 11, 'Recrue', 'Milieu', 22)`)
    );
    check('dirigeant ne recrute pas dans un autre club', !playerOther.ok);

    const selfAssign = await as(db, 'authenticated', DIRIGEANT, () =>
      db.query(`insert into public.club_users (user_id, club_id) values ('${DIRIGEANT}', 'club-b')`)
    );
    check('dirigeant ne s’auto-attribue pas un autre club', !selfAssign.ok);
  }

  console.log('\nAdmin fédéral');
  {
    const any = await as(db, 'authenticated', ADMIN, () =>
      db.query(`update public.clubs set name = 'Club B (admin)' where id = 'club-b'`)
    );
    check('admin modifie n’importe quel club', any.ok && any.result.affectedRows === 1, any.error);

    const s = await as(db, 'authenticated', ADMIN, () => count(db, 'sponsor_requests'));
    check('admin lit les demandes de sponsoring', s.ok && s.result >= 1, s.error);

    const m = await as(db, 'authenticated', ADMIN, () => count(db, 'member_requests'));
    check('admin lit les demandes d’adhésion', m.ok && m.result >= 1, m.error);

    const a = await as(db, 'authenticated', ADMIN, () => count(db, 'audit_logs'));
    check('admin lit le journal d’audit', a.ok, a.error);

    const obj = await as(db, 'authenticated', ADMIN, () =>
      db.query(`insert into storage.objects (bucket_id, name) values ('fimf-media', 'ok.png')`)
    );
    check('admin écrit dans le bucket', obj.ok, obj.error);

    const content = await as(db, 'authenticated', ADMIN, () =>
      db.query(`insert into public.news_articles (id, title, category, date_str, timestamp) values ('n-test','Titre','Club','2026-01-01', now())`)
    );
    check('admin publie une actualité', content.ok, content.error);
  }

  console.log('\nStructure / invariants');
  {
    const rls = await db.query(`
      select c.relname
      from pg_class c join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and c.relkind = 'r' and c.relrowsecurity
    `);
    const secured = rls.rows.map((row) => row.relname);
    const expected = ['clubs', 'players', 'matches', 'sponsor_requests', 'member_requests', 'audit_logs', 'member_favorite_clubs'];
    const missing = expected.filter((table) => !secured.includes(table));
    check('RLS active sur les tables sensibles', missing.length === 0, `manquantes : ${missing.join(', ')}`);

    const pwd = await db.query(`
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'member_requests' and column_name = 'password'
    `);
    check('member_requests n’a plus de colonne password', pwd.rows.length === 0);

    const leak = await db.query(`
      select 1 from pg_policies
      where schemaname = 'public' and tablename = 'officials' and cmd = 'SELECT' and roles = '{public}'
    `);
    check('officials reste en lecture publique', leak.rows.length > 0);
  }

  console.log(`\nRésultat : ${passed} réussis, ${failed} échoués.`);
  await db.close();
  if (failed > 0) process.exitCode = 1;
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
