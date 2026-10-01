// Test RLS de bout en bout : simule un dirigeant de club et un admin fédéral
// Usage: node supabase/test-rls.mjs   (lit VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY dans .env.local)
import fs from 'node:fs';

const env = Object.fromEntries(
  fs
    .readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
    .split(/\r?\n/)
    .filter((l) => l.includes('='))
    .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()])
);

const SUPABASE_URL = env.VITE_SUPABASE_URL || 'https://qyyclgiiecertaantjna.supabase.co';
const ANON = env.VITE_SUPABASE_ANON_KEY;

if (!ANON) {
  console.error('Clé anon (publishable) introuvable dans .env.local');
  process.exit(1);
}

let failures = 0;

function check(label, ok, detail = '') {
  console.log(`${ok ? '✓' : '✗ ÉCHEC'} ${label}${detail ? ` — ${detail}` : ''}`);
  if (!ok) failures++;
}

async function signIn(email, password) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: ANON, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(`Connexion ${email} impossible: ${json.error_description ?? json.msg ?? res.status}`);
  return json.access_token;
}

function rest(token) {
  return async (method, path, body) => {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
      method,
      headers: {
        apikey: ANON,
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    let json = null;
    try {
      json = await res.json();
    } catch {
      /* réponse vide */
    }
    return { status: res.status, json };
  };
}

// ---------------------------------------------------------------------
console.log('=== 1. DIRIGEANT as-plateau (plateau@fimf.ci) ===');
const dirToken = await signIn('plateau@fimf.ci', '***REMOVED***');
const dir = rest(dirToken);

// 1a. Lecture publique : il voit tous les clubs
let r = await dir('GET', 'clubs?select=id&order=id');
check('Lecture de tous les clubs (public)', r.status === 200 && r.json.length === 8, `${r.json?.length} clubs`);

// 1b. Il peut modifier SON club
r = await dir('GET', 'clubs?id=eq.as-plateau&select=stadium');
const originalStadium = r.json[0]?.stadium;
r = await dir('PATCH', 'clubs?id=eq.as-plateau', { stadium: 'Terrain Test RLS (plateau)' });
check(
  'Modification de SON club (as-plateau)',
  r.status === 200 && r.json?.length === 1 && r.json[0].stadium.includes('plateau'),
  `status=${r.status}`
);

// 1c. Il NE peut PAS modifier le club d'un autre
r = await dir('GET', 'clubs?id=eq.fc-riviera&select=stadium');
const rivieraStadium = r.json[0]?.stadium;
r = await dir('PATCH', 'clubs?id=eq.fc-riviera', { stadium: 'PIRATAGE RLS' });
check(
  'Modification d\'un club étranger refusée (fc-riviera)',
  r.status === 200 && r.json?.length === 0 && (await dir('GET', 'clubs?id=eq.fc-riviera&select=stadium')).json[0].stadium === rivieraStadium,
  `status=${r.status}, lignes modifiées=${r.json?.length}`
);

// 1d. Il peut créer un match impliquant SON club
const testMatchId = `rls-test-${Date.now()}`;
r = await dir('POST', 'matches', {
  id: testMatchId,
  journee: 99,
  date_str: 'Test RLS',
  time_str: '00:00',
  home_team_id: 'as-plateau',
  away_team_id: 'fc-riviera',
  venue: 'Terrain Test RLS',
  status: 'scheduled',
});
check('Création d\'un match impliquant son club', r.status === 201, `status=${r.status}`);

// 1e. Il NE peut PAS créer un match entre deux autres clubs
r = await dir('POST', 'matches', {
  id: `rls-test-fk-${Date.now()}`,
  journee: 99,
  date_str: 'Test RLS',
  time_str: '00:00',
  home_team_id: 'fc-cocody',
  away_team_id: 'sc-marcory',
  venue: 'Terrain Test RLS',
  status: 'scheduled',
});
check('Création d\'un match entre deux autres clubs refusée', r.status >= 400, `status=${r.status}`);

// 1f. Il NE peut PAS créer de contenu fédéral (news)
r = await dir('POST', 'news_articles', {
  id: `rls-test-news-${Date.now()}`,
  title: 'Test RLS',
  category: 'Test',
  date_str: 'Test',
  timestamp: '2026-09-26',
  content: [],
  tags: [],
});
check('Création d\'une actualité fédérale refusée', r.status >= 400, `status=${r.status}`);

// ---------------------------------------------------------------------
console.log('\n=== 2. ADMIN FÉDÉRAL (admin@fimf.ci) ===');
const admToken = await signIn('admin@fimf.ci', process.env.ADMIN_PASSWORD ?? '***REMOVED***');
const adm = rest(admToken);

// 2a. Il peut modifier n'importe quel club
r = await adm('PATCH', 'clubs?id=eq.fc-riviera', { stadium: `${rivieraStadium} (admin)` });
check('Admin : modification du club fc-riviera', r.status === 200 && r.json?.length === 1, `status=${r.status}`);

// 2b. Il peut créer du contenu fédéral
const testNewsId = `rls-test-news-admin-${Date.now()}`;
r = await adm('POST', 'news_articles', {
  id: testNewsId,
  title: 'Test RLS admin',
  category: 'Test',
  date_str: 'Test',
  timestamp: '2026-09-26',
  content: [],
  tags: [],
});
check('Admin : création d\'une actualité', r.status === 201, `status=${r.status}`);

// 2c. Il voit le journal d'audit
r = await adm('GET', 'audit_logs?select=id&limit=3');
check('Admin : lecture du journal d\'audit', r.status === 200 && Array.isArray(r.json), `status=${r.status}`);

// ---------------------------------------------------------------------
console.log('\n=== 3. NETTOYAGE ===');
let c = await adm('DELETE', `matches?id=eq.${testMatchId}`);
check('Suppression du match de test', c.status >= 200 && c.status < 300, `status=${c.status}`);
c = await adm('DELETE', `news_articles?id=eq.${testNewsId}`);
check('Suppression de l\'article de test', c.status >= 200 && c.status < 300, `status=${c.status}`);
c = await adm('PATCH', 'clubs?id=eq.as-plateau', { stadium: originalStadium });
check('Restauration du stade as-plateau', c.status === 200, `status=${c.status}`);
c = await adm('PATCH', 'clubs?id=eq.fc-riviera', { stadium: rivieraStadium });
check('Restauration du stade fc-riviera', c.status === 200, `status=${c.status}`);

console.log(failures === 0 ? '\n✅ Tous les tests RLS passent' : `\n❌ ${failures} test(s) RLS en échec`);
process.exit(failures === 0 ? 0 : 1);
