import React, { useState } from 'react';
import { Settings2, Plus, Trash2, ChevronUp, ChevronDown, Loader2, Power, Info } from 'lucide-react';
import { SectionHeader, INPUT, SELECT, LABEL, BTN_GREEN, BTN_GHOST } from './shared';
import {
  SPONSORING_ARGUMENTS,
  SPONSORING_FAQ,
  SPONSORING_CONTACT,
} from '../../../data/sponsoringData';
import type { SponsoringArgument, SponsoringFaq, SponsoringSettings } from '../../../lib/sponsoringApi';

/**
 * ─────────────────────────────────────────────────────────────
 * SOUS-SECTION 5 : PARAMÈTRES DE LA PAGE PUBLIQUE
 * Hero, arguments « Pourquoi nous soutenir », FAQ, coordonnées,
 * e-mail de notification, activation page/formulaire.
 * Une seule ligne de configuration (id = 1) est upsertée.
 * ─────────────────────────────────────────────────────────────
 */

/** Valeurs par défaut : réutilise le jeu de données statique du site. */
const DEFAULTS: SponsoringSettings = {
  heroBadge: 'Partenariats & Sponsoring — Saison 2026',
  heroTitle: 'Devenez partenaire de la FIMF',
  heroSubtitle:
    "Offrez à votre marque une visibilité nationale sur les terrains, les écrans et les réseaux sociaux — au cœur d'une discipline qui fait vibrer la jeunesse ivoirienne chaque week-end.",
  arguments: SPONSORING_ARGUMENTS,
  faq: SPONSORING_FAQ,
  contactEmail: SPONSORING_CONTACT.email,
  contactPhone: SPONSORING_CONTACT.phone,
  contactWhatsapp: SPONSORING_CONTACT.whatsapp,
  contactAddress: SPONSORING_CONTACT.address,
  contactHours: SPONSORING_CONTACT.hours,
  notifyEmail: '',
  pageEnabled: true,
  formEnabled: true,
};

interface SettingsProps {
  /** Réglages en base (null si la ligne n'existe pas encore). */
  settings: SponsoringSettings | null;
  onSave: (s: SponsoringSettings) => Promise<void>;
}

export const SponsoringSettingsPanel: React.FC<SettingsProps> = ({ settings, onSave }) => {
  // Le formulaire édite une copie locale (initiale : base ou défauts)
  const [draft, setDraft] = useState<SponsoringSettings>(settings ?? DEFAULTS);
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof SponsoringSettings>(key: K, value: SponsoringSettings[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  /* ── Liste éditable générique (arguments / FAQ) ─────────────── */
  const listItemControls = (i: number, len: number, move: (i: number, dir: -1 | 1) => void, remove: (i: number) => void) => (
    <div className="flex flex-col shrink-0">
      <button onClick={() => move(i, -1)} disabled={i === 0} className="text-slate-400 hover:text-slate-700 cursor-pointer disabled:opacity-30" aria-label="Monter">
        <ChevronUp className="w-3.5 h-3.5" />
      </button>
      <button onClick={() => move(i, 1)} disabled={i === len - 1} className="text-slate-400 hover:text-slate-700 cursor-pointer disabled:opacity-30" aria-label="Descendre">
        <ChevronDown className="w-3.5 h-3.5" />
      </button>
      <button onClick={() => remove(i)} className="mt-1 p-1 rounded-lg hover:bg-rose-50 text-rose-500 cursor-pointer" aria-label="Supprimer">
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );

  const save = async () => {
    setSaving(true);
    try {
      await onSave(draft);
    } finally {
      setSaving(false);
    }
  };

  const Toggle: React.FC<{ label: string; desc: string; value: boolean; onChange: (v: boolean) => void }> = ({
    label,
    desc,
    value,
    onChange,
  }) => (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={
        'flex items-center gap-3 rounded-2xl border p-4 text-left cursor-pointer transition-colors w-full h-full ' +
        (value ? 'bg-emerald-50/70 border-emerald-200' : 'bg-slate-50 border-slate-200')
      }
    >
      <span
        className={
          'w-10 h-6 rounded-full p-1 transition-colors shrink-0 ' +
          (value ? 'bg-emerald-500' : 'bg-slate-300')
        }
      >
        <span className={'block w-4 h-4 rounded-full bg-white transition-transform ' + (value ? 'translate-x-4' : '')} />
      </span>
      <span className="min-w-0">
        <span className="block text-[11px] font-black text-slate-800 uppercase">{label}</span>
        <span className="block text-[10.5px] text-slate-500">{desc}</span>
      </span>
      <Power className={'w-4 h-4 ml-auto shrink-0 ' + (value ? 'text-emerald-600' : 'text-slate-400')} />
    </button>
  );

  return (
    <div className="space-y-5">
      <SectionHeader
        title={
          <>
            <Settings2 className="w-5 h-5 text-[#ea580c]" />
            <span>Paramètres de la page publique</span>
          </>
        }
        subtitle="Tout ce contenu s'affiche sur /sponsoring — aucun code à modifier."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Toggle label="Page /sponsoring active" desc="Inactive : la page affiche un bandeau discret d'entretien via hero masqué." value={draft.pageEnabled} onChange={(v) => set('pageEnabled', v)} />
        <Toggle label="Formulaire ouvert" desc="Inactive : le formulaire est remplacé par la coordonnée directe (e-mail / WhatsApp)." value={draft.formEnabled} onChange={(v) => set('formEnabled', v)} />
      </div>

      {/* ── Section hero ───────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
        <h4 className="text-xs font-black uppercase text-slate-700">Bandeau d'accueil (hero)</h4>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className={LABEL}>Étiquette</label>
            <input className={INPUT} value={draft.heroBadge} onChange={(e) => set('heroBadge', e.target.value)} />
          </div>
          <div>
            <label className={LABEL}>Titre</label>
            <input className={INPUT} value={draft.heroTitle} onChange={(e) => set('heroTitle', e.target.value)} />
          </div>
        </div>
        <div>
          <label className={LABEL}>Sous-titre</label>
          <textarea className={INPUT + ' resize-none'} rows={3} value={draft.heroSubtitle} onChange={(e) => set('heroSubtitle', e.target.value)} />
        </div>
      </div>

      {/* ── Arguments « Pourquoi nous soutenir » ───────────────── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-black uppercase text-slate-700">
            Arguments « Pourquoi nous soutenir » ({draft.arguments.length})
          </h4>
          <button
            onClick={() => set('arguments', [...draft.arguments, { icon: 'eye', title: '', text: '' }])}
            className="text-[11px] font-black uppercase text-[#ea580c] hover:underline cursor-pointer inline-flex items-center gap-1"
          >
            <Plus className="w-3 h-3" /> Ajouter un argument
          </button>
        </div>
        <ul className="space-y-3">
          {draft.arguments.map((arg, i) => (
            <li key={i} className="grid grid-cols-[auto_8rem_1fr] sm:grid-cols-[auto_8rem_1fr_1.5fr] gap-2 items-start bg-slate-50 rounded-xl p-3 border border-slate-100">
              {listItemControls(i, draft.arguments.length, (idx, dir) => {
                const a = [...draft.arguments];
                const j = idx + dir;
                if (j < 0 || j >= a.length) return;
                [a[idx], a[j]] = [a[j], a[idx]];
                set('arguments', a);
              }, (idx) => set('arguments', draft.arguments.filter((_, k) => k !== idx)))}
              <div>
                <label className={LABEL}>Icône</label>
                <select className={SELECT + ' !py-2'} value={arg.icon} onChange={(e) => {
                  const a = [...draft.arguments];
                  a[i] = { ...a[i], icon: e.target.value };
                  set('arguments', a);
                }}>
                  <option value="eye">Œil (visibilité)</option>
                  <option value="trending">Croissance</option>
                  <option value="heart">Cœur (impact)</option>
                  <option value="users">Communauté</option>
                </select>
              </div>
              <div>
                <label className={LABEL}>Titre</label>
                <input className={INPUT + ' !py-2'} value={arg.title} onChange={(e) => {
                  const a = [...draft.arguments];
                  a[i] = { ...a[i], title: e.target.value };
                  set('arguments', a);
                }} placeholder="Ex. Une visibilité nationale" />
              </div>
              <div>
                <label className={LABEL}>Texte</label>
                <textarea className={INPUT + ' !py-2 resize-none'} rows={2} value={arg.text} onChange={(e) => {
                  const a = [...draft.arguments];
                  a[i] = { ...a[i], text: e.target.value };
                  set('arguments', a);
                }} />
              </div>
            </li>
          ))}
          {draft.arguments.length === 0 && (
            <li className="text-[11px] text-slate-400 italic">Aucun argument — la page utilisera les 4 arguments par défaut.</li>
          )}
        </ul>
      </div>

      {/* ── FAQ ────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-black uppercase text-slate-700">Questions fréquentes ({draft.faq.length})</h4>
          <button
            onClick={() => set('faq', [...draft.faq, { q: '', a: '' }])}
            className="text-[11px] font-black uppercase text-[#ea580c] hover:underline cursor-pointer inline-flex items-center gap-1"
          >
            <Plus className="w-3 h-3" /> Ajouter une question
          </button>
        </div>
        <ul className="space-y-3">
          {draft.faq.map((f, i) => (
            <li key={i} className="grid grid-cols-[auto_1fr] gap-2 bg-slate-50 rounded-xl p-3 border border-slate-100">
              {listItemControls(i, draft.faq.length, (idx, dir) => {
                const a = [...draft.faq];
                const j = idx + dir;
                if (j < 0 || j >= a.length) return;
                [a[idx], a[j]] = [a[j], a[idx]];
                set('faq', a);
              }, (idx) => set('faq', draft.faq.filter((_, k) => k !== idx)))}
              <div className="space-y-2">
                <input className={INPUT} value={f.q} onChange={(e) => {
                  const a = [...draft.faq];
                  a[i] = { ...a[i], q: e.target.value };
                  set('faq', a);
                }} placeholder={'Question ' + (i + 1)} />
                <textarea className={INPUT + ' resize-none'} rows={2} value={f.a} onChange={(e) => {
                  const a = [...draft.faq];
                  a[i] = { ...a[i], a: e.target.value };
                  set('faq', a);
                }} placeholder="Réponse détaillée" />
              </div>
            </li>
          ))}
          {draft.faq.length === 0 && (
            <li className="text-[11px] text-slate-400 italic">Aucune question — la page utilisera la FAQ par défaut.</li>
          )}
        </ul>
      </div>

      {/* ── Coordonnées & notifications ───────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
        <h4 className="text-xs font-black uppercase text-slate-700">Coordonnées affichées & notifications</h4>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className={LABEL}>E-mail de contact (public)</label>
            <input className={INPUT} type="email" value={draft.contactEmail} onChange={(e) => set('contactEmail', e.target.value)} />
          </div>
          <div>
            <label className={LABEL}>Téléphone (public)</label>
            <input className={INPUT} value={draft.contactPhone} onChange={(e) => set('contactPhone', e.target.value)} />
          </div>
          <div>
            <label className={LABEL}>WhatsApp (public)</label>
            <input className={INPUT} value={draft.contactWhatsapp} onChange={(e) => set('contactWhatsapp', e.target.value)} />
          </div>
          <div>
            <label className={LABEL}>Horaires / commission</label>
            <input className={INPUT} value={draft.contactHours} onChange={(e) => set('contactHours', e.target.value)} />
          </div>
          <div>
            <label className={LABEL}>Adresse (public)</label>
            <input className={INPUT} value={draft.contactAddress} onChange={(e) => set('contactAddress', e.target.value)} />
          </div>
          <div>
            <label className={LABEL}>E-mail de notification des demandes</label>
            <input className={INPUT} type="email" value={draft.notifyEmail} onChange={(e) => set('notifyEmail', e.target.value)} placeholder="partenaires@fimf.ci" />
            <p className="mt-1 text-[10.5px] text-slate-400 flex items-start gap-1.5">
              <Info className="w-3 h-3 mt-0.5 shrink-0" />
              Reçoit aussi les rappels de fin de contrat (fonction sponsor-reminders). En cas d'absence, la boîte PARTNER_INBOX fonctionnelle est utilisée.
            </p>
          </div>
        </div>
      </div>

      {/* Sauvegarde */}
      <div className="flex items-center justify-end gap-2">
        <button onClick={() => setDraft(settings ?? DEFAULTS)} className={BTN_GHOST}>
          Réinitialiser
        </button>
        <button onClick={save} disabled={saving} className={BTN_GREEN}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Settings2 className="w-4 h-4" />}
          Enregistrer les paramètres
        </button>
      </div>
    </div>
  );
};
