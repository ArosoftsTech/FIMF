import React, { useEffect, useMemo, useState } from 'react';
import {
  Search,
  Filter,
  Download,
  Table2,
  Columns3,
  Mail,
  Phone,
  MessageCircle,
  FileText,
  Trash2,
  ArrowUpRight,
  Plus,
  UserRound,
  Loader2,
  History,
  Handshake,
  Inbox,
  StickyNote,
  UserCheck,
  Repeat,
} from 'lucide-react';
import {
  Modal,
  SectionHeader,
  EmptyState,
  StatusBadge,
  INPUT,
  SELECT,
  LABEL,
  BTN_ORANGE,
  BTN_GREEN,
  BTN_GHOST,
  BTN_DANGER,
} from './shared';
import { supabase } from '../../../lib/supabaseClient';
import {
  SPONSOR_REQUEST_STATUSES,
  fetchSponsorRequestEvents,
  exportSponsorRequestsCsv,
  type SponsorPackage,
  type SponsorRequest,
  type SponsorRequestEvent,
  type SponsorRequestStatus,
} from '../../../lib/sponsoringApi';

/**
 * ─────────────────────────────────────────────────────────────
 * SOUS-SECTION 3 : DEMANDES DE PARTENARIAT
 * Tableau filtrable + vue kanban (glisser-déposer), fiche
 * détaillée avec historique, notes internes, actions rapides,
 * assignation et conversion « en un clic » en sponsor.
 * ─────────────────────────────────────────────────────────────
 */

/** Colonnes kanban : statuts modernes + mappage des valeurs historiques. */
const KANBAN_COLUMNS: { status: SponsorRequestStatus; label: string }[] = [
  { status: 'nouvelle', label: 'Nouvelles' },
  { status: 'contactée', label: 'Contactées' },
  { status: 'en négociation', label: 'En négociation' },
  { status: 'acceptée', label: 'Acceptées' },
  { status: 'refusée', label: 'Refusées' },
  { status: 'archivée', label: 'Archivées' },
];
/** MMappage lecture seule des anciens statuts vers une colonne kanban. */
const LEGACY_COLUMN_OF: Partial<Record<SponsorRequestStatus, SponsorRequestStatus>> = {
  'en cours': 'contactée',
  signée: 'acceptée',
};

interface RequestsProps {
  requests: SponsorRequest[];
  packages: SponsorPackage[];
  packageNames: Record<string, string>;
  isAdmin: boolean;
  onChangeStatus: (id: number, status: SponsorRequestStatus) => Promise<void>;
  onAssign: (id: number, userId: string | null) => Promise<void>;
  onNote: (id: number, note: string) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  onPromote: (
    request: SponsorRequest,
    options: { packageId: string | null; amount: number },
  ) => Promise<string>;
}

export const SponsoringRequests: React.FC<RequestsProps> = ({
  requests,
  packages,
  packageNames,
  isAdmin,
  onChangeStatus,
  onAssign,
  onNote,
  onDelete,
  onPromote,
}) => {
  /* ── Filtres & tri ─────────────────────────────────────────── */
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'tous' | SponsorRequestStatus>('tous');
  const [packFilter, setPackFilter] = useState<'tous' | string>('tous');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sort, setSort] = useState<'recent' | 'ancien' | 'ancienactivite'>('recent');
  const [view, setView] = useState<'table' | 'kanban'>('table');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let rows = requests.filter((r) => {
      if (statusFilter !== 'tous' && r.status !== statusFilter) return false;
      if (packFilter !== 'tous' && r.pack !== packFilter) return false;
      if (dateFrom && r.createdAt.slice(0, 10) < dateFrom) return false;
      if (dateTo && r.createdAt.slice(0, 10) > dateTo) return false;
      if (q) {
        const hay = [r.company, r.contactName, r.email, r.phone ?? '', r.message ?? ''].join(' ').toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    rows = [...rows].sort((a, b) => {
      if (sort === 'ancien') return a.createdAt.localeCompare(b.createdAt);
      if (sort === 'ancienactivite') return a.lastActivityAt.localeCompare(b.lastActivityAt);
      return b.createdAt.localeCompare(a.createdAt);
    });
    return rows;
  }, [requests, search, statusFilter, packFilter, dateFrom, dateTo, sort]);

  /** Détail ouvert (fiche) */
  const [openId, setOpenId] = useState<number | null>(null);
  const openRequest = requests.find((r) => r.id === openId) ?? null;

  /* ── Kanban : glisser-déposer ──────────────────────────────── */
  const [dragId, setDragId] = useState<number | null>(null);
  const dropOnColumn = async (status: SponsorRequestStatus) => {
    if (dragId === null) return;
    const req = requests.find((r) => r.id === dragId);
    if (req && req.status !== status) {
      try {
        await onChangeStatus(dragId, status);
      } catch (err) {
        window.alert('Changement refusé : ' + (err instanceof Error ? err.message : String(err)));
      }
    }
    setDragId(null);
  };

  // Historique de la fiche ouverte
  const [events, setEvents] = useState<SponsorRequestEvent[] | null>(null);
  const [noteDraft, setNoteDraft] = useState('');
  const [busy, setBusy] = useState(false);
  // Identité de l'admin connecté (id Auth pour l'assignation)
  const [meId, setMeId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth
      .getUser()
      .then(({ data }) => {
        setMeId(data.user?.id ?? null);
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (openId === null) {
      setEvents(null);
      setNoteDraft('');
      setConvertOpen(false);
      return;
    }
    fetchSponsorRequestEvents(openId)
      .then(setEvents)
      .catch(() => setEvents([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openId]);

  /* ── Conversion en sponsor ─────────────────────────────────── */
  const [convertOpen, setConvertOpen] = useState(false);
  const [convertPackId, setConvertPackId] = useState<string>('');
  const [convertAmount, setConvertAmount] = useState<string>('');

  // Pré-sélection du package correspondant à la demande
  useEffect(() => {
    if (!convertOpen || !openRequest) return;
    const matched = packages.find((p) => p.slug === openRequest.pack);
    setConvertPackId(matched?.id ?? '');
    setConvertAmount(matched?.priceAmount != null ? String(matched.priceAmount) : '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [convertOpen, openId]);

  const addNote = async () => {
    const note = noteDraft.trim();
    if (!note || openId === null) return;
    setBusy(true);
    try {
      await onNote(openId, note);
      setNoteDraft('');
      const fresh = await fetchSponsorRequestEvents(openId).catch(() => null);
      if (fresh) setEvents(fresh);
    } catch (err) {
      window.alert('Note refusée côté serveur : ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setBusy(false);
    }
  };

  const changeStatus = async (id: number, status: SponsorRequestStatus) => {
    setBusy(true);
    try {
      await onChangeStatus(id, status);
      const fresh = await fetchSponsorRequestEvents(id).catch(() => null);
      if (fresh) setEvents(fresh);
    } catch (err) {
      window.alert('Changement refusé : ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setBusy(false);
    }
  };

  const promote = async () => {
    if (!openRequest) return;
    setBusy(true);
    try {
      await onPromote(openRequest, {
        packageId: convertPackId || null,
        amount: Number(convertAmount) || 0,
      });
      setConvertOpen(false);
      window.alert(
        'Fiche sponsor créée ! Ouvrez l\'onglet « Sponsors » pour la compléter (logo, dates, visibilité publique).',
      );
    } catch (err) {
      window.alert('Conversion refusée : ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: number) => {
    if (!window.confirm('Supprimer définitivement cette demande (et son historique) ?')) return;
    setBusy(true);
    try {
      await onDelete(id);
      setOpenId(null);
    } catch (err) {
      window.alert('Suppression refusée : ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setBusy(false);
    }
  };

  /** Libellé WhatsApp à partir du téléphone (digits uniquement). */
  const waHref = (phone: string | null) =>
    phone ? 'https://wa.me/' + phone.replace(/\D/g, '') : null;

  const iconForEvent = (kind: SponsorRequestEvent['kind']) => {
    const map: Record<SponsorRequestEvent['kind'], React.ReactNode> = {
      creation: <Plus className="w-3 h-3" />,
      statut: <Repeat className="w-3 h-3" />,
      assignation: <UserCheck className="w-3 h-3" />,
      note: <StickyNote className="w-3 h-3" />,
      conversion: <Handshake className="w-3 h-3" />,
    };
    return map[kind] ?? <History className="w-3 h-3" />;
  };

  /* ── Rendus ────────────────────────────────────────────────── */
  const FiltersBar = (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
      <div className="relative col-span-2">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
        <input
          className={INPUT + ' pl-9'}
          placeholder="Entreprise, contact, e-mail…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <select className={SELECT} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)} title="Filtrer par statut">
        <option value="tous">Tous statuts</option>
        {SPONSOR_REQUEST_STATUSES.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>
      <select className={SELECT} value={packFilter} onChange={(e) => setPackFilter(e.target.value)} title="Filtrer par package">
        <option value="tous">Tous packages</option>
        {packages.map((p) => (
          <option key={p.id} value={p.slug}>
            {p.name}
          </option>
        ))}
        <option value="autre">Sur devis</option>
      </select>
      <input type="date" className={INPUT} value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} title="Depuis" />
      <input type="date" className={INPUT} value={dateTo} onChange={(e) => setDateTo(e.target.value)} title="Jusqu'à" />
    </div>
  );

  const Toolbar = (
    <div className="flex items-center justify-between gap-2 flex-wrap">
      <p className="text-[11px] font-black text-slate-500 uppercase">
        {filtered.length} demande{filtered.length > 1 ? 's' : ''}
        {filtered.length !== requests.length && ' (filtré)'}
      </p>
      <div className="flex items-center gap-2">
        <select className={SELECT + ' !py-2 !text-[11px]'} value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} title="Tri">
          <option value="recent">Plus récentes</option>
          <option value="ancien">Plus anciennes</option>
          <option value="ancienactivite">Ancien activité d'abord</option>
        </select>
        <button
          onClick={() => setView(view === 'table' ? 'kanban' : 'table')}
          className={BTN_GHOST + ' !py-2'}
          title={view === 'table' ? 'Passer en vue kanban' : 'Revenir au tableau'}
        >
          {view === 'table' ? <Columns3 className="w-4 h-4" /> : <Table2 className="w-4 h-4" />}
          {view === 'table' ? 'Kanban' : 'Tableau'}
        </button>
        <button
          onClick={() => exportSponsorRequestsCsv(filtered, packageNames)}
          className={BTN_GHOST + ' !py-2'}
          title="Exporter (Excel/CSV)"
          disabled={filtered.length === 0}
        >
          <Download className="w-4 h-4" /> CSV
        </button>
      </div>
    </div>
  );

  /* Vue tableau */
  const TableView = (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-x-auto">
      <table className="w-full text-left" style={{ minWidth: 720 }}>
        <thead>
          <tr className="text-[10px] uppercase tracking-wider text-slate-400 border-b border-slate-100">
            <th className="px-4 py-3 font-black">Reçue le</th>
            <th className="px-4 py-3 font-black">Entreprise / contact</th>
            <th className="px-4 py-3 font-black">Package</th>
            <th className="px-4 py-3 font-black">Statut</th>
            <th className="px-2 py-3 font-black">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {filtered.map((r) => (
            <tr key={r.id} className="hover:bg-slate-50/70">
              <td className="px-4 py-3 text-[11px] text-slate-500 font-mono whitespace-nowrap">
                {new Date(r.createdAt).toLocaleDateString('fr-FR')}
                {!isAdmin && <span className="block text-[9px] text-slate-400">{new Date(r.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>}
              </td>
              <td className="px-4 py-3 min-w-0">
                <button onClick={() => setOpenId(r.id)} className="text-xs font-black text-slate-900 hover:text-[#ea580c] uppercase cursor-pointer text-left">
                  {r.company}
                </button>
                <p className="text-[11px] text-slate-500 truncate">
                  {r.contactName} — {r.email}
                  {r.phone ? ' — ' + r.phone : ''}
                </p>
              </td>
              <td className="px-4 py-3 text-[11px] font-bold text-slate-600 whitespace-nowrap">{packageNames[r.pack] ?? r.pack}</td>
              <td className="px-4 py-3">
                {isAdmin ? (
                  <select
                    value={r.status}
                    onChange={(e) => changeStatus(r.id, e.target.value as SponsorRequestStatus)}
                    className="px-2 py-1.5 rounded-lg text-[10px] font-black uppercase border cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#ea580c]/40"
                  >
                    {SPONSOR_REQUEST_STATUSES.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <StatusBadge status={r.status} />
                )}
              </td>
              <td className="px-2 py-3">
                <div className="flex items-center gap-1">
                  <a href={'mailto:' + r.email + '?subject=' + encodeURIComponent('Votre demande de partenariat FIMF')} className="p-2 rounded-lg hover:bg-sky-50 text-sky-600" title="Répondre par e-mail">
                    <Mail className="w-3.5 h-3.5" />
                  </a>
                  {r.phone && (
                    <a href={waHref(r.phone) ?? 'tel:' + r.phone} target="_blank" rel="noreferrer" className="p-2 rounded-lg hover:bg-emerald-50 text-emerald-600" title={waHref(r.phone) ? 'WhatsApp' : 'Appeler'}>
                      {waHref(r.phone) ? <MessageCircle className="w-3.5 h-3.5" /> : <Phone className="w-3.5 h-3.5" />}
                    </a>
                  )}
                  <button onClick={() => setOpenId(r.id)} className="p-2 rounded-lg hover:bg-orange-50 text-[#ea580c]" title="Ouvrir la fiche">
                    <FileText className="w-3.5 h-3.5" />
                  </button>
                  {isAdmin && (
                    <button onClick={() => remove(r.id)} className="p-2 rounded-lg hover:bg-rose-50 text-rose-400" title="Supprimer">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
          {filtered.length === 0 && (
            <tr>
              <td colSpan={5} className="px-4 py-10">
                <EmptyState icon={<Inbox className="w-6 h-6" />} title="Aucune demande ne correspond" text="Élargissez ou réinitialisez les filtres." />
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );

  /* Vue kanban */
  const KanbanView = (
    <div className="grid grid-flow-col auto-cols-[260px] gap-3 overflow-x-auto pb-3">
      {KANBAN_COLUMNS.map((col) => {
        const cards = filtered.filter(
          (r) => r.status === col.status || LEGACY_COLUMN_OF[r.status] === col.status,
        );
        return (
          <div
            key={col.status}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => dropOnColumn(col.status)}
            className="bg-slate-100/70 rounded-2xl p-2.5 flex flex-col gap-2"
          >
            <div className="flex items-center justify-between px-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">{col.label}</span>
              <span className="text-[10px] font-black text-slate-400 bg-white rounded-full px-2">{cards.length}</span>
            </div>
            {cards.map((r) => (
              <div
                key={r.id}
                draggable={isAdmin}
                onDragStart={() => setDragId(r.id)}
                className="bg-white rounded-xl border border-slate-200 shadow-sm p-3 cursor-grab active:cursor-grabbing hover:border-[#f97316]/40 transition-colors"
                onClick={() => setOpenId(r.id)}
              >
                <p className="text-xs font-black text-slate-900 uppercase truncate">{r.company}</p>
                <p className="text-[10px] text-slate-500 truncate mt-0.5">{r.contactName}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-[9px] font-black uppercase text-[#ea580c]">{packageNames[r.pack] ?? r.pack}</span>
                  <span className="text-[9px] text-slate-400 font-mono">{new Date(r.createdAt).toLocaleDateString('fr-FR')}</span>
                </div>
              </div>
            ))}
            {cards.length === 0 && (
              <div className="text-center text-[10px] text-slate-400 italic py-4 border-2 border-dashed border-slate-200 rounded-xl">
                Glissez une demande ici
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="space-y-5">
      <SectionHeader
        title={
          <>
            <Filter className="w-5 h-5 text-[#ea580c]" />
            <span>Demandes de partenariat</span>
          </>
        }
        subtitle="Demandes reçues via le formulaire public — suivi jusqu'à la signature."
        actions={
          !isAdmin ? (
            <span className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-1">
              <UserRound className="w-3.5 h-3.5" /> Consultation seule
            </span>
          ) : undefined
        }
      />
      {FiltersBar}
      {Toolbar}
      {view === 'table' ? TableView : KanbanView}

      {/* ═══════════════ FICHE DÉTAILLÉE (modale large) ═══════════════ */}
      <Modal
        open={openRequest !== null}
        onClose={() => setOpenId(null)}
        title={
          <>
            <FileText className="w-4 h-4 text-[#ea580c]" />
            <span className="truncate">{openRequest?.company}</span>
          </>
        }
        subtitle={
          openRequest
            ? 'Reçue le ' + new Date(openRequest.createdAt).toLocaleString('fr-FR')
            : undefined
        }
        wide
        footer={
          openRequest && isAdmin && (
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <button onClick={() => remove(openRequest.id)} className={BTN_DANGER}>
                <Trash2 className="w-4 h-4" /> Supprimer
              </button>
              <div className="flex items-center gap-2 flex-wrap">
                <select
                  className={SELECT + ' !py-2'}
                  value={openRequest.status}
                  onChange={(e) => changeStatus(openRequest.id, e.target.value as SponsorRequestStatus)}
                  disabled={busy}
                  aria-label="Changer le statut"
                >
                  {SPONSOR_REQUEST_STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
                <button onClick={() => setConvertOpen(true)} className={BTN_ORANGE}>
                  <ArrowUpRight className="w-4 h-4" /> Convertir en sponsor
                </button>
              </div>
            </div>
          )
        }
      >
        {openRequest && (
          <div className="space-y-5">
            {/* Informations demandeur */}
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-100">
                <p className="text-[10px] font-black uppercase text-slate-400 mb-2">Contact</p>
                <p className="text-xs font-bold text-slate-800">{openRequest.contactName}</p>
                <div className="mt-2 space-y-1.5 text-[11px]">
                  <a href={'mailto:' + openRequest.email} className="flex items-center gap-1.5 text-sky-700 hover:underline break-all cursor-pointer">
                    <Mail className="w-3 h-3 shrink-0" /> {openRequest.email}
                  </a>
                  {openRequest.phone && (
                    <a href={waHref(openRequest.phone) ?? 'tel:' + openRequest.phone} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-emerald-700 hover:underline cursor-pointer">
                      <Phone className="w-3 h-3 shrink-0" /> {openRequest.phone}
                      {waHref(openRequest.phone) && <MessageCircle className="w-3 h-3 text-emerald-500" />}
                    </a>
                  )}
                </div>
              </div>
              <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-100">
                <p className="text-[10px] font-black uppercase text-slate-400 mb-2">Demande</p>
                <p className="text-xs text-slate-700">
                  <b>Package :</b> {packageNames[openRequest.pack] ?? openRequest.pack}
                </p>
                <p className="text-xs text-slate-700 mt-1">
                  <b>Statut :</b> <StatusBadge status={openRequest.status} />
                </p>
                {openRequest.message && (
                  <p className="text-[11px] text-slate-600 italic mt-2 leading-relaxed">« {openRequest.message} »</p>
                )}
              </div>
            </div>

            {/* Assignation */}
            {isAdmin && (
              <div className="flex items-center justify-between gap-2 bg-sky-50/60 border border-sky-100 rounded-xl px-3.5 py-2.5">
                <p className="text-[11px] text-slate-600 flex items-center gap-1.5 min-w-0">
                  <UserRound className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                  {openRequest.assignedTo
                    ? openRequest.assignedTo === meId
                      ? 'Assignée à vous'
                      : 'Assignée à un responsable'
                    : 'Non assignée'}
                </p>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => onAssign(openRequest.id, meId)}
                    disabled={openRequest.assignedTo === meId}
                    className={BTN_GHOST + ' !py-2'}
                  >
                    <UserCheck className="w-3.5 h-3.5" /> M'assigner
                  </button>
                  {openRequest.assignedTo && (
                    <button onClick={() => onAssign(openRequest.id, null)} className="text-[10px] font-black uppercase text-slate-400 hover:text-rose-500 cursor-pointer">
                      Retirer
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Historique + notes */}
            <div>
              <p className="text-[10px] font-black uppercase text-slate-400 mb-2 flex items-center gap-1.5">
                <History className="w-3 h-3" /> Historique
              </p>
              <div className="rounded-xl border border-slate-100 bg-white max-h-56 overflow-y-auto divide-y divide-slate-50">
                {/* Ligne d'origine (synthétisée) */}
                <div className="px-3 py-2.5 flex items-start gap-2.5">
                  <span className="w-6 h-6 rounded-lg bg-orange-50 text-[#ea580c] flex items-center justify-center shrink-0">
                    <Plus className="w-3 h-3" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold text-slate-700">Demande reçue via le site</p>
                    <p className="text-[10px] text-slate-400 font-mono">{new Date(openRequest.createdAt).toLocaleString('fr-FR')}</p>
                  </div>
                </div>
                {(events ?? []).map((ev) => (
                  <div key={ev.id} className="px-3 py-2.5 flex items-start gap-2.5">
                    <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center shrink-0">
                      {iconForEvent(ev.kind)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] text-slate-700">
                        {ev.kind === 'statut' && ev.payload?.from && ev.payload?.to && (
                          <>
                            Statut : {SPONSOR_REQUEST_STATUSES.find((s) => s.value === ev.payload.from)?.label ?? String(ev.payload.from)}{' '}
                            <ArrowUpRight className="w-3 h-3 inline" />{' '}
                            <b>{SPONSOR_REQUEST_STATUSES.find((s) => s.value === ev.payload.to)?.label ?? String(ev.payload.to)}</b>
                          </>
                        )}
                        {ev.kind === 'statut' && !ev.payload?.from && <>Statut mis à jour</>}
                        {ev.kind === 'assignation' && <>Responsable mis à jour</>}
                        {ev.kind === 'note' && <span className="italic">« {ev.payload?.note} »</span>}
                        {ev.kind === 'conversion' && <span>Convertie en sponsor — {ev.payload?.note}</span>}
                        {ev.kind === 'creation' && <>Créée</>}
                      </p>
                      <p className="text-[10px] text-slate-400 font-mono">
                        {new Date(ev.createdAt).toLocaleString('fr-FR')}
                        {ev.authorEmail && ' — ' + ev.authorEmail}
                      </p>
                    </div>
                  </div>
                ))}
                {events === null && (
                  <div className="px-3 py-3 text-[11px] text-slate-400 flex items-center gap-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Chargement de l'historique…
                  </div>
                )}
              </div>
            </div>

            {/* Ajout de note */}
            {isAdmin && (
              <div>
                <p className="text-[10px] font-black uppercase text-slate-400 mb-2">Note interne</p>
                <div className="flex gap-2">
                  <input
                    className={INPUT}
                    value={noteDraft}
                    onChange={(e) => setNoteDraft(e.target.value)}
                    placeholder="Ex. Rappel effectué, budget validé, contre-proposition envoyée…"
                    onKeyDown={(e) => e.key === 'Enter' && addNote()}
                    disabled={busy}
                  />
                  <button onClick={addNote} disabled={busy || !noteDraft.trim()} className={BTN_GREEN + ' shrink-0'}>
                    <Plus className="w-4 h-4" /> Ajouter
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Une note réinitialise l'alerte « Sans réponse depuis 7 jours ».</p>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* ═══════════════ CONVERSION EN SPONSOR ═══════════════ */}
      <Modal
        open={convertOpen && openRequest !== null}
        onClose={() => setConvertOpen(false)}
        title={
          <>
            <Handshake className="w-4 h-4 text-[#004724]" />
            <span>Convertir en sponsor</span>
          </>
        }
        subtitle="Crée la fiche sponsor avec les coordonnées de la demande."
        footer={
          <div className="flex justify-end gap-2">
            <button onClick={() => setConvertOpen(false)} className={BTN_GHOST}>
              Annuler
            </button>
            <button onClick={promote} disabled={busy} className={BTN_GREEN}>
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Handshake className="w-4 h-4" />}
              Créer le sponsor
            </button>
          </div>
        }
      >
        {openRequest && (
          <div className="space-y-3">
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-[11px] text-slate-700">
              {openRequest.company} — {openRequest.contactName} ({openRequest.email})
              {openRequest.phone ? ' — ' + openRequest.phone : ''}
            </div>
            <div>
              <label className={LABEL}>Package rattaché</label>
              <select className={SELECT} value={convertPackId} onChange={(e) => setConvertPackId(e.target.value)}>
                <option value="">Sans package</option>
                {packages.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={LABEL}>Montant du contrat (FCFA)</label>
              <input
                className={INPUT}
                type="number"
                min={0}
                step={100000}
                value={convertAmount}
                onChange={(e) => setConvertAmount(e.target.value)}
              />
            </div>
            <p className="text-[10.5px] text-slate-400">
              Dates par défaut : début aujourd'hui, fin dans un an. Statut de paiement initial « En attente ». La demande passera « Acceptée ».
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
};
