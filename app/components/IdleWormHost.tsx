'use client'

import { useEffect, useState } from 'react'
import DigitalWorm from './DigitalWorm'

const LAST_VISIT_KEY = 'veshchay_last_visit'
const IDLE_THRESHOLD_MS = 24 * 60 * 60 * 1000  // 24 часа
const LOGOUT_TRIGGER_KEY = 'veshchay_logout_worm'

// Слушает событие "veshchay-worm-spawn" и при заходе после 24+ часов отсутствия —
// показывает Цифрового Червя один раз.
export default function IdleWormHost() {
  const [active, setActive] = useState(false)

  useEffect(() => {
    // 1. Проверка на простой 24+ часов
    try {
      const last = localStorage.getItem(LAST_VISIT_KEY)
      const now = Date.now()
      if (last) {
        const diff = now - parseInt(last, 10)
        if (diff >= IDLE_THRESHOLD_MS) {
          // долго не заходил → червь
          setActive(true)
        }
      }
      localStorage.setItem(LAST_VISIT_KEY, String(now))

      // 2. Если только что вышли из аккаунта (флаг в sessionStorage) → червь
      const logoutFlag = sessionStorage.getItem(LOGOUT_TRIGGER_KEY)
      if (logoutFlag) {
        sessionStorage.removeItem(LOGOUT_TRIGGER_KEY)
        setActive(true)
      }
    } catch { /* ignore */ }

    // 3. Ручной spawn через событие (например debug)
    function onSpawn() { setActive(true) }
    window.addEventListener('veshchay-worm-spawn', onSpawn)
    return () => window.removeEventListener('veshchay-worm-spawn', onSpawn)
  }, [])

  if (!active) return null
  return <DigitalWorm onDespawn={() => setActive(false)} />
}
