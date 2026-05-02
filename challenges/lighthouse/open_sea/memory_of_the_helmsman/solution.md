# Solution — Memory of the Helmsman

## Intended solve

1. **Identify the dump format and OS profile.** `vol3 -f dump.lime windows.info` — wrong. `vol3 -f dump.lime banners.banners` reveals a Linux 5.15.x kernel banner. Tools: Volatility 3. (~10 min)
2. **List processes:** `vol3 -f dump.lime linux.pslist`. See `bash`, `vim`, `gpg`, `gpg-agent` running. (~5 min)
3. **Pull bash history from memory:** `vol3 -f dump.lime linux.bash` (or carve `.bash_history`-like strings from heap). Reveals commands including:
   ```
   vim /tmp/note
   gpg --decrypt sealed.gpg
   ```
   (~10 min)
4. **Locate the vim swap file.** `vol3 -f dump.lime linux.lsof | grep swp` shows `/tmp/.note.swp` open. Dump it: `vol3 -f dump.lime linux.proc.maps --pid <vim_pid>` then carve the file's pages out of memory, OR `vol3 -f dump.lime linux.find_file --find /tmp/.note.swp --dump`. (~15 min)
5. **Read the swap file.** Vim swap files are mostly binary, but they preserve typed buffer contents in plaintext blocks. `strings /tmp/.note.swp | grep -i 'pass\|gpg\|wraith'` — reveals the passphrase the helmsman typed: `pale_cassandra_drift_19`. (~10 min)
6. **Decrypt the file:**
   ```
   echo 'pale_cassandra_drift_19' | gpg --batch --passphrase-fd 0 --decrypt sealed.gpg
   ```
   The plaintext starts `progctf{...}`. (~3 min)

## Total estimated time: 45–75 minutes

## Why this is Open Sea
- Three artifact types: memory dump + encrypted file + recovered swap file.
- Volatility 3 is the canonical tool but the player must *choose the right plugins* (banners → pslist → bash → find_file → strings).
- Vim-swap recovery is a real forensic skill, not "look at /tmp on the running box."
- Beginner who runs `strings dump.lime` and grep-s for `progctf` will find nothing — the passphrase is in the swap file, not the dump's free text.

## Implementer note
- Build a Linux VM (kernel 5.15+ is fine), boot, run `vim /tmp/note`, type the passphrase as a buffer line, save (creating .swp), then exit vim. Run `gpg --decrypt sealed.gpg` (provide passphrase). Capture LiME dump WHILE the gpg-agent has the passphrase cached. Stop, dump.
- Encrypt `flag.txt` (containing `progctf{the_helmsman_left_his_swap_open}`) with `gpg -c --cipher-algo AES256 --passphrase 'pale_cassandra_drift_19' flag.txt → sealed.gpg`.

## Verification

**Status: PARTIAL — `sealed.gpg` built and verified; `dump.lime` BLOCKED on
Linux-VM availability, escalation requested.**

### sealed.gpg (built and verified)

Built via `build/make_gpg.py` (Python 3.13.2 + Git-for-Windows GnuPG 2.4.x):

```
$ python build/make_gpg.py
wrote .../files/sealed.gpg (111 bytes)
round-trip OK: decrypted == flag.txt -> 'progctf{the_helmsman_left_his_swap_open}'
```

Anti-leak check: the literal flag string is NOT present in the 111-byte
ciphertext (`flag in ciphertext: False`). Decrypts cleanly with passphrase
`pale_cassandra_drift_19` via:

```
gpg --batch --pinentry-mode loopback --passphrase 'pale_cassandra_drift_19' \
    --decrypt files/sealed.gpg
```

The build script uses an ephemeral `GNUPGHOME` so it does not pollute the
host's gpg config and is reproducible across operators.

### dump.lime (BLOCKED — Linux VM required)

`build/make.sh` is the executable runbook. It encrypts `sealed.gpg`, then
on a Linux host: launches a `vim` session to plant the passphrase in
`/tmp/.note.swp`, primes `gpg-agent`, drops 2 decoy swap files, loads LiME,
captures `files/dump.lime`, and runs the four spec-mandated Volatility
validators plus the `strings | grep progctf` anti-leak check.

**Could not execute the LiME capture in this Powder Monkey session.** This
host is Windows 11 with no Linux VM or detectable WSL. The spec's
"build a real Volatility-friendly memory dump" path requires booting a Linux
VM, planting bash history + vim swap + a live `gpg-agent`, and capturing
with LiME. The synthetic-dump alternative was rejected per the task brief:
"DO NOT ship a synthetic file labeled `memory.lime` that isn't actually a
parseable memory dump."

**Escalation to Quartermaster:** choose one of:
- (a) Provision a Linux build VM (Ubuntu 22.04, kernel 5.15.x,
  lime-forensics-dkms, volatility3 + matching symbol tables) and
  re-dispatch this island; or
- (b) Downgrade the spec to ship a filesystem snapshot instead of a
  memory dump; or
- (c) Inline-build dump.lime later when a VM is provisioned.

Tools verified available on this host:
- Python 3.13.2
- GnuPG 2.4.x (Git-for-Windows bundled `gpg.exe`)

Tools that would be required for `dump.lime` and were not verified:
- LiME kernel module matching the build VM's kernel
- `volatility3` ≥ 2.5.x with Linux symbol tables for the chosen kernel
- `vim` on the build VM (any modern version)
- Sudoer access on the VM for `insmod`
