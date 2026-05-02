"""Build script for ftp_then_ssh — produces files/ftp.pcap, files/usb.pcap, files/MANIFEST.txt.

Two pcaps:
  ftp.pcap : cleartext FTP login (captain_thorne / bilgewater_sunset_71) followed by
             a binary RETR of shell_history.txt.enc (OpenSSL AES-256-CBC encrypted).
  usb.pcap : USB-HID keyboard interrupt-IN frames typing the openssl decrypt command.

Determinism:
  - hist.txt content (including the flag-bearing echo line) is fixed verbatim.
  - OpenSSL salt + IV derivation is via EVP_BytesToKey(MD5) on a fixed salt derived
    from a SHA-256-counter PRG seeded by the flag.
  - Pcap timestamps and TCP sequence numbers are derived from the same PRG.
  Two builds produce byte-identical artifacts.

OpenSSL passphrase: 'wraith_above_the_waves' — appears ONLY in the keystrokes typed in
usb.pcap. Never appears in ftp.pcap or any artifact.
"""
from __future__ import annotations

import hashlib
import struct
from pathlib import Path

from scapy.all import (
    Ether, IP, TCP, Raw, wrpcap, PcapWriter,
)
from scapy.layers.usb import USBpcap, USBpcapTransferIsochronous

ISLAND = Path(__file__).resolve().parent.parent
OUT = ISLAND / "files"
OUT.mkdir(exist_ok=True)
flag = (ISLAND / "flag.txt").read_text(encoding="utf-8").strip()


def make_rng(seed: bytes):
    counter = [0]
    def randbytes(n: int) -> bytes:
        out = b""
        while len(out) < n:
            out += hashlib.sha256(seed + counter[0].to_bytes(8, "big")).digest()
            counter[0] += 1
        return out[:n]
    return randbytes


rng = make_rng(b"ftp_then_ssh|" + flag.encode("utf-8"))


# ---- shell history payload --------------------------------------------------
# Embedded flag is the LAST echo line. Surrounding history is realistic.
hist_lines = [
    "ls -la /home/captain_thorne",
    "cat /etc/issue",
    "ssh -i ~/.ssh/id_rsa pilot@gallowstide.lan",
    "exit",
    "cd /tmp && ls",
    "rm -f core.* *.bak",
    "df -h",
    "free -m",
    "ps aux | grep ssh",
    "tail -50 /var/log/auth.log",
    "openssl version",
    "openssl enc -aes-256-cbc -k 'wraith_above_the_waves' -in /tmp/notes.txt -out /tmp/notes.enc",
    "rm /tmp/notes.txt",
    "scp /tmp/notes.enc pilot@gallowstide.lan:/var/anchor/",
    "history -c",
    f"echo '{flag}' >> /root/.note",
    "shutdown -h +5 'maintenance window'",
]
hist_bytes = ("\n".join(hist_lines) + "\n").encode("utf-8")


# ---- OpenSSL EVP_BytesToKey (MD5) + AES-256-CBC encrypt ---------------------
def evp_bytes_to_key(passphrase: bytes, salt: bytes, key_len: int = 32, iv_len: int = 16) -> tuple[bytes, bytes]:
    derived = b""
    block = b""
    while len(derived) < key_len + iv_len:
        block = hashlib.md5(block + passphrase + salt).digest()
        derived += block
    return derived[:key_len], derived[key_len : key_len + iv_len]


def pkcs7(b: bytes, block: int = 16) -> bytes:
    pad = block - (len(b) % block)
    return b + bytes([pad]) * pad


PASSPHRASE = b"wraith_above_the_waves"
salt = rng(8)
key, iv = evp_bytes_to_key(PASSPHRASE, salt)

from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.backends import default_backend
cipher = Cipher(algorithms.AES(key), modes.CBC(iv), backend=default_backend())
enc = cipher.encryptor()
ct = enc.update(pkcs7(hist_bytes)) + enc.finalize()
openssl_blob = b"Salted__" + salt + ct
print(f"[ftp_then_ssh] openssl blob: {len(openssl_blob)} bytes (Salted__ + 8-salt + ct)")

# Sanity: round-trip decrypt
decryptor = Cipher(algorithms.AES(key), modes.CBC(iv), backend=default_backend()).decryptor()
recovered_padded = decryptor.update(ct) + decryptor.finalize()
pad_len = recovered_padded[-1]
recovered = recovered_padded[:-pad_len]
assert recovered == hist_bytes
assert flag.encode() in recovered


# ---- ftp.pcap: build TCP sessions in scapy ---------------------------------
CLIENT_IP = "10.20.30.5"
SERVER_IP = "10.20.30.40"
CLIENT_MAC = "02:42:0a:14:1e:05"
SERVER_MAC = "02:42:0a:14:1e:28"

CONTROL_CPORT = 49200
CONTROL_SPORT = 21
DATA_CPORT = 49201
DATA_SPORT = 20  # active mode for simplicity

# helper: emit a TCP segment with optional payload, advance seqs
class TcpFlow:
    def __init__(self, src_ip, dst_ip, src_mac, dst_mac, src_port, dst_port, isn_c, isn_s, ts_start):
        self.src_ip, self.dst_ip = src_ip, dst_ip
        self.src_mac, self.dst_mac = src_mac, dst_mac
        self.src_port, self.dst_port = src_port, dst_port
        self.seq_c = isn_c
        self.seq_s = isn_s
        self.ts = ts_start
        self.frames = []

    def _frame(self, src_ip, dst_ip, src_mac, dst_mac, sport, dport, seq, ack, flags, payload=b""):
        pkt = (
            Ether(src=src_mac, dst=dst_mac) /
            IP(src=src_ip, dst=dst_ip, ttl=64) /
            TCP(sport=sport, dport=dport, seq=seq, ack=ack, flags=flags, window=65535)
        )
        if payload:
            pkt = pkt / Raw(load=payload)
        pkt.time = self.ts
        self.ts += 0.001
        return pkt

    def handshake(self):
        # SYN
        self.frames.append(self._frame(self.src_ip, self.dst_ip, self.src_mac, self.dst_mac,
                                       self.src_port, self.dst_port, self.seq_c, 0, "S"))
        self.seq_c += 1
        # SYN-ACK
        self.frames.append(self._frame(self.dst_ip, self.src_ip, self.dst_mac, self.src_mac,
                                       self.dst_port, self.src_port, self.seq_s, self.seq_c, "SA"))
        self.seq_s += 1
        # ACK
        self.frames.append(self._frame(self.src_ip, self.dst_ip, self.src_mac, self.dst_mac,
                                       self.src_port, self.dst_port, self.seq_c, self.seq_s, "A"))

    def client_sends(self, payload: bytes):
        self.frames.append(self._frame(self.src_ip, self.dst_ip, self.src_mac, self.dst_mac,
                                       self.src_port, self.dst_port, self.seq_c, self.seq_s, "PA", payload))
        self.seq_c += len(payload)
        # ACK from server
        self.frames.append(self._frame(self.dst_ip, self.src_ip, self.dst_mac, self.src_mac,
                                       self.dst_port, self.src_port, self.seq_s, self.seq_c, "A"))

    def server_sends(self, payload: bytes):
        self.frames.append(self._frame(self.dst_ip, self.src_ip, self.dst_mac, self.src_mac,
                                       self.dst_port, self.src_port, self.seq_s, self.seq_c, "PA", payload))
        self.seq_s += len(payload)
        # ACK from client
        self.frames.append(self._frame(self.src_ip, self.dst_ip, self.src_mac, self.dst_mac,
                                       self.src_port, self.dst_port, self.seq_c, self.seq_s, "A"))

    def fin_close(self):
        # FIN from client
        self.frames.append(self._frame(self.src_ip, self.dst_ip, self.src_mac, self.dst_mac,
                                       self.src_port, self.dst_port, self.seq_c, self.seq_s, "FA"))
        self.seq_c += 1
        # ACK + FIN from server
        self.frames.append(self._frame(self.dst_ip, self.src_ip, self.dst_mac, self.src_mac,
                                       self.dst_port, self.src_port, self.seq_s, self.seq_c, "FA"))
        self.seq_s += 1
        self.frames.append(self._frame(self.src_ip, self.dst_ip, self.src_mac, self.dst_mac,
                                       self.src_port, self.dst_port, self.seq_c, self.seq_s, "A"))


# Control channel: USER / PASS / TYPE / PORT / RETR + responses
isn_c = int.from_bytes(rng(4), "big")
isn_s = int.from_bytes(rng(4), "big")
control = TcpFlow(CLIENT_IP, SERVER_IP, CLIENT_MAC, SERVER_MAC, CONTROL_CPORT, CONTROL_SPORT, isn_c, isn_s, 1735689600.0)
control.handshake()
control.server_sends(b"220 Marrowtide FTPd 4.2 ready.\r\n")
control.client_sends(b"USER captain_thorne\r\n")
control.server_sends(b"331 Password required for captain_thorne.\r\n")
control.client_sends(b"PASS bilgewater_sunset_71\r\n")
control.server_sends(b"230 User captain_thorne logged in.\r\n")
control.client_sends(b"TYPE I\r\n")
control.server_sends(b"200 Type set to I.\r\n")
# Active-mode PORT command instead of PASV. Keeps the data port well-defined for
# the data flow we set up below. The PORT argument encodes 10.20.30.5:DATA_CPORT
# (DATA_CPORT = 49201 = 192*256+9).
data_port_high = DATA_CPORT >> 8
data_port_low = DATA_CPORT & 0xFF
control.client_sends(f"PORT 10,20,30,5,{data_port_high},{data_port_low}\r\n".encode())
control.server_sends(b"200 PORT command successful.\r\n")
control.client_sends(b"RETR shell_history.txt.enc\r\n")
control.server_sends(f"150 Opening BINARY mode data connection for shell_history.txt.enc ({len(openssl_blob)} bytes).\r\n".encode())

# --- data channel: server connects to client (active mode) → carries openssl_blob
data_isn_c = int.from_bytes(rng(4), "big")
data_isn_s = int.from_bytes(rng(4), "big")
# Active mode: server is the one initiating; flip flow direction.
data = TcpFlow(SERVER_IP, CLIENT_IP, SERVER_MAC, CLIENT_MAC, DATA_SPORT, DATA_CPORT, data_isn_c, data_isn_s, control.ts + 0.05)
data.handshake()
data.client_sends(openssl_blob)  # "client" of this TcpFlow is the server (data sender)
data.fin_close()

# Continue control: 226 transfer complete + QUIT
control.ts = data.ts + 0.05
control.server_sends(b"226 Transfer complete.\r\n")
control.client_sends(b"QUIT\r\n")
control.server_sends(b"221 Goodbye.\r\n")
control.fin_close()

ftp_pkts = control.frames + data.frames
ftp_pkts.sort(key=lambda p: float(p.time))
wrpcap(str(OUT / "ftp.pcap"), ftp_pkts)
print(f"[ftp_then_ssh] ftp.pcap: {len(ftp_pkts)} frames")


# ---- usb.pcap: USBPcap-format keystroke capture ----------------------------
# Standard en-US HID keycodes
HID = {
    'a': 0x04, 'b': 0x05, 'c': 0x06, 'd': 0x07, 'e': 0x08, 'f': 0x09, 'g': 0x0a,
    'h': 0x0b, 'i': 0x0c, 'j': 0x0d, 'k': 0x0e, 'l': 0x0f, 'm': 0x10, 'n': 0x11,
    'o': 0x12, 'p': 0x13, 'q': 0x14, 'r': 0x15, 's': 0x16, 't': 0x17, 'u': 0x18,
    'v': 0x19, 'w': 0x1a, 'x': 0x1b, 'y': 0x1c, 'z': 0x1d,
    '1': 0x1e, '2': 0x1f, '3': 0x20, '4': 0x21, '5': 0x22, '6': 0x23, '7': 0x24,
    '8': 0x25, '9': 0x26, '0': 0x27,
    '\n': 0x28, 'ESC': 0x29, 'BS': 0x2a, '\t': 0x2b, ' ': 0x2c,
    '-': 0x2d, '=': 0x2e, '[': 0x2f, ']': 0x30, '\\': 0x31,
    ';': 0x33, "'": 0x34, '`': 0x35, ',': 0x36, '.': 0x37, '/': 0x38,
}
# Shifted keys → (modifier, base keycode)
SHIFT_MAP = {
    '_': ('-',), ':': (';',), '"': ("'",), '?': ('/',), '~': ('`',),
    '!': ('1',), '@': ('2',), '#': ('3',), '$': ('4',), '%': ('5',),
    '^': ('6',), '&': ('7',), '*': ('8',), '(': ('9',), ')': ('0',),
    '<': (',',), '>': ('.',), '{': ('[',), '}': (']',), '|': ('\\',), '+': ('=',),
}
# Capital letters are shift+letter
for c in "ABCDEFGHIJKLMNOPQRSTUVWXYZ":
    SHIFT_MAP[c] = (c.lower(),)

def hid_report(modifier: int, key: int) -> bytes:
    return bytes([modifier, 0, key, 0, 0, 0, 0, 0])

def keystroke_reports(text: str, with_typo: bool = False):
    """Yield 8-byte HID reports for typing `text` plus key-release reports."""
    for ch in text:
        if ch in SHIFT_MAP:
            base = SHIFT_MAP[ch][0]
            keycode = HID[base]
            modifier = 0x02  # left shift
        elif ch in HID:
            keycode = HID[ch]
            modifier = 0
        else:
            continue
        yield hid_report(modifier, keycode)
        yield hid_report(0, 0)  # key up


# Captain types the openssl decrypt command, with one corrected typo for realism.
text_to_type = "openssl enc -d -aes-256-cbc -in shell_history.txt.enc -k 'wraith_above_the_waves'\n"

reports: list[bytes] = []
# Sprinkle in one typo: type 'openssl' as 'opemssl', backspace twice, type 'nssl'
reports.extend(list(keystroke_reports("opem")))   # typo: 'm' instead of 'n'
# backspace
reports.append(hid_report(0, HID['BS'])); reports.append(hid_report(0, 0))
reports.extend(list(keystroke_reports("nssl enc -d -aes-256-cbc -in shell_history.txt.enc -k 'wraith_above_the_waves'\n")))


# Build USBPcap-format frames using scapy. Standard HID keyboard interrupt-IN
# transfer to endpoint 0x81 (IN bit + ep1) on device 5 / bus 1.
USBPCAP_LINKTYPE = 249
usb_pkts = []
ts = 1735689700.0
irp_id = 0x1000
for i, payload in enumerate(reports):
    pkt = USBpcap(
        headerLen=27,
        irpId=irp_id + i,
        usbd_status=0,
        function=9,    # URB_FUNCTION_BULK_OR_INTERRUPT_TRANSFER
        info=0x01,     # PDO
        bus=1,
        device=5,
        endpoint=0x81, # IN, ep 1
        transfer=1,    # interrupt
        dataLength=len(payload),
    ) / Raw(load=payload)
    pkt.time = ts
    ts += 0.02
    usb_pkts.append(pkt)


# wrpcap with explicit linktype
writer = PcapWriter(str(OUT / "usb.pcap"), linktype=USBPCAP_LINKTYPE, sync=True)
for p in usb_pkts:
    writer.write(p)
writer.close()
print(f"[ftp_then_ssh] usb.pcap: {len(usb_pkts)} frames (USBPCAP linktype 249)")


# ---- manifest --------------------------------------------------------------
manifest = (
    "Two Pcaps, One Boarding — player-served files\n"
    "================================================\n"
    "ftp.pcap   — cleartext FTP session (port 21 control + 20 data)\n"
    "             Captain logs in and downloads shell_history.txt.enc.\n"
    "             The encrypted blob format is OpenSSL `enc -aes-256-cbc`\n"
    "             with the standard `Salted__` + 8-byte salt + ct layout.\n"
    "usb.pcap   — USB-HID keyboard capture (USBPCAP link-type 249).\n"
    "             Decode with Wireshark + en-US HID keymap or tshark fields.\n"
)
(OUT / "MANIFEST.txt").write_text(manifest, encoding="utf-8")
print(f"[ftp_then_ssh] build OK")
