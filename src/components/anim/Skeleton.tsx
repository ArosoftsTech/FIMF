import React from 'react';

interface SkeletonProps {
  className?: string;
}

/**
 * Bloc de chargement (shimmer) : réserve l'espace du contenu
 * (pas de CLS) en attendant les données. Animation d'opacité
 * uniquement, désactivée en `prefers-reduced-motion`.
 */
export const Skeleton: React.FC<SkeletonProps> = ({ className = '' }) => (
  <div aria-hidden="true" className={`fimf-skeleton ${className}`} />
);

/** Carte de match en chargement (même gabarit qu'une ligne de résultat). */
export const MatchSkeleton: React.FC = () => (
  <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3" aria-hidden="true">
    <div className="flex items-center justify-between">
      <Skeleton className="h-3 w-28 rounded" />
      <Skeleton className="h-3 w-16 rounded" />
    </div>
    <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2">
      <Skeleton className="h-5 rounded justify-self-end w-3/4" />
      <Skeleton className="h-7 w-16 rounded-md" />
      <Skeleton className="h-5 rounded w-3/4" />
    </div>
    <Skeleton className="h-3 w-40 rounded" />
  </div>
);
