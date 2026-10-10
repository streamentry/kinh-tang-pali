"""Catalog-wide audio progress; separate upload, merge, live and review evidence."""
import json
from datetime import datetime,timezone
from pathlib import Path
from audio_pipeline import write_json
ROOT=Path(__file__).resolve().parent.parent
PROGRESS=ROOT/'content/audio/progress.json'
STATES={'not-started','generating','generated','uploaded-verified','merged','live','blocked'}
def now():return datetime.now(timezone.utc).isoformat()
def initialize(inventory, profile_hash):
    existing=json.loads(PROGRESS.read_text()) if PROGRESS.exists() else {'schema_version':1,'texts':{}}
    expected=[r['uid'] for r in inventory]
    if set(existing['texts'])-set(expected):raise RuntimeError('Progress has UIDs outside catalogs')
    for row in inventory:
        old=existing['texts'].get(row['uid'],{})
        changed=old.get('source_sha256') not in (None,row['source_sha256']) or old.get('profile_sha256') not in (None,profile_hash)
        existing['texts'][row['uid']]={**old,'uid':row['uid'],'collection':row['collection'],'order':row['order'],
            'status':'blocked' if row['issues'] or changed else old.get('status','not-started'),
            'source_sha256':row['source_sha256'],'profile_sha256':profile_hash,
            'errors':row['issues']+(['Source/profile drift: reverify before resuming'] if changed else []),
            'updated_at':now(),'batch':old.get('batch',None),'review_status':old.get('review_status','pending')}
    existing['catalog_uids']=expected;write_json(PROGRESS,existing)
def update(uid,status,**evidence):
    if status not in STATES:raise ValueError('Invalid audio status')
    if not PROGRESS.exists():return
    progress=json.loads(PROGRESS.read_text())
    if uid not in progress['texts']:raise RuntimeError('UID absent from progress catalog')
    progress['texts'][uid].update(status=status,updated_at=now(),**evidence);write_json(PROGRESS,progress)
