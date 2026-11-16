#!/usr/bin/env python3
"""Audit the 152 x 3 published MN explanation sources without TTS or uploads."""
import argparse
import hashlib
import json
import re
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / 'scripts'))
from audio_pipeline import plan_source, write_json  # noqa: E402
from narration_config import load_profile, profile_digest  # noqa: E402

AUDIENCES = ('children', 'adults', 'older-adults')
SHA256 = re.compile(r'^[0-9a-f]{64}$')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path)
    parser.add_argument('--require-uploaded', action='store_true', help='Fail unless all 456 current variants have complete verified R2 registrations')
    args = parser.parse_args()

    profile = load_profile()
    raw = subprocess.check_output(
        ['node', '--import', 'tsx', 'scripts/audio-explanation-source.ts', '--all'],
        cwd=ROOT,
    )
    sources = json.loads(raw)
    expected_pairs = {(f'mn{i}', audience) for i in range(1, 153) for audience in AUDIENCES}
    actual_pairs = {(source.get('uid'), source.get('audience')) for source in sources}
    if len(sources) != 456 or actual_pairs != expected_pairs:
        raise SystemExit('Explanation source inventory must cover exactly 152 UIDs × 3 audiences.')

    tracks = []
    totals = {'characters': 0, 'words': 0, 'chunks': 0, 'pause_boundaries': 0}
    for source in sources:
        if source.get('collection') != 'mn' or source.get('policy') != 'explanation-audience-v1':
            raise SystemExit(f"{source.get('uid')}/{source.get('audience')}: unexpected source identity or policy")
        if not SHA256.fullmatch(source.get('source_sha256', '')) or not source.get('selected_review_id'):
            raise SystemExit(f"{source['uid']}/{source['audience']}: source hash/review identity missing")
        if not source.get('segments') or not all(isinstance(part, list) and len(part) == 2 and part[1].strip()
                                                  for part in source['segments']):
            raise SystemExit(f"{source['uid']}/{source['audience']}: empty or malformed spoken source")

        plan = plan_source(source, profile)
        texts = [part['text'] for part in plan]
        if not plan or any(not text or len(text) > profile['chunk_max_chars'] for text in texts):
            raise SystemExit(f"{source['uid']}/{source['audience']}: invalid chunk plan")
        expected_text = ' '.join(value for _, value in source['segments'])
        planned_text = ' '.join(texts)
        if ' '.join(expected_text.split()) != ' '.join(planned_text.split()):
            raise SystemExit(f"{source['uid']}/{source['audience']}: chunk plan changed spoken text")

        chars = sum(len(value) for _, value in source['segments'])
        words = sum(len(value.split()) for _, value in source['segments'])
        record = {
            'uid': source['uid'],
            'audience': source['audience'],
            'selected_review_id': source['selected_review_id'],
            'review_date': source['review_date'],
            'source_sha256': source['source_sha256'],
            'profile_sha256': profile_digest(profile),
            'characters': chars,
            'words': words,
            'chunks': len(plan),
            'longest_chunk_chars': max(len(text) for text in texts),
        }
        registration_file=ROOT/'content/audio'/f"{source['uid']}.json"
        registered=None
        if registration_file.exists():
            registered=json.loads(registration_file.read_text()).get('explanation_tracks',{}).get(source['audience'])
        record['review_status']=registered.get('review_status') if registered else None
        record['uploaded_verified']=bool(registered and registered.get('uid')==source['uid']
            and registered.get('collection')=='mn' and registered.get('audience_variant')==source['audience']
            and registered.get('track_kind')=='explanation'
            and registered.get('transcript_policy')=='explanation-audience-v1'
            and registered.get('source_sha256')==source['source_sha256']
            and registered.get('selected_review_id')==source['selected_review_id']
            and registered.get('review_date')==source['review_date']
            and registered.get('content_hash')==source['content_hash']
            and registered.get('narration_profile_id')==profile['id']
            and registered.get('narration_profile_sha256')==profile_digest(profile)
            and registered.get('upload_verified') is True
            and registered.get('public_range_verified') is True
            and registered.get('r2_full_sha256_verified') is True
            and registered.get('review_status')=='pending'
            and isinstance(registered.get('url'),str) and registered['url'].startswith('https://')
            and isinstance(registered.get('sha256'),str) and SHA256.fullmatch(registered['sha256'])
            and isinstance(registered.get('bytes'),int) and registered['bytes']>0)
        if args.require_uploaded and not record['uploaded_verified']:
            raise SystemExit(f"{source['uid']}/{source['audience']}: missing or stale public R2 registration")
        tracks.append(record)
        totals['characters'] += chars
        totals['words'] += words
        totals['chunks'] += len(plan)
        totals['pause_boundaries'] += max(0, len(plan) - 1)

    report = {
        'schema_version': 1,
        'generated_at': datetime.now(timezone.utc).isoformat(timespec='seconds').replace('+00:00', 'Z'),
        'scope': {'collection': 'mn', 'uids': 152, 'audiences': list(AUDIENCES), 'tracks': len(tracks)},
        'profile_id': profile['id'],
        'profile_sha256': profile_digest(profile),
        'profile_chunk_max_chars': profile['chunk_max_chars'],
        'profile_chunk_pause_seconds': profile['chunk_pause_seconds'],
        'estimated_chunk_silence_seconds': totals['chunks'] * profile['chunk_pause_seconds'],
        'totals': totals,
        'tts_requests_required': totals['chunks'],
        'all_uploaded_verified': all(track['uploaded_verified'] for track in tracks),
        'tracks': tracks,
    }
    if args.output:
        output = args.output if args.output.is_absolute() else ROOT / args.output
        report['output'] = str(output.relative_to(ROOT)) if output.is_relative_to(ROOT) else str(output)
        write_json(output, report)
    print(json.dumps({
        'scope': report['scope'],
        'profile_id': report['profile_id'],
        'profile_sha256': report['profile_sha256'],
        'totals': totals,
        'tts_requests_required': totals['chunks'],
        'all_uploaded_verified': report['all_uploaded_verified'],
        'output': report.get('output'),
    }, ensure_ascii=False))


if __name__ == '__main__':
    main()
