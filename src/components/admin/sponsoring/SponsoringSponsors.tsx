import React, { useMemo, useState } from 'react';
import {
  Building2,
  Plus,
  Pencil,
  Trash2,
  FileDown,
  FileText,
  Upload,
  Loader2,
  Eye,
  EyeOff,
  Globe,
  ChevronUp,
  ChevronDown,
  AlertTriangle,
  Search,
} from 'lucide-react';
import {
  Modal,
  SectionHeader,
  EmptyState,
  INPUT,
  SELECT,
  LABEL,
  BTN_ORANGE,
  BTN_GHOST,
  BTN_DANGER,
  fmtFcfa,
} from './shared';
import { ImageUploadField } from '../ImageUploadField';
import {
  fetchSponsorClientDocs,
  addSponsorClientDoc,
  deleteSponsorClientDoc,
  type SponsorClient,
  type SponsorPackage,
  type PaymentStatus,
  type SponsorDocKind,
} from '../../../lib/sponsoringApi';

/**
 * ─────────────────────────────────────────────────────────────
 * SOUS-SECTION 4 : SPONSORS ET PARTENAIRES
 * Fiches contractées : logo, package, période, montants, statut
 * de paiement, documents (contrat/facture/reçu) et gestion de
 * l'affichage public (« Ils nous font confiance »).
 * ─────────────────────────────────────────────────────────────
 */

const PAYMENT_OPTIONS: { value: PaymentStatus; label: string; color: string }[] = [
  { value: 'attente', label: 'En attente', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  { value: 'partiel', label: 'Partiel', color: 'bg-sky-50 text-sky-700 border-sky-200' },
  { value: 'paye', label: 'Payé', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
];

const DOC_KINDS: { value: SponsorDocKind; label: string }[] = [
  { value: 'contrat', label: 'Contrat' },
  { value: 'facture', label: 'Facture' },
  { value: 'recu', label: 'Reçu' },
  { value: 'autre', label: 'Autre' },
];

interface SponsorRow extends SponsorClient {}

interface SponsorsProps {
  clients: SponsorClient[];
  packages: SponsorPackage[];
  onSave: (c: SponsorClient, syncMirror: boolean) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

/** Fiche vide pour la création d'un sponsor. */
const blankClient = (displayOrder: number): SponsorClient => ({
  id: crypto.randomUUID(),
  name: '',
  contactName: '',
  contactEmail: '',
  contactPhone: '',
  packageId: null,
  logoUrl: null,
  startDate: new Date().toISOString().slice(0, 10),
  endDate: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString().slice(0, 10),
  amount: 0,
  currency: 'FCFA',
  amountPaid: 0,
  paymentStatus: 'attente',
  publicVisible: false,
  displayOrder,
  notes: '',
});

export const SponsoringSponsors: React.FC<SponsorsProps> = ({ clients, packages, onSave, onDelete }) => {
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<SponsorClient | null>(null);
  const [saving, setSaving] = useState(false);
  // Modale documents
  const [docsFor, setDocsFor] = useState<SponsorClient | null>(null);
  const [docs, setDocs] = useState<Awaited<ReturnType<typeof fetchSponsorClientDocs>>>([]);
  const [docsKind, setDocsKind] = useState<SponsorDocKind>('contrat');
  const [docsBusy, setDocsBusy] = useState(false);

  const packageById = useMemo(
    () => new Map(packages.map((p) => [p.id, p])),
    [packages],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return clients.filter((c) =>
      !q ? true : [c.name, c.contactName, c.contactEmail, c.notes].join(' ').toLowerCase().includes(q),
    );
  }, [clients, search]);

  /** Contrats roulant vers l'échéance sous 30 jours (rappel visuel). */
  const expiringSoon = (c: SponsorClient): boolean => {
    if (!c.endDate) return false;
    const days = (new Date(c.endDate).getTime() - Date.now()) / (24 * 3600 * 1000);
    return days > 0 && days <= 30;
  };

  /** Échange l'ordre d'affichage avec le voisin puis persiste les deux fiches. */
  const swapOrder = async (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= filtered.length) return;
    const a = filtered[i];
    const b = filtered[j];
    const tmp = a.displayOrder;
    await onSave({ ...a, displayOrder: b.displayOrder || i }, false);
    await onSave({ ...b, displayOrder: tmp || j }, false);
  };

  /* ── Enregistrement éditeur ───────────────────────────────── */
  const submit = async () => {
    if (!editing) return;
    if (!editing.name.trim()) {
      window.alert('Le nom du sponsor est obligatoire.');
      return;
    }
    setSaving(true);
    try {
      await onSave(editing, true);
      setEditing(null);
    } finally {
      setSaving(false);
    }
  };

  /* ── Documents du sponsor ouvert ──────────────────────────── */
  const openDocs = async (c: SponsorClient) => {
    setDocsFor(c);
    setDocs([]);
    fetchDocs(c.id);
  };
  const fetchDocs = (clientId: string) => {
    fetchSponsorClientDocs(clientId)
      .then(setDocs)
      .catch(() => setDocs([]));
  };
  const uploadDoc = async (file: File | undefined) => {
    if (!file || !docsFor) return;
    setDocsBusy(true);
    try {
      await addSponsorClientDoc(docsFor.id, docsKind, file);
      fetchDocs(docsFor.id);
    } catch (err) {
      window.alert('Téléversement refusé : ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setDocsBusy(false);
    }
  };
  const removeDoc = async (docId: string) => {
    if (!window.confirm('Supprimer ce document ?')) return;
    try {
      await deleteSponsorClientDoc(docId);
      if (docsFor) fetchDocs(docsFor.id);
    } catch (err) {
      window.alert('Suppression refusée : ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  return (
    <div className="space-y-5">
      <SectionHeader
        title={
          <>
            <Building2 className="w-5 h-5 text-[#ea580c]" />
            <span>Sponsors ({clients.length})</span>
          </>
        }
        subtitle="Contrats, paiements, documents et visibilité sur la vitrine « Ils nous font confiance »."
      />

      {/* Recherche */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
          <input
            className={INPUT + ' pl-9'}
            placeholder="Rechercher un sponsor…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button onClick={() => setEditing(blankClient(clients.length))} className={BTN_ORANGE}>
          <Plus className="w-4 h-4" /> Nouveau sponsor
        </button>
      </div>

      {/* Liste */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<Building2 className="w-7 h-7" />}
          title="Aucun sponsor"
          text="Convertissez une demande depuis l'onglet « Demandes » ou créez une fiche manuellement."
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm divide-y divide-slate-100">
          {filtered.map((c, i) => {
            const pay = PAYMENT_OPTIONS.find((p) => p.value === c.paymentStatus) ?? PAYMENT_OPTIONS[0];
            return (
              <div key={c.id} className="flex items-center gap-3 px-4 py-3.5 hover:bg-slate-50/60">
                {/* Logo (ou monogramme) */}
                {c.logoUrl ? (
                  <img src={c.logoUrl} alt="" className="w-10 h-10 rounded-xl object-contain bg-slate-50 shrink-0" />
                ) : (
                  <span className="w-10 h-10 rounded-xl bg-[#052818] text-white text-sm font-black flex items-center justify-center shrink-0">
                    {c.name.slice(0, 2).toUpperCase()}
                  </span>
                )}

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-black text-slate-900 uppercase">{c.name}</span>
                    {expiringSoon(c) && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[9px] font-black uppercase">
                        <AlertTriangle className="w-2.5 h-2.5" /> À échéance sous 30 j
                      </span>
                    )}
                    {c.publicVisible && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-50 text-[#ea580c] border border-orange-200 text-[9px] font-black uppercase">
                        <Globe className="w-2.5 h-2.5" /> Public
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 truncate">
                    {c.packageId ? packageById.get(c.packageId)?.name ?? 'Package retiré' : 'Sans package'} •{' '}
                    {c.startDate ? new Date(c.startDate).toLocaleDateString('fr-FR') : '?'} →{' '}
                    {c.endDate ? new Date(c.endDate).toLocaleDateString('fr-FR') : '?'} • {fmtFcfa(c.amount || 0)}
                    {c.amountPaid > 0 && ` (${fmtFcfa(c.amountPaid)} encaissés)`}
                  </p>
                </div>

                {/* Paiement : changement direct dans la liste */}
                <select
                  value={c.paymentStatus}
                  onChange={(e) => onSave({ ...c, paymentStatus: e.target.value as PaymentStatus }, true)}
                  className={'px-2.5 py-1.5 rounded-lg border text-[10px] font-black uppercase cursor-pointer shrink-0 ' + pay.color}
                  title="Statut du paiement"
                >
                  {PAYMENT_OPTIONS.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => openDocs(c)} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 cursor-pointer" title="Documents (contrats, factures…)">
                    <FileText className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onSave({ ...c, publicVisible: !c.publicVisible }, true)}
                    className={'p-2 rounded-lg hover:bg-slate-100 cursor-pointer ' + (c.publicVisible ? 'text-emerald-600' : 'text-slate-400')}
                    title={c.publicVisible ? 'Retirer de la vitrine publique' : 'Afficher sur la vitrine publique'}
                  >
                    {c.publicVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                  <div className="flex flex-col">
                    <button onClick={() => swapOrder(i, -1)} disabled={i === 0} className="text-slate-400 hover:text-slate-700 cursor-pointer disabled:opacity-30" aria-label="Monter">
                      <ChevronUp className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => swapOrder(i, 1)} disabled={i === filtered.length - 1} className="text-slate-400 hover:text-slate-700 cursor-pointer disabled:opacity-30" aria-label="Descendre">
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <button onClick={() => setEditing({ ...c })} className="p-2 rounded-lg hover:bg-sky-50 text-sky-600 cursor-pointer" title="Modifier">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm(`Supprimer la fiche sponsor « ${c.name} » ? Les documents liés seront également supprimés.`)) {
                        onDelete(c.id);
                      }
                    }}
                    className="p-2 rounded-lg hover:bg-rose-50 text-rose-500 cursor-pointer"
                    title="Supprimer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ═══════════════ ÉDITEUR SPONSOR ═══════════════ */}
      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={
          <>
            <Building2 className="w-4 h-4 text-[#ea580c]" />
            <span>{clients.some((c) => c.id === editing?.id) ? 'Modifier le sponsor' : 'Nouveau sponsor'}</span>
          </>
        }
        wide
        footer={
          <div className="flex justify-end gap-2">
            <button onClick={() => setEditing(null)} className={BTN_GHOST}>
              Annuler
            </button>
            <button onClick={submit} disabled={saving} className={BTN_ORANGE}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Enregistrer
            </button>
          </div>
        }
      >
        {editing && (
          <div className="space-y-4" key={editing.id}>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className={LABEL}>Nom du sponsor *</label>
                <input className={INPUT} value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} placeholder="Ex. Orange Côte d'Ivoire" />
              </div>
              <div>
                <label className={LABEL}>Package</label>
                <select className={SELECT} value={editing.packageId ?? ''} onChange={(e) => setEditing({ ...editing, packageId: e.target.value || null })}>
                  <option value="">Sans package</option>
                  {packages.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-3">
              <div>
                <label className={LABEL}>Contact</label>
                <input className={INPUT} value={editing.contactName} onChange={(e) => setEditing({ ...editing, contactName: e.target.value })} />
              </div>
              <div>
                <label className={LABEL}>E-mail</label>
                <input className={INPUT} type="email" value={editing.contactEmail} onChange={(e) => setEditing({ ...editing, contactEmail: e.target.value })} />
              </div>
              <div>
                <label className={LABEL}>Téléphone</label>
                <input className={INPUT} value={editing.contactPhone} onChange={(e) => setEditing({ ...editing, contactPhone: e.target.value })} />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className={LABEL}>Début du contrat</label>
                <input className={INPUT} type="date" value={editing.startDate ?? ''} onChange={(e) => setEditing({ ...editing, startDate: e.target.value || null })} />
              </div>
              <div>
                <label className={LABEL}>Fin du contrat</label>
                <input className={INPUT} type="date" value={editing.endDate ?? ''} onChange={(e) => setEditing({ ...editing, endDate: e.target.value || null })} />
              </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-3">
              <div>
                <label className={LABEL}>Montant (FCFA)</label>
                <input className={INPUT} type="number" min={0} step={100000} value={editing.amount || ''} onChange={(e) => setEditing({ ...editing, amount: Number(e.target.value) || 0 })} />
              </div>
              <div>
                <label className={LABEL}>Montant payé (FCFA)</label>
                <input className={INPUT} type="number" min={0} step={100000} value={editing.amountPaid || ''} onChange={(e) => setEditing({ ...editing, amountPaid: Number(e.target.value) || 0 })} />
              </div>
              <div>
                <label className={LABEL}>Statut du paiement</label>
                <select
                  className={SELECT}
                  value={editing.paymentStatus}
                  onChange={(e) => setEditing({ ...editing, paymentStatus: e.target.value as PaymentStatus })}
                >
                  {PAYMENT_OPTIONS.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <ImageUploadField
                label="Logo du sponsor"
                value={editing.logoUrl ?? ''}
                onChange={(url) => setEditing({ ...editing, logoUrl: url || null })}
              />
            </div>

            <div>
              <label className={LABEL}>Notes internes</label>
              <textarea className={INPUT + ' resize-none'} rows={2} value={editing.notes} onChange={(e) => setEditing({ ...editing, notes: e.target.value })} />
            </div>

            <label className="flex items-start gap-2.5 bg-orange-50 border border-orange-200 rounded-xl p-3.5 cursor-pointer">
              <input
                type="checkbox"
                checked={editing.publicVisible}
                onChange={(e) => setEditing({ ...editing, publicVisible: e.target.checked })}
                className="accent-[#f97316] w-4 h-4 mt-0.5"
              />
              <span>
                <span className="block text-[11px] font-black text-slate-800 uppercase">Afficher sur la page publique</span>
                <span className="block text-[10.5px] text-slate-600">
                  Ajoute automatiquement le sponsor (nom + logo) à la section « Ils nous font confiance » du site /sponsoring.
                </span>
              </span>
            </label>
          </div>
        )}
      </Modal>

      {/* ═══════════════ DOCUMENTS ═══════════════ */}
      <Modal
        open={docsFor !== null}
        onClose={() => setDocsFor(null)}
        title={
          <>
            <FileText className="w-4 h-4 text-[#ea580c]" />
            <span className="truncate">Documents — {docsFor?.name}</span>
          </>
        }
        subtitle="Contrats, factures, reçus : téléversement et consultation."
        wide
      >
        {docsFor && (
          <div className="space-y-4">
            <div className="flex items-end gap-2 flex-wrap">
              <div>
                <label className={LABEL}>Type</label>
                <select className={SELECT} value={docsKind} onChange={(e) => setDocsKind(e.target.value as SponsorDocKind)}>
                  {DOC_KINDS.map((k) => (
                    <option key={k.value} value={k.value}>
                      {k.label}
                    </option>
                  ))}
                </select>
              </div>
              <label className={BTN_ORANGE + ' cursor-pointer relative overflow-hidden'}>
                <Upload className="w-4 h-4" /> Téléverser un document
                <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => uploadDoc(e.target.files?.[0])} disabled={docsBusy} />
                {docsBusy && <Loader2 className="w-4 h-4 animate-spin" />}
              </label>
            </div>

            {docs.length === 0 ? (
              <p className="text-xs text-slate-400 italic">Aucun document pour ce sponsor.</p>
            ) : (
              <ul className="divide-y divide-slate-100 rounded-xl border border-slate-100 bg-white">
                {docs.map((d) => (
                  <li key={d.id} className="flex items-center gap-3 px-3.5 py-2.5">
                    <span className="px-2 py-1 rounded-lg bg-slate-100 text-[9px] font-black uppercase text-slate-600 shrink-0">
                      {DOC_KINDS.find((k) => k.value === d.kind)?.label ?? d.kind}
                    </span>
                    <FileDown className="w-4 h-4 text-slate-400 shrink-0" />
                    <a href={d.url} target="_blank" rel="noreferrer" className="text-xs text-[#004724] hover:underline font-bold truncate flex-1 cursor-pointer">
                      {d.name}
                    </a>
                    <span className="text-[10px] text-slate-400 font-mono shrink-0">
                      {new Date(d.uploadedAt).toLocaleDateString('fr-FR')}
                    </span>
                    <button onClick={() => removeDoc(d.id)} className="p-2 rounded-lg hover:bg-rose-50 text-rose-500 cursor-pointer shrink-0" title="Supprimer">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};
