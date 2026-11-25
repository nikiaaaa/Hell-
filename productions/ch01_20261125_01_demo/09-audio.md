# 09 — Audio
Tahap 6d, FASE 1 (suara) selesai ✅. FASE 2 (musik + SFX) menyusul setelah gambar terkunci, dipanggil LUCIFER.

VO: audio/vo.wav | Durasi: 67,03 dtk | Karakter: 1.145 (tanpa kuota ElevenLabs) | Voice: id-ID-Ardi (edge-tts) | Model: edge-tts neural, rate +20%
Timestamp: audio/words.json (170 entri `{"w","s","e"}`, per KATA, dari WordBoundary edge-tts; tanpa pembagian proporsional)

- Naskah: Versi 1 (Kaget), 170 kata, teks bersih di audio/vo_teks.txt
- Format: WAV 48 kHz mono, EQ ringan + kompresor ringan. Belum dinormalisasi -14 LUFS (tugas SLOTH).
- Skrip: tools/cartoon-short/audio/make_voice_nintendo.py (jeda deadpan 0,3–0,6 dtk sebelum "Dan itu bahkan", "Aku sampai", "Hasilnya?", "Jadi raksasa", "Follow ya")
- Percobaan: rate +0% = 79,5 dtk (terlalu panjang), +20% = 67,0 dtk (masuk 62–68). Gap terpanjang antarkata 0,71 dtk, tidak ada senyap panjang.
- Mulai VO 0,37 dtk; kata terakhir selesai 66,77 dtk; ekor senyap 0,26 dtk.

| Lapisan | File | Sumber | Lisensi | Wajib kredit? |
|---|---|---|---|---|
| Voice over | audio/vo.wav | edge-tts id-ID-ArdiNeural | layanan TTS Microsoft Edge, tanpa kuota | tidak |
| Musik | (menyusul FASE 2) | | | |
| SFX | (menyusul FASE 2) | | | |

## Penanda waktu per bagian naskah (dtk)
| Bagian | Kalimat | Mulai–Akhir |
|---|---|---|
| HOOK | 1–2 | 0,37–3,68 |
| JANJI | 3 | 4,18–6,60 |
| CONTEXT | 4–6 | 6,99–12,05 |
| TWIST 1 hanafuda | 7–9 | 12,21–21,27 |
| TWIST 2 bisnis sampingan | 10–17 | 21,66–40,42 |
| TWIST 3 mainan ke game | 18–23 | 40,86–63,66 |
| PENUTUP | 24–25 | 64,16–66,77 |

## Waktu tiap kalimat (isyarat animator)
| # | Mulai | Akhir | Kalimat |
|---|---|---|---|
| 1 | 0.37 | 1.49 | Tunggu... ini beneran? |
| 2 | 1.63 | 3.68 | Nintendo... pernah punya perusahaan taksi. |
| 3 | 4.18 | 6.60 | Dan itu bahkan bukan bagian paling aneh dari cerita mereka. |
| 4 | 6.99 | 9.19 | Kalian kenal Nintendo dari Famicom dan Game Boy. |
| 5 | 9.88 | 10.69 | Tapi awalnya? |
| 6 | 10.91 | 12.05 | Sama sekali bukan game. |
| 7 | 12.21 | 18.66 | Menurut Nintendo sendiri, sejak seribu delapan ratus delapan puluh sembilan, mereka bikin kartu hanafuda... kartu tradisional Jepang, di Kyoto. |
| 8 | 19.36 | 19.93 | Iya. |
| 9 | 20.63 | 21.27 | Kartu. |
| 10 | 21.66 | 24.74 | Nah, awal tahun enam puluhan, Nintendo mulai coba-coba. |
| 11 | 25.43 | 27.96 | Bikin perusahaan taksi di Kyoto, namanya Daiya. |
| 12 | 28.66 | 29.99 | Terus... jualan nasi instan. |
| 13 | 30.69 | 32.15 | Aku sampai baca ulang dua kali. |
| 14 | 32.85 | 33.57 | Hasilnya? |
| 15 | 33.71 | 35.25 | Semua bisnis sampingan itu gagal. |
| 16 | 35.94 | 38.45 | Penjualan kartu juga mulai lesu sekitar tahun enam puluh empat. |
| 17 | 39.16 | 40.42 | Nintendo butuh jalan baru. |
| 18 | 40.86 | 43.24 | Dan jalan barunya datang dari tempat yang paling nggak terduga. |
| 19 | 43.94 | 48.45 | Tahun enam puluh enam, seorang teknisi mesin bernama Gunpei Yokoi iseng bikin tangan mainan yang bisa memanjang. |
| 20 | 49.15 | 51.47 | Nintendo menjualnya sebagai Ultra Hand... dan laris. |
| 21 | 52.17 | 54.65 | Dari situ: mainan, lalu elektronik. |
| 22 | 55.35 | 58.49 | Tahun seribu sembilan ratus delapan puluh satu, lahirlah Donkey Kong. |
| 23 | 59.20 | 63.66 | Jadi raksasa game kesayangan kalian itu... mulainya dari kartu, plus taksi dan nasi instan yang gagal. |
| 24 | 64.16 | 64.87 | Follow ya. |
| 25 | 65.56 | 66.77 | Besok ada yang lebih aneh. |

## SFX per scene
Menyusul di FASE 2.

## Catatan mix
Target SLOTH: -14 LUFS, true peak ≤ -1 dBTP, musik ducking -18 s/d -22 dB di bawah suara. Beri ruang di jeda 0,5–0,7 dtk (sebelum kalimat 3, 13, 14, 23, 24) untuk aksen SFX.

---

# FASE 2 — Musik + SFX + Mix (selesai)
Master: export/ch01_20261125_01_demo_master.mp4 | Mix: audio/mix.wav (48 kHz stereo, 67,43 dtk = 3.236.640 sampel persis) | Isyarat: audio/cues.md | Stem: audio/stems/{vo,musik,sfx}.wav (pra-normalisasi, skala sama dengan mix_raw)
Skrip: tools/cartoon-short/audio/make_mix_nintendo.py (benih acak tetap, bisa diulang) -> mix_raw.wav -> ffmpeg loudnorm 2-pass linear (I=-14, TP=-1,5) -> mix.wav

| Lapisan | File | Sumber | Lisensi | Wajib kredit? |
|---|---|---|---|---|
| Voice over | audio/vo.wav | edge-tts id-ID-ArdiNeural | layanan TTS, tanpa kuota | tidak |
| Musik | audio/stems/musik.wav | sintetis orisinal (numpy): lo-fi 84 bpm, pad Am9/Fmaj7/Dm9/E7sus, bass, beat, arpeggio petik acak berbenih, arpeggio persegi di bagian arcade | milik sendiri, tanpa pihak ketiga | tidak |
| SFX | audio/stems/sfx.wav | sintetis orisinal, 48 isyarat dari 18 jenis (whoosh, honk, car, skid, impact, powerup, pop, creak, paper, boing, clunk, crash, ding, buzz, blip, rattle, catch, ting) + udara kamar tipis | milik sendiri | tidak |

## Hasil ukur (ffmpeg ebur128, dibaca ulang dari master mp4 hasil AAC)
- Loudness terintegrasi -14,0 LUFS | true peak -1,5 dBTP | LRA 2,4 LU | sampel clip: 0
- Master: 1080x1920, h264 (copy dari render), aac 192k 48 kHz stereo, durasi format 67,43 dtk
- Tidak ada senyap: RMS 50 ms terendah -56 dB (tidak ada celah >1 dtk)
- Ducking: musik 19,8 dB di bawah suara saat kata; RMS musik 6,4 dB lebih rendah saat kata dibanding saat jeda (target -20 dB saat bicara, -8 dB saat jeda, serang ~13 ms, lepas ~250 ms)
- SFX saat kata rata-rata 18,7 dB di bawah suara; tiap SFX dibatasi maks -7 dB di bawah suara pada jendelanya (impact 3,50 dtk tetap -1,7 dB karena menumpuk di ujung kata "taksi", hanya 0,45 dtk)
- Suara tidak diubah levelnya selain gain global loudnorm (+2,1 dB)
- Musik naik per bagian: 0-12 misterius (RMS -38 dB), 12-21 hanafuda, 21-40 taksi/nasi + beat, 40-52 mainan, 52-66 arcade (puncak, arpeggio persegi mulai 56,9 dtk), fade out 1,2 dtk di akhir. Tanpa melodi yang meniru lagu/tema game.

## Catatan mix
- Bug diperbaiki di skrip: g_rattle sempat loop tak berujung (gap menyusut ke 0), kini dikunci minimal 15 ms.
- Stem belum dikali gain loudnorm (+2,1 dB); jumlah stem = mix_raw, bukan mix.wav.
- Kuota ElevenLabs tidak dipakai.
