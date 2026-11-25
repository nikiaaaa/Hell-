# Riset gratis (NVIDIA NIM)

Peta: [[HOME]] · dipakai [[agents/sora-envy|ENVY]] & [[agents/sora-gluttony|GLUTTONY]]

Helper: `nvidia_riset.py`. Dipakai ENVY dan GLUTTONY untuk pekerjaan teks yang berat.
Model ini TIDAK bisa browsing. Sumber tetap harus diambil lewat WebFetch.

## Syarat
- Env var `NVIDIA_API_KEY` (jangan ditulis di file). Set sekali dengan `setx`, lalu buka ulang aplikasi.
- Python 3 (tanpa library tambahan).

## Hasil uji (2026-11-25)
| Model | Hasil |
|---|---|
| nvidia/nemotron-3.5-super-vl-120b-a12b | membalas, tabel fakta rapi. DEFAULT |
| nvidia/nemotron-3-ultra-550b-a55b | membalas, lebih banyak baris |
| nvidia/nemotron-3.5-bolt-e4b | membalas "siap" (uji konektivitas) |
| google/gemma-3-4b-it | 404, tidak bisa dipanggil dari akun ini |
| meta/llama-3.1-8b-instruct | 410, sudah pensiun |
| moonshotai/kimi-k3.1-pro | tidak selesai dalam 120 detik, tidak dipakai |

Catatan kualitas: kedua model yang berhasil memberi label "Kuat" untuk fakta dari satu sumber.
Jadi label keyakinan harus ditentukan manusia/agen sesuai aturan tim, bukan model.
