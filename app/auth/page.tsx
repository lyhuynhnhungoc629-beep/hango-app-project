import type { Metadata } from 'next'
import Link from 'next/link'
import { AuthForm } from '@/components/auth/auth-form'
import { BackButton } from '@/components/hango/back-button'
import { KoreanFlag } from '@/components/hango/logo'

export const metadata: Metadata = { title: 'Đăng nhập | HANGO' }

const floatingChars = [
  { char: '한', className: 'left-[8%] top-[10%] text-8xl' },
  { char: '국', className: 'right-[10%] top-[22%] text-7xl [animation-delay:-3s]' },
  { char: '어', className: 'left-[18%] bottom-[18%] text-9xl [animation-delay:-6s]' },
  { char: '가', className: 'right-[16%] bottom-[8%] text-6xl [animation-delay:-2s]' },
  { char: '나', className: 'left-[48%] top-[6%] text-5xl [animation-delay:-5s]' },
]

export default async function AuthPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; notice?: string; redirect?: string }>
}) {
  const { tab, notice, redirect } = await searchParams
  const guestNotice =
    notice === 'login_required'
      ? 'Vui lòng đăng nhập hoặc đăng ký tài khoản học viên để sử dụng chức năng này'
      : undefined
  return (
    <main className="flex min-h-screen flex-col lg:flex-row">
      <section className="relative flex min-h-64 items-center justify-center overflow-hidden bg-gradient-to-br from-[#1A0A2E] to-[#0F0F1A] px-8 py-16 lg:w-2/5">
        <div aria-hidden="true">
          {floatingChars.map((c) => (
            <span key={c.char} className={`animate-drift absolute select-none font-black text-violet-300/[0.07] ${c.className}`}>
              {c.char}
            </span>
          ))}
          <div className="absolute left-1/2 top-1/2 size-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/20 blur-[100px]" />
        </div>
        <div className="relative text-center">
          <Link href="/" className="inline-flex items-center gap-3" aria-label="HANGO trang chủ">
            <span className="text-6xl font-black tracking-tight md:text-7xl">
              HAN<span className="text-primary">GO</span>
            </span>
            <KoreanFlag className="h-7 w-10" />
          </Link>
          <p className="mx-auto mt-6 max-w-xs text-balance text-lg leading-relaxed text-violet-100/80">
            Hành trình chinh phục tiếng Hàn bắt đầu từ đây
          </p>
          <p className="mt-4 text-3xl font-bold text-violet-300/40" lang="ko">
            한국어
          </p>
        </div>
      </section>
      <section className="relative flex flex-1 flex-col items-center justify-center bg-background px-6 py-12">
        <div className="mb-6 w-full max-w-md lg:absolute lg:left-8 lg:top-8 lg:mb-0 lg:w-auto">
          <BackButton showHomeLink={false} label="Quay lại Trang chủ" />
        </div>
        <AuthForm
          initialTab={tab === 'register' ? 'register' : 'login'}
          guestNotice={guestNotice}
          redirectTo={redirect}
        />
      </section>
    </main>
  )
}
