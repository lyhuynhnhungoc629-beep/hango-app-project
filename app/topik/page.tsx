import type { Metadata } from 'next'
import { TopikTest } from '@/components/topik/topik-test'
import { RequireAuth } from '@/components/hango/app-shell'

export const metadata: Metadata = { title: 'Thi thử TOPIK | HANGO' }

export default function TopikPage() {
  return (
    <RequireAuth>
      <TopikTest />
    </RequireAuth>
  )
}
