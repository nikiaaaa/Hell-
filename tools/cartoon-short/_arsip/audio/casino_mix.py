# Original score + synthesized SFX for "The Clocks Came Down", mixed under the voice (ducked), exact film length.
# usage: python -I audio/casino_mix.py <project dir>   ->  audio/mix.wav (48 kHz stereo), audio/music.wav, audio/sfx.wav
import json, sys, wave
from pathlib import Path
import numpy as np
from scipy.signal import butter, sosfilt

root = Path(sys.argv[1]); A = root / "audio"
SR = 48000; DUR = 2110 / 30; N = int(round(DUR * SR))
rng = np.random.default_rng(7)

def read_wav(p):
    with wave.open(str(p)) as w:
        x = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768
        if w.getnchannels() == 2: x = x.reshape(-1, 2).mean(1)
    return x
def write_wav(p, x):
    x = np.clip(x, -1, 1); y = (x * 32767).astype(np.int16)
    with wave.open(str(p), "wb") as w:
        w.setnchannels(2 if x.ndim == 2 else 1); w.setsampwidth(2); w.setframerate(SR); w.writeframes(y.tobytes())
def lp(x, f): return sosfilt(butter(2, f, "low", fs=SR, output="sos"), x)
def hp(x, f): return sosfilt(butter(2, f, "high", fs=SR, output="sos"), x)
def bp(x, a, b): return sosfilt(butter(2, [a, b], "band", fs=SR, output="sos"), x)
def env(n, a, d): t = np.arange(n) / SR; return np.minimum(1, t / max(a, 1e-4)) * np.exp(-t / d)
def add(buf, t, x, g=1.0):
    i = int(t * SR)
    if i >= len(buf): return
    x = x[: len(buf) - i]; buf[i : i + len(x)] += g * x
def mtof(m): return 440 * 2 ** ((m - 69) / 12)
def tone(f, dur, parts=((1, 1),), a=0.005, d=0.4):
    n = int(dur * SR); t = np.arange(n) / SR
    return sum(g * np.sin(2 * np.pi * f * k * t) for k, g in parts) * env(n, a, d)

# ---------------- music: lounge walking bass + brushes + vibes, 100 bpm swing in D minor ----------------
music = np.zeros(N)
BPM = 100; beat = 60 / BPM
prog = [(50, [62, 65, 69, 72]), (55, [62, 65, 67, 71]), (52, [64, 67, 70, 74]), (57, [61, 64, 67, 71])]  # Dm9 G13 Em7b5 A7
def section(t):  # which instruments play when
    if t < 13.9: return "lounge"
    if t < 22.2: return "western"
    if t < 43.5: return "tense"
    if t < 49.3: return "hospital"
    if t < 62.5: return "lounge"
    return "outro"
bar = 0
t = 0.0
while t < DUR - 0.5:
    sec = section(t); root_m, chord = prog[bar % 4]
    if sec in ("lounge", "outro", "western", "tense"):
        walk = [root_m, root_m + 3, root_m + 5, root_m + 7] if bar % 2 == 0 else [root_m + 7, root_m + 5, root_m + 3, root_m + 2]
        for k, m in enumerate(walk):
            if sec == "tense" and k % 2: continue
            add(music, t + k * beat, tone(mtof(m - 12), 0.6, ((1, 1), (2, 0.35), (3, 0.12)), 0.004, 0.32), 0.34)
    if sec in ("lounge", "outro"):
        for k in range(4):  # swung brushes
            for sw in (0, 0.66):
                n = int(0.12 * SR); add(music, t + (k + sw) * beat, hp(rng.standard_normal(n), 5000) * env(n, 0.002, 0.03), 0.05 if sw else 0.07)
        for k in (0, 2.66):  # vibes comp
            for m in chord:
                x = tone(mtof(m), 1.6, ((1, 1), (4, 0.12)), 0.003, 0.7); x *= 1 + 0.25 * np.sin(2 * np.pi * 5.5 * np.arange(len(x)) / SR)
                add(music, t + k * beat, x, 0.045)
    if sec == "western":  # honky-tonk off-beat piano stabs
        for k in (1, 3):
            for m in chord[:3]:
                add(music, t + k * beat, tone(mtof(m), 0.35, ((1, 1), (2, 0.5), (3, 0.3)), 0.002, 0.12) + tone(mtof(m) * 1.006, 0.35, ((1, 0.6),), 0.002, 0.12), 0.05)
    if sec == "tense":  # low sustained fifth
        add(music, t, tone(mtof(root_m - 12), 4 * beat, ((1, 1), (1.5, 0.5)), 0.3, 3.0), 0.06)
    bar += 1; t += 4 * beat
# outro button: final chord
for m in (50, 57, 62, 65, 69, 76): add(music, 69.4, tone(mtof(m), 1.2, ((1, 1), (2, 0.3)), 0.01, 0.5), 0.07)

# ---------------- SFX ----------------
sfx = np.zeros(N)
def tick(t, g=0.18):
    n = int(0.03 * SR); add(sfx, t, bp(rng.standard_normal(n), 2500, 6000) * env(n, 0.0005, 0.006), g)
def whoosh(t, g=0.25, dur=0.5):
    n = int(dur * SR); x = rng.standard_normal(n); k = np.sin(np.linspace(0, np.pi, n)) ** 2
    add(sfx, t - dur / 2, bp(x, 400, 3000) * k, g)
def thud(t, g=0.5):
    n = int(0.35 * SR); tt = np.arange(n) / SR
    add(sfx, t, np.sin(2 * np.pi * (90 - 50 * tt) * tt) * env(n, 0.002, 0.09) + 0.3 * lp(rng.standard_normal(n), 800) * env(n, 0.001, 0.03), g)
def bell(t, f, g=0.2, d=1.2): add(sfx, t, tone(f, d * 2, ((1, 1), (2.76, 0.4), (5.4, 0.2)), 0.002, d), g)
def jingle(t, g=0.18):
    for k, m in enumerate((76, 79, 84, 88)): bell(t + k * 0.07, mtof(m), g, 0.35)
def coins(t, g=0.12):
    for k in range(10): bell(t + k * 0.035 + rng.random() * 0.02, 3000 + rng.random() * 2500, g * (1 - k / 12), 0.12)
def crash(t):
    thud(t, 0.9)
    n = int(1.0 * SR); add(sfx, t, bp(rng.standard_normal(n), 1500, 9000) * env(n, 0.001, 0.18), 0.35)
    for k in range(6): bell(t + 0.05 + k * 0.06, 1800 + rng.random() * 2600, 0.08, 0.15)
    bell(t + 0.02, mtof(48), 0.22, 0.9)  # the clock's chime spring
def blip(t):
    for k, m in enumerate((88, 93)): bell(t + k * 0.09, mtof(m), 0.1, 0.12)
def sadhorn(t):
    for k, m in enumerate((55, 54, 53)):
        n = int(0.42 * SR); tt = np.arange(n) / SR; f = mtof(m) * (1 + 0.01 * np.sin(2 * np.pi * 6 * tt))
        x = sum(np.sin(2 * np.pi * f * h * tt) / h for h in range(1, 8)); add(sfx, t + k * 0.36, lp(x, 1800) * env(n, 0.02, 0.3), 0.1)

jingle(0.15); jingle(10.84, 0.14)
thud(6.85, 0.35); thud(8.49, 0.3)
for tw in (13.95, 19.18, 43.6, 49.45): whoosh(tw)
# saloon clock ticking from the first clock shot to the fall, hospital clock ticking, all quiet under the voice
for k in range(int((36.0 - 19.3) / 1.0)): tick(19.3 + k * 1.0, 0.1)
bell(27.51, mtof(45), 0.3, 1.6)                     # the clock strikes three ("does")
thud(33.0, 0.4)                                      # fist on the table ("Take")
crash(36.44)
coins(37.64); coins(42.48, 0.16)
for k in range(6): tick(43.7 + k * 1.0, 0.22)
blip(65.26)
sadhorn(68.85)

# ---------------- mix: duck the music under the voice ----------------
voice = read_wav(A / "voice.wav"); v = np.zeros(N); v[: min(N, len(voice))] = voice[:N]
e = np.sqrt(np.maximum(lp(v ** 2, 8), 0)); e = np.clip(e / (e.max() + 1e-9) * 6, 0, 1)
duck = 1 - 0.55 * lp(e, 3)
mus = music * duck * 10 ** (3 / 20) * 0.55
fx = sfx * 10 ** (-6 / 20) * 1.6
mono = v + mus + fx
pan = np.stack([mono, mono], 1)
pan[:, 0] += 0.06 * np.roll(mus, int(0.011 * SR)); pan[:, 1] += 0.06 * np.roll(mus, int(0.017 * SR))
peak = np.abs(pan).max(); pan *= 0.9 / peak
write_wav(A / "mix_raw.wav", pan)
write_wav(A / "music.wav", np.stack([mus, mus], 1) * 0.9 / peak); write_wav(A / "sfx.wav", np.stack([fx, fx], 1) * 0.9 / peak)
print("mix", round(N / SR, 3), "s, peak before norm", round(float(peak), 3))
