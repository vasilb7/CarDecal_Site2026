$path = "e:\Antigravity\CarDecal3\data\products.ts"
$content = [System.IO.File]::ReadAllText($path, [System.Text.Encoding]::UTF8)

# Find the last product closing brace. Currently it's the garbled 12cm-393
# I'll find where 12cm-03 starts and cut everything after it.
$startOf12cm03 = $content.IndexOf("slug: `"12cm-03`"")

if ($startOf12cm03 -gt 0) {
    # Find the matching opening brace of this object (going backwards)
    $partBefore03 = $content.Substring(0, $startOf12cm03)
    $lastOpeningBrace = $partBefore03.LastIndexOf("  {")
    
    if ($lastOpeningBrace -gt 0) {
        $baseContent = $partBefore03.Substring(0, $lastOpeningBrace).TrimEnd(" `r`n`t,")
    }
    else {
        $baseContent = $content.TrimEnd(" `r`n`t,];")
    }
}
else {
    $baseContent = $content.TrimEnd(" `r`n`t,];")
}

# Now generate the correct slugs from 03 to 394
$remaining = ""
for ($i = 3; $i -le 394; $i++) {
    $fileNum = $i - 1
    # Formatting for file number (leading zero if < 10)
    $fileNumStr = if ($fileNum -lt 10) { "0$fileNum" } else { "$fileNum" }
    # Formatting for slug number
    $slugNumStr = if ($i -lt 10) { "0$i" } else { "$i" }
    
    $remaining += "`r`n  {
    slug: `"12cm-$slugNumStr`",
    name: `"12CM-$slugNumStr`",
    nameBg: `"12CM-$slugNumStr`",
    avatar: `"/Site_Pics/Decals/12cm/12cm-$fileNumStr.jpg`",
    coverImage: `"/Site_Pics/Decals/12cm/12cm-$fileNumStr.jpg`",
    categories: [`"12cm`", `"Стикери`"],
    location: `"CarDecal HQ`",
    dimensions: `"12cm`",
    size: `"12cm`",
    finish: `"Gloss / Matte`",
    material: `"High-Performance Vinyl`",
    description: `"Висококачествен винилов стикер от CarDecal.`",
    stockStatus: `"In Stock`",
    highlights: [],
    posts: [],
    cardImages: [],
    isBestSeller: false,
    isVerified: true,
    price: `"0.98`",
    wholesalePrice: `"0.98`",
    price_eur: 0.50,
    wholesalePriceEur: 0.50,
  },"
}

$finalContent = $baseContent + "`r`n" + $remaining + "`r`n];`r`n"
# Ensure UTF-8 with BOM for Bulgarian characters if VS Code or the system expects it, 
# but usually plain UTF-8 is better for TS. 
# We'll stick to what [System.Text.Encoding]::UTF8 provides.
[System.IO.File]::WriteAllText($path, $finalContent, [System.Text.Encoding]::UTF8)
Write-Host "Re-added 12cm-03 through 12cm-394 correctly."
