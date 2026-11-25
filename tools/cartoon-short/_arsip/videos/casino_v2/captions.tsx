// Word-by-word captions: bold white with a thick black outline, one word at a time (short words pair with the next),
// centred in the lower third, a 3-frame pop on every change. Timed from words.json (voice word onsets).
import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import words from "./words.json";

type Wd = { w: string; s: number; e: number };
type Chunk = { text: string; s: number; e: number };
const LEAD = 1 / 30; // appear a frame before the word lands

const CHUNKS: Chunk[] = (() => {
  const ws = words as Wd[], out: Chunk[] = [];
  for (let i = 0; i < ws.length; i++) {
    const a = ws[i], b = ws[i + 1];
    const bare = a.w.replace(/[^A-Za-z0-9']/g, "");
    if (b && bare.length <= 3 && !/[.,?!]$/.test(a.w) && b.s - a.e < 0.2 && b.w.length <= 8) {
      out.push({ text: `${a.w} ${b.w}`, s: a.s, e: b.e }); i++;
    } else out.push({ text: a.w, s: a.s, e: a.e });
  }
  // each chunk stays up until the next one starts (or 0.5 s after it ends across a pause)
  return out.map((c, i) => ({ ...c, e: Math.min(out[i + 1]?.s ?? c.e + 0.6, c.e + 0.5) }));
})();

/** keywords get the accent colour */
const KEY = /^(clocks?|money|lose|ranch|three|morning|1931|nineteen|thirty-one|nevada|proof|themselves|pocket|high|rollers|hospital|windows|headache)$/i;
export const Captions: React.FC = () => {
  const f = useCurrentFrame(), { fps, width } = useVideoConfig();
  const t = f / fps;
  const c = CHUNKS.find((x) => t >= x.s - LEAD && t < x.e - LEAD);
  if (!c) return null;
  const age = t - (c.s - LEAD), k = Math.min(1, age * fps / 3);
  const scale = 0.82 + 0.18 * (1 - (1 - k) ** 3);
  const px = (v: number) => (v * width) / 1080;
  return (
    <AbsoluteFill style={{ justifyContent: "flex-start", alignItems: "center" }}>
      <div style={{
        position: "absolute", top: "64%", width: "100%", textAlign: "center", transform: `translateY(-50%) scale(${scale})`,
        fontFamily: "'Arial Black', 'Segoe UI Black', Impact, sans-serif", fontWeight: 900, fontSize: px(92), lineHeight: 1,
        color: "#ffffff", WebkitTextStroke: `${px(16)}px #000000`, paintOrder: "stroke fill",
        textShadow: `0 ${px(6)}px ${px(10)}px rgba(0,0,0,0.45)`, letterSpacing: px(1),
      }}>
        {c.text.split(" ").map((w, i) => (
          <span key={i} style={{ color: KEY.test(w.replace(/[^A-Za-z0-9-]/g, "")) ? "#ffd23f" : "#ffffff" }}>{i ? " " : ""}{w}</span>
        ))}
      </div>
    </AbsoluteFill>
  );
};
