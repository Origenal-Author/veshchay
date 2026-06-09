'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { useWeather } from '@/app/components/WeatherProvider'

type Settings = {
  online_hidden?: boolean
  accent_color?: string | null
  content_filter?: string[]
  allow_borrow?: boolean
  gate_disabled?: boolean
}

const THEMES = [
  { key: 'night', label: 'НОЧЬ' }, { key: 'clear', label: 'ЯСНО' },
  { key: 'rain', label: 'ДОЖДЬ' }, { key: 'snow', label: 'СНЕГ' },
  { key: 'storm', label: 'ГРОЗА' }, { key: 'fog', label: 'ТУМАН' },
] as const

const CONTENT_TAGS = [
  { key: 'secret', label: '#СЕКРЕТНЫЙ_ФАЙЛ' },
  { key: 'sharp', label: '#ОСТРЫЙ_МАТЕРИАЛ' },
  { key: 'agent', label: '#ВЕЩАНИЕ_ИНОАГЕНТА' },
  { key: 'intercepted', label: '#ПЕРЕХВАЧЕННЫЙ_СИГНАЛ' },
  { key: 'noise', label: '#ПОМЕХИ_В_ЭФИРЕ' },
] as const

const ACCENTS = ['#00FFF0', '#FF006E', '#00FF88', '#FFB300', '#9B10FF', '#3A9EFF', '#FF2D55', '#FFFFFF']

function Toggle({ on, onClick, disabled }: { on: boolean; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onClick} disabled={disabled} aria-pressed={on}
      style={{
        flexShrink: 0, width: 52, height: 28, borderRadius: 14, cursor: disabled ? 'default' : 'pointer',
        border: `1px solid ${on ? 'var(--accent)' : 'var(--border)'}`,
        background: on ? 'rgba(0,255,240,0.15)' : 'var(--surface2)',
        boxShadow: on ? '0 0 12px var(--accent-glow)' : 'none',
        position: 'relative', transition: 'all 0.2s', opacity: disabled ? 0.6 : 1, padding: 0,
      }}
    >
      <span style={{
        position: 'absolute', top: 2, left: on ? 26 : 2, width: 22, height: 22, borderRadius: '50%',
        background: on ? 'var(--accent)' : 'var(--subtext)',
        boxShadow: on ? '0 0 8px var(--accent)' : 'none', transition: 'left 0.2s, background 0.2s',
      }} />
    </button>
  )
}

const sectionStyle: React.CSSProperties = {
  fontFamily: "'Orbitron',monospace", fontSize: 12, fontWeight: 700, letterSpacing: 3,
  color: 'var(--accent)', margin: '32px 0 14px', paddingBottom: 12, borderBottom: '1px solid var(--border)',
}
const rowStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20,
  padding: '16px 20px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, marginBottom: 10,
}
const titleStyle: React.CSSProperties = { fontFamily: "'Orbitron',monospace", fontSize: 13, fontWeight: 700, color: 'var(--text)', letterSpacing: 1, marginBottom: 6 }
const descStyle: React.CSSProperties = { fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: 'var(--subtext)', lineHeight: 1.6 }

export default function SettingsPage() {
  const router = useRouter()
  const { setWeather } = useWeather()
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [showEmail, setShowEmail] = useState(false)
  const [s, setS] = useState<Settings>({})
  const [autoplay, setAutoplay] = useState(false)
  const [themeLock, setThemeLock] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')
  const [historyCleared, setHistoryCleared] = useState(false)

  useEffect(() => {
    (async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }
      setEmail(user.email || '')
      const { data: profile } = await supabase.from('profiles').select('settings, public_email').eq('id', user.id).single()
      setS((profile?.settings ?? {}) as Settings)
      setShowEmail(!!profile?.public_email)
      try {
        setAutoplay(localStorage.getItem('veshchay_autoplay') === '1')
        setThemeLock(localStorage.getItem('veshchay_theme_lock'))
      } catch {}
      setLoading(false)
    })()
  }, [router])

  function flash(msg: string) { setToast(msg); setTimeout(() => setToast(''), 1800) }

  async function patch(next: Settings) {
    setS(next); setError('')
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { error } = await supabase.from('profiles').update({ settings: next }).eq('id', user.id)
    if (error) setError(error.message); else flash('✓ сохранено')
  }

  async function toggleEmail() {
    const next = !showEmail; setShowEmail(next); setError('')
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { error } = await supabase.from('profiles').update({ public_email: next ? (user.email || null) : null }).eq('id', user.id)
    if (error) { setError(error.message); setShowEmail(!next) } else flash('✓ сохранено')
  }

  function pickTheme(key: string) {
    try { localStorage.setItem('veshchay_theme_lock', key) } catch {}
    setThemeLock(key); setWeather(key as Parameters<typeof setWeather>[0]); flash('✓ тема зафиксирована')
  }
  function autoTheme() {
    try { localStorage.removeItem('veshchay_theme_lock') } catch {}
    setThemeLock(null); flash('✓ авто (применится при перезагрузке)')
  }
  function toggleAutoplay() {
    const next = !autoplay; setAutoplay(next)
    try { localStorage.setItem('veshchay_autoplay', next ? '1' : '0') } catch {}
    flash('✓ сохранено')
  }

  function toggleTag(key: string) {
    const cur = Array.isArray(s.content_filter) ? s.content_filter : []
    const next = cur.includes(key) ? cur.filter(k => k !== key) : [...cur, key]
    patch({ ...s, content_filter: next })
  }

  async function clearHistory() {
    if (!confirm('Очистить всю историю просмотров? Это необратимо.')) return
    setError('')
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { error } = await supabase.from('views').delete().eq('user_id', user.id)
    if (error) setError(error.message); else { setHistoryCleared(true); flash('✓ история очищена') }
  }

  return (
    <div style={{ minHeight: '100vh', position: 'relative', zIndex: 2, paddingBottom: 60 }}>
      <header className="site-header">
        <Link href="/" className="site-logo">ВЕЩАЙ</Link>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 10 }}>
          <Link href="/profile/edit" className="btn-ghost-ui">ПРОФИЛЬ</Link>
          <Link href="/" className="btn-ghost-ui">← ГЛАВНАЯ</Link>
        </div>
      </header>

      <main className="mobile-pad" style={{ maxWidth: 680, margin: '0 auto', padding: '40px 32px' }}>
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: 'var(--accent2)', letterSpacing: 3, marginBottom: 8 }}>// КОНФИГУРАЦИЯ_СИСТЕМЫ</div>
          <h1 style={{ fontFamily: "'Orbitron',monospace", fontSize: 24, fontWeight: 900, letterSpacing: 3, color: 'var(--text)' }}>НАСТРОЙКИ</h1>
        </div>

        {loading ? (
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: 'var(--subtext)', letterSpacing: 2, marginTop: 24 }}>// ЗАГРУЗКА...</div>
        ) : (
          <>
            {/* ВНЕШНИЙ ВИД */}
            <div style={sectionStyle}>// ВНЕШНИЙ ВИД</div>

            <div style={{ ...rowStyle, flexDirection: 'column', alignItems: 'stretch' }}>
              <div>
                <div style={titleStyle}>ТЕМА / ПОГОДА</div>
                <div style={descStyle}>По умолчанию тема меняется по реальной погоде. Можно зафиксировать любимую.</div>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 14 }}>
                <button onClick={autoTheme} style={themeBtn(themeLock === null)}>АВТО</button>
                {THEMES.map(t => (
                  <button key={t.key} onClick={() => pickTheme(t.key)} style={themeBtn(themeLock === t.key)}>{t.label}</button>
                ))}
              </div>
            </div>

            <div style={{ ...rowStyle, flexDirection: 'column', alignItems: 'stretch' }}>
              <div>
                <div style={titleStyle}>ЦВЕТ АКЦЕНТА ПРОФИЛЯ</div>
                <div style={descStyle}>Цвет имени, рамки и XP в твоём профиле. По умолчанию — цвет ранга.</div>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 14, alignItems: 'center' }}>
                {ACCENTS.map(c => (
                  <button key={c} onClick={() => patch({ ...s, accent_color: c })} title={c}
                    style={{ width: 28, height: 28, borderRadius: '50%', background: c, cursor: 'pointer',
                      border: s.accent_color === c ? '3px solid var(--text)' : '1px solid rgba(255,255,255,0.2)',
                      boxShadow: s.accent_color === c ? `0 0 12px ${c}` : 'none' }} />
                ))}
                <button onClick={() => patch({ ...s, accent_color: null })}
                  style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, letterSpacing: 1, padding: '7px 12px',
                    border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--subtext)', borderRadius: 6, cursor: 'pointer' }}>
                  СБРОС
                </button>
              </div>
            </div>

            {/* ЛЕНТА */}
            <div style={sectionStyle}>// ЛЕНТА И ПЛЕЕР</div>

            <div style={rowStyle}>
              <div style={{ flex: 1 }}>
                <div style={titleStyle}>АВТОПЛЕЙ ВИДЕО</div>
                <div style={descStyle}>Автоматически запускать загруженные видео при открытии.</div>
              </div>
              <Toggle on={autoplay} onClick={toggleAutoplay} />
            </div>

            <div style={{ ...rowStyle, flexDirection: 'column', alignItems: 'stretch' }}>
              <div>
                <div style={titleStyle}>КОНТЕНТ-ФИЛЬТР</div>
                <div style={descStyle}>Выбери теги, которые НЕ хочешь видеть в ленте. Отмеченные будут спрятаны.</div>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 14 }}>
                {CONTENT_TAGS.map(t => {
                  const hidden = Array.isArray(s.content_filter) && s.content_filter.includes(t.key)
                  return (
                    <button key={t.key} onClick={() => toggleTag(t.key)}
                      style={{
                        fontFamily: "'JetBrains Mono',monospace", fontSize: 10, letterSpacing: 1, padding: '8px 12px', borderRadius: 6, cursor: 'pointer',
                        border: `1px solid ${hidden ? '#FF006E' : 'var(--border)'}`,
                        background: hidden ? 'rgba(255,0,110,0.1)' : 'var(--surface2)',
                        color: hidden ? '#FF006E' : 'var(--subtext)',
                        boxShadow: hidden ? '0 0 10px rgba(255,0,110,0.2)' : 'none',
                        textDecoration: hidden ? 'line-through' : 'none',
                      }}>
                      {hidden ? '✕ ' : ''}{t.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* ПИТОМЕЦ */}
            <div style={sectionStyle}>// ПИТОМЕЦ</div>

            <div style={rowStyle}>
              <div style={{ flex: 1 }}>
                <div style={titleStyle}>РАЗРЕШИТЬ ОДАЛЖИВАНИЕ</div>
                <div style={descStyle}>Можно ли друзьям брать твоих питомцев на время. Если выкл — кнопка «занять питомца» не появится.</div>
              </div>
              <Toggle on={s.allow_borrow !== false} onClick={() => patch({ ...s, allow_borrow: s.allow_borrow === false ? true : false })} />
            </div>

            {/* ПРИВАТНОСТЬ */}
            <div style={sectionStyle}>// ПРИВАТНОСТЬ</div>

            <div style={rowStyle}>
              <div style={{ flex: 1 }}>
                <div style={titleStyle}>СКРЫТЬ ОНЛАЙН-СТАТУС</div>
                <div style={descStyle}>Другие не будут видеть, что ты в сети (для них — всегда «не в сети»).</div>
              </div>
              <Toggle on={!!s.online_hidden} onClick={() => patch({ ...s, online_hidden: !s.online_hidden })} />
            </div>

            <div style={rowStyle}>
              <div style={{ flex: 1 }}>
                <div style={titleStyle}>ПОКАЗЫВАТЬ EMAIL В ПРОФИЛЕ</div>
                <div style={descStyle}>По умолчанию почта скрыта. Включи, если хочешь показать контакт.</div>
                <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: showEmail ? 'var(--accent)' : 'var(--subtext)', marginTop: 8 }}>
                  {showEmail ? `✉ виден: ${email}` : '✕ скрыт'}
                </div>
              </div>
              <Toggle on={showEmail} onClick={toggleEmail} />
            </div>

            <div style={rowStyle}>
              <div style={{ flex: 1 }}>
                <div style={titleStyle}>ИСТОРИЯ ПРОСМОТРОВ</div>
                <div style={descStyle}>Удалить всю историю просмотренных видео. Действие необратимо.</div>
              </div>
              <button onClick={clearHistory} disabled={historyCleared}
                style={{ flexShrink: 0, fontFamily: "'JetBrains Mono',monospace", fontSize: 10, letterSpacing: 1, padding: '10px 14px',
                  border: '1px solid rgba(255,0,110,0.3)', background: 'rgba(255,0,110,0.06)', color: '#FF006E', borderRadius: 6,
                  cursor: historyCleared ? 'default' : 'pointer', opacity: historyCleared ? 0.5 : 1 }}>
                {historyCleared ? 'ОЧИЩЕНО' : 'ОЧИСТИТЬ'}
              </button>
            </div>

            {error && (
              <div style={{ marginTop: 16, padding: '10px 16px', background: 'rgba(255,0,110,0.08)', border: '1px solid rgba(255,0,110,0.3)', fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: '#FF006E' }}>
                ⚠ {error}
              </div>
            )}

            <div style={{ marginTop: 30, fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: 'var(--subtext)', opacity: 0.6, lineHeight: 1.6 }}>
              // раздел «Аккаунт» (смена пароля/email, удаление) — в разработке
            </div>
          </>
        )}
      </main>

      {/* Тост */}
      {toast && (
        <div style={{ position: 'fixed', bottom: 70, left: '50%', transform: 'translateX(-50%)', zIndex: 9999,
          fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: 'var(--accent)', letterSpacing: 1,
          background: 'rgba(6,6,18,0.95)', border: '1px solid var(--accent)', borderRadius: 8, padding: '10px 18px', boxShadow: '0 0 18px var(--accent-glow)' }}>
          {toast}
        </div>
      )}
    </div>
  )
}

function themeBtn(active: boolean): React.CSSProperties {
  return {
    fontFamily: "'Orbitron',monospace", fontSize: 10, letterSpacing: 1, padding: '8px 14px', borderRadius: 6, cursor: 'pointer',
    border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
    background: active ? 'rgba(0,255,240,0.12)' : 'var(--surface2)',
    color: active ? 'var(--accent)' : 'var(--subtext)',
    boxShadow: active ? '0 0 10px var(--accent-glow)' : 'none',
  }
}
