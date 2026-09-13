#!/usr/bin/env python3
"""Run the hynt/F5-TTS-Vietnamese-ViVoice checkpoint on Kaggle.

The script deliberately keeps model weights outside Git.  It accepts either a
local translation snapshot or downloads the pinned repository snapshot, finds
the attached Kaggle Dataset checkpoint, and writes a WAV plus an inspectable
manifest.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path
from urllib.request import urlopen


DEFAULT_SOURCE_URL = (
    "https://raw.githubusercontent.com/streamentry/kinh-tang-pali/"
    "1770865c0dba9f5caddbc901565450768f274c05/"
    "content/translation/vi/project/sutta/mn/mn1_translation-vi-project.json"
)
DEFAULT_MODEL_ROOT = Path("/kaggle/input")
DEFAULT_OUTPUT_DIR = Path("/kaggle/working/f5-vivvoice-output")
REFERENCE_TEXT = "cả hai bên hãy cố gắng hiểu cho nhau"


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for block in iter(lambda: handle.read(16 * 1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def locate_model_files(model_root: Path) -> tuple[Path, Path, Path]:
    checkpoints = sorted(model_root.rglob("model_last.pt"))
    if not checkpoints:
        raise FileNotFoundError(
            f"model_last.pt not found under {model_root}; attach the F5 ViVoice Dataset"
        )
    checkpoint = checkpoints[0]
    vocab = checkpoint.with_name("vocab.txt")
    reference_audio = checkpoint.with_name("ref.wav")
    if not vocab.exists():
        raise FileNotFoundError(f"vocab.txt is missing beside {checkpoint}")
    if not reference_audio.exists():
        raise FileNotFoundError(
            f"ref.wav is missing beside {checkpoint}; include the licensed reference asset"
        )
    return checkpoint, vocab, reference_audio


def load_translation(path: Path | None, source_url: str) -> tuple[dict[str, str], str]:
    if path is not None:
        payload = path.read_text(encoding="utf-8")
        source_name = str(path)
    else:
        with urlopen(source_url, timeout=60) as response:
            payload = response.read().decode("utf-8")
        source_name = source_url
    translation = json.loads(payload)
    if not isinstance(translation, dict) or not translation:
        raise ValueError("translation input must be a non-empty JSON object")
    if not all(isinstance(key, str) and isinstance(value, str) for key, value in translation.items()):
        raise ValueError("translation input must map segment IDs to strings")
    return translation, source_name


def build_script(translation: dict[str, str], mode: str) -> str:
    values = list(translation.values())
    if mode == "smoke":
        values = values[:12]
    return "\n\n".join(values)


def run_inference(
    *,
    script_path: Path,
    checkpoint: Path,
    vocab: Path,
    reference_audio: Path,
    output_dir: Path,
    output_name: str,
    speed: float,
) -> Path:
    output_dir.mkdir(parents=True, exist_ok=True)
    command = [
        sys.executable,
        "-m",
        "f5_tts.infer.infer_cli",
        "--model",
        "F5TTS_Base",
        "--ref_audio",
        str(reference_audio),
        "--ref_text",
        REFERENCE_TEXT,
        "--gen_file",
        str(script_path),
        "--speed",
        str(speed),
        "--vocoder_name",
        "vocos",
        "--vocab_file",
        str(vocab),
        "--ckpt_file",
        str(checkpoint),
        "--output_dir",
        str(output_dir),
        "--output_file",
        output_name,
        "--remove_silence",
    ]
    print("running:", " ".join(command), flush=True)
    subprocess.run(command, check=True)
    output_path = output_dir / output_name
    if not output_path.is_file() or output_path.stat().st_size == 0:
        raise RuntimeError(f"inference completed without a non-empty output: {output_path}")
    return output_path


def write_manifest(
    *,
    output_dir: Path,
    output_path: Path,
    translation: dict[str, str],
    source_name: str,
    source_url: str,
    checkpoint: Path,
    vocab: Path,
    reference_audio: Path,
    mode: str,
    speed: float,
) -> Path:
    try:
        import torch

        device = "cuda" if torch.cuda.is_available() else "cpu"
        device_name = torch.cuda.get_device_name(0) if torch.cuda.is_available() else device
    except Exception as exc:  # pragma: no cover - diagnostic fallback on Kaggle images
        device = "unknown"
        device_name = f"unavailable: {type(exc).__name__}"

    manifest = {
        "created_at": datetime.now(timezone.utc).isoformat(),
        "mode": mode,
        "model": "hynt/F5-TTS-Vietnamese-ViVoice",
        "model_checkpoint": checkpoint.name,
        "model_checkpoint_sha256": sha256_file(checkpoint),
        "vocab_sha256": sha256_file(vocab),
        "reference_audio": reference_audio.name,
        "reference_text": REFERENCE_TEXT,
        "speed": speed,
        "device": device,
        "device_name": device_name,
        "translation_source": source_name,
        "translation_source_url": source_url,
        "translation_segment_count": len(translation),
        "translation_character_count": sum(len(value) for value in translation.values()),
        "output": output_path.name,
        "output_bytes": output_path.stat().st_size,
        "output_sha256": sha256_file(output_path),
        "license_note": "CC-BY-NC-SA-4.0; research/non-commercial use only",
    }
    manifest_path = output_dir / f"{output_path.stem}.manifest.json"
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return manifest_path


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--mode", choices=("smoke", "full"), default="smoke")
    parser.add_argument("--translation-path", type=Path)
    parser.add_argument("--source-url", default=DEFAULT_SOURCE_URL)
    parser.add_argument("--model-root", type=Path, default=DEFAULT_MODEL_ROOT)
    parser.add_argument("--output-dir", type=Path, default=DEFAULT_OUTPUT_DIR)
    parser.add_argument("--speed", type=float, default=0.75)
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    if not 0.25 <= args.speed <= 4.0:
        raise ValueError("speed must be between 0.25 and 4.0")
    translation, source_name = load_translation(args.translation_path, args.source_url)
    script = build_script(translation, args.mode)
    args.output_dir.mkdir(parents=True, exist_ok=True)
    script_path = args.output_dir / f"mn1-{args.mode}.txt"
    script_path.write_text(script, encoding="utf-8")
    checkpoint, vocab, reference_audio = locate_model_files(args.model_root)
    output_name = f"mn1-f5-vivvoice-{args.mode}.wav"
    output_path = run_inference(
        script_path=script_path,
        checkpoint=checkpoint,
        vocab=vocab,
        reference_audio=reference_audio,
        output_dir=args.output_dir,
        output_name=output_name,
        speed=args.speed,
    )
    manifest_path = write_manifest(
        output_dir=args.output_dir,
        output_path=output_path,
        translation=translation,
        source_name=source_name,
        source_url=args.source_url,
        checkpoint=checkpoint,
        vocab=vocab,
        reference_audio=reference_audio,
        mode=args.mode,
        speed=args.speed,
    )
    print(f"output={output_path}", flush=True)
    print(f"manifest={manifest_path}", flush=True)


if __name__ == "__main__":
    main()
