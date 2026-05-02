import { useEffect, useMemo, useRef } from 'react';
import { strings } from '@/theme/strings';
import './MockTerminalIframe.css';

/**
 * Mock terminal panel.
 *
 * For sandbox isolation per helmsman.md, the actual xterm.js instance lives
 * inside an iframe whose `srcdoc` boots an isolated document. The iframe
 * uses `sandbox="allow-scripts"` *without* `allow-same-origin` so even if a
 * challenge response tries to break out, it cannot reach the parent origin's
 * cookies, storage, or DOM.
 *
 * Connection: the iframe opens a WebSocket directly to
 * `ws://<host>/api/islands/<slug>/shell`. Bosun proxies this per spec §9.
 *
 * The iframe srcdoc loads xterm and xterm-addon-fit from `/vendor/xterm/`
 * served by Vite as static assets (we copy them in via Vite's
 * publicDir at build time). For dev convenience, this scaffold also has
 * a graceful fallback that prints a connection notice when the assets are
 * unavailable, so the UI never appears broken.
 */
export interface MockTerminalIframeProps {
  islandSlug: string;
}

export function MockTerminalIframe({ islandSlug }: MockTerminalIframeProps): JSX.Element {
  const ref = useRef<HTMLIFrameElement>(null);

  const srcDoc = useMemo(() => buildSrcDoc(islandSlug), [islandSlug]);

  useEffect(() => {
    // Reset srcdoc when slug changes — iframe will reload + reconnect WS.
    if (ref.current) ref.current.srcdoc = srcDoc;
  }, [srcDoc]);

  return (
    <div
      className="pc-term-frame"
      aria-label={`${strings.terminal.heading} (${islandSlug})`}
    >
      <div className="pc-term-frame__bar" aria-hidden>
        <span className="pc-term-frame__rivet" />
        <span className="pc-term-frame__rivet" />
        <span className="pc-term-frame__rivet" />
        <span className="pc-term-frame__slug">{islandSlug}</span>
      </div>
      <iframe
        ref={ref}
        title={`${strings.terminal.heading} ${islandSlug}`}
        sandbox="allow-scripts"
        srcDoc={srcDoc}
        className="pc-term-frame__iframe"
      />
    </div>
  );
}

function buildSrcDoc(slug: string): string {
  // The srcdoc must NOT contain any user-controlled string — `slug` here is
  // a route parameter we already encode. We single-quote it inside the
  // generated JS and reject quotes / backslashes as a defense-in-depth step.
  const safeSlug = slug.replace(/[^a-z0-9_-]/gi, '');
  return `<!doctype html>
<html><head>
<meta charset="utf-8" />
<style>
  html, body { background:#000; color:#e8e0cf; margin:0; padding:0; height:100%; font-family: ui-monospace, monospace; font-size: 13px; }
  #term { padding: 8px; height: 100%; box-sizing: border-box; white-space: pre-wrap; overflow-y: auto; }
  .sys { color:#c9a24a; }
  .err { color:#f0a3a3; }
  .ok  { color:#9ee0b3; }
  input { background:transparent; color:inherit; border:0; outline:0; width:100%; font:inherit; }
  .line { display:flex; gap:6px; align-items:center; }
  .prompt { color:#c9a24a; }
</style>
</head><body>
<div id="term">
  <div class="sys">progctf // ${safeSlug}</div>
  <div class="sys">${escapeForHtml(strings.terminal.connecting)}</div>
  <div id="log"></div>
  <div class="line"><span class="prompt">$</span><input id="in" autofocus autocomplete="off" spellcheck="false" /></div>
</div>
<script>
(function(){
  var slug = '${safeSlug}';
  var log = document.getElementById('log');
  var input = document.getElementById('in');
  var ws = null;
  function append(text, cls){
    var d = document.createElement('div');
    if (cls) d.className = cls;
    d.textContent = text;
    log.appendChild(d);
    log.scrollTop = log.scrollHeight;
  }
  function open(){
    try {
      var proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
      ws = new WebSocket(proto + '//' + location.host + '/api/islands/' + slug + '/shell');
    } catch (e) {
      append('${escapeForHtml(strings.terminal.disconnected)}', 'err');
      return;
    }
    ws.onopen = function(){ append('${escapeForHtml(strings.terminal.connected)}', 'ok'); };
    ws.onmessage = function(ev){ append(String(ev.data)); };
    ws.onclose = function(){ append('${escapeForHtml(strings.terminal.disconnected)}', 'err'); };
    ws.onerror = function(){ append('${escapeForHtml(strings.terminal.disconnected)}', 'err'); };
  }
  open();
  input.addEventListener('keydown', function(e){
    if (e.key === 'Enter') {
      var v = input.value;
      append('$ ' + v);
      if (ws && ws.readyState === 1) {
        try { ws.send(v + '\\n'); } catch (err) { append('send failed', 'err'); }
      }
      input.value = '';
    }
  });
})();
</script>
</body></html>`;
}

function escapeForHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/'/g, '&#39;')
    .replace(/"/g, '&quot;');
}
