import { useEffect, useState } from 'react';
import {
  fetchPublicSponsorContent,
  type SponsorPackage,
  type SponsoringSettings,
} from '../lib/sponsoringApi';
import {
  SPONSORING_CONTACT,
  SPONSORING_FAQ,
  SPONSORING_ARGUMENTS,
} from '../data/sponsoringData';
import { PARTNERS } from '../data/fimfData';

/**
 * ─────────────────────────────────────────────────────────────
 * useSponsorContent — données de la page publique /sponsoring.
 *
 * Source de vérité : les tables du module admin (sponsor_packages,
 * sponsor_partners, sponsor_settings). Si Supabase est indisponible
 * ou que les tables sont encore vides, on retombe sur les valeurs
 * par défaut de `src/data/sponsoringData.ts` (seed identique) afin
 * que la page reste toujours utilisable ; `source` indique le
 * provenance ('db' | 'defaut') utile en debug.
 * ─────────────────────────────────────────────────────────────
 */

export interface SponsorPartnerTile {
  id: string;
  name: string;
  logoUrl: string | null;
  category: string;
}

export interface SponsorContent {
  loading: boolean;
  source: 'db' | 'defaut';
  packages: SponsorPackage[];
  partners: SponsorPartnerTile[];
  settings: SponsoringSettings;
}

/** Valeurs par défaut — alignées sur le seed SQL du module. */
function defaultSettings(): SponsoringSettings {
  return {
    heroBadge: 'Partenariats & Sponsoring — Saison 2026',
    heroTitle: 'Devenez partenaire de la FIMF',
    heroSubtitle:
      "Offrez à votre marque une visibilité nationale sur les terrains, les écrans et les réseaux sociaux — au cœur d'une discipline qui fait vibrer la jeunesse ivoirienne chaque week-end.",
    arguments: SPONSORING_ARGUMENTS,
    faq: SPONSORING_FAQ,
    contactEmail: SPONSORING_CONTACT.email,
    contactPhone: SPONSORING_CONTACT.phone,
    contactWhatsapp: SPONSORING_CONTACT.whatsapp,
    contactAddress: SPONSORING_CONTACT.address,
    contactHours: SPONSORING_CONTACT.hours,
    notifyEmail: '',
    pageEnabled: true,
    formEnabled: true,
  };
}

function defaultPartners(): SponsorPartnerTile[] {
  return PARTNERS.map((p) => ({ id: p.id, name: p.name, logoUrl: null, category: p.category }));
}

/** Packages par défaut reconstitués (identiques au seed SQL). */
function staticPackages(): SponsorPackage[] {
  return [
    {
      id: 'seed-bronze', slug: 'bronze', name: 'Bronze', trophyKind: 'bronze', customImageUrl: null,
      tagline: 'Premier pas de votre marque sur le mini football ivoirien',
      priceAmount: 500000, currency: 'FCFA', isOnDemand: false, duration: 'Une saison (12 mois)',
      perks: [
        "Logo dans l'annuaire des partenaires du site officiel",
        'Mentions de votre marque sur les réseaux sociaux de la FIMF',
        'Badge « Partenaire officiel FIMF » pour vos supports',
        '2 invitations VIP par journée de championnat',
      ], badge: null, isPopular: false, maxSponsors: null, active: true, sortOrder: 1,
    },
    {
      id: 'seed-argent', slug: 'argent', name: 'Argent', trophyKind: 'argent', customImageUrl: null,
      tagline: 'Une visibilité constante sur tous les supports officiels',
      priceAmount: 1500000, currency: 'FCFA', isOnDemand: false, duration: 'Une saison (12 mois)',
      perks: [
        'Tous les avantages du pack Bronze',
        'Logo sur les communiqués et affiches officiels',
        'Panneaux publicitaires au bord des terrains (D1)',
        '4 invitations VIP par journée de championnat',
        'Logo intégré aux visuels des photos officielles',
      ], badge: null, isPopular: false, maxSponsors: null, active: true, sortOrder: 2,
    },
    {
      id: 'seed-or', slug: 'or', name: 'Or', trophyKind: 'or', customImageUrl: null,
      tagline: 'Le partenariat complet : maillots, digital et cérémonies',
      priceAmount: 4500000, currency: 'FCFA', isOnDemand: false, duration: 'Une saison (12 mois)',
      perks: [
        'Tous les avantages du pack Argent',
        'Logo sur les maillots des rencontres officielles',
        'Publications dédiées chaque mois sur les réseaux FIMF',
        'Logo premium en tête du site officiel',
        'Espace de marque lors des remises de trophées',
        '8 invitations VIP par journée de championnat',
      ], badge: 'LE PLUS POPULAIRE', isPopular: true, maxSponsors: null, active: true, sortOrder: 3,
    },
    {
      id: 'seed-diamant', slug: 'diamant', name: 'Diamant', trophyKind: 'diamant', customImageUrl: null,
      tagline: 'Le partenariat exclusif — votre marque au cœur de la FIMF',
      priceAmount: null, currency: 'FCFA', isOnDemand: true, duration: 'Sur mesure (12 à 36 mois)',
      perks: [
        'Tous les avantages du pack Or',
        'Votre nom associé au championnat (« présenté par … »)',
        "Stand partenaire sur tous les sites d'événements",
        'Trophée personnalisé et gravé à votre marque',
        "Contenus vidéo dédiés avec l'équipe média FIMF",
        'Rencontre annuelle avec les dirigeants de la Fédération',
      ], badge: 'PRESTIGE MAXIMAL', isPopular: false, maxSponsors: null, active: true, sortOrder: 4,
    },
  ];
}

export function useSponsorContent(): SponsorContent {
  const [state, setState] = useState<SponsorContent>(() => ({
    loading: true,
    source: 'db',
    packages: [],
    partners: defaultPartners(),
    settings: defaultSettings(),
  }));

  useEffect(() => {
    let cancelled = false;
    fetchPublicSponsorContent()
      .then(({ packages, partners, settings }) => {
        if (cancelled) return;
        const emptyPackages = packages.length === 0;
        setState({
          loading: false,
          source: emptyPackages ? 'defaut' : 'db',
          packages: emptyPackages ? staticPackages() : packages,
          partners: partners.length > 0 ? partners : defaultPartners(),
          settings: {
            ...defaultSettings(),
            ...(settings ?? {}),
            pageEnabled: settings?.pageEnabled ?? true,
            formEnabled: settings?.formEnabled ?? true,
          },
        });
      })
      .catch(() => {
        // Supabase indisponible → affichage au fallback statique complet
        if (!cancelled) {
          setState({
            loading: false,
            source: 'defaut',
            packages: staticPackages(),
            partners: defaultPartners(),
            settings: defaultSettings(),
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
