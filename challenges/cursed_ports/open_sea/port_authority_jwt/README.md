# Port Authority Pass

The Harbormaster's office at the Free Port of Saltmark runs a sleek little dashboard for tracking dock assignments — slip numbers, ship registries, the duty roster. Most of it is mundane. But the office's "logbook" page is gated: only Harbormasters can see it, and the Harbormasters guard their JWT-signed access tokens like grog rations.

Some clumsy clerk, however, left the office's git directory exposed at the root of the deployment. Old commits never die — they just hide in `.git/objects/`. If the office's signing secret was ever committed and later "removed," it's still in the history.

Recover the secret, forge a token that thinks you're a Harbormaster, and read the logbook. The Treasure is in the banner of `/admin/logbook`.

**Endpoint:** {provided at Voyage start}
