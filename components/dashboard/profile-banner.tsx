'use client'

import { useAuth } from '@/lib/auth-context'

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }
  return name.slice(0, 2).toUpperCase() || 'HG'
}

export function ProfileBanner() {
  const { user, profile } = useAuth()

  const displayName = profile?.displayName || user?.displayName || 'Nguyễn Ngọc Khánh'
  const email = profile?.email || user?.email || 'khanh.nguyen@email.com'
  const level = profile?.level ?? 12
  const xp = profile?.xp ?? 2450
  const streak = profile?.streak ?? 15
  const nextLevelXp = level * 250
  const progressPercent = Math.min(100, Math.round((xp / Math.max(nextLevelXp, 1)) * 100)) || 10

  return (
    <section className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-r from-[#2a1356] via-card to-card p-6">
      <div aria-hidden="true" className="absolute -right-10 -top-20 size-64 rounded-full bg-primary/30 blur-3xl" />
      <div className="relative flex flex-col gap-6 md:flex-row md:items-center">
        <span className="flex size-20 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-400 to-primary text-2xl font-bold ring-4 ring-primary/30">
          {getInitials(displayName)}
        </span>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold">{displayName}</h1>
            <span className="rounded-full bg-primary px-3 py-0.5 text-xs font-bold">Cấp {level}</span>
          </div>
          <p className="text-sm text-muted-foreground">{email}</p>
          <div className="mt-4 max-w-md">
            <div className="flex justify-between text-sm">
              <span className="font-semibold">{xp.toLocaleString('vi-VN')} XP</span>
              <span className="text-muted-foreground">
                {nextLevelXp.toLocaleString('vi-VN')} XP để lên Cấp {level + 1}
              </span>
            </div>
            <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-violet-400 to-primary transition-all"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>
        <span className="self-start rounded-2xl border border-orange-500/30 bg-orange-500/10 px-4 py-3 font-semibold text-orange-300 md:self-center">
          <span aria-hidden="true">🔥</span> {streak} ngày liên tiếp
        </span>
      </div>
    </section>
  )
}
