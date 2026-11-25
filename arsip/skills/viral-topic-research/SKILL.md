---
name: viral-topic-research
description: Fase 1 pipeline short video 30 detik. Riset 10 topik viral Indonesia (X trending, berita, trend tracker) dalam 30 hari terakhir, lengkap dengan status verifikasi. Gunakan saat user bilang "update", "cari topik viral", "fase 1", atau minta daftar topik terbaru.
---

# Fase 1: Riset Topik Viral (Indonesia)

Output fase ini HANYA daftar 10 topik. Hook, narasi, dan visual dikerjakan di Fase 2 setelah user memilih topik.

## Preferensi user (sudah disepakati)
- Rentang waktu: 30 hari terakhir sampai hari ini (hitung dari tanggal hari ini).
- Fokus Indonesia. Boleh 1-2 topik global kalau sangat ramai.
- Kategori bebas, asal berpeluang viral. Gosip dan isu yang belum terbukti boleh masuk (user menjadikannya hook: tanya penonton "betul atau tidak?"), tapi wajib diberi label status verifikasi.
- Gaya akhir: dramatis dan informatif, bahasa Indonesia, 30 detik (sekitar 70-85 kata).
- Topik harus mudah dinarasikan: ada alur jelas (sebab, kejadian, akibat), angka atau fakta konkret.

## Sumber (urutan kerja)
1. **X Trending via Claude in Chrome** (user sudah login):
   - `tabs_context_mcp` (createIfEmpty), lalu navigate ke `https://x.com/explore/tabs/trending`, lalu `get_page_text`.
   - Kalau Chrome tidak terhubung: minta user buka Chrome dan login ke ekstensi Claude in Chrome, lalu lanjut dengan sumber 2-3.
2. **Trend tracker** lewat WebSearch: trends24.in/indonesia, getdaytrends.com/indonesia, endless.app/radar/trends/indonesia (untuk riwayat hari-hari sebelumnya).
3. **Berita viral** lewat WebSearch (mode extended): roundup viral dari Detik, Kompas, CNN Indonesia, Katadata, IDN Times, SINDOnews, dll. Cari tiap tagar trending untuk tahu penyebabnya.
4. Instagram: belum dipakai kecuali user bilang sudah login dan minta dibaca.

Jalankan pencarian paralel. Untuk tiap kandidat, cari minimal satu sumber berita yang menjelaskan penyebab trending.

## Aturan
- Jangan mengarang konteks. Kalau penyebab trending tidak ditemukan, tulis begitu dan beri status "perlu verifikasi".
- Cek tanggal tiap fakta. Buang topik yang di luar 30 hari atau yang tanggalnya saling bertentangan antar sumber.
- Hindari topik kripto/meme coin (rawan dianggap promosi).
- Topik sensitif (tuduhan ke individu, SARA, kasus pribadi): tandai dan sarankan verifikasi sebelum dijadikan video.
- Beri label status: Kuat (banyak media), Sedang (sedikit sumber), Lemah (satu sumber / tanggal tidak konsisten), Perlu verifikasi (tidak ditemukan laporan).
- Tutup dengan daftar Sources sebagai link markdown.

## Format output (tabel, 10 baris)
| # | Topik | Fakta inti (angka, tanggal, pihak) | Kenapa mudah dinarasikan | Status data |

Lalu catatan singkat: topik paling aman, topik yang datanya tipis, topik yang sengaja dilewati dan alasannya. Akhiri dengan tawaran: user memilih topik untuk Fase 2.

## Fase berikutnya
- Fase 2 (setelah user memilih topik): hook, narasi 30 detik, pembagian animasi vs footage asli, dan latar visual per shot.
