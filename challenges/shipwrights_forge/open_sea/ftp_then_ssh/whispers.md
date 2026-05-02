# Whispers — Two Pcaps, One Boarding

## Whisper 1 (-10%)
The FTP pcap leaks more than just credentials — it also transfers a file. Carve the file out of the data stream and look at it.

## Whisper 2 (-20% cumulative)
The USB pcap is a HID-keyboard capture. Each frame's third byte is a keycode. Decode the keystrokes using a standard USB HID keymap (any small Python script will do; many writeups exist for the *technique*, none give the keys). The captain types a command that decrypts the file you carved from the FTP pcap.

## Whisper 3 (-35% cumulative)
Filter `usb.transfer_type == 0x01` in Wireshark, dump the third byte of each `usbhid.data`, and translate via the HID usage table. The decoded session contains an `openssl enc -d -aes-256-cbc -k <password> -in shell_history.txt.enc` command. Run it on the carved file. Final 20%: parse the resulting shell history and find the line that exports the Treasure.
