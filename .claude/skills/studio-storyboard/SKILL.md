---
name: studio-storyboard
description: Cara DILIGENCE (divisi Cerita) memecah VO asli (words.json) jadi daftar shot bertempo cepat, termasuk membedah video referensi. Dipakai agen sora-diligence.
---

# Storyboard dari timing VO

Storyboard dibuat **setelah** VO jadi. Semua waktu diambil dari `audio/words.json`, bukan perkiraan.

- 9:16, 1080×1920, 30 fps. Ganti visual tiap **1–2,5 dtk** (±25–40 shot untuk 50 dtk).
- Hook (0–2 dtk) memakai visual terkuat: aksi, close-up wajah kaget, atau benda absurd.
- Setiap reaksi visual jatuh 0–3 frame **sebelum** kata pemicunya (frame = detik × 30).
- Jenis shot: **A** (animasi bean-head di dunia 3D, default) · **G** (karakter di atas footage) · **F** (footage asli).
  Pakai F/G hanya bila footage benar-benar menambah bukti. Batas: F + G ≤ 40% durasi, klip kreator TikTok/YT/X ≤ 20%.
- Variasi kamera: wide → medium → close, dolly/glide, sesekali whip/flash saat pergantian bagian.
- Satu tempat = satu set. Batasi 3–5 set per video supaya LUST dan KINDNESS hemat waktu.

## Membedah referensi (bila diminta meniru format)
Hitung cut dengan `ffmpeg -i ref.mp4 -vf "select='gt(scene,0.3)',showinfo" -f null -`, lalu buat lembar frame
dengan `ffmpeg -i ref.mp4 -vf "fps=1/3,scale=216:384,tile=6x3" -frames:v 1 sheet.png`.
Catat ritme, framing, dan gaya caption. Pakai **polanya**, jangan cerita atau karakternya.

## Output `07-storyboard.md`
```
Durasi VO: | Jumlah shot: | Set:
| Shot | Frame a–b | Kata pemicu | Jenis | Set | Visual & aksi | Kamera | SFX |
## Kebutuhan: footage (GREED) · karakter & ekspresi (CHASTITY) · set & props (LUST)
```

Aturan bersama: bible channel menang bila bertentangan. Kerjakan versi terkecil yang tuntas, lapor singkat (sekali baca), dan sebut apa yang dilewati atau belum dicek.
