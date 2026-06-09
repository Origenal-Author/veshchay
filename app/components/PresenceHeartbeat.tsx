'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase'

// Шлёт heartbeat в presence на ЛЮБОЙ странице сайта.
// До этого heartbeat был только в OnlineCount на главной — отсюда счётчик в сети показывал 0.
export default function PresenceHeartbeat() {
  useEffect(() => {
    const supabase = createClient()
    let stopped = false
    let hidden: boolean | null = null   // настройка «скрыть онлайн-статус», читаем 1 раз

    async function tick() {
      if (stopped) return
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      if (hidden === null) {
        const { data: prof } = await supabase.from('profiles').select('settings').eq('id', user.id).single()
        hidden = !!(prof?.settings?.online_hidden)
      }
      if (hidden) return
      await supabase.from('presence').upsert({
        user_id: user.id,
        last_seen: new Date().toISOString(),
      })
    }

    tick()
    const iv = setInterval(tick, 30_000)
    return () => { stopped = true; clearInterval(iv) }
  }, [])

  return null
}
