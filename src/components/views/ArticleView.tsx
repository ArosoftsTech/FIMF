import React, { useState } from 'react';
import { ArrowLeft, Calendar, User, Clock, Share2, Tag, Check, Copy, ChevronRight, Newspaper } from 'lucide-react';
import { NewsArticle } from '@/src/data/fimfData';

interface ArticleViewProps {
  article: NewsArticle | null;
  onBack: () => void;
  /** Articles suggérés (même catégorie, autres ids). */
  related: NewsArticle[];
  onOpenArticle: (article: NewsArticle) => void;
}

/**
 * Page dédiée d'un article (plein écran, dans le layout principal).
 * Remplace la lecture en popup : URL partageable, mise en page éditoriale
 * large, suggestions d'articles de la même catégorie.
 */
export const ArticleView: React.FC<ArticleViewProps> = ({
  article,
  onBack,
  related,
  onOpenArticle,
}) => {
  const [copied, setCopied] = useState(false);

  if (!article) return null;

  const articleUrl = typeof window !== 'undefined' ? window.location.href : '';
  const shareText = `${article.title} - Fédération Ivoirienne de Mini-Football (FIMF)`;

  const handleShareFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(articleUrl)}&quote=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank', 'noopener,noreferrer,width=600,height=500');
  };

  const handleShareTwitter = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(articleUrl)}&hashtags=FIMF,MiniFootball,CotedIvoire`;
    window.open(url, '_blank', 'noopener,noreferrer,width=600,height=500');
  };

  const handleShareWhatsApp = () => {
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(`${shareText}\n${articleUrl}`)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleCopyLink = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(articleUrl);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback silencieux
    }
  };

  return (
    <div className="bg-white min-h-screen">
      {/* Barre de retour */}
      <div className="bg-[#004724] text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-3">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider hover:text-emerald-200 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour aux actualités
          </button>
          <span className="hidden sm:inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-emerald-200">
            <Newspaper className="w-3.5 h-3.5" />
            Actualités FIMF
          </span>
        </div>
      </div>

      {/* Bannière image */}
      <div className="relative h-64 sm:h-80 md:h-[420px] w-full overflow-hidden bg-slate-900">
        <img
          src={article.image}
          alt={article.title}
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent" />
        <div className="absolute bottom-6 left-0 right-0">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 text-white">
            <span className="inline-block px-2.5 py-1 bg-[#ea580c] text-white text-[11px] font-bold rounded uppercase mb-2">
              {article.category}
            </span>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black leading-tight drop-shadow-sm">
              {article.title}
            </h1>
          </div>
        </div>
      </div>

      {/* Métadonnées + partage rapide */}
      <div className="bg-slate-50 border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 font-medium">
              <Calendar className="w-3.5 h-3.5 text-[#006039]" />
              {article.dateStr}
            </span>
            <span className="flex items-center gap-1.5 font-medium">
              <User className="w-3.5 h-3.5 text-[#006039]" />
              {article.author}
            </span>
            <span className="flex items-center gap-1.5 text-slate-500">
              <Clock className="w-3.5 h-3.5" />
              {article.readTime}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleShareWhatsApp}
              title="Partager sur WhatsApp"
              aria-label="Partager sur WhatsApp"
              className="w-7 h-7 rounded-full bg-[#25D366] text-white flex items-center justify-center hover:scale-105 transition-transform cursor-pointer"
            >
              <WhatsAppIcon className="w-3.5 h-3.5 fill-current" />
            </button>
            <button
              onClick={handleShareFacebook}
              title="Partager sur Facebook"
              aria-label="Partager sur Facebook"
              className="w-7 h-7 rounded-full bg-[#1877F2] text-white flex items-center justify-center hover:scale-105 transition-transform cursor-pointer"
            >
              <FacebookIcon className="w-3.5 h-3.5 fill-current" />
            </button>
            <button
              onClick={handleShareTwitter}
              title="Partager sur X (Twitter)"
              aria-label="Partager sur X (Twitter)"
              className="w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center hover:scale-105 transition-transform cursor-pointer"
            >
              <TwitterXIcon className="w-3.5 h-3.5 fill-current" />
            </button>
          </div>
        </div>
      </div>

      {/* Corps de l'article */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <p className="font-semibold text-slate-900 text-base sm:text-lg border-l-4 border-[#ea580c] pl-4 italic bg-orange-50/50 py-2.5 rounded-r">
          {article.excerpt}
        </p>

        <div className="mt-6 space-y-5">
          {article.content.map((paragraph, index) => (
            <p key={index} className="text-slate-700 text-sm sm:text-base leading-relaxed">
              {paragraph}
            </p>
          ))}
        </div>

        {/* Partage */}
        <div className="mt-10 pt-6 border-t border-slate-200">
          <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-slate-900 font-black text-xs sm:text-sm uppercase tracking-tight">
                <Share2 className="w-4 h-4 text-[#ea580c]" />
                <span>Partager cet article officiel FIMF</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Faites rayonner le Mini-Football ivoirien auprès de votre communauté
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleShareWhatsApp}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#25D366] hover:bg-[#20ba59] text-white text-xs font-bold transition-all shadow-xs hover:shadow cursor-pointer select-none"
                aria-label="Partager sur WhatsApp"
              >
                <WhatsAppIcon className="w-4 h-4 fill-current" />
                <span>WhatsApp</span>
              </button>
              <button
                onClick={handleShareFacebook}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#1877F2] hover:bg-[#1466d3] text-white text-xs font-bold transition-all shadow-xs hover:shadow cursor-pointer select-none"
                aria-label="Partager sur Facebook"
              >
                <FacebookIcon className="w-4 h-4 fill-current" />
                <span>Facebook</span>
              </button>
              <button
                onClick={handleShareTwitter}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-black hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-xs hover:shadow cursor-pointer select-none"
                aria-label="Partager sur X (Twitter)"
              >
                <TwitterXIcon className="w-4 h-4 fill-current" />
                <span>X (Twitter)</span>
              </button>
              <button
                onClick={handleCopyLink}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                  copied
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                    : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                }`}
                title="Copier le lien direct"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Copié !</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-500" />
                    <span>Copier</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Tags */}
        <div className="mt-6 flex flex-wrap items-center gap-2">
          <Tag className="w-3.5 h-3.5 text-slate-400" />
          {article.tags.map((tag, idx) => (
            <span
              key={idx}
              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs rounded-md transition-colors"
            >
              #{tag}
            </span>
          ))}
        </div>

        {/* Suggestions */}
        {related.length > 0 && (
          <div className="mt-12 pt-6 border-t border-slate-200">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight mb-4">
              À lire également
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {related.map((r) => (
                <button
                  key={r.id}
                  onClick={() => onOpenArticle(r)}
                  className="text-left bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-md hover:border-slate-300 transition-all cursor-pointer group"
                >
                  <div className="h-32 overflow-hidden bg-slate-100">
                    <img
                      src={r.image}
                      alt={r.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="p-3.5">
                    <span className="text-[9px] font-black uppercase tracking-wider text-[#ea580c]">
                      {r.category}
                    </span>
                    <h3 className="text-xs font-black text-slate-900 mt-1 leading-snug line-clamp-2">
                      {r.title}
                    </h3>
                    <span className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-bold text-slate-400">
                      Lire <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// SVG Icons for Social Networks
const WhatsAppIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.664-.698c.969.541 1.761.813 2.796.813 3.183 0 5.769-2.587 5.77-5.766.001-3.182-2.585-5.8-5.77-5.8zm3.393 8.305c-.149.42-1.077 1.139-1.42 1.196-.341.056-.632.062-2.122-.524-1.898-.747-3.08-2.698-3.174-2.823-.095-.125-.765-1.018-.765-1.942 0-.923.486-1.378.658-1.564.172-.187.376-.234.502-.234.125 0 .251.002.361.007.116.006.27-.044.423.324.156.376.533 1.298.579 1.393.047.094.079.204.016.329-.063.125-.094.204-.188.313-.094.11-.198.245-.283.329-.094.094-.192.196-.083.383.11.188.489.807 1.05 1.306.722.643 1.33.842 1.519.936.188.094.298.079.408-.047.11-.125.47-.549.596-.737.125-.188.251-.157.423-.094.173.063 1.099.518 1.287.612.188.094.313.141.36.22.047.078.047.454-.102.874zM12 2C6.477 2 2 6.477 2 12c0 1.891.524 3.66 1.434 5.174L2 22l4.982-1.307C8.428 21.528 10.155 22 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18.2c-1.637 0-3.167-.47-4.462-1.282l-.32-.2-2.962.777.79-2.887-.208-.332C3.963 15.011 3.5 13.549 3.5 12c0-4.687 3.813-8.5 8.5-8.5s8.5 3.813 8.5 8.5-3.813 8.5-8.5 8.5z" />
  </svg>
);

const FacebookIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

const TwitterXIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);
