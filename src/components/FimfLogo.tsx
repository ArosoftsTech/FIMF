import React from 'react';

interface FimfLogoProps {
  variant?: 'light' | 'dark';
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

export const FimfLogo: React.FC<FimfLogoProps> = ({
  variant = 'dark',
  size = 'md',
  showText = true,
  className = '',
}) => {
  const isLight = variant === 'light';

  const badgeSize = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10 md:w-11 md:h-11',
    lg: 'w-14 h-14',
  }[size];

  return (
    <div className={`flex items-center gap-2.5 sm:gap-3 select-none ${className}`}>
      {/* Official circular FIMF emblem */}
      <div className={`relative ${badgeSize} shrink-0`}>
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-sm">
          {/* Outer circle */}
          <circle cx="50" cy="50" r="47" fill="#006039" stroke="#ea580c" strokeWidth="3" />
          <circle cx="50" cy="50" r="41" fill="#ffffff" />
          
          {/* Soccer ball pattern with Ivorian orange & green segments */}
          <circle cx="50" cy="50" r="33" fill="#f8fafc" stroke="#0f172a" strokeWidth="2.5" />
          {/* Central pentagon */}
          <polygon points="50,38 60,45 56,58 44,58 40,45" fill="#006039" />
          {/* Connecting seams */}
          <line x1="50" y1="38" x2="50" y2="22" stroke="#0f172a" strokeWidth="2" />
          <line x1="60" y1="45" x2="74" y2="40" stroke="#0f172a" strokeWidth="2" />
          <line x1="56" y1="58" x2="68" y2="70" stroke="#0f172a" strokeWidth="2" />
          <line x1="44" y1="58" x2="32" y2="70" stroke="#0f172a" strokeWidth="2" />
          <line x1="40" y1="45" x2="26" y2="40" stroke="#0f172a" strokeWidth="2" />

          {/* Mini-orange flash on side */}
          <path d="M 68,26 Q 80,45 74,66" stroke="#ea580c" strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M 26,66 Q 20,45 28,26" stroke="#006039" strokeWidth="3" fill="none" strokeLinecap="round" />

          {/* Miniature banner arch */}
          <rect x="25" y="76" width="50" height="15" rx="3" fill="#ea580c" />
          <text x="50" y="87" fill="#ffffff" fontSize="9" fontWeight="900" textAnchor="middle" letterSpacing="0.05em">
            FIMF
          </text>
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col justify-center leading-none">
          <span
            className={`font-black tracking-tight ${
              size === 'sm' ? 'text-lg' : size === 'lg' ? 'text-2xl' : 'text-xl'
            } ${isLight ? 'text-white' : 'text-[#064e3b]'}`}
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            FIMF
          </span>
          <span
            className={`text-[8.5px] sm:text-[9.5px] font-semibold tracking-wider uppercase ${
              isLight ? 'text-emerald-100/90' : 'text-slate-700'
            }`}
          >
            Fédération Ivoirienne
          </span>
          <span
            className={`text-[8.5px] sm:text-[9.5px] font-semibold tracking-wider uppercase ${
              isLight ? 'text-emerald-200/80' : 'text-slate-600'
            }`}
          >
            de Mini-Football
          </span>
        </div>
      )}
    </div>
  );
};
