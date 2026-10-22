import React, { useContext } from 'react';
import { FimfDataContext } from '../context/FimfDataContext';

interface ClubBadgeProps {
  id: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'match';
  className?: string;
  /** URL de logo prioritaire : aperçu en direct dans les formulaires (pas encore enregistré en base). */
  logoOverrideUrl?: string;
}

const sizeMap = {
  xs: 'w-5 h-5 text-[9px]',
  sm: 'w-7 h-7 text-[10px]',
  md: 'w-10 h-10 text-xs',
  lg: 'w-14 h-14 text-sm',
  xl: 'w-20 h-20 text-base',
  /** Taille fixe des lignes de match (grille stricte MatchRow : 32×32). */
  match: 'w-8 h-8 text-[10px]',
};

/**
 * Renvoie l'URL du logo uploadé d'un club (ou null si le club utilise le SVG).
 * `overrideUrl` permet à un formulaire admin d'afficher en direct un logo
 * pas encore enregistré en base.
 */
export function useClubLogoUrl(clubId: string | undefined, overrideUrl?: string): string | null {
  const ctx = useContext(FimfDataContext);
  const [imgFailed, setImgFailed] = React.useState(false);
  React.useEffect(() => setImgFailed(false), [overrideUrl]);

  const url = overrideUrl ?? ctx?.clubs.find((c) => c.id === clubId)?.logoUrl ?? null;
  if (!url || imgFailed) return null;
  return url;
}

/**
 * Badge de club. Si le club possède un logo officiel uploadé (clubs.logo_url),
 * il est affiché à la place du bouclier SVG par défaut, avec repli automatique
 * sur le SVG si l'image est cassée.
 */
export const ClubBadge: React.FC<ClubBadgeProps> = (props) => {
  const logoUrl = useClubLogoUrl(props.id, props.logoOverrideUrl);
  const [imgFailed, setImgFailed] = React.useState(false);
  React.useEffect(() => setImgFailed(false), [logoUrl]);

  if (logoUrl && !imgFailed) {
    return (
      <img
        src={logoUrl}
        alt={props.id}
        onError={() => setImgFailed(true)}
        className={`${sizeMap[props.size ?? 'md'].split(' ').slice(0, 2).join(' ')} object-contain shrink-0 ${props.className ?? ''}`}
      />
    );
  }
  return <ClubBadgeSvg {...props} />;
};

const ClubBadgeSvg: React.FC<ClubBadgeProps> = ({ id, size = 'md', className = '' }) => {
  // Dedicated heraldic athletic shields for each club
  switch (id) {
    case 'as-plateau':
      return (
        <div className={`relative flex items-center justify-center shrink-0 ${sizeMap[size]} ${className}`}>
          <svg viewBox="0 0 100 120" className="w-full h-full drop-shadow-sm">
            <defs>
              <linearGradient id="asPlateauGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#065f46" />
                <stop offset="100%" stopColor="#022c22" />
              </linearGradient>
            </defs>
            <path d="M 50,2 L 95,15 L 95,65 C 95,95 50,118 50,118 C 50,118 5,95 5,65 L 5,15 Z" fill="url(#asPlateauGrad)" stroke="#10b981" strokeWidth="4" />
            <path d="M 50,12 L 85,22 L 85,62 C 85,86 50,105 50,105 C 50,105 15,86 15,62 L 15,22 Z" fill="#047857" opacity="0.4" />
            {/* Plateau skyscraper tower & star */}
            <rect x="42" y="35" width="16" height="45" fill="#facc15" rx="2" />
            <polygon points="50,20 42,35 58,35" fill="#facc15" />
            <rect x="46" y="42" width="8" height="6" fill="#064e3b" />
            <rect x="46" y="53" width="8" height="6" fill="#064e3b" />
            <rect x="46" y="64" width="8" height="6" fill="#064e3b" />
            <circle cx="50" cy="92" r="6" fill="#ffffff" />
            <path d="M 46,92 L 54,92 M 50,88 L 50,96" stroke="#064e3b" strokeWidth="1.5" />
          </svg>
        </div>
      );

    case 'fc-riviera':
      return (
        <div className={`relative flex items-center justify-center shrink-0 ${sizeMap[size]} ${className}`}>
          <svg viewBox="0 0 100 120" className="w-full h-full drop-shadow-sm">
            <defs>
              <linearGradient id="fcRivieraGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#0f766e" />
                <stop offset="100%" stopColor="#134e4a" />
              </linearGradient>
            </defs>
            <path d="M 50,2 L 95,15 L 95,65 C 95,95 50,118 50,118 C 50,118 5,95 5,65 L 5,15 Z" fill="url(#fcRivieraGrad)" stroke="#34d399" strokeWidth="4" />
            <path d="M 50,15 Q 75,40 50,65 Q 25,90 50,110" stroke="#f59e0b" strokeWidth="6" fill="none" strokeLinecap="round" />
            <circle cx="50" cy="40" r="14" fill="#ffffff" stroke="#0d9488" strokeWidth="3" />
            <polygon points="50,30 54,38 62,38 56,43 58,51 50,46 42,51 44,43 38,38 46,38" fill="#f59e0b" />
            <path d="M 30,78 Q 50,70 70,78" stroke="#ffffff" strokeWidth="3" fill="none" />
            <path d="M 32,84 Q 50,76 68,84" stroke="#ffffff" strokeWidth="3" fill="none" />
          </svg>
        </div>
      );

    case 'olympique-yop':
      return (
        <div className={`relative flex items-center justify-center shrink-0 ${sizeMap[size]} ${className}`}>
          <svg viewBox="0 0 100 120" className="w-full h-full drop-shadow-sm">
            <defs>
              <linearGradient id="yopGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#1d4ed8" />
                <stop offset="100%" stopColor="#1e3a8a" />
              </linearGradient>
            </defs>
            <path d="M 50,2 L 95,15 L 95,65 C 95,95 50,118 50,118 C 50,118 5,95 5,65 L 5,15 Z" fill="url(#yopGrad)" stroke="#60a5fa" strokeWidth="4" />
            {/* Olympic flame */}
            <path d="M 50,25 C 65,40 60,60 50,70 C 40,60 35,40 50,25 Z" fill="#f59e0b" />
            <path d="M 50,38 C 57,48 54,60 50,65 C 46,60 43,48 50,38 Z" fill="#ef4444" />
            <path d="M 35,75 L 65,75 L 58,95 L 42,95 Z" fill="#93c5fd" />
            <circle cx="50" cy="85" r="4" fill="#1e3a8a" />
          </svg>
        </div>
      );

    case 'sc-marcory':
      return (
        <div className={`relative flex items-center justify-center shrink-0 ${sizeMap[size]} ${className}`}>
          <svg viewBox="0 0 100 120" className="w-full h-full drop-shadow-sm">
            <defs>
              <linearGradient id="marcoryGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#b91c1c" />
                <stop offset="100%" stopColor="#450a0a" />
              </linearGradient>
            </defs>
            <path d="M 50,2 L 95,15 L 95,65 C 95,95 50,118 50,118 C 50,118 5,95 5,65 L 5,15 Z" fill="url(#marcoryGrad)" stroke="#f87171" strokeWidth="4" />
            {/* Panther / claw badge */}
            <polygon points="50,25 35,45 65,45" fill="#fef08a" />
            <circle cx="42" cy="55" r="5" fill="#ffffff" />
            <circle cx="58" cy="55" r="5" fill="#ffffff" />
            <circle cx="43" cy="55" r="2.5" fill="#000000" />
            <circle cx="57" cy="55" r="2.5" fill="#000000" />
            <path d="M 50,65 L 44,78 L 56,78 Z" fill="#ffffff" />
            <path d="M 30,85 Q 50,95 70,85" stroke="#ffffff" strokeWidth="4" fill="none" />
          </svg>
        </div>
      );

    case 'fc-cocody':
      return (
        <div className={`relative flex items-center justify-center shrink-0 ${sizeMap[size]} ${className}`}>
          <svg viewBox="0 0 100 120" className="w-full h-full drop-shadow-sm">
            <defs>
              <linearGradient id="cocodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#581c87" />
                <stop offset="100%" stopColor="#2e1065" />
              </linearGradient>
            </defs>
            <path d="M 50,2 L 95,15 L 95,65 C 95,95 50,118 50,118 C 50,118 5,95 5,65 L 5,15 Z" fill="url(#cocodyGrad)" stroke="#c084fc" strokeWidth="4" />
            {/* Crown of Cocody */}
            <polygon points="25,65 30,35 42,50 50,30 58,50 70,35 75,65" fill="#fbbf24" stroke="#d97706" strokeWidth="2" />
            <rect x="25" y="65" width="50" height="10" fill="#f59e0b" rx="2" />
            <circle cx="30" cy="35" r="3" fill="#ffffff" />
            <circle cx="50" cy="30" r="3.5" fill="#ffffff" />
            <circle cx="70" cy="35" r="3" fill="#ffffff" />
            <circle cx="50" cy="90" r="8" fill="#ffffff" stroke="#7e22ce" strokeWidth="2" />
          </svg>
        </div>
      );

    case 'us-abidjan':
      return (
        <div className={`relative flex items-center justify-center shrink-0 ${sizeMap[size]} ${className}`}>
          <svg viewBox="0 0 100 120" className="w-full h-full drop-shadow-sm">
            <defs>
              <linearGradient id="usAbidjanGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#1e293b" />
                <stop offset="100%" stopColor="#0f172a" />
              </linearGradient>
            </defs>
            <path d="M 50,2 L 95,15 L 95,65 C 95,95 50,118 50,118 C 50,118 5,95 5,65 L 5,15 Z" fill="url(#usAbidjanGrad)" stroke="#94a3b8" strokeWidth="4" />
            {/* Eagle wings */}
            <path d="M 20,45 Q 50,30 80,45 Q 50,60 20,45 Z" fill="#cbd5e1" />
            <polygon points="50,25 45,55 55,55" fill="#f59e0b" />
            <circle cx="50" cy="75" r="12" fill="#ffffff" stroke="#334155" strokeWidth="2.5" />
            <polygon points="50,68 53,73 59,73 54,77 56,83 50,79 44,83 46,77 41,73 47,73" fill="#f59e0b" />
          </svg>
        </div>
      );

    case 'afad':
      return (
        <div className={`relative flex items-center justify-center shrink-0 ${sizeMap[size]} ${className}`}>
          <svg viewBox="0 0 100 120" className="w-full h-full drop-shadow-sm">
            <defs>
              <linearGradient id="afadGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#047857" />
                <stop offset="100%" stopColor="#064e3b" />
              </linearGradient>
            </defs>
            <path d="M 50,2 L 95,15 L 95,65 C 95,95 50,118 50,118 C 50,118 5,95 5,65 L 5,15 Z" fill="url(#afadGrad)" stroke="#eab308" strokeWidth="4" />
            <circle cx="50" cy="48" r="22" fill="#ffffff" stroke="#15803d" strokeWidth="3" />
            <polygon points="50,32 54,43 66,43 56,50 60,61 50,54 40,61 44,50 34,43 46,43" fill="#eab308" />
            <rect x="25" y="80" width="50" height="12" fill="#eab308" rx="3" />
            <text x="50" y="89" fill="#064e3b" fontSize="9" fontWeight="bold" textAnchor="middle">AFAD</text>
          </svg>
        </div>
      );

    case 'sol-fc':
      return (
        <div className={`relative flex items-center justify-center shrink-0 ${sizeMap[size]} ${className}`}>
          <svg viewBox="0 0 100 120" className="w-full h-full drop-shadow-sm">
            <defs>
              <linearGradient id="solGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#c2410c" />
                <stop offset="100%" stopColor="#7c2d12" />
              </linearGradient>
            </defs>
            <path d="M 50,2 L 95,15 L 95,65 C 95,95 50,118 50,118 C 50,118 5,95 5,65 L 5,15 Z" fill="url(#solGrad)" stroke="#f97316" strokeWidth="4" />
            {/* Radiant Sun of Abobo */}
            <circle cx="50" cy="50" r="16" fill="#fde047" stroke="#ea580c" strokeWidth="3" />
            {/* Sun rays */}
            <path d="M 50,24 L 50,14 M 50,76 L 50,86 M 24,50 L 14,50 M 76,50 L 86,50 M 32,32 L 25,25 M 68,68 L 75,75 M 32,68 L 25,75 M 68,32 L 75,25" stroke="#fde047" strokeWidth="4" strokeLinecap="round" />
            <circle cx="50" cy="50" r="6" fill="#ea580c" />
            <text x="50" y="102" fill="#ffffff" fontSize="10" fontWeight="bold" textAnchor="middle">SOL</text>
          </svg>
        </div>
      );

    default:
      return (
        <div className={`flex items-center justify-center rounded-full bg-emerald-800 text-white font-bold ${sizeMap[size]} ${className}`}>
          FC
        </div>
      );
  }
};
