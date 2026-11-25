/**
 * Istana LUCIFER (three.js). Tujuh ruang divisi melingkari Second Brain (vault Obsidian) di tengah, LUCIFER di tahtanya.
 * Aset: Kenney (perabot, tekstur, langit) & Quaternius (pohon mati, hewan penjaga), lihat public/aset/LISENSI.txt.
 * Label & gelembung adalah HTML (App); kelas ini hanya memindahkannya tiap frame.
 */
import {
  AdditiveBlending,
  AmbientLight,
  AnimationMixer,
  Box3,
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  CapsuleGeometry,
  CircleGeometry,
  Clock,
  Color,
  ConeGeometry,
  CylinderGeometry,
  DirectionalLight,
  DoubleSide,
  EquirectangularReflectionMapping,
  FogExp2,
  Group,
  HemisphereLight,
  IcosahedronGeometry,
  InstancedMesh,
  LineBasicMaterial,
  LineSegments,
  Material,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  MeshLambertMaterial,
  NearestFilter,
  Object3D,
  OrthographicCamera,
  PlaneGeometry,
  PointLight,
  Points,
  PointsMaterial,
  Raycaster,
  RepeatWrapping,
  SRGBColorSpace,
  Scene,
  Shape,
  ShapeGeometry,
  SphereGeometry,
  Texture,
  TextureLoader,
  TorusGeometry,
  Vector2,
  Vector3,
  WebGLRenderer,
} from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import type { Catatan, StatusAgen } from './data';
import { AGEN, DIVISI, LUCIFER } from './sora';

const R_RUANG = 10.6;
const UK = 6.2; // sisi ruangan
const R_DAIS = 3.4;
const OTAK_Y = 4.4;
const ASET = '/aset';

const WARNA_FOLDER: Record<string, string> = {
  productions: '#ff5a3c',
  channels: '#ffcc4d',
  agents: '#c77dff',
  tools: '#4cc9f0',
  assets: '#80ed99',
  '(akar)': '#ffffff',
};

export interface Opsi {
  onKlikOtak?: () => void;
}

interface Figur {
  key: string;
  root: Group;
  badan: Group;
  kepala: Mesh;
  lenganKi: Group;
  lenganKa: Group;
  kakiKi: Group;
  kakiKa: Group;
  layar: Mesh | null;
  duduk: Vector3;
  hadap: number;
  jalur: Vector3[];
  fase: number;
  label: Vector3;
  skala: number;
}

const tekstur = new TextureLoader();
const muatTekstur = (f: string, ulang = 1) => {
  const t = tekstur.load(`${ASET}/tekstur/${f}`);
  t.magFilter = NearestFilter;
  t.wrapS = t.wrapT = RepeatWrapping;
  t.repeat.set(ulang, ulang);
  t.colorSpace = SRGBColorSpace;
  return t;
};

function kanvas(w: number, h: number, gambar: (g: CanvasRenderingContext2D) => void) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  gambar(c.getContext('2d')!);
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  return t;
}

/** Jalur berpolilinea: titik pada jarak k (0..1). */
function diJalur(titik: Vector3[], k: number, out: Vector3) {
  let total = 0;
  for (let i = 1; i < titik.length; i++) total += titik[i]!.distanceTo(titik[i - 1]!);
  let d = Math.max(0, Math.min(1, k)) * total;
  for (let i = 1; i < titik.length; i++) {
    const s = titik[i]!.distanceTo(titik[i - 1]!);
    if (d <= s || i === titik.length - 1) return out.copy(titik[i - 1]!).lerp(titik[i]!, s ? Math.min(1, d / s) : 1);
    d -= s;
  }
  return out.copy(titik[0]!);
}

/** Jadwal santai (hanya saat siaga): sesekali berjalan ke Second Brain dan kembali. */
export function santai(i: number, t: number) {
  const siklus = 46;
  const x = (((t + i * 9.7) % siklus) + siklus) % siklus;
  const ikut = Math.floor((t + i * 9.7) / siklus) % 3 === i % 3;
  if (!ikut || x > 22) return { k: 0, jalan: false };
  const e = (v: number) => v * v * (3 - 2 * v);
  if (x < 5) return { k: e(x / 5), jalan: true };
  if (x < 17) return { k: 1, jalan: false };
  return { k: 1 - e((x - 17) / 5), jalan: true };
}

export class Istana {
  private renderer: WebGLRenderer;
  private scene = new Scene();
  private kamera = new OrthographicCamera(-10, 10, 6, -6, 0.1, 200);
  private target = new Vector3(0, 1.2, 0);
  private az = Math.PI / 4;
  private zoom = 1;
  private sentuhTerakhir = -1e9;
  private figur: Figur[] = [];
  private label = new Map<string, HTMLElement>();
  private status: Record<string, StatusAgen> = {};
  private api: { fn: (t: number, dt: number) => void }[] = [];
  private mixers: AnimationMixer[] = [];
  private otak = new Group();
  private otakInti!: Mesh;
  private kunciVault = '';
  private plakat = new Map<string, { mesh: Mesh; teks: string }>();
  private raf = 0;
  private hidup = true;
  private jam = new Clock();
  private ro: ResizeObserver;
  private sekali: { dispose(): void }[] = [];

  constructor(private host: HTMLElement, private opsi: Opsi = {}) {
    this.renderer = new WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.outputColorSpace = SRGBColorSpace;
    host.appendChild(this.renderer.domElement);
    this.renderer.domElement.setAttribute('aria-hidden', 'true');

    const langit = tekstur.load(`${ASET}/tekstur/langit-neraka.jpg`);
    langit.mapping = EquirectangularReflectionMapping;
    langit.colorSpace = SRGBColorSpace;
    this.scene.background = langit;
    this.scene.fog = new FogExp2('#1a0508', 0.012);

    this.scene.add(new HemisphereLight('#7a2a3a', '#0a0306', 1.3));
    const bulan = new DirectionalLight('#ffb3a1', 1.1);
    bulan.position.set(-8, 18, 6);
    this.scene.add(bulan, new AmbientLight('#ffffff', 0.18));

    this.bangunTanah();
    this.bangunDais();
    DIVISI.forEach((d, i) => this.bangunRuang(d.key, i));
    this.bangunLucifer();
    this.bangunBara();
    this.muatPohon();
    this.scene.add(this.otak);

    this.ro = new ResizeObserver(() => this.pas());
    this.ro.observe(host);
    this.pas();
    this.pasangKontrol();
    const lingkar = () => {
      this.raf = 0;
      if (!this.hidup) return;
      if (!document.hidden) this.gambar();
      this.raf = requestAnimationFrame(lingkar);
    };
    this.raf = requestAnimationFrame(lingkar);
  }

  /* ---------------- API untuk App ---------------- */

  pasangLabel(key: string, el: HTMLElement | null) {
    if (el) this.label.set(key, el);
    else this.label.delete(key);
  }
  setStatus(s: Record<string, StatusAgen>) {
    this.status = s;
  }
  setEmail(divisi: string, email: string) {
    const p = this.plakat.get(divisi);
    if (!p || p.teks === email) return;
    p.teks = email;
    const m = p.mesh.material as MeshLambertMaterial;
    m.map?.dispose();
    m.map = this.teksPlakat(divisi, email);
    m.emissiveMap = m.map;
    m.needsUpdate = true;
  }
  setVault(catatan: Catatan[]) {
    const pilih = [...catatan].sort((a, b) => b.diubah - a.diubah).slice(0, 140);
    const kunci = pilih.map((c) => `${c.p}:${c.diubah}`).join('|');
    if (kunci === this.kunciVault) return;
    this.kunciVault = kunci;
    this.bangunOtak(pilih);
  }
  dispose() {
    this.hidup = false;
    cancelAnimationFrame(this.raf);
    this.ro.disconnect();
    this.scene.traverse((o) => {
      const m = o as Mesh;
      m.geometry?.dispose?.();
      const mats = Array.isArray(m.material) ? m.material : m.material ? [m.material] : [];
      for (const x of mats as Material[]) x.dispose();
    });
    for (const s of this.sekali) s.dispose();
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }

  /* ---------------- dunia ---------------- */

  private bahan(warna: string, o: { emissive?: string; kuat?: number; map?: Texture; sisi?: boolean } = {}) {
    const m = new MeshLambertMaterial({ color: warna, map: o.map ?? null, side: o.sisi ? DoubleSide : undefined });
    if (o.emissive) {
      m.emissive.set(o.emissive);
      m.emissiveIntensity = o.kuat ?? 1;
    }
    return m;
  }

  private bangunTanah() {
    const tanah = new Mesh(new CylinderGeometry(22, 22.5, 0.6, 64), this.bahan('#6b3a30', { map: muatTekstur('floor_ground_dirt.png', 22) }));
    tanah.position.y = -0.45;
    this.scene.add(tanah);
    // Lingkar sihir di batas istana.
    const cincin = new Mesh(new TorusGeometry(16.5, 0.07, 6, 120), new MeshBasicMaterial({ color: '#ff2a1a' }));
    cincin.rotation.x = Math.PI / 2;
    cincin.position.y = -0.1;
    this.scene.add(cincin);
    const retak = kanvas(1024, 1024, (g) => {
      g.strokeStyle = 'rgba(255,70,20,0.9)';
      g.lineCap = 'round';
      const acak = (() => {
        let s = 7;
        return () => (s = (s * 16807) % 2147483647) / 2147483647;
      })();
      for (let i = 0; i < 26; i++) {
        let x = acak() * 1024;
        let y = acak() * 1024;
        g.lineWidth = 1 + acak() * 3;
        g.beginPath();
        g.moveTo(x, y);
        for (let j = 0; j < 7; j++) {
          x += (acak() - 0.5) * 120;
          y += (acak() - 0.5) * 120;
          g.lineTo(x, y);
        }
        g.stroke();
      }
    });
    const lava = new Mesh(new CircleGeometry(21.5, 64), new MeshBasicMaterial({ map: retak, transparent: true, blending: AdditiveBlending, depthWrite: false }));
    lava.rotation.x = -Math.PI / 2;
    lava.position.y = -0.14;
    this.scene.add(lava);
  }

  private bangunDais() {
    const batu = muatTekstur('floor_stone.png', 4);
    const dais = new Mesh(new CylinderGeometry(R_DAIS, R_DAIS + 0.25, 0.4, 5 * 12), this.bahan('#4a3a44', { map: batu }));
    dais.position.y = 0.05;
    this.scene.add(dais);
    const pent = kanvas(1024, 1024, (g) => {
      g.fillStyle = '#0d0508';
      g.beginPath();
      g.arc(512, 512, 510, 0, Math.PI * 2);
      g.fill();
      g.shadowColor = '#ff2a1a';
      g.shadowBlur = 24;
      g.strokeStyle = '#ff3b2f';
      g.lineWidth = 10;
      g.beginPath();
      g.arc(512, 512, 470, 0, Math.PI * 2);
      g.stroke();
      g.lineWidth = 4;
      g.beginPath();
      g.arc(512, 512, 420, 0, Math.PI * 2);
      g.stroke();
      g.lineWidth = 9;
      g.beginPath();
      const n = DIVISI.length;
      const lompat = Math.floor((n - 1) / 2);
      for (let i = 0; i <= n; i++) {
        const a = -Math.PI / 2 + ((i * lompat) % n) * ((Math.PI * 2) / n);
        const x = 512 + Math.cos(a) * 420;
        const y = 512 + Math.sin(a) * 420;
        if (i) g.lineTo(x, y);
        else g.moveTo(x, y);
      }
      g.stroke();
      g.shadowBlur = 0;
      g.fillStyle = '#ff7a5c';
      g.font = 'bold 34px Georgia';
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      const kata = 'SECOND BRAIN · VAULT OBSIDIAN · SETIAP DETIK HARUS LAYAK DITONTON · ';
      for (let i = 0; i < kata.length; i++) {
        const a = (i / kata.length) * Math.PI * 2 - Math.PI / 2;
        g.save();
        g.translate(512 + Math.cos(a) * 445, 512 + Math.sin(a) * 445);
        g.rotate(a + Math.PI / 2);
        g.fillText(kata[i]!, 0, 0);
        g.restore();
      }
    });
    const atas = new Mesh(new CircleGeometry(R_DAIS - 0.1, 64), new MeshLambertMaterial({ map: pent, emissive: '#ffffff', emissiveMap: pent, emissiveIntensity: 0.9 }));
    atas.rotation.x = -Math.PI / 2;
    atas.position.y = 0.26;
    this.scene.add(atas);
    this.api.push({ fn: (t) => ((atas.material as MeshLambertMaterial).emissiveIntensity = 0.75 + 0.25 * Math.sin(t * 1.3)) });
    // Satu pilar obelisk per divisi.
    DIVISI.forEach((d, i) => {
      const a = this.sudut(i);
      const ob = new Mesh(new ConeGeometry(0.22, 1.6, 4), this.bahan('#1a1016', { emissive: d.warna, kuat: 0.35 }));
      ob.position.set(Math.cos(a) * (R_DAIS - 0.35), 1.05, Math.sin(a) * (R_DAIS - 0.35));
      this.scene.add(ob);
      // Jalan batu dari dais ke ruangan.
      const pj = R_RUANG - UK / 2 - R_DAIS + 0.3;
      const jalan = new Mesh(new BoxGeometry(1.6, 0.16, pj), this.bahan('#3d3036', { map: muatTekstur('floor_stone_pattern_small.png', 2) }));
      const r = R_DAIS + pj / 2 - 0.15;
      jalan.position.set(Math.cos(a) * r, -0.05, Math.sin(a) * r);
      jalan.rotation.y = Math.atan2(Math.cos(a), Math.sin(a));
      this.scene.add(jalan);
    });
    // Tombol klik Second Brain (tak terlihat).
    const hit = new Mesh(new SphereGeometry(2.1, 12, 10), new MeshBasicMaterial({ visible: false }));
    hit.position.y = OTAK_Y;
    hit.name = 'otak-hit';
    this.scene.add(hit);
    const cahaya = new PointLight('#ff4d6d', 18, 12, 1.6);
    cahaya.position.y = OTAK_Y;
    this.scene.add(cahaya);
    this.api.push({ fn: (t) => (cahaya.intensity = 16 + 4 * Math.sin(t * 2.1)) });
  }

  private sudut(i: number) {
    return (-3 * Math.PI) / 4 + (i * Math.PI * 2) / DIVISI.length;
  }

  /** Dari koordinat lokal ruang i (x menyamping, z keluar menjauhi pusat) ke dunia. */
  private keDunia(i: number, x: number, z: number, out = new Vector3()) {
    const a = this.sudut(i);
    const r = new Vector2(Math.cos(a), Math.sin(a));
    const tg = new Vector2(-Math.sin(a), Math.cos(a));
    const c = r.clone().multiplyScalar(R_RUANG);
    return out.set(c.x + tg.x * x + r.x * z, 0, c.y + tg.y * x + r.y * z);
  }

  private teksPlakat(divisi: string, email: string) {
    const d = DIVISI.find((x) => x.key === divisi)!;
    return kanvas(512, 192, (g) => {
      g.fillStyle = '#120a0e';
      g.fillRect(0, 0, 512, 192);
      g.strokeStyle = d.warna;
      g.lineWidth = 8;
      g.strokeRect(8, 8, 496, 176);
      g.fillStyle = d.warna;
      g.font = 'bold 30px Georgia';
      g.textAlign = 'center';
      g.fillText('✉ EMAIL DIVISI', 256, 62);
      g.fillStyle = email ? '#f5e6d3' : '#8a7c74';
      g.font = `${email.length > 26 ? 26 : 32}px Georgia`;
      g.fillText(email || 'belum diisi Tuan', 256, 130, 470);
    });
  }

  private bangunRuang(key: string, i: number) {
    const d = DIVISI[i]!;
    const a = this.sudut(i);
    const g = new Group();
    g.position.set(Math.cos(a) * R_RUANG, 0, Math.sin(a) * R_RUANG);
    g.rotation.y = Math.atan2(Math.cos(a), Math.sin(a));
    this.scene.add(g);
    const warna = new Color(d.warna);
    const lantaiW = `#${new Color('#5a4a52').lerp(warna, 0.18).getHexString()}`;
    const lantai = new Mesh(new BoxGeometry(UK, 0.3, UK), this.bahan(lantaiW, { map: muatTekstur('floor_stone_pattern.png', 6) }));
    lantai.position.y = -0.1;
    g.add(lantai);
    const dinding = this.bahan('#5c4c56', { map: muatTekstur('wall_brick_stone_center.png', 1) });
    (dinding.map as Texture).repeat.set(6, 1.3);
    const sisi = this.bahan('#4c3e48', { map: muatTekstur('wall_brick_stone_center.png', 1) });
    (sisi.map as Texture).repeat.set(6, 0.7);
    const belakang = new Mesh(new BoxGeometry(UK, 2.8, 0.25), dinding);
    belakang.position.set(0, 1.4, UK / 2);
    g.add(belakang);
    for (const s of [-1, 1]) {
      const w = new Mesh(new BoxGeometry(0.25, 1.3, UK), sisi);
      w.position.set((s * UK) / 2, 0.65, 0);
      g.add(w);
      // Tiang gerbang di sisi terbuka.
      const tiang = new Mesh(new BoxGeometry(0.4, 2.4, 0.4), this.bahan('#2a1f26', { emissive: d.warna, kuat: 0.12 }));
      tiang.position.set(s * 1.1, 1.2, -UK / 2);
      g.add(tiang);
      const api = new Mesh(new ConeGeometry(0.16, 0.45, 8), new MeshBasicMaterial({ color: d.warna }));
      api.position.set(s * 1.1, 2.62, -UK / 2);
      g.add(api);
      this.api.push({ fn: (t) => api.scale.set(1, 0.8 + 0.3 * Math.abs(Math.sin(t * 7 + i + s)), 1) });
    }
    // Spanduk dosa di dinding belakang.
    const spanduk = kanvas(512, 768, (c) => {
      const gr = c.createLinearGradient(0, 0, 0, 768);
      gr.addColorStop(0, '#1a0b10');
      gr.addColorStop(1, '#3a0d14');
      c.fillStyle = gr;
      c.fillRect(0, 0, 512, 768);
      c.strokeStyle = d.warna;
      c.lineWidth = 14;
      c.strokeRect(20, 20, 472, 728);
      c.fillStyle = d.warna;
      c.textAlign = 'center';
      c.font = '220px Georgia';
      c.shadowColor = d.warna;
      c.shadowBlur = 30;
      c.fillText(d.lambang, 256, 330);
      c.shadowBlur = 0;
      c.font = 'bold 74px Georgia';
      c.fillText(d.dosa.toUpperCase(), 256, 470);
      c.fillStyle = '#e9d8c8';
      c.font = '40px Georgia';
      c.fillText(d.nama.replace('Divisi ', ''), 256, 560, 440);
      c.font = 'italic 28px Georgia';
      c.fillStyle = '#b8a090';
      c.fillText('Divisi', 256, 610);
    });
    const kain = new Mesh(new PlaneGeometry(1.5, 2.25), new MeshLambertMaterial({ map: spanduk, emissive: '#ffffff', emissiveMap: spanduk, emissiveIntensity: 0.35, side: DoubleSide }));
    kain.position.set(0, 1.55, UK / 2 - 0.14);
    kain.rotation.y = Math.PI;
    g.add(kain);
    // Lingkar sigil di lantai.
    const sigil = kanvas(512, 512, (c) => {
      c.strokeStyle = d.warna;
      c.shadowColor = d.warna;
      c.shadowBlur = 16;
      c.lineWidth = 8;
      c.beginPath();
      c.arc(256, 256, 236, 0, Math.PI * 2);
      c.stroke();
      c.lineWidth = 3;
      c.beginPath();
      c.arc(256, 256, 200, 0, Math.PI * 2);
      c.stroke();
      c.font = '210px Georgia';
      c.fillStyle = d.warna;
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.globalAlpha = 0.55;
      c.fillText(d.lambang, 256, 270);
    });
    const lingkar = new Mesh(new CircleGeometry(1.5, 48), new MeshBasicMaterial({ map: sigil, transparent: true, blending: AdditiveBlending, depthWrite: false }));
    lingkar.rotation.x = -Math.PI / 2;
    lingkar.position.set(0, 0.07, -1.6);
    g.add(lingkar);
    // Anglo api di sudut belakang + cahaya ruangan.
    for (const s of [-1, 1]) {
      const kaki = new Mesh(new CylinderGeometry(0.08, 0.14, 0.9, 8), this.bahan('#1d1418'));
      kaki.position.set(s * 2.45, 0.45, UK / 2 - 0.6);
      const mangkuk = new Mesh(new CylinderGeometry(0.36, 0.18, 0.28, 12), this.bahan('#2a1d22', { emissive: '#ff5a1f', kuat: 0.25 }));
      mangkuk.position.set(s * 2.45, 1.0, UK / 2 - 0.6);
      const nyala = new Mesh(new ConeGeometry(0.28, 0.8, 10), new MeshBasicMaterial({ color: '#ff7a2a', transparent: true, opacity: 0.9 }));
      nyala.position.set(s * 2.45, 1.48, UK / 2 - 0.6);
      const inti = new Mesh(new ConeGeometry(0.15, 0.5, 8), new MeshBasicMaterial({ color: d.warna }));
      inti.position.set(s * 2.45, 1.38, UK / 2 - 0.6);
      g.add(kaki, mangkuk, nyala, inti);
      this.api.push({
        fn: (t) => {
          const f = 0.85 + 0.25 * Math.sin(t * 11 + s * 3 + i) + 0.1 * Math.sin(t * 23 + i);
          nyala.scale.set(1, f, 1);
          inti.scale.set(1, 1.1 - (f - 1), 1);
          nyala.rotation.y = t * 2;
        },
      });
    }
    const lampu = new PointLight(d.warna, 14, 9, 1.4);
    lampu.position.set(0, 2.4, 0.6);
    g.add(lampu);
    const obor = new PointLight('#ff7a2a', 7, 6, 1.6);
    obor.position.set(0, 1.8, UK / 2 - 0.8);
    g.add(obor);
    this.api.push({ fn: (t) => (obor.intensity = 6 + 1.6 * Math.sin(t * 13 + i) + Math.sin(t * 29 + i * 2)) });
    // Plakat email di depan pintu.
    const pk = new Mesh(new BoxGeometry(1.3, 0.5, 0.06), new MeshLambertMaterial({ color: '#ffffff' }));
    const tex = this.teksPlakat(key, '');
    const pm = pk.material as MeshLambertMaterial;
    pm.map = tex;
    pm.emissive.set('#ffffff');
    pm.emissiveMap = tex;
    pm.emissiveIntensity = 0.55;
    pk.position.set(-2.05, 1.05, -UK / 2 - 0.05);
    pk.rotation.y = Math.PI;
    const tiangPk = new Mesh(new BoxGeometry(0.08, 0.8, 0.08), this.bahan('#1d1418'));
    tiangPk.position.set(-2.05, 0.4, -UK / 2 - 0.05);
    g.add(pk, tiangPk);
    this.plakat.set(key, { mesh: pk, teks: '' });
    // Rak buku di dinding samping.
    this.muatPerabot('bookcaseOpen', 2.2, (o) => {
      o.position.set(UK / 2 - 0.45, 0, 1.2);
      o.rotation.y = -Math.PI / 2;
      g.add(o);
    });
    // Meja & agen.
    const anggota = AGEN.filter((x) => x.divisi === key);
    const slot: [number, number][] =
      anggota.length <= 2
        ? [
            [-1.5, 0.45],
            [1.5, 0.45],
          ]
        : [
            [0, 1.15],
            [-1.75, -0.55],
            [1.75, -0.55],
          ];
    anggota.forEach((ag, j) => {
      const [x, z] = slot[j]!;
      const layar = this.bangunMeja(g, x, z, ag.warna);
      const duduk = this.keDunia(i, x, z + 0.75);
      // Jalan santai: geser ke samping meja, ke pintu, lalu ke tepi Second Brain.
      const sx = x + (x > 0 ? -0.95 : 0.95);
      const dekatOtak = new Vector3(Math.cos(a + (j - 1) * 0.17) * (R_DAIS - 0.6), 0.25, Math.sin(a + (j - 1) * 0.17) * (R_DAIS - 0.6));
      const jalur = [duduk, this.keDunia(i, sx, z + 0.75), this.keDunia(i, sx, -UK / 2 + 0.7), this.keDunia(i, x * 0.25, -UK / 2 - 0.5), dekatOtak];
      this.buatFigur(ag.key, ag.warna, ag.jenis, duduk, g.rotation.y, jalur, 1).layar = layar;
    });
    // Hewan penjaga.
    this.muatHewan(d.hewan, d.warna, (o) => {
      o.position.copy(this.keDunia(i, -2.2, 1.6));
      o.position.y = 0.05;
      o.rotation.y = g.rotation.y + Math.PI + 0.5;
      this.scene.add(o);
    });
  }

  /** Meja kerja (aset Kenney) + bidang layar yang menyala saat agen benar-benar bekerja. */
  private bangunMeja(g: Group, x: number, z: number, warna: string) {
    this.muatPerabot('desk', 2, (o) => {
      o.position.set(x, 0.05, z);
      g.add(o);
    });
    this.muatPerabot('computerScreen', 1.9, (o) => {
      o.position.set(x, 0.81, z - 0.12);
      g.add(o);
    });
    const layar = new Mesh(new PlaneGeometry(0.62, 0.36), new MeshBasicMaterial({ color: '#2a1420' }));
    layar.position.set(x, 1.08, z - 0.03);
    layar.userData.warna = warna;
    g.add(layar);
    this.muatPerabot('computerKeyboard', 1.8, (o) => {
      o.position.set(x, 0.81, z + 0.18);
      g.add(o);
    });
    this.muatPerabot('chairDesk', 2, (o) => {
      o.position.set(x, 0.05, z + 0.85);
      o.rotation.y = Math.PI;
      g.add(o);
    });
    const lilin = new Mesh(new CylinderGeometry(0.04, 0.04, 0.16, 8), this.bahan('#e8dcc8'));
    lilin.position.set(x + 0.55, 0.9, z - 0.1);
    const nyala = new Mesh(new SphereGeometry(0.035, 6, 5), new MeshBasicMaterial({ color: '#ffb347' }));
    nyala.position.set(x + 0.55, 1.0, z - 0.1);
    g.add(lilin, nyala);
    return layar;
  }

  private perabot = new Map<string, Promise<Object3D>>();
  private muatPerabot(nama: string, skala: number, pasang: (o: Object3D) => void) {
    if (!this.perabot.has(nama)) {
      this.perabot.set(
        nama,
        new GLTFLoader().loadAsync(`${ASET}/perabot/${nama}.glb`).then((gl) => {
          const o = gl.scene;
          o.traverse((m) => {
            const me = m as Mesh;
            if (!me.isMesh) return;
            const mat = (me.material as MeshLambertMaterial).clone();
            if ('color' in mat) mat.color.multiplyScalar(0.55).lerp(new Color('#3a1820'), 0.25);
            me.material = mat;
          });
          const b = new Box3().setFromObject(o);
          const c = b.getCenter(new Vector3());
          o.position.set(-c.x, -b.min.y, -c.z);
          const w = new Group();
          w.add(o);
          return w;
        }),
      );
    }
    this.perabot.get(nama)!.then((asal) => {
      if (!this.hidup) return;
      const o = asal.clone(true);
      o.scale.setScalar(skala);
      pasang(o);
    });
  }

  private muatHewan(nama: string, warna: string, pasang: (o: Object3D) => void) {
    new GLTFLoader().loadAsync(`${ASET}/hewan/${nama}.gltf`).then((gl) => {
      if (!this.hidup) return;
      const o = gl.scene;
      const b = new Box3().setFromObject(o);
      const tinggi = b.max.y - b.min.y || 1;
      const ingin = nama === 'Stag' ? 1.5 : nama === 'Donkey' ? 1.15 : nama === 'Fox' ? 0.6 : 0.85;
      o.scale.setScalar(ingin / tinggi);
      const cw = new Color(warna);
      o.traverse((m) => {
        const me = m as Mesh;
        if (!me.isMesh) return;
        const mats = (Array.isArray(me.material) ? me.material : [me.material]).map((x) => {
          const c = (x as MeshLambertMaterial).clone();
          if ('color' in c) {
            c.color.multiplyScalar(0.45).lerp(new Color('#1a0d12'), 0.35);
            if ('emissive' in c) {
              c.emissive = cw.clone();
              c.emissiveIntensity = 0.18;
            }
          }
          return c;
        });
        me.material = Array.isArray(me.material) ? mats : mats[0]!;
      });
      const alas = new Mesh(new CylinderGeometry(0.55, 0.65, 0.12, 6), this.bahan('#241a1f', { emissive: warna, kuat: 0.2 }));
      alas.position.y = -0.02;
      const w = new Group();
      w.add(alas, o);
      o.position.y = 0.04;
      pasang(w);
      const mx = new AnimationMixer(o);
      const klip = gl.animations.find((c) => c.name === 'Idle') ?? gl.animations[0];
      if (klip) mx.clipAction(klip).play();
      const klip2 = gl.animations.find((c) => /Idle_2|Eating/.test(c.name));
      if (klip && klip2) {
        let ganti = 6 + Math.random() * 6;
        let main = klip;
        this.api.push({
          fn: (t) => {
            if (t < ganti) return;
            ganti = t + 7 + Math.random() * 8;
            const lain = main === klip ? klip2 : klip;
            mx.clipAction(lain).reset().play().crossFadeFrom(mx.clipAction(main), 0.6, false);
            main = lain;
          },
        });
      }
      this.mixers.push(mx);
    });
  }

  private muatPohon() {
    const titik: [number, number, number][] = [];
    DIVISI.forEach((_, i) => {
      const a = this.sudut(i) + Math.PI / DIVISI.length;
      titik.push([Math.cos(a) * 11.5, Math.sin(a) * 11.5, 1.1]);
      titik.push([Math.cos(a + 0.12) * 15.5, Math.sin(a + 0.12) * 15.5, 1.4]);
    });
    titik.forEach(([x, z, s], i) => {
      new GLTFLoader().loadAsync(`${ASET}/pohon/DeadTree_${(i % 5) + 1}.gltf`).then((gl) => {
        if (!this.hidup) return;
        const o = gl.scene;
        o.traverse((m) => {
          const me = m as Mesh;
          if (!me.isMesh) return;
          const c = (me.material as MeshLambertMaterial).clone();
          if ('color' in c) c.color.set('#5a3a3a');
          me.material = c;
        });
        const b = new Box3().setFromObject(o);
        o.scale.setScalar((3.2 * s) / (b.max.y - b.min.y || 1));
        o.position.set(x, -0.15, z);
        o.rotation.y = i * 1.7;
        this.scene.add(o);
      });
    });
  }

  private bangunBara() {
    const n = 260;
    const pos = new Float32Array(n * 3);
    const cepat = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const r = 2 + Math.random() * 17;
      const a = Math.random() * Math.PI * 2;
      pos[i * 3] = Math.cos(a) * r;
      pos[i * 3 + 1] = Math.random() * 9;
      pos[i * 3 + 2] = Math.sin(a) * r;
      cepat[i] = 0.25 + Math.random() * 0.6;
    }
    const geo = new BufferGeometry();
    geo.setAttribute('position', new BufferAttribute(pos, 3));
    const bara = new Points(geo, new PointsMaterial({ color: '#ff6a2a', size: 0.09, transparent: true, opacity: 0.85, blending: AdditiveBlending, depthWrite: false }));
    this.scene.add(bara);
    this.api.push({
      fn: (_t, dt) => {
        for (let i = 0; i < n; i++) {
          let y = pos[i * 3 + 1]! + cepat[i]! * dt;
          if (y > 9) y = 0;
          pos[i * 3 + 1] = y;
          pos[i * 3] = pos[i * 3]! + Math.sin(y * 2 + i) * 0.004;
        }
        geo.attributes.position!.needsUpdate = true;
      },
    });
  }

  /* ---------------- tokoh ---------------- */

  private buatFigur(key: string, warna: string, jenis: 'dosa' | 'kebajikan' | 'raja', duduk: Vector3, hadap: number, jalur: Vector3[], skala: number) {
    const root = new Group();
    const badan = new Group();
    root.add(badan);
    const jubahW = jenis === 'kebajikan' ? `#${new Color(warna).lerp(new Color('#f4ece0'), 0.35).getHexString()}` : `#${new Color(warna).multiplyScalar(0.55).getHexString()}`;
    const jubah = this.bahan(jubahW);
    const kulit = this.bahan(jenis === 'kebajikan' ? '#e9c3a6' : jenis === 'raja' ? '#d9b8b0' : '#b99a9e');
    const tubuh = new Mesh(new CapsuleGeometry(0.22, 0.38, 4, 12), jubah);
    tubuh.position.y = 0.92;
    const rok = new Mesh(new CylinderGeometry(0.24, 0.34, 0.42, 12, 1, true), jubah);
    rok.position.y = 0.66;
    rok.material = jubah.clone();
    (rok.material as MeshLambertMaterial).side = DoubleSide;
    badan.add(tubuh, rok);
    const kepala = new Mesh(new SphereGeometry(0.2, 18, 14), kulit);
    kepala.position.y = 1.42;
    badan.add(kepala);
    const rambut = new Mesh(new SphereGeometry(0.215, 18, 12, 0, Math.PI * 2, 0, Math.PI / 1.9), this.bahan(jenis === 'kebajikan' ? '#e8d6a0' : '#1a0d14'));
    rambut.rotation.x = -0.25;
    kepala.add(rambut);
    const mataM = new MeshBasicMaterial({ color: jenis === 'kebajikan' ? '#3a2a20' : '#ff2a1a' });
    for (const s of [-1, 1]) {
      const mata = new Mesh(new SphereGeometry(0.03, 8, 6), mataM);
      mata.position.set(s * 0.075, 0.02, -0.18);
      kepala.add(mata);
    }
    if (jenis === 'kebajikan') {
      const halo = new Mesh(new TorusGeometry(0.17, 0.025, 8, 28), new MeshBasicMaterial({ color: '#ffe08a' }));
      halo.rotation.x = Math.PI / 2;
      halo.position.y = 0.33;
      kepala.add(halo);
    } else {
      const tanduk = this.bahan(jenis === 'raja' ? '#2a0a0e' : '#2b1a14', { emissive: jenis === 'raja' ? '#ff1a1a' : undefined, kuat: 0.25 });
      for (const s of [-1, 1]) {
        const h = new Mesh(new ConeGeometry(0.055, jenis === 'raja' ? 0.42 : 0.24, 8), tanduk);
        h.position.set(s * 0.12, 0.2, 0.02);
        h.rotation.z = -s * 0.45;
        kepala.add(h);
      }
    }
    const anggota = (r: number, len: number, m: Material, x: number, y: number) => {
      const p = new Group();
      p.position.set(x, y, 0);
      const me = new Mesh(new CapsuleGeometry(r, len, 4, 10), m);
      me.position.y = -len / 2 - r / 2;
      p.add(me);
      badan.add(p);
      return p;
    };
    const lenganKi = anggota(0.065, 0.32, jubah, -0.28, 1.12);
    const lenganKa = anggota(0.065, 0.32, jubah, 0.28, 1.12);
    const celana = this.bahan('#1c1218');
    const kakiKi = anggota(0.08, 0.36, celana, -0.1, 0.62);
    const kakiKa = anggota(0.08, 0.36, celana, 0.1, 0.62);
    root.scale.setScalar(skala);
    root.position.copy(duduk);
    root.rotation.y = hadap;
    this.scene.add(root);
    const f: Figur = { key, root, badan, kepala, lenganKi, lenganKa, kakiKi, kakiKa, layar: null, duduk, hadap, jalur, fase: this.figur.length * 1.37, label: new Vector3(), skala };
    this.figur.push(f);
    return f;
  }

  private bangunLucifer() {
    // Tahta di bawah Second Brain, menghadap kamera awal.
    const hadap = Math.PI / 4;
    const tahta = new Group();
    tahta.rotation.y = hadap;
    const hitam = this.bahan('#16090d');
    const emas = this.bahan('#b8892c', { emissive: '#6a3a00', kuat: 0.4 });
    const dudukan = new Mesh(new BoxGeometry(1.1, 0.55, 0.9), hitam);
    dudukan.position.set(0, 0.55, -0.1);
    const sandaran = new Mesh(new BoxGeometry(1.1, 2.0, 0.18), hitam);
    sandaran.position.set(0, 1.3, -0.5);
    const kain = new Mesh(new BoxGeometry(0.8, 1.5, 0.05), this.bahan('#7a0f16'));
    kain.position.set(0, 1.25, -0.39);
    tahta.add(dudukan, sandaran, kain);
    for (const s of [-1, 1]) {
      const tg = new Mesh(new BoxGeometry(0.14, 2.5, 0.14), emas);
      tg.position.set(s * 0.6, 1.25, -0.5);
      const ujung = new Mesh(new ConeGeometry(0.1, 0.4, 4), emas);
      ujung.position.set(s * 0.6, 2.7, -0.5);
      const lengan = new Mesh(new BoxGeometry(0.14, 0.14, 0.9), emas);
      lengan.position.set(s * 0.56, 0.9, -0.1);
      tahta.add(tg, ujung, lengan);
    }
    const mahkota = new Mesh(new ConeGeometry(0.16, 0.5, 4), emas);
    mahkota.position.set(0, 2.55, -0.5);
    tahta.add(mahkota);
    tahta.position.y = 0.25;
    this.scene.add(tahta);
    const duduk = new Vector3(0, 0.25, 0).add(new Vector3(Math.sin(hadap), 0, Math.cos(hadap)).multiplyScalar(0.12));
    const f = this.buatFigur(LUCIFER.key, LUCIFER.warna, 'raja', duduk, hadap + Math.PI, [duduk], 1.3);
    // Jubah merah & sayap.
    const sayapM = new MeshLambertMaterial({ color: '#3a0a12', emissive: '#5a0010', emissiveIntensity: 0.35, side: DoubleSide, transparent: true, opacity: 0.92 });
    const bentuk = new Shape();
    bentuk.moveTo(0, 0);
    bentuk.lineTo(0.5, 0.55);
    bentuk.lineTo(1.25, 0.85);
    bentuk.lineTo(1.1, 0.35);
    bentuk.lineTo(1.3, 0.05);
    bentuk.lineTo(0.95, -0.05);
    bentuk.lineTo(0.95, -0.35);
    bentuk.lineTo(0.6, -0.2);
    bentuk.lineTo(0.35, -0.45);
    bentuk.lineTo(0.2, -0.15);
    bentuk.lineTo(0, 0);
    const sayap: Mesh[] = [];
    for (const s of [-1, 1]) {
      const w = new Mesh(new ShapeGeometry(bentuk), sayapM);
      w.scale.set(s, 1, 1);
      w.position.set(s * 0.12, 1.12, 0.16);
      w.rotation.y = s * -0.5;
      f.badan.add(w);
      sayap.push(w);
    }
    const jubahMerah = new Mesh(new PlaneGeometry(0.62, 1.0), new MeshLambertMaterial({ color: '#8a0f18', side: DoubleSide }));
    jubahMerah.position.set(0, 0.78, 0.25);
    jubahMerah.rotation.x = 0.12;
    f.badan.add(jubahMerah);
    for (let i = 0; i < 5; i++) {
      const duri = new Mesh(new ConeGeometry(0.035, 0.16, 5), this.bahan('#d4a73a', { emissive: '#7a4a00', kuat: 0.5 }));
      const a = (i / 4 - 0.5) * 1.6;
      duri.position.set(Math.sin(a) * 0.17, 0.24, Math.cos(a) * -0.05 - 0.02);
      f.kepala.add(duri);
    }
    this.api.push({ fn: (t) => sayap.forEach((w, i) => (w.rotation.y = (i ? 1 : -1) * (-0.5 - 0.12 * Math.sin(t * 1.4))) ) });
  }

  /* ---------------- Second Brain ---------------- */

  private bangunOtak(catatan: Catatan[]) {
    this.otak.traverse((o) => {
      const m = o as Mesh;
      m.geometry?.dispose?.();
      (m.material as Material | undefined)?.dispose?.();
    });
    this.otak.clear();
    this.otak.position.y = OTAK_Y;
    const n = Math.max(1, catatan.length);
    const posisi = new Map<string, Vector3>();
    const inst = new InstancedMesh(new IcosahedronGeometry(1, 1), new MeshBasicMaterial({ color: '#ffffff' }), n);
    const m4 = new Matrix4();
    const baru = Date.now() - 20 * 60_000;
    catatan.forEach((c, i) => {
      const y = 1 - (i / Math.max(1, n - 1)) * 2;
      const r = Math.sqrt(1 - y * y);
      const th = i * 2.399963;
      // Bentuk otak: dua belahan sedikit pipih.
      const v = new Vector3(Math.cos(th) * r * 1.9, y * 1.25, Math.sin(th) * r * 1.5);
      v.x += Math.sign(v.x || 1) * 0.12;
      posisi.set(c.p, v);
      const s = 0.05 + Math.min(0.09, c.kata / 9000) + (c.diubah > baru ? 0.05 : 0);
      m4.makeScale(s, s, s).setPosition(v);
      inst.setMatrixAt(i, m4);
      inst.setColorAt(i, new Color(c.diubah > baru ? '#ffffff' : (WARNA_FOLDER[c.folder] ?? '#ff9f80')));
    });
    inst.instanceMatrix.needsUpdate = true;
    this.otak.add(inst);
    const garis: number[] = [];
    for (const c of catatan) {
      const a = posisi.get(c.p)!;
      for (const t of c.tautan) {
        const b = posisi.get(t);
        if (b) garis.push(a.x, a.y, a.z, b.x, b.y, b.z);
      }
    }
    const lg = new BufferGeometry();
    lg.setAttribute('position', new BufferAttribute(new Float32Array(garis), 3));
    this.otak.add(new LineSegments(lg, new LineBasicMaterial({ color: '#ff5a6a', transparent: true, opacity: 0.35, blending: AdditiveBlending, depthWrite: false })));
    this.otakInti = new Mesh(new IcosahedronGeometry(0.55, 1), new MeshBasicMaterial({ color: '#ff2a3a', wireframe: true, transparent: true, opacity: 0.8 }));
    this.otak.add(this.otakInti);
    const kulit = new Mesh(new SphereGeometry(1, 32, 24), new MeshBasicMaterial({ color: '#ff3b4f', transparent: true, opacity: 0.07, depthWrite: false, blending: AdditiveBlending }));
    kulit.scale.set(2.1, 1.45, 1.7);
    this.otak.add(kulit);
  }

  /* ---------------- kamera & kontrol ---------------- */

  private pas() {
    const w = this.host.clientWidth || 1;
    const h = this.host.clientHeight || 1;
    this.renderer.setSize(w, h, false);
    const asp = w / h;
    let hh = 13.5;
    let hw = hh * asp;
    if (hw < 16) {
      hw = 16;
      hh = hw / asp;
    }
    Object.assign(this.kamera, { left: -hw, right: hw, top: hh, bottom: -hh });
    this.kamera.updateProjectionMatrix();
  }

  private pasangKontrol() {
    const el = this.renderer.domElement;
    let tarik: { x: number; az: number; geser: boolean } | null = null;
    el.addEventListener('pointerdown', (e) => {
      tarik = { x: e.clientX, az: this.az, geser: false };
      el.setPointerCapture(e.pointerId);
    });
    el.addEventListener('pointermove', (e) => {
      if (!tarik) return;
      const dx = e.clientX - tarik.x;
      if (Math.abs(dx) > 3) tarik.geser = true;
      this.az = tarik.az - dx * 0.006;
      this.sentuhTerakhir = performance.now();
    });
    el.addEventListener('pointerup', (e) => {
      if (tarik && !tarik.geser) this.klik(e);
      tarik = null;
    });
    el.addEventListener(
      'wheel',
      (e) => {
        e.preventDefault();
        this.zoom = Math.max(0.7, Math.min(3.2, this.zoom * (e.deltaY > 0 ? 0.9 : 1.1)));
        this.sentuhTerakhir = performance.now();
      },
      { passive: false },
    );
    el.addEventListener('dblclick', () => {
      this.zoom = 1;
      this.az = Math.PI / 4;
    });
  }

  private klik(e: PointerEvent) {
    const r = this.renderer.domElement.getBoundingClientRect();
    const ray = new Raycaster();
    ray.setFromCamera(new Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1), this.kamera);
    const hit = this.scene.getObjectByName('otak-hit');
    if (hit && ray.intersectObject(hit, false).length) this.opsi.onKlikOtak?.();
  }

  /* ---------------- frame ---------------- */

  private tmp = new Vector3();
  private tmp2 = new Vector3();
  private proj = new Vector3();

  private gambar() {
    const dt = Math.min(0.05, this.jam.getDelta());
    const t = this.jam.elapsedTime;
    if (performance.now() - this.sentuhTerakhir > 12_000) this.az += dt * 0.035;
    this.kamera.position.set(this.target.x + 30 * Math.sin(this.az), this.target.y + 24, this.target.z + 30 * Math.cos(this.az));
    this.kamera.lookAt(this.target);
    if (this.kamera.zoom !== this.zoom) {
      this.kamera.zoom += (this.zoom - this.kamera.zoom) * 0.2;
      if (Math.abs(this.kamera.zoom - this.zoom) < 0.002) this.kamera.zoom = this.zoom;
      this.kamera.updateProjectionMatrix();
    }
    for (const a of this.api) a.fn(t, dt);
    for (const m of this.mixers) m.update(dt);
    this.otak.rotation.y = t * 0.12;
    if (this.otakInti) {
      this.otakInti.rotation.x = t * 0.5;
      this.otakInti.scale.setScalar(1 + 0.12 * Math.sin(t * 2.4));
    }
    this.figur.forEach((f, i) => this.gerak(f, i, t));
    this.renderer.render(this.scene, this.kamera);
    const w = this.host.clientWidth;
    const h = this.host.clientHeight;
    const taruh = (el: HTMLElement | undefined, v: Vector3) => {
      if (!el) return;
      this.proj.copy(v).project(this.kamera);
      el.style.transform = `translate3d(${(((this.proj.x + 1) / 2) * w).toFixed(1)}px, ${(((1 - this.proj.y) / 2) * h).toFixed(1)}px, 0)`;
    };
    for (const f of this.figur) taruh(this.label.get(f.key), f.label);
    taruh(this.label.get('otak'), this.tmp.set(0, OTAK_Y + 2.1, 0));
    DIVISI.forEach((d, i) => taruh(this.label.get(`div:${d.key}`), this.keDunia(i, 0, -UK / 2 - 0.2, this.tmp2).setY(2.9)));
  }

  private gerak(f: Figur, i: number, t: number) {
    const s = this.status[f.key];
    const kerja = !!s?.kerja;
    const raja = f.key === LUCIFER.key;
    const sn = !kerja && !raja ? santai(i, t) : { k: 0, jalan: false };
    const el = this.label.get(f.key);
    if (el) el.dataset.santai = sn.k > 0.02 ? '1' : '0';
    if (f.layar) {
      const m = f.layar.material as MeshBasicMaterial;
      m.color.set(kerja ? f.layar.userData.warna : '#2a1420');
      if (kerja) m.color.multiplyScalar(0.75 + 0.25 * Math.sin(t * 8 + f.fase));
    }
    const berdiri = sn.k > 0;
    if (berdiri) {
      diJalur(f.jalur, sn.k, this.tmp);
      f.root.position.copy(this.tmp);
      if (sn.jalan) {
        const maju = santai(i, t + 0.05).k >= sn.k;
        diJalur(f.jalur, Math.max(0, Math.min(1, sn.k + (maju ? 0.02 : -0.02))), this.tmp2);
        const dx = this.tmp2.x - this.tmp.x;
        const dz = this.tmp2.z - this.tmp.z;
        if (dx * dx + dz * dz > 1e-9) f.root.rotation.y = Math.atan2(dx, dz) + Math.PI;
      } else f.root.rotation.y = Math.atan2(-this.tmp.x, -this.tmp.z) + Math.PI;
    } else {
      f.root.position.copy(f.duduk);
      f.root.rotation.y = f.hadap;
    }
    const ay = Math.sin(t * 9 + f.fase);
    if (berdiri) {
      const lj = sn.jalan ? 0.6 * ay : 0;
      f.badan.position.y = sn.jalan ? 0.03 * Math.abs(ay) : 0;
      f.kakiKi.position.y = f.kakiKa.position.y = 0.62;
      f.kakiKi.rotation.set(lj, 0, 0);
      f.kakiKa.rotation.set(-lj, 0, 0);
      f.lenganKi.rotation.set(-lj * 0.8, 0, 0.08);
      f.lenganKa.rotation.set(lj * 0.8, 0, -0.08);
      f.kepala.rotation.set(sn.jalan ? 0 : 0.4, 0, 0);
    } else {
      // Depan tokoh = −z, jadi rotasi x positif = maju.
      f.badan.position.y = -0.05;
      f.kakiKi.rotation.set(1.45, 0, 0);
      f.kakiKa.rotation.set(1.45, 0, 0);
      if (kerja && !raja) {
        f.lenganKi.rotation.set(1.2 + 0.12 * Math.sin(t * 16 + f.fase), 0, 0.1);
        f.lenganKa.rotation.set(1.2 + 0.12 * Math.sin(t * 16 + f.fase + 2), 0, -0.1);
        f.kepala.rotation.set(-0.12 + 0.04 * Math.sin(t * 3 + f.fase), 0.08 * Math.sin(t * 1.3 + f.fase), 0);
        f.badan.position.y = -0.05 + 0.012 * Math.abs(ay);
      } else if (raja) {
        f.lenganKi.rotation.set(0.6, 0, 0.35);
        f.lenganKa.rotation.set(kerja ? 2.2 + 0.25 * Math.sin(t * 2) : 0.6, 0, kerja ? -0.3 : -0.35);
        f.kepala.rotation.set(kerja ? 0.15 : 0, 0.3 * Math.sin(t * 0.35), 0);
      } else {
        f.lenganKi.rotation.set(0.45, 0, 0.12);
        f.lenganKa.rotation.set(0.45, 0, -0.12);
        f.kepala.rotation.set(0, 0.5 * Math.sin(t * 0.4 + f.fase), 0);
        f.badan.position.y = -0.05 + 0.01 * Math.sin(t * 1.6 + f.fase);
      }
    }
    f.label.set(f.root.position.x, f.root.position.y + (berdiri ? 2.05 : 1.85) * f.skala, f.root.position.z);
  }
}
