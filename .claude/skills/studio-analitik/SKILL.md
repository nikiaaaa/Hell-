---
name: studio-analitik
description: Cara PATIENCE (divisi Tren & Data) menghitung performa video dari performa.csv dan menulis rekomendasi mingguan. Dipakai agen sora-patience.
---

# Analitik performa

- Hitung dengan Python (`csv` bawaan), jangan dikira-kira. Kolom ada di baris pertama `performa.csv`.
- Angka per platform: rata-rata & median views, durasi tonton rata-rata, % tonton habis,
  (like+komentar+share+simpan) per 1.000 views, follower baru per video.
- Kelompokkan per pilar, jenis hook (dari `04-naskah.md`), durasi, dan jam tayang.
- Keyakinan: < 5 video = jangan simpulkan (tulis "data belum cukup"); 5–9 = rendah/sedang; ≥ 10 = tinggi.
- Bandingkan ide tren dari ENVY (pasanganmu) dengan pola yang menang di data sendiri.

```python
import csv, statistics as st
r = list(csv.DictReader(open('channels/channel-01/performa.csv', encoding='utf-8')))
v = [int(x['views'] or 0) for x in r]; print(len(r), st.mean(v) if v else 0, st.median(v) if v else 0)
```

## Output (bagian baru di atas `channels/<ch>/laporan-mingguan.md`)
```
## Minggu <tanggal> — <n> video
### Angka utama   ### Yang menang (keyakinan)   ### Yang lemah (keyakinan)
### Rekomendasi: ENVY · PRIDE · CHARITY
```
Tutup dengan maks 3 usulan baris untuk `channels/<ch>/pelajaran.md` (pola dari ≥ 5 video, sebut keyakinannya). Tuan yang menyetujui, CHARITY yang menulis.

Aturan bersama: bible channel menang bila bertentangan. Kerjakan versi terkecil yang tuntas, lapor singkat (sekali baca), dan sebut apa yang dilewati atau belum dicek.
