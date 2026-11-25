// Our cast as lit flat sprites in the 3D world (pool / actor / card shading kept from the cartoon-3d-short template).
// Round white heads, thin dark stick limbs. stage(id, t, cam) says who stands where in shot `id` at time t.
// Cards, effects and blobs live on the NOINK layer so the world ink pass never outlines their quads.
import * as THREE from "three";
import { Pen, bodyFront, bodySide, fxBurst, fxStars, fxShadow, fxContact, Outfit, Expr, FrontOpts, SideOpts, HeldProp, INK } from "./toon";
import { FPS, SHOTS, V3, MARK, W, clamp01, smooth, clockFall, CLOCK_SALOON, CRASH } from "./story";
import { NOINK } from "./ink";
import { cardShade, blobMaterial, CARD_K } from "./cardshade";

// ---------------- canvas pool ----------------
type Entry = { cv: HTMLCanvasElement; tex: THREE.CanvasTexture; w: number; h: number };
export type Req = { key: string; w: number; h: number; k: number; draw: (p: Pen) => void; tex?: THREE.CanvasTexture };
const makeEntry = (w: number, h: number): Entry => {
  const cv = document.createElement("canvas");
  cv.width = w; cv.height = h;
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  return { cv, tex, w, h };
};
export class Pool {
  private live = new Map<string, Entry>();
  private free: Entry[] = [];
  private reqs: Req[] = [];
  req(key: string, w: number, h: number, k: number, draw: (p: Pen) => void) {
    const r: Req = { key: `${w}x${h}|${key}`, w, h, k, draw };
    this.reqs.push(r);
    return r;
  }
  flush() {
    const want = new Map<string, Req[]>();
    for (const r of this.reqs) { const l = want.get(r.key); if (l) l.push(r); else want.set(r.key, [r]); }
    for (const [key, e] of this.live) if (!want.has(key)) { this.live.delete(key); this.free.push(e); }
    for (const [key, rs] of want) {
      let e = this.live.get(key);
      if (!e) {
        const r = rs[0], i = this.free.findIndex((x) => x.w === r.w && x.h === r.h);
        e = i >= 0 ? this.free.splice(i, 1)[0] : makeEntry(r.w, r.h);
        const g = e.cv.getContext("2d")!;
        g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, e.w, e.h); g.setTransform(r.k, 0, 0, r.k, 0, 0);
        r.draw(new Pen(g));
        e.tex.needsUpdate = true;
        this.live.set(key, e);
      }
      for (const r of rs) r.tex = e.tex;
    }
    this.reqs = [];
  }
}

// ---------------- sprite meshes ----------------
const blank = (() => { const c = document.createElement("canvas"); c.width = c.height = 2; return new THREE.CanvasTexture(c); })();
export const SU = 0.00216; // metres per design unit: 1000 units = 2.16 m
const BODY = (() => { const g = new THREE.PlaneGeometry(600 * SU, 1000 * SU); g.translate(0, (975 - 500) * SU, 0); return g; })();
const CARD = new THREE.PlaneGeometry(1, 1);

export class Actor {
  mesh: THREE.Mesh; mat: THREE.MeshLambertMaterial; dmat: THREE.MeshDepthMaterial; r: Req | null = null;
  constructor(parent: THREE.Object3D, geo: THREE.BufferGeometry = BODY) {
    this.mat = cardShade(new THREE.MeshLambertMaterial({ map: blank, alphaTest: 0.5, side: THREE.DoubleSide }));
    this.mat.alphaToCoverage = false;
    this.dmat = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: blank, alphaTest: 0.5, side: THREE.DoubleSide });
    this.mesh = new THREE.Mesh(geo, this.mat);
    this.mesh.customDepthMaterial = this.dmat;
    this.mesh.onBeforeRender = (r) => { const rt = r.getRenderTarget(); CARD_K.uPx.value = (rt ? rt.height : r.domElement.height) / 1920; };
    this.mesh.castShadow = false; this.mesh.receiveShadow = true; this.mesh.visible = false;
    this.mesh.rotation.order = "YXZ"; this.mesh.renderOrder = 1; this.mesh.layers.set(NOINK);
    parent.add(this.mesh);
  }
  bind() { const t = this.r?.tex; if (t) { this.mat.map = t; this.dmat.map = t; } }
}
export class Fx {
  mesh: THREE.Mesh; mat: THREE.MeshBasicMaterial; soft: THREE.MeshBasicMaterial; blob: THREE.MeshBasicMaterial; r: Req | null = null;
  constructor(parent: THREE.Object3D) {
    this.mat = new THREE.MeshBasicMaterial({ map: blank, alphaTest: 0.5, side: THREE.DoubleSide });
    this.mat.alphaToCoverage = false;
    this.soft = new THREE.MeshBasicMaterial({ map: blank, transparent: true, depthWrite: false, side: THREE.DoubleSide });
    this.blob = blobMaterial(blank);
    this.mesh = new THREE.Mesh(CARD, this.mat);
    this.mesh.visible = false; this.mesh.layers.set(NOINK);
    parent.add(this.mesh);
  }
  use(soft: boolean) { this.mesh.material = soft ? this.soft : this.mat; }
  bind() {
    const t = this.r?.tex;
    if (!t) return;
    if (this.r!.key.includes("|blob|")) {
      if (t.generateMipmaps) { t.generateMipmaps = false; t.minFilter = THREE.LinearFilter; t.needsUpdate = true; }
      this.blob.map = t; this.mesh.material = this.blob; this.mesh.renderOrder = 0.5;
    } else { this.mat.map = t; this.soft.map = t; this.mesh.renderOrder = 0; }
  }
}

// ---------------- placements ----------------
export type Place = {
  key: string; draw: (p: Pen) => void; x: number; y: number; z: number;
  scale?: number; mirror?: boolean; yaw?: number; roll?: number; size?: [number, number, number];
  /** mesh-level life (world.ts): id seeds breathing/sway, dy = hop height, sq = squash, lean = tilt, still = no idle sway */
  id?: number; dy?: number; sq?: number; lean?: number; still?: boolean;
};
export type FxPlace = { key: string; cw: number; ch: number; draw: (p: Pen) => void; x: number; y: number; z: number; w: number; h: number; flat?: boolean; rot?: number; soft?: boolean };
export type CamInfo = { pos: THREE.Vector3; right: THREE.Vector3; sun: THREE.Vector3 };
export type Stage = { places: Place[]; fx: FxPlace[] };

const hh = (i: number, s = 0) => { const v = Math.sin(i * 127.1 + s * 311.7) * 43758.5453; return v - Math.floor(v); };
const q = (v: number, n = 120) => Math.round(v * n) / n;
const tier = (d: number): [number, number, number] =>
  d < 3.2 ? [1800, 3000, 3.0] : d < 6.5 ? [1080, 1800, 1.8] : d < 16 ? [480, 800, 0.8] : [240, 400, 0.4];
const tmp = new THREE.Vector3();
let SUN = new THREE.Vector3(0.5, 0.75, -0.4).normalize();
const light2D = (cam: CamInfo) => {
  const sx = SUN.dot(cam.right), sy = -SUN.y;
  return Math.round(Math.atan2(sy, sx) / (Math.PI / 4)) * (Math.PI / 4);
};

// ---------------- life: blinks ----------------
const LEAD = 2 / FPS;
const LID = [0.5, 1, 1, 0.5];
const lidAt = (t: number, i: number) => {
  const f = Math.round(t * FPS);
  let s = Math.round(-60 * hh(i, 9));
  for (let n = 0; s <= f && n < 600; n++) {
    const k = f - s;
    if (k >= 0 && k < 4) return LID[k];
    s += Math.round(15 + 54 * hh(i * 31 + n, 13));
  }
  return 0;
};
const fkey = (o: object) => JSON.stringify(o, (_k, v) => (typeof v === "number" ? q(v) : v));

type Who = { i: number; o: Outfit; okey: string };
const person = (cam: CamInfo, who: Who, x: number, y: number, z: number, fo: FrontOpts, scale = 1): Place => {
  const d = cam.pos.distanceTo(tmp.set(x, y + 1.2, z)) / scale;
  const [w, h, k] = tier(d);
  const light = light2D(cam), seed = (who.i * 5 + 3) % 7 + 1;
  const f2: FrontOpts = { ...fo, light, seed };
  return { key: `F|${who.okey}|${fkey(f2)}`, x, y, z, scale, draw: (p) => bodyFront(p, who.o, f2), size: [w, h, k] };
};
/** side view (walking), facing screen-right when dir points to the camera's right */
const personSide = (cam: CamInfo, who: Who, x: number, y: number, z: number, dir: number, so: SideOpts, scale = 1): Place => {
  const d = cam.pos.distanceTo(tmp.set(x, y + 1.2, z)) / scale;
  const [w, h, k] = tier(d);
  const mirror = dir * cam.right.x < 0;
  const light = light2D(cam) * (mirror ? -1 : 1), seed = (who.i * 5 + 3) % 7 + 1;
  const s2: SideOpts = { ...so, light, seed };
  return { key: `S|${who.okey}|${fkey(s2)}`, x, y, z, scale, mirror, draw: (p) => bodySide(p, who.o, s2), size: [w, h, k] };
};
const CONTACT = "#8e8aa6", TAIL = "#b9b6cc";
const blob = (out: Stage, x: number, y: number, z: number, sc = 1) => {
  const hl = Math.hypot(SUN.x, SUN.z) || 1, ox = -SUN.x / hl, oz = -SUN.z / hl, rot = Math.atan2(-ox, -oz);
  const el = Math.asin(Math.min(0.99, Math.max(0.1, SUN.y)));
  const len = Math.min(2.4, Math.max(0.5, 1.6 / Math.tan(el))) * sc, h = len + 0.55 * sc, c = 0.3 * h;
  out.fx.push({ key: `blob|shadow|${TAIL}`, cw: 128, ch: 256, draw: (p) => fxShadow(p, TAIL), x: x + ox * c, y: y + 0.018, z: z + oz * c, w: 0.72 * sc, h, flat: true, rot });
  out.fx.push({ key: `blob|contact|${CONTACT}`, cw: 128, ch: 128, draw: (p) => fxContact(p, CONTACT), x, y: y + 0.022, z, w: 0.52 * sc, h: 0.4 * sc, flat: true, rot });
};

// ---------------- our cast (round white heads) ----------------
const WHITE_HEAD = "#fbfaf6";
const GAMBLER: Outfit = { jacket: "#e07b2a", pants: "#3b3f52", boots: INK, hat: "hair", hair: "#5a3b2a", skin: WHITE_HEAD };
const ROLLER: Outfit[] = [
  { jacket: "#2e2a36", pants: "#2e2a36", boots: INK, hat: "tophat", moustache: "#2a201a", buttons: "#e8c45a", build: "stout", skin: WHITE_HEAD },
  { jacket: "#6b2f4a", pants: "#2e2a36", boots: INK, hat: "tophat", buttons: "#e8c45a", skin: WHITE_HEAD },
  { jacket: "#2f5f6a", pants: "#3b3f52", boots: INK, hat: "hair", hair: "#a7a7ad", moustache: "#a7a7ad", build: "stout", skin: WHITE_HEAD },
];
const OWNER: Outfit = { jacket: "#8c3b4a", pants: "#3b3f52", boots: "#4a3426", hat: "hair", hair: "#2a201a", moustache: "#2a201a", buttons: "#e8c45a", build: "stout", skin: WHITE_HEAD };
const LOSER: Outfit = { jacket: "#b5653f", pants: "#4a4a5a", boots: "#4a3426", hat: "hair", hair: "#3a2a20", skin: WHITE_HEAD };
const PSYCH: Outfit = { jacket: "#f4f1ea", pants: "#3b5b9a", boots: INK, hat: "hair", hair: "#7a5a3a", buttons: "#9aa3b0", skin: WHITE_HEAD };
const NURSE: Outfit = { jacket: "#7fc2b8", pants: "#7fc2b8", boots: "#f4f1ea", hat: "hair", hair: "#2a201a", skin: WHITE_HEAD };
const PATIENTS: Outfit[] = ["#7fb2d8", "#c25a7a", "#5d7a3a", "#d9a441", "#7b5ac9", "#3f6fb5"].map((c, i) => ({
  jacket: c, pants: "#3b3f52", boots: "#4a3426", hat: i % 3 === 1 ? "cap" : "hair", hair: ["#5a3b2a", "#2a201a", "#a7a7ad"][i % 3], cap: "#e2453c", skin: WHITE_HEAD,
}));
const FOLK: Outfit[] = ["#3f6fb5", "#8c3b4a", "#5d7a3a", "#b5653f", "#2f5f6a", "#7b5ac9"].map((c, v) =>
  v % 2 ? { jacket: c, pants: "#3b3f52", boots: "#4a3426", hat: "bonnet", dress: ["#d9a441", "#c25a7a", "#5a8fc2"][v % 3], skin: WHITE_HEAD }
    : { jacket: c, pants: "#3b3f52", boots: "#4a3426", hat: "tophat", skin: WHITE_HEAD });
const EXTRA: Outfit[] = ["#3f6fb5", "#5d7a3a", "#7b5ac9", "#c25a7a", "#2f5f6a", "#d9a441"].map((c, i) => ({
  jacket: c, pants: "#3b3f52", boots: INK, hat: i % 2 ? "hair" : "cap", hair: ["#2a201a", "#a7a7ad", "#5a3b2a"][i % 3], cap: "#2a2a30", skin: WHITE_HEAD,
}));

// ---------------- held props + fx drawings ----------------
const STEPS = (k: number, n = 4) => Math.round(clamp01(k) * n) / n; // quantized drawing changes: few canvas redraws
const PHONE = (raise: number): HeldProp => ({ name: "phone", raise, draw: (p, hx, hy, u) => {
  p.poly([[hx - 14 * u, hy - 52 * u], [hx + 14 * u, hy - 52 * u], [hx + 14 * u, hy + 4 * u], [hx - 14 * u, hy + 4 * u]], "#1c1c22", 2.5 * u);
  p.poly([[hx - 10 * u, hy - 47 * u], [hx + 10 * u, hy - 47 * u], [hx + 10 * u, hy - 2 * u], [hx - 10 * u, hy - 2 * u]], "#2f6fb0", 0);
} });
const CLIPBOARD = (raise: number): HeldProp => ({ name: "clip", raise, draw: (p, hx, hy, u) => {
  p.poly([[hx - 26 * u, hy - 56 * u], [hx + 22 * u, hy - 56 * u], [hx + 22 * u, hy + 8 * u], [hx - 26 * u, hy + 8 * u]], "#a8763e", 2.5 * u);
  p.poly([[hx - 21 * u, hy - 50 * u], [hx + 17 * u, hy - 50 * u], [hx + 17 * u, hy + 3 * u], [hx - 21 * u, hy + 3 * u]], "#fbf8ef", 0);
  for (let i = 0; i < 6; i++) p.stroke([[hx - 16 * u, hy - 42 * u + i * 7 * u], [hx + (i % 2 ? 6 : 12) * u, hy - 42 * u + i * 7 * u]], 1.6 * u, "#7d848c");
} });
const BAG: HeldProp = { name: "bag", raise: 0.1, draw: (p, hx, hy, u) => {
  p.ell(hx + 4 * u, hy + 30 * u, 30 * u, 32 * u, "#e9d9a8", 3 * u);
  p.ell(hx + 4 * u, hy + 1 * u, 12 * u, 5 * u, "#c9b37a", 2.5 * u);
  const g = p.g, [cx, cy] = p.P(hx + 4 * u, hy + 32 * u);
  g.fillStyle = "#2f7a4a"; g.font = `bold ${Math.round(30 * u)}px Arial Black, Arial`; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("$", cx, cy);
} };
const FIST = (raise: number): HeldProp => ({ name: "fist", raise, draw: (p, hx, hy, u) => p.ell(hx, hy, 12 * u, 10 * u, "#fbfaf6", 3 * u) });
const DEED: HeldProp = { name: "deed", raise: 0.55, draw: (p, hx, hy, u) => drawDeed(p, hx - 30 * u, hy - 50 * u, 60 * u, 44 * u) };
const drawDeed = (p: Pen, x: number, y: number, w: number, h: number) => {
  p.poly([[x, y], [x + w, y], [x + w, y + h], [x, y + h]], "#f4ead2", Math.max(2, w * 0.04));
  const g = p.g, [cx, cy] = p.P(x + w / 2, y + h * 0.32);
  g.fillStyle = "#3a1e12"; g.font = `bold ${Math.round(h * 0.26)}px Georgia, serif`; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("RANCH", cx, cy);
  const [c2x, c2y] = p.P(x + w / 2, y + h * 0.62); g.font = `bold ${Math.round(h * 0.16)}px Georgia, serif`; g.fillText("DEED", c2x, c2y);
  p.dot(x + w * 0.8, y + h * 0.82, h * 0.09, "#c0353a");
};
const studies = (p: Pen) => {
  for (let i = 0; i < 9; i++) {
    const y = 380 - i * 38, dx = (i % 3 - 1) * 10;
    p.poly([[60 + dx, y], [340 + dx, y - 6], [344 + dx, y + 30], [56 + dx, y + 36]], i % 2 ? "#fbf8ef" : "#eef3f7", 4);
  }
  p.g.fillStyle = INK; p.g.font = "bold 40px Arial Black, Arial"; p.g.textAlign = "center"; p.g.fillText("15+ STUDIES", 200, 46);
};
const stamp = (p: Pen) => {
  const g = p.g; g.save(); g.translate(200, 110); g.rotate(-0.18);
  g.strokeStyle = "#d22d2d"; g.lineWidth = 16; g.strokeRect(-180, -70, 360, 140);
  g.fillStyle = "#d22d2d"; g.font = "bold 92px Arial Black, Arial"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("NO PROOF", 0, 6);
  g.restore();
};
const phoneScreen = (bal: number) => (p: Pen) => {
  const g = p.g;
  p.poly([[20, 20], [580, 20], [580, 1080], [20, 1080]], "#16161c", 14);
  g.fillStyle = "#123a5e"; g.fillRect(52, 70, 496, 960);
  g.fillStyle = "#ffffff"; g.textAlign = "center"; g.textBaseline = "middle";
  g.font = "bold 170px Arial"; g.fillText("3:07", 300, 230);
  g.font = "bold 64px Arial"; g.fillText("AM", 300, 340);
  g.fillStyle = "#9fc7ee"; g.font = "bold 48px Arial"; g.fillText("BALANCE", 300, 470);
  g.fillStyle = bal < 300 ? "#ff6b6b" : "#7dffa8"; g.font = "bold 104px Arial Black, Arial"; g.fillText("$" + bal.toLocaleString("en-US"), 300, 570);
  g.fillStyle = "#3b5f86"; g.fillRect(150, 960, 300, 14);
};

// ---------------- motion helpers (mesh level: free, no canvas redraws) ----------------
const say = (t: number, at: number, delayF = -2) => t >= at + delayF / FPS;
/** a hop: height h, lasting d seconds from t0; squash on landing */
const hop = (t: number, t0: number, h = 0.2, d = 0.34) => {
  const u = (t - t0) / d;
  if (u < 0) return { dy: 0, sq: 1 };
  if (u < 1) return { dy: 4 * h * u * (1 - u), sq: 1 + 0.06 * Math.sin(Math.PI * u) };
  const v = (t - t0 - d) / 0.12;
  return v < 1 ? { dy: 0, sq: 1 - 0.08 * Math.sin(Math.PI * v) } : { dy: 0, sq: 1 };
};
const loopHop = (t: number, id: number, h = 0.07, hz = 1.6) => ({ dy: h * 0.5 * (1 - Math.cos(2 * Math.PI * hz * t + id)), sq: 1 }); // smooth bounce (no hard landings)

type Role = { who: Who; at: V3; fo?: FrontOpts; side?: { dir: number; phase: number; expr: Expr }; scale?: number; noBlob?: boolean; dy?: number; sq?: number; lean?: number; still?: boolean };
const put = (cam: CamInfo, t: number, out: Stage, r: Role) => {
  const fo: FrontOpts = { mode: "stand", ...(r.fo ?? {}) };
  if (fo.blink === undefined) fo.blink = fo.expr === "dazed" || fo.expr === "laugh" ? 0 : lidAt(t, r.who.i);
  const pl = r.side
    ? personSide(cam, r.who, r.at[0], r.at[1], r.at[2], r.side.dir, { mode: "march", phase: r.side.phase, expr: r.side.expr, stomp: 0.5, stride: 0.9, blink: lidAt(t, r.who.i) }, r.scale)
    : person(cam, r.who, r.at[0], r.at[1], r.at[2], fo, r.scale);
  pl.id = r.who.i; pl.dy = r.dy ?? 0; pl.sq = r.sq ?? 1; pl.lean = r.lean ?? 0; pl.still = r.still || !!r.side;
  out.places.push(pl);
  if (!r.noBlob && (fo.mode === "stand" || fo.mode === "stroll" || r.side)) blob(out, r.at[0], r.at[1], r.at[2], (r.scale ?? 1) * (1 - 0.5 * Math.min(1, (r.dy ?? 0) / 0.3)));
};
const stars = (out: Stage, t: number, at: V3, i = 0) => {
  const u = (t * 0.9 + hh(i)) % 1;
  out.fx.push({ key: `stars${q(u, 30)}`, cw: 420, ch: 210, draw: (p) => fxStars(p, q(u, 30)), x: at[0], y: at[1] + 1.85, z: at[2], w: 0.75, h: 0.375 });
};
const burst = (out: Stage, t: number, t0: number, at: V3, size = 1.2, dur = 0.3) => {
  if (t < t0 || t >= t0 + dur) return;
  const u = (t - t0) / dur;
  out.fx.push({ key: `burst${q(u, 30)}`, cw: 500, ch: 500, draw: (p) => fxBurst(p, q(u, 30)), x: at[0], y: at[1], z: at[2], w: size, h: size });
};
const walkPhase = (t: number, i: number, sp = 1.25) => q(((t * sp) / 0.8 + hh(i, 5)) % 1, 24);

const casinoExtras = (cam: CamInfo, t: number, out: Stage) => {
  const spots: V3[] = [[-2.3, 0, -2.75], [2.3, 0, -2.75], [-5.75, 0, -2.75], [4.6, 0, -2.75], [-3.45, 0, 6.75], [-6.9, 0, 6.75], [8.05, 0, -2.75]];
  const ex: Expr[] = ["dazed", "neutral", "smile", "dazed", "neutral", "stern", "smile"];
  spots.forEach((at, i) => put(cam, t, out, { who: { i: 30 + i, o: EXTRA[i % 6], okey: `x${i}` }, at, fo: { expr: ex[i], facing: i % 2 ? -1 : 1 } }));
  // two players strolling the aisle (side view)
  for (const [k, z, sp, x0] of [[0, 0.9, 1.0, -11], [1, 3.4, 0.8, 10]] as const) {
    const dir = k ? -1 : 1, x = x0 + dir * sp * (t % 22);
    put(cam, t, out, { who: { i: 40 + k, o: EXTRA[(k + 3) % 6], okey: `w${k}` }, at: [x, 0, z], side: { dir, phase: walkPhase(t, 40 + k, sp), expr: "neutral" } });
  }
};
const gambler = (cam: CamInfo, t: number, out: Stage, expr: Expr, prop: FrontOpts["prop"] = null, extra: Partial<Role> = {}) =>
  put(cam, t, out, { who: { i: 1, o: GAMBLER, okey: "g" }, at: MARK.gambler, fo: { expr, prop }, ...extra });
const owner = (cam: CamInfo, t: number, out: Stage, expr: Expr, opts: { point?: boolean; dy?: number; sq?: number } = {}) =>
  put(cam, t, out, { who: { i: 2, o: OWNER, okey: "own" }, at: MARK.owner, fo: { expr, wave: opts.point ? 0.7 : undefined, facing: -1 }, dy: opts.dy, sq: opts.sq });

/** townsfolk on the 1931 main street: some cross (side view), some stroll toward the lens, some chat */
const townsfolk = (cam: CamInfo, t: number, out: Stage) => {
  for (let i = 0; i < 14; i++) {
    const o = FOLK[i % 6], who: Who = { i: 60 + i, o, okey: `f${i % 6}` };
    if (i % 4 === 0) { // crossing the street
      const dir = i % 8 ? 1 : -1, z = -14 + (i / 14) * 30, x = 400 - dir * 6 + dir * 0.9 * ((t - 11) % 14);
      put(cam, t, out, { who, at: [x, 0, z], side: { dir, phase: walkPhase(t, 60 + i, 0.9), expr: "smile" } });
    } else {
      const sp = 0.6 + hh(i) * 0.4, x = 400 + (i % 2 ? 1 : -1) * (1.2 + hh(i, 2) * 3.6), z0 = -30 + hh(i, 3) * 44;
      const walking = i % 3 !== 0, z = walking ? z0 + sp * (t - 11) : z0;
      put(cam, t, out, { who, at: [x, 0, z], fo: { mode: walking ? "stroll" : "stand", phase: walking ? q(((t * sp) / 1.4 + hh(i, 5)) % 1, 24) : 0,
        expr: (["smile", "neutral", "smile_closed", "grin"] as Expr[])[i % 4], wave: !walking && i % 6 === 3 ? q(Math.sin(t * 6), 4) : undefined } });
    }
  }
};

// ---------------- who is on screen, per shot ----------------
export const stage = (id: number, t: number, cam: CamInfo): Stage => {
  const out: Stage = { places: [], fx: [] };
  SUN = cam.sun.clone().normalize();
  const crash = (delayF: number, h = 0.16) => hop(t, CRASH + delayF / FPS, h);
  switch (id) {
    case 1: casinoExtras(cam, t, out); gambler(cam, t, out, say(t, W.andEverybody, 4) ? "smile" : "neutral"); break;
    case 2: {
      casinoExtras(cam, t, out);
      const dz = say(t, W.lose, 4);
      gambler(cam, t, out, dz ? "dazed" : "neutral", null, { lean: dz ? 0.04 * Math.sin(t * 2.6) : 0 });
      if (dz) stars(out, t, MARK.gambler, 1);
      break;
    }
    case 3: case 4: townsfolk(cam, t, out); break;
    case 5: {
      const b = hop(t, W.big - 0.05, 0.1, 0.3);
      owner(cam, t, out, "grin", { point: true, dy: b.dy, sq: b.sq });
      MARK.rollers.forEach((at, i) => put(cam, t, out, { who: { i: 10 + i, o: ROLLER[i], okey: `r${i}` }, at, fo: { expr: (["smile", "grin", "smile_closed"] as Expr[])[i] } }));
      break;
    }
    case 6: {
      owner(cam, t, out, say(t, W.complain, 4) ? "nervous" : "neutral");
      const shake = q(0.5 + 0.35 * Math.sign(Math.sin(t * 12)), 4);
      MARK.rollers.forEach((at, i) => put(cam, t, out, { who: { i: 10 + i, o: ROLLER[i], okey: `r${i}` }, at,
        fo: { expr: "stern", wave: i === 1 && say(t, W.complain) ? shake : i === 0 ? 0.7 : undefined, facing: i === 1 ? -1 : 1 } }));
      break;
    }
    case 7: {
      const lost = say(t, W.lost, 3), back = t > W.telling + 0.25;
      put(cam, t, out, { who: { i: 4, o: LOSER, okey: "los" }, at: MARK.loser,
        fo: { expr: back ? "stern" : lost ? "pained" : "neutral", prop: lost ? null : DEED, facing: -1 } });
      MARK.rollers.forEach((at, i) => put(cam, t, out, { who: { i: 10 + i, o: ROLLER[i], okey: `r${i}` }, at, fo: { expr: lost ? "grin" : "smile" } }));
      // the deed flies from his hand to the high roller's table
      const u = (t - W.lost - 0.03) / 0.6;
      if (u >= 0 && u < 1) {
        const a = MARK.loser, b = MARK.rollers[0], k = smooth(u);
        out.fx.push({ key: "deedFly", cw: 360, ch: 270, draw: (p) => drawDeed(p, 20, 20, 320, 230), x: a[0] + 0.25 + (b[0] - a[0] - 0.25) * k, y: 1.25 + 0.5 * Math.sin(Math.PI * u) - 0.3 * k,
          z: a[2] + (b[2] - a[2]) * k, w: 0.36, h: 0.27, rot: 6 * u });
      } else if (u >= 1) out.fx.push({ key: "deedTable", cw: 360, ch: 270, draw: (p) => drawDeed(p, 20, 20, 320, 230), x: -4.0 + 800, y: 0.93, z: -3.9, w: 0.36, h: 0.27, flat: true, rot: 0.4 });
      break;
    }
    case 8: {
      const take = say(t, W.take), slam = say(t, W.take, 1), leave = say(t, W.orWe, 2);
      owner(cam, t, out, leave ? "shock" : "nervous", { point: leave });
      const dip = slam ? hop(t, W.take + 0.03, -0.05, 0.12) : { dy: 0, sq: 1 };
      MARK.rollers.forEach((at, i) => {
        const go = leave && i > 0 ? Math.max(0, t - W.orWe - 0.15 * i) : 0;
        if (go > 0) {
          const d = MARK.door, k = Math.min(1, go * 1.3 / Math.hypot(d[0] - at[0], d[2] - at[2]));
          put(cam, t, out, { who: { i: 10 + i, o: ROLLER[i], okey: `r${i}` }, at: [at[0] + (d[0] - at[0]) * k, 0, at[2] + (d[2] - at[2]) * k], side: { dir: -1, phase: walkPhase(t, 10 + i, 1.3), expr: "stern" } });
        } else put(cam, t, out, { who: { i: 10 + i, o: ROLLER[i], okey: `r${i}` }, at,
          fo: { expr: take ? "stern" : i ? "neutral" : "stern", prop: i === 0 ? FIST(take ? (slam ? 0 : 1) : 0.6) : null, facing: i === 1 ? -1 : 1 }, dy: i === 0 ? dip.dy : 0, sq: i === 0 ? dip.sq : 1 });
      });
      break;
    }
    case 9: {
      const j = crash(4, 0.2);
      owner(cam, t, out, t > CRASH + 4 / FPS ? "shock" : "nervous", { point: t < CRASH, dy: j.dy, sq: j.sq });
      if (clockFall(t) >= 1) {
        burst(out, t, CRASH, [CLOCK_SALOON[0] + 0.15, 0.5, CLOCK_SALOON[2] + 0.95], 1.7, 0.35);
        burst(out, t, CRASH + 0.06, [CLOCK_SALOON[0] - 0.6, 0.3, CLOCK_SALOON[2] + 1.2], 0.9, 0.3);
      }
      break;
    }
    case 10: {
      const un = say(t, W.unluckily);
      owner(cam, t, out, un ? "nervous" : "relief");
      MARK.rollers.forEach((at, i) => { const h = loopHop(t, i * 1.7, un ? 0.012 : 0.06); put(cam, t, out, { who: { i: 10 + i, o: ROLLER[i], okey: `r${i}` }, at,
        fo: { expr: un ? (["laugh", "laugh", "grin"] as Expr[])[i] : (["relief", "smile_closed", "relief"] as Expr[])[i], prop: BAG, facing: i === 1 ? -1 : 1 }, dy: h.dy }); });
      break;
    }
    case 11: {
      const ex: Expr[] = ["dazed", "pained", say(t, W.nobody, 4) ? "pained" : "nervous", "neutral", "stern", "dazed"];
      MARK.patients.forEach((at, i) => put(cam, t, out, { who: { i: 80 + i, o: PATIENTS[i], okey: `p${i}` }, at, fo: { mode: "sit", expr: ex[i] }, noBlob: true }));
      const nx = MARK.nurse[0] + 1.1 * Math.max(0, t - W.think);
      put(cam, t, out, { who: { i: 90, o: NURSE, okey: "nur" }, at: [nx, 0, MARK.nurse[2]], side: { dir: 1, phase: walkPhase(t, 90, 1.1), expr: "neutral" } });
      break;
    }
    case 12: {
      casinoExtras(cam, t, out);
      const found = say(t, W.found, 3), fif = say(t, W.fifteen, 2);
      put(cam, t, out, { who: { i: 5, o: PSYCH, okey: "psy" }, at: MARK.psych, fo: { expr: found ? "smile" : "neutral", prop: CLIPBOARD(found ? 0.8 : fif ? 0.55 : 0.3) } });
      const st = MARK.studies;
      out.fx.push({ key: "studies", cw: 400, ch: 440, draw: studies, x: st[0], y: 0.5, z: st[2], w: 0.9, h: 0.99 });
      const su = (t - W.proof - 0.05) / (4 / FPS);
      if (su >= 0) { const k = su < 1 ? 1.7 - 0.7 * STEPS(su, 4) : 1; out.fx.push({ key: "stamp", cw: 400, ch: 220, draw: stamp, x: st[0], y: 0.4, z: st[2] + 0.06, w: 0.78 * k, h: 0.43 * k }); }
      break;
    }
    case 13: {
      const smug = say(t, W.theGamblers, 4);
      put(cam, t, out, { who: { i: 12, o: ROLLER[0], okey: "wall" }, at: MARK.wallGambler, fo: { expr: smug ? "smile_closed" : "neutral", facing: smug ? 0 : -1 }, lean: smug ? 0.05 : 0 });
      break;
    }
    case 14: {
      casinoExtras(cam, t, out);
      const r = (t - W.theClock + 0.05) / (8 / FPS), phone = r >= 0;
      const after = t > W.loseEnd_e + 4 / FPS;
      gambler(cam, t, out, after ? "nervous" : phone ? "neutral" : "dazed", phone ? PHONE(STEPS(r, 4)) : null);
      if (!phone) stars(out, t, MARK.gambler, 1);
      if (t >= W.right - 2 / FPS && !after) {
        const k = clamp01((t - W.money) / (W.loseEnd_e - W.money + 0.1));
        const bal = Math.round(1250 - (1250 - 40) * STEPS(k, 10));
        const P = MARK.phone;
        out.fx.push({ key: `phone${bal}`, cw: 600, ch: 1100, draw: phoneScreen(bal), x: P[0], y: P[1], z: P[2], w: 0.17, h: 0.31 });
      }
      break;
    }
  }
  return out;
};
export const shotOf = (id: number) => SHOTS[id - 1];
export { clamp01 };
