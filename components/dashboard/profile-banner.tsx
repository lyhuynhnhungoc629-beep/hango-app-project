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

  const displayName = profile?.displayName || user?.displayName || 'Học viên HANGO'
  const email = profile?.email || user?.email || 'Chưa đăng nhập'
  const level = profile?.level ?? 1
  const xp = profile?.xp ?? 0
  const streak = profile?.streak ?? 0
  const isRootAdmin = Boolean(profile?.isRootAdmin)
  const isAdmin = Boolean(profile?.role === 'admin' || isRootAdmin)
  const nextLevelXp = level * 250
  const progressPercent = Math.min(100, Math.round((xp / Math.max(nextLevelXp, 1)) * 100)) || 5

  // Giao diện tinh gọn dành riêng cho Admin
  if (isAdmin) {
    return (
      <section className="rounded-2xl border-[1.5px] border-slate-800 bg-white p-5 text-slate-900 shadow-[0_2px_0_rgba(15,23,42,0.06)] md:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <span className="flex size-16 shrink-0 items-center justify-center rounded-2xl border-2 border-slate-900 bg-[#2563EB] text-xl font-black text-white shadow-[0_2px_0_rgba(15,23,42,0.15)]">
            {profile?.photoURL ? (
              <img
                src={profile.photoURL}
                alt="Quản trị viên"
                className="size-full rounded-2xl object-cover"
              />
            ) : (
              getInitials('Quản trị viên')
            )}
          </span>
          <div className="flex-1">
            <h1 className="text-2xl font-black tracking-tight text-slate-900 md:text-3xl">
              Quản trị viên
            </h1>
            <p className="mt-1 text-sm text-slate-600">{email}</p>
          </div>
        </div>
      </section>
    )
  }

  // Giao diện dành cho Học viên (Student): Đồng bộ phong cách Lộ trình (Hình 1)
  return (
    <section className="rounded-2xl border-[1.5px] border-slate-800 bg-white p-5 text-slate-900 shadow-[0_2px_0_rgba(15,23,42,0.06)] md:p-6">
      <div className="flex flex-col gap-5 md:flex-row md:items-center">
        <span className="flex size-16 shrink-0 items-center justify-center rounded-2xl border-2 border-slate-900 bg-[#2563EB] text-xl font-black text-white shadow-[0_2px_0_rgba(15,23,42,0.15)]">
          {profile?.photoURL ? (
            <img
              src={profile.photoURL}
              alt={displayName}
              className="size-full rounded-2xl object-cover"
            />
          ) : (
            getInitials(displayName)
          )}
        </span>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-slate-900 md:text-3xl">
              {displayName}
            </h1>
            <span className="rounded-md border border-amber-400 bg-[#FEF08A] px-2.5 py-0.5 text-xs font-bold text-amber-950">
              Cấp {level}
            </span>
            <span className="rounded-md border border-emerald-400 bg-[#DCFCE7] px-2.5 py-0.5 text-xs font-bold text-emerald-900">
              Học viên (Student)
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-600">{email}</p>
          <div className="mt-3.5 max-w-md">
            <div className="flex justify-between text-xs font-semibold">
              <span className="font-bold text-slate-900">{xp.toLocaleString('vi-VN')} XP</span>
              <span className="text-slate-600">
                {nextLevelXp.toLocaleString('vi-VN')} XP để lên Cấp {level + 1}
              </span>
            </div>
            <div className="mt-1.5 h-2.5 overflow-hidden rounded-full border border-slate-800 bg-slate-100">
              <div
                className="h-full rounded-full bg-[#2563EB] transition-all"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>
        <span className="self-start rounded-xl border border-slate-800 bg-[#FEF08A] px-4 py-2.5 text-xs font-bold text-amber-950 shadow-sm md:self-center">
          <span aria-hidden="true">🔥</span> {streak} ngày liên tiếp
        </span>
      </div>
    </section>
  )
}
