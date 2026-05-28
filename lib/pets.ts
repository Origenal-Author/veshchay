export type PetType = 'hologram' | 'ghost' | 'jellyfish' | 'signal' | 'radar' | 'neuron' | 'plasma' | 'crystal'
export type PetVariant = 'kod' | 'virus'
export type PetStage = 'egg' | 'baby' | 'adult'
export type PetRarity = 'common' | 'uncommon' | 'rare' | 'legendary'

export interface PetDef {
  type: PetType
  nameRu: string
  color: string
  colorVirus: string
  rarity: PetRarity
  weight: number
  rarityLabel: string
  abilityKod: string
  abilityVirus: string
}

export interface Pet {
  id: string
  user_id: string
  type: PetType
  variant: PetVariant
  stage: PetStage
  stage_xp: number
  feed_count: number
  name: string | null
  created_at: string
  infected_by?: string | null
  infected_at?: string | null
  equipped?: string[] | null  // ключи надетой одежды
}

export const PET_DEFS: PetDef[] = [
  {
    type: 'hologram',
    nameRu: 'ГОЛОГРАММА',
    color: '#00D4FF',
    colorVirus: '#FF006E',
    rarity: 'common',
    weight: 28,
    rarityLabel: 'ЧАСТЫЙ',
    abilityKod: 'Создаёт призрачный дубль, который скользит рядом',
    abilityVirus: 'Подменяет аватарки на глитч-картинки',
  },
  {
    type: 'ghost',
    nameRu: 'ПРИЗРАК',
    color: '#AAAAFF',
    colorVirus: '#FF006E',
    rarity: 'common',
    weight: 22,
    rarityLabel: 'ЧАСТЫЙ',
    abilityKod: 'Телепортируется — исчезает и появляется в другом углу',
    abilityVirus: 'Делает страницу полупрозрачной на 3 сек',
  },
  {
    type: 'jellyfish',
    nameRu: 'МЕДУЗА СЕТИ',
    color: '#00FFB3',
    colorVirus: '#FF4D00',
    rarity: 'uncommon',
    weight: 18,
    rarityLabel: 'РЕДКИЙ',
    abilityKod: 'Замедляет скролл — как будто страница под водой',
    abilityVirus: 'Прицепляется щупальцами к элементам и смещает их',
  },
  {
    type: 'signal',
    nameRu: 'СИГНАЛ',
    color: '#00FF88',
    colorVirus: '#FF8800',
    rarity: 'uncommon',
    weight: 14,
    rarityLabel: 'РЕДКИЙ',
    abilityKod: 'Пингует страницу волнами — подсвечивает карточки',
    abilityVirus: 'Глушит звук видео статическими помехами',
  },
  {
    type: 'radar',
    nameRu: 'РАДАР',
    color: '#39FF14',
    colorVirus: '#FF1744',
    rarity: 'uncommon',
    weight: 10,
    rarityLabel: 'РЕДКИЙ',
    abilityKod: 'Сканирует страницу — ставит метки на все видео',
    abilityVirus: 'Засоряет экран хаотичными точками-помехами',
  },
  {
    type: 'neuron',
    nameRu: 'НЕЙРОН',
    color: '#B44FFF',
    colorVirus: '#FF2266',
    rarity: 'rare',
    weight: 4,
    rarityLabel: 'ОСОБЫЙ',
    abilityKod: 'Рисует связи между похожими видео на экране',
    abilityVirus: 'Перекоммутирует кнопки — случайно меняет их местами',
  },
  {
    type: 'plasma',
    nameRu: 'ПЛАЗМА',
    color: '#FFD700',
    colorVirus: '#FF3300',
    rarity: 'rare',
    weight: 3,
    rarityLabel: 'ОСОБЫЙ',
    abilityKod: 'Подсвечивает карточки молниями при наведении',
    abilityVirus: 'Раз в минуту разряжается — экран вспыхивает',
  },
  {
    type: 'crystal',
    nameRu: 'КРИСТАЛЛ',
    color: '#FF88FF',
    colorVirus: '#FF4400',
    rarity: 'legendary',
    weight: 1,
    rarityLabel: 'ЛЕГЕНДАРНЫЙ',
    abilityKod: 'За курсором остаётся радужный призматический шлейф',
    abilityVirus: 'Разбивает экран на грани со смещением',
  },
]

export const RARITY_COLOR: Record<PetRarity, string> = {
  common: '#8892B0',
  uncommon: '#00FFF0',
  rare: '#B44FFF',
  legendary: '#FF88FF',
}

export const RARITY_GLOW: Record<PetRarity, string> = {
  common: 'rgba(136,146,176,0.3)',
  uncommon: 'rgba(0,255,240,0.3)',
  rare: 'rgba(180,79,255,0.35)',
  legendary: 'rgba(255,136,255,0.45)',
}

export const RARITY_LABEL_COLOR: Record<PetRarity, string> = {
  common: '#8892B0',
  uncommon: '#00FFF0',
  rare: '#B44FFF',
  legendary: '#FF88FF',
}

export function rollPet(): { type: PetType; variant: PetVariant } {
  const total = PET_DEFS.reduce((s, d) => s + d.weight, 0)
  let r = Math.random() * total
  for (const def of PET_DEFS) {
    r -= def.weight
    if (r <= 0) {
      return { type: def.type, variant: Math.random() < 0.6 ? 'kod' : 'virus' }
    }
  }
  return { type: 'hologram', variant: 'kod' }
}

export function getPetDef(type: PetType): PetDef {
  return PET_DEFS.find(d => d.type === type)!
}

export const STAGE_XP: Record<PetStage, number> = {
  egg: 0,
  baby: 50,
  adult: 200,
}

export function getNextStage(stage: PetStage): PetStage | null {
  if (stage === 'egg') return 'baby'
  if (stage === 'baby') return 'adult'
  return null
}

export function getStageProgress(stage: PetStage, xp: number): number {
  if (stage === 'egg') return Math.min(100, Math.round((xp / 50) * 100))
  if (stage === 'baby') return Math.min(100, Math.round(((xp - 50) / 150) * 100))
  return 100
}
