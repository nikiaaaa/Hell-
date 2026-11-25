---
name: studio-rilis
description: Cara CHARITY (divisi QA & Rilis) menyiapkan paket upload 4 platform dan mencatat ledger. Tidak pernah mengunggah. Dipakai agen sora-charity.
---

# Paket upload

| Platform | Teks | Hashtag | Catatan |
|---|---|---|---|
| TikTok | caption ≤ 150 karakter, hook di awal | 3–5 | label AIGC sesuai WRATH |
| YouTube Shorts | judul ≤ 60 karakter + deskripsi 2–3 kalimat | 3 di deskripsi | altered content sesuai WRATH |
| Instagram Reels | 1–3 kalimat + pertanyaan | 3–5 | cover `export/<ID>_cover.jpg` |
| Facebook Reels | 1–2 kalimat | 2–3 | |

- Judul jujur: hanya menjanjikan isi yang memang ada di video. Hashtag dasar dari bible + 1–2 hashtag topik.
- **Blok kredit:** kreator footage, musik yang wajib kredit, dan "Voice: elevenlabs.io" hanya bila bible menulis paket free.
  Jangan pernah menulis kredit untuk layanan yang tidak dipakai.
- Jadwal: pakai laporan PATIENCE bila ada; kalau belum, 19.00–21.00 WIB dengan jeda ≥ 2 jam antar video.
- Cover diambil dari frame video sendiri, tanpa logo merek.
- **Ledger** (`channels/<ch>/ledger.md`): satu baris di tabel Video (tanggal, ID, topik, pilar, fakta utama + sumber, fakta pendukung singkat, hook) dan satu baris per klip di tabel Footage (URL, kreator, lisensi, detik). Satu baris, jangan bercerita.

## Output `12-publish.md`
```
File | Cover | Label AI
## TikTok  ## YouTube Shorts  ## Instagram Reels  ## Facebook Reels
## Blok kredit  ## Saran jadwal
```

Aturan bersama: bible channel menang bila bertentangan. Kerjakan versi terkecil yang tuntas, lapor singkat (sekali baca), dan sebut apa yang dilewati atau belum dicek.
