<#
Collect diagnostics for the PPS project to help debugging "Maximum update depth exceeded" or similar runtime errors.

Usage: open PowerShell in the project root and run:
  .\scripts\collect_diagnostics.ps1

This will produce a timestamped file `diagnostics_YYYYMMDD_HHMMSS.txt` in the current folder.

Send that file (or its contents) when asking for help.
#>

$ts = Get-Date -Format "yyyyMMdd_HHmmss"
$out = Join-Path -Path (Get-Location) -ChildPath "diagnostics_$ts.txt"

function WriteAndEcho($text) { 
    "$text" | Tee-Object -FilePath $out -Append
}

"=== PPS diagnostics: $ts ===" | Out-File -FilePath $out -Encoding utf8

WriteAndEcho "Path: $(Get-Location)"
WriteAndEcho "User: $env:USERNAME"

WriteAndEcho "\n-- Git info --"
WriteAndEcho "Current branch: $(git rev-parse --abbrev-ref HEAD 2>$null)"
WriteAndEcho "HEAD commit: $(git rev-parse --short HEAD 2>$null)"
WriteAndEcho "Recent commits:" 
git --no-pager log --oneline -n 10 2>$null | Tee-Object -FilePath $out -Append
WriteAndEcho "\nGit status (short):"
git status -sb 2>$null | Tee-Object -FilePath $out -Append
WriteAndEcho "\nGit modified files:"
git ls-files -m 2>$null | Tee-Object -FilePath $out -Append

WriteAndEcho "\n-- System --"
WriteAndEcho "OS: $([System.Environment]::OSVersion.VersionString)"
WriteAndEcho "Node: $(node -v 2>$null)"
WriteAndEcho "NPM: $(npm -v 2>$null)"

WriteAndEcho "\n-- Top-level dependencies (npm ls --depth=0) --"
npm ls --depth=0 2>$null | Tee-Object -FilePath $out -Append

WriteAndEcho "\n-- Files of interest --"
foreach ($f in '.env', '.env.local', 'frontend/.env', 'frontend/.env.local') {
    $exists = Test-Path $f
    WriteAndEcho "$f -> $exists"
}

WriteAndEcho "\n-- Frontend package.json scripts (frontend/package.json) --"
if (Test-Path "frontend\package.json") {
    Get-Content frontend\package.json | Select-String '"scripts"' -Context 0,12 | Tee-Object -FilePath $out -Append
}

WriteAndEcho "\n-- Node processes (netstat listen ports filtered by node) --"
try { netstat -ano | Select-String -Pattern 'LISTENING' | Select-String -Pattern ':3000|:5173|:8080' | Tee-Object -FilePath $out -Append } catch {}

WriteAndEcho "\n-- Other checks --"
WriteAndEcho "Exists frontend/src/components/admin/VentasAnalytics.jsx -> $(Test-Path 'frontend/src/components/admin/VentasAnalytics.jsx')"
WriteAndEcho "Exists frontend/src/components/Header.jsx -> $(Test-Path 'frontend/src/components/Header.jsx')"

WriteAndEcho "\n== Instructions for reproducing the error and capturing browser stack trace =="
WriteAndEcho "1) In the browser reproduce the error (open the page that throws)."
WriteAndEcho "2) Open DevTools (F12) -> Console, copy the full error + stack trace and paste here."
WriteAndEcho "3) If possible, open the Sources panel, right-click the error frame and 'Reveal in source', note the file + line."
WriteAndEcho "4) Alternatively run the dev server and paste the terminal output (frontend):\n   cd frontend; npm i; npm run dev"

WriteAndEcho "\n-- End diagnostics --"

Write-Host "Diagnostics written to: $out"
Write-Host "Please attach that file (or paste its contents) when asking for help."

exit 0
