"""Bound long reading assets without new speech requests or canonical UID changes."""
import json
from pathlib import Path
from audio_pipeline import cached_chunk_valid, digest, mp3_info, plan_source, subdivide_repair_chunks, write_json
from audio_compilation import partition_members, encode_part, json_hash, chunk_frames
from narration_config import assert_profile_metadata, profile_digest

POLICY = 'reading-parts-v1'
MAX_SECONDS = 1800


def reading_chunks(folder, source, profile, manifest):
    """Admit only the original, verified source/plan/checkpoint and every WAV once."""
    read = lambda name: json.loads((folder / name).read_text())
    assert_profile_metadata(manifest, profile)
    if read('source.json') != source or manifest['uid'] != source['uid'] or manifest['source_sha256'] != source['source_sha256']:
        raise ValueError('Reading source differs from cached narration')
    plan = plan_source(source, profile)
    repair = manifest.get('chunk_repair')
    if repair:
        if repair['standard_plan_fingerprint'] != json_hash([source['source_sha256'], profile_digest(profile), plan]):
            raise ValueError('Reading repair provenance differs')
        plan = subdivide_repair_chunks(plan, repair['standard_chunk_indices'], profile)
    checkpoint = read('checkpoint.json')
    fingerprint = json_hash([source['source_sha256'], profile_digest(profile), plan])
    if (folder.name != fingerprint[:16] or checkpoint.get('fingerprint') != fingerprint
            or read('plan.json') != plan or manifest.get('chunk_plan_sha256') != json_hash(plan)
            or manifest.get('chunk_count') != len(plan)
            or set(checkpoint.get('chunks', {})) != {str(i) for i in range(len(plan))}):
        raise ValueError('Reading checkpoint/plan differs')
    summary_count = sum(item['section'] == 'summary' for item in plan)
    if manifest.get('summary_chunk_count') != summary_count:
        raise ValueError('Reading summary accounting differs')
    chunks = []
    for index, item in enumerate(plan):
        path = folder / f'{index:03}.wav'
        record = checkpoint['chunks'][str(index)]
        if path.is_symlink() or not cached_chunk_valid(path, record, item, profile):
            raise ValueError(f'Invalid reading WAV {index}')
        chunks.append({'path': path, 'wav_sha256': record['wav_sha256'],
                       'speech_frames': record['frames'],
                       'pause_frames': int(profile['sample_rate_hz'] * (profile['summary_to_scripture_pause_seconds'] if index == summary_count - 1 else item.get('pause_after_seconds', profile['chunk_pause_seconds']))),
                       'chunk_index': index, 'text_sha256': item['text_sha256']})
    if abs(sum(map(chunk_frames, chunks)) / profile['sample_rate_hz'] - manifest['duration_seconds']) > 1e-6:
        raise ValueError('Reading WAV duration differs')
    return chunks


def package_reading(folder, source, profile, max_seconds=MAX_SECONDS):
    """Return upload assets; preserve the single-file manifest for short readings.

    max_seconds exists for offline tests; production uploader uses MAX_SECONDS only.
    Parent sha256 hashes ordered part hashes plus trailing newlines, not the first URL.
    """
    manifest = json.loads((folder / 'manifest.json').read_text())
    assert_profile_metadata(manifest, profile)
    full_path = folder / f'{source["uid"]}.mp3'
    integrity = mp3_info(full_path.read_bytes())
    if any(manifest.get(k) != integrity[k] for k in ('sha256', 'bytes')):
        raise ValueError('Original MP3 integrity differs')
    if abs(integrity['duration_seconds'] - manifest['duration_seconds']) > .2:
        raise ValueError('Original MP3/PCM duration differs')
    if integrity['duration_seconds'] <= max_seconds:
        return manifest, [{'path': str(full_path), **integrity}]
    if max_seconds < 1 or max_seconds > MAX_SECONDS:
        raise ValueError('Invalid reading part budget')
    chunks = reading_chunks(folder, source, profile, manifest)
    # Reserve the verified encoder padding bound so encoded files stay <= budget.
    groups = partition_members([chunks], int((max_seconds - .2) * profile['sample_rate_hz']))
    folder_out = folder / POLICY / str(max_seconds)
    folder_out.mkdir(parents=True, exist_ok=True)
    parts = []
    for index, group in enumerate(groups):
        target = folder_out / f'part-{index + 1:03}.mp3'
        info = encode_part(group, target, profile)
        if info['duration_seconds'] > max_seconds or info['bytes'] > 40_000_000:
            raise ValueError('Reading part exceeds bounded file budget')
        parts.append({'id': f'part-{index + 1:03}', 'path': str(target), **info,
                      'pcm_duration_seconds': sum(map(chunk_frames, group)) / profile['sample_rate_hz'],
                      'first_chunk': group[0]['chunk_index'], 'last_chunk': group[-1]['chunk_index']})
    if [i for p in parts for i in range(p['first_chunk'], p['last_chunk'] + 1)] != list(range(len(chunks))):
        raise ValueError('Reading chunks omitted or repeated')
    public_parts = [{k: v for k, v in p.items() if k != 'path'} for p in parts]
    result = {**manifest, 'asset_kind': POLICY, 'checksum_scope': 'ordered-part-sha256-lines',
              'source_mp3': {k: manifest[k] for k in ('sha256', 'bytes', 'duration_seconds')},
              'pcm_duration_seconds': manifest['duration_seconds'],
              'duration_seconds': sum(p['duration_seconds'] for p in parts),
              'bytes': sum(p['bytes'] for p in parts),
              'sha256': digest(''.join(p['sha256'] + '\n' for p in parts).encode()),
              'parts': public_parts}
    result.pop('mp3_integrity', None)  # A reading assembly is not a single MPEG file.
    write_json(folder_out / 'manifest.json', result)
    return result, parts


if __name__ == '__main__':
    import argparse, subprocess
    from narration_config import load_profile
    parser = argparse.ArgumentParser()
    parser.add_argument('folder', type=Path)
    args = parser.parse_args()
    root = Path(__file__).resolve().parent.parent
    saved = json.loads((args.folder / 'source.json').read_text())
    source = json.loads(subprocess.check_output(['node', '--import', 'tsx', 'scripts/audio-source.ts', saved['uid']], cwd=root))
    manifest, assets = package_reading(args.folder, source, load_profile())
    print(json.dumps({'manifest': manifest, 'assets': assets}))
