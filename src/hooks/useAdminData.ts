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

  // ------------------------------------------------------------------
  // CLUBS
  // ------------------------------------------------------------------
  const saveClub = (club: Club) => {
    setClubs((prev) => {
      const idx = prev.findIndex((c) => c.id === club.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = club;
        return copy;
      }
      return [club, ...prev];
    });
    api.upsertClub(club)
      .then(() => addLog('Mise à jour du club', club.name))
      .catch((e) => console.error('saveClub:', e.message));
  };

  const deleteClub = (clubId: string) => {
    const club = clubs.find((c) => c.id === clubId);
    setClubs((prev) => prev.filter((c) => c.id !== clubId));
    api.deleteClubRow(clubId)
      .then(() => addLog('Suppression de club', club?.name || clubId))
      .catch((e) => console.error('deleteClub:', e.message));
  };

  // ------------------------------------------------------------------
  // MATCHS
  // ------------------------------------------------------------------
  const saveMatch = (match: Match) => {
    setMatches((prev) => {
      const idx = prev.findIndex((m) => m.id === match.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = match;
        return copy;
      }
      return [match, ...prev];
    });
    api.upsertMatch(match)
      .then(() => addLog('Enregistrement du match', `${match.homeTeamId} vs ${match.awayTeamId}`))
      .catch((e) => console.error('saveMatch:', e.message));
  };

  const deleteMatch = (matchId: string) => {
    setMatches((prev) => prev.filter((m) => m.id !== matchId));
    api.deleteMatchRow(matchId)
      .then(() => addLog('Suppression de match', matchId))
      .catch((e) => console.error('deleteMatch:', e.message));
  };

  // ------------------------------------------------------------------
  // ACTUALITÉS
  // ------------------------------------------------------------------
  const saveNews = (article: NewsArticle) => {
    setNews((prev) => {
      const idx = prev.findIndex((n) => n.id === article.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = article;
        return copy;
      }
      return [article, ...prev];
    });
    api.upsertNewsArticle(article)
      .then(() => addLog('Publication / Modification actualité', article.title))
      .catch((e) => console.error('saveNews:', e.message));
  };

  const deleteNews = (articleId: string) => {
    const a = news.find((n) => n.id === articleId);
    setNews((prev) => prev.filter((n) => n.id !== articleId));
    api.deleteNewsArticle(articleId)
      .then(() => addLog('Suppression d\'actualité', a?.title || articleId))
      .catch((e) => console.error('deleteNews:', e.message));
  };

  // ------------------------------------------------------------------
  // COMPÉTITIONS
  // ------------------------------------------------------------------
  const saveCompetition = (comp: Competition) => {
    setCompetitions((prev) => {
      const idx = prev.findIndex((c) => c.id === comp.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = comp;
        return copy;
      }
      return [comp, ...prev];
    });
    api.upsertCompetition(comp)
      .then(() => addLog('Mise à jour de compétition', comp.title))
      .catch((e) => console.error('saveCompetition:', e.message));
  };

  const deleteCompetition = (compId: string) => {
    const c = competitions.find((x) => x.id === compId);
    setCompetitions((prev) => prev.filter((x) => x.id !== compId));
    api.deleteCompetitionRow(compId)
      .then(() => addLog('Suppression de compétition', c?.title || compId))
      .catch((e) => console.error('deleteCompetition:', e.message));
  };

  // ------------------------------------------------------------------
  // GALERIE
  // ------------------------------------------------------------------
  const saveGalleryPhoto = (photo: GalleryPhoto) => {
    setGallery((prev) => {
      const idx = prev.findIndex((p) => p.id === photo.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = photo;
        return copy;
      }
      return [photo, ...prev];
    });
    api.upsertGalleryPhoto(photo)
      .then(() => addLog('Ajout / Édition photo galerie', photo.title))
      .catch((e) => console.error('saveGalleryPhoto:', e.message));
  };

  const deleteGalleryPhoto = (photoId: string) => {
    const p = gallery.find((g) => g.id === photoId);
    setGallery((prev) => prev.filter((g) => g.id !== photoId));
    api.deleteGalleryPhotoRow(photoId)
      .then(() => addLog('Suppression photo galerie', p?.title || photoId))
      .catch((e) => console.error('deleteGalleryPhoto:', e.message));
  };

  // ------------------------------------------------------------------
  // SLIDES HERO (carrousel page d'accueil)
  // ------------------------------------------------------------------
  const saveHeroSlide = (slide: HeroSlide) => {
    setHeroSlides((prev) => {
      const idx = prev.findIndex((s) => s.id === slide.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = slide;
        return copy;
      }
      return [...prev, slide];
    });
    api.upsertHeroSlide(slide)
      .then(() => addLog('Enregistrement slide hero', slide.title))
      .catch((e) => console.error('saveHeroSlide:', e.message));
  };

  const deleteHeroSlide = (slideId: string) => {
    const s = heroSlides.find((x) => x.id === slideId);
    setHeroSlides((prev) => prev.filter((x) => x.id !== slideId));
    api.deleteHeroSlideRow(slideId)
      .then(() => addLog('Suppression slide hero', s?.title || slideId))
      .catch((e) => console.error('deleteHeroSlide:', e.message));
  };

  // ------------------------------------------------------------------
  // STATS
  // ------------------------------------------------------------------
  const saveStats = (newStats: typeof FIMF_STATS) => {
    setFimfStats(newStats);
    api.updateSiteStats(newStats)
      .then(() => addLog('Actualisation des chiffres clés FIMF', 'Statistiques Fédérales'))
      .catch((e) => console.error('saveStats:', e.message));
  };

  // ------------------------------------------------------------------
  // PARTENAIRES
  // ------------------------------------------------------------------
  const savePartner = (partner: FimfPartner) => {
    setPartners((prev) => {
      const idx = prev.findIndex((p) => p.id === partner.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = partner;
        return copy;
      }
      return [...prev, partner];
    });
    api.upsertPartner(partner)
      .then(() => addLog('Mise à jour partenaire', partner.name))
      .catch((e) => console.error('savePartner:', e.message));
  };

  const deletePartner = (partnerId: string) => {
    setPartners((prev) => prev.filter((p) => p.id !== partnerId));
    api.deletePartnerRow(partnerId)
      .then(() => addLog('Suppression partenaire', partnerId))
      .catch((e) => console.error('deletePartner:', e.message));
  };

  // ------------------------------------------------------------------
  // DIRIGEANTS
  // ------------------------------------------------------------------
  const saveOfficial = (official: FimfOfficial) => {
    setOfficials((prev) => {
      const idx = prev.findIndex((o) => o.id === official.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = official;
        return copy;
      }
      return [official, ...prev];
    });
    api.upsertOfficial(official)
      .then(() => addLog('Enregistrement / MAJ Dirigeant', `${official.role} - ${official.name}`))
      .catch((e) => console.error('saveOfficial:', e.message));
  };

  const deleteOfficial = (officialId: string) => {
    const off = officials.find((o) => o.id === officialId);
    setOfficials((prev) => prev.filter((o) => o.id !== officialId));
    api.deleteOfficialRow(officialId)
      .then(() => addLog('Suppression Dirigeant fédéral', off?.name || officialId))
      .catch((e) => console.error('deleteOfficial:', e.message));
  };

  // ------------------------------------------------------------------
  // COMMISSIONS
  // ------------------------------------------------------------------
  const saveCommission = (comm: FimfCommission) => {
    setCommissions((prev) => {
      const idx = prev.findIndex((c) => c.id === comm.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = comm;
        return copy;
      }
      return [...prev, comm];
    });
    api.upsertCommission(comm)
      .then(() => addLog('Mise à jour commission', comm.name))
      .catch((e) => console.error('saveCommission:', e.message));
  };

  const deleteCommission = (commId: string) => {
    const c = commissions.find((item) => item.id === commId);
    setCommissions((prev) => prev.filter((item) => item.id !== commId));
    api.deleteCommissionRow(commId)
      .then(() => addLog('Suppression commission', c?.name || commId))
      .catch((e) => console.error('deleteCommission:', e.message));
  };

  // ------------------------------------------------------------------
  // DEMANDES DE SPONSORING
  // ------------------------------------------------------------------
  const updateSponsorStatus = (id: number, status: SponsorRequestStatus) => {
    setSponsorRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
    api.updateSponsorRequestStatus(id, status)
      .then(() => addLog('Statut demande sponsoring', `#${id} → ${status}`))
      .catch((e) => console.error('updateSponsorStatus:', e.message));
  };

  // ------------------------------------------------------------------
  // DEMANDES D'ADHÉSION
  // ------------------------------------------------------------------
  const updateMemberStatus = (id: number, status: MemberRequestStatus) => {
    setMemberRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
    api.updateMemberRequestStatus(id, status)
      .then(() => addLog('Statut demande adhésion', `#${id} → ${status}`))
      .catch((e) => console.error('updateMemberStatus:', e.message));
  };

  // ------------------------------------------------------------------
  // RÉINITIALISATION
  // ------------------------------------------------------------------
  const resetToFactoryDefaults = () => {
    setClubs(CLUBS_DATA);
    setMatches(MATCHES_DATA);
    setNews(NEWS_DATA);
    setCompetitions(COMPETITIONS_DATA);
    setGallery(GALLERY_PHOTOS);
    setFimfStats(FIMF_STATS);
    setPartners(PARTNERS);
    setOfficials(DEFAULT_OFFICIALS);
    setCommissions(DEFAULT_COMMISSIONS);
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
    })
      .then(() => addLog('Réinitialisation complète', 'Données par défaut rétablies'))
      .catch((e) => console.error('resetToFactoryDefaults:', e.message));
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
