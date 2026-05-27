export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import ProfileClient from './ProfileClient'
import FollowButton from '@/app/components/FollowButton'
import FriendButton from '@/app/components/FriendButton'
import ClanEmblem from '@/app/components/ClanEmblem'
import BorrowPetButton from '@/app/components/BorrowPetButton'
import AchievementsGrid from '@/app/components/AchievementsGrid'
import AttackButton from '@/app/components/AttackButton'
import ProfileGraffiti from '@/app/components/ProfileGraffiti'
import { getPreset } from '@/lib/presetAvatars'
import VerifiedBadge from '@/app/components/VerifiedBadge'

const RANKS = [
  { xp: 0,     rank: 'СТАТИЧЕСКИЙ ШУМ',  color: '#8892B0' },
  { xp: 75,    rank: 'ПИНГ',              color: '#64B5F6' },
  { xp: 200,   rank: 'ОПЕРАТИВНИК',       color: '#00FFF0' },
  { xp: 500,   rank: 'ВЗЛОМЩИК',          color: '#00FF88' },
  { xp: 1000,  rank: 'АГЕНТ',             color: '#7AAED4' },
  { xp: 2000,  rank: 'ПРИЗРАК',           color: '#9B10FF' },
  { xp: 4000,  rank: 'НЕЙРОМАНТ',         color: '#FFB300' },
  { xp: 7500,  rank: 'ТЕНЕВОЙ АРХИТЕКТ',  color: '#FF7B00' },
  { xp: 15000, rank: 'СИСТЕМНЫЙ БОГ',     color: '#FF006E' },
  { xp: 30000, rank: 'РУТОВЫЙ ДОСТУП',    color: '#FFFFFF' },
]

const SPECIAL_ROLES: Record<string, { label: string; color: string; glow: string; badge: string }> = {
  creator: { label: 'ПЕРВОСИГНАЛ',    color: '#FFD700', glow: 'rgba(255,215,0,0.4)',   badge: '⚡' },
  admin:   { label: 'КУРАТОР ЭФИРА',  color: '#C084FC', glow: 'rgba(192,132,252,0.35)', badge: '◈' },
}

function getRankInfo(xp: number) {
  return [...RANKS].reverse().find(r => xp >= r.xp) ?? RANKS[0]
}

function getNextRank(xp: number) {
  return RANKS.find(r => xp < r.xp)
}

function getFollowLabel(n: number): string {
  const m10 = n % 10, m100 = n % 100
  if (m100 >= 11 && m100 <= 14) return 'наблюдают'
  if (m10 === 1) return 'наблюдает'
  if (m10 >= 2 && m10 <= 4) return 'наблюдают'
  return 'наблюдают'
}

export default async function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', id).single()
  if (!profile) notFound()

  const { data: { user } } = await supabase.auth.getUser()
  const isOwner = user?.id === id

  const { data: videos } = await supabase.from('videos').select('*').eq('user_id', id).order('created_at', { ascending: false })

  const { data: userAchievements } = await supabase
    .from('achievements').select('key').eq('user_id', id)

  const { count: followersCount } = await supabase
    .from('follows').select('*', { count: 'exact', head: true }).eq('following_id', id)

  // Кланы профиля
  const { data: clanMemberships } = await supabase.from('clan_members')
    .select('role, clan:clans(id, name, tag, emblem_symbols, emblem_color)')
    .eq('user_id', id)

  // Друзья профиля
  const { data: friendRows } = await supabase
    .from('friend_requests')
    .select('sender_id, receiver_id')
    .or(`sender_id.eq.${id},receiver_id.eq.${id}`)
    .eq('status', 'accepted')

  const friendIds = (friendRows ?? []).map(r => r.sender_id === id ? r.receiver_id : r.sender_id)
  const { data: friendProfiles } = friendIds.length > 0
    ? await supabase.from('profiles').select('id, username, avatar_url, rank, xp').in('id', friendIds)
    : { data: [] }

  const onlineSince = new Date(Date.now() - 2 * 60 * 1000).toISOString()
  const { data: onlineRows } = friendIds.length > 0
    ? await supabase.from('presence').select('user_id').in('user_id', friendIds).gte('last_seen', onlineSince)
    : { data: [] }
  const onlineSet = new Set((onlineRows ?? []).map(r => r.user_id))

  const { data: hackEffects } = await supabase
    .from('hack_effects')
    .select('*')
    .eq('victim_id', id)
    .is('cleaned_at', null)
    .gt('expires_at', new Date().toISOString())
    .in('effect_type', ['graffiti', 'avatar_override'])

  const graffitiEffects = (hackEffects ?? []).filter(e => e.effect_type === 'graffiti')
  const avatarOverride = (hackEffects ?? []).find(e => e.effect_type === 'avatar_override') ?? null

  const isFollowing = user && !isOwner
    ? !!(await supabase.from('follows').select('id')
        .eq('follower_id', user.id).eq('following_id', id).maybeSingle()).data
    : false

  let friendStatus: 'none' | 'pending_sent' | 'pending_received' | 'friends' = 'none'
  let friendRequestId: string | null = null
  if (user && !isOwner) {
    const { data: fr } = await supabase
      .from('friend_requests').select('id, status, sender_id')
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${id}),and(sender_id.eq.${id},receiver_id.eq.${user.id})`)
      .maybeSingle()
    if (fr) {
      friendRequestId = fr.id
      if (fr.status === 'accepted') friendStatus = 'friends'
      else if (fr.status === 'pending') {
        friendStatus = fr.sender_id === user.id ? 'pending_sent' : 'pending_received'
      }
    }
  }

  const xp = profile.xp || 0
  const rankInfo = getRankInfo(xp)
  const nextRank = getNextRank(xp)
  const progress = nextRank ? Math.round((xp / nextRank.xp) * 100) : 100
  const specialRole = SPECIAL_ROLES[profile.role ?? ''] ?? null
  const displayColor = specialRole?.color ?? rankInfo.color
  const displayRank = specialRole?.label ?? rankInfo.rank

  const profileContent = (
    <div style={{ minHeight: '100vh', position: 'relative', zIndex: 2, paddingBottom: 60 }}>
      <header className="site-header">
        <Link href="/" className="site-logo">ВЕЩАЙ</Link>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 10 }}>
          {isOwner && <Link href="/history" className="btn-ghost-ui">ИСТОРИЯ</Link>}
          {isOwner && <Link href="/clans/create" className="btn-ghost-ui">⬡ КЛАН</Link>}
          {isOwner && <Link href="/profile/edit" className="btn-primary-ui">РЕДАКТИРОВАТЬ</Link>}
          <Link href="/" className="btn-ghost-ui">← ГЛАВНАЯ</Link>
        </div>
      </header>

      <main className="mobile-pad" style={{ maxWidth: 960, margin: '0 auto', padding: '40px 32px' }}>
        {/* Шапка профиля */}
        <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: 32, alignItems: 'start', marginBottom: 40, padding: 32, background: 'var(--surface)', border: '1px solid var(--border)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${rankInfo.color}, transparent)` }} />

          {/* Аватар */}
          <div style={{ width: 80, height: 80, background: `linear-gradient(135deg, ${displayColor}, var(--surface2))`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 900, color: 'var(--bg)', fontFamily: "'Orbitron',monospace", border: `2px solid ${avatarOverride ? '#FF006E' : displayColor}`, boxShadow: `0 0 20px ${avatarOverride ? 'rgba(255,0,110,0.5)' : displayColor + '40'}`, overflow: 'hidden', position: 'relative' }}>
            {avatarOverride ? (() => {
              const p = getPreset(avatarOverride.effect_data?.preset ?? '')
              return <div style={{ width: '100%', height: '100%', background: p.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Orbitron,monospace', fontSize: 18, fontWeight: 700, color: p.fg }}>{p.text}</div>
            })() : profile.avatar_url
              ? <img src={profile.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : (profile.username || '??').slice(0, 2).toUpperCase()
            }
            {specialRole && (
              <div style={{ position: 'absolute', bottom: -2, right: -2, width: 22, height: 22, borderRadius: '50%', background: specialRole.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, boxShadow: `0 0 8px ${specialRole.glow}`, border: '1.5px solid rgba(0,0,0,0.5)' }}>
                {specialRole.badge}
              </div>
            )}
          </div>

          {/* Инфо */}
          <div>
            <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: displayColor, letterSpacing: 3, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
              {specialRole ? (
                <span style={{ background: `rgba(${displayColor === '#FFD700' ? '255,215,0' : '192,132,252'},0.12)`, border: `1px solid ${displayColor}`, padding: '2px 8px', borderRadius: 4, boxShadow: `0 0 8px ${specialRole.glow}`, letterSpacing: 3 }}>
                  {specialRole.badge} {specialRole.label}
                </span>
              ) : (
                `// ${rankInfo.rank}`
              )}
            </div>
            <h1 style={{ fontFamily: "'Orbitron',monospace", fontSize: 22, fontWeight: 900, color: 'var(--text)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
              <span>@{profile.username || 'аноним'}</span>
              {profile.verified && <VerifiedBadge size={20} />}
            </h1>
            {profile.bio && <p style={{ fontFamily: "'Exo 2',sans-serif", fontSize: 14, color: 'var(--subtext)', lineHeight: 1.6 }}>{profile.bio}</p>}
          </div>

          {/* Кнопка мониторинга + XP */}
          <div style={{ textAlign: 'right', minWidth: 160, display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'flex-end' }}>
            {/* Значок ВЗЛОМАН */}
            {!isOwner && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
                <FollowButton
                  targetId={id}
                  initialFollowing={isFollowing}
                  initialCount={followersCount ?? 0}
                  currentUserId={user?.id ?? null}
                />
                <FriendButton
                  targetId={id}
                  initialStatus={friendStatus}
                  initialRequestId={friendRequestId}
                  currentUserId={user?.id ?? null}
                />
                {user && <AttackButton targetId={id} targetUsername={profile.username || 'аноним'} />}
                <BorrowPetButton ownerId={id} ownerName={profile.username || 'аноним'} isFriend={friendStatus === 'friends'} />
                {friendStatus === 'friends' && user && (
                  <a href={`/messages/${id}`} style={{
                    fontFamily: "'JetBrains Mono',monospace", fontSize: 10, letterSpacing: 2,
                    padding: '8px 14px', borderRadius: 6, border: '1px solid rgba(0,255,240,0.25)',
                    background: 'rgba(0,255,240,0.06)', color: 'var(--accent)', textDecoration: 'none',
                  }}>✉ НАПИСАТЬ</a>
                )}
              </div>
            )}
            {/* Значок ВЗЛОМАН */}
            {profile.hacked_until && new Date(profile.hacked_until) > new Date() && (
              <div style={{
                fontFamily: 'JetBrains Mono,monospace', fontSize: 9, letterSpacing: 3,
                color: '#FF006E', border: '1px solid #FF006E',
                background: 'rgba(255,0,110,0.08)', padding: '3px 10px', borderRadius: 4,
                boxShadow: '0 0 10px rgba(255,0,110,0.2)',
                animation: 'glitchFlash 3s ease infinite',
              }}>
                ☠ ВЗЛОМАН
              </div>
            )}
            {isOwner && (followersCount ?? 0) > 0 && (
              <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 9, color: '#3A5060', letterSpacing: 2 }}>
                {followersCount} {getFollowLabel(followersCount ?? 0)}
              </div>
            )}
            <div style={{ fontFamily: "'Orbitron',monospace", fontSize: 28, fontWeight: 900, color: displayColor, textShadow: `0 0 20px ${displayColor}` }}>
              {xp}
            </div>
            <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: 'var(--subtext)', letterSpacing: 2, marginBottom: 8 }}>XP</div>
            <div style={{ background: 'var(--surface2)', height: 4, borderRadius: 2, overflow: 'hidden', marginBottom: 4 }}>
              <div style={{ height: '100%', width: `${progress}%`, background: rankInfo.color, boxShadow: `0 0 8px ${rankInfo.color}`, transition: 'width 0.5s' }} />
            </div>
            {nextRank && (
              <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: 'var(--subtext)' }}>
                до {nextRank.rank}: {nextRank.xp - xp} XP
              </div>
            )}
            {!nextRank && <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: rankInfo.color }}>MAX RANK ✦</div>}
          </div>
        </div>

        {/* Граффити и взломанный аватар */}
        <ProfileGraffiti
          graffitiEffects={graffitiEffects}
          avatarOverride={avatarOverride}
          isOwner={isOwner}
        />

        {/* Кланы */}
        {(clanMemberships ?? []).length > 0 && (
          <div style={{ marginBottom: 40 }}>
            <div style={{ fontFamily: "'Orbitron',monospace", fontSize: 12, fontWeight: 700, letterSpacing: 3, color: 'var(--accent)', marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>
              // ОРГАНИЗАЦИИ
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {(clanMemberships ?? []).map((m: any) => {
                const c = m.clan
                const color = c.emblem_color || '#00FFF0'
                return (
                  <Link key={c.id} href={`/clans/${c.id}`} style={{ textDecoration: 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 10, background: 'var(--surface)', border: `1px solid rgba(${parseInt(color.slice(1,3),16)},${parseInt(color.slice(3,5),16)},${parseInt(color.slice(5,7),16)},0.25)` }}>
                      <ClanEmblem symbols={c.emblem_symbols ?? []} color={color} size={36} />
                      <div>
                        <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color, letterSpacing: 2 }}>[{c.tag}]</div>
                        <div style={{ fontFamily: "'Orbitron',monospace", fontSize: 11, fontWeight: 700, color: 'var(--text)', letterSpacing: 1 }}>{c.name}</div>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        )}
        {/* Список друзей */}
        {(friendProfiles ?? []).length > 0 && (
          <div style={{ marginBottom: 40 }}>
            <div style={{ fontFamily: "'Orbitron',monospace", fontSize: 12, fontWeight: 700, letterSpacing: 3, color: 'var(--accent)', marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>
              // СЕТЬ КОНТАКТОВ ({friendProfiles!.length})
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {friendProfiles!.map(f => (
                <Link key={f.id} href={`/profile/${f.id}`} style={{ textDecoration: 'none' }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 14px', borderRadius: 10,
                    background: 'var(--surface)', border: '1px solid var(--border)',
                    transition: 'border-color 0.2s',
                  }}>
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: 8, overflow: 'hidden',
                        background: 'linear-gradient(135deg, var(--accent), var(--surface2))',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontFamily: "'Orbitron',monospace", fontSize: 12, fontWeight: 900, color: 'var(--bg)',
                        border: '1px solid var(--accent)',
                      }}>
                        {f.avatar_url
                          ? <img src={f.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          : (f.username || '??').slice(0, 2).toUpperCase()
                        }
                      </div>
                      <div style={{
                        position: 'absolute', bottom: -2, right: -2,
                        width: 10, height: 10, borderRadius: '50%',
                        background: onlineSet.has(f.id) ? '#00FF88' : '#2A3240',
                        border: '2px solid var(--bg)',
                        boxShadow: onlineSet.has(f.id) ? '0 0 6px rgba(0,255,136,0.6)' : 'none',
                      }} />
                    </div>
                    <div>
                      <div style={{ fontFamily: "'Orbitron',monospace", fontSize: 11, fontWeight: 700, color: 'var(--text)', letterSpacing: 1 }}>
                        @{f.username || 'аноним'}
                      </div>
                      <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 8, color: 'var(--accent)', letterSpacing: 2, marginTop: 2 }}>
                        {f.rank || 'СТАТИЧЕСКИЙ ШУМ'}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Видео пользователя */}
        {videos && videos.length > 0 && (
          <div>
            <div style={{ fontFamily: "'Orbitron',monospace", fontSize: 12, fontWeight: 700, letterSpacing: 3, color: 'var(--accent)', marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>
              // СИГНАЛЫ ПОЛЬЗОВАТЕЛЯ ({videos.length})
            </div>
            <div className="profile-video-grid">
              {videos.map(v => (
                <Link key={v.id} href={`/videos/${v.id}`} className="video-card">
                  <div className="video-card-thumb">
                    {v.video_type === 'upload'
                      ? <div style={{ width: '100%', height: '100%', background: 'rgba(0,255,240,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>🎬</div>
                      : <img src={`https://img.youtube.com/vi/${v.youtube_id}/mqdefault.jpg`} alt={v.title} />
                    }
                    <div className="video-card-play">
                      <div className="play-icon">
                        <svg viewBox="0 0 24 24" fill="none" width="14" height="14"><path d="M8 5.14v14l11-7-11-7z" fill="currentColor" style={{ color: 'var(--accent)' }} /></svg>
                      </div>
                    </div>
                  </div>
                  <div className="video-card-body">
                    <div className="video-card-title">{v.title}</div>
                    <div className="video-card-date">{new Date(v.created_at).toLocaleDateString('ru-RU')}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
        {/* Ачивки */}
        <AchievementsGrid
          unlockedKeys={(userAchievements ?? []).map(a => a.key)}
          isOwner={isOwner}
        />
      </main>
    </div>
  )

  return (
    <ProfileClient profileId={id} currentUserId={user?.id ?? null}>
      {profileContent}
    </ProfileClient>
  )
}
