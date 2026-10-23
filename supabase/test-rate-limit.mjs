// Test de la limitation de débit des formulaires publics (audit sécurité FIMF,
// constat 13).
//
// Applique `supabase/rate-limit.sql` sur un PostgreSQL PGlite en mémoire, puis
// vérifie le comportement réel du déclencheur `enforce_form_rate_limit`.
//
// Usage : npm run test:rate-limit
//
// Le harnais est volontairement autonome : il ne demande ni projet Supabase ni
// compte de test. C'est le pendant local de `supabase/test-rls.mjs`, qui exige
// lui des comptes réels et ne peut donc pas être rejoué hors ligne.
import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const SQL_FILE = process.argv[2] ?? join(HERE, 'rate-limit.sql');

let failures = 0;
function check(label, ok, detail = '') {
  console.log(`${ok ? 'OK   ' : 'ECHEC'} ${label}${detail ? ` -- ${detail}` : ''}`);
  if (!ok) failures++;
}

// Schéma minimal reproduisant les deux tables publiques concernées.
const SCHEMA = `
create table public.member_requests (
  id bigint generated always as identity primary key,
  full_name text not null,
  email text not null unique,
  status text not null default 'nouvelle',
  created_at timestamptz not null default now()
);
create table public.sponsor_requests (
  id bigint generated always as identity primary key,
  company text not null,
  contact_name text not null,
  email text not null,
  status text not null default 'nouvelle',
  created_at timestamptz not null default now()
);
`;

const db = new PGlite();
// PGlite ne crée pas les rôles Supabase par défaut.
await db.exec(`
  do $$ begin
    if not exists (select 1 from pg_roles where rolname = 'anon') then create role anon nologin; end if;
    if not exists (select 1 from pg_roles where rolname = 'authenticated') then create role authenticated nologin; end if;
    if not exists (select 1 from pg_roles where rolname = 'service_role') then create role service_role nologin bypassrls; end if;
  end $$;
`);
await db.exec(SCHEMA);

const sql = readFileSync(SQL_FILE, 'utf8');
try {
  await db.exec(sql);
  check('le script SQL s\'exécute sans erreur', true);
} catch (e) {
  check('le script SQL s\'exécute sans erreur', false, String(e.message ?? e));
  await db.close();
  process.exit(1);
}

/** Simule une requête HTTP PostgREST avec une adresse IP cliente. */
async function insert(table, ip, n) {
  await db.exec(`select set_config('request.headers', '{"x-forwarded-for":"${ip}"}', false)`);
  try {
    const cols =
      table === 'member_requests' ? 'full_name, email' : 'company, contact_name, email';
    const vals =
      table === 'member_requests'
        ? [`n${n}`, `u${n}-${ip.replace(/\./g, '')}@x.ci`]
        : [`c${n}`, `c${n}`, `u${n}-${ip.replace(/\./g, '')}@x.ci`];
    const placeholders = vals.map((_, i) => `$${i + 1}`).join(',');
    await db.query(`insert into public.${table} (${cols}) values (${placeholders})`, vals);
    return { ok: true };
  } catch (e) {
    return { ok: false, message: String(e.message ?? e) };
  }
}

// ── Le quota bloque bien au 4e envoi pour une même IP ──
const r1 = await insert('member_requests', '203.0.113.10', 1);
const r2 = await insert('member_requests', '203.0.113.10', 2);
const r3 = await insert('member_requests', '203.0.113.10', 3);
const r4 = await insert('member_requests', '203.0.113.10', 4);

check('envoi 1 accepté', r1.ok, r1.message ?? '');
check('envoi 2 accepté', r2.ok, r2.message ?? '');
check('envoi 3 accepté (quota = 3)', r3.ok, r3.message ?? '');
check('envoi 4 refusé (quota atteint)', !r4.ok, r4.ok ? 'il a passé !' : '');
check(
  'le refus porte le marqueur RATE_LIMIT',
  !r4.ok && String(r4.message).includes('RATE_LIMIT'),
  r4.message ?? '',
);

// Une autre IP n'est pas affectée.
const other = await insert('member_requests', '198.51.100.77', 1);
check('une IP différente passe encore', other.ok, other.message ?? '');

// La table sponsor_requests est protégée de la même façon.
const s1 = await insert('sponsor_requests', '203.0.113.10', 1);
const s2 = await insert('sponsor_requests', '203.0.113.10', 2);
const s3 = await insert('sponsor_requests', '203.0.113.10', 3);
const s4 = await insert('sponsor_requests', '203.0.113.10', 4);
check('sponsor_requests : 3 envois acceptés', s1.ok && s2.ok && s3.ok);
check('sponsor_requests : 4e envoi refusé', !s4.ok, s4.ok ? 'il a passé !' : '');

// Une écriture directe (session SQL, sans en-tête HTTP) n'est pas limitée.
await db.exec(`select set_config('request.headers', '', false)`);
let directOk = true;
try {
  await db.query('insert into public.member_requests (full_name, email) values ($1,$2)', [
    'direct',
    'direct@x.ci',
  ]);
} catch {
  directOk = false;
}
check('une écriture directe hors HTTP n\'est pas limitée', directOk);

// Les quotas sont paramétrables sans redéployer.
await db.exec(
  `update public.form_rate_limit_settings set max_requests = 1 where form_key = 'member_requests'`,
);
const p1 = await insert('member_requests', '203.0.113.55', 1);
const p2 = await insert('member_requests', '203.0.113.55', 2);
check('un quota abaissé à 1 bloque le 2e envoi', p1.ok && !p2.ok, p1.message ?? '');

// Le compteur est purgé hors fenêtre.
const cnt = await db.query(
  `select count(*)::int as n from public.form_rate_limit where created_at <= now() - interval '15 minutes'`,
);
check('la purge hors fenêtre ne laisse pas de ligne obsolète', cnt.rows[0].n === 0);

await db.close();
console.log(failures === 0 ? '\nTOUS LES TESTS PASSENT' : `\n${failures} ÉCHEC(S)`);
process.exit(failures === 0 ? 0 : 1);
