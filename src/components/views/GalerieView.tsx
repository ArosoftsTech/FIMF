import React, { useState } from 'react';
import { GALLERY_PHOTOS, GalleryPhoto } from '@/src/data/fimfData';
import heroImg from '@/src/assets/images/hero_ivory_coast_minifootball_1790335944178.jpg';
import { Maximize2, MapPin, Calendar, Plus } from 'lucide-react';

interface GalerieViewProps {
  onOpenPhotoLightbox: (index: number) => void;
}

type GalleryCategory = 'Toutes' | 'Compétitions' | 'Équipes' | 'Sélections' | 'Événements';

export const GalerieView: React.FC<GalerieViewProps> = ({ onOpenPhotoLightbox }) => {
  const [selectedCategory, setSelectedCategory] = useState<GalleryCategory>('Toutes');
  const [visibleCount, setVisibleCount] = useState(8);

  const categories: GalleryCategory[] = [
    'Toutes',
    'Compétitions',
    'Équipes',
    'Sélections',
    'Événements',
  ];

  const filteredPhotos = GALLERY_PHOTOS.filter((p) => {
    if (selectedCategory === 'Toutes') return true;
    return p.category === selectedCategory;
  });

  const displayedPhotos = filteredPhotos.slice(0, visibleCount);

  return (
    <div className="space-y-8 pb-12">
      {/* 1. HERO BANNER */}
      <section className="relative overflow-hidden bg-[#004724] text-white">
        <div className="absolute inset-0 opacity-30">
          <img
            src={heroImg}
            alt="Galerie Photos FIMF"
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight">
            GALERIE PHOTOS
          </h1>
          <p className="text-emerald-100 text-sm sm:text-base md:text-lg max-w-2xl mt-2 font-medium">
            Revivez les temps forts en images.
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
                onClick={() => {
                  setSelectedCategory(cat);
                  setVisibleCount(8);
                }}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer select-none uppercase tracking-wide ${
                  isActive
                    ? 'bg-[#ea580c] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </section>

      {/* 3. PHOTO GRID (matching screenshot 8) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {displayedPhotos.map((photo, idx) => (
            <div
              key={photo.id}
              onClick={() => onOpenPhotoLightbox(idx)}
              className="group relative aspect-4/3 rounded-xl overflow-hidden bg-slate-900 shadow-2xs hover:shadow-lg transition-all cursor-pointer"
            >
              <img
                src={photo.image}
                alt={photo.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                referrerPolicy="no-referrer"
              />

              {/* Scrim Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-4 flex flex-col justify-between text-white">
                <div className="flex justify-end">
                  <span className="p-1.5 rounded-full bg-white/20 backdrop-blur-xs text-white">
                    <Maximize2 className="w-3.5 h-3.5" />
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-[#ea580c] block">
                    {photo.category}
                  </span>
                  <p className="text-xs font-bold text-white line-clamp-1">{photo.title}</p>
                  <p className="text-[10px] text-slate-300 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3 text-amber-400" />
                    <span>{photo.venue}</span>
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Load More Button (+ Voir plus) */}
        {visibleCount < filteredPhotos.length && (
          <div className="text-center pt-8">
            <button
              onClick={() => setVisibleCount((prev) => prev + 4)}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border-2 border-[#ea580c] text-[#ea580c] hover:bg-[#ea580c] hover:text-white text-xs font-bold uppercase tracking-wider transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Voir plus</span>
            </button>
          </div>
        )}
      </section>
    </div>
  );
};
