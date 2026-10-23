/**
 * Limitation de débit des formulaires publics (audit sécurité FIMF, constat 13).
 *
 * Le quota réel est appliqué en base par le déclencheur `enforce_form_rate_limit`
 * (voir `supabase/rate-limit.sql`). Ce module ne fait que deux choses :
 *
 *  1. détecter l'erreur renvoyée par PostgreSQL et la traduire en message lisible ;
 *  2. éviter qu'un utilisateur légitime ne consomme son quota par des
 *     doubles clics ou des renvois de formulaire — le compteur local évite
 *     d'atteindre le serveur du tout.
 *
 * Le garde-fou local ne remplace pas celui de la base : il est contournable
 * (c'est du JavaScript client). C'est la base qui protège réellement.
 */

/** Quotas par défaut, alignés sur `supabase/rate-limit.sql`. */
const DEFAULT_LIMITS: Record<string, { max: number; windowMs: number }> = {
  member_requests: { max: 3, windowMs: 15 * 60 * 1000 },
  sponsor_requests: { max: 3, windowMs: 15 * 60 * 1000 },
};

const STORAGE_KEY = 'fimf.rate-limit';

interface Attempt {
  count: number;
  firstAt: number;
}

type Store = Record<string, Attempt>;

function readStore(): Store {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Store;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writeStore(store: Store): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // Mode navigation privée ou quota atteint : on ignore, la base protège.
  }
}

/**
 * Vrai si l'erreur renvoyée par Supabase correspond à un quota atteint.
 * Le déclencheur lève `raise exception 'RATE_LIMIT'` : PostgREST le relaie
 * tel quel dans le champ `message`.
 */
export function isRateLimitError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const err = error as { message?: unknown; code?: unknown };
  const message = typeof err.message === 'string' ? err.message : '';
  if (message.includes('RATE_LIMIT')) return true;
  // Codes Postgres : P0001 (raise_exception) sur un message générique.
  return err.code === 'P0001' && message.includes('Limite de');
}

/** Message affiché à l'utilisateur quand le quota est atteint. */
export const RATE_LIMIT_MESSAGE =
  'Trop de demandes envoyées depuis cet appareil. Réessayez dans quelques minutes.';

/** Formate une durée en secondes de façon lisible (« 2 min 30 s »). */
export function formatWait(seconds: number): string {
  if (seconds < 60) return `${seconds} s`;
  const minutes = Math.ceil(seconds / 60);
  return `${minutes} min`;
}

/**
 * Vérifie si l'utilisateur a déjà consommé son quota local.
 * Renvoie le nombre de secondes restantes, ou 0 si un envoi est possible.
 */
export function clientRateLimitRemaining(formKey: string, now = Date.now()): number {
  const limit = DEFAULT_LIMITS[formKey];
  if (!limit) return 0;
  const attempt = readStore()[formKey];
  if (!attempt) return 0;
  const elapsed = now - attempt.firstAt;
  if (elapsed >= limit.windowMs) return 0;
  if (attempt.count < limit.max) return 0;
  return Math.ceil((limit.windowMs - elapsed) / 1000);
}

/** Enregistre un envoi local. À appeler après un envoi accepté par la base. */
export function recordClientAttempt(formKey: string, now = Date.now()): void {
  const limit = DEFAULT_LIMITS[formKey];
  if (!limit) return;
  const store = readStore();
  const attempt = store[formKey];
  if (!attempt || now - attempt.firstAt >= limit.windowMs) {
    store[formKey] = { count: 1, firstAt: now };
  } else {
    store[formKey] = { count: attempt.count + 1, firstAt: attempt.firstAt };
  }
  writeStore(store);
}
