export const XP_RANKS = [
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

export function getRank(xp: number): string {
  return [...XP_RANKS].reverse().find(r => xp >= r.xp)?.rank ?? 'СТАТИЧЕСКИЙ ШУМ'
}

export function calcBioXp(length: number): number {
  if (length === 0) return 0
  if (length <= 30) return 5
  if (length <= 100) return 15
  return 30
}

export function getMaxPets(xp: number): number {
  if (xp >= 30000) return 10 // РУТОВЫЙ ДОСТУП
  if (xp >= 15000) return 8  // СИСТЕМНЫЙ БОГ
  if (xp >= 7500)  return 7  // ТЕНЕВОЙ АРХИТЕКТ
  if (xp >= 4000)  return 6  // НЕЙРОМАНТ
  if (xp >= 2000)  return 5  // ПРИЗРАК
  if (xp >= 1000)  return 4  // АГЕНТ
  if (xp >= 500)   return 3  // ВЗЛОМЩИК
  return 0
}
