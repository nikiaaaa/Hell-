// Timeline of "The Clocks Came Down": shots timed to the voice words (words.json), camera grammar from the cartoon-3d-short
// skill: cuts on big reframes, smootherstep glides 18-40 f, every hold creeps in, 7-frame flip kicks on impacts.
// Four sets live far apart in one world (sets.ts): CASINO at x 0, TOWN at x 400, SALOON at x 800, HOSPITAL at x 1200.
export const FPS = 30;
export const TOTAL = 2110;
export const D0 = 0; // floor height (build.ts helpers default to it)
export type V3 = [number, number, number];

export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const smooth = (x: number) => { const u = clamp01(x); return u * u * (3 - 2 * u); };
export const easeOut = (u: number) => 1 - (1 - clamp01(u)) ** 4;

// ---------------- sets ----------------
export type SetName = "casino" | "town" | "saloon" | "hospital";
export const SET_X: Record<SetName, number> = { casino: 0, town: 400, saloon: 800, hospital: 1200 };
const C = (x: number, y: number, z: number): V3 => [x, y, z];
const T = (x: number, y: number, z: number): V3 => [400 + x, y, z];
const S = (x: number, y: number, z: number): V3 => [800 + x, y, z];
const H = (x: number, y: number, z: number): V3 => [1200 + x, y, z];

// key story times (s), all from words.json
export const W = {
  andEverybody: 2.33, lose: 5.08, noClocks: 6.85, noWindows: 8.49, just: 10.18, carpet: 11.86, but: 14.03,
  in1931: 16.2, legal: 18.48, firstCasinos: 19.18, big: 20.17, then: 22.28, aMan: 25.27, does: 27.51, telling: 28.45,
  so: 30.56, take: 33.0, andDown: 35.89, came: 36.44, luckily: 37.64, unluckily: 40.17, think: 43.64, nobody: 46.5,
  years: 49.49, found: 53.74, soThe: 56.99, theGamblers: 59.99, andToday: 62.64, theClock: 65.11, right: 67.25,
};
const F = (t: number) => Math.round(t * FPS);

// ---------------- shots ----------------
export type Light = "day" | "golden";
export type ShotDef = { id: number; a: number; b: number; light: Light; set: SetName; sunAz?: number; sunEl?: number };
const IN = { sunEl: 64, sunAz: 145 }; // interiors have no ceiling: a high sun from behind-right keeps the floor and the walls facing the lens lit
export const SHOTS: ShotDef[] = [
  { id: 1, a: 0, b: 128, light: "day", set: "casino", ...IN },
  { id: 2, a: 128, b: 418, light: "day", set: "casino", ...IN },
  { id: 3, a: 418, b: 486, light: "day", set: "town", sunAz: 110, sunEl: 40 },
  { id: 4, a: 486, b: 576, light: "day", set: "town", sunAz: 100, sunEl: 45 },
  { id: 5, a: 576, b: 668, light: "day", set: "saloon", ...IN },
  { id: 6, a: 668, b: 758, light: "day", set: "saloon", ...IN },
  { id: 7, a: 758, b: 917, light: "day", set: "saloon", ...IN },
  { id: 8, a: 917, b: 1076, light: "day", set: "saloon", ...IN },
  { id: 9, a: 1076, b: 1129, light: "day", set: "saloon", ...IN },
  { id: 10, a: 1129, b: 1309, light: "day", set: "saloon", ...IN },
  { id: 11, a: 1309, b: 1485, light: "day", set: "hospital", ...IN },
  { id: 12, a: 1485, b: 1710, light: "day", set: "casino", ...IN },
  { id: 13, a: 1710, b: 1879, light: "day", set: "casino", ...IN },
  { id: 14, a: 1879, b: TOTAL, light: "day", set: "casino", ...IN },
];
/** crossfades (frames) at place/time changes; a white 4-frame flash after the hook */
export const XFADE: Record<number, number> = { 3: 10, 5: 8, 11: 10, 12: 8 };
export const FLASH_AT = 128;

export const shotAt = (f: number) => SHOTS.find((s) => f >= s.a && f < s.b) ?? SHOTS[SHOTS.length - 1];
export const layersAt = (f: number): { id: number; alpha: number }[] => {
  for (const s of SHOTS) {
    const x = XFADE[s.id];
    if (x && f >= s.a - x / 2 && f < s.a + x / 2) return [{ id: s.id - 1, alpha: 1 }, { id: s.id, alpha: (f - (s.a - x / 2) + 1) / (x + 1) }];
  }
  return [{ id: shotAt(f).id, alpha: 1 }];
};

// ---------------- the falling clock (shot 9) ----------------
export const CLOCK_SALOON: V3 = S(0, 3.25, -9.82);
export const CLOCK_R = 0.85;
const FALL0 = W.andDown + 0.15, FALL1 = W.came;
/** 0 on the wall .. 1 on the floor; the clock tips off its nail, then drops */
export const clockFall = (t: number) => (t < FALL0 ? 0 : Math.min(1, ((t - FALL0) / (FALL1 - FALL0)) ** 2));
export const clockGone = (id: number) => id >= 10;

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
/** push-in factor since f0 (subject grows ~rate per frame); punch raises it for the first n frames */
const pushK = (f: number, f0: number, rate: number, punch = 0, n = 35) => {
  const x = Math.max(0, f - f0);
  let s = rate * x;
  if (punch > rate) for (let i = 0; i < Math.min(x, n); i++) s += (punch - rate) * Math.max(0, Math.min(1, (i + 0.5) / 8, (n - i - 0.5) / 8));
  return Math.exp(-s);
};
/** a framing that dollies toward its look point from frame f0 */
const D = (pos: V3, look: V3, f0: number, fov = 40, rate = 0.0025, roll = 0, punch = 0) => (f: number): Shot => {
  const k = pushK(f, f0, rate, punch);
  return { pos: [look[0] + (pos[0] - look[0]) * k, look[1] + (pos[1] - look[1]) * k, look[2] + (pos[2] - look[2]) * k], look, fov, roll };
};

// characters' marks (cast.ts reads these)
export const MARK = {
  gambler: C(0, 0, -2.75),          // the slot player (shots 1, 2, 14)
  psych: C(5.2, 0, 6.75),           // the psychologist with the studies (shot 12), in front of the z 5.6 slot row
  wallGambler: C(0.2, 0, -16.2),    // smug high roller in front of the empty wall (shot 13)
  owner: S(1.6, 0, -8.2),           // saloon owner by the clock (shots 5, 8, 10)
  rollers: [S(-3.6, 0, -2.4), S(-2.3, 0, -3.1), S(-4.9, 0, -3.2)] as V3[], // high rollers at the felt table
  loser: S(3.1, 0, -1.6),           // the man who lost his ranch (shot 7)
  patients: [H(-2.6, 0.24, -4.6), H(-1.3, 0.24, -4.6), H(1.3, 0.24, -4.6), H(2.6, 0.24, -4.6), H(-1.3, 0.24, -1.6), H(1.3, 0.24, -1.6)] as V3[],
};

const CAMS: Record<number, Key[]> = {
  1: [
    { f: 0, s: D(C(0.8, 1.75, 13), C(0, 1.4, -3.5), 0, 44, 0.0028) },
    { f: F(W.andEverybody) - 2, cut: true, s: D(C(0.9, 1.45, 1.6), C(0, 1.3, -2.75), F(W.andEverybody), 36, 0.0025, 0.03) },
  ],
  2: [
    { f: 128, s: D(C(0.4, 1.4, 0.2), C(0, 1.3, -2.75), 128, 34, 0.003, -0.035, 0.007) },
    { f: F(W.noClocks) - 2, cut: true, s: D(C(1.2, 2.3, -10.5), C(0, 3.0, -17.9), F(W.noClocks), 38, 0.003) },
    { f: F(W.noWindows) - 2, cut: true, s: D(C(-7.6, 2.0, 3.2), C(-14, 2.6, 5.6), F(W.noWindows), 40, 0.003, 0.03) },
    { f: F(W.just) - 2, cut: true, s: D(C(3.6, 1.6, 2.4), C(0, 1.15, -3.2), F(W.just), 42, 0.0022) },
    { f: F(W.carpet) - 4, dur: 30, s: (f) => ({ ...D(C(0.9, 3.4, 1.2), C(0.4, 0, -0.9), F(W.carpet), 52, 0.002)(f), roll: 0.12 * glide((f - F(W.carpet)) / 50) }) },
  ],
  3: [{ f: 410, s: D(T(0.5, 11, 60), T(0, 2.2, -12), 410, 40, 0.0018) }],
  4: [
    { f: 486, s: D(T(2.2, 1.65, 20), T(0, 2.0, -2), 486, 40, 0.0025) },
    { f: F(W.legal) - 12, dur: 28, s: D(T(1.5, 1.7, 9), T(-6.5, 4.2, -2.5), F(W.legal), 38, 0.0025) },
  ],
  5: [
    { f: 570, s: D(S(1.8, 2.0, -1.5), S(0.6, 2.4, -9.5), 570, 40, 0.0025) },
    { f: F(W.big) - 6, dur: 22, s: D(S(0.6, 2.9, -4.2), S(0, 3.15, -9.8), F(W.big), 36, 0.003, 0.03, 0.006) },
  ],
  6: [{ f: 668, s: D(S(-1.6, 1.7, 3.4), S(-3.6, 1.3, -2.8), 668, 40, 0.0028) }],
  7: [
    { f: 758, s: D(S(3.45, 1.42, 1.0), S(3.1, 1.35, -1.6), 758, 34, 0.0025, -0.03) },
    { f: F(W.does) - 2, cut: true, s: D(S(0.25, 3.15, -6.8), S(0, 3.25, -9.8), F(W.does), 34, 0.0028, 0, 0.006) },
    { f: F(W.telling) + 9, cut: true, s: D(S(3.4, 1.4, 0.7), S(3.1, 1.36, -1.6), F(W.telling) + 9, 32, 0.003, 0.04) },
  ],
  8: [
    { f: 917, s: D(S(-0.6, 1.8, 4.6), S(-1.2, 1.45, -4.5), 917, 42, 0.0022) },
    { f: F(W.take) - 2, cut: true, s: D(S(-3.2, 1.45, -0.2), S(-3.6, 1.4, -2.4), F(W.take), 33, 0.003, -0.035, 0.006) },
  ],
  9: [{ f: 1076, s: D(S(0.9, 2.3, -4.2), S(0, 2.0, -9.8), 1076, 42, 0.0025) }],
  10: [
    { f: 1129, s: D(S(-1.4, 1.7, 3.4), S(-3.0, 1.3, -3.0), 1129, 42, 0.0025) },
    { f: F(W.unluckily) - 2, cut: true, s: D(S(-3.0, 1.45, -0.1), S(-3.5, 1.35, -2.6), F(W.unluckily), 33, 0.003, 0.045) },
  ],
  11: [
    { f: 1300, s: D(H(3.4, 2.0, 6.0), H(0, 1.2, -4.6), 1300, 44, 0.0022) },
    { f: F(W.nobody) - 2, cut: true, s: D(H(1.9, 0.95, -2.4), H(1.25, 1.9, -7.8), F(W.nobody), 42, 0.0025, -0.03) },
  ],
  12: [
    { f: 1478, s: D(C(6.2, 1.65, 10.4), C(5.2, 1.3, 6.75), 1478, 38, 0.0022) },
    { f: F(W.found) - 2, cut: true, s: D(C(5.45, 1.42, 8.9), C(5.2, 1.35, 6.75), F(W.found), 32, 0.003, 0.035) },
  ],
  13: [
    { f: 1710, s: D(C(1.6, 1.8, -8.2), C(0, 2.2, -17), 1710, 42, 0.0022) },
    { f: F(W.theGamblers) - 2, cut: true, s: D(C(0.45, 1.9, -12.0), C(0.15, 2.35, -16.4), F(W.theGamblers), 42, 0.003, -0.03) },
  ],
  14: [
    { f: 1879, s: D(C(-1.2, 1.6, 0.6), C(0, 1.3, -2.75), 1879, 38, 0.0022) },
    { f: F(W.theClock) - 2, cut: true, s: D(C(0.35, 1.36, -0.55), C(0.05, 1.3, -2.75), F(W.theClock), 32, 0.003, 0.03, 0.006) },
    { f: F(W.right) - 2, cut: true, s: (f) => {
      const u = glide((f - F(W.right)) / 85), a = C(0.6, 1.45, -0.2), b = C(4.2, 4.4, 9.0); // stays under the 5.2 m ceiling
      return { pos: a.map((v, i) => v + (b[i] - v) * u) as V3, look: [0.1 * (1 - u), 1.3 - 0.4 * u, -2.75] as V3, fov: 34 + 12 * u, roll: 0 };
    } },
  ],
};

// impact kicks: image offset flips sign every frame, decays to 0 in 7 f
const KICKS: [number, number][] = [[W.noClocks, 0.4], [W.does, 0.6], [W.came, 1.6], [W.take, 0.4], [W.theClock, 0.4]];
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
  { f: 128, cInf: 14, focus: eyesOf(MARK.gambler) },
  { f: F(W.noClocks) - 2, cInf: 0 },
  { f: F(W.just) - 2, cInf: 8, focus: eyesOf(MARK.gambler) },
  { f: F(W.carpet) - 4, cInf: 0 },
  { f: 418, cInf: 0 },
  { f: 576, cInf: 6 },
  { f: 668, cInf: 10, focus: eyesOf(MARK.rollers[0]) },
  { f: 758, cInf: 14, focus: eyesOf(MARK.loser) },
  { f: F(W.does) - 2, cInf: 12 },
  { f: F(W.telling) + 9, cInf: 14, focus: eyesOf(MARK.loser) },
  { f: 917, cInf: 0 },
  { f: F(W.take) - 2, cInf: 14, focus: eyesOf(MARK.rollers[0]) },
  { f: 1076, cInf: 6 },
  { f: 1129, cInf: 8, focus: eyesOf(MARK.rollers[1]) },
  { f: F(W.unluckily) - 2, cInf: 13, focus: eyesOf(MARK.rollers[0]) },
  { f: 1309, cInf: 0 },
  { f: F(W.nobody) - 2, cInf: 10, focus: eyesOf(MARK.patients[2], 1.15) },
  { f: 1485, cInf: 10, focus: eyesOf(MARK.psych) },
  { f: F(W.found) - 2, cInf: 14, focus: eyesOf(MARK.psych) },
  { f: 1710, cInf: 0 },
  { f: F(W.theGamblers) - 2, cInf: 10, focus: eyesOf(MARK.wallGambler) },
  { f: 1879, cInf: 10, focus: eyesOf(MARK.gambler) },
  { f: F(W.theClock) - 2, cInf: 14, focus: eyesOf(MARK.gambler) },
  { f: F(W.right) - 2, cInf: 14, focus: eyesOf(MARK.gambler) },
  { f: F(W.right) + 40, dur: 45, cInf: 0, focus: eyesOf(MARK.gambler) },
];
export const dofAt = (f: number) => {
  let i = 0; while (i + 1 < DOF.length && f >= DOF[i + 1].f) i++;
  const d = DOF[i], p = DOF[Math.max(0, i - 1)];
  const k = d.dur ? Math.min(1, (f - d.f) / d.dur) : 1;
  return { cInf: p.cInf + (d.cInf - p.cInf) * k, focus: d.focus };
};
