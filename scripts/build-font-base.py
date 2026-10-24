"""Extract common glyphs without changing the canonical atlas layout or pixels."""
from pathlib import Path
from PIL import Image

root = Path(__file__).resolve().parent.parent
source = Image.open(root / 'assets/typeplot-font.png')
base = Image.new(source.mode, source.size)
# Keep Latin, Greek, Jamo, symbols, the replacement glyph and all hinted ASCII
# buckets. Only precomposed Hangul syllables are deferred to the full resource.
for start, end in [(0, 464), (11636, 12405)]:
    for index in range(start, end):
        x, y = (index % 132) * 30, (index // 132) * 36
        box = (x, y, x + 30, y + 36)
        base.paste(source.crop(box), (x, y))
base.paste(source.crop((0, 3384, source.width, source.height)), (0, 3384))
target = root / 'assets/typeplot-font-base.png'
base.save(target, optimize=True)
print({'size': base.size, 'pngBytes': target.stat().st_size})
