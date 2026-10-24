import hashlib
import importlib.util
import io
import json
import os
import sys
import tempfile
import types
import unittest
from email.message import Message
from pathlib import Path
from unittest.mock import Mock, patch

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / 'scripts'))
from audio_s3 import REST_UPLOAD_MAX_BYTES, needs_s3, upload_s3_bytes
from narration_config import load_profile, profile_metadata

STORAGE = {'account_id': 'a' * 32, 'bucket_name': 'kinh-tang-pali-audio', 'public_base_url': 'https://pub-test.r2.dev'}
KEY = 'vi/sn/sn1.1/' + 'a' * 16 + '.mp3'


class Response(io.BytesIO):
    def __init__(self, data, content_type='application/json', status=200):
        super().__init__(data)
        self.headers = Message()
        self.headers['Content-Type'] = content_type
        self.status = status


class S3Tests(unittest.TestCase):
    def test_rest_boundary(self):
        self.assertFalse(needs_s3(REST_UPLOAD_MAX_BYTES))
        self.assertTrue(needs_s3(REST_UPLOAD_MAX_BYTES + 1))

    def sdk(self, upload):
        client = types.SimpleNamespace(upload_fileobj=upload)
        factory = Mock(return_value=client)
        config = lambda **kwargs: types.SimpleNamespace(**kwargs)
        return factory, {
            'boto3': types.SimpleNamespace(client=factory),
            'boto3.s3': types.SimpleNamespace(),
            'boto3.s3.transfer': types.SimpleNamespace(TransferConfig=config),
            'botocore': types.SimpleNamespace(),
            'botocore.config': types.SimpleNamespace(Config=config),
        }

    def test_verified_buffer_and_sequential_pinned_destination(self):
        captured = {}
        def upload(stream, bucket, key, **kwargs):
            captured.update(data=stream.read(), bucket=bucket, key=key, **kwargs)
        factory, modules = self.sdk(upload)
        with patch.dict(os.environ, {'R2_ACCESS_KEY_ID': 'test-id', 'R2_SECRET_ACCESS_KEY': 'test-secret',
                                     'R2_SESSION_TOKEN': 'test-session', 'AWS_ENDPOINT_URL': 'https://unrelated.invalid'}, clear=True), patch.dict(sys.modules, modules):
            upload_s3_bytes(b'verified audio buffer', STORAGE, KEY)
        self.assertEqual(captured['data'], b'verified audio buffer')
        self.assertEqual((captured['bucket'], captured['key']), (STORAGE['bucket_name'], KEY))
        config = captured['Config']
        self.assertEqual(config.max_concurrency, 1)
        self.assertFalse(config.use_threads)
        self.assertEqual(config.preferred_transfer_client, 'classic')
        self.assertEqual(config.multipart_chunksize, 16 * 1024 * 1024)
        self.assertEqual(captured['ExtraArgs']['ContentType'], 'audio/mpeg')
        args = factory.call_args.kwargs
        self.assertEqual(args['endpoint_url'], 'https://' + STORAGE['account_id'] + '.r2.cloudflarestorage.com')
        self.assertEqual(args['region_name'], 'auto')
        self.assertEqual(args['config'].retries['total_max_attempts'], 3)
        self.assertEqual(args['config'].request_checksum_calculation, 'when_required')

    def test_missing_r2_keys_never_uses_aws_default_credentials(self):
        factory, modules = self.sdk(Mock())
        with patch.dict(os.environ, {'AWS_ACCESS_KEY_ID': 'unrelated', 'AWS_SECRET_ACCESS_KEY': 'unrelated'}, clear=True), patch.dict(sys.modules, modules):
            with self.assertRaisesRegex(RuntimeError, 'R2_ACCESS_KEY_ID'):
                upload_s3_bytes(b'data', STORAGE, KEY)
        factory.assert_not_called()

    def test_reject_unpinned_destination_and_bad_key_before_sdk(self):
        factory, modules = self.sdk(Mock())
        with patch.dict(sys.modules, modules):
            for storage, key in [({**STORAGE, 'account_id': 'other.example'}, KEY),
                                 ({**STORAGE, 'bucket_name': '../other'}, KEY), (STORAGE, '../file.mp3')]:
                with self.assertRaises(ValueError):
                    upload_s3_bytes(b'data', storage, key)
        factory.assert_not_called()

    def test_sdk_errors_do_not_echo_secrets(self):
        error = RuntimeError('private-secret-value must not reach logs')
        error.response = {'ResponseMetadata': {'HTTPStatusCode': 403}}
        factory, modules = self.sdk(Mock(side_effect=error))
        with patch.dict(os.environ, {'R2_ACCESS_KEY_ID': 'test-id', 'R2_SECRET_ACCESS_KEY': 'test-secret'}, clear=True), patch.dict(sys.modules, modules):
            with self.assertRaises(RuntimeError) as caught:
                upload_s3_bytes(b'data', STORAGE, KEY)
        self.assertIn('HTTP 403', str(caught.exception))
        self.assertNotIn('private-secret-value', str(caught.exception))
        self.assertNotIn('test-secret', str(caught.exception))
        error.response = None
        with patch.dict(os.environ, {'R2_ACCESS_KEY_ID': 'test-id', 'R2_SECRET_ACCESS_KEY': 'test-secret'}, clear=True), patch.dict(sys.modules, modules):
            with self.assertRaisesRegex(RuntimeError, 'R2 S3 upload failed') as missing_response:
                upload_s3_bytes(b'data', STORAGE, KEY)
        self.assertNotIn('private-secret-value', str(missing_response.exception))

    def uploader_case(self, corrupt, corrupt_range=False):
        script = Path(__file__).resolve().parents[2] / 'scripts/audio-r2.py'
        spec = importlib.util.spec_from_file_location('s3_uploader_case', script)
        uploader = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(uploader)
        profile = load_profile()
        header = (0x7ff << 21) | (2 << 19) | (1 << 17) | (1 << 16) | (14 << 12) | (1 << 10) | (3 << 6)
        mp3 = (header.to_bytes(4, 'big') + b'\0' * 476) * 40
        sha = hashlib.sha256(mp3).hexdigest()
        source = {'uid': 'sn1.1', 'collection': 'sn', 'policy': 'title-scripture-v1', 'source_sha256': 'a' * 64}
        manifest = {**profile_metadata(profile), **{k: profile[k] for k in ('model', 'voice', 'style')},
                    'uid': 'sn1.1', 'collection': 'sn', 'source_sha256': source['source_sha256'],
                    'transcript_policy': 'title-scripture-v1', 'scripture_start_seconds': 0,
                    'sha256': sha, 'bytes': len(mp3), 'review_status': 'pending'}
        with tempfile.TemporaryDirectory() as d:
            root = Path(d)
            (root / 'source').mkdir()
            storage = {**STORAGE, 'provider': 'cloudflare-r2', 'bucket_id': 'bucket-id'}
            (root / 'source/audio-storage.json').write_text(json.dumps(storage))
            (root / 'manifest.json').write_text(json.dumps(manifest))
            (root / 'sn1.1.mp3').write_bytes(mp3)
            writes = []
            def response(request, **kwargs):
                url = request.full_url
                if request.get_method() == 'PUT':
                    self.fail('Explicit S3 transport must never fall back to REST PUT')
                if url.startswith(STORAGE['public_base_url']):
                    if request.get_header('Range'):
                        return Response(mp3[:1024], 'audio/mpeg', 200 if corrupt_range else 206)
                    return Response(b'corrupted' if corrupt else mp3, 'audio/mpeg')
                result = {'enabled': True, 'domain': 'pub-test.r2.dev', 'bucketId': 'bucket-id'} if url.endswith('/domains/managed') else {'id': 'bucket-id'}
                return Response(json.dumps({'success': True, 'result': result}).encode())
            with patch.object(uploader, 'ROOT', root), patch.object(uploader, 'load_env'), \
                    patch.object(uploader, 'require_current_group_source'), patch.object(uploader, 'update') as progress, \
                    patch.object(uploader, 'upload_s3_bytes', side_effect=lambda data, storage, key: writes.append((data, key))), \
                    patch('subprocess.check_output', return_value=json.dumps(source).encode()), \
                    patch('urllib.request.urlopen', side_effect=response), \
                    patch.dict(os.environ, {'CLOUDFLARE_API_TOKEN': 'test-token', 'CLOUDFLARE_ACCOUNT_ID': STORAGE['account_id']}, clear=True), \
                    patch('sys.argv', ['audio-r2.py', str(root), '--s3']):
                if corrupt or corrupt_range:
                    message = 'Public R2 hash mismatch' if corrupt else 'Public range readback failed'
                    with self.assertRaisesRegex(RuntimeError, message):
                        uploader.main()
                    self.assertFalse((root / 'content/audio/sn1.1.json').exists())
                    progress.assert_not_called()
                else:
                    uploader.main()
                    registration = json.loads((root / 'content/audio/sn1.1.json').read_text())
                    self.assertEqual(registration['upload_transport'], 'cloudflare-s3')
                    self.assertEqual(registration['sha256'], sha)
                    self.assertTrue(registration['public_range_verified'])
                    self.assertEqual(registration['review_status'], 'pending')
                    self.assertEqual(progress.call_args.args, ('sn1.1', 'generated'))
            self.assertEqual(writes, [(mp3, 'vi/sn/sn1.1/' + sha[:16] + '.mp3')])

    def test_registration_after_s3_requires_public_hash_and_range(self):
        self.uploader_case(False)

    def test_corrupt_public_s3_readback_cannot_register_player(self):
        self.uploader_case(True)

    def test_non_range_s3_response_cannot_register_seekable_player(self):
        self.uploader_case(False, corrupt_range=True)

    @unittest.skipUnless(importlib.util.find_spec('boto3'), 'optional S3 SDK not installed')
    def test_installed_sdk_multipart_lifecycle_without_network(self):
        import boto3
        from boto3.s3.transfer import TransferConfig
        from botocore.config import Config
        from botocore.stub import Stubber, ANY
        config = Config(signature_version='s3v4', s3={'addressing_style': 'path'},
                        request_checksum_calculation='when_required', response_checksum_validation='when_required')
        client = boto3.client('s3', endpoint_url='https://' + STORAGE['account_id'] + '.r2.cloudflarestorage.com',
                              aws_access_key_id='test-id', aws_secret_access_key='test-secret', region_name='auto', config=config)
        self.addCleanup(client.close)
        common = {'Bucket': STORAGE['bucket_name'], 'Key': KEY}
        with Stubber(client) as stub:
            stub.add_response('create_multipart_upload', {'UploadId': 'test-upload'},
                              {**common, 'ContentType': 'audio/mpeg', 'CacheControl': 'public, max-age=31536000, immutable'})
            for n in (1, 2):
                stub.add_response('upload_part', {'ETag': f'"part-{n}"'},
                                  {**common, 'UploadId': 'test-upload', 'PartNumber': n, 'Body': ANY})
            stub.add_response('complete_multipart_upload', {'ETag': '"joined"'}, {
                **common, 'UploadId': 'test-upload', 'MultipartUpload': {'Parts': [
                    {'ETag': '"part-1"', 'PartNumber': 1}, {'ETag': '"part-2"', 'PartNumber': 2},
                ]},
            })
            def reduced_threshold(**kwargs):
                kwargs.update(multipart_threshold=5 * 1024 * 1024, multipart_chunksize=5 * 1024 * 1024)
                return TransferConfig(**kwargs)
            with patch.dict(os.environ, {'R2_ACCESS_KEY_ID': 'test-id', 'R2_SECRET_ACCESS_KEY': 'test-secret'}, clear=True), \
                    patch('boto3.client', return_value=client), \
                    patch('boto3.s3.transfer.TransferConfig', side_effect=reduced_threshold):
                upload_s3_bytes(b'x' * (6 * 1024 * 1024), STORAGE, KEY)
            stub.assert_no_pending_responses()


if __name__ == '__main__':
    unittest.main()
