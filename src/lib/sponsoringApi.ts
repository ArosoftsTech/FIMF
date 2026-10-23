import { supabase } from './supabaseClient';
import { uploadMedia, mediaUrl, mediaRef } from './fimfApi';

/**
 * ─────────────────────────────────────────────────────────────
 * API SPONSORING FIMF — couche d'accès aux données du module
 * sponsoring (packages, partenaires, demandes, sponsors
 * contractés, paramètres). Utilisée par l'admin ET par la page
 * publique /sponsoring (lectures anonymes autorisées par RLS).
 * ─────────────────────────────────────────────────────────────
 */

/* ════════════════════════════════ Types ════════════════════════════════ */

export type TrophyKind = 'bronze' | 'argent' | 'or' | 'diamant' | 'custom';

/** Statuts de suivi d'une demande de partenariat. */
export type SponsorRequestStatus =
  | 'nouvelle'
  | 'en cours'          // valeur historique
  | 'contactée'
  | 'en négociation'
  | 'acceptée'
  | 'signée'            // valeur historique (≈ acceptée)
  | 'refusée'
  | 'archivée';

export const SPONSOR_REQUEST_STATUSES: { value: SponsorRequestStatus; label: string; color: string }[] = [
  { value: 'nouvelle', label: 'Nouvelle', color: 'bg-orange-50 text-[#ea580c] border-orange-200' },
  { value: 'contactée', label: 'Contactée', color: 'bg-sky-50 text-sky-700 border-sky-200' },
  { value: 'en négociation', label: 'En négociation', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  { value: 'acceptée', label: 'Acceptée', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { value: 'signée', label: 'Signée (historique)', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { value: 'en cours', label: 'En cours (historique)', color: 'bg-slate-50 text-slate-600 border-slate-200' },
  { value: 'refusée', label: 'Refusée', color: 'bg-rose-50 text-rose-700 border-rose-200' },
  { value: 'archivée', label: 'Archivée', color: 'bg-slate-100 text-slate-500 border-slate-200' },
];

export interface SponsorPackage {
  id: string;
  slug: string;
  name: string;
  trophyKind: TrophyKind;
  customImageUrl: string | null;
  tagline: string;
  /** Montant brut (null si « sur devis »). */
  priceAmount: number | null;
  currency: string;
  isOnDemand: boolean;
  duration: string;
  perks: string[];
  badge: string | null;
  isPopular: boolean;
  maxSponsors: number | null;
  active: boolean;
  sortOrder: number;
}

export interface SponsorPartner {
  id: string;
  name: string;
  logoUrl: string | null;
  category: string;
  displayOrder: number;
  visible: boolean;
}

export interface SponsorRequest {
  id: number;
  createdAt: string;
  company: string;
  contactName: string;
  email: string;
  phone: string | null;
  pack: string;
  message: string | null;
  status: SponsorRequestStatus;
  assignedTo: string | null;
  lastActivityAt: string;
}

export type SponsorEventKind = 'creation' | 'statut' | 'assignation' | 'note' | 'conversion';

export interface SponsorRequestEvent {
  id: number;
  requestId: number;
  kind: SponsorEventKind;
  payload: { from?: string; to?: string; note?: string };
  authorEmail: string;
  createdAt: string;
}

export type PaymentStatus = 'attente' | 'partiel' | 'paye';

export interface SponsorClient {
  id: string;
  name: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  packageId: string | null;
  logoUrl: string | null;
  startDate: string | null;
  endDate: string | null;
  amount: number;
  currency: string;
  amountPaid: number;
  paymentStatus: PaymentStatus;
  publicVisible: boolean;
  displayOrder: number;
  notes: string;
}

export type SponsorDocKind = 'contrat' | 'facture' | 'recu' | 'autre';

export interface SponsorClientDoc {
  id: string;
  clientId: string;
  kind: SponsorDocKind;
  name: string;
  url: string;
  uploadedAt: string;
}

export interface SponsoringArgument { icon: string; title: string; text: string }
export interface SponsoringFaq { q: string; a: string }

export interface SponsoringSettings {
  heroBadge: string;
  heroTitle: string;
  heroSubtitle: string;
  arguments: SponsoringArgument[];
  faq: SponsoringFaq[];
  contactEmail: string;
  contactPhone: string;
  contactWhatsapp: string;
  contactAddress: string;
  contactHours: string;
  notifyEmail: string;
  pageEnabled: boolean;
  formEnabled: boolean;
}

type Row = Record<string, any>;

/* ═══════════════════════════ Transforms & helpers ══════════════════════ */

function rowToPackage(r: Row): SponsorPackage {
  return {
    id: r.id as string,
    slug: r.slug as string,
    name: r.name as string,
    trophyKind: (r.trophy_kind ?? 'or') as TrophyKind,
    customImageUrl: (r.custom_image_url as string) ? mediaUrl(r.custom_image_url as string) : null,
    tagline: r.tagline ?? '',
    priceAmount: r.price_amount === null || r.price_amount === undefined ? null : Number(r.price_amount),
    currency: r.currency ?? 'FCFA',
    isOnDemand: Boolean(r.is_on_demand),
    duration: r.duration ?? '',
    perks: Array.isArray(r.perks) ? (r.perks as unknown[]).map(String) : [],
    badge: (r.badge as string) ?? null,
    isPopular: Boolean(r.is_popular),
    maxSponsors: r.max_sponsors === null || r.max_sponsors === undefined ? null : Number(r.max_sponsors),
    active: Boolean(r.active),
    sortOrder: Number(r.sort_order ?? 0),
  };
}

function packageToRow(p: SponsorPackage): Row {
  return {
    id: p.id,
    slug: p.slug.trim().toLowerCase().replace(/\s+/g, '-'),
    name: p.name.trim(),
    trophy_kind: p.trophyKind,
    custom_image_url: mediaRef(p.customImageUrl),
    tagline: p.tagline,
    price_amount: p.isOnDemand ? null : p.priceAmount,
    // Contrainte SQL « soit montant, soit sur devis » : un montant vide
    // bascule automatiquement le package en « Sur devis ».
    is_on_demand: p.isOnDemand || p.priceAmount === null || p.priceAmount === 0,
    currency: p.currency || 'FCFA',
    duration: p.duration,
    perks: p.perks.map((s) => s.trim()).filter(Boolean),
    badge: p.badge?.trim() || null,
    is_popular: p.isPopular,
    max_sponsors: p.maxSponsors,
    active: p.active,
    sort_order: p.sortOrder,
  };
}

function rowToPartner(r: Row): SponsorPartner {
  return {
    id: r.id as string,
    name: r.name as string,
    logoUrl: (r.logo_url as string) ? mediaUrl(r.logo_url as string) : null,
    category: r.category ?? '',
    displayOrder: Number(r.display_order ?? 0),
    visible: Boolean(r.visible ?? true),
  };
}

function clientToRow(c: SponsorClient): Row {
  return {
    id: c.id,
    name: c.name.trim(),
    contact_name: c.contactName,
    contact_email: c.contactEmail,
    contact_phone: c.contactPhone,
    package_id: c.packageId,
    logo_url: mediaRef(c.logoUrl),
    start_date: c.startDate,
    end_date: c.endDate,
    amount: c.amount,
    currency: c.currency || 'FCFA',
    amount_paid: c.amountPaid,
    payment_status: c.paymentStatus,
    public_visible: c.publicVisible,
    display_order: c.displayOrder,
    notes: c.notes,
  };
}

function rowToClient(r: Row): SponsorClient {
  return {
    id: r.id as string,
    name: r.name as string,
    contactName: r.contact_name ?? '',
    contactEmail: r.contact_email ?? '',
    contactPhone: r.contact_phone ?? '',
    packageId: (r.package_id as string) ?? null,
    logoUrl: (r.logo_url as string) ? mediaUrl(r.logo_url as string) : null,
    startDate: (r.start_date as string) ?? null,
    endDate: (r.end_date as string) ?? null,
    amount: Number(r.amount ?? 0),
    currency: r.currency ?? 'FCFA',
    amountPaid: Number(r.amount_paid ?? 0),
    paymentStatus: (r.payment_status ?? 'attente') as PaymentStatus,
    publicVisible: Boolean(r.public_visible),
    displayOrder: Number(r.display_order ?? 0),
    notes: r.notes ?? '',
  };
}

function rowToRequest(r: Row): SponsorRequest {
  return {
    id: r.id as number,
    createdAt: r.created_at as string,
    company: r.company as string,
    contactName: r.contact_name as string,
    email: r.email as string,
    phone: (r.phone as string) ?? null,
    pack: r.pack as string,
    message: (r.message as string) ?? null,
    status: (r.status ?? 'nouvelle') as SponsorRequestStatus,
    assignedTo: (r.assigned_to as string) ?? null,
    lastActivityAt: (r.last_activity_at as string) ?? (r.created_at as string),
  };
}

function rowToEvent(r: Row): SponsorRequestEvent {
  return {
    id: r.id as number,
    requestId: r.request_id as number,
    kind: (r.kind ?? 'note') as SponsorEventKind,
    payload: (r.payload ?? {}) as SponsorRequestEvent['payload'],
    authorEmail: r.author_email ?? '',
    createdAt: r.created_at as string,
  };
}

function rowToSetting(r: Row): SponsoringSettings {
  return {
    heroBadge: r.hero_badge ?? '',
    heroTitle: r.hero_title ?? '',
    heroSubtitle: r.hero_subtitle ?? '',
    arguments: Array.isArray(r.arguments) ? (r.arguments as SponsoringArgument[]) : [],
    faq: Array.isArray(r.faq) ? (r.faq as SponsoringFaq[]) : [],
    contactEmail: r.contact_email ?? '',
    contactPhone: r.contact_phone ?? '',
    contactWhatsapp: r.contact_whatsapp ?? '',
    contactAddress: r.contact_address ?? '',
    contactHours: r.contact_hours ?? '',
    notifyEmail: r.notify_email ?? '',
    pageEnabled: Boolean(r.page_enabled ?? true),
    formEnabled: Boolean(r.form_enabled ?? true),
  };
}

function settingsToRow(s: SponsoringSettings): Row {
  return {
    id: 1,
    hero_badge: s.heroBadge,
    hero_title: s.heroTitle,
    hero_subtitle: s.heroSubtitle,
    arguments: s.arguments.map((a) => ({ icon: a.icon, title: a.title, text: a.text })),
    faq: s.faq.map((f) => ({ q: f.q, a: f.a })),
    contact_email: s.contactEmail,
    contact_phone: s.contactPhone,
    contact_whatsapp: s.contactWhatsapp,
    contact_address: s.contactAddress,
    contact_hours: s.contactHours,
    notify_email: s.notifyEmail,
    page_enabled: s.pageEnabled,
    form_enabled: s.formEnabled,
  };
}

/** Email de l'utilisateur connecté (auteur des actions admin). */
export async function currentAuthorEmail(): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.email ?? 'inconnu';
}

/* ═════════════════════════════ Contenu public ═══════════════════════════ */

export interface PublicSponsorContent {
  packages: SponsorPackage[];
  partners: SponsorPartner[];
  settings: SponsoringSettings | null;
}

/**
 * Lectures anonymes pour la page /sponsoring : packages actifs, partenaires
 * visibles, paramètres (null si la ligne n'existe pas encore).
 */
export async function fetchPublicSponsorContent(): Promise<PublicSponsorContent> {
  const [packagesRes, partnersRes, settingsRes] = await Promise.all([
    supabase.from('sponsor_packages').select('*').eq('active', true).order('sort_order'),
    supabase.from('sponsor_partners').select('*').eq('visible', true).order('display_order'),
    supabase.from('sponsor_settings').select('*').eq('id', 1).maybeSingle(),
  ]);
  if (packagesRes.error) throw packagesRes.error;
  if (partnersRes.error) throw partnersRes.error;
  if (settingsRes.error) throw settingsRes.error;
  return {
    packages: (packagesRes.data ?? []).map(rowToPackage),
    partners: (partnersRes.data ?? []).map(rowToPartner),
    settings: settingsRes.data ? rowToSetting(settingsRes.data) : null,
  };
}

/* ═════════════════════════════ Packages (admin) ═════════════════════════ */

export async function fetchSponsorPackages(): Promise<SponsorPackage[]> {
  const { data, error } = await supabase
    .from('sponsor_packages')
    .select('*')
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return (data ?? []).map(rowToPackage);
}

export async function upsertSponsorPackage(p: SponsorPackage): Promise<void> {
  const { error } = await supabase.from('sponsor_packages').upsert(packageToRow(p));
  if (error) throw error;
}

/**
 * Réordonnancement : séquence complète de slugs→sort_order en une passe.
 */
export async function reorderSponsorPackages(ordered: { id: string; sortOrder: number }[]): Promise<void> {
  for (const { id, sortOrder } of ordered) {
    const { error } = await supabase
      .from('sponsor_packages')
      .update({ sort_order: sortOrder })
      .eq('id', id);
    if (error) throw error;
  }
}

/** Nombre de sponsors rattachés au package (protection avant suppression). */
export async function countClientsForPackage(packageId: string): Promise<number> {
  const { count, error } = await supabase
    .from('sponsor_clients')
    .select('id', { count: 'exact', head: true })
    .eq('package_id', packageId);
  if (error) throw error;
  return count ?? 0;
}

export async function deleteSponsorPackage(id: string): Promise<void> {
  const { error } = await supabase.from('sponsor_packages').delete().eq('id', id);
  if (error) throw error;
}

/* ═════════════════════════════ Partenaires (admin) ══════════════════════ */

export async function fetchSponsorPartners(): Promise<SponsorPartner[]> {
  const { data, error } = await supabase
    .from('sponsor_partners')
    .select('*')
    .order('display_order', { ascending: true });
  if (error) throw error;
  return (data ?? []).map(rowToPartner);
}

export async function upsertSponsorPartner(p: SponsorPartner): Promise<void> {
  const { error } = await supabase.from('sponsor_partners').upsert({
    id: p.id,
    name: p.name.trim(),
    logo_url: mediaRef(p.logoUrl),
    category: p.category,
    display_order: p.displayOrder,
    visible: p.visible,
  });
  if (error) throw error;
}

export async function deleteSponsorPartner(id: string): Promise<void> {
  const { error } = await supabase.from('sponsor_partners').delete().eq('id', id);
  if (error) throw error;
}

/* ═════════════════════════════ Demandes (admin) ═════════════════════════ */

export async function fetchSponsorRequests(): Promise<SponsorRequest[]> {
  const { data, error } = await supabase
    .from('sponsor_requests')
    .select('id, created_at, company, contact_name, email, phone, pack, message, status, assigned_to, last_activity_at')
    .order('created_at', { ascending: false })
    .limit(300);
  if (error) throw error;
  return (data ?? []).map(rowToRequest);
}

/** Événements (notes + changements de statut) d'une demande. */
export async function fetchSponsorRequestEvents(requestId: number): Promise<SponsorRequestEvent[]> {
  const { data, error } = await supabase
    .from('sponsor_request_events')
    .select('*')
    .eq('request_id', requestId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []).map(rowToEvent);
}

/**
 * Change le statut + journalise l'événement + rafraîchit last_activity_at
 * en une passe applicative (3 requêtes Supabase séquentielles).
 */
export async function updateSponsorRequestStatus(
  id: number,
  status: SponsorRequestStatus,
  from: SponsorRequestStatus,
): Promise<void> {
  const author = await currentAuthorEmail();
  const { error: upd } = await supabase
    .from('sponsor_requests')
    .update({ status, last_activity_at: new Date().toISOString() })
    .eq('id', id);
  if (upd) throw upd;
  const { error: ev } = await supabase.from('sponsor_request_events').insert({
    request_id: id,
    kind: 'statut',
    payload: { from, to: status },
    author_email: author,
  });
  if (ev) throw ev;
}

export async function assignSponsorRequest(id: number, userId: string | null): Promise<void> {
  const author = await currentAuthorEmail();
  const { error } = await supabase.from('sponsor_requests').update({ assigned_to: userId }).eq('id', id);
  if (error) throw error;
  await supabase.from('sponsor_request_events').insert({
    request_id: id,
    kind: 'assignation',
    payload: { to: userId ?? '' },
    author_email: author,
  });
}

export async function addSponsorRequestNote(id: number, note: string): Promise<void> {
  const author = await currentAuthorEmail();
  const { error } = await supabase.from('sponsor_request_events').insert({
    request_id: id,
    kind: 'note',
    payload: { note },
    author_email: author,
  });
  if (error) throw error;
  // Une note compte comme une activité (réinitialise l'alerte « sans réponse »)
  await supabase
    .from('sponsor_requests')
    .update({ last_activity_at: new Date().toISOString() })
    .eq('id', id);
}

/** Supprime une demande (et son historique via ON DELETE CASCADE). */
export async function deleteSponsorRequest(id: number): Promise<void> {
  const { error } = await supabase.from('sponsor_requests').delete().eq('id', id);
  if (error) throw error;
}

/* ═════════════════════════════ Clients (admin) ══════════════════════════ */

export async function fetchSponsorClients(): Promise<SponsorClient[]> {
  const { data, error } = await supabase
    .from('sponsor_clients')
    .select('*')
    .order('display_order', { ascending: true });
  if (error) throw error;
  return (data ?? []).map(rowToClient);
}

export async function upsertSponsorClient(c: SponsorClient): Promise<void> {
  const { error } = await supabase.from('sponsor_clients').upsert(clientToRow(c));
  if (error) throw error;
}

export async function deleteSponsorClient(id: string): Promise<void> {
  const { error } = await supabase.from('sponsor_clients').delete().eq('id', id);
  if (error) throw error;
}

/**
 * Miroir « vitrine publique » : quand un sponsor est marqué visible sur la
 * page publique, on crée/met à jour la carte correspondante dans la table
 * `sponsor_partners` (section « Ils nous font confiance ») — appariement par
 * nom. À l'inverse, désactiver la visibilité retire la carte publiable.
 */
export async function mirrorSponsorToPartners(
  client: { name: string; logoUrl: string | null },
  visible: boolean,
): Promise<void> {
  const existing = await fetchSponsorPartners();
  const match = existing.find((p) => p.name.trim().toLowerCase() === client.name.trim().toLowerCase());
  if (visible) {
    if (match) {
      // Met à jour le logo si le sponsor a changé d'image, et (ré)active.
      if (!match.visible || (match.logoUrl ?? '') !== (client.logoUrl ?? '')) {
        await upsertSponsorPartner({
          ...match,
          logoUrl: client.logoUrl,
          visible: true,
        });
      }
    } else {
      await upsertSponsorPartner({
        id: crypto.randomUUID(),
        name: client.name.trim(),
        logoUrl: client.logoUrl,
        category: 'Sponsor partenaire',
        displayOrder: existing.length + 1,
        visible: true,
      });
    }
  } else if (match) {
    await deleteSponsorPartner(match.id);
  }
}

/**
 * Conversion « en un clic » d'une demande acceptée en sponsor.
 * Crée la fiche client + marque la demande et journalise les deux côtés.
 */
export async function convertRequestToSponsor(
  request: SponsorRequest,
  options: { packageId: string | null; amount: number },
): Promise<string> {
  const author = await currentAuthorEmail();
  const today = new Date().toISOString().slice(0, 10);
  const oneYear = new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString().slice(0, 10);
  const insert = {
    name: request.company,
    contact_name: request.contactName,
    contact_email: request.email,
    contact_phone: request.phone ?? '',
    package_id: options.packageId,
    start_date: today,
    end_date: oneYear,
    amount: options.amount,
    amount_paid: 0,
    payment_status: 'attente' as PaymentStatus,
    public_visible: false,
  };
  const { data, error } = await supabase.from('sponsor_clients').insert(insert).select('id').single();
  if (error) throw error;
  const clientId = (data as { id: string }).id;
  await supabase.from('sponsor_request_events').insert({
    request_id: request.id,
    kind: 'conversion',
    payload: { to: 'acceptée', note: `Converti en sponsor #${clientId.slice(0, 8)}` },
    author_email: author,
  });
  return clientId;
}

/* ═══════════════════════════ Documents clients ══════════════════════════ */

export async function fetchSponsorClientDocs(clientId: string): Promise<SponsorClientDoc[]> {
  const { data, error } = await supabase
    .from('sponsor_client_documents')
    .select('*')
    .eq('client_id', clientId)
    .order('uploaded_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(
    (r: Row): SponsorClientDoc => ({
      id: r.id as string,
      clientId: r.client_id as string,
      kind: (r.kind ?? 'autre') as SponsorDocKind,
      name: r.name as string,
      url: mediaUrl(r.url as string),
      uploadedAt: r.uploaded_at as string,
    }),
  );
}

export async function addSponsorClientDoc(
  clientId: string,
  kind: SponsorDocKind,
  file: File,
): Promise<void> {
  const result = await uploadMedia(file);
  const { error } = await supabase.from('sponsor_client_documents').insert({
    client_id: clientId,
    kind,
    name: file.name,
    url: result.ref,
  });
  if (error) throw error;
}

export async function deleteSponsorClientDoc(docId: string): Promise<void> {
  const { error } = await supabase.from('sponsor_client_documents').delete().eq('id', docId);
  if (error) throw error;
}

/* ═══════════════════════════ Paramètres (admin) ═════════════════════════ */

export async function fetchSponsoringSettings(): Promise<SponsoringSettings | null> {
  const { data, error } = await supabase
    .from('sponsor_settings')
    .select('*')
    .eq('id', 1)
    .maybeSingle();
  if (error) throw error;
  return data ? rowToSetting(data) : null;
}

export async function updateSponsoringSettings(s: SponsoringSettings): Promise<void> {
  const { error } = await supabase.from('sponsor_settings').upsert(settingsToRow(s));
  if (error) throw error;
}

/* ═════════════════════════════ Export CSV ═══════════════════════════════ */

/** Échappe une cellule CSV (guillemets, virgules, retours à la ligne). */
function csvCell(value: unknown): string {
  const s = String(value ?? '').replace(/"/g, '""').replace(/\r?\n/g, ' ');
  return `"${s}"`;
}

/**
 * Export des demandes en CSV (compatible Excel FR : séparateur « ; »,
 * BOM UTF-8). Déclenche le téléchargment côté navigateur.
 */
export function exportSponsorRequestsCsv(
  rows: SponsorRequest[],
  packageNames: Record<string, string> = {},
): void {
  const header = ['Date', 'Statut', 'Package', 'Entreprise', 'Contact', 'Email', 'Téléphone', 'Message'];
  const lines = [header.map(csvCell).join(';')];
  for (const r of rows) {
    lines.push(
      [
        new Date(r.createdAt).toLocaleDateString('fr-FR'),
        r.status,
        packageNames[r.pack] ?? r.pack,
        r.company,
        r.contactName,
        r.email,
        r.phone ?? '',
        r.message ?? '',
      ]
        .map(csvCell)
        .join(';'),
    );
  }
  const blob = new Blob(['\uFEFF' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `demandes-sponsoring-fimf-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
