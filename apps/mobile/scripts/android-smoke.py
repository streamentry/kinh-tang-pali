#!/usr/bin/env python3
"""Exercise an installed Android preview through its real native UI.

Run from apps/mobile after adb install:
    python3 scripts/android-smoke.py --output build/smoke

No Metro server, account, test hooks, or successful website request is required.
This checks the native shell and bookmark persistence, not audio or website
content. It keeps existing data, adds a library bookmark if needed, and leaves
the app on Home. Every command and UI wait has a timeout.
"""

from __future__ import annotations

import argparse
import json
import os
from pathlib import Path
import re
import subprocess
import sys
import time
import traceback
import unicodedata
import xml.etree.ElementTree as ET
from datetime import datetime, timezone


class SmokeFailure(RuntimeError):
    pass


def normalized(value: str) -> str:
    return " ".join(unicodedata.normalize("NFC", value).split()).casefold()


def bounds(node: ET.Element) -> tuple[int, int, int, int] | None:
    match = re.fullmatch(r"\[(-?\d+),(-?\d+)\]\[(-?\d+),(-?\d+)\]", node.get("bounds", ""))
    if not match:
        return None
    left, top, right, bottom = map(int, match.groups())
    return (left, top, right, bottom) if right > left and bottom > top else None


def native_nodes(root: ET.Element, package: str):
    # Ignore the live site's accessibility subtree even if it repeats a native
    # tab label. Library assertions and taps must be independent of its contents.
    if "WebView" in root.get("class", ""):
        return
    if root.tag == "node" and root.get("package") == package and root.get("visible-to-user") != "false":
        yield root
    for child in root:
        yield from native_nodes(child, package)


def find_label(root: ET.Element, package: str, label: str) -> ET.Element | None:
    wanted = normalized(label)
    matches = []
    for node in native_nodes(root, package):
        rectangle = bounds(node)
        if not rectangle or node.get("enabled") == "false":
            continue
        labels = [normalized(node.get(key, "")) for key in ("text", "content-desc")]
        if not any(wanted in value for value in labels):
            continue
        left, top, right, bottom = rectangle
        # Prefer an exact text/accessibility label, then the smallest matching
        # element. A Text child is tappable at the same point as its Pressable.
        matches.append((wanted not in labels, (right - left) * (bottom - top), node))
    return min(matches, key=lambda item: item[:2])[2] if matches else None


def crash_marker(log: str, package: str) -> str | None:
    escaped = re.escape(package)
    patterns = [
        rf"AndroidRuntime.*\bProcess:\s*{escaped}(?=[:,\s]|$)",
        rf">>>\s*{escaped}(?=[:\s]).*<<<",
        rf"\bANR in {escaped}(?=[:\s(]|$)",
    ]
    for line in log.splitlines():
        if any(re.search(pattern, line) for pattern in patterns):
            return line
    return None


class Smoke:
    def __init__(self, args: argparse.Namespace):
        self.args = args
        self.output = Path(args.output).resolve()
        self.output.mkdir(parents=True, exist_ok=True)
        self.deadline = time.monotonic() + args.timeout
        self.serial = args.serial or os.environ.get("ANDROID_SERIAL")
        self.connected = False
        self.logcat = None
        self.logfile = None
        self.report = {
            "package": args.package,
            "started_at": datetime.now(timezone.utc).isoformat(),
            "status": "running",
            "checks": [],
            "scope": "Native home, settings, saved screen, library shell, and a bookmark surviving process restart; no website or audio assertions.",
        }

    def command(self, *arguments: str, timeout: float = 15, cleanup: bool = False, binary: bool = False) -> bytes:
        remaining = self.deadline - time.monotonic()
        if not cleanup and remaining <= 0:
            raise SmokeFailure(f"Smoke exceeded its {self.args.timeout}-second interaction limit.")
        command = [self.args.adb]
        if self.serial:
            command.extend(["-s", self.serial])
        command.extend(arguments)
        limit = timeout if cleanup else max(0.1, min(timeout, remaining))
        try:
            result = subprocess.run(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=limit)
        except subprocess.TimeoutExpired as error:
            raise SmokeFailure(f"ADB command timed out after {limit:.1f}s: {' '.join(arguments)}") from error
        with (self.output / "commands.log").open("a", encoding="utf-8") as trace:
            trace.write(f"$ {' '.join(command)}\nexit={result.returncode}\n")
            trace.write(f"<{len(result.stdout)} bytes>\n" if binary else result.stdout.decode("utf-8", errors="replace")[:2000] + "\n")
            trace.write(result.stderr.decode("utf-8", errors="replace")[:2000] + "\n")
        if result.returncode:
            detail = (result.stderr + result.stdout).decode("utf-8", errors="replace")[:1000].strip()
            raise SmokeFailure(f"ADB command failed ({result.returncode}): {' '.join(arguments)}\n{detail}")
        return result.stdout

    def connect(self):
        if not self.serial:
            listing = self.command("devices", timeout=20).decode("utf-8", errors="replace")
            devices = [line.split()[0] for line in listing.splitlines() if len(line.split()) == 2 and line.split()[1] == "device"]
            if len(devices) != 1:
                raise SmokeFailure(f"Expected one ready Android device; found {len(devices)}. Pass --serial to select one.\n{listing}")
            self.serial = devices[0]
        if self.command("get-state").strip() != b"device":
            raise SmokeFailure("Selected Android device is not ready.")
        self.connected = True
        self.report["serial"] = self.serial
        if not self.command("shell", "pm", "path", self.args.package).strip().startswith(b"package:"):
            raise SmokeFailure(f"Package {self.args.package} is not installed; run adb install first.")

    def start_logs(self):
        self.logfile = (self.output / "logcat.txt").open("wb")
        # Start before launching so an early native/JS startup crash is retained.
        # Do not clear the device's existing log buffers.
        self.logcat = subprocess.Popen(
            [self.args.adb, "-s", self.serial, "logcat", "-b", "all", "-v", "threadtime", "-T", "1"],
            stdout=self.logfile, stderr=subprocess.STDOUT,
        )

    def stop_logs(self):
        if self.logcat and self.logcat.poll() is None:
            self.logcat.terminate()
            try:
                self.logcat.wait(timeout=3)
            except subprocess.TimeoutExpired:
                self.logcat.kill()
                self.logcat.wait(timeout=3)
        if self.logfile:
            self.logfile.close()

    def assert_alive(self):
        try:
            pid = self.command("shell", "pidof", "-s", self.args.package, timeout=5).strip()
        except SmokeFailure as error:
            raise SmokeFailure(f"App process {self.args.package} is no longer running. Inspect logcat.txt.") from error
        if not pid:
            raise SmokeFailure(f"App process {self.args.package} is no longer running. Inspect logcat.txt.")

    def dump(self, cleanup: bool = False) -> tuple[ET.Element, bytes]:
        remote = "/data/local/tmp/kinh-tang-pali-smoke.xml"
        self.command("shell", "uiautomator", "dump", "--compressed", remote, timeout=15, cleanup=cleanup)
        xml = self.command("exec-out", "cat", remote, timeout=5, cleanup=cleanup)
        root = ET.fromstring(xml)
        (self.output / "last-ui.xml").write_bytes(xml)
        return root, xml

    def snapshot(self, name: str, xml: bytes, cleanup: bool = False):
        (self.output / f"{name}.xml").write_bytes(xml)
        self.screenshot(name, cleanup=cleanup)

    def screenshot(self, name: str, cleanup: bool = False):
        png = self.command("exec-out", "screencap", "-p", timeout=10, cleanup=cleanup, binary=True)
        if not png.startswith(b"\x89PNG\r\n\x1a\n"):
            raise SmokeFailure("Android screenshot did not return a PNG.")
        (self.output / f"{name}.png").write_bytes(png)

    def wait_for(self, name: str, *labels: str) -> ET.Element:
        until = min(self.deadline, time.monotonic() + 35)
        last_problem = "No UI hierarchy returned."
        while time.monotonic() < until:
            self.assert_alive()
            try:
                root, xml = self.dump()
                missing = [label for label in labels if find_label(root, self.args.package, label) is None]
                if not missing:
                    self.snapshot(name, xml)
                    self.report["checks"].append({"name": name, "labels": list(labels)})
                    print(f"PASS {name}: {' | '.join(labels)}", flush=True)
                    return root
                last_problem = "Missing native labels: " + ", ".join(missing)
            except (SmokeFailure, ET.ParseError) as error:
                last_problem = str(error)
            time.sleep(0.5)
        raise SmokeFailure(f"Timed out waiting for {name}. {last_problem}")

    def tap(self, root: ET.Element, label: str):
        node = find_label(root, self.args.package, label)
        rectangle = bounds(node) if node is not None else None
        if not rectangle:
            raise SmokeFailure(f"Cannot tap native control {label!r}: no observed bounds.")
        left, top, right, bottom = rectangle
        self.command("shell", "input", "tap", str((left + right) // 2), str((top + bottom) // 2))

    def launch(self, name: str):
        self.command("shell", "am", "force-stop", self.args.package)
        resolved = self.command("shell", "cmd", "package", "resolve-activity", "--brief", "-a", "android.intent.action.MAIN", "-c", "android.intent.category.LAUNCHER", self.args.package).decode("utf-8", errors="replace")
        activities = [line.strip() for line in resolved.splitlines() if re.fullmatch(r"[\w.$]+/[\w.$]+", line.strip())]
        if not activities:
            raise SmokeFailure(f"No launcher activity resolved for {self.args.package}: {resolved}")
        component = activities[-1]
        self.report["activity"] = component
        launched = self.command("shell", "am", "start", "-W", "-n", component, timeout=30)
        (self.output / f"{name}.txt").write_bytes(launched)
        if re.search(rb"(?:Error:|Exception|Status: timeout)", launched):
            raise SmokeFailure(f"Android could not launch the app; inspect {name}.txt.")

    def exercise(self):
        self.launch("launch")
        home = self.wait_for("01-home", "Đọc & lắng nghe", "Cài đặt và sao lưu", "Mở thư viện", "Đã lưu")
        self.tap(home, "Cài đặt và sao lưu")
        settings = self.wait_for("02-settings", "Cài đặt & sao lưu", "Xuất bản sao lưu", "Nhập bản sao lưu", "Đóng cài đặt")
        self.tap(settings, "Đóng cài đặt")
        home = self.wait_for("03-home-after-settings", "Đọc & lắng nghe", "Đã lưu")
        self.tap(home, "Đã lưu")
        saved = self.wait_for("04-saved", "Dấu trang", "Gần đây", "Tiếp tục")
        self.tap(saved, "Tiếp tục")
        home = self.wait_for("05-home-after-saved", "Đọc & lắng nghe", "Mở thư viện")
        self.tap(home, "Mở thư viện")
        library = self.wait_for("06-library-shell", "Quay lại", "Mở trang này trong trình duyệt", "Tiếp tục")
        # The native bookmark action uses the trusted fallback page even when
        # the website cannot load. Never toggle off an existing bookmark.
        created = find_label(library, self.args.package, "Đánh dấu bài") is not None
        if created:
            self.tap(library, "Đánh dấu bài")
        library = self.wait_for("07-library-bookmarked", "Bỏ dấu trang", "Đã lưu")
        self.tap(library, "Đã lưu")
        saved = self.wait_for("08-saved-bookmark", "Dấu trang", "Bỏ dấu trang")
        remove = find_label(saved, self.args.package, "Bỏ dấu trang")
        label = remove.get("content-desc") or remove.get("text")
        self.report["bookmark"] = {"created": created, "observed_label": label}
        # A force-stop is a real process restart without clearing SQLite.
        self.launch("relaunch")
        home = self.wait_for("09-home-after-restart", "Đọc & lắng nghe", "Đã lưu")
        self.tap(home, "Đã lưu")
        saved = self.wait_for("10-bookmark-after-restart", "Dấu trang", label)
        # Use the native Home tab rather than web history: redirects or network
        # failures must not decide this check.
        self.tap(saved, "Tiếp tục")
        self.wait_for("11-final-home", "Đọc & lắng nghe", "Cài đặt và sao lưu")
        self.assert_alive()

    def diagnostics(self, failed: bool):
        if not self.connected:
            return
        if failed:
            try:
                _, xml = self.dump(cleanup=True)
                (self.output / "failure.xml").write_bytes(xml)
            except Exception as error:
                (self.output / "diagnostic-error.txt").write_text(str(error), encoding="utf-8")
            try:
                self.screenshot("failure", cleanup=True)
            except Exception as error:
                (self.output / "screenshot-error.txt").write_text(str(error), encoding="utf-8")
        for filename, command in [("activity.txt", ("dumpsys", "activity", "activities")), ("window.txt", ("dumpsys", "window", "windows"))]:
            try:
                data = self.command("shell", *command, timeout=5, cleanup=True)
                (self.output / filename).write_bytes(data)
            except Exception as error:
                (self.output / filename).write_text(str(error), encoding="utf-8")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", default="build/smoke", help="Directory for screenshots, XML, logs, and report.json")
    parser.add_argument("--package", default="io.github.streamentry.kinhtangpali.preview")
    parser.add_argument("--serial", help="ADB device serial; defaults to ANDROID_SERIAL or the only ready device")
    parser.add_argument("--adb", default="adb", help="ADB executable")
    parser.add_argument("--timeout", type=int, default=180, help="Overall interaction timeout in seconds (30–600); final diagnostics add at most about 45s")
    args = parser.parse_args()
    if not 30 <= args.timeout <= 600:
        parser.error("--timeout must be between 30 and 600 seconds")
    if not re.fullmatch(r"[A-Za-z_]\w*(?:\.[A-Za-z_]\w*)+", args.package):
        parser.error("--package must be an Android package name")
    smoke = Smoke(args)
    failure = None
    try:
        smoke.connect()
        smoke.start_logs()
        smoke.exercise()
    except Exception as error:
        failure = str(error)
        (smoke.output / "failure.txt").write_text(traceback.format_exc(), encoding="utf-8")
    finally:
        smoke.diagnostics(failed=failure is not None)
        smoke.stop_logs()
    log_path = smoke.output / "logcat.txt"
    if log_path.exists():
        marker = crash_marker(log_path.read_text(encoding="utf-8", errors="replace"), args.package)
        if marker:
            failure = f"App crash or ANR observed: {marker}" + (f"\n{failure}" if failure else "")
    smoke.report.update({"status": "failed" if failure else "passed", "finished_at": datetime.now(timezone.utc).isoformat(), "error": failure})
    (smoke.output / "report.json").write_text(json.dumps(smoke.report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"{'FAIL: ' + failure if failure else 'PASS: native Android smoke completed.'}\nArtifacts: {smoke.output}", file=sys.stderr if failure else sys.stdout, flush=True)
    return 1 if failure else 0


if __name__ == "__main__":
    raise SystemExit(main())
