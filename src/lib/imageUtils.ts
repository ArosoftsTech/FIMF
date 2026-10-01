// Optimisation d'images côté navigateur avant upload vers Supabase Storage.
// - Redimensionnement : le plus grand côté est limité à MAX_DIMENSION
// - Compression : ré-encodage JPEG progressif, jamais plus lourd que l'original
// - PNG avec transparence : conservé en PNG (pas de fond blanc ajouté)
// - GIF animé / SVG : laissés tels quels (le canvas les dénaturerait)

const MAX_DIMENSION = 1600;
const INITIAL_QUALITY = 0.82;
const MIN_QUALITY = 0.5;

export interface OptimizedImage {
  blob: Blob;
  mime: string;
  width: number;
  height: number;
  /** true si le fichier n'a pas pu être optimisé et est renvoyé tel quel. */
  passthrough: boolean;
}

function canvasToBlob(canvas: HTMLCanvasElement, mime: string, quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('Encodage de l\'image impossible'))),
      mime,
      quality
    );
  });
}

/** Détecte la présence de pixels transparents sur le canvas. */
function hasTransparency(canvas: HTMLCanvasElement): boolean {
  const ctx = canvas.getContext('2d');
  if (!ctx) return false;
  const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
  for (let i = 3; i < data.length; i += 4) {
    if (data[i] < 255) return true;
  }
  return false;
}

export async function optimizeImage(file: File): Promise<OptimizedImage> {
  const passthrough = (blob: Blob): OptimizedImage => ({
    blob,
    mime: file.type || 'application/octet-stream',
    width: 0,
    height: 0,
    passthrough: true,
  });

  // Formats que le canvas ne sait pas re-encoder proprement
  if (file.type === 'image/gif' || file.type === 'image/svg+xml' || file.type === '') {
    return passthrough(file);
  }

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    // Image illisible par le navigateur : on la téléverse telle quelle
    return passthrough(file);
  }

  try {
    const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return passthrough(file);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(bitmap, 0, 0, width, height);

    // PNG avec transparence : on reste en PNG (qualité sans perte, pas de fond blanc)
    if (file.type === 'image/png' && hasTransparency(canvas)) {
      const blob = await canvasToBlob(canvas, 'image/png');
      return blob.size <= file.size
        ? { blob, mime: 'image/png', width, height, passthrough: false }
        : passthrough(file);
    }

    // Sinon : JPEG progressif, contrainte "pas plus lourd que l'original"
    let quality = INITIAL_QUALITY;
    let blob = await canvasToBlob(canvas, 'image/jpeg', quality);
    while (blob.size > file.size && quality > MIN_QUALITY) {
      quality -= 0.1;
      blob = await canvasToBlob(canvas, 'image/jpeg', quality);
    }
    if (blob.size > file.size) {
      // Impossible de faire mieux que l'original (ex: petite image déjà compressée)
      return passthrough(file);
    }
    return { blob, mime: 'image/jpeg', width, height, passthrough: false };
  } finally {
    bitmap.close();
  }
}

/** Renvoie une description lisible de la taille (ex: "1,4 Mo"). */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1).replace('.', ',')} Mo`;
}
