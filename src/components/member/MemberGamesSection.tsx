import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Trophy,
  Flame,
  Ticket,
  Medal,
  Sparkles,
  Loader2,
  Check,
  RefreshCw,
  Info,
  GraduationCap,
  Lock,
  ClipboardList,
  Gift,
} from 'lucide-react';
import { Club, CLUBS_DATA, Match, MATCHES_DATA } from '@/src/data/fimfData';
import { ClubBadge } from '../ClubBadge';
import {
  fetchGamePeriods,
  fetchGamePrizes,
  fetchGameDraws,
  fetchMyPredictions,
  fetchMyLeaderboard,
  fetchMyTicketCount,
  saveMatchPrediction,
  GamePeriod,
  GamePrize,
  GameDraw,
  LeaderboardRow,
} from '@/src/lib/fimfApi';
import { useFimfData } from '../../context/FimfDataContext';

interface MemberGamesSectionProps {
  onSelectMatch: (match: Match) => void;
  onSelectClub: (club: Club) => void;
}

type TabId = 'pronostics' | 'classement' | 'lots' | 'bourses';

/** Période courante : la première « en cours », sinon la prochaine « à venir ». */
function pickCurrentPeriod(periods: GamePeriod[]): GamePeriod | null {
  const now = Date.now();
  const running = periods
    .filter((p) => p.status === 'en cours')
    .find((p) => new Date(p.endsAt).getTime() >= now);
  if (running) return running;
  return periods.find((p) => p.status === 'à venir') ?? null;
}

/** Le membre peut-il encore modifier son pronostic ? (match pas encore joué) */
function isEditable(m: Match): boolean {
  return m.status === 'scheduled';
}

export const MemberGamesSection: React.FC<MemberGamesSectionProps> = ({
  onSelectMatch,
  onSelectClub,
}) => {
  const { matches: liveMatches, clubs: liveClubs } = useFimfData();
  const matches = liveMatches.length > 0 ? liveMatches : MATCHES_DATA;
  const clubs = liveClubs.length > 0 ? liveClubs : CLUBS_DATA;

  const [tab, setTab] = useState<TabId>('pronostics');
  const [loading, setLoading] = useState(true);
  const [periods, setPeriods] = useState<GamePeriod[]>([]);
  const [prizes, setPrizes] = useState<GamePrize[]>([]);
  const [draws, setDraws] = useState<GameDraw[]>([]);
  const [myPredictions, setMyPredictions] = useState<Record<string, { home: number; away: number; points: number | null }>>({});
  const [leaderboard, setLeaderboard] = useState<LeaderboardRow[]>([]);
  const [ticketCounts, setTicketCounts] = useState<Record<number, number>>({});
  const [drafts, setDrafts] = useState<Record<string, { home: number; away: number }>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [savedFlash, setSavedFlash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const currentPeriod = useMemo(() => pickCurrentPeriod(periods), [periods]);
  const closedPeriods = useMemo(() => periods.filter((p) => p.status === 'clôturée'), [periods]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [ps, pz, dr] = await Promise.all([fetchGamePeriods(), fetchGamePrizes(), fetchGameDraws()]);
      setPeriods(ps);
      setPrizes(pz);
      setDraws(dr);

      const preds = await fetchMyPredictions();
      const map: Record<string, { home: number; away: number; points: number | null }> = {};
      for (const p of preds) {
        map[p.matchId] = { home: p.predictedHome, away: p.predictedAway, points: p.points };
      }
      setMyPredictions(map);

      // Tickets + classement pour la période courante
      const cur = pickCurrentPeriod(ps);
      const ticketMap: Record<number, number> = {};
      const scholarshipDraws = dr.filter((d) => d.kind === 'scholarship');
      for (const d of scholarshipDraws) {
        try {
          ticketMap[d.id] = await fetchMyTicketCount(d.id);
        } catch {
          ticketMap[d.id] = 0;
        }
      }
      setTicketCounts(ticketMap);

      if (cur) {
        try {
          setLeaderboard(await fetchMyLeaderboard(cur.id));
        } catch {
          setLeaderboard([]);
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Chargement impossible');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const periodMatches = useMemo(
    () =>
      currentPeriod
        ? matches.filter((m) => {
            const ts = new Date(currentPeriod.startsAt).getTime();
            const te = new Date(currentPeriod.endsAt).getTime();
            // Rattachement par date du match (les matchs ne portent pas de period_id)
            const parsed = parseDate(m.dateStr, m.timeStr);
            return parsed !== null && parsed >= ts && parsed < te + 86_400_000;
          })
        : [],
    [currentPeriod, matches],
  );

  const periodDraw = useMemo(
    () => draws.find((d) => d.kind === 'period' && d.periodId === currentPeriod?.id) ?? null,
    [draws, currentPeriod],
  );
  const scholarshipDraws = useMemo(() => draws.filter((d) => d.kind === 'scholarship'), [draws]);

  const totalPoints = useMemo(
    () => Object.values(myPredictions).reduce((s, p) => s + (p.points ?? 0), 0),
    [myPredictions],
  );

  const handleSave = async (matchId: string) => {
    if (!currentPeriod) return;
    // Fallback : le score par défaut affiché (1-0) si l'utilisateur valide sans
    // toucher les compteurs.
    const d = drafts[matchId] ?? myPredictions[matchId] ?? { home: 1, away: 0 };
    setSaving(matchId);
    setError(null);
    try {
      await saveMatchPrediction(currentPeriod.id, matchId, d.home, d.away);
      setMyPredictions((prev) => ({
        ...prev,
        [matchId]: { home: d.home, away: d.away, points: null },
      }));
      setSavedFlash(matchId);
      setTimeout(() => setSavedFlash(null), 2500);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Enregistrement impossible');
    } finally {
      setSaving(null);
    }
  };

  const displayName = (userId: string) => {
    // Le classement masque l'identité des autres membres ; on affiche « Membre #rank »
    return `Membre ${userId.slice(0, 4).toUpperCase()}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-7 h-7 text-emerald-600 animate-spin" />
      </div>
    );
  }

  if (periods.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center">
        <Gift className="w-10 h-10 text-slate-300 mx-auto mb-3" />
        <h3 className="text-sm font-black text-slate-900 uppercase">Aucune période de jeu active</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
          Les jeux de pronostics ouvriront bientôt ! La FIMF prépare des périodes de pronostics avec des lots à gagner.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold">
          {error}
        </div>
      )}

      {/* Entête période courante */}
      {currentPeriod && (
        <div className="bg-gradient-to-br from-slate-900 via-[#00381c] to-[#002412] rounded-2xl text-white p-5 border border-emerald-800/40">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-800/80 border border-emerald-600/50 text-emerald-200 text-[10px] font-black uppercase tracking-wider mb-1.5">
                <Flame className="w-3 h-3 text-amber-400" />
                Période en cours
              </div>
              <h3 className="text-lg font-black uppercase tracking-tight">{currentPeriod.name}</h3>
              <p className="text-[11px] text-emerald-200 mt-0.5">
                Du {new Date(currentPeriod.startsAt).toLocaleDateString('fr-FR')} au{' '}
                {new Date(currentPeriod.endsAt).toLocaleDateString('fr-FR')} • Top{' '}
                {currentPeriod.topN} qualifiés pour le tirage des lots
              </p>
            </div>
            <div className="flex items-center gap-3 bg-emerald-950/70 border border-emerald-700/60 rounded-xl px-4 py-2.5">
              <div className="text-center">
                <div className="text-xl font-black text-amber-400 font-mono">{totalPoints}</div>
                <div className="text-[9px] font-black text-emerald-200 uppercase">Points cumulés</div>
              </div>
              <div className="w-px h-8 bg-emerald-800" />
              <div className="text-center">
                <div className="text-xl font-black text-emerald-400 font-mono">
                  {Math.floor(totalPoints / 10)}
                </div>
                <div className="text-[9px] font-black text-emerald-200 uppercase">Tickets bourse</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Onglets */}
      <div className="flex gap-1.5 flex-wrap">
        {(
          [
            { id: 'pronostics', label: 'Pronostics', icon: Flame },
            { id: 'classement', label: 'Classement', icon: Medal },
            { id: 'lots', label: 'Lots & Tirages', icon: Gift },
            { id: 'bourses', label: 'Bourses Angleterre', icon: GraduationCap },
          ] as { id: TabId; label: string; icon: React.ElementType }[]
        ).map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[11px] font-black uppercase tracking-wide transition-colors cursor-pointer ${
              tab === t.id
                ? 'bg-[#004724] text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <t.icon className="w-3.5 h-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      {/* ---------------- PRONOSTICS ---------------- */}
      {tab === 'pronostics' && (
        <div className="space-y-3">
          {!currentPeriod ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center text-xs text-slate-500">
              Aucune période ouverte aux pronostics pour le moment.
            </div>
          ) : periodMatches.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center text-xs text-slate-500">
              Aucun match programmé sur cette période pour l'instant.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {periodMatches.map((m) => {
                const home = clubs.find((c) => c.id === m.homeTeamId);
                const away = clubs.find((c) => c.id === m.awayTeamId);
                const saved = myPredictions[m.id];
                const draft = drafts[m.id] ?? saved ?? { home: 1, away: 0 };
                const editable = isEditable(m);
                const isSavedFlash = savedFlash === m.id;
                return (
                  <div
                    key={m.id}
                    className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-col gap-3"
                  >
                    <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      <span>{m.competitionName ?? 'Championnat'} • {m.roundName ?? `J${m.journee}`}</span>
                      <span>{m.dateStr} • {m.timeStr}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <button onClick={() => home && onSelectClub(home)} className="flex items-center gap-2 min-w-0 cursor-pointer group">
                        {home && <ClubBadge id={home.id} size="sm" />}
                        <span className="text-xs font-black text-slate-900 truncate group-hover:text-[#ea580c]">
                          {home?.shortName ?? home?.name ?? m.homeTeamId}
                        </span>
                      </button>
                      <span className="text-[10px] font-black text-slate-300">VS</span>
                      <button onClick={() => away && onSelectClub(away)} className="flex items-center gap-2 min-w-0 justify-end cursor-pointer group">
                        <span className="text-xs font-black text-slate-900 truncate group-hover:text-[#ea580c]">
                          {away?.shortName ?? away?.name ?? m.awayTeamId}
                        </span>
                        {away && <ClubBadge id={away.id} size="sm" />}
                      </button>
                    </div>

                    {editable ? (
                      <>
                        <div className="flex items-center justify-center gap-6">
                          {(['home', 'away'] as const).map((side) => (
                            <div key={side} className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl p-1">
                              <button
                                onClick={() =>
                                  setDrafts((prev) => ({
                                    ...prev,
                                    [m.id]: { ...draft, [side]: Math.max(0, draft[side] - 1) },
                                  }))
                                }
                                className="w-7 h-7 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 font-black text-slate-600 cursor-pointer"
                              >
                                −
                              </button>
                              <span className="w-7 text-center font-mono font-black text-sm text-[#004724]">{draft[side]}</span>
                              <button
                                onClick={() =>
                                  setDrafts((prev) => ({
                                    ...prev,
                                    [m.id]: { ...draft, [side]: draft[side] + 1 },
                                  }))
                                }
                                className="w-7 h-7 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 font-black text-slate-600 cursor-pointer"
                              >
                                +
                              </button>
                            </div>
                          ))}
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-slate-400">
                            3 pts score exact • 1 pt bon vainqueur
                          </span>
                          <button
                            onClick={() => void handleSave(m.id)}
                            disabled={saving === m.id}
                            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-[11px] font-black uppercase transition-colors cursor-pointer disabled:opacity-60 ${
                              isSavedFlash
                                ? 'bg-emerald-500 text-white'
                                : saved
                                  ? 'bg-amber-500 hover:bg-amber-600 text-slate-900'
                                  : 'bg-[#ea580c] hover:bg-[#c2410c] text-white'
                            }`}
                          >
                            {saving === m.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : isSavedFlash ? (
                              <Check className="w-3.5 h-3.5" />
                            ) : saved ? (
                              <RefreshCw className="w-3.5 h-3.5" />
                            ) : (
                              <Sparkles className="w-3.5 h-3.5" />
                            )}
                            {isSavedFlash ? 'Enregistré !' : saved ? 'Modifier' : 'Valider'}
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="flex items-center justify-between bg-slate-50 border border-slate-100 rounded-xl px-3 py-2">
                        <div className="text-[11px] text-slate-600">
                          {saved ? (
                            <>
                              Votre pronostic :{' '}
                              <b className="font-mono text-[#004724]">
                                {saved.home} - {saved.away}
                              </b>
                              {saved.points !== null && (
                                <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 font-black text-[10px]">
                                  +{saved.points} pt{saved.points > 1 ? 's' : ''}
                                </span>
                              )}
                            </>
                          ) : (
                            'Match joué — pronostic non soumis'
                          )}
                        </div>
                        <button
                          onClick={() => onSelectMatch(m)}
                          className="text-[10px] font-bold text-[#ea580c] hover:underline cursor-pointer"
                        >
                          Détails
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          {currentPeriod && periodMatches.some((m) => isEditable(m)) && (
            <p className="text-[10px] text-slate-400 flex items-center gap-1.5">
              <Info className="w-3 h-3" />
              Un pronostic par match, modifiable jusqu'au coup d'envoi. Réservé aux membres connectés.
            </p>
          )}
        </div>
      )}

      {/* ---------------- CLASSEMENT ---------------- */}
      {tab === 'classement' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {leaderboard.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500">
              {currentPeriod
                ? 'Aucun pronostic enregistré sur cette période — soyez le premier à jouer !'
                : 'Aucune période active.'}
            </div>
          ) : (
            <>
              <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-xs font-black text-slate-900 uppercase flex items-center gap-2">
                  <Medal className="w-4 h-4 text-[#ea580c]" />
                  Classement {currentPeriod?.name ?? ''}
                </h3>
                <span className="text-[10px] text-slate-400">Top {currentPeriod?.topN} au tirage des lots</span>
              </div>
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-100">
                    <th className="px-5 py-2">Rang</th>
                    <th className="px-5 py-2">Membre</th>
                    <th className="px-5 py-2 text-right">Pronostics</th>
                    <th className="px-5 py-2 text-right">Points</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((row) => (
                    <tr
                      key={row.userId}
                      className={`text-xs border-b border-slate-50 ${
                        row.rank <= (currentPeriod?.topN ?? 10) ? 'bg-emerald-50/40' : ''
                      }`}
                    >
                      <td className="px-5 py-2.5 font-black text-slate-900">#{row.rank}</td>
                      <td className="px-5 py-2.5 text-slate-700">
                        {displayName(row.userId)}
                        {row.rank <= (currentPeriod?.topN ?? 10) && (
                          <span className="ml-2 text-[9px] font-black uppercase text-emerald-600">Qualifié</span>
                        )}
                      </td>
                      <td className="px-5 py-2.5 text-right text-slate-500 font-mono">{row.predictions}</td>
                      <td className="px-5 py-2.5 text-right font-mono font-black text-[#004724]">{row.totalPoints}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>
      )}

      {/* ---------------- LOTS & TIRAGES ---------------- */}
      {tab === 'lots' && (
        <div className="space-y-4">
          {/* Tirage de la période courante */}
          {periodDraw && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <h3 className="text-xs font-black text-slate-900 uppercase flex items-center gap-2 mb-1">
                <Trophy className="w-4 h-4 text-amber-500" />
                {periodDraw.title}
              </h3>
              {periodDraw.description && (
                <p className="text-[11px] text-slate-500 mb-3">{periodDraw.description}</p>
              )}
              {periodDraw.status === 'terminé' ? (
                <div className="space-y-1.5">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase">
                    <Check className="w-3 h-3" /> Tirage effectué
                  </span>
                  <WinnerList drawId={periodDraw.id} />
                </div>
              ) : (
                <p className="text-[11px] text-slate-500 flex items-center gap-1.5">
                  <ClipboardList className="w-3.5 h-3.5 text-slate-400" />
                  Tirage prévu parmi le top {currentPeriod?.topN} de la période — {periodDraw.winnersCount} gagnant(s).
                </p>
              )}
            </div>
          )}

          {/* Lots de la période courante */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {prizes.filter((p) => p.periodId === currentPeriod?.id).length === 0 ? (
              <div className="col-span-full bg-white rounded-2xl border border-slate-200 p-6 text-center text-xs text-slate-500">
                Les lots de cette période seront dévoilés prochainement.
              </div>
            ) : (
              prizes
                .filter((p) => p.periodId === currentPeriod?.id)
                .map((p, idx) => (
                  <div key={p.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    {p.imageRef && <img src={p.imageRef} alt={p.label} className="w-full h-32 object-cover" />}
                    <div className="p-4">
                      <div className="text-[9px] font-black uppercase tracking-wider text-[#ea580c] mb-1">
                        Lot {p.rankFrom}
                        {p.rankTo > p.rankFrom ? `–${p.rankTo}` : ''}
                      </div>
                      <h4 className="text-xs font-black text-slate-900 uppercase">{p.label}</h4>
                      {p.description && <p className="text-[11px] text-slate-500 mt-1">{p.description}</p>}
                    </div>
                  </div>
                ))
            )}
          </div>

          {/* Historique des périodes clôturées */}
          {closedPeriods.map((cp) => {
            const cpDraw = draws.find((d) => d.kind === 'period' && d.periodId === cp.id);
            return (
              <div key={cp.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                <h3 className="text-xs font-black text-slate-900 uppercase mb-2">{cp.name} — clôturée</h3>
                {cpDraw && cpDraw.status === 'terminé' ? (
                  <WinnerList drawId={cpDraw.id} />
                ) : (
                  <p className="text-[11px] text-slate-500">Tirage en attente de publication.</p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ---------------- BOURSES ANGLETERRE ---------------- */}
      {tab === 'bourses' && (
        <div className="space-y-4">
          <div className="bg-gradient-to-br from-[#004724] to-[#002412] rounded-2xl text-white p-6 border border-emerald-800/40">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-800/80 border border-emerald-600/50 text-emerald-200 text-[10px] font-black uppercase tracking-wider mb-2">
              <GraduationCap className="w-3.5 h-3.5 text-amber-400" />
              Tirage officiel FIMF
            </div>
            <h3 className="text-lg font-black uppercase tracking-tight">Bourses d'études en Angleterre</h3>
            <p className="text-xs text-emerald-100 mt-1.5 max-w-2xl leading-relaxed">
              La FIMF organise un grand tirage au sort en ligne sur ses plateformes de réseaux sociaux : des bourses
              d'études en Angleterre à gagner pour les gagnants ou un membre de leur famille. Sur le site, vos points
              de pronostics se transforment en tickets : <b>1 ticket par tranche de 10 points cumulés</b>. Plus vous
              jouez, plus vos chances augmentent !
            </p>
          </div>

          {scholarshipDraws.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center text-xs text-slate-500">
              Aucun tirage de bourse annoncé pour le moment — restez connectés et accumulez des points !
            </div>
          ) : (
            scholarshipDraws.map((d) => (
              <div key={d.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="text-xs font-black text-slate-900 uppercase">{d.title}</h4>
                    {d.description && <p className="text-[11px] text-slate-500 mt-1">{d.description}</p>}
                  </div>
                  <div className="text-center shrink-0 bg-amber-50 border border-amber-200 rounded-xl px-3.5 py-2">
                    <div className="text-lg font-black text-amber-600 font-mono">{ticketCounts[d.id] ?? 0}</div>
                    <div className="text-[9px] font-black text-amber-700 uppercase">Mes tickets</div>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-slate-100">
                  {d.status === 'terminé' ? (
                    <WinnerList drawId={d.id} />
                  ) : (
                    <p className="text-[11px] text-slate-500 flex items-center gap-1.5">
                      <Ticket className="w-3.5 h-3.5 text-amber-500" />
                      Tirage à venir : {d.winnersCount} bourse(s) à gagner. {d.winnersCount > 1 ? 'Les' : 'La'}
                      {' '}bourse(s) peut(vent) bénéficier au gagnant ou à un membre de sa famille.
                    </p>
                  )}
                </div>
              </div>
            ))
          )}

          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <h4 className="text-xs font-black text-slate-900 uppercase flex items-center gap-2 mb-2">
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              Règlement
            </h4>
            <ul className="text-[11px] text-slate-600 space-y-1.5 list-disc pl-4">
              <li>Jeu réservé aux membres FIMF connectés, 1 compte par personne.</li>
              <li>Tickets de tirage : 1 ticket par tranche de 10 points de pronostics cumulés.</li>
              <li>Le tirage au sort est effectué en ligne, avec graine d'audit publiée pour garantir l'équité.</li>
              <li>La bourse est attribuée au gagnant ou à un membre de sa famille (justificatif requis).</li>
              <li>Le règlement complet est disponible sur demande auprès de la FIMF.</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

/** Liste des gagnants publiés d'un tirage. */
const WinnerList: React.FC<{ drawId: number }> = ({ drawId }) => {
  const [winners, setWinners] = useState<Array<{ rank: number; displayName: string; prizeLabel: string | null }> | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { fetchDrawWinners } = await import('@/src/lib/fimfApi');
      try {
        const w = await fetchDrawWinners(drawId);
        if (!cancelled) setWinners(w);
      } catch {
        if (!cancelled) setWinners([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [drawId]);

  if (winners === null) return <Loader2 className="w-4 h-4 text-slate-300 animate-spin" />;
  if (winners.length === 0) return <p className="text-[11px] text-slate-500">Aucun gagnant enregistré.</p>;
  return (
    <ul className="space-y-1.5 mt-2">
      {winners.map((w) => (
        <li key={w.rank} className="flex items-center gap-2 text-xs">
          <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 font-black text-[10px] flex items-center justify-center shrink-0">
            {w.rank}
          </span>
          <span className="font-black text-slate-900">{w.displayName}</span>
          {w.prizeLabel && <span className="text-[10px] text-slate-500">— {w.prizeLabel}</span>}
        </li>
      ))}
    </ul>
  );
};

/** Parse « Sam. 28 Sept. 2025 » + « 16h00 » en timestamp (ms), null si illisible. */
function parseDate(dateStr: string, timeStr: string): number | null {
  const MONTHS: Record<string, number> = {
    jan: 0, janv: 0, fev: 1, 'fév': 1, mars: 2, avr: 3, mai: 4, juin: 5,
    juil: 6, aou: 7, 'aoû': 7, sept: 8, oct: 9, nov: 10, dec: 11, 'déc': 11,
  };
  const dm = dateStr.match(/(\d{1,2})\s+([A-Za-zÀ-ÿ.]+)\s+(\d{4})/);
  const tm = timeStr.match(/(\d{1,2})h(\d{2})?/);
  if (!dm || !tm) return null;
  const month = MONTHS[dm[2].replace(/\./g, '').toLowerCase()];
  if (month === undefined) return null;
  return new Date(Number(dm[3]), month, Number(dm[1]), Number(tm[1]), Number(tm[2] ?? 0)).getTime();
}
