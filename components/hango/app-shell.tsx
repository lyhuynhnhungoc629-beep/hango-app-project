'use client'

import { useEffect, useState } from 'react'
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
      <div className="flex min-h-screen items-center justify-center bg-[#EEF5FB] p-6 text-sm font-semibold text-slate-600">
        Đang kiểm tra trạng thái đăng nhập...
      </div>
    )
  }

  if (!isAuthenticated) {
    const target = pathname && pathname !== '/' ? pathname : '/dashboard'
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#EEF5FB] p-4">
        <section
          role="alert"
          className="mx-auto flex max-w-md flex-col items-center rounded-2xl border-[1.5px] border-slate-800 bg-white p-8 text-center shadow-xl"
        >
          <span className="flex size-14 items-center justify-center rounded-2xl border-[1.5px] border-slate-800 bg-violet-100 text-[#7C3AED]">
            <Lock className="size-7" aria-hidden="true" />
          </span>
          <h1 className="mt-4 text-lg font-black text-slate-900">Yêu cầu đăng nhập</h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            {GUEST_LOGIN_REQUIRED_MESSAGE}
          </p>
          <Link
            href={`/auth?notice=login_required&redirect=${encodeURIComponent(target)}`}
            className="mt-6 inline-flex h-11 items-center justify-center rounded-xl border border-slate-900 bg-[#7C3AED] px-6 text-sm font-bold text-white shadow-[0_2px_0_rgba(15,23,42,0.12)] hover:bg-[#6D28D9]"
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
  const [currentSearch, setCurrentSearch] = useState('')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCurrentSearch(window.location.search || '')
    }
  }, [pathname])

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

  const isNavActive = (href: string) => {
    if (href === '/') return pathname === '/'
    if (href.startsWith('/ai')) {
      if (pathname !== '/ai') return false
      const params = new URLSearchParams(currentSearch)
      const activeTab = params.get('tab')
      if (href === '/ai?tab=pronounce') return activeTab === 'pronounce'
      if (href === '/ai?tab=handwriting') return activeTab === 'handwriting'
      return !activeTab || activeTab === 'chat'
    }
    return pathname === href || pathname.startsWith(`${href}/`)
  }

  const renderSidebar = () => (
    <aside className="sticky top-0 hidden h-screen w-20 shrink-0 flex-col items-center border-r-[1.5px] border-slate-800 bg-white py-5 text-slate-800 shadow-[2px_0_0_rgba(15,23,42,0.04)] md:flex lg:w-60 lg:items-stretch lg:px-4">
      <Link
        href="/"
        className="flex items-center justify-center gap-2.5 rounded-xl px-1.5 py-1 transition-transform hover:scale-[1.02] active:scale-[0.98] lg:justify-start"
        aria-label="HANGO trang chủ"
      >
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border-[1.5px] border-slate-800 bg-gradient-to-br from-violet-600 to-indigo-600 text-base font-black text-white shadow-[0_2px_0_rgba(15,23,42,0.1)]">
          H
        </span>
        <span className="hidden flex-col lg:flex">
          <span className="text-xl font-black tracking-tight text-slate-900 leading-none">
            HAN<span className="text-[#7C3AED]">GO</span>
          </span>
          <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400 mt-1">
            Học tiếng Hàn
          </span>
        </span>
      </Link>
      <nav aria-label="Ứng dụng" className="mt-7 flex flex-1 flex-col gap-1.5 overflow-y-auto pr-0.5">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = isNavActive(href)
          return (
            <Link
              key={label}
              href={href}
              onClick={() => {
                const qIndex = href.indexOf('?')
                setCurrentSearch(qIndex >= 0 ? href.slice(qIndex) : '')
              }}
              aria-current={active ? 'page' : undefined}
              title={label}
              className={cn(
                'group flex size-12 items-center justify-center gap-3 rounded-xl font-semibold transition-all duration-150 lg:h-11 lg:w-full lg:justify-start lg:px-3',
                active
                  ? 'border-[1.5px] border-slate-800 bg-[#7C3AED] text-white font-bold shadow-[0_2px_0_rgba(15,23,42,0.12)] hover:bg-[#6D28D9]'
                  : 'border border-transparent text-slate-600 hover:border-slate-300 hover:bg-slate-100/90 hover:text-slate-900',
              )}
            >
              <Icon
                className={cn(
                  'size-5 shrink-0 transition-transform duration-150 group-hover:scale-105',
                  active ? 'text-white' : 'text-slate-500 group-hover:text-slate-900',
                )}
                aria-hidden="true"
              />
              <span className="hidden text-sm lg:inline">{label}</span>
            </Link>
          )
        })}
      </nav>
      <div className="mt-auto flex items-center justify-center gap-2 rounded-2xl border-[1.5px] border-slate-800 bg-slate-50 p-2 shadow-[0_2px_0_rgba(15,23,42,0.06)] lg:justify-between lg:p-2.5">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl border-[1.5px] border-slate-800 bg-gradient-to-br from-violet-500 to-[#7C3AED] text-xs font-black text-white shadow-sm overflow-hidden">
            {profile?.photoURL ? (
              <img src={profile.photoURL} alt={finalDisplayName} className="size-full object-cover" />
            ) : (
              finalInitials
            )}
          </span>
          <span className="hidden min-w-0 lg:block">
            <span className="block truncate text-sm font-bold text-slate-900 leading-tight">
              {finalDisplayName}
            </span>
            <span className="block truncate text-[11px] font-semibold text-slate-500 mt-0.5">
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
            className="hidden size-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-colors hover:border-red-300 hover:bg-red-50 hover:text-red-600 lg:flex"
          >
            <LogOut className="size-4" aria-hidden="true" />
          </button>
        ) : (
          <Link
            href="/auth"
            title="Đăng nhập"
            aria-label="Đăng nhập"
            className="hidden size-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors hover:border-violet-400 hover:bg-violet-50 hover:text-[#7C3AED] lg:flex"
          >
            <LogIn className="size-4" aria-hidden="true" />
          </Link>
        )}
      </div>
    </aside>
  )

  const contentBody = (
    <div className="flex min-h-screen bg-[#EEF5FB]">
      {renderSidebar()}
      <div className="hango-grid-theme flex min-w-0 flex-1 flex-col pb-16 md:pb-0">
        {lockedMessage && (
          <div
            role="alert"
            className="mx-4 mt-4 flex items-center gap-3 rounded-xl border-[1.5px] border-red-500 bg-red-50 px-4 py-3 text-sm font-semibold text-red-900 shadow-sm md:mx-8"
          >
            <AlertCircle className="size-5 shrink-0 text-red-600" />
            <span>{lockedMessage}</span>
          </div>
        )}
        {children}
      </div>
      <nav aria-label="Ứng dụng (di động)" className="fixed inset-x-0 bottom-0 z-40 flex justify-around border-t-[1.5px] border-slate-800 bg-white/95 px-2 py-2 backdrop-blur-md shadow-lg md:hidden">
        {nav.slice(0, 7).map(({ href, label, icon: Icon }) => {
          const active = isNavActive(href)
          return (
            <Link
              key={label}
              href={href}
              onClick={() => {
                const qIndex = href.indexOf('?')
                setCurrentSearch(qIndex >= 0 ? href.slice(qIndex) : '')
              }}
              aria-label={label}
              className={cn(
                'flex size-11 items-center justify-center rounded-xl transition-all',
                active
                  ? 'border-[1.5px] border-slate-800 bg-[#7C3AED] text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
              )}
            >
              <Icon className="size-5" aria-hidden="true" />
            </Link>
          )
        })}
      </nav>
    </div>
  )

  if (pathname !== '/') {
    return <RequireAuth>{contentBody}</RequireAuth>
  }

  return contentBody
}
