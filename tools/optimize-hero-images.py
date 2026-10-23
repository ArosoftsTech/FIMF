"""
Optimise les images du hero (audit sécurité FIMF, constat 16 — LCP mobile).

Pour chaque JPEG source :
  - ré-encodage JPEG progressif (qualité 78, optimisé) → remplace le fichier d'origine ;
  - variantes WebP (640 / 1024 / largeur d'origine) ;
  - variantes JPEG redimensionnées (640 / 1024 / largeur d'origine) pour le repli <img> ;
  - un manifeste JSON (dimensions) consommé par src/lib/heroImages.ts.

Usage :  python tools/optimize-hero-images.py
Idempotent : le script peut être rejoué sur les fichiers déjà optimisés.
"""

import json
import os
from PIL import Image

IMAGES_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "src", "assets", "images")
IMAGES_DIR = os.path.normpath(IMAGES_DIR)

# Largeurs servies : mobile, tablette, pleine largeur.
TARGET_WIDTHS = (640, 1024)

JPEG_QUALITY = 78
WEBP_QUALITY = 72


def save_jpeg(img: Image.Image, path: str) -> int:
    img.save(path, "JPEG", quality=JPEG_QUALITY, optimize=True, progressive=True)
    return os.path.getsize(path)


def save_webp(img: Image.Image, path: str) -> int:
    img.save(path, "WEBP", quality=WEBP_QUALITY, method=6)
    return os.path.getsize(path)


def main() -> None:
    sources = sorted(f for f in os.listdir(IMAGES_DIR) if f.lower().endswith(".jpg") and "_w" not in f)
    manifest = {}

    for name in sources:
        path = os.path.join(IMAGES_DIR, name)
        base = os.path.splitext(name)[0]
        with Image.open(path) as src:
            img = src.convert("RGB")
            full_w, full_h = img.size

            widths = sorted({*TARGET_WIDTHS, full_w})
            variants = {}

            for w in widths:
                ratio = w / full_w
                h = max(1, round(full_h * ratio))
                resized = img.resize((w, h), Image.LANCZOS) if w != full_w else img

                jpg_path = os.path.join(IMAGES_DIR, f"{base}_w{w}.jpg")
                webp_path = os.path.join(IMAGES_DIR, f"{base}_w{w}.webp")
                jpg_size = save_jpeg(resized, jpg_path)
                webp_size = save_webp(resized, webp_path)
                variants[str(w)] = {"w": w, "h": h, "jpg": jpg_size, "webp": webp_size}

            # Remplace le JPEG d'origine par la version optimisée (même chemin,
            # les imports existants restent valides).
            full_jpg = save_jpeg(img, path)

            manifest[name] = {
                "base": base,
                "width": full_w,
                "height": full_h,
                "jpeg": full_jpg,
                "variants": variants,
            }
            print(
                f"{name}: {full_w}x{full_h} "
                f"JPEG {full_jpg // 1024} Ko | "
                f"WebP {variants[str(full_w)]['webp'] // 1024} Ko"
            )

    # Le manifeste est un artefact de generation : il reste hors de src/ pour
    # ne pas polluer le dossier compile par Vite.
    manifest_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "hero-images-manifest.json")
    with open(manifest_path, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2, sort_keys=True)
    print(f"\nManifeste écrit : {manifest_path}")

    total_jpg = sum(m["jpeg"] for m in manifest.values())
    total_webp = sum(v["webp"] for m in manifest.values() for v in m["variants"].values())
    print(f"Poids total JPEG pleine largeur : {total_jpg // 1024} Ko")
    print(f"Poids total WebP (3 largeurs) : {total_webp // 1024} Ko")


if __name__ == "__main__":
    main()
