# Aset yang dipakai ulang

Peta: [[HOME]] · dipakai oleh [[agents/sora-lust|LUST]], [[agents/sora-chastity|CHASTITY]], [[agents/sora-kindness|KINDNESS]]

## Kit yang sudah ada (`assets/assets/`, disimpan Tuan 2026-11-24)
| Folder | Isi | Format | Ukuran | Sumber / lisensi |
|---|---|---|---|---|
| `city-kit-commercial_2.1`, `citykit-comersial` | gedung toko & kantor (dua salinan kit yang sama) | GLB, FBX, OBJ | 12 MB | Kenney, CC0 |
| `city-kit-suburban_20` | rumah, pagar, pohon pinggir kota | GLB, FBX, OBJ | 8 MB | Kenney, CC0 |
| `citykits-industrials` | pabrik, cerobong, tangki | GLB, FBX, OBJ | 9 MB | Kenney, CC0 |
| `furniture-kit` | perabot interior (+ render isometrik/samping) | GLB, FBX, OBJ | 23 MB | Kenney, CC0 |
| `retro-textures-fantasy` | tekstur dinding/lantai | PNG | 1,5 MB | Kenney, CC0 |
| `skyboxes` | langit: alien, siang, pagi, malam, angkasa | PNG | 4,6 MB | **perlu dicek** |
| `forest` | pohon, batu, semak | glTF, FBX | 105 MB | **perlu dicek** (kemungkinan Quaternius, CC0) |
| `animal` | hewan | glTF, FBX | 76 MB | **perlu dicek** (kemungkinan Quaternius, CC0) |
| `transportation` | Cop, Taxi, SUV, mobil sport/biasa | FBX | 0,5 MB | **perlu dicek** |

Sebelum aset "perlu dicek" dipakai di video, LUST mencatat sumber aslinya dan menulis `LISENSI.txt` di folder itu.
Untuk three.js, pakai GLB/glTF (FBX perlu dikonversi dulu).

## Struktur untuk aset buatan studio
```
assets/
├─ characters/<channel>/<maskot>/   ← model sheet & ekspresi (CHASTITY)
├─ environments/<nama>/             ← set/props buatan sendiri + LISENSI.txt (LUST)
├─ music/  · sfx/                   ← bebas royalti / sintetis + sumber & lisensi (TEMPERANCE)
└─ fonts/                           ← font caption (SLOTH)
```
Setiap aset dari luar WAJIB punya catatan sumber & lisensi di foldernya.
