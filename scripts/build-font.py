"""Bake hinted glyph sizes offline with X-GIS's original SDF generator."""
from fontTools.ttLib import TTFont
from PIL import Image, ImageFont, ImageDraw
from io import BytesIO
from pathlib import Path
import subprocess

root = Path(__file__).resolve().parent.parent
columns = 132
cell = (30, 36)


def font_data(name):
    source = TTFont(root / 'website/public/fonts' / name)
    source.flavor = None
    buffer = BytesIO()
    source.save(buffer)
    return buffer.getvalue()


latin_data = font_data('ibm-plex-mono-latin-400-normal.woff2')
korean_data = font_data('ibm-plex-sans-kr-400.woff2')
chars = (list(range(32, 256)) + list(range(0x370, 0x400))
         + list(range(0x3130, 0x3190)) + list(range(0xac00, 0xd7a4))
         + list(range(0x2000, 0x2300)) + [0xfffd])


def fields(codepoints, size, dimensions):
    latin = ImageFont.truetype(BytesIO(latin_data), size)
    korean = ImageFont.truetype(BytesIO(korean_data), size)
    alpha = bytearray()
    for code in codepoints:
        tile = Image.new('L', dimensions)
        # Rasterize at the native bucket size to preserve FreeType hinting and
        # partial coverage. Resampling alpha first produces SDF halos/ringing.
        ImageDraw.Draw(tile).text((3 * size / 24, 28.5 * size / 24), chr(code),
                                 font=korean if 0x3130 <= code < 0xe000 else latin,
                                 fill=255, anchor='ls')
        alpha.extend(tile.tobytes())
    result = subprocess.run(['node', str(root / 'scripts/build-font-sdf.mjs'),
                             str(dimensions[0]), str(dimensions[1]), str(size / 3)],
                            input=alpha, stdout=subprocess.PIPE, check=True)
    length = dimensions[0] * dimensions[1]
    return [Image.frombytes('L', dimensions, result.stdout[i * length:(i + 1) * length])
            for i in range(len(codepoints))]


base_height = ((len(chars) + columns - 1) // columns) * cell[1]
# Native 12px and 48px ASCII buckets complement the 24px general Unicode atlas.
# Only append compact strips: no second texture or dynamic rasterizer is needed.
atlas = Image.new('L', (columns * cell[0], base_height + 18 + 144))
for index, field in enumerate(fields(chars, 24, cell)):
    atlas.paste(field, ((index % columns) * cell[0], (index // columns) * cell[1]))
for index, field in enumerate(fields(list(range(32, 128)), 12, (15, 18))):
    atlas.paste(field, (index * 15, base_height))
for index, field in enumerate(fields(list(range(32, 128)), 48, (60, 72))):
    atlas.paste(field, ((index % 66) * 60, base_height + 18 + (index // 66) * 72))
atlas.save(root / 'assets/typeplot-font.png', optimize=True)
subprocess.run(['python3', str(root / 'scripts/build-font-base.py')], check=True)
print({'glyphs': len(chars), 'size': atlas.size, 'sdf': 'X-GIS computeSDF, native 12/24/48px buckets',
       'pngBytes': (root / 'assets/typeplot-font.png').stat().st_size})
