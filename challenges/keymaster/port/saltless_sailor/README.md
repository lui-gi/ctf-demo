# The Saltless Sailor

The boatswain "Bluebeard" was a cheap man — cheap with rum, cheap with rope, cheap with crypto. When he set up the access list for the *Drowned Crow*'s captain console, he stored every password as raw SHA-1, no salt, like it was 1998 and computers didn't exist. We laughed about it then. We're laughing about it now.

A pull from the Crow's `/etc/shadow` washed up in our latest haul. There's exactly one entry of interest — Bluebeard's own line — and the password he picked is, of course, on every cracker's first list.

Crack his password. The password is the Treasure flavor.

## Files
- `shadow.txt` — single shadow-style line for user `bluebeard`
