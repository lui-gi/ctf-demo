// crt.marrowtide.example — Marrowtide-operated certificate-transparency log mirror.
// Lists every certificate ever issued under *.marrowtide.example.
// Pure metadata mock — no actual TLS keys, no executable payload.
//
// IMPORTANT (Powder Monkey note): the entry for vault.marrowtide.example is the
// pivot. It MUST be present, MUST be returned without paging gymnastics, and
// MUST be the ONLY way the player learns of that subdomain.

const express = require('express');
const app = express();
const PORT = process.env.PORT || 80;

const ENTRIES = [
  // Mundane/obvious subdomains the player already knows about.
  { id: 1001, common_name: 'marrowtide.example',                issuer: 'Marrowtide Internal CA', not_before: '2025-09-01', not_after: '2026-09-01', serial: 'aa:11:01' },
  { id: 1002, common_name: 'www.marrowtide.example',            issuer: 'Marrowtide Internal CA', not_before: '2025-09-01', not_after: '2026-09-01', serial: 'aa:11:02' },
  { id: 1003, common_name: 'api.marrowtide.example',            issuer: 'Marrowtide Internal CA', not_before: '2025-09-15', not_after: '2026-09-15', serial: 'aa:11:03' },
  { id: 1004, common_name: 'mail.marrowtide.example',           issuer: 'Marrowtide Internal CA', not_before: '2025-09-20', not_after: '2026-09-20', serial: 'aa:11:04' },
  { id: 1005, common_name: 'npm.marrowtide.example',            issuer: 'Marrowtide Internal CA', not_before: '2025-10-01', not_after: '2026-10-01', serial: 'aa:11:05' },
  { id: 1006, common_name: 'git.marrowtide.example',            issuer: 'Marrowtide Internal CA', not_before: '2025-10-01', not_after: '2026-10-01', serial: 'aa:11:06' },
  { id: 1007, common_name: 'crt.marrowtide.example',            issuer: 'Marrowtide Internal CA', not_before: '2025-10-01', not_after: '2026-10-01', serial: 'aa:11:07' },
  { id: 1008, common_name: 'staging-internal.marrowtide.example', issuer: 'Marrowtide Internal CA', not_before: '2025-11-12', not_after: '2026-11-12', serial: 'aa:11:08' },
  // The pivot — the only place vault.marrowtide.example is ever named.
  { id: 1009, common_name: 'vault.marrowtide.example',          issuer: 'Marrowtide Internal CA', not_before: '2026-04-03', not_after: '2027-04-03', serial: 'aa:11:09' }
];

function htmlEscape(s) { return String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c])); }

app.get('/ping', (req, res) => res.json({ ok: true, log: 'crt.marrowtide.example' }));

// Browser-friendly HTML landing + search UI.
app.get('/', (req, res) => {
  const q = (req.query.q || '').toString().trim();
  const filtered = q
    ? ENTRIES.filter(e => e.common_name.includes(q.replace(/^%?/, '').replace(/%$/, '')))
    : ENTRIES;
  res.type('html').send(`<!doctype html>
<html><head><title>crt.marrowtide.example — certificate transparency mirror</title>
<style>
body{font-family:Georgia,serif;background:#f5f1e8;color:#0c2230;max-width:920px;margin:2rem auto;padding:0 1rem}
h1{border-bottom:3px solid #a04a2c;padding-bottom:.3rem}
form{margin:1rem 0}
input[type=text]{font-size:1rem;padding:.5rem;width:24rem;border:1px solid #999}
button{padding:.5rem 1rem;background:#1c4a5e;color:white;border:none;cursor:pointer}
table{width:100%;border-collapse:collapse;margin-top:1rem;background:white}
th,td{padding:.5rem;border-bottom:1px solid #d8cfb6;text-align:left;font-family:monospace;font-size:.9rem}
th{background:#1c4a5e;color:#f5f1e8}
.note{background:#fff8e6;border-left:4px solid #a04a2c;padding:.6rem 1rem;margin:1rem 0;font-family:Georgia,serif}
a{color:#1c4a5e}
</style></head><body>
<h1>crt.marrowtide.example</h1>
<p>Certificate-transparency log mirror for <code>*.marrowtide.example</code>. Operated by <a href="http://marrowtide.example:8080/">Marrowtide Logistics</a> per the <a href="http://marrowtide.example:8080/blog/transparency-pledge.html">transparency pledge</a> &mdash; every certificate issued by our internal CA is published here.</p>

<form method="get" action="/">
  <input type="text" name="q" value="${htmlEscape(q)}" placeholder="search common name (e.g. marrowtide.example)">
  <button type="submit">Search</button>
</form>

<div class="note">All ${ENTRIES.length} entries are returned in a single response &mdash; this mirror does not paginate. Try the <a href="/ct/v1/get-entries?q=marrowtide.example">JSON endpoint</a> if you prefer.</div>

<table>
<tr><th>id</th><th>common name</th><th>issuer</th><th>not before</th><th>not after</th><th>serial</th></tr>
${filtered.map(e => `<tr><td>${e.id}</td><td>${htmlEscape(e.common_name)}</td><td>${htmlEscape(e.issuer)}</td><td>${e.not_before}</td><td>${e.not_after}</td><td>${e.serial}</td></tr>`).join('\n')}
</table>

${filtered.length === 0 ? '<p><em>No certificates match that query.</em></p>' : ''}

<p style="font-size:.85rem;color:#6b7a82;margin-top:3rem">crt.marrowtide.example &middot; certificate-transparency mirror &middot; questions: <a href="mailto:security@marrowtide.example">security@marrowtide.example</a></p>
</body></html>`);
});

// JSON endpoint — crt.sh-ish.
app.get('/ct/v1/get-entries', (req, res) => {
  const q = (req.query.q || '').toString().trim();
  const filtered = q ? ENTRIES.filter(e => e.common_name.includes(q)) : ENTRIES;
  res.json({
    log: 'crt.marrowtide.example',
    operator: 'Marrowtide Logistics',
    total: filtered.length,
    paginated: false,
    entries: filtered
  });
});

app.use((req, res) => res.status(404).json({ error: 'not found' }));
app.listen(PORT);
