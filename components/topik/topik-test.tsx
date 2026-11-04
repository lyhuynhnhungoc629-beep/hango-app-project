'use client'

import { useEffect, useState } from 'react'
import { Check, ChevronLeft, ChevronRight, Clock, Headphones, Pause, Play, RotateCcw } from 'lucide-react'
import { BackButton } from '@/components/hango/back-button'
import { cn } from '@/lib/utils'

const TOTAL = 40
const LISTENING_END = 15

const question = {
  text: '다음을 듣고 남자가 이어서 할 말로 가장 알맞은 것을 고르십시오.',
  hint: 'Nghe đoạn hội thoại và chọn câu nói tiếp theo phù hợp nhất của người đàn ông.',
  options: ['네, 지금 바로 갈게요.', '아니요, 어제 만났어요.', '네, 커피를 좋아해요.', '아니요, 학생이 아니에요.'],
}

const initialAnswers: Record<number, number> = { 1: 0, 2: 2, 3: 1, 4: 3, 5: 0, 6: 1, 7: 2, 8: 0, 9: 3, 10: 1, 11: 2, 16: 0, 18: 1 }

const waveform = Array.from({ length: 64 }, (_, i) => 20 + Math.round(Math.abs(Math.sin(i * 0.55) * Math.cos(i * 0.21)) * 80))

function formatTime(total: number) {
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function TopikTest() {
  const [current, setCurrent] = useState(12)
  const [answers, setAnswers] = useState(initialAnswers)
  const [secondsLeft, setSecondsLeft] = useState(45 * 60 + 23)
  const [playing, setPlaying] = useState(false)
  const audioDuration = 150
  const audioPos = 45

  useEffect(() => {
    const id = setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000)
    return () => clearInterval(id)
  }, [])

  const urgent = secondsLeft < 5 * 60
  const isListening = current <= LISTENING_END
  const selected = answers[current]
  const answeredCount = Object.keys(answers).length

  const renderGrid = (from: number, to: number) => (
    <div className="grid grid-cols-5 gap-2">
      {Array.from({ length: to - from + 1 }, (_, i) => from + i).map((n) => {
        const answered = answers[n] !== undefined
        const isCurrent = n === current
        return (
          <button
            key={n}
            type="button"
            onClick={() => setCurrent(n)}
            aria-label={`Câu ${n}${answered ? ', đã trả lời' : ''}`}
            aria-current={isCurrent ? 'step' : undefined}
            className={cn(
              'flex aspect-square items-center justify-center rounded-lg text-sm font-semibold transition-colors',
              answered ? 'bg-primary text-white' : 'bg-white text-[#0F0F1A] hover:bg-white/80',
              isCurrent && 'ring-2 ring-violet-300 ring-offset-2 ring-offset-panel',
            )}
          >
            {n}
          </button>
        )
      })}
    </div>
  )

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur">
        <div className="flex h-16 items-center justify-between gap-4 px-4 md:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <BackButton />
            <h1 className="hidden truncate text-sm font-semibold sm:block md:text-base">Đề thi thử TOPIK I - Số 03</h1>
          </div>
          <div
            role="timer"
            aria-label="Thời gian còn lại"
            className={cn(
              'flex items-center gap-2 rounded-xl px-4 py-1.5 font-mono text-2xl font-bold tabular-nums text-red-400 md:text-3xl',
              urgent && 'animate-pulse bg-red-500/15 ring-1 ring-red-500',
            )}
          >
            <Clock className="size-6" aria-hidden="true" />
            {formatTime(secondsLeft)}
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-muted-foreground sm:inline">
              Câu <span className="font-semibold text-foreground">{current}</span>/{TOTAL}
            </span>
            <button type="button" className="h-10 rounded-xl bg-red-500 px-4 text-sm font-semibold text-white hover:bg-red-600">
              Nộp bài
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 flex-col md:flex-row">
        <aside aria-label="Danh sách câu hỏi" className="border-b border-border bg-panel p-5 md:w-[30%] md:border-b-0 md:border-r">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Đã làm</span>
            <span className="font-semibold">
              {answeredCount}/{TOTAL}
            </span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
            <div className="h-full bg-primary" style={{ width: `${(answeredCount / TOTAL) * 100}%` }} />
          </div>
          <h2 className="mb-3 mt-6 text-sm font-semibold text-violet-300">Phần Nghe (1-15)</h2>
          {renderGrid(1, LISTENING_END)}
          <h2 className="mb-3 mt-6 text-sm font-semibold text-violet-300">Phần Đọc (16-40)</h2>
          {renderGrid(LISTENING_END + 1, TOTAL)}
          <ul className="mt-6 flex flex-wrap gap-4 text-xs text-muted-foreground">
            <li className="flex items-center gap-2">
              <span className="size-3 rounded bg-white" /> Chưa làm
            </li>
            <li className="flex items-center gap-2">
              <span className="size-3 rounded bg-primary" /> Đã làm
            </li>
            <li className="flex items-center gap-2">
              <span className="size-3 rounded ring-2 ring-violet-300" /> Hiện tại
            </li>
          </ul>
        </aside>

        <main className="flex-1 p-4 md:p-8">
          <article className="mx-auto max-w-3xl rounded-2xl border border-border bg-card p-6 md:p-8">
            <div className="flex items-center gap-3">
              <span className="rounded-lg bg-primary px-3 py-1 text-sm font-bold">Câu {current}</span>
              <span className="text-sm text-muted-foreground">{isListening ? 'Phần Nghe' : 'Phần Đọc'}</span>
            </div>

            {isListening && (
              <div className="mt-6 flex items-center gap-4 rounded-2xl bg-background p-4">
                <button
                  type="button"
                  onClick={() => setPlaying((p) => !p)}
                  aria-label={playing ? 'Tạm dừng' : 'Phát âm thanh'}
                  className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary hover:bg-primary/90"
                >
                  {playing ? <Pause className="size-5" aria-hidden="true" /> : <Play className="ml-0.5 size-5" aria-hidden="true" />}
                </button>
                <div className="flex h-10 flex-1 items-center gap-[3px]" aria-hidden="true">
                  {waveform.map((h, i) => (
                    <span
                      key={i}
                      className={cn('flex-1 rounded-full', i / waveform.length < audioPos / audioDuration ? 'bg-violet-400' : 'bg-white/15')}
                      style={{ height: `${h}%` }}
                    />
                  ))}
                </div>
                <span className="shrink-0 font-mono text-sm tabular-nums text-muted-foreground">
                  {formatTime(audioPos).replace(/^0/, '')}/{formatTime(audioDuration).replace(/^0/, '')}
                </span>
                <button type="button" aria-label="Nghe lại" className="flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-white/5">
                  <RotateCcw className="size-5" aria-hidden="true" />
                </button>
              </div>
            )}

            <div className="mt-6">
              {isListening && <Headphones className="mb-2 size-5 text-violet-300" aria-hidden="true" />}
              <p lang="ko" className="text-lg font-medium leading-relaxed">
                {question.text}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">{question.hint}</p>
            </div>

            <fieldset className="mt-6">
              <legend className="sr-only">Chọn đáp án</legend>
              <div className="flex flex-col gap-3">
                {question.options.map((opt, i) => {
                  const letter = 'ABCD'[i]
                  const isSelected = selected === i
                  return (
                    <label
                      key={letter}
                      className={cn(
                        'flex cursor-pointer items-center gap-4 rounded-xl border p-4 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary',
                        isSelected ? 'border-primary bg-primary/90 text-white' : 'border-border bg-background hover:border-primary/50',
                      )}
                    >
                      <input
                        type="radio"
                        name={`q-${current}`}
                        className="sr-only"
                        checked={isSelected}
                        onChange={() => setAnswers((a) => ({ ...a, [current]: i }))}
                      />
                      <span
                        className={cn(
                          'flex size-9 shrink-0 items-center justify-center rounded-lg font-bold',
                          isSelected ? 'bg-white text-primary' : 'bg-white/10',
                        )}
                      >
                        {letter}
                      </span>
                      <span lang="ko" className="flex-1">
                        {opt}
                      </span>
                      {isSelected && <Check className="size-5" aria-hidden="true" />}
                    </label>
                  )
                })}
              </div>
            </fieldset>

            <div className="mt-8 flex justify-between">
              <button
                type="button"
                disabled={current === 1}
                onClick={() => setCurrent((c) => c - 1)}
                className="flex h-11 items-center gap-2 rounded-xl border border-white/15 px-4 font-medium hover:bg-white/5 disabled:opacity-40"
              >
                <ChevronLeft className="size-4" aria-hidden="true" />
                Câu trước
              </button>
              <button
                type="button"
                disabled={current === TOTAL}
                onClick={() => setCurrent((c) => c + 1)}
                className="flex h-11 items-center gap-2 rounded-xl bg-primary px-4 font-medium hover:bg-primary/90 disabled:opacity-40"
              >
                Câu tiếp
                <ChevronRight className="size-4" aria-hidden="true" />
              </button>
            </div>
          </article>
        </main>
      </div>
    </div>
  )
}
