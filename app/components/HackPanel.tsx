'use client'

import { useEffect, useRef, useState } from 'react'

const KICKOUT_MSGS = [
  'АНТИВИРУС ГОВОРИТ АСИСЯЙ — СОЕДИНЕНИЕ РАЗОРВАНО',
  'КОТИК ПЕРЕГРЫЗ ПРОВОД — ДОСТУП УТЕРЯН',
  'СИСТЕМНЫЙ АДМИНИСТРАТОР ПРОСНУЛСЯ — ЭКСТРЕННЫЙ ВЫХОД',
  'ФАЙРВОЛ ПРОСНУЛСЯ И ЗЛИТСЯ — БЕЖИМ',
  'ЖЕРТВА ВКЛЮЧИЛА ДВУХФАКТОРКУ — ВСЁ ПРОПАЛО',
  'ЗАКОНЧИЛСЯ КОФЕ ХАКЕРА — ПРИНУДИТЕЛЬНОЕ ОТКЛЮЧЕНИЕ',
  'МАМА ЖЕРТВЫ УВИДЕЛА ЭКРАН — ПАНИКА',
]

const FUNNY_NICKS = [
  'ТЫ_ВЗЛОМАН_LOL',
  'ПАЦИЕНТ_НУЛЕВОЙ',
  'ЦИФРОВОЙ_РАБ',
  'СИГНАЛ_УТЕРЯН',
  'ЖЕРТВА_КОДИНГА',
  'ХАКНУТЫЙ_ЮЗЕР',
]

const HACK_TIME = 150 // 2.5 минуты

interface Props {
  victimId: string
  victimName: string
  onClose: () => void
}

export default function HackPanel({ victimId, victimName, onClose }: Props) {
  const [timeLeft, setTimeLeft] = useState(HACK_TIME)
  const [kicked, setKicked] = useState(false)
  const [kickMsg, setKickMsg] = useState('')
  const [activeTab, setActiveTab] = useState<'menu' | 'nick' | 'ad' | 'pet'>('menu')
  const [adText, setAdText] = useState('')
  const [appliedEffects, setAppliedEffects] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [feedback, setFeedback] = useState('')

  useEffect(() => {
    const iv = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(iv)
          const msg = KICKOUT_MSGS[Math.floor(Math.random() * KICKOUT_MSGS.length)]
          setKickMsg(msg)
          setKicked(true)
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(iv)
  }, [])

  async function applyEffect(type: string, data: object) {
    if (loading) return
    setLoading(true)
    const res = await fetch('/api/hack/effects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ victimId, effectType: type, effectData: data }),
    })
    const r = await res.json()
    if (res.ok) {
      setAppliedEffects(e => [...e, type])
      setFeedback('✓ ПРИМЕНЕНО')
      setTimeout(() => { setFeedback(''); setActiveTab('menu') }, 1500)
    } else {
      setFeedback(`⚠ ${r.error}`)
    }
    setLoading(false)
  }

  const mins = Math.floor(timeLeft / 60)
  const secs = String(timeLeft % 60).padStart(2, '0')
  const timerColor = timeLeft > 60 ? '#00FF88' : timeLeft > 30 ? '#FFB300' : '#FF006E'
  const applied = (t: string) => appliedEffects.includes(t)

  if (kicked) return (
    <div style={{ textAlign: 'center', padding: '24px 0' }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
      <div style={{ fontFamily: 'Orbitron,monospace', fontSize: 13, letterSpacing: 3, color: '#FF006E', marginBottom: 12 }}>
        СЕССИЯ ЗАВЕРШЕНА
      </div>
      <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: '#506080', letterSpacing: 2, marginBottom: 24, lineHeight: 1.8 }}>
        // {kickMsg} //
      </div>
      <button onClick={onClose} style={btnS('#FF006E')}>ЗАКРЫТЬ</button>
    </div>
  )

  return (
    <div>
      {/* Шапка с таймером */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, padding: '10px 14px', background: 'rgba(255,0,110,0.06)', border: '1px solid rgba(255,0,110,0.2)', borderRadius: 8 }}>
        <div>
          <div style={{ fontFamily: 'Orbitron,monospace', fontSize: 10, letterSpacing: 3, color: '#FF006E' }}>⚡ ДОСТУП К @{victimName}</div>
          <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 8, color: '#506080', letterSpacing: 2, marginTop: 2 }}>делай пакости пока не выкинуло</div>
        </div>
        <div style={{ fontFamily: 'Orbitron,monospace', fontSize: 22, fontWeight: 900, color: timerColor, textShadow: `0 0 12px ${timerColor}`, animation: timeLeft <= 30 ? 'pulse 1s ease-in-out infinite' : 'none' }}>
          {mins}:{secs}
        </div>
      </div>

      {feedback && (
        <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: '#00FF88', letterSpacing: 2, marginBottom: 12, textAlign: 'center' }}>
          {feedback}
        </div>
      )}

      {/* МЕНЮ */}
      {activeTab === 'menu' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            { type: 'pet', icon: '🐾', label: 'ВЫПУСТИТЬ ПИТОМЦА', desc: 'Питомец нагадит тараканов — жертве убирать' },
            { type: 'nick', icon: '📛', label: 'СМЕНИТЬ НИК', desc: 'Переименовать аккаунт жертвы' },
            { type: 'ad',  icon: '📢', label: 'ФЕЙКОВАЯ РЕКЛАМА', desc: 'Всплывающий баннер у жертвы' },
          ].map(({ type, icon, label, desc }) => (
            <button
              key={type}
              onClick={() => type === 'pet' ? applyEffect('pet', {}) : setActiveTab(type as 'nick' | 'ad')}
              disabled={applied(type) || loading}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 14px', borderRadius: 8, cursor: applied(type) ? 'default' : 'pointer',
                border: `1px solid ${applied(type) ? 'rgba(0,255,136,0.3)' : 'rgba(255,0,110,0.2)'}`,
                background: applied(type) ? 'rgba(0,255,136,0.05)' : 'rgba(255,0,110,0.04)',
                opacity: applied(type) ? 0.7 : 1,
                textAlign: 'left',
              }}
            >
              <span style={{ fontSize: 22 }}>{icon}</span>
              <div>
                <div style={{ fontFamily: 'Orbitron,monospace', fontSize: 10, letterSpacing: 2, color: applied(type) ? '#00FF88' : '#FF006E' }}>
                  {applied(type) ? '✓ ' : ''}{label}
                </div>
                <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 8, color: '#506080', marginTop: 2 }}>{desc}</div>
              </div>
            </button>
          ))}
          <button onClick={onClose} style={{ ...btnS('#3A4A5A'), marginTop: 4 }}>ПОКИНУТЬ СЕССИЮ</button>
        </div>
      )}

      {/* ВЫБОР НИКА */}
      {activeTab === 'nick' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 9, color: '#506080', letterSpacing: 3, marginBottom: 4 }}>// ВЫБЕРИ НИК ДЛЯ ЖЕРТВЫ</div>
          {FUNNY_NICKS.map(nick => (
            <button key={nick} onClick={() => applyEffect('nick', { nick })} disabled={loading}
              style={{ padding: '11px 16px', borderRadius: 8, border: '1px solid rgba(255,0,110,0.2)', background: 'rgba(255,0,110,0.04)', cursor: 'pointer', fontFamily: 'Orbitron,monospace', fontSize: 10, color: '#FF006E', letterSpacing: 2 }}>
              {nick}
            </button>
          ))}
          <button onClick={() => setActiveTab('menu')} style={{ ...btnS('#3A4A5A'), marginTop: 4 }}>← НАЗАД</button>
        </div>
      )}

      {/* ФЕЙКОВАЯ РЕКЛАМА */}
      {activeTab === 'ad' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 9, color: '#506080', letterSpacing: 3 }}>// ТЕКСТ РЕКЛАМЫ</div>
          <textarea
            value={adText}
            onChange={e => setAdText(e.target.value)}
            placeholder="Введи текст рекламы..."
            maxLength={200}
            rows={4}
            style={{ background: 'rgba(255,0,110,0.04)', border: '1px solid rgba(255,0,110,0.2)', borderRadius: 8, padding: '10px 14px', color: '#E0E8F0', fontFamily: 'Exo 2,sans-serif', fontSize: 13, resize: 'none', outline: 'none' }}
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => adText.trim() && applyEffect('ad', { text: adText })} disabled={!adText.trim() || loading} style={{ ...btnS('#FF006E'), flex: 1 }}>ЗАПУСТИТЬ</button>
            <button onClick={() => setActiveTab('menu')} style={btnS('#3A4A5A')}>←</button>
          </div>
        </div>
      )}
    </div>
  )
}

function btnS(color: string): React.CSSProperties {
  return {
    fontFamily: 'Orbitron,monospace', fontSize: 9, letterSpacing: 3,
    padding: '10px 20px', borderRadius: 8,
    border: `1px solid ${color}`, color, background: 'transparent',
    cursor: 'pointer', transition: 'all 0.2s',
  }
}
