'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'

const SnakeGame = dynamic(() => import('./SnakeGame'), { ssr: false })

export default function SnakeWrapper() {
  const [show, setShow] = useState(true) // показываем сразу при загрузке

  useEffect(() => {
    // Закрывается только когда пользователь собрал 7 файлов или нажал ПРОПУСТИТЬ
  }, [])

  if (!show) return null
  return <SnakeGame onClose={() => setShow(false)} />
}
