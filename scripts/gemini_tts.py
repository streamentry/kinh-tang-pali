#!/usr/bin/env python3
"""Adapted from ../thethreadseers.com/scripts/gemini_tts.py.
MN narration: canonical summary, then Vietnamese 2026; resumable WAV chunks.
Requires lameenc (same encoder as The Thread Seers), and Node/tsx.
"""
import argparse, base64, hashlib, io, json, os, subprocess, time, urllib.request, urllib.error, wave
from pathlib import Path
from narration_config import load_profile, profile_digest, profile_metadata
ROOT = Path(__file__).resolve().parent.parent

def load_env():
    for line in (ROOT / '.env').read_text().splitlines():
        if '=' in line and not line.lstrip().startswith('#'):
            k,v = line.split('=',1)
            os.environ.setdefault(k.strip(),v.strip().strip('\"').strip("'"))

def chunks(paragraphs, limit):
    result, current = [], ''
    for paragraph in paragraphs:
        if len(paragraph) > limit:
            raise ValueError('Paragraph exceeds chunk limit; split at sentence boundary first')
        if current and len(current) + len(paragraph) + 2 > limit:
            result.append(current); current = ''
        current += ('\n\n' if current else '') + paragraph
    if current: result.append(current)
    return result

def generate(key, text, profile):
    payload = {'model':profile['model'],'input':[{'type':'user_input','content':[{'type':'text','text':text,
        'annotations':[{'type':'speech_metadata','style':profile['style']}]}]}],
        'response_format':{'type':'audio'},'generation_config':{'speech_config':[{'voice':profile['voice']}]}}
    for attempt in range(5):
        try:
            req = urllib.request.Request('https://generativelanguage.googleapis.com/v1beta/interactions',
                data=json.dumps(payload).encode(),headers={'Content-Type':'application/json','x-goog-api-key':key})
            with urllib.request.urlopen(req,timeout=180) as response: data=json.load(response)
            blocks=[c for s in data.get('steps',[]) if s.get('type')=='model_output' for c in s.get('content',[]) if c.get('type')=='audio']
            if not blocks: raise RuntimeError('Provider returned no audio')
            audio=base64.b64decode(blocks[-1]['data'])
            with wave.open(io.BytesIO(audio),'rb') as w:
                if w.getnframes()==0 or w.getsampwidth()!=2: raise RuntimeError('Invalid WAV')
            return audio
        except urllib.error.HTTPError as e:
            # Never print request URLs, credentials or provider response text.
            if e.code not in (429,500,502,503,504) or attempt==4:
                raise RuntimeError(f'Gemini HTTP {e.code}') from None
            print(f'Provider busy ({e.code}), retry {attempt+1}',flush=True)
            time.sleep(min(30,3*2**attempt))
    raise RuntimeError('Retries exhausted')

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument('--uid',default='mn1')
    parser.add_argument('--prepare-only',action='store_true')
    args=parser.parse_args()
    profile=load_profile()
    source=json.loads(subprocess.check_output(['node','--import','tsx','scripts/audio-source.ts',args.uid],cwd=ROOT))
    summary=chunks(source['summary'].split('\n\n'),profile['chunk_max_chars'])
    # Join adjacent segments into prose; segment IDs are provenance only, never spoken.
    body=chunks([value for _,value in source['segments'] if value.strip('… .')],profile['chunk_max_chars'])
    parts=summary+body
    fingerprint=hashlib.sha256(json.dumps([source['source_sha256'],profile_digest(profile)],ensure_ascii=False).encode()).hexdigest()
    folder=ROOT/'audio'/args.uid/fingerprint[:16]; folder.mkdir(parents=True,exist_ok=True)
    (folder/'transcript.txt').write_text('\n\n'.join(parts))
    (folder/'source.json').write_text(json.dumps(source,ensure_ascii=False,indent=2))
    (folder/'narration-profile.json').write_text(json.dumps(profile,ensure_ascii=False,indent=2)+'\n')
    print(f'{args.uid}: {len(parts)} chunks, {len(source["segments"])} scripture segments',flush=True)
    if args.prepare_only: return
    load_env(); key=os.environ.get('GEMINI_API_KEY') or os.environ['GOOGLE_GENAI_API_KEY']
    import lameenc
    encoder=lameenc.Encoder(); encoder.set_bit_rate(profile['mp3_bitrate_kbps']); encoder.set_in_sample_rate(profile['sample_rate_hz']); encoder.set_channels(profile['channels']); encoder.set_quality(profile['encoder_quality'])
    encoded=bytearray(); duration=0; scripture_start=0
    for i,text in enumerate(parts):
        file=folder/f'{i:03}.wav'
        if not file.exists():
            print(f'Synthesizing {i+1}/{len(parts)} ({len(text)} chars)',flush=True)
            temp=file.with_suffix('.tmp'); temp.write_bytes(generate(key,text,profile)); temp.replace(file)
        with wave.open(str(file),'rb') as w:
            if (w.getframerate(),w.getnchannels(),w.getsampwidth()) != (profile['sample_rate_hz'],profile['channels'],profile['sample_width_bytes']): raise RuntimeError('Unexpected WAV format')
            frames=w.readframes(w.getnframes()); duration+=w.getnframes()/profile['sample_rate_hz']
            encoded.extend(encoder.encode(frames))
        pause=profile['summary_to_scripture_pause_seconds'] if i==len(summary)-1 else profile['chunk_pause_seconds']
        encoded.extend(encoder.encode(b'\0'*(profile['sample_width_bytes']*profile['channels']*int(profile['sample_rate_hz']*pause)))); duration+=pause
        if i==len(summary)-1: scripture_start=duration
    encoded.extend(encoder.flush())
    mp3=folder/f'{args.uid}.mp3'; mp3.write_bytes(encoded)
    manifest={ 'uid':args.uid,'source_sha256':source['source_sha256'],'model':profile['model'],'voice':profile['voice'],
        'style':profile['style'],**profile_metadata(profile),'duration_seconds':duration,'scripture_start_seconds':scripture_start,
        'sha256':hashlib.sha256(encoded).hexdigest(),'bytes':len(encoded),'review_status':'pending'}
    (folder/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
    print(f'Created {mp3}, {duration:.1f}s',flush=True)
if __name__=='__main__': main()
