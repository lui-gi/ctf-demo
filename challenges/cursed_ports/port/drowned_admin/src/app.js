'use strict';

// drowned_admin — progctf Island, Cursed Ports / Port tier.
//
// This Express app is intentionally vulnerable to authentication-bypass via
// classical string-concatenation SQL injection on POST /login. That is the
// challenge. Do NOT "fix" the SELECT below — fixing it removes the lesson.
//
// Out-of-scope behaviours that are NOT vulnerabilities here are explicitly
// hardened (per spec.yaml unintended_solve_traps):
//   - flag is never present in HTML, headers, JS bundles, or static assets
//   - empty username AND empty password is refused before the SQL runs, so a
//     blank submission can never accidentally satisfy a '' = '' tautology
//   - verbose error pages exist ONLY on /login. Every other route returns a
//     terse 404/500.
//   - directory listing is impossible — Express serves no static directory.
//   - .git and similar are not present in the image (see Dockerfile).

const path = require('path');
const express = require('express');
const sqlite3 = require('sqlite3');
const { initDb } = require('./init-db');

const PORT = parseInt(process.env.PORT || process.env.CHALLENGE_PORT || '8080', 10);
const FLAG = process.env.CHALLENGE_FLAG;

if (!FLAG || !/^progctf\{[a-z0-9_]+\}$/.test(FLAG)) {
  // Fail-closed at boot. The sandbox controller will report an
  // IslandSandboxAdrift alert and the Crew sees a friendly retry page.
  console.error('drowned_admin: CHALLENGE_FLAG missing or malformed; refusing to start.');
  process.exit(1);
}

const app = express();
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.disable('x-powered-by');
app.disable('etag');
app.use(express.urlencoded({ extended: false, limit: '4kb' }));

const db = new sqlite3.Database(':memory:');
initDb(db);

app.get('/', (_req, res) => res.redirect(302, '/login'));

app.get('/login', (_req, res) => {
  res.status(200).render('login', { error: null });
});

app.post('/login', (req, res) => {
  const u = String(req.body.username ?? '');
  const p = String(req.body.password ?? '');

  if (u.length === 0 && p.length === 0) {
    return res.status(400).render('login', { error: 'Both fields required.' });
  }

  // Intentional vulnerability: username + password are concatenated raw.
  // This is the lesson the Island teaches. See README.md and solution.md.
  const sql =
    "SELECT id, username FROM admins WHERE username='" + u +
    "' AND password='" + p + "'";

  db.get(sql, (err, row) => {
    if (err) {
      // Verbose only here. Leaks engine name + the offending SQL so a single
      // quote in the username field clearly signals "this is SQLi territory".
      const msg =
        'Database error: ' + (err.code || 'UNKNOWN') + ': ' + err.message +
        '\n\nQuery: ' + sql;
      return res.status(500).render('login', { error: msg });
    }
    if (!row) {
      return res.status(401).render('login', { error: 'Invalid credentials.' });
    }
    return res.status(200).render('dashboard', { username: row.username, flag: FLAG });
  });
});

app.get('/healthz', (_req, res) => {
  res.type('text/plain').status(200).send('ok\n');
});

app.use((_req, res) => {
  res.status(404).type('text/plain').send('Not found.\n');
});

// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error('drowned_admin internal error:', err && err.stack ? err.stack : err);
  res.status(500).type('text/plain').send('Internal error.\n');
});

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log('drowned_admin listening on :' + PORT);
});

function shutdown(sig) {
  console.log('drowned_admin received ' + sig + ', shutting down.');
  server.close(() => {
    db.close(() => process.exit(0));
  });
  setTimeout(() => process.exit(1), 5000).unref();
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
