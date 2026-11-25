# 🔥 SORA Studio — Lucifer Castle (`Hell-`)

Studio short video otomatis yang berjalan di **Claude Code**. Satu orkestrator, **LUCIFER**, memimpin
14 agen AI dalam **7 divisi berpasangan** (tiap divisi = 1 Dosa + 1 Kebajikan). Hasilnya video cerita atau
fakta 30–60 detik bertempo cepat, dengan karakter 2D bean-head di dunia 3D, untuk TikTok, Reels, Shorts, dan Facebook.

> Repo ini berisi **sistem kerjanya** (agen, skill, aturan, script, dan papan kendali), bukan hasil video.
> File video, audio, dan aset besar sengaja tidak ikut (lihat [.gitignore](.gitignore)).

---

## Daftar isi
1. [Cara kerja](#cara-kerja)
2. [Tim: 7 divisi](#tim-7-divisi)
3. [Alur produksi per video](#alur-produksi-per-video)
4. [Tiga gerbang Tuan](#tiga-gerbang-tuan)
5. [Struktur folder](#struktur-folder)
6. [Alat bantu](#alat-bantu)
7. [Memulai](#memulai)
8. [Yang tidak ikut repo](#yang-tidak-ikut-repo)
9. [Status](#status)

---

## Cara kerja

LUCIFER tidak mengerjakan pekerjaan kreatif sendiri. Ia membagi tugas, menjaga urutan, dan berhenti di
gerbang yang harus disetujui manusia. Agen tidak saling memanggil, dan serah terima selalu lewat **file**
di folder produksi, bukan lewat percakapan. Semua pengetahuan channel disimpan di vault Markdown yang bisa
dibuka di Obsidian. Peta utamanya ada di [HOME.md](HOME.md).

Aturan lengkap LUCIFER ada di [CLAUDE.md](CLAUDE.md).

## Tim: 7 divisi

| Divisi | Dosa (kepala) | Kebajikan | Skill studio |
|---|---|---|---|
| Tren & Data | ENVY · Pemburu Tren | PATIENCE · Analis Performa | `studio-tren`, `studio-analitik` |
| Fakta | GLUTTONY · Pemburu Fakta | HUMILITY · Pemeriksa Fakta | `studio-gali-fakta`, `studio-cek-fakta` |
| Cerita | PRIDE · Penulis Naskah | DILIGENCE · Sutradara Storyboard | `studio-naskah`, `studio-storyboard` |
| Karakter & Dunia | LUST · Art Director | CHASTITY · Penjaga Karakter | `studio-dunia`, `studio-karakter` |
| Animasi & Footage | GREED · Pemburu Footage | KINDNESS · Animator | `studio-footage`, `cartoon-3d-short` |
| Suara & Edit | SLOTH · Editor & Perakit | TEMPERANCE · Sutradara Suara | `studio-rakit`, `studio-vo` |
| QA & Rilis | WRATH · Penjaga Gerbang QA | CHARITY · Publisher | `studio-qa`, `studio-rilis` |

Setiap agen memuat satu skill domain yang ringkas (sekitar 1,5–2 KB) supaya hemat token. Skill tersebut
ada di [.claude/skills/](.claude/skills/). Sumber agen ada di [agents/](agents/), dan salinan yang dibaca
Claude Code ada di `.claude/agents/`.

## Alur produksi per video

```
Tren → Fakta → Cek fakta → Naskah (3 hook)
          ✋ Gerbang 1: Tuan pilih hook
     → Prompt VO (ElevenLabs)
          ✋ Gerbang Suara: Tuan membuat VO → audio/vo.mp3
     → Audio (words.json) → Storyboard (dipotong dari timing VO)
     → Footage · Karakter · Dunia 3D (paralel)
     → Animasi → Edit & master 1080×1920 → QA (LULUS / GAGAL)
     → Paket upload + ledger
          ✋ Gerbang 2: Tuan menonton & upload sendiri
     → Laporan performa mingguan (PATIENCE)
```

Prinsip utamanya: **audio dibuat dulu, video menyesuaikan.** Timing setiap kata diambil dari VO
asli, lalu storyboard dan animasi mengikutinya.

## Tiga gerbang Tuan

1. **Gerbang 1:** memilih hook dan menyetujui naskah.
2. **Gerbang Suara:** suara dibuat **manual oleh Tuan** di ElevenLabs, memakai prompt siap tempel dari
   TEMPERANCE. Studio tidak membuat suara sendiri dengan TTS apa pun.
3. **Gerbang 2:** Tuan menonton hasil dan mengunggah sendiri. Studio tidak pernah mengunggah, memposting,
   atau login ke platform mana pun.

## Struktur folder

```
.
├─ CLAUDE.md              aturan LUCIFER (sumber kebenaran)
├─ HOME.md                peta vault (Obsidian)
├─ agents/                14 agen (sumber yang diedit)
├─ .claude/
│  ├─ agents/             salinan agen yang dibaca Claude Code
│  └─ skills/             13 skill studio-* + cartoon-3d-short
├─ channels/
│  ├─ _template/          template channel baru
│  └─ channel-01/         bible · ledger · pelajaran · kuota · performa.csv
├─ productions/
│  ├─ _TEMPLATE/          status.md & README standar per video
│  └─ <ID-VIDEO>/         satu folder per video (format: ch01_20261125_01_judul)
├─ tools/                 script bantu & tools (lihat di bawah)
├─ assets/                aset yang dipakai ulang (README-nya dicatat)
└─ REFFERENCES/           acuan gaya (bahan studi, tidak ikut repo)
```

## Alat bantu

| Script | Fungsi |
|---|---|
| [tools/qa_check.py](tools/qa_check.py) | Cek teknis master: resolusi, fps, codec, durasi 30–60 dtk, loudness, true peak, frame hitam/beku, VO vs master |
| [tools/lint_status.py](tools/lint_status.py) | Validasi `status.md` (termasuk gerbang yang tidak boleh dilewati) dan cari topik di ledger |
| [tools/words_whisper.py](tools/words_whisper.py) | VO dari Tuan → `words.json` (timing per kata, dicocokkan ke naskah) |
| [tools/riset-gratis/](tools/riset-gratis/) | Helper NVIDIA NIM untuk draf ringkasan dan ide (tanpa browsing; kunci lewat env var) |
| [tools/cartoon-short/](tools/cartoon-short/) | Render Remotion + three.js (komposisi video, audio sintetis) |
| [tools/kantor-sora/](tools/kantor-sora/) | **Istana LUCIFER**: papan kendali 3D di `localhost:5180`. Menampilkan status agen, tombol gerbang, form performa, dan ringkasan biaya |

## Memulai

Syarat di PC: Claude Code, Node.js 20+, Python 3.10+, FFmpeg, dan GPU NVIDIA untuk render dan whisper (opsional).

```powershell
# 1. Pasang ulang agen setelah file di agents\ diubah
.\pasang-agent.bat

# 2. Isi bagian [ISI] di channels\channel-01\bible.md (nama channel, paket & voice ElevenLabs, maskot)

# 3. Papan kendali (opsional, di terminal terpisah)
cd tools\kantor-sora
npm install
npm run dev        # http://localhost:5180

# 4. Jalankan LUCIFER dari folder ini
claude
# lalu ketik, misalnya: LUCIFER, produksi 3 video hari ini untuk channel-01.
```

Kunci API (mis. `NVIDIA_API_KEY`) hanya boleh lewat environment variable, tidak pernah ditulis ke file.

### Setup untuk pemula (dan untuk AI yang membantu memasang)

Langkah ini memakai alat yang sama dengan bagian "Memulai" di atas. Tidak perlu tahu programming untuk mengikutinya.

| Alat | Cek dengan | Keterangan |
|---|---|---|
| Claude Code | `claude --version` | Pasang dari https://claude.com/product/claude-code |
| Node.js 20+ | `node --version` | https://nodejs.org (versi LTS) |
| Python 3.10+ | `python --version` | https://python.org |
| FFmpeg | `ffmpeg -version` | https://ffmpeg.org |
| Git | `git --version` | https://git-scm.com (untuk clone dan update) |

**Cara termudah: minta Claude yang memeriksa.** Clone repo ini, buka foldernya di terminal, lalu jalankan `claude` dan tempel:

```
Periksa setup repo ini untuk saya. Cek claude, node, python, dan ffmpeg terpasang (beri tahu versi
dan cara memasang yang belum ada). Jalankan pasang-agent.bat. Lalu cek folder .claude/agents dan
.claude/skills sudah terisi. Jangan mengisi kunci API, jangan menghapus folder, dan jangan
membuat atau mengunggah video tanpa izin saya.
```

**Cek berhasil:** `.\pasang-agent.bat` selesai tanpa error, lalu `claude` membuka sesi dan menyebut LUCIFER saat diminta memperkenalkan diri.

**Kalau tidak jalan:**

| Masalah | Solusi |
|---|---|
| `pasang-agent.bat` tidak menemukan agen | Pastikan kamu menjalankannya dari folder root repo, bukan dari subfolder |
| `ffmpeg` tidak dikenal | Pasang FFmpeg dan tambahkan folder `bin`-nya ke PATH, lalu buka terminal baru |
| Render lambat atau gagal kehabisan memori | Tutup aplikasi lain dan render satu video per waktu (GPU RTX 3070 dengan 8 GB VRAM) |
| Folder `productions/` belum ada | Salin `productions/_TEMPLATE/` untuk tiap video, sesuai alur LUCIFER |

**Yang perlu kamu siapkan sendiri:** isi bagian `[ISI]` di `channels/channel-01/bible.md`, dan `audio/vo.mp3` dibuat sendiri di ElevenLabs. Agen tidak pernah membuat suara.

## Lisensi

Source-available, **non-komersial**. Boleh dilihat, dipakai, dan dimodifikasi untuk keperluan pribadi dan belajar. Dilarang dijual, didistribusikan ulang, atau dipakai untuk melatih model AI tanpa izin tertulis. Detail lengkap di [LICENSE](LICENSE). Aset pihak ketiga tetap mengikuti lisensi masing-masing (lihat [assets/README.md](assets/README.md)).

## Yang tidak ikut repo

Sesuai `.gitignore`:
- video, audio, render, dan export (`*.mp4`, `*.wav`, `*.mp3`, `productions/*/render|export|footage|audio`)
- `REFFERENCES/` (video acuan milik orang lain, hanya untuk studi pribadi) dan `assets/assets/` (kit 3D besar)
- kunci, data lokal, riwayat papan kendali, dan plugin Obsidian pihak ketiga
- dependensi dan hasil build (`node_modules`, `dist`, `out`)

## Status

- Produksi pertama `ch01_20261125_01_demo` (tes alur) sudah sampai Gerbang 2. Video itu dibuat sebelum aturan 30–60 dtk dan VO manual berlaku, jadi belum memenuhi standar baru.
- Monetisasi ditunda sampai kejelasan hak komersial suara dan paket ElevenLabs ditetapkan di [bible](channels/channel-01/bible.md).
- Aset 3D dari Kenney (CC0) dipakai; sumber aset lain ditandai "perlu dicek" di [assets/README.md](assets/README.md).

---

<sub>Dibuat dengan Claude Code. Konten fakta harus diverifikasi lewat HUMILITY sebelum dipakai, dan merek pihak
ketiga tidak boleh muncul sebagai logo atau karakter.</sub>
