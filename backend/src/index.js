'use strict'
const express = require('express')
const cors = require('cors')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const crypto = require('crypto')
const db = require('./db')

const app = express()
const JWT_SECRET = process.env.JWT_SECRET || 'ctf-demo-dev-secret'
const PORT = process.env.PORT || 3000

app.use(cors())
app.use(express.json())

// ---------------------------------------------------------------------------
// Auth middleware
// ---------------------------------------------------------------------------
function requireAuth(req, res, next) {
  const auth = req.headers.authorization
  if (!auth?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' })
  try {
    const payload = jwt.verify(auth.slice(7), JWT_SECRET)
    req.userId = payload.sub
    next()
  } catch {
    res.status(401).json({ error: 'Unauthorized' })
  }
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------
app.post('/api/auth/register', (req, res) => {
  const { username, email, password } = req.body ?? {}
  if (!username || !email || !password) return res.status(400).json({ error: 'Missing fields' })
  const id = crypto.randomUUID()
  try {
    db.prepare('INSERT INTO users (id, username, email, password_hash) VALUES (?, ?, ?, ?)')
      .run(id, username, email, bcrypt.hashSync(password, 10))
    const token = jwt.sign({ sub: id }, JWT_SECRET, { expiresIn: '7d' })
    res.json({ token, user: { id, username, email } })
  } catch (err) {
    if (err.message.includes('UNIQUE')) return res.status(409).json({ error: 'Username or email already taken' })
    res.status(500).json({ error: 'Internal error' })
  }
})

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body ?? {}
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email)
  if (!user || !bcrypt.compareSync(password, user.password_hash))
    return res.status(401).json({ error: 'Invalid credentials' })
  const token = jwt.sign({ sub: user.id }, JWT_SECRET, { expiresIn: '7d' })
  res.json({ token, user: { id: user.id, username: user.username, email: user.email } })
})

// ---------------------------------------------------------------------------
// Me
// ---------------------------------------------------------------------------
app.get('/api/me/stats', requireAuth, (req, res) => {
  const uid = req.userId
  const totalPoints = db.prepare(
    'SELECT COALESCE(SUM(points_earned),0) as v FROM solves WHERE user_id=?'
  ).get(uid).v
  const solvedChallenges = db.prepare(
    "SELECT COUNT(DISTINCT challenge_id) as v FROM solves WHERE user_id=? AND type='flag'"
  ).get(uid).v
  const totalChallenges = db.prepare('SELECT COUNT(*) as v FROM challenges').get().v
  const recentSolves = db.prepare(`
    SELECT ch.title AS challengeTitle, cat.name AS category,
           s.points_earned AS pointsEarned, s.solved_at AS solvedAt
    FROM solves s
    JOIN challenges ch ON ch.id = s.challenge_id
    JOIN categories cat ON cat.id = ch.category_id
    WHERE s.user_id=? AND s.type='flag'
    ORDER BY s.solved_at DESC LIMIT 5
  `).all(uid)
  const solvedQuestions = db.prepare(
    "SELECT COUNT(DISTINCT question_id) as v FROM solves WHERE user_id=? AND type='question'"
  ).get(uid).v
  const totalQuestions = db.prepare('SELECT COUNT(*) as v FROM questions').get().v
  const categoryProgress = db.prepare('SELECT * FROM categories ORDER BY sort_order').all().map(cat => {
    const totalQ = db.prepare(`
      SELECT COUNT(*) as v FROM questions q
      JOIN challenges ch ON ch.id=q.challenge_id WHERE ch.category_id=?
    `).get(cat.id).v
    const solvedQ = db.prepare(`
      SELECT COUNT(DISTINCT s.question_id) as v FROM solves s
      JOIN questions q ON q.id=s.question_id
      JOIN challenges ch ON ch.id=q.challenge_id
      WHERE s.user_id=? AND ch.category_id=? AND s.type='question'
    `).get(uid, cat.id).v
    return { name: cat.name, icon: cat.icon, slug: cat.slug, solvedQuestions: solvedQ, totalQuestions: totalQ }
  })
  res.json({ totalPoints, solvedChallenges, totalChallenges, solvedQuestions, totalQuestions, recentSolves, categoryProgress })
})

app.get('/api/me/crew-rank', requireAuth, (req, res) => {
  const uid = req.userId
  const member = db.prepare(`
    SELECT cm.crew_id, c.name AS crewName
    FROM crew_members cm JOIN crews c ON c.id=cm.crew_id WHERE cm.user_id=?
  `).get(uid)
  if (!member) return res.json(null)

  const ranked = db.prepare(`
    SELECT cm.crew_id, COALESCE(SUM(s.points_earned),0) AS total
    FROM crews c
    LEFT JOIN crew_members cm ON cm.crew_id=c.id
    LEFT JOIN solves s ON s.user_id=cm.user_id
    GROUP BY c.id ORDER BY total DESC
  `).all()
  const rank = ranked.findIndex(r => r.crew_id === member.crew_id) + 1
  res.json({ crewName: member.crewName, rank })
})

app.get('/api/me/profile', requireAuth, (req, res) => {
  const uid = req.userId
  const user = db.prepare('SELECT id,username,email FROM users WHERE id=?').get(uid)
  const crew = db.prepare(`
    SELECT c.name AS crewName FROM crew_members cm JOIN crews c ON c.id=cm.crew_id WHERE cm.user_id=?
  `).get(uid)
  const totalPoints = db.prepare(
    'SELECT COALESCE(SUM(points_earned),0) as v FROM solves WHERE user_id=?'
  ).get(uid).v
  const solvedChallenges = db.prepare(
    "SELECT COUNT(DISTINCT challenge_id) as v FROM solves WHERE user_id=? AND type='flag'"
  ).get(uid).v
  const totalChallenges = db.prepare('SELECT COUNT(*) as v FROM challenges').get().v
  const recentSolves = db.prepare(`
    SELECT ch.title AS challengeTitle, cat.name AS category,
           s.points_earned AS pointsEarned, s.solved_at AS solvedAt
    FROM solves s
    JOIN challenges ch ON ch.id = s.challenge_id
    JOIN categories cat ON cat.id = ch.category_id
    WHERE s.user_id=? AND s.type='flag'
    ORDER BY s.solved_at DESC LIMIT 20
  `).all(uid)
  const solvedQuestions = db.prepare(
    "SELECT COUNT(DISTINCT question_id) as v FROM solves WHERE user_id=? AND type='question'"
  ).get(uid).v
  const totalQuestions = db.prepare('SELECT COUNT(*) as v FROM questions').get().v
  const categoryProgress = db.prepare('SELECT * FROM categories ORDER BY sort_order').all().map(cat => {
    const totalQ = db.prepare(`
      SELECT COUNT(*) as v FROM questions q
      JOIN challenges ch ON ch.id=q.challenge_id WHERE ch.category_id=?
    `).get(cat.id).v
    const solvedQ = db.prepare(`
      SELECT COUNT(DISTINCT s.question_id) as v FROM solves s
      JOIN questions q ON q.id=s.question_id
      JOIN challenges ch ON ch.id=q.challenge_id
      WHERE s.user_id=? AND ch.category_id=? AND s.type='question'
    `).get(uid, cat.id).v
    return { name: cat.name, icon: cat.icon, slug: cat.slug, solvedQuestions: solvedQ, totalQuestions: totalQ }
  })
  res.json({ username: user.username, crewName: crew?.crewName ?? null, totalPoints, solvedChallenges, totalChallenges, solvedQuestions, totalQuestions, recentSolves, categoryProgress })
})

app.patch('/api/me/username', requireAuth, (req, res) => {
  const uid = req.userId
  const { username } = req.body ?? {}
  if (!username || typeof username !== 'string' || !username.trim())
    return res.status(400).json({ error: 'Username is required.' })
  try {
    db.prepare('UPDATE users SET username=? WHERE id=?').run(username.trim(), uid)
    res.json({ ok: true })
  } catch (err) {
    if (err.message.includes('UNIQUE')) return res.status(409).json({ error: 'Username already taken.' })
    res.status(500).json({ error: 'Internal error.' })
  }
})

app.patch('/api/me/email', requireAuth, (req, res) => {
  const uid = req.userId
  const { email } = req.body ?? {}
  if (!email || typeof email !== 'string' || !email.trim())
    return res.status(400).json({ error: 'Email is required.' })
  try {
    db.prepare('UPDATE users SET email=? WHERE id=?').run(email.trim(), uid)
    res.json({ ok: true })
  } catch (err) {
    if (err.message.includes('UNIQUE')) return res.status(409).json({ error: 'Email already in use.' })
    res.status(500).json({ error: 'Internal error.' })
  }
})

app.patch('/api/me/password', requireAuth, (req, res) => {
  const uid = req.userId
  const { currentPassword, newPassword } = req.body ?? {}
  if (!currentPassword || !newPassword)
    return res.status(400).json({ error: 'Both current and new passwords are required.' })
  const user = db.prepare('SELECT password_hash FROM users WHERE id=?').get(uid)
  if (!user || !bcrypt.compareSync(currentPassword, user.password_hash))
    return res.status(401).json({ error: 'Current password is incorrect.' })
  db.prepare('UPDATE users SET password_hash=? WHERE id=?').run(bcrypt.hashSync(newPassword, 10), uid)
  res.json({ ok: true })
})

// ---------------------------------------------------------------------------
// Categories & Challenges
// ---------------------------------------------------------------------------
app.get('/api/categories', requireAuth, (req, res) => {
  const uid = req.userId
  const cats = db.prepare('SELECT * FROM categories ORDER BY sort_order').all()
  res.json(cats.map(cat => {
    const totalChallenges = db.prepare('SELECT COUNT(*) as v FROM challenges WHERE category_id=?').get(cat.id).v
    const solvedChallenges = db.prepare(`
      SELECT COUNT(DISTINCT s.challenge_id) as v FROM solves s
      JOIN challenges ch ON ch.id=s.challenge_id
      WHERE s.user_id=? AND ch.category_id=? AND s.type='flag'
    `).get(uid, cat.id).v
    return { slug: cat.slug, name: cat.name, icon: cat.icon, typeName: cat.type_name, totalChallenges, solvedChallenges }
  }))
})

app.get('/api/categories/:category', requireAuth, (req, res) => {
  const uid = req.userId
  const cat = db.prepare('SELECT * FROM categories WHERE slug=?').get(req.params.category)
  if (!cat) return res.status(404).json({ error: 'Not found' })

  const challenges = db.prepare('SELECT * FROM challenges WHERE category_id=? ORDER BY points').all(cat.id)
  res.json({
    name: cat.name,
    challenges: challenges.map(ch => ({
      slug: ch.slug,
      title: ch.title,
      difficulty: ch.difficulty,
      points: ch.points,
      solved: !!db.prepare("SELECT 1 FROM solves WHERE user_id=? AND challenge_id=? AND type='flag'").get(uid, ch.id),
    })),
  })
})

app.get('/api/categories/:category/challenges/:slug', requireAuth, (req, res) => {
  const uid = req.userId
  const cat = db.prepare('SELECT * FROM categories WHERE slug=?').get(req.params.category)
  if (!cat) return res.status(404).json({ error: 'Not found' })
  const ch = db.prepare('SELECT * FROM challenges WHERE category_id=? AND slug=?').get(cat.id, req.params.slug)
  if (!ch) return res.status(404).json({ error: 'Not found' })

  const questions = db.prepare('SELECT * FROM questions WHERE challenge_id=? ORDER BY sort_order').all(ch.id)
  const flagSolved = !!db.prepare("SELECT 1 FROM solves WHERE user_id=? AND challenge_id=? AND type='flag'").get(uid, ch.id)

  res.json({
    slug: ch.slug,
    title: ch.title,
    difficulty: ch.difficulty,
    points: ch.points,
    embedUrl: ch.embed_url,
    downloadUrls: JSON.parse(ch.download_urls || '[]'),
    flagSolved,
    questions: questions.map(q => {
      const solve = db.prepare("SELECT points_earned FROM solves WHERE user_id=? AND question_id=? AND type='question'").get(uid, q.id)
      return { id: q.id, text: q.text, solved: !!solve, pointsEarned: solve?.points_earned ?? 0 }
    }),
  })
})

app.post('/api/categories/:category/challenges/:slug/questions/:questionId', requireAuth, (req, res) => {
  const uid = req.userId
  const cat = db.prepare('SELECT * FROM categories WHERE slug=?').get(req.params.category)
  if (!cat) return res.status(404).json({ error: 'Not found' })
  const ch = db.prepare('SELECT * FROM challenges WHERE category_id=? AND slug=?').get(cat.id, req.params.slug)
  if (!ch) return res.status(404).json({ error: 'Not found' })
  const q = db.prepare('SELECT * FROM questions WHERE id=? AND challenge_id=?').get(req.params.questionId, ch.id)
  if (!q) return res.status(404).json({ error: 'Not found' })

  const already = db.prepare("SELECT 1 FROM solves WHERE user_id=? AND question_id=? AND type='question'").get(uid, q.id)
  if (already) return res.json({ correct: true, pointsEarned: 0 })

  const { answer } = req.body ?? {}
  if ((answer ?? '').trim().toLowerCase() !== q.answer.toLowerCase())
    return res.json({ correct: false, pointsEarned: 0 })

  db.prepare("INSERT INTO solves (id,user_id,challenge_id,question_id,type,points_earned) VALUES (?,?,?,?,'question',?)")
    .run(crypto.randomUUID(), uid, ch.id, q.id, q.points)
  res.json({ correct: true, pointsEarned: q.points })
})

app.post('/api/categories/:category/challenges/:slug/flag', requireAuth, (req, res) => {
  const uid = req.userId
  const cat = db.prepare('SELECT * FROM categories WHERE slug=?').get(req.params.category)
  if (!cat) return res.status(404).json({ error: 'Not found' })
  const ch = db.prepare('SELECT * FROM challenges WHERE category_id=? AND slug=?').get(cat.id, req.params.slug)
  if (!ch) return res.status(404).json({ error: 'Not found' })

  const already = db.prepare("SELECT 1 FROM solves WHERE user_id=? AND challenge_id=? AND type='flag'").get(uid, ch.id)
  if (already) return res.json({ correct: true, pointsEarned: 0 })

  const { flag } = req.body ?? {}
  if ((flag ?? '').trim() !== ch.flag)
    return res.json({ correct: false, pointsEarned: 0 })

  db.prepare("INSERT INTO solves (id,user_id,challenge_id,question_id,type,points_earned) VALUES (?,?,?,NULL,'flag',?)")
    .run(crypto.randomUUID(), uid, ch.id, ch.points)
  res.json({ correct: true, pointsEarned: ch.points })
})

// ---------------------------------------------------------------------------
// Bounties
// ---------------------------------------------------------------------------
app.get('/api/bounties', requireAuth, (req, res) => {
  const uid = req.userId
  const rows = db.prepare(`
    SELECT c.id AS crewId, c.name AS crewName,
           COALESCE(SUM(s.points_earned),0) AS totalPoints,
           COUNT(DISTINCT CASE WHEN s.type='flag' THEN s.challenge_id END) AS solveCount
    FROM crews c
    LEFT JOIN crew_members cm ON cm.crew_id=c.id
    LEFT JOIN solves s ON s.user_id=cm.user_id
    GROUP BY c.id ORDER BY totalPoints DESC
  `).all()

  const allMembers = db.prepare(`
    SELECT cm.crew_id, u.username
    FROM crew_members cm JOIN users u ON u.id=cm.user_id
    ORDER BY cm.crew_id, u.username
  `).all()

  const membersByCrewId = {}
  for (const m of allMembers) {
    if (!membersByCrewId[m.crew_id]) membersByCrewId[m.crew_id] = []
    membersByCrewId[m.crew_id].push(m.username)
  }

  const membership = db.prepare('SELECT crew_id FROM crew_members WHERE user_id=?').get(uid)
  const currentCrewId = membership?.crew_id ?? null

  res.json(rows.map((r, i) => ({
    rank: i + 1,
    crewId: r.crewId,
    crewName: r.crewName,
    totalPoints: r.totalPoints,
    solveCount: r.solveCount,
    members: membersByCrewId[r.crewId] ?? [],
    isCurrentCrew: r.crewId === currentCrewId,
  })))
})

// ---------------------------------------------------------------------------
// Crew
// ---------------------------------------------------------------------------
app.get('/api/crew', requireAuth, (req, res) => {
  const uid = req.userId
  const membership = db.prepare('SELECT crew_id FROM crew_members WHERE user_id=?').get(uid)
  if (!membership) return res.json(null)
  const crew = db.prepare('SELECT * FROM crews WHERE id=?').get(membership.crew_id)
  const members = db.prepare(`
    SELECT u.id, u.username, COALESCE(SUM(s.points_earned),0) AS points
    FROM crew_members cm JOIN users u ON u.id=cm.user_id
    LEFT JOIN solves s ON s.user_id=u.id
    WHERE cm.crew_id=? GROUP BY u.id ORDER BY points DESC
  `).all(membership.crew_id)
  res.json({ id: crew.id, name: crew.name, inviteCode: crew.invite_code, members })
})

app.post('/api/crew', requireAuth, (req, res) => {
  const uid = req.userId
  if (db.prepare('SELECT 1 FROM crew_members WHERE user_id=?').get(uid))
    return res.status(409).json({ error: 'Already in a crew' })
  const { name } = req.body ?? {}
  if (!name) return res.status(400).json({ error: 'Missing name' })
  const id = crypto.randomUUID()
  const inviteCode = crypto.randomBytes(4).toString('hex').toUpperCase()
  try {
    db.prepare('INSERT INTO crews (id,name,invite_code) VALUES (?,?,?)').run(id, name, inviteCode)
    db.prepare('INSERT INTO crew_members (user_id,crew_id) VALUES (?,?)').run(uid, id)
    const user = db.prepare('SELECT id,username FROM users WHERE id=?').get(uid)
    const points = db.prepare('SELECT COALESCE(SUM(points_earned),0) as v FROM solves WHERE user_id=?').get(uid).v
    res.json({ id, name, inviteCode, members: [{ id: user.id, username: user.username, points }] })
  } catch (err) {
    if (err.message.includes('UNIQUE')) return res.status(409).json({ error: 'Crew name already taken' })
    res.status(500).json({ error: 'Internal error' })
  }
})

app.post('/api/crew/join', requireAuth, (req, res) => {
  const uid = req.userId
  if (db.prepare('SELECT 1 FROM crew_members WHERE user_id=?').get(uid))
    return res.status(409).json({ error: 'Already in a crew' })
  const { inviteCode } = req.body ?? {}
  const crew = db.prepare('SELECT * FROM crews WHERE invite_code=?').get((inviteCode ?? '').toUpperCase())
  if (!crew) return res.status(404).json({ error: 'Invalid invite code' })
  db.prepare('INSERT INTO crew_members (user_id,crew_id) VALUES (?,?)').run(uid, crew.id)
  const members = db.prepare(`
    SELECT u.id, u.username, COALESCE(SUM(s.points_earned),0) AS points
    FROM crew_members cm JOIN users u ON u.id=cm.user_id
    LEFT JOIN solves s ON s.user_id=u.id
    WHERE cm.crew_id=? GROUP BY u.id ORDER BY points DESC
  `).all(crew.id)
  res.json({ id: crew.id, name: crew.name, inviteCode: crew.invite_code, members })
})

app.post('/api/crew/leave', requireAuth, (req, res) => {
  const membership = db.prepare('SELECT crew_id FROM crew_members WHERE user_id=?').get(req.userId)
  db.prepare('DELETE FROM crew_members WHERE user_id=?').run(req.userId)
  if (membership) {
    const remaining = db.prepare('SELECT COUNT(*) as v FROM crew_members WHERE crew_id=?').get(membership.crew_id).v
    if (remaining === 0) db.prepare('DELETE FROM crews WHERE id=?').run(membership.crew_id)
  }
  res.json({})
})

// ---------------------------------------------------------------------------
// All crews browse
// ---------------------------------------------------------------------------
app.get('/api/crews', requireAuth, (req, res) => {
  const myMembership = db.prepare('SELECT crew_id FROM crew_members WHERE user_id=?').get(req.userId)
  const rows = db.prepare(`
    SELECT c.id, c.name, u.username
    FROM crews c
    JOIN crew_members cm ON cm.crew_id = c.id
    JOIN users u ON u.id = cm.user_id
    ORDER BY c.name ASC, u.username ASC
  `).all()
  const map = new Map()
  for (const row of rows) {
    if (!map.has(row.id)) map.set(row.id, { id: row.id, name: row.name, members: [] })
    map.get(row.id).members.push(row.username)
  }
  res.json({ crews: [...map.values()], myCrewId: myMembership?.crew_id ?? null })
})

// ---------------------------------------------------------------------------
app.listen(PORT, () => console.log(`ProgCTF backend listening on :${PORT}`))
