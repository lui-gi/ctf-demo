"""
Builds files/sealed.gpg only.

This is the OS-portable half of the memory_of_the_helmsman build. The other
half (the LiME memory dump containing the vim swap file with the passphrase)
must be built on a Linux VM -- see build/make.sh.

Usage:
    python build/make_gpg.py
"""
from __future__ import annotations

import os
import subprocess
import sys
from pathlib import Path, PurePosixPath


def _msys_path(p: Path) -> str:
    """Convert C:\\foo\\bar into /c/foo/bar so MSYS-built gpg.exe parses it."""
    s = str(p.resolve())
    drive, rest = os.path.splitdrive(s)
    if drive and len(drive) == 2 and drive[1] == ":":
        return "/" + drive[0].lower() + rest.replace("\\", "/")
    return s.replace("\\", "/")

ROOT = Path(__file__).resolve().parents[1]
FLAG = (ROOT / "flag.txt").read_text(encoding="ascii").strip()
PASSPHRASE = "pale_cassandra_drift_19"
OUT = ROOT / "files" / "sealed.gpg"

OUT.parent.mkdir(parents=True, exist_ok=True)
if OUT.exists():
    OUT.unlink()

# Each invocation gets its own ephemeral GNUPGHOME so we don't pollute the
# host's gpg config and so the build is reproducible.
import tempfile
with tempfile.TemporaryDirectory() as gnupghome:
    env = os.environ.copy()
    # MSYS-built gpg.exe (Git for Windows) wants /c/foo/bar style paths.
    env["GNUPGHOME"] = _msys_path(Path(gnupghome))
    out_arg = _msys_path(OUT)
    # Symmetric AES256 encryption. Force --yes for idempotence.
    cmd = [
        "gpg", "--batch", "--yes",
        "--pinentry-mode", "loopback",
        "--passphrase", PASSPHRASE,
        "--cipher-algo", "AES256",
        "--symmetric",
        "--output", out_arg,
    ]
    proc = subprocess.run(cmd, input=(FLAG + "\n").encode("ascii"),
                          env=env, capture_output=True)
    if proc.returncode != 0:
        sys.stderr.write(proc.stderr.decode("utf-8", "replace"))
        sys.exit(proc.returncode)

# Round-trip check.
with tempfile.TemporaryDirectory() as gnupghome:
    env = os.environ.copy()
    env["GNUPGHOME"] = _msys_path(Path(gnupghome))
    cmd = [
        "gpg", "--batch", "--yes",
        "--pinentry-mode", "loopback",
        "--passphrase", PASSPHRASE,
        "--decrypt", _msys_path(OUT),
    ]
    proc = subprocess.run(cmd, capture_output=True, env=env)
    decrypted = proc.stdout.decode("ascii").strip()
    if decrypted != FLAG:
        sys.stderr.write(
            f"FAIL round-trip: got {decrypted!r} expected {FLAG!r}\n"
            f"stderr:\n{proc.stderr.decode()}\n")
        sys.exit(1)

print(f"wrote {OUT} ({OUT.stat().st_size} bytes)")
print(f"round-trip OK: decrypted == flag.txt -> {decrypted!r}")
