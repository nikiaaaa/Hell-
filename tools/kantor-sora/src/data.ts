/** Data papan: API server (server/api.mjs) + turunan status agen yang akurat (tanpa jadwal palsu). */
import { AGEN, LUCIFER } from './sora';

export interface Baris {
  tahap: string;
  agen: string;
  file: string;
  status: string;
  catatan: string;
}
export interface Produksi {
  id: string;
  judul: string;
  channel: string;
  diubah: number;
  baris: Baris[];
}
export interface Catatan {
  p: string;
  judul: string;
  folder: string;
  diubah: number;
  kata: number;
  tautan: string[];
}
export interface Run {
  id: string;
  perintah: string;
  status: 'antre' | 'jalan' | 'selesai' | 'gagal' | 'dihentikan' | 'dibatalkan' | 'terputus';
  dibuat: number;
  mulai?: number;
  selesai?: number;
  sesi?: string;
  lanjutSesi?: string | null;
  biaya?: number | null;
  ringkasan?: string;
  ditolak?: number;
}
export type Langkah =
  | { jenis: 'perintah'; teks: string; lanjut: boolean; t: number }
  | { jenis: 'mulai'; sesi: string; model: string; t: number }
  | { jenis: 'teks'; teks: string; agen: string | null; t: number }
  | { jenis: 'tugaskan'; id: string; agen: string; deskripsi: string; oleh: string | null; t: number }
  | { jenis: 'alat'; id: string; nama: string; ringkas: string; agen: string | null; t: number }
  | { jenis: 'hasil'; id: string; galat: boolean; ringkas: string; agen: string | null; selesaiAgen: boolean; t: number }
  | { jenis: 'selesai'; hasil: string; galat: boolean; sesi: string; biaya: number | null; durasi: number | null; giliran: number | null; ditolak: string[]; t: number }
  | { jenis: 'log' | 'galat'; teks: string; t: number }
  | { jenis: 'tutup'; kode: number | null; status: string; t: number };

export interface Keadaan {
  produksi: Produksi[];
  vault: { nama: string; jumlah: number; catatan: Catatan[] };
  divisi: Record<string, { email?: string; tugas?: string }>;
  runs: Run[];
  /** Total biaya Claude dari riwayat perintah yang tersimpan (maks 60 terakhir). */
  biaya: number;
  izin: string[];
  /** Lokasi claude.exe yang dipakai server, null = tidak ditemukan (akan dicoba lewat PATH). */
  claude: string | null;
  aktif: string | null;
  antrean: string[];
  waktu: number;
}

const token = () => document.querySelector<HTMLMetaElement>('meta[name="sora-token"]')?.content ?? '';

export async function api<T>(jalur: string, body?: unknown): Promise<T> {
  const r = await fetch(jalur, {
    method: body === undefined ? 'GET' : 'POST',
    headers: { 'x-sora-token': token(), ...(body === undefined ? {} : { 'Content-Type': 'application/json' }) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const j = await r.json();
  if (!r.ok) throw new Error(j.galat ?? `HTTP ${r.status}`);
  return j as T;
}

export function dengar(h: { keadaan(k: Omit<Keadaan, 'aktif' | 'antrean'>): void; runs(r: Run[]): void; langkah(run: string, ev: Langkah): void; status(ok: boolean): void }) {
  const es = new EventSource(`/api/acara?t=${token()}`);
  es.addEventListener('keadaan', (e) => h.keadaan(JSON.parse((e as MessageEvent).data)));
  es.addEventListener('runs', (e) => h.runs(JSON.parse((e as MessageEvent).data)));
  es.addEventListener('langkah', (e) => {
    const d = JSON.parse((e as MessageEvent).data);
    h.langkah(d.run, d.ev);
  });
  es.onopen = () => h.status(true);
  es.onerror = () => h.status(false);
  return () => es.close();
}

/* ---------------- status agen ---------------- */

export interface StatusAgen {
  key: string;
  /** kerja = benar-benar sedang dikerjakan (🔄 di status.md atau sedang dipanggil LUCIFER). */
  kerja: boolean;
  label: string;
  /** Gelembung: langkah terakhir yang nyata. */
  gelembung: string | null;
  menunggu: string[];
  mendesak: string[];
  terakhir: string | null;
}

type LangkahKerja = Extract<Langkah, { jenis: 'alat' | 'teks' }>;
const kerjaTerakhir = (langkah: Langkah[], agen: string | null) =>
  [...langkah].reverse().find((l): l is LangkahKerja => (l.jenis === 'alat' || l.jenis === 'teks') && l.agen === agen);
const teksLangkah = (l: LangkahKerja) => (l.jenis === 'alat' ? `${l.nama}: ${l.ringkas}` : l.teks);

const namaTahap =(t: string) => t.replace(/^✋\s*/, '').replace(/^\d+[a-z]?\s+/, '').trim();

export function statusAgen(produksi: Produksi[], langkah: Langkah[], runJalan: boolean): Record<string, StatusAgen> {
  const S: Record<string, StatusAgen> = {};
  for (const k of [...AGEN.map((a) => a.key), LUCIFER.key]) S[k] = { key: k, kerja: false, label: 'siaga', gelembung: null, menunggu: [], mendesak: [], terakhir: null };
  for (const p of [...produksi].reverse()) {
    const nama = p.judul || p.id;
    let sebelum: Baris | null = null;
    for (const b of p.baris) {
      const k = b.agen === 'tuan' ? null : b.agen;
      const catatan = b.catatan.replace(/^!\s*/, '');
      if (/gerbang/i.test(b.tahap)) {
        if (b.status === '⏳' && sebelum?.status === '✅' && S[sebelum.agen]) S[sebelum.agen]!.menunggu.push(`${nama}: ${namaTahap(b.tahap)}${catatan ? ` — ${catatan}` : ''}`);
        sebelum = b;
        continue;
      }
      sebelum = b;
      if (!k || !S[k]) continue;
      const s = S[k]!;
      if (b.status === '🔄') {
        s.kerja = true;
        s.label = `${namaTahap(b.tahap).toLowerCase()} · ${nama}`;
        if (catatan) s.gelembung = catatan;
      } else if (b.status === '❌') s.mendesak.push(`${nama}: ${namaTahap(b.tahap)} gagal${catatan ? ` — ${catatan}` : ''}`);
      else if (b.status === '✅') s.terakhir = `${namaTahap(b.tahap)} "${nama}"${catatan ? ` — ${catatan}` : ''}`;
      if (b.catatan.startsWith('!') && catatan) s.menunggu.push(`${nama}: ${catatan}`);
    }
  }
  // Perintah yang sedang jalan: agen yang ditugaskan dan belum mengembalikan hasil = sedang bekerja.
  if (runJalan) {
    const tugas = new Map<string, { agen: string; deskripsi: string }>();
    for (const l of langkah) {
      if (l.jenis === 'tugaskan') tugas.set(l.id, { agen: l.agen, deskripsi: l.deskripsi });
      else if (l.jenis === 'hasil' && l.selesaiAgen) tugas.delete(l.id);
    }
    for (const { agen, deskripsi } of tugas.values()) {
      const s = S[agen];
      if (!s) continue;
      s.kerja = true;
      s.label = deskripsi || 'dipanggil LUCIFER';
      const akhir = kerjaTerakhir(langkah, agen);
      if (akhir) s.gelembung = teksLangkah(akhir);
    }
    const L = S.lucifer!;
    L.kerja = true;
    L.label = tugas.size ? `memimpin ${tugas.size} agen` : 'mengerjakan perintah Tuan';
    const akhir = kerjaTerakhir(langkah, null);
    if (akhir) L.gelembung = teksLangkah(akhir);
  }
  for (const s of Object.values(S)) if (s.gelembung && s.gelembung.length > 140) s.gelembung = `${s.gelembung.slice(0, 139)}…`;
  return S;
}

export const ikonStatus: Record<string, string> = { '✅': '✅', '🔄': '🔄', '❌': '❌', '⏳': '⏳' };
export const obsidian = (vault: string, p: string) => `obsidian://open?vault=${encodeURIComponent(vault)}&file=${encodeURIComponent(p.replace(/\.md$/i, ''))}`;
