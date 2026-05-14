export type AchievementCategory = 'start' | 'activity' | 'content' | 'pets' | 'secret'

export interface AchievementDef {
  key: string
  name: string
  description: string
  category: AchievementCategory
  icon: string
  secret?: boolean
}

export const ACHIEVEMENTS: AchievementDef[] = [
  // Начало
  { key: 'ONLINE',         name: 'ОНЛАЙН',                description: 'Первый вход на платформу',              category: 'start',    icon: '📡' },
  { key: 'FIRST_SIGNAL',   name: 'ПЕРВЫЙ СИГНАЛ',         description: 'Загрузить первое видео',                category: 'start',    icon: '▶' },
  { key: 'IDENTITY',       name: 'ЛИЧНОСТЬ УСТАНОВЛЕНА',  description: 'Заполнить профиль полностью',           category: 'start',    icon: '🪪' },
  { key: 'FIRST_WATCHER',  name: 'ПЕРВЫЙ НАБЛЮДАТЕЛЬ',    description: 'Получить первого подписчика',           category: 'start',    icon: '👁' },
  { key: 'FIRST_CONTACT',  name: 'ПЕРВЫЙ КОНТАКТ',        description: 'Оставить отклик на чужое видео',        category: 'start',    icon: '⚡' },

  // Активность
  { key: 'STREAK_7',       name: 'СТРИК-7',               description: '7 дней подряд на сайте',               category: 'activity', icon: '🔥' },
  { key: 'NOISE_ATTACK',   name: 'ШУМОВАЯ АТАКА',         description: 'Оставить 30 откликов за один день',    category: 'activity', icon: '📢' },
  { key: 'MARATHON',       name: 'МАРАФОН',               description: '10 часов суммарно на сайте',           category: 'activity', icon: '⏱' },
  { key: 'HACKER_5',       name: 'ВЗЛОМЩИК ПРОФИЛЕЙ',     description: 'Пройти 5 головоломок',                 category: 'activity', icon: '🔓' },
  { key: 'SERIAL_HACKER',  name: 'СЕРИЙНЫЙ ВЗЛОМЩИК',     description: 'Пройти 20 головоломок',                category: 'activity', icon: '💀' },

  // Контент
  { key: 'ARCHIVE',        name: 'АРХИВ',                 description: 'Загрузить 10 видео',                   category: 'content',  icon: '📦' },
  { key: 'VIRAL',          name: 'ВИРУСНЫЙ',              description: 'Набрать 1000 просмотров суммарно',     category: 'content',  icon: '🦠' },
  { key: 'ECHO_CHAMBER',   name: 'ЭХО-КАМЕРА',           description: 'Получить 50 откликов на свои видео',   category: 'content',  icon: '🔊' },
  { key: 'NETWORK_NODE',   name: 'СЕТЕВОЙ УЗЕЛ',          description: 'Набрать 10 подписчиков',              category: 'content',  icon: '🕸' },

  // Питомцы
  { key: 'FIRST_PARASITE', name: 'ПЕРВЫЙ ПАРАЗИТ',        description: 'Вылупить первого питомца',             category: 'pets',     icon: '🥚' },
  { key: 'FULL_INCUBATOR', name: 'ПОЛНЫЙ ИНКУБАТОР',      description: 'Иметь 3 питомца одновременно',         category: 'pets',     icon: '🧫' },
  { key: 'FEEDER',         name: 'КОРМИЛЕЦ',              description: 'Покормить питомца 10 раз',             category: 'pets',     icon: '🍖' },
  { key: 'JANITOR',        name: 'САНИТАР',               description: 'Раздавить 5 жуков',                   category: 'pets',     icon: '🪲' },
  { key: 'LEGEND',         name: 'ЛЕГЕНДА',               description: 'Получить питомца КРИСТАЛЛ',            category: 'pets',     icon: '💎' },

  // Секретные
  { key: 'GHOST_SIGNAL',   name: 'ПРИЗРАК ЭФИРА',         description: 'Зайти на сайт в 3:00–4:00 ночи',      category: 'secret',   icon: '👻', secret: true },
  { key: 'VOID_BROADCAST', name: 'ВЕЩАЮ В ПУСТОТУ',       description: 'Видео 7 дней без единого просмотра',   category: 'secret',   icon: '📻', secret: true },
  { key: 'BLIND_SIGNAL',   name: 'СЛЕПОЙ СИГНАЛ',         description: 'Загрузить видео без описания',         category: 'secret',   icon: '🔇', secret: true },
  { key: 'INVISIBLE',      name: 'НЕВИДИМКА',             description: '5 дней подряд без единого действия',  category: 'secret',   icon: '🌑', secret: true },
]

export const CATEGORY_LABELS: Record<AchievementCategory, string> = {
  start:    'НАЧАЛО',
  activity: 'АКТИВНОСТЬ',
  content:  'КОНТЕНТ',
  pets:     'ПАРАЗИТЫ',
  secret:   'СЕКРЕТНЫЕ',
}
