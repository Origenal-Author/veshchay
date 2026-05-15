'use client'

import { useEffect, useState } from 'react'
import AttackModal from './AttackModal'
import type { Pet } from '@/lib/pets'

export default function AttackButton({ targetId, targetUsername }: { targetId: string; targetUsername: string }) {
  const [status, setStatus] = useState<'loading' | 'ready' | 'cooldown' | 'disabled'>('loading')
  const [virusPets, setVirusPets] = useState<Pet[]>([])
  const [showModal, setShowModal] = useState(false)
  const [cooldownUntil, setCooldownUntil] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/attack?targetId=${targetId}`)
      .then(r => r.json())
      .then(data => {
        if (data.canAttack) {
          setStatus('ready')
          setVirusPets(data.virusPets ?? [])
        } else if (data.reason === 'cooldown') {
          setStatus('cooldown')
          setCooldownUntil(data.until)
        } else {
          setStatus('disabled')
        }
      })
      .catch(() => setStatus('disabled'))
  }, [targetId])

  if (status === 'loading' || status === 'disabled') return null

  if (status === 'cooldown') {
    const until = cooldownUntil ? new Date(cooldownUntil) : null
    const hoursLeft = until ? Math.ceil((until.getTime() - Date.now()) / 3600000) : '?'
    return (
      <div style={{
        fontFamily: 'JetBrains Mono,monospace', fontSize: 9,
        color: '#3A4A5A', letterSpacing: 2, padding: '7px 14px',
        border: '1px solid rgba(255,0,110,0.15)', borderRadius: 6,
      }}>
        ⚡ ВЗЛОМАН {hoursLeft}ч назад · кулдаун
      </div>
    )
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        style={{
          fontFamily: 'Orbitron,monospace', fontSize: 9, letterSpacing: 3,
          padding: '7px 16px', borderRadius: 6,
          border: '1px solid rgba(255,0,110,0.4)', color: '#FF006E',
          background: 'rgba(255,0,110,0.06)', cursor: 'pointer',
          transition: 'all 0.2s',
          boxShadow: '0 0 10px rgba(255,0,110,0.1)',
        }}
      >
        ⚡ АТАКОВАТЬ
      </button>

      {showModal && (
        <AttackModal
          targetId={targetId}
          targetUsername={targetUsername}
          virusPets={virusPets}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  )
}
