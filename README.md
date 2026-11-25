# SORA Studio — Office Agency Short Video

Peta vault: [[HOME]] · aturan LUCIFER: [[CLAUDE]]

Studio short video otomatis di **Claude Code**: 1 orkestrator (**LUCIFER**) + 14 agen dalam 7 divisi
(tiap divisi = 1 Dosa + 1 Kebajikan). Video cerita/fakta 30–60 detik bertempo cepat: karakter 2D bean-head
di dunia 3D, untuk penonton Indonesia di TikTok, Reels, Shorts, dan Facebook.

## 1. Yang perlu terpasang
| Alat | Untuk | Cek |
|---|---|---|
| Claude Code | LUCIFER & agen | `claude --version` |
| Node.js | Remotion (render) & Istana | `node --version` |
| FFmpeg | mux, cek teknis | `ffmpeg -version` |
| Python 3.10+ & faster-whisper | script bantu, timing kata | `pip show faster-whisper` |
| yt-dlp (opsional) | footage | `yt-dlp --version` |
| Akun ElevenLabs | **VO dibuat Tuan sendiri** dari prompt TEMPERANCE | — |

Kunci API (mis. `NVIDIA_API_KEY`) hanya lewat `setx`, jangan pernah ditulis ke file.

## 2. Cara mulai
0. Setelah file di `agents\` diubah: klik dua kali `pasang-agent.bat` (menyalin ke `.claude\agents\`).
1. Isi `[ISI]` di `channels/channel-01/bible.md` (nama channel, paket & voice ElevenLabs, maskot).
2. Buka **Istana LUCIFER** (shortcut desktop / `tools/kantor-sora/buka-kantor.bat`) atau jalankan `claude` di folder ini.
3. Perintah, misalnya: `LUCIFER, produksi 3 video hari ini untuk channel-01.`

## 3. Tiga gerbang Tuan
1. **Gerbang 1:** pilih hook & setujui naskah.
2. **Gerbang Suara:** buka `05-vo-prompt.md`, tempel ke ElevenLabs, unduh MP3 ke `productions/<ID>/audio/vo.mp3`.
   Tanpa VO ini produksi berhenti. Studio tidak pernah membuat suara TTS sendiri.
3. **Gerbang 2:** tonton `export/<ID>_master.mp4`, upload sendiri memakai `12-publish.md`.

Di Istana, tab **Produksi** punya tombol untuk ketiga gerbang, form performa, dan tombol laporan PATIENCE.

## 4. Setelah upload
Isi performa (form di Istana atau `performa.csv`) 2–3 hari setelah tayang. Laporan mingguan: tombol
"📊 Minta laporan PATIENCE".

## 5. Catatan
- ElevenLabs paket free = non-komersial + atribusi "elevenlabs.io". Untuk monetisasi, pakai paket berbayar dan ubah bible §7.
- Footage pihak ketiga: klip pendek, audio dibuang, diubah nyata, diberi kredit (aturan GREED & WRATH).
- Backup: repo git (file video/audio/aset besar dan `REFFERENCES/` tidak ikut, lihat `.gitignore`).
- Channel baru: salin `channels/_template/` jadi `channels/channel-02/`.
