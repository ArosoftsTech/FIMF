import React, { useState } from 'react';
import { Match, CLUBS_DATA, Club } from '@/src/data/fimfData';
import { usePredictions } from '@/src/hooks/usePredictions';
import { ClubBadge } from './ClubBadge';
import { useAuth } from '../context/AuthContext';
import { Lock } from 'lucide-react';
import {
  Trophy,
  Sparkles,
  Flame,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ArrowRight,
  TrendingUp,
  Clock,
  Award,
  Zap,
  Check,
  RefreshCw,
} from 'lucide-react';

interface PronosticsModuleProps {
  matches: Match[];
  onSelectMatch: (match: Match) => void;
  onSelectClub: (club: Club) => void;
  /** Ouvre le popup de connexion (teaser invités) ou l'espace membre (membres). */
  onOpenAuth: () => void;
  /** Navigue vers l'espace membre (CTA membres connectés). */
  onMemberArea: () => void;
}

export const PronosticsModule: React.FC<PronosticsModuleProps> = ({
  matches,
  onSelectMatch,
  onSelectClub,
  onOpenAuth,
  onMemberArea,
}) => {
  const { user } = useAuth();
  const {
    predictions,
    savePrediction,
    evaluations,
    totalPoints,
    totalPredicted,
    finishedCount,
    exactCount,
    correctOutcomeCount,
    successRate,
  } = usePredictions();

  const [activeTab, setActiveTab] = useState<'upcoming' | 'compare'>('upcoming');
  const [editingScores, setEditingScores] = useState<Record<string, { home: number; away: number }>>({});
  const [recentlySaved, setRecentlySaved] = useState<string | null>(null);

  // Bandeau réservé aux membres : le jeu officiel (lots, tirages, bourses) se joue
  // dans l'espace membre ; ici les visiteurs s'entraînent localement.
  const memberGate = user ? (
    <div className="mt-3 flex flex-col sm:flex-row items-start sm:items-center gap-2">
      <span className="text-[11px] text-emerald-200 font-bold">🏆 Jeu officiel membres : lots & bourses à gagner</span>
      <button
        onClick={onMemberArea}
        className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-900 text-[10px] font-black uppercase tracking-wider transition-colors cursor-pointer"
      >
        Jouer dans MON ESPACE
      </button>
    </div>
  ) : (
    <div className="mt-3 flex flex-col sm:flex-row items-start sm:items-center gap-2">
      <span className="text-[11px] text-emerald-200/90 font-bold flex items-center gap-1.5">
        <Lock className="w-3 h-3 text-amber-400" />
        Jeu officiel réservé aux membres : lots à gagner + bourses d'études en Angleterre
      </span>
      <button
        onClick={onOpenAuth}
        className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-900 text-[10px] font-black uppercase tracking-wider transition-colors cursor-pointer"
      >
        Devenir membre pour jouer
      </button>
    </div>
  );

  // Filter matches into upcoming & finished
  const upcomingMatches = matches.filter((m) => m.status === 'scheduled');
  const finishedMatches = matches.filter((m) => m.status === 'finished');

  const getScoreInput = (matchId: string) => {
    if (editingScores[matchId] !== undefined) {
      return editingScores[matchId];
    }
    const existing = predictions[matchId];
    if (existing) {
      return { home: existing.predictedHome, away: existing.predictedAway };
    }
    return { home: 1, away: 0 };
  };

  const handleScoreChange = (matchId: string, side: 'home' | 'away', delta: number) => {
    const current = getScoreInput(matchId);
    const newScore = Math.max(0, current[side] + delta);
    setEditingScores((prev) => ({
      ...prev,
      [matchId]: {
        ...current,
        [side]: newScore,
      },
    }));
  };

  const handleValidatePrediction = (matchId: string) => {
    const score = getScoreInput(matchId);
    savePrediction(matchId, score.home, score.away);
    setRecentlySaved(matchId);
    setTimeout(() => setRecentlySaved(null), 2500);
  };

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="bg-gradient-to-br from-slate-900 via-[#00381c] to-[#002412] rounded-2xl text-white overflow-hidden shadow-xl border border-emerald-800/40">
        {/* Top Header Banner */}
        <div className="p-5 sm:p-7 border-b border-emerald-800/60 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-800/80 border border-emerald-600/50 text-emerald-200 text-[11px] font-black uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>JEU OFFICIEL & PRONOSTICS FIMF</span>
            </div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-black uppercase tracking-tight flex items-center gap-2.5">
              <span>L'ŒIL D'EXPERT : VOS PRONOSTICS</span>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#ea580c] text-white">
                Saison 2024-2025
              </span>
            </h2>
            <p className="text-xs sm:text-sm text-emerald-100/90 mt-1 max-w-2xl font-medium leading-relaxed">
              Prédisez les scores des rencontres de Mini-Football, marquez 3 points par score exact et 1 point par bonne issue de match (Victoire/Nul/Défaite) !
            </p>
            {memberGate}
          </div>

          {/* Gamification Stats Dashboard Card */}
          <div className="flex items-center gap-3 sm:gap-4 bg-emerald-950/80 border border-emerald-700/60 rounded-xl p-3.5 sm:p-4 backdrop-blur-xs self-start md:self-auto shrink-0 shadow-inner">
            <div className="text-center px-2">
              <div className="text-2xl sm:text-3xl font-black text-amber-400 font-mono">
                {totalPoints}
              </div>
              <div className="text-[10px] font-black text-emerald-200 uppercase tracking-wider">
                Pts Gagnés
              </div>
            </div>
            <div className="w-px h-10 bg-emerald-800/80"></div>
            <div className="text-center px-2">
              <div className="text-lg sm:text-xl font-black text-white font-mono">
                {exactCount}
              </div>
              <div className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider">
                Scores Exacts
              </div>
            </div>
            <div className="w-px h-10 bg-emerald-800/80"></div>
            <div className="text-center px-2">
              <div className="text-lg sm:text-xl font-black text-emerald-400 font-mono">
                {successRate}%
              </div>
              <div className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider">
                Réussite
              </div>
            </div>
          </div>
        </div>

        {/* Tab switch */}
        <div className="px-5 sm:px-7 pt-4 bg-black/20 flex flex-wrap items-center justify-between gap-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('upcoming')}
              className={`px-4 py-2 rounded-t-xl text-xs font-black uppercase transition-all cursor-pointer flex items-center gap-2 border-b-2 ${
                activeTab === 'upcoming'
                  ? 'bg-white/10 text-amber-400 border-amber-400 font-extrabold shadow-sm'
                  : 'text-slate-300 hover:text-white border-transparent hover:bg-white/5'
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-[#ea580c]" />
              <span>Matchs à Pronostiquer ({upcomingMatches.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('compare')}
              className={`px-4 py-2 rounded-t-xl text-xs font-black uppercase transition-all cursor-pointer flex items-center gap-2 border-b-2 ${
                activeTab === 'compare'
                  ? 'bg-white/10 text-amber-400 border-amber-400 font-extrabold shadow-sm'
                  : 'text-slate-300 hover:text-white border-transparent hover:bg-white/5'
              }`}
            >
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span>Comparatif des Résultats Terminés ({finishedMatches.length})</span>
            </button>
          </div>

          <div className="text-[11px] text-emerald-200/80 font-semibold pb-2 sm:pb-0 hidden sm:block">
            {totalPredicted} pronostic(s) enregistré(s) localement
          </div>
        </div>

        {/* Tab 1: UPCOMING MATCHES FOR PREDICTIONS */}
        {activeTab === 'upcoming' && (
          <div className="p-5 sm:p-7 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {upcomingMatches.slice(0, 6).map((match) => {
                const homeClub = CLUBS_DATA.find((c) => c.id === match.homeTeamId);
                const awayClub = CLUBS_DATA.find((c) => c.id === match.awayTeamId);
                const score = getScoreInput(match.id);
                const isSaved = !!predictions[match.id];
                const isRecentlyUpdated = recentlySaved === match.id;

                return (
                  <div
                    key={match.id}
                    className="bg-white/10 backdrop-blur-md rounded-xl border border-white/10 p-4 flex flex-col justify-between hover:border-emerald-500/50 transition-all shadow-md group"
                  >
                    {/* Header info */}
                    <div className="flex items-center justify-between text-[11px] pb-2 border-b border-white/10">
                      <span className="font-black text-[#ea580c] uppercase">
                        {match.competitionName || 'Championnat'} • {match.roundName || `J${match.journee}`}
                      </span>
                      <span className="text-emerald-200 font-medium">
                        {match.dateStr.split(' ')[0]} {match.dateStr.split(' ')[1]} à {match.timeStr}
                      </span>
                    </div>

                    {/* Matchup & Score Stepper */}
                    <div className="py-4 space-y-3">
                      {/* Home team */}
                      <div className="flex items-center justify-between gap-2">
                        <div
                          onClick={() => homeClub && onSelectClub(homeClub)}
                          className="flex items-center gap-2 cursor-pointer hover:text-amber-300 transition-colors truncate"
                        >
                          {homeClub && <ClubBadge id={homeClub.id} size="sm" />}
                          <span className="text-xs font-bold text-white truncate">
                            {homeClub?.shortName || match.homeTeamId}
                          </span>
                        </div>

                        {/* Home Score Counter */}
                        <div className="flex items-center gap-1.5 bg-black/40 rounded-lg p-1 border border-white/10 shrink-0">
                          <button
                            onClick={() => handleScoreChange(match.id, 'home', -1)}
                            className="w-6 h-6 rounded bg-white/10 hover:bg-white/20 text-white font-bold flex items-center justify-center cursor-pointer transition-colors text-xs"
                          >
                            -
                          </button>
                          <span className="w-6 text-center font-mono font-black text-sm text-amber-400">
                            {score.home}
                          </span>
                          <button
                            onClick={() => handleScoreChange(match.id, 'home', 1)}
                            className="w-6 h-6 rounded bg-white/10 hover:bg-white/20 text-white font-bold flex items-center justify-center cursor-pointer transition-colors text-xs"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* Away team */}
                      <div className="flex items-center justify-between gap-2">
                        <div
                          onClick={() => awayClub && onSelectClub(awayClub)}
                          className="flex items-center gap-2 cursor-pointer hover:text-amber-300 transition-colors truncate"
                        >
                          {awayClub && <ClubBadge id={awayClub.id} size="sm" />}
                          <span className="text-xs font-bold text-white truncate">
                            {awayClub?.shortName || match.awayTeamId}
                          </span>
                        </div>

                        {/* Away Score Counter */}
                        <div className="flex items-center gap-1.5 bg-black/40 rounded-lg p-1 border border-white/10 shrink-0">
                          <button
                            onClick={() => handleScoreChange(match.id, 'away', -1)}
                            className="w-6 h-6 rounded bg-white/10 hover:bg-white/20 text-white font-bold flex items-center justify-center cursor-pointer transition-colors text-xs"
                          >
                            -
                          </button>
                          <span className="w-6 text-center font-mono font-black text-sm text-amber-400">
                            {score.away}
                          </span>
                          <button
                            onClick={() => handleScoreChange(match.id, 'away', 1)}
                            className="w-6 h-6 rounded bg-white/10 hover:bg-white/20 text-white font-bold flex items-center justify-center cursor-pointer transition-colors text-xs"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Submit / Action button */}
                    <div className="pt-2 border-t border-white/10 flex items-center justify-between gap-2">
                      <div className="text-[10px] text-emerald-200 truncate">
                        {match.venue}
                      </div>

                      <button
                        onClick={() => handleValidatePrediction(match.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase transition-all flex items-center gap-1.5 cursor-pointer shrink-0 shadow-xs ${
                          isRecentlyUpdated
                            ? 'bg-emerald-500 text-white'
                            : isSaved
                            ? 'bg-amber-500 hover:bg-amber-600 text-slate-900'
                            : 'bg-[#ea580c] hover:bg-[#c2410c] text-white'
                        }`}
                      >
                        {isRecentlyUpdated ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Enregistré !</span>
                          </>
                        ) : isSaved ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5" />
                            <span>Modifier ({predictions[match.id].predictedHome}-{predictions[match.id].predictedAway})</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Valider</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 2: COMPARE USER PREDICTIONS VS ACTUAL RESULTS */}
        {activeTab === 'compare' && (
          <div className="p-5 sm:p-7 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {finishedMatches.map((match) => {
                const evalItem = evaluations.find((e) => e.matchId === match.id);
                const homeClub = CLUBS_DATA.find((c) => c.id === match.homeTeamId);
                const awayClub = CLUBS_DATA.find((c) => c.id === match.awayTeamId);

                const hasPred = evalItem?.hasPredicted;
                const points = evalItem?.pointsEarned || 0;
                const resultOutcome = evalItem?.outcomeResult;

                return (
                  <div
                    key={match.id}
                    onClick={() => onSelectMatch(match)}
                    className="bg-white/10 backdrop-blur-md rounded-xl border border-white/10 p-4.5 hover:border-emerald-400 transition-all cursor-pointer flex flex-col justify-between"
                  >
                    <div>
                      {/* Top bar with result verdict badge */}
                      <div className="flex items-center justify-between pb-2 border-b border-white/10 text-xs">
                        <span className="font-black text-[#ea580c] uppercase text-[11px]">
                          {match.competitionName || 'Championnat'} • {match.roundName || `Journée ${match.journee}`}
                        </span>

                        <div>
                          {resultOutcome === 'exact' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500 text-white font-black text-[10px] shadow-sm uppercase">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Score Exact (+3 pts)</span>
                            </span>
                          )}
                          {resultOutcome === 'correct_outcome' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500 text-slate-950 font-black text-[10px] shadow-sm uppercase">
                              <Award className="w-3 h-3" />
                              <span>Bon Vainqueur (+1 pt)</span>
                            </span>
                          )}
                          {resultOutcome === 'wrong' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-600 text-white font-bold text-[10px] shadow-sm uppercase">
                              <XCircle className="w-3 h-3" />
                              <span>Pronostic Manqué (0 pt)</span>
                            </span>
                          )}
                          {!hasPred && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/20 text-slate-200 font-semibold text-[10px]">
                              <HelpCircle className="w-3 h-3" />
                              <span>Non pronostiqué</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Main Comparison Area: Actual Score vs Predicted Score */}
                      <div className="py-4 grid grid-cols-5 items-center gap-3 text-center">
                        {/* Home team */}
                        <div className="col-span-2 text-left space-y-1">
                          <div className="flex items-center gap-2">
                            {homeClub && <ClubBadge id={homeClub.id} size="sm" />}
                            <span className="font-bold text-xs sm:text-sm text-white truncate">
                              {homeClub?.name}
                            </span>
                          </div>
                          <div className="text-[10px] text-emerald-200 font-mono">
                            Pronostic : <span className="font-bold text-amber-300">{evalItem?.predictedHome ?? '-'}</span>
                          </div>
                        </div>

                        {/* Scores column */}
                        <div className="col-span-1 flex flex-col items-center justify-center">
                          <div className="bg-emerald-950/90 border border-emerald-600 px-3 py-1.5 rounded-lg text-sm sm:text-base font-black text-white font-mono shadow-inner">
                            {match.scoreHome} - {match.scoreAway}
                          </div>
                          <span className="text-[9px] font-bold text-emerald-300 uppercase mt-0.5">
                            Score Réel
                          </span>
                        </div>

                        {/* Away team */}
                        <div className="col-span-2 text-right space-y-1">
                          <div className="flex items-center justify-end gap-2">
                            <span className="font-bold text-xs sm:text-sm text-white truncate">
                              {awayClub?.name}
                            </span>
                            {awayClub && <ClubBadge id={awayClub.id} size="sm" />}
                          </div>
                          <div className="text-[10px] text-emerald-200 font-mono">
                            Pronostic : <span className="font-bold text-amber-300">{evalItem?.predictedAway ?? '-'}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Bottom notes and points summary */}
                    <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-emerald-200">
                      <span>{match.dateStr}</span>
                      <div className="flex items-center gap-1 font-bold text-amber-300">
                        <span>Points rapportés :</span>
                        <span className="text-white font-mono font-black text-xs px-1.5 py-0.5 rounded bg-white/10">
                          +{points}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
