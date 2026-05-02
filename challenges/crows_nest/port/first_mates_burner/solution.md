# Solution — The First Mate's Burner Account

## Intended solve

1. **Visit the Albatross.social mock at the provided endpoint** (~1 min). Browse to `/u/salty_seraphina`. Tool: browser.
2. **Read Seraphina's main profile.** Bio mentions sea-biscuit, port complaints, and ends with a pinned post that quotes a "private hauling log" she keeps on her side account, signed `— S.S. (alt: @seafoam_smuggler)`. (~3 min)
3. **Navigate to `/u/seafoam_smuggler`** (~1 min). The burner account's bio reads: *"If ye be reading this, mate, the safehouse word is progctf{...}. Don't tell Salty."*
4. **Copy the flag from the bio.** (~30 sec)

## Total estimated time: 5–10 minutes

## Why this is Port-tier
- Single OSINT technique: read a public profile, follow the explicit reference to another public profile.
- Both profiles are linked from each other; the player never has to guess a username.
- No tooling beyond a browser.
- Fabricated personas only — no real people.

## Implementer note
Powder Monkey: build a single static-site mock at `/u/<handle>` with two profile pages. Each profile has avatar, handle, bio, and a "pinned post" block. The chain is: Seraphina's pinned post explicitly references `@seafoam_smuggler`. Seafoam's bio holds the flag verbatim. Add 4-5 other "decoy" usernames in Seraphina's followers list so the player must follow the actual reference (not guess random handles).

## Verification

Built site (`src/`) cold-solved on 2026-05-01 by walking the directory exactly as a player would walk the served URLs:

```
$ grep -oE '/u/[a-z_0-9]+' src/index.html | sort -u
/u/bilgewater_bonnie
/u/capt_threespoons
/u/rumlogger99
/u/salty_seraphina
/u/seafoam_smuggler

$ for d in src/u/*/; do
>   user=$(basename "$d")
>   flag=$(grep -oE 'progctf\{[a-z0-9_]+\}' "$d/index.html" | head -1)
>   printf '%-25s %s\n' "$user" "${flag:-(no flag)}"
> done
bilgewater_bonnie         (no flag)
capt_threespoons          (no flag)
rumlogger99               (no flag)
salty_seraphina           (no flag)
seafoam_smuggler          progctf{seafoam_keeps_no_secrets}
```

- Index page lists 5 personas; only `@seafoam_smuggler`'s bio carries the flag.
- The other 4 profiles are pure decoys (no flag, no false-positive `progctf{...}` strings).
- Recovered flag equals `flag.txt` byte-for-byte.
- nginx config blocks dotfiles, source extensions, and directory listing — verified by
  inspection of `nginx.conf`. `/robots.txt` returns a stub that does not advertise paths.
