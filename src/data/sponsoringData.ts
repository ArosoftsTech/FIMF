/**
 * ─────────────────────────────────────────────────────────────
 * CONFIGURATION SPONSORING FIMF — SEUL endroit à modifier pour
 * ajuster les montants, les avantages, les FAQ ou les contacts
 * de la page /sponsoring. Aucune modification de composant
 * n'est nécessaire pour faire évoluer les offres.
 * ─────────────────────────────────────────────────────────────
 */

/** Identifiants des packages, par ordre de prestige croissant. */
export type SponsoringPackId = 'bronze' | 'argent' | 'or' | 'diamant';

/** Valeur retournée par le formulaire pour une demande sur-mesure. */
export const CUSTOM_PACK_ID = 'autre';

export interface SponsoringPack {
  id: SponsoringPackId;
  /** Nom affiché sur la carte. */
  name: string;
  /** Sous-titre court (positionnement du pack). */
  tagline: string;
  /** Montant — texte libre : tarifs ou « Sur devis ». */
  price: string;
  /** Précision sous le montant (ex : « par saison »). */
  priceNote: string;
  /** Badge optionnel au-dessus du trophée (ex : « LE PLUS POPULAIRE »). */
  badge?: string;
  /** Carte mise en avant (bordure orange, élévation, CTA plein). */
  highlighted?: boolean;
  /** Liste des avantages affichée sur la carte. */
  perks: string[];
}

/**
 * Les 4 packages de sponsoring.
 * Ordre d'affichage = progression du prestige (plus le pack est
 * élevé, plus le trophée est imposant dans la vue).
 */
export const SPONSORING_PACKAGES: SponsoringPack[] = [
  {
    id: 'bronze',
    name: 'Bronze',
    tagline: 'Premier pas de votre marque sur le mini football ivoirien',
    price: '500 000 FCFA',
    priceNote: 'par saison',
    perks: [
      'Logo dans l\u2019annuaire des partenaires du site officiel',
      'Mentions de votre marque sur les réseaux sociaux de la FIMF',
      'Badge « Partenaire officiel FIMF » pour vos supports',
      '2 invitations VIP par journée de championnat',
    ],
  },
  {
    id: 'argent',
    name: 'Argent',
    tagline: 'Une visibilité constante sur tous les supports officiels',
    price: '1 500 000 FCFA',
    priceNote: 'par saison',
    perks: [
      'Tous les avantages du pack Bronze',
      'Logo sur les communiqués et affiches officiels',
      'Panneaux publicitaires au bord des terrains (D1)',
      '4 invitations VIP par journée de championnat',
      'Logo intégré aux visuels des photos officielles',
    ],
  },
  {
    id: 'or',
    name: 'Or',
    tagline: 'Le partenariat complet : maillots, digital et cérémonies',
    price: '4 500 000 FCFA',
    priceNote: 'par saison',
    badge: 'LE PLUS POPULAIRE',
    highlighted: true,
    perks: [
      'Tous les avantages du pack Argent',
      'Logo sur les maillots des rencontres officielles',
      'Publications dédiées chaque mois sur les réseaux FIMF',
      'Logo premium en tête du site officiel',
      'Espace de marque lors des remises de trophées',
      '8 invitations VIP par journée de championnat',
    ],
  },
  {
    id: 'diamant',
    name: 'Diamant',
    tagline: 'Le partenariat exclusif — votre marque au cœur de la FIMF',
    price: 'Sur devis',
    priceNote: 'dispositif sur-mesure',
    badge: 'PRESTIGE MAXIMAL',
    perks: [
      'Tous les avantages du pack Or',
      'Votre nom associé au championnat (« présenté par … »)',
      'Stand partenaire sur tous les sites d\u2019événements',
      'Trophée personnalisé et gravé à votre marque',
      'Contenus vidéo dédiés avec l\u2019équipe média FIMF',
      'Rencontre annuelle avec les dirigeants de la Fédération',
    ],
  },
];

/** Arguments « Pourquoi soutenir la FIMF » (icône mappée dans la vue). */
export const SPONSORING_ARGUMENTS: { icon: string; title: string; text: string }[] = [
  {
    icon: 'eye',
    title: 'Une visibilité nationale',
    text: 'Logo présent sur le site officiel, les supports, les terrains et les réseaux sociaux auprès de milliers de supporters dans tout le pays.',
  },
  {
    icon: 'trending',
    title: 'Une image jeune et gagnante',
    text: 'Associez votre marque à une discipline en pleine croissance et une fédération championne d\u2019Afrique 2018.',
  },
  {
    icon: 'heart',
    title: 'Un impact sur la jeunesse',
    text: 'Votre soutien finance la formation des jeunes talents, l\u2019arbitrage et la construction de terrains homologués.',
  },
  {
    icon: 'users',
    title: 'Une communauté engagée',
    text: 'Plus de 100 clubs, 2 000 joueurs licenciés et des familles mobilisées chaque week-end sur nos compétitions.',
  },
];

/**
 * Tableau comparatif des packages.
 * Valeurs : `true` (inclus), `false` (non inclus), ou un libellé texte.
 * Ordonné du plus général au plus exclusif.
 */
export const SPONSORING_COMPARISON: {
  feature: string;
  bronze: boolean | string;
  argent: boolean | string;
  or: boolean | string;
  diamant: boolean | string;
}[] = [
  { feature: 'Logo — annuaire des partenaires (site officiel)', bronze: true, argent: true, or: true, diamant: true },
  { feature: 'Mentions réseaux sociaux FIMF', bronze: true, argent: true, or: true, diamant: true },
  { feature: 'Badge « Partenaire officiel FIMF »', bronze: true, argent: true, or: true, diamant: true },
  { feature: 'Invitations VIP', bronze: '2 / journée', argent: '4 / journée', or: '8 / journée', diamant: '12 / journée' },
  { feature: 'Panneaux publicitaires au bord des terrains', bronze: false, argent: true, or: true, diamant: true },
  { feature: 'Logo sur les supports officiels', bronze: false, argent: true, or: true, diamant: true },
  { feature: 'Logo sur les maillots', bronze: false, argent: false, or: true, diamant: true },
  { feature: 'Publications dédiées chaque mois', bronze: false, argent: false, or: '2 / mois', diamant: '4 / mois' },
  { feature: 'Stand partenaire sur les événements', bronze: false, argent: false, or: false, diamant: true },
  { feature: 'Nom associé au championnat (« présenté par … »)', bronze: false, argent: false, or: false, diamant: true },
];

/** FAQ courte — accordéon de la page. */
export const SPONSORING_FAQ: { q: string; a: string }[] = [
  {
    q: 'Comment se lance un partenariat avec la FIMF ?',
    a: 'Remplissez le formulaire de la page (2 minutes) en choisissant un package. La commission partenariats vous recontacte sous 72 heures ouvrées avec la proposition contractuelle. La visibilité digitale est activée dès la signature.',
  },
  {
    q: 'Peut-on personnaliser un package ?',
    a: 'Oui. Les avantages des packages Or et Diamant peuvent être ajustés à vos objectifs (territoire, durée, activations spécifiques). Choisissez « Sur devis » dans le formulaire et décrivez votre projet.',
  },
  {
    q: 'Quels sont les délais de visibilité ?',
    a: 'Canal et site : actifs sous 72 h après signature. Supports imprimés et panneaux : activation sous 15 jours. Équipements de match : à partir de la journée suivante du championnat.',
  },
  {
    q: 'Le partenariat couvre-t-il tout le territoire ?',
    a: 'Oui. La FIMF fédère plus de 100 clubs dans plusieurs districts et communes, la sélection nationale et une médiature nationale. Vos droits de marque s\u2019appliquent sur l\u2019ensemble des événements fédéraux.',
  },
  {
    q: 'Quels indicateurs de retour vais-je recevoir ?',
    a: 'Chaque saison, un rapport de visibilité vous est remis : audience des chaînes de la FIMF, compte-rendu média, photos d\u2019activation sur les sites d\u2019événements et retombées presse.',
  },
];

/**
 * Coordonnées officielles affichées à côté du formulaire.
 * (Source : sections Contact / Footer du site.)
 */
export const SPONSORING_CONTACT = {
  address: 'Cocody Deux Plateaux Vallons, Abidjan — Côte d\u2019Ivoire',
  email: 'fimf.infos@gmail.com',
  phone: '(+225) 27 22 41 35 94',
  /** Numéro affiché / lien wa.me (modifiable sans toucher à la vue). */
  whatsapp: '+225 07 08 56 35 36',
  hours: 'Commission partenariats : du lundi au vendredi, 9 h – 17 h',
};

/** Nom du champ Supabase d'insertion — aligné sur `sponsor_requests`. */
export const SPONSORING_DB_KEY = 'sponsor_requests' as const;

/** Motifs d'affichage : aide à la saisie du champ téléphone. */
export const SPONSORING_PHONE_PLACEHOLDER = '+225 07 00 00 00 00';
