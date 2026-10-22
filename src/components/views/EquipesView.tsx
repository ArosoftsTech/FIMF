import React, { useState } from 'react';
import { CLUBS_DATA, Club } from '@/src/data/fimfData';
import { useFimfData } from '../../context/FimfDataContext';
import { ClubBadge } from '../ClubBadge';
import { Stagger, StaggerItem } from '../anim/Reveal';
import heroImg from '@/src/assets/images/hero_ivory_coast_minifootball_1790335944178.jpg';
import { Search, ChevronDown, ArrowRight, MapPin, Users, Star } from 'lucide-react';

interface EquipesViewProps {
  onSelectClub: (club: Club) => void;
  favoriteIds?: string[];
  onToggleFavorite?: (clubId: string) => void;
}

type ClubTab = 'all' | 'region' | 'division';

export const EquipesView: React.FC<EquipesViewProps> = ({
  onSelectClub,
  favoriteIds = [],
  onToggleFavorite,
}) => {
  const { clubs: liveClubs } = useFimfData();
  const clubsSource = liveClubs.length > 0 ? liveClubs : CLUBS_DATA;
  const [activeTab, setActiveTab] = useState<ClubTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('Toutes');
  const [selectedDivision, setSelectedDivision] = useState('Toutes');

  const filteredClubs = clubsSource.filter((club) => {
    // Search query
    const matchSearch =
      club.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      club.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      club.commune.toLowerCase().includes(searchQuery.toLowerCase());

    // Region filter
    const matchRegion =
      selectedRegion === 'Toutes' || club.region === selectedRegion;

    // Division filter
    const matchDivision =
      selectedDivision === 'Toutes' || club.division === selectedDivision;

    return matchSearch && matchRegion && matchDivision;
  });

  return (
    <div className="space-y-8 pb-12">
      {/* 1. HERO BANNER */}
      <section className="relative overflow-hidden bg-[#004724] text-white">
        <div className="absolute inset-0 opacity-30">
          <img
            src={heroImg}
            alt="Les Équipes du Championnat National FIMF"
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight">
            LES ÉQUIPES
          </h1>
          <p className="text-emerald-100 text-sm sm:text-base md:text-lg max-w-2xl mt-2 font-medium">
            Découvrez les clubs affiliés à la FIMF.
          </p>
        </div>
      </section>

      {/* 2. SUB-TABS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center gap-2 sm:gap-4 border-b border-slate-200 pb-3">
          {[
            { id: 'all', label: 'Tous les clubs' },
            { id: 'region', label: 'Clubs par région' },
            { id: 'division', label: 'Clubs par division' },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as ClubTab);
                  if (tab.id === 'region') setSelectedRegion('Abidjan');
                  if (tab.id === 'division') setSelectedDivision('Division 1');
                  if (tab.id === 'all') {
                    setSelectedRegion('Toutes');
                    setSelectedDivision('Toutes');
                  }
                }}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer select-none uppercase tracking-wide ${
                  isActive
                    ? 'bg-[#ea580c] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </section>

      {/* 3. SEARCH & FILTERS BAR */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Search box */}
          <div className="relative w-full md:w-80">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher un club..."
              className="w-full text-xs rounded-lg border border-slate-300 py-2.5 pl-9 pr-3 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#006039]"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          </div>

          {/* Select filters */}
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Region dropdown */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500 font-semibold">Région :</span>
              <div className="relative">
                <select
                  value={selectedRegion}
                  onChange={(e) => setSelectedRegion(e.target.value)}
                  className="rounded-lg border border-slate-300 bg-white py-2 pl-3 pr-8 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#006039] cursor-pointer"
                >
                  <option value="Toutes">Toutes</option>
                  <option value="Abidjan">Abidjan</option>
                  <option value="Gbêkê">Gbêkê (Bouaké)</option>
                  <option value="Bas-Sassandra">Bas-Sassandra (San Pedro)</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-3 pointer-events-none" />
              </div>
            </div>

            {/* Division dropdown */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500 font-semibold">Division :</span>
              <div className="relative">
                <select
                  value={selectedDivision}
                  onChange={(e) => setSelectedDivision(e.target.value)}
                  className="rounded-lg border border-slate-300 bg-white py-2 pl-3 pr-8 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#006039] cursor-pointer"
                >
                  <option value="Toutes">Toutes</option>
                  <option value="Division 1">Division 1</option>
                  <option value="Division 2">Division 2</option>
                  <option value="Régionale">Régionale</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 pointer-events-none absolute right-2.5 top-3" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. CLUBS GRID (Exact 4x2 layout matching screenshot 6) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {filteredClubs.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-xl border border-slate-200 text-slate-500 text-xs">
            Aucun club ne correspond à vos critères de recherche.
          </div>
        ) : (
          <Stagger className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {filteredClubs.map((club, i) => {
              const isFav = favoriteIds.includes(club.id);
              return (
                <StaggerItem key={club.id} index={i}>
                <div
                  className="fimf-card-lift relative bg-white rounded-xl border border-slate-200/90 shadow-2xs hover:shadow-md p-5 flex flex-col items-center text-center justify-between group h-full"
                >
                  {/* Star toggle top-right */}
                  {onToggleFavorite && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavorite(club.id);
                      }}
                      className={`absolute top-3 right-3 p-1.5 rounded-full transition-colors ${
                        isFav
                          ? 'bg-amber-100 text-amber-600 hover:bg-amber-200'
                          : 'bg-slate-100/70 text-slate-400 hover:text-amber-500 hover:bg-amber-50'
                      }`}
                      title={isFav ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                      aria-label={isFav ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                    >
                      <Star
                        className={`w-3.5 h-3.5 ${
                          isFav ? 'fill-amber-500 text-amber-500' : ''
                        }`}
                      />
                    </button>
                  )}

                  <div className="flex flex-col items-center w-full">
                    <div className="p-3 rounded-full bg-slate-50 group-hover:bg-emerald-50 transition-colors mb-3">
                      <ClubBadge id={club.id} size="lg" />
                    </div>
                    <h3 className="font-black text-xs sm:text-sm text-slate-900 group-hover:text-[#006039] transition-colors uppercase tracking-tight">
                      {club.name}
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {club.commune}
                    </p>
                    {isFav && (
                      <span className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-[10px] font-bold text-amber-800">
                        <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
                        Club suivi
                      </span>
                    )}
                  </div>

                  <div className="pt-4 w-full">
                    <button
                      onClick={() => onSelectClub(club)}
                      className="w-full inline-flex items-center justify-center gap-1.5 text-xs font-bold text-[#ea580c] hover:text-[#c2410c] group-hover:translate-x-0.5 transition-all uppercase cursor-pointer"
                    >
                      <span>Voir le profil</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                </StaggerItem>
              );
            })}
          </Stagger>
        )}
      </section>
    </div>
  );
};
