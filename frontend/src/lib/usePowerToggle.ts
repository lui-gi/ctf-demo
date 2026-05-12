import { useEffect, useState, useCallback } from 'react'

/* ─── usePowerToggle ──────────────────────────────────────────
   Shared on/off flag for the cursor-trail "Power" effect. Lives
   in localStorage so the choice persists across reloads, and is
   shared between the landing-page chip and the TopNav toggle via
   a "storage" event listener (so toggling in one tab/page reflects
   in the other immediately).

   Returns [enabled, toggle]. Respects prefers-reduced-motion —
   if the user has opted out at the OS level, the toggle is force
   off and `toggle` becomes a no-op. */

const KEY = 'progctf:power-trail'

function readEnabled(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return window.localStorage.getItem(KEY) === '1'
  } catch {
    return false
  }
}

export function usePowerToggle(): [boolean, () => void, boolean] {
  const [enabled, setEnabled] = useState(false)
  const [reduced, setReduced] = useState(false)

  /* Mount: read storage + reduced-motion. */
  useEffect(() => {
    setEnabled(readEnabled())
    const mql = window.matchMedia?.('(prefers-reduced-motion: reduce)')
    if (!mql) return
    setReduced(mql.matches)
    const onMql = (e: MediaQueryListEvent) => setReduced(e.matches)
    mql.addEventListener('change', onMql)
    return () => mql.removeEventListener('change', onMql)
  }, [])

  /* Cross-context sync — if another component (or another tab)
     writes to the same key, mirror it locally. */
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY) setEnabled(e.newValue === '1')
    }
    window.addEventListener('storage', onStorage)
    /* Custom in-page event for same-tab sync (storage event doesn't
       fire in the same tab that writes it). */
    const onPing = () => setEnabled(readEnabled())
    window.addEventListener('progctf:power-trail-change', onPing)
    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener('progctf:power-trail-change', onPing)
    }
  }, [])

  const toggle = useCallback(() => {
    if (reduced) return
    const next = !readEnabled()
    try { window.localStorage.setItem(KEY, next ? '1' : '0') } catch {}
    setEnabled(next)
    window.dispatchEvent(new Event('progctf:power-trail-change'))
  }, [reduced])

  return [enabled && !reduced, toggle, reduced]
}
