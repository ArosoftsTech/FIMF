import React from 'react';
import { Match, CLUBS_DATA } from '@/src/data/fimfData';
import { ClubBadge } from '../ClubBadge';
import { X, Calendar, MapPin, Award, Clock } from 'lucide-react';

interface MatchDetailsModalProps {
  match: Match | null;
  onClose: () => void;
  onViewClub: (clubId: string) => void;
}

export const MatchDetailsModal: React.FC<MatchDetailsModalProps> = ({
  match,
  onClose,
  onViewClub,
}) => {
  if (!match) return null;

  const homeClub = CLUBS_DATA.find((c) => c.id === match.homeTeamId);
  const awayClub = CLUBS_DATA.find((c) => c.id === match.awayTeamId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-overlay-in">
      <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl overflow-hidden border border-slate-200 animate-modal-in">
        {/* Header bar */}
        <div className="bg-[#004724] px-6 py-4 flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <span className="bg-[#ea580c] text-white text-[11px] font-bold px-2.5 py-0.5 rounded uppercase tracking-wider">
              {match.roundName || `JOURNÉE ${match.journee}`}
            </span>
            <span className="text-xs text-emerald-100 font-medium">
              {match.competitionName || 'Championnat National FIMF'}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-emerald-100 hover:text-white hover:bg-emerald-800/80 transition-colors"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Teams Matchup Scoreboard */}
        <div className="p-6 bg-slate-50 border-b border-slate-200">
          <div className="grid grid-cols-7 items-center text-center">
            {/* Home Team */}
            <div className="col-span-3 flex flex-col items-center">
              <button
                onClick={() => homeClub && onViewClub(homeClub.id)}
                className="group flex flex-col items-center hover:opacity-90 transition-opacity"
              >
                <ClubBadge id={match.homeTeamId} size="lg" className="mb-2" />
                <span className="font-black text-slate-900 text-sm sm:text-base group-hover:text-[#006039]">
                  {homeClub?.name || match.homeTeamId}
                </span>
                <span className="text-xs text-slate-500">{homeClub?.city}</span>
              </button>
            </div>

            {/* Score / VS Center */}
            <div className="col-span-1 flex flex-col items-center justify-center">
              {match.status === 'finished' ? (
                <div className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-emerald-900 text-white rounded-lg font-black text-xl tabular-nums shadow-xs">
                  <span>{match.scoreHome}</span>
                  <span className="text-emerald-400">-</span>
                  <span>{match.scoreAway}</span>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <span className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center font-black text-slate-600 text-xs">
                    VS
                  </span>
                  <span className="text-[10px] font-bold text-[#ea580c] mt-1 uppercase">À VENIR</span>
                </div>
              )}
            </div>

            {/* Away Team */}
            <div className="col-span-3 flex flex-col items-center">
              <button
                onClick={() => awayClub && onViewClub(awayClub.id)}
                className="group flex flex-col items-center hover:opacity-90 transition-opacity"
              >
                <ClubBadge id={match.awayTeamId} size="lg" className="mb-2" />
                <span className="font-black text-slate-900 text-sm sm:text-base group-hover:text-[#006039]">
                  {awayClub?.name || match.awayTeamId}
                </span>
                <span className="text-xs text-slate-500">{awayClub?.city}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Match Info Grid */}
        <div className="p-6 space-y-5 text-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200/80">
              <div className="p-2 rounded-md bg-emerald-100 text-emerald-800">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase font-semibold">Date & Heure</p>
                <p className="font-bold text-slate-900">{match.dateStr} à {match.timeStr}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200/80">
              <div className="p-2 rounded-md bg-orange-100 text-[#ea580c]">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase font-semibold">Lieu du match</p>
                <p className="font-bold text-slate-900">{match.venue}</p>
              </div>
            </div>
          </div>

          {match.referee && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200/80">
              <div className="p-2 rounded-md bg-emerald-100 text-emerald-800">
                <Award className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase font-semibold">Corps Arbitral FIMF</p>
                <p className="font-bold text-slate-900">{match.referee}</p>
              </div>
            </div>
          )}

          {/* Goal Scorers if finished */}
          {match.scorers && match.scorers.length > 0 && (
            <div className="pt-2 border-t border-slate-200">
              <p className="text-xs font-bold uppercase text-slate-500 mb-3 flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-emerald-700" /> Buteurs de la rencontre
              </p>
              <div className="space-y-2">
                {match.scorers.map((s, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs py-1.5 px-3 bg-slate-100 rounded-md">
                    <span className="font-bold text-slate-900">{s.player} ({s.team})</span>
                    <span className="font-mono font-bold text-emerald-700">{s.min}' ⚽</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Lineup summaries */}
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <p className="text-xs font-bold text-slate-700 uppercase mb-2">Entraîneur ({homeClub?.shortName})</p>
              <p className="text-xs font-medium text-slate-900">{homeClub?.coach || 'Staff FIMF'}</p>
              <p className="text-[11px] text-slate-500 mt-1">Capitaine: {homeClub?.squad[2]?.name || 'N/A'}</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <p className="text-xs font-bold text-slate-700 uppercase mb-2">Entraîneur ({awayClub?.shortName})</p>
              <p className="text-xs font-medium text-slate-900">{awayClub?.coach || 'Staff FIMF'}</p>
              <p className="text-[11px] text-slate-500 mt-1">Capitaine: {awayClub?.squad[1]?.name || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Modal Footer CTA */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
