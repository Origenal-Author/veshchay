export const CLAN_ROLES = {
  coordinator: 'КООРДИНАТОР',
  instructor:  'ИНСТРУКТОР',
  mediator:    'ПОСРЕДНИК',
  recruit:     'ЗАВЕРБОВАННЫЙ РЕКРУТ',
} as const

export type ClanRole = keyof typeof CLAN_ROLES

export const CLAN_SYMBOLS = [
  '◈','⬡','◆','▲','✦','⊕','⊗','◉','⬢','✧',
  '★','☠','⊘','⊛','❖','◐','▣','⟁','⬟','⬣',
  '⬨','◇','△','▽','◢','◣','✷','✶','✸','✺',
  '⊞','⊠','⌬','⎔','◍','◌','◑','◒','⌖','⌘',
  '☥','✠','⚙','⟐','⟢','⟣','⟴','⟆',
]

// Парсит "⬡:90" → { symbol: "⬡", rotation: 90 }. Просто "⬡" → rotation 0.
export function parseClanSymbol(raw: string): { symbol: string; rotation: number } {
  const [symbol, rotStr] = raw.split(':')
  const rotation = rotStr ? Number(rotStr) || 0 : 0
  return { symbol, rotation }
}

export function encodeClanSymbol(symbol: string, rotation: number): string {
  return rotation ? `${symbol}:${rotation}` : symbol
}

export const CLAN_COLORS = [
  { label: 'СИГНАЛ',    value: '#00FFF0' },
  { label: 'МАТРИЦА',   value: '#00FF88' },
  { label: 'ПРИЗРАК',   value: '#C084FC' },
  { label: 'ОГОНЬ',     value: '#FF7B00' },
  { label: 'ТРЕВОГА',   value: '#FF006E' },
  { label: 'ЗОЛОТО',    value: '#FFD700' },
  { label: 'СТАЛЬ',     value: '#8892B0' },
  { label: 'БЕЛЫЙ',     value: '#FFFFFF' },
]

export function getMaxClans(xp: number): number {
  if (xp >= 30000) return 5 // РУТОВЫЙ ДОСТУП
  if (xp >= 15000) return 4 // СИСТЕМНЫЙ БОГ
  if (xp >= 7500)  return 3 // ТЕНЕВОЙ АРХИТЕКТ
  if (xp >= 4000)  return 2 // НЕЙРОМАНТ
  return 1
}

export const MAX_CLAN_MEMBERS = 24
export const MIN_FRIENDS_TO_CREATE = 6
