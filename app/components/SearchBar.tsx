'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useTransition } from 'react'

export default function SearchBar() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [query, setQuery] = useState(searchParams.get('q') || '')
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(() => {
      const params = new URLSearchParams()
      if (query.trim()) params.set('q', query.trim())
      router.push(`/?${params.toString()}`)
    })
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value
    setQuery(val)
    if (val === '') startTransition(() => router.push('/'))
  }

  return (
    <form onSubmit={handleSubmit} className="site-search">
      <input
        type="text"
        value={query}
        onChange={handleChange}
        placeholder="> ПОИСК_СИГНАЛА..."
        className="search-input"
        style={{ opacity: isPending ? 0.7 : 1 }}
      />
    </form>
  )
}
