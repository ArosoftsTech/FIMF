import { useState, useEffect, useCallback, useMemo } from 'react';
import { MATCHES_DATA, CLUBS_DATA, Match } from '@/src/data/fimfData';

export interface FimfNotification {
  id: string;
  type: 'upcoming_match' | 'match_result' | 'club_alert';
  title: string;
  message: string;
  timestamp: string;
  timeAgo: string;
  read: boolean;
  clubId: string;
  matchId?: string;
  urgency?: 'high' | 'normal';
}

const READ_STORAGE_KEY = 'fimf_read_notifications';
const CUSTOM_NOTIFS_KEY = 'fimf_custom_notifications';

export function useNotifications(favoriteClubIds: string[]) {
  const [readIds, setReadIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(READ_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [toastNotification, setToastNotification] = useState<FimfNotification | null>(null);

  // Keep track of read notifications in localStorage
  useEffect(() => {
    try {
      localStorage.setItem(READ_STORAGE_KEY, JSON.stringify(readIds));
    } catch (e) {
      console.error('Error saving read notifications', e);
    }
  }, [readIds]);

  // Generate dynamic, realistic notifications based on user's favorite clubs
  const notifications: FimfNotification[] = useMemo(() => {
    const list: FimfNotification[] = [];

    // For every favorite club:
    favoriteClubIds.forEach((clubId) => {
      const club = CLUBS_DATA.find((c) => c.id === clubId);
      if (!club) return;

      // 1. Upcoming matches for this club
      const upcomingMatches = MATCHES_DATA.filter(
        (m) =>
          (m.homeTeamId === clubId || m.awayTeamId === clubId) &&
          m.status === 'scheduled'
      );

      upcomingMatches.forEach((match) => {
        const isHome = match.homeTeamId === clubId;
        const opponentId = isHome ? match.awayTeamId : match.homeTeamId;
        const opponent = CLUBS_DATA.find((c) => c.id === opponentId);

        const notifId = `upcoming-${match.id}-${clubId}`;
        list.push({
          id: notifId,
          type: 'upcoming_match',
          title: `Match imminent : ${club.shortName} vs ${opponent?.shortName || 'Adversaire'}`,
          message: `Le coup d'envoi de la Journée ${match.journee} aura lieu ce ${match.dateStr} à ${match.timeStr} au ${match.venue}. Préparez-vous à supporter les vôtres !`,
          timestamp: '2025-09-25T10:00:00Z',
          timeAgo: 'Dans 3 jours',
          read: readIds.includes(notifId),
          clubId: club.id,
          matchId: match.id,
          urgency: match.journee === 3 ? 'high' : 'normal',
        });
      });

      // 2. Published match results for this club
      const pastMatches = MATCHES_DATA.filter(
        (m) =>
          (m.homeTeamId === clubId || m.awayTeamId === clubId) &&
          m.status === 'finished'
      );

      pastMatches.forEach((match) => {
        const isHome = match.homeTeamId === clubId;
        const opponentId = isHome ? match.awayTeamId : match.homeTeamId;
        const opponent = CLUBS_DATA.find((c) => c.id === opponentId);
        const myScore = isHome ? match.scoreHome : match.scoreAway;
        const oppScore = isHome ? match.scoreAway : match.scoreHome;

        const isWin = (myScore ?? 0) > (oppScore ?? 0);
        const isDraw = (myScore ?? 0) === (oppScore ?? 0);
        const resultLabel = isWin ? 'Victoire éclatante !' : isDraw ? 'Match nul disputé' : 'Fin du match';

        const notifId = `result-${match.id}-${clubId}`;
        list.push({
          id: notifId,
          type: 'match_result',
          title: `Résultat publié : ${club.shortName} ${match.scoreHome} - ${match.scoreAway} ${opponent?.shortName}`,
          message: `${resultLabel} lors de la Journée ${match.journee}. Consultez le rapport officiel, les buteurs et l'impact sur le classement général.`,
          timestamp: '2025-09-22T19:00:00Z',
          timeAgo: 'Il y a 3 jours',
          read: readIds.includes(notifId),
          clubId: club.id,
          matchId: match.id,
        });
      });
    });

    // Sort by unread first, then upcoming vs result
    return list.sort((a, b) => {
      if (a.read === b.read) return 0;
      return a.read ? 1 : -1;
    });
  }, [favoriteClubIds, readIds]);

  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !n.read).length;
  }, [notifications]);

  const markAsRead = useCallback((notificationId: string) => {
    setReadIds((prev) => (prev.includes(notificationId) ? prev : [...prev, notificationId]));
  }, []);

  const markAllAsRead = useCallback(() => {
    const allIds = notifications.map((n) => n.id);
    setReadIds((prev) => Array.from(new Set([...prev, ...allIds])));
  }, [notifications]);

  const clearAllNotifications = useCallback(() => {
    const allIds = notifications.map((n) => n.id);
    setReadIds(allIds);
  }, [notifications]);

  // Simulate a live popup notification if there's an unread upcoming match
  useEffect(() => {
    if (favoriteClubIds.length > 0) {
      const urgentUnread = notifications.find((n) => !n.read && n.urgency === 'high');
      if (urgentUnread) {
        // Show gentle toast once
        const timer = setTimeout(() => {
          setToastNotification(urgentUnread);
        }, 1500);
        return () => clearTimeout(timer);
      }
    }
  }, [favoriteClubIds, notifications]);

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearAllNotifications,
    toastNotification,
    dismissToast: () => setToastNotification(null),
  };
}
