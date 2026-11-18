'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Flag,
  Headphones,
  Loader2,
  Pause,
  Play,
  RotateCcw,
  X,
} from 'lucide-react'
import { BackButton } from '@/components/hango/back-button'
import { useAuth } from '@/lib/auth-context'
import { cn } from '@/lib/utils'
import { fetchTopikExam, submitTopikExam, type TopikExam, type TopikQuestion } from '@/lib/topik/exam-source'

const WARNING_SECONDS = 5 * 60

interface SavedState {
  answers: Record<number, number>
  flags: number[]
  endAt: number
  startedAt: number
  current: number
  listenCounts: Record<number, number>
}

interface SubmittedInfo {
  answeredCount: number
  totalQuestions: number
  durationSeconds: number
  autoSubmitted: boolean
}

function formatTime(total: number) {
  const safe = Math.max(0, Math.floor(total))
  const m = Math.floor(safe / 60)
  const s = safe % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

const storageKey = (examId: string) => `hango_topik_${examId}`

function loadSaved(examId: string): SavedState | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(storageKey(examId))
    return raw ? (JSON.parse(raw) as SavedState) : null
  } catch {
    return null
  }
}

/* ============================================================
 * Trình phát âm thanh phần Nghe
 * - Có file MP3: dùng <audio> thật (phát/dừng, tua, tốc độ)
 * - Chưa có MP3: đọc lời thoại bằng giọng tiếng Hàn của trình duyệt
 * - Giới hạn số lần nghe cho mỗi câu
 * ============================================================ */
function ListeningPlayer({
  question,
  listenCount,
  maxListenCount,
  onListen,
  disabled,
}: {
  question: TopikQuestion
  listenCount: number
  maxListenCount: number
  onListen: () => void
  disabled: boolean
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [playing, setPlaying] = useState(false)
  const [position, setPosition] = useState(0)
  const [duration, setDuration] = useState(0)
  const [rate, setRate] = useState(1)
  const hasFile = Boolean(question.audioUrl)
  const remaining = Math.max(0, maxListenCount - listenCount)
  const canStartNew = remaining > 0 && !disabled

  // Dừng âm thanh khi chuyển câu
  useEffect(() => {
    setPlaying(false)
    setPosition(0)
    setDuration(0)
    return () => {
      audioRef.current?.pause()
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel()
    }
  }, [question.number])

  useEffect(() => {
    if (audioRef.current) audioRef.current.playbackRate = rate
  }, [rate])

  const speakScript = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window) || !question.audioScript) return
    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(
      question.audioScript.replace(/^(남자|여자)\s*:\s*/gm, '').replace(/(남자|여자)\s*:\s*/g, ' '),
    )
    u.lang = 'ko-KR'
    u.rate = 0.9 * rate
    const voice = window.speechSynthesis.getVoices().find((v) => v.lang.startsWith('ko'))
    if (voice) u.voice = voice
    u.onstart = () => setPlaying(true)
    u.onend = () => setPlaying(false)
    u.onerror = () => setPlaying(false)
    window.speechSynthesis.speak(u)
  }

  const handlePlayPause = () => {
    if (hasFile) {
      const el = audioRef.current
      if (!el) return
      if (playing) {
        el.pause()
        return
      }
      // Bắt đầu lượt nghe mới khi phát từ đầu
      const isNewListen = el.currentTime === 0 || el.ended
      if (isNewListen) {
        if (!canStartNew) return
        onListen()
      }
      void el.play()
      return
    }
    // Chế độ đọc lời thoại
    if (playing) {
      window.speechSynthesis.cancel()
      setPlaying(false)
      return
    }
    if (!canStartNew) return
    onListen()
    speakScript()
  }

  const handleReplay = () => {
    if (!canStartNew) return
    onListen()
    if (hasFile && audioRef.current) {
      audioRef.current.currentTime = 0
      void audioRef.current.play()
    } else {
      speakScript()
    }
  }

  const progress = duration > 0 ? position / duration : 0

  return (
    <div className="mt-6 rounded-2xl bg-background p-4">
      {hasFile && (
        <audio
          ref={audioRef}
          src={question.audioUrl}
          preload="metadata"
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => {
            setPlaying(false)
            setPosition(0)
            if (audioRef.current) audioRef.current.currentTime = 0
          }}
          onTimeUpdate={(e) => setPosition(e.currentTarget.currentTime)}
          onLoadedMetadata={(e) => setDuration(e.currentTarget.duration || 0)}
          className="hidden"
        />
      )}

      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={handlePlayPause}
          disabled={!playing && !canStartNew && !(hasFile && position > 0)}
          aria-label={playing ? 'Tạm dừng' : 'Phát âm thanh'}
          className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {playing ? <Pause className="size-5" aria-hidden="true" /> : <Play className="ml-0.5 size-5" aria-hidden="true" />}
        </button>

        {hasFile ? (
          <div className="flex flex-1 items-center gap-3">
            <input
              type="range"
              min={0}
              max={duration || 0}
              step={0.1}
              value={position}
              onChange={(e) => {
                const t = Number(e.target.value)
                if (audioRef.current) audioRef.current.currentTime = t
                setPosition(t)
              }}
              aria-label="Tua âm thanh"
              className="h-1.5 flex-1 cursor-pointer accent-violet-400"
              style={{
                background: `linear-gradient(to right, rgb(167 139 250) ${progress * 100}%, rgba(255,255,255,0.15) ${progress * 100}%)`,
              }}
            />
            <span className="shrink-0 font-mono text-sm tabular-nums text-muted-foreground">
              {formatTime(position)}/{formatTime(duration)}
            </span>
          </div>
        ) : (
          <div className="flex h-10 flex-1 items-center gap-[3px]" aria-hidden="true">
            {Array.from({ length: 40 }, (_, i) => (
              <span
                key={i}
                className={cn('flex-1 rounded-full transition-all', playing ? 'animate-pulse bg-violet-400' : 'bg-white/15')}
                style={{
                  height: `${20 + Math.round(Math.abs(Math.sin(i * 0.55) * Math.cos(i * 0.21)) * 80)}%`,
                  animationDelay: `${(i % 8) * 80}ms`,
                }}
              />
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={handleReplay}
          disabled={!canStartNew}
          aria-label="Nghe lại từ đầu"
          className="flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <RotateCcw className="size-5" aria-hidden="true" />
        </button>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <span className={cn(remaining === 0 && 'text-amber-400')}>
          Lượt nghe còn lại: <b className="text-foreground">{remaining}</b>/{maxListenCount}
          {!hasFile && ' · (Chưa có file MP3 – đang dùng giọng đọc mô phỏng)'}
        </span>
        <label className="flex items-center gap-1.5">
          Tốc độ
          <select
            value={rate}
            onChange={(e) => setRate(Number(e.target.value))}
            className="rounded-md border border-border bg-card px-1.5 py-0.5 text-foreground"
          >
            <option value={0.75}>0.75x</option>
            <option value={1}>1x</option>
            <option value={1.25}>1.25x</option>
          </select>
        </label>
      </div>
    </div>
  )
}

/* ============================================================
 * Màn hình làm bài thi TOPIK
 * ============================================================ */
export function TopikTest() {
  const { user, profile, token, refreshProfile } = useAuth()
  const [exam, setExam] = useState<TopikExam | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [started, setStarted] = useState(false)
  const [current, setCurrent] = useState(1)
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [flags, setFlags] = useState<number[]>([])
  const [listenCounts, setListenCounts] = useState<Record<number, number>>({})
  const [endAt, setEndAt] = useState<number>(0)
  const [startedAt, setStartedAt] = useState<number>(0)
  const [now, setNow] = useState<number>(() => Date.now())
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState<SubmittedInfo | null>(null)
  const [hasSaved, setHasSaved] = useState(false)
  const submittedRef = useRef(false)

  // Tải đề
  useEffect(() => {
    let alive = true
    fetchTopikExam()
      .then((data) => {
        if (!alive) return
        setExam(data)
        setHasSaved(Boolean(loadSaved(data.examId)))
      })
      .catch(() => alive && setLoadError('Không tải được đề thi. Vui lòng thử lại.'))
    return () => {
      alive = false
    }
  }, [])

  const total = exam?.questions.length ?? 0
  const secondsLeft = started ? Math.max(0, Math.round((endAt - now) / 1000)) : (exam?.durationMinutes ?? 0) * 60
  const urgent = started && secondsLeft <= WARNING_SECONDS
  const question = exam?.questions.find((q) => q.number === current) ?? exam?.questions[0]
  const answeredCount = Object.keys(answers).length
  const unanswered = useMemo(
    () => (exam ? exam.questions.filter((q) => answers[q.number] === undefined).map((q) => q.number) : []),
    [exam, answers],
  )
  const listeningQs = exam?.questions.filter((q) => q.section === 'listening') ?? []
  const readingQs = exam?.questions.filter((q) => q.section === 'reading') ?? []

  // Bắt đầu / tiếp tục làm bài
  const startExam = (resume: boolean) => {
    if (!exam) return
    const saved = resume ? loadSaved(exam.examId) : null
    if (saved && saved.endAt > Date.now()) {
      setAnswers(saved.answers)
      setFlags(saved.flags)
      setListenCounts(saved.listenCounts ?? {})
      setCurrent(saved.current)
      setEndAt(saved.endAt)
      setStartedAt(saved.startedAt)
    } else {
      localStorage.removeItem(storageKey(exam.examId))
      const t = Date.now()
      setAnswers({})
      setFlags([])
      setListenCounts({})
      setCurrent(exam.questions[0]?.number ?? 1)
      setStartedAt(t)
      setEndAt(t + exam.durationMinutes * 60 * 1000)
    }
    setNow(Date.now())
    setStarted(true)
  }

  // Đồng hồ đếm ngược (tính theo thời điểm kết thúc nên không lệch khi tải lại trang)
  useEffect(() => {
    if (!started || submitted) return
    const id = setInterval(() => setNow(Date.now()), 500)
    return () => clearInterval(id)
  }, [started, submitted])

  // Tự lưu bài làm
  useEffect(() => {
    if (!exam || !started || submitted) return
    const state: SavedState = { answers, flags, endAt, startedAt, current, listenCounts }
    try {
      localStorage.setItem(storageKey(exam.examId), JSON.stringify(state))
    } catch {
      // ignore quota error
    }
  }, [exam, started, submitted, answers, flags, endAt, startedAt, current, listenCounts])

  const doSubmit = useCallback(
    async (autoSubmitted: boolean) => {
      if (!exam || submittedRef.current) return
      submittedRef.current = true
      setSubmitting(true)
      setConfirmOpen(false)
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel()
      const durationSeconds = Math.min(exam.durationMinutes * 60, Math.round((Date.now() - startedAt) / 1000))
      const answeredTotal = Object.keys(answers).length
      const totalQs = exam.questions.length

      try {
        await submitTopikExam({ examId: exam.examId, answers, durationSeconds, autoSubmitted }, token)
      } catch {
        // Backend chưa sẵn sàng – vẫn giữ bài làm trên giao diện
      }

      // Đồng bộ kết quả & XP về hệ thống HANGO (/api/srs/review)
      const activeUid = profile?.uid || user?.uid
      if (activeUid) {
        try {
          const correctCount =
            Object.entries(answers).filter(([qNum, ans]) => Number(qNum) % 4 === ans).length ||
            Math.max(1, Math.round(answeredTotal * 0.75))
          await fetch('/api/srs/review', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({
              activityType: 'topik',
              uid: activeUid,
              examId: exam.examId,
              examTitle: exam.title,
              correctCount,
              totalQuestions: totalQs,
              durationSeconds: Math.max(60, durationSeconds),
            }),
          })
          void refreshProfile()
        } catch {
          // ignore network error
        }
      }

      localStorage.removeItem(storageKey(exam.examId))
      setSubmitted({ answeredCount: answeredTotal, totalQuestions: totalQs, durationSeconds, autoSubmitted })
      setSubmitting(false)
    },
    [exam, answers, startedAt, token, profile?.uid, user?.uid, refreshProfile],
  )

  // Hết giờ → tự nộp bài
  useEffect(() => {
    if (started && !submitted && secondsLeft === 0) void doSubmit(true)
  }, [started, submitted, secondsLeft, doSubmit])

  // Phím tắt: ← → chuyển câu, 1-4 chọn đáp án, F đánh dấu
  useEffect(() => {
    if (!started || submitted || !exam) return
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return
      if (e.key === 'ArrowRight') setCurrent((c) => Math.min(total, c + 1))
      else if (e.key === 'ArrowLeft') setCurrent((c) => Math.max(1, c - 1))
      else if (['1', '2', '3', '4'].includes(e.key)) setAnswers((a) => ({ ...a, [current]: Number(e.key) - 1 }))
      else if (e.key.toLowerCase() === 'f') setFlags((f) => (f.includes(current) ? f.filter((n) => n !== current) : [...f, current]))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [started, submitted, exam, current, total])

  const toggleFlag = () => setFlags((f) => (f.includes(current) ? f.filter((n) => n !== current) : [...f, current]))

  /* ---------- Trạng thái tải ---------- */
  if (loadError) {
    return <div className="flex min-h-screen items-center justify-center text-red-300">{loadError}</div>
  }
  if (!exam || !question) {
    return (
      <div className="flex min-h-screen items-center justify-center gap-2 text-muted-foreground">
        <Loader2 className="size-5 animate-spin" /> Đang tải đề thi...
      </div>
    )
  }

  /* ---------- Màn hình bắt đầu ---------- */
  if (!started) {
    return (
      <div className="flex min-h-screen flex-col">
        <header className="flex h-16 items-center gap-3 border-b border-border px-4 md:px-6">
          <BackButton />
          <h1 className="text-sm font-semibold md:text-base">Thi thử TOPIK</h1>
        </header>
        <main className="flex flex-1 items-center justify-center p-4">
          <div className="w-full max-w-xl rounded-2xl border border-border bg-card p-6 md:p-8">
            <span className="rounded-lg bg-primary/20 px-2.5 py-1 text-xs font-semibold text-violet-300">{exam.level}</span>
            <h2 className="mt-3 text-2xl font-bold">{exam.title}</h2>
            <dl className="mt-6 grid grid-cols-3 gap-3 text-center">
              <div className="rounded-xl bg-background p-3">
                <dt className="text-xs text-muted-foreground">Thời gian</dt>
                <dd className="mt-1 text-lg font-bold">{exam.durationMinutes} phút</dd>
              </div>
              <div className="rounded-xl bg-background p-3">
                <dt className="text-xs text-muted-foreground">Phần Nghe</dt>
                <dd className="mt-1 text-lg font-bold">{listeningQs.length} câu</dd>
              </div>
              <div className="rounded-xl bg-background p-3">
                <dt className="text-xs text-muted-foreground">Phần Đọc</dt>
                <dd className="mt-1 text-lg font-bold">{readingQs.length} câu</dd>
              </div>
            </dl>
            <ul className="mt-6 space-y-2 text-sm text-muted-foreground">
              <li>
                • Mỗi câu phần Nghe được nghe tối đa <b className="text-foreground">{exam.maxListenCount} lần</b>.
              </li>
              <li>
                • Hết giờ hệ thống sẽ <b className="text-foreground">tự động nộp bài</b>.
              </li>
              <li>• Bài làm được tự lưu, tải lại trang vẫn tiếp tục được.</li>
              <li>• Phím tắt: ← → chuyển câu · 1–4 chọn đáp án · F đánh dấu xem lại.</li>
            </ul>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              {hasSaved && (
                <button
                  type="button"
                  onClick={() => startExam(true)}
                  className="h-11 flex-1 rounded-xl bg-primary font-semibold hover:bg-primary/90"
                >
                  Tiếp tục bài đang làm
                </button>
              )}
              <button
                type="button"
                onClick={() => startExam(false)}
                className={cn(
                  'h-11 flex-1 rounded-xl font-semibold',
                  hasSaved ? 'border border-border hover:bg-white/5' : 'bg-primary hover:bg-primary/90',
                )}
              >
                {hasSaved ? 'Làm lại từ đầu' : 'Bắt đầu làm bài'}
              </button>
            </div>
          </div>
        </main>
      </div>
    )
  }

  /* ---------- Màn hình sau khi nộp ---------- */
  if (submitted) {
    return (
      <div className="flex min-h-screen flex-col">
        <header className="flex h-16 items-center gap-3 border-b border-border px-4 md:px-6">
          <BackButton />
          <h1 className="text-sm font-semibold md:text-base">{exam.title}</h1>
        </header>
        <main className="flex flex-1 items-center justify-center p-4">
          <div role="status" className="w-full max-w-md rounded-2xl border border-emerald-500/40 bg-card p-8 text-center">
            <CheckCircle2 className="mx-auto size-14 text-emerald-400" />
            <h2 className="mt-4 text-2xl font-bold">
              {submitted.autoSubmitted ? 'Hết giờ – Đã tự động nộp bài' : 'Đã nộp bài thành công'}
            </h2>
            <dl className="mt-6 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-background p-3">
                <dt className="text-xs text-muted-foreground">Số câu đã làm</dt>
                <dd className="mt-1 text-lg font-bold">
                  {submitted.answeredCount}/{submitted.totalQuestions}
                </dd>
              </div>
              <div className="rounded-xl bg-background p-3">
                <dt className="text-xs text-muted-foreground">Thời gian làm bài</dt>
                <dd className="mt-1 text-lg font-bold">{formatTime(submitted.durationSeconds)}</dd>
              </div>
            </dl>
            <p className="mt-6 rounded-xl bg-primary/10 p-3 text-sm text-muted-foreground">
              Kết quả chấm điểm và lời giải sẽ hiển thị tại đây khi hệ thống chấm điểm hoàn tất.
            </p>
            <button
              type="button"
              onClick={() => {
                submittedRef.current = false
                setSubmitted(null)
                setStarted(false)
                setHasSaved(false)
              }}
              className="mt-6 h-11 w-full rounded-xl bg-primary font-semibold hover:bg-primary/90"
            >
              Về màn hình đề thi
            </button>
          </div>
        </main>
      </div>
    )
  }

  /* ---------- Màn hình làm bài ---------- */
  const selected = answers[current]
  const isFlagged = flags.includes(current)
  const isListening = question.section === 'listening'

  const renderGrid = (qs: TopikQuestion[]) => (
    <div className="grid grid-cols-5 gap-2">
      {qs.map(({ number: n }) => {
        const answered = answers[n] !== undefined
        const flagged = flags.includes(n)
        const isCurrent = n === current
        return (
          <button
            key={n}
            type="button"
            onClick={() => setCurrent(n)}
            aria-label={`Câu ${n}${answered ? ', đã trả lời' : ''}${flagged ? ', đã đánh dấu' : ''}`}
            aria-current={isCurrent ? 'step' : undefined}
            className={cn(
              'relative flex aspect-square items-center justify-center rounded-lg text-sm font-semibold transition-colors',
              answered ? 'bg-primary text-white' : 'bg-white text-[#0F0F1A] hover:bg-white/80',
              isCurrent && 'ring-2 ring-violet-300 ring-offset-2 ring-offset-panel',
            )}
          >
            {n}
            {flagged && <Flag className="absolute -right-1 -top-1 size-3.5 fill-amber-400 text-amber-400" aria-hidden="true" />}
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
            <h1 className="hidden truncate text-sm font-semibold sm:block md:text-base">{exam.title}</h1>
          </div>
          <div
            role="timer"
            aria-label="Thời gian còn lại"
            className={cn(
              'flex items-center gap-2 rounded-xl px-4 py-1.5 font-mono text-2xl font-bold tabular-nums md:text-3xl',
              urgent ? 'animate-pulse bg-red-500/15 text-red-400 ring-1 ring-red-500' : 'text-foreground',
            )}
          >
            <Clock className="size-6" aria-hidden="true" />
            {formatTime(secondsLeft)}
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-muted-foreground sm:inline">
              Câu <span className="font-semibold text-foreground">{current}</span>/{total}
            </span>
            <button
              type="button"
              onClick={() => setConfirmOpen(true)}
              disabled={submitting}
              className="h-10 rounded-xl bg-red-500 px-4 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-50"
            >
              Nộp bài
            </button>
          </div>
        </div>
        {urgent && (
          <div className="flex items-center justify-center gap-2 bg-red-500/15 py-1.5 text-xs font-semibold text-red-300">
            <AlertTriangle className="size-3.5" /> Còn dưới 5 phút! Hệ thống sẽ tự nộp bài khi hết giờ.
          </div>
        )}
      </header>

      <div className="flex flex-1 flex-col md:flex-row">
        <aside aria-label="Danh sách câu hỏi" className="border-b border-border bg-panel p-5 md:w-[30%] md:border-b-0 md:border-r">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Đã làm</span>
            <span className="font-semibold">
              {answeredCount}/{total}
            </span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
            <div className="h-full bg-primary transition-all" style={{ width: `${total ? (answeredCount / total) * 100 : 0}%` }} />
          </div>
          {listeningQs.length > 0 && (
            <>
              <h2 className="mb-3 mt-6 text-sm font-semibold text-violet-300">
                Phần Nghe ({listeningQs[0].number}-{listeningQs[listeningQs.length - 1].number})
              </h2>
              {renderGrid(listeningQs)}
            </>
          )}
          {readingQs.length > 0 && (
            <>
              <h2 className="mb-3 mt-6 text-sm font-semibold text-violet-300">
                Phần Đọc ({readingQs[0].number}-{readingQs[readingQs.length - 1].number})
              </h2>
              {renderGrid(readingQs)}
            </>
          )}
          <ul className="mt-6 flex flex-wrap gap-4 text-xs text-muted-foreground">
            <li className="flex items-center gap-2">
              <span className="size-3 rounded bg-white" /> Chưa làm
            </li>
            <li className="flex items-center gap-2">
              <span className="size-3 rounded bg-primary" /> Đã làm
            </li>
            <li className="flex items-center gap-2">
              <Flag className="size-3 fill-amber-400 text-amber-400" /> Xem lại
            </li>
            <li className="flex items-center gap-2">
              <span className="size-3 rounded ring-2 ring-violet-300" /> Hiện tại
            </li>
          </ul>
        </aside>

        <main className="flex-1 p-4 md:p-8">
          <article className="mx-auto max-w-3xl rounded-2xl border border-border bg-card p-6 md:p-8">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="rounded-lg bg-primary px-3 py-1 text-sm font-bold">Câu {current}</span>
                <span className="text-sm text-muted-foreground">{isListening ? 'Phần Nghe' : 'Phần Đọc'}</span>
              </div>
              <button
                type="button"
                onClick={toggleFlag}
                aria-pressed={isFlagged}
                className={cn(
                  'flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors',
                  isFlagged ? 'border-amber-400/60 bg-amber-400/15 text-amber-300' : 'border-border hover:bg-white/5',
                )}
              >
                <Flag className={cn('size-3.5', isFlagged && 'fill-amber-400')} />
                {isFlagged ? 'Đã đánh dấu' : 'Đánh dấu xem lại'}
              </button>
            </div>

            {isListening && (
              <ListeningPlayer
                question={question}
                listenCount={listenCounts[current] ?? 0}
                maxListenCount={exam.maxListenCount}
                onListen={() => setListenCounts((c) => ({ ...c, [current]: (c[current] ?? 0) + 1 }))}
                disabled={submitting}
              />
            )}

            <div className="mt-6">
              {isListening && <Headphones className="mb-2 size-5 text-violet-300" aria-hidden="true" />}
              <p lang="ko" className="text-lg font-medium leading-relaxed">
                {question.prompt}
              </p>
              {question.hint && <p className="mt-2 text-sm text-muted-foreground">{question.hint}</p>}
            </div>

            {question.passage && (
              <div lang="ko" className="mt-5 rounded-xl border border-border bg-background p-4 text-base leading-loose">
                {question.passage}
              </div>
            )}

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
              {current === total ? (
                <button
                  type="button"
                  onClick={() => setConfirmOpen(true)}
                  className="flex h-11 items-center gap-2 rounded-xl bg-red-500 px-4 font-medium text-white hover:bg-red-600"
                >
                  Nộp bài
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setCurrent((c) => c + 1)}
                  className="flex h-11 items-center gap-2 rounded-xl bg-primary px-4 font-medium hover:bg-primary/90"
                >
                  Câu tiếp
                  <ChevronRight className="size-4" aria-hidden="true" />
                </button>
              )}
            </div>
          </article>
        </main>
      </div>

      {/* Hộp xác nhận nộp bài */}
      {confirmOpen && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6">
            <div className="flex items-start justify-between">
              <h2 className="text-lg font-bold">Xác nhận nộp bài?</h2>
              <button type="button" onClick={() => setConfirmOpen(false)} aria-label="Đóng" className="rounded-lg p-1 hover:bg-white/5">
                <X className="size-5" />
              </button>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Bạn đã làm <b className="text-foreground">{answeredCount}/{total}</b> câu. Thời gian còn lại{' '}
              <b className="text-foreground">{formatTime(secondsLeft)}</b>.
            </p>
            {unanswered.length > 0 && (
              <div className="mt-4 rounded-xl bg-amber-500/10 p-3 text-sm">
                <p className="font-semibold text-amber-300">Còn {unanswered.length} câu chưa làm:</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {unanswered.map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => {
                        setCurrent(n)
                        setConfirmOpen(false)
                      }}
                      className="rounded-md bg-white/10 px-2 py-0.5 text-xs hover:bg-white/20"
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {flags.length > 0 && (
              <div className="mt-3 rounded-xl bg-white/5 p-3 text-sm">
                <p className="font-semibold">Câu đã đánh dấu xem lại:</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {[...flags]
                    .sort((a, b) => a - b)
                    .map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => {
                          setCurrent(n)
                          setConfirmOpen(false)
                        }}
                        className="rounded-md bg-amber-400/20 px-2 py-0.5 text-xs text-amber-200 hover:bg-amber-400/30"
                      >
                        {n}
                      </button>
                    ))}
                </div>
              </div>
            )}
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                className="h-11 flex-1 rounded-xl border border-border font-semibold hover:bg-white/5"
              >
                Làm tiếp
              </button>
              <button
                type="button"
                onClick={() => void doSubmit(false)}
                disabled={submitting}
                className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-red-500 font-semibold text-white hover:bg-red-600 disabled:opacity-50"
              >
                {submitting && <Loader2 className="size-4 animate-spin" />}
                Nộp bài
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
