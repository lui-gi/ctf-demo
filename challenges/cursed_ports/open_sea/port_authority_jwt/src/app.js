// Marrowtide Port Authority — clerk dashboard and harbormaster logbook.
//
// Deployment-time secret is read from the environment (see commit history for
// how this used to be done). HS256 JWTs gate the harbormaster logbook.

const express = require("express");
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");
const path = require("path");
const fs = require("fs");

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error("FATAL: JWT_SECRET env var is not set");
  process.exit(1);
}

const TOKEN_TTL_SECONDS = 60 * 60 * 6; // 6h
const PORT = parseInt(process.env.PORT || "8080", 10);
const DEPLOY_ROOT = process.env.DEPLOY_ROOT || path.resolve(__dirname, "..");

const app = express();
app.use(bodyParser.json());

// --- intentional .git/ exposure -----------------------------------------
// The deployment root is served as static so the .git/ subdirectory is
// reachable. Players use git-dumper-style tooling against this root.
app.use(
  express.static(DEPLOY_ROOT, {
    dotfiles: "allow",
    index: false,
    setHeaders: (res, fp) => {
      // Serve raw bytes for git pack/index objects — no listing prettifier.
      res.setHeader("X-Marrowtide-Server", "port-authority/1.0");
    },
  })
);

// --- demo accounts (in-memory) ------------------------------------------
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

// --- POST /api/auth/login -----------------------------------------------
app.post("/api/auth/login", (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: "username and password required" });
  }
  const acct = ACCOUNTS[username];
  if (!acct || acct.password !== password) {
    return res.status(401).json({ error: "invalid credentials" });
  }
  // Clerks only — registration as harbormaster is not supported.
  return res.json({
    token: issueToken(username, false),
    role: acct.role,
    note: "clerk role only; harbormaster role is reserved for the Port Authority",
  });
});

// --- POST /api/auth/register --------------------------------------------
app.post("/api/auth/register", (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: "username and password required" });
  }
  if (ACCOUNTS[username]) {
    return res.status(409).json({ error: "user already exists" });
  }
  // Hard-coded role — no parameter to upgrade beyond clerk.
  ACCOUNTS[username] = { password, role: "clerk" };
  return res.json({ token: issueToken(username, false), role: "clerk" });
});

// --- middleware: bearer auth --------------------------------------------
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

// --- GET /api/dashboard -------------------------------------------------
app.get("/api/dashboard", authBearer, (req, res) => {
  return res.json({
    user: req.claims.sub,
    is_harbormaster: !!req.claims.is_harbormaster,
    docks_in_use: 14,
    next_tide_high_utc: "2026-05-01T18:42:00Z",
    notice:
      "Harbormaster's logbook is restricted to the Port Authority. Clerks see this dashboard only.",
  });
});

// --- GET /admin/logbook -------------------------------------------------
app.get("/admin/logbook", authBearer, (req, res) => {
  if (!req.claims.is_harbormaster) {
    return res.status(403).type("html").send(
      "<h1>403 Forbidden</h1><p>This logbook is restricted to the Marrowtide Harbormaster.</p>"
    );
  }
  // The flag lives ONLY in the rendered HTML banner. It is not in any
  // env var, source file, or other endpoint.
  return res.type("html").send(
    `<!DOCTYPE html>
<html lang="en">
<head><title>Harbormaster Logbook — Marrowtide</title></head>
<body>
  <h1>Harbormaster Logbook</h1>
  <p class=banner>progctf{never_commit_thy_secrets}</p>
  <p>Logbook entries from the past 24 hours follow…</p>
  <ul>
    <li>06:14 — schooner Reefborn departed berth 9</li>
    <li>09:30 — pilot escort requested for incoming brig</li>
    <li>14:02 — silver shipment cleared customs at warehouse 4</li>
  </ul>
</body>
</html>`
  );
});

// --- root + health ------------------------------------------------------
app.get("/", (_req, res) => {
  res
    .type("html")
    .send(
      "<h1>Marrowtide Port Authority</h1><p>POST /api/auth/login or /api/auth/register, then GET /api/dashboard.</p>"
    );
});

app.get("/healthz", (_req, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  console.log(`[port-authority] listening on :${PORT}`);
});
