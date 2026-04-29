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
    if (val === '') {
      startTransition(() => router.push('/'))
    }
  }

  return (
    <form onSubmit={handleSubmit} className="relative w-full max-w-xl">
      <input
        type="text"
        value={query}
        onChange={handleChange}
        placeholder="ПОИСК ВИДЕО..."
        className="w-full px-5 py-3 text-sm tracking-widest outline-none pr-12"
        style={{
          background: 'rgba(0,255,240,0.05)',
          border: '1px solid rgba(0,255,240,0.25)',
          color: '#fff',
          opacity: isPending ? 0.7 : 1,
        }}
      />
      <button
        type="submit"
        className="absolute right-4 top-1/2 -translate-y-1/2"
        style={{ color: '#00FFF0' }}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
      </button>
    </form>
  )
}
