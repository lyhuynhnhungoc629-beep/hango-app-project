import type { Metadata } from 'next'
import Link from 'next/link'
import { Brain, Clock, FileText, Trophy } from 'lucide-react'
import { AppShell } from '@/components/hango/app-shell'
import { TestScoresChart, WeeklyStudyChart } from '@/components/dashboard/charts'
import { ProfileBanner } from '@/components/dashboard/profile-banner'

export const metadata: Metadata = { title: 'Dashboard | HANGO' }

const stats = [
  { label: 'Tổng giờ học', value: '42.5 giờ', delta: '+2.3h tuần này', icon: Clock, gradient: 'from-violet-600/30 to-violet-600/5' },
  { label: 'Từ đã thuộc', value: '847 từ', delta: '+32 tuần này', icon: Brain, gradient: 'from-fuchsia-600/30 to-fuchsia-600/5' },
  { label: 'Điểm TB thi thử', value: '72/100', delta: '+5 điểm', icon: Trophy, gradient: 'from-amber-500/25 to-amber-500/5' },
  { label: 'Bài thi đã làm', value: '18 đề', delta: 'TOPIK I & II', icon: FileText, gradient: 'from-sky-500/25 to-sky-500/5' },
]

const reviewWords = [
  { ko: '사과', vi: 'Quả táo' },
  { ko: '친구', vi: 'Bạn bè' },
  { ko: '날씨', vi: 'Thời tiết' },
  { ko: '공부하다', vi: 'Học tập' },
  { ko: '행복하다', vi: 'Hạnh phúc' },
]

export default function DashboardPage() {
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
