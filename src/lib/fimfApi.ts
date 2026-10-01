// Couche d'accès Supabase pour les données FIMF
// Mapping entre les types du domaine (fimfData.ts) et les tables PostgreSQL
import { supabase, SUPABASE_URL } from './supabaseClient';
import { optimizeImage } from './imageUtils';
import {
  Club,
  Player,
  Match,
  NewsArticle,
  Competition,
  GalleryPhoto,
  HeroSlide,
  FIMF_STATS,
  PARTNERS,
} from '../data/fimfData';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>;

// ---------------------------------------------------------------------
// MAPPERS
// ---------------------------------------------------------------------

function rowToPlayer(r: Row): Player {
  return {
    number: r.number,
    name: r.name,
    position: r.position,
    age: r.age,
    goals: r.goals,
    ...(r.assists != null ? { assists: r.assists } : {}),
    ...(r.clean_sheets != null ? { cleanSheets: r.clean_sheets } : {}),
    ...(r.matches_played != null ? { matchesPlayed: r.matches_played } : {}),
    ...(r.rating != null ? { rating: Number(r.rating) } : {}),
    ...(r.photo_url ? { photoUrl: mediaUrl(r.photo_url) } : {}),
  };
}

function rowToClub(r: Row): Club {
  return {
    id: r.id,
    name: r.name,
    shortName: r.short_name,
    city: r.city,
    commune: r.commune,
    region: r.region,
    division: r.division,
    founded: r.founded,
    president: r.president,
    coach: r.coach,
    stadium: r.stadium,
    primaryColor: r.primary_color,
    secondaryColor: r.secondary_color,
    badgeBg: r.badge_bg,
    badgeBorder: r.badge_border,
    badgeIcon: r.badge_icon,
    ...(r.logo_url ? { logoUrl: mediaUrl(r.logo_url) } : {}),
    stats: r.stats,
    form: r.form ?? [],
    squad: (r.players ?? []).map(rowToPlayer),
  };
}

function clubToRows(club: Club): { clubRow: Row; playerRows: Row[] } {
  const { squad, ...c } = club;
  const clubRow = {
    id: c.id,
    name: c.name,
    short_name: c.shortName,
    city: c.city,
    commune: c.commune,
    region: c.region,
    division: c.division,
    founded: c.founded,
    president: c.president,
    coach: c.coach,
    stadium: c.stadium,
    primary_color: c.primaryColor,
    secondary_color: c.secondaryColor,
    badge_bg: c.badgeBg,
    badge_border: c.badgeBorder,
    badge_icon: c.badgeIcon,
    logo_url: mediaRef(c.logoUrl),
    stats: c.stats,
    form: c.form,
  };
  const playerRows = (squad ?? []).map((p) => ({
    club_id: club.id,
    number: p.number,
    name: p.name,
    position: p.position,
    age: p.age,
    goals: p.goals,
    assists: p.assists ?? null,
    clean_sheets: p.cleanSheets ?? null,
    matches_played: p.matchesPlayed ?? null,
    rating: p.rating ?? null,
    photo_url: mediaRef(p.photoUrl),
  }));
  return { clubRow, playerRows };
}

function rowToMatch(r: Row): Match {
  return {
    id: r.id,
    journee: r.journee,
    dateStr: r.date_str,
    timeStr: r.time_str,
    homeTeamId: r.home_team_id,
    awayTeamId: r.away_team_id,
    venue: r.venue,
    status: r.status,
    ...(r.competition_id ? { competitionId: r.competition_id } : {}),
    ...(r.competition_name ? { competitionName: r.competition_name } : {}),
    ...(r.round_name ? { roundName: r.round_name } : {}),
    ...(r.score_home != null ? { scoreHome: r.score_home } : {}),
    ...(r.score_away != null ? { scoreAway: r.score_away } : {}),
    ...(r.referee ? { referee: r.referee } : {}),
    ...(r.scorers ? { scorers: r.scorers } : {}),
    ...(r.events ? { events: r.events } : {}),
  };
}

function matchToRow(m: Match): Row {
  return {
    id: m.id,
    journee: m.journee,
    date_str: m.dateStr,
    time_str: m.timeStr,
    home_team_id: m.homeTeamId,
    away_team_id: m.awayTeamId,
    venue: m.venue,
    status: m.status,
    competition_id: m.competitionId ?? null,
    competition_name: m.competitionName ?? null,
    round_name: m.roundName ?? null,
    score_home: m.scoreHome ?? null,
    score_away: m.scoreAway ?? null,
    referee: m.referee ?? null,
    scorers: m.scorers ?? null,
    events: m.events ?? null,
  };
}

function rowToNews(r: Row): NewsArticle {
  return {
    id: r.id,
    title: r.title,
    category: r.category,
    dateStr: r.date_str,
    timestamp: r.timestamp,
    readTime: r.read_time ?? '',
    image: mediaUrl(r.image ?? ''),
    excerpt: r.excerpt ?? '',
    content: r.content ?? [],
    tags: r.tags ?? [],
    author: r.author ?? '',
  };
}

function newsToRow(n: NewsArticle): Row {
  return {
    id: n.id,
    title: n.title,
    category: n.category,
    date_str: n.dateStr,
    timestamp: n.timestamp,
    read_time: n.readTime ?? null,
    image: mediaRef(n.image),
    excerpt: n.excerpt ?? null,
    content: n.content,
    tags: n.tags,
    author: n.author ?? null,
  };
}

function rowToCompetition(r: Row): Competition {
  return {
    id: r.id,
    title: r.title,
    type: r.type,
    category: r.category,
    subtitle: r.subtitle ?? '',
    description: r.description ?? '',
    image: mediaUrl(r.image ?? ''),
    participantsCount: r.participants_count ?? 0,
    currentHolder: r.current_holder ?? '',
    period: r.period ?? '',
    rulesHighlight: r.rules_highlight ?? [],
    isMajor: r.is_major ?? false,
  };
}

function competitionToRow(c: Competition): Row {
  return {
    id: c.id,
    title: c.title,
    type: c.type,
    category: c.category,
    subtitle: c.subtitle ?? null,
    description: c.description ?? null,
    image: mediaRef(c.image),
    participants_count: c.participantsCount ?? null,
    current_holder: c.currentHolder ?? null,
    period: c.period ?? null,
    rules_highlight: c.rulesHighlight ?? [],
    is_major: c.isMajor ?? false,
  };
}

function rowToPhoto(r: Row): GalleryPhoto {
  return {
    id: r.id,
    title: r.title,
    category: r.category,
    image: mediaUrl(r.image ?? ''),
    caption: r.caption ?? '',
    dateStr: r.date_str ?? '',
    venue: r.venue ?? '',
  };
}

function photoToRow(p: GalleryPhoto): Row {
  return {
    id: p.id,
    title: p.title,
    category: p.category,
    image: mediaRef(p.image),
    caption: p.caption ?? null,
    date_str: p.dateStr ?? null,
    venue: p.venue ?? null,
  };
}

function rowToHeroSlide(r: Row): HeroSlide {
  return {
    id: r.id,
    title: r.title,
    highlight: r.highlight ?? '',
    subtitle: r.subtitle ?? '',
    image: mediaUrl(r.image ?? ''),
    ...(r.cta_label ? { ctaLabel: r.cta_label } : {}),
    ...(r.cta_page ? { ctaPage: r.cta_page } : {}),
    ...(r.cta_secondary_label ? { ctaSecondaryLabel: r.cta_secondary_label } : {}),
    ...(r.cta_secondary_page ? { ctaSecondaryPage: r.cta_secondary_page } : {}),
    sortOrder: r.sort_order ?? 0,
    active: r.active ?? true,
  };
}

function heroSlideToRow(s: HeroSlide): Row {
  return {
    id: s.id,
    title: s.title,
    highlight: s.highlight,
    subtitle: s.subtitle,
    image: mediaRef(s.image),
    cta_label: s.ctaLabel ?? null,
    cta_page: s.ctaPage ?? null,
    cta_secondary_label: s.ctaSecondaryLabel ?? null,
    cta_secondary_page: s.ctaSecondaryPage ?? null,
    sort_order: s.sortOrder,
    active: s.active,
  };
}

// ---------------------------------------------------------------------
// LECTURE
// ---------------------------------------------------------------------

export async function fetchClubs(): Promise<Club[]> {
  const { data, error } = await supabase
    .from('clubs')
    .select('*, players(*)')
    .order('founded', { ascending: true });
  if (error) throw error;
  return (data ?? []).map(rowToClub);
}

export async function fetchMatches(): Promise<Match[]> {
  const { data, error } = await supabase.from('matches').select('*');
  if (error) throw error;
  return (data ?? []).map(rowToMatch);
}

export async function fetchNews(): Promise<NewsArticle[]> {
  const { data, error } = await supabase
    .from('news_articles')
    .select('*')
    .order('timestamp', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(rowToNews);
}

export async function fetchCompetitions(): Promise<Competition[]> {
  const { data, error } = await supabase.from('competitions').select('*');
  if (error) throw error;
  return (data ?? []).map(rowToCompetition);
}

export async function fetchGallery(): Promise<GalleryPhoto[]> {
  const { data, error } = await supabase.from('gallery_photos').select('*');
  if (error) throw error;
  return (data ?? []).map(rowToPhoto);
}

export async function fetchHeroSlides(): Promise<HeroSlide[]> {
  const { data, error } = await supabase
    .from('hero_slides')
    .select('*')
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return (data ?? []).map(rowToHeroSlide);
}

export async function fetchStats(): Promise<typeof FIMF_STATS> {
  const { data, error } = await supabase.from('site_stats').select('*').eq('id', 1).single();
  if (error) throw error;
  return {
    clubsCount: data.clubs_count,
    clubsLabel: data.clubs_label,
    playersCount: data.players_count,
    playersLabel: data.players_label,
    refereesCount: data.referees_count,
    refereesLabel: data.referees_label,
    pitchesCount: data.pitches_count,
    pitchesLabel: data.pitches_label,
  };
}

export async function fetchPartners(): Promise<typeof PARTNERS> {
  const { data, error } = await supabase.from('partners').select('*');
  if (error) throw error;
  return (data ?? []).map((r: Row) => ({ id: r.id, name: r.name, category: r.category }));
}

export async function fetchOfficials(): Promise<Row[]> {
  const { data, error } = await supabase.from('officials').select('*');
  if (error) throw error;
  return (data ?? []).map((r: Row) => ({
    id: r.id,
    name: r.name,
    role: r.role,
    department: r.department,
    email: r.email ?? '',
    phone: r.phone ?? '',
    mandateStart: r.mandate_start ?? '',
    mandateEnd: r.mandate_end ?? '',
    status: r.status ?? 'Actif',
    bio: r.bio ?? '',
    ...(r.photo_url ? { photoUrl: r.photo_url } : {}),
    ...(r.powers ? { powers: r.powers } : {}),
  }));
}

export async function fetchCommissions(): Promise<Row[]> {
  const { data, error } = await supabase.from('commissions').select('*');
  if (error) throw error;
  return (data ?? []).map((r: Row) => ({
    id: r.id,
    name: r.name,
    president: r.president,
    membersCount: r.members_count,
    description: r.description ?? '',
    meetingFrequency: r.meeting_frequency ?? '',
    nextMeeting: r.next_meeting ?? '',
    status: r.status ?? 'Active',
  }));
}

export async function fetchLogs(): Promise<Row[]> {
  const { data, error } = await supabase
    .from('audit_logs')
    .select('*')
    .order('timestamp', { ascending: false })
    .limit(50);
  if (error) throw error;
  return (data ?? []).map((r: Row) => ({
    id: r.id,
    timestamp: new Date(r.timestamp).toLocaleString('fr-FR'),
    action: r.action,
    target: r.target ?? '',
    author: r.author ?? '',
  }));
}

// ---------------------------------------------------------------------
// ÉCRITURE
// ---------------------------------------------------------------------

export async function upsertClub(club: Club): Promise<void> {
  const { clubRow, playerRows } = clubToRows(club);
  const { error: clubError } = await supabase.from('clubs').upsert(clubRow);
  if (clubError) throw clubError;
  // L'effectif est toujours envoyé complet par l'UI admin : on resynchronise
  const { error: delError } = await supabase.from('players').delete().eq('club_id', club.id);
  if (delError) throw delError;
  if (playerRows.length > 0) {
    const { error: insError } = await supabase.from('players').insert(playerRows);
    if (insError) throw insError;
  }
}

export async function deleteClubRow(clubId: string): Promise<void> {
  const { error } = await supabase.from('clubs').delete().eq('id', clubId);
  if (error) throw error;
}

export async function upsertMatch(m: Match): Promise<void> {
  const { error } = await supabase.from('matches').upsert(matchToRow(m));
  if (error) throw error;
}

export async function deleteMatchRow(id: string): Promise<void> {
  const { error } = await supabase.from('matches').delete().eq('id', id);
  if (error) throw error;
}

export async function upsertNewsArticle(n: NewsArticle): Promise<void> {
  const { error } = await supabase.from('news_articles').upsert(newsToRow(n));
  if (error) throw error;
}

export async function upsertHeroSlide(s: HeroSlide): Promise<void> {
  const { error } = await supabase.from('hero_slides').upsert(heroSlideToRow(s));
  if (error) throw error;
}

export async function deleteHeroSlideRow(id: string): Promise<void> {
  const { error } = await supabase.from('hero_slides').delete().eq('id', id);
  if (error) throw error;
}

export async function deleteNewsArticle(id: string): Promise<void> {
  const { error } = await supabase.from('news_articles').delete().eq('id', id);
  if (error) throw error;
}

export async function upsertCompetition(c: Competition): Promise<void> {
  const { error } = await supabase.from('competitions').upsert(competitionToRow(c));
  if (error) throw error;
}

export async function deleteCompetitionRow(id: string): Promise<void> {
  const { error } = await supabase.from('competitions').delete().eq('id', id);
  if (error) throw error;
}

export async function upsertGalleryPhoto(p: GalleryPhoto): Promise<void> {
  const { error } = await supabase.from('gallery_photos').upsert(photoToRow(p));
  if (error) throw error;
}

export async function deleteGalleryPhotoRow(id: string): Promise<void> {
  const { error } = await supabase.from('gallery_photos').delete().eq('id', id);
  if (error) throw error;
}

export async function updateSiteStats(stats: typeof FIMF_STATS): Promise<void> {
  const { error } = await supabase
    .from('site_stats')
    .upsert({
      id: 1,
      clubs_count: stats.clubsCount,
      clubs_label: stats.clubsLabel,
      players_count: stats.playersCount,
      players_label: stats.playersLabel,
      referees_count: stats.refereesCount,
      referees_label: stats.refereesLabel,
      pitches_count: stats.pitchesCount,
      pitches_label: stats.pitchesLabel,
    });
  if (error) throw error;
}

export async function upsertPartner(p: { id: string; name: string; category: string }): Promise<void> {
  const { error } = await supabase.from('partners').upsert(p);
  if (error) throw error;
}

export async function deletePartnerRow(id: string): Promise<void> {
  const { error } = await supabase.from('partners').delete().eq('id', id);
  if (error) throw error;
}

function officialToRow(o: Row): Row {
  return {
    id: o.id,
    name: o.name,
    role: o.role,
    department: o.department,
    email: o.email ?? null,
    phone: o.phone ?? null,
    mandate_start: o.mandateStart ?? null,
    mandate_end: o.mandateEnd ?? null,
    status: o.status ?? 'Actif',
    bio: o.bio ?? null,
    photo_url: o.photoUrl ?? null,
    powers: o.powers ?? null,
  };
}

export async function upsertOfficial(o: Row): Promise<void> {
  const { error } = await supabase.from('officials').upsert(officialToRow(o));
  if (error) throw error;
}

export async function deleteOfficialRow(id: string): Promise<void> {
  const { error } = await supabase.from('officials').delete().eq('id', id);
  if (error) throw error;
}

function commissionToRow(c: Row): Row {
  return {
    id: c.id,
    name: c.name,
    president: c.president,
    members_count: c.membersCount ?? 0,
    description: c.description ?? null,
    meeting_frequency: c.meetingFrequency ?? null,
    next_meeting: c.nextMeeting ?? null,
    status: c.status ?? 'Active',
  };
}

export async function upsertCommission(c: Row): Promise<void> {
  const { error } = await supabase.from('commissions').upsert(commissionToRow(c));
  if (error) throw error;
}

export async function deleteCommissionRow(id: string): Promise<void> {
  const { error } = await supabase.from('commissions').delete().eq('id', id);
  if (error) throw error;
}

export async function insertAuditLog(action: string, target: string, author: string): Promise<void> {
  const { error } = await supabase
    .from('audit_logs')
    .insert({ id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`, action, target, author });
  // Non bloquant : un échec de log ne doit pas casser l'action admin
  if (error) console.warn('Audit log non enregistré:', error.message);
}

// ---------------------------------------------------------------------
// JEUX & PRONOSTICS MEMBRES (périodes, lots, tirages, bourses)
// ---------------------------------------------------------------------

export type GamePeriodStatus = 'à venir' | 'en cours' | 'clôturée';

export interface GamePeriod {
  id: number;
  name: string;
  startsAt: string;
  endsAt: string;
  topN: number;
  status: GamePeriodStatus;
}

function rowToGamePeriod(r: Row): GamePeriod {
  return {
    id: r.id,
    name: r.name,
    startsAt: r.starts_at,
    endsAt: r.ends_at,
    topN: r.top_n ?? 10,
    status: (r.status ?? 'à venir') as GamePeriodStatus,
  };
}

/** Périodes de jeu (vitrine publique). */
export async function fetchGamePeriods(): Promise<GamePeriod[]> {
  const { data, error } = await supabase
    .from('game_periods')
    .select('*')
    .order('starts_at', { ascending: false })
    .limit(50);
  if (error) throw error;
  return (data ?? []).map(rowToGamePeriod);
}

export async function upsertGamePeriod(p: {
  id?: number;
  name: string;
  startsAt: string;
  endsAt: string;
  topN: number;
  status: GamePeriodStatus;
}): Promise<void> {
  const row = {
    id: p.id,
    name: p.name,
    starts_at: p.startsAt,
    ends_at: p.endsAt,
    top_n: p.topN,
    status: p.status,
  };
  const { error } = p.id
    ? await supabase.from('game_periods').update(row).eq('id', p.id)
    : await supabase.from('game_periods').insert(row);
  if (error) throw error;
}

export async function deleteGamePeriodRow(id: number): Promise<void> {
  const { error } = await supabase.from('game_periods').delete().eq('id', id);
  if (error) throw error;
}

export interface GamePrize {
  id: number;
  periodId: number;
  label: string;
  description: string | null;
  imageRef: string | null;
  rankFrom: number;
  rankTo: number;
}

function rowToGamePrize(r: Row): GamePrize {
  return {
    id: r.id,
    periodId: r.period_id,
    label: r.label,
    description: r.description ?? null,
    imageRef: r.image_ref ? mediaUrl(r.image_ref) : null,
    rankFrom: r.rank_from ?? 1,
    rankTo: r.rank_to ?? 1,
  };
}

/** Lots (vitrine publique). */
export async function fetchGamePrizes(): Promise<GamePrize[]> {
  const { data, error } = await supabase
    .from('game_prizes')
    .select('*')
    .order('period_id')
    .order('rank_from');
  if (error) throw error;
  return (data ?? []).map(rowToGamePrize);
}

export async function upsertGamePrize(p: {
  id?: number;
  periodId: number;
  label: string;
  description: string | null;
  imageRef: string | null;
  rankFrom: number;
  rankTo: number;
}): Promise<void> {
  const row = {
    id: p.id,
    period_id: p.periodId,
    label: p.label,
    description: p.description,
    image_ref: p.imageRef ? mediaRef(p.imageRef) : null,
    rank_from: p.rankFrom,
    rank_to: p.rankTo,
  };
  const { error } = p.id
    ? await supabase.from('game_prizes').update(row).eq('id', p.id)
    : await supabase.from('game_prizes').insert(row);
  if (error) throw error;
}

export async function deleteGamePrizeRow(id: number): Promise<void> {
  const { error } = await supabase.from('game_prizes').delete().eq('id', id);
  if (error) throw error;
}

export interface MatchPredictionEntry {
  matchId: string;
  periodId: number;
  predictedHome: number;
  predictedAway: number;
  points: number | null;
  updatedAt: string;
}

/** Pronostics du membre connecté (RLS : ses lignes uniquement). */
export async function fetchMyPredictions(): Promise<MatchPredictionEntry[]> {
  const { data, error } = await supabase
    .from('match_predictions')
    .select('match_id, period_id, predicted_home, predicted_away, points, updated_at')
    .order('updated_at', { ascending: false })
    .limit(500);
  if (error) throw error;
  return (data ?? []).map((r) => ({
    matchId: r.match_id,
    periodId: r.period_id,
    predictedHome: r.predicted_home,
    predictedAway: r.predicted_away,
    points: r.points ?? null,
    updatedAt: r.updated_at,
  }));
}

/** Enregistre/modifie un pronostic (RLS : user_id forcé côté client, vérifié en base). */
export async function saveMatchPrediction(
  periodId: number,
  matchId: string,
  predictedHome: number,
  predictedAway: number,
): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Connexion requise');
  const { error } = await supabase.from('match_predictions').upsert({
    user_id: user.id,
    match_id: matchId,
    period_id: periodId,
    predicted_home: Math.max(0, predictedHome),
    predicted_away: Math.max(0, predictedAway),
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
}

export interface GameDraw {
  id: number;
  kind: 'period' | 'scholarship';
  periodId: number | null;
  title: string;
  description: string | null;
  winnersCount: number;
  status: 'planifié' | 'terminé';
  drawnAt: string | null;
  seed: string | null;
}

function rowToGameDraw(r: Row): GameDraw {
  return {
    id: r.id,
    kind: r.kind,
    periodId: r.period_id ?? null,
    title: r.title,
    description: r.description ?? null,
    winnersCount: r.winners_count ?? 1,
    status: (r.status ?? 'planifié') as GameDraw['status'],
    drawnAt: r.drawn_at ?? null,
    seed: r.seed ?? null,
  };
}

/** Tirages (vitrine publique ; le seed sert d'audit de reproductibilité). */
export async function fetchGameDraws(): Promise<GameDraw[]> {
  const { data, error } = await supabase
    .from('prize_draws')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) throw error;
  return (data ?? []).map(rowToGameDraw);
}

export async function upsertGameDraw(d: {
  id?: number;
  kind: 'period' | 'scholarship';
  periodId: number | null;
  title: string;
  description: string | null;
  winnersCount: number;
}): Promise<void> {
  const row = {
    id: d.id,
    kind: d.kind,
    period_id: d.periodId,
    title: d.title,
    description: d.description,
    winners_count: d.winnersCount,
  };
  const { error } = d.id
    ? await supabase.from('prize_draws').update(row).eq('id', d.id)
    : await supabase.from('prize_draws').insert(row);
  if (error) throw error;
}

export async function deleteGameDrawRow(id: number): Promise<void> {
  const { error } = await supabase.from('prize_draws').delete().eq('id', id);
  if (error) throw error;
}

export interface DrawWinnerPublic {
  id: number;
  rank: number;
  displayName: string;
  prizeLabel: string | null;
  /** Photo du gagnant (URL publique du bucket, null si aucune). */
  photoRef: string | null;
}

/** Gagnants publiés d'un tirage (noms + photos, sans données personnelles). */
export async function fetchDrawWinners(drawId: number): Promise<DrawWinnerPublic[]> {
  const { data, error } = await supabase.rpc('draw_winners_public', { p_draw_id: drawId });
  if (error) throw error;
  return (data ?? []).map((w: Row) => ({
    id: w.id,
    rank: w.rank,
    displayName: w.display_name,
    prizeLabel: w.prize_label ?? null,
    photoRef: w.photo_ref ? mediaUrl(w.photo_ref) : null,
  }));
}

/** Met à jour la photo d'un gagnant (admin ; null pour supprimer). */
export async function updateWinnerPhoto(winnerId: number, photoRef: string | null): Promise<void> {
  const { error } = await supabase.from('draw_winners').update({ photo_ref: photoRef }).eq('id', winnerId);
  if (error) throw error;
}

export interface LeaderboardRow {
  rank: number;
  userId: string;
  totalPoints: number;
  predictions: number;
}

/** Classement d'une période vu par le membre (son rang + publication si clôturée). */
export async function fetchMyLeaderboard(periodId: number): Promise<LeaderboardRow[]> {
  const { data, error } = await supabase.rpc('member_period_leaderboard', { p_period_id: periodId });
  if (error) throw error;
  return (data ?? []).map((r: Row) => ({
    rank: Number(r.rank),
    userId: r.user_id,
    totalPoints: Number(r.total_points),
    predictions: Number(r.predictions),
  }));
}

/** Nombre de tickets de tirage bourse détenus par le membre pour un tirage. */
export async function fetchMyTicketCount(drawId: number): Promise<number> {
  const { count, error } = await supabase
    .from('draw_tickets')
    .select('*', { count: 'exact', head: true })
    .eq('draw_id', drawId);
  if (error) throw error;
  return count ?? 0;
}

// ----- Actions admin (RPC security definer, garde is_fimf_admin en base) -----

/** Évalue les points des pronostics d'une période (matchs terminés). */
export async function adminEvaluatePeriod(periodId: number): Promise<number> {
  const { data, error } = await supabase.rpc('admin_evaluate_period_predictions', {
    p_period_id: periodId,
  });
  if (error) throw error;
  return Number(data ?? 0);
}

/** Classement complet d'une période (admin). */
export async function adminFetchPeriodLeaderboard(periodId: number): Promise<LeaderboardRow[]> {
  const { data, error } = await supabase.rpc('admin_period_leaderboard', { p_period_id: periodId });
  if (error) throw error;
  return (data ?? []).map((r: Row) => ({
    rank: Number(r.rank),
    userId: r.user_id,
    totalPoints: Number(r.total_points),
    predictions: Number(r.predictions),
  }));
}

/** Lance le tirage des lots d'une période (top N du classement). */
export async function adminRunPeriodDraw(drawId: number, seed: string): Promise<number> {
  const { data, error } = await supabase.rpc('admin_run_period_draw', {
    p_draw_id: drawId,
    p_seed: seed,
  });
  if (error) throw error;
  return Number(data ?? 0);
}

/** Lance le tirage des bourses d'études (tickets pondérés 1/10 pts). */
export async function adminRunScholarshipDraw(drawId: number, seed: string): Promise<number> {
  const { data, error } = await supabase.rpc('admin_run_scholarship_draw', {
    p_draw_id: drawId,
    p_seed: seed,
  });
  if (error) throw error;
  return Number(data ?? 0);
}

// ---------------------------------------------------------------------
// RÔLE DE L'UTILISATEUR CONNECTÉ (admin fédéral / dirigeant de club)
// ---------------------------------------------------------------------

export type FimfRole = 'admin' | 'dirigeant';

export type FimfMembership = {
  role: FimfRole;
  /** Club géré par le dirigeant (null pour un admin fédéral sans club). */
  clubId: string | null;
};

// ---------------------------------------------------------------------
// DEMANDES DE SPONSORING / PARTENARIAT
// ---------------------------------------------------------------------

export type SponsorRequestStatus = 'nouvelle' | 'en cours' | 'contactée' | 'signée' | 'refusée';

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
}

function rowToSponsorRequest(r: Row): SponsorRequest {
  return {
    id: r.id,
    createdAt: new Date(r.created_at).toLocaleString('fr-FR'),
    company: r.company,
    contactName: r.contact_name,
    email: r.email,
    phone: r.phone ?? null,
    pack: r.pack,
    message: r.message ?? null,
    status: (r.status ?? 'nouvelle') as SponsorRequestStatus,
  };
}

/** Liste des demandes de sponsoring (réservée aux utilisateurs authentifiés). */
export async function fetchSponsorRequests(): Promise<SponsorRequest[]> {
  const { data, error } = await supabase
    .from('sponsor_requests')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200);
  if (error) throw error;
  return (data ?? []).map(rowToSponsorRequest);
}

/** Met à jour le statut d'une demande de sponsoring. */
export async function updateSponsorRequestStatus(id: number, status: SponsorRequestStatus): Promise<void> {
  const { error } = await supabase.from('sponsor_requests').update({ status }).eq('id', id);
  if (error) throw error;
}

// ---------------------------------------------------------------------
// DEMANDES D'ADHÉSION (membres)
// ---------------------------------------------------------------------

export type MemberRequestStatus = 'nouvelle' | 'approuvée' | 'refusée';

export interface MemberRequest {
  id: number;
  createdAt: string;
  fullName: string;
  email: string;
  status: MemberRequestStatus;
  /** Compte auth.users créé lors de l'approbation (null = pas encore activé). */
  authUserId: string | null;
  activatedAt: string | null;
}

function rowToMemberRequest(r: Row): MemberRequest {
  return {
    id: r.id,
    createdAt: new Date(r.created_at).toLocaleString('fr-FR'),
    fullName: r.full_name,
    email: r.email,
    status: (r.status ?? 'nouvelle') as MemberRequestStatus,
    authUserId: r.auth_user_id ?? null,
    activatedAt: r.activated_at ? new Date(r.activated_at).toLocaleString('fr-FR') : null,
  };
}

/** Liste des demandes d'adhésion (réservée aux utilisateurs authentifiés). */
export async function fetchMemberRequests(): Promise<MemberRequest[]> {
  const { data, error } = await supabase
    .from('member_requests')
    .select('id, created_at, full_name, email, status, auth_user_id, activated_at')
    .order('created_at', { ascending: false })
    .limit(200);
  if (error) throw error;
  return (data ?? []).map(rowToMemberRequest);
}

/** Met à jour le statut d'une demande d'adhésion. */
export async function updateMemberRequestStatus(id: number, status: MemberRequestStatus): Promise<void> {
  const { error } = await supabase.from('member_requests').update({ status }).eq('id', id);
  if (error) throw error;
}

// ---------------------------------------------------------------------
// CLUBS FAVORIS (persistance par compte membre — table member_favorite_clubs)
// ---------------------------------------------------------------------

/** Liste des clubs favoris de l'utilisateur connecté (ordre d'ajout). */
export async function fetchFavoriteClubIds(): Promise<string[]> {
  const { data, error } = await supabase
    .from('member_favorite_clubs')
    .select('club_id')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []).map((r) => r.club_id as string);
}

/** Ajoute un club aux favoris du compte connecté (idempotent via la clé primaire). */
export async function addFavoriteClubRow(clubId: string): Promise<void> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user) throw new Error('Non connecté');
  const { error } = await supabase
    .from('member_favorite_clubs')
    .upsert({ user_id: session.user.id, club_id: clubId });
  if (error) throw error;
}

/** Retire un club des favoris du compte connecté (filtre user explicite + RLS). */
export async function removeFavoriteClubRow(clubId: string): Promise<void> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user) throw new Error('Non connecté');
  const { error } = await supabase
    .from('member_favorite_clubs')
    .delete()
    .eq('user_id', session.user.id)
    .eq('club_id', clubId);
  if (error) throw error;
}

/**
 * Renvoie le rôle de l'utilisateur connecté : 'admin' (fédéral, table fimf_admins)
 * ou 'dirigeant' (lié à un club via club_users). Null si non connecté ou sans rôle.
 */
export async function fetchMyClubMembership(): Promise<FimfMembership | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: adminRow } = await supabase
    .from('fimf_admins')
    .select('user_id')
    .eq('user_id', user.id)
    .maybeSingle();

  const { data: clubLink } = await supabase
    .from('club_users')
    .select('club_id, role')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle();

  if (adminRow) {
    return { role: 'admin', clubId: clubLink?.club_id ?? null };
  }
  if (clubLink) {
    return { role: 'dirigeant', clubId: clubLink.club_id };
  }
  return null;
}

// ---------------------------------------------------------------------
// RÉINITIALISATION (données par défaut)
// ---------------------------------------------------------------------

export async function resetAllToDefaults(payload: {
  clubs: Club[];
  matches: Match[];
  news: NewsArticle[];
  competitions: Competition[];
  gallery: GalleryPhoto[];
  stats: typeof FIMF_STATS;
  partners: typeof PARTNERS;
  officials: Row[];
  commissions: Row[];
}): Promise<void> {
  // Purge (l'ordre respecte les clés étrangères)
  await supabase.from('players').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('matches').delete().neq('id', '');
  await supabase.from('news_articles').delete().neq('id', '');
  await supabase.from('gallery_photos').delete().neq('id', '');
  await supabase.from('competitions').delete().neq('id', '');
  await supabase.from('officials').delete().neq('id', '');
  await supabase.from('commissions').delete().neq('id', '');
  await supabase.from('partners').delete().neq('id', '');
  await supabase.from('clubs').delete().neq('id', '');

  // Clubs + effectifs
  const clubRows = payload.clubs.map((c) => clubToRows(c).clubRow);
  const playerRows = payload.clubs.flatMap((c) => clubToRows(c).playerRows);
  const { error: e1 } = await supabase.from('clubs').insert(clubRows);
  if (e1) throw e1;
  if (playerRows.length > 0) {
    const { error: e2 } = await supabase.from('players').insert(playerRows);
    if (e2) throw e2;
  }

  const { error: e3 } = await supabase.from('matches').insert(payload.matches.map(matchToRow));
  if (e3) throw e3;
  const { error: e4 } = await supabase.from('news_articles').insert(payload.news.map(newsToRow));
  if (e4) throw e4;
  const { error: e5 } = await supabase.from('gallery_photos').insert(payload.gallery.map(photoToRow));
  if (e5) throw e5;
  const { error: e6 } = await supabase.from('competitions').insert(payload.competitions.map(competitionToRow));
  if (e6) throw e6;
  const { error: e7 } = await supabase.from('officials').insert(payload.officials.map(officialToRow));
  if (e7) throw e7;
  const { error: e8 } = await supabase.from('commissions').insert(payload.commissions.map(commissionToRow));
  if (e8) throw e8;
  const { error: e9 } = await supabase.from('partners').insert(payload.partners);
  if (e9) throw e9;
  await updateSiteStats(payload.stats);
}

// ---------------------------------------------------------------------
// REALTIME
// ---------------------------------------------------------------------

export function subscribeToTable(
  table: 'matches' | 'clubs' | 'news_articles',
  onChange: () => void
) {
  const channel = supabase
    .channel(`fimf-${table}`)
    .on('postgres_changes', { event: '*', schema: 'public', table }, onChange)
    .subscribe();
  return channel;
}

export function unsubscribeChannel(channel: ReturnType<typeof subscribeToTable>) {
  supabase.removeChannel(channel);
}

// ---------------------------------------------------------------------
// STORAGE — upload d'images vers le bucket public fimf-media
// ---------------------------------------------------------------------

export const MEDIA_BUCKET = 'fimf-media';

/** Convertit une référence locale ("photo.jpg") en URL publique complète du bucket. */
export function mediaUrl(ref: string): string {
  if (!ref) return ref;
  if (ref.startsWith('http://') || ref.startsWith('https://') || ref.startsWith('data:')) {
    return ref; // déjà une URL (ou base64) : ne pas toucher
  }
  return `${SUPABASE_URL}/storage/v1/object/public/${MEDIA_BUCKET}/${ref}`;
}

/** Convertit une URL du bucket (ou n'importe quelle valeur) en référence courte à stocker en base. */
export function mediaRef(value: string | null | undefined): string | null {
  if (!value) return null;
  const marker = `/storage/v1/object/public/${MEDIA_BUCKET}/`;
  const idx = value.indexOf(marker);
  if (idx >= 0) return value.substring(idx + marker.length);
  return value; // URL externe ou référence déjà courte
}

export interface UploadMediaResult {
  /** Référence relative stockée en base, à résoudre via mediaUrl(). */
  ref: string;
  /** Taille du fichier original, en octets. */
  originalSize: number;
  /** Taille effectivement téléversée, en octets. */
  finalSize: number;
  /** true si le fichier est parti tel quel (déjà optimisé ou format non recompressable). */
  passthrough: boolean;
  /** Dimensions après redimensionnement (absentes si passthrough). */
  width?: number;
  height?: number;
}

/**
 * Optimise (redimensionne + compresse) puis téléverse un fichier image vers le
 * bucket fimf-media. Retourne la référence à stocker en base et les
 * statistiques de compression.
 */
export async function uploadMedia(file: File): Promise<UploadMediaResult> {
  const optimized = await optimizeImage(file);
  const ext = optimized.mime === 'image/png' ? 'png' : 'jpg';
  const name = `admin-${Date.now()}-${Math.floor(Math.random() * 10000)}.${ext}`;
  const { error } = await supabase.storage
    .from(MEDIA_BUCKET)
    .upload(name, optimized.blob, {
      cacheControl: '3600',
      contentType: optimized.mime,
      upsert: false,
    });
  if (error) throw error;
  return {
    ref: name, // référence relative stockée en base, résolue via mediaUrl()
    originalSize: file.size,
    finalSize: optimized.blob.size,
    passthrough: optimized.passthrough,
    width: optimized.width || undefined,
    height: optimized.height || undefined,
  };
}
