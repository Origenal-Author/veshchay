'use client'

import { useState } from 'react'

type Pet = { id: string; type: string; stage: string; variant: string }

const PET_NAMES: Record<string, string> = {
  ghost: 'ПРИЗРАК', virus: 'ВИРУС', spider: 'ПАУК', worm: 'ЧЕРВЬ',
  firefly: 'СВЕТЛЯЧОК', crystal: 'КРИСТАЛЛ', shadow: 'ТЕНЬ', glitch: 'ГЛИТЧ',
}

export default function BorrowPetButton({
  ownerId, ownerName, isFriend,
}: {
  ownerId: string; ownerName: string; isFriend: boolean
}) {
  const [open, setOpen] = useState(false)
  const [pets, setPets] = useState<Pet[]>([])
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  if (!isFriend) return null

  async function openModal() {
    setLoading(true)
    const res = await fetch(`/api/pets/list?userId=${ownerId}`)
    const data = await res.json()
    setPets((data.pets ?? []).filter((p: Pet) => p.stage !== 'egg'))
    setOpen(true)
    setLoading(false)
  }

  async function request(petId: string, hours: number) {
    setLoading(true)
    await fetch('/api/pets/borrow', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ petId, ownerId, durationHours: hours }),
    })
    setSent(true)
    setLoading(false)
  }

  return (
    <>
      <button
        onClick={openModal}
        disabled={loading || sent}
        style={{
          fontFamily: "'JetBrains Mono',monospace", fontSize: 10, letterSpacing: 2,
          padding: '8px 14px', borderRadius: 6, cursor: sent ? 'default' : 'pointer',
          border: '1px solid rgba(255,179,0,0.3)',
          background: 'rgba(255,179,0,0.06)', color: '#FFB300',
          opacity: loading ? 0.6 : 1, transition: 'all 0.2s',
        }}
      >
        {sent ? '☄ ЗАПРОС ОТПРАВЛЕН' : loading ? '...' : '☄ ЗАНЯТЬ ПИТОМЦА'}
      </button>

      {open && !sent && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 10000,
          background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }} onClick={() => setOpen(false)}>
          <div style={{
            background: 'rgba(6,6,18,0.98)', border: '1px solid rgba(255,179,0,0.2)',
            borderRadius: 14, padding: 24, width: 320, maxHeight: '80vh', overflowY: 'auto',
          }} onClick={e => e.stopPropagation()}>
            <div style={{ fontFamily: 'Orbitron,monospace', fontSize: 11, letterSpacing: 3, color: '#FFB300', marginBottom: 16 }}>
              // ПИТОМЦЫ @{ownerName}
            </div>

            {pets.length === 0 ? (
              <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: '#506080', textAlign: 'center', padding: '20px 0' }}>
                Нет доступных питомцев
              </div>
            ) : pets.map(pet => (
              <div key={pet.id} style={{
                padding: '12px', borderRadius: 8, marginBottom: 8,
                border: '1px solid rgba(255,255,255,0.06)',
                background: 'rgba(255,255,255,0.02)',
              }}>
                <div style={{ fontFamily: 'Orbitron,monospace', fontSize: 10, color: '#E0E8F0', marginBottom: 8, letterSpacing: 1 }}>
                  {PET_NAMES[pet.type] ?? pet.type} · {pet.variant === 'virus' ? 'ВИРУС' : 'КОД'} · {pet.stage === 'baby' ? 'ДЕТЁНЫШ' : 'ВЗРОСЛЫЙ'}
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => request(pet.id, 1)} disabled={loading} style={{
                    flex: 1, padding: '6px 0', fontFamily: 'JetBrains Mono,monospace', fontSize: 9,
                    letterSpacing: 1, border: '1px solid rgba(255,179,0,0.3)', background: 'rgba(255,179,0,0.08)',
                    color: '#FFB300', borderRadius: 4, cursor: 'pointer',
                  }}>НА 1 ЧАС</button>
                  <button onClick={() => request(pet.id, 24)} disabled={loading} style={{
                    flex: 1, padding: '6px 0', fontFamily: 'JetBrains Mono,monospace', fontSize: 9,
                    letterSpacing: 1, border: '1px solid rgba(255,179,0,0.3)', background: 'rgba(255,179,0,0.08)',
                    color: '#FFB300', borderRadius: 4, cursor: 'pointer',
                  }}>НА 24 ЧАСА</button>
                </div>
              </div>
            ))}
            <button onClick={() => setOpen(false)} style={{
              width: '100%', marginTop: 8, padding: '8px 0',
              fontFamily: 'JetBrains Mono,monospace', fontSize: 9, letterSpacing: 2,
              background: 'none', border: '1px solid rgba(255,255,255,0.08)',
              color: '#506080', borderRadius: 6, cursor: 'pointer',
            }}>ЗАКРЫТЬ</button>
          </div>
        </div>
      )}
    </>
  )
}
