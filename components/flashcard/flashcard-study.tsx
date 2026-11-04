'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, Info, RotateCw, Volume2, X } from 'lucide-react'
import { BackButton } from '@/components/hango/back-button'
import { cn } from '@/lib/utils'

const words = [
  {
    ko: '안녕하세요',
    roman: 'an-nyeong-ha-se-yo',
    meaning: 'Xin chào',
    pos: 'Thán từ',
    exKo: '선생님, 안녕하세요!',
    exVi: 'Chào thầy/cô ạ!',
  },
  {
    ko: '감사합니다',
    roman: 'gam-sa-ham-ni-da',
    meaning: 'Cảm ơn',
    pos: 'Thán từ',
    exKo: '도와주셔서 감사합니다.',
    exVi: 'Cảm ơn vì đã giúp đỡ tôi.',
  },
  {
    ko: '학교',
    roman: 'hak-gyo',
    meaning: 'Trường học',
    pos: 'Danh từ',
    exKo: '저는 학교에 가요.',
    exVi: 'Tôi đi đến trường.',
  },
  {
    ko: '먹다',
    roman: 'meok-da',
    meaning: 'Ăn',
    pos: 'Động từ',
    exKo: '같이 밥을 먹어요.',
    exVi: 'Cùng nhau ăn cơm nhé.',
  },
]

const TOTAL = 100
const START = 24

const responses = [
  { label: 'Quên', emoji: '😰', className: 'bg-red-500/15 text-red-300 border-red-500/40 hover:bg-red-500 hover:text-white' },
  { label: 'Khó', emoji: '🤔', className: 'bg-amber-500/15 text-amber-300 border-amber-500/40 hover:bg-amber-500 hover:text-[#0F0F1A]' },
  { label: 'Nhớ', emoji: '✅', className: 'bg-green-500/15 text-green-300 border-green-500/40 hover:bg-green-500 hover:text-[#0F0F1A]' },
]

export function FlashcardStudy() {
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [panelOpen, setPanelOpen] = useState(false)

  const position = START + index
  const word = words[((index % words.length) + words.length) % words.length]
  const percent = Math.round((position / TOTAL) * 100)

  const go = (delta: number) => {
    setFlipped(false)
    setIndex((i) => Math.min(Math.max(i + delta, 1 - START), TOTAL - START))
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-border">
        <div className="mx-auto flex h-16 max-w-5xl items-center gap-4 px-4 md:gap-6">
          <BackButton />
          <nav aria-label="Breadcrumb" className="hidden shrink-0 text-sm sm:block">
            <ol className="flex items-center gap-1.5 text-muted-foreground">
              <li>TOPIK I</li>
              <li aria-hidden="true">/</li>
              <li className="font-semibold text-foreground">Cấp độ 1</li>
            </ol>
          </nav>
          <div className="flex flex-1 items-center gap-3">
            <div
              className="h-2 flex-1 overflow-hidden rounded-full bg-white/10"
              role="progressbar"
              aria-valuenow={position}
              aria-valuemin={0}
              aria-valuemax={TOTAL}
              aria-label="Tiến độ"
            >
              <div className="h-full rounded-full bg-gradient-to-r from-violet-400 to-primary transition-all" style={{ width: `${percent}%` }} />
            </div>
            <span className="shrink-0 text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">
                {position}/{TOTAL} từ
              </span>{' '}
              · {percent}%
            </span>
          </div>
          <Link href="/" aria-label="Đóng" className="flex size-9 items-center justify-center rounded-lg hover:bg-white/5">
            <X className="size-5" aria-hidden="true" />
          </Link>
        </div>
      </header>

      <main className="relative flex flex-1 flex-col items-center justify-center gap-10 px-4 py-10">
        <div className="perspective-1000 w-full max-w-md">
          <button
            type="button"
            onClick={() => setFlipped((f) => !f)}
            aria-label={flipped ? 'Lật về mặt trước' : 'Lật thẻ để xem nghĩa'}
            className={cn(
              'preserve-3d relative aspect-[4/5] w-full rounded-3xl transition-transform duration-500 sm:aspect-[5/4]',
              flipped && 'rotate-y-180',
            )}
          >
            <span className="backface-hidden absolute inset-0 rounded-3xl bg-gradient-to-br from-violet-400 via-primary to-fuchsia-500 p-[3px] shadow-[0_30px_80px_-20px_rgba(124,58,237,0.6)]">
              <span className="flex h-full flex-col rounded-[22px] bg-white p-6 text-[#0F0F1A]">
                <span className="flex justify-end">
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">TOPIK I</span>
                </span>
                <span className="flex flex-1 flex-col items-center justify-center gap-3">
                  <span lang="ko" className="text-5xl font-extrabold md:text-6xl">
                    {word.ko}
                  </span>
                  <span className="text-lg text-slate-500">{word.roman}</span>
                </span>
                <span className="flex items-center justify-between">
                  <span className="flex size-11 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Volume2 className="size-5" aria-hidden="true" />
                    <span className="sr-only">Nghe phát âm</span>
                  </span>
                  <span className="flex items-center gap-1.5 text-sm text-slate-400">
                    <RotateCw className="size-4" aria-hidden="true" />
                    Nhấn để lật
                  </span>
                </span>
              </span>
            </span>
            <span className="backface-hidden rotate-y-180 absolute inset-0 rounded-3xl bg-gradient-to-br from-violet-400 via-primary to-fuchsia-500 p-[3px]">
              <span className="flex h-full flex-col items-center justify-center gap-3 rounded-[22px] bg-white p-6 text-[#0F0F1A]">
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">{word.pos}</span>
                <span className="text-4xl font-bold">{word.meaning}</span>
                <span lang="ko" className="text-slate-600">
                  {word.exKo}
                </span>
                <span className="text-sm text-slate-400">{word.exVi}</span>
              </span>
            </span>
          </button>
        </div>

        <div className="grid w-full max-w-md grid-cols-3 gap-3">
          {responses.map((r) => (
            <button
              key={r.label}
              type="button"
              onClick={() => go(1)}
              className={cn('flex h-16 items-center justify-center gap-2 rounded-2xl border text-lg font-semibold transition-colors', r.className)}
            >
              <span aria-hidden="true">{r.emoji}</span>
              {r.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setPanelOpen(true)}
          className="absolute right-4 top-6 flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm font-medium hover:border-primary/50"
          aria-expanded={panelOpen}
          aria-controls="word-details"
        >
          <Info className="size-4" aria-hidden="true" />
          Chi tiết từ
        </button>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex h-20 max-w-5xl items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => go(-1)} aria-label="Thẻ trước" className="flex size-11 items-center justify-center rounded-xl border border-border bg-card hover:border-primary/50">
              <ChevronLeft className="size-5" aria-hidden="true" />
            </button>
            <span className="min-w-20 text-center font-semibold tabular-nums">
              {position} / {TOTAL}
            </span>
            <button type="button" onClick={() => go(1)} aria-label="Thẻ tiếp theo" className="flex size-11 items-center justify-center rounded-xl border border-border bg-card hover:border-primary/50">
              <ChevronRight className="size-5" aria-hidden="true" />
            </button>
          </div>
          <span className="rounded-full border border-orange-500/30 bg-orange-500/10 px-4 py-2 text-sm font-semibold text-orange-300">
            <span aria-hidden="true">🔥</span> 7 ngày liên tiếp
          </span>
        </div>
      </footer>

      <div
        aria-hidden="true"
        onClick={() => setPanelOpen(false)}
        className={cn('fixed inset-0 z-40 bg-black/50 transition-opacity', panelOpen ? 'opacity-100' : 'pointer-events-none opacity-0')}
      />
      <aside
        id="word-details"
        aria-label="Chi tiết từ vựng"
        inert={!panelOpen}
        className={cn(
          'fixed right-0 top-0 z-50 flex h-full w-full max-w-sm flex-col gap-6 border-l border-border bg-card p-6 shadow-2xl transition-transform duration-300',
          panelOpen ? 'translate-x-0' : 'translate-x-full',
        )}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Chi tiết từ vựng</h2>
          <button type="button" onClick={() => setPanelOpen(false)} aria-label="Đóng" className="flex size-9 items-center justify-center rounded-lg hover:bg-white/5">
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>
        <div>
          <p lang="ko" className="text-3xl font-bold">
            {word.ko}
          </p>
          <span className="mt-3 inline-block rounded-full bg-primary/15 px-3 py-1 text-xs font-semibold text-violet-300">{word.pos}</span>
        </div>
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Nghĩa tiếng Việt</h3>
          <p className="mt-2 text-xl font-semibold">{word.meaning}</p>
        </section>
        <section className="rounded-2xl bg-background p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Câu ví dụ</h3>
          <p lang="ko" className="mt-3 text-lg">
            {word.exKo}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">{word.exVi}</p>
        </section>
      </aside>
    </div>
  )
}
