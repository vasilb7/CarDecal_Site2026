$source = 'e:\Antigravity\CarDecal3\public\Site_Pics\Decals\6cm_nodups'
$sqlOut = 'e:\Antigravity\CarDecal3\update_6cm_paths.sql'
$sqlLines = [System.Collections.Generic.List[string]]::new()
$sqlLines.Add('-- UPDATE avatar + cover_image to 6cm_nodups paths')

$files = Get-ChildItem -Path $source -File | Where-Object { $_.Extension -match '\.(jpg|jpeg|JPG|JPEG)$' } | Sort-Object Name

foreach ($f in $files) {
    if ($f.BaseName -match '-\s*(\d+)$') {
        $numStr = $matches[1]              # e.g. "01", "10"
        $newName = "6cm-$numStr.jpg"        # e.g. "6cm-01.jpg"
        $destFile = Join-Path $source $newName

        # Rename/copy only if target doesn't exist yet
        if (-not (Test-Path $destFile)) {
            Copy-Item -LiteralPath $f.FullName -Destination $destFile -Force
        }

        Write-Host "$($f.Name) -> $newName"

        # Build slug: strip leading zeros but keep single zero
        $numInt = [int]$numStr
        $slug = "6cm-$numInt"            # e.g. 6cm-1, 6cm-10

        $imgPath = "/Site_Pics/Decals/6cm_nodups/$newName"
        $sqlLines.Add("UPDATE products SET avatar = '$imgPath', cover_image = '$imgPath' WHERE slug = '$slug';")
    }
}

$sqlLines | Out-File -FilePath $sqlOut -Encoding UTF8
Write-Host "Done. SQL saved: $sqlOut"
