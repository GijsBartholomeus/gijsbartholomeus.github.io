"""Build a dependency-free static site: python3 build.py."""
import json
from html import escape
from pathlib import Path

ROOT = Path(__file__).resolve().parent
data = json.loads((ROOT / 'content.json').read_text())
def e(value):
    return escape(str(value), quote=True)
def linked(title, url):
    return f'<a href="{e(url)}">{e(title)} <span aria-hidden="true">↗</span></a>' if url else e(title)

def research(items, label, publication=False):
    if not items:
        return ''
    rows = []
    for item in items:
        detail = f'<p class="authors">{e(item["authors"])}</p><p class="metadata">{e(item["venue"])}</p>' if publication else f'<p>{e(item.get("description", ""))}</p><p class="metadata">{e(item.get("meta", ""))}</p>'
        rows.append(f'<article class="research-row"><span class="date">{e(item["year"])}</span><div><h3>{linked(item["title"], item.get("url", ""))}</h3>{detail}</div></article>')
    return f'<div class="research-group"><h2 class="eyebrow">{e(label)}</h2>{"".join(rows)}</div>'

values = {key: e(data[key]) for key in ('name', 'github', 'linkedin', 'url', 'intro', 'cv_updated')}
values['email_display'] = e('firstname.lastname [at] ' + data['email'].split('@', 1)[1].replace('.', ' [dot] '))
values['about'] = ''.join(f'<p>{e(p)}</p>' for p in data['about'])
values['keywords'] = ''.join(f'<span>{e(item)}</span>' for item in data['keywords'])
values['interests'] = ''.join(f'<article class="interest"><span class="roman">{n:02d}</span><div><h3>{e(item["title"])}</h3><p>{e(item["text"])}</p></div></article>' for n, item in enumerate(data['interests'], 1))
values['research'] = research(data['publications'], 'Publications', True) + research(data['preprints'], 'Preprints', True) + research(data['projects'], 'Selected projects') + research(data['notes'], 'Research notes')
values['teaching'] = ''.join(f'<article class="teaching-row"><span class="date">{e(item["year"])}</span><div><h3>{e(item["title"])}</h3><p class="institution">{e(item["institution"])}</p><p>{e(item["text"])}</p></div></article>' for item in data['teaching'])
values['outreach'] = research(data['outreach'], 'Outreach & resources')
page = (ROOT / 'template.html').read_text()
for key, value in values.items():
    page = page.replace('{{' + key + '}}', value)
if '{{' in page:
    raise ValueError('Unresolved template placeholder')
(ROOT / 'site/index.html').write_text(page)
(ROOT / 'site/sitemap.xml').write_text(f'<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>{e(data["url"])}/</loc></url></urlset>\n')
(ROOT / 'site/robots.txt').write_text(f'User-agent: *\nAllow: /\nSitemap: {data["url"]}/sitemap.xml\n')
print('Built site/index.html')
