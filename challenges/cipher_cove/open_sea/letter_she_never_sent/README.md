# The Letter She Never Sent

> *"I writ it on parchment the colour of drowned moons, and I sealed it with the salt of my own grieving. The waves were meant to carry it. The waves kept it instead."*
> — fragment recovered from Calypso's tide-shrine

When the wreck of the *Deadwake* was hauled up from the trench, three things were lashed together inside the captain's strongbox: a sealed cipher-letter addressed to no one living, a wax cylinder of breaking surf, and a battered chapbook of an old shanty the crew had sung at every weighing of anchor. The salvors swore the parcel was Calypso's farewell to Davy himself — undelivered, undecrypted, unread for a hundred winters.

The letter is locked. The waves are humming. The shanty is just a shanty until you know which words to read.

Find Calypso's last message to her drowned love. The closing line of the letter is the Treasure.

## Files
- `letter.bin` — sealed parchment. AES-256-CBC. The IV is prepended to the ciphertext.
- `waves.wav` — a recording of surf, ~30 seconds, 16-bit PCM mono. The sea remembers things the land forgets.
- `shanty.pdf` — *The Tides Forget*: six pages of an old fo'c'sle song, lyrics only.

## The task
Recover the passphrase that opens the letter, decrypt the letter, and read what Calypso wrote. Submit the closing line as the flag.

The letter's key is derived with **PBKDF2-HMAC-SHA256**, salt `b"deadwake-tides"`, **100000** iterations, dklen 32. The passphrase is not in any file. The waves know where to look.
