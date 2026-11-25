# TEMPERANCE fase 2: SFX sintetis + musik orisinal + mix untuk ch01_20261125_01_demo. Semua dibuat dari nol (numpy/scipy).
# usage: python -I make_mix_nintendo.py <folder produksi>   -> audio/mix_raw.wav, audio/stems/*.wav (loudnorm dilakukan terpisah via ffmpeg)
import json, sys, wave
from pathlib import Path
import numpy as np
from scipy.signal import butter, sosfilt, lfilter

P = Path(sys.argv[1]); A = P / "audio"; (A / "stems").mkdir(exist_ok=True)
SR = 48000; DUR = 67.43; N = round(DUR * SR)
rng = np.random.default_rng(11)
cues = json.load(open(P / "render/cues.json"))["cues"]
words = json.load(open(A / "words.json"))

def rd(p):
    with wave.open(str(p)) as w:
        assert w.getframerate() == SR
        x = np.frombuffer(w.readframes(w.getnframes()), np.int16).astype(np.float64) / 32768
        return x.reshape(-1, w.getnchannels()).mean(1)
def wr(p, x):
    with wave.open(str(p), "wb") as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((np.clip(x, -1, 1) * 32767).astype(np.int16).tobytes())
def lp(x, f, o=2): return sosfilt(butter(o, f, "low", fs=SR, output="sos"), x)
def hp(x, f, o=2): return sosfilt(butter(o, f, "high", fs=SR, output="sos"), x)
def bp(x, a, b): return sosfilt(butter(2, [a, b], "band", fs=SR, output="sos"), x)
def tt(d): return np.arange(int(d * SR)) / SR
def env(d, a, dec): t = tt(d); return np.minimum(1, t / max(a, 1e-4)) * np.exp(-t / dec)
def noise(d): return rng.standard_normal(int(d * SR))
def mtof(m): return 440 * 2 ** ((m - 69) / 12)
def nrm(x): return x / (np.abs(x).max() + 1e-9)
def sine_sweep(d, f0, f1):
    t = tt(d); f = f0 + (f1 - f0) * t / d; return np.sin(2 * np.pi * np.cumsum(f) / SR)
def square(f, d, duty=0.5):
    t = tt(d); return np.where((t * f) % 1 < duty, 1.0, -1.0)
def bell(f, d, parts=((1, 1), (2.76, .4), (5.4, .2)), dec=None):
    t = tt(d); dec = dec or d / 4
    return sum(g * np.sin(2 * np.pi * f * k * t) for k, g in parts) * env(d, .002, dec)
def put(buf, t, x, g=1.0, pan=0.0):  # pan -1..1 pada buffer stereo
    i = int(round(t * SR))
    if i >= len(buf): return
    x = x[: len(buf) - i]
    l, r = np.sqrt((1 - pan) / 2) * 1.414, np.sqrt((1 + pan) / 2) * 1.414
    buf[i:i + len(x), 0] += g * l * x; buf[i:i + len(x), 1] += g * r * x

# ---------------- generator SFX (mono, puncak ~1) ----------------
def g_whoosh(d=0.5, soft=False):
    t = tt(d); k = np.sin(np.pi * t / d) ** 2
    return nrm(bp(noise(d), *((250, 1800) if soft else (400, 4200))) * k)
def g_impact(d=0.45):
    t = tt(d); return nrm(np.sin(2 * np.pi * np.cumsum(110 * np.exp(-t * 9) + 38) / SR) * env(d, .001, .11) + .4 * lp(noise(d), 1200) * env(d, .0005, .03))
def g_honk(d=0.55):
    t = tt(d); return nrm(lp(square(400, d, .4) + square(500, d, .4), 2200) * np.minimum(1, t / .01) * (1 - np.minimum(1, np.maximum(0, t - d + .08) / .08)))
def g_car(d):
    t = tt(d); f = 55 + 45 * (t / d) ** 1.5
    eng = lp(sum(np.sin(2 * np.pi * np.cumsum(f * k) / SR) / k for k in (1, 2, 3, 4)), 700)
    return nrm((eng + .5 * lp(noise(d), 900)) * (t / d) ** 1.4 * np.minimum(1, (d - t) / .05 + 1e-4))
def g_skid(d=0.6):
    t = tt(d); f = 2400 - 700 * t / d + 120 * np.sin(2 * np.pi * 23 * t)
    x = bp(noise(d), 1400, 3600) * (0.7 + 0.3 * np.sin(2 * np.pi * 37 * t)) + .25 * np.sin(2 * np.pi * np.cumsum(f) / SR)
    return nrm(x * np.minimum(1, t / .03) * np.minimum(1, (d - t) / .15))
def g_powerup(d=0.5, n=6, base=60, step=2.5):
    seg = d / n; out = np.zeros(int(d * SR))
    for k in range(n):
        s = square(mtof(base + k * step), seg, .25) * env(seg, .003, seg * .8); i = int(k * seg * SR); out[i:i + len(s)] += s[:len(out) - i]
    return nrm(lp(out, 6000))
def g_pop(): d = .12; return sine_sweep(d, 350, 950) * env(d, .002, .035)
def g_creak(d=0.8):
    t = tt(d); f = 160 + 70 * np.sin(2 * np.pi * 2.2 * t)
    return nrm(lp(sum(np.sin(2 * np.pi * np.cumsum(f * k) / SR) / k for k in (1, 2, 3, 5, 7)), 1800) * np.sin(np.pi * t / d))
def g_paper(d=0.7, fan=False):
    t = tt(d); x = hp(noise(d), 2500)
    x *= (lp((np.sin(2 * np.pi * 26 * t) > .3).astype(float), 200) * 2 + .2) if fan else ((rng.random(len(t)) > .55) * np.exp(-t / (d * .5)) + .15 * np.exp(-t / d))
    return nrm(x * np.minimum(1, t / .01) * np.minimum(1, (d - t) / .1))
def g_boing(d=0.45):
    t = tt(d); f = 180 + 520 * np.exp(-t * 4) * (1 + .5 * np.cos(2 * np.pi * 9 * t)); ph = 2 * np.pi * np.cumsum(f) / SR
    return nrm((np.sin(ph) + .3 * np.sin(2 * ph)) * env(d, .004, .22))
def g_clunk(d=0.35): return nrm(bell(210, d, ((1, 1), (2.3, .5), (3.9, .3)), .09) + .5 * hp(noise(d), 1500) * env(d, .0005, .012))
def g_crash(d=0.9):
    out = .6 * hp(noise(d), 600) * env(d, .001, .22)
    for k in range(10):
        s = bell(900 + rng.random() * 2500, .25, dec=.05) * (1 - k / 14); i = int((.03 + k * .055 + rng.random() * .03) * SR); out[i:i + len(s)] += s[:len(out) - i] * .5
    out[:int(.3 * SR)] += g_impact(.3)
    return nrm(out)
def g_ding(): return bell(1568, 1.4, ((1, 1), (2.01, .35), (3.02, .15)), .45)
def g_ting(): return bell(3136, .8, ((1, 1), (2.4, .3)), .18)
def g_buzz(d=0.5):
    t = tt(d); x = lp(sum(np.sin(2 * np.pi * 100 * k * t) / k for k in range(1, 12)), 2500)
    gate = (np.sin(2 * np.pi * 17 * t) + .6 * np.sin(2 * np.pi * 41 * t) > -.2).astype(float)
    return nrm(x * lp(gate, 400) * np.minimum(1, (d - t) / .05))
def g_blip(): return lp(np.concatenate([square(mtof(84), .07) * env(.07, .002, .06), square(mtof(91), .12) * env(.12, .002, .1)]), 7000)
def g_rattle(d=0.6):
    out = np.zeros(int(d * SR)); t = 0.0; gap = .03
    while t < d - .1:
        s = bell(500 + rng.random() * 300, .08, ((1, 1), (2.7, .4)), .02) * (1 - t / d * .8); i = int(t * SR); out[i:i + len(s)] += s[:len(out) - i]; t += gap; gap = max(.015, gap * .93)
    return nrm(out)
def g_catch(): return nrm(lp(noise(.12), 1500) * env(.12, .001, .03) + .7 * np.sin(2 * np.pi * 150 * tt(.12)) * env(.12, .001, .04))

CARD = {1.0: 1.93, 25.23: 1.2}  # deru taksi: sampai whoosh 2.93 / sampai skid 26.43
# jenis -> (fungsi(cue) -> sinyal, gain, pan)
SPEC = {
    "whoosh": lambda c: (g_whoosh(.55, "lembut" in c["catatan"]), .20, (-.4 if round(c["t"] * 10) % 2 else .4)),
    "honk": lambda c: (g_honk(), .09, .35),
    "car": lambda c: (g_car(CARD[c["t"]]), .14, 0),
    "skid": lambda c: (g_skid(), .13, 0),
    "impact": lambda c: (g_impact(), .17 if "soft" in c["catatan"] else .30, 0),
    "powerup": lambda c: ((g_powerup(.5, 5) if "teaser" in c["catatan"] else g_powerup(1.0, 9, 58, 2)), .14, 0),
    "pop": lambda c: (g_pop(), .22, (round(c["t"] * 10) % 3 - 1) * .3),
    "creak": lambda c: (g_creak(), .12, -.3),
    "paper": lambda c: (g_paper(.8 if ("konfeti" in c["catatan"] or "bertebaran" in c["catatan"]) else .6, "kipas" in c["catatan"]), .13, .2),
    "boing": lambda c: (g_boing(), .17, 0),
    "clunk": lambda c: (g_clunk(), .24, 0),
    "crash": lambda c: (g_crash(), .26, 0),
    "ding": lambda c: (g_ding(), .16, 0),
    "buzz": lambda c: (g_buzz(), .10, 0),
    "blip": lambda c: (g_blip(), .13, 0),
    "rattle": lambda c: (g_rattle(), .12, -.2),
    "catch": lambda c: (g_catch(), .22, 0),
    "ting": lambda c: (g_ting(), .11, .2),
}
vo = rd(A / "vo.wav"); v = np.zeros(N); v[:min(N, len(vo))] = vo[:N]
sfx = np.zeros((N, 2)); rows = []
for c in cues:
    x, g, pan = SPEC[c["jenis"]](c); a0 = int(c["t"] * SR); n0 = int(min(len(x) / SR, .5) * SR)
    vr = np.sqrt(np.mean(v[a0:a0 + n0] ** 2)); xr = g * np.sqrt(np.mean(x[:n0] ** 2))  # batasi SFX maks -7 dB di bawah suara di jendela yang sama
    if vr > 2e-3 and xr > vr * 10 ** (-7 / 20): g *= vr * 10 ** (-7 / 20) / xr
    put(sfx, c["t"], x, g, pan); rows.append([c["t"], c["jenis"], c["catatan"], round(len(x) / SR, 2)])
amb = np.zeros((N, 2)); put(amb, 0, lp(noise(DUR), 500) * .018 * (.8 + .2 * np.sin(2 * np.pi * .11 * tt(DUR))))  # udara kamar tipis

# ---------------- musik orisinal: lo-fi 84 bpm, Am9 | Fmaj7 | Dm9 | E7sus; naik per bagian ----------------
BPM = 84; beat = 60 / BPM; bar = 4 * beat
music = np.zeros((N, 2))
CH = [(45, [57, 60, 64, 67, 71]), (41, [57, 60, 64, 65, 69]), (38, [57, 60, 62, 65, 69]), (40, [56, 59, 62, 64, 69])]
def pad(freqs, d):
    t = tt(d); x = sum(np.sin(2 * np.pi * f * t) + .5 * np.sin(2 * np.pi * f * 1.004 * t) + .2 * np.sin(4 * np.pi * f * t) for f in freqs)
    return lp(x, 1400) * np.minimum(1, t / 1.0) * np.minimum(1, (d - t) / 1.2) / len(freqs)
def pluck(f, d=0.9): t = tt(d); return (np.sin(2 * np.pi * f * t) + .5 * np.sin(4 * np.pi * f * t) * np.exp(-t * 6) + .2 * np.sin(6 * np.pi * f * t) * np.exp(-t * 10)) * env(d, .002, .28)
def intensity(t):  # misterius -> hanafuda -> taksi/nasi -> mainan -> arcade
    return float(np.interp(t, [0, 12, 21.5, 40, 52, 56.9, 66, DUR], [.12, .12, .35, .5, .7, 1.0, .9, .3]))
SCALE = [57, 60, 62, 64, 67, 69, 72, 74, 76]  # pentatonik A minor + 9; pola acak berbenih, bukan melodi yang dikenal
rn = np.random.default_rng(5)
b = 0; t = 0.0
while t < DUR - .2:
    r, ch = CH[b % 4]; iv = intensity(t)
    put(music, t, pad([mtof(m) for m in ch], min(bar + .4, DUR - t)), .55)
    put(music, t, np.sin(2 * np.pi * mtof(r) * tt(bar)) * env(bar, .02, bar * .7), .5 * min(1, .3 + iv))  # bass
    if iv > .3:
        for k in range(4):
            if k in (0, 2) or (iv > .6 and k == 3): put(music, t + k * beat, g_impact(.3) * .6, .22)
            if k in (1, 3): put(music, t + k * beat, hp(noise(.12), 2500) * env(.12, .001, .03), .10)
        for k in range(8): put(music, t + k * beat / 2 + (beat / 6 if k % 2 else 0), hp(noise(.05), 7000) * env(.05, .0005, .012), .05 * iv)
    step = beat / 2 if iv < .6 else beat / 4
    for k in range(int(bar / step)):
        if rn.random() < .25 + .5 * iv:
            m = SCALE[rn.integers(0, len(SCALE))]; put(music, t + k * step, pluck(mtof(m + (12 if iv > .9 and k % 2 else 0))), .09 * (.5 + iv), rn.uniform(-.5, .5))
    if iv > .95:  # arcade: arpeggio persegi dari akord sendiri
        for k in range(16): put(music, t + k * beat / 4, lp(square(mtof(ch[k % 4 + 1] + 12), .1, .25), 5000) * env(.1, .002, .06), .05)
    b += 1; t += bar
ts = np.arange(N) / SR
music *= np.minimum(1, (DUR - ts) / 1.2)[:, None] * np.minimum(1, ts / .6)[:, None]

# ---------------- mix ----------------
spans = []  # rentang bicara digabung (celah < 0.3 dtk)
for w in words:
    if spans and w["s"] - spans[-1][1] < .3: spans[-1][1] = w["e"]
    else: spans.append([w["s"], w["e"]])
gate = np.zeros(N)
for s, e in spans: gate[int(max(0, s - .08) * SR): int((e + .12) * SR)] = 1
fast = np.clip(lp(gate, 12, 1), 0, 1)  # turun ~13 ms
rel = np.maximum(fast, lfilter([1 - np.exp(-1 / (.25 * SR))], [1, -np.exp(-1 / (.25 * SR))], fast))  # naik ~250 ms
DB_SP, DB_GAP = -20.0, -8.0  # level musik relatif RMS suara: saat bicara / saat jeda
vref = np.sqrt(np.mean(v[np.abs(v) > 1e-4] ** 2))
g0 = vref * 10 ** (DB_SP / 20) / np.sqrt(np.mean(music[gate > .5] ** 2))
music_m = music * g0 * (10 ** ((DB_GAP + (DB_SP - DB_GAP) * rel) / 20) / 10 ** (DB_SP / 20))[:, None]
sfx_m = (sfx + amb) * (1 - .3 * rel)[:, None]  # SFX -3 dB saat ada kata
voice_st = np.stack([v, v], 1)
mix = voice_st + music_m + sfx_m
peak = np.abs(mix).max(); sc = .8 / peak
wr(A / "mix_raw.wav", mix * sc)
for nm, x in (("vo", voice_st), ("musik", music_m), ("sfx", sfx_m)): wr(A / "stems" / f"{nm}.wav", x * sc)
json.dump({"rows": rows, "spans": spans}, open(A / "stems/_info.json", "w"), ensure_ascii=False)
print("ok peak", round(20 * np.log10(peak), 2), "dBFS pre-scale; vref", round(float(vref), 4))
