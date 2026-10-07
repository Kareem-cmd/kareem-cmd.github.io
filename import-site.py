"""Extract and verify the owner's original portfolio source."""
from pathlib import Path
import hashlib,io,json,zipfile
manifest=json.loads(Path('archive-manifest.json').read_text())
data=b''.join(Path(p).read_bytes() for p in manifest['parts'])
assert hashlib.sha256(data).hexdigest()==manifest['sha256'], 'Archive checksum mismatch'
root=Path('site').resolve()
with zipfile.ZipFile(io.BytesIO(data)) as archive:
    for entry in archive.infolist():
        target=(root/entry.filename).resolve()
        if not target.is_relative_to(root):
            raise ValueError('Invalid archive path')
    archive.extractall(root)
files=json.loads(Path('site-manifest.json').read_text())['files']
for item in files:
    assert hashlib.sha256((root/item['path']).read_bytes()).hexdigest()==item['sha256'], item['path']
(root/'.nojekyll').touch()
print(f'Imported and verified {len(files)} website files.')
