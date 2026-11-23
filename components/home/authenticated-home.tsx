'use client'

import Link from 'next/link'
import {
  BarChart3,
  BookOpen,
  Brain,
  ChevronRight,
  Clock,
  FileText,
  Flame,
  Home,
  Layers,
  MessageSquare,
  Mic,
  PenTool,
  ShieldCheck,
  Timer,
  Trophy,
} from 'lucide-react'
import { AppShell } from '@/components/hango/app-shell'
import { ProfileBanner } from '@/components/dashboard/profile-banner'
import { useAuth } from '@/lib/auth-context'

const navCards = [
  {
    href: '/learning-path',
    title: 'Lộ trình học 7 Chặng',
    desc: 'Hành trình dọc 7 chặng từ bảng chữ cái Hangeul 9 buổi đến TOPIK 6급, mở khóa tuần tự theo bài kiểm tra.',
    badge: '7 Chặng · TOPIK',
    icon: Layers,
    iconBg: 'bg-[#22C55E] text-slate-950',
    cta: 'Vào lộ trình học',
  },
  {
    href: '/flashcard',
    title: 'Học từ vựng Flashcard',
    desc: 'Khám phá thư viện chủ đề từ vựng tiếng Hàn, lật thẻ 3D thông minh (SRS) và nghe phát âm chuẩn.',
    badge: 'Ôn tập SRS',
    icon: BookOpen,
    iconBg: 'bg-[#8B5CF6] text-white',
    cta: 'Vào học từ vựng',
  },
  {
    href: '/topik',
    title: 'Thi thử TOPIK I & II',
    desc: 'Làm đề Nghe & Đọc có bấm giờ đếm ngược bám sát cấu trúc đề thi thật.',
    badge: 'Đề thi chuẩn',
    icon: FileText,
    iconBg: 'bg-[#3B82F6] text-white',
    cta: 'Bắt đầu làm đề',
  },
  {
    href: '/ai',
    title: 'AI Hội thoại nhập vai',
    desc: 'Thực hành giao tiếp tiếng Hàn tại nhà hàng, sân bay, mua sắm, bệnh viện.',
    badge: '4 tình huống',
    icon: MessageSquare,
    iconBg: 'bg-[#06B6D4] text-white',
    cta: 'Trò chuyện với AI',
  },
  {
    href: '/ai?tab=pronounce',
    title: 'AI Chấm điểm phát âm',
    desc: 'Thu âm giọng đọc tiếng Hàn và nhận phân tích chi tiết từng âm tiết.',
    badge: 'Nhận diện giọng nói',
    icon: Mic,
    iconBg: 'bg-[#10B981] text-white',
    cta: 'Luyện phát âm',
  },
  {
    href: '/ai?tab=handwriting',
    title: 'Luyện viết chữ Hàn',
    desc: 'Viết chữ Hàn trên bảng ô ly, đối chiếu nét chữ mẫu chuẩn và chấm điểm độ cân đối.',
    badge: 'Bảng viết ô ly',
    icon: PenTool,
    iconBg: 'bg-[#EC4899] text-white',
    cta: 'Tập viết chữ Hàn',
  },
  {
    href: '/study-room',
    title: 'Phòng học ảo Pomodoro',
    desc: 'Tập trung học bài với đồng hồ Pomodoro, nhạc Lofi/tiếng mưa và mục tiêu ngày.',
    badge: '+100 XP / 25p',
    icon: Timer,
    iconBg: 'bg-[#F59E0B] text-slate-950',
    cta: 'Vào phòng học',
  },
  {
    href: '/dashboard',
    title: 'Thống kê & Tiến độ',
    desc: 'Theo dõi biểu đồ giờ học hàng tuần, lịch sử điểm thi thử và từ vựng đã thuộc.',
    badge: 'Dashboard',
    icon: BarChart3,
    iconBg: 'bg-[#2563EB] text-white',
    cta: 'Xem thống kê',
  },
]

const reviewWords = [
  { ko: '사과', vi: 'Quả táo', level: 'TOPIK I' },
  { ko: '친구', vi: 'Bạn bè', level: 'TOPIK I' },
  { ko: '날씨', vi: 'Thời tiết', level: 'TOPIK I' },
  { ko: '공부하다', vi: 'Học tập', level: 'TOPIK I' },
  { ko: '행복하다', vi: 'Hạnh phúc', level: 'TOPIK I' },
]

export function AuthenticatedHome() {
  const { profile } = useAuth()
  const isAdmin = Boolean(profile?.role === 'admin' || profile?.isRootAdmin)

  const totalStudyMinutes = profile?.totalStudyMinutes ?? 0
  const learnedVocabCount = profile?.learnedVocabCount ?? 0
  const xp = profile?.xp ?? 0
  const streak = profile?.streak ?? 0

  const quickStats = [
    {
      label: 'Tổng thời gian học',
      value: `${totalStudyMinutes} phút`,
      sub: `Cấp độ hiện tại: Cấp ${profile?.level ?? 1}`,
      icon: Clock,
      iconBg: 'bg-[#3B82F6] text-white',
    },
    {
      label: 'Từ vựng đã học (SRS)',
      value: `${learnedVocabCount} từ`,
      sub: 'Đồng bộ thời gian thực',
      icon: Brain,
      iconBg: 'bg-[#8B5CF6] text-white',
    },
    {
      label: 'Tổng điểm tích lũy',
      value: `${xp.toLocaleString('vi-VN')} XP`,
      sub: `Vai trò: ${isAdmin ? 'Quản trị viên' : 'Học viên'}`,
      icon: Trophy,
      iconBg: 'bg-[#F59E0B] text-slate-950',
    },
    {
      label: 'Chuỗi ngày học',
      value: `${streak} ngày`,
      sub: 'Duy trì liên tiếp',
      icon: Flame,
      iconBg: 'bg-[#22C55E] text-slate-950',
    },
  ]

  return (
    <AppShell>
      <div className="min-h-screen w-full px-3 py-6 text-slate-900 md:px-8">
        <main className="mx-auto flex w-full max-w-6xl flex-col gap-6">
          {/* Header Trang chủ đồng bộ Hình 1 */}
          <section className="rounded-2xl border-[1.5px] border-slate-800 bg-white p-5 shadow-[0_2px_0_rgba(15,23,42,0.06)] md:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-xl border border-slate-800 bg-[#2563EB] text-white shadow-sm">
                  <Home className="size-6" aria-hidden="true" />
                </span>
                <div>
                  <h1 className="text-2xl font-black tracking-tight text-slate-900 md:text-3xl">
                    Hôm nay bạn muốn học gì?
                  </h1>
                  <p className="mt-1.5 max-w-3xl text-sm font-normal leading-relaxed text-slate-600">
                    Chọn nhanh một phân hệ học tập bên dưới để tiếp tục lộ trình tiếng Hàn từ Hangeul đến TOPIK II.
                  </p>
                </div>
              </div>

              {isAdmin && (
                <Link
                  href="/admin"
                  className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-800 bg-[#FEF08A] px-3.5 text-xs font-bold text-amber-950 shadow-sm transition hover:bg-amber-200"
                >
                  <ShieldCheck className="size-4 text-amber-800" aria-hidden="true" />
                  <span>Trang Quản trị Hệ thống (Admin)</span>
                </Link>
              )}
            </div>
          </section>

          <ProfileBanner />

          {/* 4 chỉ số tóm tắt nhanh */}
          <section aria-label="Tóm tắt nhanh">
            <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {quickStats.map(({ label, value, sub, icon: Icon, iconBg }) => (
                <li
                  key={label}
                  className="flex items-center gap-4 rounded-2xl border-[1.5px] border-slate-800 bg-white p-5 shadow-[0_2px_0_rgba(15,23,42,0.06)]"
                >
                  <span
                    className={`flex size-12 shrink-0 items-center justify-center rounded-2xl border-2 border-slate-900 shadow-[0_2px_0_rgba(15,23,42,0.15)] ${iconBg}`}
                  >
                    <Icon className="size-6" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-xs font-semibold text-slate-500">{label}</p>
                    <p className="mt-0.5 text-2xl font-black text-slate-900">{value}</p>
                    <p className="text-xs font-semibold text-emerald-700">{sub}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          {/* Danh sách chức năng học tập */}
          <section aria-labelledby="quick-nav-heading">
            <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {navCards.map(({ href, title, desc, badge, icon: Icon, iconBg, cta }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="group flex h-full flex-col justify-between rounded-2xl border-[1.5px] border-slate-800 bg-white p-5 shadow-[0_2px_0_rgba(15,23,42,0.06)] transition-all hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`flex size-12 shrink-0 items-center justify-center rounded-2xl border-2 border-slate-900 shadow-[0_2px_0_rgba(15,23,42,0.15)] ${iconBg}`}
                        >
                          <Icon className="size-6" aria-hidden="true" />
                        </span>
                        <span className="rounded-md border border-amber-400 bg-[#FEF08A] px-2.5 py-0.5 text-[11px] font-bold text-amber-950">
                          {badge}
                        </span>
                      </div>
                      <h2 className="mt-4 text-base font-extrabold text-slate-900 group-hover:text-[#2563EB]">
                        {title}
                      </h2>
                      <p className="mt-1.5 text-xs leading-relaxed text-slate-600">{desc}</p>
                    </div>

                    <div className="mt-5 flex items-center justify-between border-t border-slate-200 pt-3">
                      <span className="text-xs font-bold text-slate-800 group-hover:text-[#2563EB]">
                        {cta}
                      </span>
                      <span className="flex size-7 items-center justify-center rounded-lg border border-slate-800 bg-[#2563EB] text-white">
                        <ChevronRight className="size-4" aria-hidden="true" />
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          {/* Từ vựng cần ôn hôm nay */}
          <section
            aria-labelledby="home-review-title"
            className="rounded-2xl border-[1.5px] border-slate-800 bg-white p-5 shadow-[0_2px_0_rgba(15,23,42,0.06)] md:p-6"
          >
            <div className="flex items-center justify-between">
              <h2 id="home-review-title" className="text-base font-extrabold text-slate-900 md:text-lg">
                Từ vựng gợi ý ôn tập hôm nay
              </h2>
              <Link
                href="/flashcard"
                className="inline-flex h-8 items-center gap-1 rounded-lg border border-slate-800 bg-[#2563EB] px-3 text-xs font-bold text-white shadow-sm hover:bg-blue-600"
              >
                <span>Khám phá chủ đề</span>
                <ChevronRight className="size-3.5" aria-hidden="true" />
              </Link>
            </div>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
              {reviewWords.map((w) => (
                <li
                  key={w.ko}
                  className="flex flex-col justify-between rounded-xl border-[1.5px] border-slate-800 bg-slate-50/70 p-4"
                >
                  <div>
                    <span className="inline-block rounded-md border border-amber-400 bg-[#FEF08A] px-2 py-0.5 text-[11px] font-bold text-amber-950">
                      {w.level}
                    </span>
                    <p lang="ko" className="mt-2.5 text-2xl font-black text-slate-900">
                      {w.ko}
                    </p>
                    <p className="mt-1 text-xs font-medium text-slate-600">{w.vi}</p>
                  </div>
                  <Link
                    href="/flashcard"
                    className="mt-4 inline-flex h-8 items-center justify-center rounded-lg border border-slate-800 bg-white text-xs font-bold text-slate-800 transition-colors hover:bg-[#2563EB] hover:text-white"
                  >
                    Ôn ngay
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </main>
      </div>
    </AppShell>
  )
}
