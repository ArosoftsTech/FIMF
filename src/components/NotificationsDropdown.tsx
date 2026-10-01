import React, { useRef, useEffect } from 'react';
import { FimfNotification } from '@/src/hooks/useNotifications';
import { ClubBadge } from './ClubBadge';
import { Bell, CheckCheck, Clock, Calendar, Trophy, ChevronRight, X, Sparkles } from 'lucide-react';
import { MATCHES_DATA, CLUBS_DATA, Match, Club } from '@/src/data/fimfData';

interface NotificationsDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: FimfNotification[];
  unreadCount: number;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onSelectMatch: (match: Match) => void;
  onSelectClub: (club: Club) => void;
}

export const NotificationsDropdown: React.FC<NotificationsDropdownProps> = ({
  isOpen,
  onClose,
  notifications,
  unreadCount,
  onMarkAsRead,
  onMarkAllAsRead,
  onSelectMatch,
  onSelectClub,
}) => {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        onClose();
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={panelRef}
      className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-2xl border border-slate-200 z-50 overflow-hidden animate-dropdown-in"
    >
      {/* Header */}
      <div className="bg-[#004724] px-4 py-3.5 text-white flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Bell className="w-4 h-4 text-[#ea580c]" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[#ea580c] ring-2 ring-[#004724]" />
            )}
          </div>
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider">Alertes & Matchs</h3>
            <p className="text-[10px] text-emerald-200">
              {unreadCount > 0
                ? `${unreadCount} nouvelle(s) notification(s)`
                : 'Toutes les alertes sont à jour'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={onMarkAllAsRead}
              className="text-[10px] font-bold text-emerald-100 hover:text-white bg-emerald-800/60 hover:bg-emerald-800 px-2 py-1 rounded transition-colors flex items-center gap-1 cursor-pointer"
              title="Tout marquer comme lu"
            >
              <CheckCheck className="w-3 h-3" />
              <span>Tout lire</span>
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1 rounded text-emerald-100 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* List content */}
      <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100">
        {notifications.length === 0 ? (
          <div className="p-8 text-center space-y-2">
            <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Bell className="w-5 h-5" />
            </div>
            <p className="text-xs font-bold text-slate-700">Aucune alerte pour l'instant</p>
            <p className="text-[11px] text-slate-500">
              Ajoutez des clubs à vos favoris pour recevoir les alertes de matchs et les résultats en direct.
            </p>
          </div>
        ) : (
          notifications.map((item) => {
            const isUpcoming = item.type === 'upcoming_match';
            const club = CLUBS_DATA.find((c) => c.id === item.clubId);

            return (
              <div
                key={item.id}
                onClick={() => {
                  onMarkAsRead(item.id);
                  if (item.matchId) {
                    const match = MATCHES_DATA.find((m) => m.id === item.matchId);
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
                className={`p-3.5 transition-colors cursor-pointer group flex items-start gap-3 ${
                  item.read ? 'bg-white hover:bg-slate-50' : 'bg-orange-50/60 hover:bg-orange-50/90'
                }`}
              >
                {/* Badge icon */}
                <div className="relative shrink-0 mt-0.5">
                  <ClubBadge id={item.clubId} size="xs" />
                  <span
                    className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] text-white shadow-xs ${
                      isUpcoming ? 'bg-[#ea580c]' : 'bg-[#006039]'
                    }`}
                  >
                    {isUpcoming ? (
                      <Calendar className="w-2 h-2" />
                    ) : (
                      <Trophy className="w-2 h-2" />
                    )}
                  </span>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <span
                      className={`text-[9.5px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded ${
                        isUpcoming
                          ? 'bg-orange-100 text-orange-900'
                          : 'bg-emerald-100 text-emerald-900'
                      }`}
                    >
                      {isUpcoming ? 'Prochain match' : 'Résultat officiel'}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {item.timeAgo}
                    </span>
                  </div>

                  <h4 className="text-xs font-bold text-slate-900 group-hover:text-[#006039] transition-colors leading-snug">
                    {item.title}
                  </h4>

                  <p className="text-[11px] text-slate-600 line-clamp-2 mt-1 leading-relaxed">
                    {item.message}
                  </p>

                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-[10px] font-bold text-[#ea580c] group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                      <span>{isUpcoming ? 'Voir le match' : 'Consulter le score'}</span>
                      <ChevronRight className="w-3 h-3" />
                    </span>
                    {!item.read && (
                      <span className="w-2 h-2 rounded-full bg-[#ea580c]" />
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="p-2.5 bg-slate-50 border-t border-slate-200 text-center text-[10px] text-slate-500 flex items-center justify-center gap-1.5">
        <Sparkles className="w-3 h-3 text-[#ea580c]" />
        <span>Synchronisé avec vos clubs favoris</span>
      </div>
    </div>
  );
};
