'use client'

import { useState, useEffect } from 'react'
import PetWalker from './PetWalker'
import type { Pet } from '@/lib/pets'

export default function PetWalkerHost() {
  const [pet, setPet] = useState<Pet | null>(null)

  useEffect(() => {
    function onStart(e: Event) {
      const p = (e as CustomEvent<{ pet: Pet }>).detail?.pet
      if (p) setPet(p)
    }
    function onStop() {
      setPet(null)
    }
    window.addEventListener('pet-walk-start', onStart)
    window.addEventListener('pet-walk-stop', onStop)
    return () => {
      window.removeEventListener('pet-walk-start', onStart)
      window.removeEventListener('pet-walk-stop', onStop)
    }
  }, [])

  if (!pet) return null
  return (
    <PetWalker
      pet={pet}
      onReturn={() => {
        window.dispatchEvent(new CustomEvent('pet-walk-stop'))
        setPet(null)
      }}
    />
  )
}
