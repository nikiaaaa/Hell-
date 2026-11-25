# Istana LUCIFER (kantor-sora)

Peta: [[HOME]] · aturan: [[CLAUDE]] · instruksi papan untuk LUCIFER: [[tools/kantor-sora/server/lucifer-papan|lucifer-papan]]

Kantor 3D Studio SORA yang ditulis dari nol (React + three.js + Vite), tanpa kode template kantor-ai.
Tujuh ruang divisi (satu Dosa + satu Kebajikan) mengelilingi **Second Brain** (vault Obsidian = folder `OFFICE`), dan LUCIFER duduk di tahtanya di tengah.

## Menjalankan
- Klik dua kali shortcut **Istana LUCIFER** di desktop (atau `buka-kantor.bat`). Server jalan di jendela kecil yang
  diminimalkan; jangan ditutup selama kantor dipakai.
- Pin ke taskbar: klik kanan shortcut → *Show more options* → *Pin to taskbar*.
- Manual: `npm run dev` → http://localhost:5180

## Yang tampil (semuanya dari data nyata, tanpa jadwal pura-pura)
- **Agen bekerja** hanya kalau ada 🔄 di `productions/*/status.md`, atau sedang dipanggil LUCIFER dari papan.
  Agen siaga sesekali berjalan ke Second Brain (berlabel "siaga · baca Second Brain").
- **Second Brain**: setiap bola = satu catatan .md, garis = tautan antarcatatan, putih = diubah 20 menit terakhir.
- **Butuh keputusan Tuan**: gerbang ⏳ dan catatan berawalan `!` di status.md.

## Papan (panel kanan)
- **Perintah**: kirim perintah ke LUCIFER (menjalankan `claude -p` di folder OFFICE). Semua langkahnya (teks, alat,
  agen yang dipanggil, hasil) tertulis langsung. "Balas / lanjutkan" meneruskan percakapan terakhir (mis. memilih hook
  di Gerbang 1). Riwayat disimpan di `data/runs/`.
- **Produksi**: tabel status.md tiap video; klik nama berkas untuk membacanya.
- **Second Brain**: cari dan baca catatan, atau buka langsung di Obsidian.
- **Divisi**: isi satu email per divisi (disimpan di `data/divisi.json`, hanya catatan).

## Izin LUCIFER dari papan
`server/izin.json` = daftar alat yang boleh dipakai tanpa jendela izin. Edit berkas hanya otomatis di dalam OFFICE.
Alat lain ditolak dan muncul di papan; tambahkan di izin.json kalau memang perlu.
## Login sekali
Papan menjalankan Claude Code CLI sendiri; login aplikasi Claude desktop tidak ikut terpakai. CLI-nya terpasang di
dalam folder aplikasi desktop (versi Store), jadi buka PowerShell biasa dan jalankan:

```powershell
& "$env:LOCALAPPDATA\Packages\Claude_pzs8sxrjxfjjc\LocalCache\Roaming\npm\node_modules\@anthropic-ai\claude-code\bin\claude.exe"
```

Ketik `/login`, selesaikan login di browser, lalu `/exit`. Setelah itu perintah dari papan langsung jalan.

Cara yang lebih pasti (juga bisa dari terminal di dalam aplikasi Claude):

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File "D:\AA SMILEYY\CLAUDE STORAGE\OFFICE\tools\kantor-sora\login-cli.ps1"
```

## Keamanan
API hanya menerima permintaan dari `localhost:5180` dengan token yang dibuat setiap kali server dinyalakan.

## Aset
Lihat `public/aset/LISENSI.txt` (Kenney & Quaternius, CC0).
