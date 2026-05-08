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

if (db.prepare('SELECT COUNT(*) as c FROM categories').get().c !== 7) {
  seed()
}

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

  for (const c of cats) {
    const catId = crypto.randomUUID()
    insertCat.run(catId, c.slug, c.name, c.icon, c.typeName, c.order)
    insertCh.run(crypto.randomUUID(), catId, 'coming-soon', 'Coming Soon', 'easy', 0, null, '[]', 'CTF{placeholder}')
  }

  // Demo user
  const demoId = crypto.randomUUID()
  db.prepare('INSERT OR IGNORE INTO users (id, username, email, password_hash) VALUES (?, ?, ?, ?)')
    .run(demoId, 'pirate', 'pirate@progctf.dev', bcrypt.hashSync('password123', 10))
}

module.exports = db
