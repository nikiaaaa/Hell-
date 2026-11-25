# Script bantu

Peta: [[HOME]] · aturan: [[CLAUDE]]

| Script | Dipakai | Fungsi |
|---|---|---|
| `qa_check.py productions/<ID>` | SLOTH (cek sendiri), WRATH (langkah 1) | resolusi, fps, codec, durasi 30–60, loudness, true peak, frame hitam/beku, VO vs master → `export/qa.json` |
| `lint_status.py` | LUCIFER sebelum melapor | status.md valid (tanpa cuti), file ✅ benar-benar ada, gerbang tidak dilewati, vo.mp3 ada setelah Gerbang Suara |
| `lint_status.py --ledger "<kata>"` | ENVY, GLUTTONY, PRIDE, GREED | cari topik/hook/footage yang sudah dipakai tanpa membaca ledger penuh |
| `words_whisper.py productions/<ID>` | TEMPERANCE | VO ElevenLabs Tuan → `audio/words.json` (`{w,s,e}`, kata dari naskah, waktu dari faster-whisper; CPU bila CUDA belum lengkap) |
| [[tools/riset-gratis/README\|riset-gratis/nvidia_riset.py]] | ENVY, GLUTTONY | draf ide/ringkasan (tanpa browsing) |
| [[tools/cartoon-short/NOTES\|cartoon-short/]] | LUST, CHASTITY, KINDNESS, SLOTH, TEMPERANCE | Remotion + three.js; audio sintetis di `audio/` (music.py, sfx.py, mix.py) |
| [[tools/kantor-sora/README\|kantor-sora/]] | Tuan | Istana LUCIFER: papan perintah, tombol gerbang, form performa |

Aturan: API key tidak pernah ditulis di script, hanya dibaca dari environment variable.
**Tidak ada script TTS:** suara hanya dari ElevenLabs yang dibuat Tuan.
