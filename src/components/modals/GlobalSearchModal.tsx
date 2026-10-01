import React, { useState } from 'react';
import { X, Search, Shield, Newspaper, Trophy, ArrowRight } from 'lucide-react';
import { CLUBS_DATA, NEWS_DATA, COMPETITIONS_DATA, Club, NewsArticle, Competition } from '@/src/data/fimfData';
import { ClubBadge } from '../ClubBadge';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectClub: (club: Club) => void;
  onSelectArticle: (article: NewsArticle) => void;
  onSelectCompetition: (comp: Competition) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  onSelectClub,
  onSelectArticle,
  onSelectCompetition,
}) => {
  const [query, setQuery] = useState('');

  if (!isOpen) return null;

  const q = query.toLowerCase().trim();

  const filteredClubs = q
    ? CLUBS_DATA.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.city.toLowerCase().includes(q) ||
          c.commune.toLowerCase().includes(q)
      )
    : [];

  const filteredArticles = q
    ? NEWS_DATA.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.category.toLowerCase().includes(q) ||
          a.tags.some((t) => t.toLowerCase().includes(q))
      )
    : [];

  const filteredCompetitions = q
    ? COMPETITIONS_DATA.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q) ||
          c.category.toLowerCase().includes(q)
      )
    : [];

  const hasResults =
    filteredClubs.length > 0 ||
    filteredArticles.length > 0 ||
    filteredCompetitions.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-16 sm:pt-24 bg-slate-950/70 backdrop-blur-xs animate-overlay-in">
      <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl overflow-hidden border border-slate-200 animate-modal-in">
        {/* Search Input Bar */}
        <div className="p-4 border-b border-slate-200 flex items-center gap-3 bg-slate-50">
          <Search className="w-5 h-5 text-[#006039]" />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher un club, un match, une actualité ou une compétition..."
            className="flex-1 text-sm bg-transparent border-none text-slate-800 placeholder-slate-400 focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-xs text-slate-400 hover:text-slate-600 px-1.5 py-0.5"
            >
              Effacer
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results Area */}
        <div className="p-4 max-h-[60vh] overflow-y-auto">
          {!query && (
            <div className="py-8 text-center text-slate-400 text-xs">
              Tapez votre recherche (ex: <span className="text-[#ea580c] font-semibold cursor-pointer" onClick={() => setQuery('Plateau')}>Plateau</span>, <span className="text-[#ea580c] font-semibold cursor-pointer" onClick={() => setQuery('Arbitre')}>Arbitre</span>, <span className="text-[#ea580c] font-semibold cursor-pointer" onClick={() => setQuery('Coupe')}>Coupe</span>)...
            </div>
          )}

          {query && !hasResults && (
            <div className="py-8 text-center text-slate-500 text-xs">
              Aucun résultat trouvé pour « <span className="font-bold">{query}</span> ».
            </div>
          )}

          {/* Clubs section */}
          {filteredClubs.length > 0 && (
            <div className="mb-4">
              <h4 className="text-[11px] font-bold uppercase text-slate-400 tracking-wider mb-2 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-[#006039]" /> Clubs ({filteredClubs.length})
              </h4>
              <div className="space-y-1.5">
                {filteredClubs.map((club) => (
                  <button
                    key={club.id}
                    onClick={() => {
                      onSelectClub(club);
                      onClose();
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-lg hover:bg-emerald-50 text-left transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <ClubBadge id={club.id} size="sm" />
                      <div>
                        <span className="font-bold text-slate-900 text-xs group-hover:text-[#006039]">
                          {club.name}
                        </span>
                        <span className="text-[11px] text-slate-500 ml-2">
                          {club.commune}, {club.city}
                        </span>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-[#006039]" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Articles section */}
          {filteredArticles.length > 0 && (
            <div className="mb-4">
              <h4 className="text-[11px] font-bold uppercase text-slate-400 tracking-wider mb-2 flex items-center gap-1.5">
                <Newspaper className="w-3.5 h-3.5 text-[#ea580c]" /> Actualités ({filteredArticles.length})
              </h4>
              <div className="space-y-1.5">
                {filteredArticles.map((article) => (
                  <button
                    key={article.id}
                    onClick={() => {
                      onSelectArticle(article);
                      onClose();
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-lg hover:bg-orange-50 text-left transition-colors group"
                  >
                    <div>
                      <span className="text-[10px] font-bold text-[#ea580c] uppercase block">
                        {article.category} • {article.dateStr}
                      </span>
                      <span className="font-bold text-slate-900 text-xs group-hover:text-[#ea580c]">
                        {article.title}
                      </span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-[#ea580c] shrink-0 ml-2" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Competitions section */}
          {filteredCompetitions.length > 0 && (
            <div>
              <h4 className="text-[11px] font-bold uppercase text-slate-400 tracking-wider mb-2 flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5 text-amber-500" /> Compétitions ({filteredCompetitions.length})
              </h4>
              <div className="space-y-1.5">
                {filteredCompetitions.map((comp) => (
                  <button
                    key={comp.id}
                    onClick={() => {
                      onSelectCompetition(comp);
                      onClose();
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-lg hover:bg-amber-50 text-left transition-colors group"
                  >
                    <div>
                      <span className="font-bold text-slate-900 text-xs group-hover:text-amber-700">
                        {comp.title}
                      </span>
                      <span className="text-[11px] text-slate-500 block">
                        {comp.subtitle}
                      </span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-amber-700 shrink-0 ml-2" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
