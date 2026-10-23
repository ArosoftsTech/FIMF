import { ResponsiveImage } from '@/src/components/ResponsiveImage';
import React from 'react';
import { GalleryPhoto } from '@/src/data/fimfData';
import { X, ChevronLeft, ChevronRight, MapPin, Calendar } from 'lucide-react';

interface PhotoLightboxModalProps {
  photos: GalleryPhoto[];
  currentIndex: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

export const PhotoLightboxModal: React.FC<PhotoLightboxModalProps> = ({
  photos,
  currentIndex,
  onClose,
  onNavigate,
}) => {
  if (currentIndex < 0 || currentIndex >= photos.length) return null;
  const photo = photos[currentIndex];

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    onNavigate((currentIndex - 1 + photos.length) % photos.length);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    onNavigate((currentIndex + 1) % photos.length);
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-overlay-in select-none"
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-5 right-5 z-20 p-2 rounded-full bg-white/20 hover:bg-white/40 text-white transition-colors"
        aria-label="Fermer"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Prev button */}
      <button
        onClick={handlePrev}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-white/20 hover:bg-white/40 text-white transition-colors"
        aria-label="Photo précédente"
      >
        <ChevronLeft className="w-7 h-7" />
      </button>

      {/* Next button */}
      <button
        onClick={handleNext}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-white/20 hover:bg-white/40 text-white transition-colors"
        aria-label="Photo suivante"
      >
        <ChevronRight className="w-7 h-7" />
      </button>

      {/* Image container */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative max-w-5xl max-h-[85vh] flex flex-col items-center animate-lightbox-in"
      >
        <ResponsiveImage
          name={photo.image}
          alt={photo.title}
          className="max-h-[72vh] max-w-full rounded-lg shadow-2xl object-contain"
        />

        <div className="mt-4 text-center text-white max-w-2xl px-4 animate-accordion-in" style={{ animationDelay: '120ms' }}>
          <div className="flex items-center justify-center gap-3 text-xs text-amber-400 font-semibold mb-1">
            <span className="bg-[#ea580c] text-white px-2 py-0.5 rounded text-[10px] uppercase">
              {photo.category}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" /> {photo.dateStr}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" /> {photo.venue}
            </span>
          </div>
          <h3 className="text-base sm:text-lg font-bold text-white">{photo.title}</h3>
          <p className="text-xs text-slate-300 mt-0.5">{photo.caption}</p>
          <span className="text-[11px] text-slate-400 mt-2 block">
            Photo {currentIndex + 1} sur {photos.length}
          </span>
        </div>
      </div>
    </div>
  );
};
