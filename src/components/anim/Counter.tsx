import React, { useEffect, useRef, useState } from 'react';
import { useInView, useReducedMotion } from 'motion/react';
import { ANIM } from '@/src/lib/anim';

interface CounterProps {
  /** Valeur affichée par le site, ex. '+ 100', '+ 2 000', '10', '98%'. */
  value: string;
  className?: string;
  /** Durée en secondes (défaut global 2 s). */
  duration?: number;
}

/** Extrait { cible numérique, préfixe, suffixe } depuis une valeur affichée. */
function parseValue(raw: string): { target: number; prefix: string; suffix: string } {
  const match = raw.match(/([^0-9]*)([0-9][0-9\s\u00a0.,]*)([^0-9]*)/);
  if (!match) return { target: 0, prefix: '', suffix: '' };
  const [, prefix, num, suffix] = match;
  const target = Number(num.replace(/[\s\u00a0.,]/g, '')) || 0;
  return { target, prefix, suffix };
}

/** Formate avec espaces fines insécables (fr-FR) : 2 000. */
function formatFr(n: number): string {
  return Math.round(n).toLocaleString('fr-FR');
}

/**
 * Compteur animé : part de 0 et monte jusqu'à la valeur en ~2 s
 * (easeOut), uniquement quand le bloc devient visible, une seule fois.
 * Chiffres tabulaires (pas de saut de largeur). Gère préfixe/suffixe.
 */
export const Counter: React.FC<CounterProps> = ({ value, className, duration = ANIM.counter }) => {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.4 });
  const reduceMotion = useReducedMotion() ?? false;
  const { target, prefix, suffix } = parseValue(value);
  const [display, setDisplay] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    if (!inView || started.current) return;
    started.current = true;
    if (reduceMotion || target === 0) {
      setDisplay(target);
      return;
    }
    let raf = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / (duration * 1000));
      // easeOutCubic : démarrage franc, arrivée douce.
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(target * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, reduceMotion, target, duration]);

  return (
    <span ref={ref} className={`tabular-nums ${className ?? ''}`}>
      {prefix}
      {formatFr(display)}
      {suffix}
    </span>
  );
};
