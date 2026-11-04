'use client'

import { useState } from 'react'
import { AlertTriangle, Check, Mic, Square, Volume2, X } from 'lucide-react'
import { cn } from '@/lib/utils'

type Status = 'good' | 'warn' | 'bad'
const syllables: { text: string; status: Status }[] = [
  { text: '오늘', status: 'good' },
  { text: '날씨', status: 'warn' },
  { text: '가', status: 'good' },
  { text: '좋', status: 'good' },
  { text: '네', status: 'good' },
  { text: '요', status: 'good' },
]

const statusStyle: Record<Status, { cls: string; icon: typeof Check; label: string }> = {
  good: { cls: 'border-green-500/40 bg-green-500/10 text-green-300', icon: Check, label: 'Chính xác' },
  warn: { cls: 'border-amber-500/40 bg-amber-500/10 text-amber-300', icon: AlertTriangle, label: 'Cần cải thiện' },
  bad: { cls: 'border-red-500/40 bg-red-500/10 text-red-300', icon: X, label: 'Chưa đúng' },
}

const SCORE = 85
const R = 54
const C = 2 * Math.PI * R

export function PronunciationPractice() {
  const [recording, setRecording] = useState(false)

  return (
    <section aria-label="Luyện phát âm" className="mx-auto max-w-3xl rounded-2xl border border-border bg-card p-6 md:p-10">
      <p className="text-center text-sm text-muted-foreground">Đọc to câu sau</p>
      <p lang="ko" className="mt-3 text-center text-4xl font-bold md:text-5xl">
        오늘 날씨가 좋네요
      </p>
      <p className="mt-3 text-center text-muted-foreground">o-neul nal-ssi-ga jo-ne-yo</p>
      <p className="mt-1 text-center text-sm text-muted-foreground">{'"Hôm nay thời tiết đẹp nhỉ"'}</p>
      <div className="mt-4 flex justify-center">
        <button type="button" className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm font-medium hover:border-primary/50">
          <Volume2 className="size-4 text-violet-400" aria-hidden="true" />
          Nghe phát âm mẫu
        </button>
      </div>

      <div className="mt-10 flex flex-col items-center gap-10 md:flex-row md:justify-center md:gap-20">
        <div className="flex flex-col items-center">
          <div className="relative">
            {recording && (
              <>
                <span aria-hidden="true" className="absolute inset-0 animate-ping rounded-full bg-primary/40" />
                <span aria-hidden="true" className="absolute -inset-4 animate-pulse rounded-full bg-primary/20" />
              </>
            )}
            <button
              type="button"
              aria-pressed={recording}
              onClick={() => setRecording((r) => !r)}
              className={cn(
                'relative flex size-28 items-center justify-center rounded-full shadow-2xl transition-colors',
                recording ? 'bg-red-500 shadow-red-500/40' : 'bg-primary shadow-primary/40 hover:bg-primary/90',
              )}
            >
              {recording ? <Square className="size-10 fill-current" aria-hidden="true" /> : <Mic className="size-12" aria-hidden="true" />}
              <span className="sr-only">{recording ? 'Dừng thu âm' : 'Bấm để thu âm'}</span>
            </button>
          </div>
          <p className="mt-5 font-medium">{recording ? 'Đang thu âm...' : 'Bấm để thu âm'}</p>
        </div>

        <div className="flex flex-col items-center">
          <div className="relative size-36">
            <svg viewBox="0 0 128 128" className="size-full -rotate-90" aria-hidden="true">
              <defs>
                <linearGradient id="score-grad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#7c3aed" />
                  <stop offset="100%" stopColor="#22c55e" />
                </linearGradient>
              </defs>
              <circle cx="64" cy="64" r={R} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="10" />
              <circle cx="64" cy="64" r={R} fill="none" stroke="url(#score-grad)" strokeWidth="10" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - SCORE / 100)} />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-bold">{SCORE}</span>
              <span className="text-xs text-muted-foreground">/100</span>
            </div>
          </div>
          <p className="mt-3 font-semibold text-green-400">Khá tốt!</p>
        </div>
      </div>

      <div className="mt-10 border-t border-border pt-6">
        <h3 className="text-sm font-semibold">Phân tích từng âm tiết</h3>
        <ul className="mt-4 flex flex-wrap gap-2">
          {syllables.map((s, i) => {
            const { cls, icon: Icon, label } = statusStyle[s.status]
            return (
              <li key={i} className={cn('flex items-center gap-2 rounded-xl border px-4 py-2.5', cls)}>
                <span lang="ko" className="text-xl font-bold">
                  {s.text}
                </span>
                <Icon className="size-4" aria-hidden="true" />
                <span className="sr-only">{label}</span>
              </li>
            )
          })}
        </ul>
        <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-green-500" />Chính xác</span>
          <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-amber-500" />Cần cải thiện</span>
          <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-red-500" />Chưa đúng</span>
        </div>
        <p className="mt-4 rounded-xl bg-amber-500/10 p-4 text-sm text-amber-100/90">
          <span lang="ko" className="font-semibold text-amber-300">날씨</span>: âm {'"ㅆ"'} cần căng và mạnh hơn — đọc là {'"nal-ssi"'}, không phải {'"nal-si"'}.
        </p>
      </div>
    </section>
  )
}
