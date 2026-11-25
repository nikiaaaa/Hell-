@echo off
REM Simpan versi vault SORA Studio dengan git. Klik dua kali setelah Gerbang 2.
cd /d "%~dp0"
where git >nul 2>nul || (echo Git belum terpasang: https://git-scm.com & pause & exit /b)
git add -A
git commit -m "Simpan versi %date% %time%"
echo.
echo Selesai. Kembalikan file yang salah: git log -- nama-file, lalu git checkout ^<kode^> -- nama-file
pause
