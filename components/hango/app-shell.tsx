'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  BookOpen,
  FileText,
  Home,
  LayoutDashboard,
  LogIn,
  LogOut,
  MessageSquare,
  Mic,
  ShieldCheck,
  Timer,
} from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { BackButton } from '@/components/hango/back-button'
import { cn } from '@/lib/utils'

const nav = [
  { href: '/', label: 'Trang chủ', icon: Home },
  { href: '/flashcard', label: 'Flashcard', icon: BookOpen },
  { href: '/topik', label: 'Thi thử TOPIK', icon: FileText },
  { href: '/ai', label: 'AI Chat', icon: MessageSquare },
  { href: '/ai?tab=pronounce', label: 'Phát âm', icon: Mic },
  { href: '/study-room', label: 'Phòng học', icon: Timer },
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin', label: 'Quản trị', icon: ShieldCheck },
]

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }
  return name.slice(0, 2).toUpperCase() || 'HG'
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, profile, logout } = useAuth()

  const displayName = profile?.displayName || user?.displayName || 'Ngọc Khánh'
  const level = profile?.level ?? 12
  const xp = profile?.xp ?? 2450

  const handleLogout = async () => {
    await logout()
    router.push('/auth')
  }

  return (
    <div className="flex min-h-screen bg-[#0D0D1A]">
      <aside className="sticky top-0 hidden h-screen w-20 shrink-0 flex-col items-center border-r border-sidebar-border bg-sidebar py-5 md:flex lg:w-60 lg:items-stretch lg:px-4">
        <Link href="/" className="flex items-center justify-center gap-1 lg:justify-start lg:px-2" aria-label="HANGO trang chủ">
          <span className="text-xl font-extrabold tracking-tight">
            <span className="lg:hidden">H</span>
            <span className="hidden lg:inline">HAN</span>
            <span className="text-primary">G</span>
            <span className="hidden text-primary lg:inline">O</span>
          </span>
        </Link>
        <nav aria-label="Ứng dụng" className="mt-8 flex flex-1 flex-col gap-1">
          {nav.map(({ href, label, icon: Icon }) => {
            const active =
              href === '/'
                ? pathname === '/'
                : pathname === href.split('?')[0] && !href.includes('?')
            return (
              <Link
                key={label}
                href={href}
                aria-current={active ? 'page' : undefined}
                title={label}
                className={cn(
                  'flex size-12 items-center justify-center gap-3 rounded-xl text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground lg:h-11 lg:w-full lg:justify-start lg:px-3',
                  active && 'bg-primary text-white shadow-lg shadow-primary/30 hover:bg-primary',
                )}
              >
                <Icon className="size-5 shrink-0" aria-hidden="true" />
                <span className="hidden text-sm font-medium lg:inline">{label}</span>
              </Link>
            )
          })}
        </nav>
        <div className="flex items-center justify-center gap-3 rounded-xl lg:justify-between lg:bg-white/5 lg:p-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-400 to-primary text-sm font-bold">
              {getInitials(displayName)}
            </span>
            <span className="hidden min-w-0 lg:block">
              <span className="block truncate text-sm font-semibold">{displayName}</span>
              <span className="block truncate text-xs text-muted-foreground">
                Cấp {level} · {xp.toLocaleString('vi-VN')} XP
              </span>
            </span>
          </div>
          {user ? (
            <button
              type="button"
              onClick={handleLogout}
              title="Đăng xuất"
              aria-label="Đăng xuất"
              className="hidden size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-white/10 hover:text-red-400 lg:flex"
            >
              <LogOut className="size-4" aria-hidden="true" />
            </button>
          ) : (
            <Link
              href="/auth"
              title="Đăng nhập"
              aria-label="Đăng nhập"
              className="hidden size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground lg:flex"
            >
              <LogIn className="size-4" aria-hidden="true" />
            </Link>
          )}
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col pb-16 md:pb-0">
        {pathname !== '/' && (
          <div className="px-4 pt-4 md:px-8 md:pt-6">
            <BackButton />
          </div>
        )}
        {children}
      </div>
      <nav aria-label="Ứng dụng (di động)" className="fixed inset-x-0 bottom-0 z-40 flex justify-around border-t border-sidebar-border bg-sidebar py-2 md:hidden">
        {nav.slice(0, 7).map(({ href, label, icon: Icon }) => (
          <Link key={label} href={href} aria-label={label} className="flex size-11 items-center justify-center rounded-xl text-muted-foreground hover:text-foreground">
            <Icon className="size-5" aria-hidden="true" />
          </Link>
        ))}
      </nav>
    </div>
  )
}
