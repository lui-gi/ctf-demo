// Marrowtide bill-of-lading service.
//
// In-memory quote store with PATCH endpoint that recursively deep-merges JSON
// into the stored quote — INTENTIONALLY without any __proto__ guard or key
// allowlist. The GET /api/quotes/:id/bill route renders an EJS template with
// the quote object as the context. EJS@3.1.6 reads several internal options
// (escapeFunction, outputFunctionName, ...) through ordinary property lookup,
// which falls through to Object.prototype. The intended exploit pollutes
// Object.prototype.escapeFunction with a function-source string that EJS then
// evaluates during render — and that polluted function reads /treasure.
//
// We do NOT use lodash.merge (which has a __proto__ guard).

const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const crypto = require("crypto");

const PORT = parseInt(process.env.PORT || "8080", 10);

const QUOTES = new Map(); // id → quote object (in-memory)

const BILL_TEMPLATE = `<!doctype html>
<html><head><title>Bill of Lading — <%= meta.shipName %></title></head>
<body>
  <h1>Marrowtide Cargo — Bill of Lading</h1>
  <p>Quote id: <%= id %></p>
  <p>Customer: <%= customer %></p>
  <p>Cargo: <%= cargo %></p>
  <p>Weight: <%= weight %> stone</p>
  <p>Price: <%= price %> sovereigns</p>
  <p>Notes: <%= notes %></p>
</body></html>`;

const app = express();
app.use(bodyParser.json({ limit: "32kb" }));

// VULNERABLE deep-merge: no __proto__ filter, no allowlist.
// Recursively merges patch.* into target.*; objects merge, scalars overwrite.
function vulnerableMerge(target, patch) {
  if (target === null || typeof target !== "object") return patch;
  if (patch === null || typeof patch !== "object") return patch;
  for (const key in patch) {
    // No filter on `key` — __proto__ / constructor / prototype all pass through.
    const v = patch[key];
    if (v !== null && typeof v === "object" && !Array.isArray(v)) {
      if (typeof target[key] !== "object" || target[key] === null || Array.isArray(target[key])) {
        target[key] = {};
      }
      vulnerableMerge(target[key], v);
    } else {
      target[key] = v;
    }
  }
  return target;
}

// POST /api/quotes — create a new quote (player-supplied initial fields).
app.post("/api/quotes", (req, res) => {
  const id = crypto.randomBytes(6).toString("hex");
  const initial = {
    id,
    customer: "(unknown)",
    cargo: "(none)",
    weight: 0,
    price: 0,
    notes: "(none)",
    meta: { shipName: "Reefborn" },
  };
  vulnerableMerge(initial, req.body || {});
  initial.id = id; // protect id field from clobbering
  QUOTES.set(id, initial);
  res.json({ id, quote: initial });
});

// PATCH /api/quotes/:id — recursively deep-merge new fields. VULNERABLE.
app.patch("/api/quotes/:id", (req, res) => {
  const q = QUOTES.get(req.params.id);
  if (!q) return res.status(404).json({ error: "no such quote" });
  vulnerableMerge(q, req.body || {});
  q.id = req.params.id; // keep id stable
  res.json({ ok: true, quote: q });
});

// GET /api/quotes/:id — read the stored quote (debug aid).
app.get("/api/quotes/:id", (req, res) => {
  const q = QUOTES.get(req.params.id);
  if (!q) return res.status(404).json({ error: "no such quote" });
  res.json(q);
});

// GET /api/quotes/:id/bill — render the printable bill via ejs.render.
// EJS reads internal options (escapeFunction, outputFunctionName, ...) on its
// options object; if Object.prototype was polluted with one of those keys,
// EJS picks it up via prototype lookup during render. That's the SSTI sink.
app.get("/api/quotes/:id/bill", (req, res) => {
  const q = QUOTES.get(req.params.id);
  if (!q) return res.status(404).type("html").send("<h1>404</h1>");
  try {
    const html = ejs.render(BILL_TEMPLATE, q);
    res.type("html").send(html);
  } catch (e) {
    res.status(500).type("html").send("<h1>render failed</h1>");
  }
});

// Health check — uses a SEPARATE fixed object so polluted state can't crash it.
app.get("/healthz", (_req, res) => res.json({ ok: true }));

app.get("/", (_req, res) => {
  res.type("html").send(
    "<h1>Marrowtide Bill-of-Lading</h1>" +
      "<p>POST /api/quotes to create, PATCH /api/quotes/:id to update, GET /api/quotes/:id/bill to render.</p>"
  );
});

app.listen(PORT, () => console.log("[kraken] listening on :" + PORT));

// Auto-restart safety net: if any uncaught exception or unhandled rejection
// fires (likely a polluted state crashing the renderer), exit so the
// container orchestrator restarts us.
process.on("uncaughtException", (e) => {
  console.error("[kraken] uncaughtException:", e.message);
  setTimeout(() => process.exit(1), 100);
});
process.on("unhandledRejection", (e) => {
  console.error("[kraken] unhandledRejection:", e && e.message);
  setTimeout(() => process.exit(1), 100);
});
