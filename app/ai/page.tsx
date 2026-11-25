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
          <section className="rounded-2xl border-[1.5px] border-slate-800 bg-gradient-to-r from-white via-white to-violet-50/70 p-5 shadow-[0_3px_0_rgba(15,23,42,0.08)] md:p-6">
            <div className="flex items-start gap-4">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-xl border-[1.5px] border-slate-800 bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-[0_2px_0_rgba(15,23,42,0.12)]">
                <Sparkles className="size-6" aria-hidden="true" />
              </span>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-black tracking-tight text-slate-900 md:text-3xl">
                    Luyện tập tiếng Hàn thông minh
                  </h1>
                  <span className="rounded-full border border-violet-300 bg-violet-100 px-2.5 py-0.5 text-[11px] font-bold text-[#7C3AED]">
                    AI Studio
                  </span>
                </div>
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
