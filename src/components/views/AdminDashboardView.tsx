import React, { useState, useEffect } from 'react';
import { useAdminData, FimfPartner, FimfOfficial, FimfCommission } from '@/src/hooks/useAdminData';
import type { MemberRequestStatus } from '@/src/lib/fimfApi';
import { Club, Match, NewsArticle, Competition, GalleryPhoto, HeroSlide, Player } from '@/src/data/fimfData';
import { SponsoringModule } from '../admin/sponsoring/SponsoringModule';
import { ClubBadge } from '../ClubBadge';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../ToastProvider';
import { ImageUploadField } from '../admin/ImageUploadField';
import { AdminGamesTab } from '../admin/AdminGamesTab';
import { fetchGamePeriods } from '@/src/lib/fimfApi';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  LayoutDashboard,
  Shield,
  Calendar,
  Newspaper,
  Trophy,
  Image,
  TrendingUp,
  Handshake,
  FileText,
  Plus,
  Trash2,
  Edit3,
  Check,
  X,
  AlertTriangle,
  RotateCcw,
  Search,
  ExternalLink,
  Users,
  Award,
  Sparkles,
  Lock,
  LogOut,
  Save,
  CheckCircle2,
  Bell,
  Settings,
  ChevronRight,
  Filter,
  Eye,
  Activity,
  ArrowUpRight,
  Download,
  Menu,
  Mail,
  UserPlus,
  HeartHandshake,
} from 'lucide-react';

interface AdminDashboardViewProps {
  onExit: () => void;
  onSelectClub: (club: Club) => void;
  onSelectMatch: (match: Match) => void;
  onSelectArticle: (article: NewsArticle) => void;
  onSelectCompetition: (comp: Competition) => void;
}

type AdminTab =
  | 'overview'
  | 'officials'
  | 'commissions'
  | 'matches'
  | 'clubs'
  | 'news'
  | 'competitions'
  | 'hero'
  | 'gallery'
  | 'stats'
  | 'partners'
  | 'sponsoring'
  | 'members'
  | 'games'
  | 'logs';

/** Pages de navigation proposées pour les boutons des slides hero. */
const HERO_NAV_PAGES: { value: string; label: string }[] = [
  { value: 'accueil', label: "Page d'accueil" },
  { value: 'la-fimf', label: 'La FIMF (institutionnel)' },
  { value: 'championnat', label: 'Championnat National' },
  { value: 'calendrier', label: 'Calendrier des matchs' },
  { value: 'competitions', label: 'Compétitions' },
  { value: 'equipes', label: 'Équipes & Clubs' },
  { value: 'classement', label: 'Classement' },
  { value: 'actualites', label: 'Actualités' },
  { value: 'galerie', label: 'Galerie photos' },
  { value: 'contact', label: 'Contact' },
];

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({
  onExit,
  onSelectClub,
  onSelectMatch,
  onSelectArticle,
  onSelectCompetition,
}) => {
  const { signOut } = useAuth();
  const {
    clubs,
    matches,
    news,
    competitions,
    gallery,
    heroSlides,
    fimfStats,
    partners,
    officials,
    commissions,
    sponsorRequests,
    memberRequests,
    updateMemberStatus,
    logs,
    loading,
    myRole,
    myClubId,
    saveClub,
    deleteClub,
    saveMatch,
    deleteMatch,
    saveNews,
    deleteNews,
    saveCompetition,
    deleteCompetition,
    saveGalleryPhoto,
    deleteGalleryPhoto,
    saveHeroSlide,
    deleteHeroSlide,
    saveStats,
    savePartner,
    deletePartner,
    saveOfficial,
    deleteOfficial,
    saveCommission,
    deleteCommission,
    resetToFactoryDefaults,
  } = useAdminData();

  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const toast = useToast();

  // Compteur de périodes de jeu pour le badge de navigation
  const [gamePeriods, setGamePeriods] = useState<{ id: number }[]>([]);
  useEffect(() => {
    let cancelled = false;
    fetchGamePeriods()
      .then((ps) => {
        if (!cancelled) setGamePeriods(ps);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  // Modals state
  const [editingOfficial, setEditingOfficial] = useState<FimfOfficial | null>(null);
  const [editingCommission, setEditingCommission] = useState<FimfCommission | null>(null);
  const [editingClub, setEditingClub] = useState<Club | null>(null);
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);
  const [editingNews, setEditingNews] = useState<NewsArticle | null>(null);
  const [editingComp, setEditingComp] = useState<Competition | null>(null);
  const [editingPhoto, setEditingPhoto] = useState<GalleryPhoto | null>(null);
  const [editingPartner, setEditingPartner] = useState<FimfPartner | null>(null);
  const [editingHero, setEditingHero] = useState<HeroSlide | null>(null);
  const [editingStats, setEditingStats] = useState(fimfStats);
  // Index du joueur en cours d'édition dans la fiche club (modale squad)
  const [editingPlayerIdx, setEditingPlayerIdx] = useState<number | null>(null);

  // Ferme la modale ouverte avec la touche Échap
  useEffect(() => {
    if (!editingOfficial && !editingCommission && !editingClub && !editingMatch && !editingNews && !editingComp && !editingPhoto && !editingPartner && !editingHero) {
      return;
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setEditingOfficial(null);
        setEditingCommission(null);
        setEditingClub(null);
        setEditingMatch(null);
        setEditingNews(null);
        setEditingComp(null);
        setEditingPhoto(null);
        setEditingPartner(null);
        setEditingHero(null);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [editingOfficial, editingCommission, editingClub, editingMatch, editingNews, editingComp, editingPhoto, editingPartner, editingHero]);

  /**
   * Canal de retour du back-office.
   * - `success` : bandeau vert en haut de page (desktop).
   * - `error`   : toast rouge, visible aussi sur mobile — le bandeau est
   *               masqué en dessous de `md`, une erreur d'écriture ne doit
   *               jamais passer inaperçue.
   */
  const showFeedback = (msg: string, tone: 'success' | 'error' = 'success') => {
    if (tone === 'error') {
      toast.error('Action refusée', msg);
      return;
    }
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(null), 3500);
  };

  const isAdmin = myRole === 'admin';

  // Metrics
  const totalClubs = clubs.length;
  const totalMatches = matches.length;
  const finishedMatches = matches.filter((m) => m.status === 'finished').length;
  const scheduledMatches = matches.filter((m) => m.status === 'scheduled').length;
  const liveMatches = matches.filter((m) => m.status === 'live').length;
  const totalArticles = news.length;
  const totalCompetitions = competitions.length;
  const totalPhotos = gallery.length;
  const totalHeroSlides = heroSlides.length;

  // Chart data 1: Goals scored by club
  const chartGoalsData = clubs.slice(0, 6).map((c) => ({
    name: c.shortName,
    buts: c.stats.goalsFor,
    encaisses: c.stats.goalsAgainst,
  }));

  // Chart data 2: Competition license growth simulation
  const chartLicencesData = [
    { mois: 'Mai', licences: 850 },
    { mois: 'Juin', licences: 1100 },
    { mois: 'Juil', licences: 1420 },
    { mois: 'Août', licences: 1780 },
    { mois: 'Sept', licences: 2150 },
  ];

  // Chart data 3: Match distribution
  const chartMatchStatusData = [
    { name: 'Terminés', value: finishedMatches, color: '#10b981' },
    { name: 'Programmés', value: scheduledMatches, color: '#f97316' },
    { name: 'En Direct', value: Math.max(liveMatches, 1), color: '#ef4444' },
  ];

  const ALL_NAV_ITEMS = [
    { id: 'overview', label: 'Dashboard', icon: LayoutDashboard, badge: '' },
    { id: 'officials', label: 'Dirigeants & Membres', icon: Users, badge: `${officials.length}` },
    { id: 'commissions', label: 'Commissions Spécialisées', icon: Award, badge: `${commissions.length}` },
    { id: 'matches', label: 'Matchs & Scores', icon: Calendar, badge: `${totalMatches}` },
    { id: 'clubs', label: 'Clubs & Effectifs', icon: Shield, badge: `${totalClubs}` },
    { id: 'news', label: 'Presse & Médias', icon: Newspaper, badge: `${totalArticles}` },
    { id: 'competitions', label: 'Compétitions', icon: Trophy, badge: `${totalCompetitions}` },
    { id: 'hero', label: 'Carrousel Accueil (Hero)', icon: Sparkles, badge: `${totalHeroSlides}` },
    { id: 'gallery', label: 'Médiathèque', icon: Image, badge: `${totalPhotos}` },
    { id: 'stats', label: 'Chiffres Clés', icon: TrendingUp, badge: '4' },
    { id: 'partners', label: 'Partenaires', icon: Handshake, badge: `${partners.length}` },
    { id: 'sponsoring', label: 'Sponsoring', icon: HeartHandshake, badge: `${sponsorRequests.filter((r) => r.status === 'nouvelle').length}` },
    { id: 'members', label: "Demandes d'Adhésion", icon: UserPlus, badge: `${memberRequests.filter((r) => r.status === 'nouvelle').length || memberRequests.length}` },
    { id: 'games', label: 'Jeux & Pronostics', icon: Trophy, badge: `${gamePeriods.length || ''}` },
    { id: 'logs', label: 'Journal d’Audit', icon: FileText, badge: `${logs.length}` },
  ];

  // Un dirigeant ne voit que son club et les rencontres qui le concernent :
  // le contenu fédéral (dirigeants, commissions, presse, compétitions, galerie,
  // chiffres clés, partenaires, journal d'audit) reste réservé à l'admin.
  const NAV_ITEMS = isAdmin
    ? ALL_NAV_ITEMS
    : ALL_NAV_ITEMS.filter((item) => item.id === 'overview' || item.id === 'clubs' || item.id === 'matches');

  // Si la session passe d'admin à dirigeant (ou inversement) et que l'onglet
  // actif n'est plus autorisé, on revient au dashboard.
  useEffect(() => {
    if (!NAV_ITEMS.some((item) => item.id === activeTab)) {
      setActiveTab('overview');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  // Les membres « simples » n'entrent pas dans la console : ils disposent de
  // leur espace dédié (bouton MON ESPACE). Admin fédéral et dirigeants passent.
  // NB : placé après TOUS les hooks du composant (règle des hooks React).
  if (!loading && myRole === null) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-md text-center space-y-4">
          <Lock className="w-10 h-10 text-amber-500 mx-auto" />
          <h2 className="text-lg font-black text-slate-900 uppercase">Accès réservé</h2>
          <p className="text-sm text-slate-600">
            Cet espace est réservé aux administrateurs fédéraux et aux dirigeants de clubs.
            Votre espace personnel est accessible via le bouton MON ESPACE du site.
          </p>
          <button
            onClick={onExit}
            className="px-5 py-2.5 rounded-xl bg-[#004724] hover:bg-[#006039] text-white text-xs font-black uppercase cursor-pointer"
          >
            Retour au site
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col font-sans">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs lg:hidden"
        />
      )}

      <div className="flex-1 flex overflow-hidden">
        {/* ========================================================================= */}
        {/* SIDEBAR (Creative Tim Style: Floating card / Dark Sleek / Gradient Brand) */}
        {/* ========================================================================= */}
        <aside
          className={`fixed lg:static inset-y-0 left-0 z-50 w-72 m-0 lg:m-4 lg:rounded-3xl bg-slate-900 text-white flex flex-col justify-between shadow-2xl transition-transform duration-300 ease-in-out shrink-0 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          }`}
        >
          <div>
            {/* Brand Header */}
            <div className="p-6 border-b border-slate-800/80 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#006039] to-[#ea580c] flex items-center justify-center font-black text-white text-xl shadow-lg shadow-emerald-950/40">
                  ⚽
                </div>
                <div>
                  <h1 className="text-sm font-black tracking-tight text-white uppercase">
                    FIMF ADMIN
                  </h1>
                  <p className="text-[10px] font-bold text-emerald-400 tracking-wider uppercase">
                    Fédération Mini-Football
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation links */}
            <div className="p-4 space-y-1.5">
              <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-3 py-1">
                PAGES & CONTRÔLE
              </div>

              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id as AdminTab);
                      setSidebarOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                      isActive
                        ? 'bg-gradient-to-r from-[#ea580c] to-[#f97316] text-white shadow-lg shadow-orange-500/25 font-black scale-[1.02]'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
                          isActive ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="tracking-wide">{item.label}</span>
                    </div>

                    {item.badge && (
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                          isActive
                            ? 'bg-black/25 text-white'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sidebar Footer Pro-Card */}
          <div className="p-4 border-t border-slate-800/80">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-950/70 via-slate-800 to-slate-900 border border-emerald-700/30 text-center relative overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-2">
                <Sparkles className="w-4 h-4" />
              </div>
              <h5 className="text-xs font-black text-white uppercase">Accès Super-Admin</h5>
              <p className="text-[11px] text-slate-300 mt-1 leading-tight">
                Tous les droits d'écriture & modification sont accordés.
              </p>
              <button
                onClick={() => {
                  if (
                    window.confirm(
                      'Voulez-vous rétablir les données d’origine certifiées de la FIMF ?'
                    )
                  ) {
                    resetToFactoryDefaults();
                    showFeedback('Données FIMF réinitialisées avec succès');
                  }
                }}
                className="mt-3 w-full py-1.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 text-[11px] font-bold border border-slate-700 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Rétablir Défaut</span>
              </button>
            </div>
          </div>
        </aside>

        {/* ========================================================================= */}
        {/* MAIN WORKSPACE: NAVBAR + CONTENT */}
        {/* ========================================================================= */}
        <div className="flex-1 flex flex-col overflow-x-hidden overflow-y-auto">
          {/* Creative Tim Floating Glass Navbar */}
          <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-2xs">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
              >
                <Menu className="w-5 h-5" />
              </button>

              <div>
                <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400 uppercase">
                  <span>FIMF Admin</span>
                  <span>/</span>
                  <span className="text-slate-800 capitalize font-extrabold">{activeTab}</span>
                </div>
                <h2 className="text-base sm:text-lg font-black text-slate-900 capitalize">
                  {NAV_ITEMS.find((n) => n.id === activeTab)?.label || 'Administration'}
                </h2>
              </div>
            </div>

            {/* Top Right Actions */}
            <div className="flex items-center gap-2.5 sm:gap-4">
              {feedbackMsg && (
                <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold animate-fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>{feedbackMsg}</span>
                </div>
              )}

              {/* Live search input */}
              <div className="relative hidden sm:block">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Recherche rapide..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-4 py-1.5 bg-slate-100/80 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#ea580c]/50 w-44 lg:w-56"
                />
              </div>

              {/* Notification icon pill */}
              <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 relative">
                <Bell className="w-4 h-4" />
                <span className="w-2 h-2 rounded-full bg-[#ea580c] absolute top-2 right-2 ring-2 ring-white"></span>
              </div>

              {/* Exit to Public Portal */}
              <button
                onClick={() => { signOut(); onExit(); }}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-slate-900 to-slate-800 hover:from-black hover:to-slate-900 text-white text-xs font-black uppercase transition-all shadow-sm cursor-pointer select-none"
              >
                <LogOut className="w-3.5 h-3.5 text-[#ea580c]" />
                <span className="hidden sm:inline">Quitter Admin</span>
              </button>
            </div>
          </header>

          {/* Content Body */}
          <main className="p-4 sm:p-6 lg:p-8 space-y-6 flex-1">
            {/* ------------------------------------------------------------- */}
            {/* TAB 1: OVERVIEW (Material / Argon Style Floating Cards & Recharts) */}
            {/* ------------------------------------------------------------- */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* 4 Creative Tim Floating Gradient Metric Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                  {/* Card 1: Clubs */}
                  <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-md shadow-slate-200/50 flex items-center justify-between relative overflow-hidden group hover:-translate-y-1 transition-transform">
                    <div className="space-y-1">
                      <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                        Clubs Homologués
                      </span>
                      <h3 className="text-2xl font-black text-slate-900 font-mono">
                        {totalClubs}
                      </h3>
                      <p className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                        <span>+100% conformes</span>
                        <ArrowUpRight className="w-3 h-3" />
                      </p>
                    </div>
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#006039] to-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-600/30 shrink-0">
                      <Shield className="w-7 h-7" />
                    </div>
                  </div>

                  {/* Card 2: Matches */}
                  <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-md shadow-slate-200/50 flex items-center justify-between relative overflow-hidden group hover:-translate-y-1 transition-transform">
                    <div className="space-y-1">
                      <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                        Matchs FIMF
                      </span>
                      <h3 className="text-2xl font-black text-slate-900 font-mono">
                        {totalMatches}
                      </h3>
                      <p className="text-[11px] font-bold text-[#ea580c] flex items-center gap-1">
                        <span>{finishedMatches} terminés • {scheduledMatches} à venir</span>
                      </p>
                    </div>
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#ea580c] to-amber-500 text-white flex items-center justify-center shadow-lg shadow-orange-600/30 shrink-0">
                      <Calendar className="w-7 h-7" />
                    </div>
                  </div>

                  {/* Card 3: Articles */}
                  <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-md shadow-slate-200/50 flex items-center justify-between relative overflow-hidden group hover:-translate-y-1 transition-transform">
                    <div className="space-y-1">
                      <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                        Presse & Médias
                      </span>
                      <h3 className="text-2xl font-black text-slate-900 font-mono">
                        {totalArticles}
                      </h3>
                      <p className="text-[11px] font-bold text-sky-600 flex items-center gap-1">
                        <span>Articles officiels</span>
                        <ArrowUpRight className="w-3 h-3" />
                      </p>
                    </div>
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 text-white flex items-center justify-center shadow-lg shadow-sky-600/30 shrink-0">
                      <Newspaper className="w-7 h-7" />
                    </div>
                  </div>

                  {/* Card 4: Sponsors */}
                  <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-md shadow-slate-200/50 flex items-center justify-between relative overflow-hidden group hover:-translate-y-1 transition-transform">
                    <div className="space-y-1">
                      <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                        Partenaires Officiels
                      </span>
                      <h3 className="text-2xl font-black text-slate-900 font-mono">
                        {partners.length}
                      </h3>
                      <p className="text-[11px] font-bold text-amber-600 flex items-center gap-1">
                        <span>Sponsors actifs</span>
                        <ArrowUpRight className="w-3 h-3" />
                      </p>
                    </div>
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 text-white flex items-center justify-center shadow-lg shadow-amber-600/30 shrink-0">
                      <Handshake className="w-7 h-7" />
                    </div>
                  </div>
                </div>

                {/* Creative Tim Recharts Row: Goals Bar Chart + Licences Area Chart */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Chart 1: Attacking Stats (2 Cols) */}
                  <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-slate-100 shadow-md shadow-slate-200/40">
                    <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                      <div>
                        <h4 className="text-sm font-black text-slate-900 uppercase">
                          Statistiques Offensives & Défensives des Clubs
                        </h4>
                        <p className="text-xs text-slate-500">
                          Comparatif des buts inscrits vs buts encaissés (Division 1)
                        </p>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase">
                        Saison 2024-2025
                      </span>
                    </div>

                    <div className="h-64 mt-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartGoalsData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                          <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                          <Tooltip
                            contentStyle={{
                              borderRadius: '12px',
                              backgroundColor: '#0f172a',
                              color: '#fff',
                              border: 'none',
                              fontSize: '12px',
                            }}
                          />
                          <Bar dataKey="buts" name="Buts Inscrits" fill="#006039" radius={[6, 6, 0, 0]} />
                          <Bar dataKey="encaisses" name="Buts Encaissés" fill="#ea580c" radius={[6, 6, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Chart 2: Match Status Breakdown (1 Col) */}
                  <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-md shadow-slate-200/40 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                        <div>
                          <h4 className="text-sm font-black text-slate-900 uppercase">
                            Statut des Rencontres
                          </h4>
                          <p className="text-xs text-slate-500">
                            Répartition des journées FIMF
                          </p>
                        </div>
                        <Activity className="w-4 h-4 text-emerald-600" />
                      </div>

                      <div className="h-44 mt-3 flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={chartMatchStatusData}
                              cx="50%"
                              cy="50%"
                              innerRadius={48}
                              outerRadius={70}
                              paddingAngle={4}
                              dataKey="value"
                            >
                              {chartMatchStatusData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip
                              contentStyle={{
                                borderRadius: '12px',
                                backgroundColor: '#0f172a',
                                color: '#fff',
                                fontSize: '11px',
                              }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    <div className="space-y-1.5 pt-2 border-t border-slate-100">
                      {chartMatchStatusData.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: item.color }}
                            />
                            <span className="font-semibold text-slate-700">{item.name}</span>
                          </div>
                          <span className="font-bold font-mono text-slate-900">{item.value} matchs</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Quick Management Cards Strip */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div
                    onClick={() => setActiveTab('matches')}
                    className="p-5 bg-gradient-to-br from-emerald-900 to-emerald-950 text-white rounded-2xl shadow-lg shadow-emerald-950/20 cursor-pointer hover:scale-[1.01] transition-transform group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-wider text-amber-400">
                        GESTION DES SCORES
                      </span>
                      <Calendar className="w-5 h-5 text-emerald-400" />
                    </div>
                    <h4 className="text-base font-black mt-2">Programmation & Résultats</h4>
                    <p className="text-xs text-emerald-100/80 mt-1">
                      Mettez à jour les scores, validez les arbitres et publiez les comptes-rendus.
                    </p>
                    <div className="mt-4 flex items-center gap-1.5 text-xs font-bold text-amber-300">
                      <span>Accéder au module</span>
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>

                  <div
                    onClick={() => setActiveTab('clubs')}
                    className="p-5 bg-gradient-to-br from-slate-900 to-slate-950 text-white rounded-2xl shadow-lg shadow-slate-950/20 cursor-pointer hover:scale-[1.01] transition-transform group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-wider text-[#ea580c]">
                        AFFILIATIONS & LICENCES
                      </span>
                      <Shield className="w-5 h-5 text-orange-400" />
                    </div>
                    <h4 className="text-base font-black mt-2">Effectifs & Terrains</h4>
                    <p className="text-xs text-slate-300 mt-1">
                      Gestion des fiches techniques des clubs, homologations de stades et joueurs.
                    </p>
                    <div className="mt-4 flex items-center gap-1.5 text-xs font-bold text-[#ea580c]">
                      <span>Accéder aux clubs</span>
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>

                  <div
                    onClick={() => setActiveTab('news')}
                    className="p-5 bg-gradient-to-br from-[#ea580c] to-[#c2410c] text-white rounded-2xl shadow-lg shadow-orange-950/20 cursor-pointer hover:scale-[1.01] transition-transform group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-wider text-amber-200">
                        SALLE DE PRESSE
                      </span>
                      <Newspaper className="w-5 h-5 text-white" />
                    </div>
                    <h4 className="text-base font-black mt-2">Rédaction & Médias</h4>
                    <p className="text-xs text-orange-100 mt-1">
                      Rédigez les communiqués officiels et partagez les photos de compétitions.
                    </p>
                    <div className="mt-4 flex items-center gap-1.5 text-xs font-bold text-white">
                      <span>Rédiger un article</span>
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>

                {/* Audit Log Table in Card */}
                <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-md shadow-slate-200/40">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-[#ea580c]" />
                      <h4 className="text-sm font-black text-slate-900 uppercase">
                        Dernières Actions Opérationnelles
                      </h4>
                    </div>
                    <button
                      onClick={() => setActiveTab('logs')}
                      className="text-xs font-bold text-[#ea580c] hover:underline cursor-pointer"
                    >
                      Consulter l'historique complet ({logs.length})
                    </button>
                  </div>
                  <div className="divide-y divide-slate-100 pt-2">
                    {logs.slice(0, 4).map((log) => (
                      <div
                        key={log.id}
                        className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                          <span className="font-bold text-slate-900">{log.action}</span>
                          <span className="text-slate-500 font-medium">({log.target})</span>
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono">
                          <span>{log.author}</span>
                          <span>•</span>
                          <span>{log.timestamp}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* TAB: OFFICIALS & DIRIGEANTS FÉDÉRAUX */}
            {/* ------------------------------------------------------------- */}
            {activeTab === 'officials' && (
              <div className="space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                  <div>
                    <h3 className="text-base font-black text-slate-900 uppercase flex items-center gap-2">
                      <Users className="w-5 h-5 text-emerald-600" />
                      <span>Dirigeants & Membres du Conseil Fédéral ({officials.length})</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Gouvernance de la FIMF, mandats, délégations de signature et attributions statutaires.
                    </p>
                  </div>

                  <button
                    onClick={() =>
                      setEditingOfficial({
                        id: `off-${Date.now()}`,
                        name: 'Nouveau Dirigeant',
                        role: 'Membre du Conseil Fédéral',
                        department: 'Comité Exécutif',
                        email: 'contact@fimf.ci',
                        phone: '+225 07 00 00 00 00',
                        mandateStart: '2023',
                        mandateEnd: '2027',
                        status: 'Actif',
                        bio: 'Attributions statutaires au sein de la Fédération Ivoirienne de Mini-Football.',
                        powers: ['Participation aux votes AG', 'Représentation officielle'],
                      })
                    }
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#006039] to-emerald-700 hover:from-emerald-800 hover:to-[#006039] text-white text-xs font-black uppercase transition-all shadow-md shadow-emerald-700/20 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Ajouter un Dirigeant</span>
                  </button>
                </div>

                {/* Officials Grid (Creative Tim Card Design) */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {officials.map((off) => (
                    <div
                      key={off.id}
                      className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
                    >
                      <div>
                        {/* Header card */}
                        <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#006039] to-emerald-600 text-white flex items-center justify-center font-black text-sm shadow-md shadow-emerald-900/20 shrink-0">
                              {off.name
                                .split(' ')
                                .map((n) => n[0])
                                .join('')
                                .slice(0, 2)}
                            </div>
                            <div>
                              <h4 className="text-sm font-black text-slate-900">{off.name}</h4>
                              <span className="text-[11px] font-bold text-[#ea580c] block">
                                {off.role}
                              </span>
                            </div>
                          </div>

                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              off.status === 'Actif'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {off.status}
                          </span>
                        </div>

                        {/* Details */}
                        <div className="py-3.5 space-y-2 text-xs">
                          <div className="flex items-center justify-between text-slate-600">
                            <span className="font-semibold text-slate-400">Département :</span>
                            <span className="font-bold text-slate-800">{off.department}</span>
                          </div>
                          <div className="flex items-center justify-between text-slate-600">
                            <span className="font-semibold text-slate-400">Mandat :</span>
                            <span className="font-mono font-bold text-slate-800">
                              {off.mandateStart} - {off.mandateEnd}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-slate-600">
                            <span className="font-semibold text-slate-400">Email :</span>
                            <span className="font-medium text-slate-800 truncate max-w-[180px]">
                              {off.email}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-slate-600">
                            <span className="font-semibold text-slate-400">Téléphone :</span>
                            <span className="font-mono text-slate-800">{off.phone}</span>
                          </div>

                          <p className="text-[11px] text-slate-500 italic pt-1 leading-relaxed">
                            "{off.bio}"
                          </p>

                          {/* Powers pills */}
                          {off.powers && off.powers.length > 0 && (
                            <div className="pt-2 flex flex-wrap gap-1">
                              {off.powers.map((pow, idx) => (
                                <span
                                  key={idx}
                                  className="text-[10px] px-2 py-0.5 rounded-md bg-slate-50 border border-slate-200 text-slate-600 font-semibold"
                                >
                                  ✓ {pow}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Card Footer Actions */}
                      <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                        <button
                          onClick={() => setEditingOfficial(off)}
                          className="p-2 rounded-xl bg-slate-50 hover:bg-amber-100 text-amber-700 transition-colors cursor-pointer"
                          title="Modifier le profil et mandat"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm(`Supprimer le dirigeant ${off.name} ?`)) {
                              deleteOfficial(off.id);
                              showFeedback(`Dirigeant ${off.name} retiré`);
                            }
                          }}
                          className="p-2 rounded-xl bg-slate-50 hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer"
                          title="Supprimer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* TAB: COMMISSIONS FÉDÉRALES */}
            {/* ------------------------------------------------------------- */}
            {activeTab === 'commissions' && (
              <div className="space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                  <div>
                    <h3 className="text-base font-black text-slate-900 uppercase flex items-center gap-2">
                      <Award className="w-5 h-5 text-amber-500" />
                      <span>Commissions Spécialisées Fédérales ({commissions.length})</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Organes techniques, arbitrage, discipline, juridique et commission médicale.
                    </p>
                  </div>

                  <button
                    onClick={() =>
                      setEditingCommission({
                        id: `com-${Date.now()}`,
                        name: 'Nouvelle Commission Spécialisée',
                        president: 'Nom du Président',
                        membersCount: 5,
                        description: 'Attributions réglementaires et missions statutaires.',
                        meetingFrequency: 'Mensuelle',
                        nextMeeting: '10 Octobre 2025',
                        status: 'Active',
                      })
                    }
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-xs font-black uppercase transition-all shadow-md shadow-amber-500/20 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Créer une Commission</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {commissions.map((comm) => (
                    <div
                      key={comm.id}
                      className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-100">
                          <div>
                            <span className="text-[10px] font-black text-[#ea580c] uppercase tracking-wider block">
                              Organe Statutaire FIMF
                            </span>
                            <h4 className="text-sm sm:text-base font-black text-slate-900 mt-0.5">
                              {comm.name}
                            </h4>
                          </div>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              comm.status === 'Active'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                          >
                            {comm.status}
                          </span>
                        </div>

                        <div className="py-4 space-y-2.5 text-xs text-slate-600">
                          <p className="leading-relaxed text-slate-700">{comm.description}</p>

                          <div className="grid grid-cols-2 gap-2 pt-2">
                            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                              <span className="text-[10px] font-bold text-slate-400 block uppercase">
                                Présidence
                              </span>
                              <span className="font-bold text-slate-900">{comm.president}</span>
                            </div>
                            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                              <span className="text-[10px] font-bold text-slate-400 block uppercase">
                                Effectif Commission
                              </span>
                              <span className="font-bold text-emerald-700">
                                {comm.membersCount} membres
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-[11px] pt-1 text-slate-500">
                            <span>Fréquence : <b className="text-slate-800">{comm.meetingFrequency}</b></span>
                            <span>Prochaine séance : <b className="text-amber-600">{comm.nextMeeting}</b></span>
                          </div>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                        <button
                          onClick={() => setEditingCommission(comm)}
                          className="p-2 rounded-xl bg-slate-50 hover:bg-amber-100 text-amber-700 transition-colors cursor-pointer"
                          title="Modifier la commission"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm(`Supprimer la commission ${comm.name} ?`)) {
                              deleteCommission(comm.id);
                              showFeedback(`Commission ${comm.name} supprimée`);
                            }
                          }}
                          className="p-2 rounded-xl bg-slate-50 hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer"
                          title="Supprimer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* TAB 2: MATCHES & SCORES */}
            {/* ------------------------------------------------------------- */}
            {activeTab === 'matches' && (
              <div className="space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                  <div>
                    <h3 className="text-base font-black text-slate-900 uppercase flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-[#ea580c]" />
                      <span>Gestion des Matchs FIMF ({matches.length})</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Programmation, saisie des scores réels, changements de statut en direct.
                    </p>
                  </div>

                  <button
                    onClick={() =>
                      setEditingMatch({
                        id: `m-custom-${Date.now()}`,
                        journee: 4,
                        dateStr: 'Samedi 04 Octobre 2025',
                        timeStr: '16:00',
                        homeTeamId: isAdmin
                          ? clubs[0]?.id || 'as-plateau'
                          : myClubId || clubs[0]?.id || 'as-plateau',
                        awayTeamId: clubs[1]?.id || 'fc-riviera',
                        venue: 'Complexe Sportif de Bingerville',
                        status: 'scheduled',
                        scoreHome: 0,
                        scoreAway: 0,
                        competitionName: 'Championnat National D1',
                        roundName: 'Journée 4',
                        referee: 'Arbitre Fédéral FIMF',
                      })
                    }
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#006039] to-emerald-700 hover:from-emerald-800 hover:to-[#006039] text-white text-xs font-black uppercase transition-all shadow-md shadow-emerald-700/20 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Programmer un Match</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {matches.map((m) => {
                    const home = clubs.find((c) => c.id === m.homeTeamId);
                    const away = clubs.find((c) => c.id === m.awayTeamId);

                    return (
                      <div
                        key={m.id}
                        className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between text-[11px] pb-2.5 border-b border-slate-100">
                            <span className="font-black text-[#ea580c] uppercase">
                              {m.competitionName || 'Championnat'} • J{m.journee}
                            </span>
                            <span
                              className={`px-2.5 py-0.5 rounded-full font-bold uppercase text-[10px] ${
                                m.status === 'finished'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : m.status === 'live'
                                  ? 'bg-rose-500 text-white animate-pulse'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {m.status === 'finished' ? 'Terminé' : m.status === 'live' ? 'En Direct' : 'Prévu'}
                            </span>
                          </div>

                          <div className="py-4 flex items-center justify-between">
                            <div className="flex items-center gap-2.5 max-w-[42%]">
                              {home && <ClubBadge id={home.id} size="sm" />}
                              <span className="font-bold text-xs text-slate-900 truncate">
                                {home?.name || m.homeTeamId}
                              </span>
                            </div>

                            <div className="px-3.5 py-1.5 rounded-xl bg-slate-900 text-amber-400 font-mono font-black text-sm shadow-inner">
                              {m.status === 'finished' || m.status === 'live'
                                ? `${m.scoreHome} - ${m.scoreAway}`
                                : m.timeStr}
                            </div>

                            <div className="flex items-center justify-end gap-2.5 max-w-[42%] text-right">
                              <span className="font-bold text-xs text-slate-900 truncate">
                                {away?.name || m.awayTeamId}
                              </span>
                              {away && <ClubBadge id={away.id} size="sm" />}
                            </div>
                          </div>
                        </div>

                        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                          <span className="truncate max-w-[200px]">{m.dateStr} • {m.venue}</span>
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => setEditingMatch(m)}
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-amber-100 text-amber-700 transition-colors cursor-pointer"
                              title="Modifier"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                if (
                                  !isAdmin &&
                                  m.homeTeamId !== myClubId &&
                                  m.awayTeamId !== myClubId
                                ) {
                                  showFeedback('Action refusée : ce match ne concerne pas votre club', 'error');
                                  return;
                                }
                                if (window.confirm('Supprimer cette rencontre ?')) {
                                  deleteMatch(m.id);
                                  showFeedback('Match supprimé');
                                }
                              }}
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer"
                              title="Supprimer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* TAB 3: CLUBS & SQUAD */}
            {/* ------------------------------------------------------------- */}
            {activeTab === 'clubs' && (
              <div className="space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                  <div>
                    <h3 className="text-base font-black text-slate-900 uppercase flex items-center gap-2">
                      <Shield className="w-5 h-5 text-emerald-600" />
                      <span>Clubs Homologués & Licences ({clubs.length})</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Fiches administratives, présidents, entraîneurs et effectifs de joueurs.
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      if (!isAdmin) {
                        showFeedback('Seul l\'administrateur fédéral peut affilier un nouveau club', 'error');
                        return;
                      }
                      setEditingClub({
                        id: `club-${Date.now()}`,
                        name: 'NOUVEAU CLUB FIMF',
                        shortName: 'Nouv. Club',
                        city: 'Abidjan',
                        commune: 'Plateau',
                        region: 'Abidjan',
                        division: 'Division 1',
                        founded: 2025,
                        president: 'Président du Club',
                        coach: 'Entraîneur Fédéral',
                        stadium: 'Complexe Sportif Municipal',
                        primaryColor: '#006039',
                        secondaryColor: '#ffffff',
                        badgeBg: 'bg-emerald-950',
                        badgeBorder: 'border-emerald-600',
                        badgeIcon: 'shield-green',
                        stats: {
                          rank: clubs.length + 1,
                          played: 0,
                          won: 0,
                          drawn: 0,
                          lost: 0,
                          goalsFor: 0,
                          goalsAgainst: 0,
                          goalDiff: 0,
                          points: 0,
                          homeRank: clubs.length + 1,
                          awayRank: clubs.length + 1,
                        },
                        form: ['D'],
                        squad: [
                          { number: 1, name: 'Gardien Homologué', position: 'Gardien', age: 24, goals: 0, assists: 0, cleanSheets: 0 },
                          { number: 9, name: 'Attaquant Homologué', position: 'Attaquant', age: 23, goals: 0, assists: 0, cleanSheets: 0 },
                        ],
                      });
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#006039] to-emerald-700 hover:from-emerald-800 hover:to-[#006039] text-white text-xs font-black uppercase transition-all shadow-md shadow-emerald-700/20 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Affilier un Club</span>
                  </button>
                </div>

                {/* Creative Tim Styled Table Card */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] border-b border-slate-100">
                        <tr>
                          <th className="p-4">Club</th>
                          <th className="p-4">Commune & Ville</th>
                          <th className="p-4">Dirigeants (Président / Coach)</th>
                          <th className="p-4">Terrain Homologué</th>
                          <th className="p-4 text-center">Effectif</th>
                          <th className="p-4 text-center">Classement</th>
                          <th className="p-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {clubs.map((c) => (
                          <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="p-4 font-bold text-slate-900 flex items-center gap-3">
                              <ClubBadge id={c.id} size="sm" />
                              <div>
                                <div className="font-extrabold">{c.name}</div>
                                <span className="text-[10px] text-slate-500 uppercase">{c.division}</span>
                              </div>
                            </td>
                            <td className="p-4 text-slate-600 font-medium">
                              {c.commune}, {c.city}
                            </td>
                            <td className="p-4">
                              <div className="font-bold text-slate-900">{c.president}</div>
                              <div className="text-[11px] text-slate-500">Coach : {c.coach}</div>
                            </td>
                            <td className="p-4 text-slate-600 font-medium truncate max-w-[180px]">
                              {c.stadium}
                            </td>
                            <td className="p-4 text-center font-bold text-emerald-700">
                              <span className="px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200">
                                {c.squad.length} joueurs
                              </span>
                            </td>
                            <td className="p-4 text-center font-black text-amber-600 text-sm font-mono">
                              {c.stats.rank}ᵉ
                            </td>
                            <td className="p-4 text-right space-x-1.5">
                              <button
                                onClick={() => setEditingClub(c)}
                                className="p-2 rounded-xl bg-slate-100 hover:bg-amber-100 text-amber-700 transition-colors cursor-pointer"
                                title="Modifier"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  if (window.confirm(`Supprimer le club ${c.name} ?`)) {
                                    deleteClub(c.id);
                                    showFeedback('Club supprimé');
                                  }
                                }}
                                className="p-2 rounded-xl bg-slate-100 hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer"
                                title="Supprimer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* TAB 4: NEWS */}
            {/* ------------------------------------------------------------- */}
            {activeTab === 'news' && (
              <div className="space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                  <div>
                    <h3 className="text-base font-black text-slate-900 uppercase flex items-center gap-2">
                      <Newspaper className="w-5 h-5 text-sky-600" />
                      <span>Presse & Actualités Fédérales ({news.length})</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Rédigez et publiez les articles officiels et communiqués.
                    </p>
                  </div>

                  <button
                    onClick={() =>
                      setEditingNews({
                        id: `art-${Date.now()}`,
                        title: 'NOUVEAU COMMUNIQUÉ OFFICIEL FIMF',
                        category: 'Institutionnel',
                        dateStr: '25 Septembre 2025',
                        timestamp: '2025-09-25T12:00:00Z',
                        readTime: '3 min',
                        image: news[0]?.image || '',
                        excerpt: 'Résumé du communiqué officiel de la Fédération Ivoirienne de Mini-Football.',
                        content: [
                          'La Fédération Ivoirienne de Mini-Football informe l’ensemble des clubs affiliés et du public des nouvelles dispositions.',
                        ],
                        tags: ['FIMF', 'Officiel', 'Mini-Football'],
                        author: 'Direction Communication FIMF',
                      })
                    }
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-blue-700 hover:from-sky-700 hover:to-blue-800 text-white text-xs font-black uppercase transition-all shadow-md shadow-sky-600/20 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Rédiger un Article</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {news.map((item) => (
                    <div
                      key={item.id}
                      className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
                    >
                      <div className="flex items-start gap-4">
                        <img
                          src={item.image}
                          alt={item.title}
                          className="w-20 h-20 rounded-xl object-cover shrink-0 border border-slate-100 shadow-2xs"
                        />
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-sky-50 text-sky-700 border border-sky-200">
                              {item.category}
                            </span>
                            <span className="text-[11px] text-slate-400 font-medium">
                              {item.dateStr}
                            </span>
                          </div>
                          <h4 className="text-sm font-bold text-slate-900 line-clamp-1">{item.title}</h4>
                          <p className="text-xs text-slate-500 line-clamp-2">{item.excerpt}</p>
                        </div>
                      </div>

                      <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                        <span className="text-[11px] text-slate-400">Auteur : {item.author}</span>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => setEditingNews(item)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-amber-100 text-amber-700 transition-colors cursor-pointer"
                            title="Éditer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm('Supprimer cet article ?')) {
                                deleteNews(item.id);
                                showFeedback('Article supprimé');
                              }
                            }}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer"
                            title="Supprimer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* TAB 5: COMPETITIONS */}
            {/* ------------------------------------------------------------- */}
            {activeTab === 'competitions' && (
              <div className="space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                  <div>
                    <h3 className="text-base font-black text-slate-900 uppercase flex items-center gap-2">
                      <Trophy className="w-5 h-5 text-amber-500" />
                      <span>Compétitions Fédérales ({competitions.length})</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Tournois, coupes nationales et sélections internationales.
                    </p>
                  </div>

                  <button
                    onClick={() =>
                      setEditingComp({
                        id: `comp-${Date.now()}`,
                        title: 'NOUVELLE COUPE FÉDÉRALE',
                        type: 'cup',
                        category: 'Coupe nationale',
                        subtitle: 'Tournoi à élimination directe',
                        description: 'Compétition majeure ouverte aux clubs homologués.',
                        image: competitions[0]?.image || '',
                        participantsCount: 16,
                        currentHolder: 'AS PLATEAU',
                        period: 'Janvier - Mars 2026',
                        rulesHighlight: ['Matchs de 2 x 25 min', 'Prolongations et tirs au but'],
                        isMajor: true,
                      })
                    }
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-xs font-black uppercase transition-all shadow-md shadow-amber-500/20 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Ajouter une Compétition</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {competitions.map((c) => (
                    <div
                      key={c.id}
                      className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex flex-col justify-between"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200">
                            {c.category}
                          </span>
                          <span className="text-xs font-mono font-bold text-slate-500">{c.period}</span>
                        </div>
                        <h4 className="text-base font-black text-slate-900">{c.title}</h4>
                        <p className="text-xs text-slate-500 line-clamp-2">{c.description}</p>
                      </div>

                      <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                        <span className="font-semibold">
                          {c.participantsCount} participants • Tenant: <strong className="text-slate-900">{c.currentHolder}</strong>
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => setEditingComp(c)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-amber-100 text-amber-700 transition-colors cursor-pointer"
                            title="Modifier"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm(`Supprimer la compétition ${c.title} ?`)) {
                                deleteCompetition(c.id);
                                showFeedback('Compétition supprimée');
                              }
                            }}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer"
                            title="Supprimer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* TAB: HERO CAROUSEL */}
            {/* ------------------------------------------------------------- */}
            {activeTab === 'hero' && (
              <div className="space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                  <div>
                    <h3 className="text-base font-black text-slate-900 uppercase flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-emerald-600" />
                      <span>Carrousel de la page d'accueil ({heroSlides.length})</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Slides affichées dans la section hero. Réordonnez-les, activez-les ou modifiez leurs textes et images.
                    </p>
                  </div>

                  <button
                    onClick={() =>
                      setEditingHero({
                        id: `hero-${Date.now()}`,
                        title: 'NOUVEAU TITRE',
                        highlight: 'EN ORANGE',
                        subtitle: 'Description de la slide affichée sur la page d\'accueil.',
                        image: '',
                        ctaLabel: 'EN SAVOIR PLUS',
                        ctaPage: 'accueil',
                        sortOrder: Math.max(0, ...heroSlides.map((s) => s.sortOrder)) + 1,
                        active: true,
                      })
                    }
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white text-xs font-black uppercase transition-all shadow-md shadow-emerald-600/20 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Ajouter une slide</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {[...heroSlides]
                    .sort((a, b) => a.sortOrder - b.sortOrder)
                    .map((slide, idx, arr) => {
                      const canUp = idx > 0;
                      const canDown = idx < arr.length - 1;
                      return (
                      <div
                        key={slide.id}
                        className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${
                          slide.active ? 'border-slate-100' : 'border-dashed border-slate-300 opacity-70'
                        }`}
                      >
                        <div className="flex flex-col md:flex-row">
                          {/* Aperçu image */}
                          <div className="md:w-64 h-40 md:h-auto bg-slate-100 shrink-0">
                            {slide.image ? (
                              <img
                                src={slide.image}
                                alt={slide.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-300">
                                <Image className="w-8 h-8" />
                              </div>
                            )}
                          </div>

                          {/* Infos + actions */}
                          <div className="flex-1 p-4 sm:p-5 space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="px-2 py-0.5 rounded bg-slate-900 text-white text-[10px] font-black uppercase">
                                Position {slide.sortOrder}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                                  slide.active
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : 'bg-slate-100 text-slate-500 border border-slate-200'
                                }`}
                              >
                                {slide.active ? 'Active' : 'Masquée'}
                              </span>
                            </div>

                            <h4 className="font-black text-slate-900 text-sm uppercase">
                              {slide.title} <span className="text-[#ea580c]">{slide.highlight}</span>
                            </h4>
                            <p className="text-xs text-slate-500 line-clamp-2">{slide.subtitle}</p>

                            <div className="flex flex-wrap items-center gap-2 pt-2">
                              {/* Monter / descendre */}
                              <button
                                disabled={!canUp}
                                onClick={() => {
                                  const sorted = [...arr];
                                  const swapped = sorted[idx - 1];
                                  sorted[idx - 1] = sorted[idx];
                                  sorted[idx] = swapped;
                                  sorted.forEach((s, i) => saveHeroSlide({ ...s, sortOrder: i + 1 }));
                                  showFeedback('Ordre des slides mis à jour');
                                }}
                                className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 font-bold text-[11px] cursor-pointer transition-colors"
                              >
                                ↑ Monter
                              </button>
                              <button
                                disabled={!canDown}
                                onClick={() => {
                                  const sorted = [...arr];
                                  const swapped = sorted[idx + 1];
                                  sorted[idx + 1] = sorted[idx];
                                  sorted[idx] = swapped;
                                  sorted.forEach((s, i) => saveHeroSlide({ ...s, sortOrder: i + 1 }));
                                  showFeedback('Ordre des slides mis à jour');
                                }}
                                className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 font-bold text-[11px] cursor-pointer transition-colors"
                              >
                                ↓ Descendre
                              </button>

                              {/* Éditer */}
                              <button
                                onClick={() => setEditingHero(slide)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 font-bold text-[11px] cursor-pointer transition-colors"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                                Modifier
                              </button>

                              {/* Activer / masquer */}
                              <button
                                onClick={() => {
                                  saveHeroSlide({ ...slide, active: !slide.active });
                                  showFeedback(slide.active ? 'Slide masquée' : 'Slide activée');
                                }}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-bold text-[11px] cursor-pointer transition-colors"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                {slide.active ? 'Masquer' : 'Activer'}
                              </button>

                              {/* Supprimer */}
                              <button
                                onClick={() => {
                                  if (window.confirm('Supprimer cette slide du carrousel ?')) {
                                    deleteHeroSlide(slide.id);
                                    showFeedback('Slide supprimée');
                                  }
                                }}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 font-bold text-[11px] cursor-pointer transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                Supprimer
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                      );
                    })}
                </div>

                {/* Modale d'édition d'une slide hero */}
                {editingHero && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm overflow-y-auto animate-overlay-in">
                    <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full space-y-4 text-xs shadow-2xl border border-slate-100 my-8 animate-modal-in">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <h4 className="text-base font-black text-slate-900 uppercase">Slide du Carrousel Hero</h4>
                        <button
                          onClick={() => setEditingHero(null)}
                          className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500 cursor-pointer"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>

                      <div className="space-y-3">
                        <ImageUploadField
                          label="Image de fond (recommandé : 1600×900 px)"
                          value={editingHero.image}
                          onChange={(url) => setEditingHero({ ...editingHero, image: url })}
                        />

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-slate-700 mb-1 font-bold">Titre (ligne 1)</label>
                            <input
                              type="text"
                              value={editingHero.title}
                              onChange={(e) => setEditingHero({ ...editingHero, title: e.target.value })}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-bold"
                            />
                          </div>
                          <div>
                            <label className="block text-slate-700 mb-1 font-bold">Titre mis en avant (orange)</label>
                            <input
                              type="text"
                              value={editingHero.highlight}
                              onChange={(e) => setEditingHero({ ...editingHero, highlight: e.target.value })}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-bold"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-slate-700 mb-1 font-bold">Sous-titre</label>
                          <textarea
                            rows={2}
                            value={editingHero.subtitle}
                            onChange={(e) => setEditingHero({ ...editingHero, subtitle: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-slate-700 mb-1 font-bold">Bouton principal — libellé</label>
                            <input
                              type="text"
                              value={editingHero.ctaLabel ?? ''}
                              onChange={(e) => setEditingHero({ ...editingHero, ctaLabel: e.target.value })}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900"
                            />
                          </div>
                          <div>
                            <label className="block text-slate-700 mb-1 font-bold">Bouton principal — page</label>
                            <select
                              value={editingHero.ctaPage ?? ''}
                              onChange={(e) => setEditingHero({ ...editingHero, ctaPage: e.target.value })}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 cursor-pointer"
                            >
                              {HERO_NAV_PAGES.map((p) => (
                                <option key={p.value} value={p.value}>{p.label}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-slate-700 mb-1 font-bold">Bouton secondaire — libellé</label>
                            <input
                              type="text"
                              value={editingHero.ctaSecondaryLabel ?? ''}
                              onChange={(e) => setEditingHero({ ...editingHero, ctaSecondaryLabel: e.target.value })}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900"
                            />
                          </div>
                          <div>
                            <label className="block text-slate-700 mb-1 font-bold">Bouton secondaire — page</label>
                            <select
                              value={editingHero.ctaSecondaryPage ?? ''}
                              onChange={(e) => setEditingHero({ ...editingHero, ctaSecondaryPage: e.target.value })}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 cursor-pointer"
                            >
                              {HERO_NAV_PAGES.map((p) => (
                                <option key={p.value} value={p.value}>{p.label}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-slate-700 mb-1 font-bold">Position (ordre d'affichage)</label>
                            <input
                              type="number"
                              min={1}
                              value={editingHero.sortOrder}
                              onChange={(e) => setEditingHero({ ...editingHero, sortOrder: Number(e.target.value) || 1 })}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900"
                            />
                          </div>
                          <div className="flex items-end">
                            <label className="flex items-center gap-2 cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={editingHero.active}
                                onChange={(e) => setEditingHero({ ...editingHero, active: e.target.checked })}
                                className="w-4 h-4 accent-emerald-600 cursor-pointer"
                              />
                              <span className="font-bold text-slate-700">Slide active (visible sur le site)</span>
                            </label>
                          </div>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex justify-end gap-2.5">
                        <button
                          onClick={() => setEditingHero(null)}
                          className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold cursor-pointer"
                        >
                          Annuler
                        </button>
                        <button
                          onClick={() => {
                            saveHeroSlide(editingHero);
                            setEditingHero(null);
                            showFeedback('Slide du carrousel enregistrée');
                          }}
                          className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-black uppercase cursor-pointer shadow-md shadow-emerald-600/20"
                        >
                          Enregistrer
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* TAB 6: GALLERY */}
            {/* ------------------------------------------------------------- */}
            {activeTab === 'gallery' && (
              <div className="space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                  <div>
                    <h3 className="text-base font-black text-slate-900 uppercase flex items-center gap-2">
                      <Image className="w-5 h-5 text-emerald-600" />
                      <span>Médiathèque Photos FIMF ({gallery.length})</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Albums officiels, légendes et crédits des reportages.
                    </p>
                  </div>

                  <button
                    onClick={() =>
                      setEditingPhoto({
                        id: `photo-${Date.now()}`,
                        title: 'NOUVELLE PHOTO OFFICIELLE',
                        category: 'Compétitions',
                        image: gallery[0]?.image || '',
                        caption: 'Rencontre du Championnat National de Mini-Football.',
                        dateStr: '25 Septembre 2025',
                        venue: 'Complexe de Bingerville',
                      })
                    }
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white text-xs font-black uppercase transition-all shadow-md shadow-emerald-600/20 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Ajouter une Photo</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {gallery.map((p) => (
                    <div
                      key={p.id}
                      className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden group hover:shadow-md transition-shadow"
                    >
                      <div className="h-36 bg-slate-100 relative overflow-hidden">
                        <img
                          src={p.image}
                          alt={p.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => setEditingPhoto(p)}
                            className="p-1.5 rounded-lg bg-white/90 text-amber-700 hover:bg-white cursor-pointer shadow"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm('Supprimer cette photo ?')) {
                                deleteGalleryPhoto(p.id);
                                showFeedback('Photo supprimée');
                              }
                            }}
                            className="p-1.5 rounded-lg bg-white/90 text-rose-600 hover:bg-white cursor-pointer shadow"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <div className="p-3 text-xs space-y-0.5">
                        <h5 className="font-bold text-slate-900 truncate">{p.title}</h5>
                        <p className="text-[11px] text-slate-400 truncate">{p.venue}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* TAB 7: STATS */}
            {/* ------------------------------------------------------------- */}
            {activeTab === 'stats' && (
              <div className="space-y-5 max-w-2xl">
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                  <h3 className="text-base font-black text-slate-900 uppercase flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-emerald-600" />
                    <span>Statistiques Fédérales (Chiffres Clés)</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Modifiez les chiffres présentés au grand public sur la page d'accueil de la FIMF.
                  </p>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Clubs Affiliés (Affichage Accueil)
                    </label>
                    <input
                      type="text"
                      value={editingStats.clubsCount}
                      onChange={(e) => setEditingStats({ ...editingStats, clubsCount: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 text-xs font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Joueurs Licenciés
                    </label>
                    <input
                      type="text"
                      value={editingStats.playersCount}
                      onChange={(e) => setEditingStats({ ...editingStats, playersCount: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 text-xs font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Arbitres Formés
                    </label>
                    <input
                      type="text"
                      value={editingStats.refereesCount}
                      onChange={(e) => setEditingStats({ ...editingStats, refereesCount: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 text-xs font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Terrains Homologués
                    </label>
                    <input
                      type="text"
                      value={editingStats.pitchesCount}
                      onChange={(e) => setEditingStats({ ...editingStats, pitchesCount: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 text-xs font-bold"
                    />
                  </div>

                  <button
                    onClick={() => {
                      saveStats(editingStats);
                      showFeedback('Chiffres officiels enregistrés');
                    }}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-[#006039] to-emerald-700 hover:from-emerald-800 hover:to-[#006039] text-white font-black text-xs uppercase transition-all shadow-md shadow-emerald-700/20 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>Enregistrer les Statistiques Fédérales</span>
                  </button>
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* TAB 8: PARTNERS */}
            {/* ------------------------------------------------------------- */}
            {activeTab === 'partners' && (
              <div className="space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                  <div>
                    <h3 className="text-base font-black text-slate-900 uppercase flex items-center gap-2">
                      <Handshake className="w-5 h-5 text-amber-500" />
                      <span>Partenaires & Sponsors ({partners.length})</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Gestion des marques partenaires apparaissant sur l'ensemble du site.
                    </p>
                  </div>

                  <button
                    onClick={() =>
                      setEditingPartner({
                        id: `part-${Date.now()}`,
                        name: 'NOUVEAU PARTENAIRE',
                        category: 'Partenaire Officiel',
                      })
                    }
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-xs font-black uppercase transition-all shadow-md shadow-amber-500/20 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Ajouter un Partenaire</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {partners.map((p) => (
                    <div
                      key={p.id}
                      className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center justify-between"
                    >
                      <div>
                        <h5 className="text-sm font-black text-slate-900">{p.name}</h5>
                        <span className="text-[11px] font-bold text-amber-600 uppercase">
                          {p.category}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setEditingPartner(p)}
                          className="p-2 rounded-xl bg-slate-100 hover:bg-amber-100 text-amber-700 transition-colors cursor-pointer"
                          title="Modifier"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm(`Supprimer le partenaire ${p.name} ?`)) {
                              deletePartner(p.id);
                              showFeedback('Partenaire supprimé');
                            }
                          }}
                          className="p-2 rounded-xl bg-slate-100 hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer"
                          title="Supprimer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* TAB : MODULE SPONSORING (5 sous-sections)                      */}
            {/* Dashboard, packages, demandes, sponsors, paramètres page.     */}
            {/* ------------------------------------------------------------- */}
            {activeTab === 'sponsoring' && (
              <SponsoringModule
                isAdmin={isAdmin}
                showFeedback={(msg) => showFeedback(msg)}
              />
            )}

            {/* ------------------------------------------------------------- */}
            {/* TAB: JEUX & PRONOSTICS */}
            {/* ------------------------------------------------------------- */}
            {activeTab === 'games' && (
              <AdminGamesTab
                showFeedback={(msg, tone) => {
                  showFeedback(msg, tone);
                  fetchGamePeriods().then((ps) => setGamePeriods(ps)).catch(() => undefined);
                }}
              />
            )}

            {/* ------------------------------------------------------------- */}
            {/* TAB: DEMANDES D'ADHÉSION */}
            {/* ------------------------------------------------------------- */}
            {activeTab === 'members' && (
              <div className="space-y-5">
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                  <h3 className="text-base font-black text-slate-900 uppercase flex items-center gap-2">
                    <UserPlus className="w-5 h-5 text-emerald-600" />
                    <span>Demandes d'Adhésion ({memberRequests.length})</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Inscriptions envoyées via « Devenir membre » du bouton CONNEXION. Approuvez ou refusez chaque demande.
                  </p>
                </div>

                {memberRequests.length === 0 ? (
                  <div className="bg-white p-10 rounded-2xl border border-slate-100 shadow-sm text-center">
                    <UserPlus className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                    <p className="text-sm font-bold text-slate-500">Aucune demande pour le moment</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Les demandes envoyées via « Devenir membre » apparaîtront ici.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {memberRequests.map((r) => (
                      <div
                        key={r.id}
                        className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="text-sm font-black text-slate-900 uppercase">{r.fullName}</h4>
                              {r.status === 'nouvelle' && (
                                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-orange-50 text-[#ea580c] border border-orange-200 uppercase">
                                  À traiter
                                </span>
                              )}
                              {r.status === 'approuvée' && (
                                <span
                                  className={`text-[10px] font-black px-2 py-0.5 rounded-full border uppercase flex items-center gap-1 ${
                                    r.authUserId
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                      : 'bg-slate-50 text-slate-500 border-slate-200'
                                  }`}
                                  title={r.authUserId ? 'Compte créé, email de bienvenue envoyé' : 'Activation du compte en cours…'}
                                >
                                  {r.authUserId ? (
                                    <>
                                      <CheckCircle2 className="w-3 h-3" />
                                      Compte activé{r.activatedAt ? ` le ${r.activatedAt}` : ''}
                                    </>
                                  ) : (
                                    <>Activation en cours…</>
                                  )}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-600 mt-1">{r.email}</p>
                            <p className="text-[10px] text-slate-400 font-mono mt-1.5">Reçue le {r.createdAt}</p>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <select
                              value={r.status}
                              onChange={(e) => updateMemberStatus(r.id, e.target.value as MemberRequestStatus)}
                              className={`px-3 py-2 rounded-xl text-xs font-black uppercase border cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#ea580c]/50 ${
                                r.status === 'nouvelle'
                                  ? 'bg-orange-50 text-[#ea580c] border-orange-200'
                                  : r.status === 'approuvée'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : 'bg-rose-50 text-rose-700 border-rose-200'
                              }`}
                            >
                              <option value="nouvelle">Nouvelle</option>
                              <option value="approuvée">Approuvée</option>
                              <option value="refusée">Refusée</option>
                            </select>
                            <a
                              href={`mailto:${r.email}?subject=${encodeURIComponent('Votre adhésion à la FIMF')}`}
                              className="p-2 rounded-xl bg-slate-50 hover:bg-sky-100 text-sky-700 transition-colors"
                              title={`Répondre à ${r.fullName}`}
                            >
                              <Mail className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* TAB 9: AUDIT LOGS */}
            {/* ------------------------------------------------------------- */}
            {activeTab === 'logs' && (
              <div className="space-y-5">
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                  <h3 className="text-base font-black text-slate-900 uppercase flex items-center gap-2">
                    <FileText className="w-5 h-5 text-emerald-600" />
                    <span>Journal d'Audit & Traçabilité ({logs.length})</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Historique daté et certifié de toutes les modifications effectuées sur la console FIMF.
                  </p>
                </div>

                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] border-b border-slate-100">
                      <tr>
                        <th className="p-4">Horodatage</th>
                        <th className="p-4">Opération Réalisée</th>
                        <th className="p-4">Cible / Élément</th>
                        <th className="p-4">Auteur</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {logs.map((l) => (
                        <tr key={l.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="p-4 font-mono text-slate-500 text-[11px]">{l.timestamp}</td>
                          <td className="p-4 font-bold text-slate-900">{l.action}</td>
                          <td className="p-4 text-[#ea580c] font-semibold">{l.target}</td>
                          <td className="p-4 text-slate-600">{l.author}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* CREATIVE TIM MODALS (Floating / Rounded-3xl / Backdrop-blur) */}
      {/* ========================================================================= */}

      {/* MODAL 1: EDIT MATCH */}
      {editingMatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-overlay-in">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full space-y-4 text-xs shadow-2xl border border-slate-100 animate-modal-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h4 className="text-base font-black text-slate-900 uppercase">Édition Rencontre FIMF</h4>
              <button
                onClick={() => setEditingMatch(null)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1 font-bold">Équipe à Domicile</label>
                  <select
                    value={editingMatch.homeTeamId}
                    onChange={(e) => setEditingMatch({ ...editingMatch, homeTeamId: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-medium"
                  >
                    {clubs.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 mb-1 font-bold">Équipe à l'Extérieur</label>
                  <select
                    value={editingMatch.awayTeamId}
                    onChange={(e) => setEditingMatch({ ...editingMatch, awayTeamId: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-medium"
                  >
                    {clubs.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1 font-bold">Statut</label>
                  <select
                    value={editingMatch.status}
                    onChange={(e) =>
                      setEditingMatch({ ...editingMatch, status: e.target.value as Match['status'] })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-medium"
                  >
                    <option value="scheduled">Prévu</option>
                    <option value="live">En Direct</option>
                    <option value="finished">Terminé</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 mb-1 font-bold">Score Domicile</label>
                  <input
                    type="number"
                    min="0"
                    value={editingMatch.scoreHome ?? 0}
                    onChange={(e) =>
                      setEditingMatch({ ...editingMatch, scoreHome: parseInt(e.target.value) || 0 })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 mb-1 font-bold">Score Extérieur</label>
                  <input
                    type="number"
                    min="0"
                    value={editingMatch.scoreAway ?? 0}
                    onChange={(e) =>
                      setEditingMatch({ ...editingMatch, scoreAway: parseInt(e.target.value) || 0 })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1 font-bold">Date</label>
                  <input
                    type="text"
                    value={editingMatch.dateStr}
                    onChange={(e) => setEditingMatch({ ...editingMatch, dateStr: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 mb-1 font-bold">Heure</label>
                  <input
                    type="text"
                    value={editingMatch.timeStr}
                    onChange={(e) => setEditingMatch({ ...editingMatch, timeStr: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-bold">Terrain / Stade</label>
                <input
                  type="text"
                  value={editingMatch.venue}
                  onChange={(e) => setEditingMatch({ ...editingMatch, venue: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-bold">Arbitre Officiel</label>
                <input
                  type="text"
                  value={editingMatch.referee || ''}
                  onChange={(e) => setEditingMatch({ ...editingMatch, referee: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end gap-2.5">
              <button
                onClick={() => setEditingMatch(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold cursor-pointer"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  if (
                    !isAdmin &&
                    editingMatch.homeTeamId !== myClubId &&
                    editingMatch.awayTeamId !== myClubId
                  ) {
                    showFeedback('Action refusée : un dirigeant ne peut gérer que les matchs de son club', 'error');
                    return;
                  }
                  saveMatch(editingMatch);
                  setEditingMatch(null);
                  showFeedback('Match mis à jour avec succès');
                }}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#006039] to-emerald-700 hover:from-emerald-800 hover:to-[#006039] text-white font-black uppercase cursor-pointer shadow-md shadow-emerald-700/20"
              >
                Enregistrer la Rencontre
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT CLUB */}
      {editingClub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm overflow-y-auto animate-overlay-in">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full space-y-4 text-xs shadow-2xl border border-slate-100 my-8 animate-modal-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h4 className="text-base font-black text-slate-900 uppercase">Fiche Officielle du Club</h4>
              <button
                onClick={() => setEditingClub(null)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5">
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center gap-4">
                {/* Aperçu en direct du badge (SVG actuel ou logo uploadé) */}
                <div className="shrink-0">
                  <ClubBadge id={editingClub.id} size="xl" />
                </div>
                <div className="min-w-0">
                  <p className="font-black text-slate-900 uppercase">{editingClub.name}</p>
                  <p className="text-slate-500 mt-0.5">
                    Aperçu public du badge — mis à jour instantanément à l'upload et à l'enregistrement.
                  </p>
                </div>
              </div>

              <ImageUploadField
                label="Logo / Blason du club"
                value={editingClub.logoUrl ?? ''}
                onChange={(url) =>
                  setEditingClub({
                    ...editingClub,
                    logoUrl: url || undefined,
                  })
                }
              />

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1 font-bold">Nom Officiel</label>
                  <input
                    type="text"
                    value={editingClub.name}
                    onChange={(e) => setEditingClub({ ...editingClub, name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 mb-1 font-bold">Nom Court</label>
                  <input
                    type="text"
                    value={editingClub.shortName}
                    onChange={(e) => setEditingClub({ ...editingClub, shortName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1 font-bold">Ville</label>
                  <input
                    type="text"
                    value={editingClub.city}
                    onChange={(e) => setEditingClub({ ...editingClub, city: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 mb-1 font-bold">Commune</label>
                  <input
                    type="text"
                    value={editingClub.commune}
                    onChange={(e) => setEditingClub({ ...editingClub, commune: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 mb-1 font-bold">Année Fondation</label>
                  <input
                    type="number"
                    value={editingClub.founded}
                    onChange={(e) =>
                      setEditingClub({ ...editingClub, founded: parseInt(e.target.value) || 2020 })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1 font-bold">Président</label>
                  <input
                    type="text"
                    value={editingClub.president}
                    onChange={(e) => setEditingClub({ ...editingClub, president: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 mb-1 font-bold">Entraîneur Principal</label>
                  <input
                    type="text"
                    value={editingClub.coach}
                    onChange={(e) => setEditingClub({ ...editingClub, coach: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-bold">Terrain / Stade de Résidence</label>
                <input
                  type="text"
                  value={editingClub.stadium}
                  onChange={(e) => setEditingClub({ ...editingClub, stadium: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900"
                />
              </div>

              {/* Squad summary */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <div className="flex items-center justify-between font-bold">
                  <span className="text-slate-900">Effectif ({editingClub.squad.length} joueurs)</span>
                  <button
                    onClick={() => {
                      const newNumber = (editingClub.squad.length + 1) * 2;
                      const newPlayer = {
                        number: newNumber,
                        name: 'Nouveau Joueur Licencié',
                        position: 'Milieu' as const,
                        age: 23,
                        goals: 0,
                        assists: 0,
                        cleanSheets: 0,
                      };
                      setEditingClub({ ...editingClub, squad: [...editingClub.squad, newPlayer] });
                    }}
                    className="text-xs text-[#ea580c] hover:underline cursor-pointer font-bold"
                  >
                    + Ajouter un joueur
                  </button>
                </div>
                <div className="max-h-72 overflow-y-auto space-y-1.5 pr-1">
                  {editingClub.squad.map((p, idx) => {
                    const isExpanded = editingPlayerIdx === idx;
                    // Doublons de numéro de maillot dans l'effectif en cours d'édition
                    const numberClash =
                      editingClub.squad.filter((sp) => sp.number === p.number).length > 1;
                    return (
                      <div
                        key={idx}
                        className={`rounded-xl bg-white border overflow-hidden ${
                          numberClash ? 'border-rose-300 bg-rose-50/40' : 'border-slate-100'
                        }`}
                      >
                        {/* Ligne résumé : clic pour déplier la fiche du joueur */}
                        <div className="flex items-center justify-between text-[11px] p-2">
                          <button
                              onClick={() => setEditingPlayerIdx(isExpanded ? null : idx)}
                              className={`flex items-center gap-1.5 font-mono font-bold cursor-pointer hover:underline text-left ${
                                numberClash ? 'text-rose-600' : 'text-[#ea580c]'
                              }`}
                              title="Modifier la fiche du joueur"
                            >
                              <ChevronRight
                                className={`w-3 h-3 shrink-0 text-slate-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                              />
                              #{p.number} {p.name}
                              {numberClash && (
                                <span title="Numéro de maillot en doublon" className="inline-flex">
                                  <AlertTriangle className="w-3 h-3" />
                                </span>
                              )}
                            </button>
                          <div className="flex items-center gap-1.5">
                            <span className="text-slate-500 font-medium">
                              {p.position} ({p.age} ans)
                            </span>
                            <button
                              onClick={() => {
                                if (window.confirm(`Retirer ${p.name} de l'effectif ?`)) {
                                  setEditingClub({
                                    ...editingClub,
                                    squad: editingClub.squad.filter((_, i) => i !== idx),
                                  });
                                  setEditingPlayerIdx(null);
                                }
                              }}
                              className="p-1 rounded-lg text-rose-500 hover:bg-rose-50 cursor-pointer"
                              title="Retirer le joueur"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                        {/* Fiche d'édition dépliable */}
                        {isExpanded && (
                          <div className="p-2.5 pt-0 space-y-2 animate-fade-in">
                            {/* Photo de profil du joueur */}
                            <ImageUploadField
                              label="Photo de profil"
                              value={p.photoUrl ?? ''}
                              onChange={(url) =>
                                setEditingClub({
                                  ...editingClub,
                                  squad: editingClub.squad.map((sp, i) =>
                                    i === idx ? { ...sp, photoUrl: url || undefined } : sp
                                  ),
                                })
                              }
                            />

                            <div className="grid grid-cols-3 gap-2">
                              <div>
                                <label className="block text-[10px] font-bold text-slate-500 mb-0.5">N°</label>
                                <input
                                  type="number"
                                  min={1}
                                  max={99}
                                  value={p.number}
                                  onChange={(e) =>
                                    setEditingClub({
                                      ...editingClub,
                                      squad: editingClub.squad.map((sp, i) =>
                                        i === idx ? { ...sp, number: parseInt(e.target.value) || 1 } : sp
                                      ),
                                    })
                                  }
                                  className={`w-full bg-slate-50 border rounded-lg px-2 py-1.5 text-slate-900 font-mono font-bold ${
                                    numberClash ? 'border-rose-400 bg-rose-50' : 'border-slate-200'
                                  }`}
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Âge</label>
                                <input
                                  type="number"
                                  min={14}
                                  max={50}
                                  value={p.age}
                                  onChange={(e) =>
                                    setEditingClub({
                                      ...editingClub,
                                      squad: editingClub.squad.map((sp, i) =>
                                        i === idx ? { ...sp, age: parseInt(e.target.value) || 20 } : sp
                                      ),
                                    })
                                  }
                                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-slate-900 font-mono"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Poste</label>
                                <select
                                  value={p.position}
                                  onChange={(e) =>
                                    setEditingClub({
                                      ...editingClub,
                                      squad: editingClub.squad.map((sp, i) =>
                                        i === idx
                                          ? { ...sp, position: e.target.value as Player['position'] }
                                          : sp
                                      ),
                                    })
                                  }
                                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-1.5 py-1.5 text-slate-900 cursor-pointer"
                                >
                                  <option value="Gardien">Gardien</option>
                                  <option value="Défenseur">Défenseur</option>
                                  <option value="Milieu">Milieu</option>
                                  <option value="Attaquant">Attaquant</option>
                                </select>
                              </div>
                            </div>

                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Nom du joueur</label>
                              <input
                                type="text"
                                value={p.name}
                                onChange={(e) =>
                                  setEditingClub({
                                    ...editingClub,
                                    squad: editingClub.squad.map((sp, i) =>
                                      i === idx ? { ...sp, name: e.target.value } : sp
                                    ),
                                  })
                                }
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-slate-900 font-bold"
                              />
                            </div>

                            <div className="grid grid-cols-5 gap-1.5">
                              <div>
                                <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Buts</label>
                                <input
                                  type="number"
                                  min={0}
                                  value={p.goals}
                                  onChange={(e) =>
                                    setEditingClub({
                                      ...editingClub,
                                      squad: editingClub.squad.map((sp, i) =>
                                        i === idx ? { ...sp, goals: parseInt(e.target.value) || 0 } : sp
                                      ),
                                    })
                                  }
                                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-1.5 py-1.5 text-slate-900 font-mono"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Passes</label>
                                <input
                                  type="number"
                                  min={0}
                                  value={p.assists ?? 0}
                                  onChange={(e) =>
                                    setEditingClub({
                                      ...editingClub,
                                      squad: editingClub.squad.map((sp, i) =>
                                        i === idx ? { ...sp, assists: parseInt(e.target.value) || 0 } : sp
                                      ),
                                    })
                                  }
                                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-1.5 py-1.5 text-slate-900 font-mono"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Matchs</label>
                                <input
                                  type="number"
                                  min={0}
                                  value={p.matchesPlayed ?? 0}
                                  onChange={(e) =>
                                    setEditingClub({
                                      ...editingClub,
                                      squad: editingClub.squad.map((sp, i) =>
                                        i === idx ? { ...sp, matchesPlayed: parseInt(e.target.value) || 0 } : sp
                                      ),
                                    })
                                  }
                                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-1.5 py-1.5 text-slate-900 font-mono"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Clean sheets</label>
                                <input
                                  type="number"
                                  min={0}
                                  value={p.cleanSheets ?? 0}
                                  onChange={(e) =>
                                    setEditingClub({
                                      ...editingClub,
                                      squad: editingClub.squad.map((sp, i) =>
                                        i === idx ? { ...sp, cleanSheets: parseInt(e.target.value) || 0 } : sp
                                      ),
                                    })
                                  }
                                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-1.5 py-1.5 text-slate-900 font-mono"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Note</label>
                                <input
                                  type="number"
                                  min={0}
                                  max={10}
                                  step={0.1}
                                  value={p.rating ?? ''}
                                  onChange={(e) =>
                                    setEditingClub({
                                      ...editingClub,
                                      squad: editingClub.squad.map((sp, i) =>
                                        i === idx
                                          ? { ...sp, rating: e.target.value === '' ? undefined : parseFloat(e.target.value) }
                                          : sp
                                      ),
                                    })
                                  }
                                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-1.5 py-1.5 text-slate-900 font-mono"
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end gap-2.5">
              <button
                onClick={() => setEditingClub(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold cursor-pointer"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  // Validation : chaque numéro de maillot doit être unique dans l'effectif
                  const seen = new Set<number>();
                  for (const sp of editingClub.squad) {
                    if (seen.has(sp.number)) {
                      showFeedback(`Numéro de maillot ${sp.number} en doublon — corrige avant d'enregistrer`, 'error');
                      return;
                    }
                    seen.add(sp.number);
                  }
                  saveClub(editingClub);
                  setEditingClub(null);
                  showFeedback('Club enregistré');
                }}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#006039] to-emerald-700 hover:from-emerald-800 hover:to-[#006039] text-white font-black uppercase cursor-pointer shadow-md shadow-emerald-700/20"
              >
                Enregistrer le Club
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: EDIT NEWS */}
      {editingNews && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm overflow-y-auto animate-overlay-in">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-xl w-full space-y-4 text-xs shadow-2xl border border-slate-100 my-8 animate-modal-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h4 className="text-base font-black text-slate-900 uppercase">Éditeur Presse & Médias</h4>
              <button
                onClick={() => setEditingNews(null)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="block text-slate-700 mb-1 font-bold">Titre de l'Article</label>
                <input
                  type="text"
                  value={editingNews.title}
                  onChange={(e) => setEditingNews({ ...editingNews, title: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1 font-bold">Catégorie</label>
                  <select
                    value={editingNews.category}
                    onChange={(e) =>
                      setEditingNews({
                        ...editingNews,
                        category: e.target.value as NewsArticle['category'],
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900"
                  >
                    <option value="Championnat">Championnat</option>
                    <option value="Compétitions">Compétitions</option>
                    <option value="Sélections">Sélections</option>
                    <option value="Formation">Formation</option>
                    <option value="Institutionnel">Institutionnel</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 mb-1 font-bold">Temps de lecture</label>
                  <input
                    type="text"
                    value={editingNews.readTime}
                    onChange={(e) => setEditingNews({ ...editingNews, readTime: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-mono"
                  />
                </div>
              </div>

              <ImageUploadField
                label="Image de couverture"
                value={editingNews.image}
                onChange={(url) => setEditingNews({ ...editingNews, image: url })}
              />

              <div>
                <label className="block text-slate-700 mb-1 font-bold">Chapô / Résumé</label>
                <textarea
                  rows={2}
                  value={editingNews.excerpt}
                  onChange={(e) => setEditingNews({ ...editingNews, excerpt: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-bold">Contenu principal</label>
                <textarea
                  rows={4}
                  value={editingNews.content.join('\n\n')}
                  onChange={(e) =>
                    setEditingNews({ ...editingNews, content: e.target.value.split('\n\n') })
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end gap-2.5">
              <button
                onClick={() => setEditingNews(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold cursor-pointer"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  saveNews(editingNews);
                  setEditingNews(null);
                  showFeedback('Article publié avec succès');
                }}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-sky-600 to-blue-700 hover:from-sky-700 hover:to-blue-800 text-white font-black uppercase cursor-pointer shadow-md shadow-sky-600/20"
              >
                Publier l'Article
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: EDIT PARTNER */}
      {editingPartner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-overlay-in">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-sm w-full space-y-4 text-xs shadow-2xl border border-slate-100 animate-modal-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h4 className="text-base font-black text-slate-900 uppercase">Partenaire FIMF</h4>
              <button
                onClick={() => setEditingPartner(null)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-slate-700 mb-1 font-bold">Nom Entreprise / Entité</label>
                <input
                  type="text"
                  value={editingPartner.name}
                  onChange={(e) => setEditingPartner({ ...editingPartner, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-bold">Statut / Catégorie</label>
                <input
                  type="text"
                  value={editingPartner.category}
                  onChange={(e) => setEditingPartner({ ...editingPartner, category: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end gap-2.5">
              <button
                onClick={() => setEditingPartner(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold cursor-pointer"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  savePartner(editingPartner);
                  setEditingPartner(null);
                  showFeedback('Partenaire sauvegardé');
                }}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-black uppercase cursor-pointer shadow-md shadow-amber-500/20"
              >
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: EDIT COMPETITION */}
      {editingComp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm overflow-y-auto animate-overlay-in">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full space-y-4 text-xs shadow-2xl border border-slate-100 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h4 className="text-base font-black text-slate-900 uppercase">Édition Compétition</h4>
              <button
                onClick={() => setEditingComp(null)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="block text-slate-700 mb-1 font-bold">Nom du Tournoi</label>
                <input
                  type="text"
                  value={editingComp.title}
                  onChange={(e) => setEditingComp({ ...editingComp, title: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1 font-bold">Catégorie</label>
                  <input
                    type="text"
                    value={editingComp.category}
                    onChange={(e) =>
                      setEditingComp({
                        ...editingComp,
                        category: e.target.value as Competition['category'],
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 mb-1 font-bold">Période</label>
                  <input
                    type="text"
                    value={editingComp.period}
                    onChange={(e) => setEditingComp({ ...editingComp, period: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1 font-bold">Nombre d'équipes</label>
                  <input
                    type="number"
                    value={editingComp.participantsCount}
                    onChange={(e) =>
                      setEditingComp({
                        ...editingComp,
                        participantsCount: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 mb-1 font-bold">Tenant du Titre</label>
                  <input
                    type="text"
                    value={editingComp.currentHolder}
                    onChange={(e) =>
                      setEditingComp({ ...editingComp, currentHolder: e.target.value })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-bold">Description du Tournoi</label>
                <textarea
                  rows={3}
                  value={editingComp.description}
                  onChange={(e) => setEditingComp({ ...editingComp, description: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end gap-2.5">
              <button
                onClick={() => setEditingComp(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold cursor-pointer"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  saveCompetition(editingComp);
                  setEditingComp(null);
                  showFeedback('Compétition enregistrée');
                }}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-black uppercase cursor-pointer shadow-md shadow-amber-500/20"
              >
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 7: EDIT OFFICIAL (Dirigeant & Membre du Conseil Fédéral) */}
      {editingOfficial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm overflow-y-auto animate-overlay-in">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full space-y-4 text-xs shadow-2xl border border-slate-100 my-8 animate-modal-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h4 className="text-base font-black text-slate-900 uppercase">Dirigeant Fédéral FIMF</h4>
              <button
                onClick={() => setEditingOfficial(null)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1 font-bold">Nom complet</label>
                  <input
                    type="text"
                    value={editingOfficial.name}
                    onChange={(e) => setEditingOfficial({ ...editingOfficial, name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 mb-1 font-bold">Fonction / Rôle</label>
                  <input
                    type="text"
                    value={editingOfficial.role}
                    onChange={(e) => setEditingOfficial({ ...editingOfficial, role: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1 font-bold">Département</label>
                  <select
                    value={editingOfficial.department}
                    onChange={(e) => setEditingOfficial({ ...editingOfficial, department: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 cursor-pointer"
                  >
                    <option value="Comité Exécutif">Comité Exécutif</option>
                    <option value="Direction Technique">Direction Technique</option>
                    <option value="Secrétariat Général">Secrétariat Général</option>
                    <option value="Commission Centrale">Commission Centrale</option>
                    <option value="Commission Médicale">Commission Médicale</option>
                    <option value="Arbitrage">Arbitrage</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 mb-1 font-bold">Statut</label>
                  <select
                    value={editingOfficial.status}
                    onChange={(e) => setEditingOfficial({ ...editingOfficial, status: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 cursor-pointer"
                  >
                    <option value="Actif">Actif</option>
                    <option value="En mission">En mission</option>
                    <option value="En congé">En congé</option>
                    <option value="Honoraire">Honoraire</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1 font-bold">Email</label>
                  <input
                    type="email"
                    value={editingOfficial.email}
                    onChange={(e) => setEditingOfficial({ ...editingOfficial, email: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 mb-1 font-bold">Téléphone</label>
                  <input
                    type="tel"
                    value={editingOfficial.phone}
                    onChange={(e) => setEditingOfficial({ ...editingOfficial, phone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1 font-bold">Début de mandat</label>
                  <input
                    type="text"
                    value={editingOfficial.mandateStart}
                    onChange={(e) => setEditingOfficial({ ...editingOfficial, mandateStart: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 mb-1 font-bold">Fin de mandat</label>
                  <input
                    type="text"
                    value={editingOfficial.mandateEnd}
                    onChange={(e) => setEditingOfficial({ ...editingOfficial, mandateEnd: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-bold">Biographie / Attributions</label>
                <textarea
                  rows={3}
                  value={editingOfficial.bio}
                  onChange={(e) => setEditingOfficial({ ...editingOfficial, bio: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-bold">
                  Prérogatives / Pouvoirs (un par ligne)
                </label>
                <textarea
                  rows={3}
                  value={(editingOfficial.powers ?? []).join('\n')}
                  onChange={(e) =>
                    setEditingOfficial({
                      ...editingOfficial,
                      powers: e.target.value
                        .split('\n')
                        .map((s) => s.trim())
                        .filter(Boolean),
                    })
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end gap-2.5">
              <button
                onClick={() => setEditingOfficial(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold cursor-pointer"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  if (!editingOfficial.name.trim() || !editingOfficial.role.trim()) {
                    showFeedback('Nom et fonction du dirigeant obligatoires', 'error');
                    return;
                  }
                  saveOfficial(editingOfficial);
                  setEditingOfficial(null);
                  showFeedback('Dirigeant enregistré avec succès');
                }}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#006039] to-emerald-700 hover:from-emerald-800 hover:to-[#006039] text-white font-black uppercase cursor-pointer shadow-md shadow-emerald-700/20"
              >
                Enregistrer le Dirigeant
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 8: EDIT COMMISSION SPÉCIALISÉE */}
      {editingCommission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm overflow-y-auto animate-overlay-in">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full space-y-4 text-xs shadow-2xl border border-slate-100 my-8 animate-modal-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h4 className="text-base font-black text-slate-900 uppercase">Commission Spécialisée</h4>
              <button
                onClick={() => setEditingCommission(null)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-slate-700 mb-1 font-bold">Nom de la commission</label>
                <input
                  type="text"
                  value={editingCommission.name}
                  onChange={(e) => setEditingCommission({ ...editingCommission, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1 font-bold">Président</label>
                  <input
                    type="text"
                    value={editingCommission.president}
                    onChange={(e) => setEditingCommission({ ...editingCommission, president: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 mb-1 font-bold">Nombre de membres</label>
                  <input
                    type="number"
                    min={0}
                    value={editingCommission.membersCount}
                    onChange={(e) =>
                      setEditingCommission({
                        ...editingCommission,
                        membersCount: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-bold">Missions / Description</label>
                <textarea
                  rows={3}
                  value={editingCommission.description}
                  onChange={(e) => setEditingCommission({ ...editingCommission, description: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1 font-bold">Fréquence réunions</label>
                  <input
                    type="text"
                    value={editingCommission.meetingFrequency}
                    onChange={(e) =>
                      setEditingCommission({ ...editingCommission, meetingFrequency: e.target.value })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 mb-1 font-bold">Prochaine séance</label>
                  <input
                    type="text"
                    value={editingCommission.nextMeeting}
                    onChange={(e) => setEditingCommission({ ...editingCommission, nextMeeting: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 mb-1 font-bold">Statut</label>
                  <select
                    value={editingCommission.status}
                    onChange={(e) => setEditingCommission({ ...editingCommission, status: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 cursor-pointer"
                  >
                    <option value="Active">Active</option>
                    <option value="En session">En session</option>
                    <option value="Rapport attendu">Rapport attendu</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end gap-2.5">
              <button
                onClick={() => setEditingCommission(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold cursor-pointer"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  if (!editingCommission.name.trim() || !editingCommission.president.trim()) {
                    showFeedback('Nom et président de la commission obligatoires', 'error');
                    return;
                  }
                  saveCommission(editingCommission);
                  setEditingCommission(null);
                  showFeedback('Commission enregistrée avec succès');
                }}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-black uppercase cursor-pointer shadow-md shadow-amber-500/20"
              >
                Enregistrer la Commission
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 6: EDIT GALLERY PHOTO */}
      {editingPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-overlay-in">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-sm w-full space-y-4 text-xs shadow-2xl border border-slate-100 animate-modal-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h4 className="text-base font-black text-slate-900 uppercase">Photo Médiathèque</h4>
              <button
                onClick={() => setEditingPhoto(null)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <ImageUploadField
                label="Photo"
                value={editingPhoto.image}
                onChange={(url) => setEditingPhoto({ ...editingPhoto, image: url })}
              />

              <div>
                <label className="block text-slate-700 mb-1 font-bold">Titre de la photo</label>
                <input
                  type="text"
                  value={editingPhoto.title}
                  onChange={(e) => setEditingPhoto({ ...editingPhoto, title: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-bold">Lieu / Stade</label>
                <input
                  type="text"
                  value={editingPhoto.venue}
                  onChange={(e) => setEditingPhoto({ ...editingPhoto, venue: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-bold">Légende</label>
                <input
                  type="text"
                  value={editingPhoto.caption}
                  onChange={(e) => setEditingPhoto({ ...editingPhoto, caption: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end gap-2.5">
              <button
                onClick={() => setEditingPhoto(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold cursor-pointer"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  saveGalleryPhoto(editingPhoto);
                  setEditingPhoto(null);
                  showFeedback('Photo enregistrée');
                }}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-black uppercase cursor-pointer shadow-md shadow-emerald-600/20"
              >
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
