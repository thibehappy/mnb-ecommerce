"""Quick scan to find images dominated by translucent red beads on white bg."""
from pathlib import Path
from PIL import Image

src = Path(r"C:/Users/thibe/Downloads/swisstransfer_63592a26-1434-4f99-a396-bb5d59120bf4")
results = []
for p in sorted(src.glob("*.JPG")):
    try:
        img = Image.open(p).convert("RGB")
        img.thumbnail((80, 60))
        pixels = list(img.getdata())
        red = sum(1 for r, g, b in pixels if r > 150 and g < 100 and b < 100)
        if red > 5:
            results.append((red, p.name))
    except Exception as e:
        print("err", p.name, e)
results.sort(reverse=True)
for n, name in results[:10]:
    print(f"{n:4d}  {name}")
