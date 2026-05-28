// Каталог одежды для питомцев. Каждый предмет — SVG-фрагмент (viewBox 0..100).
// На одном слоте может быть только один предмет.

export type ClothingSlot = 'head' | 'face' | 'neck' | 'paw'
export type ClothingStyle = 'cute' | 'cool' | 'evil' | 'royal' | 'casual'

export interface ClothingItem {
  key: string
  name: string
  price: number
  slot: ClothingSlot
  style: ClothingStyle
  description: string
  svg: string  // содержимое внутри <svg viewBox="0 0 100 100"> (без тега самого svg)
}

export const CLOTHING: ClothingItem[] = [
  // ─── ГОЛОВА ─────────────────────────────────────────────────────────────
  {
    key: 'bow_pink', name: 'РОЗОВЫЙ БАНТИК', price: 80, slot: 'head', style: 'cute',
    description: 'милый розовый бант',
    svg: `<g stroke="#FF66CC" stroke-width="2.5" fill="rgba(255,102,204,0.22)" stroke-linejoin="round" filter="drop-shadow(0 0 8px #FF66CC)">
      <g transform="translate(50 50) rotate(90) scale(1.5) translate(-30 -66)">
        <path d="M30 66 C18 56 14 48 18 42 C22 36 28 38 30 44 C32 38 38 36 42 42 C46 48 42 56 30 66 Z"/>
      </g>
      <g transform="translate(50 50) rotate(-90) scale(1.5) translate(-30 -66)">
        <path d="M30 66 C18 56 14 48 18 42 C22 36 28 38 30 44 C32 38 38 36 42 42 C46 48 42 56 30 66 Z"/>
      </g>
    </g>`,
  },
  {
    key: 'crown_gold', name: 'КОРОНА', price: 500, slot: 'head', style: 'royal',
    description: 'королевская корона',
    svg: `<g stroke="#FFD700" stroke-width="2.5" fill="rgba(255,215,0,0.2)" stroke-linejoin="round" filter="drop-shadow(0 0 10px #FFD700)">
      <path d="M18 70 L22 50 L30 30 L40 50 L50 22 L60 50 L70 30 L78 50 L82 70 Z"/>
      <line x1="22" y1="50" x2="78" y2="50" stroke-width="1.5" opacity="0.7"/>
      <circle cx="30" cy="30" r="2.5" fill="#00FFF0" stroke="none"/>
      <circle cx="50" cy="22" r="3" fill="#FF006E" stroke="none"/>
      <circle cx="70" cy="30" r="2.5" fill="#00FFF0" stroke="none"/>
      <circle cx="50" cy="60" r="2.5" fill="#FF006E" stroke="#FFD700" stroke-width="1"/>
    </g>`,
  },
  {
    key: 'tophat', name: 'ЦИЛИНДР', price: 200, slot: 'head', style: 'cool',
    description: 'аристократичный цилиндр',
    svg: `<g filter="drop-shadow(0 0 8px #00FFF0)">
      <rect x="14" y="68" width="72" height="6" rx="2" stroke="#00FFF0" stroke-width="2.5" fill="rgba(0,255,240,0.15)"/>
      <rect x="28" y="20" width="44" height="48" rx="2" stroke="#00FFF0" stroke-width="2.5" fill="rgba(0,255,240,0.15)"/>
      <rect x="30" y="44" width="40" height="6" fill="rgba(255,0,110,0.55)"/>
      <line x1="30" y1="44" x2="70" y2="44" stroke="#FF006E" stroke-width="1.5"/>
      <line x1="30" y1="50" x2="70" y2="50" stroke="#FF006E" stroke-width="1.5"/>
    </g>`,
  },
  {
    key: 'beanie', name: 'ШАПКА', price: 100, slot: 'head', style: 'casual',
    description: 'вязаная шапка',
    svg: `<g stroke="#FF006E" stroke-width="2.5" fill="rgba(255,0,110,0.15)" stroke-linejoin="round" filter="drop-shadow(0 0 8px #FF006E)">
      <path d="M18 70 Q18 24 50 24 Q82 24 82 70 Z"/>
      <line x1="18" y1="60" x2="82" y2="60" stroke-width="1.5"/>
      <line x1="28" y1="48" x2="32" y2="52" stroke-width="1.2"/>
      <line x1="48" y1="44" x2="52" y2="48" stroke-width="1.2"/>
      <line x1="68" y1="48" x2="72" y2="52" stroke-width="1.2"/>
      <circle cx="50" cy="18" r="6" fill="rgba(255,255,255,0.4)" stroke="#FF006E" stroke-width="2"/>
    </g>`,
  },
  {
    key: 'horns', name: 'РОЖКИ', price: 300, slot: 'head', style: 'evil',
    description: 'демонические рога',
    svg: `<g stroke="#FF006E" stroke-width="2.5" fill="rgba(255,0,110,0.2)" stroke-linejoin="round" filter="drop-shadow(0 0 10px #FF006E)">
      <path d="M28 60 Q22 54 30 40 Q33 48 35 60 Z"/>
      <path d="M72 60 Q78 54 70 40 Q67 48 65 60 Z"/>
      <path d="M28 60 Q50 50 72 60" stroke-width="2" fill="none" opacity="0.85"/>
    </g>`,
  },
  {
    key: 'halo', name: 'НИМБ', price: 400, slot: 'head', style: 'royal',
    description: 'священный нимб',
    svg: `<g stroke="#FFD700" stroke-width="2.5" fill="none" filter="drop-shadow(0 0 14px #FFD700)">
      <ellipse cx="50" cy="42" rx="36" ry="10" fill="rgba(255,255,200,0.15)"/>
      <ellipse cx="50" cy="42" rx="30" ry="6" stroke-width="1.5" opacity="0.6"/>
    </g>`,
  },
  // ─── ЛИЦО ───────────────────────────────────────────────────────────────
  {
    key: 'sunglasses', name: 'ОЧКИ', price: 150, slot: 'face', style: 'cool',
    description: 'крутые очки',
    svg: `<g stroke="#00FFF0" stroke-width="2.5" fill="rgba(0,255,240,0.18)" stroke-linejoin="round" filter="drop-shadow(0 0 8px #00FFF0)">
      <rect x="14" y="40" width="32" height="22" rx="4"/>
      <rect x="54" y="40" width="32" height="22" rx="4"/>
      <line x1="46" y1="51" x2="54" y2="51" stroke-width="2.5"/>
      <line x1="14" y1="40" x2="6" y2="34" stroke-width="2"/>
      <line x1="86" y1="40" x2="94" y2="34" stroke-width="2"/>
    </g>`,
  },
  {
    key: 'heart_glasses', name: 'ОЧКИ-СЕРДЕЧКИ', price: 250, slot: 'face', style: 'cute',
    description: 'розовые очки-сердечки',
    svg: `<g stroke="#FF66CC" stroke-width="2.5" fill="rgba(255,102,204,0.18)" stroke-linejoin="round" filter="drop-shadow(0 0 8px #FF66CC)">
      <path d="M30 66 C18 56 14 48 18 42 C22 36 28 38 30 44 C32 38 38 36 42 42 C46 48 42 56 30 66 Z"/>
      <path d="M70 66 C58 56 54 48 58 42 C62 36 68 38 70 44 C72 38 78 36 82 42 C86 48 82 56 70 66 Z"/>
      <line x1="44" y1="50" x2="56" y2="50" stroke-width="2.5"/>
    </g>`,
  },
  // ─── ШЕЯ ────────────────────────────────────────────────────────────────
  {
    key: 'bowtie', name: 'ГАЛСТУК-БАБОЧКА', price: 120, slot: 'neck', style: 'cool',
    description: 'элегантный галстук',
    svg: `<g stroke="#FF006E" stroke-width="2.5" fill="rgba(255,0,110,0.22)" stroke-linejoin="round" filter="drop-shadow(0 0 8px #FF006E)">
      <path d="M50 50 L20 36 L20 64 Z"/>
      <path d="M50 50 L80 36 L80 64 Z"/>
    </g>`,
  },
  {
    key: 'chain', name: 'ЦЕПОЧКА', price: 180, slot: 'neck', style: 'cool',
    description: 'золотая цепь',
    svg: `<g stroke="#FFD700" stroke-width="2.5" fill="none" filter="drop-shadow(0 0 8px #FFD700)">
      <path d="M16 38 Q50 78 84 38" stroke-width="2.5"/>
      <circle cx="50" cy="68" r="6" fill="rgba(255,215,0,0.3)"/>
      <circle cx="50" cy="68" r="2" fill="#FFD700"/>
      <line x1="30" y1="50" x2="32" y2="54" stroke-width="1.5"/>
      <line x1="40" y1="60" x2="42" y2="64" stroke-width="1.5"/>
      <line x1="58" y1="64" x2="60" y2="60" stroke-width="1.5"/>
      <line x1="68" y1="54" x2="70" y2="50" stroke-width="1.5"/>
    </g>`,
  },
  {
    key: 'scarf', name: 'ШАРФ', price: 90, slot: 'neck', style: 'casual',
    description: 'тёплый шарф',
    svg: `<g stroke="#00FFF0" stroke-width="2.5" fill="rgba(0,255,240,0.18)" stroke-linejoin="round" filter="drop-shadow(0 0 8px #00FFF0)">
      <path d="M22 50 Q50 30 78 50 Q70 56 50 56 Q30 56 22 50 Z"/>
      <path d="M30 54 Q26 70 36 84 L46 80 Q42 66 44 54 Z"/>
      <line x1="36" y1="84" x2="36" y2="88" stroke-width="1.5"/>
      <line x1="40" y1="83" x2="40" y2="88" stroke-width="1.5"/>
      <line x1="44" y1="82" x2="45" y2="88" stroke-width="1.5"/>
    </g>`,
  },
  // ─── ЛАПКА ──────────────────────────────────────────────────────────────
  {
    key: 'bracelet', name: 'БРАСЛЕТИК', price: 70, slot: 'paw', style: 'cute',
    description: 'милый браслетик',
    svg: `<g stroke="#FF66CC" stroke-width="2" fill="none" stroke-linecap="round" filter="drop-shadow(0 0 6px #FF66CC)">
      <ellipse cx="50" cy="50" rx="22" ry="4"/>
      <circle cx="50" cy="54" r="2.5" fill="#FF66CC"/>
    </g>`,
  },
]

export function findClothing(key: string): ClothingItem | undefined {
  return CLOTHING.find(x => x.key === key)
}

// ─── РЕАКЦИИ ПИТОМЦА ────────────────────────────────────────────────────────
const REACTIONS_KOD: Record<ClothingStyle, { mood: string; messages: string[] }> = {
  cute:    { mood: 'happy',   messages: ['Вау! Это мне? Спасибо!!', 'ох~ ты самый лучший!', 'я такой милашка!', 'спасибо-спасибо!'] },
  cool:    { mood: 'happy',   messages: ['О! Я теперь модный', 'выглядит круто!', 'хм-м, мне идёт?', 'спасибо, я в восторге'] },
  evil:    { mood: 'annoyed', messages: ['эээ... зачем мне это?', 'ну окей...', 'это страшно...', 'я не такой...'] },
  royal:   { mood: 'happy',   messages: ['Я королевский!', 'благодарю, мой человек', 'теперь я важный', 'воистину великолепно'] },
  casual:  { mood: 'happy',   messages: ['удобно!', 'тепло и приятно', 'спасибо!', 'мне нравится'] },
}

const REACTIONS_VIRUS: Record<ClothingStyle, { mood: string; messages: string[] }> = {
  cute:    { mood: 'annoyed', messages: ['Оу... спасибо', 'Чего-чего? Слишком слащаво!', 'фу, как мило', 'я не милашка!', 'убери эту дрянь'] },
  cool:    { mood: 'happy',   messages: ['о, наконец-то стильно', 'неплохо, неплохо', 'я выгляжу опасно', 'мрак'] },
  evil:    { mood: 'happy',   messages: ['ДА! ЭТО ПО МНЕ!', 'наконец-то меня понимают', 'я ужасен', 'ХА-ХА-ХА!'] },
  royal:   { mood: 'annoyed', messages: ['слишком пафосно', 'не моё', 'я не король', 'это смешно'] },
  casual:  { mood: 'idle',    messages: ['сойдёт', 'окей, ношу', 'не самое худшее', 'нормально'] },
}

// Индивидуальные реакции на конкретные предметы (переопределяют style-based)
const REACTION_OVERRIDES: Record<string, { kod?: { mood: string; messages: string[] }; virus?: { mood: string; messages: string[] } }> = {
  crown_gold: {
    virus: { mood: 'happy', messages: ['Кланийся, смертный! LOL', 'теперь все на колени', 'Я ПРАВИТЕЛЬ ХАОСА', 'хах, признай моё величие'] },
  },
}

export function pickReactionMessage(item: ClothingItem, isVirus: boolean): { text: string; mood: string } {
  const ov = REACTION_OVERRIDES[item.key]
  const ovReaction = ov && (isVirus ? ov.virus : ov.kod)
  if (ovReaction) {
    return { text: ovReaction.messages[Math.floor(Math.random() * ovReaction.messages.length)], mood: ovReaction.mood }
  }
  const table = isVirus ? REACTIONS_VIRUS : REACTIONS_KOD
  const r = table[item.style]
  return { text: r.messages[Math.floor(Math.random() * r.messages.length)], mood: r.mood }
}
