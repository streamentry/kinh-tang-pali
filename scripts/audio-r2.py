#!/usr/bin/env python3
"""Create/reuse a dedicated public R2 bucket; upload verified MN MP3 then register it.
Uses the same object REST endpoint as Cloudflare Wrangler's r2/helpers/object.ts.
"""
import argparse, hashlib, json, os, subprocess, time, tomllib, urllib.request, urllib.error
from pathlib import Path
from gemini_tts import ROOT, load_env
from narration_config import load_profile, assert_profile_metadata
from audio_pipeline import mp3_info, write_json
from audio_progress import update, now

def main():
    parser=argparse.ArgumentParser(); parser.add_argument('folder',type=Path); args=parser.parse_args()
    profile=load_profile()
    manifest=json.loads((args.folder/'manifest.json').read_text())
    assert_profile_metadata(manifest,profile)
    load_env()
    token=os.environ.get('CLOUDFLARE_API_TOKEN'); account=os.environ.get('CLOUDFLARE_ACCOUNT_ID')
    if not token:
        config=Path.home()/'Library/Preferences/.wrangler/config/default.toml'
        if config.exists(): token=tomllib.loads(config.read_text()).get('oauth_token')
    if not token: raise SystemExit('Run bunx wrangler login, or configure CLOUDFLARE_API_TOKEN in .env.')
    if not account:
        req=urllib.request.Request('https://api.cloudflare.com/client/v4/accounts',headers={'Authorization':'Bearer '+token})
        try:
            with urllib.request.urlopen(req,timeout=30) as response: accounts=json.load(response).get('result',[])
        except urllib.error.HTTPError as e: raise SystemExit(f'Cloudflare authentication HTTP {e.code}; run bunx wrangler login.') from None
        if len(accounts)!=1: raise SystemExit('Set CLOUDFLARE_ACCOUNT_ID to select exactly one account.')
        account=accounts[0]['id']
    storage_file=ROOT/'source/audio-storage.json'
    storage=json.loads(storage_file.read_text())
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
    current=json.loads(subprocess.check_output(['node','--import','tsx','scripts/audio-source.ts',uid],cwd=ROOT))
    if current['source_sha256']!=manifest['source_sha256']:raise RuntimeError('Narration source changed; regenerate before uploading')
    mp3_info(mp3)
    if len(mp3)!=manifest['bytes']:raise RuntimeError('MP3 byte count mismatch')
    if hashlib.sha256(mp3).hexdigest()!=manifest['sha256']:raise RuntimeError('MP3 hash mismatch')
    try: info=request(base+'/'+bucket)
    except RuntimeError as e:
        if str(e)!='Cloudflare HTTP 404':raise
        info=request(base,'POST',{'name':bucket})
    domain=request(base+'/'+bucket+'/domains/managed')
    if not domain.get('enabled'): raise SystemExit('Public access is disabled. Enable it only with explicit editor authorization, then retry.')
    host=domain['domain']; public_base='https://'+host
    collection='mn' if uid.startswith('mn') else 'dn'
    key=f'vi/{collection}/{uid}/{manifest["sha256"][:16]}.mp3'
    request(base+'/'+bucket+'/objects/'+key,'PUT',mp3,{'Content-Type':'audio/mpeg',
        'Cache-Control':'public, max-age=31536000, immutable','Content-Length':str(len(mp3))},raw=True)
    url=public_base+'/'+key
    # Verify public bytes independently before exposing a player.
    for attempt in range(6):
        try:
            with urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'kinh-tang-pali-audio/1.0'}),timeout=180) as response:
                if response.headers.get_content_type()!='audio/mpeg':raise RuntimeError('Public response is not MP3')
                remote=response.read()
            break
        except urllib.error.HTTPError as e:
            if e.code not in (404,429,503) or attempt==5:raise RuntimeError(f'Public audio HTTP {e.code}') from None
            time.sleep(3)
    if hashlib.sha256(remote).hexdigest()!=manifest['sha256']:raise RuntimeError('Public R2 hash mismatch')
    with urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'kinh-tang-pali-audio/1.0','Range':'bytes=0-1023'}),timeout=60) as response:
        if response.status!=206 or response.read()!=mp3[:1024]:raise RuntimeError('Public range readback failed')
    current=json.loads(subprocess.check_output(['node','--import','tsx','scripts/audio-source.ts',uid],cwd=ROOT))
    if current['source_sha256']!=manifest['source_sha256']:raise RuntimeError('Source changed during upload; do not register stale player')
    manifest['r2_verified_at']=now()
    manifest['public_range_verified']=True
    manifest.update({'url':url,'bucket':bucket,'object_key':key})
    target=ROOT/'content/audio'/f'{uid}.json';target.parent.mkdir(parents=True,exist_ok=True)
    write_json(target,manifest)
    update(uid,'generated',upload_verified=True,url=url,object_key=key,bucket=bucket,bytes=manifest['bytes'],sha256=manifest['sha256'],r2_verified_at=manifest['r2_verified_at'],public_range_verified=True)
    # uploaded-verified is awarded only after browser playback verification, not merely an upload.
    storage_file=ROOT/'source/audio-storage.json'
    storage=json.loads(storage_file.read_text()) if storage_file.exists() else {}
    storage.update({'provider':'cloudflare-r2','account_id':account,'bucket_name':bucket,
        'bucket_id':domain.get('bucketId',info.get('id',bucket)),'public_base_url':public_base,'access':'public-read',
        'purpose':'Vietnamese 2026 narration; public scripture audio only'})
    storage_file.write_text(json.dumps(storage,indent=2)+'\n')
    print(f'Uploaded and publicly verified: {url}')
if __name__=='__main__':main()
