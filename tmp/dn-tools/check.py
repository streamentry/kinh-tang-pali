#!/usr/bin/env python3
"""Check coverage and quote structure of a DN translation against the pinned Pali root.

Quote convention of this corpus (see tmp/dn-tools/BRIEF.md): curly “…” for level 1,
‘…’ for level 2; an open may span across segments (a speech continues over several
segments), so balance is verified with a stateful walk over segments in reading
order, not per-segment counting. Straight " or ' marks are flagged as errors.

Usage: python3 check.py <uid>
"""
import json
import sys
import re

ROOT = "/Volumes/SSD/kinh-tang-pali"


def seg_key(k):
    try:
        return tuple(int(n) for n in k.split(":")[1].split("."))
    except ValueError:
        return (0,)


def quote_problems(tr):
    """Stateful quote-structure check. Returns list of (segment, issue)."""
    probs = []
    stack = []  # entries: ("D"|"S", segment)
    for k in sorted(tr, key=seg_key):
        v = str(tr[k])
        if '"' in v or "'" in v:
            probs.append((k, "straight-quote-present"))
        for i, ch in enumerate(v):
            if ch == "“":
                stack.append(("D", k))
            elif ch == "”":
                if not stack:
                    probs.append((k, "close-quote-without-open"))
                elif stack[-1][0] != "D":
                    probs.append((k, "mismatched-close-quote"))
                    stack.pop()
                else:
                    stack.pop()
            elif ch == "‘":
                if not stack or stack[-1][0] != "D":
                    probs.append((k, "inner-quote-outside-outer-quote"))
                stack.append(("S", k))
            elif ch == "’":
                if stack and stack[-1][0] == "S":
                    stack.pop()
                else:
                    probs.append((k, "single-close-without-single-open"))
    for _, k in stack:
        probs.append((k, "unclosed-quote"))
    return probs


def main():
    uid = sys.argv[1]
    pali = json.load(open(f"{ROOT}/.cache/upstream/suttacentral/root/pli/ms/sutta/dn/{uid}_root-pli-ms.json"))
    pali = {k: v for k, v in pali.items() if k.startswith(uid + ":")}
    tr_path = f"{ROOT}/content/translation/vi/project/sutta/dn/{uid}_translation-vi-project.json"
    tr = json.load(open(tr_path))
    if isinstance(tr, list):
        tr = {}

    missing = [k for k in pali if k not in tr or not str(tr[k]).strip()]
    extra = [k for k in tr if k not in pali]
    empty_vi = [k for k in tr if not str(tr[k]).strip()]

    print(f"pali={len(pali)} vi={len(tr)}")
    if missing:
        print(f"MISSING {len(missing)}: {missing[:20]}")
    if extra:
        print(f"EXTRA {len(extra)}: {extra[:20]}")
    if empty_vi:
        print(f"EMPTY {len(empty_vi)}: {empty_vi[:20]}")

    bad_quotes = quote_problems(tr)
    if bad_quotes:
        print(f"QUOTE-STRUCT {len(bad_quotes)}: {bad_quotes[:20]}")

    if not (missing or extra or empty_vi or bad_quotes):
        print("COVERAGE OK")


if __name__ == "__main__":
    main()
