'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Brain, ChevronRight, Clock, FileText, LayoutDashboard, Trophy } from 'lucide-react'
import { AppShell } from '@/components/hango/app-shell'
import { TestScoresChart, WeeklyStudyChart } from '@/components/dashboard/charts'
import { ProfileBanner } from '@/components/dashboard/profile-banner'
import { useAuth } from '@/lib/auth-context'
import type { UserLearningProgress } from '@/lib/backend/user-store'

const reviewWords = [
  { ko: '사과', vi: 'Quả táo' },
  { ko: '친구', vi: 'Bạn bè' },
  { ko: '날씨', vi: 'Thời tiết' },
  { ko: '공부하다', vi: 'Học tập' },
  { ko: '행복하다', vi: 'Hạnh phúc' },
]

export default function DashboardPage() {
  const { profile, token } = useAuth()
  const [progress, setProgress] = useState<UserLearningProgress | null>(null)

  useEffect(() => {
    if (!token) return
    fetch('/api/srs/review', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((r) => r.json())
      .then((json) => {
        if (json.success && json.progress) {
          setProgress(json.progress)
        }
      })
      .catch(() => {
        // ignore
      })
  }, [token])

  const totalMinutes = profile?.totalStudyMinutes ?? 0
  const learnedVocab = profile?.learnedVocabCount ?? 0
  const topikList = progress?.topikResults || []
  const avgScore =
    topikList.length > 0
      ? Math.round(topikList.reduce((acc, r) => acc + r.score, 0) / topikList.length)
      : 0

  const stats = [
    {
      label: 'Tổng thời gian học',
      value: `${totalMinutes} phút`,
      delta: `${progress?.pomodoroSessions.length ?? 0} phiên Pomodoro hoàn thành`,
      icon: Clock,
      iconBg: 'bg-[#3B82F6] text-white',
    },
    {
      label: 'Từ vựng đã học',
      value: `${learnedVocab} từ`,
      delta: 'Ôn tập từ vựng định kỳ',
      icon: Brain,
      iconBg: 'bg-[#8B5CF6] text-white',
    },
    {
      label: 'Điểm TB thi thử TOPIK',
      value: topikList.length > 0 ? `${avgScore}/200` : 'Chưa thi',
      delta: topikList.length > 0 ? topikList[0].levelAchieved : 'Hãy làm đề thi thử đầu tiên',
      icon: Trophy,
      iconBg: 'bg-[#F59E0B] text-slate-950',
    },
    {
      label: 'Bài thi đã làm',
      value: `${topikList.length} đề`,
      delta: 'TOPIK I & II',
      icon: FileText,
      iconBg: 'bg-[#22C55E] text-slate-950',
    },
  ]

  return (
    <AppShell>
      <div className="min-h-screen w-full px-3 py-6 text-slate-900 md:px-8">
        <main className="mx-auto flex w-full max-w-6xl flex-col gap-6">
          {/* Header Dashboard đồng bộ Hình 1 */}
          <section className="rounded-2xl border-[1.5px] border-slate-800 bg-white p-5 shadow-[0_2px_0_rgba(15,23,42,0.06)] md:p-6">
            <div className="flex items-start gap-4">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-xl border border-slate-800 bg-[#2563EB] text-white shadow-sm">
                <LayoutDashboard className="size-6" aria-hidden="true" />
              </span>
              <div>
                <h1 className="text-2xl font-black tracking-tight text-slate-900 md:text-3xl">
                  Thống kê & Tiến độ học tập
                </h1>
                <p className="mt-1.5 max-w-3xl text-sm font-normal leading-relaxed text-slate-600">
                  Theo dõi tổng thời gian học tập, số từ vựng đã ghi nhớ bằng thuật toán SRS và kết quả làm bài thi thử TOPIK của bạn.
                </p>
              </div>
            </div>
          </section>

          <ProfileBanner />

          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map(({ label, value, delta, icon: Icon, iconBg }) => (
              <li
                key={label}
                className="rounded-2xl border-[1.5px] border-slate-800 bg-white p-5 shadow-[0_2px_0_rgba(15,23,42,0.06)]"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                    {label}
                  </span>
                  <span
                    className={`flex size-10 items-center justify-center rounded-xl border-2 border-slate-900 shadow-[0_2px_0_rgba(15,23,42,0.15)] ${iconBg}`}
                  >
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                </div>
                <p className="mt-3 text-3xl font-black text-slate-900">{value}</p>
                <p className="mt-1 text-xs font-semibold text-emerald-700">{delta}</p>
              </li>
            ))}
          </ul>

          <div className="grid gap-6 lg:grid-cols-2">
            <WeeklyStudyChart />
            <TestScoresChart />
          </div>

          <section
            aria-labelledby="review-title"
            className="rounded-2xl border-[1.5px] border-slate-800 bg-white p-5 shadow-[0_2px_0_rgba(15,23,42,0.06)] md:p-6"
          >
            <div className="flex items-center justify-between">
              <h2 id="review-title" className="text-base font-extrabold text-slate-900 md:text-lg">
                Từ vựng gợi ý cần ôn hôm nay
              </h2>
              <Link
                href="/flashcard"
                className="inline-flex h-8 items-center gap-1 rounded-lg border border-slate-800 bg-[#2563EB] px-3 text-xs font-bold text-white shadow-sm hover:bg-blue-600"
              >
                <span>Ôn tất cả</span>
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
                    <p lang="ko" className="text-2xl font-black text-slate-900">
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
