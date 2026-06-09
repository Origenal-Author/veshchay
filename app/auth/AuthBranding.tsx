// Презентационная колонка-брендинг для страниц авторизации (без интерактива)
export default function AuthBranding() {
  return (
    <div className="hide-mobile" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 60, borderRight: '1px solid var(--border)', position: 'relative', overflow: 'hidden' }}>
      {/* Сетка на фоне */}
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(0,255,240,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(0,255,240,0.03) 1px,transparent 1px)', backgroundSize: '40px 40px' }} />
      {/* Угловые акценты */}
      <div style={{ position: 'absolute', top: 24, left: 24, width: 20, height: 20, borderTop: '2px solid var(--accent)', borderLeft: '2px solid var(--accent)' }} />
      <div style={{ position: 'absolute', top: 24, right: 24, width: 20, height: 20, borderTop: '2px solid var(--accent)', borderRight: '2px solid var(--accent)' }} />
      <div style={{ position: 'absolute', bottom: 24, left: 24, width: 20, height: 20, borderBottom: '2px solid var(--accent)', borderLeft: '2px solid var(--accent)' }} />
      <div style={{ position: 'absolute', bottom: 24, right: 24, width: 20, height: 20, borderBottom: '2px solid var(--accent)', borderRight: '2px solid var(--accent)' }} />

      <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
        <div style={{ fontFamily: "'Orbitron',monospace", fontSize: 52, fontWeight: 900, letterSpacing: 8, color: 'var(--accent)', textShadow: 'var(--logo-shadow)', marginBottom: 16 }}>
          ВЕЩАЙ
        </div>
        <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: 'var(--subtext)', letterSpacing: 4, marginBottom: 48 }}>
          // ВИДЕОХОСТИНГ_НОВОГО_ПОКОЛЕНИЯ
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, textAlign: 'left' }}>
          {['БЕЗ ЦЕНЗУРЫ', 'БЕЗ АЛГОРИТМОВ', 'ТОЛЬКО СИГНАЛ'].map((text, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, fontFamily: "'JetBrains Mono',monospace", fontSize: 13, color: 'var(--subtext)' }}>
              <div style={{ width: 6, height: 6, background: 'var(--accent)', boxShadow: '0 0 8px var(--accent)' }} />
              {text}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
