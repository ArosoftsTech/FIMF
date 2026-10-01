import React, { useState } from 'react';
import heroImg from '@/src/assets/images/hero_ivory_coast_minifootball_1790335944178.jpg';
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  ArrowRight,
  CheckCircle2,
  Facebook,
  Instagram,
  Youtube,
  Linkedin,
} from 'lucide-react';

export const ContactView: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });

  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="space-y-8 pb-12">
      {/* 1. HERO BANNER */}
      <section className="relative overflow-hidden bg-[#004724] text-white">
        <div className="absolute inset-0 opacity-30">
          <img
            src={heroImg}
            alt="Contact FIMF"
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight">
            CONTACT
          </h1>
          <p className="text-emerald-100 text-sm sm:text-base md:text-lg max-w-2xl mt-2 font-medium">
            Une question ? Écrivez-nous.
          </p>
        </div>
      </section>

      {/* 2. TWO-COLUMN LAYOUT (matching screenshot 9) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Coordinates & Social (5 cols) */}
          <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 shadow-2xs p-6 sm:p-8 space-y-6">
            <div className="space-y-5 text-xs sm:text-sm">
              {/* Siège */}
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-emerald-50 text-[#006039] flex items-center justify-center shrink-0 mt-0.5">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 uppercase">Siège Social de la FIMF</h3>
                  <p className="text-slate-600 mt-0.5">Cocody Deux Plateaux Vallons</p>
                  <p className="text-slate-500 text-[11px]">Abidjan, Côte d'Ivoire</p>
                </div>
              </div>

              {/* Téléphone */}
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-emerald-50 text-[#006039] flex items-center justify-center shrink-0 mt-0.5">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 uppercase">Téléphones</h3>
                  <a href="tel:+2252722413594" className="text-slate-700 font-semibold mt-0.5 block hover:text-[#006039]">(+225) 27 22 41 35 94</a>
                  <a href="tel:+2250708563536" className="text-slate-700 font-semibold block hover:text-[#006039]">(+225) 07 08 56 35 36</a>
                  <a href="tel:+2250555155490" className="text-slate-700 font-semibold block hover:text-[#006039]">(+225) 05 551 554 90</a>
                </div>
              </div>

              {/* Email */}
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-emerald-50 text-[#006039] flex items-center justify-center shrink-0 mt-0.5">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 uppercase">Emails & Site Web</h3>
                  <a
                    href="mailto:fimf.infos@gmail.com"
                    className="text-[#006039] font-semibold hover:underline block mt-0.5"
                  >
                    fimf.infos@gmail.com
                  </a>
                  <a
                    href="mailto:info@federationminifootci.com"
                    className="text-[#006039] font-semibold hover:underline block"
                  >
                    info@federationminifootci.com
                  </a>
                  <a
                    href="https://federationminifootci.com"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#ea580c] font-semibold hover:underline block"
                  >
                    federationminifootci.com ↗
                  </a>
                </div>
              </div>

              {/* Horaires */}
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-emerald-50 text-[#006039] flex items-center justify-center shrink-0 mt-0.5">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 uppercase">Horaires</h3>
                  <p className="text-slate-600 mt-0.5">Lundi - Vendredi : 8h00 - 17h00</p>
                  <p className="text-slate-500 text-[11px]">Permanence technique lors des journées de championnat le week-end</p>
                </div>
              </div>
            </div>

            {/* Suivez-nous */}
            <div className="pt-6 border-t border-slate-200">
              <h4 className="text-xs font-bold text-slate-800 uppercase mb-3">
                Suivez-nous
              </h4>
              <div className="flex items-center gap-3">
                <a
                  href="https://facebook.com"
                  target="_blank"
                  rel="noreferrer"
                  className="w-9 h-9 rounded-full bg-slate-100 hover:bg-[#006039] hover:text-white flex items-center justify-center text-slate-700 transition-colors"
                  aria-label="Facebook"
                >
                  <Facebook className="w-4 h-4" />
                </a>
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noreferrer"
                  className="w-9 h-9 rounded-full bg-slate-100 hover:bg-[#006039] hover:text-white flex items-center justify-center text-slate-700 transition-colors"
                  aria-label="Instagram"
                >
                  <Instagram className="w-4 h-4" />
                </a>
                <a
                  href="https://youtube.com"
                  target="_blank"
                  rel="noreferrer"
                  className="w-9 h-9 rounded-full bg-slate-100 hover:bg-[#006039] hover:text-white flex items-center justify-center text-slate-700 transition-colors"
                  aria-label="YouTube"
                >
                  <Youtube className="w-4 h-4" />
                </a>
                <a
                  href="https://x.com"
                  target="_blank"
                  rel="noreferrer"
                  className="w-9 h-9 rounded-full bg-slate-100 hover:bg-[#006039] hover:text-white flex items-center justify-center text-slate-700 transition-colors"
                  aria-label="Twitter X"
                >
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </a>
                <a
                  href="https://linkedin.com"
                  target="_blank"
                  rel="noreferrer"
                  className="w-9 h-9 rounded-full bg-slate-100 hover:bg-[#006039] hover:text-white flex items-center justify-center text-slate-700 transition-colors"
                  aria-label="LinkedIn"
                >
                  <Linkedin className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>

          {/* Right Column: Contact Form (7 cols) */}
          <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 shadow-2xs p-6 sm:p-8">
            {submitted ? (
              <div className="py-12 text-center space-y-4 animate-fade-in">
                <CheckCircle2 className="w-16 h-16 text-emerald-600 mx-auto" />
                <h3 className="text-xl font-black text-slate-900">
                  Message envoyé avec succès !
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto">
                  Merci de nous avoir contactés. Le secrétariat de la Fédération Ivoirienne de Mini-Football reviendra vers vous sous 24 à 48 heures.
                </p>
                <button
                  onClick={() => {
                    setSubmitted(false);
                    setFormData({ name: '', email: '', subject: '', message: '' });
                  }}
                  className="px-5 py-2.5 bg-[#006039] text-white text-xs font-bold rounded-lg hover:bg-[#004724] uppercase transition-colors"
                >
                  Envoyer un autre message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Nom complet */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Nom complet
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Votre nom et prénom"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full text-xs rounded-lg border border-slate-300 p-3 bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#006039]"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="votre.email@exemple.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full text-xs rounded-lg border border-slate-300 p-3 bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#006039]"
                  />
                </div>

                {/* Objet */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Objet
                  </label>
                  <select
                    required
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full text-xs rounded-lg border border-slate-300 p-3 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#006039]"
                  >
                    <option value="">Sélectionnez un sujet</option>
                    <option value="Demande d'information">Demande d'information générale</option>
                    <option value="Affiliation club">Affiliation d'un club</option>
                    <option value="Presse & Médias">Presse & Accréditations médias</option>
                    <option value="Arbitrage & Formation">Arbitrage & Formation technique</option>
                    <option value="Partenariat & Sponsoring">Partenariat & Sponsoring</option>
                    <option value="Autre demande">Autre sujet</option>
                  </select>
                </div>

                {/* Message */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Message
                  </label>
                  <textarea
                    required
                    rows={5}
                    placeholder="Votre message..."
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full text-xs rounded-lg border border-slate-300 p-3 bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#006039]"
                  />
                </div>

                {/* Submit button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full inline-flex items-center justify-center gap-2 py-3 px-6 bg-[#ea580c] hover:bg-[#c2410c] text-white text-xs font-bold uppercase tracking-wider rounded-lg shadow-sm hover:shadow transition-all cursor-pointer"
                  >
                    <span>ENVOYER</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};
