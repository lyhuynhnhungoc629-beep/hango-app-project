'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import {
  AlertTriangle,
  Check,
  Mic,
  Square,
  Volume2,
  X,
  RefreshCw,
  AlertCircle,
  PlayCircle,
  Sparkles,
  BookOpen,
} from 'lucide-react'
import { cn } from '@/lib/utils'

type Status = 'good' | 'warn' | 'bad'

interface SyllableItem {
  text: string
  status: Status
}

export interface PracticeSentence {
  id: string
  sentence: string
  roman: string
  meaning: string
  syllables: string[]
  category: 'Chào hỏi' | 'Đời sống' | 'Ăn uống' | 'Mua sắm' | 'Học tập'
  level: 'Nhập môn' | 'TOPIK I - Cấp 1' | 'TOPIK I - Cấp 2'
}

const PRESET_SENTENCES: PracticeSentence[] = [
  {
    id: 's-1',
    sentence: '오늘 날씨가 좋네요',
    roman: 'o neul nal ssi ga jo ne yo',
    meaning: 'Hôm nay thời tiết đẹp nhỉ',
    syllables: ['오늘', '날씨', '가', '좋', '네', '요'],
    category: 'Đời sống',
    level: 'TOPIK I - Cấp 1',
  },
  {
    id: 's-2',
    sentence: '안녕하세요. 만나서 반가워요.',
    roman: 'an nyeong ha se yo. man na seo ban ga wo yo',
    meaning: 'Xin chào. Rất vui được gặp bạn.',
    syllables: ['안녕', '하세요', '만나서', '반가', '워요'],
    category: 'Chào hỏi',
    level: 'Nhập môn',
  },
  {
    id: 's-3',
    sentence: '감사합니다. 좋은 하루 되세요.',
    roman: 'gam sa ham ni da. jo eun ha ru doe se yo',
    meaning: 'Cảm ơn. Chúc bạn một ngày tốt lành.',
    syllables: ['감사', '합니다', '좋은', '하루', '되세요'],
    category: 'Chào hỏi',
    level: 'TOPIK I - Cấp 1',
  },
  {
    id: 's-4',
    sentence: '비빔밥 하나, 불고기 하나 주세요.',
    roman: 'bi bim bap ha na, bul go gi ha na ju se yo',
    meaning: 'Cho tôi một cơm trộn và một thịt nướng.',
    syllables: ['비빔밥', '하나', '불고기', '하나', '주세요'],
    category: 'Ăn uống',
    level: 'TOPIK I - Cấp 1',
  },
  {
    id: 's-5',
    sentence: '이거 얼마예요? 조금만 깎아 주세요.',
    roman: 'i geo eol ma ye yo? jo geum man kka kka ju se yo',
    meaning: 'Cái này bao nhiêu tiền? Bớt cho tôi một chút nhé.',
    syllables: ['이거', '얼마', '예요', '조금만', '깎아', '주세요'],
    category: 'Mua sắm',
    level: 'TOPIK I - Cấp 1',
  },
  {
    id: 's-6',
    sentence: '한국어를 열심히 공부해요.',
    roman: 'han gu geo reul yeol sim hi gong bu hae yo',
    meaning: 'Tôi chăm chỉ học tiếng Hàn.',
    syllables: ['한국어', '를', '열심히', '공부', '해요'],
    category: 'Học tập',
    level: 'TOPIK I - Cấp 1',
  },
  {
    id: 's-7',
    sentence: '지금 몇 시예요? 약속에 늦었어요.',
    roman: 'ji geum myeot si ye yo? yak sok e neu jeo sseo yo',
    meaning: 'Bây giờ là mấy giờ? Tôi bị muộn hẹn rồi.',
    syllables: ['지금', '몇 시', '예요', '약속에', '늦었', '어요'],
    category: 'Đời sống',
    level: 'TOPIK I - Cấp 2',
  },
]

const statusStyle: Record<Status, { cls: string; icon: typeof Check; label: string }> = {
  good: { cls: 'border-green-500/50 bg-green-500/15 text-green-300 shadow-sm', icon: Check, label: 'Chính xác' },
  warn: { cls: 'border-amber-500/50 bg-amber-500/15 text-amber-300 shadow-sm', icon: AlertTriangle, label: 'Cần cải thiện' },
  bad: { cls: 'border-red-500/50 bg-red-500/15 text-red-300 shadow-sm', icon: X, label: 'Chưa đúng' },
}

const R = 54
const C = 2 * Math.PI * R

const formatSeconds = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

function parseKoreanSyllables(text: string): string[] {
  const words = text
    .trim()
    .replace(/[.,?!~]/g, '')
    .split(/\s+/)
    .filter(Boolean)
  if (words.length === 0) return ['단어']
  return words
}

export function PronunciationPractice({ initialWord }: { initialWord?: string }) {
  // Lựa chọn câu luyện tập
  const [selectedId, setSelectedId] = useState<string>(() => {
    if (initialWord) return 'custom-initial'
    return 's-1'
  })
  const [activeCategory, setActiveCategory] = useState<string>('Tất cả')

  // Câu tùy chỉnh từ người dùng
  const [customWord, setCustomWord] = useState<string>(initialWord || '')
  const [customMode, setCustomMode] = useState<boolean>(Boolean(initialWord))

  const activeSentence: PracticeSentence = useMemo(() => {
    if (customMode && customWord.trim()) {
      const clean = customWord.trim()
      return {
        id: 'custom',
        sentence: clean,
        roman: 'Tự do luyện phát âm',
        meaning: 'Từ / Câu bạn tự chọn',
        syllables: parseKoreanSyllables(clean),
        category: 'Học tập',
        level: 'Nhập môn',
      }
    }
    const found = PRESET_SENTENCES.find((s) => s.id === selectedId)
    return found || PRESET_SENTENCES[0]
  }, [selectedId, customMode, customWord])

  const targetSyllables = activeSentence.syllables

  const [recording, setRecording] = useState(false)
  const [score, setScore] = useState<number | null>(null)
  const [syllables, setSyllables] = useState<SyllableItem[]>(() =>
    targetSyllables.map((text) => ({ text, status: 'warn' })),
  )
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

  // Cập nhật âm tiết khi đổi câu luyện tập
  useEffect(() => {
    setSyllables(targetSyllables.map((text) => ({ text, status: 'warn' })))
    setScore(null)
    setSpokenText('')
    setInterimText('')
    setFeedbackNote('Hãy bấm nút Micro và đọc to câu tiếng Hàn mẫu để AI phân tích phát âm của bạn.')
    setErrorMessage(null)
  }, [activeSentence])

  // ===== Thu âm giọng nói thật (MediaRecorder) + sóng âm trực tiếp =====
  const [recordingUrl, setRecordingUrl] = useState<string | null>(null)
  const [recordSeconds, setRecordSeconds] = useState(0)
  const [playingRecording, setPlayingRecording] = useState(false)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const audioCtxRef = useRef<AudioContext | null>(null)
  const rafRef = useRef<number | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const playbackRef = useRef<HTMLAudioElement | null>(null)

  const stopAudioCapture = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    rafRef.current = null
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = null
    try {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop()
      }
    } catch {
      // ignore
    }
    mediaStreamRef.current?.getTracks().forEach((t) => t.stop())
    mediaStreamRef.current = null
    audioCtxRef.current?.close().catch(() => {})
    audioCtxRef.current = null
  }

  const drawWaveform = (analyser: AnalyserNode) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const data = new Uint8Array(analyser.frequencyBinCount)
    const bars = 48
    const render = () => {
      analyser.getByteFrequencyData(data)
      const { width, height } = canvas
      ctx.clearRect(0, 0, width, height)
      const step = Math.floor(data.length / bars)
      const barW = width / bars
      for (let i = 0; i < bars; i++) {
        const v = data[i * step] / 255
        const h = Math.max(3, v * height)
        ctx.fillStyle = `rgba(239, 68, 68, ${0.35 + v * 0.65})`
        ctx.fillRect(i * barW + 1, (height - h) / 2, barW - 2, h)
      }
      rafRef.current = requestAnimationFrame(render)
    }
    render()
  }

  const startAudioCapture = async () => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) return
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaStreamRef.current = stream

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
      if (AudioCtx) {
        const audioCtx: AudioContext = new AudioCtx()
        audioCtxRef.current = audioCtx
        const source = audioCtx.createMediaStreamSource(stream)
        const analyser = audioCtx.createAnalyser()
        analyser.fftSize = 256
        source.connect(analyser)
        drawWaveform(analyser)
      }

      if (typeof MediaRecorder !== 'undefined') {
        chunksRef.current = []
        const recorder = new MediaRecorder(stream)
        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunksRef.current.push(e.data)
        }
        recorder.onstop = () => {
          const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' })
          if (blob.size > 0) {
            setRecordingUrl((prev) => {
              if (prev) URL.revokeObjectURL(prev)
              return URL.createObjectURL(blob)
            })
          }
        }
        mediaRecorderRef.current = recorder
        recorder.start()
      }

      setRecordSeconds(0)
      timerRef.current = setInterval(() => setRecordSeconds((s) => s + 1), 1000)
    } catch {
      // SpeechRecognition sẽ tự xử lý báo lỗi
    }
  }

  const playRecording = () => {
    const el = playbackRef.current
    if (!el || !recordingUrl) return
    if (playingRecording) {
      el.pause()
      el.currentTime = 0
      setPlayingRecording(false)
      return
    }
    window.speechSynthesis?.cancel()
    el.play().then(() => setPlayingRecording(true)).catch(() => setPlayingRecording(false))
  }

  const compareWithSample = () => {
    if (!recordingUrl || typeof window === 'undefined' || !('speechSynthesis' in window)) return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(activeSentence.sentence)
    utterance.lang = 'ko-KR'
    utterance.rate = 0.9
    const voice = getKoreanVoice()
    if (voice) utterance.voice = voice
    utterance.onstart = () => setSpeakingSample(true)
    utterance.onend = () => {
      setSpeakingSample(false)
      setTimeout(() => {
        playbackRef.current?.play().then(() => setPlayingRecording(true)).catch(() => {})
      }, 400)
    }
    utterance.onerror = () => setSpeakingSample(false)
    window.speechSynthesis.speak(utterance)
  }

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop()
        } catch {
          // ignore
        }
      }
      stopAudioCapture()
    }
  }, [])

  useEffect(() => {
    return () => {
      if (recordingUrl) URL.revokeObjectURL(recordingUrl)
    }
  }, [recordingUrl])

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

      const utterance = new SpeechSynthesisUtterance(activeSentence.sentence)
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

  // Thuật toán so khớp và chấm điểm thực tế
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
      const cleanTarget = target.replace(/[.,?!~ ]/g, '').toLowerCase()
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
      stopAudioCapture()
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
          evaluateSpeech(currentInterim)
        }
      }

      recognition.onerror = (event: any) => {
        setRecording(false)
        stopAudioCapture()
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
        stopAudioCapture()
      }

      recognitionRef.current = recognition
      recognition.start()
      void startAudioCapture()
    } catch {
      setRecording(false)
      stopAudioCapture()
      setErrorMessage('Không thể mở micro. Vui lòng tải lại trang hoặc kiểm tra thiết bị thu âm.')
    }
  }

  const filteredSentences = useMemo(() => {
    if (activeCategory === 'Tất cả') return PRESET_SENTENCES
    return PRESET_SENTENCES.filter((s) => s.category === activeCategory)
  }, [activeCategory])

  const displayScore = score !== null ? score : 0

  return (
    <div className="flex flex-col gap-6">
      {/* THANH CHỌN CHỦ ĐỀ & CÂU LUYỆN NÓI */}
      <section className="rounded-2xl border-[1.5px] border-slate-800 bg-white p-5 shadow-[0_2px_0_rgba(15,23,42,0.06)]">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <BookOpen className="size-4 text-[#7C3AED]" />
            <span className="text-sm font-black text-slate-900">Danh sách câu luyện phát âm</span>
          </div>

          {/* Phân loại theo chủ đề */}
          <div className="flex flex-wrap gap-1.5">
            {['Tất cả', 'Chào hỏi', 'Đời sống', 'Ăn uống', 'Mua sắm', 'Học tập'].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => {
                  setActiveCategory(cat)
                  setCustomMode(false)
                }}
                className={cn(
                  'rounded-lg px-3 py-1 text-xs font-bold transition shadow-2xs',
                  activeCategory === cat && !customMode
                    ? 'border border-slate-900 bg-[#7C3AED] text-white shadow-xs'
                    : 'border border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-800 hover:text-slate-900 hover:bg-slate-100',
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Danh sách câu gợi ý */}
        <div className="mt-3.5 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {filteredSentences.map((s) => {
            const isSelected = selectedId === s.id && !customMode
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  setSelectedId(s.id)
                  setCustomMode(false)
                }}
                className={cn(
                  'group flex flex-col items-start rounded-xl border p-3.5 text-left transition-all',
                  isSelected
                    ? 'border-[1.5px] border-slate-900 bg-violet-50/90 text-slate-900 shadow-[0_2px_0_rgba(15,23,42,0.08)]'
                    : 'border-slate-200 bg-slate-50/70 hover:border-slate-400 hover:bg-white text-slate-700',
                )}
              >
                <div className="flex w-full items-center justify-between gap-2">
                  <span className="rounded-md bg-white px-2 py-0.5 text-[10px] font-bold text-[#7C3AED] border border-violet-200">
                    {s.category}
                  </span>
                  <span className="text-[10px] font-semibold text-slate-400">{s.level}</span>
                </div>
                <span lang="ko" className="mt-2 text-sm font-black text-slate-900 group-hover:text-[#7C3AED] transition-colors">
                  {s.sentence}
                </span>
                <span className="mt-1 text-[11px] font-medium text-slate-500 truncate w-full">
                  {s.meaning}
                </span>
              </button>
            )
          })}
        </div>

        {/* Nhập câu tiếng Hàn tùy chọn */}
        <form
          className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-200 pt-3.5"
          onSubmit={(e) => {
            e.preventDefault()
            if (customWord.trim()) setCustomMode(true)
          }}
        >
          <input
            type="text"
            lang="ko"
            value={customWord}
            onChange={(e) => setCustomWord(e.target.value)}
            placeholder="Hoặc nhập từ/câu tiếng Hàn bất kỳ để luyện phát âm (vd: 감사합니다)..."
            className="h-9 flex-1 min-w-[220px] rounded-xl border border-slate-300 bg-slate-50 px-3.5 text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:border-slate-800 focus:bg-white focus:outline-none transition"
          />
          <button
            type="submit"
            disabled={!customWord.trim()}
            className="h-9 rounded-xl border border-slate-900 bg-slate-900 px-4 text-xs font-bold text-white transition hover:bg-[#7C3AED] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Luyện câu này
          </button>
        </form>
      </section>

      {/* KHUNG THỰC HÀNH PHÁT ÂM CHÍNH */}
      <section
        aria-label="Luyện phát âm"
        className="mx-auto w-full max-w-3xl rounded-2xl border-[1.5px] border-slate-800 bg-white p-6 md:p-10 shadow-[0_2px_0_rgba(15,23,42,0.06)]"
      >
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-bold text-[#7C3AED]">
            <span>{activeSentence.category}</span>
            <span>·</span>
            <span>{activeSentence.level}</span>
          </span>

          <button
            type="button"
            onClick={() => {
              setScore(null)
              setSyllables(targetSyllables.map((text) => ({ text, status: 'warn' })))
              setSpokenText('')
              setInterimText('')
              setErrorMessage(null)
              setFeedbackNote('Hãy bấm nút Micro và đọc to câu tiếng Hàn mẫu để AI phân tích phát âm của bạn.')
            }}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 cursor-pointer transition"
          >
            <RefreshCw className="size-3.5" /> Đặt lại
          </button>
        </div>

        <p lang="ko" className="mt-5 text-center text-3xl font-black tracking-wide md:text-5xl text-slate-900">
          {activeSentence.sentence}
        </p>
        <p className="mt-3 text-center text-slate-600 font-semibold text-sm md:text-base">
          {activeSentence.roman}
        </p>
        <p className="mt-1 text-center text-sm font-medium text-slate-400">{`"${activeSentence.meaning}"`}</p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={playSample}
            className={cn(
              'inline-flex items-center gap-2 rounded-full border border-slate-800 bg-white px-5 py-2.5 text-xs font-bold text-slate-900 transition-all cursor-pointer shadow-sm hover:bg-slate-50 active:scale-95',
              speakingSample && 'border-[#7C3AED] bg-violet-50 text-[#7C3AED] scale-105',
            )}
          >
            <Volume2 className={cn('size-4 text-[#7C3AED]', speakingSample && 'animate-bounce')} aria-hidden="true" />
            {speakingSample
              ? isSlowMode
                ? '🐢 Đang đọc chậm (0.6x)...'
                : '⚡ Đang đọc bình thường (0.9x)...'
              : 'Nghe phát âm mẫu (Bấm 2 lần đọc chậm)'}
          </button>
        </div>

        {errorMessage && (
          <div className="mt-4 flex items-center gap-2.5 rounded-xl bg-red-50 border border-red-300 p-3.5 text-sm text-red-700">
            <AlertCircle className="size-4 shrink-0 text-red-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Hiển thị văn bản AI nhận diện thời gian thực */}
        {(spokenText || interimText) && (
          <div className="mt-6 rounded-xl bg-violet-50 border border-violet-200 p-4 text-center text-sm">
            <span className="text-slate-600">AI nhận diện bạn vừa nói: </span>
            <span lang="ko" className="font-black text-[#7C3AED] text-lg ml-1">
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
                  'relative flex size-28 items-center justify-center rounded-full shadow-2xl transition-all cursor-pointer border-[2px] border-slate-900',
                  recording
                    ? 'bg-red-500 shadow-red-500/50 scale-105'
                    : 'bg-[#7C3AED] shadow-violet-500/40 hover:bg-[#6D28D9] hover:scale-105',
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
            <p className="mt-4 font-bold text-sm text-slate-800">
              {recording ? (
                <span className="text-red-600 animate-pulse font-extrabold">
                  🔴 Đang thu âm {formatSeconds(recordSeconds)}... Hãy nói tiếng Hàn!
                </span>
              ) : (
                'Bấm Micro để đọc'
              )}
            </p>
            <canvas
              ref={canvasRef}
              width={240}
              height={48}
              aria-hidden="true"
              className={cn('mt-3 h-12 w-60 transition-opacity', recording ? 'opacity-100' : 'opacity-0')}
            />
            {recordingUrl && !recording && (
              <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
                <audio
                  ref={playbackRef}
                  src={recordingUrl}
                  onEnded={() => setPlayingRecording(false)}
                  onPause={() => setPlayingRecording(false)}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={playRecording}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-full border border-slate-800 px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer',
                    playingRecording
                      ? 'bg-red-50 text-red-600 border-red-500'
                      : 'bg-white text-slate-800 hover:bg-slate-50',
                  )}
                >
                  {playingRecording ? <Square className="size-3.5 fill-current" /> : <PlayCircle className="size-3.5 text-slate-700" />}
                  {playingRecording ? 'Dừng' : 'Nghe lại giọng tôi'}
                </button>
                <button
                  type="button"
                  onClick={compareWithSample}
                  className="inline-flex items-center gap-1.5 rounded-full border border-slate-800 bg-white px-3.5 py-1.5 text-xs font-bold text-slate-800 transition-all hover:bg-slate-50 cursor-pointer"
                >
                  <Volume2 className="size-3.5 text-[#7C3AED]" /> So sánh với mẫu
                </button>
              </div>
            )}
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
                <circle cx="64" cy="64" r={R} fill="none" stroke="#E2E8F0" strokeWidth="10" />
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
                <span className="text-4xl font-black tabular-nums text-slate-900">{score !== null ? score : '--'}</span>
                <span className="text-xs font-semibold text-slate-500">{score !== null ? '/100 điểm' : 'chờ đọc'}</span>
              </div>
            </div>
            <p
              className={cn(
                'mt-3 font-bold text-sm',
                score === null
                  ? 'text-slate-500'
                  : score >= 80
                  ? 'text-emerald-600'
                  : score >= 60
                  ? 'text-amber-600'
                  : 'text-red-600',
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

        <div className="mt-10 border-t border-slate-200 pt-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-900">Phân tích từng âm tiết</h3>
          </div>

          <ul className="mt-4 flex flex-wrap gap-2.5">
            {syllables.map((s, i) => {
              const { cls, icon: Icon, label } = statusStyle[s.status]
              return (
                <li key={i} className={cn('flex items-center gap-2 rounded-xl border px-4 py-2.5 transition-all shadow-2xs', cls)}>
                  <span lang="ko" className="text-xl font-bold">
                    {s.text}
                  </span>
                  <Icon className="size-4" aria-hidden="true" />
                  <span className="sr-only">{label}</span>
                </li>
              )
            })}
          </ul>

          <div className="mt-4 flex flex-wrap gap-4 text-xs font-medium text-slate-600">
            <span className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-emerald-500" />
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

          <div className="mt-4 rounded-xl bg-violet-50/70 border border-violet-200 p-4 text-sm text-slate-800">
            <p className="font-bold text-[#7C3AED] flex items-center gap-1.5">
              <Sparkles className="size-4 text-[#7C3AED]" /> Nhận xét từ AI:
            </p>
            <p className="mt-1 text-slate-600 font-medium leading-relaxed">{feedbackNote}</p>
          </div>
        </div>
      </section>
    </div>
  )
}
