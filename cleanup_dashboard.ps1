$path = "e:\Antigravity\Agency\pages\AdminDashboard.tsx"
$lines = Get-Content $path
$count = $lines.Count
$keep1 = $lines[0..3487]
$keep2 = $lines[3977..($count-1)]
$newLines = $keep1 + $keep2
$newLines | Set-Content $path -Encoding UTF8
Write-Host "Cleanup complete. Removed lines 3489-3977."
