'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  CheckCircle2,
  Database,
  Eraser,
  Eye,
  EyeOff,
  History,
  Info,
  RefreshCw,
  Sparkles,
  Undo2,
  Volume2,
} from 'lucide-react'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/lib/auth-context'
import {
  KOREAN_HANDWRITING_DATASET,
  getDatasetItemForChar,
  type DatasetCategory,
  type HangulCharDatasetItem,
} from '@/lib/handwriting-dataset'
import { cn } from '@/lib/utils'

type Point = { x: number; y: number }
type Stroke = Point[]

interface ScoreResult {
  total: number
  coverage: number
  precision: number
  balance: number
  feedback: string
  grade: 'good' | 'warn' | 'bad'
}

interface HistoryRecord {
  char: string
  bestScore: number
  attempts: number
  updatedAt: string
}

const CANVAS_SIZE = 320
const GRID_SIZE = 64

const categories: { id: 'all' | DatasetCategory; label: string }[] = [
  { id: 'all', label: 'Tất cả 64 lớp (6.400 mẫu gốc)' },
  { id: 'common', label: 'Âm tiết thông dụng' },
  { id: 'grammar', label: 'Tiểu từ & Ngữ pháp' },
  { id: 'topik1', label: 'Từ vựng TOPIK I' },
  { id: 'surname', label: '4 Họ phổ biến (김·이·박·최)' },
]

export function HandwritingPractice({ initialWord }: { initialWord?: string }) {
  const { user, profile, token, refreshProfile } = useAuth()
  const [category, setCategory] = useState<'all' | DatasetCategory>('all')
  const [customWord, setCustomWord] = useState(initialWord || '')
  const [selectedChar, setSelectedChar] = useState<string>(() => {
    if (initialWord && initialWord.trim().length > 0) {
      return initialWord.trim()[0]
    }
    return KOREAN_HANDWRITING_DATASET[0].char
  })

  const [sampleOffset, setSampleOffset] = useState(0)
  const [strokes, setStrokes] = useState<Stroke[]>([])
  const [currentStroke, setCurrentStroke] = useState<Stroke>([])
  const [isDrawing, setIsDrawing] = useState(false)
  const [showGuide, setShowGuide] = useState(true)
  const [brushSize, setBrushSize] = useState(14)
  const [scoreResult, setScoreResult] = useState<ScoreResult | null>(null)
  const [history, setHistory] = useState<Record<string, HistoryRecord>>({})
  const [savedToast, setSavedToast] = useState(false)
  const [sqlClasses, setSqlClasses] = useState<HangulCharDatasetItem[]>(KOREAN_HANDWRITING_DATASET)
  const [sqlStats, setSqlStats] = useState<{
    database: string
    totalClasses: number
    originalSamplesCount: number
    augmentedSamplesCount: number
    totalSamplesCount: number
    connected: boolean
  } | null>(null)

  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  const activeItem: HangulCharDatasetItem =
    sqlClasses.find((item) => item.char === selectedChar) ?? getDatasetItemForChar(selectedChar)

  const filteredDataset =
    category === 'all'
      ? sqlClasses
      : sqlClasses.filter((d) => d.category === category)

  const customSyllables = customWord
    .trim()
    .split('')
    .filter((ch) => ch.charCodeAt(0) >= 0xac00 && ch.charCodeAt(0) <= 0xd7a3)

  useEffect(() => {
    try {
      const raw = localStorage.getItem('hango_handwriting_history')
      if (raw) setHistory(JSON.parse(raw))
    } catch {
      // ignore localStorage errors
    }

    if (!token) return
    fetch('/api/dataset/handwriting', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((json) => {
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          setSqlClasses(json.data)
        }
        if (json.stats) {
          setSqlStats(json.stats)
        }
      })
      .catch(() => {
        // ignore network error
      })
  }, [token])

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)

    // Nền bảng vẽ
    ctx.fillStyle = '#131326'
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)

    // Đường gióng ô ly Hàn Quốc
    ctx.save()
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)'
    ctx.lineWidth = 1
    ctx.setLineDash([6, 6])

    ctx.beginPath()
    ctx.moveTo(CANVAS_SIZE / 2, 0)
    ctx.lineTo(CANVAS_SIZE / 2, CANVAS_SIZE)
    ctx.moveTo(0, CANVAS_SIZE / 2)
    ctx.lineTo(CANVAS_SIZE, CANVAS_SIZE / 2)
    ctx.moveTo(0, 0)
    ctx.lineTo(CANVAS_SIZE, CANVAS_SIZE)
    ctx.moveTo(CANVAS_SIZE, 0)
    ctx.lineTo(0, CANVAS_SIZE)
    ctx.stroke()

    ctx.setLineDash([])
    ctx.strokeStyle = 'rgba(124, 58, 237, 0.25)'
    ctx.strokeRect(24, 24, CANVAS_SIZE - 48, CANVAS_SIZE - 48)
    ctx.restore()

    // Chữ mẫu mờ (Ghost Guide)
    if (showGuide) {
      ctx.save()
      ctx.fillStyle = 'rgba(167, 139, 250, 0.13)'
      ctx.font = '700 210px var(--font-noto-kr), "Malgun Gothic", sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(selectedChar, CANVAS_SIZE / 2, CANVAS_SIZE / 2 + 8)
      ctx.restore()
    }

    // Vẽ các nét của người dùng
    ctx.save()
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.strokeStyle = '#f8fafc'
    ctx.lineWidth = brushSize
    ctx.shadowColor = 'rgba(124, 58, 237, 0.5)'
    ctx.shadowBlur = 4

    const allStrokes = currentStroke.length > 0 ? [...strokes, currentStroke] : strokes
    for (const stroke of allStrokes) {
      if (stroke.length === 0) continue
      ctx.beginPath()
      ctx.moveTo(stroke[0].x, stroke[0].y)
      if (stroke.length === 1) {
        ctx.lineTo(stroke[0].x + 0.5, stroke[0].y + 0.5)
      } else {
        for (let i = 1; i < stroke.length; i++) {
          ctx.lineTo(stroke[i].x, stroke[i].y)
        }
      }
      ctx.stroke()
    }
    ctx.restore()
  }, [strokes, currentStroke, showGuide, selectedChar, brushSize])

  useEffect(() => {
    drawCanvas()
  }, [drawCanvas])

  const getPoint = (e: React.PointerEvent<HTMLCanvasElement>): Point => {
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    }
  }

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    setIsDrawing(true)
    setScoreResult(null)
    const pt = getPoint(e)
    setCurrentStroke([pt])
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return
    const pt = getPoint(e)
    setCurrentStroke((prev) => [...prev, pt])
  }

  const handlePointerUp = () => {
    if (!isDrawing) return
    setIsDrawing(false)
    if (currentStroke.length > 0) {
      setStrokes((prev) => [...prev, currentStroke])
      setCurrentStroke([])
    }
  }

  const clearCanvas = () => {
    setStrokes([])
    setCurrentStroke([])
    setScoreResult(null)
  }

  const undoStroke = () => {
    setStrokes((prev) => prev.slice(0, -1))
    setScoreResult(null)
  }

  const selectCharacter = (ch: string) => {
    setSelectedChar(ch)
    setSampleOffset(0)
    setStrokes([])
    setCurrentStroke([])
    setScoreResult(null)
  }

  const speakCharacter = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
    window.speechSynthesis.cancel()
    const utter = new SpeechSynthesisUtterance(selectedChar)
    utter.lang = 'ko-KR'
    utter.rate = 0.85
    window.speechSynthesis.speak(utter)
  }

  const evaluateHandwriting = async () => {
    if (strokes.length === 0) return

    const refCanvas = document.createElement('canvas')
    refCanvas.width = GRID_SIZE
    refCanvas.height = GRID_SIZE
    const refCtx = refCanvas.getContext('2d')!
    refCtx.fillStyle = '#ffffff'
    refCtx.textAlign = 'center'
    refCtx.textBaseline = 'middle'
    refCtx.font = '700 42px "Noto Sans KR", "Malgun Gothic", sans-serif'
    refCtx.fillText(selectedChar, GRID_SIZE / 2, GRID_SIZE / 2 + 1.5)
    refCtx.lineWidth = 4.5
    refCtx.strokeStyle = '#ffffff'
    refCtx.strokeText(selectedChar, GRID_SIZE / 2, GRID_SIZE / 2 + 1.5)

    const userCanvas = document.createElement('canvas')
    userCanvas.width = GRID_SIZE
    userCanvas.height = GRID_SIZE
    const userCtx = userCanvas.getContext('2d')!
    const scale = GRID_SIZE / CANVAS_SIZE
    userCtx.lineCap = 'round'
    userCtx.lineJoin = 'round'
    userCtx.strokeStyle = '#ffffff'
    userCtx.lineWidth = Math.max(3.5, brushSize * scale * 1.25)

    for (const stroke of strokes) {
      if (stroke.length === 0) continue
      userCtx.beginPath()
      userCtx.moveTo(stroke[0].x * scale, stroke[0].y * scale)
      if (stroke.length === 1) {
        userCtx.lineTo(stroke[0].x * scale + 0.5, stroke[0].y * scale + 0.5)
      } else {
        for (let i = 1; i < stroke.length; i++) {
          userCtx.lineTo(stroke[i].x * scale, stroke[i].y * scale)
        }
      }
      userCtx.stroke()
    }

    const refData = refCtx.getImageData(0, 0, GRID_SIZE, GRID_SIZE).data
    const userData = userCtx.getImageData(0, 0, GRID_SIZE, GRID_SIZE).data

    let refPixels = 0
    let userPixels = 0
    let overlap = 0
    let userSumX = 0
    let userSumY = 0
    let refSumX = 0
    let refSumY = 0

    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        const idx = (y * GRID_SIZE + x) * 4
        const rAlpha = refData[idx + 3] > 50
        const uAlpha = userData[idx + 3] > 50

        if (rAlpha) {
          refPixels++
          refSumX += x
          refSumY += y
        }
        if (uAlpha) {
          userPixels++
          userSumX += x
          userSumY += y
        }
        if (rAlpha && uAlpha) {
          overlap++
        }
      }
    }

    if (userPixels < 15) {
      setScoreResult({
        total: 25,
        coverage: 20,
        precision: 40,
        balance: 30,
        feedback: 'Nét viết còn quá ít. Hãy viết đầy đủ các bộ phận của chữ trong khung ô vuông nhé!',
        grade: 'bad',
      })
      return
    }

    const rawCoverage = Math.min(1, (overlap / Math.max(1, refPixels)) * 1.45)
    const rawPrecision = Math.min(1, (overlap / Math.max(1, userPixels)) * 1.25)

    const userCx = userSumX / Math.max(1, userPixels)
    const userCy = userSumY / Math.max(1, userPixels)
    const refCx = refSumX / Math.max(1, refPixels)
    const refCy = refSumY / Math.max(1, refPixels)
    const dist = Math.hypot(userCx - refCx, userCy - refCy)
    const rawBalance = Math.max(0, Math.min(1, 1 - dist / 22))

    const coverage = Math.round(rawCoverage * 100)
    const precision = Math.round(rawPrecision * 100)
    const balance = Math.round(rawBalance * 100)

    const strokePenalty = strokes.length < Math.max(2, activeItem.strokes - 3) ? 8 : 0

    const total = Math.max(
      15,
      Math.min(100, Math.round(coverage * 0.45 + precision * 0.35 + balance * 0.2) - strokePenalty),
    )

    let feedback = ''
    let grade: ScoreResult['grade'] = 'good'

    if (total >= 80) {
      grade = 'good'
      feedback = `Tuyệt vời! Chữ "${selectedChar}" bạn viết có bố cục rất cân đối và tương đồng cao với bộ mẫu chữ viết tay Kaggle.`
    } else if (total >= 60) {
      grade = 'warn'
      if (balance < 65) {
        feedback = `Khá tốt! Tuy nhiên chữ "${selectedChar}" hơi lệch tâm ô vuông, bạn hãy căn đều vào giữa giao điểm đường gióng nhé.`
      } else if (coverage < 65) {
        feedback = `Nét viết đúng hướng nhưng còn thiếu một số nét của "${selectedChar}". Hãy đối chiếu với 6 ảnh mẫu viết tay thật ở cột bên trái.`
      } else {
        feedback = `Chữ "${selectedChar}" đã rõ hình dáng! Hãy chau chuốt lại khoảng cách giữa phụ âm (${activeItem.jamo.choseong}) và nguyên âm (${activeItem.jamo.jungseong}).`
      }
    } else {
      grade = 'bad'
      feedback = `Chữ "${selectedChar}" chưa khớp với mẫu chuẩn. Hãy bật "Hiện chữ mờ" để luyện viết theo khung trước nhé!`
    }

    setScoreResult({ total, coverage, precision, balance, feedback, grade })

    const prev = history[selectedChar]
    const updatedRecord: HistoryRecord = {
      char: selectedChar,
      bestScore: Math.max(prev?.bestScore ?? 0, total),
      attempts: (prev?.attempts ?? 0) + 1,
      updatedAt: new Date().toISOString(),
    }
    const nextHistory = { ...history, [selectedChar]: updatedRecord }
    setHistory(nextHistory)
    try {
      localStorage.setItem('hango_handwriting_history', JSON.stringify(nextHistory))
    } catch {
      // ignore
    }

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
            activityType: 'handwriting',
            uid: activeUid,
            char: selectedChar,
            unicode: activeItem.unicode,
            datasetClassId: activeItem.datasetClassId,
            score: total,
          }),
        })
        void refreshProfile()
        setSavedToast(true)
        setTimeout(() => setSavedToast(false), 3000)
      } catch {
        // ignore network error
      }
    }

    if (user && db) {
      try {
        const ref = doc(db, 'users', user.uid, 'handwriting', selectedChar)
        await setDoc(
          ref,
          {
            char: selectedChar,
            unicode: activeItem.unicode,
            datasetClassId: activeItem.datasetClassId,
            lastScore: total,
            bestScore: updatedRecord.bestScore,
            attempts: updatedRecord.attempts,
            updatedAt: serverTimestamp(),
          },
          { merge: true },
        )
      } catch {
        // ignore firestore error
      }
    }
  }

  const sampleIndices = Array.from({ length: 6 }, (_, i) => (sampleOffset + i) % 100)

  return (
    <div className="flex flex-col gap-6">
      {/* Thanh chọn toàn bộ 64 lớp từ Dataset Kaggle */}
      <section className="rounded-2xl border border-border bg-card p-5">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-xs font-semibold text-violet-300">
                <Database className="size-3.5" aria-hidden="true" />
                SQL Server ({sqlStats?.database || 'HangoDatasetDB'}): Đầy đủ {sqlStats?.totalClasses || 64} lớp
              </span>
              <span className="text-xs text-muted-foreground">
                {(sqlStats?.originalSamplesCount ?? 6400).toLocaleString('vi-VN')} ảnh viết tay gốc (100 mẫu/lớp) · {(sqlStats?.augmentedSamplesCount ?? 128000).toLocaleString('vi-VN')} ảnh mở rộng
              </span>
            </div>
            <h2 className="mt-2 text-lg font-bold">
              Chọn 1 trong 64 âm tiết từ bộ dữ liệu hoặc nhập từ tiếng Hàn bất kỳ
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <label htmlFor="custom-ko-word" className="sr-only">
              Nhập từ tiếng Hàn bất kỳ
            </label>
            <input
              id="custom-ko-word"
              lang="ko"
              value={customWord}
              onChange={(e) => {
                const val = e.target.value
                setCustomWord(val)
                const firstHangul = val
                  .split('')
                  .find((c) => c.charCodeAt(0) >= 0xac00 && c.charCodeAt(0) <= 0xd7a3)
                if (firstHangul) selectCharacter(firstHangul)
              }}
              placeholder="Nhập từ bất kỳ (VD: 한국어)..."
              className="h-10 w-56 rounded-xl border border-white/15 bg-field px-3.5 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none"
            />
          </div>
        </div>

        {customSyllables.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl border border-primary/30 bg-primary/10 p-3">
            <span className="text-xs font-semibold text-violet-300">Âm tiết trong từ đang chọn:</span>
            {customSyllables.map((ch, idx) => (
              <button
                key={`${ch}-${idx}`}
                type="button"
                onClick={() => selectCharacter(ch)}
                lang="ko"
                className={cn(
                  'flex size-10 items-center justify-center rounded-lg text-lg font-bold transition-colors',
                  selectedChar === ch
                    ? 'bg-primary text-white shadow-md shadow-primary/30'
                    : 'bg-card text-foreground hover:bg-white/10',
                )}
              >
                {ch}
              </button>
            ))}
          </div>
        )}

        {/* Bộ lọc danh mục */}
        <div className="mt-4 flex flex-wrap gap-2">
          {categories.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCategory(c.id)}
              className={cn(
                'rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors',
                category === c.id
                  ? 'bg-primary text-white'
                  : 'bg-background text-muted-foreground hover:text-foreground',
              )}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Lưới 64 lớp ký tự trong Dataset */}
        <div className="mt-4 grid max-h-56 grid-cols-6 gap-2 overflow-y-auto pr-1 sm:grid-cols-8 md:grid-cols-12 lg:grid-cols-16">
          {filteredDataset.map((item) => {
            const isSelected = selectedChar === item.char
            const record = history[item.char]
            return (
              <button
                key={item.folder}
                type="button"
                onClick={() => selectCharacter(item.char)}
                className={cn(
                  'relative flex h-14 flex-col items-center justify-center rounded-xl border transition-all',
                  isSelected
                    ? 'border-primary bg-primary text-white shadow-lg shadow-primary/30'
                    : 'border-border bg-background hover:border-primary/50',
                )}
              >
                <span lang="ko" className="text-lg font-bold leading-none">
                  {item.char}
                </span>
                <span className={cn('mt-1 text-[10px]', isSelected ? 'text-white/80' : 'text-muted-foreground')}>
                  {item.roman}
                </span>
                {record && (
                  <span
                    title={`Điểm cao nhất: ${record.bestScore}/100`}
                    className="absolute -right-1 -top-1 rounded-full bg-emerald-500 px-1.5 text-[9px] font-bold text-[#0F0F1A]"
                  >
                    {record.bestScore}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </section>

      {/* Khu vực chính */}
      <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
        {/* Cột trái: Chi tiết âm tiết + Ảnh viết tay thật từ Kaggle Dataset */}
        <section className="flex flex-col justify-between gap-6 rounded-2xl border border-border bg-card p-6">
          <div>
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex size-20 items-center justify-center rounded-2xl border border-primary/40 bg-primary/15 text-5xl font-black text-white">
                  <span lang="ko">{activeItem.char}</span>
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-md bg-white/10 px-2 py-0.5 font-mono text-xs text-violet-300">
                      {activeItem.datasetClassId}
                    </span>
                    <span className="rounded-md bg-white/5 px-2 py-0.5 font-mono text-xs text-muted-foreground">
                      {activeItem.unicode}
                    </span>
                    {activeItem.folder && (
                      <span className="rounded-md bg-emerald-500/15 px-2 py-0.5 text-xs font-medium text-emerald-300">
                        Thư mục: /{activeItem.folder}/ (100 ảnh gốc)
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-lg font-bold">
                    {activeItem.meaning}{' '}
                    {activeItem.roman && (
                      <span className="text-sm font-normal text-muted-foreground">({activeItem.roman})</span>
                    )}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">Tổng số nét chuẩn: ~{activeItem.strokes} nét</p>
                </div>
              </div>

              <button
                type="button"
                onClick={speakCharacter}
                aria-label="Nghe phát âm"
                className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-border bg-background text-violet-300 transition-colors hover:border-primary hover:bg-primary hover:text-white"
              >
                <Volume2 className="size-5" aria-hidden="true" />
              </button>
            </div>

            {/* Phân rã cấu tạo Jamo */}
            <div className="mt-6">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Cấu tạo âm tiết (Jamo Decomposition)
              </h3>
              <div className="mt-3 grid grid-cols-3 gap-3">
                <div className="rounded-xl border border-border bg-background p-3 text-center">
                  <p className="text-[11px] text-muted-foreground">Phụ âm đầu (초성)</p>
                  <p lang="ko" className="mt-1 text-2xl font-bold text-violet-300">
                    {activeItem.jamo.choseong}
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-background p-3 text-center">
                  <p className="text-[11px] text-muted-foreground">Nguyên âm (중성)</p>
                  <p lang="ko" className="mt-1 text-2xl font-bold text-sky-300">
                    {activeItem.jamo.jungseong || '—'}
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-background p-3 text-center">
                  <p className="text-[11px] text-muted-foreground">Batchim (종성)</p>
                  <p lang="ko" className="mt-1 text-2xl font-bold text-amber-300">
                    {activeItem.jamo.jongseong || 'Không có'}
                  </p>
                </div>
              </div>
            </div>

            {/* 6 mẫu chữ viết tay thật từ bộ dữ liệu Kaggle (100 mẫu/lớp) */}
            <div className="mt-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {activeItem.folder
                    ? `Ảnh viết tay thật từ Kaggle Dataset (${sampleOffset + 1}–${sampleOffset + 6} / 100 mẫu)`
                    : 'Mẫu chữ tham khảo'}
                </h3>
                {activeItem.folder && (
                  <button
                    type="button"
                    onClick={() => setSampleOffset((o) => (o + 6) % 96)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 py-1 text-xs font-medium text-violet-300 hover:border-primary/50 hover:text-white"
                  >
                    <RefreshCw className="size-3" aria-hidden="true" />
                    Xem 6 mẫu khác
                  </button>
                )}
              </div>

              {activeItem.folder ? (
                <div className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-6">
                  {sampleIndices.map((sampleIdx) => (
                    <div
                      key={sampleIdx}
                      className="flex flex-col items-center gap-1.5 rounded-xl border border-border bg-background p-2"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`/api/dataset/handwriting/image?folder=${encodeURIComponent(activeItem.folder)}&index=${sampleIdx}`}
                        alt={`Mẫu viết tay chữ ${activeItem.char} số ${sampleIdx + 1}`}
                        className="size-16 rounded-lg border border-white/15 bg-white object-contain"
                      />
                      <span className="font-mono text-[10px] text-muted-foreground">
                        #{String(sampleIdx + 1).padStart(3, '0')}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-3 rounded-xl border border-border bg-background p-3 text-xs text-muted-foreground">
                  Âm tiết &ldquo;{activeItem.char}&rdquo; nằm ngoài 64 lớp gốc của bộ dữ liệu Kang Seung-sik, hệ thống tự động tạo khung chữ mẫu chuẩn bên phải để bạn luyện viết và chấm điểm.
                </p>
              )}
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-xl border border-violet-500/30 bg-violet-500/10 p-4 text-sm">
            <Info className="mt-0.5 size-4 shrink-0 text-violet-300" aria-hidden="true" />
            <div>
              <p className="font-semibold text-violet-200">Mẹo căn chỉnh nét chữ</p>
              <p className="mt-1 leading-relaxed text-violet-100/80">{activeItem.tip}</p>
            </div>
          </div>
        </section>

        {/* Cột phải: Bảng vẽ Canvas & Kết quả chấm điểm */}
        <section className="flex flex-col items-center rounded-2xl border border-border bg-card p-6">
          <div className="flex w-full flex-wrap items-center justify-between gap-2">
            <h3 className="font-semibold">Bảng luyện viết tay</h3>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowGuide((g) => !g)}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-background px-3 text-xs font-medium hover:border-primary/50"
              >
                {showGuide ? <EyeOff className="size-3.5 text-violet-400" /> : <Eye className="size-3.5 text-violet-400" />}
                {showGuide ? 'Ẩn chữ mờ' : 'Hiện chữ mờ'}
              </button>
              <button
                type="button"
                onClick={undoStroke}
                disabled={strokes.length === 0}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-background px-3 text-xs font-medium hover:border-primary/50 disabled:opacity-40"
              >
                <Undo2 className="size-3.5" />
                Hoàn tác
              </button>
              <button
                type="button"
                onClick={clearCanvas}
                disabled={strokes.length === 0}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-background px-3 text-xs font-medium text-red-300 hover:border-red-500/50 disabled:opacity-40"
              >
                <Eraser className="size-3.5" />
                Xóa
              </button>
            </div>
          </div>

          <div className="relative my-5 overflow-hidden rounded-2xl border-2 border-primary/40 shadow-2xl shadow-primary/10">
            <canvas
              ref={canvasRef}
              width={CANVAS_SIZE}
              height={CANVAS_SIZE}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              className="size-[280px] cursor-crosshair touch-none sm:size-[320px]"
            />
            {strokes.length === 0 && !isDrawing && (
              <div className="pointer-events-none absolute inset-x-0 bottom-3 text-center text-xs text-muted-foreground/70">
                Dùng chuột hoặc ngón tay viết chữ &ldquo;{selectedChar}&rdquo; vào ô vuông
              </div>
            )}
          </div>

          <div className="flex w-full max-w-[320px] flex-col gap-4">
            <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
              <span>Độ dày nét bút ({brushSize}px)</span>
              <input
                type="range"
                min={8}
                max={22}
                value={brushSize}
                onChange={(e) => setBrushSize(Number(e.target.value))}
                className="h-1.5 w-36 cursor-pointer accent-primary"
              />
            </div>

            <button
              type="button"
              onClick={evaluateHandwriting}
              disabled={strokes.length === 0}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary font-semibold text-white shadow-lg shadow-primary/30 transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              <Sparkles className="size-4" aria-hidden="true" />
              Chấm điểm nét viết
            </button>
          </div>

          {savedToast && (
            <p className="mt-3 flex items-center gap-1.5 text-xs text-emerald-400">
              <CheckCircle2 className="size-3.5" />
              Đã đồng bộ điểm luyện viết lên Firebase Firestore!
            </p>
          )}

          {scoreResult && (
            <div className="mt-6 w-full rounded-2xl border border-border bg-background p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Kết quả chấm điểm</p>
                  <p
                    className={cn(
                      'mt-1 text-3xl font-extrabold',
                      scoreResult.grade === 'good' && 'text-emerald-400',
                      scoreResult.grade === 'warn' && 'text-amber-400',
                      scoreResult.grade === 'bad' && 'text-red-400',
                    )}
                  >
                    {scoreResult.total}/100 điểm
                  </p>
                </div>
                <span
                  className={cn(
                    'rounded-full px-3 py-1 text-xs font-bold',
                    scoreResult.grade === 'good' && 'bg-emerald-500/15 text-emerald-300',
                    scoreResult.grade === 'warn' && 'bg-amber-500/15 text-amber-300',
                    scoreResult.grade === 'bad' && 'bg-red-500/15 text-red-300',
                  )}
                >
                  {scoreResult.grade === 'good'
                    ? 'Chuẩn xác'
                    : scoreResult.grade === 'warn'
                      ? 'Khá tốt'
                      : 'Cần luyện thêm'}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-3 text-center text-xs">
                <div className="rounded-xl bg-card p-2.5">
                  <p className="text-muted-foreground">Độ phủ nét</p>
                  <p className="mt-1 text-base font-bold text-violet-300">{scoreResult.coverage}%</p>
                </div>
                <div className="rounded-xl bg-card p-2.5">
                  <p className="text-muted-foreground">Độ chuẩn nét</p>
                  <p className="mt-1 text-base font-bold text-sky-300">{scoreResult.precision}%</p>
                </div>
                <div className="rounded-xl bg-card p-2.5">
                  <p className="text-muted-foreground">Cân tâm ô</p>
                  <p className="mt-1 text-base font-bold text-emerald-300">{scoreResult.balance}%</p>
                </div>
              </div>

              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{scoreResult.feedback}</p>
            </div>
          )}
        </section>
      </div>

      {Object.keys(history).length > 0 && (
        <section className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center gap-2">
            <History className="size-4 text-violet-400" aria-hidden="true" />
            <h3 className="text-sm font-semibold">Tiến độ luyện viết của bạn</h3>
          </div>
          <div className="mt-3 flex flex-wrap gap-3">
            {Object.values(history).map((rec) => (
              <button
                key={rec.char}
                type="button"
                onClick={() => selectCharacter(rec.char)}
                className="flex items-center gap-3 rounded-xl border border-border bg-background px-3.5 py-2 text-left transition-colors hover:border-primary/50"
              >
                <span lang="ko" className="text-2xl font-bold text-violet-300">
                  {rec.char}
                </span>
                <div className="text-xs">
                  <p className="font-semibold text-emerald-400">Cao nhất: {rec.bestScore}/100</p>
                  <p className="text-muted-foreground">{rec.attempts} lần viết</p>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
