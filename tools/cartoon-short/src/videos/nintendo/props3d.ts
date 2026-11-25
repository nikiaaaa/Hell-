// Real 3D props that move (so the camera sees them from every side): the taxi, hanafuda cards (original flower designs),
// lantern, generic grey console silhouettes (no brand shapes), rice bowl + plain pouch, the lazy-tong toy (generic orange
// extending hand), cartons, light bulb, generic arcade cabinets. All are pure functions of (shot id, story time t).
import * as THREE from "three";
import { lam } from "./build";
import { ctex } from "./paint";
import { MARK, E, T, V3, OX, SHOTS, FPS, clamp01, smooth, easeOut, camAt } from "./story";

const rnd = (i: number, k: number) => { const x = Math.sin(i * 91.7 + k * 47.3) * 43758.5453; return x - Math.floor(x); };
/** ballistic hop with one small bounce, landing on height y0 */
const fly = (t: number, p0: V3, v: V3, y0: number): V3 => {
  const tl = (v[1] + Math.sqrt(v[1] * v[1] + 2 * 9.8 * Math.max(0, p0[1] - y0))) / 9.8;
  if (t < tl) return [p0[0] + v[0] * t, p0[1] + v[1] * t - 4.9 * t * t, p0[2] + v[2] * t];
  const b = t - tl, vb = v[1] * 0.18 + 0.6, tb = (2 * vb) / 9.8, h = b < tb ? vb * b - 4.9 * b * b : 0, s = Math.min(b, tb);
  return [p0[0] + v[0] * (tl + 0.3 * s), y0 + Math.max(0, h), p0[2] + v[2] * (tl + 0.3 * s)];
};
const pop = (t: number, t0: number, d = 0.22) => { const u = (t - t0) / d; if (u < 0) return 0; if (u >= 1) return 1; const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * (u - 1) ** 3 + c1 * (u - 1) ** 2; };
const ST = (x: number, y: number, z: number): V3 => [OX.street + x, y, z];
const S = (x: number, y: number, z: number): V3 => [OX.studio + x, y, z];
const withPos = (m: THREE.Mesh, o: { position: THREE.Vector3 }) => { m.position.copy(o.position); return m; };

const cardFace = (k: number) => ctex("hana" + k, 256, 400, (g) => {
  g.fillStyle = "#f6eed8"; g.fillRect(0, 0, 256, 400);
  g.fillStyle = ["#cfe6f2", "#f6d5dc", "#f7e1c2", "#d7d0ee", "#cfe0f5", "#f4cfc8"][k]; g.fillRect(20, 20, 216, 360);
  g.fillStyle = "#3f8a4f"; g.fillRect(121, 230, 14, 130);
  g.beginPath(); g.ellipse(95, 300, 40, 14, -0.5, 0, 7); g.fill(); g.beginPath(); g.ellipse(160, 280, 40, 14, 0.5, 0, 7); g.fill();
  const petals = (n: number, r: number, pr: number, col: string, cx = 128, cy = 170) => { g.fillStyle = col; for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2 - Math.PI / 2; g.beginPath(); g.arc(cx + Math.cos(a) * r, cy + Math.sin(a) * r, pr, 0, 7); g.fill(); } };
  if (k === 0) { g.fillStyle = "#c0353a"; g.beginPath(); g.arc(128, 110, 46, 0, 7); g.fill(); for (let i = 0; i < 3; i++) { g.fillStyle = "#2f6a43"; g.beginPath(); g.moveTo(128, 150 + i * 46); g.lineTo(60 + i * 8, 215 + i * 46); g.lineTo(196 - i * 8, 215 + i * 46); g.fill(); } }
  else if (k === 1) { petals(5, 46, 34, "#e87aa8"); g.fillStyle = "#f2c94c"; g.beginPath(); g.arc(128, 170, 22, 0, 7); g.fill(); }
  else if (k === 2) { petals(5, 50, 38, "#f7b6cb"); petals(5, 50, 16, "#ffffff"); g.fillStyle = "#c0353a"; g.beginPath(); g.arc(128, 170, 14, 0, 7); g.fill(); }
  else if (k === 3) { for (const x of [80, 128, 176]) for (let j = 0; j < 6; j++) { g.fillStyle = j % 2 ? "#8a6ad0" : "#a98fe6"; g.beginPath(); g.arc(x + (j % 2) * 6, 60 + j * 34 + (x === 128 ? 24 : 0), 18 - j, 0, 7); g.fill(); } }
  else if (k === 4) { for (const a of [-0.7, 0, 0.7]) { g.save(); g.translate(128, 230); g.rotate(a); g.fillStyle = "#4a4ad0"; g.beginPath(); g.ellipse(0, -80, 28, 76, 0, 0, 7); g.fill(); g.restore(); } g.fillStyle = "#f2c94c"; g.fillRect(122, 130, 12, 50); }
  else { petals(8, 40, 30, "#d83a4a"); petals(6, 24, 24, "#f06a78"); g.fillStyle = "#f2c94c"; g.beginPath(); g.arc(128, 170, 14, 0, 7); g.fill(); }
  g.strokeStyle = "#2b2b33"; g.lineWidth = 10; g.strokeRect(5, 5, 246, 390);
});
const cardBack = () => ctex("hanaBack", 64, 100, (g) => { g.fillStyle = "#8c1d2c"; g.fillRect(0, 0, 64, 100); g.strokeStyle = "#e8d3a0"; g.lineWidth = 4; g.strokeRect(6, 6, 52, 88); });
const pixelTex = (k: number) => ctex("pixelP" + k, 256, 256, (g, r) => {
  g.fillStyle = "#0b1030"; g.fillRect(0, 0, 256, 256);
  const cols = ["#ffc83d", "#3ddcff", "#ff7a1a", "#7dff8a", "#ff5ad9"];
  for (let i = 0; i < 26; i++) { g.fillStyle = cols[(i + k) % 5]; g.fillRect(Math.floor(r() * 14) * 16 + 8, Math.floor(r() * 14) * 16 + 8, 16 * (1 + Math.floor(r() * 3)), 16); }
});

type Taxi = { g: THREE.Group; wheels: THREE.Mesh[] };
const makeTaxi = (): Taxi => {
  const g = new THREE.Group(), body = lam("taxiBody", () => ({ color: "#ffc83d" })), dark = lam("taxiDark", () => ({ color: "#14213d" })), glass = lam("taxiGlass", () => ({ color: "#4d6f96" })), tyre = lam("taxiTyre", () => ({ color: "#1c1c24" }));
  const add = (geo: THREE.BufferGeometry, m: THREE.Material, x: number, y: number, z: number) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; g.add(o); return o; };
  add(new THREE.BoxGeometry(1.8, 0.46, 4.3), body, 0, 0.55, 0); add(new THREE.BoxGeometry(1.84, 0.1, 4.34), dark, 0, 0.42, 0); add(new THREE.BoxGeometry(1.84, 0.07, 4.34), dark, 0, 0.7, 0);
  add(new THREE.BoxGeometry(1.7, 0.62, 2.3), glass, 0, 1.12, -0.15); add(new THREE.BoxGeometry(1.78, 0.1, 2.42), body, 0, 1.48, -0.15);
  for (const [x, z] of [[-0.86, -1.3], [0.86, -1.3], [-0.86, 1.0], [0.86, 1.0]]) add(new THREE.BoxGeometry(0.1, 0.66, 0.12), body, x, 1.12, z);
  add(new THREE.BoxGeometry(0.6, 0.2, 0.34), new THREE.MeshBasicMaterial({ color: new THREE.Color(2.2, 1.3, 0.3) }), 0, 1.63, -0.15);
  for (const x of [-0.6, 0.6]) add(new THREE.BoxGeometry(0.34, 0.16, 0.06), new THREE.MeshBasicMaterial({ color: new THREE.Color(2.4, 2.3, 1.8) }), x, 0.62, 2.16);
  const wheels: THREE.Mesh[] = [];
  for (const [x, z] of [[-0.9, -1.35], [0.9, -1.35], [-0.9, 1.35], [0.9, 1.35]]) { const w = add(new THREE.CylinderGeometry(0.36, 0.36, 0.24, 18).rotateZ(Math.PI / 2), tyre, x, 0.36, z); wheels.push(w); }
  return { g, wheels };
};

type Tong = { g: THREE.Group; bars: THREE.Mesh[]; pads: THREE.Group; fingers: THREE.Mesh[]; n: number; l: number };
const makeTong = (): Tong => {
  const g = new THREE.Group(), n = 10, l = 0.3, bar = lam("tongBar", () => ({ color: "#ff7a1a" })), joint = lam("tongJoint", () => ({ color: "#ffc83d" }));
  const bars: THREE.Mesh[] = [];
  for (let i = 0; i < 2 * n; i++) { const m = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.05, 1), bar); m.castShadow = m.receiveShadow = true; m.rotation.order = "XYZ"; g.add(m); bars.push(m); }
  for (let i = 0; i <= n; i++) { const m = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 6), joint); m.name = "j"; g.add(m); }
  const pads = new THREE.Group(), fingers: THREE.Mesh[] = [];
  const hand = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 10), bar); pads.add(hand);
  for (const s of [-1, 1]) { const f = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.22), joint); f.position.set(0, s * 0.07, 0.14); pads.add(f); fingers.push(f); }
  g.add(pads);
  return { g, bars, pads, fingers, n, l };
};
/** pose a tong: extension e (0 collapsed .. 1 full), origin, heading yaw (axis +z rotated about y), grip 0..1 */
const poseTong = (tg: Tong, o: V3, yaw: number, e: number, scale = 1, grip = 0) => {
  const a = (80 - 68 * clamp01(e)) * Math.PI / 180, l = tg.l, s = l * Math.cos(a), hy = (l * Math.sin(a)) / 2;
  tg.g.position.set(...o); tg.g.rotation.set(0, yaw, 0); tg.g.scale.setScalar(scale);
  for (let c = 0; c < tg.n; c++) for (let k = 0; k < 2; k++) {
    const m = tg.bars[c * 2 + k]; m.scale.set(1, 1, l); m.position.set(0, 0, c * s + s / 2); m.rotation.x = k ? -a : a;
  }
  let j = 0; tg.g.children.forEach((ch) => { if (ch.name === "j") { ch.position.set(0, (j % 2 ? -1 : 1) * hy, j * s); j++; } });
  tg.pads.position.set(0, 0, tg.n * s + 0.06);
  tg.fingers.forEach((f, i) => { f.position.y = (i ? 1 : -1) * (0.07 - 0.05 * grip); });
  return tg.n * s * scale;
};

export class Props3D {
  root = new THREE.Group();
  private taxi: Taxi = makeTaxi(); private miniTaxi: Taxi = makeTaxi();
  private cards: THREE.Mesh[] = [];
  private lantern = new THREE.Group();
  private console3 = new THREE.Group(); private handheld = new THREE.Group();
  private bowl = new THREE.Group(); private bowlB = new THREE.Group(); private pot = new THREE.Group();
  private pouch: THREE.Mesh; private wheelG = new THREE.Group(); private wheelT = new THREE.Group(); private wheelM: THREE.Mesh;
  private tong = makeTong(); private tong2 = makeTong(); private tongPed = makeTong();
  private carton: THREE.Mesh; private carton2: THREE.Mesh; private crate: THREE.Mesh; private stack: THREE.Mesh[] = [];
  private bulb = new THREE.Group(); private bulbMat = new THREE.MeshBasicMaterial({ color: "#cfd6e0" });
  private teaser: THREE.Mesh; private teaserMat: THREE.MeshBasicMaterial; private cab = new THREE.Group(); private cabScreen: THREE.Mesh; private cabMats: THREE.MeshBasicMaterial[] = [];
  private lamp = new THREE.Group(); private lampMat = new THREE.MeshBasicMaterial({ color: "#ffe9b0" });
  private bg: THREE.Mesh; private bgMat = new THREE.MeshBasicMaterial({ color: "#ffc83d", transparent: true, opacity: 0, fog: false, depthWrite: false });
  private toys: THREE.Group[] = []; private devs: THREE.Group[] = [];
  private mini = { cab: new THREE.Group() };

  constructor() {
    const R = this.root;
    const add = (o: THREE.Object3D) => { o.traverse((c) => { c.castShadow = true; c.receiveShadow = true; }); o.visible = false; R.add(o); return o; };
    add(this.taxi.g); add(this.miniTaxi.g);
    // cards (one pool, 6 flower designs)
    const back = lam("hanaBack", () => ({ map: cardBack() })), edge = lam("hanaEdge", () => ({ color: "#e8d3a0" }));
    const geo = new THREE.BoxGeometry(0.16, 0.004, 0.25).translate(0, 0, -0.125);
    for (let i = 0; i < 16; i++) { const face = lam("hanaFace" + (i % 6), () => ({ map: cardFace(i % 6) })); const m = new THREE.Mesh(geo, [edge, edge, face, back, edge, edge]); m.rotation.order = "YXZ"; this.cards.push(m); add(m); }
    // lantern (paper, warm glow)
    const lan = new THREE.Mesh(new THREE.SphereGeometry(0.28, 16, 12), new THREE.MeshBasicMaterial({ color: new THREE.Color(2.4, 0.9, 0.35) })); lan.scale.set(1, 1.25, 1); lan.position.y = -0.4;
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.08, 10), lam("lanCap", () => ({ color: "#2a1a14" }))); cap.position.y = -0.04; this.lantern.add(lan, cap); add(this.lantern);
    // generic grey console + handheld silhouettes (no brand shapes or colours)
    const grey = lam("silGrey", () => ({ color: "#8a8f99" })), greyD = lam("silGreyD", () => ({ color: "#5d636d" }));
    this.console3.add(new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.26, 0.6), grey), withPos(new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.04, 0.4), greyD), { position: new THREE.Vector3(0, 0.15, 0) }), withPos(new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.06, 12), greyD), { position: new THREE.Vector3(-0.3, 0.15, 0.1) }));
    this.handheld.add(new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.66, 0.12), grey), withPos(new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.26, 0.02), greyD), { position: new THREE.Vector3(0, 0.12, 0.07) }));
    add(this.console3); add(this.handheld);
    // rice bowl (lower hemisphere + a rice dome) and the plain pouch
    const mkBowl = (g: THREE.Group) => { const bm = lam("bowlM", () => ({ color: "#e9eef3", side: THREE.DoubleSide })), rm = lam("riceM", () => ({ color: "#fbfbf6" }));
      const b = new THREE.Mesh(new THREE.SphereGeometry(0.17, 20, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), bm); b.position.y = 0.17; const r = new THREE.Mesh(new THREE.SphereGeometry(0.16, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), rm); r.position.y = 0.17; r.scale.y = 0.7; g.add(b, r); };
    mkBowl(this.bowl); mkBowl(this.bowlB); add(this.bowl); add(this.bowlB);
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.22, 0.28, 16), lam("potM", () => ({ color: "#8a8f99" }))); pot.position.y = 0.14; const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.04, 16), lam("potLid", () => ({ color: "#6a6f79" }))); lid.position.y = 0.3; this.pot.add(pot, lid); add(this.pot);
    this.pouch = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.38, 0.06), lam("pouchM", () => ({ color: "#e9eef3" }))); const win = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.12), new THREE.MeshBasicMaterial({ color: "#f2a23a" })); win.position.z = 0.032; this.pouch.add(win); add(this.pouch);
    this.wheelM = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.24, 18).rotateZ(Math.PI / 2), lam("taxiTyre", () => ({ color: "#1c1c24" }))); this.wheelT.add(this.wheelM); this.wheelG.add(this.wheelT); add(this.wheelG);
    add(this.tong.g); add(this.tong2.g); add(this.tongPed.g);
    // cartons
    const cm = [lam("cartonA", () => ({ color: "#c9a26b" })), lam("cartonB", () => ({ color: "#d8b27a" }))];
    this.carton = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.7, 0.7), cm[0]); this.carton2 = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.4, 0.4), cm[1]); this.crate = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.9, 0.7), lam("crateM", () => ({ color: "#7a4f33" })));
    add(this.carton); add(this.carton2); add(this.crate);
    for (let i = 0; i < 6; i++) { const m = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.4, 0.5), cm[i % 2]); this.stack.push(m); add(m); }
    // bulb
    const glass = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 12), this.bulbMat), base = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.14, 10), lam("bulbBase", () => ({ color: "#6a6f79" }))); base.position.y = 0.2; this.bulb.add(glass, base); add(this.bulb);
    // generic arcade cabinets (teaser in the studio, one big one in the arcade)
    this.teaserMat = new THREE.MeshBasicMaterial({ color: "#0b0d1c", fog: false });
    this.teaser = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.3), this.teaserMat); this.teaser.position.set(...S(0, 1.9, -12.76)); add(this.teaser);
    const bodyM = lam("bigCabBody", () => ({ color: "#33346a" })), dkM = lam("bigCabDark", () => ({ color: "#1b1740" }));
    this.cab.add(new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.6, 1.2), bodyM), withPos(new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.5, 0.9), dkM), { position: new THREE.Vector3(0, 2.15, -0.15) }), withPos(new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.5, 1.0), dkM), { position: new THREE.Vector3(0, 3.1, -0.05) }));
    for (let k = 0; k < 3; k++) this.cabMats.push(new THREE.MeshBasicMaterial({ map: pixelTex(k + 3), color: new THREE.Color(1.4, 1.4, 1.4), fog: false }));
    this.cabScreen = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.1), this.cabMats[0]); this.cabScreen.position.set(0, 2.15, 0.31); this.cab.add(this.cabScreen);
    this.cab.add(withPos(new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.4), new THREE.MeshBasicMaterial({ color: new THREE.Color(2.6, 1.6, 0.5), fog: false })), { position: new THREE.Vector3(0, 3.1, 0.46) }));
    this.cab.position.set(OX.arcade, 0, -8.2); add(this.cab);
    // desk lamp (office)
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.5, 0.04), lam("lampArm", () => ({ color: "#2a2a30" }))); arm.position.y = 0.25;
    const sh = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.22, 14, 1, true), this.lampMat); sh.position.set(0.0, 0.58, 0); sh.rotation.x = Math.PI; (sh.material as THREE.MeshBasicMaterial).side = THREE.DoubleSide;
    this.lamp.add(arm, sh); this.lamp.position.set(OX.office + 2.5, 0.88, -9.2); add(this.lamp);
    // yellow accent backdrop (closing shot)
    this.bg = new THREE.Mesh(new THREE.PlaneGeometry(15, 7), this.bgMat); this.bg.position.set(OX.studio, 3, -13.6); add(this.bg);
    // pedestal items: toys (arcade shot 18) and electronic devices (after "elektronik")
    for (let i = 0; i < 5; i++) {
      const tg = new THREE.Group(), dv = new THREE.Group();
      const colA = lam("toyA" + i, () => ({ color: ["#ffc83d", "#ff7a1a", "#3ddcff", "#e87aa8", "#7dff8a"][i] }));
      if (i % 2 === 0) { tg.add(new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.34, 0.34), colA), withPos(new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.24, 0.24), lam("toyB", () => ({ color: "#f5f5f5" }))), { position: new THREE.Vector3(0, 0.29, 0) })); }
      else { tg.add(new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.4, 14), colA), withPos(new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 8), lam("toyB", () => ({ color: "#f5f5f5" }))), { position: new THREE.Vector3(0, 0.3, 0) })); }
      dv.add(new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.3, 0.3), lam("devBody", () => ({ color: "#8a8f99" }))), withPos(new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.2), new THREE.MeshBasicMaterial({ map: pixelTex(i), color: new THREE.Color(1.3, 1.3, 1.3), fog: false })), { position: new THREE.Vector3(0, 0.02, 0.152) }));
      this.toys.push(tg); this.devs.push(dv); add(tg); add(dv);
    }
    // mini cabinet (closing pedestal row)
    this.mini.cab.add(new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.2, 0.26), bodyM), withPos(new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.34, 0.2), dkM), { position: new THREE.Vector3(0, 0.27, -0.03) }), withPos(new THREE.Mesh(new THREE.PlaneGeometry(0.26, 0.24), new THREE.MeshBasicMaterial({ map: pixelTex(2), color: new THREE.Color(1.3, 1.3, 1.3), fog: false })), { position: new THREE.Vector3(0, 0.28, 0.075) }));
    add(this.mini.cab);
  }

  private card(i: number, p: V3, rx = 0, ry = 0, rz = 0, s = 1) { const c = this.cards[i]; c.visible = true; c.position.set(...p); c.rotation.set(rx, ry, rz); c.scale.setScalar(s); return c; }

  update(id: number, t: number) {
    for (const o of this.root.children) o.visible = false;
    const f = Math.round(t * FPS), t0 = SHOTS[id - 1].a / FPS;
    // ---------------- taxi ----------------
    const driveWheels = (tx: Taxi, d: number) => tx.wheels.forEach((w) => { w.rotation.x = -d / 0.36; });
    if (id === 1) {
      const u = clamp01((f - 30) / 75), z = -45 + 47.5 * (1 - (1 - u) ** 2);
      const g = this.taxi.g; g.visible = f >= 28; g.position.set(OX.street + 2.4, 0, z); g.rotation.set(0.05 * (u > 0.85 ? Math.sin(((u - 0.85) / 0.15) * Math.PI) : 0), 0, 0); driveWheels(this.taxi, z);
    }
    if (id === 9) {
      const u = easeOut((t - t0) / 1.25), z = 30 - 33.4 * u, g = this.taxi.g; g.visible = true; g.position.set(OX.street - 3.4, 0, z); g.rotation.set(0.04 * (u > 0.9 ? 1 : 0) * Math.sin(u * 20), Math.PI, 0); driveWheels(this.taxi, -z);
    }
    if (id === 11) {
      const g = this.taxi.g, k = t >= E.wheel;
      g.visible = true; g.position.set(MARK.taxiBreak[0], 0, MARK.taxiBreak[2]); g.rotation.set(0, Math.PI, k ? 0.04 : 0); driveWheels(this.taxi, 0);
      this.taxi.wheels[2].visible = !k; // the front near wheel comes off and rolls toward the lens
      if (k) {
        const u = Math.max(0, t - E.wheel), sp = 2.4, tau = 0.55, dist = sp * tau * (1 - Math.exp(-u / tau)), rest = clamp01((t - E.fail + 0.05) / 0.35);
        this.wheelG.visible = true; this.wheelG.position.set(MARK.taxiBreak[0] + 0.9 + dist * 0.5, 0, MARK.taxiBreak[2] - 1.35 + dist * 0.85); this.wheelG.rotation.y = Math.atan2(0.5, 0.85);
        this.wheelT.rotation.z = -rest * (Math.PI / 2 - 0.1); this.wheelT.position.y = 0.36 - rest * 0.25; this.wheelM.rotation.x = rest > 0 ? 0 : -dist / 0.36;
      }
      if (t >= E.wheel + 0.1) { // the dropped pouch
        const uu = t - E.wheel - 0.1, p = fly(uu, [OX.street - 0.2, 0.95, -3.4], [0.6, 0.8, 0.5], 0.04); this.pouch.visible = true; this.pouch.position.set(...p); this.pouch.rotation.set(uu < 0.5 ? uu * 5 : -1.3, 0.4, uu < 0.5 ? uu * 3 : 0);
      }
    }
    if (id === 20) { const m = this.miniTaxi.g; m.visible = true; m.scale.setScalar(0.17); m.position.set(...(MARK.ped5[1] as V3)); m.rotation.set(0, 0.7, 0); const k = pop(t, t0 + 0.18, 0.25) * (() => { const u = (t - E.pedTaksi) / 0.4; return u < 0 || u > 1 ? 1 : 1 + 0.5 * Math.sin(Math.PI * u); })(); m.scale.setScalar(0.17 * k); m.visible = k > 0.01; }
    // ---------------- hanafuda cards ----------------
    if (id === 6) {
      const o = MARK.fan, s = smooth(clamp01((t - E.fan) / 0.3));
      for (let i = 0; i < 4; i++) this.card(i, [o[0], o[1] + 0.003 * i, o[2]], 1.0, (i - 1.5) * 0.36 * s, 0, 1.5);
      for (let i = 4; i < 7; i++) this.card(i, [o[0] + 0.55 + 0.02 * i, 0.925 + 0.004 * (i - 4), o[2] + 0.45], 0, 0.4 * i, 0, 1.5);
    }
    if (id === 7 && t >= E.kartuUp) {
      const u = easeOut((t - E.kartuUp) / 0.42), cam = camAt(7, f), P0: V3 = [OX.shopIn + 0.3, 1.5, -5.2], sc = 1.1 + 1.6 * u;
      const P1: V3 = [cam.pos[0] + (cam.look[0] - cam.pos[0]) * 0.2, cam.pos[1] - 0.05, cam.pos[2] + (cam.look[2] - cam.pos[2]) * 0.2];
      const p: V3 = [P0[0] + (P1[0] - P0[0]) * u, P0[1] + (P1[1] - P0[1]) * u, P0[2] + (P1[2] - P0[2]) * u];
      this.card(0, [p[0], p[1] - 0.125 * sc, p[2]], Math.PI / 2, 0, 0, sc).visible = u > 0.04;
    }
    if (id === 12 && t >= E.boxFall) {
      const u = t - E.boxFall, p = fly(u, [OX.shopIn - 5.45, 2.6, -4.2], [0.9, 0.2, 0.5], 0.2);
      this.carton.visible = true; this.carton.position.set(...p); const air = p[1] > 0.25; this.carton.rotation.set(air ? u * 2.8 : 0.3, 0.4, air ? u * 1.7 : 0.0);
      const land = Math.sqrt((2 * 2.4) / 9.8);
      if (u > land) for (let i = 0; i < 14; i++) { const a = rnd(i, 1) * 6.28, sp = 0.6 + 1.4 * rnd(i, 2), cp = fly(u - land, [p[0], 0.4, p[2]], [Math.cos(a) * sp, 1.8 + 1.6 * rnd(i, 3), Math.sin(a) * sp], 0.012);
        const air2 = cp[1] > 0.03; this.card(i, cp, air2 ? (u - land) * (6 + 4 * rnd(i, 4)) : 0, (u - land) * 3 * rnd(i, 5), air2 ? (u - land) * 5 : 0, 1.2); if (!air2) this.cards[i].rotation.set(0, rnd(i, 6) * 6, 0); }
    } else if (id === 12) { this.carton.visible = true; this.carton.position.set(OX.shopIn - 5.45, 2.6, -4.2); this.carton.rotation.set(0, 0, 0.03 * Math.sin(Math.max(0, t - (E.boxFall - 0.5)) * 30) * (t > E.boxFall - 0.35 ? 1 : 0)); }
    // ---------------- lantern ----------------
    if (id === 5) { this.lantern.visible = true; const sw = 0.06 + 0.2 * Math.exp(-Math.max(0, t - T(36)) * 1.2) * (t >= T(36) - 0.1 ? 1 : 0); this.lantern.position.set(...MARK.lantern); this.lantern.position.y = 3.5; this.lantern.rotation.z = sw * Math.sin(t * 5.5); }
    // ---------------- console + handheld silhouettes ----------------
    if (id === 3 || id === 4) {
      const kf = id === 3 ? pop(t, E.famicom, 0.22) : 1, kg = id === 3 ? pop(t, E.gameboy, 0.22) : 1, sw = id === 4 ? t - E.sweep : -1;
      const c = this.console3, h = this.handheld;
      c.visible = kf > 0.01; h.visible = kg > 0.01;
      c.scale.setScalar(kf); h.scale.setScalar(kg);
      c.position.set(MARK.pedL[0], MARK.pedL[1] + 0.14, MARK.pedL[2]); h.position.set(MARK.pedR[0], MARK.pedR[1] + 0.34, MARK.pedR[2]); c.rotation.set(0, 0.25, 0); h.rotation.set(-0.12, -0.3, 0);
      if (sw >= 0) { c.position.x -= 26 * sw * sw + 2 * sw; c.position.y += 0.6 * sw; c.rotation.z = sw * 9; h.position.x += 26 * sw * sw + 2 * sw; h.position.y += 0.6 * sw; h.rotation.z = -sw * 9; if (sw > 0.9) { c.visible = false; h.visible = false; } }
    }
    // ---------------- teaser cabinet + yellow back ----------------
    if (id === 2) {
      this.teaser.visible = true; const on = t >= E.teaser && t < E.teaser + 0.5; this.teaserMat.color.setRGB(on ? 1.6 : 0.04, on ? 1.4 : 0.05, on ? 0.6 : 0.11);
    }
    if (id === 22) { this.bg.visible = true; this.bgMat.opacity = clamp01((t - E.yellowBg) / 0.12) * 0.95; }
    // ---------------- kitchen ----------------
    if (id === 10) {
      this.pot.visible = true; this.pot.position.set(OX.kitchen - 0.4, 1.0, -5.55);
      const k = pop(t, E.rice, 0.25); this.bowl.visible = k > 0.01; this.bowl.position.set(OX.kitchen + 0.3, 1.15 + 0.04 * Math.sin(t * 4), -2.9); this.bowl.scale.setScalar(0.9 * k); this.bowl.rotation.y = t * 1.5;
    }
    // ---------------- bulb ----------------
    if (id === 13) {
      const on = t >= E.bulb, k = pop(t, t0 + 0.25, 0.2); this.bulb.visible = k > 0.01; this.bulb.scale.setScalar(k); this.bulb.position.set(OX.studio, 2.95 + 0.03 * Math.sin(t * 6), -3);
      this.bulbMat.color.setRGB(on ? 3.4 : 0.8, on ? 2.8 : 0.85, on ? 1.2 : 0.9);
    }
    // ---------------- office: lamp, tong, cartons ----------------
    if (id >= 14 && id <= 16) {
      this.lamp.visible = true;
      const fl = t >= E.flicker && t < E.flicker + 0.32 ? (Math.floor(t * 30) % 2 ? 0.15 : 1.4) : id === 14 && t < E.flicker ? 1 : 1;
      this.lampMat.color.setRGB(2.0 * fl, 1.7 * fl, 0.9 * fl);
    }
    if (id === 15) {
      const cam = camAt(15, f), td = MARK.techDesk, yaw = Math.atan2(cam.pos[0] - td[0], cam.pos[2] - td[2]);
      poseTong(this.tong, [td[0] - 0.3, td[1] + 0.12, td[2] + 0.1], yaw, 0.15 + 0.18 * Math.max(0, Math.sin(t * 4)), 0.9, 0); this.tong.g.visible = true;
    }
    if (id === 16) {
      const td = MARK.techDesk, o: V3 = [td[0] - 0.3, 1.12, td[2] + 0.2], yaw = Math.atan2(-0.8, 0.6);
      const u = clamp01((t - E.stretch) / 0.38), e = u < 1 ? 0.15 + 0.85 * (1 - (1 - u) ** 3) * (1 + 0.03 * Math.sin(u * 9)) : 1, grab = clamp01((t - E.grab) / 0.15), back = clamp01((t - E.grab - 0.2) / 0.6);
      const e2 = e - 0.28 * smooth(back);
      const len = poseTong(this.tong2, o, yaw, Math.min(1, e2), 1, grab); this.tong2.g.visible = true;
      const tip: V3 = [o[0] + Math.sin(yaw) * (len + 0.2), o[1], o[2] + Math.cos(yaw) * (len + 0.2)];
      const full: V3 = [o[0] + Math.sin(yaw) * 3.0, o[1], o[2] + Math.cos(yaw) * 3.0];
      this.crate.visible = true; this.crate.position.set(full[0], 0.45, full[2]); this.crate.rotation.y = yaw;
      this.carton2.visible = true; this.carton2.rotation.y = yaw; if (grab > 0.9) this.carton2.position.set(tip[0], tip[1] - 0.05, tip[2]); else this.carton2.position.set(full[0], 1.1, full[2]);
    }
    if (id === 17) {
      const boom = t >= E.laris, cs = [0, 1, 2, 3, 4, 5];
      if (!boom) cs.forEach((i) => { const m = this.stack[i]; m.visible = true; m.position.set(OX.office - 0.1 + (i % 2) * 0.05, 0.2 + (i >> 1) * 0.4 + 0.5 * 0, -2.6); m.rotation.y = 0.1 * i; });
      const u = t - E.laris;
      if (boom) for (let i = 0; i < 16; i++) { const a = rnd(i, 21) * 6.28, sp = 0.8 + 1.6 * rnd(i, 22), cp = fly(u, [OX.office - 0.1, 0.8, -2.6], [Math.cos(a) * sp, 3 + 2 * rnd(i, 23), Math.sin(a) * sp * 0.7], 0.012); const air = cp[1] > 0.03; this.card(i, cp, air ? u * (5 + 4 * rnd(i, 24)) : 0, u * 3, air ? u * 4 : 0, 1.6); if (!air) this.cards[i].rotation.set(0, rnd(i, 25) * 6, 0); }
    }
    // ---------------- arcade ----------------
    if (id === 18) {
      MARK.arcPed.forEach((p, i) => {
        const tin = pop(t, t0 + 0.1 + 0.09 * i, 0.25), sw = pop(t, E.toyToElec + 0.07 * i, 0.22), toy = t < E.toyToElec + 0.07 * i;
        const a = this.toys[i], d = this.devs[i];
        a.visible = toy && tin > 0.01; d.visible = !toy && sw > 0.01;
        a.scale.setScalar(tin * 1.2); d.scale.setScalar(sw * 1.2);
        a.position.set(p[0], p[1] + 0.17, p[2]); d.position.set(p[0], p[1] + 0.15, p[2]); a.rotation.y = t * 1.2; d.rotation.y = 0.15 * Math.sin(t * 2);
      });
    }
    if (id === 19) {
      this.cab.visible = true; const on = t >= E.cabOn;
      this.cabScreen.material = on ? this.cabMats[Math.floor(t * 7.5) % 3] : new THREE.MeshBasicMaterial({ color: "#0b0d1c" });
    }
    // ---------------- closing pedestal row (studio) ----------------
    if (id === 20) {
      const bump = (tw: number) => { const u = (t - tw) / 0.4; return u < 0 || u > 1 ? 1 : 1 + 0.5 * Math.sin(Math.PI * u); };
      const pk = (i: number) => pop(t, t0 + 0.1 + 0.08 * i, 0.25), P = MARK.ped5;
      const k0 = pk(0) * bump(E.pedKartu); this.card(0, [P[0][0], P[0][1] + 0.02, P[0][2] + 0.2], 1.2, 0, 0, 2.2 * k0).visible = k0 > 0.01;
      this.bowlB.visible = pk(2) > 0.01; this.bowlB.position.set(P[2][0], P[2][1], P[2][2]); this.bowlB.scale.setScalar(1.3 * pk(2) * bump(E.pedNasi));
      this.tongPed.g.visible = pk(3) > 0.01; poseTong(this.tongPed, [P[3][0] - 0.4, P[3][1] + 0.12, P[3][2]], Math.PI / 2, 0.55, 0.55 * pk(3), 0);
      this.mini.cab.visible = pk(4) > 0.01; this.mini.cab.position.set(P[4][0], P[4][1], P[4][2]); this.mini.cab.scale.setScalar(1.3 * pk(4));
    }
    if (id === 21) {
      const u = t - E.bowlRoll;
      if (u > -0.02) { this.bowlB.visible = true; const P = fly(Math.max(0, u), [OX.studio + 0.15, 1.1, -2.9], [0.5, 0.2, 0.7], 0.0); this.bowlB.scale.setScalar(1);
        if (u < 0.5) { this.bowlB.position.set(...P); this.bowlB.rotation.set(u * 5, 0, u * 3); } else { const k = smooth((u - 0.5) / 0.1); this.bowlB.position.set(P[0] + (OX.studio + 0.45 - P[0]) * k, P[1] + (0.95 - P[1]) * k, P[2] + (-2.8 - P[2]) * k); this.bowlB.rotation.set(0, t * 2, 0); } }
    }
    return 0;
  }
}
