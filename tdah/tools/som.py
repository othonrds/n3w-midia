"""Trilha curta para anuncios do Reflex (so numpy + wave).
uso: python3 som.py DUR OUT.wav [--flips 8.47,12.3] [--end 18.2] [--bpm 124] [--calm]
Gera: batida eletronica + baixo + arpejo, whoosh/impacto nas viradas de regra,
'ding' no cartao final. --calm = versao suave (sem kick forte), para ASMR/ilusao.
"""
import sys, wave, struct, numpy as np

SR = 44100
def arg(name, default=None):
    if name in sys.argv:
        return sys.argv[sys.argv.index(name) + 1]
    return default

DUR = float(sys.argv[1]); OUT = sys.argv[2]
BPM = float(arg('--bpm', 124)); CALM = '--calm' in sys.argv
FLIPS = [float(x) for x in arg('--flips', '').split(',') if x]
END = arg('--end'); END = float(END) if END else None
N = int(DUR * SR); L = np.zeros(N); R = np.zeros(N)
beat = 60.0 / BPM
rng = np.random.default_rng(7)

def add(sig, t, gain=1.0, pan=0.0):
    i = int(t * SR)
    if i >= N: return
    s = sig[: N - i] * gain
    L[i:i + len(s)] += s * (1 - max(pan, 0))
    R[i:i + len(s)] += s * (1 + min(pan, 0))

def env(n, a=0.002, d=0.2):
    t = np.arange(n) / SR
    e = np.minimum(1, t / a) * np.exp(-t / d)
    return e

def lp(x, cut):
    a = np.exp(-2 * np.pi * cut / SR); y = np.zeros_like(x); p = 0.0
    for i in range(len(x)):
        p = (1 - a) * x[i] + a * p; y[i] = p
    return y

def kick():
    n = int(0.35 * SR); t = np.arange(n) / SR
    f = 50 + 110 * np.exp(-t * 28)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, 0.001, 0.16)

def hat():
    n = int(0.05 * SR); x = rng.standard_normal(n); x = np.diff(x, prepend=0)
    return x * env(n, 0.0005, 0.012) * 0.5

def clap():
    n = int(0.18 * SR); x = rng.standard_normal(n)
    return lp(x, 3000) * env(n, 0.001, 0.05)

def tone(freq, dur, harm=(1, .5, .25), d=0.25, wave_='sine'):
    n = int(dur * SR); t = np.arange(n) / SR; s = np.zeros(n)
    for k, h in enumerate(harm, 1):
        s += h * np.sin(2 * np.pi * freq * k * t)
    return s * env(n, 0.003, d)

def bass(freq, dur):
    n = int(dur * SR); t = np.arange(n) / SR
    saw = 2 * ((freq * t) % 1) - 1
    return lp(saw, 420) * env(n, 0.004, dur * 0.6)

def whoosh(dur=0.9):
    n = int(dur * SR); x = rng.standard_normal(n); t = np.arange(n) / SR
    cut = 300 + 6000 * (t / dur) ** 2
    y = np.zeros(n); p = 0.0
    for i in range(n):
        a = np.exp(-2 * np.pi * cut[i] / SR); p = (1 - a) * x[i] + a * p; y[i] = p
    return y * (t / dur) ** 1.5 * 0.9

def impact():
    n = int(0.8 * SR); t = np.arange(n) / SR
    f = 40 + 80 * np.exp(-t * 10)
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, 0.001, 0.35)
    return s + lp(rng.standard_normal(n), 1200) * env(n, 0.001, 0.08) * 0.6

def ding():
    return tone(1318.5, 1.6, (1, .3, .12, .05), d=0.55) * 0.5 + tone(1975.5, 1.6, (1, .2), d=0.4) * 0.25

A = 220.0
scale = [0, 3, 5, 7, 10, 12, 15]          # A menor pentatonica
prog = [0, -4, -2, -7]                     # Am F G D (graus em semitons)
nb = int(DUR / beat) + 1
mute = []                                  # trechos em silencio musical (antes da virada)
for fl in FLIPS: mute.append((fl - 0.45, fl + 0.05))
def muted(t): return any(a <= t < b for a, b in mute) or (END is not None and t >= END + 0.15 and not CALM)

for b in range(nb):
    t = b * beat
    if t >= DUR: break
    bar = (b // 4) % 4; root = A / 2 * 2 ** (prog[bar] / 12)
    if not muted(t):
        if CALM:
            if b % 2 == 0: add(kick(), t, 0.25)
        else:
            add(kick(), t, 0.95)
            if b % 4 in (1, 3): add(clap(), t, 0.35, 0.1)
        add(hat(), t + beat / 2, 0.35 if not CALM else 0.15, -0.3)
        if not CALM: add(hat(), t + beat / 4 * 3, 0.15, 0.3)
        add(bass(root, beat * 0.45), t + beat / 2, 0.55 if not CALM else 0.3)
    # arpejo em semicolcheias
    for s in range(4):
        ts = t + s * beat / 4
        if ts >= DUR or muted(ts): continue
        deg = scale[(b * 3 + s * 2) % len(scale)]
        f = A * 2 ** ((deg + prog[bar]) / 12) * (2 if s % 2 else 1)
        add(tone(f, 0.22, (1, .35, .1), d=0.09 if not CALM else 0.25), ts, 0.16 if not CALM else 0.12, 0.4 if s % 2 else -0.4)

for fl in FLIPS:
    add(whoosh(0.9), fl - 0.9, 0.55)
    add(impact(), fl, 0.9)
if END is not None:
    add(ding(), END, 0.9)

# sidechain leve no kick (nao no modo calm)
mix = np.stack([L, R], 1)
peak = np.max(np.abs(mix)) or 1
mix = mix / peak * 0.89
fade = int(0.3 * SR); mix[-fade:] *= np.linspace(1, 0, fade)[:, None]
with wave.open(OUT, 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((mix * 32767).astype('<i2').tobytes())
print('ok', OUT, DUR)
