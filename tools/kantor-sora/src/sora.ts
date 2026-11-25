/**
 * ✏️ Susunan Istana LUCIFER: 7 divisi (masing-masing satu Dosa + satu Kebajikan) mengelilingi Second Brain di tengah.
 * Email tiap divisi diisi Tuan dari papan (tab Divisi), disimpan di data/divisi.json.
 */

export type JenisAgen = 'dosa' | 'kebajikan';

export interface Divisi {
  key: string;
  nama: string;
  /** Dosa yang memimpin divisi (lambang ruangan). */
  dosa: string;
  warna: string;
  /** Hewan penjaga (aset Quaternius di public/aset/hewan). */
  hewan: string;
  lambang: string;
}

export interface Agen {
  key: string;
  nama: string;
  tugas: string;
  divisi: string;
  jenis: JenisAgen;
  warna: string;
  kepala?: boolean;
}

export const DIVISI: Divisi[] = [
  { key: 'tren', nama: 'Divisi Tren & Data', dosa: 'Envy', warna: '#3fbf6e', hewan: 'Husky', lambang: '◈' },
  { key: 'fakta', nama: 'Divisi Fakta', dosa: 'Gluttony', warna: '#e07b39', hewan: 'Wolf', lambang: '❂' },
  { key: 'cerita', nama: 'Divisi Cerita', dosa: 'Pride', warna: '#e3b23c', hewan: 'Stag', lambang: '♛' },
  { key: 'dunia', nama: 'Divisi Karakter & Dunia', dosa: 'Lust', warna: '#ff3d7f', hewan: 'Fox', lambang: '❦' },
  { key: 'animasi', nama: 'Divisi Animasi & Footage', dosa: 'Greed', warna: '#d4a017', hewan: 'Husky', lambang: '✦' },
  { key: 'suara', nama: 'Divisi Suara & Edit', dosa: 'Sloth', warna: '#8f7ee6', hewan: 'Donkey', lambang: '☾' },
  { key: 'rilis', nama: 'Divisi QA & Rilis', dosa: 'Wrath', warna: '#ff3b2f', hewan: 'Wolf', lambang: '⚔' },
];

/** 7 pasang: tiap divisi = satu Dosa (kepala) + satu Kebajikan, dengan skill yang saling melengkapi. */
export const AGEN: Agen[] = [
  { key: 'envy', nama: 'ENVY', tugas: 'Pemburu Tren', divisi: 'tren', jenis: 'dosa', warna: '#3fbf6e', kepala: true },
  { key: 'patience', nama: 'PATIENCE', tugas: 'Analis Performa', divisi: 'tren', jenis: 'kebajikan', warna: '#6f72e0' },
  { key: 'gluttony', nama: 'GLUTTONY', tugas: 'Pemburu Fakta', divisi: 'fakta', jenis: 'dosa', warna: '#e07b39', kepala: true },
  { key: 'humility', nama: 'HUMILITY', tugas: 'Pemeriksa Fakta', divisi: 'fakta', jenis: 'kebajikan', warna: '#a9c1d9' },
  { key: 'pride', nama: 'PRIDE', tugas: 'Naskah & Hook', divisi: 'cerita', jenis: 'dosa', warna: '#e3b23c', kepala: true },
  { key: 'diligence', nama: 'DILIGENCE', tugas: 'Storyboard', divisi: 'cerita', jenis: 'kebajikan', warna: '#4a90ff' },
  { key: 'lust', nama: 'LUST', tugas: 'Art Director', divisi: 'dunia', jenis: 'dosa', warna: '#ff3d7f', kepala: true },
  { key: 'chastity', nama: 'CHASTITY', tugas: 'Penjaga Karakter', divisi: 'dunia', jenis: 'kebajikan', warna: '#f4f1ea' },
  { key: 'greed', nama: 'GREED', tugas: 'Pemburu Footage', divisi: 'animasi', jenis: 'dosa', warna: '#d4a017', kepala: true },
  { key: 'kindness', nama: 'KINDNESS', tugas: 'Animator', divisi: 'animasi', jenis: 'kebajikan', warna: '#f7aef8' },
  { key: 'sloth', nama: 'SLOTH', tugas: 'Editor & Perakit', divisi: 'suara', jenis: 'dosa', warna: '#8f7ee6', kepala: true },
  { key: 'temperance', nama: 'TEMPERANCE', tugas: 'Sutradara Suara', divisi: 'suara', jenis: 'kebajikan', warna: '#7bdff2' },
  { key: 'wrath', nama: 'WRATH', tugas: 'Penjaga Gerbang QA', divisi: 'rilis', jenis: 'dosa', warna: '#ff3b2f', kepala: true },
  { key: 'charity', nama: 'CHARITY', tugas: 'Publisher', divisi: 'rilis', jenis: 'kebajikan', warna: '#f2b134' },
];

export const LUCIFER = { key: 'lucifer', nama: 'LUCIFER', tugas: 'Showrunner · Raja Istana', warna: '#c4161c' };

export const agenDari = (key: string | null | undefined) => (key ? AGEN.find((a) => a.key === key) : undefined);
export const divisiDari = (key: string) => DIVISI.find((d) => d.key === key)!;
export const warnaAgen = (key: string | null | undefined) => (key === 'lucifer' || !key ? LUCIFER.warna : (agenDari(key)?.warna ?? '#bbbbbb'));
