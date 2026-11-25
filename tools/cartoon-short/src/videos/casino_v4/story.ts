// v2 timeline of "The Clocks Came Down". Every time comes from beats.json (generated from the voice's words.json by
// audio/beats.py), so a new voice only means regenerating beats.json. Camera grammar: cuts on big reframes,
// smootherstep glides, every hold creeps in, 7-frame flip kicks on impacts.
// Sets: CASINO x 0, TOWN x 400, SALOON x 800, HOSPITAL x 1200.
import beats from "./beats.json";

export const FPS = 30;
export const W = beats as Record<string, number>;
export const TOTAL = W.TOTAL;
export const D0 = 0;
export type V3 = [number, number, number];

export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const smooth = (x: number) => { const u = clamp01(x); return u * u * (3 - 2 * u); };
export const easeOut = (u: number) => 1 - (1 - clamp01(u)) ** 4;
export const F = (t: number) => Math.round(t * FPS);

export type SetName = "casino" | "town" | "saloon" | "hospital";
const C = (x: number, y: number, z: number): V3 => [x, y, z];
const T = (x: number, y: number, z: number): V3 => [400 + x, y, z];
const S = (x: number, y: number, z: number): V3 => [800 + x, y, z];
const H = (x: number, y: number, z: number): V3 => [1200 + x, y, z];

// ---------------- shots ----------------
export type Light = "day" | "golden";
export type ShotDef = { id: number; a: number; b: number; light: Light; set: SetName; sunAz?: number; sunEl?: number };
const IN = { sunEl: 64, sunAz: 145 };
const cuts = [0, F(W.they) - 2, F(W.but) - 3, F(W.in1931) - 2, F(W.firstCasinos) - 2, F(W.then) - 2, F(W.aMan) - 2, F(W.so) - 2,
  F(W.andDown) - 8, F(W.luckily) - 2, F(W.think) - 2, F(W.years) - 2, F(W.soThe) - 2, F(W.andToday) - 2, TOTAL];
const SETS: [SetName, Partial<ShotDef>][] = [["casino", IN], ["casino", IN], ["town", { sunAz: 110, sunEl: 40 }], ["town", { sunAz: 100, sunEl: 45 }],
  ["saloon", IN], ["saloon", IN], ["saloon", IN], ["saloon", IN], ["saloon", IN], ["saloon", IN], ["hospital", IN], ["casino", IN], ["casino", IN], ["casino", IN]];
export const SHOTS: ShotDef[] = SETS.map(([set, x], i) => ({ id: i + 1, a: cuts[i], b: cuts[i + 1], light: "day", set, ...x }));
/** crossfades (frames) at place/time changes; a white 4-frame flash after the hook */
export const XFADE: Record<number, number> = { 3: 10, 5: 8, 11: 10, 12: 8 };
export const FLASH_AT = SHOTS[1].a;
const A = (id: number) => SHOTS[id - 1].a - (XFADE[id] ?? 0); // first frame a shot is drawn (crossfade included)

export const shotAt = (f: number) => SHOTS.find((s) => f >= s.a && f < s.b) ?? SHOTS[SHOTS.length - 1];
export const layersAt = (f: number): { id: number; alpha: number }[] => {
  for (const s of SHOTS) {
    const x = XFADE[s.id];
    if (x && f >= s.a - x / 2 && f < s.a + x / 2) return [{ id: s.id - 1, alpha: 1 }, { id: s.id, alpha: (f - (s.a - x / 2) + 1) / (x + 1) }];
  }
  return [{ id: shotAt(f).id, alpha: 1 }];
};

// ---------------- the saloon clock (shots 5-9) ----------------
export const CLOCK_SALOON: V3 = S(0, 3.25, -9.82);
export const CLOCK_R = 0.85;
const FALL0 = W.andDown + 0.1, FALL1 = W.came + 0.02;
/** 0 on the wall .. 1 on the floor */
export const clockFall = (t: number) => (t < FALL0 ? 0 : Math.min(1, ((t - FALL0) / (FALL1 - FALL0)) ** 2));
/** anticipation: the clock rattles on its nail before it lets go */
export const clockWobble = (t: number) => { const u = clamp01((t - (W.andDown - 0.55)) / 0.65); return t >= FALL0 ? 0 : 0.11 * u * Math.sin(t * 38); };
export const clockGone = (id: number) => id >= 10;
export const CRASH = FALL1;

// ---------------- the deed's bullet-time path ----------------
export const DEED_A: V3 = [800 - 1.08, 1.24, -1.1];   // leaves the loser's hand
export const DEED_B: V3 = [800 - 4.0, 0.925, -3.9];   // lands on the high rollers' felt
const L0 = W.lost + 0.05, L1 = W.threeAM + 0.45;
/** story progress 0..1 of the throw: a fast launch, slow motion while the camera orbits, then a fast landing */
export const deedP = (t: number) =>
  t < L0 ? 0 : t < L0 + 0.15 ? 0.15 * ((t - L0) / 0.15) : t < L1 ? 0.15 + 0.3 * ((t - L0 - 0.15) / (L1 - L0 - 0.15)) : Math.min(1, 0.45 + 0.55 * ((t - L1) / 0.4));
export const deedPos = (p: number): V3 => [DEED_A[0] + (DEED_B[0] - DEED_A[0]) * p, DEED_A[1] + (DEED_B[1] - DEED_A[1]) * p + 0.9 * Math.sin(Math.PI * p), DEED_A[2] + (DEED_B[2] - DEED_A[2]) * p];
export const DEED_FLY = [L0, L1 + 0.4] as const;

// ---------------- chips (slow motion after the fist lands) ----------------
export const TABLE_R: V3 = [800 - 3.6, 0.925, -3.75];
export const CH0 = W.take + 0.05, SLOW = 0.32, SLOW_DUR = 1.05;
export const chipTime = (t: number) => (t < CH0 ? -1 : t < CH0 + SLOW_DUR ? (t - CH0) * SLOW : SLOW * SLOW_DUR + (t - CH0 - SLOW_DUR));
export const CHIP_ORBIT = [CH0 + 0.2, CH0 + SLOW_DUR] as const;
export const CHIP_CENTER: V3 = [TABLE_R[0], 1.25, TABLE_R[2]];


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
const D = (pos: V3, look: V3, f0: number, fov = 40, rate = 0.0025, roll = 0, punch = 0) => (f: number): Shot => {
  const k = pushK(f, f0, rate, punch);
  return { pos: [look[0] + (pos[0] - look[0]) * k, look[1] + (pos[1] - look[1]) * k, look[2] + (pos[2] - look[2]) * k], look, fov, roll };
};
/** orbit around a look point: angle from a0 to a1 (radians, about +y) over the shot */
const O = (look: V3, r: number, h: number, a0: number, a1: number, f0: number, f1: number, fov = 40) => (f: number): Shot => {
  const a = a0 + (a1 - a0) * smooth((f - f0) / (f1 - f0));
  return { pos: [look[0] + Math.sin(a) * r, h, look[2] + Math.cos(a) * r], look, fov, roll: 0 };
};

// character marks (cast.ts reads these)
export const MARK = {
  gambler: C(0, 0, -2.75),
  phone: C(0.2, 1.42, -2.42),        // the phone insert card (shot 14)
  psych: C(5.2, 0, 6.75),
  studies: C(4.74, 0, 6.95),
  wallGambler: C(0.2, 0, -16.2),
  owner: S(1.6, 0, -8.2),
  rollers: [S(-3.6, 0, -2.4), S(-2.3, 0, -3.1), S(-4.9, 0, -3.2)] as V3[],
  door: S(-8.4, 0, -0.6),
  loser: S(-1.35, 0, -1.25),
  nurse: H(-5, 0, -6.6),
  patients: [H(-2.6, 0.24, -4.6), H(-1.3, 0.24, -4.6), H(1.3, 0.24, -4.6), H(2.6, 0.24, -4.6), H(-1.3, 0.24, -1.6), H(1.3, 0.24, -1.6)] as V3[],
};

const CAMS: Record<number, Key[]> = {
  1: [
    { f: 0, s: D(C(0.8, 1.75, 13), C(0, 1.4, -3.5), 0, 44, 0.0028) },
    { f: F(W.andEverybody) - 2, cut: true, s: D(C(0.9, 1.45, 1.6), C(0, 1.3, -2.75), F(W.andEverybody), 36, 0.0025, 0.03) },
  ],
  2: [
    { f: A(2), s: D(C(0.4, 1.4, 0.2), C(0, 1.3, -2.75), A(2), 34, 0.003, -0.035, 0.007) },
    { f: F(W.noClocks) - 2, cut: true, s: D(C(1.2, 2.3, -10.5), C(0, 3.0, -17.9), F(W.noClocks), 38, 0.003) },
    { f: F(W.noWindows) - 2, cut: true, s: D(C(-7.6, 2.0, 3.2), C(-14, 2.6, 5.6), F(W.noWindows), 40, 0.003, 0.03) },
    { f: F(W.just) - 2, cut: true, s: D(C(3.6, 1.6, 2.4), C(0, 1.15, -3.2), F(W.just), 42, 0.0022) },
    { f: F(W.carpet) - 4, dur: 30, s: (f) => ({ ...D(C(0.9, 3.4, 1.2), C(0.4, 0, -0.9), F(W.carpet), 52, 0.002)(f), roll: 0.14 * glide((f - F(W.carpet)) / 45) }) },
  ],
  3: [{ f: A(3), s: D(T(0.5, 11, 60), T(0, 2.2, -12), A(3), 40, 0.0018) }],
  4: [
    { f: A(4), s: D(T(1.6, 1.6, 22), T(0, 2.6, -2), A(4), 40, 0.0022) },
    { f: F(W.nevada) - 10, dur: 26, s: D(T(1.0, 1.5, 15), T(0, 5.6, 4), F(W.nevada), 44, 0.002) },
    { f: F(W.legal) - 6, dur: 26, s: D(T(-2.6, 1.7, 15), T(6.9, 4.0, 7), F(W.legal), 40, 0.0025) },
  ],
  5: [
    { f: A(5), s: D(S(1.8, 2.0, -1.5), S(0.6, 2.4, -9.5), A(5), 40, 0.0025) },
    { f: F(W.big) - 6, dur: 22, s: D(S(0.6, 2.9, -4.2), S(0, 3.15, -9.8), F(W.big), 36, 0.003, 0.03, 0.006) },
  ],
  6: [{ f: A(6), s: D(S(-1.6, 1.7, 3.4), S(-3.6, 1.3, -2.8), A(6), 40, 0.0028) }],
  7: [
    { f: A(7), s: D(S(-0.85, 1.45, 1.35), S(-1.5, 1.35, -1.25), A(7), 38, 0.0025, -0.03) },
    { f: F(DEED_FLY[0]) + 3, cut: true, s: (f) => { // bullet time: orbit 200 degrees around the tumbling deed
      const t = f / FPS, P = deedPos(deedP(t)), u = smooth((t - DEED_FLY[0] - 0.1) / (DEED_FLY[1] - DEED_FLY[0] - 0.45)), a = 1.25 + 3.0 * u;
      return { pos: [P[0] + Math.sin(a) * 1.15, P[1] + 0.25 - 0.15 * u, P[2] + Math.cos(a) * 1.15] as V3, look: P, fov: 42, roll: 0.06 * Math.sin(a) };
    } },
    { f: F(DEED_FLY[1]) - 6, cut: true, s: D(S(-1.3, 1.7, 1.2), S(-3.3, 1.0, -3.4), F(DEED_FLY[1]) - 6, 40, 0.0025) },
    { f: F(W.does) - 2, cut: true, s: D(S(0.25, 3.15, -6.8), S(0, 3.25, -9.8), F(W.does), 34, 0.0028, 0, 0.006) },
    { f: F(W.telling) + 9, cut: true, s: D(S(-1.05, 1.42, 1.05), S(-1.35, 1.36, -1.25), F(W.telling) + 9, 32, 0.003, 0.04) },
  ],
  8: [
    { f: A(8), s: D(S(-0.6, 1.8, 4.6), S(-1.2, 1.45, -4.5), A(8), 42, 0.0022) },
    { f: F(W.take) - 2, cut: true, s: D(S(-3.0, 1.5, 0.5), S(-3.6, 1.12, -2.6), F(W.take), 38, 0.003, -0.035, 0.006) },
    { f: F(W.take) + 7, cut: true, s: (f) => { // slow-motion orbit over the jumping chips
      const u = smooth((f / FPS - W.take - 0.23) / 1.0), a = 2.1 + 1.9 * u; // far side of the table: clear of every character card
      return { pos: [TABLE_R[0] + Math.sin(a) * 1.5, 1.55 - 0.15 * u, TABLE_R[2] + Math.cos(a) * 1.5] as V3, look: [TABLE_R[0], 1.05, TABLE_R[2]] as V3, fov: 44, roll: 0 };
    } },
    { f: F(W.orWe) - 2, cut: true, s: D(S(1.8, 1.8, 4.8), S(-4.0, 1.3, -1.8), F(W.orWe), 44, 0.0022) },
  ],
  9: [{ f: A(9), s: O(S(0.2, 1.9, -9.0), 5.2, 2.2, -0.32, 0.12, A(9), SHOTS[8].b, 42) }],
  10: [
    { f: A(10), s: O(S(-3.6, 1.15, -3.6), 4.0, 1.9, 0.55, 0.15, A(10), F(W.unluckily), 42) },
    { f: F(W.unluckily) - 2, cut: true, s: D(S(-3.0, 1.45, -0.1), S(-3.5, 1.35, -2.6), F(W.unluckily), 33, 0.003, 0.045) },
  ],
  11: [
    { f: A(11), s: D(H(3.4, 2.0, 6.0), H(0, 1.2, -4.6), A(11), 44, 0.0022) },
    { f: F(W.nobody) - 2, cut: true, s: D(H(1.9, 0.95, -2.4), H(1.25, 1.9, -7.8), F(W.nobody), 42, 0.0025, -0.03) },
  ],
  12: [
    { f: A(12), s: D(C(6.2, 1.65, 10.4), C(5.0, 1.25, 6.75), A(12), 40, 0.0022) },
    { f: F(W.fifteen) - 2, cut: true, s: O(C(4.9, 1.2, 6.9), 2.7, 1.45, 0.45, -0.55, F(W.fifteen), F(W.found), 44) },
    { f: F(W.found) - 2, cut: true, s: D(C(4.75, 1.35, 9.9), C(4.75, 1.0, 6.8), F(W.found), 42, 0.0025, 0.03) },
  ],
  13: [
    { f: A(13), s: D(C(1.6, 1.8, -8.2), C(0, 2.2, -17), A(13), 42, 0.0022) },
    { f: F(W.theGamblers) - 2, cut: true, s: D(C(0.45, 1.9, -12.0), C(0.15, 2.35, -16.4), F(W.theGamblers), 42, 0.003, -0.03) },
  ],
  14: [
    { f: A(14), s: D(C(-1.2, 1.6, 0.6), C(0, 1.3, -2.75), A(14), 38, 0.0022) },
    { f: F(W.theClock) - 2, cut: true, s: D(C(0.35, 1.36, -0.55), C(0.05, 1.3, -2.75), F(W.theClock), 32, 0.003, 0.03, 0.006) },
    { f: F(W.right) - 2, cut: true, s: D(C(0.2, 1.42, -1.98), C(0.2, 1.42, -2.42), F(W.right), 40, 0.0015) },
    { f: F(W.loseEnd_e) + 4, cut: true, s: (f) => {
      const u = glide((f - F(W.loseEnd_e) - 4) / 40), a = C(0.7, 1.5, -0.3), b = C(4.2, 4.4, 9.0);
      return { pos: a.map((v, i) => v + (b[i] - v) * u) as V3, look: [0.1 * (1 - u), 1.3 - 0.4 * u, -2.75] as V3, fov: 34 + 12 * u, roll: 0 };
    } },
  ],
};

const KICKS: [number, number][] = [[W.noClocks, 0.4], [W.does, 0.6], [W.take, 0.9], [CRASH, 1.6], [W.proof + 0.05, 0.6], [W.theClock, 0.3]];
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
const eyesOf = (p: V3, h = 1.35): (() => V3) => () => [p[0], p[1] + h, p[2]];
export const DOF: Dof[] = [
  { f: 0, cInf: 0 },
  { f: F(W.andEverybody) - 2, cInf: 13, focus: eyesOf(MARK.gambler) },
  { f: A(2), cInf: 14, focus: eyesOf(MARK.gambler) },
  { f: F(W.noClocks) - 2, cInf: 0 },
  { f: F(W.just) - 2, cInf: 8, focus: eyesOf(MARK.gambler) },
  { f: F(W.carpet) - 4, cInf: 0 },
  { f: A(5), cInf: 6 },
  { f: A(6), cInf: 10, focus: eyesOf(MARK.rollers[0]) },
  { f: A(7), cInf: 13, focus: eyesOf(MARK.loser) },
  { f: F(DEED_FLY[0]) + 3, cInf: 14, focus: (f) => deedPos(deedP(f / FPS)) },
  { f: F(DEED_FLY[1]) - 6, cInf: 6 },
  { f: F(W.does) - 2, cInf: 12 },
  { f: F(W.telling) + 9, cInf: 14, focus: eyesOf(MARK.loser) },
  { f: A(8), cInf: 0 },
  { f: F(W.take) - 2, cInf: 14, focus: eyesOf(MARK.rollers[0]) },
  { f: F(W.take) + 7, cInf: 10, focus: () => [TABLE_R[0], 1.1, TABLE_R[2]] },
  { f: F(W.orWe) - 2, cInf: 0 },
  { f: A(9), cInf: 5 },
  { f: A(10), cInf: 5 },
  { f: F(W.unluckily) - 2, cInf: 13, focus: eyesOf(MARK.rollers[0]) },
  { f: SHOTS[10].a, cInf: 0 },
  { f: F(W.nobody) - 2, cInf: 10, focus: eyesOf(MARK.patients[2], 1.15) },
  { f: SHOTS[11].a, cInf: 10, focus: eyesOf(MARK.psych) },
  { f: F(W.fifteen) - 2, cInf: 8, focus: () => [4.9, 1.2, 6.9] },
  { f: F(W.found) - 2, cInf: 9, focus: () => [4.85, 1.0, 6.85] },
  { f: SHOTS[12].a, cInf: 0 },
  { f: F(W.theGamblers) - 2, cInf: 10, focus: eyesOf(MARK.wallGambler) },
  { f: SHOTS[13].a, cInf: 10, focus: eyesOf(MARK.gambler) },
  { f: F(W.theClock) - 2, cInf: 14, focus: eyesOf(MARK.gambler) },
  { f: F(W.right) - 2, cInf: 16, focus: () => MARK.phone },
  { f: F(W.loseEnd_e) + 4, cInf: 12, focus: eyesOf(MARK.gambler) },
  { f: F(W.loseEnd_e) + 20, dur: 30, cInf: 0, focus: eyesOf(MARK.gambler) },
];
export const dofAt = (f: number) => {
  let i = 0; while (i + 1 < DOF.length && f >= DOF[i + 1].f) i++;
  const d = DOF[i], p = DOF[Math.max(0, i - 1)];
  const k = d.dur ? Math.min(1, (f - d.f) / d.dur) : 1;
  return { cInf: p.cInf + (d.cInf - p.cInf) * k, focus: d.focus };
};
