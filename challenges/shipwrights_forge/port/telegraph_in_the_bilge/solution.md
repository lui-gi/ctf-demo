# Solution — Telegraph in the Bilge

## Intended solve

1. **Open `bilge.pcap` in Wireshark** (~1 min). Tool: Wireshark.
2. **Notice the protocol.** The capture is a TCP session on port 23 (Telnet). Wireshark labels it as Telnet automatically. (~1 min)
3. **Right-click any packet → Follow → TCP Stream** (~1 min). The reassembled stream shows a server banner ("HMS Long Dread Boarding Console — Password:"), a username typed character-by-character (`bilge_qm`), and then a password typed character-by-character. The flag is the typed password.
4. **Reconstruct the password** if needed. Telnet echoes one byte per direction; the password line in the reassembled stream looks like `progctf{bilge_to_long_dread_clear_text}` with possibly visible backspaces. Read it off the stream. (~2 min)

## Total estimated time: 5–10 minutes

## Why this is Port-tier
- Single technique: TCP-stream reassembly in Wireshark.
- Telnet is unencrypted by definition; no decryption needed.
- "Follow stream" is one of the first features any beginner learns.
- The flag is literally typed onto the wire — no parsing, no scripting.

## Implementer note
- Pcap should be small (<50 packets), TCP port 23, one direction sends the banner + prompts, the other types the password slowly.
- Optionally include 1–2 small typos with backspaces to make the stream feel authentic, but the final visible password must equal the flag.

## Verification

`files/bilge.pcap` cold-solved on 2026-05-01 with scapy (Wireshark "Follow TCP Stream" yields the same result):

```
$ file files/bilge.pcap
files/bilge.pcap: pcap capture file, microsecond ts (little-endian) - version 2.4 (Ethernet,
capture length 65535)

$ PYTHONIOENCODING=utf-8 python -c "
from scapy.all import rdpcap, TCP, Raw
import re
pkts = rdpcap('files/bilge.pcap')
c2s = b''.join(bytes(p[Raw].load) for p in pkts if TCP in p and Raw in p and p[TCP].dport == 23)
s2c = b''.join(bytes(p[Raw].load) for p in pkts if TCP in p and Raw in p and p[TCP].sport == 23)
print('client->server:', c2s)
print('server->client:', s2c)
print('flag:', re.search(rb'progctf\{[a-z0-9_]+\}', c2s).group(0).decode())"
client->server: b'bilge_qm\r\nprogctf{bilge_to_long_dread_clear_text}\r\n'
server->client: b'\xff\xfb\x01HMS Long Dread Boarding Console\r\nLogin: bilge_qm\r\nPassword: progctf{bilge_to_long_dread_clear_text}\r\nBoarding granted. Welcome, bilge_qm.\r\n'
flag: progctf{bilge_to_long_dread_clear_text}
```

- 115 packets, single Telnet (TCP/23) session, client port 49200.
- Server-side echo also exposes the flag — both sides of the stream reveal it,
  so a player who only follows one direction still wins.
- Recovered flag equals `flag.txt` byte-for-byte.
