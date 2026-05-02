# Whispers — Mutiny in the Mesh

## Whisper 1 (-10%)
Wireshark won't dissect this protocol — it's not a standard. Reverse the firmware. The serialization routines tell you the framing: a small header, then an XOR-obfuscated payload with a key derived from a sequence counter and a per-buoy seed.

## Whisper 2 (-20% cumulative)
The XOR key is `(SEED + seq * 0x9E3779B1) mod 2^32`, applied per packet. Each of the four buoys has a different SEED — they're all listed in a lookup table inside the firmware binary. Decode each pcap with the right SEED. Three look normal. One has additional packets in a higher seq range — that's the rogue.

## Whisper 3 (-35% cumulative)
Pull the rogue buoy's extra-range packets, sort by seq, decode payloads, and concatenate. Some packets are dropped; some are out of order in the pcap timeline. Each packet has a CRC8 trailer (the last byte of the decoded payload) that you should verify and strip. The reassembled ASCII forms a short command line beginning with `EXEC `. Final 20%: identifying which firmware constants are SEEDs vs decoys, and handling the gaps in the reassembled message.
