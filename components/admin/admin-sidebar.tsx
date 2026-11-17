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
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-sidebar-border bg-[#0D0D1A] p-4 lg:flex">
      <Link href="/admin" className="flex items-center gap-2 px-2 py-1">
        <span className="flex size-9 items-center justify-center rounded-lg bg-primary">
          <ShieldCheck className="size-5" aria-hidden="true" />
        </span>
        <span className="text-lg font-extrabold tracking-tight">
          HAN<span className="text-primary">GO</span> <span className="font-medium text-muted-foreground">Admin</span>
        </span>
      </Link>
      <nav aria-label="Quản trị" className="mt-8 flex flex-col gap-1">
        {items.map(({ id, label, href, icon: Icon }, idx) => (
          <a
            key={id}
            href={href}
            className={cn(
              'flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground',
              idx === 0 && 'bg-primary/15 text-white ring-1 ring-primary/40',
            )}
          >
            <Icon className={cn('size-5', idx === 0 && 'text-violet-400')} aria-hidden="true" />
            {label}
          </a>
        ))}
      </nav>
      <div className="mt-auto flex items-center justify-between gap-2 rounded-xl bg-white/5 p-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-400 to-primary text-xs font-bold">
            {profile?.isRootAdmin ? 'RA' : 'AD'}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold">
              {profile?.displayName || 'Quản trị viên'}
            </span>
            <span className="block truncate text-xs text-muted-foreground">
              {profile?.email || ''}
            </span>
          </span>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          title="Đăng xuất"
          aria-label="Đăng xuất"
          className="flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-white/10 hover:text-red-400"
        >
          <LogOut className="size-4" aria-hidden="true" />
        </button>
      </div>
    </aside>
  )
}
