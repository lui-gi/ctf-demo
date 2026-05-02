# Whispers — Armada of Confusion

## Whisper 1 (-10%)
The auth service exposes its public RSA key publicly. The verifier accepts JWTs in more than one algorithm. The classic confusion attack uses one of those algorithms to bypass the other.

## Whisper 2 (-20% cumulative)
Forge an HS256 token using the RSA public key (PEM-encoded bytes) as the HMAC secret. With a service-scope token, you can hit `/fleet/dispatch`. That endpoint is a server-side fetcher: use it to reach an internal address that gives out short-lived credentials for an S3 mock.

## Whisper 3 (-35% cumulative)
The dispatch endpoint's deny-list misses link-local. Hit `http://169.254.169.254/latest/meta-data/iam/security-credentials/dispatcher` through dispatch to harvest IAM creds. Use boto3 (or hand-rolled SigV4) to generate a presigned URL for `s3://sealed/manifest.txt`. Fetch that URL through dispatch (direct external access is blocked). Final 20%: handling SigV4 correctly with the temporary session token, and ensuring your forged JWT's claims pass dispatch's scope check.
