import { ResponsiveImage } from '@/src/components/ResponsiveImage';
import React, { useState, useMemo } from 'react';
import {
  MATCHES_DATA,
  CLUBS_DATA,
  COMPETITIONS_DATA,
  Match,
  Club,
} from '@/src/data/fimfData';
import { ClubBadge } from '../ClubBadge';
import { MatchRow } from '../MatchRow';
import { Reveal } from '../anim/Reveal';
import {
  Calendar as CalendarIcon,
  Filter,
  Search,
  MapPin,
  Clock,
  Trophy,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ArrowRight,
  Shield,
  Star,
  CheckCircle2,
  CalendarDays,
  ListFilter,
  X,
} from 'lucide-react';

interface CalendrierViewProps {
  onSelectMatch: (match: Match) => void;
  onSelectClub: (club: Club) => void;
  favoriteIds?: string[];
  onToggleFavorite?: (clubId: string) => void;
}

type DateQuickFilter = 'all' | 'weekend-sept' | 'weekend-oct' | 'oct-mid' | 'finished';
type StatusFilter = 'all' | 'scheduled' | 'finished';

export const CalendrierView: React.FC<CalendrierViewProps> = ({
  onSelectMatch,
  onSelectClub,
  favoriteIds = [],
  onToggleFavorite,
}) => {
  // Filters state
  const [selectedCompetitionId, setSelectedCompetitionId] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<StatusFilter>('all');
  const [selectedDateFilter, setSelectedDateFilter] = useState<DateQuickFilter>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [onlyFavorites, setOnlyFavorites] = useState<boolean>(false);
  const [selectedViewMode, setSelectedViewMode] = useState<'cards' | 'grouped'>('grouped');

  // List of distinct competitions available in matches
  const availableCompetitions = useMemo(() => {
    const compMap = new Map<string, { id: string; name: string; count: number }>();
    compMap.set('all', {
      id: 'all',
      name: 'Toutes les compétitions',
      count: MATCHES_DATA.length,
    });

    MATCHES_DATA.forEach((m) => {
      const compId = m.competitionId || 'champ-national';
      const compName = m.competitionName || 'Championnat National';
      if (!compMap.has(compId)) {
        compMap.set(compId, { id: compId, name: compName, count: 0 });
      }
      compMap.get(compId)!.count++;
    });

    return Array.from(compMap.values());
  }, []);

  // Filtered matches
  const filteredMatches = useMemo(() => {
    return MATCHES_DATA.filter((match) => {
      // 1. Competition filter
      if (selectedCompetitionId !== 'all') {
        const compId = match.competitionId || 'champ-national';
        if (compId !== selectedCompetitionId) return false;
      }

      // 2. Status filter
      if (selectedStatus !== 'all') {
        if (match.status !== selectedStatus) return false;
      }

      // 3. Date quick filter
      if (selectedDateFilter === 'weekend-sept') {
        if (!match.dateStr.includes('Sept.')) return false;
      } else if (selectedDateFilter === 'weekend-oct') {
        if (!match.dateStr.includes('05 Oct.') && !match.dateStr.includes('06 Oct.')) return false;
      } else if (selectedDateFilter === 'oct-mid') {
        if (!match.dateStr.includes('09 Oct.') && !match.dateStr.includes('10 Oct.') && !match.dateStr.includes('11 Oct.') && !match.dateStr.includes('12 Oct.') && !match.dateStr.includes('15 Oct.')) return false;
      } else if (selectedDateFilter === 'finished') {
        if (match.status !== 'finished') return false;
      }

      // 4. Favorites only filter
      if (onlyFavorites) {
        const hasFavoriteClub =
          favoriteIds.includes(match.homeTeamId) || favoriteIds.includes(match.awayTeamId);
        if (!hasFavoriteClub) return false;
      }

      // 5. Search text (team names, venue, date)
      if (searchTerm.trim() !== '') {
        const query = searchTerm.toLowerCase();
        const homeClub = CLUBS_DATA.find((c) => c.id === match.homeTeamId);
        const awayClub = CLUBS_DATA.find((c) => c.id === match.awayTeamId);
        const homeName = homeClub ? homeClub.name.toLowerCase() : '';
        const awayName = awayClub ? awayClub.name.toLowerCase() : '';
        const venueName = match.venue.toLowerCase();
        const dateName = match.dateStr.toLowerCase();
        const compName = (match.competitionName || '').toLowerCase();

        const matchesQuery =
          homeName.includes(query) ||
          awayName.includes(query) ||
          venueName.includes(query) ||
          dateName.includes(query) ||
          compName.includes(query);

        if (!matchesQuery) return false;
      }

      return true;
    });
  }, [selectedCompetitionId, selectedStatus, selectedDateFilter, onlyFavorites, searchTerm, favoriteIds]);

  // Groupes de la CAN, lus sur la fiche compétition (tirage au sort de Conakry)
  const canGroups = useMemo(() => {
    const can = COMPETITIONS_DATA.find((c) => c.id === 'can-guinee-2027');
    return (can?.rulesHighlight ?? [])
      .filter((line) => /^Groupe [A-F] —/.test(line))
      .map((line) => {
        const [label, teams] = line.split(' — ');
        return {
          letter: label.replace('Groupe ', ''),
          teams: teams.split(/,\s*|\s\+\s/).filter(Boolean),
        };
      });
  }, []);

  // Grouped by Date
  const matchesByDate = useMemo(() => {
    const groups: { [dateStr: string]: Match[] } = {};
    filteredMatches.forEach((m) => {
      if (!groups[m.dateStr]) {
        groups[m.dateStr] = [];
      }
      groups[m.dateStr].push(m);
    });
    return groups;
  }, [filteredMatches]);

  const resetFilters = () => {
    setSelectedCompetitionId('all');
    setSelectedStatus('all');
    setSelectedDateFilter('all');
    setSearchTerm('');
    setOnlyFavorites(false);
  };

  const isFiltered =
    selectedCompetitionId !== 'all' ||
    selectedStatus !== 'all' ||
    selectedDateFilter !== 'all' ||
    searchTerm !== '' ||
    onlyFavorites;

  return (
    <div className="space-y-8 pb-16">
      {/* 1. HERO BANNER */}
      <section className="relative overflow-hidden bg-[#004724] text-white">
        <div className="absolute inset-0 opacity-25">
          <ResponsiveImage
            name="hero_ivory_coast_minifootball_1790335944178.jpg"
            alt="Calendrier officiel des compétitions FIMF"
            className="w-full h-full object-cover"
            priority
          />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-800/80 border border-emerald-600/50 text-emerald-200 text-xs font-bold uppercase tracking-wider mb-3">
                <CalendarDays className="w-3.5 h-3.5 text-[#ea580c]" />
                <span>SAISON OFFICIELLE 2024 - 2025</span>
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight">
                CALENDRIER DES MATCHS
              </h1>
              <p className="text-emerald-100 text-sm sm:text-base md:text-lg max-w-2xl mt-2 font-medium">
                Consultez, filtrez et suivez toutes les rencontres officielles de la FIMF par date, compétition et club.
              </p>
            </div>

            {/* Quick Stat Counter */}
            <div className="flex items-center gap-3 bg-emerald-950/70 border border-emerald-800/80 rounded-xl p-3 sm:p-4 backdrop-blur-xs">
              <div className="w-12 h-12 rounded-lg bg-[#ea580c] flex items-center justify-center text-white shadow-xs">
                <CalendarIcon className="w-6 h-6" />
              </div>
              <div>
                <div className="text-2xl font-black text-white">{filteredMatches.length}</div>
                <div className="text-[11px] font-bold text-emerald-200 uppercase tracking-wider">
                  {filteredMatches.length === 1 ? 'Match trouvé' : 'Matchs répertoriés'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. MAIN CONTROLS & FILTERING BAR */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6 space-y-5">
          {/* Top Row: Search input + View toggle + Favorites switch */}
          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            {/* Search Box */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Rechercher une équipe, un stade, une date..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#ea580c] focus:border-transparent transition-all"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Quick Favorites & View switches */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setOnlyFavorites(!onlyFavorites)}
                className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  onlyFavorites
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
                title="Afficher uniquement les matchs de mes clubs suivis"
              >
                <Star className={`w-3.5 h-3.5 ${onlyFavorites ? 'fill-white' : ''}`} />
                <span>Mes clubs ({favoriteIds.length})</span>
              </button>

              <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/80">
                <button
                  onClick={() => setSelectedViewMode('grouped')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    selectedViewMode === 'grouped'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Par date
                </button>
                <button
                  onClick={() => setSelectedViewMode('cards')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    selectedViewMode === 'cards'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Grille
                </button>
              </div>

              {isFiltered && (
                <button
                  onClick={resetFilters}
                  className="px-3 py-2 text-xs font-bold text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Réinitialiser</span>
                </button>
              )}
            </div>
          </div>

          {/* Row 2: Competitions Filter Pills */}
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
              <Trophy className="w-3.5 h-3.5 text-[#ea580c]" />
              <span>Filtrer par compétition</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {availableCompetitions.map((comp) => {
                const isSelected = selectedCompetitionId === comp.id;
                return (
                  <button
                    key={comp.id}
                    onClick={() => setSelectedCompetitionId(comp.id)}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer select-none flex items-center gap-2 ${
                      isSelected
                        ? 'bg-[#004724] text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                    }`}
                  >
                    <span>{comp.name}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                        isSelected
                          ? 'bg-emerald-800 text-white'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {comp.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Row 3: Date & Status Filters */}
          <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
            {/* Date Quick Selector */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mr-1 flex items-center gap-1">
                <Clock className="w-3 h-3 text-[#ea580c]" />
                <span>Période :</span>
              </span>
              {(
                [
                  { id: 'all', label: 'Toutes les dates' },
                  { id: 'weekend-sept', label: 'Fin Septembre' },
                  { id: 'weekend-oct', label: 'Début Octobre' },
                  { id: 'oct-mid', label: 'Mi-Octobre (Coupes & Sélections)' },
                ] as { id: DateQuickFilter; label: string }[]
              ).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedDateFilter(tab.id)}
                  className={`px-3 py-1 rounded-md text-xs font-semibold cursor-pointer transition-colors ${
                    selectedDateFilter === tab.id
                      ? 'bg-[#ea580c] text-white font-bold'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Status Radio / Pills */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mr-1">
                Statut :
              </span>
              {(
                [
                  { id: 'all', label: 'Tous' },
                  { id: 'scheduled', label: 'À venir' },
                  { id: 'finished', label: 'Terminés' },
                ] as { id: StatusFilter; label: string }[]
              ).map((st) => (
                <button
                  key={st.id}
                  onClick={() => setSelectedStatus(st.id)}
                  className={`px-2.5 py-1 rounded-md text-xs font-bold cursor-pointer transition-colors ${
                    selectedStatus === st.id
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>
        </div>
        </Reveal>
      </section>

      {/* 3. PHASE DE GROUPES — CAN MINI FOOTBALL GUINÉE 2027 */}
      {canGroups.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 sm:px-6 py-4 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <span className="w-9 h-9 rounded-lg bg-[#004724] text-white flex items-center justify-center shrink-0">
                    <Trophy className="w-4 h-4" />
                  </span>
                  <div>
                    <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight">
                      Phase de groupes — CAN Mini Football Guinée 2027
                    </h2>
                    <p className="text-[11px] text-slate-500 font-medium">
                      Tirage au sort de Conakry · 24 nations · 6 groupes · 09 – 24 janvier 2027
                    </p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-50 text-[#ea580c] border border-orange-200 text-[10px] font-black uppercase tracking-wider self-start sm:self-auto shrink-0">
                  <Sparkles className="w-3 h-3" />
                  Groupe D : les Éléphants
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-4 sm:p-6">
                {canGroups.map((group) => (
                  <div
                    key={group.letter}
                    className={`rounded-xl border p-3 ${
                      group.letter === 'D'
                        ? 'border-[#ea580c]/40 bg-orange-50/50'
                        : 'border-slate-200 bg-slate-50/60'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                        Groupe {group.letter}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400">
                        {group.teams.length} équipes
                      </span>
                    </div>
                    <ul className="space-y-1">
                      {group.teams.map((team) => {
                        const isElephants = team === "Côte d'Ivoire";
                        const isWildCard = team.toLowerCase().includes('wild card');
                        return (
                          <li
                            key={team}
                            className={`flex items-center gap-2 text-xs ${
                              isElephants
                                ? 'font-black text-[#004724]'
                                : 'font-semibold text-slate-700'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                isElephants ? 'bg-[#ea580c]' : 'bg-slate-300'
                              }`}
                            />
                            <span className={isWildCard ? 'italic text-slate-500' : ''}>
                              {isWildCard ? 'Wild card (à désigner)' : team}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </section>
      )}

      {/* 4. MATCHES LIST OR EMPTY STATE */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {filteredMatches.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-lg mx-auto shadow-2xs">
            <div className="w-16 h-16 rounded-full bg-orange-100 text-[#ea580c] flex items-center justify-center mx-auto mb-4">
              <CalendarIcon className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-black text-slate-900 uppercase">
              Aucun match ne correspond aux critères
            </h3>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Essayez de modifier la date sélectionnée, la compétition ou le filtre des équipes favorites pour voir plus de rencontres.
            </p>
            <button
              onClick={resetFilters}
              className="mt-5 px-5 py-2.5 bg-[#004724] hover:bg-[#00381c] text-white text-xs font-bold uppercase rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              Afficher tous les matchs
            </button>
          </div>
        ) : selectedViewMode === 'grouped' ? (
          /* GROUPED BY DATE VIEW */
          <div className="space-y-8">
            {Object.entries(matchesByDate).map(([dateLabel, matches]) => (
              <div key={dateLabel} className="space-y-3">
                {/* Date Header Badge */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 bg-[#004724] text-white px-3.5 py-1.5 rounded-lg shadow-2xs font-black text-xs uppercase tracking-wide">
                    <CalendarIcon className="w-3.5 h-3.5 text-amber-400" />
                    <span>{dateLabel}</span>
                  </div>
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    {matches.length} {matches.length === 1 ? 'rencontre' : 'rencontres'}
                  </div>
                  <div className="flex-1 h-px bg-slate-200"></div>
                </div>

                {/* Matchs du jour : lignes à grille stricte (alignement vertical garanti) */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-2xs divide-y divide-slate-100 overflow-hidden">
                  <ul>
                    {matches.map((match, i) => (
                      <MatchRow
                        key={match.id}
                        match={match}
                        homeClub={CLUBS_DATA.find((c) => c.id === match.homeTeamId)}
                        awayClub={CLUBS_DATA.find((c) => c.id === match.awayTeamId)}
                        onSelectMatch={onSelectMatch}
                        onSelectClub={onSelectClub}
                        reveal
                        revealIndex={i}
                      />
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* CARDS GRID VIEW */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMatches.map((match) => (
              <MatchCard
                key={match.id}
                match={match}
                onSelectMatch={onSelectMatch}
                onSelectClub={onSelectClub}
                favoriteIds={favoriteIds}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

interface MatchCardProps {
  match: Match;
  onSelectMatch: (match: Match) => void;
  onSelectClub: (club: Club) => void;
  favoriteIds: string[];
}

const MatchCard: React.FC<MatchCardProps> = ({
  match,
  onSelectMatch,
  onSelectClub,
  favoriteIds,
}) => {
  const homeClub = CLUBS_DATA.find((c) => c.id === match.homeTeamId);
  const awayClub = CLUBS_DATA.find((c) => c.id === match.awayTeamId);

  const isHomeFav = favoriteIds.includes(match.homeTeamId);
  const isAwayFav = favoriteIds.includes(match.awayTeamId);

  const compLabel = match.competitionName || 'Championnat National';
  const roundLabel = match.roundName || `Journée ${match.journee}`;

  return (
    <div
      onClick={() => onSelectMatch(match)}
      className="fimf-card-lift group bg-white rounded-xl border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-slate-300 cursor-pointer p-4 flex flex-col justify-between"
    >
      {/* Top bar: Competition Badge & Time/Status */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200/60 truncate">
            {compLabel}
          </span>
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
            • {roundLabel}
          </span>
        </div>

        <div className="shrink-0 flex items-center gap-1.5">
          {match.status === 'finished' ? (
            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-700">
              Terminé
            </span>
          ) : (
            <span className="text-xs font-black text-[#ea580c] bg-orange-50 border border-orange-200/60 px-2 py-0.5 rounded">
              {match.timeStr}
            </span>
          )}
        </div>
      </div>

      {/* Main Teams Matchup Area */}
      <div className="py-4 space-y-3">
        {/* Home Team */}
        <div className="flex items-center justify-between gap-3">
          <div
            onClick={(e) => {
              if (homeClub) {
                e.stopPropagation();
                onSelectClub(homeClub);
              }
            }}
            className="flex items-center gap-2.5 min-w-0 hover:text-[#ea580c] transition-colors"
          >
            {homeClub && <ClubBadge id={homeClub.id} size="sm" />}
            <span className="text-xs sm:text-sm font-bold text-slate-900 truncate">
              {homeClub?.name || match.homeTeamId}
            </span>
            {isHomeFav && <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />}
          </div>

          <div className="text-sm font-black text-slate-900">
            {match.status === 'finished' ? (
              <span className="w-7 h-7 rounded-md bg-slate-100 flex items-center justify-center font-black">
                {match.scoreHome}
              </span>
            ) : (
              <span className="text-slate-300">-</span>
            )}
          </div>
        </div>

        {/* Away Team */}
        <div className="flex items-center justify-between gap-3">
          <div
            onClick={(e) => {
              if (awayClub) {
                e.stopPropagation();
                onSelectClub(awayClub);
              }
            }}
            className="flex items-center gap-2.5 min-w-0 hover:text-[#ea580c] transition-colors"
          >
            {awayClub && <ClubBadge id={awayClub.id} size="sm" />}
            <span className="text-xs sm:text-sm font-bold text-slate-900 truncate">
              {awayClub?.name || match.awayTeamId}
            </span>
            {isAwayFav && <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />}
          </div>

          <div className="text-sm font-black text-slate-900">
            {match.status === 'finished' ? (
              <span className="w-7 h-7 rounded-md bg-slate-100 flex items-center justify-center font-black">
                {match.scoreAway}
              </span>
            ) : (
              <span className="text-slate-300">-</span>
            )}
          </div>
        </div>
      </div>

      {/* Footer Info: Venue & Date */}
      <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
        <div className="flex items-center gap-1.5 truncate">
          <MapPin className="w-3 h-3 text-[#ea580c] shrink-0" />
          <span className="truncate">{match.venue}</span>
        </div>

        <div className="flex items-center gap-1 font-semibold text-slate-400 group-hover:text-[#ea580c] transition-colors shrink-0">
          <span>Détails</span>
          <ArrowRight className="w-3 h-3" />
        </div>
      </div>
    </div>
  );
};
