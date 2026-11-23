'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Edit3,
  FileText,
  Flag,
  Headphones,
  Loader2,
  Pause,
  Play,
  RotateCcw,
  Search,
  Trophy,
  X,
} from 'lucide-react'
import { TopikAdminView } from '@/components/topik/topik-admin-view'
import { useAuth } from '@/lib/auth-context'
import type { ExtendedTopikQuestion, ManagedTopikExam } from '@/lib/backend/topik-exam-store'
import { submitTopikExam } from '@/lib/topik/exam-source'
import { cn } from '@/lib/utils'

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
  correctCount: number
  totalQuestions: number
  score: number
  maxScore: number
  levelAchieved: string
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
 * ============================================================ */
function computeScriptDuration(script: string, rate: number = 1): number {
  if (!script) return 5
  // Bỏ nhãn người nói: "남자:", "여자:"
  const clean = script.replace(/^(남자|여자)\s*:\s*/gm, '').replace(/(남자|여자)\s*:\s*/g, ' ').trim()
  const chars = clean.replace(/\s+/g, '').length
  const sentences = (clean.match(/[.?!]+/g) || []).length
  const commas = (clean.match(/[,]+/g) || []).length
  // Tốc độ phát âm tiếng Hàn chuẩn (ko-KR) của trình duyệt:
  // Khoảng 2.8 ký tự/giây + 0.8s ngừng nghỉ giữa các câu + 0.4s ngắt dấu phẩy
  const totalSeconds = (chars / 2.8) + (sentences * 0.8) + (commas * 0.4)
  return Math.max(5, Math.round(totalSeconds / Math.max(0.2, rate)))
}

function ListeningPlayer({
  question,
  listenCount,
  maxListenCount,
  onListen,
  disabled,
}: {
  question: ExtendedTopikQuestion
  listenCount: number
  maxListenCount: number
  onListen: () => void
  disabled: boolean
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const startTimeRef = useRef<number>(0)
  const pausedOffsetRef = useRef<number>(0)

  const [playing, setPlaying] = useState(false)
  const [position, setPosition] = useState(0)
  const [fileDuration, setFileDuration] = useState(0)
  const [rate, setRate] = useState(1)

  const hasFile = Boolean(question.audioUrl)
  const hasScript = Boolean(question.audioScript)

  // Nếu file tải về có thời lượng > 5s (file ghi âm thực tế), ưu tiên file âm thanh.
  // Nếu file <= 5s (file mẫu chime/placeholder) hoặc không có file, tự động tính thời lượng chuẩn theo độ dài đoạn hội thoại tiếng Hàn.
  const useFileMode = hasFile && fileDuration > 5
  const scriptDuration = hasScript ? computeScriptDuration(question.audioScript || '', rate) : 0
  const duration = useFileMode ? fileDuration : (scriptDuration || fileDuration || 5)
  const remaining = Math.max(0, maxListenCount - listenCount)
  const canStartNew = remaining > 0 && !disabled

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }

  const startSpeechTimer = (targetDur: number) => {
    stopTimer()
    startTimeRef.current = performance.now() - (pausedOffsetRef.current * 1000)
    timerRef.current = setInterval(() => {
      const elapsed = (performance.now() - startTimeRef.current) / 1000
      if (elapsed >= targetDur) {
        setPosition(targetDur)
      } else {
        setPosition(Math.round(elapsed * 10) / 10)
      }
    }, 100)
  }

  useEffect(() => {
    setPlaying(false)
    setPosition(0)
    pausedOffsetRef.current = 0
    stopTimer()
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel()
    }
  }, [question.number])

  useEffect(() => {
    if (audioRef.current) audioRef.current.playbackRate = rate
  }, [rate])

  useEffect(() => {
    return () => {
      stopTimer()
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel()
      }
    }
  }, [])

  const speakScript = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window) || !question.audioScript) return
    window.speechSynthesis.cancel()
    stopTimer()

    const u = new SpeechSynthesisUtterance(
      question.audioScript.replace(/^(남자|여자)\s*:\s*/gm, '').replace(/(남자|여자)\s*:\s*/g, ' '),
    )
    u.lang = 'ko-KR'
    u.rate = 0.9 * rate
    const voice = window.speechSynthesis.getVoices().find((v) => v.lang.startsWith('ko'))
    if (voice) u.voice = voice

    u.onstart = () => {
      setPlaying(true)
      startSpeechTimer(duration)
    }
    u.onend = () => {
      stopTimer()
      setPosition(duration)
      setTimeout(() => {
        setPlaying(false)
        setPosition(0)
        pausedOffsetRef.current = 0
      }, 300)
    }
    u.onerror = () => {
      stopTimer()
      setPlaying(false)
    }

    window.speechSynthesis.speak(u)
  }

  const handlePlayPause = () => {
    if (playing) {
      if (useFileMode) {
        audioRef.current?.pause()
      } else {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
          window.speechSynthesis.cancel()
        }
        stopTimer()
        pausedOffsetRef.current = position
      }
      setPlaying(false)
      return
    }

    const isNewListen = position === 0 || position >= duration
    if (isNewListen) {
      if (!canStartNew) return
      onListen()
      setPosition(0)
      pausedOffsetRef.current = 0
    }

    if (useFileMode) {
      const el = audioRef.current
      if (!el) return
      if (isNewListen) el.currentTime = 0
      void el.play().catch(() => {
        speakScript()
      })
    } else {
      speakScript()
    }
  }

  const handleReplay = () => {
    if (!canStartNew) return
    onListen()
    setPosition(0)
    pausedOffsetRef.current = 0
    stopTimer()

    if (useFileMode && audioRef.current) {
      audioRef.current.currentTime = 0
      void audioRef.current.play().catch(() => {
        speakScript()
      })
    } else {
      speakScript()
    }
  }

  const progress = duration > 0 ? position / duration : 0
  const hasPlayable = hasFile || hasScript

  return (
    <div className="mt-6 rounded-2xl border border-slate-300 bg-slate-50 p-4">
      {hasFile && (
        <audio
          ref={audioRef}
          src={question.audioUrl}
          preload="metadata"
          onPlay={() => {
            if (useFileMode) setPlaying(true)
          }}
          onPause={() => {
            if (useFileMode) setPlaying(false)
          }}
          onEnded={() => {
            if (useFileMode) {
              setPlaying(false)
              setPosition(0)
            }
          }}
          onTimeUpdate={(e) => {
            if (useFileMode) setPosition(e.currentTarget.currentTime)
          }}
          onLoadedMetadata={(e) => {
            setFileDuration(e.currentTarget.duration || 0)
          }}
          className="hidden"
        />
      )}

      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={handlePlayPause}
          disabled={!playing && !canStartNew && !(hasPlayable && position > 0)}
          aria-label={playing ? 'Tạm dừng' : 'Phát âm thanh'}
          className="flex size-12 shrink-0 items-center justify-center rounded-full border border-slate-900 bg-[#2563EB] text-white hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {playing ? <Pause className="size-5" aria-hidden="true" /> : <Play className="ml-0.5 size-5" aria-hidden="true" />}
        </button>

        {hasPlayable ? (
          <div className="flex flex-1 items-center gap-3">
            <input
              type="range"
              min={0}
              max={duration || 1}
              step={0.1}
              value={position}
              onChange={(e) => {
                const t = Number(e.target.value)
                setPosition(t)
                pausedOffsetRef.current = t
                if (useFileMode && audioRef.current) {
                  audioRef.current.currentTime = t
                }
              }}
              aria-label="Tua âm thanh"
              className="h-1.5 flex-1 cursor-pointer accent-[#2563EB]"
              style={{
                background: `linear-gradient(to right, #2563EB ${Math.min(100, Math.max(0, progress * 100))}%, #CBD5E1 ${Math.min(100, Math.max(0, progress * 100))}%)`,
              }}
            />
            <span className="shrink-0 font-mono text-sm tabular-nums text-slate-600">
              {formatTime(position)}/{formatTime(duration)}
            </span>
          </div>
        ) : (
          <div className="flex h-10 flex-1 items-center gap-[3px]" aria-hidden="true">
            {Array.from({ length: 40 }, (_, i) => (
              <span
                key={i}
                className={cn(
                  'flex-1 rounded-full transition-all',
                  playing ? 'animate-pulse bg-[#2563EB]' : 'bg-slate-300',
                )}
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
          className="flex size-10 shrink-0 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <RotateCcw className="size-5" aria-hidden="true" />
        </button>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
        <span className={cn(remaining === 0 && 'font-bold text-amber-800')}>
          Lượt nghe còn lại: <b className="text-slate-900">{remaining}</b>/{maxListenCount}
        </span>
        <label className="flex items-center gap-1.5">
          Tốc độ
          <select
            value={rate}
            onChange={(e) => setRate(Number(e.target.value))}
            className="rounded-md border border-slate-300 bg-white px-1.5 py-0.5 font-semibold text-slate-900"
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
 * Màn hình Thi thử TOPIK (Phân quyền Admin / Student)
 * ============================================================ */
export function TopikTest() {
  const { user, profile, token, refreshProfile } = useAuth()
  const isAdmin = Boolean(profile?.role === 'admin' || profile?.isRootAdmin)

  // Danh sách đề thi dành cho Student (và đề đang được chọn để làm bài)
  const [examsList, setExamsList] = useState<ManagedTopikExam[]>([])
  const [selectedExam, setSelectedExam] = useState<ManagedTopikExam | null>(null)
  const [loadingList, setLoadingList] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  // Tìm kiếm & lọc cấp độ trên màn hình Chọn đề thi của Student
  const [examSearchQuery, setExamSearchQuery] = useState('')
  const [examLevelFilter, setExamLevelFilter] = useState<'ALL' | 'TOPIK I' | 'TOPIK II'>('ALL')

  // Trạng thái làm bài thi
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

  // Nạp danh sách các đề thi đang mở cho Student
  const fetchStudentExams = useCallback(async () => {
    setLoadingList(true)
    setLoadError(null)
    try {
      const res = await fetch('/api/topik/exams')
      const json = await res.json()
      if (!res.ok || !json.success) {
        setLoadError(json.error || 'Không tải được danh sách đề thi.')
        return
      }
      setExamsList(json.exams || [])
    } catch {
      setLoadError('Không tải được danh sách đề thi. Vui lòng thử lại.')
    } finally {
      setLoadingList(false)
    }
  }, [])

  useEffect(() => {
    if (!isAdmin) {
      void fetchStudentExams()
    }
  }, [isAdmin, fetchStudentExams])

  const filteredStudentExams = useMemo(() => {
    const q = examSearchQuery.trim().toLowerCase()
    return examsList.filter((e) => {
      if (examLevelFilter !== 'ALL' && e.level !== examLevelFilter) return false
      if (q) {
        const matchTitle = e.title.toLowerCase().includes(q)
        const matchDesc = (e.description || '').toLowerCase().includes(q)
        if (!matchTitle && !matchDesc) return false
      }
      return true
    })
  }, [examsList, examSearchQuery, examLevelFilter])

  const exam = selectedExam
  const total = exam?.questions.length ?? 0
  const secondsLeft = started
    ? Math.max(0, Math.round((endAt - now) / 1000))
    : (exam?.durationMinutes ?? 0) * 60
  const urgent = started && secondsLeft <= WARNING_SECONDS
  const question = exam?.questions.find((q) => q.number === current) ?? exam?.questions[0]
  const answeredCount = Object.keys(answers).length
  const unanswered = useMemo(
    () =>
      exam
        ? exam.questions.filter((q) => answers[q.number] === undefined).map((q) => q.number)
        : [],
    [exam, answers],
  )
  const listeningQs = exam?.questions.filter((q) => q.section === 'listening') ?? []
  const writingQs = exam?.questions.filter((q) => q.section === 'writing') ?? []
  const readingQs = exam?.questions.filter((q) => q.section === 'reading') ?? []

  // Chọn 1 đề thi từ danh sách
  const handleSelectExam = (targetExam: ManagedTopikExam) => {
    submittedRef.current = false
    setSelectedExam(targetExam)
    setStarted(false)
    setSubmitted(null)
    setAnswers({})
    setFlags([])
    setListenCounts({})
    setCurrent(targetExam.questions[0]?.number ?? 1)
    setHasSaved(Boolean(loadSaved(targetExam.examId)))
  }

  // Bắt đầu / tiếp tục làm bài
  const startExam = (resume: boolean) => {
    if (!exam) return
    submittedRef.current = false
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

  // Đồng hồ đếm ngược
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
      const durationSeconds = Math.min(
        exam.durationMinutes * 60,
        Math.max(1, Math.round((Date.now() - startedAt) / 1000)),
      )
      const answeredTotal = Object.keys(answers).length
      const totalQs = exam.questions.length

      // Chấm điểm thực tế dựa trên correctIndex của từng câu hỏi trong đề
      let correctCount = 0
      for (const q of exam.questions) {
        const userAns = answers[q.number]
        const rightIdx = typeof q.correctIndex === 'number' ? q.correctIndex : 0
        if (userAns !== undefined && userAns === rightIdx) {
          correctCount++
        }
      }
      const maxScore = exam.level === 'TOPIK II' ? 300 : 200
      const score = totalQs > 0 ? Math.round((correctCount / totalQs) * maxScore) : 0
      const levelAchieved =
        exam.level === 'TOPIK II'
          ? score >= 230
            ? 'TOPIK II - Cấp 6'
            : score >= 190
              ? 'TOPIK II - Cấp 5'
              : score >= 150
                ? 'TOPIK II - Cấp 4'
                : score >= 120
                  ? 'TOPIK II - Cấp 3'
                  : 'Chưa đạt cấp (< 120đ)'
          : score >= 140
            ? 'TOPIK I - Cấp 2'
            : score >= 80
              ? 'TOPIK I - Cấp 1'
              : 'Chưa đạt cấp (< 80đ)'

      try {
        await submitTopikExam({ examId: exam.examId, answers, durationSeconds, autoSubmitted }, token)
      } catch {
        // ignore
      }

      // Đồng bộ kết quả & XP về hệ thống HANGO (/api/srs/review)
      const activeUid = profile?.uid || user?.uid
      if (activeUid) {
        try {
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
      setSubmitted({
        answeredCount: answeredTotal,
        correctCount,
        totalQuestions: totalQs,
        score,
        maxScore,
        levelAchieved,
        durationSeconds,
        autoSubmitted,
      })
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
      else if (['1', '2', '3', '4'].includes(e.key))
        setAnswers((a) => ({ ...a, [current]: Number(e.key) - 1 }))
      else if (e.key.toLowerCase() === 'f')
        setFlags((f) => (f.includes(current) ? f.filter((n) => n !== current) : [...f, current]))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [started, submitted, exam, current, total])

  const toggleFlag = () =>
    setFlags((f) => (f.includes(current) ? f.filter((n) => n !== current) : [...f, current]))

  /* =====================================================================
     VAI TRÒ ADMIN: HIỂN THỊ GIAO DIỆN QUẢN LÝ ĐỀ THI THỬ TOPIK
     (Nếu Admin chưa bấm "Thi thử" trên 1 đề cụ thể)
     ===================================================================== */
  if (isAdmin && !selectedExam) {
    return (
      <TopikAdminView
        onTryExamAsStudent={(targetExam) => {
          handleSelectExam(targetExam)
        }}
      />
    )
  }

  /* =====================================================================
     VAI TRÒ STUDENT (BƯỚC 1): DANH SÁCH ĐỀ THI THỬ TOPIK ĐỂ CHỌN ĐỀ
     ===================================================================== */
  if (!selectedExam) {
    return (
      <div className="min-h-screen w-full px-3 py-6 text-slate-900 md:px-8">
        <main className="mx-auto flex w-full max-w-6xl flex-col gap-6">
          {/* Header Danh sách Đề thi thử TOPIK */}
          <section className="rounded-2xl border-[1.5px] border-slate-800 bg-white p-5 shadow-[0_2px_0_rgba(15,23,42,0.06)] md:p-6">
            <div className="flex items-start gap-4">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-xl border border-slate-800 bg-[#2563EB] text-white shadow-sm">
                <Headphones className="size-6" aria-hidden="true" />
              </span>
              <div>
                <h1 className="text-2xl font-black tracking-tight text-slate-900 md:text-3xl">
                  Thi thử TOPIK I & II
                </h1>
                <p className="mt-1.5 max-w-3xl text-sm font-normal leading-relaxed text-slate-600">
                  Chọn một đề thi thử bên dưới để bắt đầu làm bài Nghe hiểu & Đọc hiểu có bấm giờ đếm ngược và chấm điểm tự động.
                </p>
              </div>
            </div>
          </section>

          {/* Thanh lọc cấp độ & tìm kiếm đề thi */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border-[1.5px] border-slate-800 bg-white p-2.5 shadow-[0_2px_0_rgba(15,23,42,0.06)]">
            <div className="flex flex-wrap items-center gap-1.5">
              {(['ALL', 'TOPIK I', 'TOPIK II'] as const).map((lv) => (
                <button
                  key={lv}
                  type="button"
                  onClick={() => setExamLevelFilter(lv)}
                  className={cn(
                    'rounded-xl px-4 py-2 text-xs font-bold transition-all',
                    examLevelFilter === lv
                      ? 'border border-slate-900 bg-[#2563EB] text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
                  )}
                >
                  {lv === 'ALL' ? `Tất cả đề thi (${examsList.length})` : lv}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={examSearchQuery}
                onChange={(e) => setExamSearchQuery(e.target.value)}
                placeholder="Tìm kiếm đề thi thử..."
                aria-label="Tìm kiếm đề thi thử"
                className="h-9 w-full rounded-xl border border-slate-300 bg-slate-50 pl-10 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#2563EB] focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          {/* Danh sách đề thi dạng Card Grid */}
          {loadError ? (
            <div className="rounded-2xl border-[1.5px] border-red-600 bg-red-50 p-8 text-center text-sm font-semibold text-red-900">
              {loadError}
            </div>
          ) : loadingList ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, idx) => (
                <div
                  key={idx}
                  className="h-64 animate-pulse rounded-2xl border-[1.5px] border-slate-800 bg-white p-5"
                />
              ))}
            </div>
          ) : filteredStudentExams.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border-[1.5px] border-slate-800 bg-white p-10 text-center shadow-[0_2px_0_rgba(15,23,42,0.06)]">
              <FileText className="size-10 text-[#2563EB]" />
              <p className="mt-3 text-base font-bold text-slate-900">
                {examsList.length === 0
                  ? 'Hiện chưa có đề thi thử nào được mở'
                  : 'Không tìm thấy đề thi phù hợp'}
              </p>
              <p className="mt-1 text-xs text-slate-600">
                {examsList.length === 0
                  ? 'Quản trị viên đang cập nhật bộ đề thi thử TOPIK mới. Bạn vui lòng quay lại sau nhé!'
                  : 'Hãy thử chọn lại cấp độ "Tất cả đề thi" hoặc xóa từ khóa tìm kiếm.'}
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredStudentExams.map((item) => {
                const listenCount = item.questions.filter((q) => q.section === 'listening').length
                const writeCount = item.questions.filter((q) => q.section === 'writing').length
                const readCount = item.questions.filter((q) => q.section === 'reading').length
                const savedInProgress = loadSaved(item.examId)
                const isResumable = Boolean(savedInProgress && savedInProgress.endAt > Date.now())

                return (
                  <article
                    key={item.examId}
                    onClick={() => handleSelectExam(item)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        handleSelectExam(item)
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    className="group flex cursor-pointer flex-col justify-between rounded-2xl border-[1.5px] border-slate-800 bg-white p-5 shadow-[0_2px_0_rgba(15,23,42,0.06)] transition-all hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={cn(
                            'rounded-md border px-2.5 py-0.5 text-xs font-bold',
                            item.level === 'TOPIK II'
                              ? 'border-violet-400 bg-violet-100 text-violet-950'
                              : 'border-amber-400 bg-[#FEF08A] text-amber-950',
                          )}
                        >
                          {item.level}
                        </span>

                        {isResumable ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-blue-400 bg-blue-50 px-2.5 py-0.5 text-[11px] font-bold text-blue-900">
                            <Clock className="size-3" />
                            Đang làm dở
                          </span>
                        ) : (
                          <span className="rounded-full border border-emerald-400 bg-[#DCFCE7] px-2.5 py-0.5 text-[11px] font-bold text-emerald-900">
                            {item.questions.length} câu hỏi
                          </span>
                        )}
                      </div>

                      <h2 className="mt-3 text-lg font-extrabold text-slate-900 group-hover:text-[#2563EB]">
                        {item.title}
                      </h2>
                      <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-slate-600">
                        {item.description || 'Đề thi thử chuẩn cấu trúc TOPIK.'}
                      </p>

                      <div
                        className={cn(
                          'mt-4 grid gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-center',
                          writeCount > 0 ? 'grid-cols-4' : 'grid-cols-3',
                        )}
                      >
                        <div>
                          <p className="text-[11px] font-medium text-slate-500">Thời gian</p>
                          <p className="text-sm font-black text-slate-900">
                            {item.durationMinutes}p
                          </p>
                        </div>
                        <div>
                          <p className="text-[11px] font-medium text-slate-500">Nghe</p>
                          <p className="text-sm font-bold text-[#2563EB]">{listenCount} câu</p>
                        </div>
                        {writeCount > 0 && (
                          <div>
                            <p className="text-[11px] font-medium text-slate-500">Viết</p>
                            <p className="text-sm font-bold text-emerald-700">{writeCount} câu</p>
                          </div>
                        )}
                        <div>
                          <p className="text-[11px] font-medium text-slate-500">Đọc</p>
                          <p className="text-sm font-bold text-violet-700">{readCount} câu</p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 flex items-center justify-between border-t border-slate-200 pt-3">
                      <span className="text-xs font-semibold text-slate-600">
                        Nghe tối đa {item.maxListenCount} lần/câu
                      </span>
                      <span className="inline-flex items-center gap-1.5 rounded-xl border border-slate-900 bg-[#2563EB] px-3.5 py-2 text-xs font-bold text-white shadow-sm transition group-hover:bg-blue-600">
                        <Play className="size-3.5 fill-current" />
                        <span>{isResumable ? 'Tiếp tục làm' : 'Chọn đề thi'}</span>
                      </span>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </main>
      </div>
    )
  }

  /* ---------- Màn hình giới thiệu đề đã chọn trước khi bấm giờ ---------- */
  if (!started && exam) {
    return (
      <div className="min-h-screen w-full px-3 py-6 text-slate-900 md:px-8">
        <main className="mx-auto flex w-full max-w-6xl flex-col gap-6">
          <div>
            <button
              type="button"
              onClick={() => setSelectedExam(null)}
              className="inline-flex items-center gap-2 rounded-xl border-[1.5px] border-slate-800 bg-white px-4 py-2 text-xs font-bold text-slate-900 shadow-sm transition hover:bg-slate-50"
            >
              <ArrowLeft className="size-4 text-[#2563EB]" />
              <span>{isAdmin ? 'Quay lại Quản lý đề thi (Admin)' : 'Quay lại danh sách đề thi'}</span>
            </button>
          </div>

          <section className="rounded-2xl border-[1.5px] border-slate-800 bg-white p-5 shadow-[0_2px_0_rgba(15,23,42,0.06)] md:p-6">
            <div className="flex items-start gap-4">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-xl border border-slate-800 bg-[#2563EB] text-white shadow-sm">
                <Headphones className="size-6" aria-hidden="true" />
              </span>
              <div>
                <h1 className="text-2xl font-black tracking-tight text-slate-900 md:text-3xl">
                  Thi thử TOPIK I & II
                </h1>
                <p className="mt-1.5 max-w-3xl text-sm font-normal leading-relaxed text-slate-600">
                  Làm đề thi thử Nghe hiểu & Đọc hiểu có đồng hồ đếm ngược thời gian thực, tự động lưu bài làm và đánh dấu câu hỏi xem lại.
                </p>
              </div>
            </div>
          </section>

          <div className="mx-auto w-full max-w-2xl rounded-2xl border-[1.5px] border-slate-800 bg-white p-6 shadow-[0_2px_0_rgba(15,23,42,0.06)] md:p-8">
            <span className="rounded-md border border-amber-400 bg-[#FEF08A] px-2.5 py-1 text-xs font-bold text-amber-950">
              {exam.level}
            </span>
            <h2 className="mt-3 text-2xl font-black text-slate-900">{exam.title}</h2>
            {exam.description && (
              <p className="mt-1.5 text-sm text-slate-600">{exam.description}</p>
            )}
            <dl
              className={cn(
                'mt-6 grid gap-3 text-center',
                writingQs.length > 0 ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-3',
              )}
            >
              <div className="rounded-xl border border-slate-300 bg-slate-50 p-3">
                <dt className="text-xs font-semibold text-slate-500">Thời gian</dt>
                <dd className="mt-1 text-lg font-black text-slate-900">{exam.durationMinutes} phút</dd>
              </div>
              <div className="rounded-xl border border-slate-300 bg-slate-50 p-3">
                <dt className="text-xs font-semibold text-slate-500">Phần Nghe</dt>
                <dd className="mt-1 text-lg font-black text-[#2563EB]">{listeningQs.length} câu</dd>
              </div>
              {writingQs.length > 0 && (
                <div className="rounded-xl border border-slate-300 bg-slate-50 p-3">
                  <dt className="text-xs font-semibold text-slate-500">Phần Viết</dt>
                  <dd className="mt-1 text-lg font-black text-emerald-700">{writingQs.length} câu</dd>
                </div>
              )}
              <div className="rounded-xl border border-slate-300 bg-slate-50 p-3">
                <dt className="text-xs font-semibold text-slate-500">Phần Đọc</dt>
                <dd className="mt-1 text-lg font-black text-violet-700">{readingQs.length} câu</dd>
              </div>
            </dl>
            <ul className="mt-6 space-y-2 text-sm text-slate-600">
              <li>
                • Mỗi câu phần Nghe được nghe tối đa <b className="text-slate-900">{exam.maxListenCount} lần</b>.
              </li>
              <li>
                • Hết giờ hệ thống sẽ <b className="text-slate-900">tự động nộp bài</b>.
              </li>
              <li>• Bài làm được tự lưu, tải lại trang vẫn tiếp tục được.</li>
              <li>• Phím tắt: ← → chuyển câu · 1–4 chọn đáp án · F đánh dấu xem lại.</li>
            </ul>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              {hasSaved && (
                <button
                  type="button"
                  onClick={() => startExam(true)}
                  className="h-11 flex-1 rounded-xl border border-slate-900 bg-[#2563EB] font-bold text-white shadow-sm hover:bg-blue-600"
                >
                  Tiếp tục bài đang làm
                </button>
              )}
              <button
                type="button"
                onClick={() => startExam(false)}
                className={cn(
                  'h-11 flex-1 rounded-xl font-bold',
                  hasSaved
                    ? 'border border-slate-800 bg-white text-slate-900 hover:bg-slate-50'
                    : 'border border-slate-900 bg-[#2563EB] text-white shadow-sm hover:bg-blue-600',
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

  /* ---------- Màn hình kết quả & đối chiếu đáp án sau khi nộp bài ---------- */
  if (submitted && exam) {
    return (
      <div className="min-h-screen w-full px-3 py-6 text-slate-900 md:px-8">
        <main className="mx-auto flex w-full max-w-5xl flex-col gap-6">
          <div
            role="status"
            className="rounded-2xl border-[1.5px] border-slate-800 bg-white p-6 text-center shadow-[0_2px_0_rgba(15,23,42,0.06)] md:p-8"
          >
            <CheckCircle2 className="mx-auto size-14 text-emerald-600" />
            <h2 className="mt-3 text-2xl font-black text-slate-900">
              {submitted.autoSubmitted ? 'Hết giờ – Đã tự động nộp bài' : 'Đã nộp bài thành công'}
            </h2>
            <p className="mt-1 text-sm text-slate-600">{exam.title}</p>

            <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-xl border border-slate-300 bg-slate-50 p-3">
                <dt className="text-xs font-semibold text-slate-500">Điểm đạt được</dt>
                <dd className="mt-1 text-xl font-black text-[#2563EB]">
                  {submitted.score}/{submitted.maxScore}
                </dd>
              </div>
              <div className="rounded-xl border border-slate-300 bg-slate-50 p-3">
                <dt className="text-xs font-semibold text-slate-500">Số câu đúng</dt>
                <dd className="mt-1 text-xl font-black text-emerald-700">
                  {submitted.correctCount}/{submitted.totalQuestions}
                </dd>
              </div>
              <div className="rounded-xl border border-slate-300 bg-slate-50 p-3">
                <dt className="text-xs font-semibold text-slate-500">Xếp loại</dt>
                <dd className="mt-1 text-base font-black text-amber-900">
                  {submitted.levelAchieved}
                </dd>
              </div>
              <div className="rounded-xl border border-slate-300 bg-slate-50 p-3">
                <dt className="text-xs font-semibold text-slate-500">Thời gian làm</dt>
                <dd className="mt-1 text-xl font-black text-slate-900">
                  {formatTime(submitted.durationSeconds)}
                </dd>
              </div>
            </dl>

            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  submittedRef.current = false
                  setSubmitted(null)
                  setStarted(false)
                  setHasSaved(false)
                  setSelectedExam(null)
                }}
                className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-900 bg-[#2563EB] px-6 text-xs font-bold text-white shadow-sm hover:bg-blue-600"
              >
                <ArrowLeft className="size-4" />
                <span>{isAdmin ? 'Về trang Quản lý đề thi' : 'Chọn đề thi khác'}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  submittedRef.current = false
                  setSubmitted(null)
                  setStarted(false)
                  setHasSaved(false)
                }}
                className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-800 bg-white px-6 text-xs font-bold text-slate-900 hover:bg-slate-50"
              >
                <RotateCcw className="size-4" />
                <span>Làm lại đề này</span>
              </button>
            </div>
          </div>

          {/* Bảng xem lại đáp án & lời giải chi tiết */}
          <section className="rounded-2xl border-[1.5px] border-slate-800 bg-white p-6 shadow-[0_2px_0_rgba(15,23,42,0.06)]">
            <div className="flex items-center gap-2">
              <Trophy className="size-5 text-[#2563EB]" />
              <h3 className="text-lg font-black text-slate-900">Chi tiết đáp án & Lời giải</h3>
            </div>
            <div className="mt-4 space-y-4">
              {exam.questions.map((q) => {
                const userAns = answers[q.number]
                const rightIdx = typeof q.correctIndex === 'number' ? q.correctIndex : 0
                const isRight = userAns === rightIdx
                return (
                  <div
                    key={q.number}
                    className={cn(
                      'rounded-2xl border p-4',
                      isRight
                        ? 'border-emerald-300 bg-emerald-50/40'
                        : 'border-red-300 bg-red-50/40',
                    )}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-bold text-slate-900">
                        Câu {q.number} (
                        {q.section === 'listening'
                          ? 'Phần Nghe'
                          : q.section === 'writing'
                            ? 'Phần Viết'
                            : 'Phần Đọc'}
                        )
                      </span>
                      <span
                        className={cn(
                          'rounded-full px-2.5 py-0.5 text-xs font-bold',
                          isRight
                            ? 'bg-emerald-100 text-emerald-900'
                            : 'bg-red-100 text-red-900',
                        )}
                      >
                        {isRight ? '✓ Chính xác' : userAns === undefined ? 'Chưa chọn' : '✗ Chưa đúng'}
                      </span>
                    </div>
                    <p lang="ko" className="mt-2 text-sm font-bold text-slate-900">
                      {q.prompt}
                    </p>
                    <div className="mt-2.5 grid gap-2 sm:grid-cols-2">
                      {q.options.map((opt, idx) => {
                        const letter = 'ABCD'[idx]
                        const isCorrectOpt = idx === rightIdx
                        const isUserOpt = idx === userAns
                        return (
                          <div
                            key={idx}
                            className={cn(
                              'flex items-center gap-2 rounded-xl border px-3 py-2 text-xs',
                              isCorrectOpt
                                ? 'border-emerald-500 bg-emerald-100 font-bold text-emerald-950'
                                : isUserOpt
                                  ? 'border-red-400 bg-red-100 font-semibold text-red-950'
                                  : 'border-slate-200 bg-white text-slate-700',
                            )}
                          >
                            <span className="font-bold">{letter}.</span>
                            <span lang="ko" className="flex-1">
                              {opt}
                            </span>
                            {isCorrectOpt && (
                              <span className="text-[10px] font-extrabold text-emerald-800">
                                Đáp án đúng
                              </span>
                            )}
                          </div>
                        )
                      })}
                    </div>
                    {q.explanation && (
                      <p className="mt-2.5 rounded-lg bg-white/80 p-2.5 text-xs text-slate-700">
                        <strong>Lời giải:</strong> {q.explanation}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          </section>
        </main>
      </div>
    )
  }

  if (!exam || !question) return null

  /* ---------- Màn hình đang làm bài thi ---------- */
  const selected = answers[current]
  const isFlagged = flags.includes(current)
  const isListening = question.section === 'listening'

  const renderGrid = (qs: ExtendedTopikQuestion[]) => (
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
              'relative flex aspect-square items-center justify-center rounded-lg border text-sm font-bold transition-colors',
              answered
                ? 'border-slate-900 bg-[#2563EB] text-white'
                : 'border-slate-300 bg-white text-slate-900 hover:bg-slate-100',
              isCurrent && 'ring-2 ring-[#2563EB] ring-offset-2',
            )}
          >
            {n}
            {flagged && (
              <Flag
                className="absolute -right-1 -top-1 size-3.5 fill-amber-400 text-amber-500"
                aria-hidden="true"
              />
            )}
          </button>
        )
      })}
    </div>
  )

  return (
    <div className="flex min-h-screen flex-col text-slate-900">
      <header className="sticky top-0 z-30 border-b-[1.5px] border-slate-800 bg-white/95 backdrop-blur">
        <div className="flex h-16 items-center justify-between gap-4 px-4 md:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setStarted(false)
              }}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 text-xs font-bold text-slate-800 hover:bg-slate-100"
            >
              <ArrowLeft className="size-4" />
              <span>Thoát phòng thi</span>
            </button>
            <h1 className="hidden truncate text-sm font-black text-slate-900 sm:block md:text-base">
              {exam.title}
            </h1>
          </div>
          <div
            role="timer"
            aria-label="Thời gian còn lại"
            className={cn(
              'flex items-center gap-2 rounded-xl px-4 py-1.5 font-mono text-2xl font-black tabular-nums md:text-3xl',
              urgent
                ? 'animate-pulse bg-red-100 text-red-700 ring-1 ring-red-500'
                : 'text-slate-900',
            )}
          >
            <Clock className="size-6 text-[#2563EB]" aria-hidden="true" />
            {formatTime(secondsLeft)}
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-slate-600 sm:inline">
              Câu <span className="font-bold text-slate-900">{current}</span>/{total}
            </span>
            <button
              type="button"
              onClick={() => setConfirmOpen(true)}
              disabled={submitting}
              className="h-10 rounded-xl border border-slate-900 bg-red-600 px-4 text-sm font-bold text-white shadow-sm hover:bg-red-700 disabled:opacity-50"
            >
              Nộp bài
            </button>
          </div>
        </div>
        {urgent && (
          <div className="flex items-center justify-center gap-2 bg-red-100 py-1.5 text-xs font-bold text-red-800">
            <AlertTriangle className="size-3.5" /> Còn dưới 5 phút! Hệ thống sẽ tự nộp bài khi hết giờ.
          </div>
        )}
      </header>

      <div className="flex flex-1 flex-col md:flex-row">
        <aside
          aria-label="Danh sách câu hỏi"
          className="border-b-[1.5px] border-slate-800 bg-white p-5 md:w-[30%] md:border-b-0 md:border-r-[1.5px]"
        >
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold text-slate-600">Đã làm</span>
            <span className="font-black text-slate-900">
              {answeredCount}/{total}
            </span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full border border-slate-800 bg-slate-100">
            <div
              className="h-full bg-[#2563EB] transition-all"
              style={{ width: `${total ? (answeredCount / total) * 100 : 0}%` }}
            />
          </div>
          {listeningQs.length > 0 && (
            <>
              <h2 className="mb-3 mt-6 text-xs font-extrabold uppercase tracking-wider text-[#2563EB]">
                Phần Nghe ({listeningQs[0].number}–{listeningQs[listeningQs.length - 1].number})
              </h2>
              {renderGrid(listeningQs)}
            </>
          )}
          {writingQs.length > 0 && (
            <>
              <h2 className="mb-3 mt-6 text-xs font-extrabold uppercase tracking-wider text-emerald-700">
                Phần Viết ({writingQs[0].number}–{writingQs[writingQs.length - 1].number})
              </h2>
              {renderGrid(writingQs)}
            </>
          )}
          {readingQs.length > 0 && (
            <>
              <h2 className="mb-3 mt-6 text-xs font-extrabold uppercase tracking-wider text-violet-700">
                Phần Đọc ({readingQs[0].number}–{readingQs[readingQs.length - 1].number})
              </h2>
              {renderGrid(readingQs)}
            </>
          )}
          <ul className="mt-6 flex flex-wrap gap-4 text-xs font-medium text-slate-600">
            <li className="flex items-center gap-2">
              <span className="size-3 rounded border border-slate-400 bg-white" /> Chưa làm
            </li>
            <li className="flex items-center gap-2">
              <span className="size-3 rounded bg-[#2563EB]" /> Đã làm
            </li>
            <li className="flex items-center gap-2">
              <Flag className="size-3 fill-amber-400 text-amber-500" /> Xem lại
            </li>
          </ul>
        </aside>

        <main className="flex-1 p-4 md:p-8">
          <article className="mx-auto max-w-3xl rounded-2xl border-[1.5px] border-slate-800 bg-white p-6 shadow-[0_2px_0_rgba(15,23,42,0.06)] md:p-8">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="rounded-lg bg-[#2563EB] px-3 py-1 text-sm font-bold text-white">
                  Câu {current}
                </span>
                <span className="inline-flex items-center gap-1 text-sm font-bold text-slate-600">
                  {isListening ? (
                    <>
                      <Headphones className="size-4 text-[#2563EB]" />
                      <span>Phần Nghe</span>
                    </>
                  ) : question.section === 'writing' ? (
                    <>
                      <Edit3 className="size-4 text-emerald-700" />
                      <span>Phần Viết</span>
                    </>
                  ) : (
                    <>
                      <BookOpen className="size-4 text-violet-700" />
                      <span>Phần Đọc</span>
                    </>
                  )}
                </span>
              </div>
              <button
                type="button"
                onClick={toggleFlag}
                aria-pressed={isFlagged}
                className={cn(
                  'flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-bold transition-colors',
                  isFlagged
                    ? 'border-amber-500 bg-[#FEF08A] text-amber-950'
                    : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50',
                )}
              >
                <Flag className={cn('size-3.5', isFlagged && 'fill-amber-500')} />
                {isFlagged ? 'Đã đánh dấu' : 'Đánh dấu xem lại'}
              </button>
            </div>

            {isListening && (
              <ListeningPlayer
                question={question}
                listenCount={listenCounts[current] ?? 0}
                maxListenCount={exam.maxListenCount}
                onListen={() =>
                  setListenCounts((c) => ({ ...c, [current]: (c[current] ?? 0) + 1 }))
                }
                disabled={submitting}
              />
            )}

            <div className="mt-6">
              <p lang="ko" className="text-lg font-bold leading-relaxed text-slate-900">
                {question.prompt}
              </p>
              {question.hint && <p className="mt-1.5 text-sm text-slate-600">{question.hint}</p>}
            </div>

            {question.passage && (
              <div
                lang="ko"
                className="mt-5 rounded-xl border border-slate-300 bg-slate-50 p-4 text-base leading-loose text-slate-900"
              >
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
                        'flex cursor-pointer items-center gap-4 rounded-xl border-[1.5px] p-4 transition-colors',
                        isSelected
                          ? 'border-slate-900 bg-[#2563EB] text-white shadow-sm'
                          : 'border-slate-300 bg-white text-slate-900 hover:border-[#2563EB]',
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
                          isSelected ? 'bg-white text-[#2563EB]' : 'bg-slate-100 text-slate-800',
                        )}
                      >
                        {letter}
                      </span>
                      <span lang="ko" className="flex-1 font-medium">
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
                className="flex h-11 items-center gap-2 rounded-xl border border-slate-800 bg-white px-4 text-sm font-bold text-slate-800 hover:bg-slate-50 disabled:opacity-40"
              >
                <ChevronLeft className="size-4" aria-hidden="true" />
                Câu trước
              </button>
              {current === total ? (
                <button
                  type="button"
                  onClick={() => setConfirmOpen(true)}
                  className="flex h-11 items-center gap-2 rounded-xl border border-slate-900 bg-red-600 px-5 text-sm font-bold text-white shadow-sm hover:bg-red-700"
                >
                  Nộp bài
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setCurrent((c) => c + 1)}
                  className="flex h-11 items-center gap-2 rounded-xl border border-slate-900 bg-[#2563EB] px-5 text-sm font-bold text-white shadow-sm hover:bg-blue-600"
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
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs"
        >
          <div className="w-full max-w-md rounded-2xl border-[1.5px] border-slate-800 bg-white p-6 text-slate-900 shadow-2xl">
            <div className="flex items-start justify-between">
              <h2 className="text-lg font-black text-slate-900">Xác nhận nộp bài?</h2>
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                aria-label="Đóng"
                className="rounded-lg p-1 text-slate-500 hover:bg-slate-100"
              >
                <X className="size-5" />
              </button>
            </div>
            <p className="mt-2 text-sm text-slate-600">
              Bạn đã làm <b className="text-slate-900">{answeredCount}/{total}</b> câu. Thời gian còn lại{' '}
              <b className="text-slate-900">{formatTime(secondsLeft)}</b>.
            </p>
            {unanswered.length > 0 && (
              <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm">
                <p className="font-bold text-amber-900">Còn {unanswered.length} câu chưa làm:</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {unanswered.map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => {
                        setCurrent(n)
                        setConfirmOpen(false)
                      }}
                      className="rounded-md border border-slate-300 bg-white px-2 py-0.5 text-xs font-bold text-slate-800 hover:bg-slate-100"
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
                className="h-11 flex-1 rounded-xl border border-slate-300 bg-white font-bold text-slate-800 hover:bg-slate-50"
              >
                Làm tiếp
              </button>
              <button
                type="button"
                onClick={() => void doSubmit(false)}
                disabled={submitting}
                className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-slate-900 bg-red-600 font-bold text-white hover:bg-red-700 disabled:opacity-50"
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
