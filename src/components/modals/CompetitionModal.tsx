import React from 'react';
import { Competition } from '@/src/data/fimfData';
import { X, Trophy, Users, Calendar, ShieldCheck, Check } from 'lucide-react';

interface CompetitionModalProps {
  competition: Competition | null;
  onClose: () => void;
  onNavigateChampionnat?: () => void;
}

export const CompetitionModal: React.FC<CompetitionModalProps> = ({
  competition,
  onClose,
  onNavigateChampionnat,
}) => {
  if (!competition) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-overlay-in">
      <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl overflow-hidden border border-slate-200 animate-modal-in max-h-[90vh] flex flex-col">
        {/* Header Image */}
        <div className="relative h-48 sm:h-56 bg-slate-900 overflow-hidden shrink-0">
          <img
            src={competition.image}
            alt={competition.title}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />

          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-black/60 hover:bg-black text-white transition-colors"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="absolute bottom-4 left-6 right-6 text-white">
            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-[#ea580c] uppercase mb-1">
              {competition.category}
            </span>
            <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight">
              {competition.title}
            </h2>
            <p className="text-xs sm:text-sm text-emerald-200">{competition.subtitle}</p>
          </div>
        </div>

        {/* Content body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs sm:text-sm">
          {/* Key Facts */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-[10px] font-bold uppercase text-slate-500 block">Période</span>
              <span className="font-bold text-slate-900">{competition.period}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-[10px] font-bold uppercase text-slate-500 block">Participants</span>
              <span className="font-bold text-slate-900">{competition.participantsCount} formations</span>
            </div>
            <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 col-span-2 sm:col-span-1">
              <span className="text-[10px] font-bold uppercase text-emerald-700 block">Tenant du titre</span>
              <span className="font-bold text-[#006039]">{competition.currentHolder}</span>
            </div>
          </div>

          <div>
            <h4 className="font-bold text-slate-900 uppercase text-xs mb-2">Description & Enjeux</h4>
            <p className="text-slate-700 leading-relaxed text-xs sm:text-sm">
              {competition.description}
            </p>
          </div>

          {/* Highlights */}
          {competition.rulesHighlight && (
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
              <h4 className="font-bold text-slate-900 uppercase text-xs flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#ea580c]" /> Spécificités & Règles Officielles
              </h4>
              <ul className="space-y-1.5 text-xs text-slate-700">
                {competition.rulesHighlight.map((rule, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{rule}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 flex justify-between items-center shrink-0">
          {competition.id === 'champ-national' && onNavigateChampionnat ? (
            <button
              onClick={() => {
                onClose();
                onNavigateChampionnat();
              }}
              className="px-4 py-2 text-xs font-bold text-white bg-[#006039] hover:bg-[#004724] rounded-lg transition-colors uppercase"
            >
              Consulter le calendrier des matchs
            </button>
          ) : <div />}
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
