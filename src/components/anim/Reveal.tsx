import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import {
  ANIM,
  EASE_SIGNATURE,
  REVEAL_AMOUNT,
  revealVariants,
  staggerDelay,
  useIsMobile,
  type RevealDirection,
} from '@/src/lib/anim';

interface RevealProps {
  children: React.ReactNode;
  /** Direction d'entrée : 'up' (défaut), 'left', 'right' (blocs texte+image), 'none' (fondu seul). */
  direction?: RevealDirection;
  /** Délai additionnel en secondes (cascade manuelle). */
  delay?: number;
  className?: string;
  /** Élément HTML rendu (défaut 'div'). */
  as?: 'div' | 'section' | 'li' | 'span';
}

/**
 * Apparition au défilement : fondu + translation, une seule fois,
 * seuil ~15 %. Transform + opacity uniquement (pas de CLS).
 * En `prefers-reduced-motion` : simple fondu, sans décalage.
 */
export const Reveal: React.FC<RevealProps> = ({
  children,
  direction = 'up',
  delay = 0,
  className,
  as = 'div',
}) => {
  const reduceMotion = useReducedMotion() ?? false;
  const isMobile = useIsMobile();
  const variants = revealVariants(direction, reduceMotion, isMobile);
  const MotionTag = (motion as unknown as Record<string, React.ElementType>)[as] ?? motion.div;

  return (
    <MotionTag
      className={className}
      variants={variants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: REVEAL_AMOUNT }}
      transition={{ delay: reduceMotion ? 0 : delay }}
    >
      {children}
    </MotionTag>
  );
};

interface StaggerProps {
  children: React.ReactNode;
  className?: string;
  /** Élément conteneur rendu (défaut 'div'). */
  as?: 'div' | 'ul';
}

/**
 * Groupe en cascade : chaque `StaggerItem` enfant entre avec un
 * décalage de ~90 ms, plafonné à 6 éléments. Déclenchement unique.
 */
export const Stagger: React.FC<StaggerProps> = ({ children, className, as = 'div' }) => {
  const MotionTag = (motion as unknown as Record<string, React.ElementType>)[as] ?? motion.div;
  return (
    <MotionTag
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: REVEAL_AMOUNT }}
      variants={{ hidden: {}, visible: { transition: { staggerChildren: ANIM.stagger } } }}
    >
      {children}
    </MotionTag>
  );
};

interface StaggerItemProps {
  children: React.ReactNode;
  className?: string;
  direction?: RevealDirection;
  /** Position dans le groupe (plafonne le décalage cumulé à 6 éléments). */
  index?: number;
  as?: 'div' | 'li';
}

/** Élément d'un groupe `Stagger` — ne pas utiliser hors d'un `Stagger`. */
export const StaggerItem: React.FC<StaggerItemProps> = ({
  children,
  className,
  direction = 'up',
  index = 0,
  as = 'div',
}) => {
  const reduceMotion = useReducedMotion() ?? false;
  const isMobile = useIsMobile();
  const capped = Math.min(index, ANIM.staggerCap - 1);
  const variants = revealVariants(direction, reduceMotion, isMobile);
  const MotionTag = (motion as unknown as Record<string, React.ElementType>)[as] ?? motion.div;

  return (
    <MotionTag
      className={className}
      variants={{
        hidden: variants.hidden,
        visible: {
          ...(typeof variants.visible === 'object' ? variants.visible : {}),
          transition: {
            duration: ANIM.reveal,
            ease: [...EASE_SIGNATURE],
            delay: staggerDelay(capped, reduceMotion),
          },
        },
      }}
    >
      {children}
    </MotionTag>
  );
};
