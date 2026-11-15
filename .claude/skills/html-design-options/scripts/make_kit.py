"""Copy real images into mockups/kit/img as webp (<=1600px) and list them in kit/images.txt.

    python mockups/tools/make_kit.py --src path/to/product-renders --src path/to/scenes [--max 1600]

Each --src folder lands in kit/img/<folder-name>/ (sub-folders are flattened into the file name). Re-run any time;
existing files are overwritten. Write kit/content.json yourself (templates/content.template.json).
"""
import argparse
from pathlib import Path

from PIL import Image

KIT = Path(__file__).resolve().parents[1] / "kit"
EXT = {".jpg", ".jpeg", ".png", ".webp"}


def put(src: Path, dest: Path, max_edge: int) -> Path:
    dest.parent.mkdir(parents=True, exist_ok=True)
    im = Image.open(src)
    if im.mode not in ("RGB", "RGBA"):
        im = im.convert("RGBA" if "A" in im.getbands() else "RGB")
    w, h = im.size
    s = min(1.0, max_edge / max(w, h))
    if s < 1:
        im = im.resize((round(w * s), round(h * s)), Image.LANCZOS)
    out = dest.with_suffix(".webp")
    im.save(out, "WEBP", quality=82, method=5)
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--src", action="append", required=True, help="image folder (repeatable)")
    ap.add_argument("--max", type=int, default=1600)
    a = ap.parse_args()
    made = []
    for s in a.src:
        root = Path(s)
        for p in sorted(root.rglob("*")):
            if p.suffix.lower() in EXT and "_raw" not in p.parts:
                rel = p.relative_to(root)
                name = "-".join(rel.with_suffix("").parts)
                made.append(put(p, KIT / "img" / root.name / name, a.max))
    listing = sorted({str(p.relative_to(KIT)).replace("\\", "/") for p in (KIT / "img").rglob("*.webp")})
    (KIT / "images.txt").write_text("\n".join(listing) + "\n", encoding="utf-8")
    print(f"{len(made)} images written, {len(listing)} in kit/images.txt")


if __name__ == "__main__":
    main()
