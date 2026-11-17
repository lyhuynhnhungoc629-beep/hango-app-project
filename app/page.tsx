'use client'

import Link from 'next/link'
import { SiteHeader } from '@/components/landing/site-header'
import { Hero } from '@/components/landing/hero'
import { Features } from '@/components/landing/features'
import { Logo } from '@/components/hango/logo'
import { AuthenticatedHome } from '@/components/home/authenticated-home'
import { useAuth } from '@/lib/auth-context'

const pages = [
  { href: '/auth', label: 'Đăng nhập' },
  { href: '/flashcard', label: 'Flashcard' },
  { href: '/topik', label: 'Thi thử TOPIK' },
  { href: '/ai', label: 'AI Luyện tập' },
  { href: '/study-room', label: 'Phòng học' },
  { href: '/dashboard', label: 'Dashboard' },
]

export default function Page() {
  const { user, profile, loading } = useAuth()

  if (!loading && (user || profile)) {
    return <AuthenticatedHome />
  }

  return (
    <>
      <SiteHeader />
      <main>
        <Hero />
        <Features />
      </main>
      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-10 md:flex-row md:items-center md:justify-between md:px-6">
          <div>
            <Logo />
            <p className="mt-2 text-sm text-muted-foreground">© 2026 HANGO. Học tiếng Hàn miễn phí cho mọi người.</p>
          </div>
          <nav aria-label="Liên kết trang" className="flex flex-wrap gap-x-6 gap-y-2">
            {pages.map((p) => {
              const targetHref =
                p.href === '/auth'
                  ? p.href
                  : `/auth?notice=login_required&redirect=${encodeURIComponent(p.href)}`
              return (
                <Link key={p.href} href={targetHref} className="text-sm text-muted-foreground hover:text-foreground">
                  {p.label}
                </Link>
              )
            })}
          </nav>
        </div>
      </footer>
    </>
  )
}
