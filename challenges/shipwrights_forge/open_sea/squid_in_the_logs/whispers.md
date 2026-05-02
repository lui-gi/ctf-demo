# Whispers — Squid in the Logs

## Whisper 1 (-10%)
The log is too big to read. Aggregate by some attribute that should be uniform across legitimate traffic — User-Agent is a good candidate — and look for the outlier.

## Whisper 2 (-20% cumulative)
A small fraction of requests share an unusual User-Agent and carry base64 payloads in their URL parameters. Each request also carries a sequence number. Extract those requests, sort by sequence, concatenate the payloads, and decode.

## Whisper 3 (-35% cumulative)
The exfiltrated content is a small file. Reconstruct it: filter by the suspicious UA, extract the `seq` and `data` URL parameters, sort by `seq`, concat the `data` strings, base64-decode, write to disk. The result is a readable file containing the Treasure. Final 20%: figuring out what filetype the bytes are and where exactly the flag string sits inside it.
