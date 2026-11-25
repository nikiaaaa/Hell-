# Login sekali untuk Claude Code CLI yang dipakai papan Istana LUCIFER.
# Membuang variabel sesi aplikasi desktop dulu, supaya login tersimpan untuk akun Tuan sendiri.
Get-ChildItem env: | Where-Object { $_.Name -match '^(CLAUDECODE$|CLAUDE_CODE_|CLAUDE_AGENT_SDK|CLAUDE_PID$|CLAUDE_PREVIEW|ANTHROPIC_BASE_URL$)' } | ForEach-Object { Remove-Item "env:$($_.Name)" }
$exe = @(
  "$env:APPDATA\npm\node_modules\@anthropic-ai\claude-code\bin\claude.exe",
  (Get-ChildItem "$env:LOCALAPPDATA\Packages" -Directory -Filter 'Claude*' -ErrorAction SilentlyContinue | ForEach-Object { "$($_.FullName)\LocalCache\Roaming\npm\node_modules\@anthropic-ai\claude-code\bin\claude.exe" })
) | Where-Object { $_ -and (Test-Path $_) } | Select-Object -First 1
if (-not $exe) { Write-Host 'claude.exe tidak ditemukan.'; exit 1 }
& $exe auth login
& $exe auth status
