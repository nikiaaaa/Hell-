// Real 3D props that fly, tumble and bounce (so an orbiting camera sees them from every side): the ranch deed in
// bullet time, poker chips jumping off the slammed table, money bags raining on the table, coins, the clock's broken
// parts, and the fifteen studies swirling out of their stack. All are pure functions of (shot id, story time t).
import * as THREE from "three";
import { lam } from "./build";
import { ctex } from "./paint";
import { W, V3, CRASH, CLOCK_SALOON, MARK, clamp01, smooth, DEED_B, DEED_FLY, deedP, deedPos, TABLE_R, chipTime } from "./story";

const rnd = (i: number, k: number) => { const x = Math.sin(i * 91.7 + k * 47.3) * 43758.5453; return x - Math.floor(x); };
/** ballistic hop with one small bounce, landing on height y0 */
const fly = (t: number, p0: V3, v: V3, y0: number): V3 => {
  const tl = (v[1] + Math.sqrt(v[1] * v[1] + 2 * 9.8 * Math.max(0, p0[1] - y0))) / 9.8;
  if (t < tl) return [p0[0] + v[0] * t, p0[1] + v[1] * t - 4.9 * t * t, p0[2] + v[2] * t];
  const b = t - tl, vb = v[1] * 0.18 + 0.6, tb = (2 * vb) / 9.8, h = b < tb ? vb * b - 4.9 * b * b : 0, s = Math.min(b, tb);
  return [p0[0] + v[0] * (tl + 0.3 * s), y0 + Math.max(0, h), p0[2] + v[2] * (tl + 0.3 * s)];
};

export class Props3D {
  root = new THREE.Group();
  private deed: THREE.Mesh;
  private chips: THREE.Mesh[] = [];
  private bags: THREE.Group[] = [];
  private coins: THREE.Mesh[] = [];
  private parts: THREE.Mesh[] = [];
  private papers: THREE.Mesh[] = [];

  constructor() {
    const deedTex = ctex("deed3d", 512, 384, (g) => {
      g.fillStyle = "#f4ead2"; g.fillRect(0, 0, 512, 384); g.strokeStyle = "#7a2f2a"; g.lineWidth = 14; g.strokeRect(16, 16, 480, 352);
      g.fillStyle = "#3a1e12"; g.textAlign = "center"; g.textBaseline = "middle"; g.font = "bold 92px Georgia, serif"; g.fillText("RANCH", 256, 140);
      g.font = "bold 64px Georgia, serif"; g.fillText("DEED", 256, 230);
      g.fillStyle = "#c0353a"; g.beginPath(); g.arc(410, 300, 34, 0, Math.PI * 2); g.fill();
    });
    const face = lam("deedFace", () => ({ map: deedTex })), edge = lam("deedEdge", () => ({ color: "#e0d2b0" }));
    this.deed = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.008, 0.31), [edge, edge, face, face, edge, edge]);
    this.add(this.deed);
    const chipCols = ["#c0353a", "#2f5fb3", "#f2ede0", "#2f8a4f", "#1c1c22"].map((c) => lam("chip3d" + c, () => ({ color: c })));
    for (let i = 0; i < 16; i++) {
      const m = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.016, 20), chipCols[i % 5]);
      this.chips.push(m); this.add(m);
    }
    const sack = lam("sack3d", () => ({ color: "#e9d9a8" })), tie = lam("tie3d", () => ({ color: "#8a5a34" }));
    const dollar = new THREE.MeshBasicMaterial({ map: ctex("dollar", 128, 128, (g) => { g.fillStyle = "#2f7a4a"; g.font = "bold 110px Arial Black, Arial"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("$", 64, 70); }), transparent: true, depthWrite: false });
    for (let i = 0; i < 5; i++) {
      const g = new THREE.Group();
      const body = new THREE.Mesh(new THREE.SphereGeometry(0.2, 20, 14), sack); body.scale.set(1, 1.15, 0.95); body.position.y = 0.21;
      const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.09, 0.1, 12), sack); neck.position.y = 0.47;
      const band = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.018, 8, 16), tie); band.rotation.x = Math.PI / 2; band.position.y = 0.44;
      const top = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.1, 10), sack); top.position.y = 0.56; top.rotation.x = Math.PI;
      const sign = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.2), dollar); sign.position.set(0, 0.22, 0.2);
      g.add(body, neck, band, top, sign); this.bags.push(g); this.add(g);
    }
    const gold = lam("coin3d", () => ({ color: "#e8c45a" }));
    for (let i = 0; i < 26; i++) { const m = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.008, 16), gold); this.coins.push(m); this.add(m); }
    const brass = lam("gear3d", () => ({ color: "#c9a13a" })), wood = lam("clockWood", () => ({ color: "#5a3a22" })), glass = new THREE.MeshBasicMaterial({ color: "#e8f4ff", transparent: true, opacity: 0.7, side: THREE.DoubleSide });
    for (let i = 0; i < 12; i++) {
      const m = i < 5 ? new THREE.Mesh(new THREE.CylinderGeometry(0.06 + 0.03 * (i % 2), 0.06 + 0.03 * (i % 2), 0.02, 10), brass)
        : i < 8 ? new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.03, 0.06), wood) : new THREE.Mesh(new THREE.PlaneGeometry(0.12, 0.08), glass);
      this.parts.push(m); this.add(m);
    }
    const paper = ctex("paper3d", 256, 330, (g) => {
      g.fillStyle = "#fbf8ef"; g.fillRect(0, 0, 256, 330); g.fillStyle = "#2a2a30"; g.font = "bold 26px Arial"; g.fillText("STUDY", 20, 40);
      g.fillStyle = "#9aa3b0"; for (let k = 0; k < 11; k++) g.fillRect(20, 70 + k * 22, 160 + (k % 3) * 25, 7);
    });
    const pm = lam("paperFace", () => ({ map: paper, side: THREE.DoubleSide }));
    for (let i = 0; i < 15; i++) { const m = new THREE.Mesh(new THREE.PlaneGeometry(0.21, 0.27), pm); this.papers.push(m); this.add(m); }
  }
  private add(m: THREE.Object3D) { m.traverse((o) => { o.castShadow = true; o.receiveShadow = true; }); m.visible = false; this.root.add(m); }

  update(id: number, t: number) {
    for (const o of this.root.children) o.visible = false;
    // ---- deed (shot 7 onward while the saloon is on screen) ----
    if (id >= 7 && id <= 10 && t >= DEED_FLY[0]) {
      const p = deedP(t), d = this.deed; d.visible = true;
      d.position.set(...deedPos(p));
      d.rotation.set(p < 1 ? 5.5 * p : 0, p < 1 ? 7.0 * p : 0.4, p < 1 ? 2.2 * p : 0);
      if (p >= 1) d.position.y = DEED_B[1];
    }
    // ---- chips jump off the felt when the fist lands (shots 8-10) ----
    const tc = chipTime(t);
    if (id >= 8 && id <= 10 && tc >= 0) this.chips.forEach((c, i) => {
      const a = rnd(i, 1) * Math.PI * 2, sp = 0.4 + 0.8 * rnd(i, 2);
      const p0: V3 = [TABLE_R[0] + (rnd(i, 3) - 0.5) * 0.9, TABLE_R[1] + 0.01, TABLE_R[2] + (rnd(i, 4) - 0.5) * 0.5];
      c.visible = true; c.position.set(...fly(tc, p0, [Math.cos(a) * sp, 1.8 + 1.4 * rnd(i, 5), Math.sin(a) * sp * 0.6], TABLE_R[1] + 0.008));
      const air = c.position.y > TABLE_R[1] + 0.02;
      c.rotation.set(air ? tc * (6 + 5 * rnd(i, 6)) : 0, tc * 3, air ? tc * (4 + 4 * rnd(i, 7)) : 0);
    });
    // ---- money bags rain on the table (shot 10), coins burst from the first landing ----
    if (id === 10) {
      this.bags.forEach((g, i) => {
        const t0 = W.luckily + 0.15 + 0.22 * i, u = t - t0;
        if (u < 0) return;
        const x = TABLE_R[0] + (i - 2) * 0.42, z = TABLE_R[2] + (rnd(i, 8) - 0.5) * 0.4;
        g.visible = true; g.position.set(...fly(u, [x, 3.6, z], [0, 0, 0], TABLE_R[1]));
        g.rotation.set(0.25 * Math.sin(u * 3 + i), i * 0.8 + u * (g.position.y > TABLE_R[1] + 0.02 ? 2 : 0), 0.2 * Math.sin(u * 4));
      });
      const tl = W.luckily + 0.15 + Math.sqrt((3.6 - TABLE_R[1]) / 4.9), u = t - tl;
      if (u >= 0) this.coins.forEach((c, i) => {
        const a = rnd(i, 9) * Math.PI * 2, sp = 0.5 + rnd(i, 10);
        c.visible = true; c.position.set(...fly(u, [TABLE_R[0] - 0.84, TABLE_R[1] + 0.2, TABLE_R[2]], [Math.cos(a) * sp, 1.6 + 1.6 * rnd(i, 11), Math.sin(a) * sp * 0.7], TABLE_R[1] + 0.005));
        c.rotation.set(u * 9 * rnd(i, 12), u * 2, u * 7);
      });
    }
    // ---- the clock's broken parts scatter on the floor (shots 9-10) ----
    if ((id === 9 || id === 10) && t >= CRASH) {
      const u = t - CRASH;
      this.parts.forEach((m, i) => {
        const a = -Math.PI * rnd(i, 13), sp = 0.8 + 1.6 * rnd(i, 14);
        m.visible = true; m.position.set(...fly(u, [CLOCK_SALOON[0], 0.15, CLOCK_SALOON[2] + 0.9], [Math.cos(a) * sp, 1.2 + 1.8 * rnd(i, 15), -Math.sin(a) * sp * 0.6 + 0.6], 0.012));
        const air = m.position.y > 0.03;
        m.rotation.set(air ? u * 11 * rnd(i, 16) : -Math.PI / 2, u * 5, air ? u * 8 : 0);
      });
    }
    // ---- fifteen studies swirl out of the stack (shot 12) ----
    if (id === 12 && t >= W.fifteen - 0.1) {
      const u = t - (W.fifteen - 0.1), st = MARK.studies, fall = Math.max(0, t - W.found + 0.1);
      this.papers.forEach((m, i) => {
        const th = i * 0.42 + u * (1.6 + 0.3 * rnd(i, 17)), r = 0.25 + 0.55 * smooth(u / 1.2) + 0.1 * rnd(i, 18);
        const up = 0.55 + 1.6 * smooth(u / 1.4) * (0.6 + 0.4 * rnd(i, 19)) - 1.8 * smooth(fall / 1.6);
        m.visible = true; m.position.set(st[0] + Math.cos(th) * r, Math.max(0.012 + i * 0.002, up), st[2] + Math.sin(th) * r);
        const flat = up <= 0.02;
        m.rotation.set(flat ? -Math.PI / 2 : u * (2 + rnd(i, 20) * 3), th, flat ? 0 : u * 1.7);
      });
    }
    return clamp01(0);
  }
}
