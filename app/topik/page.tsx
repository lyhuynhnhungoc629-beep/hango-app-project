import type { Metadata } from 'next'
import { TopikTest } from '@/components/topik/topik-test'
import { AppShell } from '@/components/hango/app-shell'

export const metadata: Metadata = { title: 'Thi thử TOPIK | HANGO' }

export default function TopikPage() {
  return (
    <AppShell>
      <TopikTest />
    </AppShell>
  )
}
