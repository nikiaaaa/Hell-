# Generates voice.mp3 + words.json (word onsets/offsets in seconds) from SCRIPT.md's voice-over with edge-tts.
# usage: python -I audio/make_voice.py <project dir>
import asyncio, json, re, sys
from pathlib import Path
import edge_tts

root = Path(sys.argv[1])
text = root.joinpath("SCRIPT.md").read_text(encoding="utf-8")
vo = text.split("## Voice-over", 1)[1].split("##", 1)[0].strip()
vo = " ".join(l.strip() for l in vo.splitlines() if l.strip())
VOICE = "en-US-GuyNeural"

async def main():
    c = edge_tts.Communicate(vo, VOICE, rate="+10%", pitch="-2Hz", boundary="WordBoundary")
    words, audio = [], bytearray()
    async for ch in c.stream():
        if ch["type"] == "audio":
            audio += ch["data"]
        elif ch["type"] == "WordBoundary":
            s = ch["offset"] / 1e7
            words.append({"w": ch["text"], "s": round(s, 3), "e": round(s + ch["duration"] / 1e7, 3)})
    out = root / "audio"
    (out / "voice.mp3").write_bytes(bytes(audio))
    (out / "words.json").write_text(json.dumps(words, indent=0), encoding="utf-8")
    print(len(words), "words, last ends", words[-1]["e"])

asyncio.run(main())
