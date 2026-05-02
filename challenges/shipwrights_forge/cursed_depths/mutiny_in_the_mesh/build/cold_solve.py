"""Cold-solve harness for mutiny_in_the_mesh.

Replays the player's intended solve path:

1. Compare frame counts across the 4 buoy pcaps. BUOY_C carries strictly more
   packets than the others — that's the rogue.
2. (RE step, simulated) Recover the per-buoy SEED constants and the
   serialize_packet protocol from the stripped buoy.elf. Here we use the
   ground-truth constants from build/firmware.c since the ELF compile is
   deferred to a Linux pass.
3. For BUOY_C only: decrypt every frame's payload using
   key_i = (SEED + seq * 0x9E3779B1) & 0xFFFFFFFF
   and split into "mundane sensor JSON" vs "covert" by payload structure.
   The covert packets are exactly 2 bytes (1 data + 1 CRC8) and CRC-validate.
4. Sort covert packets by seq, concatenate the data bytes, and look for the
   "EXEC <flag>" prefix.

Run:
  python build/cold_solve.py
"""
from __future__ import annotations

from pathlib import Path

from scapy.all import Raw, UDP, rdpcap

ISLAND = Path(__file__).resolve().parent.parent
FILES = ISLAND / "files"

# Ground-truth from build/firmware.c — in real play the player recovers these
# from the stripped ELF's .rodata (BUOY_SEEDS table adjacent to BUOY_X_NAME
# strings).
BUOY_SEEDS = {
    "BUOY_A": 0xCAFEBABE,
    "BUOY_B": 0xDEADBEEF,
    "BUOY_C": 0xFACEFEED,  # rogue
    "BUOY_D": 0xBADC0FFE,
}

PCAPS = {
    "BUOY_A": FILES / "buoy_a.pcap",
    "BUOY_B": FILES / "buoy_b.pcap",
    "BUOY_C": FILES / "buoy_c.pcap",
    "BUOY_D": FILES / "buoy_d.pcap",
}


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


def deserialize(frame: bytes, seed: int):
    """Returns (seq, payload) or None on bad header/length."""
    if len(frame) < 4:
        return None
    plen = frame[0] | (frame[1] << 8)
    seq = frame[2] | (frame[3] << 8)
    if len(frame) != 4 + plen:
        return None
    k = (seed + seq * 0x9E3779B1) & 0xFFFFFFFF
    key = k.to_bytes(4, "little")
    body = frame[4:]
    payload = bytes(body[i] ^ key[i & 3] for i in range(plen))
    return seq, payload


# --- step 1: frame-count anomaly -----------------------------------------
print("[player] frame counts per buoy pcap:")
counts = {}
for name, path in PCAPS.items():
    pkts = rdpcap(str(path))
    counts[name] = len(pkts)
    print(f"    {name}: {len(pkts):>4} frames  ({path.name})")

baseline = min(counts.values())
anomalous = [n for n, c in counts.items() if c != baseline]
assert len(anomalous) == 1, f"expected exactly 1 outlier buoy, got {anomalous}"
rogue = anomalous[0]
extra = counts[rogue] - baseline
print(f"[player] anomaly: {rogue} carries {extra} extra packets vs baseline {baseline}")

# --- step 2+3: decrypt rogue payloads, separate covert ---------------------
seed = BUOY_SEEDS[rogue]
print(f"[player] using SEED 0x{seed:08X} for {rogue} (recovered from buoy.elf .rodata)")

pkts = rdpcap(str(PCAPS[rogue]))
mundane = []
covert = []
for p in pkts:
    if UDP not in p or Raw not in p:
        continue
    frame = bytes(p[Raw].load)
    res = deserialize(frame, seed)
    if res is None:
        continue
    seq, payload = res
    # Mundane sensor JSON is a long printable string ('{...}').
    # Covert frames are exactly 2 bytes — 1 data byte + 1 CRC8 trailer —
    # so length+CRC is a strong structural signal regardless of the byte's value.
    if len(payload) == 2 and crc8(payload[:1]) == payload[1]:
        covert.append((seq, payload[0]))
    else:
        mundane.append((seq, payload))

print(f"[player] {rogue}: {len(mundane)} mundane sensor frames, {len(covert)} valid covert frames")
assert len(covert) == extra, f"covert count {len(covert)} != extra count {extra}"

# --- step 4: reassemble in seq order ---------------------------------------
covert.sort(key=lambda t: t[0])
seq_min = covert[0][0]
seq_max = covert[-1][0]
print(f"[player] covert seq range: {seq_min}..{seq_max} ({seq_max - seq_min + 1} slots, {len(covert)} kept)")

# Assemble byte stream. Missing seq slots become '?' so the player can see gaps.
slots = {seq: chr(b) for seq, b in covert}
stream = "".join(slots.get(s, "?") for s in range(seq_min, seq_max + 1))
print(f"[player] reassembled covert stream:\n  {stream!r}")

assert stream.startswith("EXEC "), f"covert stream missing EXEC prefix: {stream[:40]!r}"
flag_part = stream[len("EXEC "):]
# stop at first '\n' if present, else at the trailing pad delimiters
if "\n" in flag_part:
    flag_part = flag_part.split("\n", 1)[0]
flag_part = flag_part.strip()
print(f"\nRECOVERED: {flag_part}")

# --- sanity: decode mundane JSON from buoy_a as a smoke test --------------
import json
pkts_a = rdpcap(str(PCAPS["BUOY_A"]))
seed_a = BUOY_SEEDS["BUOY_A"]
sample = None
for p in pkts_a[:5]:
    if UDP not in p or Raw not in p:
        continue
    res = deserialize(bytes(p[Raw].load), seed_a)
    if res is None:
        continue
    seq, payload = res
    try:
        sample = json.loads(payload.decode("utf-8"))
        break
    except Exception:
        pass
print(f"[player] sanity: BUOY_A first JSON sensor frame: {sample}")
assert sample and sample.get("buoy") == "BUOY_A"
