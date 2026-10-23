import React, { useCallback, useEffect, useState } from 'react';
import {
  Trophy,
  Gift,
  Dices,
  Loader2,
  Plus,
  Pencil,
  Trash2,
  Check,
  Medal,
  Upload,
  X,
  Calculator,
} from 'lucide-react';
import {
  fetchGamePeriods,
  fetchGamePrizes,
  fetchGameDraws,
  fetchDrawWinners,
  adminEvaluatePeriod,
  adminFetchPeriodLeaderboard,
  adminRunPeriodDraw,
  adminRunScholarshipDraw,
  upsertGamePeriod,
  deleteGamePeriodRow,
  upsertGamePrize,
  deleteGamePrizeRow,
  upsertGameDraw,
  deleteGameDrawRow,
  uploadMedia,
  updateWinnerPhoto,
  mediaUrl,
  GamePeriod,
  GamePrize,
  GameDraw,
  GamePeriodStatus,
  LeaderboardRow,
  DrawWinnerPublic,
} from '@/src/lib/fimfApi';

type SubTab = 'periods' | 'prizes' | 'draws';

interface AdminGamesTabProps {
  showFeedback: (msg: string, tone?: 'success' | 'error') => void;
}

/** Valeur datetime-local depuis un ISO. */
const toLocalInput = (iso: string) => {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
const fromLocalInput = (v: string) => new Date(v).toISOString();

export const AdminGamesTab: React.FC<AdminGamesTabProps> = ({ showFeedback }) => {
  const [subTab, setSubTab] = useState<SubTab>('periods');
  const [loading, setLoading] = useState(true);
  const [periods, setPeriods] = useState<GamePeriod[]>([]);
  const [prizes, setPrizes] = useState<GamePrize[]>([]);
  const [draws, setDraws] = useState<GameDraw[]>([]);
  const [busy, setBusy] = useState(false);

  // Formulaires
  const [editingPeriod, setEditingPeriod] = useState<Partial<GamePeriod> | null>(null);
  const [editingPrize, setEditingPrize] = useState<(Partial<GamePrize> & { periodId: number }) | null>(null);
  const [editingDraw, setEditingDraw] = useState<Partial<GameDraw> | null>(null);
  const [prizeImageFile, setPrizeImageFile] = useState<File | null>(null);

  // Leaderboard / gagnants affichés
  const [leaderboard, setLeaderboard] = useState<Record<number, LeaderboardRow[]>>({});
  const [winners, setWinners] = useState<Record<number, DrawWinnerPublic[]>>({});
  const [seedInput, setSeedInput] = useState<Record<number, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [ps, pz, dr] = await Promise.all([fetchGamePeriods(), fetchGamePrizes(), fetchGameDraws()]);
      setPeriods(ps);
      setPrizes(pz);
      setDraws(dr);
    } catch (e) {
      showFeedback(e instanceof Error ? e.message : 'Chargement impossible', 'error');
    } finally {
      setLoading(false);
    }
  }, [showFeedback]);

  useEffect(() => {
    void load();
  }, [load]);

  const openLeaderboard = async (periodId: number) => {
    try {
      const rows = await adminFetchPeriodLeaderboard(periodId);
      setLeaderboard((prev) => ({ ...prev, [periodId]: rows }));
    } catch (e) {
      showFeedback(e instanceof Error ? e.message : 'Classement indisponible', 'error');
    }
  };

  const openWinners = async (drawId: number) => {
    try {
      const w = await fetchDrawWinners(drawId);
      setWinners((prev) => ({ ...prev, [drawId]: w }));
    } catch (e) {
      showFeedback(e instanceof Error ? e.message : 'Gagnants indisponibles', 'error');
    }
  };

  const runDraw = async (draw: GameDraw) => {
    const seed = (seedInput[draw.id] ?? '').trim() || `draw-${draw.id}-${Date.now()}`;
    setBusy(true);
    try {
      const n =
        draw.kind === 'period'
          ? await adminRunPeriodDraw(draw.id, seed)
          : await adminRunScholarshipDraw(draw.id, seed);
      showFeedback(`Tirage effectué : ${n} gagnant(s). Graine d'audit : ${seed}`);
      await load();
      void openWinners(draw.id);
    } catch (e) {
      showFeedback(e instanceof Error ? e.message : 'Tirage impossible', 'error');
    } finally {
      setBusy(false);
    }
  };

  const evaluate = async (periodId: number) => {
    setBusy(true);
    try {
      const n = await adminEvaluatePeriod(periodId);
      showFeedback(`${n} pronostic(s) évalué(s).`);
      void openLeaderboard(periodId);
    } catch (e) {
      showFeedback(e instanceof Error ? e.message : 'Évaluation impossible', 'error');
    } finally {
      setBusy(false);
    }
  };

  const savePeriod = async () => {
    if (!editingPeriod?.name || !editingPeriod.startsAt || !editingPeriod.endsAt) {
      showFeedback('Nom, début et fin obligatoires', 'error');
      return;
    }
    setBusy(true);
    try {
      await upsertGamePeriod({
        id: editingPeriod.id,
        name: editingPeriod.name,
        startsAt: editingPeriod.startsAt,
        endsAt: editingPeriod.endsAt,
        topN: editingPeriod.topN ?? 10,
        status: (editingPeriod.status ?? 'à venir') as GamePeriodStatus,
      });
      showFeedback('Période enregistrée');
      setEditingPeriod(null);
      await load();
    } catch (e) {
      showFeedback(e instanceof Error ? e.message : 'Enregistrement impossible', 'error');
    } finally {
      setBusy(false);
    }
  };

  const savePrize = async () => {
    if (!editingPrize?.label || !editingPrize.periodId) {
      showFeedback('Intitulé et période obligatoires', 'error');
      return;
    }
    setBusy(true);
    try {
      let imageRef = editingPrize.imageRef ?? null;
      if (prizeImageFile) {
        const up = await uploadMedia(prizeImageFile);
        imageRef = up.ref;
      }
      await upsertGamePrize({
        id: editingPrize.id,
        periodId: editingPrize.periodId,
        label: editingPrize.label,
        description: editingPrize.description ?? null,
        imageRef,
        rankFrom: editingPrize.rankFrom ?? 1,
        rankTo: editingPrize.rankTo ?? 1,
      });
      showFeedback('Lot enregistré');
      setEditingPrize(null);
      setPrizeImageFile(null);
      await load();
    } catch (e) {
      showFeedback(e instanceof Error ? e.message : 'Enregistrement impossible', 'error');
    } finally {
      setBusy(false);
    }
  };

  const saveDraw = async () => {
    if (!editingDraw?.title) {
      showFeedback('Titre obligatoire', 'error');
      return;
    }
    setBusy(true);
    try {
      await upsertGameDraw({
        id: editingDraw.id,
        kind: (editingDraw.kind ?? 'period') as GameDraw['kind'],
        periodId: editingDraw.kind === 'scholarship' ? null : editingDraw.periodId ?? null,
        title: editingDraw.title,
        description: editingDraw.description ?? null,
        winnersCount: editingDraw.winnersCount ?? 1,
      });
      showFeedback('Tirage enregistré');
      setEditingDraw(null);
      await load();
    } catch (e) {
      showFeedback(e instanceof Error ? e.message : 'Enregistrement impossible', 'error');
    } finally {
      setBusy(false);
    }
  };

  const removePeriod = async (id: number) => {
    if (!window.confirm('Supprimer cette période ? (lots, pronostics et tirages liés seront supprimés)')) return;
    try {
      await deleteGamePeriodRow(id);
      showFeedback('Période supprimée');
      await load();
    } catch (e) {
      showFeedback(e instanceof Error ? e.message : 'Suppression impossible', 'error');
    }
  };

  const removePrize = async (id: number) => {
    if (!window.confirm('Supprimer ce lot ?')) return;
    try {
      await deleteGamePrizeRow(id);
      showFeedback('Lot supprimé');
      await load();
    } catch (e) {
      showFeedback(e instanceof Error ? e.message : 'Suppression impossible', 'error');
    }
  };

  const removeDraw = async (id: number) => {
    if (!window.confirm('Supprimer ce tirage ?')) return;
    try {
      await deleteGameDrawRow(id);
      showFeedback('Tirage supprimé');
      await load();
    } catch (e) {
      showFeedback(e instanceof Error ? e.message : 'Suppression impossible', 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-7 h-7 text-emerald-600 animate-spin" />
      </div>
    );
  }

  const statusBadge = (s: string) => {
    const map: Record<string, string> = {
      'à venir': 'bg-slate-100 text-slate-600 border-slate-200',
      'en cours': 'bg-emerald-50 text-emerald-700 border-emerald-200',
      'clôturée': 'bg-slate-900 text-white border-slate-900',
      'planifié': 'bg-slate-100 text-slate-600 border-slate-200',
      'terminé': 'bg-amber-50 text-amber-700 border-amber-200',
    };
    return (
      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border uppercase ${map[s] ?? map['à venir']}`}>
        {s}
      </span>
    );
  };

  return (
    <div className="space-y-5">
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
        <h3 className="text-base font-black text-slate-900 uppercase flex items-center gap-2">
          <Trophy className="w-5 h-5 text-emerald-600" />
          <span>Jeux, Pronostics & Tirages</span>
        </h3>
        <p className="text-xs text-slate-500 mt-0.5">
          Périodes de pronostics, lots à gagner, tirage au sort (top classement) et bourses d'études en Angleterre.
        </p>
      </div>

      {/* Sous-onglets */}
      <div className="flex gap-1.5">
        {(
          [
            { id: 'periods', label: 'Périodes', icon: Trophy },
            { id: 'prizes', label: 'Lots', icon: Gift },
            { id: 'draws', label: 'Tirages & Bourses', icon: Dices },
          ] as { id: SubTab; label: string; icon: React.ElementType }[]
        ).map((t) => (
          <button
            key={t.id}
            onClick={() => setSubTab(t.id)}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[11px] font-black uppercase transition-colors cursor-pointer ${
              subTab === t.id ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <t.icon className="w-3.5 h-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      {/* ------------------- PÉRIODES ------------------- */}
      {subTab === 'periods' && (
        <div className="space-y-3">
          <button
            onClick={() => setEditingPeriod({ status: 'à venir', topN: 10 })}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#004724] hover:bg-[#006039] text-white text-xs font-black uppercase cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Nouvelle période
          </button>

          {editingPeriod && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
              <h4 className="text-xs font-black text-slate-900 uppercase">
                {editingPeriod.id ? 'Modifier la période' : 'Nouvelle période'}
              </h4>
              <input
                value={editingPeriod.name ?? ''}
                onChange={(e) => setEditingPeriod((p) => ({ ...p, name: e.target.value }))}
                placeholder="Nom (ex : Journées 5 à 8)"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="text-[11px] font-bold text-slate-600">
                  Début
                  <input
                    type="datetime-local"
                    value={editingPeriod.startsAt ? toLocalInput(editingPeriod.startsAt) : ''}
                    onChange={(e) => setEditingPeriod((p) => ({ ...p, startsAt: fromLocalInput(e.target.value) }))}
                    className="mt-1 w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  />
                </label>
                <label className="text-[11px] font-bold text-slate-600">
                  Fin
                  <input
                    type="datetime-local"
                    value={editingPeriod.endsAt ? toLocalInput(editingPeriod.endsAt) : ''}
                    onChange={(e) => setEditingPeriod((p) => ({ ...p, endsAt: fromLocalInput(e.target.value) }))}
                    className="mt-1 w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  />
                </label>
                <label className="text-[11px] font-bold text-slate-600">
                  Top N qualifiés au tirage
                  <input
                    type="number"
                    min={1}
                    value={editingPeriod.topN ?? 10}
                    onChange={(e) => setEditingPeriod((p) => ({ ...p, topN: Math.max(1, Number(e.target.value)) }))}
                    className="mt-1 w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  />
                </label>
                <label className="text-[11px] font-bold text-slate-600">
                  Statut
                  <select
                    value={editingPeriod.status ?? 'à venir'}
                    onChange={(e) => setEditingPeriod((p) => ({ ...p, status: e.target.value as GamePeriodStatus }))}
                    className="mt-1 w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  >
                    <option value="à venir">à venir</option>
                    <option value="en cours">en cours</option>
                    <option value="clôturée">clôturée</option>
                  </select>
                </label>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => void savePeriod()}
                  disabled={busy}
                  className="px-4 py-2 rounded-xl bg-[#004724] hover:bg-[#006039] text-white text-xs font-black uppercase cursor-pointer disabled:opacity-60"
                >
                  Enregistrer
                </button>
                <button
                  onClick={() => setEditingPeriod(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-black uppercase cursor-pointer"
                >
                  Annuler
                </button>
              </div>
            </div>
          )}

          {periods.map((p) => {
            const pDraws = draws.filter((d) => d.kind === 'period' && d.periodId === p.id);
            const lb = leaderboard[p.id];
            return (
              <div key={p.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-black text-slate-900 uppercase">{p.name}</h4>
                      {statusBadge(p.status)}
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Top {p.topN}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Du {new Date(p.startsAt).toLocaleString('fr-FR')} au {new Date(p.endsAt).toLocaleString('fr-FR')}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      onClick={() => setEditingPeriod(p)}
                      className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 cursor-pointer"
                      title="Modifier"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => void evaluate(p.id)}
                      disabled={busy}
                      className="inline-flex items-center gap-1 px-2.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-black uppercase cursor-pointer disabled:opacity-60"
                      title="Calculer les points des matchs terminés"
                    >
                      <Calculator className="w-3.5 h-3.5" /> Évaluer
                    </button>
                    <button
                      onClick={() => void openLeaderboard(p.id)}
                      className="inline-flex items-center gap-1 px-2.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-black uppercase cursor-pointer"
                    >
                      <Medal className="w-3.5 h-3.5" /> Classement
                    </button>
                    <button
                      onClick={() => void removePeriod(p.id)}
                      className="p-2 rounded-lg border border-red-100 hover:bg-red-50 text-red-500 cursor-pointer"
                      title="Supprimer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {lb && (
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                    <div className="text-[10px] font-black text-slate-500 uppercase mb-1.5">
                      Classement ({lb.length} participant{lb.length > 1 ? 's' : ''})
                    </div>
                    {lb.length === 0 ? (
                      <p className="text-[11px] text-slate-400">Aucun pronostic sur cette période.</p>
                    ) : (
                      <ul className="space-y-1">
                        {lb.slice(0, p.topN).map((row) => (
                          <li key={row.userId} className="flex items-center gap-2 text-[11px]">
                            <span className="font-black text-slate-700 w-8">#{row.rank}</span>
                            <span className="font-mono text-slate-400 truncate max-w-[220px]">{row.userId.slice(0, 8)}…</span>
                            <span className="text-slate-500">{row.predictions} prono.</span>
                            <span className="ml-auto font-black text-[#004724]">{row.totalPoints} pts</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}

                {pDraws.map((d) => (
                  <DrawRow
                    key={d.id}
                    draw={d}
                    busy={busy}
                    seedInput={seedInput[d.id] ?? ''}
                    onSeedChange={(v) => setSeedInput((s) => ({ ...s, [d.id]: v }))}
                    onRun={() => void runDraw(d)}
                    winners={winners[d.id]}
                    onShowWinners={() => void openWinners(d.id)}
                    showFeedback={showFeedback}
                    onPhotoChanged={() => void openWinners(d.id)}
                  />
                ))}
              </div>
            );
          })}
        </div>
      )}

      {/* ------------------- LOTS ------------------- */}
      {subTab === 'prizes' && (
        <div className="space-y-3">
          {periods.length === 0 ? (
            <div className="bg-white p-8 rounded-2xl border border-slate-100 text-center text-xs text-slate-500">
              Créez d'abord une période pour associer des lots.
            </div>
          ) : (
            <>
              <div className="flex flex-wrap gap-2">
                <select
                  onChange={(e) => {
                    const pid = Number(e.target.value);
                    if (pid) setEditingPrize({ periodId: pid, rankFrom: 1, rankTo: 1 });
                  }}
                  value=""
                  className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 cursor-pointer"
                >
                  <option value="">+ Nouveau lot…</option>
                  {periods.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              {editingPrize && (
                <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
                  <h4 className="text-xs font-black text-slate-900 uppercase">
                    {editingPrize.id ? 'Modifier le lot' : 'Nouveau lot'}
                  </h4>
                  <input
                    value={editingPrize.label ?? ''}
                    onChange={(e) => setEditingPrize((p) => (p ? { ...p, label: e.target.value } : p))}
                    placeholder="Intitulé du lot (ex : Maillot officiel FIMF)"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  />
                  <textarea
                    value={editingPrize.description ?? ''}
                    onChange={(e) => setEditingPrize((p) => (p ? { ...p, description: e.target.value } : p))}
                    placeholder="Description (optionnelle)"
                    rows={2}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  />
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <label className="text-[11px] font-bold text-slate-600">
                      Rang début
                      <input
                        type="number"
                        min={1}
                        value={editingPrize.rankFrom ?? 1}
                        onChange={(e) => setEditingPrize((p) => (p ? { ...p, rankFrom: Math.max(1, Number(e.target.value)) } : p))}
                        className="mt-1 w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                      />
                    </label>
                    <label className="text-[11px] font-bold text-slate-600">
                      Rang fin
                      <input
                        type="number"
                        min={1}
                        value={editingPrize.rankTo ?? 1}
                        onChange={(e) => setEditingPrize((p) => (p ? { ...p, rankTo: Math.max(1, Number(e.target.value)) } : p))}
                        className="mt-1 w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                      />
                    </label>
                    <label className="text-[11px] font-bold text-slate-600">
                      Période
                      <select
                        value={editingPrize.periodId}
                        onChange={(e) => setEditingPrize((p) => (p ? { ...p, periodId: Number(e.target.value) } : p))}
                        className="mt-1 w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                      >
                        {periods.map((p) => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <label className="block text-[11px] font-bold text-slate-600">
                    Image du lot (optionnelle)
                    <div className="mt-1 flex items-center gap-2">
                      {prizeImageFile ? (
                        <span className="text-[11px] text-slate-500">{prizeImageFile.name}</span>
                      ) : editingPrize.imageRef ? (
                        <img src={mediaUrl(editingPrize.imageRef)} alt="" className="w-16 h-10 object-cover rounded-lg border border-slate-200" />
                      ) : null}
                      <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-[10px] font-black uppercase text-slate-600 cursor-pointer">
                        <Upload className="w-3.5 h-3.5" />
                        Choisir une image
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => setPrizeImageFile(e.target.files?.[0] ?? null)}
                        />
                      </label>
                      {prizeImageFile && (
                        <button
                          onClick={() => setPrizeImageFile(null)}
                          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => void savePrize()}
                      disabled={busy}
                      className="px-4 py-2 rounded-xl bg-[#004724] hover:bg-[#006039] text-white text-xs font-black uppercase cursor-pointer disabled:opacity-60"
                    >
                      Enregistrer
                    </button>
                    <button
                      onClick={() => { setEditingPrize(null); setPrizeImageFile(null); }}
                      className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-black uppercase cursor-pointer"
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              )}

              {prizes.length === 0 ? (
                <div className="bg-white p-8 rounded-2xl border border-slate-100 text-center text-xs text-slate-500">
                  Aucun lot pour le moment.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {prizes.map((p) => {
                    const period = periods.find((x) => x.id === p.periodId);
                    return (
                      <div key={p.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                        {p.imageRef && <img src={p.imageRef} alt="" className="w-full h-28 object-cover" />}
                        <div className="p-4">
                          <div className="text-[9px] font-black uppercase tracking-wider text-[#ea580c]">
                            Lot {p.rankFrom}{p.rankTo > p.rankFrom ? `–${p.rankTo}` : ''} • {period?.name ?? `Période #${p.periodId}`}
                          </div>
                          <h4 className="text-xs font-black text-slate-900 uppercase mt-0.5">{p.label}</h4>
                          {p.description && <p className="text-[11px] text-slate-500 mt-1">{p.description}</p>}
                          <div className="flex gap-1.5 mt-3">
                            <button
                              onClick={() => setEditingPrize(p)}
                              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 cursor-pointer"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => void removePrize(p.id)}
                              className="p-1.5 rounded-lg border border-red-100 hover:bg-red-50 text-red-500 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ------------------- TIRAGES & BOURSES ------------------- */}
      {subTab === 'draws' && (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() =>
                setEditingDraw({
                  kind: 'period',
                  periodId: periods[0]?.id,
                  title: '',
                  winnersCount: 3,
                })
              }
              disabled={periods.length === 0}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#004724] hover:bg-[#006039] disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-black uppercase cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Tirage de période
            </button>
            <button
              onClick={() =>
                setEditingDraw({
                  kind: 'scholarship',
                  title: "Tirage Bourses d'études Angleterre",
                  description: 'Tirage au sort en ligne sur les réseaux sociaux FIMF — gagnant ou un membre de sa famille.',
                  winnersCount: 1,
                })
              }
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-900 text-xs font-black uppercase cursor-pointer"
            >
              <GradCap /> Tirage bourses
            </button>
          </div>

          {editingDraw && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
              <h4 className="text-xs font-black text-slate-900 uppercase">
                {editingDraw.id ? 'Modifier le tirage' : 'Nouveau tirage'}
              </h4>
              <div className="flex gap-4">
                {(
                  [
                    { v: 'period', l: 'Lots de période (top classement)' },
                    { v: 'scholarship', l: "Bourses d'études (tickets points)" },
                  ] as const
                ).map((k) => (
                  <label key={k.v} className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      checked={(editingDraw.kind ?? 'period') === k.v}
                      onChange={() => setEditingDraw((d) => ({ ...d, kind: k.v }))}
                    />
                    {k.l}
                  </label>
                ))}
              </div>
              {editingDraw.kind === 'period' && (
                <label className="block text-[11px] font-bold text-slate-600">
                  Période
                  <select
                    value={editingDraw.periodId ?? ''}
                    onChange={(e) => setEditingDraw((d) => ({ ...d, periodId: Number(e.target.value) }))}
                    className="mt-1 w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  >
                    {periods.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </label>
              )}
              <input
                value={editingDraw.title ?? ''}
                onChange={(e) => setEditingDraw((d) => ({ ...d, title: e.target.value }))}
                placeholder="Titre du tirage"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              />
              <textarea
                value={editingDraw.description ?? ''}
                onChange={(e) => setEditingDraw((d) => ({ ...d, description: e.target.value }))}
                placeholder="Description (optionnelle)"
                rows={2}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              />
              <label className="block text-[11px] font-bold text-slate-600 w-40">
                Nombre de gagnants
                <input
                  type="number"
                  min={1}
                  value={editingDraw.winnersCount ?? 1}
                  onChange={(e) => setEditingDraw((d) => ({ ...d, winnersCount: Math.max(1, Number(e.target.value)) }))}
                  className="mt-1 w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                />
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => void saveDraw()}
                  disabled={busy}
                  className="px-4 py-2 rounded-xl bg-[#004724] hover:bg-[#006039] text-white text-xs font-black uppercase cursor-pointer disabled:opacity-60"
                >
                  Enregistrer
                </button>
                <button
                  onClick={() => setEditingDraw(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-black uppercase cursor-pointer"
                >
                  Annuler
                </button>
              </div>
            </div>
          )}

          {draws.length === 0 ? (
            <div className="bg-white p-8 rounded-2xl border border-slate-100 text-center text-xs text-slate-500">
              Aucun tirage créé. Les tirages de période récompensent le top classement ; le tirage bourses utilise les
              tickets (1 ticket / 10 points cumulés).
            </div>
          ) : (
            draws.map((d) => (
              <div key={d.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-black text-slate-900 uppercase">{d.title}</h4>
                      {statusBadge(d.status)}
                      <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 uppercase">
                        {d.kind === 'period' ? 'Période' : 'Bourses'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {d.kind === 'period'
                        ? `Période #${d.periodId} — top classement`
                        : 'Tickets pondérés (1 ticket / 10 points cumulés)'}{' '}
                      • {d.winnersCount} gagnant{d.winnersCount > 1 ? 's' : ''}
                      {d.seed ? ` • graine : ${d.seed}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {d.status !== 'terminé' && (
                      <>
                        <input
                          value={seedInput[d.id] ?? ''}
                          onChange={(e) => setSeedInput((s) => ({ ...s, [d.id]: e.target.value }))}
                          placeholder="Graine (optionnelle)"
                          className="w-40 px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[11px]"
                        />
                        <button
                          onClick={() => void runDraw(d)}
                          disabled={busy}
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-900 text-[10px] font-black uppercase cursor-pointer disabled:opacity-60"
                        >
                          {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Dices className="w-3.5 h-3.5" />}
                          Tirer
                        </button>
                      </>
                    )}
                    {d.status === 'terminé' && (
                      <button
                        onClick={() => void openWinners(d.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-black uppercase cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" /> Gagnants
                      </button>
                    )}
                    <button
                      onClick={() => setEditingDraw(d)}
                      className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 cursor-pointer"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => void removeDraw(d.id)}
                      className="p-2 rounded-lg border border-red-100 hover:bg-red-50 text-red-500 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                {winners[d.id] && (
                  <WinnersAdminInline
                    winners={winners[d.id]}
                    showFeedback={showFeedback}
                    onChanged={() => void openWinners(d.id)}
                  />
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

/**
 * Liste des gagnants côté admin : affichage + gestion de la photo de chaque
 * gagnant (upload / remplacement / suppression — bucket fimf-media).
 */
const WinnersAdminInline: React.FC<{
  winners: DrawWinnerPublic[];
  showFeedback: (msg: string, tone?: 'success' | 'error') => void;
  onChanged: () => void;
}> = ({ winners, showFeedback, onChanged }) => {
  const [busyId, setBusyId] = useState<number | null>(null);

  const handleFile = async (winnerId: number, file: File | undefined) => {
    if (!file) return;
    setBusyId(winnerId);
    try {
      const up = await uploadMedia(file);
      await updateWinnerPhoto(winnerId, up.ref);
      showFeedback('Photo du gagnant mise à jour');
      onChanged();
    } catch (e) {
      showFeedback(e instanceof Error ? e.message : 'Téléversement impossible', 'error');
    } finally {
      setBusyId(null);
    }
  };

  const removePhoto = async (winnerId: number) => {
    setBusyId(winnerId);
    try {
      await updateWinnerPhoto(winnerId, null);
      showFeedback('Photo supprimée');
      onChanged();
    } catch (e) {
      showFeedback(e instanceof Error ? e.message : 'Suppression impossible', 'error');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <ul className="space-y-1.5">
      {winners.length === 0 ? (
        <li className="text-[11px] text-slate-400">Aucun gagnant.</li>
      ) : (
        winners.map((w) => (
          <li key={w.id} className="flex items-center gap-2 text-[11px]">
            {w.photoRef ? (
              <img
                src={w.photoRef}
                alt={`Photo de ${w.displayName}`}
                className="w-7 h-7 rounded-full object-cover border border-slate-200 shrink-0"
              />
            ) : (
              <span className="w-7 h-7 rounded-full bg-amber-100 text-amber-700 font-black text-[9px] flex items-center justify-center shrink-0">
                {w.rank}
              </span>
            )}
            <span className="font-black text-slate-800">{w.displayName}</span>
            {w.prizeLabel && <span className="text-slate-500">— {w.prizeLabel}</span>}
            <label
              className={`ml-auto inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 text-[9px] font-black uppercase text-slate-500 cursor-pointer shrink-0 ${
                busyId === w.id ? 'opacity-60' : ''
              }`}
            >
              {busyId === w.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
              {w.photoRef ? 'Remplacer' : 'Photo'}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  void handleFile(w.id, e.target.files?.[0]);
                  e.target.value = '';
                }}
              />
            </label>
            {w.photoRef && (
              <button
                onClick={() => void removePhoto(w.id)}
                disabled={busyId === w.id}
                className="p-1 rounded-lg hover:bg-red-50 text-red-400 cursor-pointer disabled:opacity-50"
                title="Supprimer la photo"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </li>
        ))
      )}
    </ul>
  );
};

/** Ligne de tirage de période (réutilisée dans l'onglet périodes). */
const DrawRow: React.FC<{
  draw: GameDraw;
  busy: boolean;
  seedInput: string;
  onSeedChange: (v: string) => void;
  onRun: () => void;
  winners?: DrawWinnerPublic[];
  onShowWinners: () => void;
  showFeedback?: (msg: string) => void;
  onPhotoChanged?: () => void;
}> = ({ draw, busy, seedInput, onSeedChange, onRun, winners, onShowWinners, showFeedback, onPhotoChanged }) => (
  <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
    <div>
      <div className="text-[11px] font-black text-slate-800">{draw.title}</div>
      <div className="text-[10px] text-slate-500">
        {draw.winnersCount} gagnant{draw.winnersCount > 1 ? 's' : ''} —{' '}
        {draw.status === 'terminé' ? `tiré le ${draw.drawnAt ? new Date(draw.drawnAt).toLocaleString('fr-FR') : ''}` : 'en attente de tirage'}
      </div>
    </div>
    {draw.status === 'terminé' ? (
      <div className="flex items-center gap-2">
        <button
          onClick={onShowWinners}
          className="px-2.5 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 text-[10px] font-black uppercase cursor-pointer"
        >
          Voir les gagnants
        </button>
      </div>
    ) : (
      <div className="flex items-center gap-1.5">
        <input
          value={seedInput}
          onChange={(e) => onSeedChange(e.target.value)}
          placeholder="Graine (optionnelle)"
          className="w-36 px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-[10px]"
        />
        <button
          onClick={onRun}
          disabled={busy}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-900 text-[10px] font-black uppercase cursor-pointer disabled:opacity-60"
        >
          {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : <Dices className="w-3 h-3" />}
          Tirer
        </button>
      </div>
    )}
    {winners &&
      (showFeedback && onPhotoChanged ? (
        <WinnersAdminInline winners={winners} showFeedback={showFeedback} onChanged={onPhotoChanged} />
      ) : (
        <WinnersInline winners={winners} />
      ))}
  </div>
);

const WinnersInline: React.FC<{ winners: DrawWinnerPublic[] }> = ({ winners }) => (
  <ul className="space-y-1">
    {winners.length === 0 ? (
      <li className="text-[11px] text-slate-400">Aucun gagnant.</li>
    ) : (
      winners.map((w) => (
        <li key={w.rank} className="flex items-center gap-2 text-[11px]">
          <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-700 font-black text-[9px] flex items-center justify-center">
            {w.rank}
          </span>
          <span className="font-black text-slate-800">{w.displayName}</span>
          {w.prizeLabel && <span className="text-slate-500">— {w.prizeLabel}</span>}
        </li>
      ))
    )}
  </ul>
);

const GradCap: React.FC = () => <span aria-hidden>🎓</span>;
