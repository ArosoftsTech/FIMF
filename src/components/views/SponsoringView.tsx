import React, { useEffect, useState } from 'react';
import {
  Eye,
  TrendingUp,
  HeartHandshake,
  Users,
  Check,
  X,
  ArrowDown,
  ArrowRight,
  Mail,
  Phone,
  MapPin,
  Send,
  Loader2,
  CheckCircle2,
  ChevronDown,
  Handshake,
  MessageCircle,
  Sparkles,
  ShieldCheck,
  Info,
} from 'lucide-react';
import { Reveal, Stagger, StaggerItem } from '../anim/Reveal';
import { supabase } from '../../lib/supabaseClient';
import { FIMF_STATS } from '../../data/fimfData';
import { CUSTOM_PACK_ID, SPONSORING_ARGUMENTS, SPONSORING_FAQ } from '../../data/sponsoringData';
import { TROPHY_COMPONENTS, TROPHY_SIZE_CLASS, type TrophySize } from '../sponsoring/Trophies';
import {
  useSponsorContent,
  type SponsorPartnerTile,
} from '../../hooks/useSponsorContent';
import type { SponsorPackage, SponsoringArgument, SponsoringFaq, SponsoringSettings } from '../../lib/sponsoringApi';

/* ─────────────────────────────────────────────────────────────
 * PAGE /sponsoring — Sponsoring & Partenariat de la FIMF.
 * PARCOURS : comprendre l'offre → comparer → choisir → contacter.
 *
 * TOUT le contenu (packages, prix, avantages, partenaires,
 * textes du hero, arguments, FAQ, coordonnées) provient du
 * module admin via `useSponsorContent`. Un fallback statique
 * (même contenu que le seed SQL) s'affiche si la base est vide.
 * ───────────────────────────────────────────────────────────── */

/** Défilement fluide (respecte `prefers-reduced-motion`). */
const smoothScrollTo = (elementId: string) => {
  const el = document.getElementById(elementId);
  if (!el) return;
  el.scrollIntoView({
    behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
    block: 'start',
  });
};

const ARGUMENT_ICONS: Record<string, React.ElementType> = {
  eye: Eye,
  trending: TrendingUp,
  heart: HeartHandshake,
  users: Users,
};

/** Libellé de prix : montant + devise, ou « Sur devis ». */
const priceLabel = (p: SponsorPackage): string =>
  p.isOnDemand
    ? 'Sur devis'
    : p.priceAmount !== null
      ? `${p.priceAmount.toLocaleString('fr-FR').replace(/\u202f|\u00a0/g, ' ')} ${p.currency}`
      : 'Sur devis';

/* ═══════════════════ 1. HERO ═══════════════════ */

const HeroSection: React.FC<{ badge: string; title: React.ReactNode; subtitle: string }> = ({
  badge,
  title,
  subtitle,
}) => (
  <section
    id="sp-hero"
    className="relative overflow-hidden bg-[#052818] text-white scroll-mt-24"
  >
    {/* Décors : halos orange/vert (charte) + trame de points */}
    <div aria-hidden="true" className="absolute inset-0">
      <div className="absolute -top-32 -right-24 w-[28rem] h-[28rem] rounded-full bg-[#f97316] opacity-10 blur-3xl" />
      <div className="absolute -bottom-40 -left-24 w-[26rem] h-[26rem] rounded-full bg-emerald-500 opacity-10 blur-3xl" />
      <div
        className="absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)',
          backgroundSize: '26px 26px',
        }}
      />
      {/* Bandes drapeau ivoirien (orange/blanc/vert) */}
      <div className="absolute top-0 inset-x-0 h-1 flex">
        <span className="w-1/3 bg-[#f97316]" />
        <span className="w-1/3 bg-white/80" />
        <span className="w-1/3 bg-emerald-500" />
      </div>
    </div>

    <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-20 grid lg:grid-cols-[1.2fr_0.8fr] gap-10 items-center">
      <Reveal>
        <div>
          {/* Étiquette */}
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/15 text-[11px] font-black uppercase tracking-widest">
            <Handshake className="w-3.5 h-3.5 text-[#f97316]" />
            {badge}
          </span>

          <h1 className="mt-5 text-4xl sm:text-5xl lg:text-6xl font-black uppercase tracking-tight leading-[1.02]">
            {title}
          </h1>

          <p className="mt-5 text-emerald-100/90 text-base sm:text-lg max-w-xl leading-relaxed">
            {subtitle}
          </p>

          {/* CTA principal → section packages */}
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => smoothScrollTo('sp-packages')}
              className="fimf-btn-lift inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-[#f97316] hover:bg-[#ea580c] text-white text-sm font-black uppercase tracking-wider shadow-lg shadow-orange-900/30 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#052818]"
            >
              Découvrir les packages
              <ArrowDown className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => smoothScrollTo('sp-contact')}
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl border border-white/25 hover:bg-white/10 text-white text-sm font-bold uppercase tracking-wider transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              Nous contacter
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Chiffres clés de la Fédération */}
          <Stagger className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl">
            {[
              { value: FIMF_STATS.clubsCount, label: FIMF_STATS.clubsLabel },
              { value: FIMF_STATS.playersCount, label: FIMF_STATS.playersLabel },
              { value: FIMF_STATS.refereesCount, label: FIMF_STATS.refereesLabel },
              { value: FIMF_STATS.pitchesCount, label: FIMF_STATS.pitchesLabel },
            ].map((s) => (
              <StaggerItem
                key={s.label}
                className="rounded-xl bg-white/[0.06] border border-white/10 px-3 py-3.5 text-center"
              >
                <div className="font-teko text-2xl sm:text-3xl leading-none text-[#f97316]">{s.value}</div>
                <div className="mt-1 text-[9px] font-bold tracking-widest text-emerald-100/70 uppercase">{s.label}</div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </Reveal>

      {/* Trophée Or décoratif (desktop) */}
      <Reveal direction="right" className="hidden lg:block">
        <div className="relative mx-auto w-fit">
          <div className="absolute inset-0 rounded-full bg-[#f97316]/15 blur-2xl scale-110" aria-hidden="true" />
          <TROPHY_COMPONENTS.or
            className="relative w-56 h-56 2xl:w-64 2xl:h-64 drop-shadow-[0_24px_40px_rgba(0,0,0,0.45)]"
            label="Trophée Or — symbole du partenariat FIMF"
          />
        </div>
      </Reveal>
    </div>
  </section>
);

/* ═══════════════════ 2. POURQUOI NOUS SOUTENIR ═══════════════════ */

const WhySection: React.FC<{ argumentsList: SponsoringArgument[] }> = ({ argumentsList }) => (
  <section id="sp-pourquoi" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-20 scroll-mt-24">
    <Reveal>
      <div className="text-center max-w-2xl mx-auto">
        <span className="text-[11px] font-black uppercase tracking-[0.2em] text-[#ea580c]">Pourquoi nous soutenir</span>
        <h2 className="mt-2 text-2xl sm:text-3xl font-black uppercase tracking-tight text-slate-900">
          Un investissement qui se voit, et qui compte
        </h2>
        <p className="mt-3 text-slate-600 text-sm sm:text-base">
          S'associer à la FIMF, c'est gagner en visibilité tout en soutenant
          le sport et la jeunesse de Côte d'Ivoire.
        </p>
      </div>
    </Reveal>

    <Stagger className="mt-10 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {argumentsList.map((arg) => {
        const Icon = ARGUMENT_ICONS[arg.icon] ?? Eye;
        return (
          <StaggerItem key={arg.title}>
            <div className="group h-full bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200">
              <div className="w-11 h-11 rounded-xl bg-orange-50 text-[#ea580c] flex items-center justify-center group-hover:bg-[#ea580c] group-hover:text-white transition-colors">
                <Icon className="w-5 h-5" />
              </div>
              <h3 className="mt-4 font-black text-slate-900 uppercase text-sm tracking-tight">{arg.title}</h3>
              <p className="mt-2 text-[13px] text-slate-600 leading-relaxed">{arg.text}</p>
            </div>
          </StaggerItem>
        );
      })}
    </Stagger>
  </section>
);

/* ═══════════════════ 3. PACKAGES ═══════════════════ */

interface PackagesSectionProps {
  packages: SponsorPackage[];
  onChoose: (pack: string) => void;
}

/** Trophée d'un package : illustration standard ou image téléversée. */
const PackageTrophy: React.FC<{ pack: SponsorPackage; size?: TrophySize; className?: string }> = ({
  pack,
  size,
  className = '',
}) => {
  if (pack.trophyKind === 'custom' && pack.customImageUrl) {
    return (
      <img
        src={pack.customImageUrl}
        alt={'Trophée du package ' + pack.name}
        loading="lazy"
        className={
          'object-contain ' + (size ? TROPHY_SIZE_CLASS[size] + ' ' : '') + className
        }
      />
    );
  }
  const Trophy = TROPHY_COMPONENTS[pack.trophyKind === 'custom' ? 'or' : pack.trophyKind];
  // Taille : palier explicite (`size`) ou classes passées par l'appelant ;
  // sans aucun des deux, le trophée garde sa taille canonique (défaut du composant).
  return (
    <Trophy
      className={(size ? TROPHY_SIZE_CLASS[size] + ' ' : '') + className}
      label={'Trophée du package ' + pack.name}
    />
  );
};

const PackagesSection: React.FC<PackagesSectionProps> = ({ packages, onChoose }) => (
  <section
    id="sp-packages"
    className="bg-white border-y border-slate-100 py-14 md:py-20 scroll-mt-24"
  >
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <Reveal>
        <div className="text-center max-w-2xl mx-auto">
          <span className="text-[11px] font-black uppercase tracking-[0.2em] text-[#ea580c]">Nos packages</span>
          <h2 className="mt-2 text-2xl sm:text-3xl font-black uppercase tracking-tight text-slate-900">
            Choisissez votre trophée
          </h2>
          <p className="mt-3 text-slate-600 text-sm sm:text-base">
            Quatre niveaux de partenariat, des montants clairs et une
            progression simple : plus le trophée est grand, plus votre
            visibilité s'élargit.
          </p>
        </div>
      </Reveal>

      <Stagger className="mt-12 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 items-stretch gap-5">
        {packages.map((pack, i) => (
          <StaggerItem key={pack.id} className="h-full">
            <article
              className={
                'group h-full flex flex-col rounded-2xl bg-white border shadow-sm transition-all duration-300 hover:-translate-y-1.5 ' +
                (pack.isPopular
                  ? 'border-[#f97316] shadow-lg shadow-orange-500/10 hover:shadow-xl hover:shadow-orange-500/20 ring-2 ring-[#f97316]/20 md:-my-2 md:py-2'
                  : 'border-slate-200 hover:shadow-xl hover:border-slate-300')
              }
            >
              {/* En-tête : badge + trophée sur médaillon, éclat au survol */}
              <div
                className={
                  'relative px-5 pt-5 pb-3 text-center rounded-t-2xl ' +
                  (pack.isPopular ? 'bg-[#052818]' : 'bg-[#f8faf9]')
                }
              >
                {(pack.badge || pack.isPopular) && (
                  <span
                    className={
                      'inline-block px-3 py-1 rounded-full text-[9.5px] font-black uppercase tracking-widest shadow-sm ' +
                      'bg-[#f97316] text-white'
                    }
                  >
                    {pack.badge || 'LE PLUS POPULAIRE'}
                  </span>
                )}
                {/* Médaillon trophée : fond + éclat lumineux au survol */}
                <div className="relative mx-auto mt-3 w-fit">
                  <div
                    aria-hidden="true"
                    className={'absolute inset-0 rounded-full ' + (pack.isPopular ? 'bg-[#f97316]/10' : 'bg-slate-900/[0.04]')}
                  />
                  <PackageTrophy
                    pack={pack}
                    size={(['sm', 'md', 'xl', 'lg'] as TrophySize[])[Math.min(i, 3)]}
                    className="relative transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="fimf-sheen absolute inset-0 rounded-full pointer-events-none" aria-hidden="true" />
                </div>
              </div>

              {/* Corps : nom, montant, avantages, CTA */}
              <div className="flex flex-col flex-1 p-5 pt-4 border-t">
                <h3 className="text-center font-black uppercase tracking-tight text-slate-900 text-lg">
                  <span className="block text-[10px] font-bold tracking-[0.25em] text-slate-400">Package</span>
                  {pack.name}
                </h3>
                <p className="mt-2 text-center text-[11.5px] text-slate-500 leading-snug min-h-[2.4em]">{pack.tagline}</p>
                {pack.duration && (
                  <p className="text-center text-[10.5px] text-slate-400 font-semibold uppercase tracking-wider mt-1">
                    {pack.duration}
                  </p>
                )}

                {/* Montant */}
                <div className="mt-4 text-center">
                  <span className={'font-black text-2xl tracking-tight ' + (pack.isPopular ? 'text-[#ea580c]' : 'text-[#004724]')}>
                    {priceLabel(pack)}
                  </span>
                  {pack.maxSponsors !== null && pack.maxSponsors > 0 && (
                    <span className="block text-[10px] text-slate-400 font-semibold mt-0.5">
                      Maximum {pack.maxSponsors} sponsors
                    </span>
                  )}
                </div>

                {/* Avantages */}
                <ul className="mt-5 space-y-2.5 flex-1">
                  {pack.perks.map((perk) => (
                    <li key={perk} className="flex items-start gap-2 text-[12.5px] text-slate-700 leading-snug">
                      <span
                        className={
                          'mt-0.5 w-4 h-4 rounded-full flex items-center justify-center shrink-0 ' +
                          (pack.isPopular ? 'bg-orange-100 text-[#ea580c]' : 'bg-emerald-50 text-[#006039]')
                        }
                      >
                        <Check className="w-2.5 h-2.5" strokeWidth={3.5} />
                      </span>
                      <span>{perk}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <button
                  type="button"
                  onClick={() => onChoose(pack.slug)}
                  className={
                    'mt-6 w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ' +
                    (pack.isPopular
                      ? 'bg-[#f97316] hover:bg-[#ea580c] text-white shadow-md shadow-orange-500/25 hover:shadow-lg'
                      : 'bg-[#004724] hover:bg-[#006039] text-white shadow-sm')
                  }
                  aria-label={'Choisir ce package : ' + pack.name}
                >
                  Choisir ce package
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </article>
          </StaggerItem>
        ))}
      </Stagger>

      {/* Lien vers le comparatif */}
      <Reveal>
        <p className="mt-10 text-center text-[13px] text-slate-500">
          Besoin d'un aperçu rapide ?{' '}
          <button
            type="button"
            onClick={() => smoothScrollTo('sp-comparateur')}
            className="font-black text-[#ea580c] hover:underline cursor-pointer inline-flex items-center gap-1"
          >
            Consultez le tableau comparatif <ArrowDown className="w-3.5 h-3.5" />
          </button>
        </p>
      </Reveal>
    </div>
  </section>
);

/* ═══════════════════ 4. COMPARATEUR (dérivé des packages) ═══════════════════ */

interface ComparisonRow {
  feature: string;
  cells: (boolean | string)[];
}

/**
 * Construit le tableau comparatif à partir des avantages des packages
 * (aucune donnée dupliquée : la matrice dérive automatiquement du contenu).
 * Les perks « Tous les avantages du X » héritent des lignes du package X.
 */
function buildComparisonRows(packages: SponsorPackage[]): { rows: ComparisonRow[] } {
  // Expansion de l'héritage « Tous les avantages du pack X »
  const byName = new Map(packages.map((p) => [p.name.toLowerCase(), p]));
  const expanded = packages.map((p) => {
    const all: string[] = [];
    for (const perk of p.perks) {
      const m = perk.match(/^tous les avantages du (?:pack |package )(.+)$/i);
      if (m) {
        const parent = byName.get(m[1].trim().toLowerCase());
        if (parent && parent !== p) all.push(...parent.perks);
      } else {
        all.push(perk);
      }
    }
    return { pack: p, perks: Array.from(new Set(all)) };
  });

  // Regroupe chaque libellé → disponibilité par package
  const featureMap = new Map<string, (boolean | string)[]>();
  for (const { pack, perks } of expanded) {
    for (const perk of perks) {
      const arr = featureMap.get(perk) ?? Array(packages.length).fill(false);
      const idx = packages.findIndex((p) => p.id === pack.id);
      arr[idx] = perk; // présence (le libellé sert de détail si répété différemment)
      featureMap.set(perk, arr);
    }
  }
  const rows: ComparisonRow[] = Array.from(featureMap.entries())
    // Tri : avantages le plus largement inclus d'abord
    .sort((a, b) => b[1].filter(Boolean).length - a[1].filter(Boolean).length)
    .map(([feature, cells]) => ({ feature, cells }));
  return { rows };
}

const ComparisonSection: React.FC<{ packages: SponsorPackage[] }> = ({ packages }) => {
  const { rows } = React.useMemo(() => buildComparisonRows(packages), [packages]);
  if (packages.length === 0) return null;

  return (
    <section id="sp-comparateur" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-20 scroll-mt-24">
      <Reveal>
        <div className="text-center max-w-2xl mx-auto">
          <span className="text-[11px] font-black uppercase tracking-[0.2em] text-[#ea580c]">Comparateur</span>
          <h2 className="mt-2 text-2xl sm:text-3xl font-black uppercase tracking-tight text-slate-900">
            Comparez les packages en un coup d'œil
          </h2>
        </div>
      </Reveal>

      <Reveal className="mt-8">
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-x-auto">
          <table className="w-full text-left border-collapse" style={{ minWidth: 240 + packages.length * 130 }}>
            <caption className="sr-only">
              Comparatif des avantages des packages de sponsoring de la FIMF
            </caption>
            <thead>
              <tr className="bg-[#052818] text-white">
                <th scope="col" className="px-5 py-4 text-[11px] font-black uppercase tracking-wider">
                  Avantages
                </th>
                {packages.map((pack) => (
                  <th
                    key={pack.id}
                    scope="col"
                    className={'px-4 py-4 text-center ' + (pack.isPopular ? 'bg-[#0b3a20]' : '')}
                  >
                    <PackageTrophy pack={pack} className="w-10 h-10 mx-auto mb-1" />
                    <span className="block text-xs font-black uppercase tracking-wide">{pack.name}</span>
                    <span className="block text-[10px] font-medium text-emerald-200/70 mt-0.5">{priceLabel(pack)}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={row.feature} className={i % 2 === 1 ? 'bg-[#f8faf9]' : 'bg-white'}>
                  <th scope="row" className="px-5 py-3 text-[12.5px] font-semibold text-slate-700 border-t border-slate-100">
                    {row.feature}
                  </th>
                  {row.cells.map((cell, j) => (
                    <td key={j} className="px-4 py-3 text-center border-t border-slate-100">
                      {cell ? (
                        <Check className="w-5 h-5 mx-auto text-[#006039]" strokeWidth={3} aria-label="Inclus" role="img" />
                      ) : (
                        <X className="w-4 h-4 mx-auto text-slate-300" strokeWidth={2.5} aria-label="Non inclus" role="img" />
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-center text-[12px] text-slate-500">
          Tous les packages sont modulables — la commission partenariats peut adapter un dispositif à votre budget.
        </p>
      </Reveal>
    </section>
  );
};

/* ═══════════════════ 5. ILS NOUS FONT CONFIANCE ═══════════════════ */

const PartnersSection: React.FC<{ partners: SponsorPartnerTile[] }> = ({ partners }) => (
  <section
    id="sp-partenaires"
    className="bg-[#f8faf9] border-y border-slate-100 py-14 md:py-20 scroll-mt-24"
  >
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <Reveal>
        <div className="text-center max-w-2xl mx-auto">
          <span className="text-[11px] font-black uppercase tracking-[0.2em] text-[#ea580c]">Ils nous font confiance</span>
          <h2 className="mt-2 text-2xl sm:text-3xl font-black uppercase tracking-tight text-slate-900">
            Des marques aux côtés de la FIMF
          </h2>
          <p className="mt-3 text-slate-600 text-sm sm:text-base">
            Institutions, télécoms, industries : rejoignez le cercle des
            partenaires du mini football ivoirien.
          </p>
        </div>
      </Reveal>

      <Stagger className="mt-10 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {partners.map((partner, i) => (
          <StaggerItem key={partner.id}>
            <div className="group flex flex-col items-center justify-center gap-3 rounded-2xl bg-white border border-slate-200 p-5 text-center shadow-sm hover:shadow-md hover:border-slate-300 transition-all min-h-[132px]">
              {partner.logoUrl ? (
                /* Logo téléversé depuis l'admin */
                <img
                  src={partner.logoUrl}
                  alt={'Logo ' + partner.name}
                  loading="lazy"
                  className="max-h-12 max-w-[8rem] object-contain transition-transform duration-200 group-hover:scale-105"
                />
              ) : (
                /* Placeholder : monogramme tant qu'aucun logo n'est téléversé */
                <span className="text-2xl font-black text-slate-300 tracking-tight select-none" aria-hidden="true">
                  {partner.name.split(/[\s&']/)[0].toUpperCase()}
                </span>
              )}
              <span>
                <span className="block text-xs font-black text-slate-800 group-hover:text-[#ea580c] transition-colors">
                  {partner.name}
                </span>
                {partner.category && (
                  <span className="block text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">
                    {partner.category}
                  </span>
                )}
              </span>
            </div>
          </StaggerItem>
        ))}
        {/* Emplacement réservé : votre logo ici (géré depuis l'admin) */}
        <StaggerItem>
          <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[#f97316]/50 bg-orange-50/40 p-5 h-full min-h-[132px] text-center">
            <span className="text-slate-500 text-sm">
              <Sparkles className="w-5 h-5 mx-auto mb-1 text-[#ea580c]" aria-hidden="true" />
              Votre logo ?
            </span>
            <span className="text-[10px] text-slate-500 leading-tight">Parmi les prochaines têtes d'affiche du mini foot ivoirien</span>
          </div>
        </StaggerItem>
      </Stagger>
    </div>
  </section>
);

/* ═══════════════════ 6. CONTACT / DEMANDE DE PARTENARIAT ═══════════════════ */

type FormState = {
  company: string;
  contactName: string;
  email: string;
  phone: string;
  pack: string;
  message: string;
};

const EMPTY_FORM: FormState = { company: '', contactName: '', email: '', phone: '', pack: 'or', message: '' };
type FieldKey = keyof FormState;

/* Icône WhatsApp (SVG officiel, absent de lucide) */
const WhatsAppIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.297-.497.099-.198.05-.371-.05-.52-.099-.148-.669-1.612-.916-2.207-.242-.579-.487-.501-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413" />
  </svg>
);

interface ContactSectionProps {
  settings: SponsoringSettings;
  packages: SponsorPackage[];
  /** Package présélectionné (depuis « Choisir ce package » ou deep-link ?pack=). */
  selectedPack: string;
  preselectedFrom: boolean;
  onChangePackage: (pack: string) => void;
}

const ContactSection: React.FC<ContactSectionProps> = ({
  settings,
  packages,
  selectedPack,
  preselectedFrom,
  onChangePackage,
}) => {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<FieldKey, string>>>({});
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Le package change ici ou ailleurs (cartes / deep-link) → dans le <select>
    setForm((f) => ({ ...f, pack: selectedPack }));
  }, [selectedPack]);

  const set = (key: FieldKey) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setFieldErrors((prev) => (prev[key] ? { ...prev, [key]: undefined } : prev));
  };

  /** Validation : champs requis + formats. Retourne l'id DOM du 1er champ en erreur. */
  const validate = (): string | null => {
    const errs: Partial<Record<FieldKey, string>> = {};
    if (!form.company.trim()) errs.company = 'Indiquez le nom de votre entreprise.';
    if (!form.contactName.trim()) errs.contactName = 'Indiquez votre nom.';
    if (!form.email.trim()) errs.email = 'Indiquez votre email.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email.trim())) errs.email = "Format d'email invalide.";
    if (form.phone.trim() && !/^[+\d][\d\s()-]{7,}$/.test(form.phone.trim())) {
      errs.phone = 'Format de téléphone invalide.';
    }
    setFieldErrors(errs);
    const firstKey = (['company', 'contactName', 'email', 'phone'] as FieldKey[]).find((k) => errs[k]);
    return firstKey ? 'spres-' + firstKey.toLowerCase() : null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const invalidFieldId = validate();
    if (invalidFieldId) {
      setTimeout(() => document.getElementById(invalidFieldId)?.focus(), 0);
      return;
    }
    setSending(true);
    try {
      const { error: dbError } = await supabase.from('sponsor_requests').insert({
        company: form.company.trim(),
        contact_name: form.contactName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || null,
        pack: form.pack,
        message: form.message.trim() || null,
      });
      if (dbError) throw dbError;
      setSuccess(true);
      setForm(EMPTY_FORM);
    } catch (err) {
      setError(
        err instanceof Error
          ? 'Envoi impossible : ' + err.message
          : 'Envoi impossible pour le moment. Contactez-nous à ' + settings.contactEmail + '.',
      );
    } finally {
      setSending(false);
    }
  };

  const inputClass = (invalid?: boolean) =>
    'w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#ea580c]/50 ' +
    (invalid ? 'border-red-300 bg-red-50/50' : 'border-slate-200');

  const labelClass = 'block text-xs font-bold text-slate-700 mb-1';
  const waHref = 'https://wa.me/' + settings.contactWhatsapp.replace(/\D/g, '');

  return (
    <section id="sp-contact" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-20 scroll-mt-24">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Coordonnées + WhatsApp */}
        <Reveal className="lg:col-span-4">
          <div className="bg-[#052818] text-white rounded-2xl p-6 sm:p-8 space-y-6 lg:sticky lg:top-24">
            <div>
              <span className="text-[11px] font-black uppercase tracking-[0.2em] text-[#f97316]">Contact direct</span>
              <h2 className="mt-2 text-xl sm:text-2xl font-black uppercase tracking-tight">
                Parlez-nous de votre projet
              </h2>
              <p className="mt-2 text-[13px] text-emerald-100/80 leading-relaxed">
                La commission partenariats vous répond sous 72 heures ouvrées,
                avec une proposition adaptée à vos objectifs.
              </p>
            </div>

            <ul className="space-y-4 text-sm">
              <li className="flex items-start gap-3">
                <span className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4 text-[#f97316]" />
                </span>
                <span className="text-emerald-100/90">{settings.contactAddress}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                  <Mail className="w-4 h-4 text-[#f97316]" />
                </span>
                <a href={'mailto:' + settings.contactEmail} className="text-emerald-100/90 hover:text-white font-semibold break-all">
                  {settings.contactEmail}
                </a>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                  <Phone className="w-4 h-4 text-[#f97316]" />
                </span>
                <a href={'tel:' + settings.contactPhone.replace(/\D/g, '')} className="text-emerald-100/90 hover:text-white font-semibold">
                  {settings.contactPhone}
                </a>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4 h-4 text-[#f97316]" />
                </span>
                <span className="text-emerald-100/80 text-[12.5px]">{settings.contactHours}</span>
              </li>
            </ul>

            {/* WhatsApp direct */}
            <a
              href={waHref}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-[#006039] hover:bg-[#00804a] text-white text-xs font-black uppercase tracking-wider transition-colors"
            >
              <WhatsAppIcon className="w-4 h-4" />
              Discuter sur WhatsApp
            </a>
          </div>
        </Reveal>

        {/* Formulaire de demande (ou notice si désactivé par l'admin) */}
        <Reveal delay={0.05} className="lg:col-span-8">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
            {!settings.formEnabled ? (
              <div className="py-10 text-center space-y-4">
                <div className="w-16 h-16 mx-auto rounded-full bg-orange-100 text-[#ea580c] flex items-center justify-center">
                  <Info className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-black text-slate-900 uppercase">Formulaire suspendu</h3>
                <p className="text-sm text-slate-600 max-w-md mx-auto">
                  Le dépôt de nouvelles demandes est momentanément désactivé.
                  Contactez-nous directement à{' '}
                  <a className="font-bold text-[#ea580c]" href={'mailto:' + settings.contactEmail}>{settings.contactEmail}</a>{' '}
                  ou via WhatsApp.
                </p>
              </div>
            ) : success ? (
              /* Confirmation après envoi */
              <div className="text-center py-10 space-y-4">
                <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-black text-slate-900 uppercase">Demande envoyée !</h3>
                <p className="text-sm text-slate-600 max-w-md mx-auto">
                  Merci pour votre intérêt pour la FIMF. Un email de confirmation
                  vous a été envoyé et la commission partenariats vous recontactera
                  sous <strong>72 heures ouvrées</strong> à l'adresse indiquée.
                </p>
                <div className="flex flex-wrap justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setSuccess(false)}
                    className="px-6 py-2.5 rounded-xl bg-[#004724] hover:bg-[#006039] text-white text-xs font-black uppercase cursor-pointer"
                  >
                    Envoyer une autre demande
                  </button>
                  <a
                    href={waHref}
                    target="_blank"
                    rel="noreferrer"
                    className="px-6 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-black uppercase inline-flex items-center gap-2"
                  >
                    <WhatsAppIcon className="w-3.5 h-3.5" /> Nous joindre tout de suite
                  </a>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {selectedPack !== CUSTOM_PACK_ID && preselectedFrom && (
                  /* Bandeau : package présélectionné via une carte */
                  <div className="p-3 rounded-xl bg-orange-50 border border-orange-200 text-[12px] font-bold text-slate-700 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-[#ea580c] text-white flex items-center justify-center">
                      <Check className="w-3 h-3" strokeWidth={3.5} />
                    </span>
                    Package « {packages.find((p) => p.slug === selectedPack)?.name ?? selectedPack} » présélectionné — modifiable ci-dessous.
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass} htmlFor="spres-company">Entreprise *</label>
                    <input
                      id="spres-company"
                      type="text"
                      value={form.company}
                      onChange={set('company')}
                      placeholder="Nom de votre société"
                      aria-invalid={!!fieldErrors.company}
                      className={inputClass(!!fieldErrors.company)}
                    />
                    {fieldErrors.company && <p className="mt-1 text-[11px] font-bold text-red-600">{fieldErrors.company}</p>}
                  </div>
                  <div>
                    <label className={labelClass} htmlFor="spres-contactname">Nom du contact *</label>
                    <input
                      id="spres-contactname"
                      type="text"
                      value={form.contactName}
                      onChange={set('contactName')}
                      placeholder="Prénom et nom"
                      aria-invalid={!!fieldErrors.contactName}
                      className={inputClass(!!fieldErrors.contactName)}
                    />
                    {fieldErrors.contactName && <p className="mt-1 text-[11px] font-bold text-red-600">{fieldErrors.contactName}</p>}
                  </div>
                  <div>
                    <label className={labelClass} htmlFor="spres-email">Email *</label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
                      <input
                        id="spres-email"
                        type="email"
                        value={form.email}
                        onChange={set('email')}
                        placeholder="contact@societe.ci"
                        aria-invalid={!!fieldErrors.email}
                        className={inputClass(!!fieldErrors.email) + ' pl-9'}
                      />
                    </div>
                    {fieldErrors.email && <p className="mt-1 text-[11px] font-bold text-red-600">{fieldErrors.email}</p>}
                  </div>
                  <div>
                    <label className={labelClass} htmlFor="spres-phone">Téléphone <span className="text-slate-400 font-semibold">(facultatif)</span></label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
                      <input
                        id="spres-phone"
                        type="tel"
                        value={form.phone}
                        onChange={set('phone')}
                        placeholder="+225 07 00 00 00 00"
                        aria-invalid={!!fieldErrors.phone}
                        className={inputClass(!!fieldErrors.phone) + ' pl-9'}
                      />
                    </div>
                    {fieldErrors.phone && <p className="mt-1 text-[11px] font-bold text-red-600">{fieldErrors.phone}</p>}
                  </div>
                </div>

                {/* Package souhaité (prérempli par les cartes) */}
                <div>
                  <label className={labelClass} htmlFor="spres-pack">Package souhaité</label>
                  <select
                    id="spres-pack"
                    value={form.pack}
                    onChange={(e) => {
                      set('pack')(e);
                      onChangePackage(e.target.value);
                    }}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#ea580c]/50 cursor-pointer"
                  >
                    {packages.map((p) => (
                      <option key={p.id} value={p.slug}>
                        Package {p.name} — {priceLabel(p)}
                      </option>
                    ))}
                    <option value={CUSTOM_PACK_ID}>Sur devis / projet sur-mesure</option>
                  </select>
                </div>

                <div>
                  <label className={labelClass} htmlFor="spres-message">Message <span className="text-slate-400 font-semibold">(facultatif)</span></label>
                  <textarea
                    id="spres-message"
                    rows={4}
                    value={form.message}
                    onChange={set('message')}
                    placeholder="Précisez vos objectifs, votre budget indicatif ou toute question…"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#ea580c]/50 resize-none"
                  />
                </div>

                {error && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold" role="alert">
                    {error}
                  </div>
                )}

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <button
                    type="submit"
                    disabled={sending}
                    className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#ea580c] to-[#f97316] hover:from-[#c2410c] hover:to-[#ea580c] disabled:opacity-60 text-white font-black text-xs uppercase tracking-wider transition-all shadow-md shadow-orange-500/20 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    {sending ? 'Envoi en cours…' : 'Envoyer ma demande de partenariat'}
                  </button>
                  <p className="text-[10.5px] text-slate-400 leading-snug sm:max-w-[15rem]">
                    Vos données servent uniquement au traitement de votre demande (RGPD).
                  </p>
                </div>
              </form>
            )}
          </div>
        </Reveal>
      </div>
    </section>
  );
};

/* ═══════════════════ 7. FAQ ═══════════════════ */

const FaqSection: React.FC<{ faq: SponsoringFaq[] }> = ({ faq }) => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="sp-faq" className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 md:pb-24 scroll-mt-24">
      <Reveal>
        <div className="text-center">
          <span className="text-[11px] font-black uppercase tracking-[0.2em] text-[#ea580c]">FAQ</span>
          <h2 className="mt-2 text-2xl sm:text-3xl font-black uppercase tracking-tight text-slate-900">
            Questions fréquentes
          </h2>
        </div>
      </Reveal>

      <Reveal className="mt-8">
        <div className="divide-y divide-slate-200 rounded-2xl bg-white border border-slate-200 shadow-sm">
          {faq.map((item, i) => {
            const open = openIndex === i;
            return (
              <div key={item.q}>
                <button
                  type="button"
                  onClick={() => setOpenIndex(open ? null : i)}
                  aria-expanded={open}
                  aria-controls={'sp-faq-answer-' + i}
                  className="w-full flex items-center justify-between gap-4 px-5 sm:px-6 py-4 text-left hover:bg-orange-50/50 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ea580c]/50 rounded-xl"
                >
                  <span className="text-[13.5px] font-black text-slate-800">{item.q}</span>
                  <ChevronDown
                    className={'w-4 h-4 shrink-0 text-[#ea580c] transition-transform duration-200 ' + (open ? 'rotate-180' : '')}
                  />
                </button>
                {open && (
                  <div id={'sp-faq-answer-' + i} className="px-5 sm:px-6 pb-5 -mt-1">
                    <p className="text-sm text-slate-600 leading-relaxed">{item.a}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Reveal>

      {/* CTA final */}
      <Reveal>
        <div className="mt-10 rounded-2xl bg-[#052818] text-white p-7 sm:p-9 text-center relative overflow-hidden">
          <TROPHY_COMPONENTS.diamant className="absolute -right-4 -bottom-6 w-36 opacity-25 pointer-events-none" label="Trophée Diamant" />
          <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tight">Un projet spécifique ?</h3>
          <p className="mt-2 text-[13.5px] text-emerald-100/85 max-w-lg mx-auto">
            Campagne ponctuelle, naming d'épreuve ou partenariat institutionnel :
            la FIMF construit des dispositifs sur-mesure.
          </p>
          <button
            type="button"
            onClick={() => smoothScrollTo('sp-contact')}
            className="mt-5 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#f97316] hover:bg-[#ea580c] text-white text-xs font-black uppercase tracking-wider transition-colors cursor-pointer"
          >
            Écrire à la commission partenariats
            <MessageCircle className="w-4 h-4" />
          </button>
        </div>
      </Reveal>
    </section>
  );
};

/* ═══════════════════ Vue complète ═══════════════════ */

export const SponsoringView: React.FC = () => {
  const { loading, packages, partners, settings } = useSponsorContent();

  // Package présélectionné par les cartes ou le deep-link /sponsoring?pack=or
  const [selectedPack, setSelectedPack] = useState<string>(() => {
    if (typeof window === 'undefined') return 'or';
    const urlPack = new URLSearchParams(window.location.search).get('pack');
    return urlPack ?? 'or';
  });
  // true uniquement quand la préselection vient d'un bouton « Choisir » ou d'un deep-link
  const [preselectedFrom, setPreselectedFrom] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.location.search.includes('pack=');
  });

  // Une fois les packages chargés : valide le deep-link (slug ou « sur-mesure »)
  useEffect(() => {
    if (!packages.length) return;
    const valid = [...packages.map((p) => p.slug), CUSTOM_PACK_ID];
    setSelectedPack((current) => (valid.includes(current) ? current : 'or'));
  }, [packages]);

  /** Clic « Choisir ce package » : préremplit + amène au formulaire. */
  const handleChoosePack = (pack: string) => {
    setSelectedPack(pack);
    setPreselectedFrom(true);
    smoothScrollTo('sp-contact');
    window.setTimeout(() => {
      document.getElementById('spres-pack')?.focus({ preventScroll: true });
    }, 450);
  };

  // Écran de chargement léger (skeletons) pendant la lecture BDD
  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-72 bg-slate-200 rounded-none" />
        <div className="max-w-7xl mx-auto px-4 grid md:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-40 bg-slate-200 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  // Textes du hero — titre découpé après « partenaire »/de la FIMF si possible
  const heroTitleNode: React.ReactNode = settings.heroTitle;

  return (
    <div className="pb-4">
      <HeroSection
        badge={settings.heroBadge}
        title={heroTitleNode}
        subtitle={settings.heroSubtitle}
      />
      {/* Arguments & FAQ : repli sur les valeurs par défaut si la BDD est vide */}
      <WhySection
        argumentsList={settings.arguments.length > 0 ? settings.arguments : SPONSORING_ARGUMENTS}
      />
      <PackagesSection packages={packages} onChoose={handleChoosePack} />
      <ComparisonSection packages={packages} />
      <PartnersSection partners={partners} />
      <ContactSection
        settings={settings}
        packages={packages}
        selectedPack={selectedPack}
        preselectedFrom={preselectedFrom}
        onChangePackage={(pack) => {
          setPreselectedFrom(false);
          setSelectedPack(pack);
        }}
      />
      <FaqSection faq={settings.faq.length > 0 ? settings.faq : SPONSORING_FAQ} />
    </div>
  );
};
