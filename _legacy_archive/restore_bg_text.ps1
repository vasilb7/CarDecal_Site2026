$path = "e:\Antigravity\CarDecal3\data\products.ts"
$content = [System.IO.File]::ReadAllText($path, [System.Text.Encoding]::UTF8)

$garbled1 = "РЎС‚РёРєРµСЂРё"
$correct1 = "Стикери"
$garbled2 = "Р’РёСЃРѕРєРѕРєР°С‡РµСЃС‚РІРµРЅ РІРёРЅРёР»РѕРІ СЃС‚РёРєРµСЂ РѕС‚ CarDecal."
$correct2 = "Висококачествен винилов стикер от CarDecal."

$content = $content.Replace($garbled1, $correct1)
$content = $content.Replace($garbled2, $correct2)

[System.IO.File]::WriteAllText($path, $content, [System.Text.Encoding]::UTF8)
Write-Host "Restored Bulgarian text."
