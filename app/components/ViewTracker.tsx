'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase'

const XP_RANKS = [
  { xp: 0, rank: 'НОВОБРАНЕЦ' },
  { xp: 50, rank: 'ОПЕРАТИВНИК' },
  { xp: 200, rank: 'АГЕНТ' },
  { xp: 500, rank: 'ПРИЗРАК' },
  { xp: 1000, rank: 'АРХИТЕКТОР' },
  { xp: 2500, rank: 'ХАКЕР' },
]

function getRank(xp: number) {
  return [...XP_RANKS].reverse().find(r => xp >= r.xp)?.rank ?? 'НОВОБРАНЕЦ'
}

export default function ViewTracker({ videoId, userId }: { videoId: string, userId: string }) {
  useEffect(() => {
    const timer = setTimeout(async () => {
      const supabase = createClient()

      // Записываем просмотр
      const { error } = await supabase
        .from('views')
        .insert({ video_id: videoId, user_id: userId })

      if (!error) {
        // +5 XP за просмотр
        const { data: profile } = await supabase
          .from('profiles')
          .select('xp')
          .eq('id', userId)
          .single()

        if (profile) {
          const newXp = (profile.xp || 0) + 5
          await supabase
            .from('profiles')
            .update({ xp: newXp, rank: getRank(newXp) })
            .eq('id', userId)
        }

        // Увеличиваем счётчик просмотров видео
        await supabase.rpc('increment_views', { video_id: videoId })
      }
    }, 10000) // засчитываем после 10 сек просмотра

    return () => clearTimeout(timer)
  }, [videoId, userId])

  return null
}
