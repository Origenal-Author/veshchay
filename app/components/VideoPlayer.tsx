'use client'

import { useEffect, useRef, useState } from 'react'

interface Props { src: string }

function formatTime(s: number) {
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
}

export default function VideoPlayer({ src }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const progressRef = useRef<HTMLDivElement>(null)
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [muted, setMuted] = useState(false)
  const [volume, setVolume] = useState(1)
  const [loop, setLoop] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    setIsMobile(window.innerWidth < 600)
  }, [])

  // Автоплей (настройка пользователя)
  useEffect(() => {
    try {
      if (localStorage.getItem('veshchay_autoplay') === '1') {
        const v = videoRef.current
        if (v) v.play().then(() => setPlaying(true)).catch(() => {})
      }
    } catch {}
  }, [])

  // Авто-скрытие контролов
  function resetHideTimer() {
    setShowControls(true)
    if (hideTimer.current) clearTimeout(hideTimer.current)
    hideTimer.current = setTimeout(() => {
      if (playing) setShowControls(false)
    }, 2500)
  }

  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    v.loop = loop
  }, [loop])

  function togglePlay() {
    const v = videoRef.current
    if (!v) return
    if (v.paused) { v.play(); setPlaying(true) }
    else { v.pause(); setPlaying(false) }
    resetHideTimer()
  }

  function onTimeUpdate() {
    const v = videoRef.current
    if (!v || !v.duration) return
    setCurrentTime(v.currentTime)
    setProgress((v.currentTime / v.duration) * 100)
  }

  function onLoaded() {
    const v = videoRef.current
    if (v) setDuration(v.duration)
  }

  function seek(e: React.MouseEvent<HTMLDivElement>) {
    const v = videoRef.current
    const bar = progressRef.current
    if (!v || !bar) return
    const rect = bar.getBoundingClientRect()
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    v.currentTime = pct * v.duration
  }

  function toggleMute() {
    const v = videoRef.current
    if (!v) return
    v.muted = !v.muted
    setMuted(v.muted)
  }

  function changeVolume(e: React.ChangeEvent<HTMLInputElement>) {
    const v = videoRef.current
    if (!v) return
    const val = Number(e.target.value)
    v.volume = val
    setVolume(val)
    setMuted(val === 0)
  }

  function toggleFullscreen() {
    const el = containerRef.current
    if (!el) return
    if (!document.fullscreenElement) {
      el.requestFullscreen()
      setFullscreen(true)
    } else {
      document.exitFullscreen()
      setFullscreen(false)
    }
  }

  const C = '#00FFF0'
  const ACTIVE = 'rgba(0,255,240,0.9)'

  return (
    <div
      ref={containerRef}
      onMouseMove={resetHideTimer}
      onMouseLeave={() => playing && setShowControls(false)}
      style={{ position: 'relative', width: '100%', height: '100%', background: '#000', cursor: showControls ? 'default' : 'none', userSelect: 'none' }}
    >
      {/* Видео */}
      <video
        ref={videoRef}
        src={src}
        style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
        onTimeUpdate={onTimeUpdate}
        onLoadedMetadata={onLoaded}
        onEnded={() => { if (!loop) setPlaying(false) }}
        onClick={togglePlay}
        onContextMenu={e => e.preventDefault()}
        playsInline
      />

      {/* Оверлей кнопки play по центру */}
      {!playing && (
        <div
          onClick={togglePlay}
          style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <div style={{
            width: 64, height: 64,
            border: `2px solid ${C}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.5)',
            boxShadow: `0 0 30px rgba(0,255,240,0.4)`,
            transition: 'all 0.2s',
          }}>
            <svg viewBox="0 0 24 24" fill="none" width="28" height="28">
              <path d="M8 5.14v14l11-7-11-7z" fill={C} />
            </svg>
          </div>
        </div>
      )}

      {/* Контролы */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        background: 'linear-gradient(transparent, rgba(6,6,18,0.95))',
        padding: '20px 16px 12px',
        opacity: showControls ? 1 : 0,
        transition: 'opacity 0.3s',
        pointerEvents: showControls ? 'auto' : 'none',
      }}>
        {/* Прогресс-бар */}
        <div
          ref={progressRef}
          onClick={seek}
          style={{
            width: '100%', height: 4, background: 'rgba(0,255,240,0.15)',
            borderRadius: 2, cursor: 'pointer', marginBottom: 10,
            position: 'relative',
          }}
        >
          {/* Заполненная часть */}
          <div style={{
            position: 'absolute', left: 0, top: 0, bottom: 0,
            width: `${progress}%`,
            background: C,
            borderRadius: 2,
            boxShadow: `0 0 8px ${C}`,
            transition: 'width 0.1s linear',
          }} />
          {/* Ползунок */}
          <div style={{
            position: 'absolute', top: '50%', transform: 'translate(-50%, -50%)',
            left: `${progress}%`,
            width: 12, height: 12, borderRadius: '50%',
            background: C, boxShadow: `0 0 10px ${C}`,
          }} />
        </div>

        {/* Кнопки */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Play/Pause */}
          <button onClick={togglePlay} style={btnStyle}>
            {playing
              ? <svg viewBox="0 0 24 24" fill={C} width="18" height="18"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
              : <svg viewBox="0 0 24 24" fill={C} width="18" height="18"><path d="M8 5.14v14l11-7z"/></svg>
            }
          </button>

          {/* Время */}
          <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 11, color: C, letterSpacing: 1, whiteSpace: 'nowrap' }}>
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>

          {/* Громкость */}
          <button onClick={toggleMute} style={btnStyle}>
            {muted || volume === 0
              ? <svg viewBox="0 0 24 24" fill={C} width="18" height="18"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" opacity="0.4"/><line x1="21" y1="3" x2="3" y2="21" stroke={C} strokeWidth="2"/></svg>
              : <svg viewBox="0 0 24 24" fill={C} width="18" height="18"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>
            }
          </button>
          <input
            type="range" min="0" max="1" step="0.05"
            value={muted ? 0 : volume}
            onChange={changeVolume}
            style={{ width: 70, accentColor: C, cursor: 'pointer' }}
          />

          <div style={{ flex: 1 }} />

          {/* Повтор */}
          <button onClick={() => setLoop(l => !l)} title="Повтор" style={{ ...btnStyle, opacity: loop ? 1 : 0.4 }}>
            <svg viewBox="0 0 24 24" fill="none" stroke={C} strokeWidth="2" width="18" height="18">
              <polyline points="17 1 21 5 17 9"/>
              <path d="M3 11V9a4 4 0 0 1 4-4h14"/>
              <polyline points="7 23 3 19 7 15"/>
              <path d="M21 13v2a4 4 0 0 1-4 4H3"/>
            </svg>
          </button>

          {/* Картинка в картинке */}
          <button onClick={() => videoRef.current?.requestPictureInPicture()} title="Картинка в картинке" style={{ ...btnStyle, opacity: 0.7 }}>
            <svg viewBox="0 0 24 24" fill="none" stroke={C} strokeWidth="2" width="18" height="18">
              <rect x="2" y="3" width="20" height="14" rx="2"/>
              <rect x="12" y="11" width="8" height="5" rx="1" fill={C} stroke="none"/>
            </svg>
          </button>

          {/* Полный экран */}
          <button onClick={toggleFullscreen} style={btnStyle}>
            {fullscreen
              ? <svg viewBox="0 0 24 24" fill="none" stroke={C} strokeWidth="2" width="18" height="18"><path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/></svg>
              : <svg viewBox="0 0 24 24" fill="none" stroke={C} strokeWidth="2" width="18" height="18"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>
            }
          </button>
        </div>
      </div>
    </div>
  )
}

const btnStyle: React.CSSProperties = {
  background: 'none', border: 'none', cursor: 'pointer',
  padding: 4, display: 'flex', alignItems: 'center', justifyContent: 'center',
  opacity: 0.85, transition: 'opacity 0.2s',
}
