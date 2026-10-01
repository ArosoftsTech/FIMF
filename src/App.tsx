import React, { useState } from 'react';
import { Navbar, NavPage, NavTarget } from './components/Navbar';
import { Footer } from './components/Footer';
import { AccueilView } from './components/views/AccueilView';
import { LaFimfView } from './components/views/LaFimfView';
import { ChampionnatView } from './components/views/ChampionnatView';
import { CalendrierView } from './components/views/CalendrierView';
import { CompetitionsView } from './components/views/CompetitionsView';
import { EquipesView } from './components/views/EquipesView';
import { ClassementView } from './components/views/ClassementView';
import { ActualitesView } from './components/views/ActualitesView';
import { GalerieView } from './components/views/GalerieView';
import { ContactView } from './components/views/ContactView';
import { AdminDashboardView } from './components/views/AdminDashboardView';
import { MemberAreaView } from './components/views/MemberAreaView';
import { UserRound } from 'lucide-react';

import { MatchDetailsModal } from './components/modals/MatchDetailsModal';
import { ClubProfileModal } from './components/modals/ClubProfileModal';
import { ArticleReaderModal } from './components/modals/ArticleReaderModal';
import { PhotoLightboxModal } from './components/modals/PhotoLightboxModal';
import { EspaceClubModal } from './components/modals/EspaceClubModal';
import { SponsoringModal } from './components/modals/SponsoringModal';
import { AuthChoiceModal } from './components/modals/AuthChoiceModal';
import { GlobalSearchModal } from './components/modals/GlobalSearchModal';
import { CompetitionModal } from './components/modals/CompetitionModal';

import {
  Club,
  Match,
  NewsArticle,
  Competition,
  GALLERY_PHOTOS,
  CLUBS_DATA,
} from './data/fimfData';
import { useFavoriteClubs } from './hooks/useFavoriteClubs';
import { useNotifications } from './hooks/useNotifications';
import { NotificationToast } from './components/NotificationToast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { FimfDataProvider, useFimfData } from './context/FimfDataContext';
import { AdminLoginView } from './components/AdminLoginView';
import { BackToTopButton } from './components/BackToTopButton';

export default function App() {
  return (
    <AuthProvider>
      <FimfDataProvider>
        <AppInner />
      </FimfDataProvider>
    </AuthProvider>
  );
}

/** Porte d'entrée de l'espace membre pour les visiteurs non connectés. */
function MemberAreaGate({
  onOpenAuth,
  onBack,
}: {
  onOpenAuth: () => void;
  onBack: () => void;
}) {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password || busy) return;
    setBusy(true);
    setError(null);
    const { error: signInError } = await signIn(email.trim(), password);
    setBusy(false);
    if (signInError) {
      setError(
        signInError.includes('Invalid login credentials')
          ? 'Email ou mot de passe incorrect.'
          : signInError.includes('Email not confirmed')
            ? 'Votre email n\u2019est pas encore confirmé.'
            : signInError,
      );
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden w-full max-w-md">
        <div className="bg-[#004724] px-6 py-5 text-white flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[#ea580c]">
            <UserRound className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-black uppercase tracking-tight">Espace membre</h2>
            <p className="text-[11px] text-emerald-200">Connectez-vous à votre compte FIMF</p>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold">
              {error}
            </div>
          )}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Email *</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="vous@exemple.ci"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#ea580c]/50"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Mot de passe *</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#ea580c]/50"
            />
          </div>
          <button
            type="submit"
            disabled={busy}
            className="w-full py-3 rounded-xl bg-[#004724] hover:bg-[#006039] disabled:opacity-60 text-white text-xs font-black uppercase tracking-wider transition-colors cursor-pointer"
          >
            {busy ? 'Connexion…' : 'Se connecter'}
          </button>
          <p className="text-xs text-slate-500 text-center">
            Pas encore membre ?{' '}
            <button
              type="button"
              onClick={onOpenAuth}
              className="text-[#004724] font-black hover:underline cursor-pointer"
            >
              Devenir membre
            </button>
          </p>
          <button
            type="button"
            onClick={onBack}
            className="w-full py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-[11px] font-black uppercase transition-colors cursor-pointer"
          >
            Retour à l'accueil
          </button>
        </form>
      </div>
    </div>
  );
}

function AppInner() {
  const [currentPage, setCurrentPage] = useState<NavPage>('accueil');
  // Sous-onglet demandé par navigation profonde (menu déroulant) — consommé par la vue cible
  const [pendingSubTab, setPendingSubTab] = useState<string | undefined>(undefined);
  const { user, loading: authLoading } = useAuth();
  const { clubs: liveClubs, gallery: liveGallery } = useFimfData();
  const { favoriteIds, favoriteClubs, isFavorite, toggleFavorite } = useFavoriteClubs();
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    toastNotification,
    dismissToast,
  } = useNotifications(favoriteIds);

  // Modals state
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [selectedClub, setSelectedClub] = useState<Club | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);
  const [selectedCompetition, setSelectedCompetition] = useState<Competition | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isClubSpaceOpen, setIsClubSpaceOpen] = useState(false);
  const [isSponsoringOpen, setIsSponsoringOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  const handleNavigate = (page: NavPage) => {
    setCurrentPage(page);
    setPendingSubTab(undefined);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /** Navigation profonde : page + sous-onglet (depuis les menus déroulants) */
  const handleNavigateTo = (target: NavTarget) => {
    setPendingSubTab(target.subTab);
    setCurrentPage(target.page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleViewClubById = (clubId: string) => {
    const club = liveClubs.find((c) => c.id === clubId) ?? CLUBS_DATA.find((c) => c.id === clubId);
    if (club) {
      setSelectedClub(club);
    }
  };

  if (currentPage === 'admin') {
    // Porte d'entrée admin : session requise, sinon écran de connexion
    if (authLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-emerald-500 border-t-transparent"></div>
        </div>
      );
    }
    if (!user) {
      return <AdminLoginView onBack={() => handleNavigate('accueil')} />;
    }
    return (
      <AdminDashboardView
        onExit={() => handleNavigate('accueil')}
        onSelectClub={setSelectedClub}
        onSelectMatch={setSelectedMatch}
        onSelectArticle={setSelectedArticle}
        onSelectCompetition={setSelectedCompetition}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#f8faf9] text-slate-800">
      {/* Top Navbar */}
      <Navbar
        currentPage={currentPage}
        onNavigate={handleNavigate}
        onNavigateTo={handleNavigateTo}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenSponsoring={() => setIsSponsoringOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenMemberArea={() => {
          setIsAuthOpen(false);
          handleNavigate('membre');
        }}
        notifications={notifications}
        unreadNotifsCount={unreadCount}
        onMarkNotificationAsRead={markAsRead}
        onMarkAllNotificationsAsRead={markAllAsRead}
        onSelectMatch={setSelectedMatch}
        onSelectClub={setSelectedClub}
      />

      {/* Main Page View Area */}
      <main className="flex-1">
        {currentPage === 'membre' && (
          authLoading ? (
            <div className="min-h-[60vh] flex items-center justify-center">
              <div className="animate-spin rounded-full h-10 w-10 border-4 border-emerald-600 border-t-transparent"></div>
            </div>
          ) : user ? (
            <MemberAreaView
              onNavigate={handleNavigate}
              onSelectClub={setSelectedClub}
              onSelectMatch={setSelectedMatch}
              favoriteIds={favoriteIds}
              onToggleFavorite={toggleFavorite}
              onExit={() => handleNavigate('accueil')}
            />
          ) : (
            <MemberAreaGate
              onOpenAuth={() => setIsAuthOpen(true)}
              onBack={() => handleNavigate('accueil')}
            />
          )
        )}

        {currentPage === 'accueil' && (
          <AccueilView
            onNavigate={handleNavigate}
            onSelectClub={setSelectedClub}
            onSelectArticle={setSelectedArticle}
            onSelectMatch={setSelectedMatch}
            onSelectCompetition={setSelectedCompetition}
            onOpenPhotoLightbox={(index) => setLightboxIndex(index)}
            favoriteIds={favoriteIds}
            favoriteClubs={favoriteClubs}
            onToggleFavorite={toggleFavorite}
            onOpenAuth={() => setIsAuthOpen(true)}
            onMemberArea={() => handleNavigate('membre')}
          />
        )}

        {currentPage === 'la-fimf' && (
          <LaFimfView
            onOpenClubSpace={() => setIsClubSpaceOpen(true)}
            onNavigateContact={() => handleNavigate('contact')}
            initialTab={pendingSubTab}
          />
        )}

        {currentPage === 'championnat' && (
          <ChampionnatView
            onSelectMatch={setSelectedMatch}
            onSelectClub={setSelectedClub}
            onNavigateClassement={() => handleNavigate('classement')}
            onNavigateCalendrier={() => handleNavigate('calendrier')}
            initialSubTab={pendingSubTab}
          />
        )}

        {currentPage === 'calendrier' && (
          <CalendrierView
            onSelectMatch={setSelectedMatch}
            onSelectClub={setSelectedClub}
            favoriteIds={favoriteIds}
            onToggleFavorite={toggleFavorite}
          />
        )}

        {currentPage === 'competitions' && (
          <CompetitionsView
            onSelectCompetition={setSelectedCompetition}
            onNavigateCalendrier={() => handleNavigate('calendrier')}
            initialCategory={pendingSubTab}
          />
        )}

        {currentPage === 'equipes' && (
          <EquipesView
            onSelectClub={setSelectedClub}
            favoriteIds={favoriteIds}
            onToggleFavorite={toggleFavorite}
          />
        )}

        {currentPage === 'classement' && (
          <ClassementView
            onSelectClub={setSelectedClub}
          />
        )}

        {currentPage === 'actualites' && (
          <ActualitesView
            onSelectArticle={setSelectedArticle}
          />
        )}

        {currentPage === 'galerie' && (
          <GalerieView
            onOpenPhotoLightbox={(index) => setLightboxIndex(index)}
          />
        )}

        {currentPage === 'contact' && <ContactView />}
      </main>

      {/* Footer */}
      <Footer onNavigate={handleNavigate} />

      {/* Modals & Overlays */}
      <MatchDetailsModal
        match={selectedMatch}
        onClose={() => setSelectedMatch(null)}
        onViewClub={handleViewClubById}
      />

      <ClubProfileModal
        club={selectedClub}
        onClose={() => setSelectedClub(null)}
        isFavorite={selectedClub ? isFavorite(selectedClub.id) : false}
        onToggleFavorite={toggleFavorite}
      />

      <ArticleReaderModal
        article={selectedArticle}
        onClose={() => setSelectedArticle(null)}
      />

      <CompetitionModal
        competition={selectedCompetition}
        onClose={() => setSelectedCompetition(null)}
        onNavigateChampionnat={() => handleNavigate('championnat')}
      />

      {lightboxIndex !== null && (
        <PhotoLightboxModal
          photos={liveGallery.length > 0 ? liveGallery : GALLERY_PHOTOS}
          currentIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onNavigate={(newIdx) => setLightboxIndex(newIdx)}
        />
      )}

      <EspaceClubModal
        isOpen={isClubSpaceOpen}
        onClose={() => setIsClubSpaceOpen(false)}
      />

      <SponsoringModal
        isOpen={isSponsoringOpen}
        onClose={() => setIsSponsoringOpen(false)}
      />

      <AuthChoiceModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onAdminLogin={() => handleNavigate('admin')}
        onMemberArea={() => {
          setIsAuthOpen(false);
          handleNavigate('membre');
        }}
      />

      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectClub={setSelectedClub}
        onSelectArticle={setSelectedArticle}
        onSelectCompetition={setSelectedCompetition}
      />

      {/* Floating Match Alert Toast */}
      <NotificationToast
        notification={toastNotification}
        onClose={dismissToast}
        onSelectMatch={setSelectedMatch}
        onSelectClub={setSelectedClub}
      />

      {/* Bouton flottant retour en haut de page */}
      <BackToTopButton />
    </div>
  );
}
