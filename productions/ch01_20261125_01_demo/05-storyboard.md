# 05 — Storyboard

ID: ch01_20261125_01_demo | Agen: DILIGENCE | Naskah: 04-naskah.md, Versi 1 "Kaget" (FINAL) | Fakta: 03-cek-fakta.md | Serah terima: LUCIFER -> CHASTITY, LUST, TEMPERANCE, KINDNESS, SLOTH (GREED: 0 footage)

Durasi target: **±66 dtk** (171 kata / ±2,6 kata/dtk; rentang aman 62–68) | Format 1080x1920 @30 fps (1 dtk = 30 f)
Komposisi: **F 0% · G 0% · A 100%** (keputusan Tuan: tanpa footage pihak ketiga). Gaya: three.js di Remotion, "kartu 2D dalam dunia 3D" (skill cartoon-3d-short). Karakter: narator generik "bean head", bukan maskot resmi.
Jumlah shot: **22** (batas 22). Set: **5** (batas 5). Rata-rata 3,0 dtk/shot, terpanjang 3,9 dtk, terpendek 1,6 dtk.
Caption per kata ditangani komposisi di bawah layar. **Tidak ada teks lain di layar** (kolom efek hanya berisi kick/flash/DOF).
Waktu = perkiraan dari jumlah kata. KINDNESS wajib menyesuaikan ke `audio\words.json`; semua "reaksi" dihitung relatif ke kata kunci (0–3 f sebelum kata).

## Daftar set (5)

| Kode | Set | Cahaya | Dipakai di shot | Isi utama |
|---|---|---|---|---|
| A | Studio polos + ruang arcade 1981 (satu ruang, dua dekorasi) | day (bersih, latar biru malam #14213D ke kuning aksen) | 2,3,4,13,18,19,20,21,22 | Panggung polos untuk pembuka/penutup + pedestal; dekorasi arcade (lemari generik, layar piksel abstrak) hanya shot 18–21 |
| B | Bengkel kartu Kyoto 1889 | golden | 5,6,7,12 | Bangunan kayu rendah, meja kerja, rak kartu, kotak kardus |
| C | Jalan Kyoto 1960-an | day | 1,8,9,11 | Jalan batu, bangunan rendah, taksi |
| D | Dapur nasi instan | day | 10 | Kabinet, kompor, panci, bungkus nasi generik |
| E | Meja kantor-pabrik mainan 1966 | day | 14,15,16,17 | Meja teknisi, lampu meja, rak, kotak produk |

## Peta beat -> set

| Beat naskah | Shot | Set |
|---|---|---|
| HOOK | 1 | C |
| JANJI | 2 | A |
| CONTEXT | 3, 4 | A |
| TWIST 1 hanafuda | 5, 6, 7 | B |
| TWIST 2 bisnis sampingan | 8, 9 (taksi) · 10 (nasi) · 11 (gagal) · 12 (kartu lesu) · 13 (jalan baru) | C · D · C · B · A |
| TWIST 3 mainan ke game | 14–17 (Yokoi, Ultra Hand) · 18–19 (elektronik, 1981) · 20–21 (rangkum) | E · A |
| PENUTUP | 22 | A |

## Tabel shot

Lensa: mm setara 35 mm vertikal. Ekspresi memakai pustaka wajah bean-head (CHASTITY memetakan nama persisnya). Path aset Kenney (CC0) dipersingkat; akar = `D:\AA SMILEYY\CLAUDE STORAGE\copy style motion\assets\`.
Singkatan akar aset: **CC** = `city-kit-commercial_2.1\Models\GLB format\` · **FK** = `furniture-kit\Models\GLTF format\` (file .glb) · **SUB** = `city-kit-suburban_20\Models\GLB format\` · **IND** = `citykits-industrials\Models\GLB format\` · **TR** = `transportation\` (hanya FBX) · **RT** = `retro-textures-fantasy\PNG\` · **SKY** = `skyboxes\`.

| id | Mulai–akhir | VO (kutipan) | Set | Cahaya | Visual & aksi karakter | Kamera | Ekspresi | Aset Kenney | Efek |
|---|---|---|---|---|---|---|---|---|---|
| 01 | 0,0–3,1 | "Tunggu... ini beneran? Nintendo... pernah punya perusahaan taksi." | C | day | Narator di tengah jalan, CU, terkejut. Klakson; taksi menderu masuk dari belakangnya. Pada "taksi" (±2,5 dtk) taksi lewat sangat dekat lalu berhenti dengan rem berdecit. Hook = shot paling kuat. | Mulai CU 24 mm roll 4°, push-in cepat 0,6 %/f; whip-pan ke taksi di f45; berhenti glide, 28 mm | shock -> deadpan | TR `Taxi.fbx`; CC `low-detail-building-a.glb`, `low-detail-building-b.glb`; RT `floor_stone_pattern.png` (jalan); SKY `skybox-day.png` | Flash putih 2 f di f6; kick di f45; DOF cInf 15 pada wajah, lepas saat whip |
| 02 | 3,1–6,9 | "Dan itu bahkan bukan bagian paling aneh dari cerita mereka." | A | day | Narator menatap kamera, menunjuk ke samping, alis naik. Pada "aneh" (±5,6 dtk) lemari/pedestal gelap di belakang menyala sebentar lalu mati (teaser). | Glide orbit 25 f dari kiri ke tengah, 35 mm, push-in 0,25 %/f, roll 4° | smug -> brow raise | (latar prosedural; lantai polos) SKY `skybox-night.png` sebagai gradien belakang opsional | DOF cInf 12 |
| 03 | 6,9–10,0 | "Kalian kenal Nintendo dari Famicom dan Game Boy." | A | day | Dua pedestal: kiri siluet konsol rumah tanpa merek (kotak abu), kanan siluet genggam tanpa merek (persegi panjang dengan layar abu). Muncul pop bergantian tepat sebelum "Famicom" (±8,1 dtk) dan "Game Boy" (±9,0 dtk). Tanpa logo, tanpa warna khas. | Cut ke 40 mm, glide kiri ke kanan 20 f, creep 0,2 %/f | grin | Prosedural: balok & kapsul; FK `lampSquareTable.glb` (hiasan pedestal opsional) | Kick kecil tiap pop; DOF 10 |
| 04 | 10,0–12,3 | "Tapi awalnya? Sama sekali bukan game." | A | day | Narator mengayunkan tangan: kedua siluet tersapu keluar frame; pedestal kosong. Pada "bukan game" (±11,3 dtk) narator geleng. | Whip-pan mengikuti sapuan (cut kamera ke 28 mm), lalu hold creep 0,35 %/f | deadpan -> shake head | Prosedural | Kick di sapuan; flash 1 f saat benda menghilang |
| 05 | 12,3–15,5 | "Menurut Nintendo sendiri, sejak seribu delapan ratus delapan puluh sembilan, mereka bikin kartu hanafuda..." | B | golden | Fasad bengkel kayu Kyoto, matahari rendah menembus belakang. Pengrajin bean keluar membawa nampan kartu. Pada "seribu delapan ratus..." (±13,0) lampion di depan bergoyang. Tidak ada teks tahun. | Establishing 24 mm, crane naik pelan 30 f lalu push-in 0,2 %/f, foreground: pagar | smile calm | SUB `fence.glb`, `path-long.glb`; CC `low-detail-building-wide-a.glb`; RT `wall_timber.png`, `door_wood.png`; SKY `skybox-morning.png`; lampion prosedural | Bloom matahari; DOF 0 (wide) |
| 06 | 15,5–18,5 | "...kartu hanafuda... kartu tradisional Jepang, di Kyoto." | B | golden | Meja kerja, CU kartu hanafuda desain orisinal (bunga sederhana: peony/pine abstrak, bukan salinan desain merek mana pun). Pengrajin menyusun 4 kartu ke kipas. Pada "hanafuda" (±15,8) kipas terbuka. | Cut ke makro 50 mm, DOF kuat, glide kiri 25 f, push 0,3 %/f | focused | FK `desk.glb`, `chairDesk.glb`, `lampSquareTable.glb`; kartu prosedural | DOF cInf 16 pada kartu; kick kecil saat kipas terbuka |
| 07 | 18,5–20,8 | "Iya. Kartu." | B | golden | Pengrajin menoleh ke kamera, memegang kartu tinggi-tinggi, bangga tapi datar. Beat "Iya." (±19,4) kepala mengangguk, "Kartu." (±20,2) kartu mendekat ke lensa. | CU 35 mm, snap-zoom 0,6 %/f pada "Kartu." | deadpan proud | FK `desk.glb` | Kick di "Kartu."; DOF 14 |
| 08 | 20,8–23,8 | "Nah, awal tahun enam puluhan, Nintendo mulai coba-coba." | C | day | Jalan Kyoto siang. Pria bean berjas berjalan sambil mengusap kedua tangan, melirik kiri kanan jahil. Latar: bangunan rendah, tiang, pohon. | Tracking glide mengikuti dari samping 30 f, 32 mm, roll 4°, foreground: pot tanaman | scheming grin | CC `low-detail-building-c.glb`, `low-detail-building-d.glb`, `detail-awning.glb`; SUB `tree-small.glb`, `planter.glb`; RT `floor_stone_pattern.png` | DOF 10 |
| 09 | 23,8–26,5 | "Bikin perusahaan taksi di Kyoto, namanya Daiya." | C | day | Taksi masuk dari belakang kamera, parkir rapi di depan bangunan; pria berjas menepuk atap. Pada "taksi" (±24,6) taksi muncul; pada "Daiya" (±26,0) pria menepuk. Tanpa tulisan di taksi, tanpa jumlah armada. | Glide rendah 24 mm, push 0,25 %/f; cut halus di f60 ke 3/4 depan | proud | TR `Taxi.fbx`; CC `low-detail-building-e.glb`; `detail-overhang.glb` | Kick kecil saat taksi berhenti; DOF 8 |
| 10 | 26,5–30,4 | "Terus... jualan nasi instan. Aku sampai baca ulang dua kali." | D | day | Dapur sempit. Panci mengepul; bungkus nasi generik (polos, tanpa merek) disobek: mangkuk nasi muncul (prosedural). Narator memegang bungkusnya, menyipitkan mata, kepala menyentak dua kali (dua baca ulang) di ±28,6 dan ±29,4. | Cut ke 35 mm, push-in 0,3 %/f, snap kecil di tiap sentakan, roll 4° | squint -> double-take | FK `kitchenStove.glb`, `kitchenCabinet.glb`, `kitchenCabinetUpper.glb`, `kitchenBar.glb`, `books.glb`; RT `floor_tiles_tan_small.png` | Kick x2; DOF 12 pada wajah |
| 11 | 30,4–32,7 | "Hasilnya? Semua bisnis sampingan itu gagal." | C | day | Taksi mogok: kap berasap, satu roda copot menggelinding keluar; bungkus nasi (dari shot 10) jatuh dari tangan pria. Pada "gagal" (±32,0) roda jatuh rebah, pria lunglai. | Cut 28 mm, hold creep 0,35 %/f, kick pada "gagal" | sad -> flat | TR `Taxi.fbx`; CC `low-detail-building-e.glb` | Kick di "gagal"; efek asap kartu; DOF 10 |
| 12 | 32,7–36,5 | "Penjualan kartu juga mulai lesu sekitar tahun enam puluh empat." | B | golden (redup, rim rendah) | Gudang kartu: tumpukan kotak tak laku, debu melayang, pengrajin menghela napas. Pada "lesu" (±34,6) satu kotak jatuh dan terbuka, kartu bertebaran. Tanpa grafik/angka. | Glide pelan sepanjang rak 25 f, 32 mm, push 0,2 %/f | tired | FK `bookcaseOpen.glb`, `cardboardBoxClosed.glb`, `cardboardBoxOpen.glb`, `desk.glb` | Kick saat kotak jatuh; DOF 10 |
| 13 | 36,5–38,1 | "Nintendo butuh jalan baru." | A | day | Narator di pedestal kosong, menatap ke atas, bohlam kosong muncul lalu menyala saat "baru" (±37,7). | Cut 35 mm, push 0,5 %/f | thinking -> spark | Prosedural (bohlam) | Flash 1 f saat nyala; DOF 12 |
| 14 | 38,1–41,9 | "Dan jalan barunya datang dari tempat yang paling nggak terduga." | E | day | Ruang kerja pabrik mainan: kamera meluncur melewati rak dan kotak menuju satu meja di pojok; teknisi bean bertopi membungkuk di bawah lampu. Pada "nggak terduga" (±41,0) lampu meja berkedip. | Glide panjang 40 f dari 24 mm ke 35 mm, roll 4°, foreground: rak | curious | FK `bookcaseOpen.glb`, `cardboardBoxClosed.glb`, `doorway.glb`, `desk.glb`, `lampSquareTable.glb`; RT `floor_wood_planks.png` | DOF 0 awal -> 10 di akhir |
| 15 | 41,9–45,2 | "Tahun enam puluh enam, seorang teknisi mesin bernama Gunpei Yokoi iseng bikin tangan mainan..." | E | day | Teknisi generik (bukan potret tokoh nyata, tanpa wajah mirip foto) mengutak-atik rangka bambu/kayu bersilang dengan obeng. Pada "iseng" (±44,0) ia nyengir. | MS 40 mm, glide lateral 25 f, creep 0,25 %/f | sly grin | FK `desk.glb`, `chairDesk.glb`, `lampSquareTable.glb`, `books.glb` | DOF 12 |
| 16 | 45,2–48,5 | "...bikin tangan mainan yang bisa memanjang." | E | day | Mainan tangan memanjang (gunting-lazy-tong, warna generik oranye/kuning, tangan hanya kapsul) dipanjangkan teknisi: melesat ke arah lensa lalu meraih kotak jauh. Pada "memanjang" (±46,8) mainan membentang penuh melewati frame. | Cut 28 mm, ayun masuk-ke-lensa, push 0,6 %/f saat membentang, foreground: lengan mainan | amazed | Prosedural (lazy-tong); FK `cardboardBoxClosed.glb` | Kick saat menjepit; DOF 14 |
| 17 | 48,5–51,2 | "Nintendo menjualnya sebagai Ultra Hand... dan laris." | E | day | Tumpukan kotak mainan keluar-masuk pintu dibawa banyak orang dewasa bean; kotak melambung. Pada "laris" (±50,6) tumpukan meledak jadi konfeti kartu. Tanpa nama/logo produk di kotak. | Glide mundur 24 mm, push 0,3 %/f, roll 4° | delighted | FK `cardboardBoxClosed.glb`, `cardboardBoxOpen.glb`, `doorway.glb` | Kick di "laris"; flash 1 f |
| 18 | 51,2–55,0 | "Dari situ: mainan, lalu elektronik. Tahun seribu sembilan ratus delapan puluh satu," | A (dekorasi arcade) | day | Deretan pedestal: mainan tangan menjadi perangkat elektronik generik (kotak berlayar piksel abstrak). Ruang berubah ke arcade: lantai ubin, lemari generik berdiri di akhir. | Dolly mulus 40 f, 30 mm -> 24 mm, creep 0,2 %/f | proud | Prosedural; RT `floor_tiles_blue_small.png` | Bloom emissive; DOF 8 |
| 19 | 55,0–56,9 | "lahirlah Donkey Kong." | A (arcade) | day | Lemari arcade generik (badan polos, layar piksel abstrak: bentuk kotak naik-turun, tanpa gorila, tanpa tong, tanpa tokoh dikenali) menyala sebelum "lahirlah" (±55,8), cahaya layar menyapu wajah narator. | Cut CU 35 mm, snap-zoom 0,6 %/f saat menyala | awe | Prosedural (lemari); FK `floorFull.glb` | Flash 2 f; kick; DOF 12 |
| 20 | 56,9–60,0 | "Jadi raksasa game kesayangan kalian itu... mulainya dari kartu, plus taksi" | A | day | Barisan lima pedestal berurutan: kartu hanafuda orisinal, taksi mini, mangkuk nasi, mainan tangan, lemari mini. Kamera menyusuri; pada "kartu" (±58,3) pedestal pertama menyala, pada "taksi" (±59,6) kedua. | Glide lateral 30 f, 40 mm, creep 0,25 %/f | tickled | Prosedural; TR `Taxi.fbx` (versi kecil) | DOF 10; kick kecil tiap nyala |
| 21 | 60,0–63,1 | "...dan nasi instan yang gagal." | A | day | Narator memeluk semua mainan mini di dada, menaikkan satu alis, senyum miring. Pada "gagal" (±62,5) mangkuk nasi menggelinding turun dan narator menangkapnya. | Cut 35 mm, push 0,3 %/f, roll 4° | smug | Prosedural | Kick kecil di tangkapan; DOF 12 |
| 22 | 63,1–65,8 | "Follow ya. Besok ada yang lebih aneh." | A | day | Narator menatap lensa, mengedip, lalu menunjuk ke samping (arah "besok"); latar berubah kuning aksen sebentar. Akhir dengan jump cut loop ke pembuka. | CU 28 mm, push 0,5 %/f; wink-zoom di "aneh" (±65,3) | wink | Prosedural | Flash 1 f di akhir; DOF 14 |

Catatan shot: durasi per shot di tabel selalu < 4 dtk; setiap shot punya gerak kamera (creep) dan setidaknya satu perubahan visual. Tidak ada tahan statis >=4 frame.

## Kebutuhan karakter & ekspresi (untuk CHASTITY)

| Karakter | Shot | Catatan |
|---|---|---|
| Narator generik bean head (kaos biru malam #14213D, aksen kuning #FFC83D) | 1,2,3,4,10,13,18–22 | Pustaka: shock, deadpan, smug, grin, squint, double-take, thinking, awe, wink. Bukan maskot resmi. |
| Pengrajin kartu Kyoto (bean, kimono sederhana, warna orisinal) | 5,6,7,12 | smile, focused, deadpan proud, tired |
| Pria berjas (pemilik) | 8,9,11 | scheming, proud, sad |
| Teknisi bertopi (generik, bukan tiruan wajah Gunpei Yokoi) | 14,15,16 | curious, sly grin, amazed |
| Figuran dewasa pembawa kotak | 17 | delighted; blink acak 0,5–2,3 dtk |

## Kebutuhan lingkungan/props 3D (untuk LUST) — maks 5 set

Prosedural (dibuat sendiri, bukan Kenney): kartu hanafuda orisinal (pola bunga sederhana, 6 desain bunga umum non-merek), lampion, konsol & genggam siluet tanpa merek, mangkuk & bungkus nasi polos, mainan tangan lazy-tong oranye/kuning, lemari arcade generik dengan layar piksel abstrak, bohlam, pedestal.
Kenney CC0 (nama file diverifikasi ada): `TR\Taxi.fbx` (hanya FBX; konversi/pakai FBXLoader), CC `low-detail-building-a/b/c/d/e/wide-a.glb`, `detail-awning.glb`, `detail-overhang.glb`, SUB `fence.glb`, `path-long.glb`, `tree-small.glb`, `planter.glb`, FK `desk.glb`, `chairDesk.glb`, `lampSquareTable.glb`, `bookcaseOpen.glb`, `cardboardBoxClosed.glb`, `cardboardBoxOpen.glb`, `books.glb`, `doorway.glb`, `floorFull.glb`, `kitchenStove.glb`, `kitchenCabinet.glb`, `kitchenCabinetUpper.glb`, `kitchenBar.glb`; tekstur RT `floor_stone_pattern.png`, `floor_wood_planks.png`, `floor_tiles_tan_small.png`, `floor_tiles_blue_small.png`, `wall_timber.png`, `door_wood.png`; langit SKY `skybox-day.png`, `skybox-morning.png`, `skybox-night.png`. Kit `citykits-industrials` (mis. `IND\building-a.glb`) hanya cadangan bila perlu pabrik. Warna ulang ke palet channel; hapus cap/merek kalau ada.

## Catatan suara & musik (untuk TEMPERANCE)

Narasi ±171 kata, jeda `...` di hook dan "Terus... jualan", penekanan: taksi, bukan game, kartu hanafuda, gagal, nasi instan, Ultra Hand, laris, Donkey Kong. SFX per shot: klakson+deru (01), whoosh (04), kipas kartu (06), decit rem (09), "bruk" kotak (12), ting bohlam (13), boing lazy-tong (16), chiptune power-on generik 8-bit (19, bukan melodi game mana pun), "pop" pedestal (20). Musik: lo-fi misterius, naik di TWIST 3 (shot 14+), turun saat "gagal" (shot 11) dan shot 12. Duck di bawah VO. Mix standar skill: musik +3 dB, SFX -6 dB, VO tetap.

## Yang TIDAK ditampilkan (untuk WRATH)

Daftar visual yang harus tidak muncul di render mana pun:
- Logo, tipografi, atau wordmark "Nintendo", "Famicom", "Game Boy", "Donkey Kong", "Ultra Hand" (nama hanya diucapkan di VO; juga tanpa nama di kotak produk).
- Mario, Donkey Kong (gorila), tong, putri, platform merah/biru, atau karakter Nintendo apa pun, juga yang "mirip".
- Bentuk atau warna khas konsol: bukan siluet Famicom (merah-putih), bukan Game Boy (abu dengan layar hijau); siluet harus abu netral dan bentuk generik.
- Desain kartu hanafuda resmi Nintendo, kotak kartu, atau ilustrasi resmi: pakai desain bunga orisinal.
- Ultra Hand asli: pakai gunting-lazy-tong generik oranye/kuning, tanpa tangan bertanda merek.
- Wajah nyata Gunpei Yokoi, Hiroshi Yamauchi, atau tokoh nyata lain; teknisi & pemilik harus bean head generik.
- Logo/nama Daiya, San-O, Nissin, atau merek nasi instan/taksi nyata; taksi tanpa tulisan.
- Teks tahun, angka penjualan/armada, grafik di layar; teks selain caption.
- Footage/foto arsip pihak ketiga (0%).

## Daftar kebutuhan footage (untuk GREED)

Tidak ada. 0% footage pihak ketiga; GREED tidak dibutuhkan. Semua shot dirender dari dunia 3D sendiri.
