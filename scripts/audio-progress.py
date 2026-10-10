#!/usr/bin/env python3
import argparse,json,subprocess
from narration_config import load_profile,profile_digest
from audio_progress import initialize,update,PROGRESS
p=argparse.ArgumentParser();p.add_argument('--init',action='store_true');p.add_argument('--uid');p.add_argument('--status');p.add_argument('--evidence');a=p.parse_args()
if a.init:
    inventory=json.loads(subprocess.check_output(['node','--import','tsx','scripts/audio-inventory.ts']))
    initialize(inventory,profile_digest(load_profile()))
elif a.uid and a.status and a.evidence:
    update(a.uid,a.status,**json.loads(open(a.evidence).read()))
else:
    progress=json.loads(PROGRESS.read_text());counts={}
    for r in progress['texts'].values():counts[r['status']]=counts.get(r['status'],0)+1
    print(json.dumps({'total':len(progress['texts']),'counts':counts}))
