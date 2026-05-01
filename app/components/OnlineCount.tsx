'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

export default function OnlineCount({ userId }: { userId: string | null }) {
  const [count, setCount] = useState<number>(1)

  useEffect(() => {
    const supabase = createClient()

    // Обновляем своё присутствие
    async function heartbeat() {
      if (!userId) return
      await supabase.from('presence').upsert({ user_id: userId, last_seen: new Date().toISOString() })
    }

    async function fetchCount() {
      const since = new Date(Date.now() - 2 * 60 * 1000).toISOString()
      const { count: c } = await supabase
        .from('presence')
        .select('*', { count: 'exact', head: true })
        .gte('last_seen', since)
      setCount(c ?? 1)
    }

    heartbeat()
    fetchCount()

    const heartbeatInterval = setInterval(heartbeat, 30000)
    const countInterval = setInterval(fetchCount, 15000)

    // Realtime подписка на изменения presence
    const channel = supabase
      .channel('presence-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'presence' }, fetchCount)
      .subscribe()

    return () => {
      clearInterval(heartbeatInterval)
      clearInterval(countInterval)
      supabase.removeChannel(channel)
    }
  }, [userId])

  return <span>{count.toLocaleString('ru')}</span>
}
