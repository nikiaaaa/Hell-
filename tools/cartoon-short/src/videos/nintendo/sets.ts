// Sets of the Nintendo-history short (all procedural, no text anywhere, no third-party marks): studio (A), arcade (A2),
// Kyoto card workshop exterior + interior (B), Kyoto street (C), instant-rice kitchen (D), toy-factory office (E).
import * as THREE from "three";
import { Batch, boxGeo, quad, V, lam, house } from "./build";
import { ctex, rep, jit, planksHD, cobbleHD } from "./paint";
import { twoTone } from "./shade";
import { NOINK } from "./ink";
import { OX } from "./story";

const M4 = (x: number, y: number, z: number, ry = 0) => new THREE.Matrix4().makeRotationY(ry).setPosition(x, y, z);
const solid = (key: string, color: string) => lam(key, () => ({ color }));
const glow = (r: number, g: number, b: number) => new THREE.MeshBasicMaterial({ color: new THREE.Color(r, g, b), fog: false });

const room = (b: Batch, x0: number, x1: number, z0: number, z1: number, h: number, floor: THREE.Material, wall: THREE.Material, ft = 2, wt = 2) => {
  b.add(quad(V(x0, 0, z1), V(x1, 0, z1), V(x1, 0, z0), V(x0, 0, z0), (x1 - x0) / ft, (z1 - z0) / ft), floor);
  b.add(quad(V(x0, 0, z0), V(x1, 0, z0), V(x1, h, z0), V(x0, h, z0), (x1 - x0) / wt, h / wt), wall);
  b.add(quad(V(x1, 0, z1), V(x0, 0, z1), V(x0, h, z1), V(x1, h, z1), (x1 - x0) / wt, h / wt), wall);
  b.add(quad(V(x0, 0, z1), V(x0, 0, z0), V(x0, h, z0), V(x0, h, z1), (z1 - z0) / wt, h / wt), wall);
  b.add(quad(V(x1, 0, z0), V(x1, 0, z1), V(x1, h, z1), V(x1, h, z0), (z1 - z0) / wt, h / wt), wall);
};
const band = (b: Batch, x0: number, x1: number, z0: number, z1: number, y0: number, y1: number, m: THREE.Material, d = 0.06) => {
  b.add(boxGeo(V(x0, y0, z0), V(x1, y1, z0 + d)), m); b.add(boxGeo(V(x0, y0, z1 - d), V(x1, y1, z1)), m);
  b.add(boxGeo(V(x0, y0, z0), V(x0 + d, y1, z1)), m); b.add(boxGeo(V(x1 - d, y0, z0), V(x1, y1, z1)), m);
};
const ceiling = (root: THREE.Object3D, x0: number, x1: number, z0: number, z1: number, h: number, mat: THREE.Material) => {
  const m = new THREE.Mesh(quad(V(x0, h, z0), V(x1, h, z0), V(x1, h, z1), V(x0, h, z1), 4, 4), mat);
  m.castShadow = false; m.receiveShadow = false; root.add(m);
};
const ceilMat = (c: string) => lam("ceil" + c, () => ({ color: c, side: THREE.DoubleSide }));

// ---------------- painted textures (no lettering) ----------------
const tileTex = (key: string, a: string, c: string) => ctex(key, 512, 512, (g, r) => {
  for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) { g.fillStyle = (x + y) % 2 ? jit(r, a, 0.03) : jit(r, c, 0.03); g.fillRect(x * 128, y * 128, 128, 128); }
  g.strokeStyle = "rgba(20,30,50,0.3)"; g.lineWidth = 3;
  for (let i = 0; i <= 4; i++) { g.beginPath(); g.moveTo(i * 128, 0); g.lineTo(i * 128, 512); g.stroke(); g.beginPath(); g.moveTo(0, i * 128); g.lineTo(512, i * 128); g.stroke(); }
});
const boardsTex = (key: string, base: string) => ctex(key, 512, 512, (g, r) => {
  g.fillStyle = base; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 8; i++) {
    g.fillStyle = jit(r, base, 0.1); g.fillRect(i * 64 + 3, 0, 58, 512);
    g.fillStyle = "rgba(40,24,16,0.85)"; g.fillRect(i * 64, 0, 4, 512);
    for (let k = 0; k < 3; k++) { g.fillStyle = "rgba(60,36,20,0.3)"; g.fillRect(i * 64 + 10 + r() * 40, r() * 512, 3, 40 + r() * 80); }
  }
});
/** abstract pixel-block screen (no characters, no letters) */
const pixelTex = (k: number) => ctex("pixel" + k, 256, 256, (g, r) => {
  g.fillStyle = "#0b1030"; g.fillRect(0, 0, 256, 256);
  const cols = ["#ffc83d", "#3ddcff", "#ff7a1a", "#7dff8a", "#ff5ad9"];
  for (let i = 0; i < 26; i++) { g.fillStyle = cols[(i + k) % 5]; g.fillRect(Math.floor(r() * 14) * 16 + 8, Math.floor(r() * 14) * 16 + 8, 16 * (1 + Math.floor(r() * 3)), 16); }
});
const steelTex = () => ctex("cabinetSide", 128, 128, (g) => { g.fillStyle = "#33346a"; g.fillRect(0, 0, 128, 128); g.fillStyle = "#ffc83d"; g.fillRect(0, 56, 128, 10); });

export type Sets = Record<string, never>;
export const buildSets = (root: THREE.Object3D): Sets => {
  const b = new Batch();
  const navy = solid("navyWall", "#2a4278"), gold = solid("accentYellow", "#ffc83d");

  // ===== STUDIO (A, x 0): room x -8..8, z -14..6, 6 m =====
  {
    const o = OX.studio, floor = lam("studioFloor", () => ({ map: tileTex("studioTile", "#f2f2ee", "#d8dde6") }));
    room(b, o - 8, o + 8, -14, 6, 6, floor, navy, 3, 3);
    band(b, o - 8, o + 8, -14, 6, 0, 0.2, solid("studioSkirt", "#14213d"), 0.05);
    band(b, o - 8, o + 8, -14, 6, 1.3, 1.5, gold, 0.05);
    ceiling(root, o - 8, o + 8, -14, 6, 6, ceilMat("#c9ced8"));
        for (const x of [-4, -2, 0, 2, 4]) { b.add(new THREE.CylinderGeometry(0.5, 0.56, 0.8, 24), solid("pedestal", "#f5f5f5"), M4(o + x, 0.4, -9)); b.add(new THREE.CylinderGeometry(0.54, 0.54, 0.06, 24), gold, M4(o + x, 0.83, -9)); }
    // dark teaser cabinet against the back wall (its screen is lit by props3d)
    b.add(boxGeo(V(o - 1.2, 0, -13.8), V(o + 1.2, 3.0, -12.8)), solid("teaserBody", "#14152b"));
  }

  // ===== ARCADE (A2, x 2000): room x -9..9, z -14..6, 5 m =====
  {
    const o = OX.arcade, floor = lam("arcFloor", () => ({ map: tileTex("arcTile", "#3a6fc4", "#e9eef8") })), wall = solid("arcWall", "#3a2a6a");
    room(b, o - 9, o + 9, -14, 6, 5, floor, wall, 3, 3);
    band(b, o - 9, o + 9, -14, 6, 0, 0.2, solid("arcSkirt", "#14213d"), 0.05);
    band(b, o - 9, o + 9, -14, 6, 1.3, 1.5, gold, 0.05);
    ceiling(root, o - 9, o + 9, -14, 6, 5, ceilMat("#2a2048"));
    const body = lam("cabBody", () => ({ map: steelTex() })), dark = solid("cabDark", "#1b1740");
    const cab = (x: number, z: number, k: number, ry = 0, big = 1) => {
      const m = (ox: number, oy: number, oz: number) => M4(o + x, 0, z, ry).multiply(new THREE.Matrix4().makeTranslation(ox * big, oy * big, oz * big)).scale(V(big, big, big));
      b.add(new THREE.BoxGeometry(0.9, 1.0, 0.8), body, m(0, 0.5, 0)); b.add(new THREE.BoxGeometry(0.9, 0.9, 0.55), dark, m(0, 1.45, -0.12)); b.add(new THREE.BoxGeometry(0.98, 0.32, 0.7), dark, m(0, 2.06, -0.04));
      const sc = new THREE.Mesh(new THREE.PlaneGeometry(0.72, 0.62), new THREE.MeshBasicMaterial({ map: pixelTex(k), color: new THREE.Color(1.15, 1.15, 1.15), fog: false }));
      sc.position.set(0, 1.42, 0.17); sc.layers.set(NOINK); const g = new THREE.Group(); g.add(sc); g.applyMatrix4(m(0, 0, 0)); root.add(g);
      const mq = new THREE.Mesh(new THREE.PlaneGeometry(0.86, 0.24), glow(2.2 + (k % 2), 1.5, 0.6 + (k % 3) * 0.5)); mq.position.set(0, 2.06, 0.33); mq.layers.set(NOINK);
      const g2 = new THREE.Group(); g2.add(mq); g2.applyMatrix4(m(0, 0, 0)); root.add(g2);
    };
    for (let i = -4; i <= 4; i++) if (i !== 0) cab(i * 1.9, -13.3, i + 6);
    for (const z of [-3, -8]) { cab(-8.3, z, 2, Math.PI / 2); cab(8.3, z, 4, -Math.PI / 2); }
    for (const x of [-4, -2, 0, 2, 4]) { b.add(new THREE.CylinderGeometry(0.5, 0.56, 0.8, 24), solid("pedestal", "#f5f5f5"), M4(o + x, 0.4, -7)); b.add(new THREE.CylinderGeometry(0.54, 0.54, 0.06, 24), gold, M4(o + x, 0.83, -7)); }
  }

  // ===== SHOP EXTERIOR (B, x 400): Kyoto lane, workshop facing the camera =====
  {
    const o = OX.shopOut, ground = lam("shopGround", () => ({ map: rep(cobbleHD(), 22, 22) }));
    b.add(quad(V(o - 55, 0, 55), V(o + 55, 0, 55), V(o + 55, 0, -55), V(o - 55, 0, -55), 1, 1), ground);
    house(b, o, -14, 0, 11, 8, 5.4, 3);
    house(b, o - 13, -13, 0, 11, 7, 4.8, 6); house(b, o + 13.5, -13, 0, 11, 7, 6.0, 2);
    house(b, o - 22, -3, Math.PI / 2, 9, 7, 5.2, 4); house(b, o + 22, -3, -Math.PI / 2, 9, 7, 5.6, 7);
    const post = solid("fencePost", "#6a4a32");
    for (let i = -8; i <= 8; i++) b.add(boxGeo(V(o + i * 1.2 - 0.06, 0, 0.94), V(o + i * 1.2 + 0.06, 1.0, 1.06)), post);
    b.add(boxGeo(V(o - 10, 0.75, 0.95), V(o + 10, 0.85, 1.05)), post); b.add(boxGeo(V(o - 10, 0.4, 0.95), V(o + 10, 0.48, 1.05)), post);
    // short beam for the lantern + a plain indigo door curtain (no lettering)
    b.add(boxGeo(V(o + 1.9, 3.5, -9.9), V(o + 2.5, 3.56, -8.4)), post); b.add(boxGeo(V(o + 2.2 - 0.03, 3.1, -8.5 - 0.03), V(o + 2.2 + 0.03, 3.5, -8.5 + 0.03)), post);
    b.add(boxGeo(V(o - 1.1, 1.9, -9.88), V(o + 1.1, 2.7, -9.84)), solid("curtain", "#243b7a"));
    b.add(boxGeo(V(o - 4.4, 0, -6.8), V(o - 3.0, 0.8, -5.6)), solid("crateOut", "#a8763e"));
    b.add(boxGeo(V(o + 3.4, 0, -6.2), V(o + 4.6, 0.6, -5.2)), solid("crateOut", "#a8763e"));
  }

  // ===== SHOP INTERIOR (B, x 460): card workshop, 12 x 14 m, 3.6 m =====
  {
    const o = OX.shopIn, floor = lam("shopFloor", () => ({ map: rep(planksHD(), 1, 1) })), wall = lam("shopWall", () => ({ map: boardsTex("shopBoards", "#9a6a44") }));
    const dark = solid("shopTrim", "#4a2e1e");
    room(b, o - 6, o + 6, -9, 5, 3.6, floor, wall, 2.5, 2.4);
    band(b, o - 6, o + 6, -9, 5, 0, 0.2, dark, 0.06); band(b, o - 6, o + 6, -9, 5, 3.3, 3.6, dark, 0.12);
    ceiling(root, o - 6, o + 6, -9, 5, 3.6, lam("shopCeil", () => ({ map: boardsTex("ceilB", "#5a3a26"), side: THREE.DoubleSide })));
    // work desk
    const top = solid("deskTop", "#b08455");
    b.add(boxGeo(V(o - 1.5, 0.82, -4.7), V(o + 1.5, 0.92, -3.3)), top);
    for (const [sx, sz] of [[-1.4, -4.6], [1.4, -4.6], [-1.4, -3.4], [1.4, -3.4]]) b.add(boxGeo(V(o + sx - 0.05, 0, sz - 0.05), V(o + sx + 0.05, 0.82, sz + 0.05)), dark);
    b.add(boxGeo(V(o - 0.4, 0, -5.9), V(o + 0.4, 0.5, -5.5)), dark); // stool
    // shelving with card boxes along the left wall and the back wall
    const shelf = solid("shelfWood", "#7a4f33"), boxC = [solid("cbox1", "#c9a26b"), solid("cbox2", "#b88a50"), solid("cbox3", "#d8b27a")];
    for (const y of [0.1, 1.15, 2.2]) { b.add(boxGeo(V(o - 5.9, y, -8.8), V(o - 4.9, y + 0.06, -1)), shelf); b.add(boxGeo(V(o - 4.6, y, -8.9), V(o + 5.9, y + 0.06, -8.3)), shelf); }
    for (let i = 0; i < 18; i++) { if (i === 11) continue; const y = [0.16, 1.21, 2.26][i % 3]; b.add(boxGeo(V(o - 5.8, y, -8.6 + 0.4 * i), V(o - 5.1, y + 0.7, -8.3 + 0.4 * i)), boxC[i % 3]); }
    for (let i = 0; i < 20; i++) { const y = [0.16, 1.21, 2.26][i % 3]; b.add(boxGeo(V(o - 4.4 + 0.52 * i, y, -8.8), V(o - 3.95 + 0.52 * i, y + 0.7, -8.4)), boxC[(i + 1) % 3]); }
  }

  // ===== STREET (C, x 800): Kyoto street 1960s along z =====
  {
    const o = OX.street, ground = lam("streetGround", () => ({ map: rep(cobbleHD(), 30, 30) }));
    b.add(quad(V(o - 70, 0, 70), V(o + 70, 0, 70), V(o + 70, 0, -70), V(o - 70, 0, -70), 1, 1), ground);
    const rows = [3, 6, 7, 2, 4, 3, 7, 6];
    for (let i = 0; i < 8; i++) for (const side of [-1, 1]) {
      const h = 5.4 + ((i * 5 + (side > 0 ? 2 : 0)) % 3) * 0.9, w = 8.6 + (i % 3);
      house(b, o + side * 9.5, 18 - i * 10.2 - (side > 0 ? 4 : 0), side < 0 ? Math.PI / 2 : -Math.PI / 2, w, 7, h, rows[(i + (side > 0 ? 3 : 0)) % 8]);
    }
    house(b, o, -62, 0, 18, 8, 6.5, 3);
    const awn = [solid("awnA", "#c0453a"), solid("awnB", "#2f6a8a"), solid("awnC", "#d8a23a")];
    for (let i = 0; i < 6; i++) for (const side of [-1, 1]) b.add(boxGeo(V(o + side * 6.0 - (side < 0 ? 0 : 1.3), 2.5, 14 - i * 10.2 - (side > 0 ? 4 : 0) - 1.6), V(o + side * 6.0 + (side < 0 ? 1.3 : 0), 2.62, 14 - i * 10.2 - (side > 0 ? 4 : 0) + 1.6)), awn[(i + (side > 0 ? 1 : 0)) % 3]);
    const pot = solid("planterPot", "#b5653f"), leaf = solid("planterLeaf", "#5c9a4a");
    for (let i = 0; i < 6; i++) for (const side of [-1, 1]) { const x = o + side * 5.5, z = 12 - i * 10.2 - (side > 0 ? 3 : 0); b.add(new THREE.CylinderGeometry(0.3, 0.24, 0.5, 12), pot, M4(x, 0.25, z)); b.add(new THREE.SphereGeometry(0.46, 12, 10), leaf, M4(x, 0.85, z)); }
  }

  // ===== KITCHEN (D, x 1200): 10 x 9 m, 3.2 m =====
  {
    const o = OX.kitchen, floor = lam("kitFloor", () => ({ map: tileTex("kitTile", "#d9c39a", "#c9b080") })), wall = solid("kitWall", "#e6d49a");
    room(b, o - 5, o + 5, -6, 3, 3.2, floor, wall, 2, 2);
    band(b, o - 5, o + 5, -6, 3, 0, 0.12, solid("kitSkirt", "#8a6a44"), 0.04);
    ceiling(root, o - 5, o + 5, -6, 3, 3.2, ceilMat("#f0e8d0"));
    const cab = solid("kitCab", "#6f8fa6"), counter = solid("kitCounter", "#efece6");
    b.add(boxGeo(V(o - 5, 0.1, -6), V(o + 5, 0.92, -5.2)), cab); b.add(boxGeo(V(o - 5, 0.92, -6), V(o + 5, 1.0, -5.1)), counter);
    for (let i = 0; i < 8; i++) b.add(boxGeo(V(o - 4.6 + i * 1.25, 1.9, -6), V(o - 3.6 + i * 1.25, 2.9, -5.5)), i % 2 ? cab : solid("kitCab2", "#7fa0b8"));
    const stove = solid("stoveBody", "#d8dde2"), iron = solid("stoveIron", "#2a2a30");
    b.add(boxGeo(V(o - 0.8, 0.1, -5.95), V(o + 0.8, 1.02, -5.15)), stove);
    for (const x of [-0.4, 0.4]) b.add(new THREE.CylinderGeometry(0.22, 0.22, 0.03, 20), iron, M4(o + x, 1.04, -5.55));
    b.add(boxGeo(V(o + 2.4, 0, -4.4), V(o + 4.6, 0.9, -3.6)), solid("kitIsland", "#c9a26b"));
    b.add(boxGeo(V(o + 2.3, 0.9, -4.5), V(o + 4.7, 0.98, -3.5)), counter);
  }

  // ===== OFFICE (E, x 1600): toy-factory office 14 x 16 m, 3.5 m =====
  {
    const o = OX.office, floor = lam("offFloor", () => ({ map: rep(planksHD(), 1, 1) })), wall = solid("offWall", "#a9bfae");
    room(b, o - 7, o + 7, -12, 4, 3.5, floor, wall, 2.5, 2.5);
    band(b, o - 7, o + 7, -12, 4, 0, 0.15, solid("offSkirt", "#5a4636"), 0.05); band(b, o - 7, o + 7, -12, 4, 1.1, 1.18, solid("offRail", "#6a8a76"), 0.05);
    ceiling(root, o - 7, o + 7, -12, 4, 3.5, ceilMat("#e6eae4"));
    const shelf = solid("offShelf", "#6a4a32"), boxC = [solid("tbox1", "#c9a26b"), solid("tbox2", "#e0c08a"), solid("tbox3", "#d8924a")];
    for (const y of [0.1, 1.2, 2.3]) { b.add(boxGeo(V(o - 6.9, y, -11.6), V(o - 6.0, y + 0.06, -2)), shelf); b.add(boxGeo(V(o + 6.0, y, -11.6), V(o + 6.9, y + 0.06, -2)), shelf); }
    for (let i = 0; i < 24; i++) { const y = [0.16, 1.26, 2.36][i % 3], z = -11.4 + 0.4 * Math.floor(i / 3) + (i % 3) * 0.03; b.add(boxGeo(V(o - 6.8, y, z), V(o - 6.15, y + 0.8, z + 0.34)), boxC[i % 3]); b.add(boxGeo(V(o + 6.15, y, z), V(o + 6.8, y + 0.8, z + 0.34)), boxC[(i + 1) % 3]); }
    // door frame on the back-left wall
    const fr = solid("doorFr", "#4a3a2c"); b.add(boxGeo(V(o - 3.4, 0, -11.95), V(o - 1.6, 2.4, -11.85)), solid("doorHole", "#2a2a36")); b.add(boxGeo(V(o - 3.55, 0, -11.9), V(o - 3.4, 2.5, -11.8)), fr); b.add(boxGeo(V(o - 1.6, 0, -11.9), V(o - 1.45, 2.5, -11.8)), fr); b.add(boxGeo(V(o - 3.55, 2.4, -11.9), V(o - 1.45, 2.55, -11.8)), fr);
    // technician's desk in the corner
    const top = solid("offDesk", "#c79a62"), leg = solid("offDeskLeg", "#4a3a2c");
    b.add(boxGeo(V(o + 2.0, 0.78, -9.6), V(o + 4.6, 0.88, -8.2)), top);
    for (const [sx, sz] of [[2.1, -9.5], [4.5, -9.5], [2.1, -8.3], [4.5, -8.3]]) b.add(boxGeo(V(o + sx - 0.05, 0, sz - 0.05), V(o + sx + 0.05, 0.78, sz + 0.05)), leg);
    b.add(boxGeo(V(o + 3.3 - 0.4, 0, -10.6), V(o + 3.3 + 0.4, 0.5, -10.2)), leg);
    // a few boxes on the floor
    b.add(boxGeo(V(o - 4.2, 0, -3), V(o - 3.2, 0.7, -2.2)), boxC[0]); b.add(boxGeo(V(o + 4.8, 0, -4.2), V(o + 5.8, 0.9, -3.2)), boxC[2]);
  }

  b.build(root);
  return {} as Sets;
};
