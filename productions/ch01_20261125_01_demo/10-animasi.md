# 10 — Animasi
Pemilik tunggal: KINDNESS (merangkap tugas CHASTITY, LUST, SLOTH). Pipeline: three.js di Remotion (skill cartoon-3d-short), basis `casino_v4`.

| Scene | File render | Durasi | Frame awal–akhir | Sinkron ke kata | Catatan |
|---|---|---|---|---|---|
| 1–22 (A, 100%) | render/nintendo_silent.mp4 (tanpa suara), render/nintendo_vo.mp4 (+vo.wav, cadangan valid) | 67,43 dtk (VO 67,03 + ekor 0,4) | 0–2022 (2023 f, 30 fps, 1080x1920) | semua dikunci ke words.json | 22 shot, 7 dekor (studio, arcade, bengkel Kyoto luar/dalam, jalan, dapur, kantor pabrik mainan) |

Batas shot (frame): 0, 123, 208, 295, 364, 477, 579, 648, 761, 858, 983, 1076, 1173, 1224, 1316, 1403, 1473, 1563, 1659, 1774, 1874, 1923. Reaksi visual 0–3 f sebelum kata kunci (taksi, Famicom/Game Boy, sapuan "Tapi awalnya?", kipas "hanafuda", "Kartu.", "Daiya", nasi, "baca ulang dua kali", "gagal", "lesu", "baru", "terduga", "memanjang", "laris", cabinet "lahirlah", "kartu/taksi/nasi", "gagal", "aneh").

## Yang dibangun
- Karakter: narator bean head generik (kaos navy #14213D, kancing kuning #FFC83D), pengrajin, pria berjas, teknisi, pembawa kotak; semua dari toon.ts (bukan maskot resmi). Aksi besar lewat hop/lean/wave tingkat mesh (kedip acak, napas).
- Properti prosedural: taksi kuning generik tanpa tulisan, kartu hanafuda (6 desain bunga orisinal), lampion, siluet konsol & genggam abu netral, mangkuk + bungkus nasi polos, mainan tangan gunting (lazy-tong) oranye/kuning, lemari arcade generik berlayar blok abstrak, bohlam, kotak karton, lampu meja.
- Caption per kata (gaya bible: putih + outline hitam, kata aktif kuning #FFC83D, font Arial Black sebagai pengganti Montserrat). Tidak ada teks lain di layar; semua tekstur dicek tanpa huruf.
- Kamera: potong di lompatan besar, glide, setiap tahan merayap (push-in), kick 7 frame pada tumbukan, flash putih 8 titik, roll 4°, DOF per shot.

## Script yang dipakai/dibuat
`tools/cartoon-short/src/videos/nintendo/` (story.ts timeline+kamera dari words.json, sets.ts, cast.ts, props3d.ts, captions.tsx, Bridge.tsx; sisanya salinan casino_v4), komposisi `NintendoShort` di `src/Root.tsx`, `scripts/nin_sheet.py` (kontak sheet). Still: `COMP=NintendoShort node scripts/bridge-stills.mjs out/nin/x_ <frames> 0.5`.

## Waktu render total
Render final 2023 f ±5 menit (bundle+render+encode), 49,2 MB. Cek: durasi 67,43 dtk (VO 67,03, selisih 0,4), 1080x1920 30 fps, blackdetect dan freezedetect nol temuan.

## Isyarat SFX untuk TEMPERANCE
`render/cues.json` (48 isyarat: honk, car, skid, whoosh, pop, paper, creak, crash, ding, buzz, boing, blip, powerup, rattle, catch, ting). Ringkas: klakson 0,67 · deru 1,0–2,9 · decit rem 3,45 · pop siluet 7,96/8,59 · whoosh sapuan 10,1 · kipas kartu 16,1 · taksi masuk 25,2 · tepuk 27,4 · sobek nasi 29,2 · roda copot 34,3 · kotak jatuh 36,8 · bohlam 39,95 · boing 47,8 · konfeti 50,9 · power-on arcade generik 56,95 · pop pedestal 61,3/62,1/62,6.

## Batasan yang kutahu
- Taksi hasil kotak-kotak dari samping masih mirip mobil bak; Kenney tidak dipakai (semua prosedural, jadi folder `public/kenney` tidak dibuat dan bundle kecil).
- Wink = kedua mata menutup 5 frame (tidak ada wajah satu mata).
- Asap taksi (shot 11) dan sebagian detail kecil hanya dicek lewat 2 still; tidak ada pemeriksaan penuh frame-per-frame.
- Tong tangan shot 16 meraih kotak dekat (bukan "kotak jauh"). Teknisi digambar sebagai bean generik, tanpa wajah tokoh asli.
- Kuning caption terbaca agak oranye karena grade warna.

## Kualitas jujur (1–10)
Sinkron kata 8 · tampilan dunia/warna 7 · karakter & akting 6 · properti & readability 6 (taksi 5) · kamera 7 · bebas merek/teks asing 9 · caption 8.
