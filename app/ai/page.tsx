import type { Metadata } from 'next'
import { AppShell } from '@/components/hango/app-shell'
import { AiTabs, type AiTab } from '@/components/ai/ai-tabs'

export const metadata: Metadata = { title: 'AI Luyện tập | HANGO' }

export default async function AiPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; word?: string }>
}) {
  const { tab, word } = await searchParams
  const initialTab: AiTab =
    tab === 'pronounce' ? 'pronounce' : tab === 'handwriting' ? 'handwriting' : 'chat'

  return (
    <AppShell>
      <main className="flex-1 p-4 md:p-8">
        <header className="mb-6">
          <h1 className="text-2xl font-bold md:text-3xl">AI Luyện tập</h1>
          <p className="mt-1 text-muted-foreground">
            Hội thoại tình huống, chấm điểm phát âm và luyện viết chữ Hàn với bộ dữ liệu PE92.
          </p>
        </header>
        <AiTabs key={`${initialTab}-${word ?? ''}`} initialTab={initialTab} initialWord={word} />
      </main>
    </AppShell>
  )
}
