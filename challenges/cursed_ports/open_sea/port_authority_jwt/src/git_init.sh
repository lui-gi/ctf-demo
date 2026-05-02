#!/bin/sh
# git_init.sh — materialize the two-commit history in /app/.git so that
# the .git/ directory is reachable as static content.
#
# Commit 1: initial app.js with the literal `const JWT_SECRET = 'salt_marks_secret_2017';`
# Commit 2: "remove debug constant — read from env" — replaces the constant
#           with `const JWT_SECRET = process.env.JWT_SECRET;`
#
# The container's runtime app.js is the COMMIT-2 source (the env-var version).
# git_init.sh writes commit-1's source into .git/ history only — never to a
# tracked working-tree file, so player-facing /app.js never contains the secret.

set -eu

cd /app

git init --quiet --initial-branch=main
git config user.name "Marrowtide Port Authority CI"
git config user.email "ci@portauthority.marrowtide.example"

# --- commit 1: initial app.js with the literal secret -------------------
# Stash the current (commit-2) app.js so we can swap it in for commit 1
# without altering its checked-out content.
mv app.js app.js.commit2

cat > app.js <<'EOF'
// Marrowtide Port Authority — clerk dashboard and harbormaster logbook.
//
// First cut for the dock-clerks: secret is currently a constant pending the
// secret-management story. TODO(perch): pull from env after the migration.

const express = require("express");
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");
const path = require("path");

const JWT_SECRET = 'salt_marks_secret_2017';

const TOKEN_TTL_SECONDS = 60 * 60 * 6; // 6h
const PORT = parseInt(process.env.PORT || "8080", 10);
const DEPLOY_ROOT = process.env.DEPLOY_ROOT || path.resolve(__dirname, "..");

const app = express();
app.use(bodyParser.json());

app.use(
  express.static(DEPLOY_ROOT, { dotfiles: "allow", index: false })
);

const ACCOUNTS = {
  clerk_perch: { password: "perch_at_dock", role: "clerk" },
  clerk_lowery: { password: "lowery_2024", role: "clerk" },
};

function issueToken(username, isHarbormaster) {
  const now = Math.floor(Date.now() / 1000);
  return jwt.sign(
    {
      sub: username,
      is_harbormaster: !!isHarbormaster,
      iat: now,
      exp: now + TOKEN_TTL_SECONDS,
    },
    JWT_SECRET,
    { algorithm: "HS256" }
  );
}

app.post("/api/auth/login", (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: "username and password required" });
  }
  const acct = ACCOUNTS[username];
  if (!acct || acct.password !== password) {
    return res.status(401).json({ error: "invalid credentials" });
  }
  return res.json({ token: issueToken(username, false), role: acct.role });
});

function authBearer(req, res, next) {
  const h = req.headers["authorization"] || "";
  const m = h.match(/^Bearer\s+(.+)$/);
  if (!m) return res.status(401).json({ error: "missing bearer token" });
  try {
    req.claims = jwt.verify(m[1], JWT_SECRET, { algorithms: ["HS256"] });
    return next();
  } catch (e) {
    return res.status(401).json({ error: "invalid token" });
  }
}

app.get("/api/dashboard", authBearer, (req, res) => {
  return res.json({
    user: req.claims.sub,
    is_harbormaster: !!req.claims.is_harbormaster,
    docks_in_use: 14,
  });
});

app.get("/admin/logbook", authBearer, (req, res) => {
  if (!req.claims.is_harbormaster) {
    return res.status(403).send("Forbidden");
  }
  return res.send("<h1>Harbormaster Logbook</h1>");
});

app.listen(PORT, () => console.log("[port-authority] listening on :" + PORT));
EOF

git add app.js package.json
git commit --quiet -m "initial port-authority app.js"

# --- commit 2: read the secret from env ---------------------------------
mv app.js.commit2 app.js
git add app.js
git commit --quiet -m "remove debug constant — read from env"

# Sanity: HEAD is commit 2 (env-var version). The literal secret only
# appears in commit 1's blob.
echo "[git_init] HEAD is at:"
git log --oneline

# Verify: literal secret must be present in commit 1, absent from HEAD.
if git show HEAD:app.js | grep -q "salt_marks_secret_2017"; then
  echo "[git_init] FAIL: literal secret found in HEAD app.js" >&2
  exit 1
fi
if ! git show HEAD~1:app.js | grep -q "salt_marks_secret_2017"; then
  echo "[git_init] FAIL: literal secret missing from commit 1" >&2
  exit 1
fi
echo "[git_init] verified: secret present in HEAD~1 (parent), absent from HEAD"
