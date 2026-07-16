"""Create non-destructive alpha cutouts from the generated pale-background sprites."""
from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets"


def cutout(source: Path, destination: Path) -> None:
    image = Image.open(source).convert("RGBA")
    rgb = np.asarray(image)[..., :3]
    r, g, b = (rgb[..., i].astype(np.int16) for i in range(3))
    hi = rgb.max(axis=2).astype(np.int16)
    lo = rgb.min(axis=2).astype(np.int16)

    # Generated sprite backdrops are connected fields of white, cream and pale blue.
    # Connectivity protects similarly light pixels inside the outlined character.
    candidate = (
        ((lo > 198) & ((hi - lo) < 82))
        | ((r > 188) & (g > 202) & (b > 218) & ((b - r) < 86))
        | ((r > 226) & (g > 218) & (b > 207))
    )
    height, width = candidate.shape
    background = np.zeros((height, width), dtype=bool)
    queue: deque[tuple[int, int]] = deque()

    def seed(y: int, x: int) -> None:
        if candidate[y, x] and not background[y, x]:
            background[y, x] = True
            queue.append((y, x))

    for x in range(width):
        seed(0, x)
        seed(height - 1, x)
    for y in range(height):
        seed(y, 0)
        seed(y, width - 1)

    while queue:
        y, x = queue.popleft()
        if y and candidate[y - 1, x] and not background[y - 1, x]:
            background[y - 1, x] = True
            queue.append((y - 1, x))
        if y + 1 < height and candidate[y + 1, x] and not background[y + 1, x]:
            background[y + 1, x] = True
            queue.append((y + 1, x))
        if x and candidate[y, x - 1] and not background[y, x - 1]:
            background[y, x - 1] = True
            queue.append((y, x - 1))
        if x + 1 < width and candidate[y, x + 1] and not background[y, x + 1]:
            background[y, x + 1] = True
            queue.append((y, x + 1))

    matte = Image.fromarray((~background * 255).astype(np.uint8), "L")
    matte = matte.filter(ImageFilter.GaussianBlur(0.85))
    result = image.copy()
    result.putalpha(matte)
    result.save(destination, optimize=True)

    alpha = np.asarray(matte)
    coverage = float(np.count_nonzero(alpha > 16)) / alpha.size
    corners = [int(alpha[0, 0]), int(alpha[0, -1]), int(alpha[-1, 0]), int(alpha[-1, -1])]
    print(f"{destination.name}: coverage={coverage:.3f}, corners={corners}")


for path in sorted(ASSETS.glob("xiongli*.png")):
    if path.stem.endswith("-cutout"):
        continue
    cutout(path, path.with_name(f"{path.stem}-cutout.png"))
