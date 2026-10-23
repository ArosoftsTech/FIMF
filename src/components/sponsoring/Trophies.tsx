import React, { useId } from 'react';

/**
 * ─────────────────────────────────────────────────────────────
 * TROPHÉES DE SPONSORING — illustrations SVG vectorielles 100 %
 * intégrées au bundle (aucune image à télécharger → chargement
 * rapide, rendu net sur tous les écrans).
 *
 * Les dégradés métalliques (bronze, argent, or) et le cristal du
 * diamant sont autorisés UNIQUEMENT sur les trophées eux-mêmes ;
 * les socles restent dans la charte FIMF (vert institutionnel).
 * ─────────────────────────────────────────────────────────────
 */

/** Tailles SVG gérées par la grille de packages (progression visuelle). */
export type TrophySize = 'sm' | 'md' | 'lg' | 'xl';

const SIZE_CLASS: Record<TrophySize, string> = {
  sm: 'w-24 h-24',
  md: 'w-28 h-28',
  lg: 'w-32 h-32',
  xl: 'w-36 h-36 md:w-44 md:h-44',
};

/** Classes Tailwind par palier, exposées pour les cartes & aperçus admin. */
export const TROPHY_SIZE_CLASS: Record<TrophySize, string> = SIZE_CLASS;

interface TrophyProps {
  /** Classes Tailwind de taille (défaut selon le palier). */
  className?: string;
  /** Texte d'accessibilité (role="img"). */
  label?: string;
}

/** Dégradés : métal par palier + socle institutionnel commun. */
const GRADIENTS: Record<
  'bronze' | 'argent' | 'or',
  { metal: string[]; metalLight: string[] }
> = {
  bronze: { metal: ['#e3a063', '#b06a2c', '#7c4518'], metalLight: ['#f0c496', '#c98545'] },
  argent: { metal: ['#f4f7f9', '#c3ccd3', '#8b98a1'], metalLight: ['#ffffff', '#dbe3e8'] },
  or: { metal: ['#ffe9a8', '#f5b821', '#a66d12'], metalLight: ['#fff7d6', '#ffd764'] },
};

const Defs: React.FC<{ id: string; metal: (typeof GRADIENTS)['bronze'] }> = ({ id, metal }) => (
  <defs>
    <linearGradient id={`${id}-metal`} x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stopColor={metal.metal[0]} />
      <stop offset="45%" stopColor={metal.metal[1]} />
      <stop offset="100%" stopColor={metal.metal[2]} />
    </linearGradient>
    <linearGradient id={`${id}-metal-light`} x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stopColor={metal.metalLight[0]} />
      <stop offset="100%" stopColor={metal.metalLight[1]} />
    </linearGradient>
    {/* Socle : vert FIMF (charte, non métallique) */}
    <linearGradient id={`${id}-socle`} x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stopColor="#0b4d29" />
      <stop offset="100%" stopColor="#003419" />
    </linearGradient>
    <linearGradient id={`${id}-socle-dark`} x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stopColor="#053018" />
      <stop offset="100%" stopColor="#021609" />
    </linearGradient>
  </defs>
);

/** Socle institutionnel commun (tige, collerette, base, plinthe). */
const Socle: React.FC<{ id: string }> = ({ id }) => (
  <g>
    <rect x="76" y="78" width="8" height="12" fill={`url(#${id}-socle-dark)`} />
    <rect x="68" y="88" width="24" height="8" rx="3" fill={`url(#${id}-socle)`} />
    <path d="M58 96 L102 96 L107 116 L53 116 Z" fill={`url(#${id}-socle)`} />
    <rect x="49" y="116" width="62" height="12" rx="4" fill={`url(#${id}-socle-dark)`} />
    <rect x="49" y="116" width="62" height="4" rx="2" fill="#ffffff" opacity="0.14" />
  </g>
);

/* ═══════════════════ Coupe commune (Bronze / Argent / Or) ═══════════════════ */

interface CupProps {
  id: string;
  /** Étoiles gravées sur la coupe (croît avec le prestige). */
  stars: 0 | 1 | 2;
  /** Opacité du reflet vertical sur la coupe. */
  gloss?: number;
}

const Cup: React.FC<CupProps> = ({ id, stars, gloss = 0.35 }) => (
  <g>
    {/* Coupe */}
    <path d="M46 30 C46 56 57 76 80 80 C103 76 114 56 114 30 Z" fill={`url(#${id}-metal)`} />
    {/* Bord supérieur */}
    <ellipse cx="80" cy="30" rx="34" ry="7" fill={`url(#${id}-metal-light)`} />
    <ellipse cx="80" cy="30" rx="26" ry="4.5" fill="#66441b" opacity="0.24" />
    {/* Reflet vertical */}
    <path d="M55 38 C55 55 62 68 71 73 C60 66 53 52 53 38 Z" fill="#ffffff" opacity={gloss} />
    {/* Anses */}
    <path
      d="M48 40 C33 40 26 50 31 59 C34 65 41 69 50 70"
      fill="none"
      stroke={`url(#${id}-metal)`}
      strokeWidth="9"
      strokeLinecap="round"
    />
    <path
      d="M112 40 C127 40 134 50 129 59 C126 65 119 69 110 70"
      fill="none"
      stroke={`url(#${id}-metal)`}
      strokeWidth="9"
      strokeLinecap="round"
    />
    {/* Étoiles gravées (~50% d'opacité) */}
    {stars >= 1 && (
      <path
        d="M80 42 L82.1 48.1 L88.6 48.2 L83.4 52.1 L85.3 58.3 L80 54.6 L74.7 58.3 L76.6 52.1 L71.4 48.2 L77.9 48.1 Z"
        fill="#ffffff"
        opacity="0.5"
      />
    )}
    {stars >= 2 && (
      <>
        <path
          d="M65 53 L66.2 56.4 L69.8 56.5 L66.9 58.6 L67.9 62 L65 60 L62.1 62 L63.1 58.6 L60.2 56.5 L63.8 56.4 Z"
          fill="#ffffff"
          opacity="0.45"
        />
        <path
          d="M95 53 L96.2 56.4 L99.8 56.5 L96.9 58.6 L97.9 62 L95 60 L92.1 62 L93.1 58.6 L90.2 56.5 L93.8 56.4 Z"
          fill="#ffffff"
          opacity="0.45"
        />
      </>
    )}
  </g>
);

/** Coupe métallique paramétrée par palier + socle. */
const MetalTrophy: React.FC<{
  id: string;
  tier: 'bronze' | 'argent' | 'or';
  stars: 0 | 1 | 2;
  gloss: number;
  sparkle?: boolean;
  laurel?: boolean;
}> = ({ id, tier, stars, gloss, sparkle, laurel }) => (
  <>
    <Defs id={id} metal={GRADIENTS[tier]} />
    {laurel && (
      <g opacity="0.9">
        <path d="M34 66 C30 76 34 84 42 88 C38 80 38 72 40 64 Z" fill={`url(#${id}-metal)`} />
        <path d="M126 66 C130 76 126 84 118 88 C122 80 122 72 120 64 Z" fill={`url(#${id}-metal)`} />
      </g>
    )}
    <Socle id={id} />
    <Cup id={id} stars={stars} gloss={gloss} />
    {sparkle && (
      <path
        d="M63 17 L64.8 22.6 L70.6 22.5 L65.9 25.9 L67.7 31.5 L63 28 L58.3 31.5 L60.2 25.9 L55.4 22.5 L61.2 22.6 Z"
        fill="#ffffff"
        opacity="0.65"
      />
    )}
  </>
);

/* ═══════════════════ Composants exportés ═══════════════════ */

/** Trophée BRONZE — niveau d'entrée (le plus discret). */
export const BronzeTrophy: React.FC<TrophyProps> = ({
  className = SIZE_CLASS.sm,
  label = 'Trophée Bronze',
}) => {
  const id = useId().replace(/:/g, '');
  return (
    <svg viewBox="0 0 160 140" role="img" aria-label={label} className={className}>
      <title>{label}</title>
      <MetalTrophy id={id} tier="bronze" stars={0} gloss={0.26} />
    </svg>
  );
};

/** Trophée ARGENT — coupe éclatante aux reflets froids. */
export const SilverTrophy: React.FC<TrophyProps> = ({
  className = SIZE_CLASS.md,
  label = 'Trophée Argent',
}) => {
  const id = useId().replace(/:/g, '');
  return (
    <svg viewBox="0 0 160 140" role="img" aria-label={label} className={className}>
      <title>{label}</title>
      <MetalTrophy id={id} tier="argent" stars={1} gloss={0.42} />
    </svg>
  );
};

/** Trophée OR — le plus paré : double étoile, laurier et éclat. */
export const GoldTrophy: React.FC<TrophyProps> = ({
  className = SIZE_CLASS.xl,
  label = 'Trophée Or',
}) => {
  const id = useId().replace(/:/g, '');
  return (
    <svg viewBox="0 0 160 140" role="img" aria-label={label} className={className}>
      <title>{label}</title>
      <MetalTrophy id={id} tier="or" stars={2} gloss={0.5} sparkle laurel />
    </svg>
  );
};

/** Trophée DIAMANT — cristal facetté, le plus prestigieux. */
export const DiamondTrophy: React.FC<TrophyProps> = ({
  className = SIZE_CLASS.lg,
  label = 'Trophée Diamant',
}) => {
  const id = useId().replace(/:/g, '');
  return (
    <svg viewBox="0 0 160 140" role="img" aria-label={label} className={className}>
      <title>{label}</title>
      <defs>
        <linearGradient id={`${id}-gem`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#eaf8ff" />
          <stop offset="45%" stopColor="#bfe3f7" />
          <stop offset="100%" stopColor="#7fb3dd" />
        </linearGradient>
        <linearGradient id={`${id}-gem-top`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#d9f1fc" />
        </linearGradient>
        <linearGradient id={`${id}-socle`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#0b4d29" />
          <stop offset="100%" stopColor="#003419" />
        </linearGradient>
        <linearGradient id={`${id}-socle-dark`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#053018" />
          <stop offset="100%" stopColor="#021609" />
        </linearGradient>
      </defs>
      <Socle id={id} />
      {/* Gemme à facettes */}
      <g>
        <path d="M44 60 L116 60 L80 116 Z" fill={`url(#${id}-gem)`} />
        <path d="M56 42 L104 42 L116 60 L44 60 Z" fill={`url(#${id}-gem-top)`} />
        <path d="M44 60 L64 60 L80 116 Z" fill="#ffffff" opacity="0.38" />
        <path d="M64 60 L96 60 L80 116 Z" fill="#6fa8d4" opacity="0.35" />
        <path d="M96 60 L116 60 L80 116 Z" fill="#5d93c2" opacity="0.3" />
        <path d="M70 50 L90 50 L94 60 L66 60 Z" fill="#ffffff" opacity="0.5" />
        <path
          d="M44 60 L116 60 M56 42 L64 60 L80 116 M104 42 L96 60 L80 116 M56 42 L80 60 L104 42"
          stroke="#ffffff"
          strokeWidth="1.6"
          opacity="0.55"
          fill="none"
        />
      </g>
      {/* Scintillements */}
      <path d="M58 24 L60 30 L66 32 L60 34 L58 40 L56 34 L50 32 L56 30 Z" fill="#ffffff" opacity="0.9" />
      <path
        d="M104 45 L105 48.5 L108.5 49.5 L105 50.5 L104 54 L103 50.5 L99.5 49.5 L103 48.5 Z"
        fill="#ffffff"
        opacity="0.75"
      />
      <circle cx="88" cy="74" r="2.2" fill="#ffffff" opacity="0.8" />
    </svg>
  );
};

/** Sélecteur par palier pour les cartes de packages / le tableau. */
export const TROPHY_COMPONENTS: Record<'bronze' | 'argent' | 'or' | 'diamant', React.FC<TrophyProps>> = {
  bronze: BronzeTrophy,
  argent: SilverTrophy,
  or: GoldTrophy,
  diamant: DiamondTrophy,
};

/** Tailles par palier — plus le package est élevé, plus le trophée est imposant. */
export const TROPHY_SIZES: Record<'bronze' | 'argent' | 'or' | 'diamant', TrophySize> = {
  bronze: 'sm',
  argent: 'md',
  or: 'xl',
  diamant: 'lg',
};
