from PIL import Image, ImageDraw, ImageFont, ImageFilter
import os, sys
OUT = sys.argv[1]
W, H = 1080, 1350
BG = (13, 13, 18); CARD = (26, 26, 34); LINE = (48, 48, 62)
TXT = (244, 244, 247); MUT = (163, 163, 178); ACC = (124, 242, 197); AC2 = (139, 123, 255)
FD = "/usr/share/fonts/opentype/inter/"
def F(w, s):
    return ImageFont.truetype(FD + {"b": "Inter-Bold.otf", "x": "Inter-ExtraBold.otf", "m": "Inter-Medium.otf", "r": "Inter-Regular.otf", "s": "Inter-SemiBold.otf"}[w], s)

def base():
    im = Image.new("RGB", (W, H), BG)
    glow = Image.new("RGB", (W, H), BG)
    g = ImageDraw.Draw(glow)
    g.ellipse((-200, -250, 700, 500), fill=(40, 34, 90))
    g.ellipse((600, 900, 1350, 1600), fill=(20, 70, 60))
    glow = glow.filter(ImageFilter.GaussianBlur(160))
    return glow, ImageDraw.Draw(glow)

def ctext(d, y, text, font, fill=TXT, gap=10):
    for line in text.split("\n"):
        w = d.textlength(line, font=font)
        d.text(((W - w) / 2, y), line, font=font, fill=fill)
        y += font.size + gap
    return y

def footer(d, cta="Step-by-step guide  ·  Tap Learn more"):
    d.rounded_rectangle((90, 1190, 990, 1280), 22, fill=ACC)
    f = F("b", 36); w = d.textlength(cta, font=f)
    d.text(((W - w) / 2, 1214), cta, font=f, fill=BG)

def tag(d, y, text):
    f = F("s", 26); w = d.textlength(text, font=f)
    d.rounded_rectangle(((W - w) / 2 - 24, y, (W + w) / 2 + 24, y + 52), 26, outline=LINE, width=2)
    d.text(((W - w) / 2, y + 11), text, font=f, fill=ACC)

def wire_figure(d, cx, cy, s):
    # abstract wireframe "person" made of shapes, no face
    for i in range(7):
        r = s * (1 - i * 0.11)
        d.ellipse((cx - r * 0.55, cy - s * 1.15 - r * 0.62 + s * 0.6, cx + r * 0.55, cy - s * 1.15 + r * 0.62 + s * 0.6), outline=AC2 if i % 2 else ACC, width=2)
    d.chord((cx - s * 1.1, cy + s * 0.25, cx + s * 1.1, cy + s * 2.4), 180, 360, outline=ACC, width=3)
    for k in range(-4, 5):
        d.line((cx + k * s * 0.22, cy + s * 0.5, cx + k * s * 0.26, cy + s * 1.32), fill=LINE, width=2)

# 1 revelation
im, d = base()
tag(d, 110, "MADE 100% WITH AI")
ctext(d, 200, "This person\ndoesn't exist.", F("x", 104), gap=8)
d.rounded_rectangle((240, 470, 840, 1000), 30, fill=CARD, outline=LINE, width=2)
wire_figure(d, 540, 700, 150)
d.rounded_rectangle((280, 920, 560, 970), 14, fill=BG)
d.text((300, 930), "AI-generated", font=F("s", 26), fill=ACC)
ctext(d, 1040, "Face, voice and video: all created with AI.\nLearn the exact workflow.", F("m", 36), MUT)
footer(d); im.save(f"{OUT}/vg-01-nao-existo.png")

# 2 describe it
im, d = base()
tag(d, 110, "NO EDITING SKILLS NEEDED")
ctext(d, 200, "Describe it.\nAI creates it.", F("x", 104), gap=8)
d.rounded_rectangle((110, 480, 970, 620), 24, fill=CARD, outline=ACC, width=3)
d.text((150, 512), "Prompt", font=F("s", 24), fill=MUT)
d.text((150, 550), "\"product photo, soft light, white desk\"", font=F("m", 34), fill=TXT)
d.polygon([(520, 650), (560, 650), (540, 690)], fill=ACC)
d.rounded_rectangle((250, 715, 830, 1080), 26, fill=CARD, outline=LINE, width=2)
# generated mockup: desk + product shapes
d.rectangle((270, 930, 810, 1060), fill=(220, 220, 228))
d.rounded_rectangle((470, 790, 610, 950), 18, fill=AC2)
d.rounded_rectangle((500, 760, 580, 800), 10, fill=(90, 80, 200))
d.ellipse((450, 945, 630, 975), fill=(180, 180, 190))
d.ellipse((680, 735, 790, 845), fill=(255, 240, 200))
ctext(d, 1105, "Photos, cuts, captions and animation.", F("m", 36), MUT)
footer(d); im.save(f"{OUT}/vg-02-descreva.png")

# 3 no camera
im, d = base()
tag(d, 110, "WHAT YOU DON'T NEED")
y = 230
for t in ["Camera", "Studio", "Video editor", "Pro software"]:
    f = F("x", 96); w = d.textlength(t, font=f)
    x = (W - w) / 2
    d.text((x, y), t, font=f, fill=MUT)
    d.line((x - 10, y + 62, x + w + 10, y + 52), fill=(255, 107, 107), width=10)
    y += 150
ctext(d, 870, "Just your phone and\nplain English.", F("x", 76), ACC, gap=6)
footer(d); im.save(f"{OUT}/vg-03-sem-camera.png")

# 4 captions phone
im, d = base()
tag(d, 110, "REELS · TIKTOK · SHORTS")
ctext(d, 200, "Captions and cuts\nin minutes.", F("x", 92), gap=8)
px, py, pw, ph = 330, 450, 420, 700
d.rounded_rectangle((px, py, px + pw, py + ph), 50, fill=(8, 8, 12), outline=LINE, width=6)
d.rounded_rectangle((px + 20, py + 20, px + pw - 20, py + ph - 20), 36, fill=(30, 28, 60))
for i, c in enumerate([(60, 50, 120), (40, 90, 110), (80, 40, 100)]):
    d.rectangle((px + 20, py + 20 + i * 190, px + pw - 20, py + 210 + i * 190), fill=c)
d.rounded_rectangle((px + 50, py + 470, px + pw - 50, py + 540), 12, fill=(255, 255, 255))
f = F("x", 34); t = "AI DID THIS EDIT"; w = d.textlength(t, font=f)
d.text((px + (pw - w) / 2, py + 486), t, font=f, fill=BG)
# timeline
d.rounded_rectangle((px + 40, py + 590, px + pw - 40, py + 640), 10, fill=CARD)
for k in range(5):
    d.rectangle((px + 50 + k * 66, py + 598, px + 104 + k * 66, py + 632), fill=ACC if k % 2 == 0 else AC2)
footer(d); im.save(f"{OUT}/vg-04-legendas.png")

# 5 cost comparison (no exaggerated numbers)
im, d = base()
tag(d, 110, "DO THE MATH")
ctext(d, 200, "Stop paying\nper edit.", F("x", 104), gap=8)
rows = [("Photo shoot", "pay every session"), ("Video editor", "pay every video"), ("Pro software", "monthly + months to learn")]
y = 490
for a, b in rows:
    d.rounded_rectangle((110, y, 970, y + 120), 20, fill=CARD, outline=LINE, width=2)
    d.text((150, y + 22), a, font=F("b", 42), fill=TXT)
    d.text((150, y + 74), b, font=F("r", 28), fill=MUT)
    y += 140
d.rounded_rectangle((110, y + 10, 970, y + 160), 20, fill=(20, 60, 50), outline=ACC, width=3)
d.text((150, y + 36), "AI Photo & Video Kit", font=F("b", 42), fill=ACC)
d.text((150, y + 92), "one-time US$ 9.90, learn to do it yourself", font=F("m", 30), fill=TXT)
footer(d); im.save(f"{OUT}/vg-05-pare-de-pagar.png")
print("ok")
