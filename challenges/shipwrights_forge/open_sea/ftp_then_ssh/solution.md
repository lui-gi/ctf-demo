# Solution — Two Pcaps, One Boarding

## Intended solve

1. **Inspect `ftp.pcap`** in Wireshark. Filter `ftp` to see the FTP control channel. Follow TCP stream → see `USER captain_thorne` and `PASS bilgewater_sunset_71`. (~10 min)
2. **Note the FTP also lists a `RETR shell_history.txt.enc`** transfer — there's a binary file the captain downloaded. Carve it from the FTP-DATA stream using Wireshark "Export Objects → FTP-DATA" or by following the data stream. The downloaded blob is encrypted (small header looks like `Salted__` — OpenSSL salted format). (~10 min)
3. **Inspect `usb.pcap`** in Wireshark. Filter `usb.transfer_type == 0x01` (interrupt). Each HID-data frame is 8 bytes; the third byte is the keycode. Use a USB HID keymap to translate. Tools: `tshark -r usb.pcap -Y 'usb.transfer_type==0x01' -T fields -e usbhid.data`, then a 30-line Python script with the standard HID keycode table. (~20 min)
4. **Decode the keystrokes.** The captain typed (among other things): an OpenSSL command of the form `openssl enc -d -aes-256-cbc -in shell_history.txt.enc -k 'wraith_above_the_waves'`. (~15 min)
5. **Decrypt the FTP'd file with the recovered key:**
   ```
   openssl enc -d -aes-256-cbc -k 'wraith_above_the_waves' -in shell_history.txt.enc -out hist.txt
   ```
   Inside `hist.txt` is a real shell history. One of the lines is `echo 'progctf{...}' >> /root/.note`. (~5 min)

## Total estimated time: 60–90 minutes

## Why this is Open Sea
- Three distinct techniques chained: FTP cleartext credential carving, USB HID keystroke decoding, OpenSSL symmetric decryption.
- Neither pcap alone yields the flag — must combine.
- USB keystroke decoding is a well-known technique but requires writing a small script (no one-click tool).
- Beginner who knows "follow stream" will only get partial credit; the USB pcap demands real work.

## Implementer note
- `ftp.pcap`: standard FTP session showing USER/PASS/RETR. Include the encrypted blob `shell_history.txt.enc` as the FTP data payload. Encrypt `hist.txt` (which contains a flag-bearing line) with `openssl enc -aes-256-cbc -k 'wraith_above_the_waves'`.
- `usb.pcap`: standard Wireshark/USBPcap-style capture. Have the keystrokes type the openssl command verbatim, with a few realistic typos+backspaces. Use a regular en-US HID keymap.
- Flag: `progctf{two_captures_one_captain}`.

## Verification

`build/make.py` ran on 2026-05-01 (Python 3.13, scapy 2.7, cryptography). Salt, IV (via OpenSSL `EVP_BytesToKey` MD5), TCP ISNs, and pcap timestamps all derive deterministically from a SHA-256-counter PRG seeded by ("ftp_then_ssh|" + flag). Two builds produce byte-identical pcaps.

```
$ python build/make.py
[ftp_then_ssh] openssl blob: 496 bytes (Salted__ + 8-salt + ct)
[ftp_then_ssh] ftp.pcap: 42 frames
[ftp_then_ssh] usb.pcap: 168 frames (USBPCAP linktype 249)
[ftp_then_ssh] build OK

$ ls files/
MANIFEST.txt  ftp.pcap  usb.pcap

$ # Full cold-solve walk
$ python build/cold_solve.py
[player] ftp control stream:
    220 Marrowtide FTPd 4.2 ready.
    USER captain_thorne
    331 Password required for captain_thorne.
    PASS bilgewater_sunset_71
    230 User captain_thorne logged in.
    TYPE I
    200 Type set to I.
    PORT 10,20,30,5,192,49
    200 PORT command successful.
    RETR shell_history.txt.enc
    150 Opening BINARY mode data connection for shell_history.txt.enc (496 bytes).
    226 Transfer complete.
    QUIT
    221 Goodbye.

[player] FTP credentials: captain_thorne / bilgewater_sunset_71
[player] data-stream blob: 496 bytes, prefix=b'Salted__'

[player] decoded usb keystrokes:
  "openssl enc -d -aes-256-cbc -in shell_history.txt.enc -k 'wraith_above_the_waves'"

[player] recovered OpenSSL passphrase: b'wraith_above_the_waves'

[player] decrypted shell_history.txt (last 5 lines):
    rm /tmp/notes.txt
    scp /tmp/notes.enc pilot@gallowstide.lan:/var/anchor/
    history -c
    echo 'progctf{two_captures_one_captain}' >> /root/.note
    shutdown -h +5 'maintenance window'

RECOVERED: echo 'progctf{two_captures_one_captain}' >> /root/.note
```

**Anti-leak audit:**
- `grep -ao "wraith_above_the_waves" files/ftp.pcap | wc -l` returns 0 — the OpenSSL passphrase appears ONLY in `usb.pcap` keystrokes, never in the FTP capture.
- `grep -r --binary-files=text "$(cat flag.txt)" .` excluding `flag.txt`/`solution.md`/`spec.yaml`/`whispers.md`/`README.md`/`MANIFEST.txt`/`build/`: zero matches. The flag exists only inside the AES-256-CBC ciphertext payload of `ftp.pcap` (which requires the passphrase from `usb.pcap` to decrypt).
- One realistic typo+backspace pattern at the start of the openssl command (typed "opem" → backspace → "nssl..." → composed "openssl") makes the keystroke capture look authentic.

**Pcap notes:**
- `ftp.pcap` is standard Ethernet/IP/TCP; Wireshark dissects FTP control on port 21 and FTP-DATA on port 20. "Follow TCP Stream" recovers cleartext credentials immediately; "Export Objects → FTP-DATA" extracts `shell_history.txt.enc` as a binary file.
- `usb.pcap` uses USBPCAP link-type 249 (Wireshark dissects this natively as USBpcap; scapy reads packets as Raw and the cold-solve harness skips the 27-byte USBPCAP header before reading the 8-byte HID keyboard report).
- Both pcaps open cleanly in Wireshark 4.x with default dissectors; `usb.transfer_type == 0x01` filter shows the keystroke interrupt-IN frames.
