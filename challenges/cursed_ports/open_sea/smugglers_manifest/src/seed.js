// seed.js — populate the marrowtide.cargo collection with 30 visible
// public-cargo entries plus EXACTLY ONE hidden treasure-bearing entry.

const mongoose = require("mongoose");

const MONGO_URL = process.env.MONGO_URL || "mongodb://mongo:27017/marrowtide";
const FLAG = process.env.FLAG || "progctf{calderwoods_dollar_sign_problem}";

const cargoSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, index: true },
    weight: Number,
    port: String,
    hidden: { type: Boolean, default: false },
    treasure: String,
  },
  { strict: false }
);
const Cargo = mongoose.model("Cargo", cargoSchema);

const PORTS = ["Marrowtide", "Gallows Point", "Silvercove", "Wheel Rock", "Reefborn"];
const NAMES = [
  "spiced rum", "salt-fish", "barreled lard", "crystal ginger", "tar barrels",
  "iron nails", "mizzen sailcloth", "tarred rope", "ground pepper", "dried citron",
  "molasses", "Jamaican rum", "salted pork", "burnt sugar", "wax candles",
  "smoked herring", "anchored ironwork", "blue dye", "saffron threads", "raw silk",
  "tobacco leaf", "bone meal", "Bermuda cedar", "fish oil", "tallow",
  "cocoa nibs", "rope hemp", "fired brick", "linen sheets", "spiced biscuit",
];

async function main() {
  await mongoose.connect(MONGO_URL);
  await Cargo.deleteMany({});
  const docs = [];
  for (let i = 0; i < NAMES.length; i++) {
    docs.push({
      name: NAMES[i],
      weight: 50 + (i * 17) % 200,
      port: PORTS[i % PORTS.length],
      hidden: false,
    });
  }
  // EXACTLY ONE hidden doc — a non-suspicious decoy name so it doesn't
  // jump out of an exhaustive list, and the flag in the `treasure` field.
  docs.push({
    name: "calderwoods private cask",
    weight: 117,
    port: "Marrowtide",
    hidden: true,
    treasure: FLAG,
  });
  await Cargo.insertMany(docs);
  console.log(`[seed] inserted ${docs.length} docs (1 hidden) — flag in 'treasure'`);
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error("[seed] FATAL:", e.message);
  process.exit(1);
});
