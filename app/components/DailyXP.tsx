'use client'

import { useEffect, useRef } from 'react'
import { checkAchievements } from './AchievementToast'

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
    // Ежедневный вход +5 XP, затем проверка ачивок
    awardXp({ action: 'login' }).then(() => checkAchievements())

    // Трекинг времени: каждые 60 сек
    timerRef.current = setInterval(() => {
      awardXp({ action: 'time', seconds: 60 })
    }, 60_000)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  return null
}
