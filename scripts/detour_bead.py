"""Detour a bead photo : remove white background + crop tight + pad square + resize.
Usage:  python scripts/detour_bead.py <input.jpg> <output.png> [--size 1500]
"""
import sys
from pathlib import Path
from PIL import Image
from rembg import remove

def detour(src: Path, dst: Path, size: int = 1500):
    raw = src.read_bytes()
    cut = remove(raw, alpha_matting=True, alpha_matting_foreground_threshold=240)
    img = Image.open(__import__('io').BytesIO(cut)).convert('RGBA')

    # Tight crop on the alpha bounding box
    bbox = img.getbbox()
    if bbox is None:
        raise SystemExit('No subject detected')
    img = img.crop(bbox)

    # Pad to square with transparent
    w, h = img.size
    s = max(w, h)
    canvas = Image.new('RGBA', (s, s), (0, 0, 0, 0))
    canvas.paste(img, ((s - w) // 2, (s - h) // 2))

    # Downscale to target if too big
    if s > size:
        canvas = canvas.resize((size, size), Image.LANCZOS)

    dst.parent.mkdir(parents=True, exist_ok=True)
    canvas.save(dst, optimize=True)
    print(f'OK -> {dst}  ({canvas.size[0]}x{canvas.size[1]})')

if __name__ == '__main__':
    src = Path(sys.argv[1])
    dst = Path(sys.argv[2])
    size = int(sys.argv[sys.argv.index('--size') + 1]) if '--size' in sys.argv else 1500
    detour(src, dst, size)
