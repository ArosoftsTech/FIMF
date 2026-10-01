import React, { useState, useRef, useEffect } from 'react';
import { FimfLogo } from './FimfLogo';
import { useAuth } from '../context/AuthContext';
import {
  Search,
  UserCheck,
  UserRound,
  Menu,
  X,
  Bell,
  ChevronDown,
  ChevronRight,
  Trophy,
  CalendarDays,
  Map,
  History,
  Target,
  Users,
  Landmark,
  ScrollText,
  CheckCircle,
  Award,
  Handshake,
  Phone,
  Table2,
  BarChart3,
  CalendarRange,
  FileText,
  Globe2,
  Flag,
  Zap,
  CircleDot,
} from 'lucide-react';
import { NotificationsDropdown } from './NotificationsDropdown';
import { FimfNotification } from '@/src/hooks/useNotifications';
import { Match, Club } from '@/src/data/fimfData';

export type NavPage =
  | 'accueil'
  | 'la-fimf'
  | 'championnat'
  | 'calendrier'
  | 'competitions'
  | 'equipes'
  | 'classement'
  | 'actualites'
  | 'galerie'
  | 'contact'
  | 'admin'
  | 'membre';

/** Sous-onglets institutionnels de la page « LA FIMF » */
export type FimfSubTab =
  | 'presentation'
  | 'mission'
  | 'organisation'
  | 'dirigeants'
  | 'palmares'
  | 'echeances'
  | 'documents'
  | 'affiliation'
  | 'arbitrage'
  | 'partenaires'
  | 'contacts';

/** Sous-onglets de la page « CHAMPIONNAT » */
export type ChampionnatSubTab = 'presentation' | 'calendrier' | 'classement' | 'resultats' | 'equipes';

/** Sous-onglets de la page « COMPÉTITIONS » */
export type CompetitionsCategory =
  | 'Toutes'
  | 'Championnat national'
  | 'Coupe nationale'
  | 'Sélections nationales'
  | 'Compétitions internationales';

/** Cible de navigation : page seule ou page + sous-onglet */
export interface NavTarget {
  page: NavPage;
  subTab?: string;
}

interface NavbarProps {
  currentPage: NavPage;
  onNavigate: (page: NavPage) => void;
  /** Navigation profonde : page + sous-onglet éventuel */
  onNavigateTo?: (target: NavTarget) => void;
  onOpenSearch: () => void;
  /** Ouvre le formulaire de sponsoring / partenariat */
  onOpenSponsoring: () => void;
  /** Ouvre le popup « Connexion / Devenir membre » */
  onOpenAuth: () => void;
  /** Ouvre l'espace membre de l'utilisateur connecté */
  onOpenMemberArea: () => void;
  notifications?: FimfNotification[];
  unreadNotifsCount?: number;
  onMarkNotificationAsRead?: (id: string) => void;
  onMarkAllNotificationsAsRead?: () => void;
  onSelectMatch?: (match: Match) => void;
  onSelectClub?: (club: Club) => void;
}

/** Items de premier niveau du menu desktop */
type TopItem = {
  id: string;
  label: string;
  page?: NavPage;
  children?: {
    label: string;
    desc?: string;
    icon?: React.ReactNode;
    target: NavTarget;
  }[];
};

const fimfChildren: TopItem['children'] = [
  { label: 'Présentation & Historique', desc: 'Fondée en janvier 2017', icon: <History className="w-4 h-4" />, target: { page: 'la-fimf', subTab: 'presentation' } },
  { label: 'Objectifs & Vision', desc: 'Les 9 missions fédérales', icon: <Target className="w-4 h-4" />, target: { page: 'la-fimf', subTab: 'mission' } },
  { label: 'Organisation fédérale', desc: 'Organes & membres', icon: <Users className="w-4 h-4" />, target: { page: 'la-fimf', subTab: 'organisation' } },
  { label: 'Dirigeants & Autorités', desc: 'FIMF, AMC, WMF', icon: <Landmark className="w-4 h-4" />, target: { page: 'la-fimf', subTab: 'dirigeants' } },
  { label: 'Palmarès international', desc: "Championne d'Afrique 2018", icon: <Trophy className="w-4 h-4" />, target: { page: 'la-fimf', subTab: 'palmares' } },
  { label: 'Échéances 2026-2027', desc: 'CAN, Mondial, LDC AMC', icon: <CalendarDays className="w-4 h-4" />, target: { page: 'la-fimf', subTab: 'echeances' } },
  { label: 'Statuts & Règlements', desc: 'Textes officiels', icon: <ScrollText className="w-4 h-4" />, target: { page: 'la-fimf', subTab: 'documents' } },
  { label: 'Affiliation des clubs', desc: 'Procédure en 3 étapes', icon: <CheckCircle className="w-4 h-4" />, target: { page: 'la-fimf', subTab: 'affiliation' } },
  { label: 'Arbitrage', desc: 'Formation des officiels', icon: <Award className="w-4 h-4" />, target: { page: 'la-fimf', subTab: 'arbitrage' } },
  { label: 'Partenaires', desc: 'WMF, AMC, institutions', icon: <Handshake className="w-4 h-4" />, target: { page: 'la-fimf', subTab: 'partenaires' } },
  { label: 'Contacts officiels', desc: 'Siège & téléphones', icon: <Phone className="w-4 h-4" />, target: { page: 'la-fimf', subTab: 'contacts' } },
];

const championnatChildren: TopItem['children'] = [
  { label: 'Présentation', desc: 'Édition 2026 : 12 équipes', icon: <CircleDot className="w-4 h-4" />, target: { page: 'championnat', subTab: 'presentation' } },
  { label: 'Calendrier complet', desc: 'Toutes les journées', icon: <CalendarRange className="w-4 h-4" />, target: { page: 'calendrier' } },
  { label: 'Calendrier D1', desc: 'Programme des journées', icon: <CalendarDays className="w-4 h-4" />, target: { page: 'championnat', subTab: 'calendrier' } },
  { label: 'Classement D1', desc: 'Division 1 en direct', icon: <Table2 className="w-4 h-4" />, target: { page: 'championnat', subTab: 'classement' } },
  { label: 'Classement général', desc: 'Toutes les divisions', icon: <Trophy className="w-4 h-4" />, target: { page: 'classement' } },
  { label: 'Résultats', desc: 'Derniers scores', icon: <BarChart3 className="w-4 h-4" />, target: { page: 'championnat', subTab: 'resultats' } },
  { label: 'Équipes', desc: 'Les clubs engagés', icon: <Users className="w-4 h-4" />, target: { page: 'championnat', subTab: 'equipes' } },
];

const competitionsChildren: TopItem['children'] = [
  { label: 'Toutes les compétitions', desc: 'Vue complète', icon: <Map className="w-4 h-4" />, target: { page: 'competitions', subTab: 'Toutes' } },
  { label: 'Championnat national', desc: 'Élite 2026', icon: <Zap className="w-4 h-4" />, target: { page: 'competitions', subTab: 'Championnat national' } },
  { label: 'Coupe nationale', desc: 'Élimination directe', icon: <FileText className="w-4 h-4" />, target: { page: 'competitions', subTab: 'Coupe nationale' } },
  { label: 'Sélections nationales', desc: 'CAN 2027, Mondial 2027', icon: <Flag className="w-4 h-4" />, target: { page: 'competitions', subTab: 'Sélections nationales' } },
  { label: 'Compétitions internationales', desc: 'LDC AMC 2026', icon: <Globe2 className="w-4 h-4" />, target: { page: 'competitions', subTab: 'Compétitions internationales' } },
];

const NAV_TOP_ITEMS: TopItem[] = [
  { id: 'accueil', label: 'ACCUEIL', page: 'accueil' },
  { id: 'la-fimf', label: 'LA FIMF', page: 'la-fimf', children: fimfChildren },
  { id: 'championnat', label: 'CHAMPIONNAT', page: 'championnat', children: championnatChildren },
  { id: 'competitions', label: 'COMPÉTITIONS', page: 'competitions', children: competitionsChildren },
  { id: 'equipes', label: 'ÉQUIPES', page: 'equipes' },
  { id: 'actualites', label: 'ACTUALITÉS', page: 'actualites' },
  { id: 'galerie', label: 'GALERIE', page: 'galerie' },
  { id: 'contact', label: 'CONTACT', page: 'contact' },
];

/** Pages sans entrée dans la barre desktop, accessibles via le drawer mobile */
const NAV_MOBILE_ONLY_ITEMS: TopItem[] = [
  { id: 'calendrier', label: 'CALENDRIER', page: 'calendrier' },
  { id: 'classement', label: 'CLASSEMENT', page: 'classement' },
];

export const Navbar: React.FC<NavbarProps> = ({
  currentPage,
  onNavigate,
  onNavigateTo,
  onOpenSearch,
  onOpenSponsoring,
  onOpenAuth,
  onOpenMemberArea,
  notifications = [],
  unreadNotifsCount = 0,
  onMarkNotificationAsRead = () => {},
  onMarkAllNotificationsAsRead = () => {},
  onSelectMatch = () => {},
  onSelectClub = () => {},
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifsOpen, setNotifsOpen] = useState(false);
  const { user } = useAuth();
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [openMobileAccordion, setOpenMobileAccordion] = useState<string | null>(null);
  const closeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Ferme le dropdown actif quand la page change
  useEffect(() => {
    setOpenDropdown(null);
  }, [currentPage]);

  // Nettoyage du timer de fermeture différée (desktop)
  useEffect(() => {
    return () => {
      if (closeTimeout.current) clearTimeout(closeTimeout.current);
    };
  }, []);

  const openMenu = (id: string) => {
    if (closeTimeout.current) {
      clearTimeout(closeTimeout.current);
      closeTimeout.current = null;
    }
    setOpenDropdown(id);
  };

  const scheduleClose = () => {
    if (closeTimeout.current) clearTimeout(closeTimeout.current);
    closeTimeout.current = setTimeout(() => setOpenDropdown(null), 150);
  };

  const handleNavClick = (page: NavPage) => {
    onNavigate(page);
    setMobileMenuOpen(false);
    setOpenDropdown(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /** Navigation vers une page + sous-onglet (via les dropdowns) */
  const handleNavigateTo = (target: NavTarget) => {
    setOpenDropdown(null);
    setMobileMenuOpen(false);
    if (onNavigateTo) {
      onNavigateTo(target);
    } else {
      onNavigate(target.page);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isItemActive = (item: TopItem) => {
    if (item.page) return currentPage === item.page;
    return false;
  };

  const hasActiveChild = (item: TopItem) => item.page === currentPage;

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Zone 1: Brand Logo */}
          <button
            onClick={() => handleNavClick('accueil')}
            className="flex items-center text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ea580c] rounded-lg p-1 transition-transform active:scale-98"
            aria-label="FIMF Accueil"
          >
            <FimfLogo variant="dark" size="md" />
          </button>

          {/* Zone 2: Navigation Links (Desktop) */}
          <nav className="hidden xl:flex items-stretch h-full" aria-label="Navigation principale">
            {NAV_TOP_ITEMS.map((item) => {
              const hasDropdown = !!item.children;
              const active = isItemActive(item) || hasActiveChild(item);
              const isOpen = openDropdown === item.id;

              if (!hasDropdown) {
                return (
                  <button
                    key={item.id}
                    onClick={() => item.page && handleNavClick(item.page)}
                    className={`relative h-full flex items-center px-2.5 2xl:px-4 text-[11px] 2xl:text-xs tracking-wider font-bold transition-colors cursor-pointer select-none whitespace-nowrap focus-visible:outline-none ${
                      active ? 'text-[#ea580c]' : 'text-slate-700 hover:text-[#006039]'
                    }`}
                  >
                    {item.label}
                    {active && (
                      <span
                        className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#ea580c] rounded-t-sm"
                        aria-hidden="true"
                      />
                    )}
                  </button>
                );
              }

              return (
                <div
                  key={item.id}
                  className="relative h-full flex items-stretch"
                  onMouseEnter={() => openMenu(item.id)}
                  onMouseLeave={scheduleClose}
                >
                  <button
                    onClick={() => (item.page ? handleNavClick(item.page) : openMenu(item.id))}
                    aria-expanded={isOpen}
                    aria-haspopup="true"
                    className={`relative h-full flex items-center gap-1 px-2.5 2xl:px-4 text-[11px] 2xl:text-xs tracking-wider font-bold transition-colors cursor-pointer select-none whitespace-nowrap focus-visible:outline-none ${
                      active ? 'text-[#ea580c]' : 'text-slate-700 hover:text-[#006039]'
                    }`}
                  >
                    {item.label}
                    <ChevronDown
                      className={`w-3 h-3 transition-transform duration-200 ${isOpen ? 'rotate-180 text-[#ea580c]' : 'text-slate-400'}`}
                    />
                    {active && (
                      <span
                        className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#ea580c] rounded-t-sm"
                        aria-hidden="true"
                      />
                    )}
                  </button>                  {/* Dropdown / Mega-menu */}
                  {isOpen && (
                    <div
                      className={`absolute top-full left-0 pt-1 z-50 ${
                        item.children!.length! > 6
                          ? 'w-[min(560px,calc(100vw-2rem))]'
                          : 'w-[min(340px,calc(100vw-2rem))]'
                      }`}
                      onMouseEnter={() => openMenu(item.id)}
                    >
                      <div
                        className={`bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden animate-dropdown-in ${
                          item.children!.length! > 6
                            ? 'grid grid-cols-2 gap-x-4 gap-y-1 p-3 fimf-stagger'
                            : 'p-2 fimf-stagger'
                        }`}
                        role="menu"
                      >
                        {item.children!.map((child) => (
                          <button
                            key={child.label}
                            onClick={() => handleNavigateTo(child.target)}
                            role="menuitem"
                            className={`w-full text-left p-3 rounded-lg hover:bg-orange-50 transition-colors group cursor-pointer ${
                              item.children!.length! > 6 ? 'flex items-start gap-3' : 'flex items-start gap-3'
                            }`}
                          >
                            {child.icon && (
                              <span className="mt-0.5 w-8 h-8 shrink-0 rounded-lg bg-emerald-50 text-[#006039] flex items-center justify-center group-hover:bg-[#006039] group-hover:text-white transition-colors">
                                {child.icon}
                              </span>
                            )}
                            <span className="min-w-0">
                              <span className="flex items-center gap-1 font-bold text-slate-800 text-xs group-hover:text-[#ea580c] transition-colors">
                                {child.label}
                                <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                              </span>
                              {child.desc && (
                                <span className="block text-[10.5px] text-slate-500 mt-0.5 leading-snug">
                                  {child.desc}
                                </span>
                              )}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          {/* Zone 3: Actions (Search + Notifications + Espace Club) */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            <button
              onClick={onOpenSearch}
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ea580c] cursor-pointer"
              aria-label="Recherche rapide"
              title="Rechercher sur le site de la FIMF"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setNotifsOpen(!notifsOpen)}
                className={`relative p-2 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ea580c] cursor-pointer ${
                  notifsOpen
                    ? 'bg-orange-100 text-[#ea580c]'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
                aria-label="Notifications des clubs favoris"
                title="Notifications des matchs et résultats"
              >
                <Bell className="w-4 h-4" />
                {unreadNotifsCount > 0 && (
                  <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-[#ea580c] text-white text-[9.5px] font-black flex items-center justify-center ring-2 ring-white">
                    {unreadNotifsCount > 9 ? '9+' : unreadNotifsCount}
                  </span>
                )}
              </button>

              <NotificationsDropdown
                isOpen={notifsOpen}
                onClose={() => setNotifsOpen(false)}
                notifications={notifications}
                unreadCount={unreadNotifsCount}
                onMarkAsRead={onMarkNotificationAsRead}
                onMarkAllAsRead={onMarkAllNotificationsAsRead}
                onSelectMatch={onSelectMatch}
                onSelectClub={onSelectClub}
              />
            </div>

            <button
              onClick={onOpenSponsoring}
              className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 text-xs font-bold text-white bg-[#f97316] hover:bg-[#ea580c] active:bg-[#c2410c] rounded-md shadow-xs hover:shadow transition-all duration-150 uppercase tracking-wide cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#ea580c]"
              title="Devenir partenaire ou sponsor de la FIMF"
            >
              <Handshake className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">SPONSORING</span>
            </button>

            {/* Connexion / Devenir membre — ou Espace membre si session active */}
            {user ? (
              <button
                onClick={onOpenMemberArea}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-black text-white bg-[#004724] hover:bg-[#006039] rounded-md shadow-xs transition-colors uppercase tracking-wider cursor-pointer border border-emerald-800"
                title="Mon espace membre"
              >
                <UserRound className="w-3.5 h-3.5" />
                <span className="hidden md:inline">MON ESPACE</span>
              </button>
            ) : (
              <button
                onClick={onOpenAuth}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-black text-white bg-slate-900 hover:bg-slate-800 rounded-md shadow-xs transition-colors uppercase tracking-wider cursor-pointer border border-slate-700"
                title="Se connecter ou devenir membre de la FIMF"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span className="hidden md:inline">CONNEXION</span>
              </button>
            )}

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="xl:hidden p-2 text-slate-700 hover:text-slate-950 rounded-lg hover:bg-slate-100 transition-colors"
              aria-label="Menu principal"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="xl:hidden border-t border-slate-200 bg-white shadow-lg animate-dropdown-in">
          <div className="px-4 pt-3 pb-6 space-y-1 max-h-[calc(100vh-5rem)] overflow-y-auto">
            {[...NAV_TOP_ITEMS, ...NAV_MOBILE_ONLY_ITEMS].map((item) => {
              const active = hasActiveChild(item);
              const accordionOpen = openMobileAccordion === item.id;

              if (!item.children) {
                return (
                  <button
                    key={item.id}
                    onClick={() => item.page && handleNavClick(item.page)}
                    className={`w-full text-left px-3 py-2.5 rounded-md text-sm font-bold tracking-wide flex items-center justify-between transition-colors ${
                      active ? 'bg-orange-50 text-[#ea580c]' : 'text-slate-800 hover:bg-slate-100'
                    }`}
                  >
                    <span>{item.label}</span>
                    {active && <span className="w-2 h-2 rounded-full bg-[#ea580c]" />}
                  </button>
                );
              }

              return (
                <div key={item.id}>
                  <button
                    onClick={() => setOpenMobileAccordion(accordionOpen ? null : item.id)}
                    aria-expanded={accordionOpen}
                    className={`w-full text-left px-3 py-2.5 rounded-md text-sm font-bold tracking-wide flex items-center justify-between transition-colors ${
                      active ? 'bg-orange-50 text-[#ea580c]' : 'text-slate-800 hover:bg-slate-100'
                    }`}
                  >
                    <span>{item.label}</span>
                    <ChevronDown
                      className={`w-4 h-4 transition-transform duration-200 ${
                        accordionOpen ? 'rotate-180 text-[#ea580c]' : 'text-slate-400'
                      }`}
                    />
                  </button>

                  {accordionOpen && (
                    <div className="mt-1 mb-2 ml-3 pl-3 border-l-2 border-slate-200 space-y-0.5 animate-accordion-in">
                      {item.children.map((child) => (
                        <button
                          key={child.label}
                          onClick={() => handleNavigateTo(child.target)}
                          className="w-full text-left px-3 py-2 rounded-md text-xs font-semibold text-slate-600 hover:bg-orange-50 hover:text-[#ea580c] transition-colors flex items-center gap-2"
                        >
                          {child.icon && <span className="text-[#006039]">{child.icon}</span>}
                          <span>{child.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Actions Sponsoring + Connexion (remplacent Espace Club / Admin) */}
            <div className="pt-3 mt-2 border-t border-slate-200 grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenSponsoring();
                }}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-bold text-white bg-[#f97316] hover:bg-[#ea580c] rounded-md uppercase tracking-wide cursor-pointer"
              >
                <Handshake className="w-3.5 h-3.5" />
                SPONSORING
              </button>
              {user ? (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenMemberArea();
                  }}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-black text-white bg-[#004724] hover:bg-[#006039] rounded-md uppercase tracking-wider cursor-pointer"
                >
                  <UserRound className="w-3.5 h-3.5" />
                  MON ESPACE
                </button>
              ) : (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenAuth();
                  }}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-black text-white bg-slate-900 hover:bg-slate-800 rounded-md uppercase tracking-wider cursor-pointer"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  CONNEXION
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
