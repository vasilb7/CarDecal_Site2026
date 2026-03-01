import urllib.request
import re
import os

url = "https://sites.google.com/view/cardecor/5cm?authuser=0"
target_dir = 'e:/Antigravity/CarDecal3/public/Site_Pics/Decals/5cm'
os.makedirs(target_dir, exist_ok=True)

req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
with urllib.request.urlopen(req) as response:
    html = response.read().decode('utf-8')

# The format in the HTML usually has something like:
# <img src="url"...> ... <p>5cm-01</p>
# Let's find all occurrences of 5cm-\d\d or 5x33cm?-?\d\d
# Since Google sites might have complex structure, let's just find the text blocks.
items_to_find = [
    "5cm-01", "5cm-02", "5cm-03", "5x33-04", "5cm-05", "5cm-06",
    "5cm-07", "5cm-08", "5x33cm-09", "5x33cm-10", "5cm-11", "5cm-12",
    "5cm-13", "5x33cm-14", "5cm-15"
]

images_mapped = {}

for item in items_to_find:
    # Find the position of the item text in the HTML
    # We look for the text exactly, maybe inside a tag >5cm-01< or similar
    # Sometimes it's something like ">5cm-01<" or "5cm-01"
    pos = html.find(item)
    if pos == -1:
        print(f"Could not find {item} in HTML")
        continue
    
    # We want to find the LAST <img src=" before this position!
    img_pos = html.rfind("<img", 0, pos)
    if img_pos == -1:
        print(f"Could not find img before {item}")
        continue
    
    src_match = re.search(r'src="([^"]+)"', html[img_pos:pos])
    if src_match:
        img_url = src_match.group(1)
        if img_url.startswith('/'):
            img_url = "https://sites.google.com" + img_url
            
        print(f"Found {item} -> {img_url[:50]}...")
        
        # Download it
        try:
            img_req = urllib.request.Request(img_url, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(img_req) as img_resp:
                with open(os.path.join(target_dir, f"{item}.jpg"), 'wb') as f:
                    f.write(img_resp.read())
            print(f"Successfully downloaded {item}")
        except Exception as e:
            print(f"Failed to download {item}: {e}")
            
    else:
         print(f"No src found for {item}")
