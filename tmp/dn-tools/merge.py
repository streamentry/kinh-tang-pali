#!/usr/bin/env python3
"""Merge chunk JSON files into the canonical translation file.

Usage: python3 merge.py <uid> <chunks_dir>
Chunks dir must contain files named NNN.json (zero-padded) with
{"segid": "vi text"} objects. Existing canonical entries are NOT overwritten
unless the chunk provides a replacement.
"""
import json
import sys
import re
import unicodedata

ROOT = "/Volumes/SSD/kinh-tang-pali"


def main():
    uid, chunks_dir = sys.argv[1], sys.argv[2]
    out_path = f"{ROOT}/content/translation/vi/project/sutta/dn/{uid}_translation-vi-project.json"
    try:
        result = json.load(open(out_path))
        if isinstance(result, list):
            result = {}
    except Exception:
        result = {}

    import os
    names = sorted(n for n in os.listdir(chunks_dir) if re.fullmatch(r"\d+\.json", n))
    for name in names:
        chunk = json.load(open(f"{chunks_dir}/{name}"))
        assert isinstance(chunk, dict), f"{name} is not an object"
        result.update(chunk)

    result = {
        k: unicodedata.normalize("NFC", v)
        for k, v in sorted(result.items())
    }
    with open(out_path, "w") as f:
        json.dump(result, f, ensure_ascii=False, indent=2)
        f.write("\n")
    print(f"{uid}: {len(result)} segments written")


if __name__ == "__main__":
    main()
