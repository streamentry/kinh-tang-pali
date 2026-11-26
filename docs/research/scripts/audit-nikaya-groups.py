#!/usr/bin/env python3
"""Research-only audit: pinned navigation leaves -> existing catalog reader UIDs.

Does not edit canonical text, catalogs, ordering, navigation or publication state.
"""
import argparse
import collections
import hashlib
import json
from pathlib import Path
import urllib.request

ROOT = Path(__file__).resolve().parents[3]
RESEARCH = Path(__file__).resolve().parents[1]


def digest(data):
    return hashlib.sha256(data).hexdigest()


def visit(value, groups, leaves, ancestors=()):
    if isinstance(value, str):
        leaves.append((value, ancestors))
    elif isinstance(value, list):
        for item in value:
            visit(item, groups, leaves, ancestors)
    elif isinstance(value, dict):
        for uid, children in value.items():
            if uid in groups or uid in ancestors:
                raise ValueError(f'Duplicate/cyclic group: {uid}')
            groups[uid] = ancestors
            visit(children, groups, leaves, ancestors + (uid,))
    else:
        raise ValueError('Unexpected navigation tree value')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--cache', type=Path, default=ROOT / '.cache/research/nikaya-hierarchy')
    parser.add_argument('--fetch', action='store_true', help='Fetch missing/changed navigation files from the immutable upstream commit')
    parser.add_argument('--output', type=Path)
    args = parser.parse_args()
    manifest = json.loads((RESEARCH / 'nikaya-hierarchy-sources.json').read_text())
    files = {}
    for entry in manifest['files']:
        relative = entry['path']
        file = args.cache / relative.replace('/', '__')
        if args.fetch and (not file.exists() or digest(file.read_bytes()) != entry['sha256']):
            url = f'https://raw.githubusercontent.com/suttacentral/sc-data/{manifest["commit"]}/{relative}'
            request = urllib.request.Request(url, headers={'User-Agent': 'kinh-tang-pali-hierarchy-research'})
            with urllib.request.urlopen(request, timeout=60) as response:
                data = response.read()
            if digest(data) != entry['sha256']:
                raise ValueError(f'Fetched source differs from research manifest: {relative}')
            file.parent.mkdir(parents=True, exist_ok=True)
            file.write_bytes(data)
        data = file.read_bytes()
        blob = hashlib.sha1(f'blob {len(data)}\0'.encode() + data).hexdigest()
        if digest(data) != entry['sha256'] or blob != entry['git_blob']:
            raise ValueError(f'Source hash mismatch: {relative}')
        files[relative] = json.loads(data)

    def find_node(value, target):
        if isinstance(value, list):
            for child in value:
                result = find_node(child, target)
                if result is not None:
                    return result
        elif isinstance(value, dict):
            if target in value:
                return value[target]
            for child in value.values():
                result = find_node(child, target)
                if result is not None:
                    return result
        return None

    kn_books = find_node(files['structure/tree/super-tree.json'], 'kn')
    if not isinstance(kn_books, list) or not all(isinstance(uid, str) for uid in kn_books):
        raise ValueError('Unexpected KN work structure')
    report = {
        'upstream_commit': manifest['commit'],
        'catalog_sha256': {},
        'verified_navigation_files': len(files),
        'note': 'Counts describe catalog URLs and upstream file leaves, not an expanded count of individual canonical discourses. Membership only; internal bundle reading order still needs pinned segment ownership.',
        'collections': {},
    }
    examples = {'sn12-aharavagga', 'an1-cittapariyadanavagga', 'an3-mahavagga',
                'ud-bodhivagga', 'snp-atthakavagga', 'thig-ekadasanipata'}
    for collection, books in [('sn', ['sn']), ('an', ['an']), ('kn', kn_books)]:
        groups, leaves = {}, []
        for book in books:
            visit(files[f'structure/tree/sutta/{book}-tree.json'], groups, leaves,
                  (collection,) if collection == 'kn' else ())
        catalog_path = ROOT / f'content/catalog/sutta/{collection}.json'
        report['catalog_sha256'][collection] = digest(catalog_path.read_bytes())
        catalog = json.loads(catalog_path.read_text())['texts']
        entries = {item['uid']: item for item in catalog}
        if len(entries) != len(catalog) or len({leaf for leaf, _ in leaves}) != len(leaves):
            raise ValueError(f'Duplicate catalog/tree leaves in {collection}')
        source_members = collections.defaultdict(list)
        source_keys = {}
        for item in catalog:
            source = Path(item['sourcePath']).name.removesuffix('_root-pli-ms.json')
            source_members[source].append(item['uid'])
            source_keys[item['uid']] = source
        if set(source_members) != {leaf for leaf, _ in leaves}:
            raise ValueError(f'{collection}: catalog source files differ from navigation leaves')
        assigned = collections.Counter()
        aliases = []
        selected = {}
        for leaf, path in leaves:
            if leaf in entries:
                if source_keys[leaf] != leaf:
                    raise ValueError(f'Exact reader UID points at another source file: {leaf}')
                resolved = [leaf]
            elif leaf in source_members:
                resolved = source_members[leaf]
                aliases.append({'upstream_leaf': leaf, 'catalog_uids': resolved})
            else:
                raise ValueError(f'Upstream leaf missing from catalog/source keys: {leaf}')
            assigned.update(resolved)
            for group in examples.intersection(path):
                selected.setdefault(group, {'path': list(path[:path.index(group) + 1]),
                                            'upstream_leaves': [], 'catalog_uids': []})
                selected[group]['upstream_leaves'].append(leaf)
                selected[group]['catalog_uids'].extend(resolved)
        missing = sorted(set(entries) - assigned.keys())
        duplicates = {uid: count for uid, count in assigned.items() if count != 1}
        if missing or duplicates:
            raise ValueError(f'{collection}: unassigned={missing}; duplicate membership={duplicates}')
        row = {
            'catalog_reader_urls': len(catalog),
            'distinct_source_files': len(source_members),
            'upstream_leaves': len(leaves),
            'group_nodes_excluding_collection_root': len(groups) - int(collection in groups),
            'max_group_depth_including_collection': max(len(path) for _, path in leaves),
            'source_bundle_aliases': len(aliases),
            'catalog_urls_in_aliased_bundles': sum(len(item['catalog_uids']) for item in aliases),
            'unassigned_catalog_uids': missing,
            'duplicate_catalog_memberships': duplicates,
            'examples': selected,
        }
        if collection == 'kn':
            row['upstream_work_nodes'] = kn_books
        report['collections'][collection] = row
        print(f'{collection}: {len(catalog)} URLs, {len(leaves)} upstream leaves, '
              f'{row["group_nodes_excluding_collection_root"]} group nodes; complete unique membership')
    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')


if __name__ == '__main__':
    main()
