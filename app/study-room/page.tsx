import type { Metadata } from 'next'
import { AppShell } from '@/components/hango/app-shell'
import { PomodoroTimer } from '@/components/study-room/pomodoro-timer'
import { SoundMixer } from '@/components/study-room/sound-mixer'
import { GoalList } from '@/components/study-room/goal-list'

export const metadata: Metadata = { title: 'Phòng học ảo | HANGO' }

export default function StudyRoomPage() {
  return (
    <AppShell>
      <main className="flex-1 p-4 md:p-8">
        <header className="mb-8">
          <p className="text-sm text-muted-foreground">공부합시다!</p>
          <h1 className="mt-1 text-2xl font-bold md:text-3xl">Phòng học ảo</h1>
        </header>
        <div className="grid gap-6 lg:grid-cols-3">
          <PomodoroTimer />
          <SoundMixer />
          <GoalList />
        </div>
      </main>
    </AppShell>
  )
}
