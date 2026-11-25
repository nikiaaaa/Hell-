// Real-photo inserts: an old print drops in over the 3D scene (scene dims behind it), drifts slowly (Ken Burns), carries a
// small "REAL PHOTO" label with its credit, then fades back into the cartoon. Timed on beats.json.
import React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { W } from "./story";

type Insert = { file: string; a: number; b: number; label: string; credit: string; sepia?: number; tilt: number; from: [number, number]; to: [number, number] };
export const INSERTS: Insert[] = [
  { file: "footage/slots_cc0.jpg", a: W.just - 0.05, b: W.carpet - 0.25, label: "REAL PHOTO · casino slot floor", credit: "GoldRushCasino · CC0", tilt: -2.2, from: [1.0, 0], to: [1.08, -2] },
  { file: "footage/fremont_day_1930s.jpg", a: W.in1931 - 0.05, b: W.nevada - 0.1, label: "REAL PHOTO · Fremont St, Las Vegas, c. 1930s", credit: "Tichnor Bros. · CC BY-SA 4.0", sepia: 0.25, tilt: 1.8, from: [1.0, 2], to: [1.1, -3] },
  { file: "footage/fremont_night_1930s.jpg", a: W.legal - 0.05, b: W.firstCasinos - 0.12, label: "REAL PHOTO · Las Vegas at night, c. 1930s", credit: "Tichnor Bros. · CC BY-SA 4.0", sepia: 0.15, tilt: -1.5, from: [1.06, 0], to: [1.0, 2] },
  { file: "footage/night_lights_1972.jpg", a: W.andToday - 0.05, b: W.theClock - 0.2, label: "REAL PHOTO · Las Vegas lights, 1972", credit: "Charles O'Rear / U.S. National Archives · Public domain", tilt: 2.0, from: [1.0, -2], to: [1.09, 2] },
];

const ease = (x: number) => { const u = Math.max(0, Math.min(1, x)); return u * u * (3 - 2 * u); };

export const Photos: React.FC = () => {
  const f = useCurrentFrame(), { fps, width } = useVideoConfig(), t = f / fps;
  const px = (v: number) => (v * width) / 1080;
  const ins = INSERTS.find((x) => t >= x.a && t < x.b);
  if (!ins) return null;
  const inK = ease((t - ins.a) / 0.22), outK = ease((ins.b - t) / 0.28), k = Math.min(inK, outK);
  const u = (t - ins.a) / (ins.b - ins.a);
  const zoom = ins.from[0] + (ins.to[0] - ins.from[0]) * u, pan = ins.from[1] + (ins.to[1] - ins.from[1]) * u;
  const drop = (1 - inK) * px(-60);
  return (
    <AbsoluteFill style={{ background: `rgba(10,6,12,${0.62 * k})` }}>
      <div style={{
        position: "absolute", left: "50%", top: "40%", width: px(940), transform: `translate(-50%, -50%) translateY(${drop}px) rotate(${ins.tilt * k}deg) scale(${0.92 + 0.08 * k})`,
        opacity: k, background: "#f3ecd9", padding: px(22), paddingBottom: px(86), boxShadow: `0 ${px(18)}px ${px(40)}px rgba(0,0,0,0.55)`,
      }}>
        <div style={{ width: "100%", height: px(640), overflow: "hidden", background: "#222" }}>
          <Img src={staticFile(ins.file)} style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${zoom}) translateX(${pan}%)`,
            filter: `sepia(${ins.sepia ?? 0}) contrast(1.05)` }} />
        </div>
        <div style={{ position: "absolute", left: px(22), right: px(22), bottom: px(18), fontFamily: "'Segoe UI', Arial, sans-serif", color: "#2a1a14" }}>
          <div style={{ fontSize: px(34), fontWeight: 800, letterSpacing: px(0.5) }}>{ins.label}</div>
          <div style={{ fontSize: px(22), opacity: 0.75 }}>{ins.credit}</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
