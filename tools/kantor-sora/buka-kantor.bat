@echo off
rem Buka Istana LUCIFER (kantor-sora): nyalakan server (kalau belum jalan) lalu buka browser.
cd /d "%~dp0"
curl.exe -s -o nul --max-time 2 http://localhost:5180/
if errorlevel 1 (
  start "Istana LUCIFER (server) - jangan ditutup" /min cmd /c "npm run dev"
  for /l %%i in (1,1,60) do (
    curl.exe -s -o nul --max-time 1 http://localhost:5180/ && goto buka
    timeout /t 1 /nobreak >nul
  )
)
:buka
start "" http://localhost:5180
