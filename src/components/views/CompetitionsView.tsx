import { ResponsiveImage } from '@/src/components/ResponsiveImage';
import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { COMPETITIONS_DATA, Competition } from '@/src/data/fimfData';
import { ArrowRight, Trophy, Users, Calendar, Award } from 'lucide-react';
import { Stagger, StaggerItem } from '../anim/Reveal';

interface CompetitionsViewProps {
  onSelectCompetition: (comp: Competition) => void;
  onNavigateCalendrier?: () => void;
  /** Catégorie pré-filtrée au montage (navigation profonde depuis le menu) */
  initialCategory?: string;
}

type CompCategory =
  | 'Toutes'
  | 'Championnat national'
  | 'Coupe nationale'
  | 'Sélections nationales'
  | 'Compétitions internationales';

export const CompetitionsView: React.FC<CompetitionsViewProps> = ({
  onSelectCompetition,
  onNavigateCalendrier,
  initialCategory,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<CompCategory>(
    (initialCategory as CompCategory) ?? 'Toutes'
  );

  // Synchronise le filtre si une navigation profonde arrive pendant que la page est ouverte
  useEffect(() => {
    if (initialCategory) setSelectedCategory(initialCategory as CompCategory);
  }, [initialCategory]);

  const categories: CompCategory[] = [
    'Toutes',
    'Championnat national',
    'Coupe nationale',
    'Sélections nationales',
    'Compétitions internationales',
  ];

  const majorComps = COMPETITIONS_DATA.filter((c) => {
    if (!c.isMajor) return false;
    if (selectedCategory === 'Toutes') return true;
    return c.category === selectedCategory;
  });

  const otherComps = COMPETITIONS_DATA.filter((c) => {
    if (c.isMajor) return false;
    if (selectedCategory === 'Toutes') return true;
    return c.category === selectedCategory;
  });

  return (
    <div className="space-y-8 pb-12">
      {/* 1. HERO BANNER */}
      <section className="relative overflow-hidden bg-[#004724] text-white">
        <div className="absolute inset-0 opacity-30">
          <ResponsiveImage
            name="hero_ivory_coast_minifootball_1790335944178.jpg"
            alt="Compétitions FIMF"
            className="w-full h-full object-cover"
            priority
          />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight">
            COMPÉTITIONS
          </h1>
          <p className="text-emerald-100 text-sm sm:text-base md:text-lg max-w-2xl mt-2 font-medium">
            Les compétitions officielles de la FIMF.
          </p>
        </div>
      </section>

      {/* 2. CATEGORY FILTER TABS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 pb-3">
          <div className="flex flex-wrap items-center gap-2 sm:gap-4">
            {categories.map((cat) => {
              const isActive = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`relative px-4 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer select-none uppercase tracking-wide ${
                    isActive
                      ? 'text-white'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  {isActive && (
                    <motion.span
                      layoutId="competitions-category"
                      className="absolute inset-0 bg-[#ea580c] rounded-lg shadow-xs"
                      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                      aria-hidden="true"
                    />
                  )}
                  <span className="relative">{cat}</span>
                </button>
              );
            })}
          </div>

          {onNavigateCalendrier && (
            <button
              onClick={onNavigateCalendrier}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-[#006039] border border-emerald-200 text-xs font-bold uppercase transition-colors cursor-pointer self-start sm:self-auto shrink-0"
            >
              <Calendar className="w-3.5 h-3.5 text-[#ea580c]" />
              <span>Calendrier de tous les matchs</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>
      </section>

      {/* 3. MAJOR COMPETITIONS CARDS (3 columns matching screenshot 5) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Stagger className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {majorComps.map((comp, i) => (
            <StaggerItem key={comp.id} index={i}>
            <div
              className="fimf-card-lift bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col hover:shadow-md group h-full"
            >
              <div className="relative h-48 w-full overflow-hidden bg-slate-900">
                <ResponsiveImage
                  name={comp.image}
                  alt={comp.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <span className="absolute top-3 left-3 px-2.5 py-1 bg-black/60 text-white text-[10px] font-bold rounded uppercase backdrop-blur-xs">
                  {comp.period}
                </span>
                {comp.badge && (
                  <span className="absolute top-3 right-3 px-2.5 py-1 bg-[#ea580c] text-white text-[10px] font-bold rounded uppercase shadow-xs">
                    {comp.badge}
                  </span>
                )}
              </div>

              <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 uppercase tracking-tight group-hover:text-[#ea580c] transition-colors">
                    {comp.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                    {comp.subtitle}
                  </p>
                </div>

                <div>
                  <button
                    onClick={() => onSelectCompetition(comp)}
                    className="fimf-btn-lift w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#ea580c] hover:bg-[#c2410c] text-white text-xs font-bold rounded-lg transition-colors uppercase tracking-wider shadow-xs cursor-pointer"
                  >
                    <span>DÉCOUVRIR</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      {/* 4. AUTRES COMPÉTITIONS SECTION (matching screenshot 5) */}
      {otherComps.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4 pt-4">
          <div className="pb-2 border-b-2 border-slate-200">
            <h2 className="text-base sm:text-lg font-black text-slate-900 uppercase tracking-tight">
              AUTRES COMPÉTITIONS
            </h2>
          </div>

          <Stagger className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {otherComps.map((comp, i) => (
              <StaggerItem key={comp.id} index={i}>
              <div
                className="fimf-card-lift bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden flex items-center p-4 gap-4 hover:shadow-md group h-full"
              >
                <div className="w-20 h-20 rounded-lg overflow-hidden bg-slate-900 shrink-0">
                  <ResponsiveImage
                    name={comp.image}
                    alt={comp.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-tight group-hover:text-[#ea580c] transition-colors truncate">
                    {comp.title}
                  </h3>
                  <p className="text-[11px] text-slate-600 line-clamp-2 mt-0.5 leading-snug">
                    {comp.subtitle}
                  </p>
                  <button
                    onClick={() => onSelectCompetition(comp)}
                    className="mt-2 text-[10px] font-bold text-[#ea580c] hover:text-[#c2410c] uppercase flex items-center gap-1 cursor-pointer group/btn"
                  >
                    <span>DÉCOUVRIR</span>
                    <ArrowRight className="w-3 h-3 transition-transform group-hover/btn:translate-x-0.5" />
                  </button>
                </div>
              </div>
              </StaggerItem>
            ))}
          </Stagger>
        </section>
      )}
    </div>
  );
};
