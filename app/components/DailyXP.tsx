'use client'

import { useEffect, useRef } from 'react'

async function awardXp(body: object) {
  try {
    await fetch('/api/xp/award', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  } catch { /* fire-and-forget */ }
}

export default function DailyXP() {
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    // Ежедневный вход +5 XP
    awardXp({ action: 'login' })

    // Трекинг времени: каждые 60 сек отправляем +60 сек на сервер
    timerRef.current = setInterval(() => {
      awardXp({ action: 'time', seconds: 60 })
    }, 60_000)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  return null
}
