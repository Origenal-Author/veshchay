'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

export default function OnlineCount({ userId }: { userId: string | null }) {
  const [count, setCount] = useState<number | null>(null)

  useEffect(() => {
    const supabase = createClient()

    // Регистрируем себя как онлайн
    if (userId) {
      supabase.from('presence').upsert({ user_id: userId, last_seen: new Date().toISOString() })
      const interval = setInterval(() => {
        supabase.from('presence').upsert({ user_id: userId, last_seen: new Date().toISOString() })
      }, 30000)
      return () => clearInterval(interval)
    }

    // Считаем онлайн (активные за последние 2 минуты)
    const fetch = async () => {
      const since = new Date(Date.now() - 2 * 60 * 1000).toISOString()
      const { count: c } = await supabase
        .from('presence')
        .select('*', { count: 'exact', head: true })
        .gte('last_seen', since)
      setCount(c ?? 0)
    }

    fetch()
    const timer = setInterval(fetch, 30000)
    return () => clearInterval(timer)
  }, [userId])

  useEffect(() => {
    if (!userId) return
    const supabase = createClient()
    const since = new Date(Date.now() - 2 * 60 * 1000).toISOString()
    supabase.from('presence')
      .select('*', { count: 'exact', head: true })
      .gte('last_seen', since)
      .then(({ count: c }) => setCount(c ?? 1))

    const timer = setInterval(async () => {
      const s = new Date(Date.now() - 2 * 60 * 1000).toISOString()
      const { count: c } = await supabase.from('presence').select('*', { count: 'exact', head: true }).gte('last_seen', s)
      setCount(c ?? 1)
    }, 30000)
    return () => clearInterval(timer)
  }, [userId])

  if (count === null) return <span>...</span>
  return <span>{count.toLocaleString('ru')}</span>
}
