// Server papan Istana LUCIFER (plugin Vite, hanya untuk localhost).
//   GET  /api/keadaan          produksi (status.md), vault Obsidian, divisi, riwayat perintah
//   GET  /api/acara?t=TOKEN     Server-Sent Events: keadaan berubah, langkah perintah
//   GET  /api/run?id=           semua langkah satu perintah
//   GET  /api/berkas?p=         isi satu catatan .md di OFFICE
//   POST /api/perintah {teks, lanjut}   jalankan LUCIFER (claude -p) di folder OFFICE
//   POST /api/hentikan {id}
//   POST /api/divisi {key, email}
//   POST /api/performa {channel, baris}   tambah satu baris ke channels/<ch>/performa.csv
// Semua /api butuh Host localhost + token per-peluncuran (header x-sora-token atau ?t=).
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import os from 'node:os';
import { spawn, execFile } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const DIR = path.dirname(fileURLToPath(import.meta.url));
export const OFFICE = path.resolve(DIR, '..', '..', '..');
const DATA = path.resolve(DIR, '..', 'data');
const RUNS = path.join(DATA, 'runs');
const TOKEN = crypto.randomBytes(18).toString('hex');

/* ---------------- status.md ---------------- */

const SIMBOL = ['🔄', '❌', '✅', '⏳'];

/** Tabel status.md → { judul, channel, baris: [{ tahap, agen, file, status, catatan }] }. */
export function bacaStatus(teks) {
  const ambil = (k) => (teks.match(new RegExp(`^${k}:[ \\t]*(.*)$`, 'm'))?.[1] ?? '').trim();
  const baris = [];
  for (const line of teks.split(/\r?\n/)) {
    const t = line.trim();
    if (!t.startsWith('|')) continue;
    const sel = t.replace(/^\||\|$/g, '').split('|').map((s) => s.trim());
    if (sel.length < 4 || /^:?-{2,}/.test(sel[0]) || sel[0].toLowerCase() === 'tahap') continue;
    const [tahap, agen, file, statusSel, ...sisa] = sel;
    const status = SIMBOL.find((s) => statusSel.includes(s)) ?? '';
    baris.push({ tahap, agen: agen.toLowerCase(), file, status, catatan: sisa.join(' | ').trim() });
  }
  return { judul: ambil('Judul kerja'), channel: ambil('Channel'), baris };
}

function bacaProduksi() {
  const dir = path.join(OFFICE, 'productions');
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith('_'))
    .map((d) => {
      const f = path.join(dir, d.name, 'status.md');
      if (!fs.existsSync(f)) return null;
      const st = fs.statSync(f);
      return { id: d.name, diubah: st.mtimeMs, ...bacaStatus(fs.readFileSync(f, 'utf8')) };
    })
    .filter(Boolean)
    .sort((a, b) => b.id.localeCompare(a.id));
}

/* ---------------- vault Obsidian ---------------- */

const LEWATI = new Set(['node_modules', '.git', '.obsidian', '.claude', 'dist', 'data', '.trash', 'public']);

export function bacaVault() {
  const catatan = [];
  const jalan = (rel) => {
    let isi;
    try {
      isi = fs.readdirSync(path.join(OFFICE, rel), { withFileTypes: true });
    } catch {
      return;
    }
    for (const d of isi) {
      if (LEWATI.has(d.name) || d.name.startsWith('.')) continue;
      const r = rel ? `${rel}/${d.name}` : d.name;
      if (d.isDirectory()) jalan(r);
      else if (d.name.toLowerCase().endsWith('.md') && catatan.length < 800) {
        const full = path.join(OFFICE, r);
        const st = fs.statSync(full);
        const teks = st.size < 400_000 ? fs.readFileSync(full, 'utf8') : '';
        catatan.push({
          p: r,
          judul: (teks.match(/^#\s+(.+)$/m)?.[1] ?? d.name.replace(/\.md$/i, '')).trim().slice(0, 90),
          folder: r.includes('/') ? r.split('/')[0] : '(akar)',
          diubah: st.mtimeMs,
          kata: teks ? teks.split(/\s+/).length : 0,
          _teks: teks,
        });
      }
    }
  };
  jalan('');
  // Tautan: [[wikilink]], [teks](file.md), atau nama berkas .md yang disebut di catatan lain.
  const perNama = new Map();
  for (const c of catatan) {
    const nama = c.p.split('/').pop().toLowerCase();
    if (!perNama.has(nama)) perNama.set(nama, []);
    perNama.get(nama).push(c.p);
  }
  for (const c of catatan) {
    const t = new Set();
    const dirC = c.p.includes('/') ? c.p.slice(0, c.p.lastIndexOf('/')) : '';
    const cocok = (nama) => {
      const n = nama.split('#')[0].split('|')[0].trim().toLowerCase();
      const kandidat = perNama.get(n.endsWith('.md') ? n.split('/').pop() : `${n.split('/').pop()}.md`) ?? [];
      const dekat = kandidat.find((p) => p.startsWith(dirC)) ?? kandidat[0];
      if (dekat && dekat !== c.p) t.add(dekat);
    };
    for (const m of c._teks.matchAll(/\[\[([^\]]+)\]\]/g)) cocok(m[1]);
    for (const m of c._teks.matchAll(/\]\(([^)\s]+\.md)\)/gi)) cocok(m[1]);
    for (const m of c._teks.matchAll(/([\w.-]+\.md)\b/gi)) cocok(m[1]);
    c.tautan = [...t];
    delete c._teks;
  }
  return { nama: path.basename(OFFICE), jumlah: catatan.length, catatan };
}

/* ---------------- divisi & riwayat ---------------- */

const baca = (f, d) => {
  try {
    return JSON.parse(fs.readFileSync(f, 'utf8'));
  } catch {
    return d;
  }
};
const tulis = (f, v) => {
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, `${JSON.stringify(v, null, 2)}\n`);
};
const FDIVISI = path.join(DATA, 'divisi.json');
const FRUNS = path.join(DATA, 'runs.json');
const FIZIN = path.join(DIR, 'izin.json');

let runs = baca(FRUNS, []);
for (const r of runs) if (r.status === 'jalan' || r.status === 'antre') r.status = 'terputus';
const simpanRuns = () => tulis(FRUNS, runs.slice(0, 60));

/* ---------------- SSE ---------------- */

const klien = new Set();
const siar = (jenis, data) => {
  const pesan = `event: ${jenis}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const res of klien) res.write(pesan);
};

let cache = null;
const keadaan = () => {
  if (!cache) cache = { produksi: bacaProduksi(), vault: bacaVault() };
  return {
    ...cache,
    divisi: baca(FDIVISI, {}),
    runs: runs.slice(0, 30),
    biaya: Math.round(runs.reduce((s, r) => s + (Number(r.biaya) || 0), 0) * 100) / 100,
    izin: baca(FIZIN, { alatDiizinkan: [] }).alatDiizinkan,
    claude: cariExe() || null,
    waktu: Date.now(),
  };
};
let tunda = null;
const berubah = () => {
  clearTimeout(tunda);
  tunda = setTimeout(() => {
    cache = null;
    siar('keadaan', keadaan());
  }, 350);
};

/* ---------------- runner LUCIFER ---------------- */

// claude.exe bisa ada di AppData biasa, atau di AppData virtual milik aplikasi Claude desktop (versi Store),
// yang tidak terlihat dari proses yang dibuka lewat shortcut desktop.
const paketClaude = () => {
  const dir = path.join(process.env.LOCALAPPDATA ?? path.join(os.homedir(), 'AppData', 'Local'), 'Packages');
  try {
    return fs
      .readdirSync(dir)
      .filter((n) => /^(Claude|Anthropic)/i.test(n))
      .map((n) => path.join(dir, n, 'LocalCache', 'Roaming'));
  } catch {
    return [];
  }
};
// Dicari ulang tiap kali: CLI bisa memperbarui dirinya sendiri dan pindah lokasi.
const cariExe = () =>
  [process.env.APPDATA, path.join(os.homedir(), 'AppData', 'Roaming'), ...paketClaude()]
    .filter(Boolean)
    .flatMap((d) => [path.join(d, 'npm', 'node_modules', '@anthropic-ai', 'claude-code', 'bin', 'claude.exe')])
    .concat([path.join(os.homedir(), '.local', 'bin', 'claude.exe')])
    .find((p) => fs.existsSync(p)) ?? '';
const rel = (p) => (typeof p === 'string' ? path.relative(OFFICE, p).replace(/\\/g, '/') || p : '');
const potong = (s, n = 220) => {
  const t = String(s ?? '').replace(/\s+/g, ' ').trim();
  return t.length > n ? `${t.slice(0, n - 1)}…` : t;
};

/** Ringkas input alat jadi satu baris yang bisa dibaca Tuan. */
export function ringkasAlat(nama, i = {}) {
  switch (nama) {
    case 'Bash':
      return i.description ? `${i.description} — ${potong(i.command, 160)}` : potong(i.command, 200);
    case 'Read':
    case 'Write':
    case 'Edit':
    case 'NotebookEdit':
      return rel(i.file_path);
    case 'Glob':
    case 'Grep':
      return `${i.pattern ?? ''}${i.path ? ` di ${rel(i.path)}` : ''}`;
    case 'WebSearch':
      return i.query ?? '';
    case 'WebFetch':
      return i.url ?? '';
    case 'Agent':
    case 'Task':
      return `${i.subagent_type ?? 'agen'}: ${i.description ?? ''}`;
    case 'Skill':
      return i.skill ?? '';
    case 'TodoWrite':
      return (i.todos ?? []).map((t) => `${t.status === 'completed' ? '☑' : t.status === 'in_progress' ? '▶' : '☐'} ${t.content}`).join('\n');
    default:
      return potong(JSON.stringify(i), 200);
  }
}

const teksHasil = (c) => (typeof c === 'string' ? c : Array.isArray(c) ? c.map((x) => (x.type === 'text' ? x.text : `[${x.type}]`)).join(' ') : '');

/** Satu baris stream-json → daftar langkah ringkas. `peta` = id alat Agent → key agen. */
export function normalisasi(o, peta) {
  const out = [];
  const agen = o.parent_tool_use_id ? (peta.get(o.parent_tool_use_id) ?? 'agen') : null;
  if (o.type === 'system' && o.subtype === 'init') out.push({ jenis: 'mulai', sesi: o.session_id, model: o.model });
  else if (o.type === 'assistant') {
    for (const c of o.message?.content ?? []) {
      if (c.type === 'text' && c.text.trim()) out.push({ jenis: 'teks', teks: c.text, agen });
      else if (c.type === 'tool_use') {
        const sub = /^sora-(\w+)/.exec(c.input?.subagent_type ?? '')?.[1];
        if ((c.name === 'Agent' || c.name === 'Task') && c.input?.subagent_type) {
          peta.set(c.id, sub ?? c.input.subagent_type);
          out.push({ jenis: 'tugaskan', id: c.id, agen: sub ?? c.input.subagent_type, deskripsi: c.input.description ?? '', oleh: agen });
        } else out.push({ jenis: 'alat', id: c.id, nama: c.name, ringkas: ringkasAlat(c.name, c.input), agen });
      }
    }
  } else if (o.type === 'user') {
    for (const c of o.message?.content ?? []) {
      if (c.type !== 'tool_result') continue;
      out.push({ jenis: 'hasil', id: c.tool_use_id, galat: !!c.is_error, ringkas: potong(teksHasil(c.content), 300), agen: peta.get(c.tool_use_id) ? peta.get(c.tool_use_id) : agen, selesaiAgen: peta.has(c.tool_use_id) });
    }
  } else if (o.type === 'result') {
    out.push({
      jenis: 'selesai',
      hasil: o.result ?? '',
      galat: !!o.is_error,
      sesi: o.session_id,
      biaya: o.total_cost_usd ?? null,
      durasi: o.duration_ms ?? null,
      giliran: o.num_turns ?? null,
      ditolak: (o.permission_denials ?? []).map((d) => `${d.tool_name}: ${ringkasAlat(d.tool_name, d.tool_input)}`),
    });
  }
  return out;
}

let aktif = null; // { run, proc }
const antrean = [];

function catat(run, ev) {
  ev.t = Date.now();
  fs.appendFileSync(path.join(RUNS, `${run.id}.jsonl`), `${JSON.stringify(ev)}\n`);
  siar('langkah', { run: run.id, ev });
}

function mulaiBerikut() {
  if (aktif || !antrean.length) return;
  const run = antrean.shift();
  const izin = baca(FIZIN, { alatDiizinkan: [] });
  const args = ['-p', '--output-format', 'stream-json', '--verbose', '--permission-mode', 'acceptEdits', '--append-system-prompt-file', path.join(DIR, 'lucifer-papan.md')];
  if (izin.alatDiizinkan?.length) args.push('--allowedTools', ...izin.alatDiizinkan);
  if (izin.model) args.push('--model', izin.model);
  if (run.lanjutSesi) args.push('--resume', run.lanjutSesi);
  const EXE = cariExe();
  const pakaiExe = !!EXE;
  // Kalau server ini dinyalakan dari dalam sesi Claude (mis. aplikasi desktop), buang variabel sesi induk supaya
  // LUCIFER memakai login Claude Code Tuan sendiri, bukan sambungan milik sesi induk.
  const env = { ...process.env, FORCE_COLOR: '0' };
  if (env.CLAUDECODE || env.CLAUDE_CODE_ENTRYPOINT) {
    for (const k of Object.keys(env)) if (/^(CLAUDECODE$|CLAUDE_CODE_|CLAUDE_AGENT_SDK|CLAUDE_PID$|CLAUDE_PREVIEW|ANTHROPIC_BASE_URL$)/.test(k)) delete env[k];
  }
  let proc;
  try {
    // Tanpa shell: perintah Tuan masuk lewat stdin, bukan argumen, jadi tanda kutip/&/| aman.
    proc = spawn(pakaiExe ? EXE : 'claude', args, { cwd: OFFICE, windowsHide: true, shell: !pakaiExe && process.platform === 'win32', env });
  } catch (e) {
    run.status = 'gagal';
    catat(run, { jenis: 'galat', teks: `Gagal menjalankan claude: ${e.message}` });
    simpanRuns();
    return mulaiBerikut();
  }
  aktif = { run, proc };
  run.status = 'jalan';
  run.mulai = Date.now();
  simpanRuns();
  siar('runs', runs.slice(0, 30));
  catat(run, { jenis: 'perintah', teks: run.perintah, lanjut: !!run.lanjutSesi });
  const peta = new Map();
  let sisa = '';
  proc.stdout.setEncoding('utf8');
  proc.stdout.on('data', (chunk) => {
    sisa += chunk;
    let i;
    while ((i = sisa.indexOf('\n')) >= 0) {
      const line = sisa.slice(0, i).trim();
      sisa = sisa.slice(i + 1);
      if (!line) continue;
      let o;
      try {
        o = JSON.parse(line);
      } catch {
        catat(run, { jenis: 'log', teks: potong(line, 400) });
        continue;
      }
      for (const ev of normalisasi(o, peta)) {
        if (ev.sesi) run.sesi = ev.sesi;
        if (ev.jenis === 'selesai') Object.assign(run, { biaya: ev.biaya, ringkasan: potong(ev.hasil, 400), ditolak: ev.ditolak.length });
        catat(run, ev);
      }
    }
  });
  proc.stderr.setEncoding('utf8');
  proc.stderr.on('data', (s) => s.trim() && catat(run, { jenis: 'log', teks: potong(s, 600) }));
  proc.on('error', (e) => catat(run, { jenis: 'galat', teks: e.message }));
  proc.on('close', (code) => {
    if (run.status === 'jalan') run.status = code === 0 ? 'selesai' : 'gagal';
    run.selesai = Date.now();
    catat(run, { jenis: 'tutup', kode: code, status: run.status });
    aktif = null;
    simpanRuns();
    siar('runs', runs.slice(0, 30));
    mulaiBerikut();
  });
  proc.stdin.end(run.perintah);
}

function hentikan(id) {
  if (aktif?.run.id === id) {
    aktif.run.status = 'dihentikan';
    const pid = aktif.proc.pid;
    if (process.platform === 'win32') execFile('taskkill', ['/pid', String(pid), '/T', '/F'], () => {});
    else aktif.proc.kill('SIGTERM');
    return true;
  }
  const i = antrean.findIndex((r) => r.id === id);
  if (i >= 0) {
    const [r] = antrean.splice(i, 1);
    r.status = 'dibatalkan';
    simpanRuns();
    siar('runs', runs.slice(0, 30));
    return true;
  }
  return false;
}

/* ---------------- HTTP ---------------- */

const kirim = (res, kode, data) => {
  res.statusCode = kode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(data));
};
const bacaBody = (req) =>
  new Promise((ok, gagal) => {
    let s = '';
    req.setEncoding('utf8');
    req.on('data', (c) => {
      s += c;
      if (s.length > 64_000) {
        gagal(new Error('terlalu besar'));
        req.destroy();
      }
    });
    req.on('end', () => {
      try {
        ok(JSON.parse(s || '{}'));
      } catch (e) {
        gagal(e);
      }
    });
  });

/** Plugin Vite. */
export function istanaLucifer() {
  let port = 5180;
  return {
    name: 'istana-lucifer',
    configResolved(c) {
      port = c.server.port ?? port;
    },
    transformIndexHtml(html) {
      return html.replace('</head>', `  <meta name="sora-token" content="${TOKEN}" />\n  </head>`);
    },
    configureServer(server) {
      fs.mkdirSync(RUNS, { recursive: true });
      const host = new Set([`localhost:${port}`, `127.0.0.1:${port}`, `[::1]:${port}`]);
      try {
        fs.watch(OFFICE, { recursive: true }, (_e, f) => {
          const n = String(f ?? '').replace(/\\/g, '/');
          if (!n.endsWith('.md') || /(^|\/)(node_modules|\.obsidian|\.git|dist)\//.test(n)) return;
          berubah();
        });
      } catch (e) {
        console.warn('[istana] tidak bisa memantau berkas:', e.message);
      }
      server.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url ?? '/', 'http://x');
        if (!url.pathname.startsWith('/api/')) return next();
        // Tolak permintaan dari situs lain (CSRF) dan DNS rebinding.
        const origin = req.headers.origin;
        if (!host.has(req.headers.host ?? '') || (origin && !host.has(origin.replace(/^https?:\/\//, '')))) return kirim(res, 403, { galat: 'asal tidak diizinkan' });
        if ((req.headers['x-sora-token'] ?? url.searchParams.get('t')) !== TOKEN) return kirim(res, 403, { galat: 'token salah' });
        try {
          if (req.method === 'GET' && url.pathname === '/api/keadaan') return kirim(res, 200, { ...keadaan(), aktif: aktif?.run.id ?? null, antrean: antrean.map((r) => r.id) });
          if (req.method === 'GET' && url.pathname === '/api/acara') {
            res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-store', Connection: 'keep-alive' });
            res.write(': halo\n\n');
            klien.add(res);
            const nadi = setInterval(() => res.write(': nadi\n\n'), 20_000);
            req.on('close', () => {
              clearInterval(nadi);
              klien.delete(res);
            });
            return;
          }
          if (req.method === 'GET' && url.pathname === '/api/run') {
            const id = url.searchParams.get('id') ?? '';
            if (!/^[\w-]+$/.test(id)) return kirim(res, 400, { galat: 'id salah' });
            const f = path.join(RUNS, `${id}.jsonl`);
            const ev = fs.existsSync(f) ? fs.readFileSync(f, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l)) : [];
            return kirim(res, 200, { ev });
          }
          if (req.method === 'GET' && url.pathname === '/api/berkas') {
            const p = path.resolve(OFFICE, url.searchParams.get('p') ?? '');
            if (!p.startsWith(OFFICE + path.sep) || !/\.(md|csv|txt|json)$/i.test(p) || !fs.existsSync(p)) return kirim(res, 404, { galat: 'tidak ada' });
            return kirim(res, 200, { p: rel(p), teks: fs.readFileSync(p, 'utf8').slice(0, 300_000) });
          }
          if (req.method === 'POST' && url.pathname === '/api/perintah') {
            const b = await bacaBody(req);
            const teks = String(b.teks ?? '').trim();
            if (!teks) return kirim(res, 400, { galat: 'perintah kosong' });
            const dulu = runs.find((r) => r.sesi);
            const run = { id: `${new Date().toISOString().replace(/[:.]/g, '-')}-${crypto.randomBytes(2).toString('hex')}`, perintah: teks.slice(0, 8000), status: 'antre', dibuat: Date.now(), lanjutSesi: b.lanjut && dulu ? dulu.sesi : null };
            runs.unshift(run);
            antrean.push(run);
            simpanRuns();
            siar('runs', runs.slice(0, 30));
            mulaiBerikut();
            return kirim(res, 200, { id: run.id });
          }
          if (req.method === 'POST' && url.pathname === '/api/hentikan') {
            const b = await bacaBody(req);
            return kirim(res, 200, { ok: hentikan(String(b.id ?? '')) });
          }
          if (req.method === 'POST' && url.pathname === '/api/divisi') {
            const b = await bacaBody(req);
            const key = String(b.key ?? '');
            const email = String(b.email ?? '').trim();
            if (!/^[a-z]+$/.test(key) || (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) return kirim(res, 400, { galat: 'email tidak valid' });
            const d = baca(FDIVISI, {});
            d[key] = { ...(d[key] ?? {}), email, tugas: String(b.tugas ?? d[key]?.tugas ?? '').slice(0, 200) };
            tulis(FDIVISI, d);
            siar('keadaan', keadaan());
            return kirim(res, 200, { ok: true });
          }
          if (req.method === 'POST' && url.pathname === '/api/performa') {
            const b = await bacaBody(req);
            const ch = String(b.channel ?? '');
            if (!/^channel-\d+$/.test(ch)) return kirim(res, 400, { galat: 'channel tidak valid' });
            const f = path.join(OFFICE, 'channels', ch, 'performa.csv');
            if (!fs.existsSync(f)) return kirim(res, 404, { galat: 'performa.csv tidak ada' });
            const ada = fs.readFileSync(f, 'utf8');
            const kolom = ada.split(/\r?\n/)[0].split(',');
            const isi = b.baris ?? {};
            if (!isi.id_video || !isi.platform) return kirim(res, 400, { galat: 'id_video dan platform wajib' });
            const sel = kolom.map((k) => String(isi[k] ?? '').replace(/[,\r\n"]/g, ' ').trim().slice(0, 80));
            fs.appendFileSync(f, `${ada.endsWith('\n') ? '' : '\n'}${sel.join(',')}\n`);
            return kirim(res, 200, { ok: true });
          }
          return kirim(res, 404, { galat: 'tidak ada' });
        } catch (e) {
          return kirim(res, 500, { galat: String(e.message ?? e) });
        }
      });
    },
  };
}
