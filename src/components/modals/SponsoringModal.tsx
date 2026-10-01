import React, { useState } from 'react';
import { X, Handshake, Mail, Phone, Building2, Send, CheckCircle2, Loader2, TrendingUp, Eye, Trophy } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

interface SponsoringModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type FormState = {
  company: string;
  contactName: string;
  email: string;
  phone: string;
  pack: string;
  message: string;
};

const PACKS = [
  { id: ' platinum', label: 'Platinum', desc: 'Sponsor principal — maillots, stades, campagnes digitales', amount: 'Sur devis' },
  { id: 'gold', label: 'Gold', desc: 'Visibilité sur les panneaux des terrains et les communiqués', amount: 'Sur devis' },
  { id: 'silver', label: 'Silver', desc: 'Logo sur le site officiel et les supports fédéraux', amount: 'Sur devis' },
  { id: 'custom', label: 'Autre / à définir', desc: 'Projet sur mesure avec la commission partenariats', amount: 'À discuter' },
];

const initialForm: FormState = {
  company: '',
  contactName: '',
  email: '',
  phone: '',
  pack: 'platinum',
  message: '',
};

/** Demandes de sponsoring / partenariat (table sponsor_requests). */
export const SponsoringModal: React.FC<SponsoringModalProps> = ({ isOpen, onClose }) => {
  const [form, setForm] = useState<FormState>(initialForm);
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!form.company.trim() || !form.contactName.trim() || !form.email.trim()) {
      setError('Entreprise, nom du contact et email sont obligatoires.');
      return;
    }
    setSending(true);
    try {
      const { error: dbError } = await supabase.from('sponsor_requests').insert({
        company: form.company.trim(),
        contact_name: form.contactName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || null,
        pack: form.pack,
        message: form.message.trim() || null,
      });
      if (dbError) throw dbError;
      setSuccess(true);
      setForm(initialForm);
    } catch (err) {
      setError(
        err instanceof Error
          ? `Envoi impossible : ${err.message}`
          : 'Envoi impossible pour le moment. Contactez-nous à partenaires@fimf.ci.'
      );
    } finally {
      setSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-overlay-in overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl overflow-hidden border border-slate-200 animate-modal-in max-h-[90vh] flex flex-col my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#004724] px-6 py-5 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#ea580c] text-white">
              <Handshake className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black uppercase tracking-tight">Sponsoring & Partenariat</h2>
              <p className="text-xs text-emerald-200">Devenez partenaire officiel de la FIMF</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {success ? (
            <div className="text-center py-10 space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-black text-slate-900">Demande envoyée !</h3>
              <p className="text-sm text-slate-600 max-w-md mx-auto">
                Merci pour votre intérêt. La commission partenariats de la FIMF vous recontactera
                sous 72 heures ouvrées à l'adresse indiquée.
              </p>
              <button
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl bg-[#004724] hover:bg-[#006039] text-white text-xs font-black uppercase cursor-pointer"
              >
                Fermer
              </button>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Arguments */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { icon: Trophy, title: 'Compétitions nationales', desc: 'Championnat D1, Coupes et Sélections' },
                  { icon: Eye, title: 'Visibilité', desc: 'Site officiel, stades, médias' },
                  { icon: TrendingUp, title: 'Croissance', desc: 'Une discipline en plein essor' },
                ].map((a) => (
                  <div key={a.title} className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-center">
                    <a.icon className="w-5 h-5 text-[#ea580c] mx-auto mb-1.5" />
                    <div className="text-[11px] font-black text-slate-900 uppercase">{a.title}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">{a.desc}</div>
                  </div>
                ))}
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Entreprise *</label>
                    <div className="relative">
                      <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={form.company}
                        onChange={set('company')}
                        placeholder="Nom de votre société"
                        className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#ea580c]/50"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Nom du contact *</label>
                    <input
                      type="text"
                      value={form.contactName}
                      onChange={set('contactName')}
                      placeholder="Prénom et nom"
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#ea580c]/50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      <span className="inline-flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> Email *</span>
                    </label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={set('email')}
                      placeholder="contact@societe.ci"
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#ea580c]/50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      <span className="inline-flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> Téléphone</span>
                    </label>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={set('phone')}
                      placeholder="+225 07 00 00 00 00"
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#ea580c]/50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Formule envisagée</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {PACKS.map((p) => (
                      <label
                        key={p.id}
                        className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-colors ${
                          form.pack === p.id
                            ? 'border-[#ea580c] bg-orange-50'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name="pack"
                          value={p.id}
                          checked={form.pack === p.id}
                          onChange={set('pack')}
                          className="mt-0.5 accent-[#ea580c] cursor-pointer"
                        />
                        <span>
                          <span className="block text-xs font-black text-slate-900">{p.label}</span>
                          <span className="block text-[10px] text-slate-500 leading-snug">{p.desc}</span>
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Message (facultatif)</label>
                  <textarea
                    rows={3}
                    value={form.message}
                    onChange={set('message')}
                    placeholder="Précisez votre projet, vos attentes ou toute question…"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#ea580c]/50 resize-none"
                  />
                </div>

                {error && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={sending}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-[#ea580c] to-[#f97316] hover:from-[#c2410c] hover:to-[#ea580c] disabled:opacity-60 text-white font-black text-xs uppercase tracking-wider transition-all shadow-md shadow-orange-500/20 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  {sending ? 'Envoi en cours…' : 'Envoyer ma demande de partenariat'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
