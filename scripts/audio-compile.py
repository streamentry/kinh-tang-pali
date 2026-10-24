#!/usr/bin/env python3
"""Prepare or encode a local group export. No provider calls, uploads or registration writes."""
import argparse
import fcntl
import json
import subprocess
import tempfile
from pathlib import Path

from audio_compilation import POLICY, describe_parts, encode_part, json_hash, member_chunks, partition_members
from audio_pipeline import mp3_info, write_json
from narration_config import load_profile, profile_digest, profile_metadata

ROOT = Path(__file__).resolve().parent.parent


def context(args):
    return json.loads(subprocess.check_output([
        'node', '--import', 'tsx', 'scripts/audio-group-source.ts',
        '--collection', args.collection, '--group', args.group,
    ], cwd=ROOT))


def main(args):
    profile = load_profile()
    source = context(args)
    progress = json.loads((ROOT / 'content/audio/group-progress.json').read_text())
    if progress.get('schema_version') != 2:
        raise ValueError('Unexpected group progress schema')
    members = [member_chunks(ROOT, item, progress, profile) for item in source['texts']]
    parts = partition_members(members, args.max_minutes * 60 * profile['sample_rate_hz'])
    plan = {'schema_version': 1, 'assembly_policy': POLICY, 'collection': source['collection'],
            'group': source['group'], 'profile_sha256': profile_digest(profile),
            'max_minutes': args.max_minutes, 'timing_basis': 'pcm-frames',
            'review_status': 'pending', 'parts': describe_parts(parts, profile)}
    fingerprint = json_hash(plan)
    folder = ROOT / 'audio/compilations' / source['collection'] / source['group'] / fingerprint[:16]
    folder.mkdir(parents=True, exist_ok=True)
    write_json(folder / 'plan.json', plan)
    if not args.encode:
        print(json.dumps({'plan': str(folder / 'plan.json'), 'parts': len(parts),
                          'duration_seconds': sum(p['duration_seconds'] for p in plan['parts']),
                          'encoded': False}))
        return
    manifest_path = folder / 'manifest.json'
    if manifest_path.exists():
        existing = json.loads(manifest_path.read_text())
        if any(existing.get(key) != value for key, value in plan.items()) or existing.get('fingerprint') != fingerprint:
            raise ValueError('Existing export manifest drift; retain it for investigation')
        if any(existing.get(key) != value for key, value in profile_metadata(profile).items()):
            raise ValueError('Existing export profile metadata drift')
        artifacts = existing.get('artifacts', [])
        if len(artifacts) != len(parts):
            raise ValueError('Incomplete export manifest')
        for artifact, part in zip(artifacts, plan['parts']):
            filename = f'{part["id"]}.mp3'
            if artifact.get('id') != part['id'] or artifact.get('file') != filename:
                raise ValueError('Export part identity mismatch')
            integrity = mp3_info((folder / filename).read_bytes())
            if any(artifact.get(key) != value for key, value in integrity.items()):
                raise ValueError('Existing export file changed; retain it for investigation')
        print(json.dumps({'manifest': str(manifest_path), 'parts': len(parts), 'encoded': False, 'reused': True}))
        return
    artifacts = []
    for chunks, part in zip(parts, plan['parts']):
        target = folder / f'{part["id"]}.mp3'
        integrity = encode_part(chunks, target, profile)
        artifacts.append({'id': part['id'], 'file': target.name, **integrity})
    # A downgrade/source edit during a long export must prevent a completed manifest.
    if context(args) != source:
        raise ValueError('Source/registration changed during export; reverify before using it')
    current_progress = json.loads((ROOT / 'content/audio/group-progress.json').read_text())
    if current_progress.get('schema_version') != 2:
        raise ValueError('Unexpected group progress schema')
    # Other UIDs may finish while this group encodes. Revalidate every used asset
    # and its QC/source/profile gates without rejecting unrelated queue updates.
    current_members = [member_chunks(ROOT, item, current_progress, profile) for item in source['texts']]
    if current_members != members:
        raise ValueError('Group WAV assets changed during export; reverify before using it')
    write_json(manifest_path, {
        **plan, **profile_metadata(profile), 'fingerprint': fingerprint,
        'human_content_listening_completed': False, 'artifacts': artifacts,
        'mp3_chapter_alignment_verified': False,
    })
    print(json.dumps({'manifest': str(folder / 'manifest.json'), 'parts': len(parts), 'encoded': True}))


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--collection', required=True, choices=('sn', 'an', 'kn'))
    parser.add_argument('--group', required=True)
    parser.add_argument('--max-minutes', type=int, choices=range(20, 31), default=25)
    parser.add_argument('--encode', action='store_true', help='Encode local MP3s from existing WAVs (never calls TTS)')
    args = parser.parse_args()
    with open(Path(tempfile.gettempdir()) / 'kinh-tang-pali-compilation.lock', 'a') as lock:
        try:
            fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        except BlockingIOError:
            raise SystemExit('Another group compilation is running')
        main(args)
