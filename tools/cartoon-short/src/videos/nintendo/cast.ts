// Our cast as lit flat sprites in the 3D world (pool / actor / card shading kept from the cartoon-3d-short template).
// Round white bean heads, thin dark stick limbs. stage(id, t, cam) says who stands where in shot `id` at time t.
import * as THREE from "three";
import { Pen, bodyFront, bodySide, fxBurst, fxShadow, fxContact, Outfit, Expr, FrontOpts, SideOpts, HeldProp, INK } from "./toon";
import { FPS, SHOTS, V3, MARK, E, T, clamp01, smooth } from "./story";
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
  const mirror = dir < 0; // dir is already screen-relative (+1 = toward screen right)
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

// ---------------- our cast (round white bean heads, generic, no real people) ----------------
const WH = "#fbfaf6";
const NARR: Outfit = { jacket: "#14213d", pants: "#2e2a36", boots: INK, hat: "hair", hair: "#3a2a20", buttons: "#ffc83d", skin: WH };
const CRAFT: Outfit = { jacket: "#2d4a7a", pants: "#2d4a7a", boots: "#4a3426", hat: "hair", hair: "#1c1620", buttons: "#c9a14a", skin: WH };
const SUIT: Outfit = { jacket: "#3b3f52", pants: "#2e2a36", boots: INK, hat: "tophat", moustache: "#2a201a", buttons: "#e8c45a", build: "stout", skin: WH };
const TECH: Outfit = { jacket: "#d9d4c3", pants: "#4a4a5a", boots: "#4a3426", hat: "cap", cap: "#2f5f6a", skin: WH };
const CARR: Outfit[] = ["#3f6fb5", "#8c3b4a", "#5d7a3a", "#b5653f"].map((c, i) => ({ jacket: c, pants: "#3b3f52", boots: INK, hat: i % 2 ? "hair" : "cap", hair: "#2a201a", cap: "#2a2a30", skin: WH }));
const FOLK: Outfit[] = ["#3f6fb5", "#8c3b4a", "#5d7a3a", "#b5653f", "#2f5f6a", "#7b5ac9"].map((c, v) =>
  v % 2 ? { jacket: c, pants: "#3b3f52", boots: "#4a3426", hat: "bonnet", dress: ["#d9a441", "#c25a7a", "#5a8fc2"][v % 3], skin: WH } : { jacket: c, pants: "#3b3f52", boots: "#4a3426", hat: "tophat", skin: WH });

// ---------------- held props (drawn on the card) ----------------
const TRAY = (raise: number): HeldProp => ({ name: "tray", raise, draw: (p, hx, hy, u) => {
  p.poly([[hx - 46 * u, hy - 8 * u], [hx + 46 * u, hy - 8 * u], [hx + 40 * u, hy + 2 * u], [hx - 40 * u, hy + 2 * u]], "#8a5a34", 2.5 * u);
  ["#e8564a", "#f2c94c", "#5aa86a", "#e87aa8", "#f4f1ea"].forEach((c, i) => p.poly([[hx - 40 * u + i * 17 * u, hy - 38 * u], [hx - 27 * u + i * 17 * u, hy - 38 * u], [hx - 27 * u + i * 17 * u, hy - 10 * u], [hx - 40 * u + i * 17 * u, hy - 10 * u]], c, 1.6 * u));
} });
const cardDraw = (p: Pen, x: number, y: number, w: number, h: number, col: string) => {
  p.poly([[x, y], [x + w, y], [x + w, y + h], [x, y + h]], "#f4ead2", Math.max(2, w * 0.05));
  p.ell(x + w / 2, y + h * 0.4, w * 0.26, w * 0.26, col, Math.max(1.5, w * 0.03));
  p.ell(x + w / 2, y + h * 0.4, w * 0.09, w * 0.09, "#f2c94c", 0);
  p.stroke([[x + w / 2, y + h * 0.62], [x + w / 2, y + h * 0.9]], Math.max(2, w * 0.05), "#3f7a4a");
};
const CARD_UP = (raise: number): HeldProp => ({ name: "cardup", raise, draw: (p, hx, hy, u) => cardDraw(p, hx - 18 * u, hy - 78 * u, 36 * u, 56 * u, "#e87aa8") });
const POUCH = (open: number): HeldProp => ({ name: "pouch" + open, raise: 0.35, draw: (p, hx, hy, u) => {
  p.poly([[hx - 24 * u, hy - 50 * u], [hx + 24 * u, hy - 50 * u], [hx + 26 * u, hy + 6 * u], [hx - 26 * u, hy + 6 * u]], "#e9eef3", 2.5 * u);
  p.poly([[hx - 20 * u, hy - 30 * u], [hx + 20 * u, hy - 30 * u], [hx + 20 * u, hy - 12 * u], [hx - 20 * u, hy - 12 * u]], "#f2a23a", 0);
  if (open) p.poly([[hx - 24 * u, hy - 50 * u], [hx - 12 * u, hy - 62 * u], [hx, hy - 48 * u], [hx + 12 * u, hy - 62 * u], [hx + 24 * u, hy - 50 * u]], "#d8dfe6", 2 * u);
} });
const BOXP = (raise: number): HeldProp => ({ name: "boxp", raise, draw: (p, hx, hy, u) => {
  p.poly([[hx - 34 * u, hy - 46 * u], [hx + 34 * u, hy - 46 * u], [hx + 34 * u, hy], [hx - 34 * u, hy]], "#c9a26b", 3 * u);
  p.poly([[hx - 5 * u, hy - 46 * u], [hx + 5 * u, hy - 46 * u], [hx + 5 * u, hy], [hx - 5 * u, hy]], "#e8d3a0", 0);
} });
const MINIS: HeldProp = { name: "minis", raise: 0.5, draw: (p, hx, hy, u) => {
  p.poly([[hx - 40 * u, hy - 24 * u], [hx + 8 * u, hy - 24 * u], [hx + 8 * u, hy - 6 * u], [hx - 40 * u, hy - 6 * u]], "#ffc83d", 2.5 * u); // mini taxi
  p.poly([[hx - 28 * u, hy - 38 * u], [hx - 6 * u, hy - 38 * u], [hx - 6 * u, hy - 24 * u], [hx - 28 * u, hy - 24 * u]], "#ffd96a", 2 * u);
  p.dot(hx - 32 * u, hy - 5 * u, 5 * u, INK); p.dot(hx, hy - 5 * u, 5 * u, INK);
  cardDraw(p, hx + 12 * u, hy - 56 * u, 22 * u, 34 * u, "#e87aa8");
  p.ell(hx + 22 * u, hy - 8 * u, 15 * u, 8 * u, "#f4f1ea", 2.5 * u);
  p.stroke([[hx - 44 * u, hy - 52 * u], [hx - 30 * u, hy - 40 * u], [hx - 44 * u, hy - 30 * u]], 4 * u, "#ff7a1a");
} };

// ---------------- motion helpers (mesh level: free) ----------------
const say = (t: number, at: number, delayF = -2) => t >= at + delayF / FPS;
const hop = (t: number, t0: number, h = 0.2, d = 0.34) => {
  const u = (t - t0) / d;
  if (u < 0) return { dy: 0, sq: 1 };
  if (u < 1) return { dy: 4 * h * u * (1 - u), sq: 1 + 0.06 * Math.sin(Math.PI * u) };
  const v = (t - t0 - d) / 0.12;
  return v < 1 ? { dy: 0, sq: 1 - 0.08 * Math.sin(Math.PI * v) } : { dy: 0, sq: 1 };
};
const loopHop = (t: number, id: number, h = 0.07, hz = 1.6) => ({ dy: h * 0.5 * (1 - Math.cos(2 * Math.PI * hz * t + id)), sq: 1 });

type Role = { who: Who; at: V3; fo?: FrontOpts; side?: { mv: [number, number]; phase: number; expr: Expr }; scale?: number; noBlob?: boolean; dy?: number; sq?: number; lean?: number; still?: boolean };
const put = (cam: CamInfo, t: number, out: Stage, r: Role) => {
  const fo: FrontOpts = { mode: "stand", ...(r.fo ?? {}) };
  if (fo.blink === undefined) fo.blink = lidAt(t, r.who.i);
  const dir = r.side ? Math.sign(r.side.mv[0] * cam.right.x + r.side.mv[1] * cam.right.z) || 1 : 1;
  const pl = r.side
    ? personSide(cam, r.who, r.at[0], r.at[1], r.at[2], dir, { mode: "march", phase: r.side.phase, expr: r.side.expr, stomp: 0.5, stride: 0.9, blink: lidAt(t, r.who.i) }, r.scale)
    : person(cam, r.who, r.at[0], r.at[1], r.at[2], fo, r.scale);
  pl.id = r.who.i; pl.dy = r.dy ?? 0; pl.sq = r.sq ?? 1; pl.lean = r.lean ?? 0; pl.still = r.still || !!r.side;
  out.places.push(pl);
  if (!r.noBlob) blob(out, r.at[0], r.at[1], r.at[2], (r.scale ?? 1) * (1 - 0.5 * Math.min(1, (r.dy ?? 0) / 0.3)));
};
const burst = (out: Stage, t: number, t0: number, at: V3, size = 1.2, dur = 0.3) => {
  if (t < t0 || t >= t0 + dur) return;
  const u = (t - t0) / dur;
  out.fx.push({ key: `burst${q(u, 30)}`, cw: 500, ch: 500, draw: (p) => fxBurst(p, q(u, 30)), x: at[0], y: at[1], z: at[2], w: size, h: size });
};
const smoke = (p: Pen, u: number) => { for (let i = 0; i < 5; i++) { const a = (160 + i * 55) * Math.PI / 180, d = 40 + 70 * u, r = (38 + 22 * (i % 2)) * (1 - 0.5 * u); p.ell(150 + d * Math.cos(a), 170 + d * 0.5 * Math.sin(a), r, r * 0.85, `rgba(70,70,82,${(0.85 * (1 - u)).toFixed(3)})`, 0); } };
const puff = (out: Stage, t: number, at: V3, size = 1.1, rate = 0.8, i = 0) => {
  const u = (t * rate + hh(i)) % 1;
  out.fx.push({ key: `smoke${q(u, 20)}`, cw: 300, ch: 300, draw: (p) => smoke(p, q(u, 20)), x: at[0], y: at[1] + 0.9 * u, z: at[2], w: size, h: size, soft: true });
};
const walkPhase = (t: number, i: number, sp = 1.25) => q(((t * sp) / 0.8 + hh(i, 5)) % 1, 24);
const N = (i = 1): Who => ({ i, o: NARR, okey: "narr" });
const narr = (cam: CamInfo, t: number, out: Stage, at: V3, expr: Expr, extra: Partial<Role> = {}) =>
  put(cam, t, out, { who: N(), at, ...extra, fo: { expr, ...(extra.fo ?? {}) } });
const folk = (cam: CamInfo, t: number, out: Stage, spots: [number, number, number][], seed = 0) =>
  spots.forEach(([x, z, k], i) => put(cam, t, out, { who: { i: 60 + i + seed, o: FOLK[k % 6], okey: `f${k % 6}` }, at: [x, 0, z], fo: { expr: (["smile", "neutral", "smile_closed"] as Expr[])[i % 3], facing: i % 2 ? -1 : 1 } }));
const SX = 800;

// ---------------- who is on screen, per shot ----------------
export const stage = (id: number, t: number, cam: CamInfo): Stage => {
  const out: Stage = { places: [], fx: [] };
  SUN = cam.sun.clone().normalize();
  const t0 = SHOTS[id - 1].a / FPS;
  switch (id) {
    case 1: {
      const j = hop(t, E.taxiPass - 0.06, 0.1, 0.3);
      narr(cam, t, out, MARK.narrSt, t < E.taxiStop ? "shock" : "neutral", { dy: j.dy, sq: j.sq });
      for (const [k, z, dir] of [[0, -16, 1], [1, -22, -1]] as const) put(cam, t, out, { who: { i: 70 + k, o: FOLK[k + 1], okey: `f${k + 1}` }, at: [SX + dir * (-6 + 1.2 * (t % 10)), 0, z], side: { mv: [dir, 0], phase: walkPhase(t, 70 + k, 1.2), expr: "smile" } });
      break;
    }
    case 2: narr(cam, t, out, MARK.narrS, "smile_closed", { fo: { wave: 0.7 }, lean: 0.02 * Math.sin(t * 3) }); break;
    case 3: narr(cam, t, out, MARK.narr3, "grin"); break;
    case 4: {
      const swept = say(t, E.sweep), shake = say(t, T(30), -3);
      narr(cam, t, out, MARK.narr3, shake ? "stern" : "neutral", { fo: { wave: swept ? 0 : 0.8 }, lean: shake ? 0.07 * Math.sin(t * 13) : 0 });
      break;
    }
    case 5: {
      const u = clamp01((t - t0 - 0.2) / (SHOTS[4].b / FPS - t0 - 0.4)), z = MARK.craftOutA[2] + (-5.2 - MARK.craftOutA[2]) * smooth(u);
      put(cam, t, out, { who: { i: 20, o: CRAFT, okey: "craft" }, at: [MARK.craftOutA[0], 0, z], fo: { mode: "stroll", phase: walkPhase(t, 20, 1.2), expr: "smile", prop: TRAY(0.55) } });
      break;
    }
    case 6: put(cam, t, out, { who: { i: 20, o: CRAFT, okey: "craft" }, at: MARK.craftIn, fo: { expr: say(t, E.fan) ? "smile_closed" : "neutral" }, lean: 0.03 }); break;
    case 7: {
      const nod = hop(t, E.nod, 0.05, 0.2), up = say(t, E.kartuUp, 1);
      put(cam, t, out, { who: { i: 20, o: CRAFT, okey: "craft" }, at: MARK.craftIn, fo: { expr: "neutral", prop: up ? null : CARD_UP(0.85) }, dy: nod.dy, sq: nod.sq });
      break;
    }
    case 8: {
      const z = 2.3 - 1.25 * (t - t0);
      put(cam, t, out, { who: { i: 30, o: SUIT, okey: "suit" }, at: [SX - 4.2, 0, z], side: { mv: [0, -1], phase: walkPhase(t, 30, 1.25), expr: "grin" } });
      folk(cam, t, out, [[SX - 7.2, -3.0, 0], [SX - 7.0, 0.5, 3]]);
      break;
    }
    case 9: {
      const pat = t >= E.pat && t < E.pat + 0.5, h = hop(t, E.pat, 0.05, 0.22);
      put(cam, t, out, { who: { i: 30, o: SUIT, okey: "suit" }, at: MARK.suitPark, fo: { expr: say(t, E.pat) ? "smile" : "smile_closed", wave: pat ? 0.7 + 0.2 * Math.sign(Math.sin((t - E.pat) * 30)) : undefined, facing: 1 }, dy: h.dy });
      folk(cam, t, out, [[SX - 7.2, -8.5, 2]], 4);
      break;
    }
    case 10: {
      const open = say(t, E.rice) ? 1 : 0;
      const a1 = hop(t, E.jerk1, 0.05, 0.16), a2 = hop(t, E.jerk2, 0.07, 0.16), jerk = (t >= E.jerk1 && t < E.jerk1 + 0.2) || (t >= E.jerk2 && t < E.jerk2 + 0.2);
      narr(cam, t, out, MARK.narrK, jerk ? "shock" : say(t, T(72), -3) ? "nervous" : "neutral", { fo: { prop: POUCH(open) }, dy: a1.dy + a2.dy, lean: jerk ? 0.08 : 0 });
      break;
    }
    case 11: {
      const dropped = say(t, E.wheel + 0.1), fail = say(t, E.fail, 2);
      put(cam, t, out, { who: { i: 30, o: SUIT, okey: "suit" }, at: [SX - 0.6, 0, -3.6], fo: { expr: fail ? "neutral" : "pained", prop: dropped ? null : POUCH(1), facing: 1 }, lean: fail ? 0.1 : 0.03 * Math.sin(t * 5), dy: fail ? -0.02 : 0 });
      puff(out, t, [MARK.taxiBreak[0] + 0.5, 1.2, MARK.taxiBreak[2] - 1.5], 1.4, 0.9, 1);
      puff(out, t, [MARK.taxiBreak[0] + 0.6, 1.2, MARK.taxiBreak[2] - 1.7], 1.0, 0.7, 5);
      break;
    }
    case 12: {
      const fell = say(t, E.boxFall, 2);
      put(cam, t, out, { who: { i: 20, o: CRAFT, okey: "craft" }, at: [460 - 2.6, 0, -3.8], fo: { expr: say(t, E.boxFall + 0.3) ? "pained" : "neutral", facing: 1 }, lean: fell ? 0.08 : 0.02 });
      if (fell) burst(out, t, E.boxFall + 0.28, [460 - 5.2, 0.25, -4.5], 1.0, 0.3);
      break;
    }
    case 13: narr(cam, t, out, MARK.narrS, say(t, E.bulb, 0) ? "grin" : "neutral", { lean: 0.02 }); break;
    case 14: put(cam, t, out, { who: { i: 40, o: TECH, okey: "tech" }, at: MARK.tech, fo: { expr: "neutral", facing: -1 }, lean: 0.07 }); break;
    case 15: put(cam, t, out, { who: { i: 40, o: TECH, okey: "tech" }, at: MARK.tech, fo: { expr: say(t, T(118), -4) ? "smile" : "neutral", facing: 1 }, lean: 0.06 }); break;
    case 16: {
      const s = say(t, E.stretch, 0);
      put(cam, t, out, { who: { i: 40, o: TECH, okey: "tech" }, at: MARK.tech, fo: { expr: s ? "relief_open" : "smile", wave: s ? 0.6 : undefined, facing: 1 }, lean: s ? 0.0 : 0.05 });
      break;
    }
    case 17: {
      const boom = say(t, E.laris, 0);
      MARK.carriers.forEach((at, i) => { const h = loopHop(t, i * 1.3, boom ? 0.12 : 0.05, boom ? 2.2 : 1.6); put(cam, t, out, { who: { i: 50 + i, o: CARR[i], okey: `c${i}` }, at, fo: { expr: boom ? "relief_open" : "smile", prop: BOXP(0.5) }, dy: h.dy }); });
      if (boom) burst(out, t, E.laris, [MARK.carriers[1][0] + 0.5, 1.8, MARK.carriers[1][2]], 2.6, 0.35);
      break;
    }
    case 18: narr(cam, t, out, MARK.narrArcSide, "smile_closed", { fo: { facing: -1 } }); break;
    case 19: narr(cam, t, out, MARK.narrArc, say(t, E.cabOn, 0) ? "shock" : "neutral", { lean: say(t, E.cabOn, 0) ? 0.02 : 0 }); break;
    case 20: narr(cam, t, out, MARK.narrStudioR, "grin", { fo: { facing: -1 }, lean: 0.03 * Math.sin(t * 5) }); break;
    case 21: {
      const roll = say(t, E.bowlRoll, 0), catchT = say(t, E.bowlRoll + 0.5, 0), h = hop(t, E.bowlRoll + 0.5, 0.06, 0.2);
      narr(cam, t, out, MARK.narrS, catchT ? "grin" : roll ? "shock" : "smile_closed", { fo: { prop: catchT ? null : MINIS }, dy: h.dy, lean: roll && !catchT ? 0.05 : 0 });
      break;
    }
    case 22: {
      const wink = t >= E.wink && t < E.wink + 0.17;
      narr(cam, t, out, MARK.narrS, "smile", { fo: { blink: wink ? 1 : undefined, wave: say(t, E.yellowBg, 0) ? 0.7 : undefined } });
      break;
    }
  }
  return out;
};
export const shotOf = (id: number) => SHOTS[id - 1];
export { clamp01 };
