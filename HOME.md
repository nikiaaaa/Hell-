# 🧠 HOME — Second Brain SORA Studio

Peta seluruh vault untuk LUCIFER dan Tuan. Sub agen **tidak** membaca file ini: LUCIFER memberi mereka path persis.

## Aturan & orkestrasi
- [[CLAUDE]] — LUCIFER: alur, gerbang, aturan (sumber kebenaran)
- [[README]] — cara memasang & memulai
- [[productions/_TEMPLATE/README|Template produksi]] · [[productions/_TEMPLATE/status|status.md kosong]]

## Channel
| Channel | Bible | Ledger | Pelajaran | Kuota suara | Performa |
|---|---|---|---|---|---|
| channel-01 | [[channels/channel-01/bible\|bible]] | [[channels/channel-01/ledger\|ledger]] | [[channels/channel-01/pelajaran\|pelajaran]] | [[channels/channel-01/kuota\|kuota]] | `channels/channel-01/performa.csv` |
| template | [[channels/_template/bible\|bible]] | [[channels/_template/ledger\|ledger]] | [[channels/_template/pelajaran\|pelajaran]] | [[channels/_template/kuota\|kuota]] | |

Ledger dicari lewat `python tools/lint_status.py --ledger "<kata kunci>"` (hemat token), tidak dibaca penuh.

## Aturan vault (hemat)
- **Baca seperlunya:** tiap agen hanya membaca file di baris "Baca hanya" pada file agennya. Tidak ada yang membaca seluruh vault, `REFFERENCES/`, `tools/`, atau produksi video lain.
- **Satu penulis per file:** `status.md` dan `kuota.md` → LUCIFER · `ledger.md` dan `pelajaran.md` → CHARITY · `bible.md` → Tuan · `laporan-mingguan.md` → PATIENCE · agen lain hanya file tahapnya di `productions/<ID>/`.
- **Tanpa RAG/embedding/MCP Obsidian:** Claude Code membaca `.md` langsung.
- **Perawatan mingguan** (setelah laporan PATIENCE): `pelajaran.md` tetap ≤ 15 baris; catatan yang 2 minggu tidak dibaca agen dipindah ke `arsip/`.
- **Backup:** klik dua kali `simpan-versi.bat` setelah Gerbang 2.

## Tim: 7 divisi (Dosa + Kebajikan)
| Divisi | Dosa | Kebajikan |
|---|---|---|
| Tren & Data | [[agents/sora-envy\|ENVY]] · `studio-tren` | [[agents/sora-patience\|PATIENCE]] · `studio-analitik` |
| Fakta | [[agents/sora-gluttony\|GLUTTONY]] · `studio-gali-fakta` | [[agents/sora-humility\|HUMILITY]] · `studio-cek-fakta` |
| Cerita | [[agents/sora-pride\|PRIDE]] · `studio-naskah` | [[agents/sora-diligence\|DILIGENCE]] · `studio-storyboard` |
| Karakter & Dunia | [[agents/sora-lust\|LUST]] · `studio-dunia` | [[agents/sora-chastity\|CHASTITY]] · `studio-karakter` |
| Animasi & Footage | [[agents/sora-greed\|GREED]] · `studio-footage` | [[agents/sora-kindness\|KINDNESS]] · `cartoon-3d-short` |
| Suara & Edit | [[agents/sora-sloth\|SLOTH]] · `studio-rakit` | [[agents/sora-temperance\|TEMPERANCE]] · `studio-vo` |
| QA & Rilis | [[agents/sora-wrath\|WRATH]] · `studio-qa` | [[agents/sora-charity\|CHARITY]] · `studio-rilis` |

Skill ada di `.claude/skills/<nama>/SKILL.md` (folder tersembunyi, tidak tampil di Obsidian).

## Produksi
- [[productions/ch01_20261125_01_demo/status|ch01_20261125_01_demo]] — Nintendo pernah punya taksi (demo, penomoran file lama)

LUCIFER menambahkan satu baris di sini untuk setiap produksi baru.

## Referensi & aset
- [[REFFERENCES/README|REFFERENCES]] — 4 short acuan gaya dan tempo + screenshot favorit
- [[assets/README|assets]] — kit 3D Kenney (kota, furnitur, hutan, kendaraan, hewan, skybox)

## Alat
- [[tools/README|tools]] — `qa_check.py`, `lint_status.py`, `words_whisper.py`
- [[tools/kantor-sora/README|Istana LUCIFER]] — papan & kantor 3D (http://localhost:5180)
- [[tools/cartoon-short/NOTES|cartoon-short]] — render Remotion + three.js
- [[tools/riset-gratis/README|riset-gratis]] — helper NVIDIA (draf saja)
