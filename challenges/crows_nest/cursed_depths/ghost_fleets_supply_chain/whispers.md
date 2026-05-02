# Whispers — The Ghost Fleet's Supply Chain

## Whisper 1 (-10%)
The corporate site is a starting point, not an ending point. Each employee bio mentions something specific. One of them mentions something concrete you can navigate to — a private piece of internal infrastructure linked from the site footer.

## Whisper 2 (-20% cumulative)
Marrowtide publishes everything they host. Two of their public surfaces are designed for auditors, not users: an internal package-metadata mirror, and a certificate-transparency log of every TLS cert they have ever issued under their domain. If you can find a hostname in the CT log that nothing else on their public surface ever links to, that hostname is likely where the interesting thing lives. From there, remember that organisations that care about transparency tend to publish a `security.txt`.

## Whisper 3 (-35% cumulative)
The hidden subdomain (visible only in the CT log, not in any link) is `vault.marrowtide.example`. Its security.txt has an `Acknowledgements` URL pointing at a static page. That page contains five `<figure>` blocks with image `alt` attributes that, in document order, spell a five-word sentence. That sentence is the Treasure body. Final 20%: actually finding the CT log's interface, paging through its results to spot the unlinked subdomain, and parsing the alt-text correctly.
