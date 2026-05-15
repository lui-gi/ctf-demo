'use strict'
const Database = require('better-sqlite3')
const bcrypt = require('bcryptjs')
const crypto = require('crypto')
const path = require('path')

const db = new Database(path.join(__dirname, '..', 'ctf.db'))
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS crews (
    id TEXT PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    invite_code TEXT UNIQUE NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS crew_members (
    user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    crew_id TEXT NOT NULL REFERENCES crews(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    icon TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS challenges (
    id TEXT PRIMARY KEY,
    category_id TEXT NOT NULL REFERENCES categories(id),
    slug TEXT NOT NULL,
    title TEXT NOT NULL,
    difficulty TEXT NOT NULL CHECK(difficulty IN ('easy','medium','hard')),
    points INTEGER NOT NULL,
    embed_url TEXT,
    download_urls TEXT DEFAULT '[]',
    flag TEXT NOT NULL,
    description TEXT,
    UNIQUE(category_id, slug)
  );

  CREATE TABLE IF NOT EXISTS questions (
    id TEXT PRIMARY KEY,
    challenge_id TEXT NOT NULL REFERENCES challenges(id),
    text TEXT NOT NULL,
    answer TEXT NOT NULL,
    points INTEGER NOT NULL,
    sort_order INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS hints (
    id TEXT PRIMARY KEY,
    question_id TEXT NOT NULL REFERENCES questions(id),
    text TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS hint_uses (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    hint_id TEXT NOT NULL REFERENCES hints(id),
    used_at TEXT DEFAULT (datetime('now')),
    UNIQUE(user_id, hint_id)
  );

  CREATE TABLE IF NOT EXISTS solves (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    challenge_id TEXT,
    question_id TEXT,
    type TEXT NOT NULL CHECK(type IN ('flag','question')),
    points_earned INTEGER NOT NULL,
    solved_at TEXT DEFAULT (datetime('now'))
  );
`)

try { db.exec('ALTER TABLE categories ADD COLUMN type_name TEXT') } catch {}
try { db.exec('ALTER TABLE challenges ADD COLUMN description TEXT') } catch {}

// Backfill type_name for rows seeded before this column existed
const _typeNames = {
  'cursed-ports':      'Web Exploitation',
  'cipher-cove':       'Cryptography',
  'shipwrights-forge': 'Network & Log Analysis',
  'lighthouse':        'Forensics',
  'crows-nest':        'OSINT',
  'hidden-cargo':      'Steganography',
  'keymaster':         'Password Cracking',
}
const _upd = db.prepare('UPDATE categories SET type_name=? WHERE slug=? AND type_name IS NULL')
for (const [slug, typeName] of Object.entries(_typeNames)) _upd.run(typeName, slug)

if (db.prepare('SELECT COUNT(*) as c FROM categories').get().c !== 7) {
  seed()
}

db.prepare('DELETE FROM crews WHERE id NOT IN (SELECT DISTINCT crew_id FROM crew_members)').run()

function seed() {
  db.prepare('DELETE FROM solves').run()
  db.prepare('DELETE FROM questions').run()
  db.prepare('DELETE FROM challenges').run()
  db.prepare('DELETE FROM categories').run()

  const cats = [
    { slug: 'cursed-ports',      name: "Cursed Ports",       icon: '⚓',  typeName: 'Web Exploitation',      order: 0 },
    { slug: 'cipher-cove',       name: 'Cipher Cove',        icon: '🔐', typeName: 'Cryptography',           order: 1 },
    { slug: 'shipwrights-forge', name: "Shipwright's Forge", icon: '⚙️', typeName: 'Network & Log Analysis', order: 2 },
    { slug: 'lighthouse',        name: 'Lighthouse',         icon: '🏮', typeName: 'Forensics',              order: 3 },
    { slug: 'crows-nest',        name: "Crow's Nest",        icon: '🦅', typeName: 'OSINT',                  order: 4 },
    { slug: 'hidden-cargo',      name: 'Hidden Cargo',       icon: '📦', typeName: 'Steganography',          order: 5 },
    { slug: 'keymaster',         name: 'Keymaster',          icon: '🔑', typeName: 'Password Cracking',      order: 6 },
  ]

  const insertCat = db.prepare('INSERT INTO categories (id, slug, name, icon, type_name, sort_order) VALUES (?, ?, ?, ?, ?, ?)')
  const insertCh  = db.prepare('INSERT INTO challenges (id, category_id, slug, title, difficulty, points, embed_url, download_urls, flag) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')

  const catIds = {}
  for (const c of cats) {
    const catId = crypto.randomUUID()
    catIds[c.slug] = catId
    insertCat.run(catId, c.slug, c.name, c.icon, c.typeName, c.order)
    if (c.slug !== 'cipher-cove') {
      insertCh.run(crypto.randomUUID(), catId, 'coming-soon', 'Coming Soon', 'easy', 0, null, '[]', 'CTF{placeholder}')
    }
  }

  seedChallenges(catIds)

  // Demo user
  const demoId = crypto.randomUUID()
  db.prepare('INSERT OR IGNORE INTO users (id, username, email, password_hash) VALUES (?, ?, ?, ?)')
    .run(demoId, 'pirate', 'pirate@progctf.dev', bcrypt.hashSync('password123', 10))
}

const MOB_DESCRIPTION = `A weathered bottle washes ashore. Inside, a rolled piece of paper holds a series of strange inscriptions. Someone went to great lengths to hide this message. Can you unravel what they were trying to say?

── 4 January, 1842 ───────────────────────────────────────────────────────────────────────────
01010100 01101000 01100101 00100000 01110011 01100101 01100001 00100000 01101000 01101111 01101100 01100100 01110011 00100000 01110011 01100101 01100011 01110010 01100101 01110100 01110011 00101110 00100000 01010100 01101000 01100101 00100000 01101011 01100101 01111001 00100000 01101001 01110011 00111010 00100000 00110100 00110010 00101110 00100000 01110000 01110010 01101111 01100111 01100011 01110100 01100110 01111011 01011010 01000101 01010010 00110000 01010011 01011111 00110100 01001110 01000100 01011111 01001111 01001110 00110011 01010011 01111101

── 19 September, 1842 ────────────────────────────────────────────────────────────────────────
79 4f 5a 5e 4f 47 48 4f 58 0a 1b 13 06 0a 72 72 1c 1e 20 20 63 0a 4e 43 4e 0a 44 45 5e 0a 5e 58 5f 59 5e 0a 4b 0a 59 43 44 4d 46 4f 0a 46 45 49 41 04 0a 79 45 0a 63 0a 5d 58 4b 5a 5a 4f 4e 0a 47 53 0a 59 4f 49 58 4f 5e 0a 5e 42 58 4f 4f 0a 5e 43 47 4f 59 0a 45 5c 4f 58 04 20 6c 43 58 59 5e 0a 43 44 0a 5e 42 4f 0a 5e 45 44 4d 5f 4f 0a 45 4c 0a 47 4b 49 42 43 44 4f 59 06 0a 5e 42 4f 44 0a 4c 45 46 4e 4f 4e 0a 46 43 41 4f 0a 4b 0a 46 4f 5e 5e 4f 58 0a 44 45 0a 45 44 4f 0a 4c 45 46 4e 59 0a 4b 44 53 47 45 58 4f 06 20 5e 42 4f 44 0a 59 42 5f 4c 4c 46 4f 4e 0a 46 43 41 4f 0a 4b 0a 4e 4f 49 41 0a 45 4c 0a 49 4b 58 4e 59 04 0a 65 44 46 53 0a 59 45 47 4f 45 44 4f 0a 5a 4b 5e 43 4f 44 5e 0a 4f 44 45 5f 4d 42 0a 5e 45 0a 5a 4f 4f 46 0a 43 5e 0a 4b 46 46 20 48 4b 49 41 0a 4e 4f 59 4f 58 5c 4f 59 0a 5e 45 0a 58 4f 4b 4e 0a 5d 42 4b 5e 0a 63 0a 46 4f 4c 5e 0a 48 4f 42 43 44 4e 04 20 20 5a 58 45 4d 49 5e 4c 51 7a 1e 79 79 75 7e 62 6f 75 61 6f 73 57

── 2 February, 1843 ──────────────────────────────────────────────────────────────────────────
593256696448426e633374485254464457544e6657554a5157444e5266513d3d`

const PARROT_DESCRIPTION = `The Pounce Pirates have ransacked Broad Street and vanished without a trace, but in their haste, they left behind their beloved parrot, Pouncy. Pouncy won't stop squawking numbers. Nonsense, most would say. But you recognize something familiar in the pattern. The pirates were sloppy. They trusted a weak key, and Pouncy has said too much. Can you figure out where they're headed next?

n = 3233
e = 17

c = [612, 2412, 2185, 2923, 281, 884, 1369, 855, 2923, 1313,
     2185, 2412, 2923, 3179, 1632, 119, 1632, 1627, 2160, 1632,
     2412, 3179, 2160, 2271, 1516]`

function seedParrotChallenge(catId) {
  const insertQ = db.prepare('INSERT INTO questions (id, challenge_id, text, answer, points, sort_order) VALUES (?, ?, ?, ?, ?, ?)')
  const insertH = db.prepare('INSERT INTO hints (id, question_id, text, sort_order) VALUES (?, ?, ?, ?)')

  const parrotId = crypto.randomUUID()
  db.prepare('INSERT INTO challenges (id, category_id, slug, title, difficulty, points, embed_url, download_urls, flag, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
    .run(parrotId, catId, 'parrot-knows-too-much', 'The Parrot Knows Too Much', 'medium', 150, null, '[]', 'progctf{GE0R91A_AQU4R1UM}', PARROT_DESCRIPTION)

  const q1Id = crypto.randomUUID()
  const q2Id = crypto.randomUUID()
  const q3Id = crypto.randomUUID()
  const q4Id = crypto.randomUUID()
  const q5Id = crypto.randomUUID()

  insertQ.run(q1Id, parrotId, 'What cryptographic algorithm is being used?', 'rsa', 15, 1)
  insertQ.run(q2Id, parrotId, 'What are the two prime factors of n? (comma-separated, lowest first, no spaces)', '53,61', 30, 2)
  insertQ.run(q3Id, parrotId, 'What is φ(n)?', '3120', 22, 3)
  insertQ.run(q4Id, parrotId, 'What is the private key d?', '2753', 38, 4)
  insertQ.run(q5Id, parrotId, 'Decrypt the ciphertext. What is the raw integer list? (comma-separated, no spaces)', '112,114,111,103,99,116,102,123,103,101,111,114,103,105,97,95,97,113,117,97,114,105,117,109,125', 45, 5)

  insertH.run(crypto.randomUUID(), q1Id, 'Pouncy only speaks in numbers. What encryption scheme uses a public key pair (n, e)?', 1)
  insertH.run(crypto.randomUUID(), q2Id, 'Try dividing n by every integer starting from 2. It won\'t take long.', 1)
  insertH.run(crypto.randomUUID(), q3Id, '(p-1) × (q-1)', 1)
  insertH.run(crypto.randomUUID(), q4Id, 'Find the modular inverse of e with respect to φ(n).', 1)
  insertH.run(crypto.randomUUID(), q5Id, 'm = c^d mod n — apply it to each number in the list. Convert each integer to its ASCII character. The pirates never left Atlanta.', 1)
}

function seedChallenges(catIds) {
  const insertQ = db.prepare('INSERT INTO questions (id, challenge_id, text, answer, points, sort_order) VALUES (?, ?, ?, ?, ?, ?)')

  const mobId = crypto.randomUUID()
  db.prepare('INSERT INTO challenges (id, category_id, slug, title, difficulty, points, embed_url, download_urls, flag, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
    .run(mobId, catIds['cipher-cove'], 'message-in-a-bottle', 'Message in a Bottle', 'easy', 50, null, '[]', 'progctf{TR1PL3_LOCK3D}', MOB_DESCRIPTION)
  insertQ.run(crypto.randomUUID(), mobId, 'Decode the binary inscription. What flag is hidden in the message?', 'progctf{ZER0S_4ND_ON3S}', 25, 1)
  insertQ.run(crypto.randomUUID(), mobId, 'Use the key you found to decrypt the second message. What flag is inside the journal entry?', 'progctf{P4SS_THE_KEY}', 25, 2)

  seedParrotChallenge(catIds['cipher-cove'])
}

// Migration: insert the challenge into an existing database
const _cc = db.prepare("SELECT id FROM categories WHERE slug='cipher-cove'").get()
if (_cc && !db.prepare("SELECT 1 FROM challenges WHERE slug='message-in-a-bottle'").get()) {
  seedChallenges({ 'cipher-cove': _cc.id })
}
if (_cc && !db.prepare("SELECT 1 FROM challenges WHERE slug='parrot-knows-too-much'").get()) {
  seedParrotChallenge(_cc.id)
}

// Migration: update parrot challenge to medium point totals (flag=150, questions sum to 150)
const _parrot = db.prepare("SELECT id FROM challenges WHERE slug='parrot-knows-too-much'").get()
if (_parrot && db.prepare("SELECT points FROM challenges WHERE id=?").get(_parrot.id).points !== 150) {
  db.prepare("UPDATE challenges SET points=150 WHERE id=?").run(_parrot.id)
  db.prepare("UPDATE questions SET points=15 WHERE challenge_id=? AND sort_order=1").run(_parrot.id)
  db.prepare("UPDATE questions SET points=30 WHERE challenge_id=? AND sort_order=2").run(_parrot.id)
  db.prepare("UPDATE questions SET points=22 WHERE challenge_id=? AND sort_order=3").run(_parrot.id)
  db.prepare("UPDATE questions SET points=38 WHERE challenge_id=? AND sort_order=4").run(_parrot.id)
  db.prepare("UPDATE questions SET points=45 WHERE challenge_id=? AND sort_order=5").run(_parrot.id)
}

module.exports = db
