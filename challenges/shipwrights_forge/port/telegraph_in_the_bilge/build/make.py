"""Build script for telegraph_in_the_bilge — produces files/bilge.pcap + MANIFEST.

Synthesizes a tiny Telnet (TCP/23) capture between two RFC1918 hosts. The flag
is typed character-by-character into a "Password:" prompt with normal Telnet
echo, so following the TCP stream in Wireshark reproduces the typed string
on the player's side.
"""
from __future__ import annotations

import hashlib
from pathlib import Path

from scapy.all import IP, TCP, Raw, Ether, wrpcap

ISLAND = Path(__file__).resolve().parent.parent
OUT = ISLAND / "files"
OUT.mkdir(exist_ok=True)

flag = (ISLAND / "flag.txt").read_text(encoding="utf-8").strip()

CLIENT = "10.13.37.5"
SERVER = "10.13.37.10"
SPORT = 49200
DPORT = 23

USERNAME = "bilge_qm"
BANNER = b"\xff\xfb\x01"  # tiny Telnet IAC WILL ECHO option exchange (one byte)
SERVER_GREETING = b"HMS Long Dread Boarding Console\r\nLogin: "
PASSWORD_PROMPT = b"Password: "
SUCCESS_MSG = b"Boarding granted. Welcome, bilge_qm.\r\n"


def make_pkt(src: str, dst: str, sport: int, dport: int,
             flags: str, seq: int, ack: int, payload: bytes = b"") -> "IP":
    pkt = (Ether(src="aa:00:00:00:00:01", dst="aa:00:00:00:00:02")
           / IP(src=src, dst=dst)
           / TCP(sport=sport, dport=dport, flags=flags, seq=seq, ack=ack))
    if payload:
        pkt = pkt / Raw(load=payload)
    return pkt


pkts: list = []

# Three-way handshake.
isn_c, isn_s = 1000, 5000
pkts.append(make_pkt(CLIENT, SERVER, SPORT, DPORT, "S", seq=isn_c, ack=0))
pkts.append(make_pkt(SERVER, CLIENT, DPORT, SPORT, "SA", seq=isn_s, ack=isn_c + 1))
pkts.append(make_pkt(CLIENT, SERVER, SPORT, DPORT, "A", seq=isn_c + 1, ack=isn_s + 1))

c_seq = isn_c + 1   # next bytes the client sends sit at this sequence number
s_seq = isn_s + 1

# Server: tiny option exchange + greeting + login prompt.
server_first = BANNER + SERVER_GREETING
pkts.append(make_pkt(SERVER, CLIENT, DPORT, SPORT, "PA",
                     seq=s_seq, ack=c_seq, payload=server_first))
s_seq += len(server_first)
pkts.append(make_pkt(CLIENT, SERVER, SPORT, DPORT, "A", seq=c_seq, ack=s_seq))

# Client types the username one character at a time, server echoes each.
for ch in (USERNAME + "\r\n").encode("ascii"):
    pkts.append(make_pkt(CLIENT, SERVER, SPORT, DPORT, "PA",
                         seq=c_seq, ack=s_seq, payload=bytes([ch])))
    c_seq += 1
    pkts.append(make_pkt(SERVER, CLIENT, DPORT, SPORT, "PA",
                         seq=s_seq, ack=c_seq, payload=bytes([ch])))
    s_seq += 1

# Server sends the password prompt.
pkts.append(make_pkt(SERVER, CLIENT, DPORT, SPORT, "PA",
                     seq=s_seq, ack=c_seq, payload=PASSWORD_PROMPT))
s_seq += len(PASSWORD_PROMPT)
pkts.append(make_pkt(CLIENT, SERVER, SPORT, DPORT, "A", seq=c_seq, ack=s_seq))

# Client types the FLAG one character at a time. Server echoes each
# (Telnet often suppresses echo on password prompts, but the spec asks for
#  echoing so following-the-stream surfaces the typed string).
for ch in (flag + "\r\n").encode("ascii"):
    pkts.append(make_pkt(CLIENT, SERVER, SPORT, DPORT, "PA",
                         seq=c_seq, ack=s_seq, payload=bytes([ch])))
    c_seq += 1
    pkts.append(make_pkt(SERVER, CLIENT, DPORT, SPORT, "PA",
                         seq=s_seq, ack=c_seq, payload=bytes([ch])))
    s_seq += 1

# Server: grant + connection teardown.
pkts.append(make_pkt(SERVER, CLIENT, DPORT, SPORT, "PA",
                     seq=s_seq, ack=c_seq, payload=SUCCESS_MSG))
s_seq += len(SUCCESS_MSG)
pkts.append(make_pkt(CLIENT, SERVER, SPORT, DPORT, "A", seq=c_seq, ack=s_seq))

# FIN/ACK both sides.
pkts.append(make_pkt(SERVER, CLIENT, DPORT, SPORT, "FA", seq=s_seq, ack=c_seq))
pkts.append(make_pkt(CLIENT, SERVER, SPORT, DPORT, "A", seq=c_seq, ack=s_seq + 1))
pkts.append(make_pkt(CLIENT, SERVER, SPORT, DPORT, "FA", seq=c_seq, ack=s_seq + 1))
pkts.append(make_pkt(SERVER, CLIENT, DPORT, SPORT, "A", seq=s_seq + 1, ack=c_seq + 1))

wrpcap(str(OUT / "bilge.pcap"), pkts)

# MANIFEST
manifest_lines: list[str] = []
for fname in sorted(p.name for p in OUT.iterdir() if p.name != "MANIFEST.txt"):
    data = (OUT / fname).read_bytes()
    sha = hashlib.sha256(data).hexdigest()
    manifest_lines.append(f"{fname}\tsize={len(data)}\tsha256={sha}")
manifest_lines.append("")
manifest_lines.append("# How to solve:")
manifest_lines.append("#   Wireshark: Analyze → Follow → TCP Stream — the password line IS the Treasure.")
manifest_lines.append("#   ... OR tshark -r bilge.pcap -q -z follow,tcp,ascii,0")
(OUT / "MANIFEST.txt").write_text("\n".join(manifest_lines) + "\n", encoding="utf-8")

# Verify: the client→server reassembled stream should contain the flag once.
client_payload = b"".join(
    bytes(p[Raw].load) for p in pkts
    if p.haslayer(Raw) and p[IP].src == CLIENT
)
flag_bytes = flag.encode("ascii")
assert client_payload.count(flag_bytes) == 1, f"flag appears {client_payload.count(flag_bytes)} times in client stream"
assert b"progctf" not in client_payload[:client_payload.find(flag_bytes)], "flag-shaped string appears before the password prompt"

print(f"OK telegraph_in_the_bilge built. pcap={(OUT / 'bilge.pcap').stat().st_size} bytes, packets={len(pkts)}")
