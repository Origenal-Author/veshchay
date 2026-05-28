'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'

const SnakeGame = dynamic(() => import('./SnakeGame'), { ssr: false })

const SNAKE_DONE_KEY = 'veshchay_snake_intro_done'

export default function SnakeWrapper() {
  // SSR / первый render — не показываем, решаем после монтирования (избегаем гидрейшн-мисматча)
  const [show, setShow] = useState(false)

  useEffect(() => {
    try {
      if (!localStorage.getItem(SNAKE_DONE_KEY)) setShow(true)
    } catch {
      setShow(true)
    }
  }, [])

  function handleClose() {
    try { localStorage.setItem(SNAKE_DONE_KEY, '1') } catch {}
    setShow(false)
  }

  if (!show) return null
  return <SnakeGame onClose={handleClose} />
}
