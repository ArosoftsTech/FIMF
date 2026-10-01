// Déploie une Edge Function via l'API de management Supabase (sans CLI Supabase).
// Usage :
//   SBP=<token> node supabase/deploy-function.mjs <nom-fonction> [chemin-fichier]
// Exemple :
//   SBP=sbp_... node supabase/deploy-function.mjs sponsor-notification
import { readFileSync } from 'node:fs';

const PROJECT_REF = 'qyyclgiiecertaantjna';
const ACCESS_TOKEN = process.env.SBP;
if (!ACCESS_TOKEN) {
  console.error('Erreur: variable SBP manquante');
  process.exit(1);
}

const name = process.argv[2];
const file = process.argv[3] ?? `supabase/functions/${name}/index.ts`;
if (!name) {
  console.error('Usage: node supabase/deploy-function.mjs <nom-fonction> [chemin-fichier]');
  process.exit(1);
}

const form = new FormData();
form.append(
  'metadata',
  JSON.stringify({
    name,
    entrypoint_path: 'index.ts',
    verify_jwt: false,
  }),
);
form.append('file', new Blob([readFileSync(file)], { type: 'text/plain' }), 'index.ts');

const res = await fetch(
  `https://api.supabase.com/v1/projects/${PROJECT_REF}/functions/deploy?slug=${encodeURIComponent(name)}`,
  {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${ACCESS_TOKEN}`,
    },
    body: form,
  },
);

const text = await res.text();
if (!res.ok) {
  console.error(`Échec HTTP ${res.status}:`, text.slice(0, 2000));
  process.exit(1);
}
console.log(text);
