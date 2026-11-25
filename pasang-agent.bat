@echo off
REM Menyalin 14 agent SORA Studio ke .claude\agents agar terbaca Claude Code
cd /d "%~dp0"
if not exist ".claude\agents" mkdir ".claude\agents"
copy /Y "agents\sora-*.md" ".claude\agents\" >nul
echo.
echo Selesai. Agent terpasang di .claude\agents:
dir /b ".claude\agents\sora-*.md"
echo.
pause
