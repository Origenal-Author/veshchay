import { createClient } from '@/lib/supabase-server'
import { createClient as createSupabase } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { buildSystemPrompt, instantReply } from '@/lib/petChat'
import type { Pet } from '@/lib/pets'

const serviceClient = createSupabase(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const SPAM_WINDOW_MS = 30_000
const SPAM_THRESHOLD = 5
const TIRED_DURATION_MS = 60_000

type GroqMessage = { role: 'system' | 'user' | 'assistant'; content: string }

async function callGroq(messages: GroqMessage[]): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) throw new Error('GROQ_API_KEY not configured')

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages,
      max_tokens: 120,
      temperature: 0.85,
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Groq error ${res.status}: ${text.slice(0, 200)}`)
  }
  const data = await res.json()
  const reply = data?.choices?.[0]?.message?.content
  if (typeof reply !== 'string') throw new Error('No reply from model')
  return reply.trim()
}

// Снимаем смайлики/emoji которые модель может прокинуть — они показываются автоматически на лице
function stripEmoji(s: string): string {
  return s
    .replace(/[\u{1F300}-\u{1FAFF}]/gu, '')
    .replace(/[\u{2600}-\u{27BF}]/gu, '')
    .replace(/[\u{1F000}-\u{1F2FF}]/gu, '')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null) as { petId?: string; message?: string } | null
  if (!body?.petId || !body?.message?.trim()) {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 })
  }
  const message = body.message.trim().slice(0, 500)

  // Проверяем владение питомцем
  const { data: pet } = await supabase
    .from('pets').select('*').eq('id', body.petId).eq('user_id', user.id).single()
  if (!pet) return NextResponse.json({ error: 'Pet not found' }, { status: 404 })

  // Проверка на спам: сколько user-сообщений за последние SPAM_WINDOW_MS
  const since = new Date(Date.now() - SPAM_WINDOW_MS).toISOString()
  const { count: recentCount } = await serviceClient
    .from('pet_messages')
    .select('*', { count: 'exact', head: true })
    .eq('pet_id', body.petId)
    .eq('user_id', user.id)
    .eq('role', 'user')
    .gte('created_at', since)

  if ((recentCount ?? 0) >= SPAM_THRESHOLD) {
    // Питомец устал
    const tiredReplies = pet.variant === 'virus'
      ? ['ОТВАЛИ Я УСТАЛ!', 'хватит спамить мне в мозги', 'я перегрелся, отстань на минуту']
      : ['уф... я немного устал, давай позже', 'дай отдохнуть чуть-чуть', 'устал болтать, отдохну']
    const tired = tiredReplies[Math.floor(Math.random() * tiredReplies.length)]
    return NextResponse.json({ reply: tired, mood: 'sleeping', tired: true, tiredUntilMs: TIRED_DURATION_MS })
  }

  // Мгновенный ответ на мяу/гав без обращения к LLM
  const instant = instantReply(message, pet.variant === 'virus')
  if (instant) {
    await serviceClient.from('pet_messages').insert([
      { pet_id: body.petId, user_id: user.id, role: 'user', content: message },
      { pet_id: body.petId, user_id: user.id, role: 'pet',  content: instant.reply },
    ])
    return NextResponse.json({ reply: instant.reply, mood: instant.mood, tired: false })
  }

  // Полноценный ответ через Groq
  // Берём последние 20 сообщений как контекст (память)
  const { data: history } = await serviceClient
    .from('pet_messages')
    .select('role, content')
    .eq('pet_id', body.petId)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20)

  const reversed = (history ?? []).reverse()
  const llmMessages: GroqMessage[] = [
    { role: 'system', content: buildSystemPrompt(pet as Pet) },
    ...reversed.map(m => ({
      role: (m.role === 'pet' ? 'assistant' : 'user') as 'assistant' | 'user',
      content: m.content,
    })),
    { role: 'user', content: message },
  ]

  let reply: string
  try {
    reply = stripEmoji(await callGroq(llmMessages)).slice(0, 280)
    if (!reply) throw new Error('Empty reply')
  } catch (err) {
    console.error('[pets/chat] LLM error:', err)
    // Fallback на простые фразы, чтобы UI не падал
    const fallback = pet.variant === 'virus'
      ? ['не отвечу', 'отстань', 'мне скучно', 'и чо?']
      : ['хм... не понимаю', 'расскажи ещё', 'интересно', 'хорошо']
    reply = fallback[Math.floor(Math.random() * fallback.length)]
  }

  // Сохраняем оба сообщения в БД
  await serviceClient.from('pet_messages').insert([
    { pet_id: body.petId, user_id: user.id, role: 'user', content: message },
    { pet_id: body.petId, user_id: user.id, role: 'pet',  content: reply },
  ])

  // Определяем mood для UI (для разнообразия)
  const lower = reply.toLowerCase()
  let mood: 'happy' | 'annoyed' | 'idle' = 'idle'
  if (pet.variant === 'virus') {
    mood = /[!?]{2,}|отвал|тупой|придурок|дебил|бесит|отстань/i.test(reply) ? 'annoyed' : 'idle'
  } else {
    mood = /спасибо|круто|здорово|интересно|приятно|рад/i.test(lower) ? 'happy' : 'idle'
  }

  return NextResponse.json({ reply, mood, tired: false })
}
