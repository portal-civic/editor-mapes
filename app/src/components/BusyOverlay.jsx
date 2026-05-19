import { useEffect, useRef, useState } from 'react'

export default function BusyOverlay({ active, message, blocking }) {
  const [visible, setVisible] = useState(false)
  const timerRef = useRef(null)

  useEffect(() => {
    clearTimeout(timerRef.current)
    if (active) {
      timerRef.current = setTimeout(() => setVisible(true), 200)
    } else {
      setVisible(false)
    }
    return () => clearTimeout(timerRef.current)
  }, [active])

  if (!visible) return null

  return (
    <div className={`busy-overlay${blocking ? ' busy-overlay--blocking' : ''}`} aria-live="polite">
      <div className="busy-overlay-box">
        <span className="busy-spinner" aria-hidden="true" />
        {message && <span className="busy-overlay-msg">{message}</span>}
      </div>
    </div>
  )
}
