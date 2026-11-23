'use client'

import Link from 'next/link'
import { BookOpen, LayoutDashboard, LogOut, ShieldCheck, Users } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { cn } from '@/lib/utils'

const items = [
  { id: 'overview', label: 'Tổng quan hệ thống', href: '#admin-overview', icon: LayoutDashboard },
  { id: 'users', label: 'Quản lý tài khoản & Tiến độ', href: '#users-title', icon: Users },
  { id: 'vocab', label: 'Quản lý & Thêm từ vựng', href: '#import-title', icon: BookOpen },
]

export function AdminSidebar() {
  const router = useRouter()
  const { profile, logout } = useAuth()

  const handleLogout = async () => {
    await logout()
    router.push('/auth')
  }

  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r-[1.5px] border-slate-800 bg-white p-4 shadow-[2px_0_0_rgba(15,23,42,0.04)] lg:flex">
      <Link href="/admin" className="flex items-center gap-2.5 rounded-xl px-2 py-1 transition-transform hover:scale-[1.02]">
        <span className="flex size-9 items-center justify-center rounded-xl border-[1.5px] border-slate-800 bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-sm">
          <ShieldCheck className="size-5" aria-hidden="true" />
        </span>
        <span className="text-lg font-black tracking-tight text-slate-900">
          HAN<span className="text-[#7C3AED]">GO</span> <span className="font-bold text-xs uppercase px-1.5 py-0.5 rounded border border-slate-300 bg-slate-100 text-slate-600 ml-1">Admin</span>
        </span>
      </Link>
      <nav aria-label="Quản trị" className="mt-7 flex flex-col gap-1.5">
        {items.map(({ id, label, href, icon: Icon }, idx) => (
          <a
            key={id}
            href={href}
            className={cn(
              'flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition-all',
              idx === 0
                ? 'border-[1.5px] border-slate-800 bg-[#7C3AED] text-white font-bold shadow-[0_2px_0_rgba(15,23,42,0.12)]'
                : 'border border-transparent text-slate-600 hover:border-slate-300 hover:bg-slate-100 hover:text-slate-900',
            )}
          >
            <Icon className={cn('size-5', idx === 0 ? 'text-white' : 'text-slate-500')} aria-hidden="true" />
            {label}
          </a>
        ))}
      </nav>
      <div className="mt-auto flex items-center justify-between gap-2 rounded-2xl border-[1.5px] border-slate-800 bg-slate-50 p-2.5 shadow-[0_2px_0_rgba(15,23,42,0.06)]">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl border-[1.5px] border-slate-800 bg-gradient-to-br from-violet-500 to-[#7C3AED] text-xs font-black text-white shadow-sm">
            {profile?.isRootAdmin ? 'RA' : 'AD'}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-bold text-slate-900">
              {profile?.displayName || 'Quản trị viên'}
            </span>
            <span className="block truncate text-xs font-semibold text-slate-500">
              {profile?.email || ''}
            </span>
          </span>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          title="Đăng xuất"
          aria-label="Đăng xuất"
          className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-colors hover:border-red-300 hover:bg-red-50 hover:text-red-600"
        >
          <LogOut className="size-4" aria-hidden="true" />
        </button>
      </div>
    </aside>
  )
}
