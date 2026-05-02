# Two Pcaps, One Boarding

The harbor patrol caught two transmissions off the *Salt Wraith* on the same night, fifteen minutes apart. The first was a sloppy FTP login from the captain's terminal to a fileshare on shore — fully cleartext, the gods preserve our luck. The second was a USB-keystroke capture from the same captain's keyboard, recorded by a hardware-implant our agent slipped into his cabin two weeks ago. The implant logs HID frames straight off the wire.

Neither pcap, alone, will give you the Treasure. But the credentials in pcap A unlock the captain's worldview enough to make sense of pcap B — and pcap B is where he typed his real night's work, including a long shell session he probably thought no one would ever see.

Combine the two captures. The Treasure is something the captain typed.

## Files
- `ftp.pcap` — cleartext FTP session
- `usb.pcap` — USB HID keyboard capture
