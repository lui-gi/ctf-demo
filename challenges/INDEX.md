# progctf — Island Index (Phase 1 Draft)

> 30 Islands across 7 Categories and 3 Difficulty Tiers. Cartographer draft for Quartermaster review.

## Distribution

| Category | Port | Open Sea | Cursed Depths | Total |
|---|---|---|---|---|
| Cursed Ports (Web) | 1 | 2 | 2 | 5 |
| Cipher Cove (Crypto) | 1 | 2 | 2 | 5 |
| Shipwright's Forge (Net/Log) | 1 | 2 | 1 | 4 |
| Lighthouse (Forensics) | 1 | 2 | 1 | 4 |
| Crow's Nest (OSINT) | 1 | 1 | 1 | 3 |
| Hidden Cargo (Stego) | 1 | 2 | 2 | 5 |
| Keymaster (Cracking) | 2 | 1 | 1 | 4 |
| **Total** | **8** | **12** | **10** | **30** |

## The Port (8 Islands — easy, 5–20 min)

### Cursed Ports (Web)
1. **`drowned_admin`** — *The Drowned Admin* — Login form leaks a SQL error on quote injection; classic `' OR '1'='1` style auth bypass on the admin panel reveals the Treasure in the dashboard banner.

### Cipher Cove (Crypto)
2. **`captains_caesar`** — *The Captain's Caesar* — A captain's log encoded with a Caesar shift; description hints at "Caesar's old trick" and the flag falls out after trying all 25 shifts (or eyeballing the giveaway word `progctf`).

### Shipwright's Forge (Net/Log)
3. **`telegraph_in_the_bilge`** — *Telegraph in the Bilge* — Tiny pcap of a cleartext Telnet session between two ships; following the TCP stream shows the boarding password being typed, which IS the Treasure.

### Lighthouse (Forensics)
4. **`exif_of_the_drowned`** — *EXIF of the Drowned* — A "found at sea" JPEG photo of a wreck; the GPS/Comment EXIF tag holds the Treasure verbatim, retrievable with `exiftool` or any online EXIF reader.

### Crow's Nest (OSINT)
5. **`first_mates_burner`** — *The First Mate's Burner Account* — A fabricated pirate handle "Salty_Seraphina" with a public bio on a hosted fake-social subdomain; her pinned post links to a burner alt whose bio holds the Treasure.

### Hidden Cargo (Stego)
6. **`message_in_a_bottle`** — *Message in a Bottle* — PNG of a bottle on a beach; appended after the IEND chunk is a plaintext "X marks the spot — progctf{...}" string, found with `strings` or by viewing in a hex editor.

### Keymaster (Cracking)
7. **`rusty_padlock`** — *The Rusty Padlock* — Single MD5 hash plus the description "the bosun always picks a fruit"; cracks instantly with `hashcat -m 0` against `rockyou.txt` filtered to fruit words.
8. **`saltless_sailor`** — *The Saltless Sailor* — A `/etc/shadow`-style line for user `bluebeard` using unsalted SHA-1; straight `hashcat -m 100` against `rockyou.txt` gives the password, which is the Treasure flavor text.

## Open Sea (12 Islands — medium, 30–90 min)

### Cursed Ports (Web)
9. **`smugglers_manifest`** — *The Smuggler's Manifest* — Boolean-blind NoSQL injection on a Mongo-backed `/api/cargo/search` endpoint (`$regex` operator injection) needed to enumerate a hidden manifest document containing the Treasure.
10. **`port_authority_jwt`** — *Port Authority Pass* — JWT-protected dock dashboard signed `HS256` with a weak secret leaked via a `.git/` exposed on the host; recover repo, find the secret in an old commit, forge an `is_harbormaster:true` token, hit `/admin/logbook`.

### Cipher Cove (Crypto)
11. **`gcd_among_thieves`** — *GCD Among Thieves* — Two RSA pubkeys from rival captains share a prime; compute `gcd(n1, n2)` to factor both, decrypt the intercepted ciphertext for the Treasure.
12. **`letter_she_never_sent`** — *The Letter She Never Sent* — A narrative-anchor multi-layer chain: AES-encrypted letter (provided), key derived from a passphrase, passphrase hidden via audio steganography in a "waves" WAV file (provided), stego technique reveals coordinates that index into a provided sea shanty PDF to spell the passphrase. Decrypt the letter to reveal Calypso's final words to Davy. *(Replaced `reused_nonce_rendezvous` per Quartermaster: this Island is the **narrative anchor** — the closing-ceremony reveal at Voyage freeze references its decrypted contents. Helmsman + Cartographer coordinate on closing-screen copy.)*

> **Quartermaster calibration notes for Cartographer expansion of #12:**
> - **Tier risk**: 4-step chain (audio stego → coord-index → passphrase → AES decrypt) is heavy for Open Sea. Calibrate KDF rounds and stego subtlety so a confident intermediate solves in 60–90 min, not 3+ hours.
> - **Cross-category overlap with #18** `song_of_the_siren` (also WAV spectrogram → coordinates). To avoid one giving away the other: differentiate the audio stego technique between the two — e.g. #18 stays spectrogram-text, #12 uses LSB on audio samples (or DTMF tones, or amplitude-modulation). Cartographer to pick and document.
> - **KDF choice**: PBKDF2-SHA256 with a documented iteration count (~100k) plus a fixed salt — keeps the key derivation deterministic and verifiable, doesn't require a separate cracking step (passphrase comes from the PDF, not from cracking).
> - **Locked flag**: `progctf{i_will_love_you_until_the_tides_forget}` (matches regex; closing-ceremony copy will reference this line).

### Shipwright's Forge (Net/Log)
13. **`ftp_then_ssh`** — *Two Pcaps, One Boarding* — Pcap A is a cleartext FTP session that leaks creds; pcap B is a USB-keystroke capture from the same victim where, decoded, the user pastes a long shell history including `echo progctf{...}`. Must combine both.
14. **`squid_in_the_logs`** — *Squid in the Logs* — A 40MB Squid proxy access log from the ship's HQ; suspicious User-Agent + base64 in URL params reveals an exfil channel — concatenate ordered chunks across requests, base64-decode to get the Treasure.

### Lighthouse (Forensics)
15. **`carved_from_the_wreck`** — *Carved From the Wreck* — A small disk image (FAT32) with a deleted `treasure.zip`; carve with `photorec` or by inspecting directory entries, recover the ZIP, then read a comment field embedded in the central directory header for the Treasure.
16. **`memory_of_the_helmsman`** — *Memory of the Helmsman* — A 256MB Linux memory dump (Volatility 3 friendly); enumerate processes, find a `gpg --decrypt` invocation in bash history, extract the passphrase from a `vim` swap file in `/tmp`, decrypt the supplied `.gpg` for the Treasure.

### Crow's Nest (OSINT)
17. **`captain_jollys_voyage`** — *Captain Jolly's Last Voyage* — Fictitious Captain "Jolly Wexler" has a hosted fake travel-blog; geolocate his last post (visual landmark + EXIF stripped) by cross-referencing his public "tide journal" RSS feed timestamps against a fictional weather archive also hosted by us; the harbour name IS the Treasure body.

### Hidden Cargo (Stego)
18. **`song_of_the_siren`** — *Song of the Siren* — WAV file of a sea shanty; spectrogram reveals coordinates as text, which point to a pixel region in a second supplied chart-image PNG where LSB-encoded bytes give the Treasure.
19. **`pressed_in_the_pages`** — *Pressed in the Pages* — A PDF "ship's almanac" with font-substitution stego: certain glyphs use a near-identical custom font. The Treasure is 60+ chars long, forcing players to write a small script that walks the PDF's content stream, identifies glyphs rendered with the custom font (vs. the base font), and emits the extracted text. Solvable by hand for 3 letters; only solvable with code for the full Treasure.

### Keymaster (Cracking)
20. **`bosuns_keyring`** — *The Bosun's Keyring* — Password-protected 7z archive plus a leaked rule: the bosun always uses `<shipname><year><!|?|.>`; build a hashcat mask/rule set from a provided list of 800 ship names and crack to open the archive containing the Treasure.

## Cursed Depths (10 Islands — brutal, 2–6+ hours)

### Cursed Ports (Web)
21. **`kraken_in_the_manifest`** — *Kraken in the Manifest* — Express-based "shipping calculator" admin API with a custom JSON-merge helper vulnerable to prototype pollution; pollute a render-context property that flows into a server-side EJS template, achieving SSTI → RCE in the sandbox to read `/treasure`. *(Renamed from `kraken_in_the_graphql` → `kraken_in_the_dock` → `kraken_in_the_manifest`. The "manifest" naming is intentional: prototype pollution literally pollutes object manifests, AND it creates a thematic callback to #9 `smugglers_manifest` so crews that solved the easier Open Sea web Island recognize the motif when they hit the Cursed Depths version.)*
22. **`algorithm_confusion_armada`** — *Armada of Confusion* — Custom auth service accepts JWTs signed `RS256` for users but `HS256` for service-to-service tokens; algorithm-confusion lets you sign a forged service token using the public key as the HMAC secret. The forged token unlocks an internal `/fleet/dispatch` endpoint vulnerable to blind SSRF against the cloud metadata mock, which returns IAM creds used to sign a final S3-mock URL holding the Treasure.

### Cipher Cove (Crypto)
23. **`dead_mans_cipher`** — *Dead Man's Cipher* — A custom Feistel cipher designed by Cartographer with one of two intended attack surfaces (Cartographer to choose during expansion): **(a)** 3-round cipher with a weak S-box exhibiting a high-probability differential characteristic — solvable by differential cryptanalysis with chosen plaintexts; **or (b)** Feistel with key-schedule reuse across rounds — solvable by a slide attack with known plaintexts. Both are real cryptanalysis tractable for a strong undergrad. No off-the-shelf tool helps.
24. **`ecdsa_two_signatures`** — *Two Signatures, One Mistake* — ECDSA over `secp256k1` with a biased nonce generator (top 8 bits always zero across many signatures); given 80 message+signature pairs, mount a lattice attack (LLL / hidden number problem) to recover the private key, then sign the boarding token whose payload reveals the Treasure.

### Shipwright's Forge (Net/Log)
25. **`mutiny_in_the_mesh`** — *Mutiny in the Mesh* — A 4-pcap bundle from mock IoT "buoys" speaking a custom binary UDP protocol (Cartographer-designed: length-prefixed, XOR-obfuscated with a rotating key derived from packet sequence) **PLUS a stripped 'buoy firmware' ELF binary** supplied alongside the traffic so the protocol is reverse-engineerable from code+traffic, not pcap-alone-guessing. Reverse the firmware to understand the framing, identify the rogue buoy, reconstruct its payload across reordered/lossy packets to extract a covert C2 channel whose final command is the Treasure.

### Lighthouse (Forensics)
26. **`davy_jones_locker`** — *Davy Jones's Locker* — A 1GB raw Linux memory dump from a fake "ship's logbook" host. Two-stage forensic chain: **(a)** extract a still-live `gpg-agent` keyring from heap (locating the in-memory key struct by its magic + walking the doubly-linked list), **(b)** reconstruct a deleted SQLite log via inode references in the slab cache, then decrypt the recovered SQLite blob using the keyring entry from stage (a). The decrypted row IS the Treasure. No public tool does both steps end-to-end. *(Reduced from three stages — kernel-ASLR step removed per Quartermaster.)*

### Crow's Nest (OSINT)
27. **`ghost_fleets_supply_chain`** — *The Ghost Fleet's Supply Chain* — A fictitious shell-company "Marrowtide Logistics" with a fake corporate site, three employee personas, a leaked NPM package on a hosted private registry mock, and a fabricated certificate-transparency log we host. Crew must pivot: persona LinkedIn-style bio → mentioned npm package → CT log subdomain → exposed `.well-known/security.txt` → final hidden static page whose Treasure is a sentence reconstructed from cross-referenced clues. No real services, no guessing — every pivot has a logical breadcrumb.

### Hidden Cargo (Stego)
28. **`polyglot_of_the_damned`** — *Polyglot of the Damned* — A single file that is simultaneously a valid PNG, valid ZIP, and valid PDF. Each interpretation contains a different fragment of the Treasure (PNG: LSB in alpha channel; ZIP: comment in a zero-byte entry; PDF: hidden in an unused content-stream object). A fourth fragment only appears when the SHA-256 of the three fragments concatenated is XORed against a constant embedded in the PNG's iTXt chunk.
29. **`shanty_with_a_secret`** — *Shanty With a Secret* — An MP3 of a sea shanty plus its "transcribed lyrics" PDF. The MP3 uses MP3Stego-style stego in the bit-reservoir; the passphrase is hidden as a microtypography acrostic in the PDF lyrics (every 7th word's first letter, ignoring articles). Players must independently discover both halves and combine. No tool extracts both ends.

### Keymaster (Cracking)
30. **`forgotten_keelhaul_kdf`** — *The Forgotten Keelhaul KDF* — A custom KDF (Cartographer-designed: PBKDF2 wrapper with a known short prefix and a deliberately weakened iteration-counter-XOR bug) plus a leaked partial password (8 of 14 characters known, charset-restricted middle). Crew must reverse the KDF's structure from supplied source, build a custom GPU-friendly cracker (or write a hashcat module/`-m 0` workaround using the prefix property), and recover the full password to unlock an encrypted chest holding the Treasure. Off-the-shelf modes do not apply directly.

## Calibration Notes

I held the difficulty ladder honestly. The Port tier is genuinely beginner-friendly with one technique each, no chaining, and obvious hints — but every Island still requires *doing* something (no pure trivia). Open Sea Islands all chain at least two distinct steps (recon→exploit, two crypto primitives, two artifact types, etc.) and a confident intermediate should land them in 30–90 minutes. Cursed Depths Islands all require either novel/custom protocol work, multi-stage chains across distinct skills, or a real cryptographic/forensic attack that off-the-shelf tools won't autocomplete — no `searchsploit` wins, no brute-force-and-wait, no guessy stego.

A few I'd like the Quartermaster's judgment on:

- **Island 21 (`kraken_in_the_graphql`) vs an alternative**: I'm confident in the GraphQL fragment-aliasing → SSTI → RCE chain, but a reasonable alternative would be a custom prototype-pollution-to-RCE in an Express-based "shipping calculator" admin API. GraphQL is more novel and harder to Google a writeup for; prototype pollution is more "classic." Prefer one or want both staged?
- **Island 27 (`ghost_fleets_supply_chain`)**: This is the only OSINT Cursed Depths and it's heavy on infrastructure (we'd host a fake CT log, a fake npm registry, three persona sites). Alternative would be a single-domain "abandoned hacker forum" archive with a multi-step social-engineering reconstruction — much lighter on Powder Monkey but feels less "Cursed Depths." Want me to offer the lighter variant as a fallback if Powder Monkey balks?
- **Island 30 (`forgotten_keelhaul_kdf`) vs a KeePass approach**: I went custom-KDF to avoid CVE-lookup wins. Alternative: a deliberately-malformed KeePass `.kdbx` file where the Crew must patch a header byte to make it loadable then crack a partial-known password. Custom KDF teaches more; KeePass is more "real-world." Lean either way?

Counts verified: Port = 8 (1+1+1+1+1+1+2), Open Sea = 12 (2+2+2+2+1+2+1), Cursed Depths = 10 (2+2+1+1+1+2+1), Total = 30. Per-category totals: 5/5/4/4/3/5/4 = 30. Matches the distribution table exactly.
