import type { Metadata } from 'next'
import { TopikTest } from '@/components/topik/topik-test'

export const metadata: Metadata = { title: 'Thi thử TOPIK | HANGO' }

export default function TopikPage() {
  return <TopikTest />
}
