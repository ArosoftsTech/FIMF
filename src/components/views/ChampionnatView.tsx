import { ResponsiveImage } from '@/src/components/ResponsiveImage';
import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { MATCHES_DATA, CLUBS_DATA, Match, Club } from '@/src/data/fimfData';
import { ClubBadge } from '../ClubBadge';
import { MatchRow } from '../MatchRow';
import {
  Calendar,
  MapPin,
  ChevronDown,
  ArrowRight,
  Trophy,
  Users,
  CheckCircle2,
  CalendarDays,
} from 'lucide-react';

interface ChampionnatViewProps {
  onSelectMatch: (match: Match) => void;
  onSelectClub: (club: Club) => void;
  onNavigateClassement: () => void;
  onNavigateCalendrier?: () => void;
  /** Sous-onglet à ouvrir au montage (navigation profonde depuis le menu) */
  initialSubTab?: string;
}

type ChampionnatSubTab = 'presentation' | 'calendrier' | 'classement' | 'resultats' | 'equipes';

// ─────────────────────────────────────────────────────────────
// Programme officiel — Calendrier FIMF Édition 2026
// (Dossier Technique Mini Football 2026)
// ─────────────────────────────────────────────────────────────
const PROGRAMME_JOURNEES = [
  { jour: 'J1', day: 'Samedi', phase: 'Match d\'ouverture', details: "Cérémonie officielle et 1er match — Poule A", matches: 1 },
  { jour: 'J2', day: 'Dimanche', phase: 'Phase de poules', details: 'Fin de la 1re journée — Poules A et B', matches: 4 },
  { jour: 'J3', day: 'Samedi', phase: 'Phase de poules', details: 'Suite des matchs de poules', matches: 4 },
  { jour: 'J4', day: 'Dimanche', phase: 'Phase de poules', details: 'Suite des matchs de poules', matches: 4 },
  { jour: 'J5', day: 'Samedi', phase: 'Phase de poules', details: "Dernière journée décisive des poules", matches: 5 },
  { jour: 'J6', day: 'Dimanche', phase: 'Quarts de finale', details: "Les 8 meilleures équipes s'affrontent", matches: 4 },
  { jour: 'J7', day: 'Samedi', phase: 'Demi-finales', details: "Le dernier carré de la compétition", matches: 2 },
  { jour: 'J8', day: 'Dimanche', phase: 'Finales', details: 'Match pour la 3e place et grande finale', matches: 2 },
];

export const ChampionnatView: React.FC<ChampionnatViewProps> = ({
  onSelectMatch,
  onSelectClub,
  onNavigateClassement,
  onNavigateCalendrier,
  initialSubTab,
}) => {
  const [subTab, setSubTab] = useState<ChampionnatSubTab>(
    (initialSubTab as ChampionnatSubTab) ?? 'calendrier'
  );

  // Synchronise l'onglet si une navigation profonde arrive pendant que la page est ouverte
  useEffect(() => {
    if (initialSubTab) setSubTab(initialSubTab as ChampionnatSubTab);
  }, [initialSubTab]);
  const [season, setSeason] = useState('2024 - 2025');

  const journee3Matches = MATCHES_DATA.filter((m) => m.journee === 3);
  const journee4Matches = MATCHES_DATA.filter((m) => m.journee === 4);
  const finishedMatches = MATCHES_DATA.filter((m) => m.status === 'finished');

  return (
    <div className="space-y-8 pb-12">
      {/* 1. HERO BANNER */}
      <section className="relative overflow-hidden bg-[#004724] text-white">
        <div className="absolute inset-0 opacity-30">
          <ResponsiveImage
            name="hero_ivory_coast_minifootball_1790335944178.jpg"
            alt="Championnat National de Mini-Football"
            className="w-full h-full object-cover"
            priority
          />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight">
            CHAMPIONNAT NATIONAL
          </h1>
          <p className="text-emerald-100 text-sm sm:text-base md:text-lg max-w-2xl mt-2 font-medium">
            Le championnat officiel des clubs ivoiriens.
          </p>
        </div>
      </section>

      {/* 2. SUB-NAVIGATION TABS BAR */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-200 pb-3">
          <div className="flex flex-wrap items-center gap-2 sm:gap-4">
            {(
              [
                { id: 'presentation', label: 'Présentation' },
                { id: 'calendrier', label: 'Calendrier' },
                { id: 'classement', label: 'Classement' },
                { id: 'resultats', label: 'Résultats' },
                { id: 'equipes', label: 'Équipes' },
              ] as { id: ChampionnatSubTab; label: string }[]
            ).map((tab) => {
              const isActive = subTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setSubTab(tab.id)}
                  className={`relative px-4 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer select-none uppercase tracking-wide ${
                    isActive
                      ? 'text-white'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  {/* Indicateur actif qui glisse d'un onglet à l'autre. */}
                  {isActive && (
                    <motion.span
                      layoutId="championnat-subtab"
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

      {/* 3. SUBTAB CONTENT — fondu + léger glissement à chaque changement. */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          key={subTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
        >
        {/* CALENDRIER VIEW (exact layout as screenshot 3) */}
        {subTab === 'calendrier' && (
          <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">
                CALENDRIER DU CHAMPIONNAT
              </h2>
              {onNavigateCalendrier && (
                <button
                  onClick={onNavigateCalendrier}
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-[#006039] border border-emerald-200 text-xs font-bold uppercase transition-colors cursor-pointer"
                >
                  <Calendar className="w-3.5 h-3.5 text-[#ea580c]" />
                  <span>Ouvrir le calendrier global interactif</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* JOURNÉE 3 */}
            <JourneeSection
              title="JOURNÉE 3"
              phase="Phase Aller"
              accentClass="border-[#006039]"
              matches={journee3Matches}
              onSelectMatch={onSelectMatch}
              onSelectClub={onSelectClub}
            />

            {/* JOURNÉE 4 */}
            <JourneeSection
              title="JOURNÉE 4"
              phase="Phase Aller"
              accentClass="border-[#ea580c]"
              matches={journee4Matches}
              onSelectMatch={onSelectMatch}
              onSelectClub={onSelectClub}
            />
          </div>
        )}

        {/* PRÉSENTATION VIEW */}
        {subTab === 'presentation' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
                <div className="md:col-span-8 space-y-4">
                  <h3 className="text-xl font-black text-slate-900 uppercase">
                    Championnat National de Mini Football — Édition 2026
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                    Le sommet du mini football de club en Côte d'Ivoire. L'édition 2026 réunit les 12 meilleures formations ivoiriennes au Temple du Foot de l'Université d'Abidjan, sur 4 week-ends de compétition et 8 jours de match, pour un total de 26 rencontres. Le champion national décroche une place directe pour la Ligue des Champions Africaine AMC.
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                    {[
                      { value: '12', label: 'Équipes engagées' },
                      { value: '4', label: 'Week-ends de compétition' },
                      { value: '8', label: 'Jours de match' },
                      { value: '26', label: 'Matchs au total' },
                    ].map((s, i) => (
                      <div key={i} className="p-3.5 bg-emerald-50 rounded-lg border border-emerald-200 text-center">
                        <p className="font-black text-[#006039] text-lg">{s.value}</p>
                        <p className="text-[10px] font-bold uppercase text-emerald-900 mt-0.5 leading-tight">{s.label}</p>
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div className="p-3.5 bg-emerald-50 rounded-lg border border-emerald-200">
                      <p className="font-bold text-xs text-emerald-900 uppercase">Format officiel</p>
                      <p className="text-xs text-emerald-800 mt-1">
                        6 contre 6 (5 joueurs de champ + 1 gardien) • 2 × 25 min • Prolongations 2 × 5 min puis tirs au but
                      </p>
                    </div>
                    <div className="p-3.5 bg-orange-50 rounded-lg border border-orange-200">
                      <p className="font-bold text-xs text-orange-900 uppercase">Qualification continentale</p>
                      <p className="text-xs text-orange-800 mt-1">
                        Le vainqueur obtient une place directe pour la Ligue des Champions Africaine AMC
                      </p>
                    </div>
                  </div>
                </div>
                <div className="md:col-span-4">
                  <ResponsiveImage
                    name="championship_trophy_gold_1790335980246.jpg"
                    alt="Trophée Championnat"
                    className="rounded-lg shadow-sm w-full object-cover"
                  />
                </div>
              </div>
            </div>

            {/* Programme officiel des journées (Dossier Technique 2026) */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 space-y-5">
              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                  <CalendarDays className="w-5 h-5 text-[#006039]" />
                  Programme officiel des journées — Édition 2026
                </h3>
                <p className="text-xs text-slate-600 mt-1">
                  Lieu unique : <span className="font-bold text-slate-800">Temple du Foot de l'Université — Abidjan</span>. Entrée libre pour le grand public, places assises en tribune dans la limite des capacités disponibles.
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Journée</th>
                      <th className="py-2.5 px-3">Jour</th>
                      <th className="py-2.5 px-3">Phase</th>
                      <th className="py-2.5 px-3">Détails</th>
                      <th className="py-2.5 px-3 text-center">Matchs</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {PROGRAMME_JOURNEES.map((j) => (
                      <tr key={j.jour} className="hover:bg-slate-50 transition-colors">
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 rounded bg-[#006039] text-white text-[10px] font-black">{j.jour}</span>
                        </td>
                        <td className="py-2.5 px-3 font-bold text-slate-800">{j.day}</td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              j.phase.includes('finale') || j.phase.includes('Finales')
                                ? 'bg-orange-100 text-orange-900'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {j.phase}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-600">{j.details}</td>
                        <td className="py-2.5 px-3 text-center font-mono font-black text-slate-900">{j.matches}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-50 border-t-2 border-slate-200">
                      <td colSpan={4} className="py-2.5 px-3 font-black text-slate-900 uppercase text-[11px]">
                        Total — 18 rencontres en phase de poules • 8 en phase finale
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono font-black text-[#ea580c]">26</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <p className="text-[11px] text-slate-500 italic border-t border-slate-100 pt-3">
                « Ensemble pour la passion, la discipline et la victoire ! » — Résultats, classements et temps forts à suivre sur les canaux officiels de la FIMF.
              </p>
            </div>
          </div>
        )}

        {/* CLASSEMENT TAB */}
        {subTab === 'classement' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase text-slate-700">Classement actuel de la Division 1</h3>
              <button
                onClick={onNavigateClassement}
                className="text-xs font-bold text-[#ea580c] hover:underline"
              >
                Voir la page complète du classement →
              </button>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3 text-center w-10">#</th>
                    <th className="py-2.5 px-4">ÉQUIPE</th>
                    <th className="py-2.5 px-2 text-center font-mono">J</th>
                    <th className="py-2.5 px-2 text-center font-mono">G</th>
                    <th className="py-2.5 px-2 text-center font-mono">N</th>
                    <th className="py-2.5 px-2 text-center font-mono">P</th>
                    <th className="py-2.5 px-2 text-center font-mono">BP</th>
                    <th className="py-2.5 px-2 text-center font-mono">BC</th>
                    <th className="py-2.5 px-2 text-center font-mono">+/-</th>
                    <th className="py-2.5 px-3 text-center font-mono font-bold text-[#006039]">PTS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {CLUBS_DATA.map((club, idx) => (
                    <tr
                      key={club.id}
                      onClick={() => onSelectClub(club)}
                      className="hover:bg-slate-50 transition-colors cursor-pointer group"
                    >
                      <td className="py-3 px-3 text-center font-bold font-mono text-slate-600">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <ClubBadge id={club.id} size="sm" />
                          <span className="font-bold text-slate-900 group-hover:text-[#006039]">
                            {club.name}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-2 text-center font-mono text-slate-600">{club.stats.played}</td>
                      <td className="py-3 px-2 text-center font-mono text-slate-600">{club.stats.won}</td>
                      <td className="py-3 px-2 text-center font-mono text-slate-600">{club.stats.drawn}</td>
                      <td className="py-3 px-2 text-center font-mono text-slate-600">{club.stats.lost}</td>
                      <td className="py-3 px-2 text-center font-mono text-slate-600">{club.stats.goalsFor}</td>
                      <td className="py-3 px-2 text-center font-mono text-slate-600">{club.stats.goalsAgainst}</td>
                      <td className="py-3 px-2 text-center font-mono font-semibold text-slate-700">
                        {club.stats.goalDiff > 0 ? `+${club.stats.goalDiff}` : club.stats.goalDiff}
                      </td>
                      <td className="py-3 px-3 text-center font-mono font-black text-slate-900 bg-slate-50/70">
                        {club.stats.points}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* RÉSULTATS TAB */}
        {subTab === 'resultats' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase text-slate-700">Derniers scores enregistrés (Journée 2)</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {finishedMatches.map((m) => {
                const home = CLUBS_DATA.find((c) => c.id === m.homeTeamId);
                const away = CLUBS_DATA.find((c) => c.id === m.awayTeamId);
                return (
                  <div
                    key={m.id}
                    onClick={() => onSelectMatch(m)}
                    className="fimf-card-lift p-4 bg-white rounded-xl border border-slate-200 shadow-2xs hover:shadow-md cursor-pointer space-y-3"
                  >
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>{m.dateStr}</span>
                      <span className="font-semibold text-emerald-800">{m.venue}</span>
                    </div>
                    {/* Confrontation en grille stricte 1fr / auto / 1fr : le score reste centré */}
                    <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 font-bold text-slate-900 text-sm">
                      <div className="flex items-center justify-end gap-2 min-w-0">
                        <span className="truncate text-right" title={home?.name}>{home?.shortName}</span>
                        <ClubBadge id={m.homeTeamId} size="sm" />
                      </div>
                      <div className="px-3 py-1 bg-slate-100 rounded font-mono font-black text-base whitespace-nowrap">
                        {m.scoreHome} - {m.scoreAway}
                      </div>
                      <div className="flex items-center gap-2 min-w-0">
                        <ClubBadge id={m.awayTeamId} size="sm" />
                        <span className="truncate" title={away?.name}>{away?.shortName}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[11px] font-bold text-[#ea580c] uppercase">Consulter feuille de match →</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ÉQUIPES TAB */}
        {subTab === 'equipes' && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {CLUBS_DATA.map((club) => (
              <div
                key={club.id}
                onClick={() => onSelectClub(club)}
                className="fimf-card-lift p-4 bg-white rounded-xl border border-slate-200 text-center shadow-2xs hover:shadow-md cursor-pointer group"
              >
                <ClubBadge id={club.id} size="lg" className="mx-auto mb-2" />
                <h4 className="font-bold text-xs sm:text-sm text-slate-900 group-hover:text-[#006039] transition-colors">
                  {club.name}
                </h4>
                <p className="text-[11px] text-slate-500">{club.city}</p>
                <span className="inline-block mt-2 text-[10px] font-bold text-[#ea580c] uppercase">
                  Voir profil →
                </span>
              </div>
            ))}
          </div>
        )}
        </motion.div>
      </section>
    </div>
  );
};

/** Bloc « JOURNÉE X » : bandeau + liste de lignes de match à grille stricte (MatchRow). */
const JourneeSection: React.FC<{
  title: string;
  phase: string;
  accentClass: string;
  matches: Match[];
  onSelectMatch: (match: Match) => void;
  onSelectClub: (club: Club) => void;
}> = ({ title, phase, accentClass, matches, onSelectMatch, onSelectClub }) => (
  <div className="space-y-3">
    <div className={`bg-slate-100 px-4 py-2 rounded-lg border-l-4 ${accentClass} flex items-center justify-between`}>
      <span className="font-black text-xs sm:text-sm text-slate-800 uppercase tracking-wider">
        {title}
      </span>
      <span className="text-[11px] font-semibold text-slate-500">{phase}</span>
    </div>

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
);
