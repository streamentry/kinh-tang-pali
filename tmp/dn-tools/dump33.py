#!/usr/bin/env python3
"""Dump dn33 segments (pali + en + best dn34 vi reuse) for a given segment-id range.

Usage: python3 dump33.py <start> <end> [--min-ratio 0.6]
  start/end are segment ids like dn33:1.8.6 (inclusive), or indices.
"""
import json, sys, difflib, re
from collections import defaultdict

ROOT = "/Volumes/SSD/kinh-tang-pali"
pali = json.load(open(f"{ROOT}/.cache/upstream/suttacentral/root/pli/ms/sutta/dn/dn33_root-pli-ms.json"))
en = json.load(open(f"{ROOT}/.cache/upstream/suttacentral/translation/en/sujato/sutta/dn/dn33_translation-en-sujato.json"))
root34 = json.load(open(f"{ROOT}/.cache/upstream/suttacentral/root/pli/ms/sutta/dn/dn34_root-pli-ms.json"))
vi34 = json.load(open(f"{ROOT}/content/translation/vi/project/sutta/dn/dn34_translation-vi-project.json"))

idx = defaultdict(list)
for k, v in root34.items():
    idx[v.strip()].append(k)


def best34(text, min_ratio):
    hits = idx.get(text.strip())
    if hits:
        return [(1.0, h) for h in hits]
    best = []
    # scan all dn34 for best ratio (only when needed)
    cands = []
    for k, v in root34.items():
        r = difflib.SequenceMatcher(None, text, v).ratio()
        if r >= min_ratio:
            cands.append((r, k))
    cands.sort(reverse=True)
    return cands[:2]


def seg_key(k):
    try:
        return tuple(int(n) for n in k.split(":")[1].split("."))
    except ValueError:
        return (0,)


start, end = sys.argv[1], sys.argv[2]
min_ratio = 0.72
if len(sys.argv) > 4:
    min_ratio = float(sys.argv[4])

keys = sorted((k for k in pali if k.startswith("dn33:")), key=seg_key)
sel = [k for k in keys if seg_key(start) <= seg_key(k) <= seg_key(end)]
for k in sel:
    print(f"=== {k} ===")
    print(f"PĀL: {pali[k].strip()}")
    print(f"ENG: {en[k].strip()}")
    hits = best34(pali[k], min_ratio)
    if hits:
        for r, h in hits:
            print(f"D34[{r:.2f}] {h}: {vi34.get(h,'').strip()}")
    print()
