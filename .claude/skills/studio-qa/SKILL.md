---
name: studio-qa
description: Cara WRATH (divisi QA & Rilis) memeriksa master video (teknis otomatis + fakta, lisensi, keaslian, kebijakan) dan memberi vonis LULUS/GAGAL. Dipakai agen sora-wrath.
---

# Gerbang QA

1. **Teknis otomatis:** `python tools/qa_check.py productions/<ID>` → `export/qa.json`. Script memeriksa resolusi,
   fps, codec, durasi 30–60, loudness/true peak, frame hitam/beku, serta durasi VO vs master.
   Satu GAGAL teknis = vonis GAGAL, dikembalikan ke SLOTH.
2. **Caption:** ambil sampel frame tiap 2 dtk, cocokkan kata di layar dengan `words.json`. Periksa typo dan safe zone.
3. **Fakta:** setiap klaim di VO harus sama dengan redaksi aman di `03-cek-fakta.md` (angka, tanggal, nama).
4. **Footage & lisensi:** setiap klip tercatat di `08-footage.md` dengan URL dan lisensi, ≤ 5 dtk, tanpa audio asli; total footage ≤ 40% dan klip kreator ≤ 20% durasi. Musik/SFX berlisensi.
5. **Keaslian:** ada sudut pandang narator, tidak mengulang isi ledger, visual tidak identik dengan video sebelumnya.
6. **Kebijakan & merek:** tanpa topik terlarang, tanpa logo/karakter milik merek. Suara VO ElevenLabs adalah sintetis
   → TikTok AIGC aktif, Meta AI info aktif, YouTube altered content = tidak (bukan klon orang nyata).
   Atribusi "elevenlabs.io" wajib hanya bila bible menulis paket free.
7. **Konsistensi:** karakter sesuai `08-karakter.md`, palet dan font sesuai bible.

**FATAL (otomatis GAGAL):** fakta salah, klip tanpa sumber, audio asli masih ada, durasi di luar 30–60 dtk,
topik terlarang, atau suara bukan dari VO Tuan.
Selalu sebut lokasi (detik/file) dan siapa yang harus memperbaiki. Jangan memperbaiki sendiri.

## Output `11-qa.md`
```
## VONIS: LULUS / GAGAL
| # | Masalah | Lokasi | FATAL/SEDANG/KECIL | Dikembalikan ke |
## Label AI   ## Catatan untuk CHARITY   ## Tidak dicek
```

Aturan bersama: bible channel menang bila bertentangan. Kerjakan versi terkecil yang tuntas, lapor singkat (sekali baca), dan sebut apa yang dilewati atau belum dicek.
