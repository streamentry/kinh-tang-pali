#!/usr/bin/env python3
"""Apply a hash-locked editorial data package; never execute package content."""
import base64
import csv
import hashlib
import json
import lzma
from pathlib import Path
import re
import subprocess
import sys

ROOT = Path.cwd().resolve()
STAGING = ROOT / '.dn-mn-review-package'
TEMP = Path('/tmp/dn-mn-editorial-review')
TEMP.mkdir(exist_ok=True)
DIGEST = '327eb08b2141ed906e3e76630d1fc258e67ba435b660738cd6602c157c4f5df9'
BASE = 'fa8845eea363ec6069c76271327ae5e6cc1855aa'
SOURCE = '11c9d708978cde8ba61096d8a75f7ddfb846f639'


def sha(data):
    return hashlib.sha256(data).hexdigest()


def safe_path(name):
    fixed = {'README.md', 'package.json', 'scripts/audit-dn-mn.ts', 'scripts/validate.ts',
             'scripts/lib/editorial-integrity.ts', 'tests/unit/editorial-integrity.test.ts'}
    allowed = name in fixed or re.fullmatch(
        r'content/(translation|comment)/vi/project/sutta/(dn|mn)/(dn|mn)[1-9][0-9]*_(translation|comment)-vi-project\.json'
        r'|content/meta/sutta/(dn|mn)/(dn29|mn71|mn76)\.yaml'
        r'|docs/reviews/2026-09-12-dn-mn(?:-(?:changes|inventory|record))?\.(?:json|csv|md)'
        r'|docs/translation-notes/(?:dn29|mn71|mn76)\.md', name)
    if not allowed:
        raise ValueError(f'Unauthorized package path: {name}')
    p = (ROOT / name).resolve()
    if not p.is_relative_to(ROOT):
        raise ValueError('Path escapes repository')
    return p


def package():
    chunks = sorted(STAGING.glob('part-*.b64'))
    if [p.name for p in chunks] != [f'part-{i:02d}.b64' for i in range(5)]:
        raise ValueError('Expected exactly five package parts')
    data = base64.b64decode(''.join(p.read_text().strip() for p in chunks), validate=True)
    if sha(data) != DIGEST:
        raise ValueError('Compressed package SHA-256 mismatch')
    decoded = json.loads(lzma.decompress(data, memlimit=128 * 1024 * 1024))
    if decoded['baseline_commit'] != BASE or decoded['source_commit'] != SOURCE:
        raise ValueError('Wrong source/baseline')
    if json.loads((ROOT / 'source/suttacentral.lock.json').read_text())['commit'] != SOURCE:
        raise ValueError('Repository source pin changed')
    return decoded


def expected_files(pkg):
    return pkg['files'] + list(pkg['generated'].values())


def apply(pkg):
    original = {}
    outputs = {}
    seen = set()
    for item in expected_files(pkg):
        name = item['path']
        if name in seen:
            raise ValueError('Duplicate package path')
        seen.add(name)
        p = safe_path(name)
        before = p.read_bytes() if p.exists() else None
        digest = sha(before) if before is not None else None
        if digest != item['before_sha256']:
            raise ValueError(f'Concurrent edit or wrong baseline: {name}')
        if 'json_delta' in item:
            data = json.loads(before) if before is not None else {}
            if name.startswith('content/translation/'):
                original[name] = dict(data)
            for key in item['remove_keys']:
                del data[key]
            data.update(item['json_delta'])
            if 'ordered_keys' in item:
                keys = item['ordered_keys']
                if set(keys) != set(data) or len(keys) != len(data):
                    raise ValueError('Invalid key ordering')
                data = {key: data[key] for key in keys}
            result = (json.dumps(data, ensure_ascii=False, indent=2) + '\n').encode()
        elif 'content' in item:
            result = item['content'].encode()
        else:
            continue
        if sha(result) != item['after_sha256']:
            raise ValueError(f'Reconstructed content mismatch: {name}')
        outputs[p] = result
    for p, result in outputs.items():
        p.parent.mkdir(parents=True, exist_ok=True)
        p.write_bytes(result)
    (TEMP / 'before.json').write_text(json.dumps(original, ensure_ascii=False))
    (TEMP / 'paths.txt').write_text('\n'.join(sorted(seen)) + '\n')
    print(f'Applied {len(outputs)} verified files; deferred {len(pkg["generated"])} derived reports.')


def generate(pkg):
    before = json.loads((TEMP / 'before.json').read_text())
    reportdir = ROOT / 'docs/reviews'
    record = json.loads((reportdir / '2026-09-12-dn-mn-record.json').read_text())
    ledger = []
    for entry in record['entries']:
        rel = entry['translation_path']
        current = json.loads(safe_path(rel).read_text())
        root = json.loads((ROOT / '.cache/upstream/suttacentral' / entry['root_path']).read_text())
        for key in entry['changed_segments']:
            meta = pkg['ledger_metadata_values'][pkg['ledger_metadata'][key]]
            ledger.append({'uid': entry['uid'], 'segment': key, 'scope': entry['scope'],
                           'change_types': meta['change_types'], 'before': before[rel].get(key),
                           'after': current.get(key), 'pali': root[key], 'reason': meta['reason']})
    (reportdir / '2026-09-12-dn-mn-changes.json').write_text(json.dumps(ledger, ensure_ascii=False, indent=2) + '\n')
    inventory = subprocess.check_output(['./node_modules/.bin/tsx', 'scripts/audit-dn-mn.ts'], cwd=ROOT)
    (reportdir / '2026-09-12-dn-mn-inventory.json').write_bytes(inventory)
    audit = json.loads(inventory)
    with (reportdir / '2026-09-12-dn-mn-inventory.csv').open('w', newline='', encoding='utf-8-sig') as f:
        writer = csv.writer(f)
        writer.writerow(['uid','status','recorded_score','audit_scope','root_segments','translated_segments','reviewed_segments','changed_segments','abbreviation_candidates','hard_errors','sha256'])
        for x in audit['texts']:
            writer.writerow([x['uid'],x['status'],x['recorded_score'],x['audit_scope'],x['root_segments'],x['translated_segments'],x['reviewed_segments'],x['changed_segments'],sum(v['code']=='unverified-abbreviation' for v in x['findings']),sum(v['severity']=='error' for v in x['findings']),x['translation_sha256']])
    print(f'Reconstructed ledger: {len(ledger)} unique segment changes.')


def verify(pkg):
    for item in expected_files(pkg):
        if sha(safe_path(item['path']).read_bytes()) != item['after_sha256']:
            raise ValueError(f'Final hash mismatch: {item["path"]}')
    print(f'All {len(expected_files(pkg))} final file hashes match the locally tested review.')


if __name__ == '__main__':
    action = sys.argv[1] if len(sys.argv) == 2 else ''
    functions = {'apply': apply, 'generate': generate, 'verify': verify}
    if action not in functions:
        raise SystemExit('Usage: apply.py apply|generate|verify')
    functions[action](package())
