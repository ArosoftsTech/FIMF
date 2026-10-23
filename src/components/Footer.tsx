import React from 'react';
import { FimfLogo } from './FimfLogo';
import { NavPage } from './Navbar';
import { Facebook, Instagram, Youtube, Linkedin, ArrowUp } from 'lucide-react';
import { Reveal } from './anim/Reveal';

interface FooterProps {
  onNavigate: (page: NavPage) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-[#052818] text-white border-t border-emerald-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Reveal>
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-8 border-b border-emerald-900/60">
          {/* Logo brand */}
          <button
            onClick={() => {
              onNavigate('accueil');
              scrollToTop();
            }}
            className="text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f97316] rounded-lg"
          >
            <FimfLogo variant="light" size="md" />
          </button>

          {/* Inline Navigation Links */}
          <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-semibold tracking-wider text-emerald-100/90 uppercase">
            <button onClick={() => onNavigate('accueil')} className="hover:text-amber-400 transition-colors">ACCUEIL</button>
            <span className="text-emerald-700 select-none">|</span>
            <button onClick={() => onNavigate('la-fimf')} className="hover:text-amber-400 transition-colors">LA FIMF</button>
            <span className="text-emerald-700 select-none">|</span>
            <button onClick={() => onNavigate('championnat')} className="hover:text-amber-400 transition-colors">CHAMPIONNAT</button>
            <span className="text-emerald-700 select-none">|</span>
            <button onClick={() => onNavigate('calendrier')} className="hover:text-amber-400 transition-colors">CALENDRIER</button>
            <span className="text-emerald-700 select-none">|</span>
            <button onClick={() => onNavigate('competitions')} className="hover:text-amber-400 transition-colors">COMPÉTITIONS</button>
            <span className="text-emerald-700 select-none">|</span>
            <button onClick={() => onNavigate('equipes')} className="hover:text-amber-400 transition-colors">ÉQUIPES</button>
            <span className="text-emerald-700 select-none">|</span>
            <button onClick={() => onNavigate('classement')} className="hover:text-amber-400 transition-colors">CLASSEMENT</button>
            <span className="text-emerald-700 select-none">|</span>
            <button onClick={() => onNavigate('actualites')} className="hover:text-amber-400 transition-colors">ACTUALITÉS</button>
            <span className="text-emerald-700 select-none">|</span>
            <button onClick={() => onNavigate('galerie')} className="hover:text-amber-400 transition-colors">GALERIE</button>
            <span className="text-emerald-700 select-none">|</span>
            <button onClick={() => onNavigate('contact')} className="hover:text-amber-400 transition-colors">CONTACT</button>
            <span className="text-emerald-700 select-none">|</span>
            <button onClick={() => onNavigate('sponsoring')} className="hover:text-amber-400 transition-colors font-bold">SPONSORING</button>
          </nav>

          {/* Social Icons */}
          <div className="flex items-center gap-3">
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noreferrer"
              className="w-8 h-8 rounded-full bg-emerald-900/60 hover:bg-[#ea580c] flex items-center justify-center text-emerald-100 hover:text-white transition-colors"
              aria-label="Facebook FIMF"
            >
              <Facebook className="w-4 h-4" />
            </a>
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noreferrer"
              className="w-8 h-8 rounded-full bg-emerald-900/60 hover:bg-[#ea580c] flex items-center justify-center text-emerald-100 hover:text-white transition-colors"
              aria-label="Instagram FIMF"
            >
              <Instagram className="w-4 h-4" />
            </a>
            <a
              href="https://youtube.com"
              target="_blank"
              rel="noreferrer"
              className="w-8 h-8 rounded-full bg-emerald-900/60 hover:bg-[#ea580c] flex items-center justify-center text-emerald-100 hover:text-white transition-colors"
              aria-label="YouTube FIMF"
            >
              <Youtube className="w-4 h-4" />
            </a>
            <a
              href="https://x.com"
              target="_blank"
              rel="noreferrer"
              className="w-8 h-8 rounded-full bg-emerald-900/60 hover:bg-[#ea580c] flex items-center justify-center text-emerald-100 hover:text-white transition-colors"
              aria-label="X Twitter FIMF"
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
            <a
              href="https://linkedin.com"
              target="_blank"
              rel="noreferrer"
              className="w-8 h-8 rounded-full bg-emerald-900/60 hover:bg-[#ea580c] flex items-center justify-center text-emerald-100 hover:text-white transition-colors"
              aria-label="LinkedIn FIMF"
            >
              <Linkedin className="w-4 h-4" />
            </a>
          </div>
        </div>
        </Reveal>

        {/* Bottom bar */}
        <Reveal delay={0.1}>
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-emerald-300/70 gap-4">
          <div className="text-center sm:text-left space-y-0.5">
            <p>© 2026 FIMF — Fédération Ivoirienne de Mini Football. Tous droits réservés.</p>
            <p className="text-emerald-300/50">
              Siège : Cocody Deux Plateaux Vallons, Abidjan • fimf.infos@gmail.com • (+225) 27 22 41 35 94
            </p>
          </div>
          <div className="flex items-center gap-6">
            <span className="hover:text-white transition-colors cursor-pointer">Mentions légales</span>
            <span className="hover:text-white transition-colors cursor-pointer">Politique de confidentialité</span>
            <span className="hover:text-white transition-colors cursor-pointer">Règlements Fédéraux</span>
            <button
              onClick={() => onNavigate('admin')}
              className="text-amber-400 hover:text-amber-300 font-bold transition-colors cursor-pointer flex items-center gap-1"
            >
              <span>⚙️ Dashboard Admin</span>
            </button>
            <button
              onClick={scrollToTop}
              className="p-1.5 rounded-md bg-emerald-900/80 hover:bg-[#ea580c] text-white transition-colors flex items-center gap-1 text-[11px]"
              title="Haut de page"
            >
              <ArrowUp className="w-3 h-3" />
            </button>
          </div>
        </div>
        </Reveal>
      </div>
    </footer>
  );
};
