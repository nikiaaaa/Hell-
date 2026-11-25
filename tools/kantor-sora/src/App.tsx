import { useEffect, useMemo, useRef, useState } from 'react';
import { api, dengar, obsidian, statusAgen, type Catatan, type Keadaan, type Langkah, type Produksi, type Run, type StatusAgen } from './data';
import { Istana } from './Istana';
import { AGEN, DIVISI, LUCIFER, agenDari, divisiDari, warnaAgen } from './sora';

type Tab = 'perintah' | 'produksi' | 'otak' | 'divisi';
const HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
const jam = (ms?: number) => (ms ? new Date(ms).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '');
const lalu = (ms: number) => {
  const d = Math.max(0, (Date.now() - ms) / 1000);
  if (d < 60) return 'baru saja';
  if (d < 3600) return `${Math.floor(d / 60)} mnt lalu`;
  if (d < 86400) return `${Math.floor(d / 3600)} jam lalu`;
  return `${Math.floor(d / 86400)} hari lalu`;
};
const namaAgen = (k: string | null | undefined) => (!k ? LUCIFER.nama : (agenDari(k)?.nama ?? k.toUpperCase()));
const LABEL_RUN: Record<Run['status'], string> = { antre: 'antre', jalan: 'berjalan', selesai: 'selesai', gagal: 'gagal', dihentikan: 'dihentikan', dibatalkan: 'dibatalkan', terputus: 'terputus' };
const CONTOH = ['LUCIFER, cek status semua produksi.', 'LUCIFER, produksi 3 video hari ini untuk channel-01.', 'LUCIFER, minta PATIENCE bikin laporan minggu ini.'];

export default function App() {
  const [k, setK] = useState<Keadaan | null>(null);
  const [langkah, setLangkah] = useState<Record<string, Langkah[]>>({});
  const [pilihRun, setPilihRun] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('perintah');
  const [papan, setPapan] = useState(true);
  const [sambung, setSambung] = useState(false);
  const [lihat, setLihat] = useState<{ p: string; teks: string } | null>(null);
  const [detail, setDetail] = useState<string | null>(null);
  const [teks, setTeks] = useState('');
  const [galat, setGalat] = useState('');
  const [now, setNow] = useState(() => new Date());
  const host = useRef<HTMLDivElement>(null);
  const istana = useRef<Istana | null>(null);
  const labelRef = useRef(new Map<string, HTMLElement>());

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  // Scene 3D.
  useEffect(() => {
    if (!host.current) return;
    const s = new Istana(host.current, {
      onKlikOtak: () => {
        setTab('otak');
        setPapan(true);
      },
    });
    istana.current = s;
    for (const [key, el] of labelRef.current) s.pasangLabel(key, el);
    return () => {
      s.dispose();
      istana.current = null;
    };
  }, []);
  const refLabel = (key: string) => (el: HTMLElement | null) => {
    if (el) labelRef.current.set(key, el);
    else labelRef.current.delete(key);
    istana.current?.pasangLabel(key, el);
  };

  // Data server + aliran langsung.
  useEffect(() => {
    api<Keadaan>('/api/keadaan')
      .then(setK)
      .catch((e) => setGalat(String(e.message)));
    return dengar({
      keadaan: (x) => setK((lama) => ({ ...(lama ?? { aktif: null, antrean: [] }), ...x })),
      runs: (runs) => setK((lama) => (lama ? { ...lama, runs } : lama)),
      langkah: (run, ev) => setLangkah((L) => ({ ...L, [run]: [...(L[run] ?? []), ev] })),
      status: setSambung,
    });
  }, []);

  const runs = k?.runs ?? [];
  const aktif = runs.find((r) => r.status === 'jalan') ?? null;
  const runDipilih = pilihRun ?? aktif?.id ?? runs[0]?.id ?? null;
  // Muat langkah perintah yang dipilih / sedang jalan (sekali), lalu sisanya lewat aliran.
  const dimuat = useRef(new Set<string>());
  useEffect(() => {
    for (const id of [runDipilih, aktif?.id]) {
      if (!id || dimuat.current.has(id)) continue;
      dimuat.current.add(id);
      api<{ ev: Langkah[] }>(`/api/run?id=${encodeURIComponent(id)}`).then(({ ev }) =>
        setLangkah((L) => {
          const live = L[id] ?? [];
          const akhir = ev.length ? ev[ev.length - 1]!.t : 0;
          return { ...L, [id]: [...ev, ...live.filter((x) => x.t > akhir)] };
        }),
      );
    }
  }, [runDipilih, aktif?.id]);

  const status = useMemo(() => statusAgen(k?.produksi ?? [], aktif ? (langkah[aktif.id] ?? []) : [], !!aktif), [k?.produksi, aktif, langkah]);
  useEffect(() => istana.current?.setStatus(status), [status]);
  useEffect(() => {
    if (k?.vault) istana.current?.setVault(k.vault.catatan);
  }, [k?.vault]);
  useEffect(() => {
    for (const d of DIVISI) istana.current?.setEmail(d.key, k?.divisi?.[d.key]?.email ?? '');
  }, [k?.divisi]);

  const semua = [...AGEN.map((a) => a.key), LUCIFER.key];
  const bekerja = semua.filter((x) => status[x]?.kerja).length;
  const keputusan = semua.flatMap((x) => [...(status[x]?.menunggu ?? []).map((t) => ({ x, t, mendesak: false })), ...(status[x]?.mendesak ?? []).map((t) => ({ x, t, mendesak: true }))]);

  const bukaBerkas = (p: string) =>
    api<{ p: string; teks: string }>(`/api/berkas?p=${encodeURIComponent(p)}`)
      .then(setLihat)
      .catch(() => setGalat(`Berkas tidak ditemukan: ${p}`));

  /** Kirim perintah siap pakai (tombol gerbang, laporan PATIENCE) langsung ke LUCIFER. */
  const kirimLangsung = async (isi: string) => {
    setGalat('');
    try {
      const { id } = await api<{ id: string }>('/api/perintah', { teks: isi, lanjut: false });
      setPilihRun(id);
      dimuat.current.add(id);
      setTab('perintah');
    } catch (e) {
      setGalat(String((e as Error).message));
    }
  };

  const kirim = async (lanjut: boolean) => {
    const isi = teks.trim();
    if (!isi) return;
    setGalat('');
    try {
      const { id } = await api<{ id: string }>('/api/perintah', { teks: isi, lanjut });
      setTeks('');
      setPilihRun(id);
      dimuat.current.add(id);
    } catch (e) {
      setGalat(String((e as Error).message));
    }
  };

  return (
    <div className="ist" data-papan={papan || undefined}>
      <div className="ist-panggung">
        <div ref={host} className="ist-kanvas" />
        <div className="ist-lapis">
          {[...AGEN, { ...LUCIFER, tugas: LUCIFER.tugas }].map((a) => (
            <LabelAgen key={a.key} k={a.key} nama={a.nama} s={status[a.key]} refFn={refLabel(a.key)} onBuka={() => setDetail(a.key)} />
          ))}
          {DIVISI.map((d) => (
            <div key={d.key} className="ist-div" ref={refLabel(`div:${d.key}`)} style={{ ['--w' as string]: d.warna }}>
              <button
                type="button"
                onClick={() => {
                  setTab('divisi');
                  setPapan(true);
                }}
              >
                <b>
                  {d.lambang} {d.nama}
                </b>
                <small>{k?.divisi?.[d.key]?.email || 'email belum diisi'}</small>
              </button>
            </div>
          ))}
          <div className="ist-otak" ref={refLabel('otak')}>
            <button
              type="button"
              onClick={() => {
                setTab('otak');
                setPapan(true);
              }}
            >
              🧠 Second Brain <small>{k ? `${k.vault.jumlah} catatan` : '…'}</small>
            </button>
          </div>
        </div>
      </div>

      <header className="ist-hud">
        <div className="ist-merek">
          <span className="ist-api" data-on={sambung || undefined} />
          <div>
            <b>Istana LUCIFER</b>
            <small>
              Studio SORA · {bekerja} bekerja · {semua.length - bekerja} siaga · {aktif ? 'LUCIFER sedang bekerja' : 'menunggu perintah'}
              {!sambung && ' · terputus dari server'}
            </small>
          </div>
        </div>
        <div className="ist-jam">
          <b>{`${String(now.getHours()).padStart(2, '0')}.${String(now.getMinutes()).padStart(2, '0')}`}</b>
          <small>
            {HARI[now.getDay()]}, {now.getDate()} {BULAN[now.getMonth()]} {now.getFullYear()}
          </small>
        </div>
      </header>

      <aside className="ist-keputusan">
        <h2>Butuh keputusan Tuan</h2>
        {keputusan.length ? (
          <ul>
            {keputusan.map((x, i) => (
              <li key={i} data-mendesak={x.mendesak || undefined}>
                <b style={{ color: warnaAgen(x.x) }}>{namaAgen(x.x === 'lucifer' ? null : x.x)}</b> {x.t}
              </li>
            ))}
          </ul>
        ) : (
          <p>Tidak ada. Semua tenang.</p>
        )}
        <p className="ist-petunjuk">Seret untuk memutar · gulir untuk zoom · klik dua kali untuk reset</p>
      </aside>

      <button type="button" className="ist-togel" onClick={() => setPapan((b) => !b)} aria-expanded={papan}>
        {papan ? '⟩' : '⟨ Papan'}
      </button>

      {papan && (
        <section className="ist-papan" aria-label="Papan perintah">
          <nav className="ist-tab">
            {(
              [
                ['perintah', '🔥 Perintah'],
                ['produksi', '🎬 Produksi'],
                ['otak', '🧠 Second Brain'],
                ['divisi', '✉ Divisi'],
              ] as [Tab, string][]
            ).map(([id, n]) => (
              <button key={id} type="button" aria-pressed={tab === id} onClick={() => setTab(id)}>
                {n}
              </button>
            ))}
          </nav>
          {galat && (
            <p className="ist-galat" onClick={() => setGalat('')}>
              ⚠ {galat}
            </p>
          )}
          {k && k.claude === null && <p className="ist-galat">⚠ Claude Code CLI tidak ditemukan di komputer ini; perintah akan dicoba lewat PATH.</p>}
          {tab === 'perintah' && (
            <TabPerintah
              teks={teks}
              setTeks={setTeks}
              kirim={kirim}
              runs={runs}
              aktif={aktif}
              dipilih={runDipilih}
              pilih={setPilihRun}
              langkah={runDipilih ? (langkah[runDipilih] ?? []) : []}
              bisaLanjut={runs.some((r) => r.sesi)}
              izin={k?.izin ?? []}
            />
          )}
          {tab === 'produksi' && <TabProduksi produksi={k?.produksi ?? []} buka={bukaBerkas} perintah={kirimLangsung} biaya={k?.biaya ?? 0} setGalat={setGalat} />}
          {tab === 'otak' && k && <TabOtak vault={k.vault} buka={bukaBerkas} />}
          {tab === 'divisi' && <TabDivisi divisi={k?.divisi ?? {}} status={status} />}
        </section>
      )}

      {detail && (
        <DetailAgen
          k={detail}
          s={status[detail]}
          langkah={aktif ? (langkah[aktif.id] ?? []) : []}
          tutup={() => setDetail(null)}
          perintah={(x) => {
            setTeks(x);
            setTab('perintah');
            setPapan(true);
            setDetail(null);
          }}
        />
      )}

      {lihat && (
        <div className="ist-modal" role="dialog" aria-label={lihat.p} onClick={() => setLihat(null)}>
          <div className="ist-modal-in" onClick={(e) => e.stopPropagation()}>
            <header>
              <b>{lihat.p}</b>
              {k && lihat.p.endsWith('.md') && (
                <a href={obsidian(k.vault.nama, lihat.p)} className="ist-obs">
                  Buka di Obsidian
                </a>
              )}
              <button type="button" onClick={() => setLihat(null)}>
                Tutup
              </button>
            </header>
            <pre>{lihat.teks}</pre>
          </div>
        </div>
      )}
    </div>
  );
}

function LabelAgen({ k, nama, s, refFn, onBuka }: { k: string; nama: string; s?: StatusAgen; refFn: (el: HTMLElement | null) => void; onBuka: () => void }) {
  const kerja = !!s?.kerja;
  return (
    <div className="ist-lb" ref={refFn} data-kerja={kerja || undefined} data-raja={k === 'lucifer' || undefined} style={{ ['--w' as string]: warnaAgen(k) }}>
      <div className="ist-lb-in">
        {kerja && s?.gelembung && <p className="ist-gel">{s.gelembung}</p>}
        <button type="button" className="ist-nama" onClick={onBuka}>
          <i />
          {nama}
          <span>{kerja ? s?.label : 'siaga'}</span>
          <em> · baca Second Brain</em>
        </button>
        {!!s?.menunggu.length && <span className="ist-seru">!</span>}
        {!!s?.mendesak.length && <span className="ist-seru ist-merah">⚠</span>}
      </div>
    </div>
  );
}

function TabPerintah(p: {
  teks: string;
  setTeks: (s: string) => void;
  kirim: (lanjut: boolean) => void;
  runs: Run[];
  aktif: Run | null;
  dipilih: string | null;
  pilih: (id: string) => void;
  langkah: Langkah[];
  bisaLanjut: boolean;
  izin: string[];
}) {
  const bawah = useRef<HTMLDivElement>(null);
  useEffect(() => {
    bawah.current?.scrollIntoView({ block: 'end' });
  }, [p.langkah.length, p.dipilih]);
  const run = p.runs.find((r) => r.id === p.dipilih);
  return (
    <div className="ist-isi">
      <div className="ist-tulis">
        <textarea
          value={p.teks}
          onChange={(e) => p.setTeks(e.target.value)}
          placeholder="Perintah untuk LUCIFER… (Ctrl+Enter = kirim)"
          rows={3}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) p.kirim(false);
          }}
        />
        <div className="ist-tombol">
          <button type="button" className="ist-utama" disabled={!p.teks.trim()} onClick={() => p.kirim(false)} title="Mulai percakapan baru dengan LUCIFER">
            Kirim perintah baru
          </button>
          <button type="button" disabled={!p.teks.trim() || !p.bisaLanjut} onClick={() => p.kirim(true)} title="Balas di percakapan terakhir (mis. memilih hook di Gerbang 1)">
            Balas / lanjutkan
          </button>
          {p.aktif && (
            <button type="button" className="ist-stop" onClick={() => api('/api/hentikan', { id: p.aktif!.id })}>
              ■ Hentikan
            </button>
          )}
        </div>
        <div className="ist-chip">
          {CONTOH.map((c) => (
            <button key={c} type="button" onClick={() => p.setTeks(c)}>
              {c.replace('LUCIFER, ', '')}
            </button>
          ))}
        </div>
      </div>

      {p.runs.length > 0 && (
        <ol className="ist-runs">
          {p.runs.slice(0, 12).map((r) => (
            <li key={r.id}>
              <button type="button" aria-pressed={r.id === p.dipilih} onClick={() => p.pilih(r.id)}>
                <span className="ist-pil" data-s={r.status}>
                  {LABEL_RUN[r.status]}
                </span>
                <span className="ist-runs-t">{r.perintah}</span>
                <small>{jam(r.mulai ?? r.dibuat)}</small>
              </button>
            </li>
          ))}
        </ol>
      )}

      <div className="ist-log">
        {!run && <p className="ist-kosong">Belum ada perintah. Tulis perintah di atas; setiap langkah LUCIFER dan para agen akan tertulis di sini.</p>}
        {run && (
          <p className="ist-log-kepala">
            <span className="ist-pil" data-s={run.status}>
              {LABEL_RUN[run.status]}
            </span>{' '}
            {run.lanjutSesi ? 'balasan di percakapan sebelumnya' : 'percakapan baru'} · mulai {jam(run.mulai ?? run.dibuat)}
            {run.selesai ? ` · selesai ${jam(run.selesai)}` : ''}
          </p>
        )}
        {p.langkah.map((l, i) => (
          <BarisLangkah key={i} l={l} izin={p.izin} />
        ))}
        {run?.status === 'jalan' && <p className="ist-ketik">LUCIFER sedang bekerja…</p>}
        <div ref={bawah} />
      </div>
    </div>
  );
}

function Siapa({ k }: { k: string | null }) {
  return (
    <b className="ist-siapa" style={{ color: warnaAgen(k) }}>
      {namaAgen(k)}
    </b>
  );
}

function BarisLangkah({ l, izin }: { l: Langkah; izin: string[] }) {
  switch (l.jenis) {
    case 'perintah':
      return (
        <div className="ist-l ist-l-tuan">
          <span className="ist-w">{jam(l.t)}</span>
          <b>👑 Tuan{l.lanjut ? ' (balasan)' : ''}:</b> <span className="ist-pre">{l.teks}</span>
        </div>
      );
    case 'mulai':
      return (
        <div className="ist-l ist-l-sis">
          <span className="ist-w">{jam(l.t)}</span>⚙ Sesi dimulai · {l.model}
        </div>
      );
    case 'teks':
      return (
        <div className="ist-l ist-l-teks" style={{ ['--w' as string]: warnaAgen(l.agen) }}>
          <span className="ist-w">{jam(l.t)}</span>
          <Siapa k={l.agen} />
          <div className="ist-pre">{l.teks}</div>
        </div>
      );
    case 'tugaskan':
      return (
        <div className="ist-l ist-l-tugas" style={{ ['--w' as string]: warnaAgen(l.agen) }}>
          <span className="ist-w">{jam(l.t)}</span>📜 <Siapa k={l.oleh} /> memanggil <Siapa k={l.agen} /> — {l.deskripsi}
        </div>
      );
    case 'alat':
      return (
        <div className="ist-l ist-l-alat">
          <span className="ist-w">{jam(l.t)}</span>🔧 <Siapa k={l.agen} /> <code>{l.nama}</code> <span className="ist-pre">{l.ringkas}</span>
        </div>
      );
    case 'hasil':
      return l.selesaiAgen ? (
        <div className="ist-l ist-l-selesai" style={{ ['--w' as string]: warnaAgen(l.agen) }}>
          <span className="ist-w">{jam(l.t)}</span>
          {l.galat ? '❌' : '✅'} <Siapa k={l.agen} /> melapor: <span className="ist-pre">{l.ringkas}</span>
        </div>
      ) : (
        <div className={`ist-l ist-l-hasil${l.galat ? ' ist-l-galat' : ''}`}>
          <span className="ist-w">{jam(l.t)}</span>
          {l.galat ? '⚠ ' : '↳ '}
          {l.ringkas || '(tanpa keluaran)'}
        </div>
      );
    case 'selesai':
      return (
        <div className="ist-l ist-l-akhir" data-galat={l.galat || undefined}>
          <h3>🔥 Hasil akhir LUCIFER</h3>
          <div className="ist-pre">{l.hasil}</div>
          {/not logged in|\/login/i.test(l.hasil) && (
            <p className="ist-tolak">
              Claude Code CLI belum login (login aplikasi desktop tidak ikut terpakai). Sekali saja: buka PowerShell biasa, jalankan perintah login di
              tools/kantor-sora/README.md (bagian "Login sekali"), ketik <code>/login</code>, lalu kirim ulang perintahnya.
            </p>
          )}
          <small>
            {l.durasi ? `${Math.round(l.durasi / 1000)} dtk` : ''}
            {l.giliran ? ` · ${l.giliran} giliran` : ''}
            {l.biaya != null ? ` · ≈ $${l.biaya.toFixed(3)}` : ''}
          </small>
          {l.ditolak.length > 0 && (
            <div className="ist-tolak">
              <b>Alat yang ditolak (tidak ada di izin):</b>
              <ul>
                {l.ditolak.map((d, i) => (
                  <li key={i}>{d}</li>
                ))}
              </ul>
              <small>Tambahkan di tools/kantor-sora/server/izin.json kalau memang perlu, lalu kirim ulang. Sekarang diizinkan: {izin.length} aturan.</small>
            </div>
          )}
        </div>
      );
    case 'tutup':
      return (
        <div className="ist-l ist-l-sis">
          <span className="ist-w">{jam(l.t)}</span>■ Proses ditutup ({l.status}
          {l.kode != null ? `, kode ${l.kode}` : ''})
        </div>
      );
    default:
      return (
        <div className={`ist-l ist-l-sis${l.jenis === 'galat' ? ' ist-l-galat' : ''}`}>
          <span className="ist-w">{jam(l.t)}</span>
          {l.teks}
        </div>
      );
  }
}

/** Tombol cepat untuk gerbang yang sedang menunggu Tuan (tahap sebelumnya sudah ✅). */
function TombolGerbang({ id, tahap, perintah }: { id: string; tahap: string; perintah: (t: string) => void }) {
  const [hook, setHook] = useState('');
  const t = tahap.toLowerCase();
  if (t.includes('gerbang 1'))
    return (
      <div className="ist-gerbang">
        <input value={hook} onChange={(e) => setHook(e.target.value)} placeholder="hook A / B / C + catatan" />
        <button type="button" disabled={!hook.trim()} onClick={() => perintah(`LUCIFER, Gerbang 1 ${id}: pakai hook ${hook.trim()}. Naskah disetujui, lanjutkan ke prompt VO.`)}>
          ✔ Setujui naskah
        </button>
      </div>
    );
  if (t.includes('suara'))
    return (
      <div className="ist-gerbang">
        <button type="button" onClick={() => perintah(`LUCIFER, VO ElevenLabs untuk ${id} sudah saya taruh di productions/${id}/audio/vo.mp3. Lanjutkan dari tahap Audio.`)}>
          🎙 VO sudah di audio/vo.mp3
        </button>
      </div>
    );
  if (t.includes('gerbang 2'))
    return (
      <div className="ist-gerbang">
        <button type="button" onClick={() => perintah(`LUCIFER, ${id} sudah saya tonton dan upload sendiri. Tandai Gerbang 2 selesai.`)}>✔ Sudah diupload</button>
      </div>
    );
  return null;
}

const KOLOM_PERFORMA: [string, string][] = [
  ['views', 'views'],
  ['rata2_durasi_tonton_detik', 'rata² tonton (dtk)'],
  ['persen_tonton_sampai_habis', '% tonton habis'],
  ['like', 'like'],
  ['komentar', 'komentar'],
  ['share', 'share'],
  ['simpan', 'simpan'],
  ['follower_baru', 'follower baru'],
];

/** Form satu baris performa.csv (diisi Tuan 2–3 hari setelah tayang). */
function FormPerforma({ produksi, setGalat }: { produksi: Produksi[]; setGalat: (s: string) => void }) {
  const [buka, setBuka] = useState(false);
  const [isi, setIsi] = useState<Record<string, string>>({ platform: 'TikTok', jam_tayang: '19:00' });
  const [ok, setOk] = useState('');
  const pilih = produksi.find((p) => p.id === isi.id_video);
  const simpan = async () => {
    setOk('');
    try {
      await api('/api/performa', { channel: pilih?.channel || 'channel-01', baris: isi });
      setOk(`tersimpan: ${isi.id_video} · ${isi.platform}`);
      setIsi((x) => ({ id_video: x.id_video ?? '', platform: x.platform ?? 'TikTok', tanggal_tayang: x.tanggal_tayang ?? '', jam_tayang: x.jam_tayang ?? '' }));
    } catch (e) {
      setGalat(String((e as Error).message));
    }
  };
  if (!buka)
    return (
      <button type="button" className="ist-link" onClick={() => setBuka(true)}>
        ＋ Isi performa video
      </button>
    );
  const ubah = (k: string) => (e: { target: { value: string } }) => setIsi((x) => ({ ...x, [k]: e.target.value }));
  return (
    <div className="ist-performa">
      <select value={isi.id_video ?? ''} onChange={ubah('id_video')}>
        <option value="">— pilih video —</option>
        {produksi.map((p) => (
          <option key={p.id} value={p.id}>
            {p.id}
          </option>
        ))}
      </select>
      <select value={isi.platform} onChange={ubah('platform')}>
        {['TikTok', 'YouTube Shorts', 'Instagram Reels', 'Facebook Reels'].map((x) => (
          <option key={x}>{x}</option>
        ))}
      </select>
      <input type="date" value={isi.tanggal_tayang ?? ''} onChange={ubah('tanggal_tayang')} />
      <input type="time" value={isi.jam_tayang ?? ''} onChange={ubah('jam_tayang')} />
      {KOLOM_PERFORMA.map(([k, n]) => (
        <input key={k} inputMode="decimal" placeholder={n} value={isi[k] ?? ''} onChange={ubah(k)} />
      ))}
      <button type="button" disabled={!isi.id_video} onClick={simpan}>
        Simpan ke performa.csv
      </button>
      <button type="button" className="ist-link" onClick={() => setBuka(false)}>
        tutup
      </button>
      {ok && <small>✔ {ok}</small>}
    </div>
  );
}

function TabProduksi({
  produksi,
  buka,
  perintah,
  biaya,
  setGalat,
}: {
  produksi: Produksi[];
  buka: (p: string) => void;
  perintah: (t: string) => void;
  biaya: number;
  setGalat: (s: string) => void;
}) {
  const ringkas = (
    <div className="ist-ringkas">
      <small>💸 Biaya Claude (riwayat perintah tersimpan): ${biaya.toFixed(2)}</small>
      <button type="button" className="ist-link" onClick={() => perintah('LUCIFER, minta PATIENCE bikin laporan minggu ini untuk channel-01.')}>
        📊 Minta laporan PATIENCE
      </button>
      <FormPerforma produksi={produksi} setGalat={setGalat} />
    </div>
  );
  if (!produksi.length)
    return (
      <div className="ist-isi">
        {ringkas}
        <p className="ist-kosong">Belum ada folder produksi.</p>
      </div>
    );
  return (
    <div className="ist-isi">
      {ringkas}
      {produksi.map((p) => {
        const kerja = p.baris.filter((b) => !/gerbang/i.test(b.tahap));
        const beres = kerja.filter((b) => b.status === '✅').length;
        return (
          <article key={p.id} className="ist-prod">
            <header>
              <b>{p.judul || p.id}</b>
              <small>
                {p.id} · {p.channel} · diubah {lalu(p.diubah)}
              </small>
              <div className="ist-bar">
                <i style={{ width: `${(beres / Math.max(1, kerja.length)) * 100}%` }} />
              </div>
              <small>
                {beres}/{kerja.length} tahap beres ·{' '}
                <button type="button" className="ist-link" onClick={() => buka(`productions/${p.id}/status.md`)}>
                  status.md
                </button>
              </small>
            </header>
            <table>
              <tbody>
                {p.baris.map((b, i) => (
                  <tr key={i} data-gerbang={/gerbang/i.test(b.tahap) || undefined} data-s={b.status}>
                    <td>{b.status || '·'}</td>
                    <td>{b.tahap}</td>
                    <td style={{ color: b.agen === 'tuan' ? '#ffd27a' : warnaAgen(b.agen === 'lucifer' ? null : b.agen) }}>{b.agen.toUpperCase()}</td>
                    <td>
                      {b.file
                        .split(',')
                        .map((f) => f.trim())
                        .filter((f) => f && f !== '—')
                        .map((f) =>
                          f.endsWith('.md') ? (
                            <button key={f} type="button" className="ist-link" onClick={() => buka(`productions/${p.id}/${f}`)}>
                              {f}
                            </button>
                          ) : (
                            <span key={f} className="ist-redup">
                              {f}{' '}
                            </span>
                          ),
                        )}
                      {b.catatan && <div className="ist-cat">{b.catatan}</div>}
                      {/gerbang/i.test(b.tahap) && b.status === '⏳' && i > 0 && p.baris[i - 1]?.status === '✅' && (
                        <TombolGerbang id={p.id} tahap={b.tahap} perintah={perintah} />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </article>
        );
      })}
    </div>
  );
}

function TabOtak({ vault, buka }: { vault: Keadaan['vault']; buka: (p: string) => void }) {
  const [cari, setCari] = useState('');
  const folder = useMemo(() => {
    const m = new Map<string, number>();
    for (const c of vault.catatan) m.set(c.folder, (m.get(c.folder) ?? 0) + 1);
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [vault]);
  const daftar = useMemo(() => {
    const q = cari.trim().toLowerCase();
    return [...vault.catatan].filter((c: Catatan) => !q || c.p.toLowerCase().includes(q) || c.judul.toLowerCase().includes(q)).sort((a, b) => b.diubah - a.diubah);
  }, [vault, cari]);
  const tautan = vault.catatan.reduce((n, c) => n + c.tautan.length, 0);
  return (
    <div className="ist-isi">
      <p className="ist-otak-ring">
        Vault Obsidian <b>{vault.nama}</b>: {vault.jumlah} catatan · {tautan} tautan. Bola di tengah istana = catatan ini (putih = diubah 20 menit terakhir).
      </p>
      <div className="ist-folder">
        {folder.map(([f, n]) => (
          <button key={f} type="button" onClick={() => setCari(f === '(akar)' ? '' : `${f}/`)}>
            {f} <small>{n}</small>
          </button>
        ))}
      </div>
      <input className="ist-cari" value={cari} onChange={(e) => setCari(e.target.value)} placeholder="Cari catatan…" />
      <ul className="ist-catatan">
        {daftar.slice(0, 250).map((c) => (
          <li key={c.p}>
            <button type="button" onClick={() => buka(c.p)}>
              <b>{c.judul}</b>
              <small>
                {c.p} · {lalu(c.diubah)} · {c.tautan.length} tautan
              </small>
            </button>
            <a href={obsidian(vault.nama, c.p)} title="Buka di Obsidian">
              ↗
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

function TabDivisi({ divisi, status }: { divisi: Keadaan['divisi']; status: Record<string, StatusAgen> }) {
  return (
    <div className="ist-isi">
      <p className="ist-otak-ring">Satu alamat email untuk tiap divisi. Hanya dicatat dan ditampilkan di istana; LUCIFER tidak login ke email apa pun.</p>
      {DIVISI.map((d) => (
        <KartuDivisi key={d.key} d={d} data={divisi[d.key] ?? {}} status={status} />
      ))}
    </div>
  );
}

function KartuDivisi({ d, data, status }: { d: (typeof DIVISI)[number]; data: { email?: string; tugas?: string }; status: Record<string, StatusAgen> }) {
  const [email, setEmail] = useState(data.email ?? '');
  const [tugas, setTugas] = useState(data.tugas ?? '');
  const [pesan, setPesan] = useState('');
  useEffect(() => {
    setEmail(data.email ?? '');
    setTugas(data.tugas ?? '');
  }, [data.email, data.tugas]);
  const simpan = async () => {
    try {
      await api('/api/divisi', { key: d.key, email, tugas });
      setPesan('Tersimpan ✓');
    } catch (e) {
      setPesan(String((e as Error).message));
    }
  };
  return (
    <article className="ist-kartu" style={{ ['--w' as string]: d.warna }}>
      <header>
        <b>
          {d.lambang} {d.nama}
        </b>
        <small>
          dipimpin {d.dosa.toUpperCase()} · penjaga {d.hewan}
        </small>
      </header>
      <ul>
        {AGEN.filter((a) => a.divisi === d.key).map((a) => (
          <li key={a.key}>
            <b style={{ color: a.warna }}>{a.nama}</b> {a.kepala ? '(kepala)' : ''} — {a.tugas} · <i>{status[a.key]?.kerja ? status[a.key]!.label : 'siaga'}</i>
          </li>
        ))}
      </ul>
      <label>
        Email divisi
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nama@contoh.com" />
      </label>
      <label>
        Untuk apa email ini
        <input value={tugas} onChange={(e) => setTugas(e.target.value)} placeholder="mis. kerja sama brand, laporan, akun platform…" />
      </label>
      <button type="button" className="ist-utama" onClick={simpan}>
        Simpan
      </button>{' '}
      <small>{pesan}</small>
    </article>
  );
}

function DetailAgen({ k, s, langkah, tutup, perintah }: { k: string; s?: StatusAgen; langkah: Langkah[]; tutup: () => void; perintah: (t: string) => void }) {
  const a = agenDari(k);
  const nama = a?.nama ?? LUCIFER.nama;
  const milik = langkah.filter((l) => ('agen' in l && l.agen === (k === 'lucifer' ? null : k)) || (l.jenis === 'tugaskan' && l.agen === k)).slice(-10);
  return (
    <div className="ist-modal" role="dialog" aria-label={nama} onClick={tutup}>
      <div className="ist-modal-in ist-detail" onClick={(e) => e.stopPropagation()} style={{ ['--w' as string]: warnaAgen(k) }}>
        <header>
          <b>{nama}</b>
          <small>
            {a ? `${a.tugas} · ${divisiDari(a.divisi).nama} · ${a.jenis === 'dosa' ? 'Dosa' : 'Kebajikan'}` : LUCIFER.tugas}
          </small>
          <button type="button" onClick={tutup}>
            Tutup
          </button>
        </header>
        <p>
          Sekarang: <b>{s?.kerja ? s.label : 'siaga, menunggu perintah'}</b>
        </p>
        {s?.gelembung && <p className="ist-gel-detail">{s.gelembung}</p>}
        {s?.terakhir && <p>Terakhir selesai: {s.terakhir}</p>}
        {!!s?.mendesak.length && <p className="ist-l-galat">⚠ {s.mendesak.join(' · ')}</p>}
        {!!s?.menunggu.length && (
          <ul>
            {s.menunggu.map((w, i) => (
              <li key={i}>⏳ {w}</li>
            ))}
          </ul>
        )}
        {milik.length > 0 && (
          <div className="ist-log ist-log-kecil">
            {milik.map((l, i) => (
              <BarisLangkah key={i} l={l} izin={[]} />
            ))}
          </div>
        )}
        <button type="button" className="ist-utama" onClick={() => perintah(k === 'lucifer' ? 'LUCIFER, ' : `LUCIFER, minta ${nama} untuk `)}>
          Beri perintah {k === 'lucifer' ? 'ke LUCIFER' : `lewat LUCIFER ke ${nama}`}
        </button>
      </div>
    </div>
  );
}
