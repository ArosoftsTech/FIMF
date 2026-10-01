import React from 'react';
import { FimfNotification } from '@/src/hooks/useNotifications';
import { ClubBadge } from './ClubBadge';
import { Bell, Calendar, Trophy, ArrowRight, X } from 'lucide-react';
import { MATCHES_DATA, CLUBS_DATA, Match, Club } from '@/src/data/fimfData';

interface NotificationToastProps {
  notification: FimfNotification | null;
  onClose: () => void;
  onSelectMatch: (match: Match) => void;
  onSelectClub: (club: Club) => void;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({
  notification,
  onClose,
  onSelectMatch,
  onSelectClub,
}) => {
  if (!notification) return null;

  const isUpcoming = notification.type === 'upcoming_match';
  const club = CLUBS_DATA.find((c) => c.id === notification.clubId);

  return (
    <div className="fixed bottom-5 right-5 z-50 max-w-sm w-full bg-white rounded-xl shadow-2xl border-2 border-orange-500/80 p-4 animate-toast-in">
      <div className="flex items-start gap-3">
        <div className="relative shrink-0 mt-0.5">
          <ClubBadge id={notification.clubId} size="sm" />
          <span
            className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[9px] text-white shadow-xs ${
              isUpcoming ? 'bg-[#ea580c]' : 'bg-[#006039]'
            }`}
          >
            {isUpcoming ? <Calendar className="w-2.5 h-2.5" /> : <Trophy className="w-2.5 h-2.5" />}
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-[#ea580c] uppercase tracking-wider flex items-center gap-1">
              <Bell className="w-3 h-3 animate-pulse" />
              <span>Alerte Équipe Favorite</span>
            </span>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-700 p-0.5 rounded transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <h4 className="text-xs font-bold text-slate-900 mt-1 line-clamp-1">
            {notification.title}
          </h4>

          <p className="text-[11px] text-slate-600 line-clamp-2 mt-0.5 leading-snug">
            {notification.message}
          </p>

          <div className="mt-2.5 flex items-center gap-2">
            <button
              onClick={() => {
                if (notification.matchId) {
                  const match = MATCHES_DATA.find((m) => m.id === notification.matchId);
                  if (match) {
                    onSelectMatch(match);
                    onClose();
                    return;
                  }
                }
                if (club) {
                  onSelectClub(club);
                  onClose();
                }
              }}
              className="px-2.5 py-1 text-[11px] font-bold text-white bg-[#ea580c] hover:bg-[#c2410c] rounded-md transition-colors flex items-center gap-1 shadow-xs cursor-pointer uppercase"
            >
              <span>{isUpcoming ? 'Détails du match' : 'Voir le score'}</span>
              <ArrowRight className="w-3 h-3" />
            </button>
            <button
              onClick={onClose}
              className="px-2 py-1 text-[11px] font-semibold text-slate-500 hover:text-slate-700"
            >
              Ignorer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
