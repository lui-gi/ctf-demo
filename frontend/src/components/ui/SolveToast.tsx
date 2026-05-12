import { useEffect, useState } from 'react'
import { MessengerSnail } from './AbilityPrims'

interface Props {
  message: string
  onDismiss: () => void
}

/* ─── SolveToast ──────────────────────────────────────────────
   Bottom-right notification chip styled as a messenger-snail
   delivering news. Auto-dismisses after 3s. */
export default function SolveToast({ message, onDismiss }: Props) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const id = setTimeout(() => {
      setVisible(false)
      setTimeout(onDismiss, 300)
    }, 3000)
    return () => clearTimeout(id)
  }, [onDismiss])

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3 transition-all duration-300 parchment-card ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
      }`}
      style={{ borderColor: 'var(--status-ok, #3d6b3a)' }}
    >
      <span style={{ display: 'inline-flex', transformOrigin: 'center' }}>
        <MessengerSnail size={32} />
      </span>
      <p className="text-sm font-poster" style={{ color: 'var(--ink, #2a1a08)' }}>
        {message}
      </p>
    </div>
  )
}
