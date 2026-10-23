/**
 * Registre des images « hero » du site (audit sécurité FIMF, constat 16 — LCP mobile).
 *
 * Les 5 JPEG de `src/assets/images` pesaient ~4,5 Mo au total et étaient servis
 * en pleine résolution à tous les Appointment loaders, y compris sur mobile.
 * Ils sont désormais ré-encodés (JPEG progressif) et déclinés en 3 largeurs
 * (640 / 1024 / pleine largeur), avec une variante WebP de chacune.
 *
 * `<ResponsiveImage>` s'appuie sur ce registre pour servir le bon fichier selon
 * la largeur du viewport et le support WebP du navigateur.
 *
 * Régénérer les fichiers après modification des sources :
 *   python tools/optimize-hero-images.py
 */

/** Dimensions et largeurs disponibles d'une image. */
interface HeroAsset {
  /** Largeur de l'image pleine largeur (px). */
  width: number;
  /** Hauteur de l'image pleine largeur (px). */
  height: number;
  /** Largeurs générées, de la plus petite à la plus grande. */
  widths: number[];
}

/**
 * Images connues du registre. La clé est le nom du fichier source :
 * il sert de référence à la fois dans `src/data/fimfData.ts` (galerie, slides
 * par défaut) et dans les bandeaux des pages.
 */
const HERO_ASSETS: Record<string, HeroAsset> = {
  'championship_trophy_gold_1790335980246.jpg': { width: 1200, height: 896, widths: [640, 1024, 1200] },
  'fimf_headquarters_building_1790335956733.jpg': { width: 1376, height: 768, widths: [640, 1024, 1376] },
  'hero_ivory_coast_minifootball_1790335944178.jpg': { width: 1376, height: 768, widths: [640, 1024, 1376] },
  'referee_training_session_1790335992555.jpg': { width: 1200, height: 896, widths: [640, 1024, 1200] },
  'team_huddle_elephants_1790335968616.jpg': { width: 1200, height: 896, widths: [640, 1024, 1200] },
};

/** Variantes WebP générées. */
const webpFiles = import.meta.glob('../assets/images/*_w*.webp', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;

/** Variantes JPEG redimensionnées. */
const jpgFiles = import.meta.glob('../assets/images/*_w*.jpg', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;

/** Tous les JPEG bundlés (variantes + pleine largeur). */
const allJpgFiles = import.meta.glob('../assets/images/*.jpg', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;

/**
 * URL bundlée → nom de fichier source (le hash ajouté par Vite est retiré).
 * Permet de retrouver le registre à partir d'un `import` d'asset.
 */
const urlToSourceName = new Map<string, string>(
  Object.entries(allJpgFiles).map(([path, url]) => [url, path.substring(path.lastIndexOf('/') + 1)]),
);

export interface HeroSource {
  /** URL de repli (JPEG pleine largeur). */
  src: string;
  /** `srcset` JPEG, pour les navigateurs sans WebP. */
  srcSet: string;
  /** `srcset` WebP, prioritaire via `<source type="image/webp">`. */
  webpSrcSet: string;
  /** Largeur de l'image pleine largeur (px). */
  width: number;
  /** Hauteur de l'image pleine largeur (px). */
  height: number;
}

/** Nom de fichier court (sans dossier) d'une URL d'asset. */
function fileNameOf(url: string): string {
  const clean = url.split('?')[0];
  return clean.substring(clean.lastIndexOf('/') + 1);
}

/**
 * Retrouve le nom de fichier source d'une image du registre.
 * Accepte le nom du fichier (`hero_...jpg`) ou l'URL bundlée
 * (`/assets/hero_..._hash.jpg`) : dans les deux cas la résolution se fait
 * sur le nom de fichier d'origine.
 */
export function resolveSourceName(name: string): string | null {
  if (!name) return null;
  if (HERO_ASSETS[name]) return name;
  const mapped = urlToSourceName.get(name);
  if (mapped && HERO_ASSETS[mapped]) return mapped;
  // URL servie par Supabase Storage : hors registre.
  const base = fileNameOf(name);
  if (HERO_ASSETS[base]) return base;
  return null;
}

/**
 * Variante stricte de `resolveSourceName` : n'accepte que le nom exact du
 * fichier source ou l'URL bundlée par Vite.
 *
 * Elle sert aux slides du carrousel hero : une slide issue de Supabase
 * Storage peut porter le même nom de fichier qu'un asset local (l'admin a
 * pu téléverser une image de remplacement) — dans ce cas l'original stocké
 * doit rester prioritaire, sinon le site afficherait une image périmée.
 */
export function resolveBundledHeroName(name: string): string | null {
  if (!name) return null;
  if (HERO_ASSETS[name]) return name;
  const mapped = urlToSourceName.get(name);
  if (mapped && HERO_ASSETS[mapped]) return mapped;
  return null;
}

/** Retourne les variantes d'une image du registre, ou null si elle n'y est pas. */
export function getHeroSource(name: string): HeroSource | null {
  const fileName = resolveSourceName(name);
  if (!fileName) return null;

  const asset = HERO_ASSETS[fileName];
  const base = fileName.replace(/\.jpg$/i, '');
  const jpgEntries: string[] = [];
  const webpEntries: string[] = [];

  for (const w of asset.widths) {
    const jpg = jpgFiles[`../assets/images/${base}_w${w}.jpg`];
    const webp = webpFiles[`../assets/images/${base}_w${w}.webp`];
    if (jpg) jpgEntries.push(`${jpg} ${w}w`);
    if (webp) webpEntries.push(`${webp} ${w}w`);
  }

  if (!jpgEntries.length) return null;

  return {
    src: jpgFiles[`../assets/images/${base}_w${asset.width}.jpg`],
    srcSet: jpgEntries.join(', '),
    webpSrcSet: webpEntries.join(', '),
    width: asset.width,
    height: asset.height,
  };
}

/**
 * URL du JPEG pleine largeur d'une image du registre.
 * Sert de repli quand les variantes ne sont pas disponibles.
 */
export function getFullJpgUrl(name: string): string | null {
  const fileName = resolveSourceName(name);
  if (!fileName) return null;
  return allJpgFiles[`../assets/images/${fileName}`] ?? null;
}
