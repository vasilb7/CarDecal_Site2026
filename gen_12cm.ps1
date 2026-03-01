$products = @()
for ($i = 3; $i -le 393; $i++) {
    $fileNum = $i - 1
    $fileNumPadded = "{0:D2}" -f $fileNum
    if ($fileNum -ge 100) { $fileNumPadded = "{0}" -f $fileNum }
    
    $slugNumPadded = "{0:D2}" -f $i
    if ($i -ge 100) { $slugNumPadded = "{0}" -f $i }
    
    $products += "  {
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

[System.IO.File]::WriteAllLines("e:\Antigravity\CarDecal3\remaining_12cm.txt", $products, [System.Text.Encoding]::UTF8)
