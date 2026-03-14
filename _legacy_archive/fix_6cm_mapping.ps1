# Renaming script to match slugs exactly
$dir = "e:\Antigravity\CarDecal3\public\Site_Pics\Decals\6cm_nodups"
$items = Get-ChildItem $dir -File

foreach ($item in $items) {
    $newName = $null
    
    # Pattern 1: "06cm - 01.JPG" -> "6cm-1.jpg"
    if ($item.Name -match "06cm - (\d+)\.JPG$") {
        $num = [int]$matches[1]
        $newName = "6cm-$num.jpg"
    }
    # Pattern 2: "6cm-01.jpg" -> "6cm-1.jpg"
    elseif ($item.Name -match "6cm-0(\d)\.jpg$") {
        $num = $matches[1]
        $newName = "6cm-$num.jpg"
    }

    if ($newName -and $newName -ne $item.Name) {
        $targetPath = Join-Path $dir $newName
        if (Test-Path $targetPath) {
            Remove-Item $targetPath -Force
        }
        Rename-Item $item.FullName -NewName $newName -Force
        Write-Host "Renamed: $($item.Name) -> $newName"
    }
}

# Now generate a comprehensive SQL for slugs 1-89
$sqlOut = "e:\Antigravity\CarDecal3\update_6cm_final.sql"
$lines = @()
$lines += "-- Final 6cm mapping to /Site_Pics/Decals/6cm_nodups/"

for ($i = 1; $i -le 89; $i++) {
    $slug = "6cm-$i"
    # Note: Some files might be .png (like 69)
    $ext = "jpg"
    if ($i -eq 69) { $ext = "png" }
    
    $path = "/Site_Pics/Decals/6cm_nodups/6cm-$i.$ext"
    $lines += "UPDATE products SET avatar = '$path', cover_image = '$path' WHERE slug = '$slug';"
    # Also support 0-padded slugs just in case some exist in DB
    if ($i -lt 10) {
        $slug0 = "6cm-0$i"
        $lines += "UPDATE products SET avatar = '$path', cover_image = '$path' WHERE slug = '$slug0';"
    }
}

# Special case for 6cm-0
$lines += "UPDATE products SET avatar = '/Site_Pics/Decals/6cm_nodups/6cm-0.jpg', cover_image = '/Site_Pics/Decals/6cm_nodups/6cm-0.jpg' WHERE slug = '6cm-0';"

$lines | Out-File $sqlOut -Encoding UTF8
Write-Host "SQL generated: $sqlOut"
