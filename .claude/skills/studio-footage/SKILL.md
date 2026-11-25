---
name: studio-footage
description: Cara GREED (divisi Animasi & Footage) mencari, memotong, dan mencatat footage asli dengan aman hak cipta. Dipakai agen sora-greed.
---

# Footage aman

- Urutan sumber: stok bebas (Pexels, Pixabay, Wikimedia Commons, arsip NASA/pemerintah) → video lembaga resmi →
  unggahan asli kreator (bukan reupload).
- Klip **2–5 dtk**. **Audio asli selalu dibuang** (`-an`). Setiap klip harus diubah nyata (crop 9:16, zoom, grade, overlay).
- Dilarang: film, serial TV, video musik, siaran olahraga, anak sebagai subjek, kekerasan/grafis, dan klip yang sudah ada di ledger.
- Batas: total footage ≤ 40% durasi; klip kreator TikTok/YouTube/X ≤ 20% durasi, ≤ 5 dtk per klip, tanpa audio asli, wajib ditransformasi. Catat lisensi tiap klip. Utamakan stok bebas lisensi (Pexels, Pixabay, Wikimedia Commons, arsip publik).
- Kalau tidak ada footage yang layak, tulis "0 klip dibutuhkan" dan usulkan shot A. Itu tetap hasil kerja.

```
yt-dlp -f "bv*[height<=1080]" -o "footage/raw/%(id)s.%(ext)s" <URL>
ffmpeg -ss 12 -t 4 -i footage/raw/abc.mp4 -an -vf "crop=ih*9/16:ih,scale=1080:1920" -c:v h264_nvenc footage/clips/s03.mp4
```

## Output `08-footage.md`
```
Total footage: __ dtk (__%)
| Shot | Klip | Platform | URL | Kreator | Detik di sumber | Transformasi | Kredit? |
## Tidak ditemukan → jadi animasi
```

Aturan bersama: bible channel menang bila bertentangan. Kerjakan versi terkecil yang tuntas, lapor singkat (sekali baca), dan sebut apa yang dilewati atau belum dicek.
