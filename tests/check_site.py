"""Check generated assets, section links, content, and source consistency."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlparse
import subprocess
import json
ROOT=Path(__file__).resolve().parents[1]
subprocess.run(['python3', str(ROOT/'build.py')],check=True)
class Page(HTMLParser):
    def __init__(self):
        super().__init__(); self.ids=[]; self.links=[]
    def handle_starttag(self,tag,attrs):
        data=dict(attrs)
        if 'id' in data: self.ids.append(data['id'])
        for key in ('href','src','data'):
            if key in data: self.links.append(data[key])
html=(ROOT/'site/index.html').read_text(); page=Page(); page.feed(html)
assert len(page.ids)==len(set(page.ids)), 'Duplicate HTML IDs'
for link in page.links:
    url=urlparse(link)
    if url.scheme or url.netloc: continue
    if url.path: assert (ROOT/'site'/url.path).is_file(), link
    if url.fragment: assert url.fragment in page.ids, link
assert '{{' not in html
assert 'Heather Harrington' in html
assert 'ga.bartholomeus@gmail.com' not in html
assert 'firstname.lastname [at] balliol [dot] ox [dot] ac [dot] uk' in html
assert 'gijs.bartholomeus@balliol.ox.ac.uk' not in html
assert 'mailto:' not in html
assert 'copy-email' not in html
assert all(name in page.ids for name in ['about','research','teaching','cv','contact','playground'])
assert (ROOT/'site/assets/aero-wallpaper.png').is_file()
assert json.loads((ROOT/'content.json').read_text())['cv_updated']=='21 October 2026'
print('Site checks passed: local assets, unique IDs, all section links, public email, and updated supervisors.')
