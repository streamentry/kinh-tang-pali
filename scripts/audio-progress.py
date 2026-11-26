#!/usr/bin/env python3
import argparse,json,subprocess
from narration_config import load_profile,profile_digest
from audio_progress import initialize,update,PROGRESS,GROUP_PROGRESS
p=argparse.ArgumentParser();p.add_argument('--init',action='store_true');p.add_argument('--uid');p.add_argument('--status');p.add_argument('--evidence')
p.add_argument('--groups',action='store_true');p.add_argument('--collection',choices=['sn','an','kn']);p.add_argument('--group');a=p.parse_args()
if a.group and not a.collection:p.error('--group requires --collection')
if a.init:
    args=['node','--import','tsx','scripts/audio-inventory.ts']
    if a.collection:args+=['--collection',a.collection]
    elif a.groups:args+=['--groups']
    if a.group:args+=['--group',a.group]
    inventory=json.loads(subprocess.check_output(args))
    initialize(inventory,profile_digest(load_profile()),group=bool(a.groups or a.collection))
elif a.uid and a.status and a.evidence:
    update(a.uid,a.status,**json.loads(open(a.evidence).read()))
else:
    progress=json.loads((GROUP_PROGRESS if a.groups or a.collection else PROGRESS).read_text());counts={}
    for r in progress['texts'].values():counts[r['status']]=counts.get(r['status'],0)+1
    print(json.dumps({'total':len(progress['texts']),'counts':counts}))
