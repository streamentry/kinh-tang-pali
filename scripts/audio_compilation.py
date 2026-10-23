"""Offline group exports from validated PCM, retaining exact frame boundaries.

This module never reads credentials, calls TTS, uploads or changes registrations.
"""
import json
import math
import wave
from pathlib import Path

from audio_pipeline import cached_chunk_valid, digest, mp3_info, plan_source, subdivide_repair_chunks
from narration_config import assert_profile_metadata, profile_digest

POLICY = 'group-wav-v1'


def json_hash(value):
    return digest(json.dumps(value, ensure_ascii=False, sort_keys=True).encode())


def member_chunks(root, item, progress, profile):
    """Validate the entire reading asset before admitting its WAV cache."""
    source, registration = item['source'], item['audio']
    uid = source['uid']
    row = progress['texts'].get(uid, {})
    if (row.get('status') not in ('uploaded-verified', 'merged', 'live') or row.get('errors')
            or not row.get('upload_verified') or not row.get('public_range_verified')
            or row.get('source_sha256') != source['source_sha256']
            or row.get('profile_sha256') != profile_digest(profile)
            or row.get('sha256') != registration.get('sha256')):
        raise ValueError(f'{uid}: missing verified upload or unresolved source/profile/QC drift')
    folder = (root / row['checkpoint']).resolve()
    cache_root = (root / 'audio' / uid).resolve()
    if (not folder.is_relative_to(cache_root) or folder == cache_root
            or not cache_root.is_relative_to(root.resolve()) or not folder.is_relative_to(root.resolve())):
        raise ValueError(f'{uid}: cache directory must belong to this UID')
    read = lambda name: json.loads((folder / name).read_text())
    manifest, checkpoint, saved_source = read('manifest.json'), read('checkpoint.json'), read('source.json')
    assert_profile_metadata(manifest, profile)
    assert_profile_metadata(registration, profile)
    if saved_source != source or manifest.get('source_sha256') != source['source_sha256']:
        raise ValueError(f'{uid}: cache source differs from current canonical source')
    if (manifest.get('uid') != uid or manifest.get('collection') != source['collection']
            or manifest.get('transcript_policy') != 'title-scripture-v1'
            or manifest.get('scripture_start_seconds') != 0 or manifest.get('summary_chunk_count') != 0):
        raise ValueError(f'{uid}: incompatible narration identity/policy')
    planned = plan_source(source, profile)
    repair = manifest.get('chunk_repair')
    if repair:
        if repair.get('standard_plan_fingerprint') != json_hash([source['source_sha256'], profile_digest(profile), planned]):
            raise ValueError(f'{uid}: invalid repair provenance')
        planned = subdivide_repair_chunks(planned, repair['standard_chunk_indices'], profile)
    fingerprint = json_hash([source['source_sha256'], profile_digest(profile), planned])
    if (read('plan.json') != planned or checkpoint.get('fingerprint') != fingerprint
            or folder.name != fingerprint[:16] or manifest.get('chunk_plan_sha256') != json_hash(planned)
            or manifest.get('chunk_count') != len(planned)
            or set(checkpoint.get('chunks', {})) != {str(i) for i in range(len(planned))}):
        raise ValueError(f'{uid}: cache plan/checkpoint drift')
    integrity = mp3_info((folder / f'{uid}.mp3').read_bytes())
    for artifact in (manifest, registration, row):
        if artifact.get('sha256') != integrity['sha256'] or artifact.get('bytes') != integrity['bytes']:
            raise ValueError(f'{uid}: MP3 differs from registered artifact')
    chunks = []
    for index, planned_chunk in enumerate(planned):
        path = folder / f'{index:03}.wav'
        record = checkpoint['chunks'][str(index)]
        if path.is_symlink() or not cached_chunk_valid(path, record, planned_chunk, profile):
            raise ValueError(f'{uid}: invalid WAV chunk {index}')
        pause = planned_chunk.get('pause_after_seconds', profile['chunk_pause_seconds'])
        if not math.isfinite(pause) or pause < 0:
            raise ValueError(f'{uid}: invalid pause')
        chunks.append({
            'uid': uid, 'title': source['title'], 'source_sha256': source['source_sha256'],
            'reading_audio_sha256': integrity['sha256'], 'chunk_index': index,
            'text_sha256': planned_chunk['text_sha256'], 'wav_sha256': record['wav_sha256'],
            'speech_frames': record['frames'], 'pause_frames': int(profile['sample_rate_hz'] * pause),
            'path': path,
        })
    seconds = sum(c['speech_frames'] + c['pause_frames'] for c in chunks) / profile['sample_rate_hz']
    if (abs(seconds - manifest['duration_seconds']) > 1e-6
            or abs(seconds - registration['duration_seconds']) > 1e-6
            or abs(integrity['duration_seconds'] - seconds) > 0.2):
        raise ValueError(f'{uid}: WAV/MP3 duration mismatch')
    return chunks


def chunk_frames(chunk):
    return chunk['speech_frames'] + chunk['pause_frames']


def partition_members(members, max_frames):
    """Keep a reading whole when it fits; split long readings only at WAV boundaries."""
    if not isinstance(max_frames, int) or max_frames <= 0 or not members:
        raise ValueError('A positive frame budget and nonempty members are required')
    parts, current, used = [], [], 0
    for chunks in members:
        if not chunks:
            raise ValueError('Empty reading cache')
        if any(chunk_frames(c) <= 0 or chunk_frames(c) > max_frames for c in chunks):
            raise ValueError('A WAV request exceeds the export budget; never split unaligned speech')
        size = sum(map(chunk_frames, chunks))
        if current and (size > max_frames or used + size > max_frames):
            parts.append(current)
            current, used = [], 0
        for chunk in chunks:
            size = chunk_frames(chunk)
            if used + size > max_frames:
                parts.append(current)
                current, used = [], 0
            current.append(chunk)
            used += size
    if current:
        parts.append(current)
    return parts


def describe_parts(parts, profile):
    """All chapter offsets describe PCM frames, never guessed within-request timings."""
    described, global_frame = [], 0
    seen = set()
    rate = profile['sample_rate_hz']
    for index, chunks in enumerate(parts):
        chapters, frame = [], 0
        for chunk in chunks:
            end = frame + chunk_frames(chunk)
            if not chapters or chapters[-1]['uid'] != chunk['uid']:
                chapters.append({'uid': chunk['uid'], 'title': chunk['title'],
                                 'continuation': chunk['uid'] in seen,
                                 'start_frame': frame, 'end_frame': end,
                                 'start_seconds': frame / rate, 'end_seconds': end / rate})
                seen.add(chunk['uid'])
            else:
                chapters[-1].update(end_frame=end, end_seconds=end / rate)
            frame = end
        described.append({'id': f'part-{index + 1:03}', 'frames': frame,
                          'group_start_frame': global_frame, 'duration_seconds': frame / rate,
                          'chapters': chapters,
                          'chunks': [{k: v for k, v in c.items() if k != 'path'} for c in chunks]})
        global_frame += frame
    return described


def pcm_blocks(chunks, profile):
    """Stream original PCM plus exactly the existing approved pauses; no MP3 concatenation."""
    frame_bytes = profile['channels'] * profile['sample_width_bytes']
    for chunk in chunks:
        # Recheck hashes immediately before streaming in case the cache changed.
        if digest(chunk['path'].read_bytes()) != chunk['wav_sha256']:
            raise ValueError('WAV changed during export')
        with wave.open(str(chunk['path']), 'rb') as reader:
            if (reader.getnframes(), reader.getframerate(), reader.getnchannels(), reader.getsampwidth()) != (
                    chunk['speech_frames'], profile['sample_rate_hz'], profile['channels'], profile['sample_width_bytes']):
                raise ValueError('WAV format changed during export')
            while block := reader.readframes(24000):
                yield block
        remaining = chunk['pause_frames']
        while remaining:
            count = min(remaining, 24000)
            yield b'\0' * (count * frame_bytes)
            remaining -= count


def encode_part(chunks, target, profile):
    import lameenc  # Only encoding needs the installed encoder, never the dry run.
    encoder = lameenc.Encoder()
    encoder.set_bit_rate(profile['mp3_bitrate_kbps'])
    encoder.set_in_sample_rate(profile['sample_rate_hz'])
    encoder.set_channels(profile['channels'])
    encoder.set_quality(profile['encoder_quality'])
    temporary = target.with_suffix('.tmp')
    try:
        with temporary.open('wb') as output:
            for block in pcm_blocks(chunks, profile):
                output.write(encoder.encode(block))
            output.write(encoder.flush())
        integrity = mp3_info(temporary.read_bytes())
        seconds = sum(map(chunk_frames, chunks)) / profile['sample_rate_hz']
        if abs(integrity['duration_seconds'] - seconds) > 0.2:
            raise ValueError('Compiled MP3/PCM duration mismatch')
        if target.exists():
            if target.read_bytes() != temporary.read_bytes():
                raise ValueError('Existing export differs; retain it for investigation instead of overwriting')
        else:
            temporary.replace(target)
        return integrity
    finally:
        temporary.unlink(missing_ok=True)
