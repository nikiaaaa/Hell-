// The four sets of "The Clocks Came Down", built from merged batches with painted canvas textures and two-tone
// materials (shade.ts via build.ts lam()). Signs, clock faces and screens are unlit so they stay readable.
// CASINO x 0 (modern, no windows, no clocks), TOWN x 400 (1931 Nevada main street), SALOON x 800 (1931 casino with a
// big wall clock), HOSPITAL x 1200 (waiting room with a wall clock).
import * as THREE from "three";
import { Batch, boxGeo, quad, V, lam } from "./build";
import { ctex, rep, jit, planksHD } from "./paint";
import { twoTone } from "./shade";
import { NOINK } from "./ink";
import { CLOCK_SALOON, CLOCK_R, V3 } from "./story";

const M4 = (x: number, y: number, z: number, ry = 0) => new THREE.Matrix4().makeRotationY(ry).setPosition(x, y, z);
const unlit = (key: string, map: THREE.Texture, color: THREE.ColorRepresentation = 0xffffff) =>
  new THREE.MeshBasicMaterial({ map, color, toneMapped: true, fog: false, name: key });
const glow = (r: number, g: number, b: number) => new THREE.MeshBasicMaterial({ color: new THREE.Color(r, g, b), fog: false });
const solid = (key: string, color: string) => lam(key, () => ({ color }));

/** floor + four inward walls of a room (no ceiling); walls are double-sided so sun shadows stay inside */
const room = (b: Batch, x0: number, x1: number, z0: number, z1: number, h: number, floor: THREE.Material, wall: THREE.Material, ft = 2, wt = 2) => {
  b.add(quad(V(x0, 0, z1), V(x1, 0, z1), V(x1, 0, z0), V(x0, 0, z0), (x1 - x0) / ft, (z1 - z0) / ft), floor);
  b.add(quad(V(x0, 0, z0), V(x1, 0, z0), V(x1, h, z0), V(x0, h, z0), (x1 - x0) / wt, h / wt), wall);
  b.add(quad(V(x1, 0, z1), V(x0, 0, z1), V(x0, h, z1), V(x1, h, z1), (x1 - x0) / wt, h / wt), wall);
  b.add(quad(V(x0, 0, z1), V(x0, 0, z0), V(x0, h, z0), V(x0, h, z1), (z1 - z0) / wt, h / wt), wall);
  b.add(quad(V(x1, 0, z0), V(x1, 0, z1), V(x1, h, z1), V(x1, h, z0), (z1 - z0) / wt, h / wt), wall);
};
/** a thin band along all four walls at height y0..y1 (skirting, dado rail, cornice) */
const band = (b: Batch, x0: number, x1: number, z0: number, z1: number, y0: number, y1: number, m: THREE.Material, d = 0.06) => {
  b.add(boxGeo(V(x0, y0, z0), V(x1, y1, z0 + d)), m);
  b.add(boxGeo(V(x0, y0, z1 - d), V(x1, y1, z1)), m);
  b.add(boxGeo(V(x0, y0, z0), V(x0 + d, y1, z1)), m);
  b.add(boxGeo(V(x1 - d, y0, z0), V(x1, y1, z1)), m);
};

// ---------------- painted textures ----------------
const carpetTex = () => ctex("carpet", 1024, 1024, (g, r) => {
  g.fillStyle = "#8e1f2c"; g.fillRect(0, 0, 1024, 1024);
  // loud casino carpet: gold diamonds, teal swirls, purple dots on a deep red ground
  for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) {
    const cx = x * 256 + 128, cy = y * 256 + 128;
    g.fillStyle = "#e0a93a"; g.beginPath(); g.moveTo(cx, cy - 92); g.lineTo(cx + 92, cy); g.lineTo(cx, cy + 92); g.lineTo(cx - 92, cy); g.closePath(); g.fill();
    g.fillStyle = "#6b1424"; g.beginPath(); g.moveTo(cx, cy - 62); g.lineTo(cx + 62, cy); g.lineTo(cx, cy + 62); g.lineTo(cx - 62, cy); g.closePath(); g.fill();
    g.strokeStyle = "#2aa198"; g.lineWidth = 14;
    for (const s of [-1, 1]) { g.beginPath(); g.arc(cx + s * 128, cy + s * 128, 54, 0, Math.PI * 1.5); g.stroke(); }
    g.fillStyle = "#5b3a8c"; for (const [dx, dy] of [[0, 0], [128, 0], [0, 128]]) { g.beginPath(); g.arc(x * 256 + dx, y * 256 + dy, 20, 0, Math.PI * 2); g.fill(); }
    g.fillStyle = "#f3d27a"; g.beginPath(); g.arc(cx, cy, 16, 0, Math.PI * 2); g.fill();
  }
  for (let i = 0; i < 6000; i++) { g.fillStyle = `rgba(0,0,0,${0.05 + r() * 0.08})`; g.fillRect(r() * 1024, r() * 1024, 2, 2); }
});
const damaskTex = () => ctex("damask", 512, 512, (g) => {
  g.fillStyle = "#5a1a2a"; g.fillRect(0, 0, 512, 512);
  g.fillStyle = "#6e2335";
  for (const [x, y] of [[128, 128], [384, 384], [384, 128], [128, 384]]) {
    g.beginPath(); g.ellipse(x, y, 60, 96, 0, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.ellipse(x, y - 110, 18, 30, 0, 0, Math.PI * 2); g.fill();
  }
});
/** pale circle + nail where a clock used to hang (CASINO back wall) */
const ghostTex = () => ctex("ghost", 512, 512, (g) => {
  g.fillStyle = "#5a1a2a"; g.fillRect(0, 0, 512, 512);
  g.fillStyle = "#6e2335"; for (const [x, y] of [[128, 128], [384, 384], [384, 128], [128, 384]]) { g.beginPath(); g.ellipse(x, y, 60, 96, 0, 0, Math.PI * 2); g.fill(); }
  g.fillStyle = "#7a3444"; g.beginPath(); g.arc(256, 256, 170, 0, Math.PI * 2); g.fill();
  g.strokeStyle = "#8e4656"; g.lineWidth = 10; g.stroke();
  g.fillStyle = "#2a1a1e"; g.beginPath(); g.arc(256, 100, 10, 0, Math.PI * 2); g.fill();
});
/** a window bricked over and wallpapered (CASINO side wall) */
const brickedTex = () => ctex("bricked", 512, 640, (g, r) => {
  g.fillStyle = "#5a1a2a"; g.fillRect(0, 0, 512, 640);
  g.fillStyle = "#e8d6b0"; g.fillRect(56, 40, 400, 560);
  g.fillStyle = "#3d2a22"; g.fillRect(80, 64, 352, 512);
  for (let row = 0; row < 16; row++) for (let k = -1; k < 6; k++) {
    const w = 72, x = 80 + k * w + (row % 2 ? w / 2 : 0), y = 64 + row * 32;
    g.fillStyle = jit(r, "#9c4a36", 0.12); g.fillRect(Math.max(80, x + 3), y + 3, Math.min(w - 6, 432 - x - 3), 26);
  }
  g.fillStyle = "#e8d6b0"; g.fillRect(56, 318, 400, 12); g.fillRect(250, 40, 12, 560);
});
const slotFace = (k: number) => ctex("slot" + k, 256, 512, (g) => {
  const body = ["#b8202f", "#1f5fb3", "#7a2fa8", "#c27a16"][k % 4];
  g.fillStyle = body; g.fillRect(0, 0, 256, 512);
  g.fillStyle = "#f2c94c"; g.fillRect(0, 0, 256, 18); g.fillRect(0, 494, 256, 18);
  g.fillStyle = "#1b1b24"; g.fillRect(28, 170, 200, 120);
  g.fillStyle = "#f7f3e8"; for (let i = 0; i < 3; i++) g.fillRect(36 + i * 64, 180, 56, 100);
  g.font = "bold 64px Arial Black, Arial"; g.textAlign = "center"; g.textBaseline = "middle";
  const sym = ["7", "7", "7"];
  sym.forEach((s, i) => { g.fillStyle = "#d22d2d"; g.fillText(s, 64 + i * 64, 232); });
  g.fillStyle = "#f2c94c"; g.fillRect(40, 330, 176, 34);
  g.fillStyle = "#2b2b33"; g.fillRect(70, 400, 116, 18);
  g.fillStyle = "#ffffff"; g.font = "bold 30px Arial Black, Arial"; g.fillText(["LUCKY", "JACKPOT", "BIG WIN", "GOLD"][k % 4], 128, 347);
});
const slotTop = (k: number) => ctex("slotTop" + k, 256, 128, (g) => {
  g.fillStyle = ["#ffcf4a", "#57d1ff", "#ff7ad9", "#9cff6b"][k % 4]; g.fillRect(0, 0, 256, 128);
  g.fillStyle = "#2a1630"; g.font = "bold 52px Arial Black, Arial"; g.textAlign = "center"; g.textBaseline = "middle";
  g.fillText(["777", "WIN", "$$$", "BAR"][k % 4], 128, 66);
});
const feltTex = () => ctex("felt", 256, 256, (g, r) => {
  g.fillStyle = "#1f7a4d"; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 1500; i++) { g.fillStyle = `rgba(0,0,0,${r() * 0.07})`; g.fillRect(r() * 256, r() * 256, 2, 2); }
});
const sandTex = () => ctex("sand", 1024, 1024, (g, r) => {
  g.fillStyle = "#dcc08e"; g.fillRect(0, 0, 1024, 1024);
  for (let i = 0; i < 900; i++) { g.fillStyle = jit(r, "#c9a874", 0.12); g.beginPath(); g.ellipse(r() * 1024, r() * 1024, 6 + r() * 26, 3 + r() * 8, r() * 3, 0, Math.PI * 2); g.fill(); }
  for (let i = 0; i < 60; i++) { g.strokeStyle = "rgba(120,90,60,0.25)"; g.lineWidth = 4; const y = r() * 1024; g.beginPath(); g.moveTo(0, y); g.lineTo(1024, y + (r() - 0.5) * 60); g.stroke(); }
});
const boardsTex = (key: string, base: string) => ctex(key, 512, 512, (g, r) => {
  g.fillStyle = base; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 8; i++) {
    g.fillStyle = jit(r, base, 0.1); g.fillRect(i * 64 + 3, 0, 58, 512);
    g.fillStyle = "rgba(40,24,16,0.85)"; g.fillRect(i * 64, 0, 4, 512);
    for (let k = 0; k < 3; k++) { g.fillStyle = "rgba(60,36,20,0.35)"; g.fillRect(i * 64 + 10 + r() * 40, r() * 512, 3, 40 + r() * 80); }
  }
});
/** false-front facade of a 1931 western building, with its sign painted in */
const frontTex = (name: string, wall: string, trim: string) => ctex("front" + name, 1024, 1024, (g, r) => {
  g.fillStyle = wall; g.fillRect(0, 0, 1024, 1024);
  for (let i = 0; i < 16; i++) { g.fillStyle = jit(r, wall, 0.06); g.fillRect(i * 64 + 3, 0, 58, 1024); g.fillStyle = "rgba(40,24,16,0.7)"; g.fillRect(i * 64, 0, 3, 1024); }
  g.fillStyle = trim; g.fillRect(0, 0, 1024, 40); g.fillRect(0, 340, 1024, 20);
  g.fillStyle = "#f4ead2"; g.fillRect(110, 90, 804, 200); g.strokeStyle = "#2a1a14"; g.lineWidth = 12; g.strokeRect(110, 90, 804, 200);
  g.fillStyle = "#2a1a14"; g.font = "bold 150px Georgia, serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(name, 512, 196);
  for (const x of [120, 704]) { g.fillStyle = trim; g.fillRect(x - 12, 430, 224, 300); g.fillStyle = "#3a4a5c"; g.fillRect(x, 442, 200, 276); g.fillStyle = "#6f8aa6"; g.fillRect(x + 12, 454, 80, 120); }
  g.fillStyle = trim; g.fillRect(396, 520, 232, 504); g.fillStyle = "#4a2f20"; g.fillRect(410, 534, 204, 490);
  g.fillStyle = "#e0c070"; g.beginPath(); g.arc(590, 780, 10, 0, Math.PI * 2); g.fill();
});
const tileTex = () => ctex("tile", 512, 512, (g, r) => {
  for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) { g.fillStyle = (x + y) % 2 ? jit(r, "#d9e2e4", 0.04) : jit(r, "#a9c3c7", 0.05); g.fillRect(x * 128, y * 128, 128, 128); }
  g.strokeStyle = "rgba(60,70,80,0.35)"; g.lineWidth = 3; for (let i = 0; i <= 4; i++) { g.beginPath(); g.moveTo(i * 128, 0); g.lineTo(i * 128, 512); g.stroke(); g.beginPath(); g.moveTo(0, i * 128); g.lineTo(512, i * 128); g.stroke(); }
});
const mintTex = () => ctex("mint", 256, 256, (g, r) => {
  g.fillStyle = "#cfe5dc"; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 400; i++) { g.fillStyle = `rgba(80,110,100,${r() * 0.05})`; g.fillRect(r() * 256, r() * 256, 3, 3); }
});
const signTex = (key: string, text: string, bg: string, fg: string, w = 1024, h = 256, font = "bold 120px Arial Black, Arial") => ctex(key, w, h, (g) => {
  g.fillStyle = bg; g.fillRect(0, 0, w, h); g.strokeStyle = fg; g.lineWidth = 14; g.strokeRect(10, 10, w - 20, h - 20);
  g.fillStyle = fg; g.font = font; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(text, w / 2, h / 2 + 6);
});
/** a round clock face; hands at hh:mm */
export const clockFace = (key: string, hh: number, mm: number, rim = "#2a2a30", face = "#f7f2e4", roman = false) => ctex("clock" + key, 512, 512, (g) => {
  g.fillStyle = rim; g.beginPath(); g.arc(256, 256, 254, 0, Math.PI * 2); g.fill();
  g.fillStyle = face; g.beginPath(); g.arc(256, 256, 222, 0, Math.PI * 2); g.fill();
  g.fillStyle = "#1c1820"; g.textAlign = "center"; g.textBaseline = "middle";
  g.font = roman ? "bold 46px Georgia, serif" : "bold 50px Arial";
  const R = ["XII", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI"];
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
    g.fillText(roman ? R[i] : String(i || 12), 256 + Math.cos(a) * 178, 256 + Math.sin(a) * 178);
    g.fillRect(256 + Math.cos(a) * 208 - 4, 256 + Math.sin(a) * 208 - 4, 8, 8);
  }
  const hand = (a: number, len: number, w: number) => { g.save(); g.translate(256, 256); g.rotate(a); g.fillStyle = "#1c1820"; g.fillRect(-w / 2, -len, w, len + 20); g.restore(); };
  hand(((hh % 12) + mm / 60) / 12 * Math.PI * 2, 110, 18);
  hand((mm / 60) * Math.PI * 2, 165, 11);
  g.fillStyle = "#c0353a"; g.beginPath(); g.arc(256, 256, 16, 0, Math.PI * 2); g.fill();
});

/** a round wall clock: face disc + rim, as one group (z = toward the room) */
export const wallClock = (face: THREE.Texture, r: number, rimCol = "#3a2a20") => {
  const grp = new THREE.Group();
  const disc = new THREE.Mesh(new THREE.CircleGeometry(r, 48), unlit("clockFace", face));
  disc.position.z = 0.09;
  const rim = new THREE.Mesh(new THREE.CylinderGeometry(r * 1.08, r * 1.08, 0.16, 48), twoTone(new THREE.MeshLambertMaterial({ color: rimCol })));
  rim.rotation.x = Math.PI / 2;
  grp.add(rim, disc);
  grp.traverse((o) => { o.castShadow = true; o.receiveShadow = true; });
  return grp;
};

/** a ceiling that never casts a shadow (the sun still reaches the floor) */
const ceiling = (root: THREE.Object3D, x0: number, x1: number, z0: number, z1: number, h: number, mat: THREE.Material) => {
  const m = new THREE.Mesh(quad(V(x0, h, z0), V(x1, h, z0), V(x1, h, z1), V(x0, h, z1), (x1 - x0) / 2, (z1 - z0) / 2), mat);
  m.castShadow = false; m.receiveShadow = false; root.add(m);
};
const coffer = () => ctex("coffer", 512, 512, (g) => {
  g.fillStyle = "#3a1626"; g.fillRect(0, 0, 512, 512);
  g.strokeStyle = "#b8862e"; g.lineWidth = 14; g.strokeRect(40, 40, 432, 432);
  g.fillStyle = "#4a1e30"; g.fillRect(70, 70, 372, 372);
});

// ---------------- the sets ----------------
export type Sets = { saloonClock: THREE.Group; glowMats: THREE.MeshBasicMaterial[] };

export const buildSets = (root: THREE.Object3D): Sets => {
  const b = new Batch();
  const glowMats: THREE.MeshBasicMaterial[] = [];

  // ===== CASINO (x 0): room x -14..14, z -18..18, 5.2 m walls =====
  {
    const carpet = lam("carpet", () => ({ map: carpetTex() }));
    const wall = lam("damask", () => ({ map: damaskTex() }));
    const gold = twoTone(new THREE.MeshPhongMaterial({ color: "#d9a73a", specular: "#fff0b0", shininess: 50 }), 0.2);
    room(b, -14, 14, -18, 18, 5.2, carpet, wall, 3, 1.6);
    band(b, -14, 14, -18, 18, 0, 0.18, gold, 0.05);
    band(b, -14, 14, -18, 18, 1.05, 1.13, gold, 0.05);
    band(b, -14, 14, -18, 18, 4.9, 5.2, gold, 0.12);
    ceiling(root, -14, 14, -18, 18, 5.2, lam("coffer", () => ({ map: coffer(), side: THREE.DoubleSide })));
    // the empty spot where a clock never hangs, and a bricked-over window
    b.add(quad(V(-1.6, 1.6, -17.94), V(1.6, 1.6, -17.94), V(1.6, 4.8, -17.94), V(-1.6, 4.8, -17.94)), lam("ghost", () => ({ map: ghostTex() })));
    b.add(quad(V(-13.94, 1.3, 7.1), V(-13.94, 1.3, 4.1), V(-13.94, 5.05, 4.1), V(-13.94, 5.05, 7.1)), lam("bricked", () => ({ map: brickedTex() })));
    // slot machines: two back-to-back rows at z -4 / -5.1 and one row at z 6, each cabinet 0.9 x 1.75 x 0.75
    const cab = solid("cabinet", "#2b2733"), base = solid("cabBase", "#1c1a22");
    const slot = (x: number, z: number, face: number, k: number) => {
      const d = 0.75, zf = z + face * d / 2;
      b.add(boxGeo(V(x - 0.45, 0, z - d / 2), V(x + 0.45, 0.85, z + d / 2)), base);
      b.add(boxGeo(V(x - 0.45, 0.85, z - d / 2 + (face > 0 ? 0 : 0.12)), V(x + 0.45, 1.95, z + d / 2 - (face > 0 ? 0.12 : 0))), cab);
      const zf2 = zf - face * 0.115;
      const fm = lam("slotFace" + k, () => ({ map: slotFace(k) }));
      b.add(face > 0 ? quad(V(x - 0.42, 0.88, zf2 + 0.006), V(x + 0.42, 0.88, zf2 + 0.006), V(x + 0.42, 1.92, zf2 + 0.006), V(x - 0.42, 1.92, zf2 + 0.006))
        : quad(V(x + 0.42, 0.88, zf2 - 0.006), V(x - 0.42, 0.88, zf2 - 0.006), V(x - 0.42, 1.92, zf2 - 0.006), V(x + 0.42, 1.92, zf2 - 0.006)), fm);
      // lit top box (blooms a little)
      const top = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.36, 0.5), new THREE.MeshBasicMaterial({ map: slotTop(k), color: new THREE.Color(1.35, 1.35, 1.35), fog: false }));
      top.position.set(x, 2.15, z); if (face < 0) top.rotation.y = Math.PI;
      top.castShadow = true; root.add(top);
      // pull handle
      b.add(boxGeo(V(x + 0.45, 1.2, z - 0.04), V(x + 0.52, 1.7, z + 0.04)), gold);
    };
    for (let i = -8; i <= 8; i++) { if (i === 0) slot(0, -4, 1, 0); else slot(i * 1.15, -4, 1, (i + 20) % 4); }
    for (let i = -8; i <= 8; i++) slot(i * 1.15, -4.85, -1, (i + 21) % 4);
    // front rows face the lens side; an aisle down the middle keeps the hook's sight line clear
    for (let i = -8; i <= 8; i++) if (Math.abs(i * 1.15) > 1.5) slot(i * 1.15, 5.6, 1, (i + 22) % 4);
    for (let i = -8; i <= 8; i++) if (Math.abs(i * 1.15) > 1.5) slot(i * 1.15, 11.5, 1, (i + 23) % 4);
    // a card table and stools near the front
    const felt = lam("felt", () => ({ map: rep(feltTex(), 2, 2) }));
    const tab = new THREE.CylinderGeometry(1.25, 1.25, 0.12, 40); b.add(tab, felt, M4(-6.5, 0.86, 9));
    b.add(new THREE.CylinderGeometry(0.25, 0.4, 0.8, 16), cab, M4(-6.5, 0.4, 9));
    // chandeliers: gold rods + glowing bulbs (the only real lights in a windowless room)
    const bulb = glow(3.2, 2.5, 1.4); glowMats.push(bulb);
    for (const [x, z] of [[-7, -10], [7, -10], [-7, 1], [7, 1], [0, 13], [0, -10]] as const) {
      b.add(boxGeo(V(x - 0.03, 4.1, z - 0.03), V(x + 0.03, 5.2, z + 0.03)), gold);
      b.add(new THREE.TorusGeometry(0.7, 0.05, 8, 32).rotateX(Math.PI / 2), gold, M4(x, 4.05, z));
      for (let k = 0; k < 8; k++) {
        const a = (k / 8) * Math.PI * 2, m = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 8), bulb);
        m.position.set(x + Math.cos(a) * 0.7, 4.17, z + Math.sin(a) * 0.7); m.layers.set(NOINK); root.add(m);
      }
    }
  }

  // ===== TOWN (x 400): main street along z, buildings at x 393 / 407 =====
  {
    const ox = 400, sand = lam("sand", () => ({ map: sandTex() }));
    b.add(quad(V(ox - 300, 0, 320), V(ox + 300, 0, 320), V(ox + 300, 0, -320), V(ox - 300, 0, -320), 45, 48), sand); // stops well short of the casino (x 0) and saloon (x 800)
    const walk = lam("walk", () => ({ map: rep(planksHD(), 1, 1) }));
    const fronts: [string, string, string][] = [["CASINO", "#c9a26b", "#7a2f2a"], ["SALOON", "#b98a5a", "#2f4a6a"], ["HOTEL", "#d8c3a0", "#5a3a2a"],
      ["BANK", "#cdb89a", "#3d5a3a"], ["GENERAL STORE", "#b0805a", "#6a2a2a"], ["BARBER", "#d6b48a", "#2a4a5a"], ["JAIL", "#a8825e", "#4a4a4a"], ["POST", "#c4a27a", "#5a3a5a"]];
    let n = 0;
    for (const side of [-1, 1]) for (let i = 0; i < 6; i++) {
      const z = 26 - i * 11.5 + (side > 0 ? 4 : 0), w = 9.5, d = 9, h = 5.2 + ((i * 7 + (side > 0 ? 3 : 0)) % 3) * 0.9, hf = h + 2.2;
      const [name, wallC, trim] = fronts[(n++) % fronts.length];
      const x0 = side < 0 ? ox - 7 - d : ox + 7, x1 = x0 + d, xf = side < 0 ? x1 : x0;
      const body = lam("body" + name, () => ({ map: boardsTex("boards" + wallC, wallC) }));
      b.add(boxGeo(V(x0, 0, z - w / 2), V(x1, h, z + w / 2), 2.5), body);
      // false front facing the street
      const fm = lam("front" + name, () => ({ map: frontTex(name, wallC, trim) }));
      const f0 = side < 0 ? xf + 0.02 : xf - 0.02;
      b.add(side < 0 ? quad(V(f0, 0, z + w / 2), V(f0, 0, z - w / 2), V(f0, hf, z - w / 2), V(f0, hf, z + w / 2))
        : quad(V(f0, 0, z - w / 2), V(f0, 0, z + w / 2), V(f0, hf, z + w / 2), V(f0, hf, z - w / 2)), fm);
      b.add(boxGeo(V(Math.min(f0, xf) - 0.1, h, z - w / 2), V(Math.max(f0, xf) + 0.1, hf, z + w / 2)), body);
      // porch roof on posts + boardwalk
      const px = side < 0 ? xf + 2.2 : xf - 2.2;
      b.add(boxGeo(V(Math.min(xf, px), 0, z - w / 2), V(Math.max(xf, px), 0.25, z + w / 2), 1), walk);
      b.add(boxGeo(V(Math.min(xf, px), 3.0, z - w / 2), V(Math.max(xf, px), 3.12, z + w / 2), 2), body);
      for (const zz of [z - w / 2 + 0.2, z, z + w / 2 - 0.2]) b.add(boxGeo(V(px - 0.08, 0.25, zz - 0.08), V(px + 0.08, 3.0, zz + 0.08)), solid("post", "#6a4a32"));
    }
    // telegraph poles, hitching rails, barrels, distant mesas
    const pole = solid("pole", "#5e4630");
    for (let i = 0; i < 6; i++) { const z = 40 - i * 16; b.add(boxGeo(V(ox + 5.6, 0, z - 0.12), V(ox + 5.84, 7.5, z + 0.12)), pole); b.add(boxGeo(V(ox + 4.8, 6.9, z - 0.06), V(ox + 6.6, 7.05, z + 0.06)), pole); }
    for (const [x, z] of [[-4.2, 8], [4.3, -6], [-4.3, -20], [4.1, 18]] as const) {
      b.add(boxGeo(V(ox + x - 0.06, 0, z - 1.4), V(ox + x + 0.06, 0.95, z - 1.28)), pole); b.add(boxGeo(V(ox + x - 0.06, 0, z + 1.28), V(ox + x + 0.06, 0.95, z + 1.4)), pole);
      b.add(boxGeo(V(ox + x - 0.06, 0.9, z - 1.4), V(ox + x + 0.06, 1.0, z + 1.4)), pole);
    }
    const barrel = solid("barrel", "#8a5a34");
    for (const [x, z] of [[-6.1, 12], [-6.0, 13], [6.2, -2], [6.0, 22]] as const) b.add(new THREE.CylinderGeometry(0.36, 0.33, 0.95, 16), barrel, M4(ox + x, 0.72, z));
    const mesaC = [solid("mesa", "#c46a40"), solid("mesa2", "#b45a3a"), solid("mesa3", "#d08050")];
    for (const [x, z, r, h, k] of [[-140, -200, 70, 38, 0], [70, -240, 90, 52, 1], [190, -170, 50, 30, 2], [-30, -300, 110, 44, 2], [-70, 220, 80, 34, 1], [-230, 30, 60, 46, 0], [230, 60, 70, 36, 1]] as const) {
      const g = new THREE.CylinderGeometry(r * 0.72, r, h, 7, 1); g.rotateY(x * 0.37);
      b.add(g, mesaC[k], M4(ox + x, h / 2, z));
    }
    // cacti
    const cact = solid("cactus", "#5c9a4a");
    for (const [x, z] of [[-14, 34], [15, -30], [-22, -40], [20, 40]] as const) {
      b.add(boxGeo(V(ox + x - 0.25, 0, z - 0.25), V(ox + x + 0.25, 3.2, z + 0.25)), cact);
      b.add(boxGeo(V(ox + x + 0.25, 1.4, z - 0.18), V(ox + x + 0.9, 1.7, z + 0.18)), cact); b.add(boxGeo(V(ox + x + 0.6, 1.7, z - 0.18), V(ox + x + 0.9, 2.6, z + 0.18)), cact);
    }
  }

  // ===== SALOON (x 800): room x -9..9, z -10..10, 4.6 m walls, the big clock on the back wall =====
  let saloonClock: THREE.Group;
  {
    const ox = 800, floor = lam("saloonFloor", () => ({ map: rep(planksHD(), 1, 1) }));
    const wall = lam("saloonWall", () => ({ map: boardsTex("saloonBoards", "#9a6a44") }));
    const dark = solid("saloonTrim", "#4a2e1e"), felt = lam("felt", () => ({ map: rep(feltTex(), 2, 2) }));
    room(b, ox - 9, ox + 9, -10, 10, 4.6, floor, wall, 2.5, 2.4);
    band(b, ox - 9, ox + 9, -10, 10, 0, 0.22, dark, 0.06);
    band(b, ox - 9, ox + 9, -10, 10, 1.1, 1.2, dark, 0.06);
    band(b, ox - 9, ox + 9, -10, 10, 4.3, 4.6, dark, 0.14);
    ceiling(root, ox - 9, ox + 9, -10, 10, 4.6, lam("saloonCeil", () => ({ map: boardsTex("ceilBoards", "#5a3a26"), side: THREE.DoubleSide })));
    // bar counter along the right wall with bottles
    b.add(boxGeo(V(ox + 6.6, 0, -8), V(ox + 7.6, 1.1, 4)), dark);
    b.add(boxGeo(V(ox + 6.5, 1.1, -8.1), V(ox + 7.7, 1.18, 4.1)), solid("barTop", "#6a3a22"));
    b.add(boxGeo(V(ox + 8.6, 1.6, -8), V(ox + 9, 1.68, 4)), dark); b.add(boxGeo(V(ox + 8.6, 2.3, -8), V(ox + 9, 2.38, 4)), dark);
    const bottle = [solid("btlG", "#2f7a4a"), solid("btlB", "#7a4a2a"), solid("btlC", "#c9d6d0")];
    for (let i = 0; i < 26; i++) b.add(new THREE.CylinderGeometry(0.06, 0.07, 0.32, 8), bottle[i % 3], M4(ox + 8.8, (i % 2 ? 1.84 : 2.54), -7.6 + (i >> 1) * 0.9));
    // felt tables (the high rollers' table at x -3.6, z -3.6) + one in front
    for (const [x, z, w, d] of [[-3.6, -4.0, 2.6, 1.5], [3.4, -4.4, 2.0, 1.3], [-0.2, 2.6, 2.2, 1.3]] as const) {
      b.add(boxGeo(V(ox + x - w / 2, 0.82, z - d / 2), V(ox + x + w / 2, 0.9, z + d / 2)), felt);
      b.add(boxGeo(V(ox + x - w / 2 - 0.06, 0.74, z - d / 2 - 0.06), V(ox + x + w / 2 + 0.06, 0.82, z + d / 2 + 0.06)), dark);
      for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) b.add(boxGeo(V(ox + x + sx * (w / 2 - 0.15) - 0.05, 0, z + sz * (d / 2 - 0.15) - 0.05), V(ox + x + sx * (w / 2 - 0.15) + 0.05, 0.74, z + sz * (d / 2 - 0.15) + 0.05)), dark);
    }
    // chips + cards on the high rollers' table
    const chipC = [solid("chipR", "#c0353a"), solid("chipB", "#2f5fb3"), solid("chipW", "#f2ede0")];
    for (let i = 0; i < 9; i++) b.add(new THREE.CylinderGeometry(0.05, 0.05, 0.03 * (2 + (i % 4)), 12), chipC[i % 3], M4(ox - 4.6 + (i % 5) * 0.45, 0.92, -4.2 + (i > 4 ? 0.35 : 0)));
    // oil lamps on the walls (glow)
    const lamp = glow(3.4, 2.2, 1.0); glowMats.push(lamp);
    for (const [x, z] of [[-8.9, -6], [-8.9, 2], [8.9, 6], [-5, -9.9], [5, -9.9]] as const) {
      const m = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 8), lamp); m.position.set(ox + x + (x < -8 ? 0.25 : x > 8 ? -0.25 : 0), 2.6, z + (z < -9 ? 0.25 : 0)); m.layers.set(NOINK); root.add(m);
    }
    // a framed "CASINO 1931" sign over the clock
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 0.7), unlit("saloonSign", signTex("saloonSign", "CASINO  EST. 1931", "#2a1a14", "#f0d79a", 1024, 224, "bold 96px Georgia, serif")));
    sign.position.set(ox, 4.25 - 0.1, -9.9); sign.layers.set(NOINK); root.add(sign);
    saloonClock = wallClock(clockFace("saloon3", 3, 0, "#3a2414", "#f7efd8", true), CLOCK_R, "#5a3a22");
    saloonClock.position.set(...CLOCK_SALOON);
    root.add(saloonClock);
  }

  // ===== HOSPITAL (x 1200): waiting room x -7..7, z -8..8, 3.4 m walls =====
  {
    const ox = 1200, floor = lam("tile", () => ({ map: tileTex() })), wall = lam("mint", () => ({ map: mintTex() }));
    room(b, ox - 7, ox + 7, -8, 8, 3.4, floor, wall, 1.6, 2);
    band(b, ox - 7, ox + 7, -8, 8, 0, 0.12, solid("hospSkirt", "#7d9a94"), 0.04);
    band(b, ox - 7, ox + 7, -8, 8, 0.95, 1.02, solid("hospRail", "#9fb8c0"), 0.06);
    ceiling(root, ox - 7, ox + 7, -8, 8, 3.4, lam("hospCeil", () => ({ color: "#e9eef0", side: THREE.DoubleSide })));
    // chair rows: blue plastic seats on a steel beam
    const seat = solid("seat", "#3f78b8"), steel = solid("steel", "#8a929c");
    for (const z of [-4.6, -1.6]) {
      b.add(boxGeo(V(ox - 3.6, 0.22, z - 0.06), V(ox + 3.6, 0.28, z + 0.06)), steel);
      for (let i = -3; i <= 3; i++) {
        const x = ox + i * 1.3;
        b.add(boxGeo(V(x - 0.5, 0.28, z - 0.25), V(x + 0.5, 0.34, z + 0.25)), seat);
        b.add(boxGeo(V(x - 0.5, 0.34, z - 0.32), V(x + 0.5, 0.95, z - 0.25)), seat);
      }
      for (const s of [-1, 1]) b.add(boxGeo(V(ox + s * 3.4 - 0.05, 0, z - 0.05), V(ox + s * 3.4 + 0.05, 0.22, z + 0.05)), steel);
    }
    // reception desk + plant + notice board
    b.add(boxGeo(V(ox + 3.8, 0, -7.9), V(ox + 6.9, 1.1, -6.3)), solid("desk", "#e6ebee"));
    b.add(boxGeo(V(ox + 3.7, 1.1, -8.0), V(ox + 7.0, 1.16, -6.2)), solid("deskTop", "#7d9a94"));
    b.add(new THREE.CylinderGeometry(0.28, 0.22, 0.5, 14), solid("pot", "#b5653f"), M4(ox - 6.3, 0.25, -7.3));
    b.add(new THREE.SphereGeometry(0.55, 12, 10), solid("leaf", "#5c9a4a"), M4(ox - 6.3, 0.95, -7.3));
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 0.5), unlit("waitSign", signTex("waitSign", "WAITING ROOM", "#2f5f8a", "#ffffff")));
    sign.position.set(ox - 2.6, 2.75, -7.95); sign.layers.set(NOINK); root.add(sign);
    const clock = wallClock(clockFace("hosp", 4, 47, "#2a2a30", "#ffffff"), 0.42, "#2a2a30");
    clock.position.set(ox + 1.2, 2.55, -7.86); root.add(clock);
    const light = glow(2.2, 2.4, 2.6); glowMats.push(light);
    for (const z of [-5, 1]) { const m = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.06, 0.4), light); m.position.set(ox, 3.38, z); m.layers.set(NOINK); root.add(m); }
  }

  b.build(root);
  return { saloonClock: saloonClock!, glowMats };
};

export type { V3 };
