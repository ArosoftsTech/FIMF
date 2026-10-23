import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  fetchSponsorPackages,
  fetchSponsorPartners,
  fetchSponsorClients,
  fetchSponsorRequests,
  fetchSponsoringSettings,
  upsertSponsorPackage,
  deleteSponsorPackage,
  reorderSponsorPackages,
  upsertSponsorPartner,
  deleteSponsorPartner,
  updateSponsorRequestStatus,
  assignSponsorRequest,
  addSponsorRequestNote,
  deleteSponsorRequest,
  convertRequestToSponsor,
  upsertSponsorClient,
  deleteSponsorClient,
  mirrorSponsorToPartners,
  updateSponsoringSettings,
  type SponsorPackage,
  type SponsorPartner,
  type SponsorRequest,
  type SponsorClient,
  type SponsoringSettings,
  type SponsorRequestStatus,
} from '../lib/sponsoringApi';

/**
 * ─────────────────────────────────────────────────────────────
 * useSponsorAdmin — état du module admin « Sponsoring ».
 *
 * Charge en une passe packages / partenaires / demandes /
 * sponsors contractés / paramètres, puis expose des actions
 * (sauvegarde, suppression, changement de statut…) qui mettent
 * à jour l'état local et/ou déclenchent un rechargement ciblé.
 * Chaque action lève une exception en cas d'échec : les écrans
 * l'interceptent et affichent un message via `showFeedback`.
 * ─────────────────────────────────────────────────────────────
 */

export interface SponsorAdminState {
  loading: boolean;
  /** Erreur globale partielle (certaines tables peuvent ne pas exister encore). */
  error: string | null;
  packages: SponsorPackage[];
  partners: SponsorPartner[];
  requests: SponsorRequest[];
  clients: SponsorClient[];
  settings: SponsoringSettings | null;
}

interface SponsorAdminActions {
  reload: () => Promise<void>;
  // Packages
  savePackage: (p: SponsorPackage) => Promise<void>;
  removePackage: (id: string) => Promise<void>;
  commitReorder: (orderedIds: string[]) => Promise<void>;
  // Partenaires (vitrine)
  savePartner: (p: SponsorPartner) => Promise<void>;
  removePartner: (id: string) => Promise<void>;
  // Demandes
  changeRequestStatus: (id: number, status: SponsorRequestStatus) => Promise<void>;
  assignRequest: (id: number, userId: string | null) => Promise<void>;
  noteRequest: (id: number, note: string) => Promise<void>;
  removeRequest: (id: number) => Promise<void>;
  promoteRequest: (
    request: SponsorRequest,
    options: { packageId: string | null; amount: number },
  ) => Promise<string>;
  // Sponsors contractés
  saveClient: (c: SponsorClient, syncMirror: boolean) => Promise<void>;
  removeClient: (id: string) => Promise<void>;
  // Paramètres
  saveSettings: (s: SponsoringSettings) => Promise<void>;
  // Tables dérivées
  packageNames: Record<string, string>;
  packageById: (id: string | null) => SponsorPackage | undefined;
}

export type SponsorAdmin = SponsorAdminState & SponsorAdminActions;

export function useSponsorAdmin(): SponsorAdmin {
  const [state, setState] = useState<SponsorAdminState>({
    loading: true,
    error: null,
    packages: [],
    partners: [],
    requests: [],
    clients: [],
    settings: null,
  });

  const load = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    // allSettled : une table absente ne doit pas effacer les autres données
    const [pk, pt, rq, cl, st] = await Promise.allSettled([
      fetchSponsorPackages(),
      fetchSponsorPartners(),
      fetchSponsorRequests(),
      fetchSponsorClients(),
      fetchSponsoringSettings(),
    ]);
    const error =
      pk.status === 'rejected' && pt.status === 'rejected' && rq.status === 'rejected'
        ? 'Tables du module introuvables ? Vérifiez que migrate-sponsoring-module.sql a été exécuté (SQL Editor).'
        : null;
    setState({
      loading: false,
      error,
      packages: pk.status === 'fulfilled' ? pk.value : [],
      partners: pt.status === 'fulfilled' ? pt.value : [],
      requests: rq.status === 'fulfilled' ? rq.value : [],
      clients: cl.status === 'fulfilled' ? cl.value : [],
      settings: st.status === 'fulfilled' ? st.value : null,
    });
  }, []);

  useEffect(() => {
    load().catch(() => undefined);
  }, [load]);

  /* ── Actions : mutations + mise à jour du state local ─────────────── */

  const savePackage = useCallback(async (p: SponsorPackage) => {
    await upsertSponsorPackage(p);
    setState((s) => {
      const next = [...s.packages];
      const idx = next.findIndex((x) => x.id === p.id);
      if (idx >= 0) next[idx] = p;
      else next.push(p);
      next.sort((a, b) => a.sortOrder - b.sortOrder);
      return { ...s, packages: next };
    });
  }, []);

  const removePackage = useCallback(async (id: string) => {
    await deleteSponsorPackage(id);
    setState((s) => ({ ...s, packages: s.packages.filter((p) => p.id !== id) }));
  }, []);

  /** Réordonnancement : la séquence d'ID passe en sort_order 1..n. */
  const commitReorder = useCallback(async (orderedIds: string[]) => {
    setState((s) => {
      const pos = new Map(orderedIds.map((id, i) => [id, i + 1]));
      return { ...s, packages: s.packages.map((p) => ({ ...p, sortOrder: pos.get(p.id) ?? p.sortOrder })) };
    });
    await reorderSponsorPackages(orderedIds.map((id, i) => ({ id, sortOrder: i + 1 })));
    // Recharge pour garantir la cohérence même si une écriture a échoué
    const fresh = await fetchSponsorPackages().catch(() => null);
    if (fresh) setState((s) => ({ ...s, packages: fresh }));
  }, []);

  const savePartner = useCallback(async (p: SponsorPartner) => {
    await upsertSponsorPartner(p);
    setState((s) => {
      const next = [...s.partners];
      const idx = next.findIndex((x) => x.id === p.id);
      if (idx >= 0) next[idx] = p;
      else next.push(p);
      next.sort((a, b) => a.displayOrder - b.displayOrder);
      return { ...s, partners: next };
    });
  }, []);

  const removePartner = useCallback(async (id: string) => {
    await deleteSponsorPartner(id);
    setState((s) => ({ ...s, partners: s.partners.filter((p) => p.id !== id) }));
  }, []);

  const changeRequestStatus = useCallback(async (id: number, status: SponsorRequestStatus) => {
    // `from` : statut courant lu dans l'état (pour l'historique d'événements)
    let from: SponsorRequestStatus = 'nouvelle';
    setState((s) => {
      const r = s.requests.find((x) => x.id === id);
      if (r) from = r.status;
      return { ...s, requests: s.requests.map((x) => (x.id === id ? { ...x, status, lastActivityAt: new Date().toISOString() } : x)) };
    });
    await updateSponsorRequestStatus(id, status, from);
  }, []);

  const assignRequest = useCallback(async (id: number, userId: string | null) => {
    setState((s) => ({ ...s, requests: s.requests.map((x) => (x.id === id ? { ...x, assignedTo: userId } : x)) }));
    await assignSponsorRequest(id, userId);
  }, []);

  const noteRequest = useCallback(async (id: number, note: string) => {
    await addSponsorRequestNote(id, note);
    setState((s) => ({
      ...s,
      requests: s.requests.map((x) => (x.id === id ? { ...x, lastActivityAt: new Date().toISOString() } : x)),
    }));
  }, []);

  const removeRequest = useCallback(async (id: number) => {
    await deleteSponsorRequest(id);
    setState((s) => ({ ...s, requests: s.requests.filter((r) => r.id !== id) }));
  }, []);

  const promoteRequest = useCallback(
    async (request: SponsorRequest, options: { packageId: string | null; amount: number }) => {
      const clientId = await convertRequestToSponsor(request, options);
      setState((s) => ({
        ...s,
        requests: s.requests.map((x) => (x.id === request.id ? { ...x, status: 'acceptée' } : x)),
      }));
      const freshClients = await fetchSponsorClients().catch(() => null);
      if (freshClients) setState((s) => ({ ...s, clients: freshClients }));
      return clientId;
    },
    [],
  );

  const saveClient = useCallback(async (c: SponsorClient, syncMirror: boolean) => {
    await upsertSponsorClient(c);
    if (syncMirror) await mirrorSponsorToPartners({ name: c.name, logoUrl: c.logoUrl }, c.publicVisible);
    const freshClients = await fetchSponsorClients().catch(() => null);
    setState((s) => ({
      ...s,
      clients: freshClients ?? s.clients.map((x) => (x.id === c.id ? c : x)),
    }));
  }, []);

  const removeClient = useCallback(async (id: string) => {
    await deleteSponsorClient(id);
    setState((s) => ({ ...s, clients: s.clients.filter((c) => c.id !== id) }));
  }, []);

  const saveSettings = useCallback(async (s2: SponsoringSettings) => {
    await updateSponsoringSettings(s2);
    setState((s) => ({ ...s, settings: s2 }));
  }, []);

  /* ── Tables de correspondance dérivées (pour les libellés) ─────────── */

  const packageNames = useMemo(() => {
    const map: Record<string, string> = {};
    for (const p of state.packages) map[p.slug] = p.name;
    map['autre'] = 'Sur devis / sur-mesure';
    return map;
  }, [state.packages]);

  const packageById = useCallback(
    (id: string | null) => (id ? state.packages.find((p) => p.id === id) : undefined),
    [state.packages],
  );

  return {
    ...state,
    packageNames,
    packageById,
    reload: load,
    savePackage,
    removePackage,
    commitReorder,
    savePartner,
    removePartner,
    changeRequestStatus,
    assignRequest,
    noteRequest,
    removeRequest,
    promoteRequest,
    saveClient,
    removeClient,
    saveSettings,
  };
}
