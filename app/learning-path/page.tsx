import type { Metadata } from 'next'
import { AppShell } from '@/components/hango/app-shell'
import { LearningPathView } from '@/components/learning-path/learning-path-view'

export const metadata: Metadata = {
  title: 'Lộ trình học tiếng Hàn 7 Chặng | HANGO',
}

export default function LearningPathPage() {
  return (
    <AppShell>
      <LearningPathView />
    </AppShell>
  )
}
