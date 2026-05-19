export type QuestDef = {
  key: string
  title: string
  desc: string
  target: number
  xp: number
  icon: string
}

export const QUESTS_POOL: QuestDef[] = [
  { key: 'watch_1',  title: 'ПЕРВЫЙ СИГНАЛ',  desc: 'Посмотри 1 видео',         target: 1, xp: 10, icon: '▶' },
  { key: 'watch_3',  title: 'АКТИВНЫЙ АГЕНТ', desc: 'Посмотри 3 видео',          target: 3, xp: 20, icon: '▶▶' },
  { key: 'echo_1',   title: 'ЭХО В СЕТИ',    desc: 'Оставь 1 отклик под видео', target: 1, xp: 15, icon: '◎' },
  { key: 'feed_pet', title: 'ОХОТНИК',        desc: 'Накорми питомца 1 раз',     target: 1, xp: 10, icon: '☄' },
  { key: 'attack_1', title: 'ВЗЛОМЩИК ДНЯ',  desc: 'Взломай кого-нибудь',       target: 1, xp: 25, icon: '⚡' },
  { key: 'follow_1', title: 'СОЦИАЛЬНЫЙ',     desc: 'Подпишись на кого-то',      target: 1, xp: 15, icon: '◈' },
  { key: 'upload_1', title: 'ВЕЩАТЕЛЬ',       desc: 'Загрузи видео сегодня',     target: 1, xp: 20, icon: '📡' },
]

export function getQuestDef(key: string): QuestDef | undefined {
  return QUESTS_POOL.find(q => q.key === key)
}

export function pickTodayQuests(userId: string, date: string): string[] {
  let hash = 5381
  const seed = userId + date
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) + hash + seed.charCodeAt(i)) | 0
  }
  const shuffled = QUESTS_POOL.map(q => q.key)
  for (let i = shuffled.length - 1; i > 0; i--) {
    hash = ((hash << 5) + hash + i) | 0
    const j = Math.abs(hash) % (i + 1)
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled.slice(0, 3)
}
