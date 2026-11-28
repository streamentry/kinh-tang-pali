#!/usr/bin/env python3
"""Serial local English TTS production; R2 release is a separate gate."""
import argparse
import base64
import fcntl
import hashlib
import http.client
import json
import math
import os
import shutil
import subprocess
import tempfile
import time
import urllib.error
import urllib.request
import wave
from datetime import datetime, timezone
from pathlib import Path

from audio_pipeline import cached_chunk_valid, digest, mp3_info, split_text, wav_info, write_json

ROOT = Path(__file__).resolve().parent.parent
PROFILE_PATH = ROOT / "source/english-narration-profile.json"
AUTH_PATH = ROOT / "source/english-audio-generation-authorization.json"
SOURCE_MAP_PATH = ROOT / "docs/audio-english-source-rights-map-20261127.json"
SOURCE_SCRIPT = ROOT / "scripts/audio-english-source.ts"
STATE_PATH = ROOT / "audio/english-generation-state.json"
TTS_LOCK_PATH = Path(tempfile.gettempdir()) / "kinh-tang-pali-tts.lock"
API_URL = "https://generativelanguage.googleapis.com/v1beta/interactions"
AUDIO_TOKENS_PER_SECOND = 25


def compact_hash(value):
    encoded = json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":")).encode("utf-8")
    return hashlib.sha256(encoded).hexdigest()


def load_env():
    env_path = Path(os.environ.get("NARRATION_ENV_FILE", "/Volumes/SSD/kinh-tang-pali/.env"))
    if not env_path.is_file():
        return
    for line in env_path.read_text().splitlines():
        if "=" in line and not line.lstrip().startswith("#"):
            key, value = line.split("=", 1)
            os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


def pricing_for_now():
    now = datetime.now(timezone.utc).date()
    if now >= datetime(2027, 1, 1, tzinfo=timezone.utc).date():
        return 1.0, 18.0
    return 0.5, 9.0


def estimate_chunk_cost(text, profile, padded=True):
    input_price, audio_price = pricing_for_now()
    words = len(text.split())
    # The approved English previews averaged about 120 words per minute. Use
    # that measured pace, plus a small reserve, so the local cap fails closed.
    expected_seconds = max(1.0, words * 0.5)
    if padded:
        expected_seconds *= 1.03
    estimated_input_tokens = max(1, math.ceil(len(text) / 3))
    return (
        expected_seconds * AUDIO_TOKENS_PER_SECOND * audio_price
        + estimated_input_tokens * input_price
    ) / 1_000_000


def estimate_actual_cost(text, duration_seconds):
    input_price, audio_price = pricing_for_now()
    input_tokens = max(1, math.ceil(len(text) / 3))
    output_tokens = duration_seconds * AUDIO_TOKENS_PER_SECOND
    return (input_tokens * input_price + output_tokens * audio_price) / 1_000_000


def load_profile_and_authorization():
    profile = json.loads(PROFILE_PATH.read_text())
    authorization = json.loads(AUTH_PATH.read_text())
    profile_sha256 = compact_hash(profile)
    if authorization.get("status") != "approved-for-local-tts-generation":
        raise RuntimeError("English local TTS authorization is not approved")
    if authorization.get("ai_derived_tts_allowed") is not True:
        raise RuntimeError("Editor authorization for AI-derived TTS is missing")
    if authorization.get("profile", {}).get("sha256") != profile_sha256:
        raise RuntimeError("English narration profile hash differs from the authorized profile")
    if profile.get("id") != authorization.get("profile", {}).get("id"):
        raise RuntimeError("English narration profile ID differs from authorization")
    provider = authorization.get("provider_use", {})
    if provider.get("provider") != "Google Gemini API" or provider.get("model") != profile.get("model"):
        raise RuntimeError("English TTS provider/model differs from the generation authorization")
    if provider.get("billing_tier") != "standard-paid":
        raise RuntimeError("English TTS generation is authorized only against the Standard Paid pricing basis")
    if authorization.get("cost_ceiling", {}).get("includes_r2") is not False:
        raise RuntimeError("The TTS-only cost authorization must keep R2 costs separate")
    if authorization.get("release", {}).get("public_distribution_approved") is True:
        raise RuntimeError("This generator is local-only; use the separate release gate for uploads")
    if authorization.get("cost_ceiling", {}).get("max_usd") != 400:
        raise RuntimeError("English TTS cost cap is missing or unexpected")
    return profile, authorization, profile_sha256


def load_scope(authorization):
    source_map_bytes = SOURCE_MAP_PATH.read_bytes()
    source_map_sha = hashlib.sha256(source_map_bytes).hexdigest()
    scope = authorization["scope"]
    if scope.get("source_map_path") != "docs/audio-english-source-rights-map-20261127.json":
        raise RuntimeError("English source map path differs from generation authorization")
    if source_map_sha != scope["source_map_sha256"]:
        raise RuntimeError("Pinned English source map changed; stop and re-authorize")
    source_map = json.loads(source_map_bytes)
    if source_map.get("source_commit") != scope["source_commit"]:
        raise RuntimeError("Pinned English source map commit differs from authorization")
    rows = source_map.get("uid_source_map")
    if not isinstance(rows, list):
        raise RuntimeError("English source map UID records are malformed")
    pairs = sorted([[row["uid"], row["source_sha256"]] for row in rows])
    pair_sha = compact_hash(pairs)
    uid_sha = hashlib.sha256("\n".join(uid for uid, _ in pairs).encode("utf-8")).hexdigest()
    if len(rows) != scope["candidate_count"] or pair_sha != scope["uid_source_hash_map_sha256"] or uid_sha != scope["candidate_uid_set_sha256"]:
        raise RuntimeError("English source map no longer matches the approved corpus scope")
    return {row["uid"]: row["source_sha256"] for row in rows}, source_map


def resolve_source(collection, uid):
    result = subprocess.run(
        ["node", "--import", "tsx", str(SOURCE_SCRIPT), "--collection", collection, "--uid", uid],
        cwd=ROOT, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True,
    )
    try:
        return json.loads(result.stdout)
    except json.JSONDecodeError as exc:
        raise RuntimeError("English source resolver returned invalid JSON") from exc


def source_text(source):
    # Segment order and provenance are in source_sha256; newlines add boundaries,
    # but no words, translations, summaries, or commentary.
    text = "\n".join(segment["text"] for segment in source["segments"])
    if not text.strip():
        raise RuntimeError("Resolved English transcript is empty")
    return text


def plan_chunks(text, profile):
    chunks = split_text(text, profile["chunk_max_chars"])
    if "".join(chunks) != text:
        raise RuntimeError("English chunking changed transcript characters")
    return [
        {"index": index, "text": chunk, "text_sha256": digest(chunk.encode("utf-8"))}
        for index, chunk in enumerate(chunks)
    ]


def wav_duration(path, profile):
    info = wav_info(path, profile)
    return info["duration_seconds"]


def current_date():
    return datetime.now(timezone.utc).date()


def cost_rate_note():
    _, audio_price = pricing_for_now()
    input_price, _ = pricing_for_now()
    return {"input_usd_per_million": input_price, "audio_usd_per_million": audio_price, "as_of_utc_date": str(current_date())}


def empty_state(authorization, profile_sha256):
    prior = float(authorization["cost_ceiling"].get("prior_tts_estimated_usd", 0.0))
    return {
        "schema_version": 1,
        "authorization_reference": authorization["decision_reference"],
        "source_commit": authorization["scope"]["source_commit"],
        "profile_id": authorization["profile"]["id"],
        "profile_sha256": profile_sha256,
        "cost_cap_usd": float(authorization["cost_ceiling"]["max_usd"]),
        "estimated_spend_usd": prior,
        "prior_tts_provider_calls": int(authorization["cost_ceiling"].get("prior_tts_provider_calls", 0)),
        "new_tts_provider_calls": 0,
        "completed_uids": {},
        "pending_request": None,
        "status": "running",
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }


def save_state(state):
    state["updated_at"] = datetime.now(timezone.utc).isoformat()
    write_json(STATE_PATH, state)


def load_state(authorization, profile_sha256):
    if not STATE_PATH.exists():
        return empty_state(authorization, profile_sha256)
    state = json.loads(STATE_PATH.read_text())
    expected = (
        state.get("source_commit") == authorization["scope"]["source_commit"]
        and state.get("profile_sha256") == profile_sha256
        and state.get("cost_cap_usd") == float(authorization["cost_ceiling"]["max_usd"])
    )
    if not expected:
        raise RuntimeError("Existing English TTS budget state is pinned to a different source/profile/cap")
    if state.get("status") != "running":
        raise RuntimeError(f"English TTS generation state is {state.get('status')}; inspect before resuming")
    return state


def pending_recovery(state, profile, planned, uid, folder, source_sha256, profile_sha256):
    pending = state.get("pending_request")
    if not pending:
        return
    if pending.get("uid") != uid:
        raise RuntimeError("A previous TTS request is unresolved; inspect the pending request before continuing")
    if pending.get("source_sha256") != source_sha256 or pending.get("profile_sha256") != profile_sha256:
        raise RuntimeError("Pending TTS request profile/source does not match the active state")
    index = pending.get("chunk_index")
    if not isinstance(index, int) or index < 0 or index >= len(planned):
        raise RuntimeError("Pending TTS request has an invalid chunk index")
    if pending.get("text_sha256") != planned[index]["text_sha256"]:
        raise RuntimeError("Pending TTS request text changed; do not retry")
    wav_path = folder / f"{index:04d}.wav"
    if not wav_path.is_file():
        raise RuntimeError("TTS outcome is uncertain and no verified WAV exists; refusing a blind retry")
    info = wav_info(wav_path, profile)
    record = pending.get("wav_sha256")
    if record and info["wav_sha256"] != record:
        raise RuntimeError("Pending TTS WAV does not match its recorded checksum")
    checkpoint_path = folder / "checkpoint.json"
    checkpoint = json.loads(checkpoint_path.read_text()) if checkpoint_path.exists() else {"chunks": {}}
    checkpoint.setdefault("chunks", {})[str(index)] = {**planned[index], **info}
    write_json(checkpoint_path, checkpoint)
    actual_estimate = estimate_actual_cost(planned[index]["text"], info["duration_seconds"])
    state["estimated_spend_usd"] = round(state["estimated_spend_usd"] + actual_estimate, 6)
    state["new_tts_provider_calls"] += 1
    state["pending_request"] = None
    save_state(state)


def provider_audio(key, profile, text):
    payload = {
        "model": profile["model"],
        "input": [{
            "type": "user_input",
            "content": [{
                "type": "text",
                "text": text,
                "annotations": [{"type": "speech_metadata", "style": profile["style"]}],
            }],
        }],
        "response_format": {"type": "audio"},
        "generation_config": {"speech_config": [{"voice": profile["voice"]}]},
    }
    req = urllib.request.Request(
        API_URL,
        data=json.dumps(payload, ensure_ascii=False).encode("utf-8"),
        headers={"Content-Type": "application/json", "x-goog-api-key": key},
    )
    try:
        with urllib.request.urlopen(req, timeout=180) as response:
            data = json.load(response)
    except urllib.error.HTTPError as exc:
        raise RuntimeError(f"Gemini HTTP {exc.code}; request stopped without retry") from None
    except (urllib.error.URLError, TimeoutError, ConnectionError, http.client.HTTPException) as exc:
        raise RuntimeError(f"Gemini network error ({type(exc).__name__}); request stopped without retry") from None

    direct = data.get("output_audio")
    if isinstance(direct, dict) and isinstance(direct.get("data"), str):
        audio = base64.b64decode(direct["data"], validate=True)
    else:
        blocks = [
            item for step in data.get("steps", []) if step.get("type") == "model_output"
            for item in step.get("content", []) if item.get("type") == "audio" and isinstance(item.get("data"), str)
        ]
        if not blocks:
            raise RuntimeError("Gemini response contained no audio; request stopped without retry")
        audio = base64.b64decode(blocks[-1]["data"], validate=True)
    return audio


def transcode_part(wav_path, mp3_path, profile):
    if mp3_path.exists():
        raise RuntimeError(f"Existing MP3 part found without a completed manifest; preserving it: {mp3_path}")
    tmp = mp3_path.with_suffix(mp3_path.suffix + ".tmp")
    command = [
        "ffmpeg", "-nostdin", "-v", "error", "-y",
        "-i", str(wav_path),
        "-map_metadata", "-1",
        "-codec:a", "libmp3lame",
        "-b:a", f"{profile['mp3_bitrate_kbps']}k",
        "-ac", str(profile["channels"]),
        "-ar", str(profile["sample_rate_hz"]),
        "-id3v2_version", "0",
        "-write_xing", "0",
        "-f", "mp3", str(tmp),
    ]
    try:
        subprocess.run(command, cwd=ROOT, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    except subprocess.CalledProcessError as exc:
        raise RuntimeError("MP3 encoding failed; no TTS retry attempted") from exc
    data = tmp.read_bytes()
    info = mp3_info(data)
    tmp.replace(mp3_path)
    return info


def make_part_wav(chunk_paths, part_wav, profile):
    if part_wav.exists():
        raise RuntimeError(f"Existing temporary part WAV found; preserving it: {part_wav}")
    tmp = part_wav.with_suffix(part_wav.suffix + ".tmp")
    silence_frames = int(profile["sample_rate_hz"] * profile["chunk_pause_seconds"])
    silence = b"\0" * silence_frames * profile["sample_width_bytes"] * profile["channels"]
    try:
        with wave.open(str(tmp), "wb") as output:
            output.setnchannels(profile["channels"])
            output.setsampwidth(profile["sample_width_bytes"])
            output.setframerate(profile["sample_rate_hz"])
            for index, path in enumerate(chunk_paths):
                with wave.open(str(path), "rb") as chunk:
                    output.writeframes(chunk.readframes(chunk.getnframes()))
                if index + 1 < len(chunk_paths):
                    output.writeframes(silence)
        tmp.replace(part_wav)
    except Exception:
        raise


def group_chunks(planned, checkpoint, profile):
    groups = []
    current = []
    duration = 0.0
    for item in planned:
        record = checkpoint["chunks"].get(str(item["index"]))
        if not record:
            raise RuntimeError(f"Missing WAV checkpoint for chunk {item['index']}")
        chunk_duration = record["duration_seconds"]
        pause = profile["chunk_pause_seconds"] if current else 0.0
        if chunk_duration > profile["part_max_duration_seconds"]:
            raise RuntimeError(f"Single TTS chunk exceeds the 30-minute part limit: {item['index']}")
        if current and duration + pause + chunk_duration > profile["part_max_duration_seconds"]:
            groups.append(current)
            current = []
            duration = 0.0
            pause = 0.0
        current.append(item)
        duration += pause + chunk_duration
    if current:
        groups.append(current)
    return groups


def verify_existing_uid(folder, source, profile_sha256):
    manifest_path = folder / "manifest.json"
    if not manifest_path.exists():
        return False
    manifest = json.loads(manifest_path.read_text())
    if manifest.get("source_sha256") != source["source_sha256"] or manifest.get("profile_sha256") != profile_sha256:
        raise RuntimeError(f"Existing English audio differs from current source/profile; preserving: {folder}")
    for part in manifest.get("parts", []):
        path = folder / part["file"]
        if not path.is_file() or digest(path.read_bytes()) != part["sha256"]:
            raise RuntimeError(f"Existing English MP3 part is missing or changed; preserving: {path}")
        mp3_info(path.read_bytes())
    return True


def generate_uid(collection, uid, profile, authorization, profile_sha256, source_hashes, state, key, prepare_only=False):
    source = resolve_source(collection, uid)
    if source.get("source_commit") != authorization["scope"]["source_commit"]:
        raise RuntimeError("English source commit differs from generation authorization")
    expected_source_hash = source_hashes.get(f"{collection}/{uid}")
    if not expected_source_hash or source.get("source_sha256") != expected_source_hash:
        raise RuntimeError(f"{collection}/{uid}: source identity differs from the approved scope")
    if source.get("status") != "ready":
        raise RuntimeError(f"{collection}/{uid}: resolved English source is not ready")
    transcript = "\n".join(segment["text"] for segment in source["segments"])
    planned_text = split_text(transcript, profile["chunk_max_chars"])
    if "".join(planned_text) != transcript:
        raise RuntimeError("English chunking changed transcript characters")
    planned = [
        {"index": index, "text": text, "text_sha256": digest(text.encode("utf-8"))}
        for index, text in enumerate(planned_text)
    ]
    plan_hash = compact_hash(planned)
    fingerprint = compact_hash([source["source_sha256"], profile_sha256, plan_hash])
    folder = ROOT / "audio/english" / collection / uid / fingerprint
    if folder.exists() and not (folder / "manifest.json").exists() and any(folder.glob("part-*.mp3")):
        raise RuntimeError(f"Unmanifested English MP3 parts exist; preserving for investigation: {folder}")
    if verify_existing_uid(folder, source, profile_sha256):
        state.setdefault("completed_uids", {})[f"{collection}/{uid}"] = source["source_sha256"]
        save_state(state)
        print(f"Already complete; reusing without TTS: {collection}/{uid}", flush=True)
        return
    if prepare_only:
        print(json.dumps({
            "uid": f"{collection}/{uid}",
            "source_sha256": source["source_sha256"],
            "profile_sha256": profile_sha256,
            "chunks": len(planned),
            "characters": len(transcript),
            "words": source["words"],
            "estimated_tts_usd": round(sum(estimate_chunk_cost(item["text"], profile, padded=False) for item in planned), 6),
            "estimated_reserve_usd": round(sum(estimate_chunk_cost(item["text"], profile, padded=True) for item in planned), 6),
        }, ensure_ascii=False), flush=True)
        return
    folder.mkdir(parents=True, exist_ok=True)
    (folder / "source.json").write_text(json.dumps(source, ensure_ascii=False, indent=2) + "\n")
    (folder / "profile.json").write_text(json.dumps(profile, ensure_ascii=False, indent=2) + "\n")
    write_json(folder / "plan.json", planned)
    checkpoint_path = folder / "checkpoint.json"
    checkpoint = json.loads(checkpoint_path.read_text()) if checkpoint_path.exists() else {"fingerprint": fingerprint, "chunks": {}}
    if checkpoint.get("fingerprint") != fingerprint:
        raise RuntimeError("English TTS checkpoint source/profile/plan mismatch")

    # Reuse the exact, already generated full SN1.1 local preview instead of sending
    # the same English transcript to Gemini again.
    if collection == "sn" and uid == "sn1.1" and len(planned) == 1:
        preview_manifest = Path("/private/tmp/english-audio-first-track-20261128/manifest.json")
        preview_wav = Path("/private/tmp/english-audio-first-track-20261128/sn1.1-Iapetus.wav")
        preview_plan = Path("/private/tmp/audio-english-first-track-plan-20261128.json")
        if preview_manifest.is_file() and preview_wav.is_file() and preview_plan.is_file():
            pm = json.loads(preview_manifest.read_text())
            pp = json.loads(preview_plan.read_text())
            if (pm.get("source_sha256") == source["source_sha256"]
                and pm.get("transcript_sha256") == source.get("transcript_sha256")
                and pp.get("transcript") == planned[0]["text"]
                and pm.get("model") == profile["model"]
                and pm.get("voice") == profile["voice"]
                and pm.get("style") == profile["style"]
                and hashlib.sha256(preview_wav.read_bytes()).hexdigest() == pm.get("wav_sha256")):
                target = folder / "0000.wav"
                if not target.exists():
                    shutil.copy2(preview_wav, target)
                checkpoint["chunks"]["0"] = {**planned[0], **wav_info(target, profile), "reused_from_preview": str(preview_wav)}
                write_json(checkpoint_path, checkpoint)
                print("Reused full SN1.1 preview without another TTS request", flush=True)

    pending_recovery(state, profile, planned, uid, folder, source["source_sha256"], profile_sha256)
    for item in planned:
        index = item["index"]
        chunk_path = folder / f"{index:04d}.wav"
        record = checkpoint["chunks"].get(str(index))
        if cached_chunk_valid(chunk_path, record, item, profile):
            continue
        if chunk_path.exists():
            raise RuntimeError(f"Unverified WAV exists; preserving and refusing regeneration: {chunk_path}")
        if state.get("pending_request"):
            raise RuntimeError("A TTS request outcome is pending; refusing to start another request")
        reserve = estimate_chunk_cost(item["text"], profile, padded=True)
        if state["estimated_spend_usd"] + reserve > state["cost_cap_usd"]:
            state["status"] = "stopped-cost-cap"
            state["stopped_at"] = datetime.now(timezone.utc).isoformat()
            save_state(state)
            raise RuntimeError("Estimated TTS cost would exceed the approved $400 cap")
        state["pending_request"] = {
            "uid": f"{collection}/{uid}",
            "chunk_index": index,
            "text_sha256": item["text_sha256"],
            "reserved_cost_usd": reserve,
            "wav_path": str(chunk_path),
            "source_sha256": source["source_sha256"],
            "profile_sha256": profile_sha256,
        }
        save_state(state)
        print(f"TTS {collection}/{uid} chunk {index + 1}/{len(planned)} ({len(item['text'])} chars)", flush=True)
        try:
            audio = provider_audio(key, profile, item["text"])
        except Exception as exc:
            state["status"] = "stopped-provider-error"
            state["last_error_type"] = type(exc).__name__
            state["stopped_at"] = datetime.now(timezone.utc).isoformat()
            save_state(state)
            raise
        temp = chunk_path.with_suffix(".wav.tmp")
        temp.write_bytes(audio)
        # Validate before making this chunk a reusable cache.
        info = wav_info(temp, profile)
        temp.replace(chunk_path)
        actual_estimate = estimate_actual_cost(item["text"], info["duration_seconds"])
        checkpoint["chunks"][str(index)] = {**item, **info}
        write_json(checkpoint_path, checkpoint)
        state["estimated_spend_usd"] = round(state["estimated_spend_usd"] + actual_estimate, 6)
        state["new_tts_provider_calls"] += 1
        state["pending_request"] = None
        state.setdefault("completed_chunks", []).append({
            "uid": f"{collection}/{uid}", "chunk_index": index,
            "wav_sha256": info["wav_sha256"], "estimated_cost_usd": actual_estimate,
        })
        save_state(state)
        # Re-read the source after each provider request. Never continue with stale text.
        current = resolve_source(collection, uid)
        if current.get("source_sha256") != source["source_sha256"]:
            raise RuntimeError("Resolved English source changed during synthesis")

    parts = compile_parts(folder, planned, checkpoint, profile)
    manifest = {
        "schema_version": 1,
        "uid": uid,
        "collection": collection,
        "track_kind": "english-standard",
        "transcript_policy": "resolved-english-column-v1",
        "source_commit": source["source_commit"],
        "source_sha256": source["source_sha256"],
        "transcript_sha256": source["transcript_sha256"],
        "source_segment_counts": source["source_segment_counts"],
        "source_segments": [{"id": s["id"], "source": s["source"]} for s in source["segments"]],
        "profile_id": profile["id"],
        "profile_sha256": profile_sha256,
        "model": profile["model"],
        "voice": profile["voice"],
        "style": profile["style"],
        "chunk_plan_sha256": plan_hash,
        "chunk_count": len(planned),
        "duration_seconds": sum(p["duration_seconds"] for p in parts),
        "parts": parts,
        "review_status": "pending",
        "generation_authorization": authorization["decision_reference"],
        "public_upload": False,
        "generated_at": datetime.now(timezone.utc).isoformat(),
    }
    write_json(folder / "manifest.json", manifest)
    # Keep the verified MP3 parts and the hash-bearing chunk checkpoint. The
    # WAV chunks are temporary TTS output and are removed only after the full
    # UID and every MP3 part have been verified.
    for chunk_index in range(len(planned)):
        (folder / f"{chunk_index:04d}.wav").unlink(missing_ok=True)
    state.setdefault("completed_uids", {})[f"{collection}/{uid}"] = source["source_sha256"]
    state["last_completed_uid"] = f"{collection}/{uid}"
    save_state(state)
    print(f"Generated local English audio: {collection}/{uid} ({manifest['duration_seconds']:.1f}s, {len(parts)} part(s)); review pending", flush=True)


def compile_parts(folder, planned, checkpoint, profile):
    groups = group_chunks(planned, checkpoint, profile)
    parts_checkpoint_path = folder / "parts-checkpoint.json"
    state = json.loads(parts_checkpoint_path.read_text()) if parts_checkpoint_path.exists() else {"parts": {}}
    result = []
    for part_index, group in enumerate(groups, start=1):
        part_name = f"part-{part_index:03d}.mp3"
        part_path = folder / part_name
        key = str(part_index)
        if key in state["parts"]:
            record = state["parts"][key]
            if not part_path.is_file() or digest(part_path.read_bytes()) != record["sha256"]:
                raise RuntimeError(f"Part checkpoint differs from MP3; preserving: {part_path}")
            mp3_info(part_path.read_bytes())
            result.append(record)
            continue
        if part_path.exists():
            raise RuntimeError(f"Uncheckpointed MP3 part exists; preserving: {part_path}")
        wav_path = folder / f"part-{part_index:03d}.wav"
        if wav_path.exists():
            raise RuntimeError(f"Uncheckpointed temporary part WAV exists; preserving: {wav_path}")
        chunk_paths = [folder / f"{item['index']:04d}.wav" for item in group]
        make_part_wav(chunk_paths, wav_path, profile)
        mp3_info_data = transcode_part(wav_path, part_path, profile)
        wav_path.unlink()
        record = {
            "part_number": part_index,
            "file": part_name,
            "chunk_indices": [item["index"] for item in group],
            "sha256": mp3_info_data["sha256"],
            "bytes": mp3_info_data["bytes"],
            "duration_seconds": mp3_info_data["duration_seconds"],
            "mp3_integrity": mp3_info_data,
        }
        state["parts"][key] = record
        write_json(parts_checkpoint_path, state)
        result.append(record)
    return result


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--uid")
    parser.add_argument("--collection", choices=("dn", "mn", "sn", "an", "kn"))
    parser.add_argument("--all", action="store_true")
    parser.add_argument("--limit", type=int)
    parser.add_argument("--prepare-only", action="store_true")
    args = parser.parse_args()

    profile, authorization, profile_sha256 = load_profile_and_authorization()
    source_hashes, source_map = load_scope(authorization)
    if args.all == bool(args.uid):
        raise SystemExit("Choose exactly one of --all or --uid")
    if args.limit is not None and args.limit < 1:
        raise SystemExit("--limit must be positive")
    if args.uid and not args.collection:
        raise SystemExit("--collection is required with --uid")
    load_env()
    key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_GENAI_API_KEY")
    if not args.prepare_only and not key:
        raise SystemExit("Gemini credential is unavailable; no request sent")

    if args.all:
        candidates = [row["uid"] for row in source_map["uid_source_map"]]
        selected = candidates[:args.limit] if args.limit else candidates
        items = [(uid.split("/",1)[0], uid.split("/",1)[1]) for uid in selected]
    else:
        items = [(args.collection, args.uid)]

    with open(TTS_LOCK_PATH, "a") as lock:
        try:
            fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        except BlockingIOError:
            raise SystemExit("Another TTS process holds the machine-wide lock; no duplicate request started")
        state = load_state(authorization, profile_sha256)
        for collection, uid in items:
            generate_uid(collection, uid, profile, authorization, profile_sha256, source_hashes, state, key, args.prepare_only)
    print(json.dumps({
        "uids_prepared_or_completed": len(items),
        "estimated_spend_usd": state["estimated_spend_usd"],
        "cost_cap_usd": state["cost_cap_usd"],
        "review_status": "pending",
        "public_upload": False,
        "provider_calls": state["new_tts_provider_calls"],
    }, ensure_ascii=False), flush=True)


if __name__ == "__main__":
    main()
