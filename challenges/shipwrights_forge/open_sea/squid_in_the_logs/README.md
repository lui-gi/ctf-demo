# Squid in the Logs

Deadwake's HQ runs a Squid proxy for every device on its private dock-network — a 40-megabyte access log of every web request the staff made last quarter. Boring, mostly. Cat pictures. Stack Overflow. Some unwise port-forwarding to a karaoke service.

But somewhere in those 40 megabytes, a malicious agent has been quietly exfiltrating data through a covert channel. The requests look almost normal, but they're paced with deliberate intervals, they all have the same bizarre User-Agent string, and they all carry small base64 payloads in URL parameters. Reassemble the channel, and you'll recover what they were exfiltrating: a single document whose contents include the Treasure.

## Files
- `access.log` — Squid access log (~40 MB)
