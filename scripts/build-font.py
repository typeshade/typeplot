"""Build the licensed IBM Plex SDF atlas offline; the browser only uploads it."""
from fontTools.ttLib import TTFont
from PIL import Image, ImageFont, ImageDraw
from scipy.ndimage import distance_transform_edt
from io import BytesIO
from pathlib import Path
import numpy as np

root = Path(__file__).resolve().parent.parent
scale = 3
cell = (30, 36)
columns = 132
spread = 4


def font(name):
    source = TTFont(root / 'website/public/fonts' / name)
    source.flavor = None
    buffer = BytesIO()
    source.save(buffer)
    buffer.seek(0)
    return ImageFont.truetype(buffer, 24 * scale)


latin = font('ibm-plex-mono-latin-400-normal.woff2')
korean = font('ibm-plex-sans-kr-400.woff2')
chars = (list(range(32, 256)) + list(range(0x370, 0x400))
         + list(range(0x3130, 0x3190)) + list(range(0xac00, 0xd7a4))
         + list(range(0x2000, 0x2300)) + [0xfffd])
atlas = Image.new('L', (columns * cell[0], ((len(chars) + columns - 1) // columns) * cell[1]))
for index, code in enumerate(chars):
    tile = Image.new('L', (cell[0] * scale, cell[1] * scale))
    ImageDraw.Draw(tile).text((3 * scale, round(28.5 * scale)), chr(code),
                             font=korean if 0x3130 <= code < 0xe000 else latin,
                             fill=255, anchor='ls')
    mask = np.asarray(tile) >= 128
    if mask.any():
        distance = (distance_transform_edt(mask) - distance_transform_edt(~mask)) / scale
        values = np.uint8(np.clip(0.5 + distance / (2 * spread), 0, 1) * 255)
        field = Image.fromarray(values).resize(cell, Image.Resampling.LANCZOS)
        atlas.paste(field, ((index % columns) * cell[0], (index // columns) * cell[1]))
atlas.save(root / 'assets/typeplot-font.png', optimize=True)
print({'glyphs': len(chars), 'size': atlas.size,
       'pngBytes': (root / 'assets/typeplot-font.png').stat().st_size})
