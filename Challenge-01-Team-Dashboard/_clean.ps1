cd D:\CIPHER-repo
git rm -r --cached "Challenge-01-Team-Dashboard/Claude outputs" -q 2>$null
git rm -r --cached "Challenge-01-Team-Dashboard/docs" -q 2>$null
Remove-Item -Recurse -Force "D:\CIPHER-repo\Challenge-01-Team-Dashboard\Claude outputs" -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force "D:\CIPHER-repo\Challenge-01-Team-Dashboard\docs" -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force "D:\cipher-tsj-dashboard\Claude outputs" -ErrorAction SilentlyContinue
$gi = "D:\CIPHER-repo\.gitignore"
$lines = @("Claude outputs/", "**/Claude outputs/", "docs/", "**/docs/")
foreach ($l in $lines) { Add-Content -Path $gi -Value $l }
robocopy "D:\cipher-tsj-dashboard" "D:\CIPHER-repo\Challenge-01-Team-Dashboard" /E /XD node_modules .next .vercel .git "Claude outputs" docs /XF AGENTS.md CLAUDE.md /NFL /NDL /NJH /NJS /NC /NS | Out-Null
git add -A
git -c user.name="Vibbhor Jain" -c user.email="vibhorseeyal@gmail.com" commit -m "Crew portraits and full medal set; drop working notes from the repo" -q
git push -q 2>&1 | Select-Object -Last 2
Write-Output "--- leftover tracked:"
git ls-files | Where-Object { $_ -match "Claude|docs/" }
Write-Output "--- total files:"
(git ls-files | Measure-Object).Count
