import React, { useCallback, useEffect, useState } from 'react';
import {
  UserRound,
  LogOut,
  BadgeCheck,
  Heart,
  Star,
  Calendar,
  Ticket,
  Bell,
  Sparkles,
  ArrowRight,
  Loader2,
  Mail,
  Timer,
} from 'lucide-react';
import { Club, CLUBS_DATA, Match, MATCHES_DATA } from '@/src/data/fimfData';
import { ClubBadge } from '../ClubBadge';
import { useAuth } from '../../context/AuthContext';
import { useFimfData } from '../../context/FimfDataContext';
import { Trophy } from 'lucide-react';
import { MemberGamesSection } from '../member/MemberGamesSection';

interface MemberAreaViewProps {
  onNavigate: (page: NavPageLike) => void;
  onSelectClub: (club: Club) => void;
  onSelectMatch: (match: Match) => void;
  favoriteIds: string[];
  onToggleFavorite: (clubId: string) => void;
  onExit: () => void;
}

/** Pages navigables depuis l'espace membre (sous-ensemble de NavPage). */
type NavPageLike =
  | 'accueil'
  | 'calendrier'
  | 'classement'
  | 'equipes'
  | 'actualites'
  | 'admin';

interface MembershipInfo {
  role: 'admin' | 'dirigeant' | 'membre' | null;
  clubId: string | null;
  fullName: string | null;
}

const ADVANTAGES = [
  {
    icon: Ticket,
    title: 'Billetterie prioritaire',
    desc: 'Réservez vos places avant tout le monde pour les matchs du championnat D1 et les finales.',
  },
  {
    icon: Star,
    title: 'Contenus exclusifs',
    desc: 'Coulisses, interviews des joueurs et analyse tactique réservés aux membres.',
  },
  {
    icon: Bell,
    title: 'Alertes personnalisées',
    desc: 'Notifications en direct des matchs de vos clubs favoris et des résultats.',
  },
  {
    icon: Sparkles,
    title: 'Offres partenaires',
    desc: 'Réductions des sponsors officiels de la FIMF sur présentation de votre statut membre.',
  },
];

/** Compteurs indicatifs (à synchroniser plus tard avec les vrais chiffres fédéraux). */
const MEMBER_STATS = [
  { value: '12 000+', label: 'Membres supporters' },
  { value: '12', label: 'Clubs affiliés' },
  { value: '26', label: 'Rencontres / saison' },
];

// ---------------------------------------------------------------------
// Dates FR (« Sam. 28 Sept. 2025 » + « 16h00 ») → Date
// ---------------------------------------------------------------------

const MONTHS_FR: Record<string, number> = {
  jan: 0, janv: 0,
  'fév': 1, fev: 1,
  mars: 2,
  avr: 3,
  mai: 4,
  juin: 5,
  juil: 6,
  'aoû': 7, aou: 7,
  sept: 8,
  oct: 9,
  nov: 10,
  'déc': 11, dec: 11,
};

/** Parse « Sam. 28 Sept. 2025 » + « 16h00 » en Date locale (null si illisible). */
function parseMatchDate(m: Match): Date | null {
  const dm = m.dateStr.match(/(\d{1,2})\s+([A-Za-zÀ-ÿ.]+)\s+(\d{4})/);
  const tm = m.timeStr.match(/(\d{1,2})h(\d{2})?/);
  if (!dm || !tm) return null;
  const month = MONTHS_FR[dm[2].replace(/\./g, '').toLowerCase()];
  if (month === undefined) return null;
  return new Date(Number(dm[3]), month, Number(dm[1]), Number(tm[1]), Number(tm[2] ?? 0));
}

/** Compte à rebours temps réel vers targetMs (se met à jour si la cible change). */
function useCountdown(targetMs: number) {
  const calc = useCallback(() => {
    const diff = Math.max(0, targetMs - Date.now());
    return {
      days: Math.floor(diff / 86_400_000),
      hours: Math.floor((diff % 86_400_000) / 3_600_000),
      minutes: Math.floor((diff % 3_600_000) / 60_000),
      seconds: Math.floor((diff % 60_000) / 1000),
    };
  }, [targetMs]);
  const [timeLeft, setTimeLeft] = useState(calc);
  useEffect(() => {
    setTimeLeft(calc());
    const t = setInterval(() => setTimeLeft(calc()), 1000);
    return () => clearInterval(t);
  }, [calc]);
  return timeLeft;
}

export const MemberAreaView: React.FC<MemberAreaViewProps> = ({
  onNavigate,
  onSelectClub,
  onSelectMatch,
  favoriteIds,
  onToggleFavorite,
  onExit,
}) => {
  const { user, signOut } = useAuth();
  const { matches: liveMatches, clubs: liveClubs } = useFimfData();
  const [info, setInfo] = useState<MembershipInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const membership = await (await import('@/src/lib/fimfApi')).fetchMyClubMembership();
        if (!cancelled) {
          setInfo({
            role: membership?.role ?? (user ? 'membre' : null),
            clubId: membership?.clubId ?? null,
            fullName:
              (user?.user_metadata?.full_name as string | undefined) ??
              (user?.user_metadata?.name as string | undefined) ??
              null,
          });
        }
        setLoading(false);
      } catch {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const matches = liveMatches.length > 0 ? liveMatches : MATCHES_DATA;
  const clubs = liveClubs.length > 0 ? liveClubs : CLUBS_DATA;
  const favoriteClubs = clubs.filter((c) => favoriteIds.includes(c.id));

  // Matchs à venir des clubs suivis : futurs d'abord (du plus proche au plus
  // lointain), puis les plus récents non joués si le calendrier n'est pas à jour.
  const followedPool = matches
    .filter(
      (m) =>
        m.status === 'scheduled' &&
        (favoriteIds.length === 0 || favoriteIds.includes(m.homeTeamId) || favoriteIds.includes(m.awayTeamId)),
    )
    .map((m) => ({ m, date: parseMatchDate(m) }))
    .filter((x): x is { m: Match; date: Date } => x.date !== null);
  const nowMs = Date.now();
  const upcoming = followedPool
    .filter((x) => x.date.getTime() >= nowMs)
    .sort((a, b) => a.date.getTime() - b.date.getTime());
  const recentPast = followedPool
    .filter((x) => x.date.getTime() < nowMs)
    .sort((a, b) => b.date.getTime() - a.date.getTime());
  const nextMatches = [...upcoming, ...recentPast].slice(0, 3).map((x) => x.m);
  const nextFollowedMatch = upcoming[0] ?? null;
  const countdown = useCountdown(nextFollowedMatch ? nextFollowedMatch.date.getTime() : 0);

  const handleSignOut = async () => {
    await signOut();
    onExit();
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
      </div>
    );
  }

  const displayName = info?.fullName ?? user?.email?.split('@')[0] ?? 'Membre';

  return (
    <div className="space-y-8 pb-16">
      {/* HERO ESPACE MEMBRE */}
      <section className="relative overflow-hidden bg-[#004724] text-white">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-800/80 border border-emerald-600/50 text-emerald-200 text-xs font-bold uppercase tracking-wider mb-3">
                <BadgeCheck className="w-3.5 h-3.5 text-amber-400" />
                <span>Espace membre FIMF</span>
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight">
                Bonjour, {displayName}
              </h1>
              <p className="text-emerald-100 text-sm sm:text-base md:text-lg max-w-2xl mt-2 font-medium">
                Retrouvez vos avantages, vos clubs suivis et les prochains matchs à ne pas manquer.
              </p>

              {/* RÉCAP FAVORIS + COMPTE À REBOURS du prochain match suivi */}
              {nextFollowedMatch ? (
                (() => {
                  const home = clubs.find((c) => c.id === nextFollowedMatch.m.homeTeamId);
                  const away = clubs.find((c) => c.id === nextFollowedMatch.m.awayTeamId);
                  return (
                    <div
                      onClick={() => onSelectMatch(nextFollowedMatch.m)}
                      className="mt-5 max-w-2xl bg-emerald-950/60 border border-emerald-700/60 rounded-2xl p-4 sm:p-5 backdrop-blur-xs cursor-pointer hover:border-emerald-500/70 transition-colors"
                      title="Voir les détails du match"
                    >
                      <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-emerald-300 mb-3">
                        <Timer className="w-3.5 h-3.5 text-amber-400" />
                        {nextFollowedMatch.m.competitionName ?? 'Prochain match'}
                        {favoriteClubs.length > 0 && (
                          <span className="text-emerald-400/70 normal-case font-bold">
                            • {favoriteClubs.length} club{favoriteClubs.length > 1 ? 's' : ''} suivi{favoriteClubs.length > 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          {home && <ClubBadge id={home.id} size="md" />}
                          <span className="text-sm font-black truncate">{home?.name ?? nextFollowedMatch.m.homeTeamId}</span>
                        </div>
                        <span className="text-[10px] font-black text-emerald-400 shrink-0">VS</span>
                        <div className="flex items-center gap-2.5 min-w-0 justify-end">
                          <span className="text-sm font-black truncate text-right">{away?.name ?? nextFollowedMatch.m.awayTeamId}</span>
                          {away && <ClubBadge id={away.id} size="md" />}
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t border-emerald-800/70 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
                        <div className="text-[11px] font-bold text-emerald-200">
                          📅 {nextFollowedMatch.m.dateStr} • {nextFollowedMatch.m.timeStr} • 📍 {nextFollowedMatch.m.venue}
                        </div>
                        <div className="flex items-center gap-1.5" aria-label="Compte à rebours avant le coup d'envoi">
                          {([
                            [countdown.days, 'j'],
                            [countdown.hours, 'h'],
                            [countdown.minutes, 'min'],
                            [countdown.seconds, 's'],
                          ] as [number, string][]).map(([v, u]) => (
                            <span
                              key={u}
                              className="inline-flex items-baseline gap-0.5 px-2 py-1 rounded-lg bg-emerald-900/80 border border-emerald-700/50"
                            >
                              <span className="text-sm font-black text-white tabular-nums">{String(v).padStart(2, '0')}</span>
                              <span className="text-[9px] font-bold text-emerald-300 uppercase">{u}</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })()
              ) : (
                <p className="mt-5 max-w-2xl text-xs text-emerald-200/80 bg-emerald-950/60 border border-emerald-700/60 rounded-2xl p-4">
                  Aucun match à venir pour vos clubs suivis pour le moment — suivez une équipe de plus pour élargir vos alertes.
                </p>
              )}
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-emerald-950/70 border border-emerald-800/80 rounded-xl p-4 backdrop-blur-xs">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-[#ea580c] flex items-center justify-center text-white font-black text-lg">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-sm font-black">{displayName}</div>
                    <div className="text-[11px] text-emerald-200 flex items-center gap-1">
                      <Mail className="w-3 h-3" />
                      {user?.email}
                    </div>
                  </div>
                </div>
              </div>
              <button
                onClick={handleSignOut}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-black uppercase transition-colors cursor-pointer"
                title="Se déconnecter"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Déconnexion</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ROLE-BASED SHORTHAND LINKS */}
      {(info?.role === 'admin' || info?.role === 'dirigeant') && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase">
                {info.role === 'admin' ? 'Console fédérale accessible' : 'Espace club accessible'}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {info.role === 'admin'
                  ? 'Votre compte dispose des droits d’administration de la fédération.'
                  : 'Gérez l’effectif et les résultats de votre club.'}
              </p>
            </div>
            <button
              onClick={() => onNavigate('admin')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#004724] hover:bg-[#006039] text-white text-xs font-black uppercase transition-colors cursor-pointer"
            >
              Ouvrir la console
              <ArrowRight className="w-3.5 h-3.5" />
              </button>
          </div>
        </section>
      )}

      {/* STATS MEMBRES */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-3 gap-3">
          {MEMBER_STATS.map((s) => (
            <div key={s.label} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5 text-center">
              <div className="text-xl sm:text-2xl font-black text-[#004724]">{s.value}</div>
              <div className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider mt-1">
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* JEUX & PRONOSTICS (réservé membres) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight mb-1 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-[#ea580c]" />
          Jeux & Pronostics
        </h2>
        <p className="text-xs text-slate-500 mb-4">
          Pronostiquez les matchs, grimpez au classement, gagnez des lots — et transformez vos points en tickets pour
          le tirage des bourses d'études en Angleterre.
        </p>
        <MemberGamesSection onSelectMatch={onSelectMatch} onSelectClub={onSelectClub} />
      </section>

      {/* AVANTAGES */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight mb-1 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-[#ea580c]" />
          Vos avantages membres
        </h2>
        <p className="text-xs text-slate-500 mb-4">
          Des avantages concrets, réservés aux membres de la FIMF.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {ADVANTAGES.map((a) => (
            <div
              key={a.title}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 hover:shadow-md transition-shadow"
            >
              <div className="w-10 h-10 rounded-xl bg-orange-50 text-[#ea580c] flex items-center justify-center mb-3">
                <a.icon className="w-5 h-5" />
              </div>
              <h3 className="text-xs font-black text-slate-900 uppercase">{a.title}</h3>
              <p className="text-[11px] text-slate-500 leading-relaxed mt-1.5">{a.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CLUBS SUIVIS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
            <Heart className="w-5 h-5 text-[#ea580c]" />
            Vos clubs suivis
          </h2>
          <button
            onClick={() => onNavigate('equipes')}
            className="text-xs font-bold text-[#ea580c] hover:underline"
          >
            Voir toutes les équipes →
          </button>
        </div>
        <p className="text-xs text-slate-500 mb-4">
          {favoriteClubs.length === 0
            ? 'Vous ne suivez aucun club — cliquez sur l’étoile d’une équipe pour la retrouver ici.'
            : `${favoriteClubs.length} club${favoriteClubs.length > 1 ? 's' : ''} suivi${favoriteClubs.length > 1 ? 's' : ''}`}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {favoriteClubs.map((club) => (
            <div
              key={club.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex items-center gap-3"
            >
              <ClubBadge id={club.id} size="md" />
              <div className="min-w-0 flex-1">
                <button
                  onClick={() => onSelectClub(club)}
                  className="text-xs font-black text-slate-900 uppercase hover:text-[#ea580c] transition-colors text-left cursor-pointer"
                >
                  {club.name}
                </button>
                <div className="text-[10px] text-slate-500">{club.city ?? ''}</div>
              </div>
              <button
                onClick={() => onToggleFavorite(club.id)}
                className="p-1.5 rounded-lg hover:bg-orange-50 transition-colors cursor-pointer"
                title="Ne plus suivre"
              >
                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* PROCHAINS MATCHS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#ea580c]" />
            Prochains matchs{favoriteIds.length > 0 ? ' de vos clubs' : ''}
          </h2>
          <button
            onClick={() => onNavigate('calendrier')}
            className="text-xs font-bold text-[#ea580c] hover:underline"
          >
            Calendrier complet →
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
          {nextMatches.map((m) => {
            const home = clubs.find((c) => c.id === m.homeTeamId);
            const away = clubs.find((c) => c.id === m.awayTeamId);
            return (
              <div
                key={m.id}
                onClick={() => onSelectMatch(m)}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 cursor-pointer hover:shadow-md hover:border-slate-300 transition-all"
              >
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  {m.dateStr} • {m.timeStr}
                </div>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    {home && <ClubBadge id={home.id} size="sm" />}
                    <span className="text-xs font-bold text-slate-900 truncate">{home?.name}</span>
                  </div>
                  <span className="text-xs font-black text-slate-400">VS</span>
                  <div className="flex items-center gap-2 min-w-0 justify-end">
                    <span className="text-xs font-bold text-slate-900 truncate text-right">{away?.name}</span>
                    {away && <ClubBadge id={away.id} size="sm" />}
                  </div>
                </div>
                <div className="text-[10px] text-slate-500 mt-2 truncate">📍 {m.venue}</div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
