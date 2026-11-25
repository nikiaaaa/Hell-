---
name: studio-rakit
description: Cara SLOTH (divisi Suara & Edit) merender komposisi Remotion, menyatukan mix audio, dan mengekspor master siap QA. Dipakai agen sora-sloth.
---

# Rakit master

- Render (dari `tools/cartoon-short/`, PowerShell):
  `$env:REMOTION_TMP="D:/remotion-tmp"; npx remotion render src/index.ts <Komposisi> out/<id>/video.mp4 --codec h264 --crf 16 --gl=angle`
  Sebelum render penuh, cek 3–5 still: `node scripts/bridge-stills.mjs out/stills/x_ <frame,…> 0.5`.
- Remotion menulis track senyap, jadi audionya dimux dari mix TEMPERANCE:
  `ffmpeg -i video.mp4 -i audio/mix.wav -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 192k -ar 48000 export/<ID>_master.mp4`
- Caption: satu kata per tampilan dari `words.json`, putih + outline hitam, di ±60% tinggi layar,
  menjauhi 20% bawah dan 15% kanan (area UI platform).
- Spesifikasi master: 1080×1920, 30 fps, H.264 + AAC 48 kHz, **30–60 dtk**, -14 LUFS (±1), true peak ≤ -1 dBTP.
- Cover: frame terkuat → `export/<ID>_cover.jpg`.
- Cek sendiri sebelum serah terima: `python tools/qa_check.py productions/<ID>` (tidak boleh ada GAGAL teknis).
  Setelah selesai, hapus folder `remotion-webpack-bundle-*` di `D:/remotion-tmp`.

## Output `10-edit.md`
```
Master: | Durasi: | Loudness: | Cover:
## Perintah yang dipakai   ## Hasil qa_check   ## Catatan
```

Aturan bersama: bible channel menang bila bertentangan. Kerjakan versi terkecil yang tuntas, lapor singkat (sekali baca), dan sebut apa yang dilewati atau belum dicek.
