"""Build script for saltless_sailor — produces files/shadow.txt + files/pirates.txt + MANIFEST.txt.

Generates a 200-line themed wordlist deterministically from a fixed seed, with the canonical
flag as ONE entry and 199 themed decoys that are guaranteed not to collide with any other
Island's flag.
"""
from __future__ import annotations

import hashlib
import random
from pathlib import Path

ISLAND = Path(__file__).resolve().parent.parent
OUT = ISLAND / "files"
OUT.mkdir(exist_ok=True)

flag = (ISLAND / "flag.txt").read_text(encoding="utf-8").strip()

# All 30 canonical flags across the Voyage. Cross-Island collision check below uses this.
ALL_FLAGS: set[str] = {
    "progctf{a_thousand_leagues_in_metadata}",
    "progctf{bilge_to_long_dread_clear_text}",
    "progctf{caesar_still_sails_with_us}",
    "progctf{calderwoods_dollar_sign_problem}",
    "progctf{deleted_means_marked_not_gone}",
    "progctf{drowned_eli_forgot_to_escape}",
    "progctf{i_will_love_you_until_the_tides_forget}",
    "progctf{never_commit_thy_secrets}",
    "progctf{never_trust_an_unsalted_man}",
    "progctf{passionfruit_for_the_bosun}",
    "progctf{quill_pressed_a_secret_into_metric}",
    "progctf{seafoam_keeps_no_secrets}",
    "progctf{shared_primes_make_thieves_of_us_all}",
    "progctf{silvercove_anchorage}",
    "progctf{slide_attack_on_a_lazy_schedule}",
    "progctf{squid_ate_the_canary}",
    "progctf{the_armada_confused_its_algorithms}",
    "progctf{the_bosun_loved_a_pattern}",
    "progctf{the_ghost_fleet_sails_inland}",
    "progctf{the_helmsman_left_his_swap_open}",
    "progctf{the_keelhauls_xor_was_a_red_herring}",
    "progctf{the_kraken_polluted_my_prototype}",
    "progctf{the_locker_held_two_secrets}",
    "progctf{the_rogue_buoy_spoke_in_xor}",
    "progctf{the_shanty_kept_two_halves}",
    "progctf{the_siren_sang_in_pixels}",
    "progctf{the_three_faces_of_a_single_b1n_polyglot}",
    "progctf{the_top_eight_bits_were_silent}",
    "progctf{two_captures_one_captain}",
    "progctf{x_marks_the_glass_bottle}",
}
assert flag in ALL_FLAGS, "this island's canonical flag missing from the registry"

# Decoy templates + word pools. Deterministic via fixed seed.
ADJ = ["rusty", "salty", "blackened", "drowned", "lost", "broken", "bilge", "kraken",
       "ghost", "barnacle", "tangled", "sunken", "tarred", "weathered", "moonlit",
       "starboard", "port", "knotted", "frayed", "bonebound"]
NOUN = ["compass", "cutlass", "anchor", "rope", "lantern", "barrel", "deck", "mast",
        "rudder", "keel", "sail", "cannon", "shroud", "halyard", "spyglass", "musket",
        "doubloon", "parley", "ledger", "pennant", "tankard", "grog", "oar", "scuttle",
        "binnacle", "fife", "rumcask", "swabber", "rumrunner", "carrack"]
VERB = ["sailed", "scuttled", "boarded", "plundered", "stole", "buried", "hauled",
        "splintered", "rigged", "weighed", "anchored", "drifted", "tacked", "jibed",
        "broached", "founded", "pressed", "marooned", "keelhauled", "navigated"]
PHRASE_TPL = [
    "progctf{{the_{adj}_{noun}}}",
    "progctf{{{verb}_in_the_{noun}}}",
    "progctf{{{adj}_{noun}_at_dawn}}",
    "progctf{{never_{verb}_a_{noun}}}",
    "progctf{{{noun}_of_the_{adj}_seas}}",
    "progctf{{the_{verb}_{noun}_returns}}",
    "progctf{{by_quill_and_{noun}}}",
    "progctf{{{adj}_to_the_{noun}}}",
    "progctf{{the_{noun}_keeps_no_secrets}}",
    "progctf{{three_{noun}s_and_a_{noun2}}}",
]

rng = random.Random("progctf-saltless-sailor-decoys-v1")
decoys: set[str] = set()
attempts = 0
while len(decoys) < 199 and attempts < 50000:
    attempts += 1
    tpl = rng.choice(PHRASE_TPL)
    candidate = tpl.format(
        adj=rng.choice(ADJ),
        noun=rng.choice(NOUN),
        noun2=rng.choice(NOUN),
        verb=rng.choice(VERB),
    )
    if candidate in ALL_FLAGS:
        continue
    if candidate == flag:
        continue
    decoys.add(candidate)

assert len(decoys) == 199, f"could not generate 199 unique decoys ({len(decoys)} after {attempts} attempts)"

# Cross-collision sanity: NO decoy can match any other Island's flag.
for d in decoys:
    assert d not in ALL_FLAGS, f"decoy collides with a real flag: {d}"

# 1. shadow.txt — single /etc/shadow-style line, SHA-1 hex of canonical flag.
sha1_hex = hashlib.sha1(flag.encode("utf-8")).hexdigest()
shadow_line = f"bluebeard:{sha1_hex}:19365:0:99999:7:::\n"
(OUT / "shadow.txt").write_text(shadow_line, encoding="utf-8")

# 2. pirates.txt — 200-line wordlist with the flag at a deterministic-but-non-trivial
#    position. Sorted-then-shuffled with the same seed is reproducible across runs.
all_lines = sorted(decoys) + [flag]
rng2 = random.Random("progctf-saltless-sailor-shuffle-v1")
rng2.shuffle(all_lines)
(OUT / "pirates.txt").write_text("\n".join(all_lines) + "\n", encoding="utf-8")

# 3. MANIFEST.txt
manifest_lines: list[str] = []
for fname in sorted(p.name for p in OUT.iterdir() if p.name != "MANIFEST.txt"):
    data = (OUT / fname).read_bytes()
    sha = hashlib.sha256(data).hexdigest()
    manifest_lines.append(f"{fname}\tsize={len(data)}\tsha256={sha}")
manifest_lines.append("")
manifest_lines.append("# How to solve:")
manifest_lines.append("#   hashcat -m 100 shadow.txt pirates.txt --username")
manifest_lines.append("#   ... OR for f in $(cat pirates.txt); do echo -n \"$f\" | sha1sum; done | grep <hash>")
(OUT / "MANIFEST.txt").write_text("\n".join(manifest_lines) + "\n", encoding="utf-8")

# 4. Self-verify
assert hashlib.sha1(flag.encode("utf-8")).hexdigest() == sha1_hex
flag_line_count = sum(1 for line in all_lines if line == flag)
assert flag_line_count == 1, f"flag must appear exactly once in pirates.txt, got {flag_line_count}"

# 5. Anti-leak: shadow.txt must not contain the flag literal.
shadow_body = (OUT / "shadow.txt").read_bytes()
assert flag.encode("utf-8") not in shadow_body, "FAIL: flag literal in shadow.txt"

print(f"OK saltless_sailor built. sha1={sha1_hex}  pirates.txt={len(all_lines)} lines (flag at position {all_lines.index(flag)+1})")
