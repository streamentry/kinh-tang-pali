"""Catalog-wide audio progress; separate upload, merge, live and review evidence."""
import json
from datetime import datetime,timezone
from pathlib import Path
from audio_pipeline import write_json
ROOT=Path(__file__).resolve().parent.parent
PROGRESS=ROOT/'content/audio/progress.json'
GROUP_PROGRESS=ROOT/'content/audio/group-progress.json'
STATES={'not-started','generating','generated','uploaded-verified','merged','live','blocked'}
def now():return datetime.now(timezone.utc).isoformat()
def initialize(inventory, profile_hash, group=False):
    target=GROUP_PROGRESS if group else PROGRESS
    existing=json.loads(target.read_text()) if target.exists() else {'schema_version':2 if group else 1,'texts':{}}
    if existing.get('schema_version')!=(2 if group else 1):raise RuntimeError('Unexpected audio progress schema')
    expected=[r['uid'] for r in inventory]
    if not group and set(existing['texts'])-set(expected):raise RuntimeError('Progress has UIDs outside catalogs')
    for row in inventory:
        old=existing['texts'].get(row['uid'],{})
        changed=old.get('source_sha256') not in (None,row['source_sha256']) or old.get('profile_sha256') not in (None,profile_hash)
        existing['texts'][row['uid']]={**old,'uid':row['uid'],'collection':row['collection'],'order':row['order'],
            'status':'blocked' if row['issues'] or changed else old.get('status','not-started'),
            'source_sha256':row['source_sha256'],'profile_sha256':profile_hash,
            'errors':row['issues']+(['Source/profile drift: reverify before resuming'] if changed else
                old.get('errors',[]) if old.get('status')=='blocked' and not row['issues'] else []),
            'updated_at':now(),'batch':old.get('batch',None),'review_status':old.get('review_status','pending')}
        if group:
            existing['texts'][row['uid']].update(home_group=row['home_group'],transcript_policy=row['transcript_policy'])
    for row in existing['texts'].values():
        for key in ['url','object_key','duration_seconds','scripture_start_seconds','sha256','bytes','pr_url','merge_commit','live_verified_at']:
            row.setdefault(key,None)
    if group:
        # A versioned production queue, not a claim that all catalog texts were generated.
        # Complete eligibility accounting lives in the dry-run inventory.
        order={'sn':0,'an':1,'kn':2}
        expected=sorted(existing['texts'],key=lambda uid:(order[existing['texts'][uid]['collection']],existing['texts'][uid]['order']))
    existing['catalog_uids']=expected;write_json(target,existing)
def update(uid,status,**evidence):
    if status not in STATES:raise ValueError('Invalid audio status')
    # UID identity comes from the verified source; never route heterogeneous KN IDs by prefix.
    legacy=json.loads(PROGRESS.read_text()) if PROGRESS.exists() else {'texts':{}}
    target=PROGRESS if uid in legacy['texts'] else GROUP_PROGRESS
    if not target.exists():raise RuntimeError('Initialize the audio production queue before generating')
    progress=legacy if target==PROGRESS else json.loads(target.read_text())
    if uid not in progress['texts']:raise RuntimeError('UID absent from progress catalog')
    progress['texts'][uid].update(status=status,updated_at=now(),**evidence);write_json(target,progress)

def require_current_group_source(source, profile_hash):
    """New-scope requests must not bypass unresolved queue/source/QC blockers."""
    if source['collection'] in ('mn','dn'):return
    if not GROUP_PROGRESS.exists():raise RuntimeError('Initialize the group audio production queue before generating or uploading')
    progress=json.loads(GROUP_PROGRESS.read_text())
    if progress.get('schema_version')!=2:raise RuntimeError('Unexpected group production queue schema')
    row=progress.get('texts',{}).get(source['uid'])
    if not row:raise RuntimeError('UID absent from group production queue')
    if row.get('uid')!=source['uid'] or row.get('collection')!=source['collection'] or row.get('source_sha256')!=source['source_sha256'] or row.get('profile_sha256')!=profile_hash or row.get('transcript_policy')!=source.get('policy'):
        raise RuntimeError('Group queue source/profile drift; reinitialize and reverify before resuming')
    if row.get('status') not in STATES or row.get('status')=='blocked' or row.get('errors'):
        raise RuntimeError('Group queue has unresolved blockers; retain evidence and explicitly reverify before resuming')
