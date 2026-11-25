// Our cast as lit flat sprites in the 3D world (pool / actor / card shading kept from the cartoon-3d-short template).
// Round white heads, thin dark stick limbs. stage(id, t, cam) says who stands where in shot `id` at time t.
// Cards, effects and blobs live on the NOINK layer so the world ink pass never outlines their quads.
import * as THREE from "three";
import { Pen, bodyFront, bodySide, fxBurst, fxStars, fxShadow, fxContact, Outfit, Expr, FrontOpts, SideOpts, HeldProp, INK } from "./toon";
import { FPS, SHOTS, V3, MARK, W, clamp01, clockFall, CLOCK_SALOON } from "./story";
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
const PHONE: HeldProp = { name: "phone", raise: 1, draw: (p, hx, hy, u) => {
  p.poly([[hx - 14 * u, hy - 52 * u], [hx + 14 * u, hy - 52 * u], [hx + 14 * u, hy + 4 * u], [hx - 14 * u, hy + 4 * u]], "#1c1c22", 2.5 * u);
  p.poly([[hx - 10 * u, hy - 47 * u], [hx + 10 * u, hy - 47 * u], [hx + 10 * u, hy - 2 * u], [hx - 10 * u, hy - 2 * u]], "#9fd4ff", 0);
  const g = p.g, [cx, cy] = p.P(hx, hy - 30 * u);
  g.fillStyle = "#1c1c22"; g.font = `bold ${Math.round(9 * u)}px Arial`; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("3:07", cx, cy);
} };
const CLIPBOARD: HeldProp = { name: "clip", raise: 0.3, draw: (p, hx, hy, u) => {
  p.poly([[hx - 26 * u, hy - 56 * u], [hx + 22 * u, hy - 56 * u], [hx + 22 * u, hy + 8 * u], [hx - 26 * u, hy + 8 * u]], "#a8763e", 2.5 * u);
  p.poly([[hx - 21 * u, hy - 50 * u], [hx + 17 * u, hy - 50 * u], [hx + 17 * u, hy + 3 * u], [hx - 21 * u, hy + 3 * u]], "#fbf8ef", 0);
  for (let i = 0; i < 6; i++) p.stroke([[hx - 16 * u, hy - 42 * u + i * 7 * u], [hx + (i % 2 ? 6 : 12) * u, hy - 42 * u + i * 7 * u]], 1.6 * u, "#7d848c");
  p.poly([[hx - 9 * u, hy - 60 * u], [hx + 5 * u, hy - 60 * u], [hx + 5 * u, hy - 52 * u], [hx - 9 * u, hy - 52 * u]], "#9aa3b0", 1.5 * u);
} };
const BAG: HeldProp = { name: "bag", raise: 0.1, draw: (p, hx, hy, u) => {
  p.ell(hx + 4 * u, hy + 30 * u, 30 * u, 32 * u, "#e9d9a8", 3 * u);
  p.ell(hx + 4 * u, hy + 1 * u, 12 * u, 5 * u, "#c9b37a", 2.5 * u);
  const g = p.g, [cx, cy] = p.P(hx + 4 * u, hy + 32 * u);
  g.fillStyle = "#2f7a4a"; g.font = `bold ${Math.round(30 * u)}px Arial Black, Arial`; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("$", cx, cy);
} };
const studies = (p: Pen) => {
  for (let i = 0; i < 9; i++) {
    const y = 380 - i * 38, dx = (i % 3 - 1) * 10;
    p.poly([[60 + dx, y], [340 + dx, y - 6], [344 + dx, y + 30], [56 + dx, y + 36]], i % 2 ? "#fbf8ef" : "#eef3f7", 4);
  }
  p.g.fillStyle = INK; p.g.font = "bold 40px Arial Black, Arial"; p.g.textAlign = "center"; p.g.fillText("15+ STUDIES", 200, 46);
};

// ---------------- staging helpers ----------------
const say = (t: number, at: number) => t >= at - LEAD;
type Role = { who: Who; at: V3; fo: FrontOpts; scale?: number; noBlob?: boolean };
const put = (cam: CamInfo, t: number, out: Stage, r: Role) => {
  const fo: FrontOpts = { mode: "stand", blink: r.fo.expr === "dazed" || r.fo.expr === "laugh" ? 0 : lidAt(t, r.who.i), ...r.fo };
  out.places.push(person(cam, r.who, r.at[0], r.at[1], r.at[2], fo, r.scale));
  if (!r.noBlob && (fo.mode === "stand" || fo.mode === "stroll")) blob(out, r.at[0], r.at[1], r.at[2], r.scale ?? 1);
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

/** slot players in the casino (not the hero gambler) */
const casinoExtras = (cam: CamInfo, t: number, out: Stage) => {
  const spots: V3[] = [[-2.3, 0, -2.75], [2.3, 0, -2.75], [-5.75, 0, -2.75], [4.6, 0, -2.75], [-3.45, 0, 6.75], [-6.9, 0, 6.75], [8.05, 0, -2.75]];
  const ex: Expr[] = ["dazed", "neutral", "smile", "dazed", "neutral", "stern", "smile"];
  spots.forEach((at, i) => put(cam, t, out, { who: { i: 30 + i, o: EXTRA[i % 6], okey: `x${i}` }, at, fo: { expr: ex[i], facing: i % 2 ? -1 : 1 } }));
};
const gambler = (cam: CamInfo, t: number, out: Stage, expr: Expr, prop: FrontOpts["prop"] = null, look = 0) =>
  put(cam, t, out, { who: { i: 1, o: GAMBLER, okey: "g" }, at: MARK.gambler, fo: { expr, prop, look } });

const owner = (cam: CamInfo, t: number, out: Stage, expr: Expr, point = false) =>
  put(cam, t, out, { who: { i: 2, o: OWNER, okey: "own" }, at: MARK.owner, fo: { expr, wave: point ? 0.7 : undefined, facing: -1 } });
const rollers = (cam: CamInfo, t: number, out: Stage, ex: Expr[], opts: { point?: number; bags?: boolean } = {}) =>
  MARK.rollers.forEach((at, i) => put(cam, t, out, { who: { i: 10 + i, o: ROLLER[i], okey: `r${i}` }, at,
    fo: { expr: ex[i % ex.length], wave: opts.point === i ? 0.75 : undefined, prop: opts.bags && opts.point !== i ? BAG : null, facing: i === 0 ? 1 : i === 1 ? -1 : 1 } }));

/** townsfolk strolling on the 1931 main street (they walk toward the lens, front view) */
const townsfolk = (cam: CamInfo, t: number, out: Stage) => {
  for (let i = 0; i < 12; i++) {
    const sp = 0.6 + hh(i) * 0.4, x = 400 + (i % 2 ? 1 : -1) * (1.2 + hh(i, 2) * 3.6), z0 = -30 + hh(i, 3) * 44;
    const walking = i % 3 !== 0, z = walking ? z0 + sp * (t - 14) : z0;
    const phase = q(((t * sp) / 1.4 + hh(i, 5)) % 1, 120);
    put(cam, t, out, { who: { i: 60 + i, o: FOLK[i % 6], okey: `f${i % 6}` }, at: [x, 0, z],
      fo: { mode: walking ? "stroll" : "stand", phase: walking ? phase : 0, expr: (["smile", "neutral", "smile_closed", "grin"] as Expr[])[i % 4], look: 0 } });
  }
};

// ---------------- who is on screen, per shot ----------------
export const stage = (id: number, t: number, cam: CamInfo): Stage => {
  const out: Stage = { places: [], fx: [] };
  SUN = cam.sun.clone().normalize();
  switch (id) {
    case 1: casinoExtras(cam, t, out); gambler(cam, t, out, say(t, W.andEverybody) ? "smile" : "neutral"); break;
    case 2: {
      casinoExtras(cam, t, out);
      const dz = say(t, W.lose) && t < W.noClocks;
      gambler(cam, t, out, dz ? "dazed" : t > W.just ? "dazed" : "neutral");
      if (dz || t > W.just) stars(out, t, MARK.gambler, 1);
      break;
    }
    case 3: case 4: townsfolk(cam, t, out); break;
    case 5: owner(cam, t, out, "grin", true); rollers(cam, t, out, ["smile", "grin", "smile_closed"]); break;
    case 6: owner(cam, t, out, "nervous"); rollers(cam, t, out, ["stern", "stern", "stern"]); break;
    case 7: {
      const back = t > W.telling + 0.25;
      put(cam, t, out, { who: { i: 4, o: LOSER, okey: "los" }, at: MARK.loser, fo: { expr: back ? "stern" : "pained", facing: -1 } });
      rollers(cam, t, out, ["grin", "smile", "grin"]);
      break;
    }
    case 8: {
      const take = say(t, W.take);
      owner(cam, t, out, "nervous");
      rollers(cam, t, out, take ? ["stern", "stern", "stern"] : ["stern", "neutral", "stern"], { point: take ? 0 : undefined });
      break;
    }
    case 9: {
      owner(cam, t, out, t > W.came - LEAD ? "shock" : "nervous");
      const k = clockFall(t);
      if (k >= 1) burst(out, t, W.came, [CLOCK_SALOON[0], 0.45, CLOCK_SALOON[2] + 0.9], 1.6, 0.35);
      break;
    }
    case 10: {
      const un = say(t, W.unluckily);
      owner(cam, t, out, un ? "nervous" : "relief");
      rollers(cam, t, out, un ? ["laugh", "laugh", "grin"] : ["relief", "smile_closed", "relief"], { bags: true });
      break;
    }
    case 11: {
      const ex: Expr[] = ["dazed", "pained", say(t, W.nobody) ? "pained" : "nervous", "neutral", "stern", "dazed"];
      MARK.patients.forEach((at, i) => put(cam, t, out, { who: { i: 80 + i, o: PATIENTS[i], okey: `p${i}` }, at, fo: { mode: "sit", expr: ex[i] }, noBlob: true }));
      break;
    }
    case 12: {
      casinoExtras(cam, t, out);
      const found = say(t, W.found);
      put(cam, t, out, { who: { i: 5, o: PSYCH, okey: "psy" }, at: MARK.psych, fo: { expr: found ? "smile" : "neutral", prop: { ...CLIPBOARD, raise: found ? 0.8 : 0.3 } } });
      out.fx.push({ key: "studies", cw: 400, ch: 440, draw: studies, x: MARK.psych[0] - 0.75, y: 0.5, z: MARK.psych[2] + 0.15, w: 0.9, h: 0.99 });
      break;
    }
    case 13: {
      const smug = say(t, W.theGamblers);
      put(cam, t, out, { who: { i: 12, o: ROLLER[0], okey: "wall" }, at: MARK.wallGambler, fo: { expr: smug ? "smile_closed" : "neutral", facing: smug ? 0 : -1 } });
      break;
    }
    case 14: {
      casinoExtras(cam, t, out);
      const phone = say(t, W.theClock), money = say(t, 68.0);
      gambler(cam, t, out, money ? "nervous" : phone ? "neutral" : "dazed", phone ? PHONE : null);
      if (!phone) stars(out, t, MARK.gambler, 1);
      break;
    }
  }
  return out;
};
export const shotOf = (id: number) => SHOTS[id - 1];
export { clamp01 };
