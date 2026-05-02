# Mutiny in the Mesh

The Free Port of Saltmark deploys a small mesh of "buoys" — autonomous IoT devices anchored at the harbor mouth that report sea conditions back to the harbormaster. Each buoy speaks a custom binary UDP protocol designed by the harbor's engineering shop, and the protocol — being custom — was never properly documented anywhere outside the firmware itself.

Last week, one of the buoys went rogue. It started transmitting *extra* packets, riding alongside its legitimate sensor reports, encoding what we believe is a covert command-and-control channel for whoever turned it. We have four pcap captures from the harbor's network tap (`buoy_a..d.pcap`), and we have a stripped firmware ELF (`buoy.elf`) recovered from a salvaged spare buoy.

Reverse the firmware to learn the protocol. Identify the rogue buoy. Reconstruct its covert channel — accounting for reordered and dropped packets. The covert channel's final command IS the Treasure.

## Files
- `buoy_a.pcap`, `buoy_b.pcap`, `buoy_c.pcap`, `buoy_d.pcap` — four captures from a harbor network tap
- `buoy.elf` — stripped buoy firmware (ARM Cortex-M4)
