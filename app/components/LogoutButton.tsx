'use client'

import { useRef, useState } from 'react'
import DigitalWorm from './DigitalWorm'

interface Props {
  action: () => void
  className?: string
  label?: string
}

// Кнопка ВЫЙТИ — перед редиректом показывает Цифрового Червя на 3 секунды.
// Червь живёт на странице логина после редиректа тоже (через sessionStorage флаг).
export default function LogoutButton({ action, className, label = 'ВЫЙТИ' }: Props) {
  const [showingWorm, setShowingWorm] = useState(false)
  const submittedRef = useRef(false)

  function startLogout() {
    if (submittedRef.current) return
    submittedRef.current = true
    // Ставим флаг чтобы IdleWormHost на login странице тоже показал червя
    try { sessionStorage.setItem('veshchay_logout_worm', '1') } catch { /* ignore */ }
    setShowingWorm(true)
    setTimeout(() => { action() }, 2800)
  }

  return (
    <>
      <button
        type="button"
        onClick={startLogout}
        className={className}
        disabled={submittedRef.current}
      >
        {submittedRef.current ? '...' : label}
      </button>
      {showingWorm && <DigitalWorm onDespawn={() => { /* пусть бежит, redirect скоро */ }} durationMs={4000} />}
    </>
  )
}
