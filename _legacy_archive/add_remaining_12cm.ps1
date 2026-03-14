$path = "e:\Antigravity\CarDecal3\data\products.ts"
$content = Get-Content $path -Raw

# Remove the trailing ]; and any whitespace
$base = $content.TrimEnd(" `t`r`n")
if ($base.EndsWith("];")) {
    $base = $base.Substring(0, $base.Length - 2).TrimEnd(" `t`r`n")
}

$remaining = ""
for ($i = 3; $i -le 393; $i++) {
    $fileNum = $i - 1
    # Formatting for file number (leading zero if < 10)
    $fileNumStr = if ($fileNum -lt 10) { "0$fileNum" } else { "$fileNum" }
    # Formatting for slug number
    $slugNumStr = if ($i -lt 10) { "0$i" } else { "$i" }
    
    $remaining += "`n  {
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

$finalContent = $base + $remaining + "`n];`n"
# Using WriteAllText to ensure UTF-8 without BOM if possible, or just standard .NET encoding
[System.IO.File]::WriteAllText($path, $finalContent, [System.Text.Encoding]::UTF8)
Write-Host "Done! Added 12cm-03 through 12cm-393."
