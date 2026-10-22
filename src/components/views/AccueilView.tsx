import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { NavPage } from '../Navbar';
import {
  CLUBS_DATA as CLUBS_DATA_STATIC,
  MATCHES_DATA as MATCHES_DATA_STATIC,
  NEWS_DATA as NEWS_DATA_STATIC,
  COMPETITIONS_DATA as COMPETITIONS_DATA_STATIC,
  GALLERY_PHOTOS as GALLERY_PHOTOS_STATIC,
  FIMF_STATS as FIMF_STATS_STATIC,
  PARTNERS as PARTNERS_STATIC,
  Club,
  NewsArticle,
  Match,
  Competition,
} from '@/src/data/fimfData';
import { useFimfData } from '../../context/FimfDataContext';
import { ClubBadge } from '../ClubBadge';
import { MatchRow } from '../MatchRow';
import { Reveal, Stagger, StaggerItem } from '../anim/Reveal';
import { Counter } from '../anim/Counter';
import { PronosticsModule } from '../PronosticsModule';
import { WinnersShowcase } from '../WinnersShowcase';
import { HeroCarousel } from '../HeroCarousel';
import heroImg from '@/src/assets/images/hero_ivory_coast_minifootball_1790335944178.jpg';
import huddleImg from '@/src/assets/images/team_huddle_elephants_1790335968616.jpg';
import {
  Calendar,
  MapPin,
  ArrowRight,
  Users,
  Shield,
  Award,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Star,
  Plus,
  X,
  Sparkles,
  Trophy,
  Globe2,
  Handshake,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────
// Grandes échéances internationales — Dossier Technique FIMF 2026
// ─────────────────────────────────────────────────────────────
const CAN_GUINEE_2027_DATE = new Date('2027-01-09T16:00:00Z');

const GRANDES_ECHEANCES = [
  {
    id: 'can-2027',
    badge: 'CAN 2027',
    title: 'Coupe d\'Afrique des Nations — Conakry',
    date: '09 – 24 janvier 2027',
    targetDate: CAN_GUINEE_2027_DATE,
    icon: 'flag',
    accent: 'text-[#006039]',
    ring: 'border-emerald-200',
    chip: 'bg-emerald-50 text-emerald-900',
    desc: "Les Éléphants, champions d'Afrique 2018, visent un second titre continental.",
  },
  {
    id: 'ldc-amc',
    badge: 'LDC AMC',
    title: "Ligue des Champions Africaine — AMC 2026",
    date: 'Novembre 2026',
    targetDate: new Date('2026-11-07T16:00:00Z'),
    icon: 'trophy',
    accent: 'text-[#ea580c]',
    ring: 'border-orange-200',
    chip: 'bg-orange-50 text-orange-900',
    desc: "64 équipes, 16 finalistes : le champion national ivoirien qualifié d'office.",
  },
  {
    id: 'mondial-2027',
    badge: 'MONDIAL',
    title: 'Coupe du Monde — République Tchèque',
    date: 'Octobre 2027',
    targetDate: new Date('2027-10-02T16:00:00Z'),
    icon: 'globe',
    accent: 'text-slate-900',
    ring: 'border-slate-300',
    chip: 'bg-slate-100 text-slate-900',
    desc: "Après l'exploit de 2023 aux Émirats, la CI retourne parmi l'élite mondiale.",
  },
];

const ECHEANCE_ICONS: Record<string, React.ReactNode> = {
  flag: <Trophy className="w-5 h-5" />,
  trophy: <Trophy className="w-5 h-5" />,
  globe: <Globe2 className="w-5 h-5" />,
  handshake: <Handshake className="w-5 h-5" />,
};

function useCountdown(target: Date) {
  const calc = () => {
    const diff = Math.max(0, target.getTime() - Date.now());
    return {
      days: Math.floor(diff / 86_400_000),
      hours: Math.floor((diff % 86_400_000) / 3_600_000),
      minutes: Math.floor((diff % 3_600_000) / 60_000),
      seconds: Math.floor((diff % 60_000) / 1000),
    };
  };
  const [timeLeft, setTimeLeft] = useState(calc);
  useEffect(() => {
    const t = setInterval(() => setTimeLeft(calc()), 1000);
    return () => clearInterval(t);
  }, []);
  return timeLeft;
}

interface AccueilViewProps {
  onNavigate: (page: NavPage) => void;
  onSelectClub: (club: Club) => void;
  onSelectArticle: (article: NewsArticle) => void;
  onSelectMatch: (match: Match) => void;
  onSelectCompetition: (comp: Competition) => void;
  onOpenPhotoLightbox: (index: number) => void;
  favoriteIds?: string[];
  favoriteClubs?: Club[];
  onToggleFavorite?: (clubId: string) => void;
  /** Ouvre le popup de connexion (teaser pronostics membres). */
  onOpenAuth?: () => void;
  /** Navigue vers l'espace membre. */
  onMemberArea?: () => void;
}

export const AccueilView: React.FC<AccueilViewProps> = ({
  onNavigate,
  onSelectClub,
  onSelectArticle,
  onSelectMatch,
  onSelectCompetition,
  onOpenPhotoLightbox,
  favoriteIds = [],
  favoriteClubs = [],
  onToggleFavorite,
  onOpenAuth,
  onMemberArea,
}) => {
  const [championnatTab, setChampionnatTab] = useState<'classement' | 'matchs'>('classement');
  const [partnerIndex, setPartnerIndex] = useState(0);

  // Données live depuis Supabase (fallback statique si la base est indisponible)
  const {
    clubs: liveClubs,
    matches: liveMatches,
    news: liveNews,
    competitions: liveCompetitions,
    gallery: liveGallery,
    heroSlides: liveHeroSlides,
    fimfStats: liveStats,
    partners: livePartners,
  } = useFimfData();
  const CLUBS_DATA = liveClubs.length > 0 ? liveClubs : CLUBS_DATA_STATIC;
  const MATCHES_DATA = liveMatches.length > 0 ? liveMatches : MATCHES_DATA_STATIC;
  const NEWS_DATA = liveNews.length > 0 ? liveNews : NEWS_DATA_STATIC;
  const COMPETITIONS_DATA = liveCompetitions.length > 0 ? liveCompetitions : COMPETITIONS_DATA_STATIC;
  const GALLERY_PHOTOS = liveGallery.length > 0 ? liveGallery : GALLERY_PHOTOS_STATIC;
  const HERO_SLIDES = liveHeroSlides.filter((s) => s.active);
  const FIMF_STATS = liveStats;
  const PARTNERS = livePartners.length > 0 ? livePartners : PARTNERS_STATIC;

  // Helper to find the next match of a club
  const getClubNextMatch = (clubId: string) => {
    return MATCHES_DATA.find(
      (m) =>
        (m.homeTeamId === clubId || m.awayTeamId === clubId) &&
        m.status === 'scheduled'
    );
  };

  // Next match highlight
  const nextMatch = MATCHES_DATA.find((m) => m.id === 'm-j3-1') || MATCHES_DATA[0];
  const homeClub = CLUBS_DATA.find((c) => c.id === nextMatch.homeTeamId);
  const awayClub = CLUBS_DATA.find((c) => c.id === nextMatch.awayTeamId);

  // Mini standings (top 5)
  const top5Clubs = [...CLUBS_DATA].sort((a, b) => b.stats.points - a.stats.points).slice(0, 5);

  // Latest 3 news
  const latestNews = NEWS_DATA.slice(0, 3);

  // Major competitions (top 3)
  const majorComps = COMPETITIONS_DATA.filter((c) => c.isMajor).slice(0, 3);

  // Partner carousel controls
  const handlePartnerPrev = () => {
    setPartnerIndex((prev) => (prev - 1 + PARTNERS.length) % PARTNERS.length);
  };
  const handlePartnerNext = () => {
    setPartnerIndex((prev) => (prev + 1) % PARTNERS.length);
  };

  return (
    <div className="space-y-10 sm:space-y-12 pb-12">
      {/* 1. HERO SECTION — carrousel administrable depuis le dashboard */}
      <HeroCarousel slides={HERO_SLIDES} onNavigate={onNavigate} />

      {/* 2. MATCH TICKER BANNER ("PROCHAIN MATCH") */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 sm:-mt-8 relative z-20">
        <Reveal>
        <div className="bg-white rounded-xl shadow-md border border-slate-200/90 overflow-hidden">
          <div className="flex flex-col lg:flex-row items-center justify-between divide-y lg:divide-y-0 lg:divide-x divide-slate-100">
            {/* Left Pill: PROCHAIN MATCH */}
            <div className="w-full lg:w-auto bg-[#004724] text-white px-6 py-4 flex items-center justify-center lg:justify-start gap-2.5 shrink-0">
              <Calendar className="w-5 h-5 text-[#ea580c]" />
              <span className="font-black text-xs sm:text-sm tracking-wider uppercase whitespace-nowrap">
                PROCHAIN MATCH
              </span>
            </div>

            {/* Teams Confrontation — grille 1 ligne (jamais empilée) : 1fr / auto / 1fr */}
            <div className="flex-1 w-full px-4 sm:px-6 py-3.5 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 sm:gap-4">
              <button
                onClick={() => homeClub && onSelectClub(homeClub)}
                title={homeClub?.name}
                className="flex items-center justify-end gap-2 min-w-0 hover:opacity-80 transition-opacity"
              >
                <span className="font-black text-slate-900 text-xs sm:text-sm tracking-tight uppercase truncate text-right">
                  {homeClub?.name}
                </span>
                <ClubBadge id={nextMatch.homeTeamId} size="md" />
              </button>

              <span className="text-xs font-black text-[#ea580c] px-2 py-0.5 rounded bg-orange-50 shrink-0">
                VS
              </span>

              <button
                onClick={() => awayClub && onSelectClub(awayClub)}
                title={awayClub?.name}
                className="flex items-center justify-start gap-2 min-w-0 hover:opacity-80 transition-opacity"
              >
                <ClubBadge id={nextMatch.awayTeamId} size="md" />
                <span className="font-black text-slate-900 text-xs sm:text-sm tracking-tight uppercase truncate">
                  {awayClub?.name}
                </span>
              </button>
            </div>

            {/* Date & Location */}
            <div className="w-full lg:w-auto px-6 py-3 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-xs text-slate-600 shrink-0">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#006039]" />
                <span className="font-semibold text-slate-800">
                  {nextMatch.dateStr} - {nextMatch.timeStr}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#ea580c]" />
                <span className="font-medium text-slate-700">{nextMatch.venue}</span>
              </div>
            </div>

            {/* Action button */}
            <div className="w-full lg:w-auto p-3 sm:px-5 flex justify-center shrink-0">
              <button
                onClick={() => onNavigate('calendrier')}
                className="fimf-btn-lift w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-[#f97316] hover:bg-[#ea580c] rounded-lg transition-colors uppercase tracking-wider whitespace-nowrap shadow-xs cursor-pointer"
              >
                <span>CALENDRIER DES MATCHS</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
        </Reveal>
      </section>

      {/* 3. GRANDES ÉCHÉANCES 2026-2027 (avec compte à rebours CAN Guinée 2027) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal>
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12">
            {/* Bloc compte à rebours CAN Guinée 2027 */}
            <div className="lg:col-span-5 relative overflow-hidden bg-[#004724] text-white p-6 sm:p-8 flex flex-col justify-between min-h-[260px]">
              <img
                src={huddleImg}
                alt="Sélection nationale"
                className="absolute inset-0 w-full h-full object-cover opacity-20"
                referrerPolicy="no-referrer"
              />
              <div className="relative">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded bg-[#ea580c] text-[10px] font-black uppercase tracking-wider">
                    J-Compte à rebours
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-100">
                    Événement officiel FIMF
                  </span>
                </div>
                <h2 className="mt-3 text-xl sm:text-2xl font-black uppercase tracking-tight leading-tight">
                  CAN Mini Football
                  <br />
                  Guinée 2027
                </h2>
                <p className="mt-1.5 text-xs sm:text-sm text-emerald-100 font-medium">
                  Coup d'envoi le 09 janvier 2027 à Conakry — les Éléphants visent un second titre continental.
                </p>
              </div>
              <CanCountdown />
            </div>

            {/* Liste des échéances */}
            <div className="lg:col-span-7 p-5 sm:p-6 flex flex-col">
              <div className="flex items-center justify-between pb-3 mb-3 border-b-2 border-slate-200">
                <h2 className="text-base sm:text-lg font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-[#006039]" />
                  Grandes échéances 2026 – 2027
                </h2>
                <button
                  onClick={() => onNavigate('la-fimf')}
                  className="hidden sm:inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-[#ea580c] transition-colors uppercase"
                >
                  <span>Voir toutes les échéances</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3">
                {GRANDES_ECHEANCES.map((e) => (
                  <EcheanceCard key={e.id} echeance={e} />
                ))}
              </div>
            </div>
          </div>
        </div>
        </Reveal>
        {/* Composant de compte à rebours de la CAN — définition plus bas */}
      </section>

      {/* 4. THREE-COLUMN SECTION (ACTUALITÉS, CHAMPIONNAT NATIONAL, LES COMPÉTITIONS) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Column 1: ACTUALITÉS (5 cols on lg) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b-2 border-slate-200">
              <h2 className="text-base sm:text-lg font-black text-slate-900 uppercase tracking-tight">
                ACTUALITÉS
              </h2>
              <button
                onClick={() => onNavigate('actualites')}
                className="text-xs font-bold text-slate-500 hover:text-[#ea580c] flex items-center gap-1 transition-colors uppercase"
              >
                <span>Voir tout</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <Stagger className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-4">
              {latestNews.map((article, i) => (
                <StaggerItem key={article.id} index={i}>
                <div
                  onClick={() => onSelectArticle(article)}
                  className="fimf-card-lift group bg-white rounded-lg border border-slate-200/90 overflow-hidden shadow-2xs hover:shadow-md cursor-pointer flex flex-col sm:flex-col h-full"
                >
                  <div className="relative h-40 w-full overflow-hidden bg-slate-900">
                    <img
                      src={article.image}
                      alt={article.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      referrerPolicy="no-referrer"
                    />
                    <span className="absolute top-2.5 left-2.5 px-2 py-0.5 bg-[#004724]/90 text-white text-[10px] font-bold rounded">
                      {article.category}
                    </span>
                  </div>
                  <div className="p-3.5 flex flex-col flex-1 justify-between">
                    <div>
                      <span className="text-[11px] font-semibold text-slate-400 block mb-1">
                        {article.dateStr}
                      </span>
                      <h3 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-[#ea580c] transition-colors line-clamp-2 leading-snug">
                        {article.title}
                      </h3>
                    </div>
                    <div className="pt-2 flex justify-end">
                      <span className="text-slate-400 group-hover:text-[#ea580c] transition-colors">
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                      </span>
                    </div>
                  </div>
                </div>
                </StaggerItem>
              ))}
            </Stagger>
          </div>

          {/* Column 2: CHAMPIONNAT NATIONAL (Mini Table + Upcoming tabs) (4 cols on lg) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b-2 border-slate-200">
              <h2 className="text-base sm:text-lg font-black text-slate-900 uppercase tracking-tight">
                CHAMPIONNAT NATIONAL
              </h2>
              <button
                onClick={() => onNavigate('classement')}
                className="text-xs font-bold text-slate-500 hover:text-[#ea580c] flex items-center gap-1 transition-colors uppercase"
              >
                <span>Voir tout</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Sub-tabs: CLASSEMENT / PROCHAINS MATCHS */}
            <div className="flex rounded-md overflow-hidden bg-slate-200 p-0.5 text-xs font-bold">
              <button
                onClick={() => setChampionnatTab('classement')}
                className={`relative flex-1 py-2 text-center rounded transition-colors uppercase cursor-pointer ${
                  championnatTab === 'classement'
                    ? 'text-white'
                    : 'text-slate-700 hover:text-slate-900'
                }`}
              >
                {championnatTab === 'classement' && (
                  <motion.span
                    layoutId="accueil-champ-tab"
                    className="absolute inset-0 bg-[#ea580c] rounded shadow-xs"
                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    aria-hidden="true"
                  />
                )}
                <span className="relative">CLASSEMENT</span>
              </button>
              <button
                onClick={() => setChampionnatTab('matchs')}
                className={`relative flex-1 py-2 text-center rounded transition-colors uppercase cursor-pointer ${
                  championnatTab === 'matchs'
                    ? 'text-white'
                    : 'text-slate-700 hover:text-slate-900'
                }`}
              >
                {championnatTab === 'matchs' && (
                  <motion.span
                    layoutId="accueil-champ-tab"
                    className="absolute inset-0 bg-[#ea580c] rounded shadow-xs"
                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    aria-hidden="true"
                  />
                )}
                <span className="relative">PROCHAINS MATCHS</span>
              </button>
            </div>

            {/* Tab content : fondu + léger glissement à chaque changement. */}
            <motion.div
              key={championnatTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
            >
            {championnatTab === 'classement' ? (
              <div className="bg-white rounded-lg border border-slate-200 shadow-2xs overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase border-b border-slate-200">
                    <tr>
                      <th className="py-2 px-2 text-center w-8">#</th>
                      <th className="py-2 px-2">ÉQUIPE</th>
                      <th className="py-2 px-1 text-center font-mono">J</th>
                      <th className="py-2 px-1 text-center font-mono">G</th>
                      <th className="py-2 px-1 text-center font-mono">N</th>
                      <th className="py-2 px-1 text-center font-mono">P</th>
                      <th className="py-2 px-1 text-center font-mono">+/-</th>
                      <th className="py-2 px-2 text-center font-mono font-bold text-[#006039]">PTS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {top5Clubs.map((club, idx) => (
                      <tr
                        key={club.id}
                        onClick={() => onSelectClub(club)}
                        className="hover:bg-slate-50 transition-colors cursor-pointer group"
                      >
                        <td className="py-2.5 px-2 text-center font-bold font-mono text-slate-600">
                          {idx + 1}
                        </td>
                        <td className="py-2.5 px-2">
                          <div className="flex items-center gap-2">
                            <ClubBadge id={club.id} size="xs" />
                            <span className="font-bold text-slate-900 group-hover:text-[#006039] truncate max-w-[110px]">
                              {club.name}
                            </span>
                          </div>
                        </td>
                        <td className="py-2.5 px-1 text-center font-mono text-slate-600">{club.stats.played}</td>
                        <td className="py-2.5 px-1 text-center font-mono text-slate-600">{club.stats.won}</td>
                        <td className="py-2.5 px-1 text-center font-mono text-slate-600">{club.stats.drawn}</td>
                        <td className="py-2.5 px-1 text-center font-mono text-slate-600">{club.stats.lost}</td>
                        <td className="py-2.5 px-1 text-center font-mono font-medium text-slate-700">
                          {club.stats.goalDiff > 0 ? `+${club.stats.goalDiff}` : club.stats.goalDiff}
                        </td>
                        <td className="py-2.5 px-2 text-center font-mono font-black text-slate-900 bg-slate-50/80">
                          {club.stats.points}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <ul className="bg-white rounded-lg border border-slate-200 shadow-2xs divide-y divide-slate-100 overflow-hidden">
                {MATCHES_DATA.filter((m) => m.journee === 3).slice(0, 3).map((match) => (
                  <MatchRow
                    key={match.id}
                    variant="compact"
                    match={match}
                    homeClub={CLUBS_DATA.find((c) => c.id === match.homeTeamId)}
                    awayClub={CLUBS_DATA.find((c) => c.id === match.awayTeamId)}
                    onSelectMatch={onSelectMatch}
                    onSelectClub={onSelectClub}
                  />
                ))}
                <li className="p-2.5 bg-slate-50 border-t border-slate-100 text-center list-none">
                  <button
                    onClick={() => onNavigate('calendrier')}
                    className="text-xs font-bold text-[#ea580c] hover:text-[#c2410c] flex items-center justify-center gap-1.5 w-full uppercase transition-colors cursor-pointer"
                  >
                    <span>Consulter le calendrier complet</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </li>
              </ul>
            )}
            </motion.div>
          </div>

          {/* Column 3: LES COMPÉTITIONS (4 cols on lg) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b-2 border-slate-200">
              <h2 className="text-base sm:text-lg font-black text-slate-900 uppercase tracking-tight">
                LES COMPÉTITIONS
              </h2>
              <button
                onClick={() => onNavigate('competitions')}
                className="text-xs font-bold text-slate-500 hover:text-[#ea580c] flex items-center gap-1 transition-colors uppercase"
              >
                <span>Voir tout</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <Stagger className="space-y-3.5">
              {majorComps.map((comp, i) => (
                <StaggerItem key={comp.id} index={i}>
                <div
                  onClick={() => onSelectCompetition(comp)}
                  className="fimf-card-lift group bg-white rounded-lg border border-slate-200/90 overflow-hidden shadow-2xs hover:shadow-md cursor-pointer flex items-center p-3 gap-3.5"
                >
                  <div className="w-20 h-20 rounded-md overflow-hidden bg-slate-900 shrink-0">
                    <img
                      src={comp.image}
                      alt={comp.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-tight group-hover:text-[#ea580c] transition-colors truncate">
                      {comp.title}
                    </h3>
                    <p className="text-[11px] text-slate-600 line-clamp-2 mt-0.5 leading-snug">
                      {comp.subtitle}
                    </p>
                    <div className="mt-2 flex items-center text-[10px] font-bold text-[#ea580c] uppercase">
                      <span className="w-5 h-5 rounded-full bg-orange-100 flex items-center justify-center group-hover:bg-[#ea580c] group-hover:text-white transition-colors">
                        <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                      </span>
                    </div>
                  </div>
                </div>
                </StaggerItem>
              ))}
            </Stagger>
          </div>
        </div>
      </section>

      {/* 3.5. MES CLUBS (Section Favoris localStorage) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal>
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between pb-2 border-b-2 border-slate-200 gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-amber-500 text-white flex items-center justify-center shadow-xs">
                <Star className="w-4 h-4 fill-white" />
              </div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                <span>MES CLUBS</span>
                {favoriteClubs.length > 0 && (
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900">
                    {favoriteClubs.length} {favoriteClubs.length === 1 ? 'club suivi' : 'clubs suivis'}
                  </span>
                )}
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onNavigate('equipes')}
                className="text-xs font-bold text-slate-500 hover:text-[#ea580c] flex items-center gap-1 transition-colors uppercase cursor-pointer"
              >
                <span>Gérer les clubs</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {favoriteClubs.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {favoriteClubs.map((club) => {
                const nextMatchOfClub = getClubNextMatch(club.id);
                const opponentId =
                  nextMatchOfClub?.homeTeamId === club.id
                    ? nextMatchOfClub?.awayTeamId
                    : nextMatchOfClub?.homeTeamId;
                const opponentClub = opponentId
                  ? CLUBS_DATA.find((c) => c.id === opponentId)
                  : null;

                return (
                  <div
                    key={club.id}
                    className="relative bg-white rounded-xl border border-slate-200 shadow-2xs hover:shadow-md transition-all p-4.5 flex flex-col justify-between group"
                  >
                    {/* Unfollow button top-right */}
                    {onToggleFavorite && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleFavorite(club.id);
                        }}
                        className="absolute top-3.5 right-3.5 p-1.5 rounded-full bg-amber-50 hover:bg-amber-100 text-amber-600 transition-colors"
                        title="Ne plus suivre ce club"
                        aria-label="Ne plus suivre ce club"
                      >
                        <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                      </button>
                    )}

                    <div>
                      {/* Club Header */}
                      <div className="flex items-center gap-3 pr-8">
                        <ClubBadge id={club.id} size="md" />
                        <div className="min-w-0">
                          <h3
                            onClick={() => onSelectClub(club)}
                            className="font-black text-sm text-slate-900 group-hover:text-[#006039] transition-colors truncate cursor-pointer uppercase"
                          >
                            {club.name}
                          </h3>
                          <p className="text-[11px] text-slate-500 truncate">
                            {club.commune} • {club.division}
                          </p>
                        </div>
                      </div>

                      {/* Rank & Stats row */}
                      <div className="grid grid-cols-3 gap-2 my-3 p-2 bg-slate-50 rounded-lg text-center text-xs">
                        <div>
                          <span className="text-[10px] text-slate-500 font-semibold block uppercase">Rang</span>
                          <span className="font-black text-emerald-800">{club.stats.rank}ᵉ</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 font-semibold block uppercase">Points</span>
                          <span className="font-black text-[#ea580c]">{club.stats.points} pts</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 font-semibold block uppercase">Diff</span>
                          <span className="font-bold text-slate-800">
                            {club.stats.goalDiff > 0 ? `+${club.stats.goalDiff}` : club.stats.goalDiff}
                          </span>
                        </div>
                      </div>

                      {/* Next Match or Form */}
                      {nextMatchOfClub && opponentClub ? (
                        <div
                          onClick={() => onSelectMatch(nextMatchOfClub)}
                          className="p-2.5 bg-orange-50/70 border border-orange-100 rounded-lg text-xs cursor-pointer hover:bg-orange-100/70 transition-colors mb-3"
                        >
                          <div className="flex items-center justify-between text-[10px] font-bold text-orange-950 uppercase mb-1">
                            <span>PROCHAIN MATCH</span>
                            <span className="text-orange-700">{nextMatchOfClub.timeStr}</span>
                          </div>
                          <div className="flex items-center justify-between font-bold text-slate-900 text-xs">
                            <span className="truncate">{nextMatchOfClub.dateStr.split(' ')[0]} {nextMatchOfClub.dateStr.split(' ')[1]}</span>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className="text-[10px] text-slate-500 font-normal">vs</span>
                              <ClubBadge id={opponentClub.id} size="xs" />
                              <span className="text-slate-800 truncate max-w-[80px]">{opponentClub.shortName}</span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="p-2.5 bg-slate-50 rounded-lg text-xs mb-3">
                          <span className="text-[10px] text-slate-500 uppercase font-semibold block mb-1">
                            Forme récente
                          </span>
                          <div className="flex items-center gap-1.5">
                            {club.form.map((res, i) => (
                              <span
                                key={i}
                                className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-black ${
                                  res === 'W'
                                    ? 'bg-emerald-600 text-white'
                                    : res === 'D'
                                    ? 'bg-slate-400 text-white'
                                    : 'bg-rose-500 text-white'
                                }`}
                              >
                                {res}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* View Profile Action */}
                    <button
                      onClick={() => onSelectClub(club)}
                      className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-bold text-[#006039] bg-emerald-50 hover:bg-emerald-100/90 rounded-lg transition-colors uppercase cursor-pointer"
                    >
                      <span>Voir la fiche</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}

              {/* Add club shortcut card if user hasn't favorited all clubs */}
              {favoriteClubs.length < CLUBS_DATA.length && (
                <div
                  onClick={() => onNavigate('equipes')}
                  className="bg-dashed border-2 border-dashed border-slate-300 hover:border-[#ea580c] rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer group transition-colors min-h-[220px]"
                >
                  <div className="w-10 h-10 rounded-full bg-slate-100 group-hover:bg-orange-100 text-slate-400 group-hover:text-[#ea580c] flex items-center justify-center mb-2 transition-colors">
                    <Plus className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-xs sm:text-sm text-slate-800 group-hover:text-[#ea580c] uppercase">
                    Suivre un autre club
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-1 max-w-[180px]">
                    Ajoutez d'autres équipes pour recevoir leurs actualités en premier
                  </p>
                </div>
              )}
            </div>
          ) : (
            /* Empty State: Prompt user to pick favorites */
            <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-6 sm:p-8 text-center">
              <div className="max-w-xl mx-auto space-y-3">
                <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center mx-auto">
                  <Star className="w-6 h-6" />
                </div>
                <h3 className="text-base sm:text-lg font-black text-slate-900 uppercase">
                  Suivez vos clubs préférés
                </h3>
                <p className="text-xs sm:text-sm text-slate-600">
                  Choisissez une ou plusieurs équipes pour suivre instantanément leur position, leurs prochains matchs et leurs effectifs depuis votre accueil.
                </p>

                {/* Quick Add Pills */}
                <div className="pt-3">
                  <p className="text-[11px] font-bold text-slate-400 uppercase mb-3">
                    Sélection rapide en 1 clic :
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    {CLUBS_DATA.map((club) => (
                      <button
                        key={club.id}
                        onClick={() => onToggleFavorite && onToggleFavorite(club.id)}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-300 hover:border-amber-400 bg-slate-50 hover:bg-amber-50 text-xs font-bold text-slate-800 transition-all cursor-pointer shadow-2xs group"
                      >
                        <ClubBadge id={club.id} size="xs" />
                        <span>{club.name}</span>
                        <Plus className="w-3.5 h-3.5 text-amber-500 group-hover:scale-125 transition-transform" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        </Reveal>
      </section>

      {/* 3.8. JEU DE PRONOSTICS LUDIQUE */}
      <PronosticsModule
        matches={MATCHES_DATA}
        onSelectMatch={onSelectMatch}
        onSelectClub={onSelectClub}
        onOpenAuth={onOpenAuth ?? (() => undefined)}
        onMemberArea={onMemberArea ?? (() => undefined)}
      />

      {/* 3.9. NOS GAGNANTS (tirages officiels — invisible tant qu'aucun tirage) */}
      <WinnersShowcase />

      {/* 4. LA FIMF EN CHIFFRES */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal>
        <div className="space-y-4">
          <div className="pb-2 border-b-2 border-slate-200">
            <h2 className="text-base sm:text-lg font-black text-slate-900 uppercase tracking-tight">
              LA FIMF EN CHIFFRES
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200 text-center shadow-2xs hover:shadow transition-shadow">
              <div className="w-10 h-10 mx-auto rounded-full bg-emerald-50 text-[#006039] flex items-center justify-center mb-2">
                <Shield className="w-5 h-5" />
              </div>
              <p className="text-2xl sm:text-3xl font-black text-[#006039] tabular-nums">
                <Counter value={FIMF_STATS.clubsCount} />
              </p>
              <p className="text-[11px] font-bold text-slate-500 uppercase mt-1">
                {FIMF_STATS.clubsLabel}
              </p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 text-center shadow-2xs hover:shadow transition-shadow">
              <div className="w-10 h-10 mx-auto rounded-full bg-orange-50 text-[#ea580c] flex items-center justify-center mb-2">
                <Users className="w-5 h-5" />
              </div>
              <p className="text-2xl sm:text-3xl font-black text-[#ea580c] tabular-nums">
                <Counter value={FIMF_STATS.playersCount} />
              </p>
              <p className="text-[11px] font-bold text-slate-500 uppercase mt-1">
                {FIMF_STATS.playersLabel}
              </p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 text-center shadow-2xs hover:shadow transition-shadow">
              <div className="w-10 h-10 mx-auto rounded-full bg-emerald-50 text-[#006039] flex items-center justify-center mb-2">
                <Award className="w-5 h-5" />
              </div>
              <p className="text-2xl sm:text-3xl font-black text-[#006039] tabular-nums">
                <Counter value={FIMF_STATS.refereesCount} />
              </p>
              <p className="text-[11px] font-bold text-slate-500 uppercase mt-1">
                {FIMF_STATS.refereesLabel}
              </p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 text-center shadow-2xs hover:shadow transition-shadow">
              <div className="w-10 h-10 mx-auto rounded-full bg-orange-50 text-[#ea580c] flex items-center justify-center mb-2">
                <TrendingUp className="w-5 h-5" />
              </div>
              <p className="text-2xl sm:text-3xl font-black text-[#ea580c] tabular-nums">
                <Counter value={FIMF_STATS.pitchesCount} />
              </p>
              <p className="text-[11px] font-bold text-slate-500 uppercase mt-1">
                {FIMF_STATS.pitchesLabel}
              </p>
            </div>
          </div>
        </div>
        </Reveal>
      </section>

      {/* 5. GALERIE PHOTOS & NOS PARTENAIRES ROW */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* GALERIE PHOTOS (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b-2 border-slate-200">
              <h2 className="text-base sm:text-lg font-black text-slate-900 uppercase tracking-tight">
                GALERIE PHOTOS
              </h2>
              <button
                onClick={() => onNavigate('galerie')}
                className="text-xs font-bold text-slate-500 hover:text-[#ea580c] flex items-center gap-1 transition-colors uppercase"
              >
                <span>Voir tout</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-5 gap-2 sm:gap-3">
              {GALLERY_PHOTOS.slice(0, 5).map((photo, idx) => (
                <div
                  key={photo.id}
                  onClick={() => onOpenPhotoLightbox(idx)}
                  className="group relative aspect-square rounded-lg overflow-hidden bg-slate-900 cursor-pointer shadow-2xs hover:shadow-md transition-shadow"
                >
                  <img
                    src={photo.image}
                    alt={photo.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                    <span className="text-[10px] font-bold uppercase px-1 text-center">Zoom</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* NOS PARTENAIRES (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b-2 border-slate-200">
              <h2 className="text-base sm:text-lg font-black text-slate-900 uppercase tracking-tight">
                NOS PARTENAIRES
              </h2>
              <div className="flex items-center gap-1">
                <button
                  onClick={handlePartnerPrev}
                  className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                  aria-label="Partenaire précédent"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={handlePartnerNext}
                  className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                  aria-label="Partenaire suivant"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2.5">
              {PARTNERS.slice(0, 4).map((partner) => (
                <div
                  key={partner.id}
                  className="fimf-card-lift h-20 bg-white rounded-lg border border-slate-200/90 flex flex-col items-center justify-center p-2 text-center shadow-2xs hover:border-[#ea580c] hover:shadow-md"
                >
                  <span className="text-xs font-black tracking-tight text-slate-400 uppercase">
                    LOGO
                  </span>
                  <span className="text-[9.5px] font-medium text-slate-500 line-clamp-1 mt-1">
                    {partner.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
        </Reveal>
      </section>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// Composants de la section « Grandes échéances 2026-2027 »
// ─────────────────────────────────────────────────────────────

/** Compte à rebours en temps réel vers le coup d'envoi de la CAN Guinée 2027. */
const CanCountdown: React.FC = () => {
  const t = useCountdown(CAN_GUINEE_2027_DATE);
  const units: { value: number; label: string }[] = [
    { value: t.days, label: 'Jours' },
    { value: t.hours, label: 'Heures' },
    { value: t.minutes, label: 'Min' },
    { value: t.seconds, label: 'Sec' },
  ];
  return (
    <div className="relative mt-6">
      <p className="text-[10px] font-black uppercase tracking-widest text-emerald-100 mb-2">
        Coup d'envoi dans
      </p>
      <div className="grid grid-cols-4 gap-2">
        {units.map((u) => (
          <div
            key={u.label}
            className="bg-white/10 backdrop-blur-xs border border-white/20 rounded-lg py-2.5 text-center"
          >
            <p className="text-lg sm:text-2xl font-black tabular-nums leading-none">
              {String(u.value).padStart(2, '0')}
            </p>
            <p className="text-[9px] font-bold uppercase tracking-wider text-emerald-100 mt-1">
              {u.label}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

interface EcheanceCardProps {
  echeance: (typeof GRANDES_ECHEANCES)[number];
}

/** Carte d'une échéance internationale avec compte à rebours en jours. */
const EcheanceCard: React.FC<EcheanceCardProps> = ({ echeance }) => {
  const c = useCountdown(echeance.targetDate);
  const dLabel =
    c.days > 0
      ? `J-${c.days}`
      : c.hours > 0 || c.minutes > 0 || c.seconds > 0
        ? 'En cours'
        : 'À venir';
  return (
    <div
      className={`p-4 rounded-lg border ${echeance.ring} bg-slate-50/60 flex flex-col gap-2 hover:shadow transition-shadow`}
    >
      <div className="flex items-center justify-between">
        <span
          className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wide ${echeance.chip}`}
        >
          {echeance.badge}
        </span>
        <span className={`shrink-0 ${echeance.accent}`}>{ECHEANCE_ICONS[echeance.icon]}</span>
      </div>
      <h3 className="font-black text-slate-900 text-xs uppercase leading-snug">{echeance.title}</h3>
      <p className="text-[11px] font-semibold text-[#006039]">{echeance.date}</p>
      <p className="text-[11px] text-slate-600 leading-relaxed flex-1">{echeance.desc}</p>
      <span className="inline-flex items-center gap-1 text-[10px] font-black text-[#ea580c] uppercase">
        {dLabel}
      </span>
    </div>
  );
};
