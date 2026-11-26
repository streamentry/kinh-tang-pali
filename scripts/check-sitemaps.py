"""Validate built sitemap XML and emit its page URLs for check-seo.ts."""
import json
import pathlib
import sys
import xml.etree.ElementTree as ET
from urllib.parse import urlsplit

origin = sys.argv[1]
root = pathlib.Path('dist')
ns = '{http://www.sitemaps.org/schemas/sitemap/0.9}'
limit = 52_428_800


def parse(path, tag, item):
    data = path.read_bytes()
    if len(data) > limit:
        raise ValueError(f'{path}: exceeds 50 MiB')
    doc = ET.fromstring(data)
    if doc.tag != ns + tag:
        raise ValueError(f'{path}: unexpected root {doc.tag}')
    children = list(doc)
    if len(children) > 50_000 or any(child.tag != ns + item for child in children):
        raise ValueError(f'{path}: invalid entries or more than 50,000')
    urls = []
    for child in children:
        locs = child.findall(ns + 'loc')
        if len(locs) != 1 or not locs[0].text:
            raise ValueError(f'{path}: expected one nonempty loc')
        url = locs[0].text
        parsed = urlsplit(url)
        if not url.startswith(origin) or parsed.query or parsed.fragment or len(url) >= 2048:
            raise ValueError(f'{path}: invalid or out-of-scope URL {url}')
        urls.append(url)
    return urls


indexes = parse(root / 'sitemap.xml', 'sitemapindex', 'sitemap')
if not indexes or len(indexes) != len(set(indexes)):
    raise ValueError('Sitemap index is empty or has duplicates')
locations = []
for url in indexes:
    name = url.removeprefix(origin)
    if '/' in name or not name.startswith('sitemap-') or not name.endswith('.xml'):
        raise ValueError(f'Unexpected sitemap path: {url}')
    locations.extend(parse(root / name, 'urlset', 'url'))
actual = {p.name for p in root.glob('sitemap-*.xml')}
if actual != {url.removeprefix(origin) for url in indexes}:
    raise ValueError('Sitemap index does not match generated sitemap files')
print(json.dumps(locations))
