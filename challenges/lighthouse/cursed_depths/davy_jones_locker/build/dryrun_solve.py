#!/usr/bin/env python3
"""
Stub for the end-to-end dry-solve of davy_jones_locker.

Inputs: --dump path, --expected-flag string.
Procedure (called by build/make.sh inside the Linux build VM):

  1. vol3 -f <dump> linux.pslist  -> find gpg-agent PID
  2. vol3 -f <dump> linux.proc.dump --pid <pid> --output-dir _heap/
  3. carve cache_item_t records out of _heap/<pid>.dmp:
       - find magic 0x474E5550 ('GNUP' little-endian) at 8-byte alignment
       - the cached key is at fixed offset N (gnupg-2.4.x: 0x60), 32 bytes
     emit candidate_key_hex
  4. strings -t d <dump> | awk '/SQLite format 3/{print $1}' -> page-1 offsets
  5. for each candidate page-1: parse page count, page size; collect that
     many subsequent SQLite page candidates (sig: 0x0D table-leaf, 0x0A
     table-interior, 0x05 index-interior, 0x02 index-leaf), reassemble.
  6. open with sqlcipher: PRAGMA key = "x'<hex>'"; SELECT notes FROM logbook;
  7. compare with expected_flag.

Implementation NOTE -- this script is a *runbook*, not finished code. The
gpg-agent cache-item layout magic at offset 0x60 above is the documented
illustrative value from the spec; the actual offset must be discovered
against the real gnupg build at capture time. That discovery is part of
First Mate's sign-off and is documented in the spec's
"unintended_solve_traps" item about the gpg-agent magic.
"""
import argparse, sys

ap = argparse.ArgumentParser()
ap.add_argument("--dump", required=True)
ap.add_argument("--expected-flag", required=True)
args = ap.parse_args()

print("dryrun_solve.py: not yet implemented (Powder Monkey blocker -- "
      "needs Linux build VM access to fix the gpg-agent cache magic and "
      "to actually exercise the carve). See solution.md verification block.",
      file=sys.stderr)
sys.exit(3)
