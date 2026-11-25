---
name: studio-vo
description: Cara TEMPERANCE (divisi Suara & Edit) menulis prompt VO ElevenLabs siap tempel (per detik, emosi, intonasi), lalu mengolah VO dari Tuan jadi words.json dan mix. Dipakai agen sora-temperance.
---

# VO ElevenLabs (suaranya dibuat Tuan)

**Dilarang membuat suara sendiri** (edge-tts, gTTS, atau TTS apa pun). Kalau `audio/vo.mp3` belum ada, berhenti
dan minta ke Tuan lewat LUCIFER.

## Tahap 5 — `05-vo-prompt.md`
1. **Pengaturan** (dari bible): voice, model **Eleven v3** (mendukung tag emosi) atau Multilingual v2.
   Saran v2: Stability 35–45%, Similarity 75%, Style 30–45%, Speaker boost aktif, Speed 1.05–1.10.
   Saran v3: mode Natural. Tempo diatur lewat tanda baca dan tag.
2. **Blok tempel v3:** seluruh naskah dalam satu blok, dengan audio tag dalam kurung siku sebelum kalimat:
   `[excited]`, `[curious]`, `[whispers]`, `[mischievously]`, `[sarcastic]`, `[surprised]`, `[laughs]`, `[sighs]`, `[pause]`.
   Jeda pendek `…`, jeda panjang `[pause]`, penekanan dengan HURUF BESAR pada satu kata (maksimal 1 per kalimat).
3. **Blok tempel v2** (tanpa tag): teks bersih dengan tanda baca yang sama.
4. **Tabel arahan** per kalimat:
   `| # | Detik target | Kalimat | Emosi | Intonasi (naik/turun/datar, kata yang ditekan) | Tempo |`
   Total 30–60 dtk (±3 kata/dtk). Hook selesai dalam ≤ 2 dtk.
5. **Jumlah karakter** (untuk `kuota.md`) dan cara menyimpan: unduh MP3 → `productions/<ID>/audio/vo.mp3`.
   Kalau Tuan membuat beberapa take, simpan sebagai `vo_take2.mp3` dan seterusnya, lalu Tuan memilih.

## Tahap 6 — setelah VO ada → `06-audio.md`
1. `python tools/words_whisper.py productions/<ID>` membuat `audio/words.json` berformat `[{"w": kata, "s": mulai, "e": akhir}]`, dengan kata dicocokkan ke naskah final. Format ini dibaca `captions.tsx`.
2. Kalau durasi di luar 30–60 dtk, **jangan dipotong paksa**. Lapor ke Tuan dan sarankan atur speed atau buat ulang.
3. Musik & SFX: sintetis orisinal (`tools/cartoon-short/audio/`: music.py, sfx.py, mix.py) atau bebas royalti
   dengan lisensi tercatat. Musik di-duck -18 s/d -22 dB di bawah VO.
4. Mix → `audio/mix.wav`: -14 LUFS, true peak ≤ -1 dBTP.
5. Tulis jumlah karakter di `05-vo-prompt.md`; LUCIFER yang mencatatnya ke `kuota.md` saat Gerbang Suara.

```
VO: audio/vo.mp3 | Durasi | Karakter | Voice/model
| Lapisan | File | Sumber | Lisensi | Kredit? |
## Penanda waktu per beat (HOOK/SETTING/AKSI/TWIST/PENUTUP)
```

Aturan bersama: bible channel menang bila bertentangan. Kerjakan versi terkecil yang tuntas, lapor singkat (sekali baca), dan sebut apa yang dilewati atau belum dicek.
