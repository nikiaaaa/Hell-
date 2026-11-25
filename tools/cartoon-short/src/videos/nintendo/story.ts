// Timeline of "Nintendo punya perusahaan taksi" (22 shots, 7 sets). Every time comes from words.json (the voice's word
// onsets), indexed by word number: T(i) = start of word i. Camera grammar: cuts on big reframes, smootherstep glides,
// every hold creeps in (no static hold), 7-frame flip kicks on impacts, visual reactions 0-3 frames before the word.
import words from "./words.json";

export const FPS = 30;
type Wd = { w: string; s: number; e: number };
const WD = words as Wd[];
export const T = (i: number) => WD[i].s;
export const TE = (i: number) => WD[i].e;
export const F = (t: number) => Math.round(t * FPS);
export const TOTAL = F(67.03) + 12; // vo.wav 67.03 s + a 0.4 s tail
export type V3 = [number, number, number];

export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const smooth = (x: number) => { const u = clamp01(x); return u * u * (3 - 2 * u); };
export const easeOut = (u: number) => 1 - (1 - clamp01(u)) ** 3;

export type SetName = "studio" | "shopOut" | "shopIn" | "street" | "kitchen" | "office" | "arcade";
export const OX: Record<SetName, number> = { studio: 0, shopOut: 400, shopIn: 460, street: 800, kitchen: 1200, office: 1600, arcade: 2000 };
const at = (s: SetName) => (x: number, y: number, z: number): V3 => [OX[s] + x, y, z];
const S = at("studio"), SO = at("shopOut"), SI = at("shopIn"), ST = at("street"), K = at("kitchen"), O = at("office"), AR = at("arcade");

// ---------------- shots ----------------
export type Light = "day" | "golden" | "warm";
export type ShotDef = { id: number; a: number; b: number; light: Light; set: SetName; sunAz?: number; sunEl?: number };
// first word of each shot (word index); shot 1 starts at 0, the last ends at TOTAL
const START = [0, 8, 18, 26, 32, 44, 51, 53, 61, 68, 78, 84, 94, 98, 108, 119, 125, 132, 137, 147, 158, 163];
const cuts = [...START.map((w, i) => (i ? F(T(w)) - 2 : 0)), TOTAL];
const IN_GOLD = { sunEl: 46, sunAz: 70 };
const GOLD_FRONT = { sunEl: 17, sunAz: 125 };
const SETS: [SetName, Light, Partial<ShotDef>][] = [
  ["street", "day", {}], ["studio", "day", {}], ["studio", "day", {}], ["studio", "day", {}],
  ["shopOut", "golden", GOLD_FRONT], ["shopIn", "warm", IN_GOLD], ["shopIn", "warm", IN_GOLD],
  ["street", "day", { sunAz: 100, sunEl: 52 }], ["street", "day", { sunAz: 100, sunEl: 52 }], ["kitchen", "day", {}], ["street", "day", { sunAz: 100, sunEl: 52 }],
  ["shopIn", "warm", { sunEl: 30, sunAz: 70 }], ["studio", "day", {}],
  ["office", "day", {}], ["office", "day", {}], ["office", "day", {}], ["office", "day", {}],
  ["arcade", "day", {}], ["arcade", "day", {}], ["studio", "day", {}], ["studio", "day", {}], ["studio", "day", {}],
];
export const SHOTS: ShotDef[] = SETS.map(([set, light, x], i) => ({ id: i + 1, a: cuts[i], b: cuts[i + 1], set, light, ...x }));
/** crossfades (frames) at place/time changes */
export const XFADE: Record<number, number> = { 5: 8, 8: 8, 14: 8, 18: 10 };
/** white flashes: [first frame, 4-frame fade strength list] */
export const FLASHES: [number, number[]][] = [
  [6, [1, 0.6]], [F(T(26)) - 2, [0.8]], [F(T(97) - 0.1), [0.8]], [F(T(131)), [0.8]], [F(T(144)) - 14, [1, 0.6]], [TOTAL - 4, [0.9, 0.5]],
];
const A = (id: number) => SHOTS[id - 1].a - (XFADE[id] ?? 0);
export const shotAt = (f: number) => SHOTS.find((s) => f >= s.a && f < s.b) ?? SHOTS[SHOTS.length - 1];
export const layersAt = (f: number): { id: number; alpha: number }[] => {
  for (const s of SHOTS) {
    const x = XFADE[s.id];
    if (x && f >= s.a - x / 2 && f < s.a + x / 2) return [{ id: s.id - 1, alpha: 1 }, { id: s.id, alpha: (f - (s.a - x / 2) + 1) / (x + 1) }];
  }
  return [{ id: shotAt(f).id, alpha: 1 }];
};

// ---------------- marks ----------------
export const MARK = {
  narrS: S(0, 0, -3), narrArc: AR(0, 0, -4), narrArcSide: AR(5.4, 0, -4), narrStudioR: S(5.4, 0, -4),
  pedL: S(-2, 0.86, -9), pedR: S(2, 0.86, -9), narr3: S(0, 0, -6.5),
  ped5: [-4, -2, 0, 2, 4].map((x) => S(x, 0.86, -9)), arcPed: [-4, -2, 0, 2, 4].map((x) => AR(x, 0.86, -7)),
  teaser: S(0, 1.6, -12.7), arcCab: AR(0, 0, -11.5),
  narrSt: ST(0, 0, 0),
  craftOutA: SO(0, 0, -9.7), craftOutB: SO(0.4, 0, -3.6), lantern: SO(2.2, 3.1, -8.5),
  craftIn: SI(0, 0, -5.5), craftW: SI(1.0, 0, -5.6), fan: SI(0, 0.95, -4.0), shelfBox: SI(-5.4, 3.0, -4.5),
  suitA: ST(-1.5, 0, 6), suitPark: ST(-1.8, 0, -2.4), taxiPark: ST(-3.4, 0, -3.4), taxiBreak: ST(-2.6, 0, -4.8),
  narrK: K(-0.6, 0, -3.2), bowlK: K(-0.1, 0.99, -4.9),
  tech: O(3.3, 0, -10.1), techDesk: O(3.3, 0.9, -8.9),
  carriers: [O(-3.2, 0, -4.2), O(-1.2, 0, -5.6), O(1.4, 0, -4.6), O(3.4, 0, -6.0)],
};

// ---------------- timed events ----------------
export const E = {
  taxiStop: 105 / FPS, // shot 1 taxi stops (frame 105)
  taxiPass: 88 / FPS,
  honk: 20 / FPS,
  sweep: T(26) + 0.1,
  famicom: T(22) - 0.08, gameboy: T(24) - 0.08,
  fan: T(45) - 0.1, kartuUp: T(52) - 0.12, nod: T(51) - 0.05,
  taxiIn9: T(61) - 0.2, pat: T(67) - 0.08,
  rice: T(70) - 0.07, jerk1: T(74) - 0.05, jerk2: T(76) - 0.05,
  wheel: T(81), fail: T(83) - 0.07, boxFall: T(88) - 0.1,
  teaser: T(14) - 0.1, bulb: T(97) - 0.1, flicker: T(107) - 0.12, stretch: T(124) - 0.12, grab: T(124) + 0.35, laris: T(131) - 0.07,
  toyToElec: T(136) - 0.15, cabOn: T(144) - 0.45, pedKartu: T(155) - 0.07, pedTaksi: T(157) - 0.07, pedNasi: T(159) - 0.07,
  bowlRoll: T(162) - 0.08, yellowBg: T(165) - 0.1, wink: T(169) - 0.12,
};

// ---------------- camera ----------------
export type Cam = { pos: V3; look: V3; fov: number; roll: number };
type Shot = Partial<Cam> & { pos: V3; look: V3 };
type Key = { f: number; dur?: number; cut?: boolean; s: (f: number) => Shot };
export const glide = (u: number) => { const x = clamp01(u); return x * x * x * (x * (6 * x - 15) + 10); };
const mix = (a: Cam, b: Cam, k: number): Cam => ({
  pos: a.pos.map((v, i) => v + (b.pos[i] - v) * k) as V3, look: a.look.map((v, i) => v + (b.look[i] - v) * k) as V3,
  fov: a.fov + (b.fov - a.fov) * k, roll: a.roll + (b.roll - a.roll) * k,
});
const full = (c: Shot): Cam => ({ fov: 40, roll: 0, ...c });
const run = (keys: Key[], f: number) => {
  let cur = full(keys[0].s(f));
  for (let i = 1; i < keys.length; i++) {
    const k = keys[i];
    if (f < k.f) break;
    cur = k.cut ? full(k.s(f)) : mix(cur, full(k.s(f)), glide((f - k.f) / (k.dur ?? 24)));
  }
  return cur;
};
const pushK = (f: number, f0: number, rate: number, punch = 0, n = 35) => {
  const x = Math.max(0, f - f0);
  let s = rate * x;
  if (punch > rate) for (let i = 0; i < Math.min(x, n); i++) s += (punch - rate) * Math.max(0, Math.min(1, (i + 0.5) / 8, (n - i - 0.5) / 8));
  return Math.exp(-s);
};
/** camera at pos looking at look, creeping toward look by `rate` per frame (punch = a faster snap-zoom for ~35 frames) */
const D = (pos: V3, look: V3, f0: number, fov = 40, rate = 0.0028, roll = 0, punch = 0) => (f: number): Shot => {
  const k = pushK(f, f0, rate, punch);
  return { pos: [look[0] + (pos[0] - look[0]) * k, look[1] + (pos[1] - look[1]) * k, look[2] + (pos[2] - look[2]) * k], look, fov, roll };
};
/** orbit about +y from angle a0 to a1 over f0..f1 (then holds the angle), with a creeping push-in */
const Oc = (look: V3, r: number, h: number, a0: number, a1: number, f0: number, f1: number, fov = 40, rate = 0.0028, roll = 0) => (f: number): Shot => {
  const a = a0 + (a1 - a0) * smooth((f - f0) / (f1 - f0)), k = pushK(f, f0, rate);
  return { pos: [look[0] + Math.sin(a) * r * k, look[1] + (h - look[1]) * k, look[2] + Math.cos(a) * r * k], look, fov, roll };
};
const R4 = 0.07; // ~4 degrees of roll

const NARR_EYE = (m: V3): V3 => [m[0], 1.38, m[2]];

const CAMS: Record<number, Key[]> = {
  1: [
    { f: 0, s: D(ST(0.3, 1.5, 2.9), NARR_EYE(MARK.narrSt), 0, 40, 0.0036, R4, 0.007) },
    { f: 40, dur: 12, s: D(ST(0.5, 1.15, 2.2), ST(2.6, 1.0, -14), 40, 46, 0.002, 0.03) },
    { f: 90, dur: 14, s: D(ST(-4.8, 1.5, 8.2), ST(1.2, 1.0, 0.6), 90, 56, 0.003, 0.05, 0.005) },
  ],
  2: [{ f: A(2), s: Oc(S(0, 1.35, -3), 3.0, 1.5, -0.6, 0.05, A(2), A(2) + 25, 40, 0.003, -R4) }],
  3: [
    { f: A(3), s: D(S(-0.8, 1.5, -2.8), S(-2, 1.0, -9), A(3), 42, 0.0028) },
    { f: F(E.famicom + 0.12), dur: 14, s: D(S(0.8, 1.5, -2.8), S(2, 1.0, -9), A(3), 42, 0.0028) },
  ],
  4: [{ f: A(4), s: D(S(0.3, 1.5, -3.3), S(0, 1.25, -6.5), A(4), 48, 0.0035, -0.05, 0.006) }],
  5: [
    { f: A(5), s: D(SO(1.5, 1.2, 3.4), SO(0.3, 2.3, -12), A(5), 52, 0.0016) },
    { f: A(5) + 6, dur: 30, s: D(SO(1.0, 2.7, 2.6), SO(0.3, 2.2, -12), A(5) + 6, 52, 0.0022) },
  ],
  6: [{ f: A(6), s: D(SI(1.2, 1.25, -2.0), SI(0.2, 1.1, -4.4), A(6), 40, 0.0030) }, { f: F(E.fan) - 6, dur: 25, s: D(SI(-0.8, 1.2, -2.1), SI(0, 1.1, -4.4), F(E.fan) - 6, 40, 0.003) }],
  7: [
    { f: A(7), s: D(SI(0.2, 1.5, -2.2), SI(0, 1.55, -5.5), A(7), 40, 0.0025) },
    { f: F(E.kartuUp) - 3, cut: true, s: D(SI(0.2, 1.5, -2.2), SI(0, 1.55, -5.5), F(E.kartuUp) - 3, 40, 0.0022, 0.03, 0.007) },
  ],
  8: [{ f: A(8), s: (f) => { const z = 2.3 - (1.25 / FPS) * (f - SHOTS[7].a); return { pos: ST(5.8, 1.3, z + 3.0), look: ST(-3.0, 1.2, z), fov: 52, roll: R4 }; } }],
  9: [
    { f: A(9), s: D(ST(1.4, 0.9, 7.5), ST(-3.6, 1.0, -3.2), A(9), 56, 0.0025) },
    { f: F(E.pat) - 8, dur: 18, s: D(ST(-0.4, 1.35, 1.6), ST(-4.4, 1.0, -3.2), F(E.pat) - 8, 50, 0.003) },
  ],
  10: [{ f: A(10), s: D(K(0.6, 1.5, -0.4), K(-0.4, 1.35, -3.5), A(10), 46, 0.003, R4) }, { f: F(E.jerk1) - 2, cut: true, s: D(K(-0.2, 1.45, -1.4), K(-0.6, 1.4, -3.2), F(E.jerk1) - 2, 38, 0.003, -R4, 0.006) }],
  11: [{ f: A(11), s: D(ST(2.8, 1.3, 3.8), ST(-2.4, 1.0, -5.0), A(11), 54, 0.0028) }],
  12: [{ f: A(12), s: (f) => ({ pos: SI(-1.0 + (f - A(12)) * 0.03, 1.6, 2.4), look: SI(-4.2 + (f - A(12)) * 0.03, 1.5, -4.0), fov: 50, roll: 0 }) }],
  13: [{ f: A(13), s: D(S(0.4, 1.5, 0.0), S(0, 1.8, -3), A(13), 46, 0.005) }],
  14: [{ f: A(14), s: D(O(-1.0, 1.7, 3.0), O(3.2, 1.2, -9.4), A(14), 56, 0.0) }, { f: A(14) + 2, dur: 38, s: D(O(2.3, 1.45, -3.6), O(3.3, 1.2, -9.4), A(14) + 2, 44, 0.003, R4) }],
  15: [{ f: A(15), s: D(O(5.2, 1.45, -5.2), O(3.3, 1.15, -9.5), A(15), 42, 0.0028) }, { f: A(15) + 5, dur: 25, s: D(O(1.4, 1.45, -5.4), O(3.3, 1.15, -9.5), A(15) + 5, 42, 0.003) }],
  16: [{ f: A(16), s: D(O(-0.4, 1.4, -3.4), O(1.9, 1.1, -8.0), A(16), 54, 0.0035, R4, 0.006) }],
  17: [{ f: A(17), s: D(O(0.4, 1.9, 3.0), O(0.2, 1.1, -5.4), A(17), 56, 0.0028, R4) }],
  18: [{ f: A(18), s: D(AR(-5.5, 1.5, -1.6), AR(-3.6, 1.1, -7), A(18), 50, 0.002) }, { f: A(18) + 6, dur: 40, s: D(AR(1.4, 1.4, 0.0), AR(0.6, 1.2, -7), A(18) + 6, 46, 0.002) }],
  19: [{ f: A(19), s: D(AR(0.9, 1.5, 1.6), AR(0, 1.4, -4), A(19), 46, 0.0028) }, { f: F(E.cabOn) - 3, cut: true, s: D(AR(0.7, 1.45, -1.9), AR(0, 1.45, -4), F(E.cabOn) - 3, 46, 0.003, 0, 0.007) }],
  20: [{ f: A(20), s: D(S(-3.4, 1.5, -2.0), S(-3.0, 1.1, -9), A(20), 52, 0.0025) }, { f: A(20) + 50, dur: 60, s: D(S(0.8, 1.5, -2.2), S(1.2, 1.1, -9), A(20) + 50, 52, 0.0025) }],
  21: [{ f: A(21), s: D(S(0.6, 1.45, -0.8), S(0, 1.15, -3.2), A(21), 46, 0.003, R4) }],
  22: [{ f: A(22), s: D(S(0.3, 1.45, -0.5), S(0.2, 1.4, -3.2), A(22), 46, 0.004, 0, 0.007) }, { f: F(E.wink) - 4, cut: true, s: D(S(0.2, 1.42, -0.9), S(0.1, 1.42, -3.2), F(E.wink) - 4, 36, 0.003, 0, 0.007) }],
};

const KICKS: [number, number][] = [
  [E.taxiStop, 1.0], [E.famicom, 0.4], [E.gameboy, 0.4], [E.sweep, 0.7], [E.fan, 0.3], [E.kartuUp, 0.9], [E.taxiIn9 + 0.45, 0.4], [E.pat, 0.4],
  [E.jerk1, 0.7], [E.jerk2, 0.7], [E.fail, 1.0], [E.boxFall, 0.8], [E.bulb, 0.4], [E.grab, 0.6], [E.laris, 0.9], [E.cabOn, 0.9], [E.bowlRoll + 0.3, 0.4], [E.wink, 0.4],
];
export const kickAt = (t: number) => {
  let a = 0;
  for (const [t0, g] of KICKS) {
    const n = Math.floor((t - t0) * FPS + 1e-6);
    if (n >= 0 && n < 7) a += g * (n % 2 ? -1 : 1) * (1 - n / 7) ** 1.5;
  }
  return a;
};
export const camAt = (id: number, f: number): Cam => {
  const c = run(CAMS[id], f), a = kickAt(f / FPS);
  if (!a) return c;
  const d: V3 = [c.look[0] - c.pos[0], c.look[1] - c.pos[1], c.look[2] - c.pos[2]];
  const L = Math.hypot(...d), h = Math.hypot(d[0], d[2]) || 1;
  const m = (3 / 640) * Math.tan((c.fov * Math.PI) / 360) * L * a;
  return { ...c, look: [c.look[0] - (d[2] / h) * m, c.look[1] + 0.6 * m, c.look[2] + (d[0] / h) * m], roll: c.roll + a * 0.004 };
};

// ---------------- lens ----------------
export type Dof = { f: number; dur?: number; cInf: number; focus?: (f: number) => V3 };
const eyes = (p: V3, h = 1.38): (() => V3) => () => [p[0], h, p[2]];
const DOF_SHOT: [number, number, (() => V3) | undefined][] = [
  [1, 15, eyes(MARK.narrSt)], [2, 12, eyes(MARK.narrS)], [3, 10, undefined], [4, 10, eyes(MARK.narr3, 1.3)], [5, 0, undefined], [6, 16, () => MARK.fan],
  [7, 14, eyes(MARK.craftIn)], [8, 10, undefined], [9, 8, undefined], [10, 12, eyes(MARK.narrK)], [11, 10, undefined], [12, 10, undefined], [13, 12, eyes(MARK.narrS)],
  [14, 0, undefined], [15, 12, undefined], [16, 14, undefined], [17, 0, undefined], [18, 8, undefined], [19, 12, eyes(MARK.narrArc)], [20, 10, undefined],
  [21, 12, eyes(MARK.narrS, 1.3)], [22, 14, eyes(MARK.narrS)],
];
export const DOF: Dof[] = [{ f: 0, cInf: 0 }, ...DOF_SHOT.map(([id, c, focus]) => ({ f: A(id), cInf: c, focus })),
  { f: F(E.stretch) - 4, cInf: 14 }, { f: A(14) + 42, cInf: 10 }].sort((a, b) => a.f - b.f);
export const dofAt = (f: number) => {
  let i = 0; while (i + 1 < DOF.length && f >= DOF[i + 1].f) i++;
  const d = DOF[i], p = DOF[Math.max(0, i - 1)];
  const k = d.dur ? Math.min(1, (f - d.f) / d.dur) : 1;
  return { cInf: p.cInf + (d.cInf - p.cInf) * k, focus: d.focus };
};
export const D0 = 0;
