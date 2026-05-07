import { useEffect, useState } from 'react'

interface Props {
  message: string
  onDismiss: () => void
}

export default function SolveToast({ message, onDismiss }: Props) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const id = setTimeout(() => { setVisible(false); setTimeout(onDismiss, 300) }, 3000)
    return () => clearTimeout(id)
  }, [onDismiss])

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-navy-900 border border-success/40 rounded-lg px-5 py-3 shadow-lg transition-all duration-300 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
      }`}
    >
      <span className="text-success text-lg">🏴‍☠️</span>
      <p className="text-white text-sm">{message}</p>
    </div>
  )
}
