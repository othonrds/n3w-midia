from lib import *
VW, VH = 1080, 1920
SELO_Y = VH - 340  # acima da zona de legenda/CTA do Reels

def zoom_frame(im, z, cx=0.5, cy=0.5, dx=0, dy=0):
    if abs(z - 1) < 1e-3 and dx == 0 and dy == 0: return im
    w, h = im.size
    cw, ch = w / z, h / z
    x0 = (w - cw) * cx - dx / z; y0 = (h - ch) * cy - dy / z
    x0 = max(0, min(w - cw, x0)); y0 = max(0, min(h - ch, y0))
    return im.resize((w, h), Image.BILINEAR, box=(x0, y0, x0 + cw, y0 + ch))

def punch(lt, amt=0.08, dur=0.18, push=0.025):
    return 1 + amt * (1 - ease(lt / dur)) + push * lt

def flash(im, lt, dur=0.1, col=(255, 255, 255)):
    if lt >= dur: return im
    a = 1 - lt / dur
    return Image.blend(im, Image.new('RGB', im.size, col), a * 0.85)

def pop_text(img, cx, y, text, size, fill, lt, delay=0.0, stroke=0, sfill=(0, 0, 0), dur=0.22, w='Bold'):
    x = (lt - delay) / dur
    if x <= 0: return
    s = ease_back(x) if x < 1 else 1.0
    sz = max(8, int(size * (0.6 + 0.4 * s)))
    d = ImageDraw.Draw(img)
    f = F(sz, w)
    tw, th, b = tsize(d, text, f)
    yy = y + (size - sz) * 0.5
    d.text((cx - tw / 2 - b[0], yy - b[1]), text, font=f, fill=fill, stroke_width=stroke, stroke_fill=sfill)

def shadow_text(img, cx, y, text, size, fill, w='Bold', stroke=0):
    lay = Image.new('RGBA', img.size, (0, 0, 0, 0)); d = ImageDraw.Draw(lay)
    f = F(size, w); tw, th, b = tsize(d, text, f)
    d.text((cx - tw / 2 - b[0], y - b[1] + 6), text, font=f, fill=(0, 0, 0, 180))
    lay = lay.filter(ImageFilter.GaussianBlur(8))
    img.paste(lay, (0, 0), lay)
    d2 = ImageDraw.Draw(img)
    d2.text((cx - tw / 2 - b[0], y - b[1]), text, font=f, fill=fill, stroke_width=stroke, stroke_fill=(0, 0, 0))

def vselo(img, y=SELO_Y):
    selo(img, y)

def card_scene(im, W=VW, H=VH, cw=900, ch=1170, cx=0.5, cy=0.35, top=300, bg_dark=0.4, scale=2.3, zoom=1.0):
    base = blur_bg(im, W, H, dark=bg_dark)
    c = cover(up(im, scale), cw, ch, cx, cy, zoom=zoom)
    paste_round(base, c, ((W - cw) // 2, top), r=40)
    return base

def rgb_split(im, px):
    if px <= 0: return im
    r, g, b = im.split()
    r = ImageChops_offset(r, px); b = ImageChops_offset(b, -px)
    return Image.merge('RGB', (r, g, b))

def ImageChops_offset(ch, px):
    from PIL import ImageChops
    return ImageChops.offset(ch, px, 0)

def light_leak(im, t, strength=0.35, seed=0):
    W, H = im.size
    rng = np.random.default_rng(seed)
    cx = W * (0.2 + 0.6 * (0.5 + 0.5 * math.sin(t * 1.7 + seed)))
    cy = H * (0.3 + 0.4 * (0.5 + 0.5 * math.cos(t * 1.3 + seed)))
    sw, sh = W // 8, H // 8
    yy, xx = np.mgrid[0:sh, 0:sw]
    dd = np.sqrt(((xx * 8 - cx) / (W * 0.6)) ** 2 + ((yy * 8 - cy) / (H * 0.5)) ** 2)
    a = np.clip(1 - dd, 0, 1) ** 2 * strength
    col = np.array([255, 140, 50]) * a[..., None]
    leak = Image.fromarray(col.astype(np.uint8)).resize((W, H), Image.BILINEAR)
    from PIL import ImageChops
    return ImageChops.add(im, leak)

def whip(a, b, x, W=VW):
    """horizontal whip-pan from a to b, x in [0,1]"""
    shift = int(ease(x) * W)
    fr = Image.new('RGB', a.size)
    fr.paste(a, (-shift, 0)); fr.paste(b, (W - shift, 0))
    k = int(40 * math.sin(math.pi * x)) + 1
    if k > 2:
        small = fr.resize((W // 4, fr.height // 4))
        small = small.filter(ImageFilter.BoxBlur(0))
        arr = np.asarray(small).astype(np.float32)
        kk = max(1, k // 4)
        ker = np.ones(kk) / kk
        arr = np.apply_along_axis(lambda m: np.convolve(m, ker, mode='same'), 1, arr)
        fr = Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8)).resize(fr.size, Image.BILINEAR)
    return fr

class TL:
    def __init__(self): self.s = []
    def add(self, a, b, fn): self.s.append((a, b, fn)); return self
    def __call__(self, t):
        for a, b, fn in self.s:
            if a <= t < b: return fn(t - a, b - a, t)
        a, b, fn = self.s[-1]; return fn(t - a, b - a, t)
