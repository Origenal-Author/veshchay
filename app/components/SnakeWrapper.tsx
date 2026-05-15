'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'

const SnakeGame = dynamic(() => import('./SnakeGame'), { ssr: false })

export default function SnakeWrapper() {
  const [show, setShow] = useState(true) // показываем сразу при загрузке

  useEffect(() => {
    // Авто-закрытие через 4 секунды после загрузки страницы
    const timer = setTimeout(() => {
      setShow(false)
    }, 4000)

    // Если страница загрузилась быстро — закроем раньше
    function onLoad() {
      clearTimeout(timer)
      setTimeout(() => setShow(false), 1500) // 1.5 сек после загрузки
    }

    if (document.readyState === 'complete') {
      onLoad()
    } else {
      window.addEventListener('load', onLoad)
    }

    return () => {
      clearTimeout(timer)
      window.removeEventListener('load', onLoad)
    }
  }, [])

  if (!show) return null
  return <SnakeGame onClose={() => setShow(false)} />
}
