# Armada of Confusion

The *Black Armada Group* runs an internal authentication mesh for its fleet of microservices. User-facing tokens are signed `RS256` (asymmetric, public key shared everywhere). Service-to-service tokens are signed `HS256` (symmetric, with a secret only the services know). The verifier was written by a junior officer who, fatefully, treats the algorithm field of incoming tokens as authoritative.

Behind the user portal lies an internal `/fleet/dispatch` endpoint that talks to a cloud-metadata mock at `169.254.169.254` to pull IAM credentials for an S3 mock bucket. Inside that bucket lives a sealed manifest, signed-URL access only.

To get there: forge a service-token using algorithm confusion, abuse `/fleet/dispatch` for blind SSRF against the metadata mock, harvest temporary IAM credentials, sign your own S3 URL, fetch the manifest. The Treasure is the manifest's body.

**Endpoint:** {provided at Voyage start}
