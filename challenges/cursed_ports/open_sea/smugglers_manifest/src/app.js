// Marrowtide cargo-manifest service.
//
// POST /api/cargo/search accepts a JSON body and runs
//     Cargo.find({ ...req.body, hidden: false })
// — a naïve object merge that lets the user inject Mongo operators.
// The intended attack is to smuggle a $where operator into the body so
// that Mongo evaluates server-side JS against every document, returning
// the hidden treasure document despite the post-filter.

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

const PORT = parseInt(process.env.PORT || "8080", 10);
const MONGO_URL = process.env.MONGO_URL || "mongodb://mongo:27017/marrowtide";

const cargoSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, index: true },
    weight: Number,
    port: String,
    hidden: { type: Boolean, default: false },
    treasure: String,
  },
  { strict: false } // allow $where evaluator-injected docs to round-trip
);
const Cargo = mongoose.model("Cargo", cargoSchema);

const app = express();
app.use(bodyParser.json({ limit: "16kb" }));

// Mundane public-facing query: GET ?name=rum (regex prefix match)
app.get("/api/cargo/search", async (req, res) => {
  try {
    const { name } = req.query;
    const filter = { hidden: false };
    if (typeof name === "string" && name.length > 0) {
      // Word-boundary contains-match — strict GET surface, no operators here.
      const safe = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.name = { $regex: safe, $options: "i" };
    }
    const docs = await Cargo.find(filter, { _id: 0, name: 1, weight: 1, port: 1 }).lean().limit(100);
    res.json(docs);
  } catch (e) {
    res.status(500).json({ error: "search failed" });
  }
});

// VULNERABLE: POST /api/cargo/search — naïve body merge into Mongo filter.
//
// The default {hidden: false} is set BEFORE spreading `body`, so any
// caller-supplied `hidden` (literal or operator-style) silently overrides
// it. This is a textbook NoSQL operator-injection bug:
//
//   {"hidden": true}                  → filter.hidden = true (literal override)
//   {"hidden": {"$ne": false}}        → filter.hidden = {$ne: false} (operator override)
//   {"$where": "this.hidden==true"}   → filter gets a $where clause; combined
//                                       with the still-present {hidden:false}
//                                       this is contradictory and returns []
//                                       — the *interesting* payload is the
//                                       direct override above.
//
// The hidden treasure-bearing doc is then returned verbatim, and the response
// projector below leaks its `treasure` field.
app.post("/api/cargo/search", async (req, res) => {
  try {
    const body = req.body || {};
    const filter = { hidden: false, ...body };
    const docs = await Cargo.find(filter).lean().limit(100);
    const out = docs.map((d) => ({
      name: d.name,
      weight: d.weight,
      port: d.port,
      ...(d.treasure ? { treasure: d.treasure } : {}),
    }));
    res.json(out);
  } catch (e) {
    // Disable verbose Mongo errors — players should not see raw query echoes.
    res.status(500).json({ error: "search failed" });
  }
});

app.get("/", (_req, res) => {
  res.type("html").send(
    "<h1>Marrowtide Cargo Manifest</h1><p>GET /api/cargo/search?name=rum or POST /api/cargo/search with a JSON body.</p>"
  );
});

app.get("/healthz", (_req, res) => res.json({ ok: true }));

async function main() {
  await mongoose.connect(MONGO_URL);
  console.log(`[smugglers] mongoose connected to ${MONGO_URL}`);
  app.listen(PORT, () => console.log(`[smugglers] listening on :${PORT}`));
}

main().catch((e) => {
  console.error("[smugglers] FATAL:", e.message);
  process.exit(1);
});
