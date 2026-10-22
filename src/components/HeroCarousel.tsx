import React, { useState, useEffect, useRef, useCallback } from 'react';
import { HeroSlide } from '@/src/data/fimfData';
import { mediaUrl } from '../lib/fimfApi';
import type { NavPage } from './Navbar';
import { ANIM, useMouseParallax, useScrollParallax } from '@/src/lib/anim';
import {
  Calendar,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface HeroCarouselProps {
  slides: HeroSlide[];
  onNavigate: (page: NavPage) => void;
}

/** Durée d'affichage d'une slide — pilotée par ANIM.heroAutoplay (src/lib/anim.ts). */
const SLIDE_INTERVAL = ANIM.heroAutoplay;

/**
 * Carrousel de la section hero (page d'accueil).
 * Rotation automatique toutes les 6 s, pause au survol, navigation par
 * points et flèches. Les slides proviennent du dashboard admin (table
 * hero_slides) avec repli statique géré par le contexte.
 */
export const HeroCarousel: React.FC<HeroCarouselProps> = ({ slides, onNavigate }) => {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const count = slides.length;

  const goNext = useCallback(() => {
    setIndex((i) => (count > 0 ? (i + 1) % count : 0));
  }, [count]);

  const goPrev = useCallback(() => {
    setIndex((i) => (count > 0 ? (i - 1 + count) % count : 0));
  }, [count]);

  // Rotation automatique (pause au survol ou slide unique)
  useEffect(() => {
    if (paused || count <= 1) return;
    timerRef.current = setInterval(goNext, SLIDE_INTERVAL);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [paused, count, goNext]);

  // Sécurise l'index si l'admin supprime des slides pendant l'affichage
  useEffect(() => {
    if (index >= count) setIndex(0);
  }, [count, index]);

  // Parallaxe : scroll sur les fonds + souris sur le contenu (desktop uniquement,
  // inactifs en reduced-motion / tactile — voir useScrollParallax/useMouseParallax).
  const { targetRef: bgParallaxRef, zoneRef: heroZoneRef } = useScrollParallax(0.06);
  const contentParallaxRef = useMouseParallax<HTMLDivElement>(10);

  // Flèches du clavier quand le carrousel a le focus.
  const onHeroKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight') goNext();
    else if (e.key === 'ArrowLeft') goPrev();
  };

  if (count === 0) return null;

  const slide = slides[Math.min(index, count - 1)];

  const handleCta = (page?: string) => {
    if (page) onNavigate(page as NavPage);
  };

  return (
    <section
      ref={heroZoneRef}
      className="relative overflow-hidden bg-slate-900 min-h-[460px] md:min-h-[520px] lg:min-h-[560px] flex items-center"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onKeyDown={onHeroKeyDown}
      tabIndex={0}
      aria-roledescription="carrousel"
      aria-label="À la une de la FIMF — utilisez les flèches gauche et droite pour naviguer"
    >
      {/* Fonds des slides : empilés, opacité animée = fondu enchaîné.
          Couche parallaxe au scroll (transform 3D, desktop uniquement). */}
      <div ref={bgParallaxRef} className="absolute inset-0 will-change-transform">
      {slides.map((s, i) => (
        <div
          key={s.id}
          className={`absolute inset-0 transition-opacity duration-1000 ease-out ${
            i === index ? 'opacity-100' : 'opacity-0'
          }`}
          aria-hidden={i !== index}
        >
          <img
            src={mediaUrl(s.image)}
            alt={s.title}
            className={`fimf-hero-kenburns w-full h-full object-cover object-center scale-102 transition-transform duration-[7000ms] ease-out ${
              i === index ? 'scale-110' : 'scale-102'
            }`}
            referrerPolicy="no-referrer"
          />
          {/* Measured gradient scrim */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/65 to-black/35" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
        </div>
      ))}
      </div>

      {/* Contenu de la slide active : titre ligne par ligne (masque + glissement),
          puis sous-titre, puis boutons en cascade (stagger 100 ms). */}
      <div ref={contentParallaxRef} className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 text-white w-full will-change-transform">
        <div key={slide.id} className="max-w-2xl space-y-4">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black uppercase tracking-tight leading-none text-balance">
            <span className="fimf-hero-mask">
              <span className="fimf-hero-line">{slide.title}</span>
            </span>
            <span className="fimf-hero-mask">
              <span className="fimf-hero-line text-[#f97316] drop-shadow-md" style={{ animationDelay: `${ANIM.heroStep}s` }}>
                {slide.highlight}
              </span>
            </span>
          </h1>

          <p
            className="fimf-hero-fade text-sm sm:text-base md:text-lg text-slate-200 font-medium leading-relaxed max-w-xl"
            style={{ animationDelay: `${ANIM.heroStep * 2}s` }}
          >
            {slide.subtitle}
          </p>

          <div className="fimf-hero-fade flex flex-wrap items-center gap-3 sm:gap-4 pt-4" style={{ animationDelay: `${ANIM.heroStep * 3}s` }}>
            {slide.ctaLabel && (
              <button
                onClick={() => handleCta(slide.ctaPage)}
                className="inline-flex items-center gap-2 px-5 py-3 text-xs sm:text-sm font-bold bg-[#ea580c] hover:bg-[#c2410c] text-white rounded-lg shadow-lg hover:shadow-orange-500/20 transition-all cursor-pointer uppercase tracking-wider group"
              >
                <Calendar className="w-4 h-4" />
                <span>{slide.ctaLabel}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            )}

            {slide.ctaSecondaryLabel && (
              <button
                onClick={() => handleCta(slide.ctaSecondaryPage)}
                className="inline-flex items-center gap-2 px-5 py-3 text-xs sm:text-sm font-bold bg-[#004724]/90 hover:bg-[#00381d] text-white rounded-lg border border-emerald-600/40 backdrop-blur-xs transition-all cursor-pointer uppercase tracking-wider group"
              >
                <span>{slide.ctaSecondaryLabel}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            )}
          </div>
        </div>

        {/* Contrôles du carrousel */}
        {count > 1 && (
          <>
            {/* Flèches latérales */}
            <div className="absolute right-4 sm:right-8 bottom-24 sm:bottom-28 flex items-center gap-2">
              <button
                onClick={goPrev}
                className="p-2 rounded-full bg-white/10 hover:bg-white/25 text-white border border-white/20 backdrop-blur-xs transition-colors cursor-pointer"
                aria-label="Slide précédente"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={goNext}
                className="p-2 rounded-full bg-white/10 hover:bg-white/25 text-white border border-white/20 backdrop-blur-xs transition-colors cursor-pointer"
                aria-label="Slide suivante"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Points de navigation */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2.5">
              {slides.map((s, i) => (
                <button
                  key={s.id}
                  onClick={() => setIndex(i)}
                  aria-label={`Aller à la slide ${i + 1}`}
                  aria-current={i === index}
                  className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                    i === index
                      ? 'w-8 bg-[#ea580c]'
                      : 'w-2 bg-white/40 hover:bg-white/70'
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
};
