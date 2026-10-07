"""One-time import of the owner's published portfolio, verified against SHA-256."""
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from urllib.request import Request, urlopen
from urllib.parse import quote
import hashlib
import json
import time

manifest = json.loads(Path('site-manifest.json').read_text(encoding='utf-8'))
root = Path('site').resolve()

def download(item):
    target = (root / item['path']).resolve()
    if not target.is_relative_to(root):
        raise ValueError('Invalid site path')
    url = manifest['origin'] + quote(item['path'], safe='/')
    for attempt in range(4):
        try:
            request = Request(url, headers={'User-Agent': 'Kareem-Portfolio-Migration/1.0'})
            with urlopen(request, timeout=90) as response:
                data = response.read()
            if hashlib.sha256(data).hexdigest() != item['sha256']:
                raise ValueError('Content mismatch: ' + item['path'])
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_bytes(data)
            return
        except Exception:
            if attempt == 3:
                raise
            time.sleep(2 ** attempt)

with ThreadPoolExecutor(max_workers=6) as pool:
    list(pool.map(download, manifest['files']))
(root / '.nojekyll').touch()
print(f"Imported and verified {len(manifest['files'])} website files.")
