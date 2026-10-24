"""Optional, sequential S3 transport for MP3s above Cloudflare REST's 300 MB cap.

Only transports verified bytes. The caller retains source/profile and public
readback gates. Credentials are read from the existing process environment.
"""
import io
import os
import re

REST_UPLOAD_MAX_BYTES = 300_000_000


def needs_s3(size):
    return size > REST_UPLOAD_MAX_BYTES


def upload_s3_bytes(data, storage, key):
    account, bucket = storage['account_id'], storage['bucket_name']
    if not re.fullmatch(r'[0-9a-f]{32}', account) or not re.fullmatch(r'[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]', bucket):
        raise ValueError('Invalid pinned R2 account/bucket')
    if not re.fullmatch(r'vi/(?:mn|dn|sn|an|kn)/[a-z0-9.-]+/[0-9a-f]{16}\.mp3', key) or '..' in key:
        raise ValueError('Invalid immutable narration object key')
    # Never fall back to unrelated AWS credentials or an environment-supplied endpoint.
    access_key = os.environ.get('R2_ACCESS_KEY_ID')
    secret_key = os.environ.get('R2_SECRET_ACCESS_KEY')
    if not access_key or not secret_key:
        raise RuntimeError('Large R2 upload requires R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY in the original .env; keep the verified MP3 and retry upload only.')
    try:
        import boto3
        from boto3.s3.transfer import TransferConfig
        from botocore.config import Config
    except ModuleNotFoundError:
        raise RuntimeError('S3 transport requires boto3 in the Python environment used for upload; keep the verified MP3, do not regenerate TTS.') from None
    try:
        client = boto3.client(
            's3', endpoint_url=f'https://{account}.r2.cloudflarestorage.com',
            aws_access_key_id=access_key, aws_secret_access_key=secret_key,
            aws_session_token=os.environ.get('R2_SESSION_TOKEN'), region_name='auto',
            config=Config(signature_version='s3v4', s3={'addressing_style': 'path'},
                          request_checksum_calculation='when_required', response_checksum_validation='when_required',
                          connect_timeout=30, read_timeout=120,
                          retries={'mode': 'standard', 'total_max_attempts': 3}),
        )
        transfer = TransferConfig(multipart_threshold=64 * 1024 * 1024,
                                  multipart_chunksize=16 * 1024 * 1024,
                                  max_concurrency=1, use_threads=False,
                                  preferred_transfer_client='classic')
        # Stream the exact already-hashed buffer, not a path that could change
        # between integrity validation and the SDK opening it.
        with io.BytesIO(data) as stream:
            client.upload_fileobj(stream, bucket, key, ExtraArgs={
                'ContentType': 'audio/mpeg', 'CacheControl': 'public, max-age=31536000, immutable',
            }, Config=transfer)
    except Exception as error:
        response = getattr(error, 'response', None)
        metadata = response.get('ResponseMetadata') if isinstance(response, dict) else None
        status = metadata.get('HTTPStatusCode') if isinstance(metadata, dict) else None
        status = status if isinstance(status, int) and 100 <= status <= 599 else None
        suffix = f', HTTP {status}' if status is not None else ''
        # SDK exceptions can contain request/credential details. Emit only type/status.
        raise RuntimeError(f'R2 S3 upload failed ({type(error).__name__}{suffix}); retain the verified MP3 and inspect transport before retrying.') from None
