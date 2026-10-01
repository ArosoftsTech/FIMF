import { useState, useEffect, useCallback, useRef } from 'react';
import { CLUBS_DATA, Club } from '@/src/data/fimfData';
import { supabase } from '../lib/supabaseClient';
import { fetchFavoriteClubIds, addFavoriteClubRow, removeFavoriteClubRow } from '../lib/fimfApi';

const STORAGE_KEY = 'fimf_favorite_clubs';
const CHANNEL_NAME = 'fimf-favorites';
const DEFAULT_FAVORITES = ['as-plateau', 'fc-riviera']; // sensible initial favorites for rich first experience

/** Favoris invités stockés localement (null si absents/corrompus). */
function readLocalFavorites(): string[] | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        return parsed.filter((x): x is string => typeof x === 'string');
      }
    }
  } catch {
    // ignore JSON parse error
  }
  return null;
}

function writeLocalFavorites(ids: string[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch (err) {
    console.error('Failed to save favorites to localStorage:', err);
  }
}

/**
 * Clubs favoris du visiteur.
 * - Invité : localStorage (comportement historique, défauts inclus).
 * - Membre connecté : table Supabase `member_favorite_clubs` (RLS = ses lignes).
 *   Les favoris invités sont importés dans le compte à la connexion, puis le
 *   localStorage repasse en simple scratch (jamais écrit en mode connecté, pour
 *   éviter les fuites entre comptes sur un ordinateur partagé).
 * - Sync multi-onglets via BroadcastChannel (diffusée lors des actions).
 */
export function useFavoriteClubs() {
  const [favoriteIds, setFavoriteIds] = useState<string[]>(
    () => readLocalFavorites() ?? DEFAULT_FAVORITES
  );
  const channelRef = useRef<BroadcastChannel | null>(null);
  const signedInRef = useRef(false);

  // Miroir localStorage en mode invité uniquement. On ne grave pas les
  // favoris par défaut tant que le visiteur ne les a pas modifiés : évite
  // de ré-importer ces défauts dans le compte au prochain login.
  useEffect(() => {
    if (signedInRef.current) return;
    let hasStored = true;
    try {
      hasStored = localStorage.getItem(STORAGE_KEY) !== null;
    } catch {
      hasStored = true;
    }
    const isDefault =
      favoriteIds.length === DEFAULT_FAVORITES.length &&
      DEFAULT_FAVORITES.every((id) => favoriteIds.includes(id));
    if (!hasStored && isDefault) return;
    writeLocalFavorites(favoriteIds);
  }, [favoriteIds]);

  // Sync multi-onglets
  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') return;
    const channel = new BroadcastChannel(CHANNEL_NAME);
    channel.onmessage = (e: MessageEvent) => {
      const ids = e.data as unknown;
      if (!Array.isArray(ids)) return;
      setFavoriteIds((prev) =>
        prev.length === ids.length && prev.every((v, i) => v === ids[i])
          ? prev
          : (ids as string[])
      );
    };
    channelRef.current = channel;
    return () => {
      channel.close();
      channelRef.current = null;
    };
  }, []);

  // Persistance base de données (silencieuse : un échec ne casse pas l'UI)
  const persistFavorite = useCallback(async (clubId: string, add: boolean) => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) return; // invité : localStorage suffit
      if (add) {
        await addFavoriteClubRow(clubId);
      } else {
        await removeFavoriteClubRow(clubId);
      }
    } catch (err) {
      console.error('Sauvegarde du favori impossible :', err);
    }
  }, []);

  // Chargement au login / à la restauration de session
  useEffect(() => {
    let cancelled = false;

    const loadFromDb = async (mergeLocal: boolean) => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user || cancelled) return;
      signedInRef.current = true;
      try {
        if (mergeLocal) {
          // Importe les favoris invités (ids connus uniquement), dans l'ordre local
          const local = (readLocalFavorites() ?? []).filter((id) =>
            CLUBS_DATA.some((c) => c.id === id)
          );
          for (const id of local) {
            await addFavoriteClubRow(id).catch(() => undefined); // doublons ignorés
          }
          if (local.length > 0) {
            try {
              localStorage.removeItem(STORAGE_KEY);
            } catch {
              // ignore
            }
          }
        }
        const ids = await fetchFavoriteClubIds();
        if (!cancelled) setFavoriteIds(ids);
      } catch (err) {
        console.error('Chargement des favoris impossible :', err);
      }
    };

    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        loadFromDb(true);
      } else if (event === 'SIGNED_OUT') {
        signedInRef.current = false;
        setFavoriteIds(DEFAULT_FAVORITES);
      }
    });

    // Session restaurée au chargement de la page (reload)
    loadFromDb(true);

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  const isFavorite = useCallback(
    (clubId: string) => favoriteIds.includes(clubId),
    [favoriteIds]
  );

  const toggleFavorite = useCallback(
    (clubId: string) => {
      setFavoriteIds((prev) => {
        const has = prev.includes(clubId);
        const next = has ? prev.filter((id) => id !== clubId) : [...prev, clubId];
        void persistFavorite(clubId, !has);
        channelRef.current?.postMessage(next);
        return next;
      });
    },
    [persistFavorite]
  );

  const addFavorite = useCallback(
    (clubId: string) => {
      setFavoriteIds((prev) => {
        if (prev.includes(clubId)) return prev;
        const next = [...prev, clubId];
        void persistFavorite(clubId, true);
        channelRef.current?.postMessage(next);
        return next;
      });
    },
    [persistFavorite]
  );

  const removeFavorite = useCallback(
    (clubId: string) => {
      setFavoriteIds((prev) => {
        if (!prev.includes(clubId)) return prev;
        const next = prev.filter((id) => id !== clubId);
        void persistFavorite(clubId, false);
        channelRef.current?.postMessage(next);
        return next;
      });
    },
    [persistFavorite]
  );

  const favoriteClubs: Club[] = favoriteIds
    .map((id) => CLUBS_DATA.find((c) => c.id === id))
    .filter((c): c is Club => Boolean(c));

  return {
    favoriteIds,
    favoriteClubs,
    isFavorite,
    toggleFavorite,
    addFavorite,
    removeFavorite,
  };
}
