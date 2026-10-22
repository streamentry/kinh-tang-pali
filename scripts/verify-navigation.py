#!/usr/bin/env python3
"""Independent check of content/navigation/traditional/*.json.

Shares no code with the TypeScript generator (scripts/navigation.ts). It re-hashes the pinned
files, re-reads the upstream trees, re-derives bundle order with its own parser of segment IDs,
and re-reads every name from the file and key its provenance names. A generator bug that the
generator's own checks would repeat cannot pass here unless the same bug is written twice.

What it re-derives: node set, parents, children and their order (bundle order from its own reading
of segment IDs), depth, textCount, first/last UID, counts, traversal order, that every catalogue
URL appears once; for names: the Pāli name against its registry entry, every Vietnamese name
against the file and key it cites, that a project heading's cited Pāli segment is the group's own
Pāli name, and that no SuttaCentral or reference-TOC name available for a group was dropped.

Exit 0 when everything agrees; exit 1 with every disagreement listed.
`--nav-dir` points at another copy of the generated files (used by the tests on corrupted copies).
"""
import argparse
import hashlib
import json
import re
import sys
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CACHE = ROOT / '.cache/upstream/sc-data-navigation'
PALI = ROOT / '.cache/upstream/suttacentral'
COLLECTIONS = ['sn', 'an', 'kn']
problems = []


def fail(message):
    problems.append(message)


def read_locked(lock, relative):
    entry = next((f for f in lock['files'] if f['path'] == relative), None)
    if entry is None:
        raise SystemExit(f'{relative}: not in source/navigation.lock.json')
    data = (CACHE / relative).read_bytes()
    blob = hashlib.sha1(b'blob %d\0' % len(data) + data).hexdigest()
    if hashlib.sha256(data).hexdigest() != entry['sha256'] or blob != entry['gitBlob'] or len(data) != entry['bytes']:
        raise SystemExit(f'{relative}: cached bytes differ from the lock')
    return json.loads(data)


def tree_groups(value, parent, groups, order):
    """Record (group -> parent, children) in file order; children are ('g', id) or ('l', leaf)."""
    if isinstance(value, str):
        groups[parent]['children'].append(('l', value))
    elif isinstance(value, list):
        for child in value:
            tree_groups(child, parent, groups, order)
    elif isinstance(value, dict):
        for gid, children in value.items():
            if gid in groups:
                fail(f'tree: {gid} appears twice')
                continue
            groups[gid] = {'parent': parent, 'children': []}
            order.append(gid)
            if parent is not None:
                groups[parent]['children'].append(('g', gid))
            tree_groups(children, gid, groups, order)
    else:
        fail(f'tree: unexpected value {value!r}')


RANGE = re.compile(r'^([a-z]+(?:\d+\.)*)(\d+)-(\d+)$')
PREFIX = re.compile(r'^([a-z]+(?:\d+\.)*)(\d+)(?:-(\d+))?$')


def owner(prefix, members):
    """Which member UID owns segments labelled `prefix` (the part before ':'), by span containment."""
    hits = []
    p = PREFIX.match(prefix)
    for uid in members:
        if uid == prefix:
            hits.append(uid)
            continue
        r = RANGE.match(uid)
        if not r or not p or p.group(1) != r.group(1):
            continue
        lo, hi = int(r.group(2)), int(r.group(3))
        a = int(p.group(2))
        b = int(p.group(3)) if p.group(3) else a
        if lo <= a <= b <= hi:
            hits.append(uid)
    return hits


def source_key(text):
    return Path(text['sourcePath']).name.removesuffix('_root-pli-ms.json')


def expected_texts(leaf, members):
    if len(members) == 1:
        if members[0]['uid'] != leaf:
            fail(f'leaf {leaf}: read by {members[0]["uid"]}')
        return [members[0]['uid']]
    pali = json.loads((PALI / members[0]['sourcePath']).read_text())
    uids = [m['uid'] for m in members]
    first = {}
    for index, key in enumerate(pali):
        owners = owner(key.split(':', 1)[0], uids)
        if len(owners) != 1:
            fail(f'leaf {leaf}: segment {key} owned by {owners}')
        for uid in owners:
            first.setdefault(uid, index)
    missing = [u for u in uids if u not in first]
    if missing:
        fail(f'leaf {leaf}: {missing} own no segment')
    return sorted(first, key=first.get)


def name_from(ref):
    path = ref['path']
    if path.startswith('sc-data:'):
        return json.loads((CACHE / path[len('sc-data:'):]).read_text())[ref['key']]
    if path.endswith('.yaml'):
        # Minimal reader for the reference registry: `  <id>:` followed by `    text: "<json>"`.
        lines = (ROOT / path).read_text().splitlines()
        for i, line in enumerate(lines):
            if line == f'  {ref["key"]}:' and lines[i + 1].startswith('    text: '):
                return json.loads(lines[i + 1][len('    text: '):])
        return None
    return json.loads((ROOT / path).read_text()).get(ref['key'])


def norm(s):
    return unicodedata.normalize('NFC', s).strip()


def registry_ids(lock, role):
    ids = set()
    for entry in lock['files']:
        if entry['role'] == role:
            for key in read_locked(lock, entry['path']):
                ids.add(re.match(r'^[^:]+:\d+\.(.+)$', key).group(1))
    return ids


def reference_ids():
    lines = (ROOT / 'content/navigation/names/vi-reference.yaml').read_text().splitlines()
    start = lines.index('names:')
    return {line.strip()[:-1] for line in lines[start + 1:] if line.startswith('  ') and not line.startswith('    ') and line.endswith(':')}


def heading_key(value):
    value = unicodedata.normalize('NFC', value)
    value = re.sub(r'^\s*[\dIVXivx]+\.\s*', '', value)
    value = re.sub(r'[\s.,;:]+$', '', value)
    return value.lower().replace('ṃ', 'ṁ').strip()


def check_name(cid, gid, name, node, site_ids, ref_ids, catalog_paths):
    vi = name.get('vi')
    if gid in site_ids and (not vi or vi['origin'] != 'suttacentral-site'):
        fail(f'{cid}/{gid}: SuttaCentral has a Vietnamese name for this group but it is not used')
    elif gid not in site_ids and gid in ref_ids and (not vi or vi['origin'] != 'reference-toc'):
        fail(f'{cid}/{gid}: the reference table of contents names this group but the name is not used')
    if vi and vi['origin'] == 'project-heading':
        key = vi['from']['key']
        pali = json.loads((PALI / catalog_paths[node['firstUid']]).read_text())
        if heading_key(pali.get(key, '')) != heading_key(name['pali']['text']):
            fail(f'{cid}/{gid}: cited heading {key} is not the Pāli name {name["pali"]["text"]!r}')
    if vi is None:
        if not name.get('viMissing'):
            fail(f'{cid}/{gid}: no Vietnamese name and not marked missing')
        for rejected in name.get('viRejected', []):
            raw = name_from(rejected['from'])
            if raw is None or norm(re.sub(r'^\s*\d+\.\s*', '', raw)) != rejected['text']:
                fail(f'{cid}/{gid}: rejected name does not match {rejected["from"]}')
        return
    raw = name_from(vi['from'])
    if raw is None:
        fail(f'{cid}/{gid}: Vietnamese name source {vi["from"]} does not resolve')
        return
    value = norm(raw)
    if vi['origin'] == 'project-heading':
        value = norm(re.sub(r'^\s*\d+\.\s*', '', value))
    if vi['origin'] == 'suttacentral-site':
        value = value.replace('Ð', 'Đ')
        value = re.sub(r'\s*\(Pali\)$', '', value)
        value = value[:1].upper() + value[1:]
    if value != vi['text']:
        fail(f'{cid}/{gid}: Vietnamese name {vi["text"]!r} but its source says {value!r}')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--nav-dir', type=Path, default=ROOT / 'content/navigation/traditional')
    args = parser.parse_args()
    lock = json.loads((ROOT / 'source/navigation.lock.json').read_text())
    site_ids = registry_ids(lock, 'name-vi')
    ref_ids = reference_ids()
    super_tree = read_locked(lock, 'structure/tree/super-tree.json')

    def find(value, key):
        if isinstance(value, list):
            for child in value:
                found = find(child, key)
                if found is not None:
                    return found
        elif isinstance(value, dict):
            if key in value:
                return value[key]
            for child in value.values():
                found = find(child, key)
                if found is not None:
                    return found
        return None

    works = find(super_tree, 'kn')
    for cid in COLLECTIONS:
        nav = json.loads((args.nav_dir / f'{cid}.json').read_text())
        catalog = json.loads((ROOT / f'content/catalog/sutta/{cid}.json').read_text())['texts']
        catalog_paths = {text['uid']: text['sourcePath'] for text in catalog}
        by_source = {}
        for text in catalog:
            by_source.setdefault(source_key(text), []).append(text)
        groups, order = {}, []
        if cid == 'kn':
            groups['kn'] = {'parent': None, 'children': []}
            for work in works:
                tree_groups(read_locked(lock, f'structure/tree/sutta/{work}-tree.json'), 'kn', groups, order)
        else:
            tree_groups(read_locked(lock, f'structure/tree/sutta/{cid}-tree.json'), None, groups, order)
        nodes = nav['nodes']
        if set(nodes) != set(groups):
            fail(f'{cid}: node set differs from the tree: extra {sorted(set(nodes) - set(groups))[:5]}, missing {sorted(set(groups) - set(nodes))[:5]}')
        traversal = []

        def walk(gid, depth=0):
            expected = []
            for kind, value in groups[gid]['children']:
                if kind == 'g':
                    expected.append({'type': 'group', 'id': value})
                    walk(value, depth + 1)
                else:
                    for uid in expected_texts(value, by_source.get(value, [])):
                        expected.append({'type': 'text', 'uid': uid, 'sourceKey': value})
            node = nodes.get(gid)
            if node is None:
                return
            if node['children'] != expected:
                fail(f'{cid}/{gid}: children differ from the pinned tree')
            if node['parentId'] != groups[gid]['parent']:
                fail(f'{cid}/{gid}: parent {node["parentId"]}, tree says {groups[gid]["parent"]}')
            below = []

            def collect(g):
                for kind, value in groups[g]['children']:
                    if kind == 'g':
                        collect(value)
                    else:
                        below.extend(expected_texts(value, by_source.get(value, [])))
            collect(gid)
            if node['depth'] != depth or node['textCount'] != len(below) or (below and (node['firstUid'], node['lastUid']) != (below[0], below[-1])):
                fail(f'{cid}/{gid}: depth/textCount/first/last differ from the tree')
            if gid != cid:
                pali = node['name'].get('pali')
                if not pali or norm(name_from(pali['from']) or '') != pali['text']:
                    fail(f'{cid}/{gid}: Pāli name does not match its registry entry')
                check_name(cid, gid, node['name'], node, site_ids, ref_ids, catalog_paths)

        def dfs(gid):
            for kind, value in groups[gid]['children']:
                if kind == 'g':
                    dfs(value)
                else:
                    traversal.extend(expected_texts(value, by_source.get(value, [])))

        walk(cid)
        dfs(cid)
        if traversal != nav['order']:
            fail(f'{cid}: order differs from the independent traversal')
        uids = [t['uid'] for t in catalog]
        if sorted(traversal) != sorted(uids) or len(set(traversal)) != len(traversal):
            fail(f'{cid}: traversal does not cover every catalogue URL exactly once')
        leaves = sum(1 for g in groups.values() for k, _ in g['children'] if k == 'l')
        counts = nav['counts']
        if (counts['texts'], counts['groups'], counts['sourceFiles']) != (len(traversal), len(groups) - 1, leaves):
            fail(f'{cid}: counts {counts} differ from the tree')
        print(f'{cid}: {len(groups) - 1} groups, {len(traversal)} URLs, {leaves} source leaves — independently re-derived')
    if problems:
        print('independent navigation verification FAILED:', file=sys.stderr)
        for problem in problems[:100]:
            print(f'  - {problem}', file=sys.stderr)
        sys.exit(1)
    print('independent navigation verification passed.')


if __name__ == '__main__':
    main()
