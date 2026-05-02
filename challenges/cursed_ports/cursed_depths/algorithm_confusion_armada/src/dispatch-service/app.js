// Armada dispatch service.
// Requires JWT with scope='service'. Verifier accepts BOTH RS256 and HS256
// against the auth-service's public key (algorithm-confusion bug).
//
// GET /fleet/dispatch?target=<url>  — server-side fetch with deny-list.
// Deny-list rejects localhost / 127.0.0.1 / 0.0.0.0 and well-known IPv6
// loopbacks AND the dispatch service's own hostname. It DOES NOT block
// the link-local 169.254.0.0/16 — that's the intended SSRF channel to
// the metadata-mock.

const express = require("express");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const http = require("http");
const https = require("https");
const url = require("url");

const PORT = parseInt(process.env.PORT || "8080", 10);
const PUB_PEM = fs.readFileSync(process.env.PUB_KEY_PATH || "/app/keys/public.pem");

function verifyToken(token) {
  // SAME bug as auth-service — accepts BOTH algorithms on the public key.
  return jwt.verify(token, PUB_PEM, { algorithms: ["RS256", "HS256"] });
}

const app = express();

function authBearerService(req, res, next) {
  const h = req.headers["authorization"] || "";
  const m = h.match(/^Bearer\s+(.+)$/);
  if (!m) return res.status(401).json({ error: "missing bearer" });
  try {
    const claims = verifyToken(m[1]);
    if (claims.scope !== "service") {
      return res.status(403).json({ error: "scope=service required" });
    }
    req.claims = claims;
    return next();
  } catch (e) {
    return res.status(401).json({ error: "invalid token" });
  }
}

const DENY_HOSTS = new Set([
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
  "::1",
  "[::1]",
  "dispatch",
  "dispatch.local",
]);
const DENY_DECIMAL_PREFIXES = ["127.", "0."];
function deniedHost(host) {
  if (!host) return true;
  const h = host.toLowerCase();
  if (DENY_HOSTS.has(h)) return true;
  for (const p of DENY_DECIMAL_PREFIXES) if (h.startsWith(p)) return true;
  // Block IPv4-mapped IPv6 forms of loopback.
  if (h.includes("::ffff:127.")) return true;
  return false;
  // Note: 169.254.0.0/16 is NOT in the deny list — by design.
}

app.get("/fleet/dispatch", authBearerService, (req, res) => {
  const target = req.query.target;
  if (typeof target !== "string" || !target) {
    return res.status(400).json({ error: "target query param required" });
  }
  let parsed;
  try {
    parsed = new url.URL(target);
  } catch (e) {
    return res.status(400).json({ error: "invalid target URL" });
  }
  if (!/^https?:$/.test(parsed.protocol)) {
    return res.status(400).json({ error: "only http/https allowed" });
  }
  if (deniedHost(parsed.hostname)) {
    return res.status(403).json({ error: "target host denied" });
  }

  const lib = parsed.protocol === "https:" ? https : http;
  const reqOut = lib.request(
    parsed,
    { method: "GET", timeout: 8000, headers: { "user-agent": "armada-dispatch/1.0" } },
    (resOut) => {
      const chunks = [];
      resOut.on("data", (c) => chunks.push(c));
      resOut.on("end", () => {
        const body = Buffer.concat(chunks);
        // Pass through verbatim so SSRF responses are readable.
        res.status(resOut.statusCode || 502);
        for (const [k, v] of Object.entries(resOut.headers)) {
          if (k.toLowerCase() === "transfer-encoding") continue;
          res.setHeader(k, v);
        }
        res.send(body);
      });
    }
  );
  reqOut.on("error", (e) => res.status(502).json({ error: "fetch failed", reason: e.message }));
  reqOut.on("timeout", () => {
    reqOut.destroy(new Error("timeout"));
  });
  reqOut.end();
});

app.get("/healthz", (_req, res) => res.json({ ok: true }));

app.listen(PORT, () => console.log("[dispatch-service] listening on :" + PORT));
