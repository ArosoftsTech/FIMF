import React, { useEffect, useState } from 'react';
import { Trophy, GraduationCap, Dices } from 'lucide-react';
import { fetchGameDraws, fetchDrawWinners, GameDraw, DrawWinnerPublic } from '@/src/lib/fimfApi';

interface DrawWithWinners extends GameDraw {
  winners: DrawWinnerPublic[];
}

/**
 * Vitrine des gagnants (page d'accueil) : se remplit automatiquement dès qu'un
 * tirage passe au statut « terminé ». Section absente du DOM tant qu'il n'y a
 * rien à afficher — aucun impact sur une page d'accueil vierge de tirages.
 */
export const WinnersShowcase: React.FC = () => {
  const [draws, setDraws] = useState<DrawWithWinners[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const all = await fetchGameDraws();
        // Les 2 tirages terminés les plus récents
        const done = all
          .filter((d) => d.status === 'terminé' && d.drawnAt)
          .sort((a, b) => new Date(b.drawnAt!).getTime() - new Date(a.drawnAt!).getTime())
          .slice(0, 2);
        const withWinners = await Promise.all(
          done.map(async (d) => ({ ...d, winners: await fetchDrawWinners(d.id) })),
        );
        if (!cancelled) setDraws(withWinners.filter((d) => d.winners.length > 0));
      } catch {
        if (!cancelled) setDraws([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (draws === null || draws.length === 0) return null;

  return (
    <section id="nos-gagnants" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="pb-2 border-b-2 border-slate-200 flex items-center justify-between">
        <h2 className="text-base sm:text-lg font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-500" />
          Nos gagnants
        </h2>
        <span className="hidden sm:inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400">
          <Dices className="w-3.5 h-3.5" />
          Tirages au sort officiels FIMF
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        {draws.map((d) => {
          const isScholarship = d.kind === 'scholarship';
          return (
            <div
              key={d.id}
              className={`bg-white rounded-2xl border shadow-sm p-5 ${
                isScholarship ? 'border-amber-200' : 'border-slate-200'
              }`}
            >
              <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      isScholarship ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-[#004724]'
                    }`}
                  >
                    {isScholarship ? <GraduationCap className="w-5 h-5" /> : <Trophy className="w-5 h-5" />}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-xs font-black text-slate-900 uppercase truncate">{d.title}</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      Tiré le {new Date(d.drawnAt!).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                </div>
                <span
                  className={`shrink-0 text-[9px] font-black px-2 py-0.5 rounded-full uppercase ${
                    isScholarship ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                  }`}
                >
                  {isScholarship ? 'Bourses' : 'Lots'}
                </span>
              </div>

              <ul className="space-y-2 pt-3">
                {d.winners.map((w) => (
                  <li key={w.rank} className="flex items-center gap-2.5">
                    {w.photoRef ? (
                      <img
                        src={w.photoRef}
                        alt={`Photo de ${w.displayName}`}
                        className={`w-9 h-9 rounded-full object-cover border-2 shrink-0 ${
                          w.rank === 1 ? 'border-amber-400' : 'border-slate-200'
                        }`}
                      />
                    ) : (
                      <span
                        className={`w-9 h-9 rounded-full font-black text-[11px] flex items-center justify-center shrink-0 ${
                          w.rank === 1
                            ? 'bg-amber-400 text-white'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {w.rank}
                      </span>
                    )}
                    <span className="text-xs font-black text-slate-900">{w.displayName}</span>
                    {w.prizeLabel && (
                      <span className="text-[10px] text-slate-500 truncate">— {w.prizeLabel}</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </section>
  );
};
