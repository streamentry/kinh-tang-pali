#!/usr/bin/env python3
"""Create/reuse a dedicated public R2 bucket; upload verified MN MP3 then register it.
Uses the same object REST endpoint as Cloudflare Wrangler's r2/helpers/object.ts.
"""
import argparse, hashlib, json, os, subprocess, time, urllib.request, urllib.error
from pathlib import Path
from gemini_tts import ROOT, load_env
from narration_config import load_profile, assert_profile_metadata, profile_digest
from audio_pipeline import mp3_info, write_json, audio_object_key
from audio_progress import update, now, require_current_group_source

def current_source(uid, audience=None, collection=None):
    if audience:
        collection=collection or ('dn' if uid.startswith('dn') else 'mn')
        command=['node','--import','tsx','scripts/audio-explanation-source.ts',collection,uid,audience]
    else:
        command=['node','--import','tsx','scripts/audio-source.ts',uid]
    return json.loads(subprocess.check_output(command,cwd=ROOT))

def cloudflare_token():
    token=os.environ.get('CLOUDFLARE_API_TOKEN')
    if token:return token
    # Ask Wrangler to refresh an expired local OAuth token before upload. Keep
    # the bearer token in memory only; never print it or persist another copy.
    try:
        result=subprocess.run(['bunx','--package','wrangler@4.149.0','wrangler','auth','token'],
            cwd=ROOT,capture_output=True,text=True,timeout=90)
    except (OSError,subprocess.TimeoutExpired):
        raise SystemExit('Wrangler OAuth refresh failed; run bunx wrangler login.') from None
    lines=[line.strip() for line in result.stdout.splitlines()
        if line.strip() and line.strip().isascii() and not any(char.isspace() for char in line.strip())]
    if result.returncode or len(lines)!=1:
        raise SystemExit('Wrangler OAuth refresh failed; run bunx wrangler login.')
    return lines[0]

def main():
    parser=argparse.ArgumentParser(); parser.add_argument('folder',type=Path); parser.add_argument('--collection',choices=('mn','dn')); parser.add_argument('--audience',choices=('children','adults','older-adults')); args=parser.parse_args()
    profile=load_profile()
    manifest=json.loads((args.folder/'manifest.json').read_text())
    assert_profile_metadata(manifest,profile)
    # Gate before loading credentials or making any provider request.
    uid=manifest['uid']; audience=args.audience
    collection=args.collection or manifest.get('collection') or ('dn' if uid.startswith('dn') else 'mn')
    if audience and manifest.get('collection') != collection:
        raise RuntimeError('Requested collection differs from the cached narration manifest')
    if manifest.get('audience_variant')!=audience:
        raise RuntimeError('Requested audience differs from the cached narration manifest')
    current=current_source(uid,audience,collection)
    if audience and (manifest.get('track_kind')!='explanation' or manifest.get('selected_review_id')!=current['selected_review_id']):
        raise RuntimeError('Explanation review identity differs from the current published source')
    require_current_group_source(current,profile_digest(profile))
    if audience:
        registry_path=ROOT/'content/audio'/f'{uid}.json'
        if registry_path.exists():
            existing=json.loads(registry_path.read_text()).get('explanation_tracks',{}).get(audience)
            if existing:
                if existing.get('source_sha256')==manifest.get('source_sha256') and existing.get('sha256')==manifest.get('sha256'):
                    raise SystemExit('This explanation audio is already registered; refusing a duplicate R2 upload.')
                raise RuntimeError('A different explanation audio version is registered; preserving it instead of overwriting.')
    # Package from verified cached WAVs; never send speech to a provider here.
    packaged=json.loads(subprocess.check_output(['uv','run','--offline','--with','lameenc','python3','scripts/audio_reading_parts.py',str(args.folder.resolve())],cwd=ROOT))
    upload_manifest=packaged['manifest']; assets=packaged['assets']
    load_env()
    storage_file=ROOT/'source/audio-storage.json'
    storage=json.loads(storage_file.read_text())
    token=cloudflare_token()
    account=os.environ.get('CLOUDFLARE_ACCOUNT_ID') or storage.get('account_id')
    if not account: raise RuntimeError('No Cloudflare account ID is configured or pinned for audio storage')
    if account!=storage['account_id']:raise RuntimeError('Authenticated account differs from pinned audio storage')
    bucket=storage['bucket_name']
    base=f'https://api.cloudflare.com/client/v4/accounts/{account}/r2/buckets'
    def request(url,method='GET',body=None,headers=None,raw=False):
        h={'Authorization':'Bearer '+token, **(headers or {})}
        if isinstance(body,dict): body=json.dumps(body).encode();h['Content-Type']='application/json'
        try:
            with urllib.request.urlopen(urllib.request.Request(url,data=body,method=method,headers=h),timeout=180) as r:
                content=r.read()
                if raw:return content
                data=json.loads(content)
                if not data.get('success'):raise RuntimeError('Cloudflare rejected request')
                return data['result']
        except urllib.error.HTTPError as e: raise RuntimeError(f'Cloudflare HTTP {e.code}') from None
    uid=manifest['uid']; mp3=(args.folder/f'{uid}.mp3').read_bytes()
    current=current_source(uid,audience,collection)
    if current['source_sha256']!=manifest['source_sha256']:raise RuntimeError('Narration source changed; regenerate before uploading')
    mp3_info(mp3)
    if len(mp3)!=manifest['bytes']:raise RuntimeError('MP3 byte count mismatch')
    if hashlib.sha256(mp3).hexdigest()!=manifest['sha256']:raise RuntimeError('MP3 hash mismatch')
    key=audio_object_key(current,manifest)
    try: info=request(base+'/'+bucket)
    except RuntimeError as e:
        if str(e)!='Cloudflare HTTP 404':raise
        info=request(base,'POST',{'name':bucket})
    domain=request(base+'/'+bucket+'/domains/managed')
    if not domain.get('enabled'): raise SystemExit('Public access is disabled. Enable it only with explicit editor authorization, then retry.')
    host=domain['domain']; public_base='https://'+host
    if public_base!=storage['public_base_url']:raise RuntimeError('Public domain differs from pinned audio storage')
    urls=[]
    for asset in assets:
        data=Path(asset['path']).read_bytes()
        if len(data)!=asset['bytes'] or hashlib.sha256(data).hexdigest()!=asset['sha256']:
            raise RuntimeError('Upload asset changed')
        if len(data)>40_000_000 and upload_manifest.get('parts'):
            raise RuntimeError('Part exceeds bounded file budget')
        prefix=(f"vi/{collection}/{uid}/explanations/{audience}" if audience else f"vi/{current['collection']}/{uid}")
        asset_key=(f"{prefix}/parts-v1/{upload_manifest['sha256'][:16]}/{asset['id']}-{asset['sha256'][:16]}.mp3"
                   if upload_manifest.get('parts') else key)
        request(base+'/'+bucket+'/objects/'+asset_key,'PUT',data,{'Content-Type':'audio/mpeg',
            'Cache-Control':'public, max-age=31536000, immutable','Content-Length':str(len(data))},raw=True)
        asset_url=public_base+'/'+asset_key
        for attempt in range(6):
            try:
                with urllib.request.urlopen(urllib.request.Request(asset_url,headers={'User-Agent':'kinh-tang-pali-audio/1.0'}),timeout=180) as response:
                    if response.headers.get_content_type()!='audio/mpeg':raise RuntimeError('Public response is not MP3')
                    remote=response.read()
                break
            except urllib.error.HTTPError as e:
                if e.code not in (404,429,503) or attempt==5:raise RuntimeError(f'Public audio HTTP {e.code}') from None
                time.sleep(3)
        if len(remote)!=asset['bytes'] or hashlib.sha256(remote).hexdigest()!=asset['sha256']:
            raise RuntimeError('Public R2 hash/bytes mismatch')
        with urllib.request.urlopen(urllib.request.Request(asset_url,headers={'User-Agent':'kinh-tang-pali-audio/1.0','Range':'bytes=0-1023'}),timeout=60) as response:
            if response.status!=206 or response.read()!=data[:1024]:raise RuntimeError('Public range readback failed')
        urls.append({'url':asset_url,'object_key':asset_key})
    manifest=upload_manifest
    if manifest.get('parts'):
        for part,remote in zip(manifest['parts'],urls,strict=True):part.update(remote,public_range_verified=True)
    url=urls[0]['url'];key=urls[0]['object_key']
    current=current_source(uid,audience,collection)
    if current['source_sha256']!=manifest['source_sha256']:raise RuntimeError('Source changed during upload; do not register stale player')
    require_current_group_source(current,profile_digest(profile))
    manifest['r2_verified_at']=now()
    manifest['public_range_verified']=True
    manifest.update({'url':url,'bucket':bucket,'object_key':key,'upload_verified':True,
        'r2_full_sha256_verified':True,'r2_full_sha256_verified_at':manifest['r2_verified_at']})
    target=ROOT/'content/audio'/f'{uid}.json';target.parent.mkdir(parents=True,exist_ok=True)
    if audience:
        registry=json.loads(target.read_text())
        if registry.get('uid')!=uid or registry.get('source_sha256')!=current_source(uid)['source_sha256']:
            raise RuntimeError('Standard audio registration changed; refusing to register an explanation track')
        tracks=registry.setdefault('explanation_tracks',{})
        history=registry.setdefault('explanation_track_history',{})
        previous=tracks.get(audience)
        if previous and (previous.get('source_sha256')!=manifest['source_sha256'] or previous.get('sha256')!=manifest['sha256']):
            history.setdefault(audience,[]).append(previous)
        tracks[audience]=manifest
        write_json(target,registry)
    else:
        write_json(target,manifest)
        update(uid,'generated',duration_seconds=manifest['duration_seconds'],scripture_start_seconds=manifest['scripture_start_seconds'],upload_verified=True,url=url,object_key=key,bucket=bucket,bytes=manifest['bytes'],sha256=manifest['sha256'],r2_verified_at=manifest['r2_verified_at'],public_range_verified=True)
    # uploaded-verified is awarded only after browser playback verification, not merely an upload.
    storage_file=ROOT/'source/audio-storage.json'
    storage=json.loads(storage_file.read_text()) if storage_file.exists() else {}
    storage.update({'provider':'cloudflare-r2','account_id':account,'bucket_name':bucket,
        'bucket_id':domain.get('bucketId',info.get('id',bucket)),'public_base_url':public_base,'access':'public-read',
        'purpose':'Vietnamese 2026 narration; public sutta and audience-explanation audio'})
    storage_file.write_text(json.dumps(storage,indent=2)+'\n')
    print(f'Uploaded and publicly verified: {url}')
if __name__=='__main__':main()
