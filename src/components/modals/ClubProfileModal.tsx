import React, { useState } from 'react';
import { Club } from '@/src/data/fimfData';
import { ClubBadge } from '../ClubBadge';
import { ClubPlayerStatsView } from '../ClubPlayerStatsView';
import { StadiumWeatherWidget } from '../StadiumWeatherWidget';
import {
  X,
  Trophy,
  MapPin,
  User,
  ShieldCheck,
  Users,
  Star,
  Check,
  BarChart3,
  Flame,
  Shield,
  Zap,
  CloudSun,
} from 'lucide-react';

interface ClubProfileModalProps {
  club: Club | null;
  onClose: () => void;
  isFavorite?: boolean;
  onToggleFavorite?: (clubId: string) => void;
  onSelectCompetition?: () => void;
}

type ClubModalTab = 'overview' | 'stats' | 'squad' | 'weather';

export const ClubProfileModal: React.FC<ClubProfileModalProps> = ({
  club,
  onClose,
  isFavorite = false,
  onToggleFavorite,
  onSelectCompetition,
}) => {
  const [activeTab, setActiveTab] = useState<ClubModalTab>('stats');

  if (!club) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-overlay-in">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 animate-modal-in max-h-[92vh] flex flex-col">
        {/* Header with club primary color gradient */}
        <div className="relative bg-gradient-to-r from-[#004724] to-[#062e1c] p-6 text-white shrink-0">
          <div className="absolute top-4 right-4 flex items-center gap-2">
            {onToggleFavorite && (
              <button
                onClick={() => onToggleFavorite(club.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer select-none ${
                  isFavorite
                    ? 'bg-amber-400 text-amber-950 hover:bg-amber-300 ring-2 ring-amber-300'
                    : 'bg-white/20 hover:bg-white/30 text-white backdrop-blur-xs'
                }`}
                title={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
              >
                <Star
                  className={`w-3.5 h-3.5 ${
                    isFavorite ? 'fill-amber-950 text-amber-950' : 'text-white'
                  }`}
                />
                <span>{isFavorite ? 'Suivi ★' : 'Suivre ce club'}</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-emerald-100 hover:text-white hover:bg-emerald-800/80 transition-colors cursor-pointer"
              aria-label="Fermer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 pt-4 sm:pt-0">
            <ClubBadge id={club.id} size="xl" className="bg-white/10 p-2 rounded-xl backdrop-blur-xs shrink-0" />
            <div className="text-center sm:text-left">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
                <span className="bg-[#ea580c] text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                  {club.division}
                </span>
                {isFavorite && (
                  <span className="bg-amber-400/90 text-amber-950 text-[10px] font-bold px-2 py-0.5 rounded uppercase flex items-center gap-1">
                    <Star className="w-2.5 h-2.5 fill-amber-950" />
                    Club Favori
                  </span>
                )}
                <span className="text-xs text-emerald-200">Affiliation FIMF certifiée</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white">{club.name}</h2>
              <p className="text-xs sm:text-sm text-emerald-100 flex items-center justify-center sm:justify-start gap-1 mt-1">
                <MapPin className="w-3.5 h-3.5 text-amber-400" />
                {club.commune}, {club.city} • Fondé en {club.founded}
              </p>
            </div>
          </div>

          {/* Sub Navigation Tabs */}
          <div className="flex items-center gap-2 mt-5 pt-3 border-t border-emerald-800/80">
            <button
              onClick={() => setActiveTab('stats')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-black uppercase transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'stats'
                  ? 'bg-white text-[#004724] shadow-sm'
                  : 'text-emerald-100 hover:bg-emerald-900/60'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5 text-[#ea580c]" />
              <span>Statistiques Joueurs (Recharts)</span>
            </button>

            <button
              onClick={() => setActiveTab('overview')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-black uppercase transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'overview'
                  ? 'bg-white text-[#004724] shadow-sm'
                  : 'text-emerald-100 hover:bg-emerald-900/60'
              }`}
            >
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span>Bilan du Club</span>
            </button>

            <button
              onClick={() => setActiveTab('squad')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-black uppercase transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'squad'
                  ? 'bg-white text-[#004724] shadow-sm'
                  : 'text-emerald-100 hover:bg-emerald-900/60'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-sky-400" />
              <span>Effectif ({club.squad.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('weather')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-black uppercase transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'weather'
                  ? 'bg-white text-[#004724] shadow-sm'
                  : 'text-emerald-100 hover:bg-emerald-900/60'
              }`}
            >
              <CloudSun className="w-3.5 h-3.5 text-amber-300" />
              <span>Météo du Stade</span>
            </button>
          </div>
        </div>

        {/* Content body scrollable */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* TAB 0: STADIUM WEATHER */}
          {activeTab === 'weather' && (
            <div className="space-y-4">
              <StadiumWeatherWidget club={club} />

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-2">
                <h5 className="font-black text-slate-900 uppercase flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-[#ea580c]" />
                  Informations Terrain & Localisation FIMF
                </h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-600">
                  <div>
                    <span className="font-bold text-slate-700 block">Stade attitré :</span>
                    <span>{club.stadium}</span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-700 block">Localisation :</span>
                    <span>{club.commune}, District d'{club.city}</span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-700 block">Surface de jeu :</span>
                    <span>Gazon synthétique homologué Mini-Football (WMF/FIMF)</span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-700 block">Éclairage nocturne :</span>
                    <span>Oui (projecteurs LED homologués pour matchs en soirée)</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 1: ADVANCED RECHARTS STATS */}
          {activeTab === 'stats' && (
            <div className="space-y-4">
              <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-3.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#004724] text-white flex items-center justify-center font-black">
                    📊
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-900 uppercase">
                      Performances Individuelles des Joueurs
                    </h4>
                    <p className="text-[11px] text-slate-600">
                      Visualisation dynamique des buts, passes décisives et clean sheets
                    </p>
                  </div>
                </div>
                <div className="text-right hidden sm:block">
                  <span className="text-[10px] font-bold text-emerald-800 uppercase px-2 py-0.5 rounded bg-emerald-100">
                    Saison en cours
                  </span>
                </div>
              </div>

              <ClubPlayerStatsView club={club} />
            </div>
          )}

          {/* TAB 2: CLUB OVERVIEW & LEADERSHIP */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Quick Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                  <p className="text-xs text-emerald-800 font-bold uppercase">Rang Général</p>
                  <p className="text-2xl font-black text-[#006039]">{club.stats.rank}ᵉ</p>
                </div>
                <div className="p-3 bg-orange-50 rounded-lg border border-orange-100">
                  <p className="text-xs text-[#ea580c] font-bold uppercase">Points</p>
                  <p className="text-2xl font-black text-[#ea580c]">{club.stats.points} pts</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <p className="text-xs text-slate-600 font-bold uppercase">Bilan (V-N-D)</p>
                  <p className="text-lg font-black text-slate-900 mt-1">
                    {club.stats.won}V - {club.stats.drawn}N - {club.stats.lost}D
                  </p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <p className="text-xs text-slate-600 font-bold uppercase">Diff. Buts</p>
                  <p className="text-lg font-black text-slate-900 mt-1">
                    {club.stats.goalDiff > 0 ? `+${club.stats.goalDiff}` : club.stats.goalDiff} ({club.stats.goalsFor}:{club.stats.goalsAgainst})
                  </p>
                </div>
              </div>

              {/* Club Info Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 flex items-start gap-3">
                  <User className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-500 uppercase block">Président</span>
                    <span className="font-semibold text-slate-900 text-sm">{club.president}</span>
                  </div>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 flex items-start gap-3">
                  <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-500 uppercase block">Entraîneur Principal</span>
                    <span className="font-semibold text-slate-900 text-sm">{club.coach}</span>
                  </div>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-500 uppercase block">Terrain à domicile</span>
                    <span className="font-semibold text-slate-900 text-sm">{club.stadium}</span>
                  </div>
                </div>
              </div>

              {/* Weather of the stadium / city */}
              <div className="pt-2">
                <StadiumWeatherWidget club={club} />
              </div>
            </div>
          )}

          {/* TAB 3: SQUAD ROSTER TABLE */}
          {activeTab === 'squad' && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-black text-slate-900 text-sm uppercase flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#ea580c]" /> Effectif officiel (Licences FIMF)
                </h3>
                <span className="text-xs text-slate-500">{club.squad.length} joueurs enregistrés</span>
              </div>

              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3 w-12 text-center">N°</th>
                      <th className="py-2.5 px-3">Nom du Joueur</th>
                      <th className="py-2.5 px-3">Poste</th>
                      <th className="py-2.5 px-3 text-center">Âge</th>
                      <th className="py-2.5 px-3 text-center">Buts</th>
                      <th className="py-2.5 px-3 text-center">Passes</th>
                      <th className="py-2.5 px-3 text-center">Note</th>
                      <th className="py-2.5 px-3 text-right">Clean S.</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {club.squad.map((player) => (
                      <tr key={player.number} className="hover:bg-slate-50 transition-colors">
                        <td className="py-2.5 px-3 text-center font-bold font-mono text-emerald-800 bg-emerald-50/50">
                          {player.number}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-slate-900">
                          <div className="flex items-center gap-2">
                            {player.photoUrl ? (
                              <img
                                src={player.photoUrl}
                                alt={player.name}
                                className="w-7 h-7 rounded-full object-cover ring-1 ring-slate-200 shrink-0"
                                loading="lazy"
                              />
                            ) : (
                              <span className="w-7 h-7 rounded-full bg-slate-200 text-slate-500 text-[10px] font-black flex items-center justify-center shrink-0">
                                {player.name
                                  .split(' ')
                                  .map((n) => n[0])
                                  .join('')
                                  .slice(0, 2)
                                  .toUpperCase()}
                              </span>
                            )}
                            <span className="truncate">{player.name}</span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-slate-600">
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100">
                            {player.position}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center text-slate-600">
                          {player.age} ans
                        </td>
                        <td className="py-2.5 px-3 text-center font-bold font-mono text-slate-900">
                          {player.goals > 0 ? `${player.goals} ⚽` : '-'}
                        </td>
                        <td className="py-2.5 px-3 text-center font-bold font-mono text-sky-700">
                          {(player.assists || 0) > 0 ? `${player.assists} 👟` : '-'}
                        </td>
                        <td className="py-2.5 px-3 text-center font-bold font-mono">
                          <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                            {(player.rating ?? 7.0).toFixed(1)}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold font-mono text-emerald-700">
                          {(player.cleanSheets || 0) > 0 ? `${player.cleanSheets} 🛡️` : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Modal actions */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 flex flex-wrap justify-between items-center gap-3 shrink-0">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <Trophy className="w-3.5 h-3.5 text-amber-500" />
            <span>Club affilié à la Fédération Ivoirienne de Mini-Football</span>
          </div>

          <div className="flex items-center gap-2">
            {onToggleFavorite && (
              <button
                onClick={() => onToggleFavorite(club.id)}
                className={`px-3 py-2 text-xs font-bold rounded-lg border transition-colors flex items-center gap-1.5 cursor-pointer ${
                  isFavorite
                    ? 'bg-amber-50 border-amber-300 text-amber-900 hover:bg-amber-100'
                    : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Star
                  className={`w-3.5 h-3.5 ${
                    isFavorite ? 'fill-amber-500 text-amber-500' : 'text-slate-400'
                  }`}
                />
                <span>{isFavorite ? 'Suivi dans Mes Clubs' : 'Ajouter à Mes Clubs'}</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

