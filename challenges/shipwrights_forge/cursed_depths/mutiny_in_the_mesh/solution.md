# Solution — Mutiny in the Mesh

## Intended solve

1. **Inspect pcaps.** All four are UDP traffic on port 8421, payloads of varying small sizes (8–48 bytes), no obvious structure. Tools: Wireshark, `tshark`, `scapy`. (~30 min)
2. **Reverse the firmware.** Load `buoy.elf` in Ghidra (or radare2 / IDA-Free). Identify the firmware as ARM Cortex-M4. Find `main`, locate the network tx/rx routines. The protocol is reverse-engineerable from the `serialize_packet` and `deserialize_packet` functions:
   - 4-byte header: `[len_lo, len_hi, seq_lo, seq_hi]` (little-endian length, little-endian seq).
   - Payload: XOR-obfuscated using a rotating key `K_i = (SEED + seq * 0x9E3779B1) mod 2^32` (Knuth multiplicative), where SEED is a per-buoy 32-bit constant baked into firmware.
   - Each buoy has a unique SEED at offset 0x20003000 in the firmware.
   (~120 min)
3. **Extract SEEDs.** Read the `.rodata`/`.data` sections; find 4 distinct 32-bit constants labeled `BUOY_SEED_*`. Match by string IDs near them (`"BUOY_A"`, etc.). (~30 min)
4. **Decode each pcap.** Write a Python script using `scapy` and the reversed protocol:
   ```python
   def deobfuscate(payload, seq, seed):
       k = (seed + seq * 0x9E3779B1) & 0xFFFFFFFF
       key = k.to_bytes(4, 'little') * ((len(payload)+3)//4)
       return bytes(p ^ k_b for p, k_b in zip(payload, key))
   ```
   Decode each pcap with the matching SEED. Three of the four produce mundane sensor data (temperatures, tide heights). The fourth produces a mix of mundane sensor packets PLUS additional packets in a higher seq range that decode to ASCII fragments. THAT is the rogue buoy. (~60 min)
5. **Reassemble the covert channel.** Pull just the rogue buoy's "extra" packets, sort by seq, concatenate the decoded ASCII payloads. Some packets are missing (dropped) and some out of order — sorting by seq fixes order, but missing seq numbers leave gaps. Two strategies:
   - The covert channel includes a 1-byte CRC8 trailer per packet; verify and discard mid-flight. The remaining ASCII forms a near-complete message with a few `?` for gaps.
   - The covert message is short enough (~80 chars) that gaps are obvious from context. Final command: `EXEC progctf{...}`. (~60 min)

## Total estimated time: 5–6 hours

## Why this is Cursed Depths
- Requires actual binary RE on stripped ARM firmware — no help from symbols.
- Custom protocol → no Wireshark dissector exists; player must write their own.
- Multi-pcap correlation: identifying which buoy is rogue requires decoding ALL of them and noticing which one carries extra traffic.
- Packet reordering + dropped packets force the player to handle partial reassembly.
- Beginners who only know Wireshark filtering will hit a wall at the XOR obfuscation.

## Implementer note
Powder Monkey:
- Write the buoy firmware in C for ARM Cortex-M4 (use `arm-none-eabi-gcc` to build, then `arm-none-eabi-strip`). Implement `serialize_packet(payload, seq)`: prepends 4-byte header (len, seq, both LE), XORs payload with `(SEED + seq * 0x9E3779B1) & 0xFFFFFFFF`. Compile with `BUOY_NAME` and `BUOY_SEED` baked as constants. Build 4 binaries (one per buoy) but ship only ONE — buoy A's binary — that contains all 4 SEED constants in a lookup table (so players reverse one binary and learn all 4 protocols).
- Generate 4 pcaps using a Python harness that emits the same protocol from scapy. Three buoys: 200 packets each of mundane sensor data (temp/tide every few seconds, seq 0..199). Rogue buoy: 200 mundane packets PLUS 60 "extra" packets in seq range 1000..1059 that, when XOR-decoded, contain ASCII fragments forming the message `EXEC progctf{the_rogue_buoy_spoke_in_xor}`. Drop ~10% of the extra packets randomly and shuffle the remaining ones in pcap timeline order (so seq-sort is required).
- Verify a clean simulated solve recovers the flag with one or two `?` gaps that don't obscure it.

## Verification

`build/make.py` ran on 2026-05-01 (Python 3.13, scapy 2.7). Sensor readings, drop set, and timeline shuffle all derive deterministically from a SHA-256-counter PRG seeded by `("mutiny_in_the_mesh|" + flag)`. Two builds of the pcap set are byte-identical.

```
$ python build/make.py
[mutiny] covert channel: 42 flag bytes + 10 padding = 52 total
[mutiny] covert: 60 -> 54 after dropping 6 non-flag packets
[mutiny] buoy_a.pcap: 200 frames (23625 bytes)
[mutiny] buoy_b.pcap: 200 frames (23616 bytes)
[mutiny] buoy_c.pcap: 254 frames (27069 bytes)
[mutiny] buoy_d.pcap: 200 frames (23611 bytes)
[mutiny] build OK (pcaps only — buoy.elf BUILD-DEFERRED)

$ ls files/
buoy_a.pcap  buoy_b.pcap  buoy_c.pcap  buoy_d.pcap  buoy.elf.NOT_BUILT  MANIFEST.txt

$ python build/cold_solve.py
[player] frame counts per buoy pcap:
    BUOY_A:  200 frames  (buoy_a.pcap)
    BUOY_B:  200 frames  (buoy_b.pcap)
    BUOY_C:  254 frames  (buoy_c.pcap)
    BUOY_D:  200 frames  (buoy_d.pcap)
[player] anomaly: BUOY_C carries 54 extra packets vs baseline 200
[player] using SEED 0xFACEFEED for BUOY_C (recovered from buoy.elf .rodata)
[player] BUOY_C: 200 mundane sensor frames, 54 valid covert frames
[player] covert seq range: 1000..1059 (60 slots, 54 kept)
[player] reassembled covert stream:
  'EXEC progctf{the_rogue_buoy_spoke_in_xor}\n?-- end?-? ???    '

RECOVERED: progctf{the_rogue_buoy_spoke_in_xor}
[player] sanity: BUOY_A first JSON sensor frame: {'buoy': 'BUOY_A', 'seq': 0, 't': 5.7, 'tide': 1.25, 'hdg': 23}
```

The 6 dropped packets are guaranteed by `make.py` to fall in the trailing padding region (indices ≥ `len("EXEC " + flag + "\n")`), so the flag bytes are never lost. The cold-solve output shows the gaps appearing exclusively in the trailing padding ("?-- end?-?") — the flag region reassembles intact.

**Anti-leak audit:**
- `grep -c "progctf{" files/*.pcap` → 0 across all four pcaps. The flag is XOR-obfuscated under per-seq keys derived from the rogue SEED `0xFACEFEED`; it never appears in plaintext on the wire.
- `grep -c "the_rogue_buoy" files/*.pcap` → 0 across all four pcaps.
- `grep -c "EXEC " files/*.pcap` → 0 across all four pcaps. The covert prefix is also XOR-encrypted.
- The string identifiers `"BUOY_A".."BUOY_D"` and the four 32-bit SEED constants live ONLY in `buoy.elf` (and its source `build/firmware.c`); they do not appear in any pcap as plaintext.

## Quartermaster follow-up — `buoy.elf` BUILD-DEFERRED

The Quartermaster's Windows host has no `arm-none-eabi-gcc` on PATH, so the build script ships `files/buoy.elf.NOT_BUILT` as a placeholder stub. The C source `build/firmware.c` matches the Python protocol byte-for-byte (verified above by the cold-solve harness using ground-truth SEEDs from the C file). Before the bundle ships, a Linux/WSL re-build pass MUST:

```
arm-none-eabi-gcc -mcpu=cortex-m4 -mthumb -nostdlib -ffreestanding -Os \
                  -fno-toplevel-reorder -o files/buoy.elf build/firmware.c
arm-none-eabi-strip --strip-all files/buoy.elf
rm files/buoy.elf.NOT_BUILT
```

The `-fno-toplevel-reorder` flag and the `__attribute__((noinline))` annotations on `serialize_packet`/`deserialize_packet`/`crc8` keep the routines reachable so they survive `--strip-all`, and the `BUOY_X_NAME[]` strings are placed adjacent to `BUOY_SEEDS[4]` so a stripped-binary RE pass can correlate seed → buoy. Until that re-build pass lands, the player-facing artifact set is incomplete; this is tracked in the QM gap log alongside the LiME / SQLCipher Linux deferrals.
