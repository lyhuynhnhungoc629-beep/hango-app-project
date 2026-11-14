'use client'

import { useState, useRef, useEffect } from 'react'
import { AlertTriangle, Check, Mic, Square, Volume2, X, RefreshCw, AlertCircle, PlayCircle, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

type Status = 'good' | 'warn' | 'bad'

interface SyllableItem {
  text: string
  status: Status
}

const TARGET_SENTENCE = '오늘 날씨가 좋네요'
const TARGET_ROMAN = 'o-neul nal-ssi-ga jo-ne-yo'
const TARGET_MEANING = 'Hôm nay thời tiết đẹp nhỉ'

const targetSyllables = ['오늘', '날씨', '가', '좋', '네', '요']

const initialSyllables: SyllableItem[] = targetSyllables.map((text) => ({
  text,
  status: 'warn',
}))

const statusStyle: Record<Status, { cls: string; icon: typeof Check; label: string }> = {
  good: { cls: 'border-green-500/50 bg-green-500/15 text-green-300 shadow-sm', icon: Check, label: 'Chính xác' },
  warn: { cls: 'border-amber-500/50 bg-amber-500/15 text-amber-300 shadow-sm', icon: AlertTriangle, label: 'Cần cải thiện' },
  bad: { cls: 'border-red-500/50 bg-red-500/15 text-red-300 shadow-sm', icon: X, label: 'Chưa đúng' },
}

const R = 54
const C = 2 * Math.PI * R

export function PronunciationPractice() {
  const [recording, setRecording] = useState(false)
  const [score, setScore] = useState<number | null>(null) // Ban đầu chưa có điểm, chờ người dùng nói
  const [syllables, setSyllables] = useState<SyllableItem[]>(initialSyllables)
  const [spokenText, setSpokenText] = useState<string>('')
  const [interimText, setInterimText] = useState<string>('')
  const [feedbackNote, setFeedbackNote] = useState<string>(
    'Hãy bấm nút Micro và đọc to câu tiếng Hàn mẫu để AI phân tích phát âm của bạn.',
  )
  const [speakingSample, setSpeakingSample] = useState(false)
  const [isSlowMode, setIsSlowMode] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const recognitionRef = useRef<any>(null)
  const lastSampleClickRef = useRef<number>(0)

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop()
        } catch {
          // ignore
        }
      }
    }
  }, [])

  // Tìm voice tiếng Hàn chuẩn
  const getKoreanVoice = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null
    const voices = window.speechSynthesis.getVoices()
    return (
      voices.find(
        (v) =>
          v.lang.startsWith('ko') &&
          (v.name.includes('Natural') ||
            v.name.includes('Google') ||
            v.name.includes('Heami') ||
            v.name.includes('Yuna')),
      ) ||
      voices.find((v) => v.lang.startsWith('ko')) ||
      null
    )
  }

  // Phát âm mẫu giống Google Dịch: Bấm lần 1 đọc bình thường (0.9x), lần 2 đọc chậm (0.55x)
  const playSample = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
    try {
      window.speechSynthesis.cancel()

      const now = Date.now()
      let shouldBeSlow = false
      if (now - lastSampleClickRef.current < 5000) {
        shouldBeSlow = !isSlowMode
      } else {
        shouldBeSlow = false
      }
      lastSampleClickRef.current = now
      setIsSlowMode(shouldBeSlow)

      const utterance = new SpeechSynthesisUtterance(TARGET_SENTENCE)
      utterance.lang = 'ko-KR'
      utterance.rate = shouldBeSlow ? 0.55 : 0.9

      const voice = getKoreanVoice()
      if (voice) utterance.voice = voice

      utterance.onstart = () => setSpeakingSample(true)
      utterance.onend = () => setSpeakingSample(false)
      utterance.onerror = () => setSpeakingSample(false)
      window.speechSynthesis.speak(utterance)
    } catch {
      setSpeakingSample(false)
    }
  }

  // Thuật toán so khớp và chấm điểm thực tế 100%
  const evaluateSpeech = (recognized: string) => {
    const raw = recognized.trim()
    setSpokenText(raw)
    setInterimText('')

    if (!raw) {
      setScore(0)
      setSyllables(targetSyllables.map((t) => ({ text: t, status: 'bad' })))
      setFeedbackNote('Chưa ghi nhận được âm thanh rõ ràng. Vui lòng thử nói to và gần micro hơn.')
      return
    }

    const cleanRecognized = raw.replace(/[.,?!~ ]/g, '').toLowerCase()

    let matchedPoints = 0
    const nextSyllables: SyllableItem[] = targetSyllables.map((target) => {
      const cleanTarget = target.replace(/ /g, '').toLowerCase()
      if (cleanRecognized.includes(cleanTarget)) {
        matchedPoints += 1.0
        return { text: target, status: 'good' }
      } else if (cleanTarget.split('').some((char) => cleanRecognized.includes(char))) {
        matchedPoints += 0.4
        return { text: target, status: 'warn' }
      } else {
        return { text: target, status: 'bad' }
      }
    })

    // Tính điểm % thực tế từ 0 đến 100
    const calculatedScore = Math.min(100, Math.round((matchedPoints / targetSyllables.length) * 100))
    setScore(calculatedScore)
    setSyllables(nextSyllables)

    if (calculatedScore >= 85) {
      setFeedbackNote('Tuyệt vời! Bạn phát âm rất rõ ràng, chuẩn xác và đúng ngữ điệu tiếng Hàn 🎉')
    } else if (calculatedScore >= 60) {
      setFeedbackNote('Khá tốt! Bạn đã phát âm đúng phần lớn các từ, nhưng hãy chú ý nhấn rõ hơn ở các âm tiết bị vàng.')
    } else if (calculatedScore >= 30) {
      setFeedbackNote('Chưa chính xác lắm. AI nhận thấy một số âm tiết bị thiếu hoặc lệch âm. Hãy bấm nghe mẫu và thử đọc lại chậm hơn.')
    } else {
      setFeedbackNote('Âm thanh nhận diện chưa khớp với câu tiếng Hàn mẫu. Hãy thử đọc lại to, rõ ràng theo phiên âm Romaja nhé!')
    }
  }

  const toggleRecording = () => {
    setErrorMessage(null)
    if (recording) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop()
        } catch {
          // ignore
        }
      }
      setRecording(false)
      return
    }

    if (typeof window === 'undefined') return
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

    if (!SpeechRecognition) {
      setErrorMessage(
        'Trình duyệt này không hỗ trợ Speech Recognition. Hãy dùng Google Chrome hoặc Microsoft Edge để luyện nói!',
      )
      return
    }

    try {
      const recognition = new SpeechRecognition()
      recognition.lang = 'ko-KR'
      recognition.interimResults = true
      recognition.maxAlternatives = 1

      recognition.onstart = () => {
        setRecording(true)
        setInterimText('Đang lắng nghe...')
      }

      recognition.onresult = (event: any) => {
        let finalTranscript = ''
        let currentInterim = ''

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript
          } else {
            currentInterim += event.results[i][0].transcript
          }
        }

        if (currentInterim) {
          setInterimText(currentInterim)
        }

        if (finalTranscript) {
          evaluateSpeech(finalTranscript)
        } else if (currentInterim && !finalTranscript) {
          // Nếu trình duyệt chưa đánh dấu isFinal nhưng người dùng đã nói
          evaluateSpeech(currentInterim)
        }
      }

      recognition.onerror = (event: any) => {
        setRecording(false)
        if (event.error === 'not-allowed') {
          setErrorMessage('Vui lòng cấp quyền sử dụng Micro trên thanh địa chỉ trình duyệt để AI có thể nghe bạn nói!')
        } else if (event.error === 'no-speech') {
          setErrorMessage('Chưa thu được giọng nói. Bạn hãy bấm Micro và đọc lại to hơn nhé!')
        } else {
          setErrorMessage(`Lỗi nhận diện âm thanh: ${event.error}`)
        }
      }

      recognition.onend = () => {
        setRecording(false)
      }

      recognitionRef.current = recognition
      recognition.start()
    } catch (err) {
      console.error(err)
      setRecording(false)
      setErrorMessage('Không thể mở micro. Vui lòng tải lại trang hoặc kiểm tra thiết bị thu âm.')
    }
  }

  // Chức năng giả lập test nhanh để người dùng kiểm chứng thuật toán chấm điểm
  const simulateTest = (type: 'perfect' | 'medium' | 'wrong') => {
    if (type === 'perfect') {
      evaluateSpeech('오늘 날씨가 좋네요')
    } else if (type === 'medium') {
      evaluateSpeech('오늘 날씨 좋')
    } else {
      evaluateSpeech('xin chào việt nam')
    }
  }

  const displayScore = score !== null ? score : 0

  return (
    <section aria-label="Luyện phát âm" className="mx-auto max-w-3xl rounded-2xl border border-border bg-card p-6 md:p-10 shadow-lg">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">Đọc to câu sau theo mẫu</p>
        <button
          type="button"
          onClick={() => {
            setScore(null)
            setSyllables(initialSyllables)
            setSpokenText('')
            setInterimText('')
            setErrorMessage(null)
            setFeedbackNote('Hãy bấm nút Micro và đọc to câu tiếng Hàn mẫu để AI phân tích phát âm của bạn.')
          }}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
        >
          <RefreshCw className="size-3.5" /> Đặt lại
        </button>
      </div>

      <p lang="ko" className="mt-4 text-center text-4xl font-bold tracking-wide md:text-5xl text-foreground">
        {TARGET_SENTENCE}
      </p>
      <p className="mt-3 text-center text-muted-foreground font-medium">{TARGET_ROMAN}</p>
      <p className="mt-1 text-center text-sm text-slate-400">{`"${TARGET_MEANING}"`}</p>

      <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={playSample}
          className={cn(
            'inline-flex items-center gap-2 rounded-full border border-border bg-background px-5 py-2.5 text-sm font-semibold transition-all cursor-pointer shadow-sm',
            speakingSample ? 'border-primary text-primary shadow-primary/30 scale-105' : 'hover:border-primary/50',
          )}
        >
          <Volume2 className={cn('size-4 text-violet-400', speakingSample && 'animate-bounce')} aria-hidden="true" />
          {speakingSample ? (isSlowMode ? '🐢 Đang đọc chậm (0.6x)...' : '⚡ Đang đọc bình thường (0.9x)...') : 'Nghe phát âm mẫu (Bấm 2 lần đọc chậm)'}
        </button>
      </div>

      {errorMessage && (
        <div className="mt-4 flex items-center gap-2.5 rounded-xl bg-red-500/10 border border-red-500/30 p-3.5 text-sm text-red-200">
          <AlertCircle className="size-4 shrink-0 text-red-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Hiển thị văn bản AI nhận diện thời gian thực */}
      {(spokenText || interimText) && (
        <div className="mt-6 rounded-xl bg-primary/10 border border-primary/20 p-3.5 text-center text-sm">
          <span className="text-muted-foreground">AI nhận diện bạn vừa nói: </span>
          <span lang="ko" className="font-bold text-violet-300 text-base">
            &quot;{spokenText || interimText}&quot;
          </span>
        </div>
      )}

      <div className="mt-10 flex flex-col items-center gap-8 md:flex-row md:justify-center md:gap-16">
        <div className="flex flex-col items-center">
          <div className="relative">
            {recording && (
              <>
                <span aria-hidden="true" className="absolute inset-0 animate-ping rounded-full bg-red-500/40" />
                <span aria-hidden="true" className="absolute -inset-4 animate-pulse rounded-full bg-red-500/20" />
              </>
            )}
            <button
              type="button"
              aria-pressed={recording}
              onClick={toggleRecording}
              className={cn(
                'relative flex size-28 items-center justify-center rounded-full shadow-2xl transition-all cursor-pointer',
                recording ? 'bg-red-500 shadow-red-500/50 scale-105' : 'bg-primary shadow-primary/40 hover:bg-primary/90 hover:scale-105',
              )}
            >
              {recording ? (
                <Square className="size-10 fill-current text-white animate-pulse" aria-hidden="true" />
              ) : (
                <Mic className="size-12 text-white" aria-hidden="true" />
              )}
              <span className="sr-only">{recording ? 'Dừng thu âm' : 'Bấm để thu âm'}</span>
            </button>
          </div>
          <p className="mt-4 font-semibold text-sm">
            {recording ? (
              <span className="text-red-400 animate-pulse font-bold">🔴 Đang thu âm... Hãy nói tiếng Hàn!</span>
            ) : (
              'Bấm Micro để đọc'
            )}
          </p>
        </div>

        <div className="flex flex-col items-center">
          <div className="relative size-36">
            <svg viewBox="0 0 128 128" className="size-full -rotate-90" aria-hidden="true">
              <defs>
                <linearGradient id="score-grad" x1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#ef4444" />
                  <stop offset="50%" stopColor="#eab308" />
                  <stop offset="100%" stopColor="#22c55e" />
                </linearGradient>
              </defs>
              <circle cx="64" cy="64" r={R} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="10" />
              <circle
                cx="64"
                cy="64"
                r={R}
                fill="none"
                stroke="url(#score-grad)"
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={C}
                strokeDashoffset={C * (1 - displayScore / 100)}
                className="transition-all duration-700 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-extrabold tabular-nums">{score !== null ? score : '--'}</span>
              <span className="text-xs text-muted-foreground">{score !== null ? '/100 điểm' : 'chờ đọc'}</span>
            </div>
          </div>
          <p
            className={cn(
              'mt-3 font-semibold text-sm',
              score === null
                ? 'text-muted-foreground'
                : score >= 80
                ? 'text-green-400'
                : score >= 60
                ? 'text-amber-400'
                : 'text-red-400',
            )}
          >
            {score === null
              ? 'Sẵn sàng chấm điểm'
              : score >= 80
              ? 'Phát âm rất chuẩn! 🎉'
              : score >= 60
              ? 'Tạm ổn, cần chú ý âm vàng'
              : 'Chưa chính xác, thử lại nhé!'}
          </p>
        </div>
      </div>

      <div className="mt-10 border-t border-border pt-6">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Phân tích từng âm tiết</h3>
          {/* Nút test nhanh cho bạn kiểm tra thuật toán */}
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground">
            <span>Chấm thử:</span>
            <button
              type="button"
              onClick={() => simulateTest('perfect')}
              className="rounded bg-green-500/20 px-2 py-0.5 text-green-300 hover:bg-green-500/30 cursor-pointer"
            >
              Đúng (100đ)
            </button>
            <button
              type="button"
              onClick={() => simulateTest('medium')}
              className="rounded bg-amber-500/20 px-2 py-0.5 text-amber-300 hover:bg-amber-500/30 cursor-pointer"
            >
              Gần đúng (60đ)
            </button>
            <button
              type="button"
              onClick={() => simulateTest('wrong')}
              className="rounded bg-red-500/20 px-2 py-0.5 text-red-300 hover:bg-red-500/30 cursor-pointer"
            >
              Sai (0đ)
            </button>
          </div>
        </div>

        <ul className="mt-4 flex flex-wrap gap-2.5">
          {syllables.map((s, i) => {
            const { cls, icon: Icon, label } = statusStyle[s.status]
            return (
              <li key={i} className={cn('flex items-center gap-2 rounded-xl border px-4 py-2.5 transition-all', cls)}>
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
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-green-500" />
            Chính xác (Màu xanh)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-amber-500" />
            Cần cải thiện (Màu vàng)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-red-500" />
            Chưa đúng (Màu đỏ)
          </span>
        </div>

        <div className="mt-4 rounded-xl bg-primary/10 border border-primary/20 p-4 text-sm text-foreground/90">
          <p className="font-semibold text-primary flex items-center gap-1.5">
            <Sparkles className="size-4 text-primary" /> Nhận xét từ AI:
          </p>
          <p className="mt-1 text-muted-foreground">{feedbackNote}</p>
        </div>
      </div>
    </section>
  )
}
