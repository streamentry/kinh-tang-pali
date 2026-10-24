"""Synthetic PCM tests run by npm test; no credentials, network or encoder required."""
import copy
import argparse
import importlib.util
import io
import json
import sys
import tempfile
import unittest
import wave
from contextlib import redirect_stdout
from pathlib import Path
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / 'scripts'))
from audio_compilation import describe_parts, json_hash, member_chunks, partition_members, pcm_blocks
from audio_pipeline import digest, mp3_info, plan_source, wav_info
from narration_config import load_profile, profile_digest, profile_metadata


class CompilationTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.profile = load_profile()
        self.source = {'uid': 'sn1.1', 'collection': 'sn', 'title': 'Tên bài', 'policy': 'title-scripture-v1',
                       'source_sha256': 'a' * 64, 'summary': '', 'segments': [['sn1.1:1.1', 'Kinh văn.']]}
        self.plan = plan_source(self.source, self.profile)
        fingerprint = json_hash([self.source['source_sha256'], profile_digest(self.profile), self.plan])
        self.folder = self.root / 'audio/sn1.1' / fingerprint[:16]
        self.folder.mkdir(parents=True)
        records = {}
        for i, chunk in enumerate(self.plan):
            file = self.folder / f'{i:03}.wav'
            with wave.open(str(file), 'wb') as writer:
                writer.setnchannels(1)
                writer.setsampwidth(2)
                writer.setframerate(24000)
                writer.writeframes(bytes((i + 1, 0)) * 2400)
            records[str(i)] = {**chunk, **wav_info(file, self.profile)}
        # Synthetic MPEG framing, not speech: no encoder needed to test cache gates.
        header = (0x7ff << 21) | (2 << 19) | (1 << 17) | (1 << 16) | (14 << 12) | (1 << 10) | (3 << 6)
        mp3 = (header.to_bytes(4, 'big') + b'\0' * 476) * 40
        integrity = mp3_info(mp3)
        (self.folder / 'sn1.1.mp3').write_bytes(mp3)
        self.manifest = {
            'uid': 'sn1.1', 'collection': 'sn', 'source_sha256': self.source['source_sha256'],
            **profile_metadata(self.profile), **{k: self.profile[k] for k in ('model', 'voice', 'style')},
            'transcript_policy': 'title-scripture-v1', 'scripture_start_seconds': 0,
            'summary_chunk_count': 0, 'chunk_count': len(self.plan), 'chunk_plan_sha256': json_hash(self.plan),
            'duration_seconds': 0.9, 'sha256': integrity['sha256'], 'bytes': len(mp3),
        }
        for name, data in [('source.json', self.source), ('plan.json', self.plan),
                           ('checkpoint.json', {'fingerprint': fingerprint, 'chunks': records}),
                           ('manifest.json', self.manifest)]:
            self.write(name, data)
        self.item = {'source': self.source, 'audio': copy.deepcopy(self.manifest)}
        self.progress = {'texts': {'sn1.1': {
            'status': 'live', 'upload_verified': True, 'public_range_verified': True, 'errors': [],
            'source_sha256': self.source['source_sha256'], 'profile_sha256': profile_digest(self.profile),
            'sha256': integrity['sha256'], 'bytes': len(mp3),
            'checkpoint': str(self.folder.relative_to(self.root)),
        }}}

    def write(self, name, data):
        (self.folder / name).write_text(json.dumps(data, ensure_ascii=False))

    def chunks(self, item=None, progress=None):
        return member_chunks(self.root, item or self.item, progress or self.progress, self.profile)

    def test_exact_pcm_with_approved_pauses(self):
        chunks = self.chunks()
        pcm = b''.join(pcm_blocks(chunks, self.profile))
        self.assertEqual(pcm, b'\1\0' * 2400 + b'\0\0' * 8400 + b'\2\0' * 2400 + b'\0\0' * 8400)
        chapters = describe_parts([chunks], self.profile)[0]
        self.assertEqual(chapters['frames'], len(pcm) // 2)
        self.assertEqual(chapters['chapters'][0]['end_frame'], 21600)
        self.assertEqual(chapters['chapters'][0]['start_frame'], 0)
        self.assertFalse(chapters['chapters'][0]['continuation'])
        self.assertNotIn('path', chapters['chunks'][0])

    def test_reject_changed_source_registration_and_unresolved_qc(self):
        for field, value in [('status', 'blocked'), ('errors', ['keep reported loop']),
                             ('profile_sha256', 'bad'), ('source_sha256', 'bad'),
                             ('upload_verified', False), ('public_range_verified', False), ('sha256', 'bad')]:
            progress = copy.deepcopy(self.progress)
            progress['texts']['sn1.1'][field] = value
            with self.subTest(field=field), self.assertRaises((ValueError, RuntimeError)):
                self.chunks(progress=progress)
        item = copy.deepcopy(self.item)
        item['source']['title'] = 'Changed title'
        with self.assertRaises(ValueError):
            self.chunks(item=item)
        item = copy.deepcopy(self.item)
        item['audio']['voice'] = 'unapproved'
        with self.assertRaises(RuntimeError):
            self.chunks(item=item)

    def test_reject_corrupt_or_changed_wav(self):
        chunks = self.chunks()
        file = chunks[0]['path']
        file.write_bytes(file.read_bytes()[:-10])
        with self.assertRaises(ValueError):
            self.chunks()
        with self.assertRaises(ValueError):
            b''.join(pcm_blocks(chunks, self.profile))

    def test_reject_incorrect_checkpoint_plan_and_foreign_cache(self):
        plan = copy.deepcopy(self.plan)
        plan[1]['text'] += 'Added words'
        self.write('plan.json', plan)
        with self.assertRaises(ValueError):
            self.chunks()
        self.write('plan.json', self.plan)
        progress = copy.deepcopy(self.progress)
        progress['texts']['sn1.1']['checkpoint'] = '../foreign-cache'
        with self.assertRaises(ValueError):
            self.chunks(progress=progress)

    def test_reject_mp3_replacement(self):
        file = self.folder / 'sn1.1.mp3'
        data = bytearray(file.read_bytes())
        data[20] = 1
        file.write_bytes(data)
        with self.assertRaises(ValueError):
            self.chunks()

    def compile_with_queue_change(self, change):
        script = Path(__file__).resolve().parents[2] / 'scripts/audio-compile.py'
        spec = importlib.util.spec_from_file_location('compile_transaction', script)
        compiler = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(compiler)
        queue = self.root / 'content/audio/group-progress.json'
        queue.parent.mkdir(parents=True)
        queue.write_text(json.dumps({'schema_version': 2, **self.progress}))
        source = {'collection': 'sn', 'group': 'fixture', 'texts': [self.item]}

        def encode(chunks, target, profile):
            current = json.loads(queue.read_text())
            change(current)
            queue.write_text(json.dumps(current))
            target.write_bytes((self.folder / 'sn1.1.mp3').read_bytes())
            return mp3_info(target.read_bytes())

        with patch.object(compiler, 'ROOT', self.root), patch.object(compiler, 'context', return_value=source), \
                patch.object(compiler, 'encode_part', side_effect=encode), redirect_stdout(io.StringIO()):
            compiler.main(argparse.Namespace(collection='sn', group='fixture', max_minutes=25, encode=True))

    def test_unrelated_generation_during_export_preserves_valid_compilation(self):
        self.compile_with_queue_change(lambda queue: queue['texts'].update({'sn1.2': {'status': 'generating'}}))
        manifests = list((self.root / 'audio/compilations').rglob('manifest.json'))
        self.assertEqual(len(manifests), 1)
        self.assertEqual(json.loads(manifests[0].read_text())['review_status'], 'pending')

    def test_member_qc_block_during_export_still_prevents_manifest(self):
        def block(queue):
            queue['texts']['sn1.1'].update(status='blocked', errors=['Keep this QC report'])
        with self.assertRaisesRegex(ValueError, 'unresolved'):
            self.compile_with_queue_change(block)
        self.assertFalse(list((self.root / 'audio/compilations').rglob('manifest.json')))

    def test_partition_keeps_texts_whole_then_splits_long_text_at_known_boundary(self):
        def c(uid, frames):
            return {'uid': uid, 'title': uid, 'speech_frames': frames, 'pause_frames': 0}
        members = [[c('first', 40)], [c('long', 60), c('long', 60), c('long', 30)], [c('last', 10)]]
        parts = partition_members(members, 100)
        self.assertEqual([sum(c['speech_frames'] for c in p) for p in parts], [40, 60, 100])
        self.assertEqual([c for p in parts for c in p], [c for m in members for c in m])
        described = describe_parts(parts, {'sample_rate_hz': 10})
        self.assertTrue(described[2]['chapters'][0]['continuation'])
        self.assertEqual(described[2]['chapters'][1]['start_frame'], 90)
        self.assertEqual(described[2]['group_start_frame'], 100)
        self.assertEqual(partition_members([[c('a', 40)], [c('b', 60)]], 100)[0][-1]['uid'], 'b')
        for invalid in (0, -1, 0.5):
            with self.assertRaises(ValueError):
                partition_members(members, invalid)
        with self.assertRaises(ValueError):
            partition_members([[c('long', 101)]], 100)


if __name__ == '__main__':
    unittest.main()
