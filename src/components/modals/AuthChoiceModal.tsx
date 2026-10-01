import React, { useEffect, useState } from 'react';
import {
  X,
  LogIn,
  UserRound,
  BadgeCheck,
  UserPlus,
  Mail,
  Lock,
  Loader2,
  CheckCircle2,
  Send,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabaseClient';

interface AuthChoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Ouvre l'écran de connexion admin/dirigeant (page dédiée) */
  onAdminLogin: () => void;
  /** Ouvre l'espace membre de l'utilisateur connecté */
  onMemberArea: () => void;
}

interface FormError {
  field: 'email' | 'password' | null;
  message: string;
}

const BENEFITS = [
  'Réductions exclusives sur les matchs',
  'Accès réservé aux événements FIMF',
  'Contenus et coulisses en avant-première',
  'Soutenir le mini-foot ivoirien',
];

/** Compteurs indicatifs affichés côté « Se connecter ». */
const STATS = [
  { value: '12 000+', label: 'Supporters' },
  { value: '12', label: 'Clubs' },
  { value: '5', label: 'Compétitions' },
];

/**
 * Popup « Connexion / Devenir membre » du bouton CONNEXION de la navbar.
 * - « Se connecter » : login membre (email + mot de passe) + accès fédéral.
 * - « Devenir membre » : demande d'adhésion → table member_requests.
 */
export const AuthChoiceModal: React.FC<AuthChoiceModalProps> = ({
  isOpen,
  onClose,
  onAdminLogin,
  onMemberArea,
}) => {
  const { user, signIn } = useAuth();
  const [signingOut, setSigningOut] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginBusy, setLoginBusy] = useState(false);

  const handleSignOut = async () => {
    setSigningOut(true);
    await supabase.auth.signOut();
    setSigningOut(false);
    handleClose();
  };
  const [tab, setTab] = useState<'connexion' | 'membre'>('connexion');
  const [form, setForm] = useState({ fullName: '', email: '', password: '' });
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<FormError | null>(null);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const errField = (field: 'email' | 'password') => error?.field === field;

  const reset = () => {
    setTab('connexion');
    setForm({ fullName: '', email: '', password: '' });
    setLoginError(null);
    setSuccess(false);
    setError(null);
  };

  const handleMemberLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loginBusy) return;
    setLoginError(null);
    setLoginBusy(true);
    const { error: signInError } = await signIn(loginForm.email.trim(), loginForm.password);
    setLoginBusy(false);
    if (signInError) {
      setLoginError(
        signInError.includes('Invalid login credentials')
          ? 'Email ou mot de passe incorrect.'
          : signInError.includes('Email not confirmed')
            ? 'Votre email n\u2019est pas encore confirmé.'
            : signInError,
      );
    }
  };

  const handleClose = () => {
    onClose();
    // Laisse l'animation se jouer avant de réinitialiser
    setTimeout(reset, 200);
  };

  // Fermeture au clavier (Échap)
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleMemberSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!form.fullName.trim() || !form.email.trim() || !form.password) {
      setError({ field: null, message: 'Nom, email et mot de passe sont obligatoires.' });
      return;
    }
    if (form.password.length < 6) {
      setError({ field: 'password', message: 'Mot de passe : 6 caractères minimum.' });
      return;
    }
    setSending(true);
    try {
      const { error: insertError } = await supabase.from('member_requests').insert({
        full_name: form.fullName.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
      });
      if (insertError) {
        if ((insertError as { code?: string }).code === '23505') {
          setError({
            field: 'email',
            message: 'Une demande existe déjà avec cet email — ou connectez-vous directement.',
          });
        } else {
          throw insertError;
        }
      } else {
        setSuccess(true);
        setForm({ fullName: '', email: '', password: '' });
      }
    } catch {
      setError({
        field: null,
        message: 'Envoi impossible pour le moment. Réessayez ou écrivez à fimf.infos@gmail.com.',
      });
    } finally {
      setSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-overlay-in overflow-y-auto"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 animate-modal-in max-h-[90vh] flex flex-col my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#004724] px-6 py-5 text-white flex items-center justify-between shrink-0 rounded-t-3xl">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#ea580c] text-white">
              <LogIn className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black uppercase tracking-tight">Connexion</h2>
              <p className="text-[11px] text-emerald-200">Espace membres de la FIMF</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Onglets */}
        <div className="flex p-3 pb-0 shrink-0">
          {(
            [
              { id: 'connexion', label: 'Se connecter', icon: UserRound },
              { id: 'membre', label: 'Devenir membre', icon: UserPlus },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              onClick={() => {
                setTab(t.id);
                setError(null);
              }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-black uppercase tracking-wide rounded-xl transition-colors cursor-pointer ${
                tab === t.id
                  ? 'bg-[#004724] text-white'
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
              }`}
            >
              <t.icon className="w-4 h-4" />
              {t.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {tab === 'connexion' ? (
            <div className="space-y-3">
              {/* Déjà connecté : accès direct à l'espace membre */}
              {user && (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <div className="text-xs text-emerald-900 min-w-0">
                      <b>{user.email}</b> — vous êtes connecté·e.
                    </div>
                  </div>
                  <button
                    onClick={onMemberArea}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#004724] hover:bg-[#006039] text-white text-xs font-black uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    <UserRound className="w-4 h-4" />
                    Accéder à mon espace membre
                  </button>
                  <form onSubmit={handleMemberLogin} className="space-y-2 pt-1 border-t border-slate-100 mt-1">
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 pt-1">Se reconnecter avec un autre compte</p>
                    <input
                      type="email"
                      value={loginForm.email}
                      onChange={(e) => setLoginForm((f) => ({ ...f, email: e.target.value }))}
                      placeholder="vous@exemple.ci"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#ea580c]/50"
                    />
                    <input
                      type="password"
                      value={loginForm.password}
                      onChange={(e) => setLoginForm((f) => ({ ...f, password: e.target.value }))}
                      placeholder="Mot de passe"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#ea580c]/50"
                    />
                    {loginError && (
                      <div className="p-2 rounded-lg bg-red-50 border border-red-200 text-red-700 text-[11px] font-bold">{loginError}</div>
                    )}
                    <button
                      type="submit"
                      disabled={loginBusy}
                      className="w-full py-2 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white text-[11px] font-black uppercase tracking-wider transition-colors cursor-pointer"
                    >
                      {loginBusy ? 'Connexion…' : 'Se connecter'}
                    </button>
                  </form>
                  <button
                    onClick={handleSignOut}
                    disabled={signingOut}
                    className="w-full py-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 text-[11px] font-bold uppercase transition-colors cursor-pointer disabled:opacity-60"
                  >
                    {signingOut ? 'Déconnexion…' : 'Se déconnecter'}
                  </button>
                </div>
              )}

              {!user && (
              <form onSubmit={handleMemberLogin} className="space-y-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={loginForm.email}
                    onChange={(e) => setLoginForm((f) => ({ ...f, email: e.target.value }))}
                    placeholder="vous@exemple.ci"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#ea580c]/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Mot de passe</label>
                  <input
                    type="password"
                    value={loginForm.password}
                    onChange={(e) => setLoginForm((f) => ({ ...f, password: e.target.value }))}
                    placeholder="••••••••"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#ea580c]/50"
                  />
                </div>
                {loginError && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold">{loginError}</div>
                )}
                <button
                  type="submit"
                  disabled={loginBusy}
                  className="w-full py-3 rounded-xl bg-[#004724] hover:bg-[#006039] disabled:opacity-60 text-white text-xs font-black uppercase tracking-wider transition-colors cursor-pointer"
                >
                  {loginBusy ? 'Connexion…' : 'Se connecter à mon espace membre'}
                </button>
              </form>
              )}

              {!user && (
              <button
                onClick={onAdminLogin}
                className="w-full flex items-center gap-3 p-4 rounded-xl border border-slate-200 hover:border-[#004724] hover:bg-emerald-50/60 transition-colors text-left cursor-pointer group"
              >
                <span className="p-2.5 rounded-lg bg-[#004724] text-white shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5 text-xs font-black text-slate-900 uppercase">
                    Espace fédéral
                    {user && <BadgeCheck className="w-3.5 h-3.5 text-emerald-600" />}
                  </span>
                  <span className="block text-[11px] text-slate-500 leading-snug">
                    Administrateurs et dirigeants de clubs affiliés
                  </span>
                </span>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#ea580c] transition-colors shrink-0" />
              </button>
              )}

              <div className="grid grid-cols-3 gap-2 pt-1">
                {STATS.map((s) => (
                  <div
                    key={s.label}
                    className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-center"
                  >
                    <div className="text-sm font-black text-[#004724]">{s.value}</div>
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                      {s.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {success ? (
                <div className="text-center py-8 space-y-4">
                  <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-black text-slate-900">Demande envoyée !</h3>
                  <p className="text-sm text-slate-600 max-w-xs mx-auto">
                    Merci pour votre intérêt ! La FIMF étudie les demandes d'adhésion et vous
                    répondra par email sous quelques jours.
                  </p>
                  <button
                    onClick={handleClose}
                    className="px-6 py-2.5 rounded-xl bg-[#004724] hover:bg-[#006039] text-white text-xs font-black uppercase cursor-pointer"
                  >
                    Fermer
                  </button>
                </div>
              ) : (
                <>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 uppercase">
                      Rejoindre la FIMF
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Créez votre compte membre : avantages exclusifs, billetterie et contenus
                      réservés.
                    </p>
                  </div>

                  <ul className="space-y-2">
                    {BENEFITS.map((b) => (
                      <li key={b} className="flex items-start gap-2 text-xs text-slate-600">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>

                  <form onSubmit={handleMemberSubmit} className="space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Nom complet *
                      </label>
                      <div className="relative">
                        <UserRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={form.fullName}
                          onChange={set('fullName')}
                          placeholder="Prénom et nom"
                          className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#ea580c]/50"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Email *</label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="email"
                          value={form.email}
                          onChange={set('email')}
                          placeholder="vous@exemple.ci"
                          className={`w-full pl-9 pr-3 py-2.5 bg-slate-50 border rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#ea580c]/50 ${
                            errField('email') ? 'border-red-300 bg-red-50' : 'border-slate-200'
                          }`}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Mot de passe *
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="password"
                          value={form.password}
                          onChange={set('password')}
                          placeholder="6 caractères minimum"
                          className={`w-full pl-9 pr-3 py-2.5 bg-slate-50 border rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#ea580c]/50 ${
                            errField('password') ? 'border-red-300 bg-red-50' : 'border-slate-200'
                          }`}
                        />
                      </div>
                    </div>

                    {error && (
                      <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold">
                        {error.message}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={sending}
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-[#ea580c] to-[#f97316] hover:from-[#c2410c] hover:to-[#ea580c] disabled:opacity-60 text-white font-black text-xs uppercase tracking-wider transition-all shadow-md shadow-orange-500/20 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {sending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                      {sending ? 'Envoi en cours…' : 'Envoyer ma demande d’adhésion'}
                    </button>

                    <p className="text-[10px] text-slate-400 text-center leading-relaxed">
                      En envoyant votre demande, vous acceptez d'être contacté·e par la FIMF.
                      Vos données ne sont jamais partagées.
                    </p>
                  </form>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
