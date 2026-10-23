import type { NavPage } from '../components/Navbar';

/**
 * ─────────────────────────────────────────────────────────────
 * Mini-routeur FIMF — synchronise la navigation interne (état
 * React) avec l'URL du navigateur, pour des liens profonds
 * propres : /sponsoring, /contact, /la-fimf?tab=partenaires…
 *
 * Principes :
 * - Une seule table PAGE_ROUTES (page → chemin) sert à écrire
 *   les URLs ; la lecture se fait par simple inversion.
 * - Le routage utilise l'API History (pushState / popstate) et
 *   accepte en secours le format hash « #/sponsoring » pour les
 *   hébergements statiques sans réécriture d'URL.
 * - La page « article » (objet dynamique passé via l'état) garde
 *   l'URL courante : aucun pushState ne lui est associé.
 * ─────────────────────────────────────────────────────────────
 */

/** Chemin canonique de chaque page (clé : identifiant NavPage). */
const PAGE_ROUTES: Partial<Record<NavPage, string>> = {
  accueil: '/',
  'la-fimf': '/la-fimf',
  championnat: '/championnat',
  calendrier: '/calendrier',
  competitions: '/competitions',
  equipes: '/equipes',
  classement: '/classement',
  actualites: '/actualites',
  galerie: '/galerie',
  contact: '/contact',
  membre: '/espace-membre',
  sponsoring: '/sponsoring',
  admin: '/admin',
};

/** Table inversée (chemin → page) construite une seule fois. */
const ROUTE_TO_PAGE: Record<string, NavPage> = Object.fromEntries(
  Object.entries(PAGE_ROUTES).map(([page, route]) => [route, page as NavPage]),
);

// ── Métadonnées SEO par page (title + description) ────────────

const PAGE_META: Record<NavPage, { title: string; description: string }> = {
  accueil: {
    title: 'FIMF - Fédération Ivoirienne de Mini-Football',
    description:
      "Portail officiel de la Fédération Ivoirienne de Mini-Football (FIMF) : championnats, classements, clubs, actualités et compétitions.",
  },
  'la-fimf': {
    title: 'La FIMF - Présentation & missions | FIMF',
    description:
      'Découvrez la Fédération Ivoirienne de Mini-Football : histoire, missions, organes, dirigeants et échéances internationales.',
  },
  championnat: {
    title: 'Championnat National | FIMF',
    description:
      'Le championnat national de mini football 2026 : calendrier, classements, résultats et équipes engagées.',
  },
  calendrier: {
    title: 'Calendrier des matchs | FIMF',
    description: 'Toutes les journées et rencontres du mini football ivoirien, en direct.',
  },
  competitions: {
    title: 'Compétitions | FIMF',
    description:
      'Championnat national, coupe nationale, sélections et compétitions internationales de la FIMF.',
  },
  equipes: {
    title: 'Équipes & Clubs | FIMF',
    description: 'Les clubs affiliés à la Fédération Ivoirienne de Mini-Football.',
  },
  classement: {
    title: 'Classements | FIMF',
    description: 'Classements en direct de toutes les divisions du mini football ivoirien.',
  },
  actualites: {
    title: 'Actualités | FIMF',
    description: "Toute l'actualité du mini football ivoirien : matchs, clubs et fédération.",
  },
  galerie: {
    title: 'Galerie photos | FIMF',
    description: 'Les plus belles images du mini football ivoirien.',
  },
  contact: {
    title: 'Contact | FIMF',
    description: 'Contactez la Fédération Ivoirienne de Mini-Football : siège, téléphones et email.',
  },
  sponsoring: {
    title: 'Sponsoring & Partenariat | FIMF',
    description:
      "Devenez partenaire officiel de la FIMF : packages Argent, Or et Diamant, visibilité nationale en Côte d'Ivoire et impact sur la jeunesse. Demande de partenariat en 2 minutes.",
  },
  membre: {
    title: 'Espace membre | FIMF',
    description: "L'espace réservé aux membres et supporters de la FIMF.",
  },
  admin: {
    title: 'Administration | FIMF',
    description: 'Tableau de bord réservé aux administrateurs de la FIMF.',
  },
  article: {
    title: 'Article | FIMF',
    description: "Lecture d'un article du portail officiel de la FIMF.",
  },
};

/** Applique title + description (et OG) pour la page courante. */
export function applyPageMeta(page: NavPage): void {
  const meta = PAGE_META[page] ?? PAGE_META.accueil;
  document.title = meta.title;
  const setOrGet = (selector: string, value: string) => {
    const el = document.querySelector(selector);
    if (el?.setAttribute) el.setAttribute('content', value);
  };
  setOrGet('meta[name="description"]', meta.description);
  setOrGet('meta[property="og:title"]', meta.title);
  setOrGet('meta[property="og:description"]', meta.description);
}

// ── Lecture de l'URL ──────────────────────────────────────────

export interface ResolvedNavigation {
  page: NavPage;
  subTab?: string;
}

/** Extrait la page (et le sous-onglet `?tab=`) de l'URL courante. */
export function resolveNavigationFromUrl(): ResolvedNavigation {
  if (typeof window === 'undefined') return { page: 'accueil' };

  // 1) pathname prioritaire (ex : /sponsoring)
  let path = window.location.pathname.replace(/\/+$/, '') || '/';
  // 2) secours hash « #/sponsoring » (hébergement sans réécriture)
  if (path === '/' && /^#\/?[\w-]/i.test(window.location.hash)) {
    path = window.location.hash.slice(1).replace(/\/+$/, '') || '/';
  }
  const [raw, query] = path.split('?');
  const subTab = new URLSearchParams(query ?? '').get('tab') ?? undefined;
  // Chemin d'accueil ou inconnu / article direct → accueil
  return { page: ROUTE_TO_PAGE[raw] ?? 'accueil', subTab: subTab || undefined };
}

// ── Écriture de l'URL ─────────────────────────────────────────

/**
 * Pousse l'URL canonique de la page dans l'historique du navigateur.
 * No-op pour « article » (état dynamique sans URL dédiée). Si l'API
 * History n'est pas disponible (iframe restreinte), bascule sur le hash.
 */
export function pushNavigationUrl(page: NavPage, subTab?: string): void {
  const route = PAGE_ROUTES[page];
  if (!route) return; // pas d'URL dédiée (ex : page article)

  const url = subTab ? `${route}?tab=${encodeURIComponent(subTab)}` : route;
  if (window.location.pathname + window.location.search === url) return; // déjà en place

  try {
    window.history.pushState({ page, subTab }, '', url);
  } catch {
    // Secours : format hash, toujoursExecutable côté client
    window.location.hash = url;
  }
}
