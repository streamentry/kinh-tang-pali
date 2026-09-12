#!/usr/bin/env python3
"""Fix straight-quote structure of dn23 Vietnamese translation, then convert to curly.

Every edit was individually verified against:
  - Pali root: .cache/upstream/suttacentral/root/pli/ms/sutta/dn23_root-pli-ms.json
  - English Sujato: .../translation/en/sujato/sutta/dn/dn23_translation-en-sujato.json
Rule: root is authority for speech boundaries, but root's own missing close-quote
before `ti` (formula endings) is NOT copied; Vietnamese closes the speech where
the narrative ends it.

Modes:
  apply    - apply the verified edit table to the JSON (in place)
  walk     - stateful role audit; must print CLEAN before conversion
  convert  - straight -> curly using contextual roles (open/close)
  verify   - audit the curly result (nesting + balance + no straight marks)
"""
import json, sys

ROOT = "/Volumes/SSD/kinh-tang-pali"
VI_PATH = f"{ROOT}/content/translation/vi/project/sutta/dn/dn23_translation-vi-project.json"

# (segment, op, char, expect_fragment) -- expect_fragment anchors the edit
EDITS = [
    # speech of Kassapa (opened 5.4) ends with the formula question; subheading
    # 5.7.0 follows, VI reopens a fresh speech at 5.8 (editorial choice, per task)
    ("dn23:5.6",   "append",       '"', "bất thiện'?"),
    # Pāyāsi's long speech (opened 6.8) does NOT end here; root: only ’ closes
    # the ’ opened 6.12, ” closes at 6.21 (‘…’”ti.)
    ("dn23:6.18",  "remove_last",  '"', "thấy vậy.'\""),
    # level-3 “…” + closing ’ of level 2; level-1 ” closes at 7.20 (’”ti.)
    ("dn23:7.18",  "remove_last",  '"', "bất thiện.\"'?\""),
    # level-3 “…”ti. only; the ’ opened at 8.12 closes at 8.18 (root: ’ti.)
    ("dn23:8.13",  "remove_last",  "'", "cõi trời.\"'"),
    # only ’ closes here; ” of the 8.8 speech closes at 8.21
    ("dn23:8.18",  "remove_last",  '"', "thấy vậy.'\""),
    # speech continues from 9.1; root has NO new quote at 9.25 (cascade error)
    ("dn23:9.25",  "remove_first", '"', '"Tộc trưởng, ngài nghĩ sao'),
    # root: assā”ti? — closes the “ opened at 9.1
    ("dn23:9.26",  "append",       '"', "lần nữa chăng?"),
    # level-3 “…”ti. only; ’ from 10.10 closes at 10.16
    ("dn23:10.11", "remove_last",  "'", "Ba Mươi Ba.\"'"),
    # only ’ closes here; ” of the 10.6 speech closes at 10.19
    ("dn23:10.16", "remove_last",  '"', "thấy vậy.'\""),
    # root sace kho … jāneyyuṁ: has NO quote; S-pairs at 12.9/12.12 already match
    ("dn23:12.8",  "remove_first", "'", "'Nếu những đạo sĩ"),
    # root: ārāmaṇeyyakan”ti? — closes the “ opened at 15.1
    ("dn23:15.2",  "append",       '"', "hồ sen đáng yêu chăng?"),
    # root 15.4 “Rakkhanti …”ti? — Kassapa's question, self-contained pair
    ("dn23:15.4",  "wrap",         '"', "Lúc ấy, ngài có được"),
    # root 15.6 “Api nu tā …”ti? — Kassapa's question, self-contained pair
    ("dn23:15.6",  "wrap",         '"', "Nhưng họ có thấy"),
    # root 15.8 “Tā hi nāma … — opens Kassapa's speech closing at 15.11 (’”ti.)
    ("dn23:15.8",  "prepend",      '"', "Bởi thế, tộc trưởng"),
    # boy's reply is level 2 (‘) inside Kassapa's “ — root: ‘Idha me, tāta …
    ("dn23:21.35", "replace_first", ('"', "'"), '"Cha ơi'),
    # boy's quoted thought is level 3 (“) inside his ‘ — root: “pitā kho maṁ …
    ("dn23:21.37", "replace_first", ("'", '"'), "'Cha tôi đã dạy"),
    # root: paricareyyan”ti. — level-3 close
    ("dn23:21.40", "replace_last",  ("'", '"'), "phụng sự nó.'"),
    # root: adhigacchin’ti. — only ’ closes the boy’s reply opened 21.35
    ("dn23:21.46", "remove_last",  '"', "tạo được lửa.'\""),
    # root: adhigaccheyyā”ti? — closes “ opened at 31.1
    ("dn23:31.5",  "append",       '"', "nhiều quả ngọt chăng?"),
    # root: adhigaccheyyā”ti? — closes “ opened at 31.7
    ("dn23:31.12", "append",       '"', "nhiều quả ngọt chăng?"),
    # root: mā parasmin’”ti? — ” IS present in root; Pāyāsi's question (32.10)
    ("dn23:32.11", "append",       '"', "ở đời kia'?"),
]

OPEN_CURLY = {'"': '“', "'": '‘'}
CLOSE_CURLY = {'"': '”', "'": '’'}
PUNCT_CLOSE_AFTER = set('.,?!;:…—–“”‘’"\'')
PUNCT_OPEN_BEFORE = set(':;—–(')


def keyfn(x):
    return tuple(int(n) for n in x.split(":")[1].split("."))


def classify(v, i, stack):
    """Role of the straight mark at v[i]; stack = list of currently-unclosed chars."""
    ch = v[i]
    b = v[:i].rstrip()
    a = v[i + 1:].lstrip()
    prev = b[-1] if b else ""
    nxt = a[0] if a else ""
    if not b or prev in PUNCT_OPEN_BEFORE:
        return "open"
    if not a or nxt in PUNCT_CLOSE_AFTER:
        return "close"
    if ch in stack:
        return "close"
    return "open"


def walk(tr):
    """Return list of (seg, role, ch, kind) structural conflicts + final stack."""
    stack, conflicts = [], []
    for k in sorted(tr, key=keyfn):
        v = tr[k]
        for i, ch in enumerate(v):
            if ch not in '"\'':
                continue
            role = classify(v, i, stack)
            if role == "open":
                if stack and stack[-1] == ch:
                    conflicts.append((k, role, ch, "REOPEN-while-same-open"))
                stack.append(ch)
            else:
                if not stack:
                    conflicts.append((k, role, ch, "CLOSE-empty-stack"))
                elif stack[-1] != ch:
                    conflicts.append((k, role, ch, f"CLOSE-mismatch(top={stack[-1]})"))
                    if ch in stack:
                        while stack and stack[-1] != ch:
                            stack.pop()
                        if stack:
                            stack.pop()
                else:
                    stack.pop()
    return conflicts, stack


def apply():
    with open(VI_PATH, encoding="utf-8") as f:
        tr = json.load(f)
    log = []
    for seg, op, ch, frag in EDITS:
        v = tr[seg]
        if frag not in v:
            raise SystemExit(f"ANCHOR MISS {seg}: {frag!r} not in {v!r}")
        if op == "append":
            assert v.endswith(frag), (seg, v[-40:])
            tr[seg] = v + ch
        elif op == "prepend":
            assert v.startswith(frag), (seg, v[:40])
            tr[seg] = ch + v
        elif op == "wrap":
            tr[seg] = ch + v + ch
        elif op == "remove_last":
            assert v.endswith(frag) and v[-1] == ch, (seg, v[-40:])
            tr[seg] = v[:-1]
        elif op == "remove_first":
            assert v.startswith(frag) and v[0] == ch, (seg, v[:40])
            tr[seg] = v[1:]
        elif op == "replace_first":
            old, new = ch
            idx = v.index(old)
            tr[seg] = v[:idx] + new + v[idx + 1:]
        elif op == "replace_last":
            old, new = ch
            idx = v.rindex(old)
            tr[seg] = v[:idx] + new + v[idx + 1:]
        log.append((seg, op, ch if isinstance(ch, str) else f"{ch[0]}->{ch[1]}"))
    with open(VI_PATH, "w", encoding="utf-8") as f:
        json.dump(tr, f, ensure_ascii=False, indent=2, sort_keys=True)
        f.write("\n")
    for row in log:
        print("EDIT", *row)
    print(f"{len(log)} edits applied")


def walk_cmd():
    tr = json.load(open(VI_PATH, encoding="utf-8"))
    conf, stack = walk(tr)
    for c in conf:
        print("CONFLICT", *c)
    for ch in stack:
        print("LEFT-OPEN", ch)
    print("CLEAN" if not conf and not stack else f"{len(conf)} conflict(s), stack={stack}")


def convert():
    tr = json.load(open(VI_PATH, encoding="utf-8"))
    out = {}
    stack = []
    for k in sorted(tr, key=keyfn):
        v = tr[k]
        chars = list(v)
        for i, ch in enumerate(v):
            if ch not in '"\'':
                continue
            role = classify(v, i, stack)
            chars[i] = OPEN_CURLY[ch] if role == "open" else CLOSE_CURLY[ch]
            if role == "open":
                stack.append(ch)
            else:
                stack.pop()
        out[k] = "".join(chars)
    if stack:
        raise SystemExit(f"REFUSING write: unclosed {stack}")
    with open(VI_PATH, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=2, sort_keys=True)
        f.write("\n")
    print("converted to curly quotes")


def verify():
    import unicodedata
    raw = open(VI_PATH, encoding="utf-8").read()
    assert unicodedata.is_normalized("NFC", raw), "NOT NFC"
    tr = json.loads(raw)
    straight = {k: (v.count('"'), v.count("'")) for k, v in tr.items()
                if '"' in v or "'" in v}
    print("straight marks left:", straight if straight else "none")
    stack = []
    probs = []
    for k in sorted(tr, key=keyfn):
        v = tr[k]
        for i, ch in enumerate(v):
            if ch == "“":
                stack.append(("D", k))
            elif ch == "”":
                if not stack:
                    probs.append((k, i, "”-without-open"))
                else:
                    t, _ = stack.pop()
                    if t == "S":
                        probs.append((k, i, "”-closing-‘"))
            elif ch == "‘":
                if not stack or stack[-1][0] != "D":
                    probs.append((k, i, "‘-outside-“"))
                stack.append(("S", k))
            elif ch == "’":
                if stack and stack[-1][0] == "S":
                    stack.pop()
                else:
                    probs.append((k, i, "’-without-‘ (or apostrophe?)"))
    for t, k in stack:
        probs.append((k, "END", f"LEFT-OPEN-{t}"))
    print("nesting problems:", probs if probs else "none")
    bal = [(k, tr[k].count("“"), tr[k].count("”"), tr[k].count("‘"), tr[k].count("’"))
           for k in tr
           if tr[k].count("“") != tr[k].count("”") or tr[k].count("‘") != tr[k].count("’")]
    print(f"segments w/ spanning quotes (per-segment unbalanced, expected & OK): {len(bal)}")


if __name__ == "__main__":
    mode = sys.argv[1] if len(sys.argv) > 1 else "walk"
    {"apply": apply, "walk": walk_cmd, "convert": convert, "verify": verify}[mode]()
