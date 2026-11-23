'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  BookOpen,
  Check,
  CheckCircle2,
  Clock,
  Download,
  Edit3,
  Eye,
  EyeOff,
  FileJson,
  FileText,
  Headphones,
  Layers,
  Loader2,
  Play,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  Upload,
  Volume2,
  X,
} from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import type { ExtendedTopikQuestion, ManagedTopikExam } from '@/lib/backend/topik-exam-store'
import { cn } from '@/lib/utils'

interface AdminSummary {
  totalExams: number
  activeExams: number
  topik1Count: number
  topik2Count: number
  totalQuestions: number
}

const SAMPLE_IMPORT_EXAM = [
  {
    title: 'Đề thi thử TOPIK I - Đề số 03 (Chủ đề Du lịch & Mua sắm)',
    description: 'Đề luyện tập kỹ năng Nghe và Đọc sơ cấp xoay quanh tình huống du lịch, đặt phòng và mua sắm tại Hàn Quốc.',
    level: 'TOPIK I',
    durationMinutes: 60,
    maxListenCount: 2,
    isActive: true,
    questions: [
      {
        number: 1,
        section: 'listening',
        prompt: '다음을 듣고 물음에 맞는 대답을 고르십시오.',
        hint: 'Nghe và chọn câu trả lời phù hợp.',
        audioScript: '여자: 제주도에 가 본 적이 있어요?',
        options: [
          '네, 작년에 가족과 같이 갔어요.',
          '네, 비행기 표가 비싸요.',
          '아니요, 제주도가 아주 넓어요.',
          '아니요, 내일 친구를 만나요.',
        ],
        correctIndex: 0,
        explanation: 'Câu hỏi "제주도에 가 본 적이 있어요?" (Bạn đã từng đi đảo Jeju chưa?) → "네, 작년에 가족과 같이 갔어요" (Vâng, năm ngoái tôi đã đi cùng gia đình).',
      },
      {
        number: 2,
        section: 'listening',
        prompt: '여기는 어디입니까? 알맞은 것을 고르십시오.',
        hint: 'Đây là đâu?',
        audioScript: '남자: 예약하신 성함이 어떻게 되십니까? 여자: 김민지입니다. 오늘부터 이틀 동안 묵을 거예요.',
        options: ['호텔', '약국', '우체국', '도서관'],
        correctIndex: 0,
        explanation: 'Kiểm tra tên đặt phòng và lưu trú 2 ngày ("이틀 동안 묵을 거예요") diễn ra tại khách sạn ("호텔").',
      },
      {
        number: 3,
        section: 'reading',
        prompt: '무엇에 대한 내용입니까? 알맞은 것을 고르십시오.',
        hint: 'Đoạn văn nói về chủ đề gì?',
        passage: '저는 여행을 갈 때 항상 사진을 많이 찍습니다. 나중에 사진을 보면 즐거운 추억이 다시 생각납니다.',
        options: ['사진 찍기', '요리하기', '운동하기', '노래하기'],
        correctIndex: 0,
        explanation: 'Đoạn văn nói về thói quen chụp ảnh khi đi du lịch ("사진을 많이 찍습니다").',
      },
      {
        number: 4,
        section: 'reading',
        prompt: '다음을 읽고 내용이 같은 것을 고르십시오.',
        hint: 'Chọn câu đúng với nội dung đoạn văn.',
        passage: '인사동에서는 한국 전통 차를 마실 수 있고 예쁜 기념품도 살 수 있습니다. 그래서 외국인 관광객들이 많이 찾습니다.',
        options: [
          '인사동에는 외국인 관광객이 많이 옵니다.',
          '인사동에서는 기념품을 팔지 않습니다.',
          '인사동에는 전통 찻집이 없습니다.',
          '인사동은 밤에만 문을 엽니다.',
        ],
        correctIndex: 0,
        explanation: '"외국인 관광객들이 많이 찾습니다" khớp với đáp án A ("인사동에는 외국인 관광객이 많이 옵니다").',
      },
    ],
  },
]

function parseCsvToExam(csvText: string): Array<{
  title: string
  description: string
  level: 'TOPIK I' | 'TOPIK II'
  durationMinutes: number
  maxListenCount: number
  isActive: boolean
  questions: ExtendedTopikQuestion[]
}> {
  const lines = csvText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
  if (lines.length < 2) {
    throw new Error('File CSV cần có dòng tiêu đề cột và ít nhất 1 dòng câu hỏi.')
  }

  // Hỗ trợ CSV các cột: section,prompt,hint,audioScriptOrPassage,optionA,optionB,optionC,optionD,correctIndex,explanation
  const questions: ExtendedTopikQuestion[] = []
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map((c) => c.trim().replace(/^"|"$/g, ''))
    if (cols.length < 6) continue
    const rawSection = cols[0]?.toLowerCase() || ''
    const section = rawSection.includes('listen')
      ? 'listening'
      : rawSection.includes('writ')
        ? 'writing'
        : 'reading'
    const prompt = cols[1] || '다음을 읽고 물음에 답하십시오.'
    const hint = cols[2] || ''
    const textContent = cols[3] || ''
    const optA = cols[4] || 'Đáp án A'
    const optB = cols[5] || 'Đáp án B'
    const optC = cols[6] || 'Đáp án C'
    const optD = cols[7] || 'Đáp án D'
    const rawCorrect = cols[8]?.toUpperCase() || 'A'
    const correctIndex =
      rawCorrect === 'B' || rawCorrect === '1'
        ? 1
        : rawCorrect === 'C' || rawCorrect === '2'
          ? 2
          : rawCorrect === 'D' || rawCorrect === '3'
            ? 3
            : 0
    const explanation = cols[9] || ''

    questions.push({
      number: questions.length + 1,
      section,
      prompt,
      hint: hint || undefined,
      audioScript: section === 'listening' ? textContent : undefined,
      passage: section === 'reading' || section === 'writing' ? textContent : undefined,
      options: [optA, optB, optC, optD],
      correctIndex,
      explanation: explanation || undefined,
    })
  }

  if (questions.length === 0) {
    throw new Error('Không đọc được câu hỏi nào từ file CSV.')
  }

  return [
    {
      title: `Đề thi thử TOPIK Import (${new Date().toLocaleDateString('vi-VN')})`,
      description: `Đề thi được import từ file CSV gồm ${questions.length} câu hỏi.`,
      level: 'TOPIK I',
      durationMinutes: 60,
      maxListenCount: 2,
      isActive: true,
      questions,
    },
  ]
}

export function TopikAdminView({
  onTryExamAsStudent,
}: {
  onTryExamAsStudent?: (exam: ManagedTopikExam) => void
}) {
  const { token } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [bannerMessage, setBannerMessage] = useState<string | null>(null)

  const [summary, setSummary] = useState<AdminSummary | null>(null)
  const [exams, setExams] = useState<ManagedTopikExam[]>([])

  // Tìm kiếm & lọc đề thi
  const [searchQuery, setSearchQuery] = useState('')
  const [levelFilter, setLevelFilter] = useState<'ALL' | 'TOPIK I' | 'TOPIK II'>('ALL')

  // Modal Xem trước đề thi
  const [previewExam, setPreviewExam] = useState<ManagedTopikExam | null>(null)

  // Modal Thêm / Sửa đề thi (CRUD)
  const [editorOpen, setEditorOpen] = useState(false)
  const [editingExamId, setEditingExamId] = useState<string | null>(null)
  const [examForm, setExamForm] = useState<{
    title: string
    description: string
    level: 'TOPIK I' | 'TOPIK II'
    durationMinutes: number
    maxListenCount: number
    isActive: boolean
    questions: ExtendedTopikQuestion[]
  }>({
    title: '',
    description: '',
    level: 'TOPIK I',
    durationMinutes: 60,
    maxListenCount: 2,
    isActive: true,
    questions: [],
  })

  // Modal Import đề thi
  const [importOpen, setImportOpen] = useState(false)
  const [importJsonText, setImportJsonText] = useState('')
  const [importPreviewList, setImportPreviewList] = useState<
    Array<{
      title: string
      description?: string
      level: 'TOPIK I' | 'TOPIK II'
      durationMinutes: number
      maxListenCount: number
      isActive: boolean
      questions: ExtendedTopikQuestion[]
    }>
  >([])
  const [importParseError, setImportParseError] = useState<string | null>(null)

  const fetchAdminExams = useCallback(async () => {
    if (!token) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/topik/exams?admin=1', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        setError(json.error || 'Không thể tải danh sách đề thi TOPIK.')
        return
      }
      setSummary(json.summary || null)
      setExams(json.exams || [])
    } catch {
      setError('Lỗi kết nối tới máy chủ quản lý đề thi TOPIK.')
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    void fetchAdminExams()
  }, [fetchAdminExams])

  const speakKorean = (text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
    window.speechSynthesis.cancel()
    const clean = text.replace(/^(남자|여자)\s*:\s*/gm, '').replace(/(남자|여자)\s*:\s*/g, ' ')
    const utter = new SpeechSynthesisUtterance(clean)
    utter.lang = 'ko-KR'
    utter.rate = 0.9
    window.speechSynthesis.speak(utter)
  }

  const filteredExams = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return exams.filter((e) => {
      if (levelFilter !== 'ALL' && e.level !== levelFilter) return false
      if (q) {
        const matchTitle = e.title.toLowerCase().includes(q)
        const matchDesc = (e.description || '').toLowerCase().includes(q)
        if (!matchTitle && !matchDesc) return false
      }
      return true
    })
  }, [exams, searchQuery, levelFilter])

  // Mở Modal Tạo đề thi mới
  const handleOpenCreateExam = () => {
    setEditingExamId(null)
    setExamForm({
      title: '',
      description: '',
      level: 'TOPIK I',
      durationMinutes: 60,
      maxListenCount: 2,
      isActive: true,
      questions: [
        {
          number: 1,
          section: 'listening',
          prompt: '다음을 듣고 물음에 맞는 대답을 고르십시오.',
          hint: 'Nghe và chọn câu trả lời phù hợp.',
          audioScript: '남자: 오늘 시간이 있어요?',
          options: ['네, 시간이 있어요.', '네, 어제 갔어요.', '아니요, 학생이에요.', '아니요, 책이 많아요.'],
          correctIndex: 0,
          explanation: 'Câu hỏi "오늘 시간이 있어요?" (Hôm nay bạn có thời gian không?) → "네, 시간이 있어요".',
        },
        {
          number: 2,
          section: 'reading',
          prompt: '무엇에 대한 내용입니까? 알맞은 것을 고르십시오.',
          hint: 'Đoạn văn nói về chủ đề gì?',
          passage: '저는 주말마다 공원에서 자전거를 탑니다. 운동을 하면 기분이 아주 좋습니다.',
          options: ['취미', '음식', '가족', '날씨'],
          correctIndex: 0,
          explanation: 'Đạp xe ở công viên mỗi cuối tuần là sở thích ("취미").',
        },
      ],
    })
    setEditorOpen(true)
  }

  // Mở Modal Sửa đề thi
  const handleOpenEditExam = (exam: ManagedTopikExam) => {
    setEditingExamId(exam.examId)
    setExamForm({
      title: exam.title,
      description: exam.description || '',
      level: exam.level,
      durationMinutes: exam.durationMinutes,
      maxListenCount: exam.maxListenCount,
      isActive: exam.isActive,
      questions: exam.questions.map((q, idx) => ({
        ...q,
        number: idx + 1,
        options: [...q.options],
      })),
    })
    setEditorOpen(true)
  }

  // Thêm 1 câu hỏi vào form
  const handleAddQuestionToForm = (section: 'listening' | 'writing' | 'reading') => {
    setExamForm((prev) => ({
      ...prev,
      questions: [
        ...prev.questions,
        {
          number: prev.questions.length + 1,
          section,
          prompt:
            section === 'listening'
              ? '다음을 듣고 물음에 맞는 대답을 고르십시오.'
              : section === 'writing'
                ? '다음 글을 읽고 ( ㉠ )에 들어갈 말로 가장 알맞은 것을 고르십시오.'
                : '다음을 읽고 내용이 같은 것을 고르십시오.',
          hint:
            section === 'listening'
              ? 'Nghe và chọn câu trả lời phù hợp.'
              : section === 'writing'
                ? 'Đọc đoạn văn và chọn biểu đạt viết phù hợp nhất điền vào chỗ trống ( ㉠ ).'
                : 'Đọc và chọn nội dung đúng với đoạn văn.',
          audioUrl: section === 'listening' ? '/audio/topik/topik-listen-01.mp4' : undefined,
          audioScript: section === 'listening' ? '남자: 어디에 가요?' : undefined,
          passage:
            section === 'reading' || section === 'writing'
              ? '저는 매일 한국어를 공부합니다.'
              : undefined,
          options: ['Phương án A', 'Phương án B', 'Phương án C', 'Phương án D'],
          correctIndex: 0,
          explanation: '',
        },
      ],
    }))
  }

  // Xóa 1 câu hỏi khỏi form
  const handleRemoveQuestionFromForm = (qIndex: number) => {
    setExamForm((prev) => {
      if (prev.questions.length <= 1) return prev
      const next = prev.questions
        .filter((_, idx) => idx !== qIndex)
        .map((q, idx) => ({ ...q, number: idx + 1 }))
      return { ...prev, questions: next }
    })
  }

  // Cập nhật 1 câu hỏi trong form
  const handleUpdateQuestionInForm = (
    qIndex: number,
    patch: Partial<ExtendedTopikQuestion>,
  ) => {
    setExamForm((prev) => {
      const next = [...prev.questions]
      next[qIndex] = { ...next[qIndex], ...patch }
      return { ...prev, questions: next }
    })
  }

  // Lưu đề thi (Create / Update)
  const handleSaveExam = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) return
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/topik/exams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: editingExamId ? 'update' : 'create',
          examId: editingExamId || undefined,
          ...examForm,
        }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        setError(json.error || 'Không thể lưu đề thi.')
        return
      }
      setBannerMessage(json.message)
      setEditorOpen(false)
      await fetchAdminExams()
    } catch {
      setError('Lỗi kết nối khi lưu đề thi.')
    } finally {
      setSaving(false)
    }
  }

  // Bật / tắt hiển thị đề thi cho học viên
  const handleToggleActive = async (exam: ManagedTopikExam) => {
    if (!token) return
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/topik/exams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: 'toggle_active',
          examId: exam.examId,
          isActive: !exam.isActive,
        }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        setError(json.error || 'Không thể cập nhật trạng thái đề thi.')
        return
      }
      setBannerMessage(json.message)
      await fetchAdminExams()
    } catch {
      setError('Lỗi kết nối khi cập nhật trạng thái đề thi.')
    } finally {
      setSaving(false)
    }
  }

  // Xóa đề thi
  const handleDeleteExam = async (exam: ManagedTopikExam) => {
    if (!token) return
    if (!window.confirm(`Bạn có chắc chắn muốn xóa đề thi "${exam.title}" không?`)) return
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/topik/exams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: 'delete',
          examId: exam.examId,
        }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        setError(json.error || 'Không thể xóa đề thi.')
        return
      }
      setBannerMessage(json.message)
      if (previewExam?.examId === exam.examId) setPreviewExam(null)
      await fetchAdminExams()
    } catch {
      setError('Lỗi kết nối khi xóa đề thi.')
    } finally {
      setSaving(false)
    }
  }

  // Phân tích dữ liệu Import (JSON hoặc CSV) để Xem trước trước khi lưu
  const parseImportText = (rawText: string, fileName = '') => {
    setImportParseError(null)
    const trimmed = rawText.trim()
    if (!trimmed) {
      setImportPreviewList([])
      return
    }
    try {
      if (fileName.toLowerCase().endsWith('.csv') || (!trimmed.startsWith('{') && !trimmed.startsWith('['))) {
        const parsedCsv = parseCsvToExam(trimmed)
        setImportPreviewList(parsedCsv)
        return
      }
      const parsed = JSON.parse(trimmed)
      const arr = Array.isArray(parsed) ? parsed : Array.isArray(parsed.exams) ? parsed.exams : [parsed]
      const validList = arr.map((item: any, idx: number) => {
        if (!item || typeof item !== 'object') {
          throw new Error(`Đề thi thứ ${idx + 1} không đúng định dạng.`)
        }
        const qs: ExtendedTopikQuestion[] = Array.isArray(item.questions)
          ? item.questions.map((q: any, qIdx: number) => ({
              number: qIdx + 1,
              section:
                q.section === 'listening'
                  ? 'listening'
                  : q.section === 'writing'
                    ? 'writing'
                    : 'reading',
              prompt: String(q.prompt || '다음을 읽고 물음에 답하십시오.'),
              hint: q.hint ? String(q.hint) : undefined,
              passage: q.passage ? String(q.passage) : undefined,
              audioUrl: q.audioUrl ? String(q.audioUrl) : undefined,
              audioScript: q.audioScript ? String(q.audioScript) : undefined,
              options: Array.isArray(q.options) && q.options.length >= 4
                ? q.options.slice(0, 4).map(String)
                : ['Phương án A', 'Phương án B', 'Phương án C', 'Phương án D'],
              correctIndex:
                typeof q.correctIndex === 'number' && q.correctIndex >= 0 && q.correctIndex <= 3
                  ? q.correctIndex
                  : 0,
              explanation: q.explanation ? String(q.explanation) : undefined,
            }))
          : []
        if (qs.length === 0) {
          throw new Error(`Đề "${item.title || idx + 1}" chưa có danh sách câu hỏi (questions).`)
        }
        return {
          title: String(item.title || `Đề thi thử TOPIK Import #${idx + 1}`),
          description: String(item.description || ''),
          level: (String(item.level || '').toUpperCase().includes('II') ? 'TOPIK II' : 'TOPIK I') as
            | 'TOPIK I'
            | 'TOPIK II',
          durationMinutes: Number(item.durationMinutes) || 60,
          maxListenCount: Number(item.maxListenCount) || 2,
          isActive: item.isActive !== undefined ? Boolean(item.isActive) : true,
          questions: qs,
        }
      })
      setImportPreviewList(validList)
    } catch (err) {
      setImportPreviewList([])
      setImportParseError(
        err instanceof Error ? err.message : 'Định dạng dữ liệu không hợp lệ. Vui lòng kiểm tra lại JSON/CSV.',
      )
    }
  }

  const handleImportFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const content = String(reader.result || '')
      setImportJsonText(content)
      parseImportText(content, file.name)
    }
    reader.readAsText(file, 'utf-8')
  }

  const handleLoadSampleImport = () => {
    const sampleStr = JSON.stringify(SAMPLE_IMPORT_EXAM, null, 2)
    setImportJsonText(sampleStr)
    parseImportText(sampleStr, 'sample.json')
  }

  const handleDownloadSampleJson = () => {
    const sampleStr = JSON.stringify(SAMPLE_IMPORT_EXAM, null, 2)
    const blob = new Blob([sampleStr], { type: 'application/json;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'de-thi-thu-topik-mau.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleConfirmImport = async () => {
    if (!token || importPreviewList.length === 0) return
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/topik/exams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: 'import',
          exams: importPreviewList,
        }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        setImportParseError(json.error || 'Không thể import đề thi.')
        return
      }
      setBannerMessage(json.message)
      setImportOpen(false)
      setImportJsonText('')
      setImportPreviewList([])
      await fetchAdminExams()
    } catch {
      setImportParseError('Lỗi kết nối khi import đề thi.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen w-full px-3 py-6 text-slate-900 md:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        {/* =====================================================================
            HEADER QUẢN LÝ ĐỀ THI THỬ TOPIK (ADMIN) + 4 THẺ THỐNG KÊ
           ===================================================================== */}
        <section className="rounded-2xl border-[1.5px] border-slate-800 bg-white p-5 shadow-[0_2px_0_rgba(15,23,42,0.06)] md:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-xl border border-slate-800 bg-[#2563EB] text-white shadow-sm">
                <FileText className="size-6" aria-hidden="true" />
              </span>
              <div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <h1 className="text-2xl font-black tracking-tight text-slate-900 md:text-3xl">
                    Quản lý Đề thi thử TOPIK
                  </h1>
                  <span className="inline-flex items-center gap-1 rounded-md border border-amber-400 bg-[#FEF08A] px-2.5 py-0.5 text-xs font-bold text-amber-950">
                    <ShieldCheck className="size-3.5" />
                    Quản trị viên
                  </span>
                </div>
                <p className="mt-1.5 text-sm text-slate-600">
                  Tạo đề thi mới, import bộ đề từ file JSON/CSV, xem trước câu hỏi Nghe · Đọc và quản lý danh sách đề thi hiển thị cho học viên.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => void fetchAdminExams()}
                disabled={loading}
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-800 bg-white px-3.5 text-xs font-bold text-slate-800 shadow-sm transition hover:bg-slate-50"
              >
                <RefreshCw className={cn('size-4', loading && 'animate-spin')} />
                <span>Làm mới</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setImportOpen(true)
                  setImportParseError(null)
                }}
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-800 bg-[#FEF08A] px-4 text-xs font-bold text-amber-950 shadow-sm transition hover:bg-amber-200"
              >
                <Upload className="size-4" />
                <span>Import đề thi</span>
              </button>
              <button
                type="button"
                onClick={handleOpenCreateExam}
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-900 bg-[#2563EB] px-4 text-xs font-bold text-white shadow-sm transition hover:bg-blue-600"
              >
                <Plus className="size-4" />
                <span>Tạo đề thi mới</span>
              </button>
            </div>
          </div>

          {/* 4 THẺ THỐNG KÊ TỔNG QUAN */}
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Tổng số đề thi
                </span>
                <span className="flex size-9 items-center justify-center rounded-xl border border-slate-800 bg-[#3B82F6] text-white">
                  <FileText className="size-4" />
                </span>
              </div>
              <p className="mt-2 text-3xl font-black text-slate-900">
                {summary?.totalExams ?? exams.length}
              </p>
              <p className="mt-1 text-xs text-slate-600">
                {summary?.topik1Count ?? 0} đề TOPIK I · {summary?.topik2Count ?? 0} đề TOPIK II
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Đang mở cho học viên
                </span>
                <span className="flex size-9 items-center justify-center rounded-xl border border-slate-800 bg-[#22C55E] text-slate-950">
                  <CheckCircle2 className="size-4" />
                </span>
              </div>
              <p className="mt-2 text-3xl font-black text-emerald-700">
                {summary?.activeExams ?? exams.filter((e) => e.isActive).length}
              </p>
              <p className="mt-1 text-xs text-slate-600">
                Học viên có thể chọn đề và làm bài ngay
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Tổng số câu hỏi
                </span>
                <span className="flex size-9 items-center justify-center rounded-xl border border-slate-800 bg-[#8B5CF6] text-white">
                  <Layers className="size-4" />
                </span>
              </div>
              <p className="mt-2 text-3xl font-black text-slate-900">
                {summary?.totalQuestions ?? exams.reduce((s, e) => s + e.questions.length, 0)}
              </p>
              <p className="mt-1 text-xs text-slate-600">
                Bao gồm câu hỏi Nghe hiểu & Đọc hiểu
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Định dạng hỗ trợ
                </span>
                <span className="flex size-9 items-center justify-center rounded-xl border border-slate-800 bg-[#F59E0B] text-slate-950">
                  <FileJson className="size-4" />
                </span>
              </div>
              <p className="mt-2 text-2xl font-black text-slate-900">JSON · CSV</p>
              <p className="mt-1 text-xs text-slate-600">
                Hỗ trợ import nhanh & xem trước đề thi
              </p>
            </div>
          </div>
        </section>

        {/* THÔNG BÁO THÀNH CÔNG / LỖI */}
        {bannerMessage && (
          <div className="flex items-center justify-between gap-3 rounded-2xl border-[1.5px] border-emerald-600 bg-emerald-50 px-4 py-3 text-sm text-emerald-950 shadow-sm">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="size-5 shrink-0 text-emerald-600" />
              <span className="font-semibold">{bannerMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setBannerMessage(null)}
              className="rounded-lg px-2.5 py-1 text-xs font-bold text-emerald-900 hover:bg-emerald-100"
            >
              Đóng
            </button>
          </div>
        )}

        {error && (
          <div className="flex items-center justify-between gap-3 rounded-2xl border-[1.5px] border-red-600 bg-red-50 px-4 py-3 text-sm text-red-950 shadow-sm">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="size-5 shrink-0 text-red-600" />
              <span className="font-semibold">{error}</span>
            </div>
            <button
              type="button"
              onClick={() => setError(null)}
              className="rounded-lg px-2.5 py-1 text-xs font-bold text-red-900 hover:bg-red-100"
            >
              Đóng
            </button>
          </div>
        )}

        {/* THANH LỌC CẤP ĐỘ & TÌM KIẾM ĐỀ THI */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border-[1.5px] border-slate-800 bg-white p-2.5 shadow-[0_2px_0_rgba(15,23,42,0.06)]">
          <div className="flex flex-wrap items-center gap-1.5">
            {(['ALL', 'TOPIK I', 'TOPIK II'] as const).map((lv) => (
              <button
                key={lv}
                type="button"
                onClick={() => setLevelFilter(lv)}
                className={cn(
                  'rounded-xl px-4 py-2 text-xs font-bold transition-all',
                  levelFilter === lv
                    ? 'border border-slate-900 bg-[#2563EB] text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
                )}
              >
                {lv === 'ALL' ? `Tất cả đề thi (${exams.length})` : lv}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm tên đề thi..."
              className="h-9 w-full rounded-xl border border-slate-300 bg-slate-50 pl-10 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#2563EB] focus:bg-white focus:outline-none"
            />
          </div>
        </div>

        {/* DANH SÁCH ĐỀ THI THỬ (CARD GRID) */}
        {loading && exams.length === 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, idx) => (
              <div
                key={idx}
                className="h-64 animate-pulse rounded-2xl border-[1.5px] border-slate-800 bg-white p-5"
              />
            ))}
          </div>
        ) : filteredExams.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border-[1.5px] border-slate-800 bg-white p-10 text-center shadow-[0_2px_0_rgba(15,23,42,0.06)]">
            <FileText className="size-10 text-[#2563EB]" />
            <p className="mt-3 text-base font-bold text-slate-900">
              {exams.length === 0
                ? 'Chưa có đề thi thử nào trong hệ thống'
                : 'Không tìm thấy đề thi phù hợp'}
            </p>
            <p className="mt-1 text-xs text-slate-600">
              {exams.length === 0
                ? 'Hãy bấm "Import đề thi" để tải file JSON/CSV đề thi của bạn lên hoặc bấm "Tạo đề thi mới".'
                : 'Hãy thử đổi bộ lọc cấp độ hoặc xóa từ khóa tìm kiếm.'}
            </p>
            {exams.length === 0 && (
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setImportOpen(true)
                    setImportParseError(null)
                  }}
                  className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-800 bg-[#FEF08A] px-4 text-xs font-bold text-amber-950 shadow-sm transition hover:bg-amber-200"
                >
                  <Upload className="size-4" />
                  <span>Import đề thi ngay</span>
                </button>
                <button
                  type="button"
                  onClick={handleOpenCreateExam}
                  className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-900 bg-[#2563EB] px-4 text-xs font-bold text-white shadow-sm transition hover:bg-blue-600"
                >
                  <Plus className="size-4" />
                  <span>Tạo đề thi mới</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredExams.map((exam) => {
              const listeningCount = exam.questions.filter((q) => q.section === 'listening').length
              const writingCount = exam.questions.filter((q) => q.section === 'writing').length
              const readingCount = exam.questions.filter((q) => q.section === 'reading').length

              return (
                <article
                  key={exam.examId}
                  className={cn(
                    'flex flex-col justify-between rounded-2xl border-[1.5px] border-slate-800 bg-white p-5 shadow-[0_2px_0_rgba(15,23,42,0.06)] transition hover:shadow-md',
                    !exam.isActive && 'opacity-80',
                  )}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <span
                        className={cn(
                          'rounded-md border px-2.5 py-0.5 text-xs font-bold',
                          exam.level === 'TOPIK II'
                            ? 'border-violet-400 bg-violet-100 text-violet-950'
                            : 'border-amber-400 bg-[#FEF08A] text-amber-950',
                        )}
                      >
                        {exam.level}
                      </span>

                      {exam.isActive ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400 bg-[#DCFCE7] px-2.5 py-0.5 text-[11px] font-bold text-emerald-900">
                          <Eye className="size-3" />
                          Đang mở cho học viên
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold text-slate-600">
                          <EyeOff className="size-3" />
                          Đang tạm ẩn
                        </span>
                      )}
                    </div>

                    <h2 className="mt-3 text-lg font-extrabold text-slate-900">{exam.title}</h2>
                    <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-slate-600">
                      {exam.description || 'Đề thi thử đánh giá năng lực tiếng Hàn TOPIK.'}
                    </p>

                    <div
                      className={cn(
                        'mt-4 grid gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-center',
                        writingCount > 0 ? 'grid-cols-4' : 'grid-cols-3',
                      )}
                    >
                      <div>
                        <p className="text-[11px] font-medium text-slate-500">Thời gian</p>
                        <p className="text-sm font-black text-slate-900">{exam.durationMinutes}p</p>
                      </div>
                      <div>
                        <p className="text-[11px] font-medium text-slate-500">Nghe</p>
                        <p className="text-sm font-bold text-[#2563EB]">{listeningCount} câu</p>
                      </div>
                      {writingCount > 0 && (
                        <div>
                          <p className="text-[11px] font-medium text-slate-500">Viết</p>
                          <p className="text-sm font-bold text-emerald-700">{writingCount} câu</p>
                        </div>
                      )}
                      <div>
                        <p className="text-[11px] font-medium text-slate-500">Đọc</p>
                        <p className="text-sm font-bold text-violet-700">{readingCount} câu</p>
                      </div>
                    </div>
                  </div>

                  {/* Hàng nút thao tác CRUD & Xem trước */}
                  <div className="mt-5 flex flex-col gap-2 border-t border-slate-200 pt-3">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setPreviewExam(exam)}
                        className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-900 bg-[#2563EB] px-3 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-blue-600"
                      >
                        <Eye className="size-3.5" />
                        <span>Xem trước đề ({exam.questions.length} câu)</span>
                      </button>
                      {onTryExamAsStudent && (
                        <button
                          type="button"
                          onClick={() => onTryExamAsStudent(exam)}
                          title="Làm thử đề thi này trên giao diện phòng thi"
                          className="inline-flex items-center justify-center gap-1 rounded-xl border border-slate-800 bg-[#FEF08A] px-3 py-2 text-xs font-bold text-amber-950 transition hover:bg-amber-200"
                        >
                          <Play className="size-3.5 fill-current" />
                          <span>Thi thử</span>
                        </button>
                      )}
                    </div>

                    <div className="flex items-center justify-between gap-1.5">
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => void handleToggleActive(exam)}
                        className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        {exam.isActive ? (
                          <>
                            <EyeOff className="size-3.5" />
                            <span>Ẩn đề</span>
                          </>
                        ) : (
                          <>
                            <Eye className="size-3.5" />
                            <span>Mở đề</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenEditExam(exam)}
                        className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:border-[#2563EB] hover:text-[#2563EB]"
                      >
                        <Edit3 className="size-3.5" />
                        <span>Sửa đề</span>
                      </button>

                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => void handleDeleteExam(exam)}
                        className="inline-flex items-center justify-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100"
                      >
                        <Trash2 className="size-3.5" />
                        <span>Xóa</span>
                      </button>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </div>

      {/* =====================================================================
          MODAL 1: XEM TRƯỚC ĐỀ THI (PREVIEW EXAM)
         ===================================================================== */}
      {previewExam && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs"
        >
          <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border-[1.5px] border-slate-800 bg-white text-slate-900 shadow-2xl">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-6 py-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded-md border border-amber-400 bg-[#FEF08A] px-2.5 py-0.5 text-xs font-bold text-amber-950">
                    {previewExam.level}
                  </span>
                  <span className="text-xs font-semibold text-slate-500">
                    Thời gian: {previewExam.durationMinutes} phút · {previewExam.questions.length} câu hỏi
                  </span>
                </div>
                <h2 className="mt-1 text-xl font-black text-slate-900">
                  Xem trước: {previewExam.title}
                </h2>
              </div>

              <div className="flex items-center gap-2">
                {onTryExamAsStudent && (
                  <button
                    type="button"
                    onClick={() => {
                      const target = previewExam
                      setPreviewExam(null)
                      onTryExamAsStudent(target)
                    }}
                    className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-900 bg-[#2563EB] px-3.5 text-xs font-bold text-white shadow-sm hover:bg-blue-600"
                  >
                    <Play className="size-3.5 fill-current" />
                    <span>Làm thử đề này</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    const target = previewExam
                    setPreviewExam(null)
                    handleOpenEditExam(target)
                  }}
                  className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 text-xs font-bold text-slate-800 hover:bg-slate-50"
                >
                  <Edit3 className="size-3.5" />
                  <span>Chỉnh sửa</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewExam(null)}
                  className="flex size-9 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100"
                >
                  <X className="size-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto p-6">
              {previewExam.questions.map((q) => (
                <div
                  key={q.number}
                  className="rounded-2xl border border-slate-300 bg-slate-50/70 p-5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="rounded-lg bg-[#2563EB] px-2.5 py-1 text-xs font-bold text-white">
                        Câu {q.number}
                      </span>
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 rounded-md border px-2.5 py-0.5 text-xs font-bold',
                          q.section === 'listening'
                            ? 'border-blue-300 bg-blue-50 text-blue-900'
                            : q.section === 'writing'
                              ? 'border-emerald-300 bg-emerald-50 text-emerald-900'
                              : 'border-violet-300 bg-violet-50 text-violet-900',
                        )}
                      >
                        {q.section === 'listening' ? (
                          <>
                            <Headphones className="size-3.5" />
                            <span>Phần Nghe</span>
                          </>
                        ) : q.section === 'writing' ? (
                          <>
                            <Edit3 className="size-3.5" />
                            <span>Phần Viết</span>
                          </>
                        ) : (
                          <>
                            <BookOpen className="size-3.5" />
                            <span>Phần Đọc</span>
                          </>
                        )}
                      </span>
                      {q.section === 'listening' && q.audioUrl && (
                        <span className="rounded-md border border-slate-300 bg-white px-2 py-0.5 font-mono text-[11px] font-semibold text-slate-700">
                          File: {q.audioUrl.split('/').pop()}
                        </span>
                      )}
                    </div>

                    {q.section === 'listening' && q.audioScript && (
                      <button
                        type="button"
                        onClick={() => speakKorean(q.audioScript!)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-800 bg-white px-3 py-1 text-xs font-bold text-slate-800 hover:bg-slate-100"
                      >
                        <Volume2 className="size-3.5 text-[#2563EB]" />
                        <span>Nghe thử hội thoại</span>
                      </button>
                    )}
                  </div>

                  <p lang="ko" className="mt-3 text-base font-bold text-slate-900">
                    {q.prompt}
                  </p>
                  {q.hint && <p className="mt-1 text-xs text-slate-600">{q.hint}</p>}

                  {q.audioScript && (
                    <div className="mt-3 rounded-xl border border-blue-200 bg-blue-50/70 p-3 text-xs">
                      <span className="font-bold text-blue-900">Lời thoại phần Nghe: </span>
                      <span lang="ko" className="font-medium text-slate-900">
                        {q.audioScript}
                      </span>
                    </div>
                  )}

                  {q.passage && (
                    <div
                      lang="ko"
                      className="mt-3 rounded-xl border border-slate-300 bg-white p-3.5 text-sm leading-relaxed text-slate-900"
                    >
                      {q.passage}
                    </div>
                  )}

                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {q.options.map((opt, optIdx) => {
                      const isCorrect = q.correctIndex === optIdx
                      const letter = 'ABCD'[optIdx]
                      return (
                        <div
                          key={optIdx}
                          className={cn(
                            'flex items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-xs',
                            isCorrect
                              ? 'border-emerald-500 bg-emerald-50 font-bold text-emerald-950'
                              : 'border-slate-200 bg-white text-slate-700',
                          )}
                        >
                          <span
                            className={cn(
                              'flex size-6 shrink-0 items-center justify-center rounded-md text-xs font-bold',
                              isCorrect
                                ? 'bg-emerald-600 text-white'
                                : 'bg-slate-100 text-slate-700',
                            )}
                          >
                            {letter}
                          </span>
                          <span lang="ko" className="flex-1">
                            {opt}
                          </span>
                          {isCorrect && (
                            <span className="rounded bg-emerald-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                              Đáp án đúng
                            </span>
                          )}
                        </div>
                      )
                    })}
                  </div>

                  {q.explanation && (
                    <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-950">
                      <strong>Giải thích:</strong> {q.explanation}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL 2: IMPORT ĐỀ THI THỬ (JSON / CSV + XEM TRƯỚC TRƯỚC KHI LƯU)
         ===================================================================== */}
      {importOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs"
        >
          <div className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border-[1.5px] border-slate-800 bg-white text-slate-900 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <h2 className="text-lg font-black text-slate-900">
                  Import Đề thi thử TOPIK
                </h2>
                <p className="text-xs text-slate-600">
                  Tải lên file .json hoặc .csv (hoặc dán nội dung đề thi) để xem trước và thêm vào hệ thống.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setImportOpen(false)}
                className="flex size-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto p-6">
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <label className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-xl border border-slate-900 bg-[#2563EB] px-3.5 text-xs font-bold text-white shadow-sm hover:bg-blue-600">
                    <Upload className="size-3.5" />
                    <span>Chọn file (.json / .csv)</span>
                    <input
                      type="file"
                      accept=".json,.csv,application/json,text/csv"
                      onChange={handleImportFileChange}
                      className="hidden"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={handleLoadSampleImport}
                    className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-800 bg-[#FEF08A] px-3.5 text-xs font-bold text-amber-950 hover:bg-amber-200"
                  >
                    <FileJson className="size-3.5" />
                    <span>Nạp đề mẫu thử nghiệm</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleDownloadSampleJson}
                  className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                >
                  <Download className="size-3.5" />
                  <span>Tải file mẫu .json</span>
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700">
                  Nội dung dữ liệu đề thi (JSON hoặc CSV)
                </label>
                <textarea
                  rows={7}
                  value={importJsonText}
                  onChange={(e) => {
                    setImportJsonText(e.target.value)
                    parseImportText(e.target.value)
                  }}
                  placeholder='Dán nội dung JSON đề thi vào đây hoặc bấm "Nạp đề mẫu thử nghiệm" ở trên...'
                  className="mt-1.5 w-full rounded-2xl border border-slate-300 bg-slate-50 p-3.5 font-mono text-xs text-slate-900 focus:border-[#2563EB] focus:bg-white focus:outline-none"
                />
              </div>

              {importParseError && (
                <div className="rounded-xl border border-red-400 bg-red-50 p-3 text-xs font-semibold text-red-900">
                  {importParseError}
                </div>
              )}

              {/* Bản xem trước đề thi sẽ được import */}
              {importPreviewList.length > 0 && (
                <div className="rounded-2xl border border-emerald-400 bg-emerald-50/60 p-4">
                  <div className="flex items-center gap-2 text-xs font-extrabold text-emerald-950">
                    <CheckCircle2 className="size-4 text-emerald-600" />
                    <span>
                      Xem trước dữ liệu hợp lệ: Sẵn sàng import {importPreviewList.length} đề thi
                    </span>
                  </div>
                  <div className="mt-3 space-y-2">
                    {importPreviewList.map((item, idx) => {
                      const listenCount = item.questions.filter((q) => q.section === 'listening').length
                      const writeCount = item.questions.filter((q) => q.section === 'writing').length
                      const readCount = item.questions.filter((q) => q.section === 'reading').length
                      return (
                        <div
                          key={idx}
                          className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-emerald-300 bg-white p-3 text-xs"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="rounded bg-[#FEF08A] px-2 py-0.5 font-bold text-amber-950">
                                {item.level}
                              </span>
                              <strong className="text-slate-900">{item.title}</strong>
                            </div>
                            {item.description && (
                              <p className="mt-1 text-slate-600">{item.description}</p>
                            )}
                          </div>
                          <span className="font-bold text-emerald-800">
                            {item.durationMinutes} phút · {item.questions.length} câu ({listenCount} Nghe
                            {writeCount > 0 ? `, ${writeCount} Viết` : ''}, {readCount} Đọc)
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2.5 border-t border-slate-200 px-6 py-4">
              <button
                type="button"
                onClick={() => setImportOpen(false)}
                className="h-10 rounded-xl border border-slate-300 px-4 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={saving || importPreviewList.length === 0}
                onClick={() => void handleConfirmImport()}
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-900 bg-[#2563EB] px-5 text-xs font-bold text-white shadow-sm hover:bg-blue-600 disabled:opacity-50"
              >
                {saving && <Loader2 className="size-4 animate-spin" />}
                <span>Xác nhận Import ({importPreviewList.length} đề)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL 3: TẠO MỚI / CHỈNH SỬA ĐỀ THI & CÂU HỎI (CRUD)
         ===================================================================== */}
      {editorOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs"
        >
          <div className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border-[1.5px] border-slate-800 bg-white text-slate-900 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <h2 className="text-lg font-black text-slate-900">
                {editingExamId ? 'Chỉnh sửa Đề thi thử TOPIK' : 'Tạo Đề thi thử TOPIK mới'}
              </h2>
              <button
                type="button"
                onClick={() => setEditorOpen(false)}
                className="flex size-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
              >
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleSaveExam} className="flex flex-1 flex-col overflow-hidden">
              <div className="flex-1 space-y-5 overflow-y-auto p-6">
                {/* Thông tin chung của đề thi */}
                <div className="grid gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700">Tên đề thi *</label>
                    <input
                      type="text"
                      required
                      value={examForm.title}
                      onChange={(e) => setExamForm({ ...examForm, title: e.target.value })}
                      placeholder="VD: Đề thi thử TOPIK I - Đề số 04"
                      className="mt-1 h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-xs font-bold text-slate-900 focus:border-[#2563EB] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700">Cấp độ đề thi</label>
                    <select
                      value={examForm.level}
                      onChange={(e) =>
                        setExamForm({
                          ...examForm,
                          level: e.target.value === 'TOPIK II' ? 'TOPIK II' : 'TOPIK I',
                        })
                      }
                      className="mt-1 h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-xs font-bold text-slate-900 focus:border-[#2563EB] focus:outline-none"
                    >
                      <option value="TOPIK I">TOPIK I (Sơ cấp)</option>
                      <option value="TOPIK II">TOPIK II (Trung – Cao cấp)</option>
                    </select>
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-xs font-bold text-slate-700">Mô tả đề thi</label>
                    <input
                      type="text"
                      value={examForm.description}
                      onChange={(e) => setExamForm({ ...examForm, description: e.target.value })}
                      placeholder="Mô tả ngắn gọn nội dung và phạm vi kiến thức của đề thi..."
                      className="mt-1 h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-xs text-slate-900 focus:border-[#2563EB] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700">
                      Thời gian làm bài (phút)
                    </label>
                    <input
                      type="number"
                      min={5}
                      max={240}
                      value={examForm.durationMinutes}
                      onChange={(e) =>
                        setExamForm({ ...examForm, durationMinutes: Number(e.target.value) || 60 })
                      }
                      className="mt-1 h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-xs font-bold text-slate-900 focus:border-[#2563EB] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700">
                      Số lần nghe tối đa mỗi câu
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={examForm.maxListenCount}
                      onChange={(e) =>
                        setExamForm({ ...examForm, maxListenCount: Number(e.target.value) || 2 })
                      }
                      className="mt-1 h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-xs font-bold text-slate-900 focus:border-[#2563EB] focus:outline-none"
                    />
                  </div>

                  <div className="flex items-end pb-2">
                    <label className="flex cursor-pointer items-center gap-2 text-xs font-bold text-slate-800">
                      <input
                        type="checkbox"
                        checked={examForm.isActive}
                        onChange={(e) => setExamForm({ ...examForm, isActive: e.target.checked })}
                        className="size-4 accent-[#2563EB]"
                      />
                      <span>Mở hiển thị đề thi này cho Học viên</span>
                    </label>
                  </div>
                </div>

                {/* Danh sách câu hỏi trong đề */}
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-sm font-black text-slate-900">
                      Danh sách câu hỏi ({examForm.questions.length} câu)
                    </h3>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleAddQuestionToForm('listening')}
                        className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-blue-400 bg-blue-50 px-3 text-xs font-bold text-blue-900 hover:bg-blue-100"
                      >
                        <Plus className="size-3.5" />
                        <span>Thêm câu Nghe</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAddQuestionToForm('writing')}
                        className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-emerald-400 bg-emerald-50 px-3 text-xs font-bold text-emerald-900 hover:bg-emerald-100"
                      >
                        <Plus className="size-3.5" />
                        <span>Thêm câu Viết</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAddQuestionToForm('reading')}
                        className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-violet-400 bg-violet-50 px-3 text-xs font-bold text-violet-900 hover:bg-violet-100"
                      >
                        <Plus className="size-3.5" />
                        <span>Thêm câu Đọc</span>
                      </button>
                    </div>
                  </div>

                  {examForm.questions.map((q, qIdx) => (
                    <div
                      key={qIdx}
                      className="rounded-2xl border border-slate-300 bg-white p-4 shadow-2xs"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-2">
                          <span className="rounded-lg bg-[#2563EB] px-2.5 py-1 text-xs font-bold text-white">
                            Câu {qIdx + 1}
                          </span>
                          <select
                            value={q.section}
                            onChange={(e) =>
                              handleUpdateQuestionInForm(qIdx, {
                                section:
                                  e.target.value === 'listening'
                                    ? 'listening'
                                    : e.target.value === 'writing'
                                      ? 'writing'
                                      : 'reading',
                              })
                            }
                            className="h-8 rounded-lg border border-slate-300 bg-slate-50 px-2.5 text-xs font-bold text-slate-800"
                          >
                            <option value="listening">Phần Nghe</option>
                            <option value="writing">Phần Viết</option>
                            <option value="reading">Phần Đọc</option>
                          </select>
                        </div>

                        {examForm.questions.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveQuestionFromForm(qIdx)}
                            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="size-3.5" />
                            <span>Xóa câu này</span>
                          </button>
                        )}
                      </div>

                      <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600">
                            Yêu cầu câu hỏi (Tiếng Hàn) *
                          </label>
                          <input
                            type="text"
                            required
                            value={q.prompt}
                            onChange={(e) =>
                              handleUpdateQuestionInForm(qIdx, { prompt: e.target.value })
                            }
                            className="mt-1 h-9 w-full rounded-lg border border-slate-300 px-3 text-xs font-semibold text-slate-900"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600">
                            Gợi ý dịch (Tiếng Việt)
                          </label>
                          <input
                            type="text"
                            value={q.hint || ''}
                            onChange={(e) =>
                              handleUpdateQuestionInForm(qIdx, { hint: e.target.value })
                            }
                            className="mt-1 h-9 w-full rounded-lg border border-slate-300 px-3 text-xs text-slate-900"
                          />
                        </div>

                        {q.section === 'listening' ? (
                          <>
                            <div>
                              <label className="block text-[11px] font-bold text-slate-600">
                                Đường dẫn file nghe (.mp4 / .mp3)
                              </label>
                              <input
                                type="text"
                                value={q.audioUrl || ''}
                                onChange={(e) =>
                                  handleUpdateQuestionInForm(qIdx, { audioUrl: e.target.value })
                                }
                                placeholder="VD: /audio/topik/topik1-de1-q1.mp4"
                                className="mt-1 h-9 w-full rounded-lg border border-slate-300 px-3 text-xs text-slate-900"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-bold text-slate-600">
                                Lời thoại phần Nghe (Transcript tiếng Hàn)
                              </label>
                              <input
                                type="text"
                                value={q.audioScript || ''}
                                onChange={(e) =>
                                  handleUpdateQuestionInForm(qIdx, { audioScript: e.target.value })
                                }
                                placeholder="VD: 남자: 사과가 있어요? 여자: 네, 있어요."
                                className="mt-1 h-9 w-full rounded-lg border border-slate-300 px-3 text-xs text-slate-900"
                              />
                            </div>
                          </>
                        ) : (
                          <div className="sm:col-span-2">
                            <label className="block text-[11px] font-bold text-slate-600">
                              {q.section === 'writing'
                                ? 'Đoạn văn / Đề bài phần Viết (Tiếng Hàn)'
                                : 'Đoạn văn phần Đọc (Tiếng Hàn)'}
                            </label>
                            <textarea
                              rows={2}
                              value={q.passage || ''}
                              onChange={(e) =>
                                handleUpdateQuestionInForm(qIdx, { passage: e.target.value })
                              }
                              placeholder="Nhập đoạn văn cụ thể bằng tiếng Hàn..."
                              className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-xs text-slate-900"
                            />
                          </div>
                        )}
                      </div>

                      {/* 4 đáp án A/B/C/D + Chọn đáp án đúng */}
                      <div className="mt-3 grid gap-2 sm:grid-cols-2">
                        {q.options.map((opt, optIdx) => {
                          const letter = 'ABCD'[optIdx]
                          const isCorrect = q.correctIndex === optIdx
                          return (
                            <div key={optIdx} className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  handleUpdateQuestionInForm(qIdx, { correctIndex: optIdx })
                                }
                                title="Bấm để chọn làm đáp án đúng"
                                className={cn(
                                  'flex size-8 shrink-0 items-center justify-center rounded-lg border text-xs font-bold transition',
                                  isCorrect
                                    ? 'border-emerald-600 bg-emerald-600 text-white'
                                    : 'border-slate-300 bg-slate-100 text-slate-700 hover:bg-slate-200',
                                )}
                              >
                                {isCorrect ? <Check className="size-4" /> : letter}
                              </button>
                              <input
                                type="text"
                                required
                                value={opt}
                                onChange={(e) => {
                                  const nextOpts = [...q.options]
                                  nextOpts[optIdx] = e.target.value
                                  handleUpdateQuestionInForm(qIdx, { options: nextOpts })
                                }}
                                placeholder={`Phương án ${letter}`}
                                className="h-9 flex-1 rounded-lg border border-slate-300 px-3 text-xs text-slate-900"
                              />
                            </div>
                          )
                        })}
                      </div>

                      <div className="mt-3">
                        <label className="block text-[11px] font-bold text-slate-600">
                          Giải thích đáp án (Hiển thị sau khi học viên nộp bài)
                        </label>
                        <input
                          type="text"
                          value={q.explanation || ''}
                          onChange={(e) =>
                            handleUpdateQuestionInForm(qIdx, { explanation: e.target.value })
                          }
                          placeholder="Giải thích ngắn gọn vì sao đáp án này đúng..."
                          className="mt-1 h-8 w-full rounded-lg border border-slate-300 px-3 text-xs text-slate-900"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 border-t border-slate-200 px-6 py-4">
                <button
                  type="button"
                  onClick={() => setEditorOpen(false)}
                  className="h-10 rounded-xl border border-slate-300 px-4 text-xs font-bold text-slate-700 hover:bg-slate-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-900 bg-[#2563EB] px-5 text-xs font-bold text-white shadow-sm hover:bg-blue-600 disabled:opacity-50"
                >
                  {saving && <Loader2 className="size-4 animate-spin" />}
                  <span>{editingExamId ? 'Lưu cập nhật đề thi' : 'Tạo đề thi mới'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
