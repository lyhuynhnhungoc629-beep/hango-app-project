import type { Metadata } from 'next'
import { AppShell } from '@/components/hango/app-shell'
import { AiTabs } from '@/components/ai/ai-tabs'

export const metadata: Metadata = { title: 'AI Luyện tập | HANGO' }

export default async function AiPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab } = await searchParams
  return (
    <AppShell>
      <main className="flex-1 p-4 md:p-8">
        <header className="mb-6">
          <h1 className="text-2xl font-bold md:text-3xl">AI Luyện tập</h1>
          <p className="mt-1 text-muted-foreground">Hội thoại tình huống và chấm điểm phát âm với AI.</p>
        </header>
        <AiTabs key={tab ?? 'chat'} initialTab={tab === 'pronounce' ? 'pronounce' : 'chat'} />
      </main>
    </AppShell>
  )
}
