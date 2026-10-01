import React, { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';

/** Seuil d'apparition du bouton (en pixels de défilement) */
const SCROLL_THRESHOLD = 400;

/**
 * Bouton flottant « Retour en haut de page ».
 * Apparaît en fondu + slide une fois que l'utilisateur a défilé
 * au-delà du seuil, puis disparaît en fondu inverse au retour.
 */
export const BackToTopButton: React.FC = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > SCROLL_THRESHOLD);

    // État initial correct si la page est déjà défilée (reload en milieu de page)
    onScroll();

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <button
      onClick={scrollToTop}
      aria-label="Retour en haut de page"
      title="Retour en haut de page"
      className={`fixed bottom-5 left-5 z-50 p-3 rounded-full bg-[#006039] hover:bg-[#004724] text-white shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#006039] ${
        visible ? 'animate-backtotop-in opacity-100' : 'animate-backtotop-out opacity-0 pointer-events-none'
      }`}
    >
      <ArrowUp className="w-5 h-5" />
    </button>
  );
};
