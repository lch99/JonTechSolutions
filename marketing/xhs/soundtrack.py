# Synthesises the spot's soundtrack, timed to video.html's cuts. Everything is generated here (numpy only), so the
# music is original and free to use anywhere.
# Usage:  python soundtrack.py          out/soundtrack.wav        the full spot, 59.5s at 96 BPM
#         python soundtrack.py short    out/soundtrack-short.wav  the short cut in cuts.json, at 115.2 BPM
import json
import os
import sys
import wave
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
CUT = sys.argv[1] if len(sys.argv) > 1 else 'full'
# cuts.json: a cut is a list of [from, to, speed] pieces of video.html's timeline, played back to back
PIECES = json.load(open(os.path.join(HERE, 'cuts.json')))[CUT]
BPM = {'full': 96, 'short': 115.2}[CUT]  # short: a product shot lasts exactly two bars


def at(t):
    """Where second t of video.html's timeline lands in this cut, or None if the cut skips it."""
    start = 0.0
    for a, b, speed in PIECES:
        if a <= t <= b:
            return start + (t - a) / speed
        start += (b - a) / speed
    return None


def cues(times):
    return sorted({round(at(t), 3) for t in times if at(t) is not None})


SR = 44100
DUR = sum((b - a) / speed for a, b, speed in PIECES)
BEAT = 60 / BPM
BAR, DROP, END = 4 * BEAT, at(5), at(55)  # the groove runs from the first wipe (DROP) to the end card (END)
LAYERS = at(10) - 0.01                     # claps, hats and the high arpeggio come in with the first product
N = int(SR * DUR)
rng = np.random.default_rng(7)


def tt(d):
    return np.arange(int(d * SR)) / SR


def hz(midi):
    return 440.0 * 2 ** ((midi - 69) / 12)


def filt(x, lo=None, hi=None, order=3):
    f = np.fft.rfftfreq(len(x), 1 / SR)
    h = np.ones_like(f)
    if hi:
        h /= np.sqrt(1 + (f / hi) ** (2 * order))
    if lo:
        r = (f / lo) ** order
        h *= r / np.sqrt(1 + r * r)
    return np.fft.irfft(np.fft.rfft(x) * h, len(x))


def add(bus, start, sig, gain=1.0, pan=0.0):
    i = int(start * SR)
    if i >= N or i < 0:
        return
    sig = sig[: N - i]
    a = (pan + 1) * np.pi / 4
    bus[i : i + len(sig), 0] += sig * gain * np.cos(a)
    bus[i : i + len(sig), 1] += sig * gain * np.sin(a)


def edge(sig, attack=0.003, release=0.02):
    a, r = int(attack * SR), int(release * SR)
    sig[:a] *= np.linspace(0, 1, a)
    sig[-r:] *= np.linspace(1, 0, r)
    return sig


def kick():
    t = tt(0.34)
    f = 46 + 120 * np.exp(-t * 30)
    return edge(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 9) + 0.25 * filt(rng.standard_normal(len(t)), hi=3000) * np.exp(-t * 200))


def clap():
    t = tt(0.22)
    env = sum(np.where(t >= o, np.exp(-(t - o) * 38), 0) for o in (0, 0.011, 0.024))
    return edge(filt(rng.standard_normal(len(t)), lo=900, hi=5200) * env)


def hat(open_=False):
    t = tt(0.2 if open_ else 0.06)
    return edge(filt(rng.standard_normal(len(t)), lo=7500) * np.exp(-t * (20 if open_ else 85)), release=0.005)


def pluck(midi, d=0.6):
    t, f = tt(d), hz(midi)
    return edge(sum(np.sin(2 * np.pi * k * f * t) / k * np.exp(-t * (3.5 + 2.6 * k)) for k in range(1, 11) if k * f < 16000))


def pad(midis, d):
    t = tt(d)
    sig = sum(np.sin(2 * np.pi * hz(m) * dt * k * t + ph) * a
              for m in midis for dt, ph in ((0.997, 0.0), (1.003, 1.7)) for k, a in ((1, 1), (2, 0.3), (3, 0.12)))
    return edge(sig * (0.85 + 0.15 * np.sin(2 * np.pi * 0.5 * t)), attack=min(0.5, d / 3), release=min(0.9, d / 3)) / len(midis)


def bass(midi, d=0.24):
    t, f = tt(d), hz(midi)
    return edge((np.sin(2 * np.pi * f * t) + 0.5 * np.sin(4 * np.pi * f * t) + 0.22 * np.sin(6 * np.pi * f * t)) * np.exp(-t * 5), release=0.03)


def riser(d):
    t = tt(d)
    sweep = np.sin(2 * np.pi * np.cumsum(180 * (9 ** (t / d))) / SR)
    return edge(filt(rng.standard_normal(len(t)), lo=1800) * (t / d) ** 2.5 + 0.25 * sweep * (t / d) ** 3, release=0.01)


def impact():
    t = tt(2.6)
    sub = np.sin(2 * np.pi * np.cumsum(40 + 50 * np.exp(-t * 7)) / SR) * np.exp(-t * 2.2)
    return edge(sub + 0.5 * np.sin(2 * np.pi * np.cumsum(80 + 100 * np.exp(-t * 7)) / SR) * np.exp(-t * 3) + 0.6 * filt(rng.standard_normal(len(t)), hi=3500) * np.exp(-t * 5))


def whoosh(d=0.7, lo=500, hi=6500):
    t = tt(d)
    return filt(rng.standard_normal(len(t)), lo=lo, hi=hi) * np.sin(np.pi * t / d) ** 2


def blip(midi, d=0.16):
    t, f = tt(d), hz(midi)
    return edge((np.sin(2 * np.pi * f * t) + 0.3 * np.sin(4 * np.pi * f * t)) * np.exp(-t * 30))


def reverb(bus, seconds=1.4, decay=4.5):
    t = tt(seconds)
    out = np.zeros_like(bus)
    for ch in (0, 1):
        ir = filt(rng.standard_normal(len(t)), lo=300, hi=7000) * np.exp(-t * decay)
        n = len(bus) + len(ir)
        out[:, ch] = np.fft.irfft(np.fft.rfft(bus[:, ch], n) * np.fft.rfft(ir, n), n)[: len(bus)]
    return out / np.abs(out).max() if np.abs(out).max() else out


drums, music, plucks, fx = (np.zeros((N, 2)) for _ in range(4))

# harmony: Am under the problem, then four-chord loops from the first cut, landing on C for the end card
F, C, G, Am = [53, 57, 60, 64], [55, 60, 64, 67], [55, 59, 62, 67], [57, 60, 64, 67]
ROOT = {id(F): 41, id(C): 48, id(G): 43, id(Am): 45}
loops = {'full': [F, C, G, Am, F, C, G, Am, Am, F, C, G, F, C, G, Am, F, C, G, G], 'short': [F, C, G, Am, F, G]}[CUT]
bars = [(DROP + BAR * i, ch) for i, ch in enumerate(loops)]

# the problem: a held minor chord and a ticking pluck
add(music, 0, pad([45, 57, 60, 64], DROP + 0.3), 0.55)
for i in range(int(DROP / BEAT)):
    add(plucks, i * BEAT, pluck(69 if i % 2 == 0 else 64, 0.4), 0.3, pan=-0.3 if i % 2 else 0.3)
add(fx, DROP - 2, riser(2.0), 0.3)

# the groove: drums thin out for the first bar of the services scene, then build into the logo
BUILD = END - BAR


def quiet(t):
    return CUT == 'full' and 40 <= t < 40 + BAR


kicks = [b for b in np.arange(DROP, BUILD, BEAT) if not quiet(b)]
for b in kicks:
    add(drums, b, kick(), 0.95)
for start, chord in bars:
    add(music, start - 0.05, pad(chord, BAR + 0.5), 0.5)
    for s in range(8):
        t = start + s * BEAT / 2
        add(plucks, t, pluck(chord[[0, 2, 1, 3, 2, 3, 1, 2][s]] + 12), 0.34, pan=0.35 * (-1) ** s)
        if not quiet(t) and t < BUILD:
            add(music, t, bass(ROOT[id(chord)], 0.28), 0.62 if s % 2 else 0.45)
    if start >= LAYERS:
        for s in range(16):
            add(plucks, start + s * BEAT / 4, pluck(chord[[2, 3, 1, 2, 0, 2, 1, 3][s % 8]] + 24, 0.3), 0.09, pan=-0.5 * (-1) ** s)
    if LAYERS <= start < BUILD and not quiet(start):
        add(drums, start + BEAT, clap(), 0.42)
        add(drums, start + 3 * BEAT, clap(), 0.42)
    if DROP + BAR <= start < BUILD:
        for s in range(16):
            add(drums, start + s * BEAT / 4, hat(open_=(s == 14)), (0.3 if s % 4 == 2 else 0.11) if start >= LAYERS or s % 4 == 2 else 0, pan=0.2)
roll = list(np.arange(BUILD, BUILD + 2 * BEAT, BEAT)) + list(np.arange(BUILD + 2 * BEAT, BUILD + 3 * BEAT, BEAT / 2)) + list(np.arange(BUILD + 3 * BEAT, END, BEAT / 4))
for i, t in enumerate(roll):
    add(drums, t, clap(), 0.2 + 0.03 * i)
add(fx, BUILD, riser(BAR), 0.4)

# the logo
add(music, END, pad([36, 48, 55, 60, 64, 67, 74], DUR - END), 0.75)
for i, m in enumerate([72, 76, 79, 86, 84]):
    add(plucks, END + i * BEAT / 2, pluck(m, 1.2), 0.36, pan=(-0.4, 0.4)[i % 2])

# sound design, on the picture's cues
for t in (DROP, END):
    add(fx, t, impact(), 0.9)
for t in cues((5, 10, 40, 45, 50, 55)):
    add(fx, t - 0.38, whoosh(), 0.42)
for t in cues((15, 20, 25, 30, 35)):
    add(fx, t - 0.2, whoosh(0.4, 1200, 8000), 0.16)
for i, t in enumerate(cues((3.75, 3.85, 3.95, 4.05))):
    add(fx, t, whoosh(0.22, 2500, 9000), 0.2, pan=(-0.4, 0.4)[i % 2])
for t, m in ((1.25, 81), (1.875, 79), (2.5, 76), (3.125, 74),                 # chores pile up, stepping down
             (11.3, 88), (11.9, 88), (12.2, 91), (12.5, 96),                 # stock syncs to three marketplaces
             (16.2, 88), (17.0, 91), (17.12, 96),                            # kiosk tap, payment success
             (21.5, 88), (21.9, 91), (22.3, 96),                             # commission rules resolve
             (26.6, 88), (27.2, 91), (27.32, 96),                            # payment chosen, invoice settled
             (31.4, 88), (31.6, 91), (32.1, 96),                             # report figures, AI summary
             (35.7, 84), (36.95, 91), (37.07, 96),                           # question, AI answer
             (51.9, 88), (53.6, 91), (53.72, 96), (56.2, 96)):               # site check, score, call to action
    if at(t) is not None:
        add(fx, at(t), blip(m), 0.2)
for i, m in enumerate((72, 74, 76, 79, 81, 84, 86, 88, 91)):                 # nine service tiles
    if at(40.8 + 0.14 * i) is not None:
        add(fx, at(40.8 + 0.14 * i), blip(m), 0.11)

# ping-pong delay on the plucks, duck the music under each kick, glue with a little room
for k, (delay, g) in enumerate(((0.75 * BEAT, 0.36), (1.5 * BEAT, 0.2), (2.25 * BEAT, 0.1))):
    n = int(delay * SR)
    plucks[n:, k % 2] += g * plucks[:-n, 1 - k % 2].copy() if k == 0 else g * plucks[:-n, k % 2].copy()
duck = np.ones(N)
for b in kicks:
    i = int(b * SR)
    seg = duck[i : i + int(0.4 * SR)]
    seg *= 1 - 0.6 * np.exp(-tt(0.4)[: len(seg)] * 9)
music *= duck[:, None]
plucks *= (0.5 + 0.5 * duck)[:, None]

mix = 0.8 * drums + 0.4 * music + 0.85 * plucks + 0.7 * fx
mix += 0.22 * reverb(0.5 * music + plucks + 0.6 * fx + 0.3 * drums) * np.abs(mix).max()
fade = int(1.6 * SR)
mix[-fade:] *= np.linspace(1, 0, fade)[:, None] ** 2
mix = np.tanh(1.6 * mix / np.abs(mix).max()) / np.tanh(1.6) * 0.89

out = os.path.join(HERE, 'out', 'soundtrack.wav' if CUT == 'full' else f'soundtrack-{CUT}.wav')
os.makedirs(os.path.dirname(out), exist_ok=True)
with wave.open(out, 'wb') as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((mix * 32767).astype('<i2').tobytes())
print('wrote', out)
