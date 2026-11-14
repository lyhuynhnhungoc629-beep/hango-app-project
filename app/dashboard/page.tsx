'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Brain, Clock, FileText, Trophy } from 'lucide-react'
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
      gradient: 'from-violet-600/30 to-violet-600/5',
    },
    {
      label: 'Từ vựng đã học (SRS)',
      value: `${learnedVocab} từ`,
      delta: 'Theo dõi qua thuật toán SM-2',
      icon: Brain,
      gradient: 'from-fuchsia-600/30 to-fuchsia-600/5',
    },
    {
      label: 'Điểm TB thi thử TOPIK',
      value: topikList.length > 0 ? `${avgScore}/200` : 'Chưa thi',
      delta: topikList.length > 0 ? topikList[0].levelAchieved : 'Hãy làm đề thi thử đầu tiên',
      icon: Trophy,
      gradient: 'from-amber-500/25 to-amber-500/5',
    },
    {
      label: 'Bài thi đã làm',
      value: `${topikList.length} đề`,
      delta: 'TOPIK I & II',
      icon: FileText,
      gradient: 'from-sky-500/25 to-sky-500/5',
    },
  ]

  return (
    <AppShell>
      <main className="flex flex-col gap-6 p-4 md:p-8">
        <ProfileBanner />

        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map(({ label, value, delta, icon: Icon, gradient }) => (
            <li key={label} className={`rounded-2xl border border-border bg-gradient-to-br ${gradient} bg-card p-5`}>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{label}</span>
                <span className="flex size-10 items-center justify-center rounded-xl bg-white/10">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
              </div>
              <p className="mt-3 text-3xl font-bold">{value}</p>
              <p className="mt-1 text-sm text-green-400">{delta}</p>
            </li>
          ))}
        </ul>

        <div className="grid gap-6 lg:grid-cols-2">
          <WeeklyStudyChart />
          <TestScoresChart />
        </div>

        <section aria-labelledby="review-title">
          <div className="flex items-center justify-between">
            <h2 id="review-title" className="text-lg font-semibold">
              Từ cần ôn hôm nay
            </h2>
            <Link href="/flashcard" className="text-sm font-medium text-violet-400 hover:text-violet-300">
              Xem tất cả
            </Link>
          </div>
          <ul className="mt-4 flex snap-x gap-4 overflow-x-auto pb-2">
            {reviewWords.map((w) => (
              <li key={w.ko} className="flex w-52 shrink-0 snap-start flex-col rounded-2xl border border-border bg-card p-5">
                <p lang="ko" className="text-2xl font-bold">
                  {w.ko}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">{w.vi}</p>
                <Link href="/flashcard" className="mt-5 inline-flex h-9 items-center justify-center rounded-lg bg-primary/15 text-sm font-semibold text-violet-300 hover:bg-primary hover:text-white">
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
