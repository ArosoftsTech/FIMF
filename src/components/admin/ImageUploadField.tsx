import { useRef, useState } from 'react';
import { UploadCloud, Loader2, ImageIcon, X, CheckCircle2 } from 'lucide-react';
import { uploadMedia, mediaUrl } from '../../lib/fimfApi';
import { formatBytes } from '../../lib/imageUtils';

interface ImageUploadFieldProps {
  /** Valeur actuelle : URL complète ou référence bucket. */
  value: string;
  /** Appelé avec l'URL publique complète de l'image uploadée. */
  onChange: (url: string) => void;
  label?: string;
}

/**
 * Champ de formulaire : aperçu de l'image + bouton d'upload vers le bucket
 * fimf-media. Remplace la saisie manuelle d'URL.
 */
export function ImageUploadField({ value, onChange, label = 'Image' }: ImageUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadInfo, setUploadInfo] = useState<string | null>(null);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setUploadError(null);
    setUploadInfo(null);
    if (!file.type.startsWith('image/')) {
      setUploadError('Le fichier doit être une image (JPG, PNG, WebP…).');
      return;
    }
    if (file.size > 25 * 1024 * 1024) {
      setUploadError('Image trop lourde (max 25 Mo avant optimisation).');
      return;
    }
    setUploading(true);
    setUploadInfo(null);
    try {
      const result = await uploadMedia(file);
      onChange(mediaUrl(result.ref));
      if (result.passthrough) {
        // Fichier envoyé tel quel : déjà optimisé ou format non recompressable
        setUploadInfo(`${file.name} — ${formatBytes(result.finalSize)} envoyée telle quelle ✓`);
      } else {
        const saved = Math.max(0, 1 - result.finalSize / result.originalSize);
        const percent = Math.round(saved * 100);
        setUploadInfo(
          `${result.width}×${result.height}px — ` +
          `${formatBytes(result.originalSize)} → ${formatBytes(result.finalSize)}` +
          (percent > 0 ? ` (${percent}% plus léger)` : ' (déjà optimale)') +
          ' ✓'
        );
      }
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : 'Échec de l\'upload.');
    } finally {
      setUploading(false);
    }
  };

  const displayUrl = value ? mediaUrl(value) : '';

  return (
    <div>
      <label className="block text-slate-700 mb-1 font-bold">{label}</label>
      <div className="flex items-start gap-3">
        {/* Aperçu */}
        <div className="w-24 h-24 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0 flex items-center justify-center">
          {displayUrl ? (
            <img src={displayUrl} alt="Aperçu" className="w-full h-full object-cover" />
          ) : (
            <ImageIcon className="w-8 h-8 text-slate-300" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              handleFile(e.target.files?.[0]);
              e.target.value = '';
            }}
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={uploading}
              onClick={() => inputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-bold transition-colors cursor-pointer disabled:opacity-50"
            >
              {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UploadCloud className="w-3.5 h-3.5" />}
              {uploading ? 'Envoi...' : 'Choisir une image'}
            </button>
            {value && (
              <button
                type="button"
                onClick={() => onChange('')}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-600 border border-slate-200 font-bold transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                Retirer
              </button>
            )}
          </div>
          {uploadError && <p className="text-red-600 mt-2">{uploadError}</p>}
          {uploadInfo && (
            <p className="text-emerald-600 mt-2 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              {uploadInfo}
            </p>
          )}
          {value && (
            <p className="text-[10px] text-slate-400 mt-1.5 truncate">
              {displayUrl}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
