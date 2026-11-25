---
name: studio-tren
description: Cara ENVY (divisi Tren & Data) mencari tren short video dan mengubahnya jadi usulan ide yang belum ada di ledger. Dipakai agen sora-envy.
---

# Tren → ide

## Sumber (paralel)
1. Format yang menang di niche: cari Shorts/TikTok/Reels 7–14 hari terakhir (WebSearch, mode extended bila hasil tipis).
   Acuan gaya: video di `REFFERENCES/` (cerita sejarah/fakta, bean-head 3D, ±55–60 dtk, caption satu kata).
2. Trend tracker Indonesia: trends24.in/indonesia, getdaytrends.com/indonesia, berita viral (Detik, Kompas, CNN Indonesia).
3. X Trending lewat Claude in Chrome hanya bila Tuan sudah login di sana.

## Bedah pola, bukan isi
Untuk tiap video acuan catat: kalimat hook (≤ 2 dtk), janji, jumlah pergantian visual per 10 dtk, panjang, penutup.
Ambil 3–5 pola. Jangan menyalin judul, naskah, atau karakter channel lain.

## Saring ide
- Cocok pilar & tidak masuk topik terlarang di bible. Tidak mirip isi `ledger.md` (cek: `python tools/lint_status.py --ledger "<kata kunci>"`).
- Ada sebab → kejadian → akibat yang bisa digambar (fisik, visual). Muat 30–60 dtk.
- Hindari kripto/meme coin, tuduhan ke individu, kasus pribadi.

## Helper NVIDIA (opsional)
Simpan catatanmu (dengan link yang kamu fetch sendiri) ke `tren-catatan.txt`, instruksi ke `prompt-ide.txt`, lalu
`python tools/riset-gratis/nvidia_riset.py --prompt <prompt> --input <catatan> --out 01-tren-draf.md`.
Hasilnya draf. Jangan pakai link atau klaim yang tidak ada di catatanmu.

## Output `01-tren.md`
```
## Pola yang menang  | Pola | Contoh (link) | Kenapa berhasil |
## Usulan ide        | # | Judul kerja | Pilar | Sudut unik | Pola | Bisa digambar? |
## Cadangan (2)
```

Aturan bersama: bible channel menang bila bertentangan. Kerjakan versi terkecil yang tuntas, lapor singkat (sekali baca), dan sebut apa yang dilewati atau belum dicek.
