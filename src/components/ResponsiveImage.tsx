import React from 'react';
import { getHeroSource } from '@/src/lib/heroImages';

interface ResponsiveImageProps {
  /**
   * Nom du fichier source (ex: `hero_ivory_coast_minifootball_1790335944178.jpg`)
   * ou URL d'un asset bundlé. L'image est servie en WebP quand le navigateur
   * le supporte, dans la largeur adaptée au viewport.
   */
  name: string;
  alt: string;
  /** Classes CSS appliquées à l'élément `<img>`. */
  className?: string;
  /** Indication de largeur au navigateur (`sizes` de `srcset`). */
  sizes?: string;
  /**
   * true pour l'image LCP de la page : chargement prioritaire
   * (pas de lazy-loading, `fetchpriority="high"`).
   */
  priority?: boolean;
}

/**
 * Image « hero » servie en WebP/JPEG et à la bonne largeur.
 *
 * `<picture>` est en `display: contents` : l'<img> reste positionné par rapport
 * au conteneur parent (bandeaux en `absolute inset-0`), sans couche supplémentaire.
 */
export const ResponsiveImage: React.FC<ResponsiveImageProps> = ({
  name,
  alt,
  className,
  sizes = '100vw',
  priority = false,
}) => {
  const source = getHeroSource(name);

  // Image hors registre (photo servie par Supabase Storage) : on la rend telle
  // quelle plutôt que de ne rien afficher.
  if (!source) {
    return (
      <img
        src={name}
        alt={alt}
        className={className}
        loading={priority ? 'eager' : 'lazy'}
        decoding={priority ? 'sync' : 'async'}
        fetchPriority={priority ? 'high' : 'auto'}
        referrerPolicy="no-referrer"
      />
    );
  }

  return (
    <picture className="contents">
      {source.webpSrcSet && <source type="image/webp" srcSet={source.webpSrcSet} sizes={sizes} />}
      <img
        src={source.src}
        srcSet={source.srcSet}
        sizes={sizes}
        alt={alt}
        width={source.width}
        height={source.height}
        className={className}
        loading={priority ? 'eager' : 'lazy'}
        decoding={priority ? 'sync' : 'async'}
        fetchPriority={priority ? 'high' : 'auto'}
        referrerPolicy="no-referrer"
      />
    </picture>
  );
};
