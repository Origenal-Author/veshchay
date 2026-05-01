'use client'

import { useState, useEffect } from 'react'
import PuzzleGate from '@/app/components/PuzzleGate'

export default function ProfileClient({
  profileId,
  currentUserId,
  children,
}: {
  profileId: string
  currentUserId: string | null
  children: React.ReactNode
}) {
  const isOwner = profileId === currentUserId
  const [unlocked, setUnlocked] = useState(isOwner)

  useEffect(() => {
    if (isOwner) return
    const key = `profile_unlocked_${profileId}`
    if (sessionStorage.getItem(key)) setUnlocked(true)
  }, [isOwner, profileId])

  function handleSolve() {
    sessionStorage.setItem(`profile_unlocked_${profileId}`, '1')
    setUnlocked(true)
  }

  if (!unlocked) return <PuzzleGate onSolve={handleSolve} />
  return <>{children}</>
}
