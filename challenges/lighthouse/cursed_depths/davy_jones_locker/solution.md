# Solution — Davy Jones's Locker

## Intended solve

### Stage 1: Recover the gpg-agent keyring entry from heap

1. **Identify the dump's kernel.** `vol3 -f tidekeeper.lime banners.banners` → Linux 6.1.x. (~10 min)
2. **Find `gpg-agent` PID.** `vol3 -f tidekeeper.lime linux.pslist` → note `gpg-agent` PID (e.g., 1247). (~5 min)
3. **Dump gpg-agent's heap.** `vol3 -f tidekeeper.lime linux.proc.maps --pid 1247` reveals heap range. Dump it: `vol3 ... linux.proc.dump --pid 1247`. (~20 min)
4. **Locate the cached key struct.** GnuPG's in-memory cached secret keys are stored in a doubly-linked list of `cache_item_t` (or equivalent in agent.c). Each entry begins with a recognizable magic — for our build, `0x474E5550` (`"GNUP"`). Carve all instances of this magic in the heap. Each cache item has a fixed offset to the key blob (~128 bytes) and the key length (4-byte LE). Pull the key bytes — for an AES-256 symmetric subkey cached for SQLite decryption, this is 32 bytes. (~120 min)
5. **Confirm key length and entropy.** Should be 32 random bytes. (~5 min)

### Stage 2: Reconstruct the deleted SQLite blob from filesystem-cache (slab) pages

1. **Identify the slab cache.** `vol3 -f tidekeeper.lime linux.kmsg` and `linux.lsmod` won't help directly — use `linux.psaux` to find the process that had the SQLite file open just before deletion (the `tidekeeper-logd` service). (~30 min)
2. **Find inode references for the deleted file.** Even after `unlink`, the inode struct may be findable in slab via `linux.find_file` plugin or by scanning for SQLite header `"SQLite format 3\0"` in the dump:
   ```
   strings -t d tidekeeper.lime | grep "SQLite format 3"
   ```
   Each match is the start of a cached page (4096 bytes typically). (~30 min)
3. **Carve all SQLite page candidates.** For each candidate offset, dump 4 KB. Multiple pages will be intermingled with other cached pages in the slab. Use SQLite's page-1 header: bytes 16-17 are page size (BE), byte 32-35 is file change counter, byte 56-59 is page count. Bootstrap from the most-recent page-1, which gives total page count, then collect that many additional cached SQLite pages (matching by file_change_counter). (~60 min)
4. **Reassemble into a valid SQLite file.** Sort pages by their internal page number (each page's first byte for table-leaf is 0x0D, etc., but b-tree pages don't carry a number — use parent pointers and the page-1 header). For typical small DBs (<1MB) this is tractable; assemble pages sequentially, padding gaps with zeros. (~60 min)
5. **Verify with `sqlite3 logbook.db ".schema"`.** Should reveal a single encrypted table (or a table with binary-blob columns). (~10 min)

### Stage 3: Decrypt with the recovered key

1. **Recognize the encryption scheme.** SQLCipher (the standard encrypted SQLite). Configure with the recovered 32-byte key (raw, not passphrase): `PRAGMA key = "x'<hex_key>'"`. (~30 min)
2. **Open with `sqlcipher`:**
   ```
   sqlcipher logbook.db
   PRAGMA key = "x'<hex_key>'";
   .tables
   SELECT * FROM logbook;
   ```
3. **Find the flag row.** One row contains the flag in a `notes` column: `progctf{...}`. (~10 min)

## Total estimated time: 6+ hours

## Why this is Cursed Depths
- Two-stage forensic chain that no off-the-shelf tool does end-to-end.
- Stage 1 requires understanding gpg-agent's in-memory cache layout — pure memory archaeology.
- Stage 2 requires SQLite page reassembly from non-contiguous slab pages — a real forensic recovery skill.
- Stage 3 requires recognizing SQLCipher's raw-key format (a common gotcha — the PRAGMA key syntax is unforgiving).
- Beginners with `vol3` familiarity will get stage 1 partial; the full chain demands custom scripting.

## Implementer note
Powder Monkey:
- Build a Linux VM (Ubuntu 22.04 or similar, kernel 6.1+, 1.5 GB RAM).
- Build a tiny Python service `tidekeeper-logd` that opens an SQLCipher DB `logbook.db` with a fixed 32-byte raw key, populates ~50 rows of mundane officer logs, ONE row whose `notes` column = `progctf{the_locker_held_two_secrets}`, then closes.
- Open `gpg-agent`, cache the same 32-byte key as a passphrase entry (`gpg-preset-passphrase` or equivalent). Confirm gpg-agent has it cached in memory.
- `unlink logbook.db` (so directory entry gone, page cache still has the data).
- Capture LiME dump while gpg-agent is alive and the page cache holds the SQLite pages.
- Verify end-to-end recoverability before shipping.
- The "magic" `0x474E5550` for the gpg-agent cache item is illustrative — Powder Monkey: pick whatever gpg-agent on this kernel actually uses, and document it in this spec for the player to discover.

## Verification

**Status: BLOCKED — escalation requested. STOPPED on this island per the task
brief's "do not ship a fake memory dump" rule.**

Powder Monkey delivered the executable runbook (`build/make.sh`) and a
solver-stub (`build/dryrun_solve.py`). The runbook covers every spec step:
generate a 32-byte raw key, populate an SQLCipher `logbook.db` with 50 mundane
rows + one flag row, prime `gpg-agent` via `gpg-preset-passphrase` so the key
sits in its heap, `unlink` the DB to leave page-cache pages orphaned, capture
1 GB with LiME, then run the dry-solve and the `strings | grep progctf`
anti-leak check.

**Could not execute in this Powder Monkey session.** Three compounding blockers:

1. The build sandbox refused every command except `python --version` and
   `mkdir -p`. No `bash`, no `python build/make.sh`, no shell loop available.
2. The host is Windows 11 with no detectable Linux VM or WSL. SQLCipher,
   `gpg-preset-passphrase`, and LiME are all Linux-only or require kernel
   modules built against the running kernel.
3. Per the task brief's hard rule and `unintended_solve_traps` items: a
   synthetic 1 GB blob labeled `tidekeeper.lime` that is not actually a
   Volatility-parseable LiME dump would BREAK the Cursed Depths "no guessy
   garbage" bar. Ship-or-skip is the only honest choice; we skip.

The `dryrun_solve.py` script is a *runbook*, not finished code. The gpg-agent
cache-item magic (`0x474E5550`) and the cached-key offset within the
`cache_item_t` struct are spec-illustrative; they MUST be re-derived against
the actual gnupg build that runs on the chosen kernel at capture time. That
discovery is part of First Mate's sign-off and was explicitly flagged in the
spec's `unintended_solve_traps`.

**Escalation to Quartermaster:** choose one of:
- (a) Provision a Linux build VM (Ubuntu 22.04, kernel 6.1.x, 1.5 GB RAM,
  sqlcipher, libgcrypt-dev, gnupg2 with gpg-preset-passphrase, lime-forensics-dkms,
  volatility3 with kernel-matching symbol tables) and re-dispatch; or
- (b) Downgrade the spec — e.g. drop the SQLCipher reassembly stage and
  ship just the gpg-agent heap recovery as a single-stage Open Sea; or
- (c) Inline-build later under VM access. The runbook is ready.

Tools verified available on this host:
- Python 3.13.2 (`python --version` succeeded only)

Tools that would be required and were not verified:
- Linux 6.1.x kernel + matching `lime-forensics-dkms`
- `sqlcipher`, `pysqlcipher3`
- GnuPG ≥ 2.4.x including `gpg-preset-passphrase`
- `volatility3` ≥ 2.5.x with Linux symbol tables for that exact kernel build
- `openssl` for the random raw key

No `files/tidekeeper.lime` and no `files/MANIFEST.txt` were produced.
