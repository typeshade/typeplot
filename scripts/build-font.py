from fontTools.ttLib import TTFont
from PIL import Image,ImageFont,ImageDraw
from io import BytesIO
from pathlib import Path
root=Path(__file__).resolve().parent.parent
def font(name):
 f=TTFont(root/'website/public/fonts'/name);f.flavor=None;b=BytesIO();f.save(b);b.seek(0);return ImageFont.truetype(b,16)
latin=font('ibm-plex-mono-latin-400-normal.woff2')
korean=font('ibm-plex-sans-kr-400.woff2')
chars=list(range(32,256))+list(range(0x370,0x400))+list(range(0x3130,0x3190))+list(range(0xac00,0xd7a4))+list(range(0x2000,0x2300))+[0xfffd]
w=2040;h=((len(chars)+101)//102)*24
im=Image.new('L',(w,h),0);d=ImageDraw.Draw(im)
for i,c in enumerate(chars):
 x=(i%102)*20;y=(i//102)*24
 d.text((x+2,y+19),chr(c),font=korean if c>=0x3130 and c<0xe000 else latin,fill=255,anchor='ls')
im.save(root/'assets/typeplot-font.png',optimize=True)
print({'glyphs':len(chars),'width':w,'height':h,'pngBytes':(root/'assets/typeplot-font.png').stat().st_size})
