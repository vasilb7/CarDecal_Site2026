$path = "e:\Antigravity\CarDecal3\data\products.ts"
$content = [System.IO.File]::ReadAllText($path, [System.Text.Encoding]::UTF8)

$footer = "  },`r`n];"
$pos = $content.LastIndexOf($footer)

if ($pos -ge 0) {
    # We want to insert AFTER the last closing brace of the last product
    # The last product currently ends at 8985.
    $insertPos = $pos + 5 # Length of "  },"
    
    $remaining = @()
    for ($i = 3; $i -le 393; $i++) {
        $fileNum = $i - 1
        $fileNumPadded = "{0:D2}" -f $fileNum
        $slugNumPadded = "{0:D2}" -f $i
        
        $remaining += "`r`n  {
    slug: `"12cm-$slugNumPadded`",
    name: `"12CM-$slugNumPadded`",
    nameBg: `"12CM-$slugNumPadded`",
    avatar: `"/Site_Pics/Decals/12cm/12cm-$fileNumPadded.jpg`",
    coverImage: `"/Site_Pics/Decals/12cm/12cm-$fileNumPadded.jpg`",
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
    
    $newContent = $content.Substring(0, $insertPos) + [string]::Join("", $remaining) + $content.Substring($insertPos)
    [System.IO.File]::WriteAllText($path, $newContent, [System.Text.Encoding]::UTF8)
    Write-Host "Success! Added 391 products."
}
else {
    Write-Host "Could not find insertion point."
}
