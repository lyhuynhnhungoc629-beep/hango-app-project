'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  AlertCircle,
  BookOpen,
  FileText,
  Home,
  Layers,
  LayoutDashboard,
  Lock,
  LogIn,
  LogOut,
  MessageSquare,
  Mic,
  PenTool,
  ShieldCheck,
  Timer,
} from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { BackButton } from '@/components/hango/back-button'
import { cn } from '@/lib/utils'

export const GUEST_LOGIN_REQUIRED_MESSAGE =
  'Vui lòng đăng nhập hoặc đăng ký tài khoản học viên để sử dụng chức năng này'

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, profile, loading } = useAuth()
  const isAuthenticated = Boolean(user || profile)

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      const target = pathname && pathname !== '/' ? pathname : '/dashboard'
      router.replace(`/auth?notice=login_required&redirect=${encodeURIComponent(target)}`)
    }
  }, [loading, isAuthenticated, pathname, router])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0D0D1A] p-6 text-sm text-muted-foreground">
        Đang kiểm tra trạng thái đăng nhập...
      </div>
    )
  }

  if (!isAuthenticated) {
    const target = pathname && pathname !== '/' ? pathname : '/dashboard'
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#0D0D1A] p-4">
        <section
          role="alert"
          className="mx-auto flex max-w-md flex-col items-center rounded-2xl border border-violet-500/40 bg-card p-8 text-center shadow-2xl"
        >
          <span className="flex size-14 items-center justify-center rounded-2xl bg-primary/15 text-violet-300">
            <Lock className="size-7" aria-hidden="true" />
          </span>
          <h1 className="mt-4 text-lg font-bold">Yêu cầu đăng nhập</h1>
          <p className="mt-2 text-sm leading-relaxed text-violet-100/90">
            {GUEST_LOGIN_REQUIRED_MESSAGE}
          </p>
          <Link
            href={`/auth?notice=login_required&redirect=${encodeURIComponent(target)}`}
            className="mt-6 inline-flex h-11 items-center justify-center rounded-xl bg-primary px-6 text-sm font-semibold text-white shadow-lg shadow-primary/30 hover:bg-primary/90"
          >
            Đi tới trang Đăng nhập / Đăng ký
          </Link>
        </section>
      </div>
    )
  }

  return <>{children}</>
}

const baseNav = [
  { href: '/', label: 'Trang chủ', icon: Home, adminOnly: false },
  { href: '/learning-path', label: 'Lộ trình', icon: Layers, adminOnly: false },
  { href: '/flashcard', label: 'Flashcard', icon: BookOpen, adminOnly: false },
  { href: '/topik', label: 'Thi thử TOPIK', icon: FileText, adminOnly: false },
  { href: '/ai', label: 'AI Chat', icon: MessageSquare, adminOnly: false },
  { href: '/ai?tab=pronounce', label: 'Phát âm', icon: Mic, adminOnly: false },
  { href: '/ai?tab=handwriting', label: 'Luyện viết', icon: PenTool, adminOnly: false },
  { href: '/study-room', label: 'Phòng học', icon: Timer, adminOnly: false },
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, adminOnly: false },
  { href: '/admin', label: 'Quản trị', icon: ShieldCheck, adminOnly: true },
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
  const { user, profile, lockedMessage, logout } = useAuth()

  const isAuthenticated = Boolean(user || profile)
  const isAdmin = Boolean(profile?.role === 'admin' || profile?.isRootAdmin)
  const nav = baseNav.filter((item) => !item.adminOnly || isAdmin)

  const displayName = profile?.displayName || user?.displayName || 'Khách'
  const level = profile?.level ?? 1
  const xp = profile?.xp ?? 0
  const finalDisplayName = isAdmin ? 'Quản trị viên' : displayName
  const finalSubtitle = isAdmin
    ? (profile?.email || user?.email || 'admin@gmail.com')
    : `Cấp ${level} · ${xp.toLocaleString('vi-VN')} XP`
  const finalInitials = getInitials(finalDisplayName)

  const handleLogout = async () => {
    await logout()
    router.replace('/auth')
  }

  if (pathname !== '/') {
    return (
      <RequireAuth>
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
                  {profile?.photoURL ? (
                    <img src={profile.photoURL} alt={finalDisplayName} className="size-full rounded-full object-cover" />
                  ) : (
                    finalInitials
                  )}
                </span>
                <span className="hidden min-w-0 lg:block">
                  <span className="block truncate text-sm font-semibold">{finalDisplayName}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {finalSubtitle}
                  </span>
                </span>
              </div>
              {isAuthenticated ? (
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
            {lockedMessage && (
              <div
                role="alert"
                className="mx-4 mt-4 flex items-center gap-3 rounded-xl border border-red-500/40 bg-red-500/15 px-4 py-3 text-sm text-red-200 md:mx-8"
              >
                <AlertCircle className="size-5 shrink-0 text-red-400" />
                <span>{lockedMessage}</span>
              </div>
            )}
            {pathname !== '/' && !pathname.startsWith('/learning-path') && (
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
      </RequireAuth>
    )
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
              {profile?.photoURL ? (
                <img src={profile.photoURL} alt={finalDisplayName} className="size-full rounded-full object-cover" />
              ) : (
                finalInitials
              )}
            </span>
            <span className="hidden min-w-0 lg:block">
              <span className="block truncate text-sm font-semibold">{finalDisplayName}</span>
              <span className="block truncate text-xs text-muted-foreground">
                {finalSubtitle}
              </span>
            </span>
          </div>
          {isAuthenticated ? (
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
        {lockedMessage && (
          <div
            role="alert"
            className="mx-4 mt-4 flex items-center gap-3 rounded-xl border border-red-500/40 bg-red-500/15 px-4 py-3 text-sm text-red-200 md:mx-8"
          >
            <AlertCircle className="size-5 shrink-0 text-red-400" />
            <span>{lockedMessage}</span>
          </div>
        )}
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
