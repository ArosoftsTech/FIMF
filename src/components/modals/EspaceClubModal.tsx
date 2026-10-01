import React, { useState } from 'react';
import { X, ShieldCheck, FileText, CheckCircle2, Lock, ArrowRight, Download } from 'lucide-react';
import { CLUBS_DATA, Club } from '@/src/data/fimfData';
import { useFimfData } from '../../context/FimfDataContext';
import { ClubBadge } from '../ClubBadge';
import { ImageUploadField } from '../admin/ImageUploadField';
import { upsertClub } from '../../lib/fimfApi';

interface EspaceClubModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EspaceClubModal: React.FC<EspaceClubModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'login' | 'affiliation' | 'feuille'>('login');
  const [affiliationSuccess, setAffiliationSuccess] = useState(false);
  const [feuilleSuccess, setFeuilleSuccess] = useState(false);

  // Données live : le club et son logo viennent de Supabase
  const { clubs: liveClubs } = useFimfData();
  const clubs = liveClubs.length > 0 ? liveClubs : CLUBS_DATA;
  const [selectedClubId, setSelectedClubId] = useState<string>(clubs[0]?.id ?? CLUBS_DATA[0].id);
  const selectedClub: Club | undefined = clubs.find((c) => c.id === selectedClubId) ?? clubs[0];

  // Édition du logo côté club : aperçu en direct + enregistrement en base
  const [logoUrl, setLogoUrl] = useState<string | undefined>(undefined);
  const [savingLogo, setSavingLogo] = useState(false);
  const [logoFeedback, setLogoFeedback] = useState<{ type: 'ok' | 'err'; msg: string } | null>(null);

  const handleSaveLogo = async () => {
    if (!selectedClub) return;
    setSavingLogo(true);
    setLogoFeedback(null);
    try {
      await upsertClub({ ...selectedClub, logoUrl });
      setLogoFeedback({
        type: 'ok',
        msg: logoUrl
          ? 'Logo enregistré ! Il apparaît désormais sur tout le site public.'
          : 'Logo retiré : le blason SVG par défaut est rétabli sur le site.',
      });
    } catch {
      setLogoFeedback({
        type: 'err',
        msg: 'Enregistrement refusé : cette action requiert une session authentifiée (dirigeant ou administrateur).',
      });
    } finally {
      setSavingLogo(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-overlay-in">
      <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl overflow-hidden border border-slate-200 animate-modal-in max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-[#004724] px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#ea580c] text-white">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black uppercase tracking-wide">Espace Club FIMF</h2>
              <p className="text-xs text-emerald-200">Portail des clubs et dirigeants affiliés</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-emerald-100 hover:text-white hover:bg-emerald-800/80 transition-colors"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6">
          <button
            onClick={() => setActiveTab('login')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-colors ${
              activeTab === 'login'
                ? 'border-[#ea580c] text-[#ea580c]'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Accès Dirigeant
          </button>
          <button
            onClick={() => setActiveTab('affiliation')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-colors ${
              activeTab === 'affiliation'
                ? 'border-[#ea580c] text-[#ea580c]'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Affilier un nouveau Club
          </button>
          <button
            onClick={() => setActiveTab('feuille')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-colors ${
              activeTab === 'feuille'
                ? 'border-[#ea580c] text-[#ea580c]'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Feuille de match numérique
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto space-y-4">
          {activeTab === 'login' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-600">
                Connectez-vous à votre espace club pour gérer les bordereaux de licences, renouveler vos cotisations et déclarer vos effectifs pour la saison en cours.
              </p>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Club sélectionné
                </label>
                <select
                  value={selectedClubId}
                  onChange={(e) => {
                    setSelectedClubId(e.target.value);
                    setLogoUrl(undefined);
                    setLogoFeedback(null);
                  }}
                  className="w-full text-xs rounded-lg border border-slate-300 p-2.5 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#006039]"
                >
                  {clubs.map((club) => (
                    <option key={club.id} value={club.id}>
                      {club.name} ({club.city} - {club.commune})
                    </option>
                  ))}
                </select>
              </div>

              {/* Gestion du blason : aperçu en direct + upload + enregistrement */}
              {selectedClub && (
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                  <div className="flex items-center gap-3">
                    <ClubBadge id={selectedClub.id} size="xl" logoOverrideUrl={logoUrl} />
                    <div className="min-w-0">
                      <p className="text-xs font-black text-slate-900 uppercase">{selectedClub.name}</p>
                      <p className="text-[11px] text-slate-500">
                        Aperçu du blason affiché sur le site public.
                      </p>
                    </div>
                  </div>

                  <ImageUploadField
                    label="Logo du club (PNG transparent recommandé)"
                    value={logoUrl ?? ''}
                    onChange={(url) => {
                      setLogoUrl(url || undefined);
                      setLogoFeedback(null);
                    }}
                  />

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSaveLogo}
                      disabled={savingLogo || (logoUrl ?? '') === (selectedClub.logoUrl ?? '')}
                      className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg bg-[#006039] hover:bg-[#004724] text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {savingLogo ? 'Enregistrement...' : 'Enregistrer le logo'}
                    </button>
                    {(logoUrl ?? '') !== (selectedClub.logoUrl ?? '') && (
                      <button
                        type="button"
                        onClick={() => {
                          setLogoUrl(selectedClub.logoUrl);
                          setLogoFeedback(null);
                        }}
                        className="px-3 py-2 text-xs font-bold rounded-lg text-slate-600 hover:bg-slate-200 transition-colors"
                      >
                        Annuler
                      </button>
                    )}
                  </div>

                  {logoFeedback && (
                    <p
                      className={`text-[11px] flex items-start gap-1.5 ${
                        logoFeedback.type === 'ok' ? 'text-emerald-700' : 'text-red-600'
                      }`}
                    >
                      {logoFeedback.type === 'ok' ? (
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      ) : (
                        <Lock className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      )}
                      {logoFeedback.msg}
                    </p>
                  )}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Code d'accès sécurisé FIMF
                </label>
                <div className="relative">
                  <input
                    type="password"
                    placeholder="••••••••"
                    defaultValue="FIMF2025"
                    className="w-full text-xs rounded-lg border border-slate-300 p-2.5 pl-9 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#006039]"
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                </div>
              </div>

              <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200 text-xs text-emerald-900 flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Session club active pour la saison 2024 - 2025</p>
                  <p className="text-[11px] text-emerald-800 mt-0.5">
                    Certificat d'homologation valide. Prochain match le 28/09/2025.
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  onClick={() => alert('Téléchargement du bordereau officiel de licence FIMF (PDF) initié.')}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <Download className="w-4 h-4 text-slate-600" />
                  <span>Bordereau Licence (.PDF)</span>
                </button>
                <button
                  onClick={() => alert('Connexion réussie au tableau de bord club.')}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold rounded-lg bg-[#ea580c] hover:bg-[#c2410c] text-white shadow-xs transition-colors uppercase"
                >
                  <span>Accéder au tableau de bord</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {activeTab === 'affiliation' && (
            <div className="space-y-4">
              {affiliationSuccess ? (
                <div className="p-6 bg-emerald-50 rounded-xl border border-emerald-200 text-center space-y-3">
                  <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                  <h3 className="font-black text-slate-900 text-lg">Dossier d'affiliation transmis !</h3>
                  <p className="text-xs text-slate-600 max-w-md mx-auto">
                    Le secrétariat général de la FIMF a bien réceptionné votre demande préliminaire. Un inspecteur technique vous contactera pour la visite du terrain d'entraînement.
                  </p>
                  <button
                    onClick={() => setAffiliationSuccess(false)}
                    className="px-4 py-2 text-xs font-bold text-emerald-800 bg-emerald-100 rounded-lg hover:bg-emerald-200"
                  >
                    Nouvelle demande
                  </button>
                </div>
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    setAffiliationSuccess(true);
                  }}
                  className="space-y-3"
                >
                  <p className="text-xs text-slate-600">
                    Remplissez ce formulaire pour soumettre la candidature de votre association sportive au statut de club affilié FIMF.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Nom officiel du club</label>
                      <input required placeholder="Ex: Sporting Club Cocody" className="w-full text-xs rounded-lg border border-slate-300 p-2.5" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Ville / Commune</label>
                      <input required placeholder="Ex: Abidjan, Port-Bouët" className="w-full text-xs rounded-lg border border-slate-300 p-2.5" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Nom du Président</label>
                      <input required placeholder="Nom & Prénoms" className="w-full text-xs rounded-lg border border-slate-300 p-2.5" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Téléphone de contact</label>
                      <input required placeholder="+225 07..." className="w-full text-xs rounded-lg border border-slate-300 p-2.5" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Terrain utilisé pour les matchs</label>
                    <input required placeholder="Nom du complexe ou de l'aire de jeu synthétique" className="w-full text-xs rounded-lg border border-slate-300 p-2.5" />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2.5 text-xs font-bold bg-[#006039] hover:bg-[#004724] text-white rounded-lg transition-colors uppercase mt-2"
                  >
                    Envoyer le dossier d'affiliation
                  </button>
                </form>
              )}
            </div>
          )}

          {activeTab === 'feuille' && (
            <div className="space-y-4">
              {feuilleSuccess ? (
                <div className="p-6 bg-emerald-50 rounded-xl border border-emerald-200 text-center space-y-3">
                  <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                  <h3 className="font-black text-slate-900 text-lg">Feuille de match enregistrée !</h3>
                  <p className="text-xs text-slate-600 max-w-md mx-auto">
                    La composition d'équipe a été transmise aux délégués et arbitres de la rencontre.
                  </p>
                  <button
                    onClick={() => setFeuilleSuccess(false)}
                    className="px-4 py-2 text-xs font-bold text-emerald-800 bg-emerald-100 rounded-lg hover:bg-emerald-200"
                  >
                    Retour
                  </button>
                </div>
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    setFeuilleSuccess(true);
                  }}
                  className="space-y-3"
                >
                  <p className="text-xs text-slate-600">
                    Déclaration rapide de la feuille de match pour la commission d'arbitrage.
                  </p>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Sélectionner la rencontre</label>
                    <select className="w-full text-xs rounded-lg border border-slate-300 p-2.5 bg-white">
                      <option>Journée 3 - AS PLATEAU vs FC RIVIERA (28 Sept. 2025)</option>
                      <option>Journée 3 - SC MARCORY vs OLYMPIQUE YOP (28 Sept. 2025)</option>
                      <option>Journée 3 - FC COCODY vs US ABIDJAN (29 Sept. 2025)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Capitaine désigné</label>
                    <input required placeholder="Nom du capitaine et n° de licence" className="w-full text-xs rounded-lg border border-slate-300 p-2.5" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Observations médicales ou réserve</label>
                    <textarea placeholder="RAS..." rows={2} className="w-full text-xs rounded-lg border border-slate-300 p-2.5" />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2.5 text-xs font-bold bg-[#ea580c] hover:bg-[#c2410c] text-white rounded-lg transition-colors uppercase mt-2 flex items-center justify-center gap-2"
                  >
                    <FileText className="w-4 h-4" />
                    <span>Valider la feuille de match</span>
                  </button>
                </form>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
