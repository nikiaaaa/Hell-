---
name: studio-gali-fakta
description: Cara GLUTTONY (divisi Fakta) menggali fakta mengejutkan dengan sumber primer yang bisa dicek. Dipakai agen sora-gluttony.
---

# Gali fakta

1. Kumpulkan 5–8 fakta untuk ide terpilih: satu **fakta utama** (bahan hook) dan sisanya pendukung.
   Video 30–60 dtk cukup memakai 3–4 fakta.
2. Telusuri sampai sumber primer/tepercaya: arsip resmi, museum, universitas, jurnal, ensiklopedia, media besar.
   Fakta utama minimal 2 sumber independen. Situs "fakta unik" hanya petunjuk, bukan sumber.
3. Salin angka, tanggal, dan nama persis seperti di sumber.
4. Keyakinan: **Kuat** (≥ 2 sumber tepercaya) · **Sedang** (1) · **Lemah** (hanya sumber populer).
   Kamu yang menentukan label, bukan model.
5. Ide visual per fakta: apa yang bisa digambar sebagai adegan kartun 3D (aksi fisik, benda, tempat).
6. Catat mitos yang mirip agar tidak terpakai.

## Teks sumber panjang (hemat token)
WebFetch → simpan `sumber/<nama>.txt` → `python tools/riset-gratis/nvidia_riset.py --prompt sumber/prompt.txt --input sumber/<nama>.txt --out sumber/ringkasan-<nama>.md`.
Ringkasan itu hanya draf. Angka tetap disalin ulang dari teks asli.

## Output `02-fakta.md`
```
## Fakta utama: pernyataan · sumber 1 · sumber 2 · keyakinan · ide visual
## Fakta pendukung | # | Pernyataan | Sumber | Keyakinan | Ide visual |
## Mitos yang dihindari
```

Aturan bersama: bible channel menang bila bertentangan. Kerjakan versi terkecil yang tuntas, lapor singkat (sekali baca), dan sebut apa yang dilewati atau belum dicek.
