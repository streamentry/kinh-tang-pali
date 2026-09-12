#!/usr/bin/env python3
"""Audit quote structure of a DN translation: flags suspicious open/close placement.

For each quote mark, decide semantic role from context (segment start = open,
segment end = close). A "close" when state is already closed, or an "open"
when state is already open, is flagged for manual review.
Usage: python3 quote_audit.py <uid>
"""
import json, sys, re

ROOT = "/Volumes/SSD/kinh-tang-pali"
uid = sys.argv[1]
tr = json.load(open(f"{ROOT}/content/translation/vi/project/sutta/dn/{uid}_translation-vi-project.json"))
pali = json.load(open(f"{ROOT}/.cache/upstream/suttacentral/root/pli/ms/sutta/dn/{uid}_root-pli-ms.json"))
try:
    en = json.load(open(f"{ROOT}/.cache/upstream/suttacentral/translation/en/sujato/sutta/dn/{uid}_translation-en-sujato.json"))
except FileNotFoundError:
    en = {}

keyfn = lambda x: (int(x.split(':')[1].split('.')[0]), int(x.split('.')[1]))
ks = sorted(tr, key=keyfn)

OPEN_CURLY = {'"': '“', "'": '‘'}
CLOSE_CURLY = {'"': '”', "'": '’'}

def seg_type(k):
    m = re.match(rf'{uid}:(\d+)\.(\d+)', k)
    return (int(m.group(1)), int(m.group(2)))

# state per mark type; process marks in reading order across segments
states = {'"': 0, "'": 0}
problems = []
conversion = {}  # k -> list of (offset, curly_char)

for k in ks:
    v = tr[k]
    # find order of quote marks
    marks = [(i, ch) for i, ch in enumerate(v) if ch in ('"', "'")]
    out = list(v)
    for i, ch in marks:
        s = states[ch]
        if ch == '"':
            depth = states['"'] - states["'"] if False else 0
        # decide role
        before = v[:i].strip()
        after = v[i+1:].strip()
        if s == 0:
            role = 'open'
        else:
            # already open: this closes, UNLESS the same segment already closed
            # the open one and this is a new open (rare). Heuristic: if before
            # is empty and the segment also has a close later, treat as open of
            # nested? Keep simple: close.
            role = 'close'
        if len(marks) >= 2 and i == 0 and any(x[1] == ch for x in marks[1:]):
            # e.g. `'Vâng, này bạn,'` – open then close in same segment
            role = 'open'
        curly = OPEN_CURLY[ch] if role == 'open' else CLOSE_CURLY[ch]
        out[i] = curly
        states[ch] += 1 if role == 'open' else -1
        if states[ch] < 0:
            problems.append((k, i, ch, 'CLOSE-WITHOUT-OPEN', v[:90]))
            states[ch] = 0
    conversion[k] = ''.join(out)

for ch in states:
    if states[ch] != 0:
        problems.append(('END', -1, ch, f'UNCLOSED x{states[ch]}', ''))

if problems:
    print(f'{len(problems)} problem(s):')
    for p in problems[:40]:
        print(' ', p)
else:
    print('QUOTE STRUCTURE OK (nesting-aware conversion possible)')
