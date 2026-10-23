import { useState, useEffect, useCallback, useMemo } from 'react';
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
import { supabase } from '../lib/supabaseClient';
import { useToast } from '../components/ToastProvider';
import * as api from '../lib/fimfApi';
import type {
  FimfMembership,
  FimfRole,
  SponsorRequest,
  SponsorRequestStatus,
  MemberRequest,
  MemberRequestStatus,
} from '../lib/fimfApi';

export interface AdminAuditLog {
  id: string;
  timestamp: string;
  action: string;
  target: string;
  author: string;
}

export interface FimfPartner {
  id: string;
  name: string;
  category: string;
}

// 1. Membres & Dirigeants de la Fédération
export interface FimfOfficial {
  id: string;
  name: string;
  role: string;
  department: 'Comité Exécutif' | 'Direction Technique' | 'Commission Centrale' | 'Secrétariat Général' | 'Commission Médicale' | 'Arbitrage' | string;
  email: string;
  phone: string;
  mandateStart: string;
  mandateEnd: string;
  status: 'Actif' | 'En mission' | 'Honoraire' | 'En congé' | string;
  bio: string;
  photoUrl?: string;
  powers?: string[];
}

// 2. Commissions Fédérales Spécialisées
export interface FimfCommission {
  id: string;
  name: string;
  president: string;
  membersCount: number;
  description: string;
  meetingFrequency: string;
  nextMeeting: string;
  status: 'Active' | 'En session' | 'Rapport attendu' | string;
}

const DEFAULT_OFFICIALS: FimfOfficial[] = [
  {
    id: 'off-1',
    name: 'Alain Kouassi',
    role: 'Président de la FIMF',
    department: 'Comité Exécutif',
    email: 'president@fimf.ci',
    phone: '+225 07 07 12 34 56',
    mandateStart: '2023',
    mandateEnd: '2027',
    status: 'Actif',
    bio: 'Fondateur & Membre du Comité Exécutif WMF Afrique. Supervise la stratégie nationale.',
    powers: ['Signature des conventions', 'Représentation WMF/AMF', 'Agrément fédéral'],
  },
  {
    id: 'off-2',
    name: 'Dr. Éric Bamba',
    role: '1er Vice-Président',
    department: 'Comité Exécutif',
    email: 'eric.bamba@fimf.ci',
    phone: '+225 05 05 23 45 67',
    mandateStart: '2023',
    mandateEnd: '2027',
    status: 'Actif',
    bio: 'Chargé des Compétitions, de l\'Arbitrage et des relations avec les ligues régionales.',
    powers: ['Homologation des calendriers', 'Coordination arbitrage'],
  },
  {
    id: 'off-3',
    name: 'Martial N\'Dri',
    role: 'Secrétaire Général',
    department: 'Secrétariat Général',
    email: 'secretariat@fimf.ci',
    phone: '+225 01 02 34 56 78',
    mandateStart: '2022',
    mandateEnd: '2026',
    status: 'Actif',
    bio: 'Gestion de l\'administration générale, délivrance des affiliations et correspondances ministérielles.',
    powers: ['Délivrance licences', 'Comptes-rendus AG', 'Correspondance ministérielle'],
  },
  {
    id: 'off-4',
    name: 'Mamadou Diop',
    role: 'Directeur Technique National (DTN)',
    department: 'Direction Technique',
    email: 'dtn@fimf.ci',
    phone: '+225 07 48 99 11 22',
    mandateStart: '2022',
    mandateEnd: '2026',
    status: 'Actif',
    bio: 'Pilote le développement sportif, les sélections nationales Éléphants Mini-Foot et la formation des entraîneurs.',
    powers: ['Sélections nationales', 'Homologation entraîneurs', 'Stages techniques'],
  },
  {
    id: 'off-5',
    name: 'Dr. Sylvie Konan',
    role: 'Présidente Commission Médicale',
    department: 'Commission Médicale',
    email: 'medical@fimf.ci',
    phone: '+225 07 11 22 33 44',
    mandateStart: '2023',
    mandateEnd: '2027',
    status: 'Actif',
    bio: 'Suivi sanitaire des athlètes, protocole d\'urgence sur les terrains et lutte anti-dopage.',
    powers: ['Validation certificats médicaux', 'Protocole secours terrain'],
  },
  {
    id: 'off-6',
    name: 'Patrick Anoma',
    role: 'Trésorier Général',
    department: 'Comité Exécutif',
    email: 'tresorerie@fimf.ci',
    phone: '+225 05 99 88 77 66',
    mandateStart: '2023',
    mandateEnd: '2027',
    status: 'Actif',
    bio: 'Gestion financière, budget fédéral et conformité des subventions et partenariats.',
    powers: ['Comptabilité générale', 'Gestion des primes fédérales'],
  },
  {
    id: 'off-7',
    name: 'Bertin Gnagne',
    role: 'Responsable Commission Centrale des Arbitres (CCA)',
    department: 'Arbitrage',
    email: 'arbitrage@fimf.ci',
    phone: '+225 01 44 55 66 77',
    mandateStart: '2023',
    mandateEnd: '2027',
    status: 'Actif',
    bio: 'Désignation hebdomadaire du corps arbitral pour les championnats et coupes nationales.',
    powers: ['Désignation arbitres', 'Sanctions disciplinaires terrain', 'Examens d\'arbitrage'],
  },
];

const DEFAULT_COMMISSIONS: FimfCommission[] = [
  {
    id: 'com-1',
    name: 'Commission d\'Organisation des Compétitions (COC)',
    president: 'Dr. Éric Bamba',
    membersCount: 6,
    description: 'Organisation matérielle, homologation des résultats et gestion des recours sportifs.',
    meetingFrequency: 'Hebdomadaire (Chaque Mardi)',
    nextMeeting: '30 Septembre 2025',
    status: 'Active',
  },
  {
    id: 'com-2',
    name: 'Commission Centrale des Arbitres (CCA)',
    president: 'Bertin Gnagne',
    membersCount: 8,
    description: 'Formation, notation, tests physiques et affectations des arbitres officiels.',
    meetingFrequency: 'Bimensuelle',
    nextMeeting: '02 Octobre 2025',
    status: 'Active',
  },
  {
    id: 'com-3',
    name: 'Commission Juridique et de Discipline',
    president: 'Me Kouadio Koffi',
    membersCount: 5,
    description: 'Traitement des réclamations, litiges inter-clubs et sanctions disciplinaires.',
    meetingFrequency: 'Sur saisine',
    nextMeeting: '08 Octobre 2025',
    status: 'En session',
  },
  {
    id: 'com-4',
    name: 'Commission Médicale et Anti-Dopage',
    president: 'Dr. Sylvie Konan',
    membersCount: 4,
    description: 'Protocoles de réanimation, visites médicales préalables aux licences et contrôle anti-dopage.',
    meetingFrequency: 'Mensuelle',
    nextMeeting: '15 Octobre 2025',
    status: 'Active',
  },
];

// Anciennes clés localStorage : nettoyées une seule fois au chargement
const LEGACY_STORAGE_KEYS = [
  'fimf_admin_clubs',
  'fimf_admin_matches',
  'fimf_admin_news',
  'fimf_admin_competitions',
  'fimf_admin_gallery',
  'fimf_admin_stats',
  'fimf_admin_partners',
  'fimf_admin_audit_logs',
  'fimf_admin_officials',
  'fimf_admin_commissions',
];

// Auteur des actions, maintenu à jour via la session Supabase
let currentAuthorEmail: string | null = null;

function currentAuthor(): string {
  return currentAuthorEmail ?? 'Super-Administrateur FIMF';
}

async function refreshAuthor(): Promise<void> {
  const { data } = await supabase.auth.getSession();
  currentAuthorEmail = data.session?.user?.email ?? null;
}

export function useAdminData() {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [gallery, setGallery] = useState<GalleryPhoto[]>([]);
  const [heroSlides, setHeroSlides] = useState<HeroSlide[]>([]);
  const [fimfStats, setFimfStats] = useState(FIMF_STATS);
  const [partners, setPartners] = useState<FimfPartner[]>(PARTNERS);
  const [officials, setOfficials] = useState<FimfOfficial[]>([]);
  const [commissions, setCommissions] = useState<FimfCommission[]>([]);
  const [sponsorRequests, setSponsorRequests] = useState<SponsorRequest[]>([]);
  const [memberRequests, setMemberRequests] = useState<MemberRequest[]>([]);
  const [logs, setLogs] = useState<AdminAuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Rôle de l'utilisateur connecté : 'admin' (fédéral) ou 'dirigeant' (restreint à son club)
  const toast = useToast();
  const [membership, setMembership] = useState<FimfMembership | null>(null);
  const myRole: FimfRole | null = membership?.role ?? null;
  const myClubId = membership?.clubId ?? null;

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [c, m, n, comp, g, hs, st, p, o, comm, sp, mr, lg, mem] = await Promise.all([
        api.fetchClubs(),
        api.fetchMatches(),
        api.fetchNews(),
        api.fetchCompetitions(),
        api.fetchGallery(),
        api.fetchHeroSlides().catch(() => DEFAULT_HERO_SLIDES),
        api.fetchStats().catch(() => FIMF_STATS),
        api.fetchPartners().catch(() => PARTNERS as FimfPartner[]),
        api.fetchOfficials().catch(() => DEFAULT_OFFICIALS) as Promise<FimfOfficial[]>,
        api.fetchCommissions().catch(() => DEFAULT_COMMISSIONS) as Promise<FimfCommission[]>,
        api.fetchSponsorRequests().catch(() => []) as Promise<SponsorRequest[]>,
        api.fetchMemberRequests().catch(() => []) as Promise<MemberRequest[]>,
        api.fetchLogs().catch(() => []) as Promise<AdminAuditLog[]>,
        // Rôle du compte connecté (admin fédéral / dirigeant / null pour un membre simple) :
        // attendu dans le Promise.all pour que `loading=false` garantisse un rôle fiable.
        api.fetchMyClubMembership().catch(() => null) as Promise<FimfMembership | null>,
      ]);
      setClubs(c);
      setMatches(m);
      setNews(n);
      setCompetitions(comp);
      setGallery(g);
      setHeroSlides(hs);
      setFimfStats(st);
      setPartners(p);
      setOfficials(o);
      setCommissions(comm);
      setSponsorRequests(sp);
      setMemberRequests(mr);
      setLogs(lg);
      setMembership(mem);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur de chargement des données');
      // Fallback sur les données statiques en cas d'indisponibilité de la base
      setClubs(CLUBS_DATA);
      setMatches(MATCHES_DATA);
      setNews(NEWS_DATA);
      setCompetitions(COMPETITIONS_DATA);
      setGallery(GALLERY_PHOTOS);
      setHeroSlides(DEFAULT_HERO_SLIDES);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Purge des anciennes données localStorage migrées vers Supabase
    LEGACY_STORAGE_KEYS.forEach((k) => localStorage.removeItem(k));
    refreshAuthor();
    loadAll();
  }, [loadAll]);

  const addLog = useCallback((action: string, target: string) => {
    api.insertAuditLog(action, target, currentAuthor());
    setLogs((prev) => [
      {
        id: `log-${Date.now()}`,
        timestamp: new Date().toLocaleString('fr-FR'),
        action,
        target,
        author: currentAuthor(),
      },
      ...prev.slice(0, 49),
    ]);
  }, []);

  /**
   * Écriture optimiste : si la base refuse l'opération (RLS, réseau),
   * l'état local est restauré et l'administrateur est prévenu.
   * Les erreurs ne sont plus avalées dans la console : elles remontent à l'écran.
   */
  const persist = useCallback(
    (label: string, rollback: () => void, promise: Promise<unknown>, onSuccess?: () => void) => {
      promise
        .then(() => {
          onSuccess?.();
        })
        .catch((e: unknown) => {
          rollback();
          const message = e instanceof Error ? e.message : String(e);
          console.error(label, message);
          toast.error(`Enregistrement refusé : ${label}`, message);
        });
    },
    [toast],
  );

  // ------------------------------------------------------------------
  // CLUBS
  // ------------------------------------------------------------------
  const saveClub = (club: Club) => {
    const snapshot = clubs;
    setClubs((prev) => {
      const idx = prev.findIndex((c) => c.id === club.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = club;
        return copy;
      }
      return [club, ...prev];
    });
    persist(
      'club',
      () => setClubs(snapshot),
      api.upsertClub(club),
      () => addLog('Mise à jour du club', club.name),
    );
  };

  const deleteClub = (clubId: string) => {
    const snapshot = clubs;
    const club = clubs.find((c) => c.id === clubId);
    setClubs((prev) => prev.filter((c) => c.id !== clubId));
    persist(
      'club',
      () => setClubs(snapshot),
      api.deleteClubRow(clubId),
      () => addLog('Suppression de club', club?.name || clubId),
    );
  };

  // ------------------------------------------------------------------
  // MATCHS
  // ------------------------------------------------------------------
  const saveMatch = (match: Match) => {
    const snapshot = matches;
    setMatches((prev) => {
      const idx = prev.findIndex((m) => m.id === match.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = match;
        return copy;
      }
      return [match, ...prev];
    });
    persist(
      'match',
      () => setMatches(snapshot),
      api.upsertMatch(match),
      () => addLog('Enregistrement du match', `${match.homeTeamId} vs ${match.awayTeamId}`),
    );
  };

  const deleteMatch = (matchId: string) => {
    const snapshot = matches;
    setMatches((prev) => prev.filter((m) => m.id !== matchId));
    persist(
      'match',
      () => setMatches(snapshot),
      api.deleteMatchRow(matchId),
      () => addLog('Suppression de match', matchId),
    );
  };

  // ------------------------------------------------------------------
  // ACTUALITÉS
  // ------------------------------------------------------------------
  const saveNews = (article: NewsArticle) => {
    const snapshot = news;
    setNews((prev) => {
      const idx = prev.findIndex((n) => n.id === article.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = article;
        return copy;
      }
      return [article, ...prev];
    });
    persist(
      'article',
      () => setNews(snapshot),
      api.upsertNewsArticle(article),
      () => addLog('Publication / Modification actualité', article.title),
    );
  };

  const deleteNews = (articleId: string) => {
    const snapshot = news;
    const a = news.find((n) => n.id === articleId);
    setNews((prev) => prev.filter((n) => n.id !== articleId));
    persist(
      'article',
      () => setNews(snapshot),
      api.deleteNewsArticle(articleId),
      () => addLog('Suppression d\'actualité', a?.title || articleId),
    );
  };

  // ------------------------------------------------------------------
  // COMPÉTITIONS
  // ------------------------------------------------------------------
  const saveCompetition = (comp: Competition) => {
    const snapshot = competitions;
    setCompetitions((prev) => {
      const idx = prev.findIndex((c) => c.id === comp.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = comp;
        return copy;
      }
      return [comp, ...prev];
    });
    persist(
      'compétition',
      () => setCompetitions(snapshot),
      api.upsertCompetition(comp),
      () => addLog('Mise à jour de compétition', comp.title),
    );
  };

  const deleteCompetition = (compId: string) => {
    const snapshot = competitions;
    const c = competitions.find((x) => x.id === compId);
    setCompetitions((prev) => prev.filter((x) => x.id !== compId));
    persist(
      'compétition',
      () => setCompetitions(snapshot),
      api.deleteCompetitionRow(compId),
      () => addLog('Suppression de compétition', c?.title || compId),
    );
  };

  // ------------------------------------------------------------------
  // GALERIE
  // ------------------------------------------------------------------
  const saveGalleryPhoto = (photo: GalleryPhoto) => {
    const snapshot = gallery;
    setGallery((prev) => {
      const idx = prev.findIndex((p) => p.id === photo.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = photo;
        return copy;
      }
      return [photo, ...prev];
    });
    persist(
      'photo de galerie',
      () => setGallery(snapshot),
      api.upsertGalleryPhoto(photo),
      () => addLog('Ajout / Édition photo galerie', photo.title),
    );
  };

  const deleteGalleryPhoto = (photoId: string) => {
    const snapshot = gallery;
    const p = gallery.find((g) => g.id === photoId);
    setGallery((prev) => prev.filter((g) => g.id !== photoId));
    persist(
      'photo de galerie',
      () => setGallery(snapshot),
      api.deleteGalleryPhotoRow(photoId),
      () => addLog('Suppression photo galerie', p?.title || photoId),
    );
  };

  // ------------------------------------------------------------------
  // SLIDES HERO (carrousel page d'accueil)
  // ------------------------------------------------------------------
  const saveHeroSlide = (slide: HeroSlide) => {
    const snapshot = heroSlides;
    setHeroSlides((prev) => {
      const idx = prev.findIndex((s) => s.id === slide.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = slide;
        return copy;
      }
      return [...prev, slide];
    });
    persist(
      'slide du hero',
      () => setHeroSlides(snapshot),
      api.upsertHeroSlide(slide),
      () => addLog('Enregistrement slide hero', slide.title),
    );
  };

  const deleteHeroSlide = (slideId: string) => {
    const snapshot = heroSlides;
    const s = heroSlides.find((x) => x.id === slideId);
    setHeroSlides((prev) => prev.filter((x) => x.id !== slideId));
    persist(
      'slide du hero',
      () => setHeroSlides(snapshot),
      api.deleteHeroSlideRow(slideId),
      () => addLog('Suppression slide hero', s?.title || slideId),
    );
  };

  // ------------------------------------------------------------------
  // STATS
  // ------------------------------------------------------------------
  const saveStats = (newStats: typeof FIMF_STATS) => {
    const snapshot = fimfStats;
    setFimfStats(newStats);
    persist(
      'statistiques',
      () => setFimfStats(snapshot),
      api.updateSiteStats(newStats),
      () => addLog('Actualisation des chiffres clés FIMF', 'Statistiques Fédérales'),
    );
  };

  // ------------------------------------------------------------------
  // PARTENAIRES
  // ------------------------------------------------------------------
  const savePartner = (partner: FimfPartner) => {
    const snapshot = partners;
    setPartners((prev) => {
      const idx = prev.findIndex((p) => p.id === partner.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = partner;
        return copy;
      }
      return [...prev, partner];
    });
    persist(
      'partenaire',
      () => setPartners(snapshot),
      api.upsertPartner(partner),
      () => addLog('Mise à jour partenaire', partner.name),
    );
  };

  const deletePartner = (partnerId: string) => {
    const snapshot = partners;
    setPartners((prev) => prev.filter((p) => p.id !== partnerId));
    persist(
      'partenaire',
      () => setPartners(snapshot),
      api.deletePartnerRow(partnerId),
      () => addLog('Suppression partenaire', partnerId),
    );
  };

  // ------------------------------------------------------------------
  // DIRIGEANTS
  // ------------------------------------------------------------------
  const saveOfficial = (official: FimfOfficial) => {
    const snapshot = officials;
    setOfficials((prev) => {
      const idx = prev.findIndex((o) => o.id === official.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = official;
        return copy;
      }
      return [official, ...prev];
    });
    persist(
      'dirigeant',
      () => setOfficials(snapshot),
      api.upsertOfficial(official),
      () => addLog('Enregistrement / MAJ Dirigeant', `${official.role} - ${official.name}`),
    );
  };

  const deleteOfficial = (officialId: string) => {
    const snapshot = officials;
    const off = officials.find((o) => o.id === officialId);
    setOfficials((prev) => prev.filter((o) => o.id !== officialId));
    persist(
      'dirigeant',
      () => setOfficials(snapshot),
      api.deleteOfficialRow(officialId),
      () => addLog('Suppression Dirigeant fédéral', off?.name || officialId),
    );
  };

  // ------------------------------------------------------------------
  // COMMISSIONS
  // ------------------------------------------------------------------
  const saveCommission = (comm: FimfCommission) => {
    const snapshot = commissions;
    setCommissions((prev) => {
      const idx = prev.findIndex((c) => c.id === comm.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = comm;
        return copy;
      }
      return [...prev, comm];
    });
    persist(
      'commission',
      () => setCommissions(snapshot),
      api.upsertCommission(comm),
      () => addLog('Mise à jour commission', comm.name),
    );
  };

  const deleteCommission = (commId: string) => {
    const snapshot = commissions;
    const c = commissions.find((item) => item.id === commId);
    setCommissions((prev) => prev.filter((item) => item.id !== commId));
    persist(
      'commission',
      () => setCommissions(snapshot),
      api.deleteCommissionRow(commId),
      () => addLog('Suppression commission', c?.name || commId),
    );
  };

  // ------------------------------------------------------------------
  // DEMANDES DE SPONSORING
  // ------------------------------------------------------------------
  const updateSponsorStatus = (id: number, status: SponsorRequestStatus) => {
    const snapshot = sponsorRequests;
    setSponsorRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
    persist(
      'demande de sponsoring',
      () => setSponsorRequests(snapshot),
      api.updateSponsorRequestStatus(id, status),
      () => addLog('Statut demande sponsoring', `#${id} → ${status}`),
    );
  };

  // ------------------------------------------------------------------
  // DEMANDES D'ADHÉSION
  // ------------------------------------------------------------------
  const updateMemberStatus = (id: number, status: MemberRequestStatus) => {
    const snapshot = memberRequests;
    setMemberRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
    persist(
      'demande d\'adhésion',
      () => setMemberRequests(snapshot),
      api.updateMemberRequestStatus(id, status),
      () => addLog('Statut demande adhésion', `#${id} → ${status}`),
    );
  };

  // ------------------------------------------------------------------
  // RÉINITIALISATION
  // ------------------------------------------------------------------
  const resetToFactoryDefaults = () => {
    const snapshot = { clubs, matches, news, competitions, gallery, fimfStats, partners, officials, commissions };
    setClubs(CLUBS_DATA);
    setMatches(MATCHES_DATA);
    setNews(NEWS_DATA);
    setCompetitions(COMPETITIONS_DATA);
    setGallery(GALLERY_PHOTOS);
    setFimfStats(FIMF_STATS);
    setPartners(PARTNERS);
    setOfficials(DEFAULT_OFFICIALS);
    setCommissions(DEFAULT_COMMISSIONS);
    persist(
      'réinitialisation',
      () => {
        setClubs(snapshot.clubs);
        setMatches(snapshot.matches);
        setNews(snapshot.news);
        setCompetitions(snapshot.competitions);
        setGallery(snapshot.gallery);
        setFimfStats(snapshot.fimfStats);
        setPartners(snapshot.partners);
        setOfficials(snapshot.officials);
        setCommissions(snapshot.commissions);
      },
      api.resetAllToDefaults({
        clubs: CLUBS_DATA,
        matches: MATCHES_DATA,
        news: NEWS_DATA,
        competitions: COMPETITIONS_DATA,
        gallery: GALLERY_PHOTOS,
        stats: FIMF_STATS,
        partners: PARTNERS,
        officials: DEFAULT_OFFICIALS,
        commissions: DEFAULT_COMMISSIONS,
      }),
      () => addLog('Réinitialisation complète', 'Données par défaut rétablies'),
    );
  };

  // Un dirigeant ne gère que SON club : on restreint la liste affichée.
  // L'admin fédéral voit tous les clubs.
  const clubsView = useMemo(() => {
    if (myRole === 'dirigeant' && myClubId) {
      return clubs.filter((c) => c.id === myClubId);
    }
    return clubs;
  }, [clubs, myRole, myClubId]);

  return {
    clubs: clubsView,
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
    updateSponsorStatus,
    memberRequests,
    updateMemberStatus,
    logs,
    loading,
    error,
    reload: loadAll,
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
  };
}
