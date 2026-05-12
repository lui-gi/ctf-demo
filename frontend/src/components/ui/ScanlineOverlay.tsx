/* ─── ScanlineOverlay ────────────────────────────────────────
   Site-wide CRT-style scanline overlay. Pure visual, ~0.045 alpha
   per stripe so it reads as paper-fibre texture from far away and
   as scanlines from up close. mix-blend-mode: multiply keeps it
   from washing out the bright tropical palette. Static — no
   animation, no perf cost.

   Mounted once at app root. */
export function ScanlineOverlay() {
  return <div className="cyber-scanlines" aria-hidden />
}
