#!/usr/bin/env python3
"""Generate and optionally upload one bounded, serial MN or DN explanation batch."""
import argparse
import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / 'scripts'))
from audio_pipeline import plan_source, digest  # noqa: E402
from narration_config import load_profile, profile_digest  # noqa: E402

AUDIENCES = ('children', 'adults', 'older-adults')
UID_COUNTS = {'mn': 152, 'dn': 34}


def source_for(collection, uid, audience):
    return json.loads(subprocess.check_output(
        ['node', '--import', 'tsx', 'scripts/audio-explanation-source.ts', collection, uid, audience], cwd=ROOT,
    ))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--collection', choices=('mn', 'dn'), default='mn')
    parser.add_argument('--start', type=int, required=True, help='First discourse number, inclusive')
    parser.add_argument('--end', type=int, required=True, help='Last discourse number, inclusive; at most five UIDs')
    parser.add_argument('--audiences', nargs='+', choices=AUDIENCES, default=list(AUDIENCES))
    parser.add_argument('--prepare-only', action='store_true', help='Write transcript/plan only; never call Gemini or R2')
    parser.add_argument('--upload', action='store_true', help='Upload each completed variant to the pinned R2 bucket')
    args = parser.parse_args()
    if args.start < 1 or args.end > UID_COUNTS[args.collection] or args.end < args.start or args.end - args.start + 1 > 5:
        raise SystemExit(f'Choose a valid batch of one to five {args.collection.upper()} suttas within {args.collection}1–{args.collection}{UID_COUNTS[args.collection]}.')
    if len(set(args.audiences)) != len(args.audiences):
        raise SystemExit('Audience list contains duplicates.')
    if args.prepare_only and args.upload:
        raise SystemExit('--prepare-only and --upload cannot be used together.')

    profile = load_profile()
    python = sys.executable
    records = []
    for number in range(args.start, args.end + 1):
        uid = f'{args.collection}{number}'
        for audience in args.audiences:
            source = source_for(args.collection, uid, audience)
            plan = plan_source(source, profile)
            fingerprint = digest(json.dumps(
                [source['source_sha256'], profile_digest(profile), plan],
                ensure_ascii=False, sort_keys=True,
            ).encode())[:16]
            folder = ROOT / 'audio' / uid / 'variants' / audience / fingerprint
            registration = ROOT / 'content/audio' / f'{uid}.json'
            if registration.exists():
                prior = json.loads(registration.read_text()).get('explanation_tracks', {}).get(audience)
                if prior:
                    if (prior.get('source_sha256') != source['source_sha256']
                            or prior.get('narration_profile_sha256') != profile_digest(profile)):
                        raise SystemExit(f'{uid}/{audience}: registered variant differs; preserve it and inspect before continuing.')
                    if not (prior.get('upload_verified') and prior.get('r2_full_sha256_verified') and prior.get('public_range_verified')):
                        raise SystemExit(f'{uid}/{audience}: registration lacks complete R2 proof; preserve it and inspect before continuing.')
                    print(f'{uid}/{audience}: already registered; reusing without TTS or upload', flush=True)
                    records.append({'uid': uid, 'audience': audience, 'fingerprint': fingerprint,
                                    'chunks': len(plan), 'prepared': False, 'uploaded': True, 'reused': True})
                    continue
            command = [python, 'scripts/gemini_tts.py', '--uid', uid, '--collection', args.collection, '--audience', audience]
            if args.prepare_only:
                command.append('--prepare-only')
            print(f'{uid}/{audience}: {len(plan)} chunks, fingerprint {fingerprint}', flush=True)
            subprocess.run(command, cwd=ROOT, check=True)
            if args.upload:
                subprocess.run([python, 'scripts/audio-r2.py', str(folder), '--collection', args.collection, '--audience', audience], cwd=ROOT, check=True)
            records.append({'uid': uid, 'audience': audience, 'fingerprint': fingerprint,
                            'chunks': len(plan), 'prepared': args.prepare_only,
                            'uploaded': args.upload, 'reused': False})
    print(json.dumps({'uids': args.end - args.start + 1, 'tracks': records}, ensure_ascii=False))


if __name__ == '__main__':
    main()
