#!/usr/bin/env python3
"""Verify the actual APK before exposing a standalone Android preview artifact."""

import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import zipfile


ROOT = Path(__file__).resolve().parents[1]
PACKAGE = "io.github.streamentry.kinhtangpali.preview"


def command(*args: str) -> str:
    result = subprocess.run(args, text=True, stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
    if result.returncode:
        raise RuntimeError(f"{Path(args[0]).name} failed ({result.returncode}):\n{result.stdout}")
    return result.stdout


def verify_signer(signature: str, fingerprint: str) -> None:
    # apksigner prints either numbered signers or SDK ranges for scheme v3.1.
    # One certificate may appear in more than one range; every range must use
    # the exact expected key, including the certificate for older Androids.
    # AOSP's check_target_files_signatures.py supports these same two labels.
    counts = re.findall(r"^Number of signers: (\d+)\s*$", signature, re.MULTILINE)
    digests = re.findall(
        r"^Signer (?:#\d+|\(minSdkVersion=[^\r\n]+\)) certificate SHA-256 digest: ([0-9a-fA-F]{64})\s*$",
        signature, re.MULTILINE,
    )
    if counts != ["1"] or {digest.lower() for digest in digests} != {fingerprint.lower()}:
        raise RuntimeError(
            f"APK must use exactly the generated Expo template's public debug key. "
            f"Expected {fingerprint}; observed {digests}; signer counts {counts}."
        )


def main() -> None:
    apk = ROOT / "android/app/build/outputs/apk/release/app-release.apk"
    sdk = Path(os.environ.get("ANDROID_HOME") or os.environ["ANDROID_SDK_ROOT"])
    candidates = [p for p in (sdk / "build-tools").iterdir() if (p / "apksigner").is_file()]
    if not candidates:
        raise RuntimeError("No Android build tools available to verify the APK")
    build_tools = max(candidates, key=lambda p: tuple(int(v) for v in re.findall(r"\d+", p.name)))
    signature = command(str(build_tools / "apksigner"), "verify", "--verbose", "--print-certs", str(apk))
    template_certificate = subprocess.check_output([
        "keytool", "-exportcert", "-keystore", str(ROOT / "android/app/debug.keystore"),
        "-alias", "androiddebugkey", "-storepass", "android",
    ])
    fingerprint = hashlib.sha256(template_certificate).hexdigest()
    print(signature, flush=True)
    print(f"Expected template certificate SHA-256: {fingerprint}", flush=True)
    verify_signer(signature, fingerprint)
    badging = command(str(build_tools / "aapt"), "dump", "badging", str(apk))
    if f"package: name='{PACKAGE}'" not in badging:
        raise RuntimeError("Refusing to distribute a preview with a production package ID")
    if "application-debuggable" in badging:
        raise RuntimeError("Preview must use a release build with embedded JavaScript")
    if "android.permission.RECORD_AUDIO" in badging:
        raise RuntimeError("A listening-only app must not request microphone permission")
    if "android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK" not in badging:
        raise RuntimeError("Background audio service capability is missing")
    with zipfile.ZipFile(apk) as archive:
        bundle = archive.getinfo("assets/index.android.bundle")
        if bundle.file_size < 100_000:
            raise RuntimeError("Embedded JavaScript bundle is missing or unexpectedly small")
        abis = {name.split("/")[1] for name in archive.namelist() if name.startswith("lib/") and name.endswith(".so")}
        if abis != {"arm64-v8a", "x86_64"}:
            raise RuntimeError(f"Unexpected preview ABIs: {sorted(abis)}")
    output = ROOT / "build/preview"
    output.mkdir(parents=True, exist_ok=True)
    target = output / "kinh-tang-pali-preview.apk"
    shutil.copyfile(apk, target)
    checksum = hashlib.sha256(target.read_bytes()).hexdigest()
    (output / "SHA256SUMS").write_text(f"{checksum}  {target.name}\n", encoding="utf-8")
    metadata = {
        "commit": os.environ.get("GITHUB_SHA", command("git", "rev-parse", "HEAD").strip()),
        "package": PACKAGE,
        "website": os.environ.get("EXPO_PUBLIC_SITE_URL"),
        "signing": "Expo template public debug key; preview only",
        "signingCertificateSha256": fingerprint,
        "architectures": sorted(abis),
        "embeddedJavaScriptBytes": bundle.file_size,
        "sha256": checksum,
    }
    (output / "build.json").write_text(json.dumps(metadata, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    (output / "signature.txt").write_text(signature, encoding="utf-8")
    (output / "package.txt").write_text(badging, encoding="utf-8")
    (output / "README.txt").write_text(
        "Kinh Tạng Pāli — Android preview\n\n"
        "Standalone APK: no Expo login or Metro server required.\n"
        "Built from the commit in build.json; verify SHA256SUMS before installing.\n"
        "Uses the Expo template's public debug signing key. This is a test build,\n"
        "not a production or Play Store release. Install only from this repository.\n"
        "The .preview package keeps its data separate from a future production app.\n"
        "Export a JSON backup in the app before uninstalling or moving to another\n"
        "package/signing key. Website content and streamed audio require a network.\n"
        "Emulator checks cover launch and native navigation; physical-device audio,\n"
        "Bluetooth, interruptions and accessibility still need device validation.\n",
        encoding="utf-8",
    )
    print(json.dumps(metadata, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
