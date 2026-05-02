# Linux Deferral Pass — runbook

Quartermaster-authorized scope, 2026-05-01. Hand this entire file to a Claude session running on a Linux host (any modern distro, or WSL2). The agent's job is to verify the 6 islands listed below end-to-end and report. **Tight scope — no scope creep, no new challenges, no platform code, no Cartographer specs.**

## Authorization scope

The agent MAY:
- `apt install` toolchains listed below (or pacman/dnf equivalent)
- `docker compose up` / `down` for the 5 web islands
- Build challenge artifacts using build scripts already in the repo
- Modify `challenges/<island>/files/` to drop placeholder stubs and write the real artifacts
- Modify `challenges/<island>/solution.md` to update the verification block with the runtime evidence (replace the "BUILD-DEFERRED" notes with `RUNTIME-VERIFIED on YYYY-MM-DD` plus a tail of the cold-solve output)
- Modify `challenges/<island>/build/` scripts ONLY if a script has an objective bug (record what changed and why)

The agent MUST NOT:
- Touch `/backend`, `/frontend`, `/infra`, `/db`, `/progctf-package` (except writing to `runbooks/linux_deferral_pass.md` itself to log final status)
- Touch any `spec.yaml` or `whispers.md` file (locked Cartographer territory)
- Add any new island, change any island's flag, or alter any island's intended-solve narrative
- Skip a task because it's "fiddly" — surface the problem and ask before deviating

## The 6 tasks

For each task: install tooling → build/run → verify exact recovery → update the island's `solution.md` Verification block with timestamped runtime evidence → delete any `*.NOT_BUILT` placeholder.

### Task 1 — #24 ecdsa_two_signatures: LLL/HNP attack verification

**Island:** `challenges/cipher_cove/cursed_depths/ecdsa_two_signatures/`
**What's deferred:** the LLL recovery step. The build already verifies signatures + nonce bias + verifier mechanism on Windows; only the lattice solve is missing.
**Tooling:**
```
pip install fpylll
# OR (much heavier, only if fpylll insufficient):
# apt install sagemath
```
**Run:**
```
cd challenges/cipher_cove/cursed_depths/ecdsa_two_signatures
python build/cold_solve.py     # if exists, or write one
# expected: recovers private d, signs target message, verifier prints the flag
```
**If `build/cold_solve.py` does not exist:** write it. The HNP setup is the standard biased-nonce attack — 80 sigs with `1 ≤ k < 2^248` (top 8 bits zero). Build the lattice from the (r, s, h) triples, run `fpylll.LLL.reduction`, scan reduced rows for the right `d` (verifies via `pubkey == d * G`), then sign the target message and call the player-facing verifier from `build/verifier_template.py`.
**Acceptance:** `RECOVERED: progctf{nonce_starvation_in_the_armada}` (or whatever the flag.txt says — read it, do not guess).
**Report:** the recovered `d` (hex, redacted to first/last 8 bytes for the runbook log), the LLL solve time, lattice dimension.

### Task 2 — #25 mutiny_in_the_mesh: ARM Cortex-M4 firmware ELF

**Island:** `challenges/shipwrights_forge/cursed_depths/mutiny_in_the_mesh/`
**What's deferred:** `files/buoy.elf` (currently a `.NOT_BUILT` stub). The pcaps build deterministically on Windows.
**Tooling:**
```
apt install gcc-arm-none-eabi binutils-arm-none-eabi
```
**Run** (commands documented inside `files/buoy.elf.NOT_BUILT`):
```
cd challenges/shipwrights_forge/cursed_depths/mutiny_in_the_mesh
arm-none-eabi-gcc -mcpu=cortex-m4 -mthumb -nostdlib -ffreestanding -Os \
                  -fno-toplevel-reorder -o files/buoy.elf build/firmware.c
arm-none-eabi-strip --strip-all files/buoy.elf
rm files/buoy.elf.NOT_BUILT
```
**Verify the ELF is RE-friendly:**
```
arm-none-eabi-objdump -d files/buoy.elf | grep -E "serialize_packet|deserialize_packet|crc8"
arm-none-eabi-strings files/buoy.elf | grep -E "BUOY_[A-D]"
# Confirm: function symbols present in disasm; BUOY_X_NAME strings adjacent to BUOY_SEEDS in .rodata.
```
**Acceptance:** ELF builds, both `--strip-all`'d AND has BUOY_A..D string identifiers reachable in `.rodata` near the four 32-bit SEED constants (`0xCAFEBABE 0xDEADBEEF 0xFACEFEED 0xBADC0FFE`).
**Report:** ELF size, output of the `strings | grep BUOY` line, output of `objdump | head -20` of the serialize_packet function.

### Task 3 — #16 memory_of_the_helmsman: LiME memory image + Volatility verify

**Island:** `challenges/lighthouse/open_sea/memory_of_the_helmsman/`
**What's deferred:** `files/dump.lime` AND the Volatility extraction half of the cold-solve. **`files/sealed.gpg` is ALREADY built and verified on Windows — do NOT rebuild it.** The PARTIAL status is documented in solution.md's Verification block.
**Tooling:**
```
# LiME — choose ONE path:
# Path A (real Linux, NOT WSL2): build kernel module against headers
sudo apt install build-essential linux-headers-$(uname -r)
git clone https://github.com/504ensicsLabs/LiME && cd LiME/src && make
# Path B (WSL2 or anywhere): use AVML, no kernel module needed
# https://github.com/microsoft/avml — single static binary
# Volatility 3 — pure Python:
pip install volatility3
```
**Read the island's spec.yaml + solution.md FIRST** to understand the setup: vim plants the passphrase `pale_cassandra_drift_19` in `/tmp/.note.swp`, then `gpg --decrypt sealed.gpg` is invoked so gpg-agent caches the passphrase, then dump while gpg-agent is alive. The island's `build/make.sh` orchestrates this — read it before writing new code.
**If LiME on WSL2 fails** (kernel-headers mismatch is the usual issue): switch to AVML and document the substitution. Both produce dumps that Volatility 3 reads.
**Acceptance:** Volatility 3 plugin walk recovers `progctf{the_helmsman_left_his_swap_open}` from the dump exactly as documented in the island's solution.md (banners → pslist → bash → find_file → strings).
**Report:** which acquisition tool was used (LiME or AVML), the dump size, the Volatility plugin invocation, and the recovered flag.

### Task 4 — #26 davy_jones_locker: LiME dump + gpg-agent heap + SQLCipher page-cache forensic

**Island:** `challenges/lighthouse/cursed_depths/davy_jones_locker/`
**Path corrected from earlier draft.** Earlier draft of this runbook framed Task 4 as "SQLCipher integration." That undersold it. **READ `solution.md` AND `spec.yaml` BEFORE STARTING.** This island is a multi-stage Linux memory-forensic challenge that happens to terminate in a SQLCipher decrypt at stage 3. Currently `files/` contains only `MANIFEST.txt` — the LiME dump and the entire forensic chain are deferred.

The chain (per `solution.md`):
- **Stage 1:** recover a 32-byte raw key from `gpg-agent`'s heap (`cache_item_t` list walk; the `0x474E5550` "GNUP" magic in solution.md is illustrative — verify against the actual libgcrypt build)
- **Stage 2:** reconstruct a deleted SQLite DB from page-cache slab pages (carve `"SQLite format 3\0"` headers, reassemble by file_change_counter)
- **Stage 3:** open with SQLCipher using `PRAGMA key = "x'<hex_key>'"`, query the flag row

**Tooling — real Linux VM strongly preferred over WSL2:**
```
# Build VM: Ubuntu 22.04 with kernel 6.1.x (NOT 5.15 — solution.md is specific)
sudo apt install build-essential linux-headers-$(uname -r) \
                 sqlcipher libsqlcipher-dev gnupg2 dpkg-dev openssl
pip install pysqlcipher3 volatility3
git clone https://github.com/504ensicsLabs/LiME && cd LiME/src && make
# Volatility 3 needs Linux symbol tables for the exact kernel — generate via dwarf2json:
# https://github.com/volatilityfoundation/dwarf2json
# AVML fallback: https://github.com/microsoft/avml — ONLY if LiME fails to build.
```

**WSL2 caveat — harder than Task 3 (#16).** Capture must happen with: (a) `gpg-agent` RUNNING with a cached symmetric passphrase via `gpg-preset-passphrase`, (b) the SQLCipher DB opened then `unlink`'d but pages still resident in page cache, (c) no heavy IO between unlink and dump that would evict those pages. AVML on WSL2 may capture, but the gpg-agent + page-cache state setup is fragile under WSL2's hybrid VM. Strongly prefer a real Ubuntu 22.04 VM (multipass, virt-manager, or a cloud instance). **If only WSL2 is available: try it, document everything, and surface the result honestly. DO NOT ship a fake `tidekeeper.lime` — `unintended_solve_traps` in spec.yaml explicitly forbid this.**

**Build (read `build/make.sh` + `build/dryrun_solve.py` first — they are the executable runbook):**
```
cd challenges/lighthouse/cursed_depths/davy_jones_locker
cat build/make.sh build/dryrun_solve.py    # READ before running
sudo bash build/make.sh
# Powder Monkey shipped these as a runbook; the gpg-agent cache-item magic
# and cached-key offset within cache_item_t are spec-illustrative and MUST be
# re-derived against the actual gnupg build at capture time. That discovery
# is part of the verification — log the real magic + offset in your report.
```

**Acceptance:**
- `files/tidekeeper.lime` exists (~1 GB)
- `vol3 -f files/tidekeeper.lime banners.banners` reports the kernel
- `vol3 -f files/tidekeeper.lime linux.pslist` shows `gpg-agent` running
- `strings files/tidekeeper.lime | grep -c "SQLite format 3"` returns >0
- `strings files/tidekeeper.lime | grep -F 'progctf{'` returns NOTHING (anti-leak per `unintended_solve_traps`)
- `dryrun_solve.py` (or your equivalent cold-solve) recovers `progctf{the_locker_held_two_secrets}` end-to-end from the dump

**Report:** acquisition tool (LiME or AVML), VM kernel version, dump size, the gpg-agent cache-item magic actually observed (vs. the illustrative `0x474E5550`), the recovered key (hex, redacted to first/last 4 bytes), and the recovered flag. **If you had to substitute AVML for LiME or downscope the chain in any way, surface it loudly in the runbook log block — Quartermaster needs to know before First Mate's cold-solve re-derives this.**

### Task 5 — #29 shanty_with_a_secret: mp3stego embed for the audio half

**Island:** `challenges/hidden_cargo/cursed_depths/shanty_with_a_secret/`
**What's deferred:** `files/shanty.mp3` (currently a `.NOT_BUILT` stub). The lyrics.pdf half is verified on Windows; the passphrase is `pale_cassandra_drift_19`.
**Tooling:**
```
# mp3stego from Petitcolas — 2002 C codebase, may need fiddling on modern gcc.
# Source: https://www.petitcolas.net/steganography/mp3stego/
# If the source archive is not directly available, mirror via web archive.
# Modern build: may need -fpermissive, may need to tweak header includes.
# FALLBACK: Dockerfile pinning gcc 4.x — only if direct build fails.

# You'll also need a 3-minute MP3 of the lyrics being sung. Synthesis is fine —
# espeak-ng + lame can produce a usable narrated track:
apt install espeak-ng lame
```
**Build commands** (from the island's `files/shanty.mp3.NOT_BUILT` stub):
```
cd challenges/hidden_cargo/cursed_depths/shanty_with_a_secret
# 1. Synthesize ~3 minutes of audio of the lyrics (espeak-ng → wav → 128 kbps mp3 via lame).
#    The lyrics text is in the rendered files/lyrics.pdf; you can also reconstruct
#    from build/make.py's CHUNKS list + render_chunk_lines() — that's the source of truth.
# 2. Build mp3stego from sources.
# 3. Embed:
echo -n 'progctf{the_shanty_kept_two_halves}' > /tmp/payload.txt
mp3stego encode -E /tmp/payload.txt -P 'pale_cassandra_drift_19' raw.wav files/shanty.mp3
# 4. Round-trip verify:
mp3stego decode -X -P 'pale_cassandra_drift_19' files/shanty.mp3 /tmp/out.bin
diff /tmp/out.bin /tmp/payload.txt    # must match
rm files/shanty.mp3.NOT_BUILT
```
**If mp3stego won't compile on modern gcc:** ship a small `build/mp3stego.Dockerfile` pinning Debian buster + gcc-8, build inside that, copy the binary out. Document the workaround in the verification block.
**Acceptance:** `files/shanty.mp3` exists; round-trip decode with the passphrase recovers the flag bytes exactly.
**Report:** the audio synthesis source (espeak-ng or other), the mp3 file size, the mp3stego version/build path used, and confirmation of the round-trip.

### Task 6 — Docker runtime verify for the 5 web islands (#9, #10, #21, #22, #27)

**Islands:** `cursed_ports/{open_sea,cursed_depths}/{smugglers_manifest,port_authority_jwt,kraken_in_the_manifest,algorithm_confusion_armada}` and `crows_nest/cursed_depths/ghost_fleets_supply_chain` (or wherever #27 lives — `find challenges -name "ghost_fleets_supply_chain" -type d`).
**What's deferred:** `docker compose up` + end-to-end exploit walkthrough for each.
**Tooling:** `docker` and `docker compose` (already required for Linux dev). Confirm with `docker version && docker compose version`.

For each island in order, do:
```
cd challenges/<island>/
bash build/build.sh up
# Wait for services healthy. Then run the 5–7 step exploit chain documented in
# the island's solution.md "real player flow" section. Capture stdout of each step.
bash build/build.sh down
```

**Acceptance per island:** the documented exploit chain returns the exact `progctf{...}` flag from `flag.txt`. If the chain fails, debug the build (NOT the spec) — the spec is locked. Permitted build-script fixes: missing env var, port collision, image-tag drift, dependency pin that doesn't resolve. Anything that requires a real spec change: STOP and surface to the Quartermaster.

**Report per island:** services-up time, exploit-chain step count, recovered flag (verify against `flag.txt`), any build-script fix you made.

## Final reporting

When all 6 tasks are done (or you've hit a blocker on one), append a `## Linux Pass Result — YYYY-MM-DD` block to THIS file (`progctf-package/runbooks/linux_deferral_pass.md`). One paragraph per task, plus a closing one-liner: `RESULT: 6/6 verified end-to-end` or `RESULT: 5/6, blocker on #N: <reason>`. Update `progctf-package/memory/phase2_completion_status.md` (if reachable from the Linux session) to reflect the new state — or note in your closing report that the Quartermaster needs to update memory manually.

## Out of scope (do NOT do)

- Phase 3 First Mate cold-solves — those are blocked on this pass completing
- Bosun Admin API integration — that's a parallel agent already running
- New islands, flag changes, spec edits, narrative edits
- `/backend`, `/frontend`, `/infra`, `/db`
- "While I'm here" cleanup of unrelated challenges that already verify on Windows

## Acceptance criteria for the pass as a whole

1. All 6 islands have RUNTIME-VERIFIED evidence in their `solution.md` Verification blocks (timestamped, with cold-solve output tail)
2. All 6 islands have their `*.NOT_BUILT` placeholders deleted (where they existed)
3. The runbook gets a result block appended
4. No file outside `challenges/` and this runbook has been touched
