'use client'

import Link from 'next/link'
import { LayoutDashboard, LogOut } from 'lucide-react'
import { Logo } from '@/components/hango/logo'
import { useAuth } from '@/lib/auth-context'

const navLinks = [
  { href: '/learning-path', label: 'Lộ trình' },
  { href: '/flashcard', label: 'Học từ vựng' },
  { href: '/topik', label: 'Thi thử TOPIK' },
  { href: '/ai', label: 'AI Luyện tập' },
  { href: '/study-room', label: 'Phòng học ảo' },
  { href: '/dashboard', label: 'Dashboard' },
]

export function SiteHeader() {
  const { user, profile, logout } = useAuth()
  const isAuthenticated = Boolean(user || profile)

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-6 px-4 md:px-6">
        <Logo />
        <nav aria-label="Điều hướng chính" className="hidden items-center gap-6 md:flex">
          {navLinks.map((link) => {
            const targetHref = isAuthenticated
              ? link.href
              : `/auth?notice=login_required&redirect=${encodeURIComponent(link.href)}`
            return (
              <Link
                key={link.href}
                href={targetHref}
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {link.label}
              </Link>
            )
          })}
        </nav>
        <div className="flex items-center gap-2">
          {isAuthenticated ? (
            <>
              <Link
                href="/dashboard"
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/30 transition-colors hover:bg-primary/90"
              >
                <LayoutDashboard className="size-4" aria-hidden="true" />
                <span>{profile?.displayName || user?.displayName || 'Dashboard'}</span>
              </Link>
              <button
                type="button"
                onClick={logout}
                aria-label="Đăng xuất"
                title="Đăng xuất"
                className="inline-flex size-10 items-center justify-center rounded-xl border border-white/15 text-muted-foreground transition-colors hover:bg-white/5 hover:text-red-400"
              >
                <LogOut className="size-4" aria-hidden="true" />
              </button>
            </>
          ) : (
            <>
              <Link
                href="/auth"
                className="hidden h-10 items-center rounded-xl border border-white/15 px-4 text-sm font-semibold text-foreground transition-colors hover:bg-white/5 sm:inline-flex"
              >
                Đăng nhập
              </Link>
              <Link
                href="/auth?tab=register"
                className="inline-flex h-10 items-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/30 transition-colors hover:bg-primary/90"
              >
                Đăng ký
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
