"""Cold-solve harness for ftp_then_ssh — replays the player's intended path:
1. Carve FTP creds + RETR'd blob from ftp.pcap
2. Decode USB-HID keystrokes from usb.pcap
3. Use the keystroke-extracted passphrase to AES-256-CBC-decrypt the FTP blob
4. Read the canonical flag from the decrypted shell history

Run:
  python build/cold_solve.py
"""
from __future__ import annotations

import hashlib
import re
from pathlib import Path

from scapy.all import Raw, TCP, rdpcap, PcapReader
from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes

ISLAND = Path(__file__).resolve().parent.parent

# --- step 1: ftp.pcap ------------------------------------------------------
ftp = rdpcap(str(ISLAND / "files" / "ftp.pcap"))
ctl = b""
data = b""
for p in ftp:
    if Raw in p and TCP in p:
        if p[TCP].dport == 21 or p[TCP].sport == 21:
            ctl += bytes(p[Raw].load)
        elif p[TCP].dport == 20 or p[TCP].sport == 20:
            data += bytes(p[Raw].load)

ctl_text = ctl.decode(errors="replace")
print("[player] ftp control stream:")
for line in ctl_text.split("\r\n"):
    if line:
        print("   ", line)
m_user = re.search(r"USER (\S+)", ctl_text)
m_pass = re.search(r"PASS (\S+)", ctl_text)
print(f"\n[player] FTP credentials: {m_user.group(1)} / {m_pass.group(1)}")
print(f"[player] data-stream blob: {len(data)} bytes, prefix={data[:8]}")
assert data.startswith(b"Salted__")

# --- step 2: usb.pcap → keystrokes ----------------------------------------
HID_TABLE = {0x04 + i: chr(ord("a") + i) for i in range(26)}
HID_TABLE.update({0x1E + i: str((i + 1) % 10) for i in range(10)})
HID_TABLE.update({
    0x28: "\n", 0x29: "ESC", 0x2A: "BS", 0x2B: "\t", 0x2C: " ",
    0x2D: "-", 0x2E: "=", 0x2F: "[", 0x30: "]", 0x31: "\\",
    0x33: ";", 0x34: "'", 0x35: "`", 0x36: ",", 0x37: ".", 0x38: "/",
})
SHIFTED = {
    "-": "_", "=": "+", "[": "{", "]": "}", "\\": "|",
    ";": ":", "'": '"', ",": "<", ".": ">", "/": "?", "`": "~",
    "1": "!", "2": "@", "3": "#", "4": "$", "5": "%",
    "6": "^", "7": "&", "8": "*", "9": "(", "0": ")",
}

typed: list[str] = []
# scapy doesn't have a built-in dissector for USBPCAP linktype 249, so we read
# packets as Raw and skip the 27-byte USBPCAP header to get to the HID report.
USBPCAP_HEADER_LEN = 27
for p in PcapReader(str(ISLAND / "files" / "usb.pcap")):
    if Raw not in p:
        continue
    raw = bytes(p[Raw].load)
    if len(raw) < USBPCAP_HEADER_LEN + 8:
        continue
    payload = raw[USBPCAP_HEADER_LEN:]
    mod = payload[0]
    key = payload[2]
    if key == 0:
        continue
    ch = HID_TABLE.get(key)
    if ch is None:
        continue
    if mod & 0x02:  # shift
        if ch in SHIFTED:
            ch = SHIFTED[ch]
        elif ch.isalpha():
            ch = ch.upper()
    if ch == "BS" and typed:
        typed.pop()
    elif ch in ("ESC",):
        pass
    else:
        typed.append(ch)

typed_str = "".join(typed).strip()
print(f"\n[player] decoded usb keystrokes:\n  {typed_str!r}")
m_pass_ssl = re.search(r"-k '([^']+)'", typed_str)
assert m_pass_ssl, "could not extract OpenSSL passphrase from keystrokes"
passphrase = m_pass_ssl.group(1).encode()
print(f"\n[player] recovered OpenSSL passphrase: {passphrase!r}")

# --- step 3: decrypt the blob ---------------------------------------------
def evp_bytes_to_key(passphrase: bytes, salt: bytes, kl: int = 32, il: int = 16):
    d, b = b"", b""
    while len(d) < kl + il:
        b = hashlib.md5(b + passphrase + salt).digest()
        d += b
    return d[:kl], d[kl : kl + il]


salt = data[8:16]
ct = data[16:]
key, iv = evp_bytes_to_key(passphrase, salt)
dec = Cipher(algorithms.AES(key), modes.CBC(iv), backend=default_backend()).decryptor()
pt = dec.update(ct) + dec.finalize()
pt = pt[: -pt[-1]]

flag_lines = [l for l in pt.decode().splitlines() if "progctf{" in l]
assert flag_lines, "no flag in decrypted shell history"
print("\n[player] decrypted shell_history.txt (last 5 lines):")
for line in pt.decode().splitlines()[-5:]:
    print("   ", line)
print(f"\nRECOVERED: {flag_lines[0].strip()}")
