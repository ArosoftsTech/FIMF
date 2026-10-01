import React, { useState } from 'react';
import { Club, Player } from '@/src/data/fimfData';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import {
  Trophy,
  Shield,
  Zap,
  Target,
  Sparkles,
  Award,
  Flame,
  Activity,
  UserCheck,
} from 'lucide-react';

interface ClubPlayerStatsViewProps {
  club: Club;
}

type StatCategory = 'overview' | 'goals' | 'assists' | 'defense' | 'radar';

export const ClubPlayerStatsView: React.FC<ClubPlayerStatsViewProps> = ({ club }) => {
  const [activeCategory, setActiveCategory] = useState<StatCategory>('overview');

  // Prepare data for players performance chart
  const playersData = club.squad.map((p) => ({
    name: p.name.split(' ').slice(-1)[0] || p.name, // last name for chart label readability
    fullName: p.name,
    number: p.number,
    position: p.position,
    goals: p.goals || 0,
    assists: p.assists || 0,
    cleanSheets: p.cleanSheets || 0,
    rating: p.rating || 7.0,
    decisiveActions: (p.goals || 0) + (p.assists || 0),
  }));

  // Top scorers in the club
  const topScorers = [...club.squad]
    .filter((p) => (p.goals || 0) > 0)
    .sort((a, b) => (b.goals || 0) - (a.goals || 0));

  // Top passers in the club
  const topPassers = [...club.squad]
    .filter((p) => (p.assists || 0) > 0)
    .sort((a, b) => (b.assists || 0) - (a.assists || 0));

  // Goalkeepers & defensive clean sheets
  const defendersAndKeepers = [...club.squad]
    .filter((p) => p.position === 'Gardien' || p.position === 'Défenseur')
    .sort((a, b) => (b.cleanSheets || 0) - (a.cleanSheets || 0));

  // Position breakdown
  const positionCounts = club.squad.reduce(
    (acc, p) => {
      acc[p.position] = (acc[p.position] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const positionPieData = Object.entries(positionCounts).map(([name, value]) => ({
    name,
    value,
  }));

  const POSITION_COLORS: Record<string, string> = {
    Gardien: '#f59e0b',
    Défenseur: '#0284c7',
    Milieu: '#10b981',
    Attaquant: '#ea580c',
  };

  // Team radar skill metrics
  const totalGoals = club.squad.reduce((sum, p) => sum + (p.goals || 0), 0);
  const totalAssists = club.squad.reduce((sum, p) => sum + (p.assists || 0), 0);
  const maxCleanSheets = Math.max(...club.squad.map((p) => p.cleanSheets || 0), 0);
  const avgRating =
    club.squad.reduce((sum, p) => sum + (p.rating || 7), 0) / (club.squad.length || 1);

  const teamRadarData = [
    { subject: 'Attaque (Buts)', value: Math.min(100, totalGoals * 14 + 10) },
    { subject: 'Créativité (Passes)', value: Math.min(100, totalAssists * 16 + 15) },
    { subject: 'Solidité Défensive', value: Math.min(100, maxCleanSheets * 35 + 25) },
    { subject: 'Note Globale', value: Math.round(avgRating * 11) },
    { subject: 'Discipline', value: 85 },
    { subject: 'Expérience', value: Math.round((club.squad.reduce((s, p) => s + p.age, 0) / club.squad.length) * 3) },
  ];

  return (
    <div className="space-y-6 pt-2">
      {/* Category selector pills */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <button
            onClick={() => setActiveCategory('overview')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer select-none flex items-center gap-1.5 ${
              activeCategory === 'overview'
                ? 'bg-[#004724] text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Vue Générale</span>
          </button>

          <button
            onClick={() => setActiveCategory('goals')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer select-none flex items-center gap-1.5 ${
              activeCategory === 'goals'
                ? 'bg-[#ea580c] text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Buteurs ({topScorers.length})</span>
          </button>

          <button
            onClick={() => setActiveCategory('assists')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer select-none flex items-center gap-1.5 ${
              activeCategory === 'assists'
                ? 'bg-[#0284c7] text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Passeurs ({topPassers.length})</span>
          </button>

          <button
            onClick={() => setActiveCategory('defense')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer select-none flex items-center gap-1.5 ${
              activeCategory === 'defense'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Clean Sheets & Défense</span>
          </button>

          <button
            onClick={() => setActiveCategory('radar')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer select-none flex items-center gap-1.5 ${
              activeCategory === 'radar'
                ? 'bg-purple-700 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Profil Tactique</span>
          </button>
        </div>

        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
          Données officielles FIMF 2024-2025
        </div>
      </div>

      {/* Top Summary Stat Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-gradient-to-br from-orange-50 to-orange-100/50 border border-orange-200 p-3.5 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black text-[#ea580c] uppercase">Buts Joueurs</span>
            <Flame className="w-4 h-4 text-[#ea580c]" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1">{totalGoals}</div>
          <div className="text-[11px] text-slate-500 font-medium">
            Meilleur: {topScorers[0]?.name || 'N/A'} ({topScorers[0]?.goals || 0})
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-200 p-3.5 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black text-sky-700 uppercase">Passes D.</span>
            <Zap className="w-4 h-4 text-sky-700" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1">{totalAssists}</div>
          <div className="text-[11px] text-slate-500 font-medium">
            Meilleur: {topPassers[0]?.name || 'N/A'} ({topPassers[0]?.assists || 0})
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 border border-amber-200 p-3.5 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black text-amber-700 uppercase">Clean Sheets</span>
            <Shield className="w-4 h-4 text-amber-700" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1">{maxCleanSheets}</div>
          <div className="text-[11px] text-slate-500 font-medium">
            Matchs sans but concédé
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 border border-emerald-200 p-3.5 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black text-emerald-700 uppercase">Note Moyenne</span>
            <Award className="w-4 h-4 text-emerald-700" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {avgRating.toFixed(1)} / 10
          </div>
          <div className="text-[11px] text-slate-500 font-medium">Rendement de l'effectif</div>
        </div>
      </div>

      {/* 1. OVERVIEW: Stacked/Grouped Bar Chart (Goals & Assists) */}
      {(activeCategory === 'overview' || activeCategory === 'goals' || activeCategory === 'assists') && (
        <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-2xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
            <div>
              <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                <Target className="w-4 h-4 text-[#ea580c]" />
                {activeCategory === 'goals'
                  ? 'Classement des buteurs du club (Buts marqués)'
                  : activeCategory === 'assists'
                  ? 'Classement des passeurs décisifs'
                  : 'Production offensive des joueurs (Buts & Passes décisives)'}
              </h4>
              <p className="text-[11px] text-slate-500">
                Comparatif visuel des contributions individuelles enregistrées lors de la saison FIMF
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="inline-flex items-center gap-1.5 font-bold text-slate-700">
                <span className="w-3 h-3 rounded-sm bg-[#ea580c]"></span> Buts
              </span>
              <span className="inline-flex items-center gap-1.5 font-bold text-slate-700">
                <span className="w-3 h-3 rounded-sm bg-[#0284c7]"></span> Passes
              </span>
            </div>
          </div>

          <div className="h-64 sm:h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={playersData}
                margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: '#475569', fontWeight: 600 }}
                  interval={0}
                  angle={-15}
                  textAnchor="end"
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(241, 245, 249, 0.6)' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-900 text-white rounded-lg p-3 text-xs shadow-xl border border-slate-700 space-y-1">
                          <p className="font-black text-sm text-amber-400">
                            #{data.number} {data.fullName}
                          </p>
                          <p className="text-slate-300 font-semibold">{data.position}</p>
                          <div className="pt-1 border-t border-slate-800 space-y-0.5">
                            <p className="text-orange-400 font-bold">⚽ Buts : {data.goals}</p>
                            <p className="text-sky-400 font-bold">👟 Passes D. : {data.assists}</p>
                            <p className="text-emerald-400 font-bold">★ Note : {data.rating}/10</p>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                {activeCategory !== 'assists' && (
                  <Bar
                    dataKey="goals"
                    name="Buts"
                    fill="#ea580c"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={36}
                  />
                )}
                {activeCategory !== 'goals' && (
                  <Bar
                    dataKey="assists"
                    name="Passes décisives"
                    fill="#0284c7"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={36}
                  />
                )}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* 2. DEFENSE & CLEAN SHEETS VIEW */}
      {activeCategory === 'defense' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-2xs space-y-3">
            <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-700" />
              Clean sheets réalisés (Invincibilité défensive)
            </h4>
            <p className="text-[11px] text-slate-500">
              Nombre de rencontres sans encaisser de but par joueur défensif
            </p>

            <div className="h-56 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={defendersAndKeepers.map((p) => ({
                    name: p.name.split(' ').slice(-1)[0],
                    fullName: p.name,
                    position: p.position,
                    cleanSheets: p.cleanSheets || 0,
                  }))}
                  layout="vertical"
                  margin={{ top: 10, right: 20, left: 10, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                  <YAxis
                    dataKey="name"
                    type="category"
                    tick={{ fontSize: 11, fill: '#334155', fontWeight: 600 }}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-slate-900 text-white rounded-lg p-2.5 text-xs shadow-xl">
                            <p className="font-bold text-amber-400">{data.fullName}</p>
                            <p className="text-slate-300">{data.position}</p>
                            <p className="text-emerald-400 font-bold mt-1">
                              🛡️ Clean Sheets : {data.cleanSheets}
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar
                    dataKey="cleanSheets"
                    name="Clean Sheets"
                    fill="#059669"
                    radius={[0, 4, 4, 0]}
                    maxBarSize={28}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Defense Leaderboard Cards */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-2xs space-y-3">
            <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-emerald-700" />
              Gardiens & Charnière centrale
            </h4>
            <div className="space-y-2.5 pt-1">
              {defendersAndKeepers.map((player) => (
                <div
                  key={player.number}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200/80 hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-md bg-emerald-100 text-emerald-800 font-mono font-bold text-xs flex items-center justify-center">
                      {player.number}
                    </span>
                    <div>
                      <div className="text-xs font-bold text-slate-900">{player.name}</div>
                      <div className="text-[10px] text-slate-500 font-semibold">
                        {player.position} • {player.age} ans
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <div className="text-xs font-black text-emerald-700 flex items-center gap-1 justify-end">
                        <Shield className="w-3.5 h-3.5" />
                        <span>{player.cleanSheets || 0} CS</span>
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {player.cleanSheets ? 'Invaincu' : 'En apprentissage'}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 3. TACTICAL RADAR & EFFECTIF REPARTITION */}
      {(activeCategory === 'overview' || activeCategory === 'radar') && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Radar Chart */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-2xs space-y-2">
            <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-600" />
              Profil Radar de Performance de l'Équipe
            </h4>
            <p className="text-[11px] text-slate-500">
              Évaluation multidimensionnelle basée sur les statistiques de jeu
            </p>
            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={teamRadarData}>
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis
                    dataKey="subject"
                    tick={{ fontSize: 10, fill: '#475569', fontWeight: 600 }}
                  />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9 }} />
                  <Radar
                    name={club.name}
                    dataKey="value"
                    stroke="#006039"
                    fill="#006039"
                    fillOpacity={0.45}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Position Breakdown Donut Chart */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-2xs space-y-2">
            <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-500" />
              Répartition tactique de l'effectif
            </h4>
            <p className="text-[11px] text-slate-500">
              Proportion des postes homologués pour la saison FIMF
            </p>
            <div className="h-60 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={positionPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {positionPieData.map((entry) => (
                      <Cell
                        key={`cell-${entry.name}`}
                        fill={POSITION_COLORS[entry.name] || '#64748b'}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-slate-900 text-white rounded-lg p-2 text-xs shadow-md">
                            <span className="font-bold">{data.name} : </span>
                            <span>{data.value} joueur(s)</span>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    iconType="circle"
                    wrapperStyle={{ fontSize: 11 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* 4. DETAILED PLAYERS RANKING TABLE WITH PROGRESS BARS */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide flex items-center gap-2">
            <span>Bilan individuel complet des joueurs</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
              {club.squad.length} licenciés
            </span>
          </h4>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200 uppercase text-[10px]">
              <tr>
                <th className="py-2.5 px-3 w-10 text-center">N°</th>
                <th className="py-2.5 px-3">Joueur</th>
                <th className="py-2.5 px-3">Poste</th>
                <th className="py-2.5 px-3 text-center">MJ</th>
                <th className="py-2.5 px-3 text-center text-[#ea580c]">Buts</th>
                <th className="py-2.5 px-3 text-center text-[#0284c7]">Passes</th>
                <th className="py-2.5 px-3 text-center text-emerald-700">Clean S.</th>
                <th className="py-2.5 px-3 text-right">Note</th>
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
                      {(player.goals || 0) >= 3 && (
                        <span className="text-[10px] px-1 rounded bg-orange-100 text-[#ea580c] font-black">
                          TOP
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-slate-600">
                    <span
                      className="inline-block px-2 py-0.5 rounded text-[10px] font-bold"
                      style={{
                        backgroundColor: `${POSITION_COLORS[player.position] || '#64748b'}15`,
                        color: POSITION_COLORS[player.position] || '#64748b',
                      }}
                    >
                      {player.position}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-center text-slate-600 font-medium">
                    {player.matchesPlayed || 3}
                  </td>
                  <td className="py-2.5 px-3 text-center font-black text-[#ea580c] font-mono">
                    {player.goals > 0 ? `${player.goals} ⚽` : '-'}
                  </td>
                  <td className="py-2.5 px-3 text-center font-black text-sky-700 font-mono">
                    {(player.assists || 0) > 0 ? `${player.assists} 👟` : '-'}
                  </td>
                  <td className="py-2.5 px-3 text-center font-black text-emerald-700 font-mono">
                    {(player.cleanSheets || 0) > 0 ? `${player.cleanSheets} 🛡️` : '-'}
                  </td>
                  <td className="py-2.5 px-3 text-right font-black font-mono">
                    <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-900 border border-emerald-200">
                      {(player.rating || 7.0).toFixed(1)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
