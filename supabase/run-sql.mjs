// Exécute le schéma SQL FIMF sur Supabase via l'API de management
// Usage: node supabase/run-sql.mjs [fichier.sql]
import { readFileSync } from 'node:fs';

const PROJECT_REF = 'qyyclgiiecertaantjna';
const ACCESS_TOKEN = process.env.SBP;

if (!ACCESS_TOKEN) {
  console.error('Erreur: variable SBP manquante');
  process.exit(1);
}

const file = process.argv[2] ?? 'supabase/setup.sql';
const sql = readFileSync(file, 'utf8');

const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${ACCESS_TOKEN}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ query: sql }),
});

const text = await res.text();

if (!res.ok) {
  console.error(`Échec HTTP ${res.status}:`, text.slice(0, 2000));
  process.exit(1);
}

try {
  console.log(JSON.stringify(JSON.parse(text), null, 2));
} catch {
  console.log(text.slice(0, 4000));
}
