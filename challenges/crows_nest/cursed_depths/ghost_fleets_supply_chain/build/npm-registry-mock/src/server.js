// npm.marrowtide.example — registry mock for the Ghost Fleet's Supply Chain CTF island.
// All package names are FICTIONAL. Package tarballs are NOT served and NOT executable.
// Endpoints support the OSINT pivot: search returns a list, package lookup returns
// metadata whose repository.url points the player at git.marrowtide.example.

const express = require('express');
const app = express();
const PORT = process.env.PORT || 80;

// --- Mock package metadata (deterministic, hand-authored) ---

const PACKAGES = {
  'marrowtide-internal/manifests-cli': {
    name: 'marrowtide-internal/manifests-cli',
    description: 'Internal cargo manifest validator for Marrowtide Logistics underwriting. Private.',
    'dist-tags': { latest: '2.0.1' },
    versions: {
      '2.0.1': {
        name: 'marrowtide-internal/manifests-cli',
        version: '2.0.1',
        description: 'Internal cargo manifest validator for Marrowtide Logistics underwriting. Private.',
        main: 'dist/index.js',
        repository: {
          type: 'git',
          url: 'git+https://git.marrowtide.example/manifests-cli.git'
        },
        homepage: 'https://git.marrowtide.example/manifests-cli',
        bugs: { email: 'engineering@marrowtide.example' },
        license: 'UNLICENSED',
        author: {
          name: 'Ines Tidemark',
          email: 'ines.tidemark@marrowtide.example'
        },
        maintainers: [
          { name: 'ines.tidemark', email: 'ines.tidemark@marrowtide.example' }
        ],
        dist: {
          // No tarball in the mock — this is metadata only.
          tarball: 'https://npm.marrowtide.example/marrowtide-internal/manifests-cli/-/manifests-cli-2.0.1.tgz',
          shasum: '0000000000000000000000000000000000000000'
        }
      }
    },
    time: {
      created: '2025-09-01T08:00:00.000Z',
      modified: '2026-04-12T14:00:00.000Z',
      '2.0.1': '2026-04-12T14:00:00.000Z'
    }
  },

  '@marrowtide/tide-charts': {
    name: '@marrowtide/tide-charts',
    description: 'Charting helpers used by the Marrowtide underwriting dashboard. Public mirror.',
    'dist-tags': { latest: '0.6.3' },
    versions: {
      '0.6.3': {
        name: '@marrowtide/tide-charts',
        version: '0.6.3',
        description: 'Charting helpers used by the Marrowtide underwriting dashboard. Public mirror.',
        repository: { type: 'git', url: 'git+https://git.marrowtide.example/tide-charts.git' },
        license: 'MIT',
        author: { name: 'Ines Tidemark', email: 'ines.tidemark@marrowtide.example' }
      }
    },
    time: { created: '2025-11-01T00:00:00.000Z', modified: '2026-02-14T00:00:00.000Z' }
  },

  '@marrowtide/keel-metrics': {
    name: '@marrowtide/keel-metrics',
    description: 'Tiny metrics shim around the Marrowtide risk-model output. Public mirror.',
    'dist-tags': { latest: '0.2.0' },
    versions: {
      '0.2.0': {
        name: '@marrowtide/keel-metrics',
        version: '0.2.0',
        description: 'Tiny metrics shim around the Marrowtide risk-model output.',
        repository: { type: 'git', url: 'git+https://git.marrowtide.example/keel-metrics.git' },
        license: 'MIT',
        author: { name: 'Ines Tidemark', email: 'ines.tidemark@marrowtide.example' }
      }
    },
    time: { created: '2025-12-10T00:00:00.000Z', modified: '2026-01-18T00:00:00.000Z' }
  }
};

// --- Routes ---

app.get('/-/ping', (req, res) => res.json({ ok: true, registry: 'marrowtide-internal' }));

// Landing page (HTML) so a curious player can navigate this in a browser.
app.get('/', (req, res) => {
  res.type('html').send(`<!doctype html>
<html><head><title>npm.marrowtide.example — internal package registry</title>
<style>
body{font-family:Georgia,serif;background:#f5f1e8;color:#0c2230;max-width:760px;margin:2rem auto;padding:0 1rem}
h1{border-bottom:3px solid #a04a2c;padding-bottom:.3rem}
table{width:100%;border-collapse:collapse;margin-top:1rem}
td,th{padding:.5rem;border-bottom:1px solid #d8cfb6;text-align:left;font-family:monospace}
a{color:#1c4a5e}
.note{background:#fff8e6;border-left:4px solid #a04a2c;padding:.6rem 1rem;margin:1rem 0}
</style></head><body>
<h1>Marrowtide internal package registry</h1>
<p>This registry mirrors a subset of <a href="http://marrowtide.example:8080/">Marrowtide Logistics</a>' internal engineering packages. Most packages require an engineering token to install; metadata listings are public per our <a href="http://marrowtide.example:8080/blog/transparency-pledge.html">transparency pledge</a>.</p>
<div class="note"><strong>API.</strong> This server speaks a subset of the npm registry API. Try <code>GET /-/v1/search?text=manifests</code> or <code>GET /marrowtide-internal/manifests-cli</code>.</div>
<h2>Published packages</h2>
<table>
<tr><th>Name</th><th>Latest</th><th>Maintainer</th></tr>
${Object.values(PACKAGES).map(p => `<tr><td><a href="/${encodeURIComponent(p.name)}">${p.name}</a></td><td>${p['dist-tags'].latest}</td><td>${p.versions[p['dist-tags'].latest].author.name}</td></tr>`).join('\n')}
</table>
<p style="font-size:.85rem;color:#6b7a82;margin-top:3rem">Operated by the engineering team at Marrowtide Logistics. Contact <a href="mailto:engineering@marrowtide.example">engineering@marrowtide.example</a>.</p>
</body></html>`);
});

// Search endpoint — npm registry-compatible shape.
app.get('/-/v1/search', (req, res) => {
  const q = (req.query.text || '').toString().toLowerCase();
  const matches = Object.values(PACKAGES).filter(p =>
    !q || p.name.toLowerCase().includes(q) || (p.description && p.description.toLowerCase().includes(q))
  );
  res.json({
    objects: matches.map(p => {
      const v = p.versions[p['dist-tags'].latest];
      return {
        package: {
          name: p.name,
          version: p['dist-tags'].latest,
          description: p.description,
          maintainers: [{ username: v.author.name, email: v.author.email }],
          links: {
            npm: `https://npm.marrowtide.example/${p.name}`,
            homepage: v.homepage,
            repository: v.repository.url
          }
        },
        score: { final: 0.5, detail: { quality: 0.5, popularity: 0.5, maintenance: 0.5 } },
        searchScore: 1.0
      };
    }),
    total: matches.length,
    time: new Date().toISOString()
  });
});

// Package metadata lookup — handles unscoped, scoped, and "org/name" style.
function lookup(req, res) {
  let name = req.params[0] || req.params.name || '';
  // Express may give us "marrowtide-internal/manifests-cli" as two params.
  if (req.params.scope && req.params.pkg) name = `${req.params.scope}/${req.params.pkg}`;
  name = decodeURIComponent(name);
  const pkg = PACKAGES[name];
  if (!pkg) return res.status(404).json({ error: 'Not found', name });
  res.json(pkg);
}

// Match @scope/name
app.get('/:scope(@[^/]+)/:pkg', lookup);
// Match unscoped or "org/name"
app.get('/:org/:pkg', (req, res) => {
  const name = `${req.params.org}/${req.params.pkg}`;
  const pkg = PACKAGES[name];
  if (!pkg) return res.status(404).json({ error: 'Not found', name });
  res.json(pkg);
});
app.get('/:name', (req, res) => {
  const pkg = PACKAGES[req.params.name];
  if (!pkg) return res.status(404).json({ error: 'Not found', name: req.params.name });
  res.json(pkg);
});

// Tarball requests — explicitly return a 401-style mock so it's clear the bits
// are not served. (No real package contents, no executable code.)
app.get(/\/-\/.*\.tgz$/, (req, res) => {
  res.status(401).json({
    error: 'authentication required',
    message: 'This is a Marrowtide internal registry mock. Tarballs are not served from this host.'
  });
});

app.use((req, res) => res.status(404).json({ error: 'Not found' }));

app.listen(PORT, () => {
  // Server is intentionally quiet on stdout for clean container logs.
});
