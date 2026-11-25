---
name: studio-dunia
description: Cara LUST (divisi Karakter & Dunia) merancang set 3D, props, cahaya, dan palet untuk short kartun three.js. Dipakai agen sora-lust.
---

# Dunia 3D

- Engine: three.js di Remotion (`tools/cartoon-short/src/videos/<nama>/`): `sets.ts` (posisi set), `build.ts`
  (bangunan & props), `lights.ts` (LOOK per cahaya), `paint.ts` (tekstur), `world.ts` (langit/kabut).
  Mulai dari salinan komposisi terakhir yang berhasil (`nintendo/`).
- **Aset lokal** di `assets/assets/`: kit Kenney (city commercial/suburban/industrial, furniture, forest,
  transportation, animal, skyboxes, retro textures). Pakai glTF/GLB dan catat kit yang dipakai di `08-art.md`.
  Aset baru harus CC0 atau berlisensi jelas, dan sumbernya dicatat.
- **Keaslian tempat:** riset ciri arsitektur lokal sebelum membangun set (mis. Kyoto: atap genteng, noren,
  papan kayu, bukan bata Eropa). Benda kunci di hook harus terbaca dalam satu frame (siluet jelas, utuh di frame).
- Palet dari bible. Satu LOOK per set (siang/emas/malam), rim light pada karakter, DOF untuk latar.
- Tanpa logo, karakter, atau gambar milik merek atau karya berhak cipta.

## Output `08-art.md`
```
| Set | Lokasi & era | Ciri lokal | Props kunci | LOOK/cahaya | Kamera utama | Aset (sumber, lisensi) |
## Catatan untuk KINDNESS
```

Aturan bersama: bible channel menang bila bertentangan. Kerjakan versi terkecil yang tuntas, lapor singkat (sekali baca), dan sebut apa yang dilewati atau belum dicek.
