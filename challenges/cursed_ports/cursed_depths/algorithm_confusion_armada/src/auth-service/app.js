// Armada auth service.
// Issues RS256-signed JWTs on /api/auth/login.
// Exposes the public key at /jwks.json (and a PEM-derivable form at /pubkey.pem).
// Verifier accepts BOTH RS256 and HS256 algorithms on the same key bytes —
// classic algorithm-confusion bug. The dispatch service uses this verifier.

const express = require("express");
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");
const fs = require("fs");

const PORT = parseInt(process.env.PORT || "8080", 10);
const PRIV_PEM = fs.readFileSync(process.env.PRIV_KEY_PATH || "/app/keys/private.pem");
const PUB_PEM = fs.readFileSync(process.env.PUB_KEY_PATH || "/app/keys/public.pem");
const PUB_PEM_STR = PUB_PEM.toString("utf-8");

// Demo accounts — clerk only. Players cannot register at scope='service'.
const ACCOUNTS = {
  clerk_perch: { password: "perch_at_dock", scope: "clerk" },
};

const app = express();
app.use(bodyParser.json());

app.post("/api/auth/login", (req, res) => {
  const { username, password } = req.body || {};
  const acct = ACCOUNTS[username];
  if (!acct || acct.password !== password) {
    return res.status(401).json({ error: "invalid credentials" });
  }
  const now = Math.floor(Date.now() / 1000);
  const token = jwt.sign(
    { sub: username, scope: acct.scope, iat: now, exp: now + 3600 },
    PRIV_PEM,
    { algorithm: "RS256" }
  );
  res.json({ token, scope: acct.scope });
});

// Standard JWKS endpoint — exposes the RSA public key.
app.get("/jwks.json", (_req, res) => {
  // Minimal JWKS: { keys: [{ kty, use, alg, kid, n, e }] }. We expose the PEM
  // alongside; players who don't want to reconstruct from n/e can grab the
  // PEM directly from /pubkey.pem and treat the file BYTES as the HS256 secret.
  const lines = PUB_PEM_STR.split("\n").filter((l) => l && !l.startsWith("-----"));
  const der_b64 = lines.join("");
  res.json({
    keys: [
      { kty: "RSA", use: "sig", alg: "RS256", kid: "armada-1", x5c: [der_b64] },
    ],
    note: "Public key also available as PEM at /pubkey.pem",
  });
});
app.get("/pubkey.pem", (_req, res) => res.type("application/x-pem-file").send(PUB_PEM_STR));

// VULNERABLE verifier — exposed for the dispatch service to import.
function verifyToken(token) {
  // Accepts BOTH RS256 (verified against PUB_PEM as RSA) AND HS256
  // (verified against PUB_PEM as a raw HMAC secret). Classic algorithm-
  // confusion bug. The exported function is what dispatch-service uses.
  return jwt.verify(token, PUB_PEM, { algorithms: ["RS256", "HS256"] });
}
module.exports = { verifyToken, PUB_PEM_STR };

app.get("/api/me", (req, res) => {
  const h = req.headers["authorization"] || "";
  const m = h.match(/^Bearer\s+(.+)$/);
  if (!m) return res.status(401).json({ error: "missing bearer" });
  try {
    const claims = verifyToken(m[1]);
    res.json({ ok: true, claims });
  } catch (e) {
    res.status(401).json({ error: "invalid token" });
  }
});

app.get("/healthz", (_req, res) => res.json({ ok: true }));

app.listen(PORT, () => console.log("[auth-service] listening on :" + PORT));
