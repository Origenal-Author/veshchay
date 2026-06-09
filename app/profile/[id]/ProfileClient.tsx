'use client'

import { useState, useEffect } from 'react'
import PuzzleGate from '@/app/components/PuzzleGate'

export default function ProfileClient({
  profileId,
  currentUserId,
  gateEnabled = true,
  children,
}: {
  profileId: string
  currentUserId: string | null
  gateEnabled?: boolean
  children: React.ReactNode
}) {
  const isOwner = profileId === currentUserId
  const [unlocked, setUnlocked] = useState(isOwner || !gateEnabled)

  useEffect(() => {
    if (isOwner || !gateEnabled) { setUnlocked(true); return }
    const key = `profile_unlocked_${profileId}`
    if (sessionStorage.getItem(key)) setUnlocked(true)
  }, [isOwner, profileId, gateEnabled])

  function handleSolve() {
    sessionStorage.setItem(`profile_unlocked_${profileId}`, '1')
    setUnlocked(true)
    if (currentUserId && currentUserId !== profileId) {
      fetch('/api/xp/award', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'puzzle', profileId }),
      }).catch(() => {})
    }
  }

  if (!unlocked) return <PuzzleGate onSolve={handleSolve} />
  return <>{children}</>
}
