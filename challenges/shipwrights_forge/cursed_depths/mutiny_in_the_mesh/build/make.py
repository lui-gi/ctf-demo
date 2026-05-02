"""Build script for mutiny_in_the_mesh — produces 4 buoy pcaps.

The ARM Cortex-M4 firmware ELF (files/buoy.elf) is built separately from
build/firmware.c via arm-none-eabi-gcc. The Quartermaster's Windows host has no
arm-none-eabi toolchain on PATH, so this script ONLY produces the four pcaps;
the ELF compile is deferred to a Linux/WSL re-build pass. The pcaps are the
runtime output of the same protocol the firmware implements (Python reference
implementation lives in this script and matches firmware.c byte-for-byte).

Determinism:
  Sensor readings, packet drop set, and timeline shuffle are derived from a
  SHA-256-counter PRG seeded by ("mutiny_in_the_mesh|" + flag). Two builds
  produce byte-identical pcaps.
"""
from __future__ import annotations

import hashlib
import json
from pathlib import Path

from scapy.all import Ether, IP, UDP, Raw, wrpcap

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
    def randint(a: int, b: int) -> int:
        span = b - a + 1
        nb = max(1, ((span - 1).bit_length() + 7) // 8)
        while True:
            x = int.from_bytes(randbytes(nb), "big")
            if span > 0 and x < (1 << (span - 1).bit_length() if span > 1 else 1):
                return a + (x % span)
    def shuffle(seq):
        # Fisher-Yates with deterministic randint
        seq = list(seq)
        for i in range(len(seq) - 1, 0, -1):
            j = randint(0, i)
            seq[i], seq[j] = seq[j], seq[i]
        return seq
    return randbytes, randint, shuffle


randbytes, randint, shuffle = make_rng(b"mutiny_in_the_mesh|" + flag.encode("utf-8"))


# ---- protocol (mirrors firmware.c) ---------------------------------------
def serialize_packet(payload: bytes, seq: int, seed: int) -> bytes:
    plen = len(payload)
    header = bytes([plen & 0xFF, (plen >> 8) & 0xFF, seq & 0xFF, (seq >> 8) & 0xFF])
    k = (seed + seq * 0x9E3779B1) & 0xFFFFFFFF
    key = k.to_bytes(4, "little")
    obf = bytes(payload[i] ^ key[i & 3] for i in range(plen))
    return header + obf


def crc8(data: bytes) -> int:
    crc = 0
    for b in data:
        crc ^= b
        for _ in range(8):
            if crc & 0x80:
                crc = ((crc << 1) ^ 0x07) & 0xFF
            else:
                crc = (crc << 1) & 0xFF
    return crc


# ---- buoy fleet ---------------------------------------------------------
BUOYS = [
    ("BUOY_A", 0xCAFEBABE, "10.42.1.10"),
    ("BUOY_B", 0xDEADBEEF, "10.42.1.11"),
    ("BUOY_C", 0xFACEFEED, "10.42.1.12"),  # ROGUE
    ("BUOY_D", 0xBADC0FFE, "10.42.1.13"),
]
ROGUE_INDEX = 2  # BUOY_C
HARBORMASTER_IP = "10.42.0.1"
PORT = 8421
HM_MAC = "02:42:0a:2a:00:01"


def random_sensor_payload(seq: int, buoy_name: str) -> bytes:
    temp = 6.0 + (randint(-30, 30) / 10.0)
    tide = 1.5 + (randint(-50, 50) / 100.0)
    heading = randint(0, 359)
    obj = {"buoy": buoy_name, "seq": seq, "t": round(temp, 1), "tide": round(tide, 2), "hdg": heading}
    return json.dumps(obj, separators=(",", ":")).encode("utf-8")


# ---- rogue covert-channel payload ---------------------------------------
COVERT_TEXT = f"EXEC {flag}\n".encode("utf-8")
# Pad with realistic-looking padding chars after, so the channel is ~60
# packets total per spec. Each packet carries 1 ASCII byte + 1 CRC8 byte = 2 bytes.
COVERT_PAD = b" -- end --"
ALL_BYTES = COVERT_TEXT + COVERT_PAD
print(f"[mutiny] covert channel: {len(COVERT_TEXT)} flag bytes + {len(COVERT_PAD)} padding = {len(ALL_BYTES)} total")
NUM_EXTRA = 60
assert len(ALL_BYTES) <= NUM_EXTRA, f"covert payload {len(ALL_BYTES)} exceeds {NUM_EXTRA} packet budget"
# Pad with spaces to hit exactly NUM_EXTRA bytes
ALL_BYTES = ALL_BYTES + b" " * (NUM_EXTRA - len(ALL_BYTES))
assert len(ALL_BYTES) == NUM_EXTRA

# Build the 60 covert packets: each is [1-byte data, 1-byte CRC8]
COVERT_SEQ_START = 1000
covert_packets: list[tuple[int, bytes]] = []
for i, byte in enumerate(ALL_BYTES):
    seq = COVERT_SEQ_START + i
    data = bytes([byte])
    payload = data + bytes([crc8(data)])
    covert_packets.append((seq, payload))

# Drop ~6 random covert packets, but NEVER drop a flag-bearing one. Flag bytes
# are at indices 0..(len(COVERT_TEXT)-1).
flag_byte_indices = set(range(len(COVERT_TEXT)))
droppable = [i for i in range(NUM_EXTRA) if i not in flag_byte_indices]
drop_set: set[int] = set()
while len(drop_set) < 6:
    pick = droppable[randint(0, len(droppable) - 1)]
    drop_set.add(pick)
covert_packets_kept = [pkt for i, pkt in enumerate(covert_packets) if i not in drop_set]
print(f"[mutiny] covert: {NUM_EXTRA} -> {len(covert_packets_kept)} after dropping {len(drop_set)} non-flag packets")


# ---- emit pcaps ---------------------------------------------------------
def emit_pcap(buoy_idx: int, ts_start: float):
    name, seed, src_ip = BUOYS[buoy_idx]
    src_mac = f"02:42:0a:2a:01:{10 + buoy_idx:02x}"

    rows: list[tuple[float, bytes]] = []
    # 200 mundane sensor packets, seq 0..199
    for seq in range(200):
        payload = random_sensor_payload(seq, name)
        frame = serialize_packet(payload, seq, seed)
        ts = ts_start + seq * 0.5  # one packet every 500 ms
        rows.append((ts, frame))

    if buoy_idx == ROGUE_INDEX:
        # interleave the kept covert packets at random times within the timeline
        ts_min = ts_start + 5.0
        ts_max = ts_start + 95.0
        covert_with_ts = []
        for seq, raw_payload in covert_packets_kept:
            ts = ts_min + (randint(0, 9000) / 100.0)  # random in [ts_min, ts_max]
            ts = min(ts, ts_max)
            frame = serialize_packet(raw_payload, seq, seed)
            covert_with_ts.append((ts, frame))
        rows += covert_with_ts

    # Sort by timestamp (timeline order; seq is NOT preserved).
    rows.sort(key=lambda r: r[0])

    pkts = []
    for ts, frame in rows:
        pkt = (
            Ether(src=src_mac, dst=HM_MAC) /
            IP(src=src_ip, dst=HARBORMASTER_IP, ttl=64) /
            UDP(sport=randint(40000, 60000), dport=PORT) /
            Raw(load=frame)
        )
        pkt.time = ts
        pkts.append(pkt)
    return pkts


for i, (name, _, _) in enumerate(BUOYS):
    pkts = emit_pcap(i, 1735689600.0)
    out_path = OUT / f"buoy_{name[-1].lower()}.pcap"
    wrpcap(str(out_path), pkts)
    print(f"[mutiny] {out_path.name}: {len(pkts)} frames ({out_path.stat().st_size} bytes)")


# ---- placeholder for files/buoy.elf -------------------------------------
# The ARM Cortex-M4 ELF requires arm-none-eabi-gcc which is not available on
# this host. Ship a compile-pending stub explaining the gap; a Linux/WSL
# re-build pass replaces this with the actual stripped ELF.
elf_stub = OUT / "buoy.elf.NOT_BUILT"
elf_stub.write_text(
    "BUILD-DEFERRED: arm-none-eabi-gcc not available on the Quartermaster's Windows\n"
    "host. The buoy firmware C source lives at build/firmware.c. To produce the\n"
    "shipped artifact files/buoy.elf, run:\n\n"
    "  arm-none-eabi-gcc -mcpu=cortex-m4 -mthumb -nostdlib -ffreestanding -Os \\\n"
    "                    -fno-toplevel-reorder -o files/buoy.elf build/firmware.c\n"
    "  arm-none-eabi-strip --strip-all files/buoy.elf\n\n"
    "Quartermaster: this stub MUST be removed and replaced by the real ELF before\n"
    "the bundle ships. See the Quartermaster follow-up note in solution.md.\n",
    encoding="utf-8",
)


manifest = (
    "Mutiny in the Mesh — player-served files\n"
    "==========================================\n"
    "buoy.elf            — ARM Cortex-M4 firmware (stripped). Reverse to recover\n"
    "                      the wire protocol and the per-buoy SEED constants.\n"
    "buoy_a.pcap         — UDP/8421 traffic from BUOY_A\n"
    "buoy_b.pcap         — UDP/8421 traffic from BUOY_B\n"
    "buoy_c.pcap         — UDP/8421 traffic from BUOY_C\n"
    "buoy_d.pcap         — UDP/8421 traffic from BUOY_D\n"
    "All pcaps record the harbormaster receiving sensor reports from the mesh.\n"
    "One of the buoys carries traffic the rest do not. That is your starting\n"
    "point.\n"
)
(OUT / "MANIFEST.txt").write_text(manifest, encoding="utf-8")

print("[mutiny] build OK (pcaps only — buoy.elf BUILD-DEFERRED)")
