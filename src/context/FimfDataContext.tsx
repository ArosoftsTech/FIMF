import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import {
  CLUBS_DATA,
  MATCHES_DATA,
  NEWS_DATA,
  COMPETITIONS_DATA,
  GALLERY_PHOTOS,
  DEFAULT_HERO_SLIDES,
  FIMF_STATS,
  PARTNERS,
  Club,
  Match,
  NewsArticle,
  Competition,
  GalleryPhoto,
  HeroSlide,
} from '../data/fimfData';
import * as api from '../lib/fimfApi';
import { supabase } from '../lib/supabaseClient';

interface FimfDataContextValue {
  clubs: Club[];
  matches: Match[];
  news: NewsArticle[];
  competitions: Competition[];
  gallery: GalleryPhoto[];
  heroSlides: HeroSlide[];
  fimfStats: typeof FIMF_STATS;
  partners: typeof PARTNERS;
  loading: boolean;
  error: string | null;
  reload: () => void;
}

// Contexte brut exporté : permet un accès optionnel (composants réutilisables
// comme ClubBadge qui peuvent être rendus hors provider).
export const FimfDataContext = createContext<FimfDataContextValue | undefined>(undefined);

export function FimfDataProvider({ children }: { children: ReactNode }) {
  const [clubs, setClubs] = useState<Club[]>(CLUBS_DATA);
  const [matches, setMatches] = useState<Match[]>(MATCHES_DATA);
  const [news, setNews] = useState<NewsArticle[]>(NEWS_DATA);
  const [competitions, setCompetitions] = useState<Competition[]>(COMPETITIONS_DATA);
  const [gallery, setGallery] = useState<GalleryPhoto[]>(GALLERY_PHOTOS);
  const [heroSlides, setHeroSlides] = useState<HeroSlide[]>(DEFAULT_HERO_SLIDES);
  const [fimfStats, setFimfStats] = useState(FIMF_STATS);
  const [partners, setPartners] = useState(PARTNERS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAll = useCallback(async () => {
    setError(null);
    try {
      const [c, m, n, comp, g, hs, st, p] = await Promise.all([
        api.fetchClubs(),
        api.fetchMatches(),
        api.fetchNews(),
        api.fetchCompetitions(),
        api.fetchGallery(),
        api.fetchHeroSlides().catch(() => DEFAULT_HERO_SLIDES),
        api.fetchStats().catch(() => FIMF_STATS),
        api.fetchPartners().catch(() => PARTNERS),
      ]);
      setClubs(c.length > 0 ? c : CLUBS_DATA);
      setMatches(m);
      setNews(n);
      setCompetitions(comp);
      setGallery(g);
      setHeroSlides(hs.length > 0 ? hs : DEFAULT_HERO_SLIDES);
      setFimfStats(st);
      setPartners(p);
    } catch (e) {
      // Base injoignable : on garde les données statiques de repli
      setError(e instanceof Error ? e.message : 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // Rafraîchissement automatique : les changements en base (scores, clubs,
  // articles) mettent à jour toutes les vues publiques sans rechargement.
  useEffect(() => {
    const channel = supabase
      .channel('fimf-public-data')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matches' }, () => loadAll())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clubs' }, () => loadAll())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'news_articles' }, () => loadAll())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'hero_slides' }, () => loadAll())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadAll]);

  return (
    <FimfDataContext.Provider
    value={{
      clubs,
      matches,
      news,
      competitions,
      gallery,
      heroSlides,
      fimfStats,
      partners,
      loading,
      error,
      reload: loadAll,
    }}
    >
      {children}
    </FimfDataContext.Provider>
  );
}

export function useFimfData(): FimfDataContextValue {
  const ctx = useContext(FimfDataContext);
  if (!ctx) throw new Error('useFimfData doit être utilisé dans un FimfDataProvider');
  return ctx;
}
