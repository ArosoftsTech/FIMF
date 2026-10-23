import React, { useEffect } from 'react';
import { X, Inbox } from 'lucide-react';
import { SPONSOR_REQUEST_STATUSES, type SponsorRequestStatus } from '../../../lib/sponsoringApi';

/**
 * ─────────────────────────────────────────────────────────────
 * Briques visuelles partagées du module admin « Sponsoring ».
 * Charte : orange = actions principales, vert = confirmations
 * et statuts positifs (identité FIMF).
 * ─────────────────────────────────────────────────────────────
 */

/** En-tête de section : titre + sous-titre + actions à droite. */
export const SectionHeader: React.FC<{
  title: React.ReactNode;
  subtitle?: string;
  actions?: React.ReactNode;
}> = ({ title, subtitle, actions }) => (
  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
    <div className="min-w-0">
      <h3 className="text-base font-black text-slate-900 uppercase flex items-center gap-2">{title}</h3>
      {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
    </div>
    {actions && <div className="flex items-center gap-2 shrink-0 flex-wrap">{actions}</div>}
  </div>
);

/** Carte indicateur du tableau de bord. */
export const KpiCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  hint?: string;
  accent?: 'orange' | 'green' | 'slate';
}> = ({ icon, label, value, hint, accent = 'orange' }) => {
  const accents = {
    orange: 'bg-orange-50 text-[#ea580c]',
    green: 'bg-emerald-50 text-emerald-700',
    slate: 'bg-slate-100 text-slate-600',
  } as const;
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-start gap-4">
      <span className={'w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ' + accents[accent]}>
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">{label}</p>
        <p className="text-2xl font-black text-slate-900 leading-tight truncate">{value}</p>
        {hint && <p className="text-[11px] text-slate-500 mt-0.5">{hint}</p>}
      </div>
    </div>
  );
};

/** Badge de statut d'une demande (rouge/orange → vert selon l'avancement). */
export const StatusBadge: React.FC<{ status: SponsorRequestStatus }> = ({ status }) => {
  const conf = SPONSOR_REQUEST_STATUSES.find((s) => s.value === status);
  return (
    <span
      className={
        'inline-block px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ' +
        (conf?.color ?? 'bg-slate-50 text-slate-600 border-slate-200')
      }
    >
      {conf?.label ?? status}
    </span>
  );
};

/** État vide générique (icône + titre + texte). */
export const EmptyState: React.FC<{ title: string; text?: string; icon?: React.ReactNode }> = ({
  title,
  text,
  icon,
}) => (
  <div className="bg-white p-10 rounded-2xl border border-slate-100 shadow-sm text-center">
    <span className="w-14 h-14 rounded-full bg-slate-50 text-slate-300 flex items-center justify-center mx-auto mb-3">
      {icon ?? <Inbox className="w-7 h-7" />}
    </span>
    <p className="text-sm font-black text-slate-600 uppercase">{title}</p>
    {text && <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">{text}</p>}
  </div>
);

/** Classes communes des champs de formulaire du module. */
export const INPUT =
  'w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#ea580c]/50';
export const SELECT =
  INPUT + ' cursor-pointer pr-8';
export const LABEL = 'block text-xs font-bold text-slate-700 mb-1';

/** Boutons : orange (principal), vert (confirmation), neutre, rouge (destructif). */
export const BTN_ORANGE =
  'inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#f97316] hover:bg-[#ea580c] text-white text-xs font-black uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed';
export const BTN_GREEN =
  'inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#004724] hover:bg-[#006039] text-white text-xs font-black uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed';
export const BTN_GHOST =
  'inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-black uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-50';
export const BTN_DANGER =
  'inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-black uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-50';

/** Modale simple : overlay + panneau scrollable, fermeture via Échap. */
export const Modal: React.FC<{
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  wide?: boolean;
}> = ({ open, onClose, title, subtitle, children, footer, wide = false }) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-6" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs" onClick={onClose} aria-hidden="true" />
      <div
        className={
          'relative bg-white w-full sm:rounded-3xl rounded-t-3xl shadow-2xl flex flex-col max-h-[92vh] ' +
          (wide ? 'sm:max-w-4xl' : 'sm:max-w-lg')
        }
      >
        {/* En-tête */}
        <div className="flex items-start justify-between gap-3 p-5 border-b border-slate-100 shrink-0">
          <div className="min-w-0">
            <h4 className="text-sm font-black text-slate-900 uppercase flex items-center gap-2 pr-2">{title}</h4>
            {subtitle && <p className="text-[11px] text-slate-500 mt-0.5">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer shrink-0"
            aria-label="Fermer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        {/* Contenu scrollable */}
        <div className="p-5 overflow-y-auto flex-1">{children}</div>
        {/* Pied d'action facultatif */}
        {footer && <div className="p-4 border-t border-slate-100 bg-slate-50 rounded-b-3xl shrink-0">{footer}</div>}
      </div>
    </div>
  );
};

/** Formatage compact des montants FCFA (12 000 000 → « 1200 M »). */
export function fmtFcfa(n: number): string {
  if (n >= 1_000_000) {
    const m = n / 1_000_000;
    return (m % 1 === 0 ? String(m) : m.toFixed(1).replace('.', ',')) + ' M FCFA';
  }
  if (n >= 1_000) return Math.round(n / 1000) + ' K FCFA';
  return n.toLocaleString('fr-FR') + ' FCFA';
}
