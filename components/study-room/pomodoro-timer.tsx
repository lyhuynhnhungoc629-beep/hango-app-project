'use client'

import { useEffect, useState } from 'react'
import { Pause, Play, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'

const FOCUS_SECONDS = 25 * 60
const RADIUS = 110
const CIRC = 2 * Math.PI * RADIUS

export function PomodoroTimer() {
  const [left, setLeft] = useState(FOCUS_SECONDS)
  const [running, setRunning] = useState(false)
  const [completed, setCompleted] = useState(2)
  const [minutesToday, setMinutesToday] = useState(75)

  useEffect(() => {
    if (!running) return
    const id = setInterval(() => setLeft((s) => Math.max(0, s - 1)), 1000)
    return () => clearInterval(id)
  }, [running])

  useEffect(() => {
    if (left !== 0) return
    setRunning(false)
    setCompleted((c) => Math.min(c + 1, 4))
    setMinutesToday((m) => m + 25)
    setLeft(FOCUS_SECONDS)
  }, [left])

  const m = String(Math.floor(left / 60)).padStart(2, '0')
  const s = String(left % 60).padStart(2, '0')
  const progress = left / FOCUS_SECONDS

  return (
    <section aria-labelledby="pomo-title" className="flex flex-col items-center rounded-2xl border border-border bg-card p-6">
      <div className="flex w-full items-center justify-between">
        <h2 id="pomo-title" className="font-semibold">
          Phiên học tập
        </h2>
        <span className="rounded-full bg-primary/15 px-3 py-1 text-xs font-medium text-violet-300">Thời gian tập trung</span>
      </div>
      <div className="relative my-8 size-64">
        <svg viewBox="0 0 256 256" className="size-full -rotate-90" aria-hidden="true">
          <defs>
            <linearGradient id="pomo-grad" x1="0" x2="1" y1="0" y2="1">
              <stop offset="0%" stopColor="#a78bfa" />
              <stop offset="100%" stopColor="#7c3aed" />
            </linearGradient>
          </defs>
          <circle cx="128" cy="128" r={RADIUS} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="14" />
          <circle
            cx="128"
            cy="128"
            r={RADIUS}
            fill="none"
            stroke="url(#pomo-grad)"
            strokeWidth="14"
            strokeLinecap="round"
            strokeDasharray={CIRC}
            strokeDashoffset={CIRC * (1 - progress)}
            className="transition-[stroke-dashoffset] duration-1000 ease-linear"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span role="timer" className="font-mono text-6xl font-bold tabular-nums">
            {m}:{s}
          </span>
          <span className="mt-1 text-sm text-muted-foreground">{running ? 'Đang tập trung...' : 'Sẵn sàng'}</span>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => {
            setRunning(false)
            setLeft(FOCUS_SECONDS)
          }}
          aria-label="Đặt lại"
          className="flex size-12 items-center justify-center rounded-full border border-border bg-background hover:border-primary/50"
        >
          <RotateCcw className="size-5" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() => setRunning((r) => !r)}
          className="flex h-14 items-center gap-2 rounded-full bg-primary px-8 font-semibold shadow-lg shadow-primary/30 hover:bg-primary/90"
        >
          {running ? <Pause className="size-5" aria-hidden="true" /> : <Play className="size-5" aria-hidden="true" />}
          {running ? 'Tạm dừng' : 'Bắt đầu'}
        </button>
      </div>
      <div className="mt-6 flex items-center gap-2" aria-label={`${completed} trên 4 pomodoro đã hoàn thành`}>
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className={cn('size-3 rounded-full', i < completed ? 'bg-primary' : 'bg-white/15')} />
        ))}
      </div>
      <div className="mt-6 w-full rounded-xl bg-background p-4 text-center">
        <p className="text-xs text-muted-foreground">Tổng thời gian học hôm nay</p>
        <p className="mt-1 text-2xl font-bold">
          {minutesToday} <span className="text-base font-medium text-muted-foreground">phút</span>
        </p>
      </div>
    </section>
  )
}
