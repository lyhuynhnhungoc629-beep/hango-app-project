'use client'

import Link from 'next/link'
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Brain,
  Clock,
  FileText,
  Flame,
  MessageSquare,
  Mic,
  ShieldCheck,
  Sparkles,
  Timer,
  Trophy,
} from 'lucide-react'
import { AppShell } from '@/components/hango/app-shell'
import { ProfileBanner } from '@/components/dashboard/profile-banner'

const navCards = [
  {
    href: '/flashcard',
    title: 'Học từ vựng Flashcard',
    desc: 'Lật thẻ 3D thông minh (SRS), nghe phát âm và ghi nhớ từ vựng TOPIK.',
    badge: '24/100 từ hôm nay',
    icon: BookOpen,
    gradient: 'from-violet-600/30 via-violet-600/10 to-transparent',
    iconBg: 'bg-violet-500/20 text-violet-300 group-hover:bg-primary group-hover:text-white',
    cta: 'Vào học từ vựng',
  },
  {
    href: '/topik',
    title: 'Thi thử TOPIK I & II',
    desc: 'Làm đề Nghe & Đọc có bấm giờ đếm ngược bám sát cấu trúc đề thi thật.',
    badge: '24 đề thi sẵn sàng',
    icon: FileText,
    gradient: 'from-sky-500/25 via-sky-500/10 to-transparent',
    iconBg: 'bg-sky-500/20 text-sky-300 group-hover:bg-sky-500 group-hover:text-white',
    cta: 'Bắt đầu làm đề',
  },
  {
    href: '/ai',
    title: 'AI Hội thoại nhập vai',
    desc: 'Thực hành giao tiếp tiếng Hàn tại nhà hàng, sân bay, mua sắm, bệnh viện.',
    badge: '4 tình huống thực tế',
    icon: MessageSquare,
    gradient: 'from-fuchsia-500/25 via-fuchsia-500/10 to-transparent',
    iconBg: 'bg-fuchsia-500/20 text-fuchsia-300 group-hover:bg-fuchsia-500 group-hover:text-white',
    cta: 'Trò chuyện với AI',
  },
  {
    href: '/ai?tab=pronounce',
    title: 'AI Chấm điểm phát âm',
    desc: 'Thu âm giọng đọc tiếng Hàn và nhận phân tích chi tiết từng âm tiết.',
    badge: 'Điểm gần nhất: 85/100',
    icon: Mic,
    gradient: 'from-emerald-500/25 via-emerald-500/10 to-transparent',
    iconBg: 'bg-emerald-500/20 text-emerald-300 group-hover:bg-emerald-500 group-hover:text-white',
    cta: 'Luyện phát âm ngay',
  },
  {
    href: '/study-room',
    title: 'Phòng học ảo Pomodoro',
    desc: 'Tập trung học bài với đồng hồ Pomodoro, nhạc Lofi/tiếng mưa và mục tiêu ngày.',
    badge: '3/5 mục tiêu hoàn thành',
    icon: Timer,
    gradient: 'from-amber-500/25 via-amber-500/10 to-transparent',
    iconBg: 'bg-amber-500/20 text-amber-300 group-hover:bg-amber-500 group-hover:text-white',
    cta: 'Vào phòng học',
  },
  {
    href: '/dashboard',
    title: 'Thống kê & Tiến độ (Dashboard)',
    desc: 'Theo dõi biểu đồ giờ học hàng tuần, lịch sử điểm thi thử và từ vựng đã thuộc.',
    badge: '42.5 giờ tích lũy',
    icon: BarChart3,
    gradient: 'from-indigo-500/25 via-indigo-500/10 to-transparent',
    iconBg: 'bg-indigo-500/20 text-indigo-300 group-hover:bg-indigo-500 group-hover:text-white',
    cta: 'Xem thống kê',
  },
]

const quickStats = [
  { label: 'Tổng giờ học', value: '42.5 giờ', sub: '+2.3h tuần này', icon: Clock },
  { label: 'Từ đã thuộc', value: '847 từ', sub: '+32 tuần này', icon: Brain },
  { label: 'Điểm TB thi thử', value: '72/100', sub: '+5 điểm', icon: Trophy },
  { label: 'Chuỗi ngày học', value: '15 ngày', sub: 'Duy trì mỗi ngày', icon: Flame },
]

const reviewWords = [
  { ko: '사과', vi: 'Quả táo', level: 'TOPIK I' },
  { ko: '친구', vi: 'Bạn bè', level: 'TOPIK I' },
  { ko: '날씨', vi: 'Thời tiết', level: 'TOPIK I' },
  { ko: '공부하다', vi: 'Học tập', level: 'TOPIK I' },
  { ko: '행복하다', vi: 'Hạnh phúc', level: 'TOPIK I' },
]

export function AuthenticatedHome() {
  return (
    <AppShell>
      <main className="flex flex-col gap-8 p-4 md:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-violet-300">
              <Sparkles className="size-3.5" aria-hidden="true" />
              Trang chủ học tập HANGO
            </span>
            <h1 className="mt-2 text-2xl font-bold md:text-3xl">Hôm nay bạn muốn học gì?</h1>
          </div>
          <Link
            href="/admin"
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-card px-4 text-sm font-medium text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
          >
            <ShieldCheck className="size-4 text-violet-400" aria-hidden="true" />
            Trang Quản trị (Admin)
          </Link>
        </div>

        <ProfileBanner />

        <section aria-labelledby="quick-nav-heading">
          <div className="flex items-center justify-between">
            <div>
              <h2 id="quick-nav-heading" className="text-lg font-bold md:text-xl">
                Chức năng học tập
              </h2>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Chọn một tính năng bên dưới để chuyển ngay đến trang tương ứng
              </p>
            </div>
          </div>

          <ul className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {navCards.map(({ href, title, desc, badge, icon: Icon, gradient, iconBg, cta }) => (
              <li key={href}>
                <Link
                  href={href}
                  className={`group flex h-full flex-col justify-between rounded-2xl border border-border bg-gradient-to-br ${gradient} bg-card p-6 transition-all duration-200 hover:-translate-y-1 hover:border-primary/60 hover:shadow-xl hover:shadow-primary/10`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-3">
                      <span className={`flex size-12 items-center justify-center rounded-xl transition-colors ${iconBg}`}>
                        <Icon className="size-6" aria-hidden="true" />
                      </span>
                      <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-muted-foreground">
                        {badge}
                      </span>
                    </div>
                    <h3 className="mt-5 text-lg font-bold group-hover:text-violet-300">{title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{desc}</p>
                  </div>

                  <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4 text-sm font-semibold text-violet-300 group-hover:text-white">
                    <span>{cta}</span>
                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section aria-label="Tóm tắt nhanh">
          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {quickStats.map(({ label, value, sub, icon: Icon }) => (
              <li key={label} className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-violet-300">
                  <Icon className="size-6" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="mt-0.5 text-2xl font-bold">{value}</p>
                  <p className="text-xs text-green-400">{sub}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="home-review-title">
          <div className="flex items-center justify-between">
            <h2 id="home-review-title" className="text-lg font-semibold">
              Từ vựng cần ôn hôm nay
            </h2>
            <Link href="/flashcard" className="text-sm font-medium text-violet-400 hover:text-violet-300">
              Ôn tất cả →
            </Link>
          </div>
          <ul className="mt-4 grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
            {reviewWords.map((w) => (
              <li key={w.ko} className="flex flex-col justify-between rounded-2xl border border-border bg-card p-5">
                <div>
                  <span className="inline-block rounded-md bg-primary/15 px-2 py-0.5 text-[11px] font-semibold text-violet-300">
                    {w.level}
                  </span>
                  <p lang="ko" className="mt-3 text-2xl font-bold">
                    {w.ko}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">{w.vi}</p>
                </div>
                <Link
                  href="/flashcard"
                  className="mt-5 inline-flex h-9 items-center justify-center rounded-lg bg-primary/15 text-sm font-semibold text-violet-300 transition-colors hover:bg-primary hover:text-white"
                >
                  Ôn ngay
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </AppShell>
  )
}
