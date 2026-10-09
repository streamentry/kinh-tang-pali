"""Single, editor-approved narration profile. No environment or CLI overrides."""
import hashlib
import json
from pathlib import Path

PROFILE_PATH = Path(__file__).resolve().parent.parent / 'source/narration-profile.json'
# Change this pin only after the editor approves a new voice/pace sample.
APPROVED_PROFILE_SHA256 = 'a384c5852585077c32e1348a6ada5cfc70a69c989ad705b8b5129fef3e1c9a71'

def profile_digest(profile):
    return hashlib.sha256(json.dumps(profile, ensure_ascii=False, sort_keys=True,
                                    separators=(',', ':')).encode()).hexdigest()

def load_profile():
    profile = json.loads(PROFILE_PATH.read_text())
    if profile_digest(profile) != APPROVED_PROFILE_SHA256:
        raise RuntimeError('Narration profile differs from the editor-approved MN1 voice/pace. Obtain approval for a new sample before changing the pin.')
    return profile

def profile_metadata(profile):
    return {'narration_profile_id': profile['id'],
            'narration_profile_sha256': profile_digest(profile),
            'narration_profile': profile}

def assert_profile_metadata(manifest, profile):
    expected = {**profile_metadata(profile), **{key: profile[key] for key in ('model', 'voice', 'style')}}
    if any(manifest.get(key) != value for key, value in expected.items()):
        raise RuntimeError('Audio manifest does not match the approved narration profile; refusing upload.')
