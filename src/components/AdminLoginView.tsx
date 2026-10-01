import { useState } from 'react';
import { Lock, LogIn, AlertCircle, Loader2, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface AdminLoginViewProps {
  onBack: () => void;
}

export function AdminLoginView({ onBack }: AdminLoginViewProps) {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const result = email && password
      ? await signIn(email, password)
      : { error: 'Veuillez renseigner vos identifiants.' };
    setSubmitting(false);
    if (result.error) setError(result.error);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#006039] via-emerald-900 to-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-emerald-200/80 hover:text-white text-sm mb-6 transition-colors"
        >
          <ArrowLeft size={16} />
          Retour au site
        </button>

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/10 flex items-center justify-center">
              <Lock className="text-emerald-300" size={32} />
            </div>
            <h1 className="text-2xl font-bold text-white">Espace Administrateur</h1>
            <p className="text-emerald-200/70 text-sm mt-2">
              Fédération Ivoirienne de Mini-Football
            </p>
          </div>

          {error && (
            <div className="mb-6 bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle className="text-red-400 shrink-0 mt-0.5" size={18} />
              <p className="text-red-200 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="admin-email" className="block text-sm font-medium text-emerald-100 mb-2">
                Email
              </label>
              <input
                id="admin-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@fimf.ci"
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-emerald-200/40 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition"
              />
            </div>

            <div>
              <label htmlFor="admin-password" className="block text-sm font-medium text-emerald-100 mb-2">
                Mot de passe
              </label>
              <input
                id="admin-password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-emerald-200/40 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {submitting ? <Loader2 className="animate-spin" size={18} /> : <LogIn size={18} />}
              {submitting ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>

          <p className="text-center text-emerald-200/50 text-xs mt-8">
            Accès réservé aux administrateurs de la FIMF.
          </p>
        </div>
      </div>
    </div>
  );
}
