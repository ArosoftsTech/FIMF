import { ResponsiveImage } from '@/src/components/ResponsiveImage';
import React, { useState } from 'react';
import { motion } from 'motion/react';
import { CLUBS_DATA, TOP_SCORERS, TOP_ASSISTS, Club } from '@/src/data/fimfData';
import { useFimfData } from '../../context/FimfDataContext';
import { ClubBadge } from '../ClubBadge';
import { Reveal } from '../anim/Reveal';
import { ChevronDown, Trophy, Target, Award, ArrowUpRight } from 'lucide-react';

interface ClassementViewProps {
  onSelectClub: (club: Club) => void;
}

type TabType = 'general' | 'domicile' | 'exterieur' | 'buteurs' | 'passeurs';

export const ClassementView: React.FC<ClassementViewProps> = ({ onSelectClub }) => {
  const { clubs: liveClubs } = useFimfData();
  const clubs = liveClubs.length > 0 ? liveClubs : CLUBS_DATA;
  const [activeTab, setActiveTab] = useState<TabType>('general');
  const [season, setSeason] = useState('2024 - 2025');

  const tabs: { id: TabType; label: string }[] = [
    { id: 'general', label: 'Classement général' },
    { id: 'domicile', label: 'Classement domicile' },
    { id: 'exterieur', label: 'Classement extérieur' },
    { id: 'buteurs', label: 'Buteurs' },
    { id: 'passeurs', label: 'Passeurs' },
  ];

  // Sort based on active tab
  const sortedClubs = [...CLUBS_DATA].sort((a, b) => {
    if (activeTab === 'domicile') return a.stats.homeRank - b.stats.homeRank;
    if (activeTab === 'exterieur') return a.stats.awayRank - b.stats.awayRank;
    return a.stats.rank - b.stats.rank;
  });

  return (
    <div className="space-y-8 pb-12">
      {/* 1. HERO BANNER */}
      <section className="relative overflow-hidden bg-[#004724] text-white">
        <div className="absolute inset-0 opacity-30">
          <ResponsiveImage
            name="hero_ivory_coast_minifootball_1790335944178.jpg"
            alt="Classement du Championnat National"
            className="w-full h-full object-cover"
            priority
          />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight">
            CLASSEMENT
          </h1>
          <p className="text-emerald-100 text-sm sm:text-base md:text-lg max-w-2xl mt-2 font-medium">
            Suivez l'évolution du championnat national.
          </p>
        </div>
      </section>

      {/* 2. SUB-TABS & SEASON SELECTOR */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-200 pb-3">
          <div className="flex flex-wrap items-center gap-2 sm:gap-4">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative px-4 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer select-none uppercase tracking-wide ${
                    isActive
                      ? 'text-white'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  {isActive && (
                    <motion.span
                      layoutId="classement-tab"
                      className="absolute inset-0 bg-[#ea580c] rounded-lg shadow-xs"
                      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                      aria-hidden="true"
                    />
                  )}
                  <span className="relative">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Season Selector */}
          <div className="relative inline-block text-left shrink-0">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-bold text-slate-800 shadow-2xs">
              <span className="text-slate-500 font-normal">SAISON</span>
              <select
                value={season}
                onChange={(e) => setSeason(e.target.value)}
                className="bg-transparent focus:outline-none cursor-pointer font-bold pr-2"
              >
                <option value="2024 - 2025">2024 - 2025</option>
                <option value="2025 - 2026">2025 - 2026</option>
                <option value="2023 - 2024">2023 - 2024</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 pointer-events-none -ml-2" />
            </div>
          </div>
        </div>
      </section>

      {/* 3. TABLE / LIST CONTENT — fondu + léger glissement à chaque onglet. */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal>
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
        >
        {/* RANKINGS TABLES (General, Home, Away) */}
        {(activeTab === 'general' || activeTab === 'domicile' || activeTab === 'exterieur') && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between text-xs gap-2">
              <div className="flex items-center gap-2 font-bold text-slate-700 uppercase">
                <Trophy className="w-4 h-4 text-[#ea580c]" />
                <span>
                  Tableau Officiel • {activeTab === 'general' ? 'Général' : activeTab === 'domicile' ? 'À Domicile' : 'À l\'Extérieur'}
                </span>
              </div>
              <span className="text-slate-500 text-[11px]">
                Qualification Play-offs : Places 1 à 4
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left min-w-[640px]">
                <thead className="bg-slate-100 text-[11px] font-bold text-slate-500 uppercase border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-3 text-center w-12">#</th>
                    <th className="py-3 px-4">ÉQUIPE</th>
                    <th className="py-3 px-2 text-center font-mono" title="Joués">J</th>
                    <th className="py-3 px-2 text-center font-mono" title="Gagnés">G</th>
                    <th className="py-3 px-2 text-center font-mono" title="Nuls">N</th>
                    <th className="py-3 px-2 text-center font-mono" title="Perdus">P</th>
                    <th className="py-3 px-2 text-center font-mono" title="Buts pour">BP</th>
                    <th className="py-3 px-2 text-center font-mono" title="Buts contre">BC</th>
                    <th className="py-3 px-2 text-center font-mono" title="Différence de buts">+/-</th>
                    <th className="py-3 px-4 text-center font-mono font-bold text-[#006039]" title="Points">PTS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sortedClubs.map((club, idx) => {
                    const rank = idx + 1;
                    const isPlayoffZone = rank <= 4;
                    return (
                      <tr
                        key={club.id}
                        onClick={() => onSelectClub(club)}
                        className={`hover:bg-slate-50 transition-colors cursor-pointer group ${
                          isPlayoffZone ? 'border-l-4 border-[#006039]' : 'border-l-4 border-transparent'
                        }`}
                      >
                        <td className="py-3.5 px-3 text-center font-black font-mono">
                          <span
                            className={`w-6 h-6 mx-auto rounded-full flex items-center justify-center text-xs ${
                              rank === 1
                                ? 'bg-amber-100 text-amber-900 font-black'
                                : rank === 2
                                ? 'bg-slate-200 text-slate-800'
                                : rank === 3
                                ? 'bg-orange-100 text-orange-900'
                                : 'text-slate-600'
                            }`}
                          >
                            {rank}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <ClubBadge id={club.id} size="sm" />
                            <div>
                              <span className="font-bold text-slate-900 group-hover:text-[#006039] transition-colors block">
                                {club.name}
                              </span>
                              <span className="text-[11px] text-slate-400">
                                {club.commune}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-2 text-center font-mono text-slate-600 font-medium">{club.stats.played}</td>
                        <td className="py-3.5 px-2 text-center font-mono text-slate-600 font-medium">{club.stats.won}</td>
                        <td className="py-3.5 px-2 text-center font-mono text-slate-600 font-medium">{club.stats.drawn}</td>
                        <td className="py-3.5 px-2 text-center font-mono text-slate-600 font-medium">{club.stats.lost}</td>
                        <td className="py-3.5 px-2 text-center font-mono text-slate-600 font-medium">{club.stats.goalsFor}</td>
                        <td className="py-3.5 px-2 text-center font-mono text-slate-600 font-medium">{club.stats.goalsAgainst}</td>
                        <td className="py-3.5 px-2 text-center font-mono font-bold text-slate-700">
                          {club.stats.goalDiff > 0 ? `+${club.stats.goalDiff}` : club.stats.goalDiff}
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono font-black text-slate-900 text-sm bg-slate-50/70">
                          {club.stats.points}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Table Footnote */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center gap-6 text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-[#006039] rounded-xs" />
                <span>Zone Play-offs (Final Four)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-slate-300 rounded-xs" />
                <span>Maintien en Division 1</span>
              </div>
            </div>
          </div>
        )}

        {/* BUTEURS TAB */}
        {activeTab === 'buteurs' && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 font-bold text-slate-800 uppercase">
                <Target className="w-4 h-4 text-[#ea580c]" />
                <span>Classement des Meilleurs Buteurs (Soulier d'Or FIMF)</span>
              </div>
            </div>

            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 text-[11px] font-bold text-slate-500 uppercase border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3 text-center w-12">#</th>
                  <th className="py-3 px-4">Joueur</th>
                  <th className="py-3 px-4">Club</th>
                  <th className="py-3 px-3 text-center font-mono">Matchs</th>
                  <th className="py-3 px-3 text-center font-mono">Penalties</th>
                  <th className="py-3 px-4 text-right font-mono font-bold text-[#ea580c]">Total Buts</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {TOP_SCORERS.map((scorer) => {
                  const club = CLUBS_DATA.find((c) => c.name === scorer.team);
                  return (
                    <tr
                      key={scorer.rank}
                      onClick={() => club && onSelectClub(club)}
                      className="hover:bg-slate-50 transition-colors cursor-pointer group"
                    >
                      <td className="py-3.5 px-3 text-center font-black font-mono text-slate-600">
                        {scorer.rank}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900 group-hover:text-[#ea580c]">
                        {scorer.name}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 flex items-center gap-2">
                        {club && <ClubBadge id={club.id} size="xs" />}
                        <span>{scorer.team}</span>
                      </td>
                      <td className="py-3.5 px-3 text-center font-mono text-slate-600">{scorer.matches}</td>
                      <td className="py-3.5 px-3 text-center font-mono text-slate-600">{scorer.penalties}</td>
                      <td className="py-3.5 px-4 text-right font-mono font-black text-slate-900 text-sm">
                        {scorer.goals} ⚽
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* PASSEURS TAB */}
        {activeTab === 'passeurs' && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 font-bold text-slate-800 uppercase">
                <Award className="w-4 h-4 text-[#006039]" />
                <span>Classement des Meilleurs Passeurs Décisifs</span>
              </div>
            </div>

            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 text-[11px] font-bold text-slate-500 uppercase border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3 text-center w-12">#</th>
                  <th className="py-3 px-4">Joueur</th>
                  <th className="py-3 px-4">Club</th>
                  <th className="py-3 px-3 text-center font-mono">Matchs</th>
                  <th className="py-3 px-4 text-right font-mono font-bold text-[#006039]">Passes Décisives</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {TOP_ASSISTS.map((assist) => {
                  const club = CLUBS_DATA.find((c) => c.name === assist.team);
                  return (
                    <tr
                      key={assist.rank}
                      onClick={() => club && onSelectClub(club)}
                      className="hover:bg-slate-50 transition-colors cursor-pointer group"
                    >
                      <td className="py-3.5 px-3 text-center font-black font-mono text-slate-600">
                        {assist.rank}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900 group-hover:text-[#006039]">
                        {assist.name}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 flex items-center gap-2">
                        {club && <ClubBadge id={club.id} size="xs" />}
                        <span>{assist.team}</span>
                      </td>
                      <td className="py-3.5 px-3 text-center font-mono text-slate-600">{assist.matches}</td>
                      <td className="py-3.5 px-4 text-right font-mono font-black text-slate-900 text-sm">
                        {assist.assists} 🎯
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        </motion.div>
        </Reveal>
      </section>
    </div>
  );
};
