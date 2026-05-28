'use client'

import { useEffect, useState } from 'react'
import DigitalWorm from './DigitalWorm'

const LAST_VISIT_KEY = 'veshchay_last_visit'
const WORM_SHOWN_AT_KEY = 'veshchay_worm_shown_at'
const IDLE_THRESHOLD_MS = 24 * 60 * 60 * 1000  // 24 часа
const WORM_COOLDOWN_MS = 60 * 60 * 1000        // 1 час между показами червя
const LOGOUT_TRIGGER_KEY = 'veshchay_logout_worm'

export default function IdleWormHost() {
  const [active, setActive] = useState(false)

  useEffect(() => {
    let shouldShow = false

    try {
      // ── Не показывать чаще раза в час, что бы ни произошло ────────────
      const shownAt = localStorage.getItem(WORM_SHOWN_AT_KEY)
      const now = Date.now()
      const onCooldown = shownAt && (now - parseInt(shownAt, 10) < WORM_COOLDOWN_MS)

      // ── Триггер 1: простой 24+ часов ────────────────────────────────
      const last = localStorage.getItem(LAST_VISIT_KEY)
      if (last && !onCooldown) {
        const diff = now - parseInt(last, 10)
        if (diff >= IDLE_THRESHOLD_MS) shouldShow = true
      }
      localStorage.setItem(LAST_VISIT_KEY, String(now))

      // ── Триггер 2: только что вышли из аккаунта ────────────────────
      const logoutFlag = sessionStorage.getItem(LOGOUT_TRIGGER_KEY)
      if (logoutFlag) {
        sessionStorage.removeItem(LOGOUT_TRIGGER_KEY)
        if (!onCooldown) shouldShow = true
      }

      if (shouldShow) {
        localStorage.setItem(WORM_SHOWN_AT_KEY, String(now))
        setActive(true)
      }
    } catch { /* ignore */ }

    // Ручной spawn через событие (debug) — игнорирует cooldown
    function onSpawn() {
      try { localStorage.setItem(WORM_SHOWN_AT_KEY, String(Date.now())) } catch {}
      setActive(true)
    }
    window.addEventListener('veshchay-worm-spawn', onSpawn)
    return () => window.removeEventListener('veshchay-worm-spawn', onSpawn)
  }, [])

  if (!active) return null
  return <DigitalWorm onDespawn={() => setActive(false)} />
}
