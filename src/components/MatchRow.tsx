import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import type { Club, Match } from '@/src/data/fimfData';
import { ClubBadge } from './ClubBadge';
import { ANIM, EASE_SIGNATURE, REVEAL_AMOUNT, staggerDelay, useIsMobile } from '@/src/lib/anim';

export type MatchRowVariant = 'full' | 'compact';

interface MatchRowProps {
  match: Match;
  homeClub?: Club;
  awayClub?: Club;
  onSelectMatch: (match: Match) => void;
  onSelectClub?: (club: Club) => void;
  /** 'full' = grille 6 colonnes (calendrier, championnat). 'compact' = 1fr auto 1fr (sidebars, cartes étroites). */
  variant?: MatchRowVariant;
  /** Masque le bouton DÉTAILS (ex. quand la ligne entière est déjà cliquable ailleurs). */
  hideDetails?: boolean;
  /** Apparition au défilement (fondu + 24px, une seule fois). Mise en page inchangée. */
  reveal?: boolean;
  /** Position dans la journée / le groupe (cascade plafonnée à 6). */
  revealIndex?: number;
}

function TeamButton({
  club,
  fallbackName,
  side,
  onSelectClub,
}: {
  club?: Club;
  fallbackName: string;
  side: 'home' | 'away';
  onSelectClub?: (club: Club) => void;
}) {
  const name = club?.name ?? fallbackName;
  return (
    <button
      type="button"
      onClick={() => club && onSelectClub?.(club)}
      disabled={!club || !onSelectClub}
      title={name}
      aria-label={club ? `Voir le profil de ${name}` : name}
      className={
        side === 'home'
          ? 'fimf-match-row__team fimf-match-row__team--home group'
          : 'fimf-match-row__team fimf-match-row__team--away group'
      }
    >
      {side === 'home' ? (
        <>
          <span className="fimf-match-row__name" title={name}>
            {name}
          </span>
          <span className="fimf-match-row__logo" aria-hidden="true">
            <ClubBadge id={club?.id ?? 'unknown'} size="match" />
          </span>
        </>
      ) : (
        <>
          <span className="fimf-match-row__logo" aria-hidden="true">
            <ClubBadge id={club?.id ?? 'unknown'} size="match" />
          </span>
          <span className="fimf-match-row__name" title={name}>
            {name}
          </span>
        </>
      )}
    </button>
  );
}

function MatchCenter({ match }: { match: Match }) {
  const scoreKey = `${match.scoreHome ?? '-'}-${match.scoreAway ?? '-'}`;
  if (match.status === 'live') {
    return (
      <div className="fimf-match-row__center">
        {/* key = le score rejoue la pop à chaque changement (transform seul). */}
        <span key={scoreKey} className="fimf-match-row__score fimf-score-pop" aria-label={`Score en direct ${match.scoreHome ?? 0} à ${match.scoreAway ?? 0}`}>
          {match.scoreHome ?? 0} - {match.scoreAway ?? 0}
        </span>
        <span className="fimf-match-row__live">
          <span className="fimf-match-row__live-dot" aria-hidden="true" />
          EN DIRECT
        </span>
      </div>
    );
  }
  if (match.status === 'finished') {
    return (
      <div className="fimf-match-row__center">
        <span className="fimf-match-row__score" aria-label={`Score final ${match.scoreHome ?? 0} à ${match.scoreAway ?? 0}`}>
          {match.scoreHome ?? 0} - {match.scoreAway ?? 0}
        </span>
        <span className="fimf-match-row__ft">FT</span>
      </div>
    );
  }
  return (
    <div className="fimf-match-row__center">
      <span className="fimf-match-row__vs">VS</span>
    </div>
  );
}

/** Propriétés d'apparition partagées (fondu + translation, une seule fois). */
function useRowReveal(reveal: boolean, revealIndex: number) {
  const reduceMotion = useReducedMotion() ?? false;
  const isMobile = useIsMobile();
  if (!reveal) return undefined;
  const y = reduceMotion ? 0 : isMobile ? 14 : 24;
  return {
    initial: { opacity: 0, y },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: REVEAL_AMOUNT },
    transition: {
      duration: reduceMotion ? 0.3 : ANIM.reveal,
      ease: [...EASE_SIGNATURE],
      delay: staggerDelay(revealIndex, reduceMotion),
    },
  } as const;
}

/**
 * Ligne de match à grille stricte — composant réutilisable unique.
 *
 * Desktop (≥1024px) : 150px 1fr 90px 1fr 220px 100px.
 * Tablette (768–1023px) : le lieu passe sous la date.
 * Mobile (<768px) : 2 lignes (date+lieu / domicile | centre | visiteur) + DÉTAILS pleine largeur.
 */
export const MatchRow: React.FC<MatchRowProps> = ({
  match,
  homeClub,
  awayClub,
  onSelectMatch,
  onSelectClub,
  variant = 'full',
  hideDetails = false,
  reveal = false,
  revealIndex = 0,
}) => {
  const homeName = homeClub?.name ?? match.homeTeamId;
  const awayName = awayClub?.name ?? match.awayTeamId;
  const detailsLabel = `Détails du match ${homeName} contre ${awayName}`;
  const rowReveal = useRowReveal(reveal, revealIndex);

  if (variant === 'compact') {
    return (
      <motion.li className="fimf-match-row fimf-match-row--compact" {...rowReveal}>
        <div className="fimf-match-row__compact-meta">
          <span className="fimf-match-row__date">{match.dateStr}</span>
          <span className="fimf-match-row__time"> • {match.timeStr}</span>
          <span className="fimf-match-row__compact-venue"> • {match.venue}</span>
        </div>
        <div className="fimf-match-row__compact-main">
          <TeamButton club={homeClub} fallbackName={match.homeTeamId} side="home" onSelectClub={onSelectClub} />
          <MatchCenter match={match} />
          <TeamButton club={awayClub} fallbackName={match.awayTeamId} side="away" onSelectClub={onSelectClub} />
        </div>
        {!hideDetails && (
          <button
            type="button"
            onClick={() => onSelectMatch(match)}
            aria-label={detailsLabel}
            className="fimf-match-row__details fimf-match-row__details--compact group"
          >
            <span>Détails</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
          </button>
        )}
      </motion.li>
    );
  }

  return (
    <motion.li className="fimf-match-row" {...rowReveal}>
      <div className="fimf-match-row__datetime">
        <p className="fimf-match-row__date">{match.dateStr}</p>
        <p className="fimf-match-row__time">{match.timeStr}</p>
        <p className="fimf-match-row__venue-tablet" title={match.venue}>
          {match.venue}
        </p>
      </div>

      <TeamButton club={homeClub} fallbackName={match.homeTeamId} side="home" onSelectClub={onSelectClub} />

      <MatchCenter match={match} />

      <TeamButton club={awayClub} fallbackName={match.awayTeamId} side="away" onSelectClub={onSelectClub} />

      <div className="fimf-match-row__venue" title={match.venue}>
        {match.venue}
      </div>

      {!hideDetails && (
        <div className="fimf-match-row__actions">
          <button
            type="button"
            onClick={() => onSelectMatch(match)}
            aria-label={detailsLabel}
            className="fimf-match-row__details group"
          >
            <span>Détails</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
          </button>
        </div>
      )}
    </motion.li>
  );
};
