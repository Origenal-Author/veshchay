'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'

const SnakeGame = dynamic(() => import('./SnakeGame'), { ssr: false })

export default function SnakeWrapper() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const seen = sessionStorage.getItem('snake_seen')
    if (!seen) {
      setShow(true)
      sessionStorage.setItem('snake_seen', '1')
    }
  }, [])

  if (!show) return null
  return <SnakeGame onClose={() => setShow(false)} />
}
