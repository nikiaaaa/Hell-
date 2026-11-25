# v2 narrator: sentence-by-sentence edge-tts with deliberate deadpan pauses, light polish, exact word timings.
# usage: python -I audio/make_voice_v2.py <project> <out dir> <voice> [rate] [--sample]
#   --sample renders only the hook + the Luckily/Unluckily pair (to compare voices by ear)
import asyncio, json, re, subprocess, sys
from pathlib import Path
import edge_tts

root, out, VOICE = Path(sys.argv[1]), Path(sys.argv[2]), sys.argv[3]
RATE = sys.argv[4] if len(sys.argv) > 4 and not sys.argv[4].startswith("--") else "+0%"
SAMPLE = "--sample" in sys.argv
out.mkdir(parents=True, exist_ok=True)
text = (root / "SCRIPT.md").read_text(encoding="utf-8")
vo = text.split("## Voice-over", 1)[1].split("##", 1)[0]
sents = [s.strip() for line in vo.splitlines() if line.strip() for s in re.split(r"(?<=[.?!])\s+", line.strip()) if s.strip()]
if SAMPLE:
    sents = [s for s in sents if s.startswith(("Casinos don't", "And everybody", "Luckily", "Unluckily"))]
# silence BEFORE a sentence (s): deadpan beats before the punchlines
PAUSE = {"And everybody": 0.32, "Unluckily": 0.62, "The gamblers hid": 0.6, "Right next to": 0.5, "But it didn't": 0.45,
         "And down they came": 0.35, "Think of the clock": 0.5, "So the casinos never": 0.5, "Nobody has ever": 0.35}
DEFAULT = 0.22
SR = 48000

async def tts(s, path):
    for k in range(4):
        try: return await tts1(s, path)
        except edge_tts.exceptions.NoAudioReceived:
            print("retry", k + 1, repr(s)); await asyncio.sleep(1.5)
    raise RuntimeError("no audio for " + repr(s))

async def tts1(s, path):
    c = edge_tts.Communicate(s, VOICE, rate=RATE, boundary="WordBoundary")
    audio, words = bytearray(), []
    async for ch in c.stream():
        if ch["type"] == "audio": audio += ch["data"]
        elif ch["type"] == "WordBoundary":
            st = ch["offset"] / 1e7; words.append({"w": ch["text"], "s": st, "e": st + ch["duration"] / 1e7})
    path.write_bytes(bytes(audio))
    return words

def dur(p):
    return float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(p)], capture_output=True, text=True).stdout)

async def main():
    tmp = out / "chunks"; tmp.mkdir(exist_ok=True)
    parts, words, t = [], [], 0.35  # 0.35 s of room tone before the first word
    for i, s in enumerate(sents):
        mp3, wav = tmp / f"{i:02d}.mp3", tmp / f"{i:02d}.wav"
        ws = await tts(s, mp3)
        # trim edge-tts' own leading/trailing silence so our pauses are the only gaps
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(mp3), "-ar", str(SR), "-ac", "1",
                        "-af", "silenceremove=start_periods=1:start_threshold=-50dB:start_silence=0.02,areverse,silenceremove=start_periods=1:start_threshold=-50dB:start_silence=0.06,areverse",
                        str(wav)], check=True)
        lead = ws[0]["s"] if ws else 0  # edge-tts offsets are relative to its untrimmed audio
        lead = max(0.0, lead - 0.02)
        if i: t += next((v for k, v in PAUSE.items() if s.startswith(k)), DEFAULT)
        for w in ws: words.append({"w": w["w"], "s": round(t + w["s"] - lead, 3), "e": round(t + w["e"] - lead, 3)})
        parts.append((wav, t)); t += dur(wav)
    total = t + 0.4
    # place chunks on a timeline with adelay, then a light polish: low cut, a little presence, gentle compression
    inputs, filt = [], []
    for k, (wav, at) in enumerate(parts):
        inputs += ["-i", str(wav)]; filt.append(f"[{k}]adelay={int(at * 1000)}|{int(at * 1000)}[d{k}]")
    filt.append("".join(f"[d{k}]" for k in range(len(parts))) + f"amix=inputs={len(parts)}:normalize=0,apad,atrim=0:{total:.3f},"
                "highpass=f=75,equalizer=f=180:t=q:w=1:g=1.5,equalizer=f=3200:t=q:w=1.2:g=2,equalizer=f=7500:t=q:w=1:g=-1.5,"
                "acompressor=threshold=-20dB:ratio=2.5:attack=8:release=120:makeup=2[o]")
    subprocess.run(["ffmpeg", "-v", "error", "-y", *inputs, "-filter_complex", ";".join(filt), "-map", "[o]", "-ar", str(SR), "-ac", "1", str(out / "voice.wav")], check=True)
    # captions keep the script's punctuation: align spoken tokens to script tokens in order
    toks = " ".join(sents).split()
    norm = lambda x: re.sub(r"[^a-z0-9'-]", "", x.lower().replace("’", "'"))
    j = 0
    for w in words:
        k = j
        while k < len(toks) and norm(toks[k]) != norm(w["w"]): k += 1
        if k < len(toks): w["w"] = toks[k]; j = k + 1
    (out / "words.json").write_text(json.dumps(words), encoding="utf-8")
    print(VOICE, RATE, f"{total:.2f}s", len(words), "words")

asyncio.run(main())
