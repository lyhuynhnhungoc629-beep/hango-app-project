'use client'

import { ShieldCheck } from 'lucide-react'
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

  const displayName = profile?.displayName || user?.displayName || 'Học viên HANGO'
  const email = profile?.email || user?.email || 'Chưa đăng nhập'
  const level = profile?.level ?? 1
  const xp = profile?.xp ?? 0
  const streak = profile?.streak ?? 0
  const isRootAdmin = Boolean(profile?.isRootAdmin)
  const isAdmin = Boolean(profile?.role === 'admin' || isRootAdmin)
  const nextLevelXp = level * 250
  const progressPercent = Math.min(100, Math.round((xp / Math.max(nextLevelXp, 1)) * 100)) || 5

  // Giao diện tinh gọn dành riêng cho Admin (chỉ giữ lại Avatar, Tên: Quản trị viên, Email; xóa badge, XP và Streak)
  if (isAdmin) {
    return (
      <section className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-r from-[#2a1356] via-card to-card p-6">
        <div aria-hidden="true" className="absolute -right-10 -top-20 size-64 rounded-full bg-primary/30 blur-3xl" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center">
          <span className="flex size-20 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-400 to-primary text-2xl font-bold ring-4 ring-primary/30">
            {profile?.photoURL ? (
              <img
                src={profile.photoURL}
                alt="Quản trị viên"
                className="size-full rounded-full object-cover"
              />
            ) : (
              getInitials('Quản trị viên')
            )}
          </span>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-white">Quản trị viên</h1>
            <p className="mt-1 text-sm text-muted-foreground">{email}</p>
          </div>
        </div>
      </section>
    )
  }

  // Giao diện dành cho Học viên (Student): Giữ nguyên 100% Cấp độ, XP, Thanh tiến trình và Streak
  return (
    <section className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-r from-[#2a1356] via-card to-card p-6">
      <div aria-hidden="true" className="absolute -right-10 -top-20 size-64 rounded-full bg-primary/30 blur-3xl" />
      <div className="relative flex flex-col gap-6 md:flex-row md:items-center">
        <span className="flex size-20 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-400 to-primary text-2xl font-bold ring-4 ring-primary/30">
          {profile?.photoURL ? (
            <img
              src={profile.photoURL}
              alt={displayName}
              className="size-full rounded-full object-cover"
            />
          ) : (
            getInitials(displayName)
          )}
        </span>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl font-bold">{displayName}</h1>
            <span className="rounded-full bg-primary px-3 py-0.5 text-xs font-bold">Cấp {level}</span>
            <span className="rounded-full border border-sky-400/30 bg-sky-500/15 px-3 py-0.5 text-xs font-semibold text-sky-300">
              Học viên (Student)
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{email}</p>
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
