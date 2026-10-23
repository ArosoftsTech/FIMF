import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

/** Ton d'une notification. */
export type ToastTone = 'success' | 'error' | 'info';

export interface Toast {
  id: number;
  tone: ToastTone;
  title: string;
  /** Précision facultative (message d'erreur de la base, contexte, etc.). */
  message?: string;
}

interface ToastContextValue {
  /** Affiche une notification. */
  push: (tone: ToastTone, title: string, message?: string) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
  /** Ferme une notification. */
  dismiss: (id: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

/** Accès aux notifications éphémères. À utiliser sous `<ToastProvider>`. */
export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast doit être utilisé dans un <ToastProvider>.');
  return ctx;
}

/** Durée d'affichage par ton (ms). */
const DURATION: Record<ToastTone, number> = {
  success: 4000,
  info: 5000,
  // Les erreurs restent plus longtemps : elles demandent une lecture.
  error: 9000,
};

/** Nombre maximum de notifications empilées. */
const MAX_TOASTS = 4;

const TONE_STYLES: Record<ToastTone, { icon: React.ElementType; ring: string; iconColor: string }> = {
  success: { icon: CheckCircle2, ring: 'border-emerald-200', iconColor: 'text-emerald-600' },
  error: { icon: AlertTriangle, ring: 'border-red-200', iconColor: 'text-red-600' },
  info: { icon: Info, ring: 'border-slate-200', iconColor: 'text-slate-500' },
};

/**
 * Provider de notifications éphémères.
 *
 * Utilisé notamment par le back-office : toute écriture refusée par la base
 * (RLS) remonte enfin jusqu'à l'écran de l'administrateur au lieu d'être
 * avalée dans la console.
 */
export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);
  const timers = useRef<number[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (tone: ToastTone, title: string, message?: string) => {
      const id = nextId.current++;
      setToasts((prev) => [...prev, { id, tone, title, message }].slice(-MAX_TOASTS));
      const timer = window.setTimeout(() => dismiss(id), DURATION[tone]);
      timers.current.push(timer);
    },
    [dismiss],
  );

  // Nettoyage des minuteries à la destruction du provider.
  useEffect(
    () => () => {
      timers.current.forEach((t) => window.clearTimeout(t));
      timers.current = [];
    },
    [],
  );

  const value = useMemo<ToastContextValue>(
    () => ({
      push,
      dismiss,
      success: (title, message) => push('success', title, message),
      error: (title, message) => push('error', title, message),
      info: (title, message) => push('info', title, message),
    }),
    [push, dismiss],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Conteneur : les notifications ne bloquent jamais le clic sur la page. */}
      <div
        className="fixed top-4 left-1/2 -translate-x-1/2 z-[60] flex flex-col items-center gap-2 w-[min(420px,calc(100vw-2rem))] pointer-events-none"
        aria-live="polite"
        aria-atomic="false"
      >
        {toasts.map((toast) => {
          const { icon: Icon, ring, iconColor } = TONE_STYLES[toast.tone];
          return (
            <div
              key={toast.id}
              role={toast.tone === 'error' ? 'alert' : 'status'}
              className={`pointer-events-auto w-full flex items-start gap-3 bg-white rounded-xl shadow-2xl border ${ring} px-4 py-3 animate-toast-in`}
            >
              <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${iconColor}`} aria-hidden="true" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-900 leading-snug">{toast.title}</p>
                {toast.message && (
                  <p className="text-[11px] text-slate-600 mt-0.5 leading-snug break-words">{toast.message}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => dismiss(toast.id)}
                className="shrink-0 p-1 text-slate-400 hover:text-slate-700 rounded transition-colors cursor-pointer"
                aria-label="Fermer la notification"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};
