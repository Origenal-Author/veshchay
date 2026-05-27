'use client'

import { useState, useEffect, useRef } from 'react'
import PetCanvas from '@/app/components/PetCanvas'
import { checkAchievements } from '@/app/components/AchievementToast'
import { getMaxPets } from '@/lib/xp'
import {
  getPetDef, RARITY_COLOR, RARITY_GLOW,
  getStageProgress, getNextStage, STAGE_XP,
  type Pet,
} from '@/lib/pets'

// ── ЗВУК ──────────────────────────────────────────────────────────────────────
function playSound(type: 'happy' | 'annoyed' | 'eat' | 'squash') {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    const ctx = new AudioCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    const t = ctx.currentTime
    switch (type) {
      case 'happy':
        osc.type = 'sine'
        osc.frequency.setValueAtTime(440, t)
        osc.frequency.exponentialRampToValueAtTime(880, t + 0.13)
        gain.gain.setValueAtTime(0.18, t)
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22)
        osc.start(t); osc.stop(t + 0.22)
        break
      case 'annoyed':
        osc.type = 'sawtooth'
        osc.frequency.setValueAtTime(300, t)
        osc.frequency.exponentialRampToValueAtTime(75, t + 0.28)
        gain.gain.setValueAtTime(0.14, t)
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.32)
        osc.start(t); osc.stop(t + 0.32)
        break
      case 'eat': {
        osc.type = 'sine'
        osc.frequency.setValueAtTime(600, t)
        osc.frequency.setValueAtTime(900, t + 0.06)
        osc.frequency.setValueAtTime(500, t + 0.12)
        gain.gain.setValueAtTime(0.1, t)
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22)
        osc.start(t); osc.stop(t + 0.22)
        break
      }
      case 'squash':
        osc.type = 'square'
        osc.frequency.setValueAtTime(200, t)
        osc.frequency.exponentialRampToValueAtTime(45, t + 0.14)
        gain.gain.setValueAtTime(0.3, t)
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2)
        osc.start(t); osc.stop(t + 0.2)
        break
    }
  } catch { /* AudioContext недоступен */ }
}

// ── SVG ТАРАКАН ───────────────────────────────────────────────────────────────
function CockroachSVG({ walk }: { walk: boolean }) {
  return (
    <svg width="40" height="50" viewBox="-6 -6 44 56" fill="none" style={{
      filter: 'drop-shadow(0 0 5px rgba(200,0,0,0.8))',
      animation: walk ? 'cockroachWalk 0.35s linear infinite' : 'none',
    }}>
      {/* Усы */}
      <line x1="13" y1="3" x2="0" y2="-5" stroke="#8B0000" strokeWidth="1" strokeLinecap="round"/>
      <line x1="19" y1="3" x2="32" y2="-5" stroke="#8B0000" strokeWidth="1" strokeLinecap="round"/>
      <circle cx="0" cy="-5" r="1.2" fill="#FF2200"/>
      <circle cx="32" cy="-5" r="1.2" fill="#FF2200"/>
      {/* Голова */}
      <ellipse cx="16" cy="6" rx="6" ry="5" fill="#5A0000"/>
      {/* Глаза */}
      <circle cx="12.5" cy="5" r="2" fill="#FF0000"/>
      <circle cx="19.5" cy="5" r="2" fill="#FF0000"/>
      <circle cx="13" cy="4.5" r="0.7" fill="#FF8888"/>
      <circle cx="20" cy="4.5" r="0.7" fill="#FF8888"/>
      {/* Тело */}
      <ellipse cx="16" cy="22" rx="8" ry="14" fill="#3A0000"/>
      {/* Блик на теле */}
      <ellipse cx="13" cy="17" rx="3.5" ry="6" fill="#5A0000" opacity="0.35"/>
      {/* Сегменты */}
      <ellipse cx="16" cy="15" rx="7.5" ry="2.5" fill="#480000" opacity="0.7"/>
      <ellipse cx="16" cy="21" rx="7.5" ry="2.5" fill="#480000" opacity="0.7"/>
      <ellipse cx="16" cy="27" rx="6.5" ry="2" fill="#480000" opacity="0.7"/>
      {/* Левые лапки */}
      <path d="M8 15 Q3 12 0 10" stroke="#7A0000" strokeWidth="1.3" strokeLinecap="round"/>
      <path d="M8 21 Q2 20 0 19" stroke="#7A0000" strokeWidth="1.3" strokeLinecap="round"/>
      <path d="M8 27 Q3 29 1 32" stroke="#7A0000" strokeWidth="1.3" strokeLinecap="round"/>
      {/* Правые лапки */}
      <path d="M24 15 Q29 12 32 10" stroke="#7A0000" strokeWidth="1.3" strokeLinecap="round"/>
      <path d="M24 21 Q30 20 32 19" stroke="#7A0000" strokeWidth="1.3" strokeLinecap="round"/>
      <path d="M24 27 Q29 29 31 32" stroke="#7A0000" strokeWidth="1.3" strokeLinecap="round"/>
      {/* Хвостовые усики */}
      <path d="M13 35 Q11 40 9 44" stroke="#6A0000" strokeWidth="0.9" strokeLinecap="round"/>
      <path d="M19 35 Q21 40 23 44" stroke="#6A0000" strokeWidth="0.9" strokeLinecap="round"/>
    </svg>
  )
}

// ── ЖУК ───────────────────────────────────────────────────────────────────────
function BugRunner({ onSquash }: { onSquash: () => void }) {
  const [pos, setPos] = useState({ x: 120, y: 120 })
  const [dead, setDead] = useState(false)
  const [angle, setAngle] = useState(0)
  const [walk, setWalk] = useState(false)

  useEffect(() => {
    setPos({
      x: 80 + Math.random() * (window.innerWidth - 160),
      y: 80 + Math.random() * (window.innerHeight - 160),
    })
    const iv = setInterval(() => {
      setPos(p => ({
        x: Math.max(30, Math.min(window.innerWidth - 60, p.x + (Math.random() - 0.5) * 140)),
        y: Math.max(30, Math.min(window.innerHeight - 60, p.y + (Math.random() - 0.5) * 140)),
      }))
      setAngle(a => a + (Math.random() - 0.5) * 80)
      setWalk(true)
      setTimeout(() => setWalk(false), 300)
    }, 370)
    return () => clearInterval(iv)
  }, [])

  function squash() {
    if (dead) return
    playSound('squash')
    setDead(true)
    fetch('/api/xp/award', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'squash_bug' }),
    }).then(() => checkAchievements()).catch(() => {})
    setTimeout(onSquash, 600)
  }

  return (
    <div
      onClick={squash}
      title="Раздави таракана!"
      style={{
        position: 'fixed', left: pos.x, top: pos.y, zIndex: 9999,
        cursor: dead ? 'default' : 'pointer',
        transition: 'left 0.35s ease, top 0.35s ease',
        transform: `rotate(${angle}deg) scale(${dead ? 0.1 : 1})`,
        opacity: dead ? 0 : 1, userSelect: 'none',
        pointerEvents: dead ? 'none' : 'auto',
        fontSize: dead ? 32 : 'inherit',
      }}
    >
      {dead ? <span style={{ fontSize: 32 }}>💥</span> : <CockroachSVG walk={walk} />}
    </div>
  )
}

// ── ПЛАВАЮЩИЕ СИМВОЛЫ ─────────────────────────────────────────────────────────
function FloatingSymbols({ isVirus, C }: { isVirus: boolean; C: string }) {
  const symbols = isVirus
    ? ['ERR', '!!', 'X0X', '///', '404', 'BUG', '$$$', '???']
    : ['010', '{}', '</>', '||', 'fn()', '=>', '42', '::']
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 1 }}>
      {symbols.map((s, i) => (
        <div key={i} style={{
          position: 'absolute',
          left: `${(i * 137) % 90 + 2}%`, top: `${(i * 97 + 20) % 80}%`,
          fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: C,
          opacity: 0.08 + (i % 3) * 0.04, letterSpacing: 1,
          animation: `floatSym ${4 + i * 0.7}s ease-in-out infinite`,
          animationDelay: `${i * 0.4}s`,
        }}>{s}</div>
      ))}
    </div>
  )
}

// ── ИНФО ПИТОМЦА ──────────────────────────────────────────────────────────────
function PetInfo({ pet }: { pet: Pet }) {
  const def = getPetDef(pet.type)
  const isVirus = pet.variant === 'virus'
  const C = isVirus ? def.colorVirus : def.color
  const rColor = RARITY_COLOR[def.rarity]
  const rGlow = RARITY_GLOW[def.rarity]
  const progress = getStageProgress(pet.stage, pet.stage_xp)
  const nextStage = getNextStage(pet.stage)
  const stageLabel: Record<string, string> = { egg: 'ЯЙЦО', baby: 'ДЕТЁНЫШ', adult: 'ВЗРОСЛЫЙ' }

  return (
    <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontFamily: 'Orbitron,monospace', fontSize: 18, letterSpacing: 4, color: C, textShadow: `0 0 12px ${C}` }}>
          {def.nameRu}
        </div>
        <span style={{
          fontFamily: 'Orbitron,monospace', fontSize: 9, letterSpacing: 3,
          color: rColor, border: `1px solid ${rColor}`,
          background: `rgba(${hexToRgb(rColor)},0.1)`,
          padding: '3px 10px', borderRadius: 4, boxShadow: `0 0 8px ${rGlow}`,
        }}>★ {def.rarityLabel}</span>
      </div>

      <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: '#506080', letterSpacing: 2 }}>
        {isVirus ? '// ВИРУС — проказник //' : '// КОД — безобидный //'}
      </div>

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: '#506080', letterSpacing: 1 }}>
            СТАДИЯ: <span style={{ color: C }}>{stageLabel[pet.stage]}</span>
          </span>
          {nextStage && (
            <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 9, color: '#3A4A5A', letterSpacing: 1 }}>
              → {stageLabel[nextStage]} при {STAGE_XP[nextStage]} XP питомца
            </span>
          )}
        </div>
        <div style={{ width: '100%', height: 4, background: 'rgba(255,255,255,0.05)', borderRadius: 2 }}>
          <div style={{ width: `${progress}%`, height: '100%', borderRadius: 2, background: C, boxShadow: `0 0 6px ${C}`, transition: 'width 0.5s ease' }} />
        </div>
        <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 9, color: '#3A4A5A', letterSpacing: 1, marginTop: 4, textAlign: 'right' }}>
          {pet.stage_xp} XP питомца
        </div>
      </div>

      <div style={{ padding: '12px 16px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(6,6,18,0.5)' }}>
        <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 9, color: '#3A4A5A', letterSpacing: 3, marginBottom: 6 }}>СПОСОБНОСТЬ</div>
        <div style={{ fontFamily: 'Exo 2,sans-serif', fontSize: 13, color: '#C0C8D0', lineHeight: 1.6 }}>
          {isVirus ? def.abilityVirus : def.abilityKod}
        </div>
      </div>
    </div>
  )
}

// КОД-паника при свёртке
const KOD_PANIC = ['мне тесно...', 'страшно 😱', 'ТЕМНО!!!', 'ВЫПУСТИ МЕНЯ!', 'помогите...', 'открой пожалуйста', 'я тут один...', 'АААА!!!']

// ── СРЕДА ОБИТАНИЯ ─────────────────────────────────────────────────────────────
// Слова-сородичи по типу питомца
const KIN_WORDS: Record<string, string[]> = {
  jellyfish: ['медуз', 'jellyfish', 'medusa', 'сородич', 'брат', 'сестр', 'родственн'],
  hologram:  ['голограмм', 'hologram'],
  ghost:     ['призрак', 'ghost'],
  signal:    ['сигнал', 'signal'],
  radar:     ['радар', 'radar'],
  neuron:    ['нейрон', 'neuron'],
  plasma:    ['плазм', 'plasma'],
  crystal:   ['кристалл', 'crystal'],
}
const BAD_FOOD = ['яд', 'poison', 'мусор', 'null', 'error', 'delete', 'удали', 'токсин']

// Лица питомцев — kaomoji в зависимости от настроения
function moodFace(mood: string, isVirus: boolean): string {
  if (mood === 'sleeping') return isVirus ? '(￣ρ￣)..zZ' : '(＿ ＿*)Zzz'
  if (mood === 'happy')    return isVirus ? '◕‿◕'      : '─‿‿─'
  if (mood === 'annoyed')  return isVirus ? '눈_눈'     : '￣ヘ￣'
  if (mood === 'eating')   return isVirus ? '◔ᴥ◔'      : '￣﹃￣'
  if (mood === 'hungry')   return isVirus ? 'ಠ╭╮ಠ'    : '￣﹃￣'
  return isVirus ? '·_·' : '°▽°'  // idle
}

function PetHabitat({ pet, onUpdate }: { pet: Pet; onUpdate: (p: Pet) => void }) {
  const [walking, setWalking] = useState(false)
  const [sessionFeeds, setSessionFeeds] = useState(0)
  const [virusKinCount, setVirusKinCount] = useState(0)
  const MAX_FEEDS = 5

  useEffect(() => {
    // Проверяем при маунте — вдруг этот питомец уже гуляет
    const current = (window as unknown as Record<string, unknown>).__walkingPetId
    if (current === pet.id) setWalking(true)

    const onStart = (e: Event) => {
      const id = (e as CustomEvent<{ pet: Pet }>).detail?.pet?.id
      // walking=true ТОЛЬКО если это наш питомец
      if (id === pet.id) setWalking(true)
    }
    const onStop = () => setWalking(false)
    window.addEventListener('pet-walk-start', onStart)
    window.addEventListener('pet-walk-stop', onStop)
    return () => {
      window.removeEventListener('pet-walk-start', onStart)
      window.removeEventListener('pet-walk-stop', onStop)
    }
  }, [pet.id])
  const [collapsed, setCollapsed] = useState(false)
  const [collapseCount, setCollapseCount] = useState(0)
  const [kodMsg, setKodMsg] = useState<string | null>(null)
  const [showAds, setShowAds] = useState(false)
  const [shaking, setShaking] = useState(false)
  const collapseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const kodTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const def = getPetDef(pet.type)
  const isVirus = pet.variant === 'virus'
  const C = isVirus ? def.colorVirus : def.color

  type Mood = 'idle' | 'happy' | 'annoyed' | 'eating' | 'hungry' | 'sleeping'
  const [mood, setMood] = useState<Mood>('idle')
  const [particles, setParticles] = useState<{ id: number; x: number; y: number; text: string }[]>([])
  const [feedMode, setFeedMode] = useState(false)
  const [feedInput, setFeedInput] = useState('')
  const [talkMode, setTalkMode] = useState(false)
  const [talkInput, setTalkInput] = useState('')
  const [wakeClicks, setWakeClicks] = useState(0)
  const lastActivityRef = useRef(Date.now())
  const SLEEP_AFTER_MS = 90_000  // 90 секунд без активности → засыпает
  const [poop, setPoop] = useState(false)
  const [poopPos, setPoopPos] = useState({ right: '22%', bottom: 14 })
  const [bugs, setBugs] = useState<number[]>([])
  const bugIdRef = useRef(0)
  const MAX_BUGS = 5
  const [petOffset, setPetOffset] = useState({ x: 0, y: 0 })
  const [shooPos, setShooPos] = useState<{ x: number; y: number } | null>(null)

  const pidRef = useRef(0)
  const poopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const virusPetCountRef = useRef(0)
  const habitatRef = useRef<HTMLDivElement>(null)

  function handleCollapse() {
    if (collapsed) return
    setCollapsed(true)
    if (!isVirus) {
      // КОД: паникует
      let idx = 0
      kodTimerRef.current = setInterval(() => {
        setKodMsg(KOD_PANIC[idx % KOD_PANIC.length])
        idx++
      }, 1800)
    } else {
      // ВИРУС: сам открывает через 2.5с
      collapseTimerRef.current = setTimeout(() => {
        setCollapsed(false)
        setShaking(true)
        setTimeout(() => setShaking(false), 700)
        const next = collapseCount + 1
        setCollapseCount(next)
        if (next >= 3) setShowAds(true)
      }, 2500)
    }
  }

  function handleOpen() {
    setCollapsed(false)
    if (kodTimerRef.current) clearInterval(kodTimerRef.current)
    setKodMsg(null)
  }

  function addParticle(text: string, dx = 0) {
    const id = pidRef.current++
    setParticles(p => [...p, { id, x: dx + (Math.random() - 0.5) * 60, y: 20, text }])
    setTimeout(() => setParticles(p => p.filter(q => q.id !== id)), 1400)
  }

  async function callInteract(action: 'feed' | 'pet') {
    const res = await fetch('/api/pets/interact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ petId: pet.id, action }),
    })
    const data = await res.json()
    if (data.pet) onUpdate(data.pet)
    if (data.evolved) setTimeout(() => addParticle('✦ ЭВОЛЮЦИЯ! ✦'), 100)
    checkAchievements()
  }

  function submitFeed(e: React.FormEvent) {
    e.preventDefault()
    bumpActivity()
    const raw = feedInput.trim()
    if (!raw) return
    const tag = raw.startsWith('#') ? raw : '#' + raw
    const lower = raw.toLowerCase()
    setFeedMode(false)
    setFeedInput('')

    // ── Объелся ──────────────────────────────────────────────────────────────
    if (sessionFeeds >= MAX_FEEDS) {
      if (!isVirus) {
        setMood('annoyed')
        addParticle('ОБЪЕЛСЯ... не могу больше 🤢')
        playSound('annoyed')
        setTimeout(() => setMood('idle'), 2000)
      } else {
        setMood('happy')
        addParticle('ОБОЖРАЛСЯ 🤢 ....доволен')
        playSound('annoyed')
        setTimeout(() => { playSound('happy'); setMood('idle') }, 1200)
      }
      return
    }

    // ── Сородич ──────────────────────────────────────────────────────────────
    const kinWords = KIN_WORDS[pet.type] ?? []
    const isKin = kinWords.some(w => lower.includes(w))
    if (isKin) {
      if (!isVirus) {
        // КОД плачет и кричит капсом
        setMood('annoyed')
        playSound('annoyed')
        const cries = [
          'НЕТ!!! ЭТО МОЙ СОРОДИЧ!!!',
          'НЕ БУДУ ЕСТЬ СВОЕГО БРАТА!!',
          'МОНСТР!!! ОНА МНЕ КАК СЕСТРА!!',
          'Я СКОРЕЕ УМРУ ЧЕМ ЭТО СЪЕМ!!!',
        ]
        addParticle(cries[Math.floor(Math.random() * cries.length)])
        setTimeout(() => addParticle('😭😭😭'), 600)
        setTimeout(() => setMood('idle'), 2500)
        return
      } else {
        // ВИРУС требует ещё
        const newCount = virusKinCount + 1
        setVirusKinCount(newCount)
        setMood('happy')
        if (newCount >= 3) {
          addParticle('НАСЫТИЛСЯ... 😈')
          playSound('happy')
          setTimeout(() => { playSound('eat'); setMood('idle') }, 800)
          setVirusKinCount(0)
        } else {
          addParticle(`ЕЩЁ!!! НЕМЕДЛЕННО!!! (${newCount}/3)`)
          playSound('eat')
          setTimeout(() => setMood('idle'), 1000)
        }
        setSessionFeeds(n => n + 1)
        callInteract('feed')
        return
      }
    }

    // ── Плохая еда ────────────────────────────────────────────────────────────
    const isBad = BAD_FOOD.some(w => lower.includes(w))
    if (isBad) {
      setMood('annoyed')
      playSound('annoyed')
      if (!isVirus) {
        addParticle('ФУ!!! Я ЭТО НЕ ЕМ!!!')
      } else {
        addParticle('ВКУСНО 😈 ЕЩЁ ДАВАЙ')
        setSessionFeeds(n => n + 1)
        callInteract('feed')
        setTimeout(() => setMood('idle'), 1200)
        return
      }
      setTimeout(() => setMood('idle'), 1500)
      return
    }

    // ── Обычная еда ──────────────────────────────────────────────────────────
    setMood('eating')
    playSound('eat')
    addParticle(`ПОГЛОЩАЮ: ${tag}`)
    setTimeout(() => setMood('idle'), 1300)
    setSessionFeeds(n => n + 1)
    callInteract('feed')
  }

  function handlePet() {
    bumpActivity()
    if (isVirus) {
      setMood('annoyed')
      playSound('annoyed')
      const msgs = ['ОТСТАНЬ!', 'ГРР!!!', '❌ НЕТ', 'УЙДИ!!']
      addParticle(msgs[Math.floor(Math.random() * msgs.length)])

      virusPetCountRef.current += 1
      if (virusPetCountRef.current >= 5 && !poop) {
        virusPetCountRef.current = 0
        setTimeout(() => {
          // Случайная позиция какашки
          const randomRight = `${10 + Math.random() * 55}%`
          const randomBottom = 10 + Math.random() * 20
          setPoopPos({ right: randomRight, bottom: randomBottom })
          setPoop(true)
          addParticle('💩', 60)
          poopTimerRef.current = setTimeout(() => {
            setPoop(false)
            if (bugs.length < MAX_BUGS) {
              setBugs(b => [...b, bugIdRef.current++])
            }
          }, 3000)
        }, 800)
      }
      setTimeout(() => setMood('idle'), 1600)
    } else {
      setMood('happy')
      playSound('happy')
      const msgs = ['♥', '~ ~', ':3', 'хи-хи!', '≧◡≦']
      addParticle(msgs[Math.floor(Math.random() * msgs.length)])
      setTimeout(() => setMood('idle'), 1000)
    }
    callInteract('pet')
  }

  function cleanPoop() {
    if (poopTimerRef.current) clearTimeout(poopTimerRef.current)
    setPoop(false)
    addParticle('убрано ✓', -60)
  }

  // ── Разговор: мяу/гав и общие реакции ────────────────────────────────────────
  function handleTalk(e: React.FormEvent) {
    e.preventDefault()
    const raw = talkInput.trim().toLowerCase()
    if (!raw) return
    setTalkInput('')
    setTalkMode(false)
    bumpActivity()

    // Мяу / гав
    const isMew = /^м[яиа][ауво]+|^мя|^meow|^mew/.test(raw)
    const isWoof = /^[гr]а[вы]|^гав|^woof|^bark|^аф+/.test(raw)
    if (isMew) {
      if (!isVirus) { setMood('happy'); addParticle('Мияу ˵◕ω◕˵', -20); addParticle('ня~ ня~', 30) }
      else          { setMood('annoyed'); addParticle('гав? ◕ｪ◕'); addParticle('я не кот!') }
      setTimeout(() => setMood('idle'), 1800)
      return
    }
    if (isWoof) {
      if (!isVirus) { setMood('annoyed'); addParticle('э... мяу? ˵-ω-˵'); addParticle('я не пёс...') }
      else          { setMood('happy'); addParticle('АВАФ! ◕ｪ◕', -20); addParticle('гр-гр-р!', 30) }
      setTimeout(() => setMood('idle'), 1800)
      return
    }
    // Общая реакция
    const kodMsgs = ['что-что?', 'хм... ─‿‿─', 'не понимаю...', '*склоняет голову*', 'расскажи ещё']
    const virusMsgs = ['отстань 눈_눈', 'и чо?', 'мне всё равно', 'скучно...', 'ты мне надоел']
    setMood(isVirus ? 'annoyed' : 'happy')
    addParticle((isVirus ? virusMsgs : kodMsgs)[Math.floor(Math.random() * 5)])
    setTimeout(() => setMood('idle'), 1500)
  }

  // ── Сон / пробуждение ────────────────────────────────────────────────────────
  function bumpActivity() {
    lastActivityRef.current = Date.now()
    if (mood === 'sleeping') {
      // Любая активность будит
      setMood('idle')
      setWakeClicks(0)
    }
  }

  function handlePetClick() {
    if (mood !== 'sleeping') return
    const next = wakeClicks + 1
    setWakeClicks(next)
    if (next >= 3) {
      setMood('idle')
      setWakeClicks(0)
      addParticle(isVirus ? 'А?! Чё надо?! 눈_눈' : 'Ах... привет ─‿‿─')
      lastActivityRef.current = Date.now()
    } else {
      addParticle(isVirus ? 'мх...' : 'zzz...', (next - 2) * 20)
    }
  }

  // Таймер: если давно не было активности → сон
  useEffect(() => {
    const iv = setInterval(() => {
      if (mood !== 'idle') return
      if (Date.now() - lastActivityRef.current >= SLEEP_AFTER_MS && pet.stage !== 'egg') {
        setMood('sleeping')
      }
    }, 5000)
    return () => clearInterval(iv)
  }, [mood, pet.stage])

  // Отталкивание питомца от курсора когда вирус в раздражении
  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!isVirus || mood !== 'annoyed') return
    const rect = habitatRef.current?.getBoundingClientRect()
    if (!rect) return
    const cx = rect.width / 2
    const cy = rect.height / 2 + 20
    const mx = e.clientX - rect.left
    const my = e.clientY - rect.top
    const dx = cx - mx
    const dy = cy - my
    const dist = Math.hypot(dx, dy)
    if (dist < 130) {
      const f = (130 - dist) / 130
      setPetOffset({ x: dx * f * 0.35, y: dy * f * 0.3 })
      setShooPos({ x: mx, y: my })
      setTimeout(() => { setPetOffset({ x: 0, y: 0 }); setShooPos(null) }, 380)
    }
  }

  const petTransform =
    mood === 'happy' ? `translate(${petOffset.x}px,${petOffset.y - 7}px) scale(1.12)` :
    mood === 'annoyed' ? `translate(${petOffset.x}px,${petOffset.y}px) scale(0.93) rotate(-4deg)` :
    mood === 'eating' ? 'translate(0,-3px) scale(1.07)' :
    `translate(${petOffset.x}px,${petOffset.y}px) scale(1)`

  const envBg = isVirus
    ? 'radial-gradient(ellipse at 50% 40%, rgba(255,0,110,0.08) 0%, rgba(60,0,20,0.3) 60%, rgba(6,6,18,0.95) 100%)'
    : 'radial-gradient(ellipse at 50% 40%, rgba(0,212,255,0.08) 0%, rgba(0,20,40,0.3) 60%, rgba(6,6,18,0.95) 100%)'
  const borderColor = isVirus ? 'rgba(255,0,110,0.3)' : 'rgba(0,212,255,0.3)'

  return (
    <div style={{ maxWidth: 560, margin: '0 auto' }}>
      {/* Окошко среды */}
      <div
        ref={habitatRef}
        onMouseMove={handleMouseMove}
        style={{
          position: 'relative', borderRadius: 20,
          border: `1px solid ${borderColor}`, background: envBg,
          overflow: 'hidden',
          boxShadow: `0 0 40px rgba(${isVirus ? '255,0,110' : '0,212,255'},0.12)`,
          animation: shaking ? 'shake 0.6s ease' : 'none',
        }}
      >
        {/* Заголовок */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px',
          borderBottom: `1px solid ${borderColor}`, background: 'rgba(6,6,18,0.6)',
        }}>
          <div style={{ display: 'flex', gap: 5 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#FF5F56', opacity: 0.7 }} />
            {/* Жёлтая точка — кнопка сворачивания */}
            <button
              onClick={collapsed ? handleOpen : handleCollapse}
              title={collapsed ? 'Развернуть' : 'Свернуть'}
              style={{
                width: 10, height: 10, borderRadius: '50%', background: '#FFBD2E',
                border: 'none', cursor: 'pointer', padding: 0, opacity: 0.85,
                transition: 'opacity 0.2s',
              }}
            />
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#27C93F', opacity: 0.7 }} />
          </div>
          <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: C, letterSpacing: 2, marginLeft: 8, flex: 1 }}>
            {collapsed
              ? (isVirus ? '// СВЁРНУТО //' : kodMsg ? `// ${kodMsg}` : '// СВЁРНУТО //')
              : (isVirus ? '// ЦИФРОВОЕ ГНЕЗДО :: ЗАРАЖЕНО //' : '// ЦИФРОВОЕ ГНЕЗДО //')}
          </div>
          {/* Стрелка expand для КОД */}
          {collapsed && !isVirus && (
            <button onClick={handleOpen} style={{ background: 'none', border: `1px solid ${C}`, color: C, borderRadius: 4, padding: '2px 8px', cursor: 'pointer', fontFamily: 'JetBrains Mono,monospace', fontSize: 9 }}>
              ОТКРЫТЬ
            </button>
          )}
        </div>

        {!collapsed && <>
        {/* Сетчатый фон */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
          backgroundImage: isVirus
            ? 'repeating-linear-gradient(0deg,transparent,transparent 18px,rgba(255,0,110,0.04) 18px,rgba(255,0,110,0.04) 19px),repeating-linear-gradient(90deg,transparent,transparent 18px,rgba(255,0,110,0.04) 18px,rgba(255,0,110,0.04) 19px)'
            : 'repeating-linear-gradient(0deg,transparent,transparent 20px,rgba(0,212,255,0.04) 20px,rgba(0,212,255,0.04) 21px),repeating-linear-gradient(90deg,transparent,transparent 20px,rgba(0,212,255,0.04) 20px,rgba(0,212,255,0.04) 21px)',
        }} />

        <FloatingSymbols isVirus={isVirus} C={C} />

        {/* Питомец */}
        <div style={{ position: 'relative', zIndex: 2, padding: '32px 0 16px', display: 'flex', justifyContent: 'center' }}>
          {/* Плавающие Z для спящего */}
          {mood === 'sleeping' && !walking && (
            <>
              {[0, 1, 2].map(i => (
                <div key={i} style={{
                  position: 'absolute', left: `calc(50% + ${30 + i * 14}px)`, top: 20 + i * -8,
                  fontFamily: 'VT323, monospace', fontSize: 28 - i * 4,
                  color: C, opacity: 0.7,
                  animation: `sleepZ 2.2s ease-in-out ${i * 0.4}s infinite`,
                  textShadow: `0 0 6px ${C}`,
                  pointerEvents: 'none', zIndex: 6,
                }}>z</div>
              ))}
            </>
          )}
          <div
            onClick={mood === 'sleeping' ? handlePetClick : undefined}
            style={{
              transition: 'transform 0.35s cubic-bezier(0.34,1.56,0.64,1), filter 0.5s ease',
              transform: petTransform,
              cursor: mood === 'sleeping' ? 'pointer' : 'default',
              filter: mood === 'sleeping' ? 'grayscale(1) brightness(0.55)' :
                      mood === 'happy' ? `drop-shadow(0 0 18px ${C})` :
                      mood === 'annoyed' ? 'drop-shadow(0 0 10px rgba(255,0,80,0.6))' : 'none',
            }}
          >
            {walking ? (
              <div style={{
                width: 180, height: 180,
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: 12,
              }}>
                <div style={{ fontSize: 36, opacity: 0.3 }}>🌐</div>
                <div style={{
                  fontFamily: 'JetBrains Mono,monospace', fontSize: 9,
                  color: C, letterSpacing: 3, opacity: 0.5, textAlign: 'center',
                }}>// ПАРАЗИТ ГУЛЯЕТ //</div>
              </div>
            ) : (
              <PetCanvas type={pet.type} variant={pet.variant} stage={pet.stage} size={180} />
            )}
          </div>

          {/* Лицо kaomoji — индикатор настроения */}
          {!walking && pet.stage !== 'egg' && (
            <div style={{
              position: 'absolute', top: 8, left: '50%', transform: 'translateX(-50%)',
              fontFamily: 'VT323, monospace', fontSize: 18,
              color: C, opacity: 0.85, letterSpacing: 1,
              textShadow: `0 0 6px ${C}`,
              pointerEvents: 'none', zIndex: 6, whiteSpace: 'nowrap',
              transition: 'opacity 0.4s',
            }}>
              {moodFace(mood, isVirus)}
            </div>
          )}

          {/* Частицы эмоций */}
          {particles.map(p => (
            <div key={p.id} style={{
              position: 'absolute', left: `calc(50% + ${p.x}px)`, top: p.y,
              fontFamily: 'JetBrains Mono,monospace', fontSize: 13, color: C, fontWeight: 700,
              animation: 'floatUp 1.4s ease forwards', pointerEvents: 'none',
              textShadow: `0 0 8px ${C}`, zIndex: 10, whiteSpace: 'nowrap',
              transform: 'translateX(-50%)',
            }}>{p.text}</div>
          ))}

          {/* Эффект отталкивания */}
          {shooPos && (
            <div style={{
              position: 'absolute', left: shooPos.x, top: shooPos.y,
              transform: 'translate(-50%,-50%)',
              fontSize: 18, color: '#FF006E', pointerEvents: 'none', zIndex: 10,
              animation: 'floatUp 0.45s ease forwards',
            }}>⚡</div>
          )}

          {/* Какашка */}
          {poop && (
            <div
              onClick={cleanPoop}
              title="Убери! Иначе вылезет жук..."
              style={{
                position: 'absolute', bottom: poopPos.bottom, right: poopPos.right,
                fontSize: 24, cursor: 'pointer', zIndex: 5,
                animation: 'popIn 0.3s cubic-bezier(0.34,1.56,0.64,1)',
                filter: 'drop-shadow(0 0 8px rgba(180,100,0,0.6))',
              }}
            >💩</div>
          )}
        </div>

        {/* Подсказка */}
        <div style={{ textAlign: 'center', padding: '0 0 14px', position: 'relative', zIndex: 2 }}>
          <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 9, color: 'rgba(255,255,255,0.18)', letterSpacing: 2 }}>
            {poop ? '⚠ убери какашку — через 3 сек вылезет жук' : '// нажми жёлтую точку чтобы свернуть //'}
          </div>
        </div>
        </>}
      </div>

      {/* Кнопки взаимодействия — скрыты когда свёрнуто */}
      <div style={{ marginTop: 12, display: collapsed ? 'none' : 'block' }}>
        {talkMode ? (
          <form onSubmit={handleTalk} style={{ display: 'flex', gap: 8 }}>
            <div style={{
              flex: 1, display: 'flex', alignItems: 'center', gap: 8,
              background: 'rgba(10,10,22,0.95)', border: `1px solid ${C}`,
              borderRadius: 8, padding: '8px 14px',
              boxShadow: `0 0 12px rgba(${isVirus ? '255,0,110' : '0,212,255'},0.15)`,
            }}>
              <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 13, color: C, opacity: 0.7 }}>&gt;</span>
              <input
                autoFocus value={talkInput}
                onChange={e => setTalkInput(e.target.value)}
                placeholder="скажи что-нибудь..."
                maxLength={60}
                style={{
                  flex: 1, background: 'transparent', border: 'none', outline: 'none',
                  fontFamily: 'JetBrains Mono,monospace', fontSize: 12, color: '#E0E8F0',
                }}
              />
            </div>
            <button type="submit" style={{ ...actionBtn, borderColor: C, color: C }}>СКАЗАТЬ</button>
            <button type="button" onClick={() => { setTalkMode(false); setTalkInput('') }} style={{ ...actionBtn, borderColor: '#3A4A5A', color: '#3A4A5A' }}>✕</button>
          </form>
        ) : feedMode ? (
          <form onSubmit={submitFeed} style={{ display: 'flex', gap: 8 }}>
            <div style={{
              flex: 1, display: 'flex', alignItems: 'center', gap: 8,
              background: 'rgba(10,10,22,0.95)', border: `1px solid ${C}`,
              borderRadius: 8, padding: '8px 14px',
              boxShadow: `0 0 12px rgba(${isVirus ? '255,0,110' : '0,212,255'},0.15)`,
            }}>
              <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 13, color: C, opacity: 0.7 }}>#</span>
              <input
                autoFocus
                value={feedInput}
                onChange={e => setFeedInput(e.target.value)}
                placeholder="введи тег для питомца..."
                maxLength={30}
                style={{
                  flex: 1, background: 'transparent', border: 'none', outline: 'none',
                  fontFamily: 'JetBrains Mono,monospace', fontSize: 12, color: '#E0E8F0',
                }}
              />
            </div>
            <button type="submit" style={{ ...actionBtn, borderColor: C, color: C }}>СКОРМИТЬ</button>
            <button type="button" onClick={() => { setFeedMode(false); setFeedInput('') }} style={{ ...actionBtn, borderColor: '#3A4A5A', color: '#3A4A5A' }}>✕</button>
          </form>
        ) : (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {/* Кормёжка — только для baby/adult */}
            {pet.stage !== 'egg' ? (
              <button onClick={() => setFeedMode(true)} style={{ ...actionBtn, flex: 1, borderColor: C, color: C }}>
                🍖 ПОКОРМИТЬ
              </button>
            ) : (
              <div style={{
                ...actionBtn, flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderColor: 'rgba(255,255,255,0.08)', color: '#3A4A5A', cursor: 'default', fontSize: 9,
              }}>
                🥚 ВЫЛУПИТСЯ — ПОКОРМИШЬ
              </div>
            )}
            <button
              onClick={handlePet}
              style={{
                ...actionBtn, flex: 1,
                borderColor: isVirus ? '#FF006E' : C,
                color: isVirus ? '#FF006E' : C,
              }}
            >
              {isVirus ? '⚡ ПОГЛАДИТЬ' : '♥ ПОГЛАДИТЬ'}
            </button>
            {/* Поговорить — только для baby/adult */}
            {pet.stage !== 'egg' && (
              <button
                onClick={() => setTalkMode(true)}
                style={{ ...actionBtn, flex: 1, borderColor: C, color: C }}
              >
                💬 СКАЗАТЬ
              </button>
            )}
            {/* Выгул — только для baby/adult */}
            {pet.stage !== 'egg' && (
              <button
                onClick={() => {
                  if (walking) {
                    (window as unknown as Record<string, unknown>).__walkingPetId = null
                    window.dispatchEvent(new CustomEvent('pet-walk-stop'))
                  } else {
                    (window as unknown as Record<string, unknown>).__walkingPetId = pet.id
                    window.dispatchEvent(new CustomEvent('pet-walk-start', { detail: { pet } }))
                  }
                }}
                style={{
                  ...actionBtn, flex: 1,
                  borderColor: walking ? '#FF006E' : '#00FF88',
                  color: walking ? '#FF006E' : '#00FF88',
                }}
              >
                {walking ? '↩ ВЕРНУТЬ' : '🌐 ВЫГУЛ'}
              </button>
            )}
          </div>
        )}
      </div>


      {/* Инфо питомца */}
      {!collapsed && <PetInfo pet={pet} />}

      {/* Фейковая реклама от злого вируса */}
      {showAds && <FakeAds onAllClosed={() => setShowAds(false)} />}

      {/* Жуки (fixed-position, на весь экран, до 5 штук) */}
      {bugs.map(id => (
        <BugRunner key={id} onSquash={() => setBugs(b => b.filter(x => x !== id))} />
      ))}
    </div>
  )
}

// ── ТАБЫ ПИТОМЦЕВ ─────────────────────────────────────────────────────────────
function PetTabs({ pets, active, onSelect }: { pets: Pet[]; active: number; onSelect: (i: number) => void }) {
  return (
    <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
      {pets.map((pet, i) => {
        const def = getPetDef(pet.type)
        const isVirus = pet.variant === 'virus'
        const C = isVirus ? def.colorVirus : def.color
        const stageLabel: Record<string, string> = { egg: 'ЯЙЦ', baby: 'ДЕТ', adult: 'ВЗР' }
        const isActive = i === active
        return (
          <button
            key={pet.id}
            onClick={() => onSelect(i)}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '8px 16px', borderRadius: 10, cursor: 'pointer',
              border: `1px solid ${isActive ? C : 'rgba(255,255,255,0.08)'}`,
              background: isActive ? `rgba(${hexToRgb(C)},0.08)` : 'rgba(13,13,26,0.7)',
              transition: 'all 0.2s',
              boxShadow: isActive ? `0 0 14px rgba(${hexToRgb(C)},0.25)` : 'none',
            }}
          >
            <PetCanvas type={pet.type} variant={pet.variant} stage={pet.stage} size={36} />
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontFamily: 'Orbitron,monospace', fontSize: 9, letterSpacing: 2, color: C }}>
                {def.nameRu}
              </div>
              <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 8, color: '#506080', letterSpacing: 1 }}>
                {stageLabel[pet.stage]} · {isVirus ? 'ВИР' : 'КОД'}
              </div>
            </div>
          </button>
        )
      })}
    </div>
  )
}

// ── SVG-КОНТЕЙНЕР (ШЕСТИУГОЛЬНИК) ────────────────────────────────────────────
function CrateIcon({ glowing }: { glowing?: boolean }) {
  const C = glowing ? '#00FFF0' : '#3A5060'
  const fill = glowing ? 'rgba(0,255,240,0.07)' : 'rgba(20,40,60,0.1)'
  const pts = Array.from({ length: 6 }, (_, i) => {
    const a = (i / 6) * Math.PI * 2 - Math.PI / 6
    return `${40 + 34 * Math.cos(a)},${40 + 34 * Math.sin(a)}`
  }).join(' ')
  const ptsInner = Array.from({ length: 6 }, (_, i) => {
    const a = (i / 6) * Math.PI * 2 - Math.PI / 6
    return `${40 + 22 * Math.cos(a)},${40 + 22 * Math.sin(a)}`
  }).join(' ')
  return (
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
      {/* Внешний шестиугольник */}
      <polygon points={pts} fill={fill} stroke={C} strokeWidth="1.5"/>
      {/* Внутренний шестиугольник (пунктир) */}
      <polygon points={ptsInner} fill="none" stroke={C} strokeWidth="0.8" strokeDasharray="3 3" opacity="0.5"/>
      {/* Диагональные линии от вершин к центру */}
      {Array.from({ length: 6 }, (_, i) => {
        const a = (i / 6) * Math.PI * 2 - Math.PI / 6
        const x = 40 + 34 * Math.cos(a)
        const y = 40 + 34 * Math.sin(a)
        return <line key={i} x1={x} y1={y} x2="40" y2="40" stroke={C} strokeWidth="0.5" opacity="0.15"/>
      })}
      {/* Угловые точки */}
      {Array.from({ length: 6 }, (_, i) => {
        const a = (i / 6) * Math.PI * 2 - Math.PI / 6
        return <circle key={i} cx={40 + 34 * Math.cos(a)} cy={40 + 34 * Math.sin(a)} r="2.5" fill={C} opacity="0.7"/>
      })}
      {/* Замок по центру */}
      <rect x="31" y="35" width="18" height="14" rx="2.5" fill={fill} stroke={C} strokeWidth="1.3"/>
      <path d="M34 35 C34 29 46 29 46 35" stroke={C} strokeWidth="1.3" fill="none"/>
      {/* ? */}
      <text x="40" y="45.5" textAnchor="middle" fill={C} fontSize="8" fontFamily="Orbitron,monospace" fontWeight="700">?</text>
      {/* Статус-индикатор сверху */}
      <circle cx="40" cy="7" r="3" fill={glowing ? C : 'none'} stroke={C} strokeWidth="1" opacity="0.8"/>
      {glowing && <circle cx="40" cy="7" r="5" fill="none" stroke={C} strokeWidth="0.5" opacity="0.4"/>}
    </svg>
  )
}

// ── ФЕЙКОВАЯ РЕКЛАМА ──────────────────────────────────────────────────────────
type FakeAd = { title: string; body: string; pos: React.CSSProperties }

const FAKE_AD_POOL: FakeAd[] = [
  { title: '🎉 ПОЗДРАВЛЯЕМ!', body: 'Вы стали 1 000 000-м посетителем!\nНажмите OK для получения СУПЕРПРИЗА', pos: { left: '15%', top: '18%' } },
  { title: '⚠ ОШИБКА СИСТЕМЫ', body: 'Обнаружено 47 вирусов-паразитов!\nНемедленно скачайте ANTIPET_PRO.exe', pos: { right: '12%', top: '25%' } },
  { title: '🔥 ТОЛЬКО СЕГОДНЯ', body: 'Скидка 999% на корм для питомца!\nПредложение истекает через 00:03', pos: { left: '30%', bottom: '20%' } },
  { title: '💸 ВЫИГРЫШ', body: 'Вам начислено 50 000 ВЕЩБАКСОВ!\nЗаберите свой приз сейчас!', pos: { right: '20%', bottom: '25%' } },
  { title: '🚨 ВНИМАНИЕ', body: 'Ваш аккаунт в опасности!\nСрочно введите пароль в это окно', pos: { left: '40%', top: '35%' } },
  { title: '🌐 СЕТЬ', body: 'Подключение к ВЕЩАЙ.PRO+\nза 9.99/мес. Жми сюда!', pos: { left: '8%', bottom: '15%' } },
  { title: '📡 СИГНАЛ', body: 'Найден новый сигнал в твоём районе!\nРасшифруй его за 1 клик', pos: { right: '8%', top: '40%' } },
  { title: '🎁 ПОДАРОК', body: 'Тебе прислали кристалл редкости!\nЗабрать сейчас? [Y/Y]', pos: { left: '20%', top: '50%' } },
  { title: '⚡ СРОЧНО!', body: 'Твой питомец требует внимания!\nКОРМИ ЕГО НЕМЕДЛЕННО', pos: { right: '15%', bottom: '12%' } },
  { title: '🎬 ВИДЕО', body: '12 раз кликни сюда\nи получи редкое яйцо!', pos: { left: '45%', bottom: '30%' } },
  { title: '👁 НАБЛЮДАТЕЛЬ', body: 'За тобой наблюдают 3 пользователя.\nУзнай кто — жми ОК', pos: { right: '35%', top: '18%' } },
  { title: '☠ ВЗЛОМ', body: 'Твой пароль слили в сеть!\nСрочно введи новый прямо тут', pos: { left: '12%', top: '40%' } },
  { title: '🐛 ПАРАЗИТ', body: 'В системе обнаружен жук-захватчик!\nЗапусти АНТИЖУК.exe', pos: { right: '10%', bottom: '40%' } },
  { title: '🎰 КАЗИНО', body: 'Крути цифровой барабан!\nПервая попытка бесплатно', pos: { left: '50%', top: '20%' } },
  { title: '📞 ВЫЗОВ', body: 'Тебе звонит АНТИВИРУС.\nОтветить? [ДА/ДА]', pos: { right: '25%', top: '50%' } },
]

function pickFakeAds(): FakeAd[] {
  return [...FAKE_AD_POOL].sort(() => Math.random() - 0.5).slice(0, 3)
}

function FakeAds({ onAllClosed }: { onAllClosed: () => void }) {
  const [ads] = useState<FakeAd[]>(() => pickFakeAds())
  const [closed, setClosed] = useState<boolean[]>(() => [false, false, false])

  useEffect(() => {
    if (closed.every(Boolean)) onAllClosed()
  }, [closed, onAllClosed])

  return (
    <>
      {ads.map((ad, i) => closed[i] ? null : (
        <div key={i} style={{
          position: 'fixed', zIndex: 99992, width: 260,
          ...ad.pos as React.CSSProperties,
          background: 'rgba(6,6,18,0.98)',
          border: '1px solid #FF006E',
          borderRadius: 8,
          boxShadow: '0 0 30px rgba(255,0,110,0.35), 0 0 60px rgba(255,0,110,0.1)',
          animation: 'popIn 0.4s cubic-bezier(0.34,1.56,0.64,1)',
          overflow: 'hidden',
        }}>
          <div style={{
            background: 'rgba(255,0,110,0.18)', padding: '7px 12px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            borderBottom: '1px solid rgba(255,0,110,0.3)',
          }}>
            <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 9, color: '#FF006E', letterSpacing: 1 }}>
              {ad.title}
            </span>
            <button
              onClick={() => setClosed(c => c.map((v, j) => j === i || v))}
              style={{
                background: 'rgba(255,0,110,0.2)', border: '1px solid #FF006E',
                color: '#FF006E', width: 18, height: 18, borderRadius: 3,
                cursor: 'pointer', fontSize: 10, lineHeight: 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >✕</button>
          </div>
          <div style={{ padding: '14px 14px', fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: '#E0E8F0', lineHeight: 1.8, whiteSpace: 'pre-line' }}>
            {ad.body}
          </div>
          <div style={{ padding: '0 14px 12px', display: 'flex', gap: 8 }}>
            <button
              onClick={() => setClosed(c => c.map((v, j) => j === i || v))}
              style={{
                flex: 1, padding: '6px', background: 'rgba(255,0,110,0.15)',
                border: '1px solid #FF006E', color: '#FF006E',
                fontFamily: 'Orbitron,monospace', fontSize: 8, letterSpacing: 2,
                cursor: 'pointer', borderRadius: 4,
              }}
            >ЗАКРЫТЬ</button>
          </div>
        </div>
      ))}
    </>
  )
}

// ── ГЛАВНЫЙ КОМПОНЕНТ ─────────────────────────────────────────────────────────
type Phase = 'locked' | 'choose' | 'opening' | 'revealed' | 'manage'
const BOX_LABELS = ['КОНТЕЙНЕР А', 'КОНТЕЙНЕР Б', 'КОНТЕЙНЕР В']

interface Props { userId: string; xp: number; initialPets: Pet[] }

export default function GameClient({ userId, xp, initialPets }: Props) {
  const [pets, setPets] = useState<Pet[]>(initialPets)
  const [activePet, setActivePet] = useState(0)
  const [phase, setPhase] = useState<Phase>(
    initialPets.length > 0 ? 'manage' : xp < 500 ? 'locked' : 'choose'
  )
  const [selected, setSelected] = useState<number | null>(null)
  const [newPet, setNewPet] = useState<Pet | null>(null)
  const [loading, setLoading] = useState(false)
  const [claimError, setClaimError] = useState('')

  function updatePet(updated: Pet) {
    setPets(prev => prev.map(p => p.id === updated.id ? updated : p))
  }

  async function handleBox(i: number) {
    if (phase !== 'choose' || loading) return
    setSelected(i)
    setPhase('opening')
    setLoading(true)
    setClaimError('')
    await new Promise(r => setTimeout(r, 1600))
    const res = await fetch('/api/pets/claim', { method: 'POST' })
    const data = await res.json()
    if (data.pet) {
      setNewPet(data.pet)
      setPhase('revealed')
      checkAchievements()
    } else {
      setClaimError(data.error || 'Ошибка')
      setPhase(pets.length > 0 ? 'manage' : xp < 500 ? 'locked' : 'choose')
    }
    setLoading(false)
  }

  function acceptPet() {
    if (!newPet) return
    setPets(prev => [...prev, newPet])
    setActivePet(pets.length)
    setNewPet(null)
    setPhase('manage')
  }

  // Может ли пользователь получить ещё питомца
  const lastPet = pets[pets.length - 1]
  const maxPets = getMaxPets(xp)
  const canGetMore = pets.length < maxPets && (pets.length === 0 || lastPet?.stage === 'adult') && xp >= 500

  // ── LOCKED ──
  if (phase === 'locked') return (
    <div style={pageStyle}>
      <div style={titleStyle}>ИНКУБАТОР</div>
      <div style={{ textAlign: 'center', marginTop: 80 }}>
        <div style={{ fontSize: 56, marginBottom: 24 }}>🔒</div>
        <div style={{ fontFamily: 'Orbitron,monospace', fontSize: 18, color: '#8892B0', letterSpacing: 4 }}>ДОСТУП ЗАКРЫТ</div>
        <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 12, color: '#506080', marginTop: 12, letterSpacing: 2 }}>
          Достигни ранга <span style={{ color: '#00FF88' }}>ВЗЛОМЩИК</span> (500 XP)
        </div>
        <div style={{ width: 240, height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 2, margin: '16px auto 0' }}>
          <div style={{ width: `${Math.min(100, (xp / 500) * 100)}%`, height: '100%', background: '#00FF88', borderRadius: 2, boxShadow: '0 0 8px #00FF88' }} />
        </div>
        <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 11, color: '#506080', marginTop: 8 }}>
          {xp} / 500 XP
        </div>
      </div>
    </div>
  )

  // ── CHOOSE ──
  if (phase === 'choose') return (
    <div style={pageStyle}>
      <div style={titleStyle}>ИНКУБАТОР</div>
      <div style={{ textAlign: 'center', marginBottom: 8 }}>
        <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 11, color: '#506080', letterSpacing: 2 }}>
          // выбери один контейнер — внутри твой паразит //
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 32, marginTop: 60, flexWrap: 'wrap' }}>
        {BOX_LABELS.map((label, i) => (
          <button key={i} onClick={() => handleBox(i)} style={boxStyle} className="game-box">
            <CrateIcon />
            <div style={{ fontFamily: 'Orbitron,monospace', fontSize: 10, letterSpacing: 3, color: '#8892B0', marginTop: 16 }}>
              {label}
            </div>
            <div style={boxGlowBar} />
          </button>
        ))}
      </div>
      {claimError && (
        <div style={{ textAlign: 'center', marginTop: 24, fontFamily: 'JetBrains Mono,monospace', fontSize: 11, color: '#FF006E' }}>
          {claimError}
        </div>
      )}
      <div style={{ textAlign: 'center', marginTop: 48, fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: '#3A4A5A', letterSpacing: 2 }}>
        Кристалл 1% · Особый 7% · Редкий 42% · Частый 50%
      </div>
    </div>
  )

  // ── OPENING ──
  if (phase === 'opening') return (
    <div style={pageStyle}>
      <div style={titleStyle}>ИНКУБАТОР</div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 32, marginTop: 60, flexWrap: 'wrap' }}>
        {BOX_LABELS.map((label, i) => (
          <div key={i} style={{
            ...boxStyle, cursor: 'default',
            opacity: i === selected ? 1 : 0.15,
            transform: i === selected ? 'scale(1.1)' : 'scale(0.88)',
            animation: i === selected ? 'boxShake 0.4s ease-in-out infinite' : 'none',
            transition: 'all 0.5s ease',
          }}>
            <CrateIcon glowing={i === selected} />
            <div style={{ fontFamily: 'Orbitron,monospace', fontSize: 10, letterSpacing: 3, color: i === selected ? 'var(--accent)' : '#8892B0', marginTop: 16 }}>
              {label}
            </div>
            <div style={boxGlowBar} />
          </div>
        ))}
      </div>
      <div style={{ textAlign: 'center', marginTop: 48, fontFamily: 'JetBrains Mono,monospace', fontSize: 12, color: '#506080', letterSpacing: 3, animation: 'pulse 1s ease-in-out infinite' }}>
        СКАНИРОВАНИЕ...
      </div>
    </div>
  )

  // ── REVEALED ──
  if (phase === 'revealed' && newPet) {
    const def = getPetDef(newPet.type)
    const isVirus = newPet.variant === 'virus'
    const C = isVirus ? def.colorVirus : def.color
    const rColor = RARITY_COLOR[def.rarity]
    const rGlow = RARITY_GLOW[def.rarity]
    return (
      <div style={pageStyle}>
        <div style={titleStyle}>ИНКУБАТОР</div>
        <div style={{ textAlign: 'center', animation: 'fadeInUp 0.6s ease' }}>
          <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 11, color: '#506080', letterSpacing: 3, marginBottom: 24 }}>
            // новый паразит получен //
          </div>
          <div style={{
            display: 'inline-block', padding: 40, borderRadius: 20,
            border: `1px solid ${rColor}`,
            background: `radial-gradient(ellipse at center, ${rGlow}, transparent 70%)`,
            boxShadow: `0 0 40px ${rGlow}, 0 0 80px ${rGlow}`,
            animation: 'revealPop 0.8s cubic-bezier(0.34,1.56,0.64,1)',
          }}>
            <PetCanvas type={newPet.type} variant={newPet.variant} stage="egg" size={160} />
          </div>
          <div style={{ marginTop: 20 }}>
            <span style={{
              fontFamily: 'Orbitron,monospace', fontSize: 11, letterSpacing: 4,
              color: rColor, border: `1px solid ${rColor}`,
              background: `rgba(${hexToRgb(rColor)},0.1)`,
              padding: '4px 16px', borderRadius: 4, boxShadow: `0 0 10px ${rGlow}`,
            }}>★ {def.rarityLabel}</span>
          </div>
          <div style={{ fontFamily: 'Orbitron,monospace', fontSize: 28, letterSpacing: 6, color: C, marginTop: 20, textShadow: `0 0 20px ${C}` }}>
            {def.nameRu}
          </div>
          <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 12, color: '#506080', letterSpacing: 2, marginTop: 6 }}>
            {isVirus ? '// ВИРУС //' : '// КОД //'}
          </div>
          <div style={{ marginTop: 24, padding: '16px 24px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(13,13,26,0.6)', maxWidth: 380, margin: '24px auto 0' }}>
            <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: '#3A4A5A', letterSpacing: 3, marginBottom: 8 }}>УНИКАЛЬНАЯ СПОСОБНОСТЬ</div>
            <div style={{ fontFamily: 'Exo 2,sans-serif', fontSize: 14, color: '#C0C8D0', lineHeight: 1.6 }}>
              {isVirus ? def.abilityVirus : def.abilityKod}
            </div>
          </div>
          <button onClick={acceptPet} style={{ ...btnStyle, marginTop: 32, borderColor: C, color: C, boxShadow: `0 0 12px ${rGlow}` }}>
            ПРИНЯТЬ ПАРАЗИТА
          </button>
        </div>
      </div>
    )
  }

  // ── MANAGE ──
  if (phase === 'manage' && pets.length > 0) {
    const currentPet = pets[activePet] ?? pets[0]
    return (
      <div style={pageStyle}>
        <div style={titleStyle}>ИНКУБАТОР</div>

        {/* Табы если несколько питомцев */}
        {pets.length > 1 && (
          <PetTabs pets={pets} active={activePet} onSelect={setActivePet} />
        )}

        <PetHabitat key={currentPet.id} pet={currentPet} onUpdate={updatePet} />

        {/* Получить ещё питомца */}
        {canGetMore && (
          <div style={{ marginTop: 32, textAlign: 'center' }}>
            <div style={{
              padding: '16px 24px', borderRadius: 12,
              border: '1px dashed rgba(0,255,240,0.2)',
              background: 'rgba(0,255,240,0.03)', marginBottom: 16,
            }}>
              <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: '#506080', letterSpacing: 2, marginBottom: 8 }}>
                {pets.length}/{maxPets} питомца · слот свободен
              </div>
              <div style={{ fontFamily: 'Exo 2,sans-serif', fontSize: 13, color: '#8892B0', lineHeight: 1.5 }}>
                Предыдущий паразит вырос. Можешь завести ещё одного.
              </div>
            </div>
            <button
              onClick={() => { setClaimError(''); setPhase('choose') }}
              style={{ ...btnStyle, borderColor: '#00FFF0', color: '#00FFF0', boxShadow: '0 0 10px rgba(0,255,240,0.2)' }}
            >
              + ПОЛУЧИТЬ ЕЩЁ ПАРАЗИТА
            </button>
          </div>
        )}

        {/* Лимит */}
        {pets.length >= maxPets && maxPets > 0 && (
          <div style={{ marginTop: 24, textAlign: 'center', fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: '#3A4A5A', letterSpacing: 2 }}>
            // лимит {maxPets} питомца · следующий слот откроется с повышением ранга //
          </div>
        )}
      </div>
    )
  }

  return null
}

// ── СТИЛИ ─────────────────────────────────────────────────────────────────────
const pageStyle: React.CSSProperties = { maxWidth: 620, margin: '0 auto', padding: '40px 32px' }

const titleStyle: React.CSSProperties = {
  fontFamily: 'Orbitron,monospace', fontSize: 28, letterSpacing: 8,
  color: 'var(--accent)', marginBottom: 16, textShadow: '0 0 20px var(--accent-glow)',
}

const boxStyle: React.CSSProperties = {
  position: 'relative', width: 180, padding: '28px 20px',
  borderRadius: 16, border: '1px solid rgba(255,255,255,0.08)',
  background: 'rgba(13,13,26,0.8)', cursor: 'pointer',
  textAlign: 'center', transition: 'all 0.25s ease', backdropFilter: 'blur(8px)',
}

const boxGlowBar: React.CSSProperties = {
  position: 'absolute', bottom: 0, left: '15%', right: '15%', height: 1,
  background: 'linear-gradient(90deg, transparent, var(--accent), transparent)', opacity: 0.4,
}

const btnStyle: React.CSSProperties = {
  fontFamily: 'Orbitron,monospace', fontSize: 11, letterSpacing: 4,
  padding: '12px 36px', borderRadius: 8, border: '1px solid',
  background: 'transparent', cursor: 'pointer', transition: 'all 0.2s',
}

const actionBtn: React.CSSProperties = {
  fontFamily: 'Orbitron,monospace', fontSize: 10, letterSpacing: 3,
  padding: '10px 18px', borderRadius: 8, border: '1px solid',
  background: 'transparent', cursor: 'pointer', transition: 'all 0.2s',
  whiteSpace: 'nowrap',
}

function hexToRgb(hex: string): string {
  return `${parseInt(hex.slice(1, 3), 16)},${parseInt(hex.slice(3, 5), 16)},${parseInt(hex.slice(5, 7), 16)}`
}
