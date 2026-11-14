'use client'

import { useCallback, useEffect, useState } from 'react'
import { Flame, Pause, Play, RotateCcw, Sparkles, Trophy, Zap } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import type { PomodoroGamificationResult } from '@/lib/backend/pomodoro-gamification'
import { cn } from '@/lib/utils'

const MODES = {
  focus: { label: 'Học (25p)', seconds: 25 * 60, minutes: 25, color: '#7c3aed' },
  shortBreak: { label: 'Nghỉ (5p)', seconds: 5 * 60, minutes: 5, color: '#10b981' },
  longBreak: { label: 'Nghỉ dài (15p)', seconds: 15 * 60, minutes: 15, color: '#3b82f6' },
} as const

type ModeKey = keyof typeof MODES

const RADIUS = 110
const CIRC = 2 * Math.PI * RADIUS

export function PomodoroTimer() {
  const { user, profile, token, updateGamification, refreshProfile } = useAuth()
  const [mode, setMode] = useState<ModeKey>('focus')
  const [left, setLeft] = useState<number>(MODES.focus.seconds)
  const [running, setRunning] = useState(false)
  const [completed, setCompleted] = useState(2)
  const [minutesToday, setMinutesToday] = useState(50)
  const [lastStudyDate, setLastStudyDate] = useState<string | null>(null)
  const [lastReward, setLastReward] = useState<PomodoroGamificationResult | null>(null)
  const [sessionHistory, setSessionHistory] = useState<PomodoroGamificationResult[]>([])
  const [saving, setSaving] = useState(false)

  const currentXp = profile?.xp ?? 0
  const currentStreak = profile?.streak ?? 0
  const currentLevel = profile?.level ?? 1

  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem('hango_pomodoro_sessions')
      if (savedHistory) setSessionHistory(JSON.parse(savedHistory))
      const savedDate = localStorage.getItem('hango_last_study_date')
      if (savedDate) setLastStudyDate(savedDate)
    } catch {
      // ignore
    }
  }, [])

  const playCompletionChime = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      if (!AudioCtx) return
      const ctx = new AudioCtx()

      const playNote = (freq: number, startTime: number, duration: number) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'sine'
        osc.frequency.setValueAtTime(freq, startTime)
        gain.gain.setValueAtTime(0, startTime)
        gain.gain.linearRampToValueAtTime(0.3, startTime + 0.05)
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration)
        osc.connect(gain).connect(ctx.destination)
        osc.start(startTime)
        osc.stop(startTime + duration)
      }

      playNote(587.33, ctx.currentTime, 0.4) // D5
      playNote(880, ctx.currentTime + 0.25, 0.8) // A5
    } catch {
      // ignore audio error
    }
  }, [])

  const switchMode = (newMode: ModeKey) => {
    setRunning(false)
    setMode(newMode)
    setLeft(MODES[newMode].seconds)
  }

  const finishPomodoroSession = useCallback(
    async (durationMinutes = 25) => {
      setSaving(true)
      const nextCompleted = completed + 1
      setCompleted(nextCompleted)
      setMinutesToday((m) => m + durationMinutes)
      playCompletionChime()

      try {
        const res = await fetch('/api/study-room/pomodoro', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            uid: profile?.uid || user?.uid || null,
            durationMinutes,
            completedSessionsToday: nextCompleted,
            currentXp,
            currentStreak,
            lastStudyDate,
            taskTitle: `Phiên tập trung Pomodoro #${nextCompleted}`,
          }),
        })
        const json = await res.json()
        if (json.success && json.data) {
          const reward: PomodoroGamificationResult = json.data
          setLastReward(reward)
          setLastStudyDate(reward.NgayHoc)
          updateGamification({
            xp: reward.TongXP,
            level: reward.CapDo,
            streak: reward.ChuoiStreak,
          })
          void refreshProfile()

          const updatedList = [reward, ...sessionHistory].slice(0, 5)
          setSessionHistory(updatedList)
          try {
            localStorage.setItem('hango_pomodoro_sessions', JSON.stringify(updatedList))
            localStorage.setItem('hango_last_study_date', reward.NgayHoc)
          } catch {
            // ignore
          }
        }
      } catch {
        // ignore network error
      } finally {
        setSaving(false)
      }
    },
    [completed, currentStreak, currentXp, lastStudyDate, playCompletionChime, profile?.uid, refreshProfile, sessionHistory, token, updateGamification, user?.uid],
  )

  useEffect(() => {
    if (!running) return
    const id = setInterval(() => setLeft((s) => Math.max(0, s - 1)), 1000)
    return () => clearInterval(id)
  }, [running])

  useEffect(() => {
    if (left !== 0) return
    setRunning(false)
    playCompletionChime()

    if (mode === 'focus') {
      const nextCompleted = completed + 1
      finishPomodoroSession(MODES.focus.minutes)
      if (nextCompleted % 4 === 0) {
        setMode('longBreak')
        setLeft(MODES.longBreak.seconds)
      } else {
        setMode('shortBreak')
        setLeft(MODES.shortBreak.seconds)
      }
    } else {
      setMode('focus')
      setLeft(MODES.focus.seconds)
    }
  }, [left, mode, completed, finishPomodoroSession, playCompletionChime])

  const m = String(Math.floor(left / 60)).padStart(2, '0')
  const s = String(left % 60).padStart(2, '0')
  const progress = left / MODES[mode].seconds

  return (
    <section aria-labelledby="pomo-title" className="flex flex-col items-center rounded-2xl border border-border bg-card p-6">
      <div className="flex w-full items-center justify-between">
        <h2 id="pomo-title" className="font-semibold">
          Phiên học tập Pomodoro
        </h2>
        <span className="rounded-full bg-primary/15 px-3 py-1 text-xs font-medium text-violet-300">
          25 phút = +100 XP
        </span>
      </div>

      {/* Bộ chọn 3 chế độ (Học 25p / Nghỉ 5p / Nghỉ dài 15p) từ bản của Khánh */}
      <div className="mt-4 flex w-full rounded-xl bg-background p-1">
        {(Object.keys(MODES) as ModeKey[]).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => switchMode(k)}
            className={cn(
              'flex-1 rounded-lg py-1.5 text-xs font-semibold transition-all',
              mode === k ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {MODES[k].label}
          </button>
        ))}
      </div>

      {/* Thanh chỉ số XP, Level và Chuỗi Streak trực tiếp */}
      <div className="mt-3 grid w-full grid-cols-3 gap-2 rounded-xl border border-border bg-background p-2.5 text-center text-xs">
        <div>
          <p className="text-muted-foreground">Cấp độ</p>
          <p className="mt-0.5 font-bold text-violet-300">Cấp {currentLevel}</p>
        </div>
        <div className="border-x border-border">
          <p className="text-muted-foreground">Tổng XP</p>
          <p className="mt-0.5 font-bold text-emerald-400">{currentXp.toLocaleString('vi-VN')} XP</p>
        </div>
        <div>
          <p className="text-muted-foreground">Chuỗi Streak</p>
          <p className="mt-0.5 font-bold text-orange-400">🔥 {currentStreak} ngày</p>
        </div>
      </div>

      <div className="relative my-6 size-60">
        <svg viewBox="0 0 256 256" className="size-full -rotate-90" aria-hidden="true">
          <circle cx="128" cy="128" r={RADIUS} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="14" />
          <circle
            cx="128"
            cy="128"
            r={RADIUS}
            fill="none"
            stroke={MODES[mode].color}
            strokeWidth="14"
            strokeLinecap="round"
            strokeDasharray={CIRC}
            strokeDashoffset={CIRC * (1 - progress)}
            className="transition-[stroke-dashoffset,stroke] duration-1000 ease-linear"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span role="timer" className="font-mono text-5xl font-bold tabular-nums">
            {m}:{s}
          </span>
          <span className="mt-1 text-xs text-muted-foreground">
            {running ? (mode === 'focus' ? 'Đang tập trung...' : 'Đang nghỉ ngơi...') : 'Sẵn sàng'}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => {
            setRunning(false)
            setLeft(MODES[mode].seconds)
          }}
          aria-label="Đặt lại"
          className="flex size-12 items-center justify-center rounded-full border border-border bg-background hover:border-primary/50"
        >
          <RotateCcw className="size-5" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() => setRunning((r) => !r)}
          className="flex h-12 items-center gap-2 rounded-full bg-primary px-7 font-semibold shadow-lg shadow-primary/30 hover:bg-primary/90"
        >
          {running ? <Pause className="size-5" aria-hidden="true" /> : <Play className="size-5" aria-hidden="true" />}
          {running ? 'Tạm dừng' : 'Bắt đầu'}
        </button>
      </div>

      {/* Nút hoàn thành nhanh phiên học để kiểm thử / demo API lưu Pomodoro + cộng XP & Streak */}
      <button
        type="button"
        disabled={saving}
        onClick={() => finishPomodoroSession(25)}
        className="mt-3 inline-flex items-center gap-1.5 rounded-xl border border-violet-500/30 bg-violet-500/10 px-3.5 py-2 text-xs font-semibold text-violet-300 transition-colors hover:bg-primary hover:text-white disabled:opacity-50"
      >
        <Zap className="size-3.5" aria-hidden="true" />
        {saving ? 'Đang lưu phiên học...' : 'Hoàn thành nhanh phiên (+XP & Streak)'}
      </button>

      <div className="mt-5 flex items-center gap-2" aria-label={`${completed % 4 || 4} trên 4 pomodoro trong chu kỳ`}>
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className={cn('size-3 rounded-full', i < (completed % 4 || (completed > 0 ? 4 : 0)) ? 'bg-primary' : 'bg-white/15')} />
        ))}
        <span className="ml-1 text-xs text-muted-foreground">({completed} phiên hoàn thành)</span>
      </div>

      {/* Kết quả trả về từ API POST /api/study-room/pomodoro */}
      {lastReward && (
        <div
          role="status"
          className="mt-5 w-full rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-3.5 text-xs"
        >
          <div className="flex items-center justify-between font-bold text-emerald-300">
            <span className="flex items-center gap-1.5">
              <Sparkles className="size-4" />
              Nhận +{lastReward.DiemXPNhanDuoc} XP!
            </span>
            <span className="flex items-center gap-1 text-orange-300">
              <Flame className="size-3.5" />
              Streak: {lastReward.ChuoiStreak} ngày
            </span>
          </div>
          <p className="mt-1.5 text-[11px] text-emerald-100/80">
            Cơ bản: +{lastReward.chiTietXP.xpCoBan} XP · Thưởng Streak: +{lastReward.chiTietXP.xpThuongStreak} XP
            {lastReward.chiTietXP.xpThuongChuKy4Phien > 0 &&
              ` · Thưởng chu kỳ 4 phiên: +${lastReward.chiTietXP.xpThuongChuKy4Phien} XP`}
          </p>
          {lastReward.thangCap && (
            <p className="mt-1 flex items-center gap-1 font-bold text-amber-300">
              <Trophy className="size-3.5" />
              Chúc mừng! Bạn đã thăng lên Cấp {lastReward.CapDo}!
            </p>
          )}
        </div>
      )}

      <div className="mt-5 w-full rounded-xl bg-background p-4 text-center">
        <p className="text-xs text-muted-foreground">Tổng thời gian học hôm nay</p>
        <p className="mt-1 text-2xl font-bold">
          {minutesToday} <span className="text-base font-medium text-muted-foreground">phút</span>
        </p>
      </div>
    </section>
  )
}
