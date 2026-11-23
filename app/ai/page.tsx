import type { Metadata } from 'next'
import { Sparkles } from 'lucide-react'
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
      <div className="min-h-screen w-full px-3 py-6 text-slate-900 md:px-8">
        <main className="mx-auto flex w-full max-w-6xl flex-col gap-6">
          <section className="rounded-2xl border-[1.5px] border-slate-800 bg-white p-5 shadow-[0_2px_0_rgba(15,23,42,0.06)] md:p-6">
            <div className="flex items-start gap-4">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-xl border border-slate-800 bg-[#2563EB] text-white shadow-sm">
                <Sparkles className="size-6" aria-hidden="true" />
              </span>
              <div>
                <h1 className="text-2xl font-black tracking-tight text-slate-900 md:text-3xl">
                  Luyện tập tiếng Hàn thông minh
                </h1>
                <p className="mt-1.5 max-w-3xl text-sm font-normal leading-relaxed text-slate-600">
                  Thực hành hội thoại theo tình huống thực tế, luyện phát âm giọng đọc và tập viết chữ Hàn trên bảng ô ly.
                </p>
              </div>
            </div>
          </section>

          <AiTabs key={`${initialTab}-${word ?? ''}`} initialTab={initialTab} initialWord={word} />
        </main>
      </div>
    </AppShell>
  )
}
