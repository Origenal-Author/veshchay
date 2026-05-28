import { createClient as createSupabase, type SupabaseClient } from '@supabase/supabase-js'

// Список причин начисления байтов — для аналитики и истории транзакций
export type ByteReason =
  | 'view'          // просмотр чужого видео
  | 'reaction'      // лайк/коммент твоего видео
  | 'follower'      // новая подписка на тебя
  | 'upload'        // загрузил видео
  | 'quest'         // ежедневный квест
  | 'pet_grew'      // питомец дорос до взрослого
  | 'attack_win'    // успешная атака
  | 'heal_win'      // победа в мини-игре лечения
  | 'achievement'   // открыта ачивка
  | 'bug_killed'    // убил таракана/червя
  | 'rank_up'       // получен новый ранг
  | 'admin'         // ручное начисление через SQL/админку

// Награды по умолчанию (можно переопределять в местах вызова)
export const BYTE_REWARDS: Record<ByteReason, number> = {
  view:        1,
  reaction:    5,
  follower:    25,
  upload:      50,
  quest:       50,
  pet_grew:    200,
  attack_win:  100,
  heal_win:    30,
  achievement: 100,
  bug_killed:  10,
  rank_up:     500,
  admin:       0,
}

let _service: SupabaseClient | null = null
function service() {
  if (!_service) {
    _service = createSupabase(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )
  }
  return _service
}

/**
 * Начислить байты пользователю.
 * Использует service_role чтобы обойти RLS. Безопасно вызывать только с сервера.
 */
export async function awardBytes(userId: string, amount: number, _reason: ByteReason) {
  if (amount <= 0) return
  const sb = service()
  const { data: profile } = await sb.from('profiles').select('bytes').eq('id', userId).single()
  if (!profile) return
  const newBytes = (profile.bytes ?? 0) + amount
  await sb.from('profiles').update({ bytes: newBytes }).eq('id', userId)
}

/**
 * Списать байты (при покупке). Возвращает true если хватило.
 */
export async function spendBytes(userId: string, amount: number): Promise<{ ok: boolean; newBytes: number }> {
  const sb = service()
  const { data: profile } = await sb.from('profiles').select('bytes').eq('id', userId).single()
  const current = profile?.bytes ?? 0
  if (current < amount) return { ok: false, newBytes: current }
  const newBytes = current - amount
  await sb.from('profiles').update({ bytes: newBytes }).eq('id', userId)
  return { ok: true, newBytes }
}
