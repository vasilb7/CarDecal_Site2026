import re
import json
import urllib.request
import os
import time

html_file = 'CarDecor - 6cm.html'
with open(html_file, 'r', encoding='utf-8') as f:
    content = f.read()

# find all sections
sections = re.findall(r'<section.*?</section>', content, re.DOTALL)
print(f"Found {len(sections)} sections")

items = []
unique = {}

for sec in sections:
    img_match = re.search(r'<img.*?src="(https://lh3.googleusercontent.com/[^"]+)"', sec)
    if img_match:
        src = img_match.group(1)
        
        # strip tags from section
        text = re.sub(r'<[^>]+>', '', sec)
        # replace html entities if any, especially &nbsp; which might be between lines
        text = text.replace('&nbsp;', ' ')
        
        text_match = re.search(r'6cm-?\s*([0-9]+)', text, re.IGNORECASE)
        if text_match:
            code = f"6cm-{text_match.group(1).zfill(2)}"
            if code not in unique:
                unique[code] = {
                    'name': code.upper(),
                    'imgUrl': src
                }

items = list(unique.values())
items.sort(key=lambda x: int(x['name'].split('-')[1]))

print(f"Total unique found matching pattern: {len(items)}")

with open('scrape_6cm_precise.json', 'w', encoding='utf-8') as f:
    json.dump(items, f, indent=2)

output_dir = 'public/Site_Pics/Decals/6cm'
os.makedirs(output_dir, exist_ok=True)

for item in items:
    filename = f"{item['name'].lower()}.jpg"
    filepath = os.path.join(output_dir, filename)
    if not os.path.exists(filepath):
        try:
            req = urllib.request.Request(item['imgUrl'], headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req) as response, open(filepath, 'wb') as out_file:
                data = response.read()
                out_file.write(data)
            print(f"Downloaded {filename}")
            time.sleep(0.1)
        except Exception as e:
            print(f"Failed {filename}: {e}")

print("Done downloading!")
