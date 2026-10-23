import heroImg from '@/src/assets/images/hero_ivory_coast_minifootball_1790335944178.jpg';
import hqImg from '@/src/assets/images/fimf_headquarters_building_1790335956733.jpg';
import huddleImg from '@/src/assets/images/team_huddle_elephants_1790335968616.jpg';
import trophyImg from '@/src/assets/images/championship_trophy_gold_1790335980246.jpg';
import refereeImg from '@/src/assets/images/referee_training_session_1790335992555.jpg';

export interface Player {
  number: number;
  name: string;
  position: 'Gardien' | 'Défenseur' | 'Milieu' | 'Attaquant';
  age: number;
  goals: number;
  assists?: number;
  cleanSheets?: number;
  matchesPlayed?: number;
  rating?: number;
  /** Photo de profil (référence bucket ou URL complète). */
  photoUrl?: string;
}

export interface Club {
  id: string;
  name: string;
  shortName: string;
  city: string;
  commune: string;
  region: string;
  division: 'Division 1' | 'Division 2' | 'Régionale' | string;
  founded: number;
  president: string;
  coach: string;
  stadium: string;
  primaryColor: string;
  secondaryColor: string;
  badgeBg: string;
  badgeBorder: string;
  badgeIcon: string;
  /** Logo officiel uploadé (URL complète du bucket fimf-media). Prioritaire sur le badge SVG. */
  logoUrl?: string;
  stats: {
    rank: number;
    played: number;
    won: number;
    drawn: number;
    lost: number;
    goalsFor: number;
    goalsAgainst: number;
    goalDiff: number;
    points: number;
    homeRank: number;
    awayRank: number;
  };
  form: ('W' | 'D' | 'L')[];
  squad: Player[];
}

export interface Match {
  id: string;
  journee: number;
  dateStr: string;
  timeStr: string;
  homeTeamId: string;
  awayTeamId: string;
  venue: string;
  status: 'scheduled' | 'live' | 'finished';
  competitionId?: string;
  competitionName?: string;
  roundName?: string;
  scoreHome?: number;
  scoreAway?: number;
  referee?: string;
  scorers?: { player: string; team: string; min: number }[];
  events?: { type: 'goal' | 'yellow' | 'red'; min: number; player: string; team: string }[];
}

export interface NewsArticle {
  id: string;
  title: string;
  category: 'Championnat' | 'Compétitions' | 'Sélections' | 'Formation' | 'Institutionnel';
  dateStr: string;
  timestamp: string;
  readTime: string;
  image: string;
  excerpt: string;
  content: string[];
  tags: string[];
  author: string;
}

export interface Competition {
  id: string;
  title: string;
  type: 'national' | 'cup' | 'selection' | 'youth' | 'women' | 'regional' | 'international';
  category: 'Championnat national' | 'Coupe nationale' | 'Sélections nationales' | 'Compétitions internationales';
  subtitle: string;
  description: string;
  image: string;
  participantsCount: number;
  currentHolder: string;
  period: string;
  rulesHighlight: string[];
  isMajor: boolean;
  /** Pastille d'actualité affichée sur la carte (ex. « Tirage au sort »). */
  badge?: string;
}

export interface GalleryPhoto {
  id: string;
  title: string;
  category: 'Compétitions' | 'Équipes' | 'Sélections' | 'Événements';
  image: string;
  caption: string;
  dateStr: string;
  venue: string;
}

/** Slide du carrousel de la section hero (page d'accueil) — administrable depuis le dashboard. */
export interface HeroSlide {
  id: string;
  /** Ligne 1 du titre (texte sombre) */
  title: string;
  /** Ligne 2 du titre, mise en avant en orange */
  highlight: string;
  /** Paragraphe descriptif */
  subtitle: string;
  /** Image de fond (URL complète ou référence bucket fimf-media) */
  image: string;
  /** Libellé du bouton principal (optionnel) */
  ctaLabel?: string;
  /** Page de navigation du bouton principal (optionnel) */
  ctaPage?: string;
  /** Libellé du bouton secondaire (optionnel) */
  ctaSecondaryLabel?: string;
  /** Page de navigation du bouton secondaire (optionnel) */
  ctaSecondaryPage?: string;
  /** Ordre d'affichage dans le carrousel */
  sortOrder: number;
  /** Slide active (les slides inactives ne sont pas affichées sur le site public) */
  active: boolean;
}

export const DEFAULT_HERO_SLIDES: HeroSlide[] = [
  {
    id: 'hero-1',
    title: 'LE MINI-FOOTBALL',
    highlight: 'IVOIRIEN',
    subtitle: "Une fédération engagée pour le développement, la structuration et la promotion du mini-football en Côte d'Ivoire.",
    image: 'hero_ivory_coast_minifootball_1790335944178.jpg',
    ctaLabel: 'VOIR LE CHAMPIONNAT',
    ctaPage: 'championnat',
    ctaSecondaryLabel: 'DÉCOUVRIR LA FIMF',
    ctaSecondaryPage: 'la-fimf',
    sortOrder: 1,
    active: true,
  },
  {
    id: 'hero-2',
    title: 'CAN MINI FOOTBALL',
    highlight: 'TIRAGE CONNU',
    subtitle: "Les Éléphants héritent du groupe D avec le Tchad, le Mali et le Soudan du Sud. Rendez-vous à Conakry du 09 au 24 janvier 2027.",
    image: 'team_huddle_elephants_1790335968616.jpg',
    ctaLabel: 'TOUS LES GROUPES',
    ctaPage: 'competitions',
    ctaSecondaryLabel: "LIRE L'ACTUALITÉ",
    ctaSecondaryPage: 'actualites',
    sortOrder: 2,
    active: true,
  },
  {
    id: 'hero-3',
    title: 'CHAMPIONNAT NATIONAL',
    highlight: 'ÉDITION 2026',
    subtitle: "12 équipes, 4 week-ends de compétition et 26 matchs au Temple du Foot de l'Université d'Abidjan. Entrée libre !",
    image: 'championship_trophy_gold_1790335980246.jpg',
    ctaLabel: 'LE CHAMPIONNAT',
    ctaPage: 'championnat',
    ctaSecondaryLabel: 'LES CLUBS',
    ctaSecondaryPage: 'equipes',
    sortOrder: 3,
    active: true,
  },
];

export const FIMF_STATS = {
  clubsCount: '+ 100',
  clubsLabel: 'CLUBS AFFILIÉS',
  playersCount: '+ 2 000',
  playersLabel: 'JOUEURS LICENCIÉS',
  refereesCount: '+ 100',
  refereesLabel: 'ARBITRES FORMÉS',
  pitchesCount: '10',
  pitchesLabel: 'TERRAINS HOMOLOGUÉS'
};

export const PARTNERS = [
  { id: '1', name: 'Ministère des Sports', category: 'Institutionnel' },
  { id: '2', name: 'LONACI', category: 'Partenaire Officiel' },
  { id: '3', name: 'Orange Côte d\'Ivoire', category: 'Télécom' },
  { id: '4', name: 'SOTRA', category: 'Mobilité' },
  { id: '5', name: 'CIE & SODECI', category: 'Énergie & Eau' },
  { id: '6', name: 'FIF', category: 'Fédération Partenaire' },
  { id: '7', name: 'WMF World Minifootball', category: 'International' },
];

export const CLUBS_DATA: Club[] = [
  {
    id: 'as-plateau',
    name: 'AS PLATEAU',
    shortName: 'Plateau',
    city: 'Abidjan',
    commune: 'Plateau',
    region: 'Abidjan',
    division: 'Division 1',
    founded: 2018,
    president: 'Kouamé N\'Guessan',
    coach: 'Jean-Luc Gondo',
    stadium: 'Complexe Sportif de Bingerville',
    primaryColor: '#006039',
    secondaryColor: '#ffffff',
    badgeBg: 'bg-emerald-900',
    badgeBorder: 'border-emerald-600',
    badgeIcon: 'tower',
    stats: {
      rank: 1,
      played: 3,
      won: 2,
      drawn: 1,
      lost: 0,
      goalsFor: 8,
      goalsAgainst: 3,
      goalDiff: 5,
      points: 7,
      homeRank: 1,
      awayRank: 2,
    },
    form: ['W', 'D', 'W'],
    squad: [
      { number: 1, name: 'Sylvain Cissé', position: 'Gardien', age: 24, goals: 0, assists: 0, cleanSheets: 2, matchesPlayed: 3, rating: 8.2 },
      { number: 4, name: 'Armand Bamba', position: 'Défenseur', age: 26, goals: 1, assists: 1, cleanSheets: 2, matchesPlayed: 3, rating: 7.6 },
      { number: 7, name: 'Christian Yao', position: 'Milieu', age: 23, goals: 3, assists: 2, cleanSheets: 0, matchesPlayed: 3, rating: 8.5 },
      { number: 9, name: 'Ibrahim Touré', position: 'Attaquant', age: 25, goals: 4, assists: 1, cleanSheets: 0, matchesPlayed: 3, rating: 9.0 },
      { number: 10, name: 'Moussa Bakayoko', position: 'Milieu', age: 27, goals: 0, assists: 3, cleanSheets: 0, matchesPlayed: 3, rating: 7.9 },
      { number: 11, name: 'Serge Diomandé', position: 'Attaquant', age: 22, goals: 0, assists: 1, cleanSheets: 0, matchesPlayed: 2, rating: 6.8 },
    ],
  },
  {
    id: 'fc-riviera',
    name: 'FC RIVIERA',
    shortName: 'Riviera',
    city: 'Abidjan',
    commune: 'Cocody Riviera',
    region: 'Abidjan',
    division: 'Division 1',
    founded: 2019,
    president: 'Patrice Diallo',
    coach: 'Mamadou Keïta',
    stadium: 'Terrain Riviera Golf',
    primaryColor: '#059669',
    secondaryColor: '#10b981',
    badgeBg: 'bg-teal-900',
    badgeBorder: 'border-teal-500',
    badgeIcon: 'shield-green',
    stats: {
      rank: 2,
      played: 3,
      won: 2,
      drawn: 0,
      lost: 1,
      goalsFor: 6,
      goalsAgainst: 3,
      goalDiff: 3,
      points: 6,
      homeRank: 2,
      awayRank: 1,
    },
    form: ['W', 'W', 'L'],
    squad: [
      { number: 16, name: 'Alain Dago', position: 'Gardien', age: 25, goals: 0, assists: 0, cleanSheets: 1, matchesPlayed: 3, rating: 7.8 },
      { number: 3, name: 'Eric Bohui', position: 'Défenseur', age: 27, goals: 0, assists: 1, cleanSheets: 1, matchesPlayed: 3, rating: 7.4 },
      { number: 8, name: 'Franck Kassi', position: 'Milieu', age: 24, goals: 2, assists: 2, cleanSheets: 0, matchesPlayed: 3, rating: 8.3 },
      { number: 10, name: 'Yannick Gnahoré', position: 'Attaquant', age: 26, goals: 3, assists: 1, cleanSheets: 0, matchesPlayed: 3, rating: 8.7 },
      { number: 14, name: 'Didier Koffi', position: 'Milieu', age: 21, goals: 1, assists: 1, cleanSheets: 0, matchesPlayed: 3, rating: 7.2 },
    ],
  },
  {
    id: 'olympique-yop',
    name: 'OLYMPIQUE YOP',
    shortName: 'O. Yopougon',
    city: 'Abidjan',
    commune: 'Yopougon',
    region: 'Abidjan',
    division: 'Division 1',
    founded: 2020,
    president: 'Lambert Kouassi',
    coach: 'Guy Dembélé',
    stadium: 'Terrain Complexe Yopougon',
    primaryColor: '#1d4ed8',
    secondaryColor: '#f59e0b',
    badgeBg: 'bg-blue-900',
    badgeBorder: 'border-blue-500',
    badgeIcon: 'flame',
    stats: {
      rank: 3,
      played: 3,
      won: 1,
      drawn: 1,
      lost: 1,
      goalsFor: 5,
      goalsAgainst: 4,
      goalDiff: 1,
      points: 4,
      homeRank: 3,
      awayRank: 4,
    },
    form: ['L', 'W', 'D'],
    squad: [
      { number: 1, name: 'Stéphane Badji', position: 'Gardien', age: 23, goals: 0, assists: 0, cleanSheets: 1, matchesPlayed: 3, rating: 7.5 },
      { number: 5, name: 'Gérard Zokora', position: 'Défenseur', age: 28, goals: 1, assists: 0, cleanSheets: 1, matchesPlayed: 3, rating: 7.3 },
      { number: 6, name: 'Boris Konan', position: 'Milieu', age: 25, goals: 1, assists: 2, cleanSheets: 0, matchesPlayed: 3, rating: 7.9 },
      { number: 9, name: 'Arsène Traoré', position: 'Attaquant', age: 24, goals: 3, assists: 0, cleanSheets: 0, matchesPlayed: 3, rating: 8.4 },
    ],
  },
  {
    id: 'sc-marcory',
    name: 'SC MARCORY',
    shortName: 'Marcory',
    city: 'Abidjan',
    commune: 'Marcory',
    region: 'Abidjan',
    division: 'Division 1',
    founded: 2017,
    president: 'Drissa Ouattara',
    coach: 'Hervé Bamba',
    stadium: 'Terrain Jesse Jackson Marcory',
    primaryColor: '#b91c1c',
    secondaryColor: '#111827',
    badgeBg: 'bg-red-950',
    badgeBorder: 'border-red-600',
    badgeIcon: 'panther',
    stats: {
      rank: 4,
      played: 3,
      won: 1,
      drawn: 1,
      lost: 1,
      goalsFor: 4,
      goalsAgainst: 4,
      goalDiff: 0,
      points: 4,
      homeRank: 4,
      awayRank: 3,
    },
    form: ['W', 'L', 'D'],
    squad: [
      { number: 1, name: 'Mohamed Sylla', position: 'Gardien', age: 26, goals: 0, assists: 0, cleanSheets: 1, matchesPlayed: 3, rating: 7.2 },
      { number: 2, name: 'Kouassi Assalé', position: 'Défenseur', age: 23, goals: 0, assists: 1, cleanSheets: 1, matchesPlayed: 3, rating: 7.0 },
      { number: 8, name: 'Abdoulaye Fofana', position: 'Milieu', age: 25, goals: 2, assists: 1, cleanSheets: 0, matchesPlayed: 3, rating: 7.8 },
      { number: 11, name: 'Cédric Tano', position: 'Attaquant', age: 22, goals: 2, assists: 1, cleanSheets: 0, matchesPlayed: 3, rating: 8.1 },
    ],
  },
  {
    id: 'fc-cocody',
    name: 'FC COCODY',
    shortName: 'Cocody',
    city: 'Abidjan',
    commune: 'Cocody',
    region: 'Abidjan',
    division: 'Division 1',
    founded: 2021,
    president: 'Benoît Doffou',
    coach: 'David Adepo',
    stadium: 'Terrain de l\'Université Cocody',
    primaryColor: '#581c87',
    secondaryColor: '#fbbf24',
    badgeBg: 'bg-purple-950',
    badgeBorder: 'border-purple-600',
    badgeIcon: 'crown',
    stats: {
      rank: 5,
      played: 3,
      won: 1,
      drawn: 0,
      lost: 2,
      goalsFor: 3,
      goalsAgainst: 5,
      goalDiff: -2,
      points: 3,
      homeRank: 5,
      awayRank: 6,
    },
    form: ['L', 'W', 'L'],
    squad: [
      { number: 12, name: 'Junior N\'Da', position: 'Gardien', age: 22, goals: 0, assists: 0, cleanSheets: 0, matchesPlayed: 3, rating: 6.9 },
      { number: 4, name: 'Marc Boni', position: 'Défenseur', age: 24, goals: 0, assists: 0, cleanSheets: 0, matchesPlayed: 3, rating: 6.7 },
      { number: 10, name: 'Arthur Seri', position: 'Attaquant', age: 25, goals: 3, assists: 0, cleanSheets: 0, matchesPlayed: 3, rating: 8.2 },
    ],
  },
  {
    id: 'us-abidjan',
    name: 'US ABIDJAN',
    shortName: 'US Abidjan',
    city: 'Abidjan',
    commune: 'Treichville',
    region: 'Abidjan',
    division: 'Division 1',
    founded: 2016,
    president: 'Salif Sanogo',
    coach: 'Charles Kouassi',
    stadium: 'Terrain Treichville Arras',
    primaryColor: '#0f172a',
    secondaryColor: '#e2e8f0',
    badgeBg: 'bg-slate-900',
    badgeBorder: 'border-slate-500',
    badgeIcon: 'eagle',
    stats: {
      rank: 6,
      played: 3,
      won: 0,
      drawn: 2,
      lost: 1,
      goalsFor: 2,
      goalsAgainst: 4,
      goalDiff: -2,
      points: 2,
      homeRank: 6,
      awayRank: 5,
    },
    form: ['D', 'D', 'L'],
    squad: [
      { number: 1, name: 'Fabrice Gouaméné', position: 'Gardien', age: 27, goals: 0, assists: 0, cleanSheets: 1, matchesPlayed: 3, rating: 7.3 },
      { number: 6, name: 'Landry Djiré', position: 'Milieu', age: 24, goals: 1, assists: 1, cleanSheets: 0, matchesPlayed: 3, rating: 7.1 },
      { number: 9, name: 'Gervais Doumbia', position: 'Attaquant', age: 23, goals: 1, assists: 0, cleanSheets: 0, matchesPlayed: 3, rating: 7.0 },
    ],
  },
  {
    id: 'afad',
    name: 'AFAD',
    shortName: 'AFAD Djekanou',
    city: 'Abidjan',
    commune: 'Attécoubé',
    region: 'Abidjan',
    division: 'Division 1',
    founded: 2015,
    president: 'Jacques Anoma Jr.',
    coach: 'Maxime Gouaméné',
    stadium: 'Complexe d\'Attécoubé',
    primaryColor: '#047857',
    secondaryColor: '#fbbf24',
    badgeBg: 'bg-emerald-950',
    badgeBorder: 'border-amber-500',
    badgeIcon: 'shield-star',
    stats: {
      rank: 7,
      played: 3,
      won: 0,
      drawn: 1,
      lost: 2,
      goalsFor: 2,
      goalsAgainst: 6,
      goalDiff: -4,
      points: 1,
      homeRank: 7,
      awayRank: 7,
    },
    form: ['L', 'D', 'L'],
    squad: [
      { number: 1, name: 'Arnaud Coulibaly', position: 'Gardien', age: 23, goals: 0, assists: 0, cleanSheets: 0, matchesPlayed: 3, rating: 6.8 },
      { number: 7, name: 'Yaya Sanogo', position: 'Milieu', age: 21, goals: 1, assists: 1, cleanSheets: 0, matchesPlayed: 3, rating: 7.2 },
      { number: 11, name: 'Roméo Kouadio', position: 'Attaquant', age: 24, goals: 1, assists: 0, cleanSheets: 0, matchesPlayed: 3, rating: 6.9 },
    ],
  },
  {
    id: 'sol-fc',
    name: 'SOL FC',
    shortName: 'SOL FC',
    city: 'Abidjan',
    commune: 'Abobo',
    region: 'Abidjan',
    division: 'Division 1',
    founded: 2020,
    president: 'Hamed Bakayoko',
    coach: 'Lacina Traoré',
    stadium: 'Terrain Municipal d\'Abobo',
    primaryColor: '#ea580c',
    secondaryColor: '#0284c7',
    badgeBg: 'bg-orange-950',
    badgeBorder: 'border-orange-500',
    badgeIcon: 'sun',
    stats: {
      rank: 8,
      played: 3,
      won: 0,
      drawn: 1,
      lost: 2,
      goalsFor: 1,
      goalsAgainst: 6,
      goalDiff: -5,
      points: 1,
      homeRank: 8,
      awayRank: 8,
    },
    form: ['L', 'L', 'D'],
    squad: [
      { number: 16, name: 'Ibrahim Koné', position: 'Gardien', age: 22, goals: 0, assists: 0, cleanSheets: 0, matchesPlayed: 3, rating: 6.6 },
      { number: 5, name: 'Ousmane Touré', position: 'Défenseur', age: 25, goals: 0, assists: 0, cleanSheets: 0, matchesPlayed: 3, rating: 6.7 },
      { number: 10, name: 'Bakary Soro', position: 'Attaquant', age: 23, goals: 1, assists: 0, cleanSheets: 0, matchesPlayed: 3, rating: 7.1 },
    ],
  },
];

export const TOP_SCORERS = [
  { rank: 1, name: 'Ibrahim Touré', team: 'AS PLATEAU', goals: 4, penalties: 1, matches: 3 },
  { rank: 2, name: 'Yannick Gnahoré', team: 'FC RIVIERA', goals: 3, penalties: 0, matches: 3 },
  { rank: 3, name: 'Christian Yao', team: 'AS PLATEAU', goals: 3, penalties: 0, matches: 3 },
  { rank: 4, name: 'Arsène Traoré', team: 'OLYMPIQUE YOP', goals: 3, penalties: 1, matches: 3 },
  { rank: 5, name: 'Arthur Seri', team: 'FC COCODY', goals: 3, penalties: 0, matches: 3 },
  { rank: 6, name: 'Franck Kassi', team: 'FC RIVIERA', goals: 2, penalties: 0, matches: 3 },
  { rank: 7, name: 'Cédric Tano', team: 'SC MARCORY', goals: 2, penalties: 0, matches: 3 },
];

export const TOP_ASSISTS = [
  { rank: 1, name: 'Moussa Bakayoko', team: 'AS PLATEAU', assists: 4, matches: 3 },
  { rank: 2, name: 'Didier Koffi', team: 'FC RIVIERA', assists: 3, matches: 3 },
  { rank: 3, name: 'Boris Konan', team: 'OLYMPIQUE YOP', assists: 2, matches: 3 },
  { rank: 4, name: 'Abdoulaye Fofana', team: 'SC MARCORY', assists: 2, matches: 3 },
  { rank: 5, name: 'Marc Boni', team: 'FC COCODY', assists: 2, matches: 3 },
];

export const MATCHES_DATA: Match[] = [
  // CHAMPIONNAT NATIONAL - Journée 3 (Upcoming)
  {
    id: 'm-j3-1',
    journee: 3,
    competitionId: 'champ-national',
    competitionName: 'Championnat National',
    roundName: '3ème Journée',
    dateStr: 'Sam. 28 Sept. 2025',
    timeStr: '16h00',
    homeTeamId: 'as-plateau',
    awayTeamId: 'fc-riviera',
    venue: 'Complexe Sportif de Bingerville',
    status: 'scheduled',
    referee: 'Kouassi Kouamé (Arbitre National FIMF)',
    events: [],
  },
  {
    id: 'm-j3-2',
    journee: 3,
    competitionId: 'champ-national',
    competitionName: 'Championnat National',
    roundName: '3ème Journée',
    dateStr: 'Sam. 28 Sept. 2025',
    timeStr: '18h00',
    homeTeamId: 'sc-marcory',
    awayTeamId: 'olympique-yop',
    venue: 'Terrain Yopougon',
    status: 'scheduled',
    referee: 'Mamadou Diabaté (Arbitre Régional)',
    events: [],
  },
  {
    id: 'm-j3-3',
    journee: 3,
    competitionId: 'champ-national',
    competitionName: 'Championnat National',
    roundName: '3ème Journée',
    dateStr: 'Dim. 29 Sept. 2025',
    timeStr: '16h00',
    homeTeamId: 'fc-cocody',
    awayTeamId: 'us-abidjan',
    venue: 'Terrain Cocody',
    status: 'scheduled',
    referee: 'Bertin Gnagne (Arbitre FIMF)',
    events: [],
  },
  {
    id: 'm-j3-4',
    journee: 3,
    competitionId: 'champ-national',
    competitionName: 'Championnat National',
    roundName: '3ème Journée',
    dateStr: 'Dim. 29 Sept. 2025',
    timeStr: '18h00',
    homeTeamId: 'afad',
    awayTeamId: 'sol-fc',
    venue: 'Terrain Attécoubé',
    status: 'scheduled',
    referee: 'Adama Fofana',
    events: [],
  },

  // CHAMPIONNAT NATIONAL - Journée 4
  {
    id: 'm-j4-1',
    journee: 4,
    competitionId: 'champ-national',
    competitionName: 'Championnat National',
    roundName: '4ème Journée',
    dateStr: 'Sam. 05 Oct. 2025',
    timeStr: '16h00',
    homeTeamId: 'fc-riviera',
    awayTeamId: 'sc-marcory',
    venue: 'Terrain Riviera',
    status: 'scheduled',
    referee: 'Armel Kra',
    events: [],
  },
  {
    id: 'm-j4-2',
    journee: 4,
    competitionId: 'champ-national',
    competitionName: 'Championnat National',
    roundName: '4ème Journée',
    dateStr: 'Sam. 05 Oct. 2025',
    timeStr: '18h00',
    homeTeamId: 'olympique-yop',
    awayTeamId: 'as-plateau',
    venue: 'Terrain Yopougon',
    status: 'scheduled',
    referee: 'Séraphin Koffi',
    events: [],
  },
  {
    id: 'm-j4-3',
    journee: 4,
    competitionId: 'champ-national',
    competitionName: 'Championnat National',
    roundName: '4ème Journée',
    dateStr: 'Dim. 06 Oct. 2025',
    timeStr: '16h00',
    homeTeamId: 'us-abidjan',
    awayTeamId: 'fc-cocody',
    venue: 'Terrain Abidjan',
    status: 'scheduled',
    referee: 'Jean-Marc Dago',
    events: [],
  },
  {
    id: 'm-j4-4',
    journee: 4,
    competitionId: 'champ-national',
    competitionName: 'Championnat National',
    roundName: '4ème Journée',
    dateStr: 'Dim. 06 Oct. 2025',
    timeStr: '18h00',
    homeTeamId: 'sol-fc',
    awayTeamId: 'afad',
    venue: 'Terrain Municipal Abobo',
    status: 'scheduled',
    referee: 'Yves Aka',
    events: [],
  },

  // COUPE NATIONALE - 16èmes de Finale
  {
    id: 'm-cup-1',
    journee: 1,
    competitionId: 'coupe-nationale',
    competitionName: 'Coupe Nationale',
    roundName: '16èmes de Finale',
    dateStr: 'Mer. 09 Oct. 2025',
    timeStr: '17h00',
    homeTeamId: 'as-plateau',
    awayTeamId: 'us-abidjan',
    venue: 'Complexe Bingerville',
    status: 'scheduled',
    referee: 'Kouassi Kouamé',
    events: [],
  },
  {
    id: 'm-cup-2',
    journee: 1,
    competitionId: 'coupe-nationale',
    competitionName: 'Coupe Nationale',
    roundName: '16èmes de Finale',
    dateStr: 'Jeu. 10 Oct. 2025',
    timeStr: '19h00',
    homeTeamId: 'fc-riviera',
    awayTeamId: 'olympique-yop',
    venue: 'Terrain Riviera Golf',
    status: 'scheduled',
    referee: 'Adama Fofana',
    events: [],
  },
  {
    id: 'm-cup-3',
    journee: 1,
    competitionId: 'coupe-nationale',
    competitionName: 'Coupe Nationale',
    roundName: '16èmes de Finale',
    dateStr: 'Ven. 11 Oct. 2025',
    timeStr: '18h00',
    homeTeamId: 'sc-marcory',
    awayTeamId: 'sol-fc',
    venue: 'Terrain Jesse Jackson',
    status: 'scheduled',
    referee: 'Mamadou Diabaté',
    events: [],
  },

  // CHAMPIONNAT U20 - Tournoi des Espoirs
  {
    id: 'm-u20-1',
    journee: 1,
    competitionId: 'champ-u20',
    competitionName: 'Championnat U20',
    roundName: 'Phase de Groupes',
    dateStr: 'Sam. 12 Oct. 2025',
    timeStr: '10h00',
    homeTeamId: 'sol-fc',
    awayTeamId: 'afad',
    venue: 'Terrain Municipal Abobo',
    status: 'scheduled',
    referee: 'Armel Kra',
    events: [],
  },
  {
    id: 'm-u20-2',
    journee: 1,
    competitionId: 'champ-u20',
    competitionName: 'Championnat U20',
    roundName: 'Phase de Groupes',
    dateStr: 'Sam. 12 Oct. 2025',
    timeStr: '11h30',
    homeTeamId: 'fc-cocody',
    awayTeamId: 'as-plateau',
    venue: 'Terrain Cocody',
    status: 'scheduled',
    referee: 'Bertin Gnagne',
    events: [],
  },

  // SÉLECTION NATIONALE - Match de Préparation
  {
    id: 'm-sel-1',
    journee: 1,
    competitionId: 'selections-nationales',
    competitionName: 'Sélections Nationales',
    roundName: 'Match International Amical',
    dateStr: 'Mer. 15 Oct. 2025',
    timeStr: '19h30',
    homeTeamId: 'as-plateau',
    awayTeamId: 'fc-riviera',
    venue: 'Palais des Sports de Treichville (Annexe)',
    status: 'scheduled',
    referee: 'Kouassi Kouamé (Arbitre International WMF)',
    events: [],
  },

  // CHAMPIONNAT NATIONAL - Journée 2 (Finished)
  {
    id: 'm-j2-1',
    journee: 2,
    competitionId: 'champ-national',
    competitionName: 'Championnat National',
    roundName: '2ème Journée',
    dateStr: 'Sam. 21 Sept. 2025',
    timeStr: '16h00',
    homeTeamId: 'as-plateau',
    awayTeamId: 'fc-cocody',
    venue: 'Complexe Bingerville',
    status: 'finished',
    scoreHome: 3,
    scoreAway: 1,
    referee: 'Mamadou Diabaté',
    scorers: [
      { player: 'Ibrahim Touré', team: 'AS PLATEAU', min: 14 },
      { player: 'Christian Yao', team: 'AS PLATEAU', min: 28 },
      { player: 'Arthur Seri', team: 'FC COCODY', min: 39 },
      { player: 'Ibrahim Touré', team: 'AS PLATEAU', min: 46 },
    ],
  },
  {
    id: 'm-j2-2',
    journee: 2,
    competitionId: 'champ-national',
    competitionName: 'Championnat National',
    roundName: '2ème Journée',
    dateStr: 'Sam. 21 Sept. 2025',
    timeStr: '18h00',
    homeTeamId: 'fc-riviera',
    awayTeamId: 'sol-fc',
    venue: 'Terrain Riviera Golf',
    status: 'finished',
    scoreHome: 2,
    scoreAway: 0,
    referee: 'Kouassi Kouamé',
    scorers: [
      { player: 'Yannick Gnahoré', team: 'FC RIVIERA', min: 22 },
      { player: 'Franck Kassi', team: 'FC RIVIERA', min: 41 },
    ],
  },
  {
    id: 'm-j2-3',
    journee: 2,
    competitionId: 'champ-national',
    competitionName: 'Championnat National',
    roundName: '2ème Journée',
    dateStr: 'Dim. 22 Sept. 2025',
    timeStr: '16h00',
    homeTeamId: 'sc-marcory',
    awayTeamId: 'us-abidjan',
    venue: 'Terrain Jesse Jackson',
    status: 'finished',
    scoreHome: 1,
    scoreAway: 1,
    referee: 'Bertin Gnagne',
    scorers: [
      { player: 'Abdoulaye Fofana', team: 'SC MARCORY', min: 18 },
      { player: 'Gervais Doumbia', team: 'US ABIDJAN', min: 44 },
    ],
  },
  {
    id: 'm-j2-4',
    journee: 2,
    competitionId: 'champ-national',
    competitionName: 'Championnat National',
    roundName: '2ème Journée',
    dateStr: 'Dim. 22 Sept. 2025',
    timeStr: '18h00',
    homeTeamId: 'olympique-yop',
    awayTeamId: 'afad',
    venue: 'Terrain Yopougon',
    status: 'finished',
    scoreHome: 3,
    scoreAway: 1,
    referee: 'Adama Fofana',
    scorers: [
      { player: 'Arsène Traoré', team: 'OLYMPIQUE YOP', min: 8 },
      { player: 'Boris Konan', team: 'OLYMPIQUE YOP', min: 25 },
      { player: 'Yaya Sanogo', team: 'AFAD', min: 32 },
      { player: 'Arsène Traoré', team: 'OLYMPIQUE YOP', min: 48 },
    ],
  },
];

export const NEWS_DATA: NewsArticle[] = [
  {
    id: 'news-11',
    title: "Règles du jeu 2026 : ce que la WMF change, et ce que la FIMF prépare",
    category: 'Formation',
    dateStr: '22 Oct. 2026',
    timestamp: '2026-10-22',
    readTime: '4 min',
    image: refereeImg,
    excerpt: "Gestion des rencontres, sécurité des joueurs, secteur des gardiens, penalties et tirs au but : la WMF publie le résumé des mises à jour 2026 des Lois du jeu. La FIMF en fera un module de formation pour ses officiels.",
    content: [
      "La World Minifootball Federation (WMF) a rendu public son document « Règles du jeu 2026 – Résumé des mises à jour », qui recense les amendements adoptés pour la saison à venir. Le texte, relayé par la Confédération Africaine de Minifootball (AMC), touche aussi bien la conduite d'une rencontre que la protection des joueurs.",
      "Plusieurs familles de règles sont concernées : la gestion des matchs et du temps de jeu, la sécurité des joueurs, la communication tactique depuis le banc, le jeu des gardiens, la procédure de penalty, les fautes cumulées ainsi que le déroulement des tirs au but. Autant de situations qui pèsent directement sur le résultat d'une rencontre de mini-football.",
      "Pour la Côte d'Ivoire, l'enjeu est double. Les arbitres engagés dans le Championnat National et dans les tournois régionaux devront maîtriser ces évolutions dès l'entame de la saison, tandis que les entraîneurs devront adapter des consignes parfois construites sur l'ancienne lecture du règlement.",
      "La FIMF annonce qu'elle s'appuiera sur ce document pour actualiser son programme de formation : un module dédié sera intégré aux prochaines sessions d'homologation des arbitres et aux briefings d'avant-compétition destinés aux encadreurs des clubs affiliés.",
      "Ces dispositions s'appliqueront également à la Coupe d'Afrique des Nations de Minifootball, Guinée 2027, où la Côte d'Ivoire défendra ses chances. Une raison supplémentaire de ne pas attendre le coup d'envoi du championnat pour se mettre à jour.",
      "Le résumé officiel est consultable, page par page, auprès de la Confédération Africaine de Minifootball. La FIMF invite chaque club à en faire une lecture collective avant les prochains week-ends de compétition, et ses arbitres à signaler leurs questions à la Commission Centrale des Arbitres.",
    ],
    tags: ['Règles du jeu', 'WMF', 'Arbitrage', 'Formation'],
    author: 'Commission Centrale des Arbitres',
  },
  {
    id: 'news-12',
    title: "CAN Minifootball 2027 : les Éléphants avec le Tchad, le Mali et le Soudan du Sud",
    category: 'Sélections',
    dateStr: '20 Oct. 2026',
    timestamp: '2026-10-20',
    readTime: '4 min',
    image: trophyImg,
    excerpt: "Conakry a accueilli le tirage au sort de la 5e Coupe d'Afrique de Minifootball, première édition à 24 nations. La Côte d'Ivoire évoluera dans le groupe D.",
    content: [
      "La capitale guinéenne a vécu une soirée historique : la Confédération Africaine de Minifootball (AMC) y a procédé au tirage au sort de la 5e Coupe d'Afrique de Minifootball, programmée du 09 au 24 janvier 2027. Pour la première fois de son histoire, la compétition réunira 24 nations africaines.",
      "Placée dans le groupe D, la Côte d'Ivoire retrouvera le Tchad, le Mali et le Soudan du Sud. Un tirage sans opposition a priori inaccessible, mais qui impose aux Éléphants d'aborder chaque rencontre avec le même sérieux : réparties en six groupes de quatre, les équipes disposent de très peu de marge avant la phase à élimination directe.",
      "Les groupes : A — Guinée, Cameroun, Bénin, Tanzanie ; B — Libye, Afrique du Sud, RD Congo, Kenya ; C — Mauritanie, Nigeria, Ouganda, Gambie ; D — Côte d'Ivoire, Tchad, Mali, Soudan du Sud ; E — Ghana, Burkina Faso, Maroc, Sierra Leone ; F — Sénégal, Soudan, Maurice, complété par une wild card.",
      "Championne d'Afrique en 2018 à Tripoli et médaillée de bronze en 2021 à Ibadan, la sélection ivoirienne arrive en Guinée avec un statut de favori régional à assumer. Le staff technique disposera des prochaines semaines pour affiner la préparation, entre regroupements à Abidjan et rencontres amicales de haut niveau.",
      "La cérémonie a réuni les représentants des fédérations nationales, les dirigeants de la WMF, les membres du comité exécutif de l'AMC ainsi que plusieurs personnalités sportives guinéennes. Elle confirme la capacité de la Guinée à organiser un rendez-vous continental de cette envergure, à quelques mois d'une candidature affichée pour la Coupe du Monde de Minifootball 2029.",
      "Pour la FIMF, l'objectif reste inchangé : aller chercher un second titre continental et faire vivre l'expérience de la CAN au plus grand nombre. Le vivier demeure le Championnat National, vitrine de la discipline et rampe de lancement des Éléphants.",
    ],
    tags: ['Éléphants', 'CAN 2027', 'Tirage au sort', 'Conakry'],
    author: 'Cellule Média Éléphants',
  },
  {
    id: 'news-13',
    title: "Assemblée générale de l'AMC : les rapports 2025-2026 adoptés à l'unanimité",
    category: 'Institutionnel',
    dateStr: '18 Oct. 2026',
    timestamp: '2026-10-18',
    readTime: '4 min',
    image: hqImg,
    excerpt: "Réunies à Conakry, les fédérations africaines de minifootball ont validé les rapports moral et financier de la saison 2025-2026 et tracé la route vers la CAN Guinée 2027.",
    content: [
      "En marge du tirage au sort de la CAN 2027, la Confédération Africaine de Minifootball (AMC) a tenu son Assemblée Générale Ordinaire à Conakry, en présence des représentants des fédérations nationales membres et des membres de son comité exécutif.",
      "Au terme d'un examen approfondi des points inscrits à l'ordre du jour, les délégués ont adopté à l'unanimité le rapport moral et le rapport financier de la saison 2025-2026. Un vote consensuel, présenté comme le signe d'une confiance renouvelée dans la conduite de la Confédération.",
      "Le rapport moral revient sur une saison dense : organisation de la CAN 2025 en Libye, lancement de la première Ligue des Champions africaine — compétition dans laquelle le champion ivoirien dispose d'une place directe —, adhésion de l'AMC à l'Union des Confédérations Sportives Africaines (UCSA), montée en puissance des programmes de formation d'arbitres et d'entraîneurs, création de la plateforme numérique AMC CONNECT et refonte du site officiel de la Confédération.",
      "Sur le plan financier, l'assemblée a souligné une gestion rigoureuse des ressources et une stabilité maintenue malgré un calendrier particulièrement chargé : compétitions, missions officielles, projets numériques et partenariats stratégiques.",
      "Les fédérations ont réaffirmé leur engagement autour du plan stratégique continental : préparation de la CAN Guinée 2027, développement du minifootball féminin, accélération de la transformation numérique et renforcement de la présence de la discipline sur l'ensemble du continent.",
      "Ces orientations concernent directement la Côte d'Ivoire. La FIMF y trouve un cadre pour aligner son Championnat National, la formation de ses officiels et le développement de la pratique féminine sur les priorités africaines, avec un relais naturel : la CAN de Conakry, en janvier 2027.",
    ],
    tags: ['AMC', 'Gouvernance', 'Assemblée Générale', 'Conakry'],
    author: 'Secrétariat Général FIMF',
  },
  {
    id: 'news-7',
    title: "Une décennie d'excellence : le palmarès international des Éléphants du Mini Football",
    category: 'Institutionnel',
    dateStr: '18 Sept. 2026',
    timestamp: '2026-09-18',
    readTime: '5 min',
    image: hqImg,
    excerpt: "Championne d'Afrique 2018, médaillée de bronze en 2021, double qualifiée pour la Coupe du Monde : retour sur une décennie qui a fait de la Côte d'Ivoire une nation majeure du mini football.",
    content: [
      "Depuis sa fondation en janvier 2017, la Fédération Ivoirienne de Mini Football a inscrit la discipline dans une trajectoire d'excellence qui place aujourd'hui la Côte d'Ivoire parmi les grandes nations africaines et mondiales du mini football.",
      "Le sacre historique de la 1ère Coupe d'Afrique de Mini-Foot, à Tripoli en mai 2018, reste la pierre angulaire de ce palmarès. Sacrée championne d'Afrique, la sélection nationale avait également reçu le Trophée Fair-Play, avec Cissé Koua Ibrahim désigné meilleur gardien et Beugré Yago Eugène meilleur coach.",
      "Médaillée de bronze à la 2e CAN d'Ibadan en 2021, cinquième sur seize nations à Derna en 2025, la Côte d'Ivoire a surtout décroché une qualification historique pour la Coupe du Monde de Ras Al-Khaimah aux Émirats Arabes Unis en octobre 2023.",
      "Les Éléphants aborderont la CAN de Conakry (09 – 24 janvier 2027) et la Coupe du Monde de République Tchèque (octobre 2027) avec l'ambition d'inscrire durablement le nom du pays au sommet de la discipline.",
      "Ce parcours illustre la vision fédérale : structurer la pratique sur tout le territoire, former les encadreurs et préparer les sélections nationales pour les plus grands rendez-vous continentaux et mondiaux.",
    ],
    tags: ['Palmarès', 'Éléphants', 'CAN 2018', 'Coupe du Monde'],
    author: 'Direction de la Communication FIMF',
  },
  {
    id: 'news-8',
    title: "CAN Mini Football Guinée 2027 : les Éléphants qualifiés pour Conakry",
    category: 'Sélections',
    dateStr: '10 Sept. 2026',
    timestamp: '2026-09-10',
    readTime: '3 min',
    image: huddleImg,
    excerpt: "La Côte d'Ivoire disputerà la Coupe d'Afrique des Nations de Mini Football à Conakry du 09 au 24 janvier 2027, avec l'ambition de décrocher un second titre continental.",
    content: [
      "La Fédération Ivoirienne de Mini Football annonce la qualification de la sélection nationale pour la Coupe d'Afrique des Nations de Mini Football qui se tiendra à Conakry (Guinée) du 09 au 24 janvier 2027.",
      "Championne d'Afrique de la première édition (Tripoli 2018) et médaillée de bronze à Ibadan en 2021, la Côte d'Ivoire figure parmi les prétendants sérieux au sacre continental.",
      "La préparation de l'équipe nationale s'articulera autour de regroupements à Abidjan et d'un programme de matchs amicaux de haut niveau, dont la rencontre contre la communauté libanaise prévue le 20 décembre 2026.",
      "Le staff technique s'appuiera sur le vivier des clubs du Championnat National, vitrine de la discipline sur le territoire ivoirien.",
    ],
    tags: ['Éléphants', 'CAN 2027', 'Guinée', 'Sélection Nationale'],
    author: 'Cellule Média Éléphants',
  },
  {
    id: 'news-9',
    title: "AMC Champions League 2026 : le champion ivoirien qualifié d'office",
    category: 'Compétitions',
    dateStr: '02 Sept. 2026',
    timestamp: '2026-09-02',
    readTime: '4 min',
    image: trophyImg,
    excerpt: "Sous l'égide de la Confédération Africaine de Mini Football, la Ligue des Champions 2026 réunira 64 équipes. Le champion national FIMF dispose d'une place directe.",
    content: [
      "L'AMC Champions League 2026 s'affirme comme le rendez-vous continental de référence des clubs champions d'Afrique, organisé sous l'égide de la Confédération Africaine de Mini Football (AMC).",
      "64 équipes issues des fédérations nationales s'engageront via des éliminatoires locales et régionales, avant que les 16 meilleures formations ne soient réparties en 4 groupes de 4, puis en phase à élimination directe.",
      "La Côte d'Ivoire, à l'instar de l'Ouganda et du Sénégal, dispute une place directe réservée à son champion national — un sésame qui renforce considérablement la valeur du titre national FIMF.",
      "Cette qualification constitue une opportunité pour la FIMF de démontrer la vitalité de son championnat et d'inscrire durablement ses clubs dans le paysage compétitif africain, en cohérence avec sa feuille de route stratégique : CAN Guinée 2027 et Coupe du Monde 2027.",
    ],
    tags: ['AMC Champions League', 'Clubs', 'Afrique', 'Compétition'],
    author: 'Secrétariat Général FIMF',
  },
  {
    id: 'news-10',
    title: "Côte d'Ivoire – Liban : le match de la fraternité le 20 décembre 2026",
    category: 'Sélections',
    dateStr: '27 Août 2026',
    timestamp: '2026-08-27',
    readTime: '3 min',
    image: heroImg,
    excerpt: "Dans le cadre de la promotion de la paix et de la fraternité à travers le sport, la FIMF organise une rencontre amicale unique entre la Côte d'Ivoire et la communauté libanaise résidant dans le pays.",
    content: [
      "La Fédération Ivoirienne de Mini Football organise, dimanche 20 décembre 2026, une rencontre amicale entre l'Équipe de Côte d'Ivoire et celle de la communauté libanaise résidant en Côte d'Ivoire, en préparation de la CAN de Mini-Foot.",
      "Cette initiative citoyenne, soutenue par le Ministère de la Solidarité et de la Cohésion Sociale, vise à encourager l'harmonie entre les différentes communautés vivant en Côte d'Ivoire par l'intermédiaire du sport.",
      "À l'issue du match, une sélection de 2 à 4 joueurs talentueux d'origine ivoiro-libanaise sera envisagée pour rejoindre l'Équipe Nationale en prévision de la Coupe d'Afrique des Nations 2027.",
      "Une rencontre qui illustre la vocation fédérale du mini football ivoirien : transcender les barrières sociales et cultiver le sentiment d'appartenance à une seconde famille.",
    ],
    tags: ['Amical', 'Liban', 'Fraternité', 'Sélection Nationale'],
    author: 'Direction de la Communication FIMF',
  },
  {
    id: 'news-1',
    title: 'Lancement officiel du Championnat National de Mini-Football',
    category: 'Championnat',
    dateStr: '20 Sept. 2025',
    timestamp: '2025-09-20',
    readTime: '3 min',
    image: heroImg,
    excerpt: 'La première journée du Championnat National a tenu toutes ses promesses avec des rencontres intenses et un engouement populaire remarquable à Bingerville et Abidjan.',
    content: [
      'Le coup d\'envoi officiel de l\'édition 2025 du Championnat National de Mini-Football de Côte d\'Ivoire a été donné ce week-end dans une ferveur exceptionnelle.',
      'Devant un public nombreux et enthousiaste au Complexe Sportif de Bingerville, les meilleurs clubs de la capitale et des régions ont offert des duels de haute intensité technique.',
      'Le Président de la FIMF a salué l\'engagement exemplaire des dirigeants de clubs, des arbitres formés selon les normes internationales et le comportement exemplaire des supporters.',
      'Cette saison marque une étape décisive dans la structuration des compétitions nationales, avec des diffusions en direct et un suivi statistique rigoureux de toutes les rencontres.'
    ],
    tags: ['Championnat', 'Saison 2025', 'Bingerville', 'FIMF'],
    author: 'Direction de la Communication FIMF',
  },
  {
    id: 'news-2',
    title: 'La FIMF renforce la formation des arbitres',
    category: 'Formation',
    dateStr: '15 Sept. 2025',
    timestamp: '2025-09-15',
    readTime: '4 min',
    image: refereeImg,
    excerpt: 'Un stage de perfectionnement intensif a réuni plus de 100 arbitres et officiels techniques à Abidjan sous l\'égide des instructeurs certifiés WMF.',
    content: [
      'Dans le cadre de son plan de développement technique, la Fédération Ivoirienne de Mini-Football a clôturé ce dimanche une session nationale de formation et d\'homologation des arbitres.',
      'Pendant cinq jours, les participants ont alterné ateliers théoriques sur les lois du jeu spécifiques au mini-football (dimensions réduites, gestion du temps, règles de relance) et mises en situation pratique sur le terrain.',
      'À l\'issue des évaluations physiques et écrites, les lauréats ont reçu leurs écussons officiels FIMF pour la saison 2024-2025.',
      '« L\'arbitrage est le garant de la justice sportive et du spectacle sur nos terrains », a rappelé le président de la Commission Centrale des Arbitres.'
    ],
    tags: ['Arbitrage', 'Formation', 'Règlement', 'Technique'],
    author: 'Commission Centrale des Arbitres',
  },
  {
    id: 'news-3',
    title: 'Sélection nationale : début du stage de préparation',
    category: 'Sélections',
    dateStr: '10 Sept. 2025',
    timestamp: '2025-09-10',
    readTime: '3 min',
    image: huddleImg,
    excerpt: 'Les Éléphants du mini-football ont entamé leur premier regroupement en vue des prochaines échéances continentales et du Championnat d\'Afrique.',
    content: [
      'Le sélectionneur national a convoqué un groupe de 18 joueurs d\'élite pour une semaine d\'entraînement intensif à Abidjan.',
      'L\'accent est mis sur la condition physique, la rapidité des transitions et la cohésion tactique spécifique au format 6 contre 6.',
      'L\'objectif affiché est clair : hisser la Côte d\'Ivoire sur le podium africain et décrocher une qualification historique pour la prochaine Coupe du Monde de Mini-Football.',
      'Deux matchs amicaux d\'application contre une sélection régionale sont programmés à huis clos.'
    ],
    tags: ['Éléphants', 'Sélection Nationale', 'Stage', 'Afrique'],
    author: 'Cellule Média Éléphants',
  },
  {
    id: 'news-4',
    title: 'Signature d\'un partenariat pour le développement du mini-football',
    category: 'Institutionnel',
    dateStr: '05 Sept. 2025',
    timestamp: '2025-09-05',
    readTime: '2 min',
    image: hqImg,
    excerpt: 'La FIMF a paraphé un accord stratégique tripartite avec les collectivités locales et les partenaires économiques pour financer de nouveaux terrains.',
    content: [
      'La Fédération Ivoirienne de Mini-Football franchit un nouveau palier dans sa politique d\'infrastructures de proximité.',
      'Ce partenariat permettra la réhabilitation et l\'homologation de 10 nouveaux complexes synthétiques dans les communes de Yopougon, Abobo, Koumassi et dans l\'intérieur du pays.',
      'Ce programme vise à offrir aux jeunes et aux clubs des conditions de pratique sécurisées et modernes, accessibles à tous les licenciés.'
    ],
    tags: ['Partenariat', 'Infrastructures', 'Terrains', 'Développement'],
    author: 'Secrétariat Général FIMF',
  },
  {
    id: 'news-5',
    title: 'Calendrier officiel de la saison 2024-2025 dévoilé',
    category: 'Championnat',
    dateStr: '28 Août 2025',
    timestamp: '2025-08-28',
    readTime: '3 min',
    image: trophyImg,
    excerpt: 'Retrouvez le programme complet des 14 journées de la phase régulière ainsi que les dates de la phase finale des play-offs.',
    content: [
      'La commission des compétitions a validé le calendrier de la nouvelle saison sportive.',
      'Avec 8 clubs engagés en Division 1 et des compétitions régionales en forte expansion, le rythme des rencontres sera soutenu chaque week-end.',
      'La finale du championnat est programmée pour le mois de décembre au Complexe Sportif de Bingerville.'
    ],
    tags: ['Calendrier', 'Play-offs', 'Division 1'],
    author: 'Commission des Compétitions',
  },
  {
    id: 'news-6',
    title: 'Homologation de 10 nouveaux terrains de mini-football',
    category: 'Compétitions',
    dateStr: '14 Août 2025',
    timestamp: '2025-08-14',
    readTime: '3 min',
    image: hqImg,
    excerpt: 'La commission technique de la FIMF a certifié les normes de sécurité et de traçage de 10 aires de jeux synthétiques à travers le pays.',
    content: [
      'Après une série d\'inspections minutieuses, 10 complexes ont reçu le label fédéral de conformité.',
      'Ces terrains garantissent des dimensions officielles (40m x 20m), un éclairage nocturne aux normes et des vestiaires équipés pour accueillir les rencontres officielles du championnat national.',
      'Les clubs affiliés peuvent désormais programmer leurs matchs officiels sur ces installations homologuées.'
    ],
    tags: ['Homologation', 'Terrains', 'Normes'],
    author: 'Direction Technique Nationale',
  },
];

export const COMPETITIONS_DATA: Competition[] = [
  {
    id: 'can-guinee-2027',
    title: 'CAN MINI FOOTBALL — GUINÉE 2027',
    type: 'selection',
    category: 'Sélections nationales',
    subtitle: "Tirage au sort effectué à Conakry : les Éléphants affronteront le Tchad, le Mali et le Soudan du Sud.",
    description: "Qualifiée pour la CAN de Mini Football qui se disputera à Conakry (Guinée) du 09 au 24 janvier 2027, la Côte d'Ivoire, championne d'Afrique 2018 à Tripoli et médaillée de bronze en 2021 à Ibadan, défendra son statut de grande nation africaine de la discipline. Le tirage au sort, organisé dans la capitale guinéenne, a placé les Éléphants dans le groupe D aux côtés du Tchad, du Mali et du Soudan du Sud. Un objectif clair : un second titre continental.",
    image: huddleImg,
    participantsCount: 24,
    currentHolder: "Côte d'Ivoire — Championne d'Afrique 2018",
    period: '09 – 24 janvier 2027',
    badge: 'Tirage au sort',
    rulesHighlight: [
      'Qualification directe obtenue par la sélection nationale',
      'Première édition à 24 nations, réparties en 6 groupes de 4',
      'Groupe A — Guinée, Cameroun, Bénin, Tanzanie',
      'Groupe B — Libye, Afrique du Sud, RD Congo, Kenya',
      'Groupe C — Mauritanie, Nigeria, Ouganda, Gambie',
      "Groupe D — Côte d'Ivoire, Tchad, Mali, Soudan du Sud",
      'Groupe E — Ghana, Burkina Faso, Maroc, Sierra Leone',
      'Groupe F — Sénégal, Soudan, Maurice + une wild card',
      "Ville hôte : Conakry (Guinée) du 09 au 24 janvier 2027",
      "Objectif : reproduire l'exploit de 2018 (titre continental à Tripoli)",
    ],
    isMajor: true,
  },
  {
    id: 'amc-champions-league-2026',
    title: 'LIGUE DES CHAMPIONS AFRICAINE AMC 2026',
    type: 'international',
    category: 'Compétitions internationales',
    subtitle: "Le rendez-vous continental des clubs champions d'Afrique, sous l'égide de l'AMC.",
    description: "Organisée sous l'égide de la Confédération Africaine de Mini Football (AMC), l'AMC Champions League 2026 fédère l'excellence continentale du mini football : 64 équipes engagées via des éliminatoires locales et régionales, puis 16 finalistes répartis en 4 groupes de 4 avant une phase à élimination directe. Le champion national ivoirien FIMF y dispose d'une place directe, faisant du titre national le sésame vers la scène continentale.",
    image: trophyImg,
    participantsCount: 64,
    currentHolder: "Place directe réservée au champion national FIMF",
    period: 'Novembre 2026',
    rulesHighlight: [
      '64 équipes issues des fédérations nationales africaines via éliminatoires',
      '16 finalistes répartis en 4 groupes (A, B, C, D)',
      "Les 2 premiers de chaque groupe accèdent aux quarts de finale",
      "Places directes selon la performance : Libye et Mauritanie (4 places), Ghana et Guinée (champion + vice-champion), Côte d'Ivoire, Ouganda et Sénégal (1 place pour le champion national)",
      "16e ticket disputé via un barrage décisif (2e du Soudan contre 5e de la Libye)",
    ],
    isMajor: true,
  },
  {
    id: 'amical-ci-liban-2026',
    title: 'AMICAL CÔTE D\'IVOIRE – LIBAN',
    type: 'selection',
    category: 'Sélections nationales',
    subtitle: 'La paix et la fraternité à travers le sport, en préparation de la CAN.',
    description: "Dans le cadre de la promotion de la paix et de la fraternité à travers le sport, la FIMF organise une rencontre amicale unique entre l'Équipe de Côte d'Ivoire et celle de la communauté libanaise résidant en Côte d'Ivoire, soutenue par le Ministère de la Solidarité et de la Cohésion Sociale. À l'issue du match, une sélection de 2 à 4 joueurs talentueux d'origine ivoiro-libanaise sera envisagée pour rejoindre l'Équipe Nationale en prévision de la Coupe d'Afrique des Nations.",
    image: heroImg,
    participantsCount: 2,
    currentHolder: "Initiative citoyenne soutenue par le Ministère de la Solidarité et de la Cohésion Sociale",
    period: 'Dimanche 20 décembre 2026',
    rulesHighlight: [
      "Rencontre de préparation de la CAN de Mini-Foot",
      "Encourager l'harmonie entre les différentes communautés vivant en Côte d'Ivoire par l'intermédiaire du sport",
      "Découvrir et mettre en avant les jeunes talents ivoiro-libanais dans une perspective nationale",
      "2 à 4 joueurs ivoiro-libanais intégrés à l'Équipe Nationale après le match",
    ],
    isMajor: false,
  },
  {
    id: 'champ-national',
    title: 'CHAMPIONNAT NATIONAL — ÉDITION 2026',
    type: 'national',
    category: 'Championnat national',
    subtitle: "La compétition officielle des clubs ivoiriens, organisée au Temple du Foot de l'Université.",
    description: "Le sommet du mini football de club en Côte d'Ivoire. L'édition 2026 réunit 12 équipes engagées, 4 week-ends de compétition et 8 jours de match pour un total de 26 rencontres (18 en phase de poules, 8 en phase finale) au Temple du Foot de l'Université à Abidjan. Entrée libre pour le grand public. Le champion national obtient une place directe en Ligue des Champions Africaine AMC.",
    image: trophyImg,
    participantsCount: 12,
    currentHolder: 'AS PLATEAU',
    period: 'Édition 2026 • 4 week-ends',
    rulesHighlight: [
      '12 équipes engagées, 4 week-ends de compétition, 8 jours de match',
      '26 matchs au total : 18 rencontres en phase de poules, 8 en phase finale',
      'Phase de poules (Poules A et B), quarts de finale, demi-finales, match pour la 3e place et grande finale',
      "Lieu unique : Temple du Foot de l'Université — Abidjan (entrée libre)",
      'Format 6 contre 6 (5 joueurs de champ + 1 gardien), 2 × 25 min, prolongations 2 × 5 min puis tirs au but',
      '« Ensemble pour la passion, la discipline et la victoire ! »',
    ],
    isMajor: true,
  },
  {
    id: 'coupe-nationale',
    title: 'COUPE NATIONALE',
    type: 'cup',
    category: 'Coupe nationale',
    subtitle: 'La compétition nationale à élimination directe.',
    description: 'Le tournoi de tous les défis ! Ouverte à l\'ensemble des clubs affiliés de Division 1, Division 2 et clubs régionaux. Chaque match est décisif : en cas d\'égalité à la fin du temps réglementaire, place à la séance de tirs au but sous haute tension.',
    image: trophyImg,
    participantsCount: 32,
    currentHolder: 'FC RIVIERA',
    period: 'Octobre - Novembre 2025',
    rulesHighlight: [
      'Matchs à élimination directe',
      'Tirage au sort intégral dès les 16èmes de finale',
      'Séance de 3 tirs au but en cas d\'égalité',
      'Trophée prestigieux remis par les autorités sportives ivoiriennes'
    ],
    isMajor: true,
  },
  {
    id: 'selections-nationales',
    title: 'SÉLECTIONS NATIONALES',
    type: 'selection',
    category: 'Sélections nationales',
    subtitle: "Les Éléphants du Mini Football, championns d'Afrique 2018.",
    description: "Les Éléphants du mini football portent fièrement les couleurs ivoiriennes sur la scène continentale et mondiale. Championne d'Afrique 2018 à Tripoli, médaillée de bronze en 2021 à Ibadan, 5e de la CAN 2025 à Derna, qualifiée pour le Mondial 2023 aux Émirats et pour la CAN Guinée 2027 ainsi que le Mondial 2027 en République Tchèque : la Côte d'Ivoire est une grande nation de la discipline.",
    image: huddleImg,
    participantsCount: 1,
    currentHolder: "Championne d'Afrique 2018 • Bronze 2021 • Qualifiée CAN 2027 & Mondial 2027",
    period: 'CAN Guinée 2027 • Mondial Tchéquie 2027',
    rulesHighlight: [
      "Championne d'Afrique 2018 à Tripoli (Libye)",
      "Médaille de bronze à la 2e CAN 2021 à Ibadan (Nigeria)",
      "Qualification historique pour la Coupe du Monde 2023 aux Émirats Arabes Unis (Ras Al-Khaimah)",
      "5e place sur 16 nations à la CAN 2025 de Derna (Libye)",
      "Qualifiée pour la CAN Guinée 2027 (09–24 janvier) et le Mondial 2027 en République Tchèque (octobre)",
      "Vivier issu des clubs du Championnat National FIMF",
    ],
    isMajor: true,
  },
  {
    id: 'champ-u20',
    title: 'CHAMPIONNAT U20',
    type: 'youth',
    category: 'Championnat national',
    subtitle: 'Développement des jeunes talents.',
    description: 'La pépinière du mini-football ivoirien. Ce championnat réservé aux moins de 20 ans favorise l\'éclosion des futurs grands espoirs nationaux et encourage les clubs à structurer leurs centres de formation.',
    image: heroImg,
    participantsCount: 16,
    currentHolder: 'Académie Sol FC Abobo',
    period: 'Octobre - Janvier',
    rulesHighlight: [
      'Licences jeunes certifiées avec contrôle d\'identité strict',
      'Sensibilisation au fair-play et à l\'esprit sportif',
      'Détection pour l\'équipe nationale espoir'
    ],
    isMajor: false,
  },
  {
    id: 'champ-feminin',
    title: 'CHAMPIONNAT FÉMININ',
    type: 'women',
    category: 'Championnat national',
    subtitle: 'Le mini-football au féminin.',
    description: 'La vitrine de l\'excellence féminine dans le sport ivoirien. Une compétition dynamique et engagée qui rassemble les meilleurs talents féminins de toutes les communes d\'Abidjan et de l\'intérieur.',
    image: heroImg,
    participantsCount: 10,
    currentHolder: 'Cocody Stars Féminines',
    period: 'Novembre - Février',
    rulesHighlight: [
      'Promotion de l\'inclusion et de la pratique féminine',
      'Accompagnement matériel et bourses d\'équipement aux clubs',
      'Couverture médiatique dédiée'
    ],
    isMajor: false,
  },
  {
    id: 'tournois-regionaux',
    title: 'TOURNOIS RÉGIONAUX',
    type: 'regional',
    category: 'Compétitions internationales',
    subtitle: 'Compétitions inter-régionales.',
    description: 'Des tournois disputés à Bouaké, San Pedro, Korhogo, Daloa et Yamoussoukro pour faire rayonner la discipline au-delà de la capitale économique et dénicher les pépites de tout le territoire ivoirien.',
    image: hqImg,
    participantsCount: 24,
    currentHolder: 'Éléphants de Yamoussoukro',
    period: 'Saison régulière',
    rulesHighlight: [
      'Circuits qualificatifs régionaux pour les play-offs d\'accession',
      'Valorisation des terrains locaux homologués'
    ],
    isMajor: false,
  },
];

export const GALLERY_PHOTOS: GalleryPhoto[] = [
  {
    id: 'g-1',
    title: 'Action offensive en plein soleil',
    category: 'Compétitions',
    image: heroImg,
    caption: 'Attaque tranchante lors de la 1ère journée du Championnat National à Bingerville.',
    dateStr: '20 Sept. 2025',
    venue: 'Complexe Sportif de Bingerville',
  },
  {
    id: 'g-2',
    title: 'Solidarité et esprit d\'équipe',
    category: 'Sélections',
    image: huddleImg,
    caption: 'Les Éléphants numéro 8, 10 et 18 soudés avant l\'entrée en jeu.',
    dateStr: '10 Sept. 2025',
    venue: 'Stade Robert Champroux',
  },
  {
    id: 'g-3',
    title: 'Le siège moderne de la FIMF',
    category: 'Événements',
    image: hqImg,
    caption: 'Vue extérieure de la Maison du Mini-Football Ivoirien à Abidjan.',
    dateStr: '05 Sept. 2025',
    venue: 'Cocody Riviera, Abidjan',
  },
  {
    id: 'g-4',
    title: 'La formation des officiels de match',
    category: 'Événements',
    image: refereeImg,
    caption: 'Promotion 2025 des arbitres homologués FIMF après le stage pratique.',
    dateStr: '15 Sept. 2025',
    venue: 'Centre Technique National',
  },
  {
    id: 'g-5',
    title: 'Le trophée officiel du Championnat',
    category: 'Compétitions',
    image: trophyImg,
    caption: 'La coupe dorée tant convoitée par les 8 formations de l\'élite ivoirienne.',
    dateStr: '01 Sept. 2025',
    venue: 'Salon d\'honneur FIMF',
  },
  {
    id: 'g-6',
    title: 'Duel acharné au milieu de terrain',
    category: 'Équipes',
    image: heroImg,
    caption: 'Pression constante et intensité maximale entre AS Plateau et FC Riviera.',
    dateStr: '20 Sept. 2025',
    venue: 'Terrain Riviera Golf',
  },
  {
    id: 'g-7',
    title: 'Cérémonie de remise des diplômes d\'arbitrage',
    category: 'Événements',
    image: refereeImg,
    caption: 'Moment solennel de remise des écussons officiels FIMF.',
    dateStr: '15 Sept. 2025',
    venue: 'Auditorium FIMF',
  },
  {
    id: 'g-8',
    title: 'Concentration maximale avant le coup d\'envoi',
    category: 'Sélections',
    image: huddleImg,
    caption: 'Consignes tactiques du staff technique avant le match de préparation.',
    dateStr: '12 Sept. 2025',
    venue: 'Complexe Sportif de Bingerville',
  },
];
