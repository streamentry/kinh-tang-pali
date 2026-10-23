#!/usr/bin/env python3
"""Audit exact transcript/chunk plans without credentials, provider calls or media."""
import argparse,json,subprocess
from collections import Counter
from pathlib import Path
from audio_pipeline import digest,plan_source,write_json
from narration_config import load_profile,profile_digest

ROOT=Path(__file__).resolve().parent.parent

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--collection',choices=['sn','an','kn'])
    parser.add_argument('--group')
    parser.add_argument('--uid',help='One actual catalog reading UID; requires --collection and excludes --group')
    parser.add_argument('--output',type=Path)
    args=parser.parse_args()
    if args.group and not args.collection:parser.error('--group requires --collection')
    if args.uid is not None and (not args.uid.strip() or not args.collection or args.group is not None):parser.error('--uid must be nonempty, requires --collection and cannot be combined with --group')
    command=['node','--import','tsx','scripts/audio-inventory.ts','--include-source']
    command+=['--collection',args.collection] if args.collection else ['--groups']
    if args.group:command+=['--group',args.group]
    if args.uid:command+=['--uid',args.uid]
    inventory=json.loads(subprocess.check_output(command,cwd=ROOT))
    profile=load_profile();profile_hash=profile_digest(profile);rows=[]
    for row in inventory:
        source=row['source'];issues=list(row['issues']);plan=[]
        if not issues:
            try:
                keys=['policy','title','summary','segments'] if source.get('policy') else ['summary','segments']
                actual=digest(json.dumps({key:source[key] for key in keys},ensure_ascii=False,separators=(',',':')).encode())
                if actual!=source['source_sha256']:raise ValueError('Transcript source hash mismatch')
                plan=plan_source(source,profile)
                if not plan or not any(chunk['section']=='scripture' for chunk in plan):raise ValueError('No spoken scripture')
            except (ValueError,RuntimeError) as error:issues.append(str(error))
        fingerprint=digest(json.dumps([source['source_sha256'],profile_hash,plan],ensure_ascii=False,sort_keys=True).encode())
        rows.append({key:row[key] for key in ('uid','collection','order','home_group','source_sha256','transcript_policy')}|{
            'issues':issues,'chunks':len(plan),'spoken_characters':sum(len(chunk['text']) for chunk in plan),
            'fingerprint':fingerprint if not issues else None})
    result={'schema_version':1,'provider_requests':0,'profile_sha256':profile_hash,
        'total':len(rows),'collections':dict(Counter(row['collection'] for row in rows)),
        'eligible':sum(not row['issues'] for row in rows),'chunks':sum(row['chunks'] for row in rows),
        'spoken_characters':sum(row['spoken_characters'] for row in rows),'texts':rows}
    if args.output:write_json(args.output,result)
    print(json.dumps({key:value for key,value in result.items() if key!='texts'},ensure_ascii=False))
    if any(row['issues'] for row in rows):
        for row in rows:
            if row['issues']:print(f'{row["uid"]}: '+ '; '.join(row['issues']))
        raise SystemExit(1)

if __name__=='__main__':main()
