import React, { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import {
  Handshake,
  Inbox,
  MessageSquareText,
  CheckCircle2,
  Wallet,
  BellRing,
  Timer,
  Users2,
  ArrowRight,
} from 'lucide-react';
import { fmtFcfa, KpiCard, SectionHeader, EmptyState } from './shared';
import {
  type SponsorPackage,
  type SponsorRequest,
  type SponsorClient,
  type SponsorRequestStatus,
} from '../../../lib/sponsoringApi';

/**
 * ─────────────────────────────────────────────────────────────
 * SOUS-SECTION 1 : TABLEAU DE BORD SPONSORING
 * Synthèse (demandes, sponsors, revenus), evolution des demandes
 * sur 6 mois, répartition par package et alertes de suivi
 * (demandes sans réponse, contrats à échéance).
 * ─────────────────────────────────────────────────────────────
 */

const PIE_COLORS = ['#ea580c', '#f97316', '#004724', '#006039', '#0ea5e9', '#a855f7'];

/** Statuts « en train de se traiter » (contactée + négociation + override anciens). */
const OPEN_STATUSES: SponsorRequestStatus[] = ['contactée', 'en négociation', 'en cours'];
const WON_STATUSES: SponsorRequestStatus[] = ['acceptée', 'signée'];

export const SponsoringDashboard: React.FC<{
  packages: SponsorPackage[];
  requests: SponsorRequest[];
  clients: SponsorClient[];
  packageNames: Record<string, string>;
  onGoRequests?: () => void;
  onGoSponsors?: () => void;
}> = ({ packages, requests, clients, packageNames, onGoRequests, onGoSponsors }) => {
  /* ── Compteurs clés ─────────────────────────────────────────── */
  const counts = useMemo(() => {
    const byStatus = (s: SponsorRequestStatus[]) => requests.filter((r) => s.includes(r.status)).length;
    const now = new Date();
    const isActive = (c: SponsorClient) => !c.endDate || new Date(c.endDate) >= now;
    return {
      received: requests.length,
      fresh: requests.filter((r) => r.status === 'nouvelle').length,
      open: byStatus(OPEN_STATUSES),
      won: byStatus(WON_STATUSES),
      sponsors: clients.filter(isActive).length,
      /** Revenus encaissés (montants déjà payés) + total des contrats signés. */
      collected: clients.reduce((sum, c) => sum + c.amountPaid, 0),
      contracted: clients.filter(isActive).reduce((sum, c) => sum + c.amount, 0),
    };
  }, [requests, clients]);

  /* ── Évolution des demandes : 6 derniers mois ───────────────── */
  const monthlyData = useMemo(() => {
    const months: { key: string; label: string; recues: number; conclues: number }[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        key: d.toISOString().slice(0, 7),
        label: d.toLocaleDateString('fr-FR', { month: 'short' }).replace('.', ''),
        recues: 0,
        conclues: 0,
      });
    }
    const idx = new Map(months.map((m, i) => [m.key, i]));
    for (const r of requests) {
      const k = r.createdAt.slice(0, 7);
      const i = idx.get(k);
      if (i !== undefined) months[i].recues += 1;
    }
    // Conclues : demandes acceptées/signées dont l'activité est sur le mois
    for (const r of requests) {
      if (!WON_STATUSES.includes(r.status)) continue;
      const k = r.lastActivityAt.slice(0, 7);
      const i = idx.get(k);
      if (i !== undefined) months[i].conclues += 1;
    }
    return months;
  }, [requests]);

  /* ── Répartition des sponsors par package ──────────────────── */
  const clientsByPackage = useMemo(() => {
    const map = new Map<string, number>();
    for (const c of clients) {
      const name = c.packageId ? (packages.find((p) => p.id === c.packageId)?.name ?? 'Sans package') : 'Sans package';
      map.set(name, (map.get(name) ?? 0) + 1);
    }
    const data = Array.from(map.entries()).map(([name, value]) => ({ name, value }));
    return data.length > 0 ? data : [{ name: 'Aucun sponsor', value: 1 }];
  }, [clients, packages]);

  /* ── Alertes ────────────────────────────────────────────────── */
  const alerts = useMemo(() => {
    const now = new Date();
    const DAY = 24 * 3600 * 1000;
    const unanswered = requests
      .filter((r) => r.status === 'nouvelle' && now.getTime() - new Date(r.lastActivityAt).getTime() > 7 * DAY)
      .sort((a, b) => new Date(a.lastActivityAt).getTime() - new Date(b.lastActivityAt).getTime())
      .slice(0, 5);
    const expiring = clients
      .filter((c) => {
        if (!c.endDate) return false;
        const days = (new Date(c.endDate).getTime() - now.getTime()) / DAY;
        return days > 0 && days <= 30;
      })
      .sort((a, b) => new Date(a.endDate!).getTime() - new Date(b.endDate!).getTime())
      .slice(0, 5);
    const saturated = packages.filter(
      (p) => p.maxSponsors !== null && p.maxSponsors > 0 &&
        clients.filter((c) => c.packageId === p.id).length >= p.maxSponsors,
    );
    return { unanswered, expiring, saturated };
  }, [requests, clients, packages]);

  const lastRequests = requests.slice(0, 5);

  const canGoRequests = onGoRequests !== undefined;

  return (
    <div className="space-y-5">
      <SectionHeader
        title={
          <>
            <Handshake className="w-5 h-5 text-[#ea580c]" />
            <span>Tableau de bord Sponsoring</span>
          </>
        }
        subtitle="Vue synthétique des demandes, des sponsors actifs et des revenus."
      />

      {/* ── Cartes de synthèse ─────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        <KpiCard
          icon={<Inbox className="w-5 h-5" />}
          label="Demandes reçues"
          value={counts.received}
          hint={counts.fresh > 0 ? `${counts.fresh} nouvelle${counts.fresh > 1 ? 's' : ''} à traiter` : 'Tout est traité'}
          accent="orange"
        />
        <KpiCard
          icon={<MessageSquareText className="w-5 h-5" />}
          label="En négociation / contact"
          value={counts.open}
          hint={`${counts.won} conclue${counts.won > 1 ? 's' : ''} (acceptée${'s'} ou signée${'s'})`}
          accent="slate"
        />
        <KpiCard
          icon={<CheckCircle2 className="w-5 h-5" />}
          label="Sponsors actifs"
          value={counts.sponsors}
          hint={`${clients.length} dossier${clients.length > 1 ? 's' : ''} au total`}
          accent="green"
        />
        <KpiCard
          icon={<Wallet className="w-5 h-5" />}
          label="Revenus encaissés"
          value={fmtFcfa(counts.collected)}
          hint={`Contrats actifs : ${fmtFcfa(counts.contracted)}`}
          accent="green"
        />
      </div>

      {/* ── Graphiques ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h4 className="text-xs font-black uppercase text-slate-700 mb-4">Demandes — 6 derniers mois</h4>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} barGap={2}>
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={26} />
                <Tooltip cursor={{ fill: 'rgba(249,115,22,0.06)' }} contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="recues" name="Reçues" fill="#f97316" radius={[6, 6, 0, 0]} maxBarSize={26} />
                <Bar dataKey="conclues" name="Conclues" fill="#006039" radius={[6, 6, 0, 0]} maxBarSize={26} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h4 className="text-xs font-black uppercase text-slate-700 mb-4">Sponsors par package</h4>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={clientsByPackage} dataKey="value" nameKey="name" innerRadius="45%" outerRadius="75%" paddingAngle={3}>
                  {clientsByPackage.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── Alertes de suivi ───────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Demandes sans réponse depuis 7+ jours */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h4 className="text-xs font-black uppercase text-slate-700 flex items-center gap-2 mb-3">
            <Timer className="w-4 h-4 text-amber-500" />
            Sans réponse depuis plus de 7 jours ({alerts.unanswered.length})
          </h4>
          {alerts.unanswered.length === 0 ? (
            <p className="text-xs text-slate-400 italic">Aucune demande en attente prolongée. Parfait !</p>
          ) : (
            <ul className="space-y-2">
              {alerts.unanswered.map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-2 text-xs bg-amber-50/60 border border-amber-100 rounded-xl px-3 py-2">
                  <span className="min-w-0 truncate font-bold text-slate-700">
                    {r.company} <span className="text-slate-400 font-normal">— {packageNames[r.pack] ?? r.pack}</span>
                  </span>
                  <button
                    onClick={canGoRequests ? onGoRequests : undefined}
                    className="text-[#ea580c] font-black uppercase hover:underline cursor-pointer shrink-0"
                  >
                    Traiter
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Contrats finissant dans les 30 jours */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h4 className="text-xs font-black uppercase text-slate-700 flex items-center gap-2 mb-3">
            <BellRing className="w-4 h-4 text-rose-500" />
            Contrats finissant sous 30 jours ({alerts.expiring.length})
          </h4>
          {alerts.expiring.length === 0 ? (
            <p className="text-xs text-slate-400 italic">Aucun contrat à échéance proche.</p>
          ) : (
            <ul className="space-y-2">
              {alerts.expiring.map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-2 text-xs bg-rose-50/60 border border-rose-100 rounded-xl px-3 py-2">
                  <span className="min-w-0 truncate font-bold text-slate-700">
                    {c.name}{' '}
                    <span className="text-slate-400 font-normal">
                      — fin {new Date(c.endDate!).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                    </span>
                  </span>
                  <button
                    onClick={onGoSponsors}
                    className="text-[#ea580c] font-black uppercase hover:underline cursor-pointer shrink-0"
                  >
                    Ouvrir
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Packages saturés (max de sponsors atteint) — bandeau discret */}
      {alerts.saturated.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 text-xs text-slate-700 flex items-start gap-2">
          <Users2 className="w-4 h-4 text-[#ea580c] shrink-0 mt-0.5" />
          <p>
            <b>Quota atteint :</b>{' '}
            {alerts.saturated.map((p) => p.name).join(', ')} — maximum de sponsors atteint. Pensez à augmenter
            le quota, masquer le package ou afficher « complet » côté public.
          </p>
        </div>
      )}

      {/* ── Dernières demandes ─────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-black uppercase text-slate-700">Dernières demandes</h4>
          {canGoRequests && (
            <button onClick={onGoRequests} className="text-[11px] font-black uppercase text-[#ea580c] hover:underline cursor-pointer inline-flex items-center gap-1">
              Tout voir <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>
        {lastRequests.length === 0 ? (
          <EmptyState
            icon={<Inbox className="w-6 h-6" />}
            title="Aucune demande pour le moment"
            text="Les demandes du formulaire public apparaîtront ici automatiquement."
          />
        ) : (
          <ul className="divide-y divide-slate-100">
            {lastRequests.map((r) => (
              <li key={r.id} className="py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-black text-slate-800 uppercase truncate">{r.company}</p>
                  <p className="text-[11px] text-slate-500 truncate">
                    {r.contactName} — {r.email}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <span className="block text-[11px] font-bold text-slate-600">{packageNames[r.pack] ?? r.pack}</span>
                  <span className="block text-[10px] text-slate-400 font-mono">
                    {new Date(r.createdAt).toLocaleDateString('fr-FR')}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};
