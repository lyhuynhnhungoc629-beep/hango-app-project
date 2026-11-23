import type { Metadata } from 'next'
import { Timer } from 'lucide-react'
import { AppShell } from '@/components/hango/app-shell'
import { PomodoroTimer } from '@/components/study-room/pomodoro-timer'
import { SoundMixer } from '@/components/study-room/sound-mixer'
import { GoalList } from '@/components/study-room/goal-list'

export const metadata: Metadata = { title: 'Phòng học ảo | HANGO' }

export default function StudyRoomPage() {
  return (
    <AppShell>
      <div className="min-h-screen w-full px-3 py-6 text-slate-900 md:px-8">
        <main className="mx-auto flex w-full max-w-6xl flex-col gap-6">
          <section className="rounded-2xl border-[1.5px] border-slate-800 bg-white p-5 shadow-[0_2px_0_rgba(15,23,42,0.06)] md:p-6">
            <div className="flex items-start gap-4">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-xl border border-slate-800 bg-[#2563EB] text-white shadow-sm">
                <Timer className="size-6" aria-hidden="true" />
              </span>
              <div>
                <h1 className="text-2xl font-black tracking-tight text-slate-900 md:text-3xl">
                  Phòng học ảo Pomodoro
                </h1>
                <p className="mt-1.5 max-w-3xl text-sm font-normal leading-relaxed text-slate-600">
                  공부합시다! Tập trung học tiếng Hàn theo chu kỳ 25 phút, kết hợp âm thanh nền thư giãn và danh sách mục tiêu học tập trong ngày.
                </p>
              </div>
            </div>
          </section>

          <div className="grid gap-6 lg:grid-cols-3">
            <PomodoroTimer />
            <SoundMixer />
            <GoalList />
          </div>
        </main>
      </div>
    </AppShell>
  )
}
