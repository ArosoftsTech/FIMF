import React, { useState } from 'react';
import {
  Trophy,
  Plus,
  Pencil,
  Copy,
  Trash2,
  GripVertical,
  ChevronUp,
  ChevronDown,
  Eye,
  EyeOff,
  Loader2,
  Star,
  Layers,
  Info,
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
  fmtFcfa,
} from './shared';
import { TROPHY_COMPONENTS, TROPHY_SIZE_CLASS } from '../../sponsoring/Trophies';
import { ImageUploadField } from '../ImageUploadField';
import {
  countClientsForPackage,
  type SponsorPackage,
  type TrophyKind,
  type SponsorClient,
} from '../../../lib/sponsoringApi';

/** Libellé de prix d'un package (montant ou « Sur devis »). */
const priceLabel = (p: SponsorPackage): string =>
  p.isOnDemand || p.priceAmount === null ? 'Sur devis' : 'Montant ' + fmtFcfa(p.priceAmount);

/**
 * ─────────────────────────────────────────────────────────────
 * SOUS-SECTION 2 : PACKAGES
 * Liste réordonnable (glisser-déposer + boutons), éditeur complet
 * avec aperçu en direct de la carte publique, duplication et
 * suppression protégée (sponsors rattachés).
 * ─────────────────────────────────────────────────────────────
 */

interface PackagesProps {
  packages: SponsorPackage[];
  clients: SponsorClient[];
  onSave: (p: SponsorPackage) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onReorder: (orderedIds: string[]) => Promise<void>;
}

/** Trophée mini pour la liste (illustration standard ou image custom). */
const MiniTrophy: React.FC<{ p: SponsorPackage }> = ({ p }) => {
  if (p.trophyKind === 'custom' && p.customImageUrl) {
    return <img src={p.customImageUrl} alt="" className="w-9 h-9 object-contain" />;
  }
  const T = TROPHY_COMPONENTS[p.trophyKind === 'custom' ? 'or' : p.trophyKind];
  return <T className="w-9 h-9" label="" />;
};

/** État du formulaire d'édition (copie locale en cours de modification). */
type Draft = SponsorPackage;

const blankPackage = (sortOrder: number): Draft => ({
  id: crypto.randomUUID(),
  slug: '',
  name: '',
  trophyKind: 'bronze',
  customImageUrl: null,
  tagline: '',
  priceAmount: null,
  currency: 'FCFA',
  isOnDemand: false,
  duration: 'Une saison (12 mois)',
  perks: [],
  badge: null,
  isPopular: false,
  maxSponsors: null,
  active: true,
  sortOrder,
});

export const SponsoringPackages: React.FC<PackagesProps> = ({
  packages,
  clients,
  onSave,
  onDelete,
  onReorder,
}) => {
  const [editing, setEditing] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  const clientsByPackage = React.useMemo(() => {
    const m = new Map<string, number>();
    for (const c of clients) if (c.packageId) m.set(c.packageId, (m.get(c.packageId) ?? 0) + 1);
    return m;
  }, [clients]);

  /* ── Réordonnancement ─────────────────────────────────────────── */
  const move = (from: number, to: number) => {
    if (to < 0 || to >= packages.length || from === to) return;
    const next = [...packages];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onReorder(next.map((p) => p.id));
  };

  const drop = (to: number) => {
    if (dragIndex !== null) move(dragIndex, to);
    setDragIndex(null);
    setOverIndex(null);
  };

  /** Duplication : copie nommé « (copie) » avec un slug unique. */
  const duplicate = (p: SponsorPackage) => {
    const baseSlug = 'copie-' + (p.slug || p.name.toLowerCase().replace(/\s+/g, '-'));
    let slug = baseSlug;
    while (packages.some((q) => q.slug === slug)) slug = baseSlug + '-' + Math.random().toString(36).slice(2, 5);
    setEditing({
      ...p,
      id: crypto.randomUUID(),
      name: p.name + ' (copie)',
      slug,
      isPopular: false,
      badge: null,
      active: false,
      sortOrder: Math.max(...packages.map((q) => q.sortOrder), 0) + 1,
    });
  };

  /** Suppression : confirm + garde « sponsors rattachés » (sécurité RLS+client). */
  const askDelete = async (p: SponsorPackage) => {
    const attached = clientsByPackage.get(p.id) ?? (await countClientsForPackage(p.id).catch(() => 0));
    if (attached > 0) {
      window.alert(
        `Suppression impossible : ${attached} sponsor${attached > 1 ? 's' : ''} utilisent encore le package ${p.name}. Réaffectez-les d'abord.`,
      );
      return;
    }
    if (window.confirm(`Supprimer définitivement le package « ${p.name} » ? Cette action est irréversible.`)) {
      await onDelete(p.id);
    }
  };

  /* ── Enregistrement de l'éditeur ──────────────────────────────── */
  const submitEdit = async () => {
    if (!editing) return;
    if (!editing.name.trim()) {
      window.alert('Le nom du package est obligatoire.');
      return;
    }
    setSaving(true);
    try {
      // Slug auto à partir du nom si vide (identifiant des deep-links ?pack=)
      const ensured: Draft = {
        ...editing,
        slug:
          editing.slug.trim() ||
          editing.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
        perks: editing.perks.map((s) => s.trim()).filter(Boolean),
      };
      await onSave(ensured);
      setEditing(null);
    } finally {
      setSaving(false);
    }
  };

  const setDraft = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setEditing((d) => (d ? { ...d, [key]: value } : d));

  /* ── Éditeur perks (avantages réordonnables) ──────────────────── */
  const setPerk = (i: number, value: string) => {
    const perks = [...(editing?.perks ?? [])];
    perks[i] = value;
    setDraft('perks', perks);
  };
  const addPerk = () => setDraft('perks', [...(editing?.perks ?? []), '']);
  const removePerk = (i: number) =>
    setDraft(
      'perks',
      (editing?.perks ?? []).filter((_, j) => j !== i),
    );
  const movePerk = (i: number, dir: -1 | 1) => {
    const perks = [...(editing?.perks ?? [])];
    const j = i + dir;
    if (j < 0 || j >= perks.length) return;
    [perks[i], perks[j]] = [perks[j], perks[i]];
    setDraft('perks', perks);
  };

  return (
    <div className="space-y-5">
      <SectionHeader
        title={
          <>
            <Trophy className="w-5 h-5 text-[#ea580c]" />
            <span>Packages ({packages.length})</span>
          </>
        }
        subtitle="L'ordre définit la progression visuelle des trophées sur la page publique."
      />

      {packages.length === 0 ? (
        <EmptyState
          icon={<Layers className="w-7 h-7" />}
          title="Aucun package"
          text="Créez votre premier package : il apparaîtra immédiatement sur la page publique /sponsoring."
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm divide-y divide-slate-100">
          {packages.map((p, i) => (
            <div
              key={p.id}
              draggable
              onDragStart={() => setDragIndex(i)}
              onDragOver={(e) => {
                e.preventDefault();
                setOverIndex(i);
              }}
              onDragLeave={() => setOverIndex((v) => (v === i ? null : v))}
              onDrop={() => drop(i)}
              className={
                'flex items-center gap-3 px-4 py-3.5 transition-colors ' +
                (overIndex === i ? 'bg-orange-50' : 'hover:bg-slate-50')
              }
            >
              <GripVertical className="w-4 h-4 text-slate-300 cursor-grab shrink-0" aria-hidden="true" />
              <div className="w-12 text-center text-[10px] font-black text-slate-400 shrink-0">#{i + 1}</div>
              <div className="w-12 flex justify-center shrink-0">
                <MiniTrophy p={p} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-black text-slate-900 uppercase">{p.name}</span>
                  {p.isPopular && (
                    <span className="px-2 py-0.5 rounded-full bg-[#f97316] text-white text-[9px] font-black uppercase tracking-wider inline-flex items-center gap-1">
                      <Star className="w-2.5 h-2.5" /> Populaire
                    </span>
                  )}
                  {!p.active && (
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[9px] font-black uppercase tracking-wider">
                      Masqué
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 truncate">
                  {priceLabel(p)}
                  {p.maxSponsors !== null && ` • max ${p.maxSponsors} sponsors`} •{' '}
                  {clientsByPackage.get(p.id) ?? 0} sponsor{(clientsByPackage.get(p.id) ?? 0) > 1 ? 's' : ''}
                </p>
              </div>
              {/* Actions ligne */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => onSave({ ...p, active: !p.active })}
                  className={'p-2 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer ' + (p.active ? 'text-emerald-600' : 'text-slate-400')}
                  title={p.active ? 'Masquer du site public' : 'Afficher sur le site public'}
                >
                  {p.active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
                <button onClick={() => move(i, i - 1)} disabled={i === 0} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 cursor-pointer disabled:opacity-30" title="Monter">
                  <ChevronUp className="w-4 h-4" />
                </button>
                <button onClick={() => move(i, i + 1)} disabled={i === packages.length - 1} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 cursor-pointer disabled:opacity-30" title="Descendre">
                  <ChevronDown className="w-4 h-4" />
                </button>
                <button onClick={() => setEditing({ ...p })} className="p-2 rounded-lg hover:bg-sky-50 text-sky-600 cursor-pointer" title="Modifier">
                  <Pencil className="w-4 h-4" />
                </button>
                <button onClick={() => duplicate(p)} className="p-2 rounded-lg hover:bg-violet-50 text-violet-600 cursor-pointer" title="Dupliquer">
                  <Copy className="w-4 h-4" />
                </button>
                <button onClick={() => askDelete(p)} className="p-2 rounded-lg hover:bg-rose-50 text-rose-500 cursor-pointer" title="Supprimer">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <button onClick={() => setEditing(blankPackage(packages.length + 1))} className={BTN_ORANGE}>
        <Plus className="w-4 h-4" /> Nouveau package
      </button>

      {/* ═══════════════ ÉDITEUR (modale large) ═══════════════ */}
      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={
          <>
            <Trophy className="w-4 h-4 text-[#ea580c]" />
            <span>{packages.some((p) => p.id === editing?.id) ? 'Modifier le package' : 'Nouveau package'}</span>
          </>
        }
        subtitle="Les modifications s'affichent instantanément sur l'aperçu à droite."
        wide
        footer={
          <div className="flex justify-end gap-2">
            <button onClick={() => setEditing(null)} className={BTN_GHOST}>
              Annuler
            </button>
            <button onClick={submitEdit} disabled={saving} className={BTN_ORANGE}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Enregistrer le package
            </button>
          </div>
        }
      >
        {editing && (
          <div className="grid md:grid-cols-[1.25fr_0.75fr] gap-6">
            {/* ── Formulaire ─────────────────────────────── */}
            <div className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className={LABEL}>Nom du package *</label>
                  <input className={INPUT} value={editing.name} onChange={(e) => setDraft('name', e.target.value)} placeholder="Ex. Or" />
                </div>
                <div>
                  <label className={LABEL}>Identifiant (slug) — liens profonds ?pack=</label>
                  <input
                    className={INPUT}
                    value={editing.slug}
                    onChange={(e) => setDraft('slug', e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                    placeholder="auto si vide"
                  />
                </div>
              </div>

              <div>
                <label className={LABEL}>Trophée affiché</label>
                <div className="grid grid-cols-5 gap-2">
                  {(['bronze', 'argent', 'or', 'diamant', 'custom'] as TrophyKind[]).map((kind) => (
                    <button
                      key={kind}
                      type="button"
                      onClick={() => setDraft('trophyKind', kind)}
                      className={
                        'rounded-xl border p-2 flex flex-col items-center gap-1 cursor-pointer transition-colors ' +
                        (editing.trophyKind === kind ? 'border-[#f97316] bg-orange-50' : 'border-slate-200 hover:bg-slate-50')
                      }
                    >
                      <span className="w-8 h-8 flex items-center justify-center">
                        {kind === 'custom' ? (
                          <span className="text-[10px] font-black text-slate-500">IMG</span>
                        ) : (
                          React.createElement(TROPHY_COMPONENTS[kind], {
                            className: 'w-7 h-7',
                            label: '',
                          })
                        )}
                      </span>
                      <span className="text-[9px] font-black uppercase tracking-wider text-slate-500">
                        {kind === 'custom' ? 'Image' : kind}
                      </span>
                    </button>
                  ))}
                </div>
                {editing.trophyKind === 'custom' && (
                  <div className="mt-3">
                    <ImageUploadField
                      label="Image du trophée (SVG/PNG)"
                      value={editing.customImageUrl ?? ''}
                      onChange={(url) => setDraft('customImageUrl', url || null)}
                    />
                  </div>
                )}
              </div>

              <div>
                <label className={LABEL}>Slogan court</label>
                <input
                  className={INPUT}
                  value={editing.tagline}
                  onChange={(e) => setDraft('tagline', e.target.value)}
                  placeholder="Ex. Le partenariat complet : maillots, digital et cérémonies"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className={LABEL}>Montant ({editing.currency}) — vide = sur devis</label>
                  <input
                    className={INPUT}
                    type="number"
                    min={0}
                    step={100000}
                    disabled={editing.isOnDemand}
                    value={editing.priceAmount ?? ''}
                    onChange={(e) => setDraft('priceAmount', e.target.value === '' ? null : Number(e.target.value))}
                  />
                  <label className="flex items-center gap-2 mt-2 text-[11px] font-bold text-slate-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editing.isOnDemand}
                      onChange={(e) => setDraft('isOnDemand', e.target.checked)}
                      className="accent-[#f97316] w-4 h-4"
                    />
                    Afficher « Sur devis »
                  </label>
                </div>
                <div>
                  <label className={LABEL}>Durée du partenariat</label>
                  <input className={INPUT} value={editing.duration} onChange={(e) => setDraft('duration', e.target.value)} placeholder="Ex. Une saison (12 mois)" />
                </div>
              </div>

              {/* Avantages */}
              <div>
                <div className="flex items-center justify-between">
                  <label className={LABEL}>Avantages ({editing.perks.length})</label>
                  <button onClick={addPerk} className="text-[11px] font-black uppercase text-[#ea580c] hover:underline cursor-pointer inline-flex items-center gap-1">
                    <Plus className="w-3 h-3" /> Ajouter
                  </button>
                </div>
                <ul className="space-y-2">
                  {editing.perks.map((perk, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <div className="flex flex-col shrink-0">
                        <button onClick={() => movePerk(i, -1)} disabled={i === 0} className="text-slate-400 hover:text-slate-700 cursor-pointer disabled:opacity-30" aria-label="Monter">
                          <ChevronUp className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => movePerk(i, 1)} disabled={i === editing.perks.length - 1} className="text-slate-400 hover:text-slate-700 cursor-pointer disabled:opacity-30" aria-label="Descendre">
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <input className={INPUT} value={perk} onChange={(e) => setPerk(i, e.target.value)} placeholder={'Avantage ' + (i + 1)} />
                      <button onClick={() => removePerk(i)} className="p-2 rounded-lg hover:bg-rose-50 text-rose-500 cursor-pointer shrink-0" aria-label="Retirer">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </li>
                  ))}
                  {editing.perks.length === 0 && (
                    <li className="text-[11px] text-slate-400 italic">Aucun avantage — ajoutez au moins un avantage.</li>
                  )}
                </ul>
                <p className="mt-2 text-[10.5px] text-slate-400 flex items-start gap-1.5">
                  <Info className="w-3 h-3 mt-0.5 shrink-0" />
                  Un avantage « Tous les avantages du pack X » hérite automatiquement des lignes du pack X dans le comparateur.
                </p>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className={LABEL}>Badge (optionnel)</label>
                  <input
                    className={INPUT}
                    value={editing.badge ?? ''}
                    onChange={(e) => setDraft('badge', e.target.value || null)}
                    placeholder="Ex. PRESTIGE MAXIMAL"
                  />
                  <label className="flex items-center gap-2 mt-2 text-[11px] font-bold text-slate-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editing.isPopular}
                      onChange={(e) => setDraft('isPopular', e.target.checked)}
                      className="accent-[#f97316] w-4 h-4"
                    />
                    Recommandé / le plus populaire
                  </label>
                </div>
                <div>
                  <label className={LABEL}>Nombre max. de sponsors (optionnel)</label>
                  <input
                    className={INPUT}
                    type="number"
                    min={0}
                    value={editing.maxSponsors ?? ''}
                    onChange={(e) => setDraft('maxSponsors', e.target.value === '' ? null : Number(e.target.value))}
                  />
                  <label className="flex items-center gap-2 mt-2 text-[11px] font-bold text-slate-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editing.active}
                      onChange={(e) => setDraft('active', e.target.checked)}
                      className="accent-[#f97316] w-4 h-4"
                    />
                    Visible sur la page publique
                  </label>
                </div>
              </div>
            </div>

            {/* ── Aperçu en direct (carte publique) ──────── */}
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">Aperçu du site public</p>
              <div className="rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <div className={'px-4 pt-4 pb-3 text-center ' + (editing.isPopular ? 'bg-[#052818]' : 'bg-slate-50')}>
                  {(editing.badge || editing.isPopular) && (
                    <span className="inline-block px-2.5 py-1 rounded-full bg-[#f97316] text-white text-[9px] font-black uppercase tracking-widest">
                      {editing.badge || 'LE PLUS POPULAIRE'}
                    </span>
                  )}
                  <div className="mx-auto mt-2 w-fit">
                    {editing.trophyKind === 'custom' && editing.customImageUrl ? (
                      <img src={editing.customImageUrl} alt="" className="w-24 h-24 object-contain" />
                    ) : editing.trophyKind === 'custom' ? (
                      <span className="block w-24 h-24 rounded-xl border-2 border-dashed border-slate-200 text-slate-300 text-[10px] font-bold flex items-center justify-center">
                        Image…
                      </span>
                    ) : (
                      React.createElement(TROPHY_COMPONENTS[editing.trophyKind], {
                        className: TROPHY_SIZE_CLASS[editing.isPopular ? 'xl' : 'md'],
                        label: '',
                      })
                    )}
                  </div>
                </div>
                <div className="p-4 border-t">
                  <p className="text-center text-[10px] font-bold tracking-[0.2em] text-slate-400 uppercase">Package</p>
                  <p className="text-center font-black uppercase text-slate-900">{editing.name || '…'}</p>
                  <p className="text-center text-[11px] text-slate-500 mt-1 min-h-[2em]">{editing.tagline || 'Slogan du package'}</p>
                  <p className={'text-center font-black text-lg mt-2 ' + (editing.isPopular ? 'text-[#ea580c]' : 'text-[#004724]')}>
                    {editing.isOnDemand ? 'Sur devis' : editing.priceAmount !== null ? fmtFcfa(editing.priceAmount) : 'Sur devis'}
                  </p>
                  <ul className="mt-3 space-y-1.5 text-left">
                    {editing.perks.filter(Boolean).slice(0, 6).map((perk, i) => (
                      <li key={i} className="text-[11px] text-slate-600 flex gap-1.5 items-start">
                        <span className="text-[#006039] font-black">✓</span> {perk}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="mt-3">
                <button onClick={() => setDraft('active', !editing.active)} className={BTN_GHOST + ' w-full justify-center'}>
                  {editing.active ? 'Visible sur le site' : 'Masqué du site'} — changer
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
