'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase'

const XP_RANKS = [
  { xp: 0,     rank: 'СТАТИЧЕСКИЙ ШУМ' },
  { xp: 75,    rank: 'ПИНГ' },
  { xp: 200,   rank: 'ОПЕРАТИВНИК' },
  { xp: 500,   rank: 'ВЗЛОМЩИК' },
  { xp: 1000,  rank: 'АГЕНТ' },
  { xp: 2000,  rank: 'ПРИЗРАК' },
  { xp: 4000,  rank: 'НЕЙРОМАНТ' },
  { xp: 7500,  rank: 'ТЕНЕВОЙ АРХИТЕКТ' },
  { xp: 15000, rank: 'СИСТЕМНЫЙ БОГ' },
  { xp: 30000, rank: 'РУТОВЫЙ ДОСТУП' },
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

        // Проверяем майлстоны просмотров для владельца видео
        const { data: vid } = await supabase
          .from('videos').select('user_id, views_count').eq('id', videoId).single()
        if (vid && vid.user_id !== userId) {
          fetch('/api/xp/award', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'views_milestone', videoId }),
          }).catch(() => {})
        }
      }
    }, 10000) // засчитываем после 10 сек просмотра

    return () => clearTimeout(timer)
  }, [videoId, userId])

  return null
}
