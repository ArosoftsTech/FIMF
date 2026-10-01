// Crée les comptes dirigeants (1 par club) puis les lie dans club_users
// Usage: SBP=<token management> SUPABASE_SECRET_KEY=<clé projet> node supabase/create-club-users.mjs
const PROJECT_REF = 'qyyclgiiecertaantjna';
const SBP = process.env.SBP;
const SECRET = process.env.SUPABASE_SECRET_KEY;
const URL = `https://${PROJECT_REF}.supabase.co`;

const CLUBS = [
  { id: 'as-plateau', email: 'plateau@fimf.ci' },
  { id: 'fc-riviera', email: 'riviera@fimf.ci' },
  { id: 'olympique-yop', email: 'yopougon@fimf.ci' },
  { id: 'sc-marcory', email: 'marcory@fimf.ci' },
  { id: 'fc-cocody', email: 'cocody@fimf.ci' },
  { id: 'us-abidjan', email: 'usabidjan@fimf.ci' },
  { id: 'afad', email: 'afad@fimf.ci' },
  { id: 'sol-fc', email: 'solfc@fimf.ci' },
];

// Mot de passe temporaire commun, à changer à la première connexion
const TEMP_PASSWORD = '***REMOVED***';

function slugToName(id) {
  return id
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

async function run() {
  if (!SBP) {
    console.error('Variable SBP manquante');
    process.exit(1);
  }

  if (!SECRET) {
    console.error('Variable SUPABASE_SECRET_KEY manquante (clé sb_secret_ du projet)');
    process.exit(1);
  }

  // 1. Lister les utilisateurs existants pour être idempotent
  const listRes = await fetch(`${URL}/auth/v1/admin/users?page=1&per_page=200`, {
    headers: { apikey: SECRET, Authorization: `Bearer ${SECRET}` },
  });
  const listJson = await listRes.json();
  const existing = new Map((listJson.users ?? []).map((u) => [u.email, u.id]));

  const links = [];

  for (const club of CLUBS) {
    let userId = existing.get(club.email);

    if (!userId) {
      const res = await fetch(`${URL}/auth/v1/admin/users`, {
        method: 'POST',
        headers: { apikey: SECRET, Authorization: `Bearer ${SECRET}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: club.email,
          password: TEMP_PASSWORD,
          email_confirm: true,
          user_metadata: { role: 'dirigeant', club_id: club.id, club: slugToName(club.id) },
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        console.error(`✗ ${club.email}: ${json.msg ?? JSON.stringify(json)}`);
        continue;
      }
      userId = json.id;
      console.log(`✓ compte créé ${club.email} (${userId})`);
    } else {
      console.log(`= compte existant ${club.email}`);
    }

    links.push({ user_id: userId, club_id: club.id, role: 'dirigeant' });
  }

  // 2. Lier les comptes dans club_users (idempotent)
  if (links.length > 0) {
    const sql =
      `insert into public.club_users (user_id, club_id, role) values\n` +
      links.map((l) => `  ('${l.user_id}', '${l.club_id}', '${l.role}')`).join(',\n') +
      `\n on conflict (user_id, club_id) do update set role = excluded.role;\n` +
      `select club_id, role from public.club_users order by club_id;`;

    const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${SBP}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: sql }),
    });
    const json = await res.json();
    console.log('\n--- LIAISONS club_users ---');
    console.log(JSON.stringify(json, null, 2));
  }
}

run();
