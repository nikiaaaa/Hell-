# Original score + synthesized SFX for "The Clocks Came Down", mixed under the voice (ducked), exact film length.
# v2: every time comes from src/videos/casino_v2/beats.json; adds room ambience per set, footsteps and more Foley.
# usage: python -I audio/casino_mix_v2.py <project dir>   ->  audio/v2/mix_raw.wav, music.wav, sfx.wav
import json, sys, wave
from pathlib import Path
import numpy as np
from scipy.signal import butter, sosfilt

root = Path(sys.argv[1]); A = root / "audio" / "v2"
B = json.load(open(root / "src/videos/casino_v2/beats.json"))
SR = 48000; DUR = B["TOTAL"] / 30; N = int(round(DUR * SR))
fr = lambda t: round(t * 30) / 30
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
    if t < B["but"] - 0.1: return "lounge"
    if t < B["then"] - 0.1: return "western"
    if t < B["think"] - 0.1: return "tense"
    if t < B["years"] - 0.1: return "hospital"
    if t < B["andToday"] - 0.1: return "lounge"
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
for m in (50, 57, 62, 65, 69, 76): add(music, B["loseEnd_e"] + 0.9, tone(mtof(m), 1.2, ((1, 1), (2, 0.3)), 0.01, 0.5), 0.07)

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

def step(t, g=0.12):
    n = int(0.09 * SR); add(sfx, t, lp(rng.standard_normal(n), 1400) * env(n, 0.002, 0.025) + 0.5 * tone(110, 0.09, ((1, 1),), 0.001, 0.03), g)
def steps(t0, t1, rate, g=0.1):
    t = t0
    while t < t1: step(t, g * (0.85 + 0.3 * rng.random())); t += 1 / rate
def murmur(t0, t1, g, lo=250, hi=1400, wob=0.7):
    i0, i1 = int(t0 * SR), min(N, int(t1 * SR)); n = i1 - i0
    if n <= 0: return
    x = bp(rng.standard_normal(n), lo, hi); tt = np.arange(n) / SR
    x *= (0.75 + 0.25 * np.sin(2 * np.pi * wob * tt + rng.random() * 6)) * np.minimum(1, np.minimum(tt, (n / SR - tt)) / 0.25)
    sfx[i0:i1] += g * x
def hum(t0, t1, g):
    i0, i1 = int(t0 * SR), min(N, int(t1 * SR)); tt = np.arange(i1 - i0) / SR
    sfx[i0:i1] += g * (np.sin(2 * np.pi * 60 * tt) + 0.5 * np.sin(2 * np.pi * 120 * tt)) * np.minimum(1, np.minimum(tt, (i1 - i0) / SR - tt) / 0.3)

# ambience per set (shot boundaries ~ the anchor words)
murmur(0, B["but"], 0.05); murmur(B["years"], DUR, 0.045)                       # casino crowd
for k in range(int(B["but"] / 2.7)): jingle(1.3 + k * 2.7 + rng.random(), 0.04)     # distant slot machines
for k in range(int((DUR - B["years"]) / 3.1)): jingle(B["years"] + 0.8 + k * 3.1 + rng.random(), 0.035)
murmur(B["but"], B["firstCasinos"], 0.05, 80, 600, 0.15)                           # desert wind
murmur(B["firstCasinos"], B["think"], 0.035, 200, 1000)                            # saloon room
hum(B["think"], B["years"], 0.025); murmur(B["think"], B["years"], 0.02, 1500, 5000, 0.1)  # hospital air
# Foley and hits, all on the anchor words
jingle(0.12); jingle(B["slot"], 0.16)
whoosh(B["they"] - 0.05, 0.18, 0.3)
thud(B["noClocks"], 0.35); thud(B["noWindows"], 0.3)
for tw in (B["but"] - 0.1, B["firstCasinos"] - 0.07, B["think"] - 0.07, B["years"] - 0.07): whoosh(tw)
steps(B["in1931"], B["firstCasinos"], 1.6, 0.05)
for k in range(int(B["andDown"] - B["firstCasinos"])): tick(B["firstCasinos"] + k * 1.0, 0.1)
whoosh(B["lost"] + 0.05, 0.2, 0.55)                                                  # the deed flies
bell(B["does"], mtof(45), 0.32, 1.6)                                                 # the clock strikes three
thud(B["take"] + 0.03, 0.7); coins(B["take"] + 0.05, 0.1)                            # fist on the table, chips jump
steps(B["orWe"] + 0.1, B["andDown"] - 0.2, 2.6, 0.13)                                # the high rollers walk out
for k in range(10): tick(B["andDown"] - 0.55 + k * 0.05, 0.08)                      # the clock rattles on its nail
crash(B["came"] + 0.02)
coins(B["luckily"] + 0.2); coins(B["mostMoney"], 0.16)
steps(B["think"] + 0.2, B["years"] - 0.3, 1.9, 0.07)                                 # the nurse
for k in range(int(B["years"] - B["think"])): tick(B["think"] + 0.3 + k * 1.0, 0.24)
thud(B["proof"] + 0.05, 0.55)                                                        # NO PROOF stamp
blip(B["theClock"] + 0.15)
for k in range(10): bell(B["money"] + k * (B["loseEnd_e"] - B["money"]) / 10, mtof(84 - 2 * k), 0.06, 0.08)  # balance ticking down
sadhorn(B["loseEnd_e"] + 0.1)

# ---------------- mix: duck the music under the voice ----------------
voice = read_wav(A / "voice.wav"); v = np.zeros(N); v[: min(N, len(voice))] = voice[:N]
e = np.sqrt(np.maximum(lp(v ** 2, 8), 0)); e = np.clip(e / (e.max() + 1e-9) * 6, 0, 1)
duck = 1 - 0.55 * lp(e, 3)
mus = music * duck * 10 ** (3 / 20) * 0.5
fx = sfx * 10 ** (-6 / 20) * 1.6
mono = v + mus + fx
pan = np.stack([mono, mono], 1)
pan[:, 0] += 0.06 * np.roll(mus, int(0.011 * SR)); pan[:, 1] += 0.06 * np.roll(mus, int(0.017 * SR))
peak = np.abs(pan).max(); pan *= 0.9 / peak
write_wav(A / "mix_raw.wav", pan)
write_wav(A / "music.wav", np.stack([mus, mus], 1) * 0.9 / peak); write_wav(A / "sfx.wav", np.stack([fx, fx], 1) * 0.9 / peak)
print("mix", round(N / SR, 3), "s, peak before norm", round(float(peak), 3))
