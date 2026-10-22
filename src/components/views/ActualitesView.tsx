import React, { useState } from 'react';
import { motion } from 'motion/react';
import { NEWS_DATA, NewsArticle } from '@/src/data/fimfData';
import heroImg from '@/src/assets/images/hero_ivory_coast_minifootball_1790335944178.jpg';
import { ArrowRight, Calendar, Tag, Clock } from 'lucide-react';
import { Stagger, StaggerItem } from '../anim/Reveal';

interface ActualitesViewProps {
  onSelectArticle: (article: NewsArticle) => void;
}

type NewsCategory =
  | 'Toutes'
  | 'Championnat'
  | 'Compétitions'
  | 'Sélections'
  | 'Formation'
  | 'Institutionnel';

export const ActualitesView: React.FC<ActualitesViewProps> = ({ onSelectArticle }) => {
  const [selectedCategory, setSelectedCategory] = useState<NewsCategory>('Toutes');

  const categories: NewsCategory[] = [
    'Toutes',
    'Championnat',
    'Compétitions',
    'Sélections',
    'Formation',
    'Institutionnel',
  ];

  const filteredArticles = NEWS_DATA.filter((a) => {
    if (selectedCategory === 'Toutes') return true;
    return a.category === selectedCategory;
  });

  return (
    <div className="space-y-8 pb-12">
      {/* 1. HERO BANNER */}
      <section className="relative overflow-hidden bg-[#004724] text-white">
        <div className="absolute inset-0 opacity-30">
          <img
            src={heroImg}
            alt="Actualités de la FIMF"
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight">
            ACTUALITÉS
          </h1>
          <p className="text-emerald-100 text-sm sm:text-base md:text-lg max-w-2xl mt-2 font-medium">
            Toute l'actualité du mini-football ivoirien.
          </p>
        </div>
      </section>

      {/* 2. CATEGORY TABS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center gap-2 sm:gap-4 border-b border-slate-200 pb-3">
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
                    layoutId="actus-category"
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
      </section>

      {/* 3. NEWS GRID (matching screenshot 7) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Stagger className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredArticles.map((article, i) => (
            <StaggerItem key={article.id} index={i}>
            <div
              onClick={() => onSelectArticle(article)}
              className="fimf-card-lift bg-white rounded-xl border border-slate-200/90 shadow-2xs hover:shadow-md overflow-hidden flex flex-col justify-between cursor-pointer group h-full"
            >
              <div>
                <div className="relative h-48 w-full overflow-hidden bg-slate-900">
                  <img
                    src={article.image}
                    alt={article.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    referrerPolicy="no-referrer"
                  />
                  <span className="absolute top-3 left-3 px-2.5 py-1 bg-[#004724]/90 text-white text-[10px] font-bold rounded uppercase">
                    {article.category}
                  </span>
                </div>

                <div className="p-5 space-y-2.5">
                  <div className="flex items-center gap-3 text-[11px] text-slate-400 font-semibold">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {article.dateStr}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {article.readTime}
                    </span>
                  </div>

                  <h3 className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-[#ea580c] transition-colors line-clamp-2 leading-snug">
                    {article.title}
                  </h3>

                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {article.excerpt}
                  </p>
                </div>
              </div>

              <div className="p-5 pt-0 flex items-center justify-between border-t border-slate-100 mt-2">
                <span className="text-[11px] text-slate-500 font-medium truncate max-w-[180px]">
                  {article.author}
                </span>
                <span className="inline-flex items-center gap-1 text-xs font-bold text-[#ea580c] group-hover:translate-x-1 transition-transform">
                  <ArrowRight className="w-4 h-4" />
                </span>
              </div>
            </div>
            </StaggerItem>
          ))}
        </Stagger>
      </section>
    </div>
  );
};
