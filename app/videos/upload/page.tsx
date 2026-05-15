'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { extractYoutubeId } from '@/lib/youtube'

type Mode = 'youtube' | 'file'

const CATEGORIES = [
  { value: 'general',     label: '— БЕЗ КАТЕГОРИИ —' },
  { value: 'secret',      label: '#СЕКРЕТНЫЙ_ФАЙЛ' },
  { value: 'sharp',       label: '#ОСТРЫЙ_МАТЕРИАЛ' },
  { value: 'agent',       label: '#ВЕЩАНИЕ_ИНОАГЕНТА' },
  { value: 'intercepted', label: '#ПЕРЕХВАЧЕННЫЙ_СИГНАЛ' },
  { value: 'noise',       label: '#ПОМЕХИ_В_ЭФИРЕ' },
  { value: 'music',       label: 'МУЗЫКА' },
  { value: 'games',       label: 'ИГРЫ' },
]

export default function UploadPage() {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>('youtube')

  // Общие поля
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('general')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // YouTube
  const [ytUrl, setYtUrl] = useState('')
  const [ytPreview, setYtPreview] = useState('')

  // Файл
  const [file, setFile] = useState<File | null>(null)
  const [filePreview, setFilePreview] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [dragging, setDragging] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  function handleUrlChange(e: React.ChangeEvent<HTMLInputElement>) {
    setYtUrl(e.target.value)
    const id = extractYoutubeId(e.target.value)
    setYtPreview(id ? `https://img.youtube.com/vi/${id}/mqdefault.jpg` : '')
  }

  function handleFile(f: File) {
    if (!f.type.startsWith('video/')) { setError('Только видео-файлы'); return }
    if (f.size > 100 * 1024 * 1024) { setError('Максимальный размер 100MB'); return }
    setFile(f)
    setError('')
    const url = URL.createObjectURL(f)
    setFilePreview(url)
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault(); setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }

  // ── YOUTUBE САБМИТ ────────────────────────────────────────────────────────
  async function submitYoutube() {
    const youtubeId = extractYoutubeId(ytUrl)
    if (!youtubeId) { setError('Неверная ссылка YouTube'); return }
    if (!title.trim()) { setError('Укажи название'); return }

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth/login'); return }

    const { data, error: dbError } = await supabase
      .from('videos')
      .insert({ title, description, youtube_id: youtubeId, user_id: user.id, category, video_type: 'youtube' })
      .select('id').single()

    if (dbError) { setError(dbError.message); return }

    fetch('/api/xp/award', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'upload' }),
    }).catch(() => {})

    router.push(`/videos/${data.id}`)
  }

  // ── ФАЙЛ САБМИТ ───────────────────────────────────────────────────────────
  async function submitFile() {
    if (!file) { setError('Выбери файл'); return }
    if (!title.trim()) { setError('Укажи название'); return }

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth/login'); return }

    // Загружаем в Supabase Storage
    const ext = file.name.split('.').pop()
    const path = `${user.id}/${Date.now()}.${ext}`

    setUploadProgress(10)

    const { data: storageData, error: storageError } = await supabase.storage
      .from('videos')
      .upload(path, file, { contentType: file.type, upsert: false })

    if (storageError) { setError(storageError.message); setUploadProgress(0); return }

    setUploadProgress(80)

    const { data, error: dbError } = await supabase
      .from('videos')
      .insert({
        title, description, user_id: user.id, category,
        video_type: 'upload', storage_path: storageData.path,
      })
      .select('id').single()

    if (dbError) { setError(dbError.message); setUploadProgress(0); return }

    setUploadProgress(100)

    fetch('/api/xp/award', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'upload' }),
    }).catch(() => {})

    router.push(`/videos/${data.id}`)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (loading) return
    setLoading(true)
    setError('')
    try {
      if (mode === 'youtube') await submitYoutube()
      else await submitFile()
    } finally {
      setLoading(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '12px 16px',
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderLeft: '3px solid var(--accent)', color: 'var(--text)',
    fontFamily: "'JetBrains Mono',monospace", fontSize: 13, outline: 'none',
  }
  const labelStyle: React.CSSProperties = {
    fontFamily: "'JetBrains Mono',monospace", fontSize: 10,
    color: 'var(--subtext)', letterSpacing: 2, display: 'block', marginBottom: 6,
  }

  return (
    <div style={{ minHeight: '100vh', position: 'relative', zIndex: 2 }}>
      <header className="site-header">
        <Link href="/" className="site-logo">ВЕЩАЙ</Link>
        <div style={{ marginLeft: 'auto' }}>
          <Link href="/" className="btn-ghost-ui">← НАЗАД</Link>
        </div>
      </header>

      <div style={{ maxWidth: 900, margin: '40px auto', padding: '0 32px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, alignItems: 'start' }}>

        {/* ЛЕВАЯ КОЛОНКА */}
        <div>
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: 'var(--accent2)', letterSpacing: 3, marginBottom: 8 }}>// НОВЫЙ_СИГНАЛ</div>
            <h1 style={{ fontFamily: "'Orbitron',monospace", fontSize: 22, fontWeight: 900, letterSpacing: 3, color: 'var(--text)' }}>ДОБАВИТЬ ВИДЕО</h1>
          </div>

          {/* Переключатель режима */}
          <div style={{ display: 'flex', gap: 0, marginBottom: 24, border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
            {(['youtube', 'file'] as Mode[]).map(m => (
              <button key={m} onClick={() => { setMode(m); setError('') }} style={{
                flex: 1, padding: '10px', fontFamily: "'Orbitron',monospace", fontSize: 9, letterSpacing: 3,
                cursor: 'pointer', border: 'none', transition: 'all 0.2s',
                background: mode === m ? 'rgba(0,255,240,0.1)' : 'transparent',
                color: mode === m ? 'var(--accent)' : 'var(--subtext)',
                borderBottom: mode === m ? '2px solid var(--accent)' : '2px solid transparent',
              }}>
                {m === 'youtube' ? '▶ YOUTUBE' : '📁 С КОМПЬЮТЕРА'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Общие поля */}
            <div>
              <label style={labelStyle}>// НАЗВАНИЕ</label>
              <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Введи название видео..." required style={inputStyle} />
            </div>

            {/* YouTube-специфичное */}
            {mode === 'youtube' && (
              <div>
                <label style={labelStyle}>// ССЫЛКА YOUTUBE</label>
                <input value={ytUrl} onChange={handleUrlChange} placeholder="https://youtube.com/watch?v=..." required style={inputStyle} />
              </div>
            )}

            {/* Файл-специфичное */}
            {mode === 'file' && (
              <div>
                <label style={labelStyle}>// ВИДЕО-ФАЙЛ <span style={{ opacity: 0.5 }}>(макс. 100MB)</span></label>
                <div
                  onDragOver={e => { e.preventDefault(); setDragging(true) }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={onDrop}
                  onClick={() => fileRef.current?.click()}
                  style={{
                    border: `2px dashed ${dragging ? 'var(--accent)' : file ? 'rgba(0,255,240,0.4)' : 'var(--border)'}`,
                    borderRadius: 8, padding: '28px 16px', textAlign: 'center',
                    cursor: 'pointer', transition: 'all 0.2s',
                    background: dragging ? 'rgba(0,255,240,0.04)' : file ? 'rgba(0,255,240,0.03)' : 'var(--surface)',
                  }}
                >
                  <input ref={fileRef} type="file" accept="video/*" style={{ display: 'none' }}
                    onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
                  {file ? (
                    <>
                      <div style={{ fontSize: 28, marginBottom: 8 }}>🎬</div>
                      <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: 'var(--accent)', letterSpacing: 1 }}>{file.name}</div>
                      <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: 'var(--subtext)', marginTop: 4 }}>
                        {(file.size / 1024 / 1024).toFixed(1)} MB
                      </div>
                    </>
                  ) : (
                    <>
                      <div style={{ fontSize: 28, marginBottom: 8 }}>📁</div>
                      <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: 'var(--subtext)', letterSpacing: 1 }}>
                        Перетащи файл или кликни
                      </div>
                      <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: 'var(--subtext)', opacity: 0.5, marginTop: 6 }}>
                        MP4, WebM, MOV
                      </div>
                    </>
                  )}
                </div>

                {/* Прогресс загрузки */}
                {loading && uploadProgress > 0 && (
                  <div style={{ marginTop: 10 }}>
                    <div style={{ height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 2 }}>
                      <div style={{ height: '100%', width: `${uploadProgress}%`, background: 'var(--accent)', borderRadius: 2, transition: 'width 0.3s ease', boxShadow: '0 0 8px var(--accent-glow)' }} />
                    </div>
                    <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: 'var(--accent)', marginTop: 4, letterSpacing: 2 }}>
                      {uploadProgress < 80 ? '// ЗАГРУЗКА ФАЙЛА...' : uploadProgress < 100 ? '// СОХРАНЕНИЕ...' : '// ГОТОВО'}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div>
              <label style={labelStyle}>// КАТЕГОРИЯ</label>
              <select value={category} onChange={e => setCategory(e.target.value)} style={{ ...inputStyle, fontFamily: "'JetBrains Mono',monospace" }}>
                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>

            <div>
              <label style={labelStyle}>// ОПИСАНИЕ <span style={{ opacity: 0.5 }}>(НЕОБЯЗАТЕЛЬНО)</span></label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Расскажи о видео..." rows={4}
                style={{ ...inputStyle, fontFamily: "'Exo 2',sans-serif", fontSize: 14, resize: 'none' }} />
            </div>

            {error && (
              <div style={{ padding: '10px 16px', background: 'rgba(255,0,110,0.08)', border: '1px solid rgba(255,0,110,0.3)', fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: '#FF006E' }}>
                ⚠ {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary-ui"
              style={{ width: '100%', justifyContent: 'center', padding: '14px', fontSize: 13, opacity: loading ? 0.6 : 1 }}>
              {loading ? '// ПУБЛИКАЦИЯ...' : '▶ ОПУБЛИКОВАТЬ СИГНАЛ'}
            </button>
          </form>
        </div>

        {/* ПРАВАЯ КОЛОНКА — ПРЕВЬЮ */}
        <div>
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: 'var(--subtext)', letterSpacing: 2, marginBottom: 12 }}>// ПРЕДПРОСМОТР</div>

          <div style={{ border: '1px solid var(--border)', background: 'var(--surface)', overflow: 'hidden' }}>
            <div style={{ aspectRatio: '16/9', position: 'relative', background: 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
              {mode === 'youtube' && ytPreview && (
                <img src={ytPreview} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              )}
              {mode === 'file' && filePreview && (
                <video src={filePreview} style={{ width: '100%', height: '100%', objectFit: 'contain' }} controls muted />
              )}
              {((mode === 'youtube' && !ytPreview) || (mode === 'file' && !filePreview)) && (
                <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
                  <div style={{ backgroundImage: 'linear-gradient(rgba(0,255,240,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(0,255,240,0.03) 1px,transparent 1px)', backgroundSize: '30px 30px', position: 'absolute', inset: 0 }} />
                  <div style={{ fontSize: 36 }}>{mode === 'youtube' ? '▶' : '📁'}</div>
                  <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: 'var(--subtext)', letterSpacing: 2, marginTop: 8 }}>
                    {mode === 'youtube' ? 'ВСТАВЬ ССЫЛКУ' : 'ВЫБЕРИ ФАЙЛ'}
                  </div>
                </div>
              )}
            </div>
            <div style={{ padding: '14px 16px', borderTop: '1px solid var(--border)' }}>
              <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: 'var(--subtext)', letterSpacing: 1 }}>
                {mode === 'youtube'
                  ? (ytPreview ? '✓ ВИДЕО НАЙДЕНО' : '// ОЖИДАНИЕ ССЫЛКИ...')
                  : (file ? `✓ ${file.name}` : '// ОЖИДАНИЕ ФАЙЛА...')}
              </div>
            </div>
          </div>

          <div style={{ marginTop: 20, padding: '14px 16px', background: 'rgba(0,255,240,0.04)', border: '1px solid rgba(0,255,240,0.1)', borderLeft: '2px solid var(--accent)' }}>
            <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: 'var(--subtext)', lineHeight: 1.7 }}>
              {mode === 'youtube' ? (
                <>
                  <div style={{ color: 'var(--accent)', marginBottom: 6 }}>// КАК ДОБАВИТЬ:</div>
                  <div>1. Открой видео на YouTube</div>
                  <div>2. Скопируй ссылку из адресной строки</div>
                  <div>3. Вставь её в поле выше</div>
                </>
              ) : (
                <>
                  <div style={{ color: 'var(--accent)', marginBottom: 6 }}>// ЗАГРУЗКА С ПК:</div>
                  <div>• Форматы: MP4, WebM, MOV</div>
                  <div>• Максимальный размер: 100MB</div>
                  <div>• Видео будет доступно без VPN</div>
                </>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
