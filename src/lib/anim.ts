import { useEffect, useRef, useState } from 'react';

/**
 * ─────────────────────────────────────────────────────────────
 * Système d'animation centralisé FIMF — SEUL endroit où ajuster
 * les durées, easings et décalages globaux du site.
 * ─────────────────────────────────────────────────────────────
 * Règles : on n'anime QUE transform + opacity (60 fps, CLS ≈ 0).
 * Le contenu reste présent dans le DOM même sans JS rapide :
 * les composants Reveal/Counter n'appliquent l'état initial
 * masqué qu'au montage (JS actif), jamais dans le HTML.
 */

// ── Durées (secondes pour motion, ms pour le CSS) ─────────────
export const ANIM = {
  /** Micro-interactions (hover, focus, press) */
  micro: 0.2,
  /** Transitions de page, dropdowns, modales */
  page: 0.25,
  /** Apparitions au défilement */
  reveal: 0.65,
  /** Cascade entre éléments d'un groupe */
  stagger: 0.09,
  /** Nombre max d'éléments décalés en cascade (évite l'attente) */
  staggerCap: 6,
  /** Compteurs animés */
  counter: 2.0,
  /** Hero : décalage entre les couches de texte */
  heroStep: 0.1,
  /** Hero : autoplay */
  heroAutoplay: 6000,
} as const;

// ── Easings partagés ──────────────────────────────────────────
/** Easing signature du site (apparitions, hero, reveals). */
export const EASE_SIGNATURE = [0.22, 1, 0.36, 1] as const;
/** Micro-interactions rapides. */
export const EASE_MICRO = 'easeOut' as const;

// ── Distances de translation ──────────────────────────────────
/** Desktop : 24px vers le haut. Mobile : 12–16px (voir Reveal). */
export const REVEAL_Y_DESKTOP = 24;
export const REVEAL_Y_MOBILE = 14;
/** Blocs « texte + image » : alternance horizontale. */
export const REVEAL_X = 32;

// ── Seuils ────────────────────────────────────────────────────
/** % de visibilité pour déclencher une apparition (once: true). */
export const REVEAL_AMOUNT = 0.15;

// ── Variantes motion partagées ────────────────────────────────

export type RevealDirection = 'up' | 'left' | 'right' | 'none';

export function revealVariants(
  direction: RevealDirection = 'up',
  reducedMotion: boolean = false,
  isMobile: boolean = false,
) {
  if (reducedMotion || direction === 'none') {
    return {
      hidden: { opacity: 0 },
      visible: { opacity: 1, transition: { duration: 0.3, ease: EASE_MICRO } },
    };
  }
  const y = isMobile ? REVEAL_Y_MOBILE : REVEAL_Y_DESKTOP;
  const offset =
    direction === 'up'
      ? { y }
      : direction === 'left'
        ? { x: -REVEAL_X }
        : { x: REVEAL_X };
  return {
    hidden: { opacity: 0, ...offset },
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      transition: { duration: ANIM.reveal, ease: [...EASE_SIGNATURE] },
    },
  };
}

/** Délai de cascade pour l'élément `index` (plafonné). Zéro si reduced-motion. */
export function staggerDelay(index: number, reducedMotion = false): number {
  if (reducedMotion) return 0;
  return Math.min(index, ANIM.staggerCap - 1) * ANIM.stagger;
}

// ── Hooks ─────────────────────────────────────────────────────

const MOBILE_QUERY = '(max-width: 767.98px)';
const REDUCED_QUERY = '(prefers-reduced-motion: reduce)';
const FINE_POINTER_QUERY = '(pointer: fine)';

/** true si l'utilisateur préfère la réduction des animations. */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(REDUCED_QUERY).matches,
  );
  useEffect(() => {
    const mq = window.matchMedia(REDUCED_QUERY);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return reduced;
}

/** true sur viewport mobile (<768px) — distances réduites, pas de parallaxe souris. */
export function useIsMobile(): boolean {
  const [mobile, setMobile] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(MOBILE_QUERY).matches,
  );
  useEffect(() => {
    const mq = window.matchMedia(MOBILE_QUERY);
    const onChange = () => setMobile(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return mobile;
}

/** true quand la page a défilé au-delà de `threshold` (header sticky compact). */
export function useScrolled(threshold = 8): boolean {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    let ticking = false;
    const update = () => {
      ticking = false;
      setScrolled(window.scrollY > threshold);
    };
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [threshold]);
  return scrolled;
}

/**
 * Parallaxe légère au scroll (desktop uniquement, transform 3D, rAF).
 * Retourne un ref à poser sur l'élément à déplacer et un ref à poser
 * sur la zone observée. `speed` en px par px de scroll (ex. 0.08).
 * Inactif si reduced-motion ou pointeur tactile.
 */
export function useScrollParallax(speed = 0.08): {
  targetRef: React.RefObject<HTMLDivElement | null>;
  zoneRef: React.RefObject<HTMLElement | null>;
} {
  const targetRef = useRef<HTMLDivElement | null>(null);
  const zoneRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const target = targetRef.current;
    const zone = zoneRef.current;
    if (!target || !zone) return;
    if (window.matchMedia(REDUCED_QUERY).matches) return;
    if (!window.matchMedia(FINE_POINTER_QUERY).matches) return;
    if (window.matchMedia(MOBILE_QUERY).matches) return;

    let raf = 0;
    const update = () => {
      raf = 0;
      const rect = zone.getBoundingClientRect();
      // Déplacement proportionnel à la position de la zone dans le viewport.
      const progress = rect.top + rect.height / 2 - window.innerHeight / 2;
      target.style.transform = `translate3d(0, ${(-progress * speed).toFixed(1)}px, 0)`;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [speed]);

  return { targetRef, zoneRef };
}

/**
 * Parallaxe au mouvement de souris (desktop + pointeur fin uniquement).
 * Applique une translation 3D douce (transform seulement) à la cible.
 * `max` = déplacement max en px. Inactif si reduced-motion.
 */
export function useMouseParallax<T extends HTMLElement>(max = 14): React.RefObject<T | null> {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia(REDUCED_QUERY).matches) return;
    if (!window.matchMedia(FINE_POINTER_QUERY).matches) return;

    let raf = 0;
    let tx = 0;
    let ty = 0;
    const render = () => {
      raf = 0;
      el.style.transform = `translate3d(${tx.toFixed(1)}px, ${ty.toFixed(1)}px, 0)`;
    };
    const onMove = (e: MouseEvent) => {
      const nx = e.clientX / window.innerWidth - 0.5;
      const ny = e.clientY / window.innerHeight - 0.5;
      tx = nx * max * 2;
      ty = ny * max * 2;
      if (!raf) raf = requestAnimationFrame(render);
    };
    window.addEventListener('mousemove', onMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', onMove);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [max]);

  return ref;
}
