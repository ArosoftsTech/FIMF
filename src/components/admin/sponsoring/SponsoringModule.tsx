import React, { useState } from 'react';
import {
  LayoutDashboard,
  Trophy,
  Inbox,
  Building2,
  Settings2,
  Lock,
  TriangleAlert,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { useSponsorAdmin } from '../../../hooks/useSponsorAdmin';
import { SponsoringDashboard } from './SponsoringDashboard';
import { SponsoringPackages } from './SponsoringPackages';
import { SponsoringRequests } from './SponsoringRequests';
import { SponsoringSponsors } from './SponsoringSponsors';
import { SponsoringSettingsPanel } from './SponsoringSettings';

/**
 * ─────────────────────────────────────────────────────────────
 * MODULE ADMIN « SPONSORING » — 5 sous-sections :
 *   1. Tableau de bord (synthèse, graphiques, alertes)
 *   2. Packages (trophées, prix, avantages, ordre d'affichage)
 *   3. Demandes de partenariat (pipeline, kanban, historique)
 *   4. Sponsors et partenaires (contrats, paiements, documents)
 *   5. Paramètres de la page publique
 *
 * Accès : `isAdmin` (admin fédéral = complet) ; un dirigeant ne
 * voit que le tableau de bord et les packages publiquement
 * actifs (les écritures sont de toute façon refusées par RLS :
 * is_fimf_admin() côté serveur).
 * Auto-contenu : charge ses propres données (modèle AdminGamesTab),
 * communique via `showFeedback` (toasts du menu latéral).
 * ─────────────────────────────────────────────────────────────
 */

type SponsoringSubTab = 'tableau' | 'packages' | 'demandes' | 'sponsors' | 'parametres';

const SUB_TABS: { id: SponsoringSubTab; label: string; icon: React.ElementType; adminOnly: boolean }[] = [
  { id: 'tableau', label: 'Tableau de bord', icon: LayoutDashboard, adminOnly: false },
  { id: 'packages', label: 'Packages', icon: Trophy, adminOnly: false },
  { id: 'demandes', label: 'Demandes', icon: Inbox, adminOnly: true },
  { id: 'sponsors', label: 'Sponsors', icon: Building2, adminOnly: true },
  { id: 'parametres', label: 'Paramètres page', icon: Settings2, adminOnly: true },
];

export interface SponsoringModuleProps {
  /** Rôle Serveur dupliqué côté client : full admin OU consultation. */
  isAdmin: boolean;
  /** Affiche un message (toast) dans la barre du dashboard. */
  showFeedback: (msg: string) => void;
}

export const SponsoringModule: React.FC<SponsoringModuleProps> = ({ isAdmin, showFeedback }) => {
  const [subTab, setSubTab] = useState<SponsoringSubTab>('tableau');
  const admin = useSponsorAdmin();

  /** Enveloppe une action avec retour visuel succès/échec (FR). */
  const guarded = async (label: string, fn: () => Promise<unknown>, okMsg?: string) => {
    try {
      await fn();
      if (okMsg) showFeedback(okMsg);
    } catch (err) {
      showFeedback((label.startsWith('Suppression') ? 'Suppression refusée : ' : 'Action refusée : ') +
        (err instanceof Error ? err.message : String(err)));
    }
  };

  if (admin.loading) {
    return (
      <div className="flex items-center justify-center gap-3 py-20 text-slate-500">
        <Loader2 className="w-5 h-5 animate-spin text-[#ea580c]" />
        <span className="text-xs font-black uppercase tracking-wider">Chargement du module sponsoring…</span>
      </div>
    );
  }

  if (admin.error) {
    return (
      <div className="bg-white rounded-2xl border border-amber-200 shadow-sm p-8 text-center space-y-3">
        <TriangleAlert className="w-10 h-10 text-amber-500 mx-auto" />
        <h3 className="text-sm font-black text-slate-900 uppercase">Schéma du module introuvable</h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto">{admin.error}</p>
        <button
          onClick={() => admin.reload().catch(() => undefined)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#f97316] hover:bg-[#ea580c] text-white text-xs font-black uppercase cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" /> Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* ── Barre de sous-navigation ─────────────────────────── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {SUB_TABS.map((t) => {
          const disabled = t.adminOnly && !isAdmin;
          return (
            <button
              key={t.id}
              onClick={() => !disabled && setSubTab(t.id)}
              disabled={disabled}
              title={disabled ? 'Réservé aux administrateurs fédéraux' : undefined}
              className={
                'inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-colors shrink-0 ' +
                (subTab === t.id
                  ? 'bg-[#f97316] text-white shadow-md shadow-orange-500/25'
                  : disabled
                    ? 'bg-slate-100 text-slate-300 cursor-not-allowed'
                    : 'bg-white border border-slate-200 text-slate-600 hover:text-[#ea580c] hover:border-orange-200 cursor-pointer')
              }
            >
              {disabled ? <Lock className="w-3.5 h-3.5" /> : <t.icon className="w-3.5 h-3.5" />}
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Bandeau lecture seule pour un dirigeant */}
      {!isAdmin && (
        <div className="bg-sky-50 border border-sky-100 rounded-2xl px-4 py-3 text-[11px] text-sky-800 flex items-start gap-2">
          <Lock className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          Consultation seule : l'édition et le suivi contractuel sont réservés aux administrateurs fédéraux.
        </div>
      )}

      {/* ── Contenu de la sous-section ───────────────────────── */}
      {subTab === 'tableau' && (
        <SponsoringDashboard
          packages={admin.packages}
          requests={admin.requests}
          clients={admin.clients}
          packageNames={admin.packageNames}
          onGoRequests={isAdmin ? () => setSubTab('demandes') : undefined}
          onGoSponsors={isAdmin ? () => setSubTab('sponsors') : undefined}
        />
      )}

      {subTab === 'packages' && (
        <SponsoringPackages
          packages={admin.packages}
          clients={admin.clients}
          onSave={(p) => guarded('Enregistrement du package', () => admin.savePackage(p), 'Package enregistré')}
          onDelete={(id) => guarded('Suppression du package', () => admin.removePackage(id), 'Package supprimé')}
          onReorder={(ids) => guarded('Réordonnancement', () => admin.commitReorder(ids), 'Ordre mis à jour')}
        />
      )}

      {subTab === 'demandes' && isAdmin && (
        <SponsoringRequests
          requests={admin.requests}
          packages={admin.packages}
          packageNames={admin.packageNames}
          isAdmin={isAdmin}
          onChangeStatus={(id, status) => guarded('Changement de statut', () => admin.changeRequestStatus(id, status), 'Statut mis à jour')}
          onAssign={(id, userId) => guarded('Assignation', () => admin.assignRequest(id, userId), 'Assignation enregistrée')}
          onNote={(id, note) => guarded('Note', () => admin.noteRequest(id, note), 'Note ajoutée')}
          onDelete={(id) => guarded('Suppression de la demande', () => admin.removeRequest(id), 'Demande supprimée')}
          onPromote={(request, options) => admin.promoteRequest(request, options)}
        />
      )}

      {subTab === 'sponsors' && isAdmin && (
        <SponsoringSponsors
          clients={admin.clients}
          packages={admin.packages}
          onSave={(c, syncMirror) => guarded('Enregistrement du sponsor', () => admin.saveClient(c, syncMirror), 'Sponsor enregistré')}
          onDelete={(id) => guarded('Suppression du sponsor', () => admin.removeClient(id), 'Sponsor supprimé')}
        />
      )}

      {subTab === 'parametres' && isAdmin && (
        <SponsoringSettingsPanel
          settings={admin.settings}
          onSave={(s) => guarded('Enregistrement des paramètres', () => admin.saveSettings(s), 'Paramètres enregistrés')}
        />
      )}
    </div>
  );
};
