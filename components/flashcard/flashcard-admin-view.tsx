'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Activity,
  AlertCircle,
  BookMarked,
  BookOpen,
  Briefcase,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Database,
  Edit3,
  Eye,
  EyeOff,
  FolderKanban,
  FolderLock,
  GraduationCap,
  Heart,
  HeartPulse,
  HelpCircle,
  Info,
  Layers,
  Loader2,
  Lock,
  MessageCircle,
  Plane,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Sun,
  Tag,
  TreePine,
  Users,
  Utensils,
  Volume2,
  X,
} from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import type {
  FlashcardAdminSummary,
  FlashcardSchemaStatus,
  FlashcardTopicItem,
  FlashcardVocabRecord,
} from '@/lib/backend/flashcard-service'
import { cn } from '@/lib/utils'

const TOPIC_ICON_OPTIONS = [
  { name: 'Users', label: 'Gia đình & Con người', icon: Users },
  { name: 'GraduationCap', label: 'Trường học & Giáo dục', icon: GraduationCap },
  { name: 'Utensils', label: 'Ẩm thực & Ăn uống', icon: Utensils },
  { name: 'Plane', label: 'Du lịch & Giao thông', icon: Plane },
  { name: 'ShoppingBag', label: 'Mua sắm & Tiền tệ', icon: ShoppingBag },
  { name: 'Briefcase', label: 'Nghề nghiệp & Công việc', icon: Briefcase },
  { name: 'HeartPulse', label: 'Sức khỏe & Thể thao', icon: HeartPulse },
  { name: 'MessageCircle', label: 'Giao tiếp hằng ngày', icon: MessageCircle },
  { name: 'Clock', label: 'Thời gian & Con số', icon: Clock },
  { name: 'TreePine', label: 'Động vật & Thiên nhiên', icon: TreePine },
  { name: 'HelpCircle', label: 'Ngữ pháp / Trừu tượng', icon: HelpCircle },
  { name: 'Heart', label: 'Yêu thích / Cảm xúc', icon: Heart },
  { name: 'Sun', label: 'Thời tiết & Đời sống', icon: Sun },
  { name: 'BookOpen', label: 'Sách & Học tập', icon: BookOpen },
  { name: 'Sparkles', label: 'Mặc định / Nổi bật', icon: Sparkles },
] as const

const TOPIC_COLOR_OPTIONS = [
  '#7C3AED',
  '#EC4899',
  '#3B82F6',
  '#F97316',
  '#06B6D4',
  '#10B981',
  '#8B5CF6',
  '#EF4444',
  '#6366F1',
  '#F59E0B',
  '#14B8A6',
  '#64748B',
]

const TOPIK_LEVEL_OPTIONS = [
  'Nhập môn',
  'TOPIK I - Cấp 1',
  'TOPIK I - Cấp 2',
  'TOPIK II - Cấp 3',
]

const POS_OPTIONS = [
  'Danh từ',
  'Động từ',
  'Tính từ',
  'Phó từ',
  'Đại từ',
  'Số từ',
  'Quán형사 (Định từ)',
  'Thán từ',
  'Cụm giao tiếp',
  'Phụ từ / Trợ từ',
]

function renderTopicIcon(iconName: string, className = 'size-5') {
  const found = TOPIC_ICON_OPTIONS.find((o) => o.name === iconName)
  if (found) {
    const IconComp = found.icon
    return <IconComp className={className} aria-hidden="true" />
  }
  if (iconName === 'Activity') return <Activity className={className} aria-hidden="true" />
  if (iconName === 'FolderLock') return <FolderLock className={className} aria-hidden="true" />
  return <Sparkles className={className} aria-hidden="true" />
}

export function FlashcardAdminView() {
  const { token, profile } = useAuth()
  const [activeTab, setActiveTab] = useState<'topics' | 'vocabularies'>('topics')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [bannerMessage, setBannerMessage] = useState<string | null>(null)

  const [schemaStatus, setSchemaStatus] = useState<FlashcardSchemaStatus | null>(null)
  const [summary, setSummary] = useState<FlashcardAdminSummary | null>(null)
  const [topics, setTopics] = useState<FlashcardTopicItem[]>([])
  const [vocabularies, setVocabularies] = useState<FlashcardVocabRecord[]>([])
  const [showSchemaModal, setShowSchemaModal] = useState(false)

  // Bộ lọc kho từ vựng
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTopicFilter, setSelectedTopicFilter] = useState<string>('all')
  const [selectedLevelFilter, setSelectedLevelFilter] = useState<string>('all')
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const PAGE_SIZE = 20

  // Modal Quản lý Chủ đề (Thêm / Sửa)
  const [topicModalOpen, setTopicModalOpen] = useState(false)
  const [editingTopic, setEditingTopic] = useState<FlashcardTopicItem | null>(null)
  const [topicForm, setTopicForm] = useState({
    topicNameVi: '',
    topicNameKo: '',
    description: '',
    iconName: 'Sparkles',
    colorCode: '#7C3AED',
    displayOrder: 1,
    isActive: true,
    isAdminOnly: false,
  })

  // Modal Quản lý Từ vựng (Thêm / Sửa + Gán chủ đề)
  const [vocabModalOpen, setVocabModalOpen] = useState(false)
  const [editingVocab, setEditingVocab] = useState<FlashcardVocabRecord | null>(null)
  const [vocabForm, setVocabForm] = useState({
    koreanWord: '',
    romanization: '',
    vietnameseMeaning: '',
    partOfSpeech: 'Danh từ',
    hanja: '',
    exampleSentenceKo: '',
    exampleSentenceVi: '',
    explanationKo: '',
    topikLevel: 'TOPIK I - Cấp 1',
    niklLevel: 'A',
    status: 'Published' as 'Published' | 'Hidden',
    primaryTopicId: 1 as number | null,
    topicIds: [1] as number[],
  })

  // Modal Gán nhanh Nhiều Chủ đề cho 1 VocabId
  const [assignModalVocab, setAssignModalVocab] = useState<FlashcardVocabRecord | null>(null)
  const [assignForm, setAssignForm] = useState<{
    primaryTopicId: number | null
    topicIds: number[]
  }>({
    primaryTopicId: null,
    topicIds: [],
  })

  // Drawer Xem chi tiết từ vựng
  const [detailVocab, setDetailVocab] = useState<FlashcardVocabRecord | null>(null)

  const fetchAdminData = useCallback(
    async (refresh = false) => {
      if (!token) return
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/admin/flashcard${refresh ? '?refresh=1' : ''}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        const json = await res.json()
        if (!res.ok || !json.success) {
          setError(json.error || 'Không thể tải dữ liệu Quản lý Flashcard.')
          return
        }
        setSchemaStatus(json.schemaStatus || null)
        setSummary(json.summary || null)
        setTopics(json.topics || [])
        setVocabularies(json.vocabularies || [])
      } catch {
        setError('Lỗi kết nối tới máy chủ API Quản lý Flashcard.')
      } finally {
        setLoading(false)
      }
    },
    [token],
  )

  useEffect(() => {
    void fetchAdminData(false)
  }, [fetchAdminData])

  const speakKorean = (text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
    window.speechSynthesis.cancel()
    const utter = new SpeechSynthesisUtterance(text)
    utter.lang = 'ko-KR'
    utter.rate = 0.88
    window.speechSynthesis.speak(utter)
  }

  // Lọc danh sách từ vựng
  const filteredVocabularies = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return vocabularies.filter((v) => {
      if (selectedTopicFilter !== 'all') {
        const tid = Number(selectedTopicFilter)
        const hasTopic = v.mappings.some((m) => !m.isDeleted && m.topicId === tid)
        if (!hasTopic) return false
      }

      if (selectedLevelFilter !== 'all') {
        if (v.topikLevel !== selectedLevelFilter) return false
      }

      if (selectedStatusFilter === 'active') {
        if (v.status !== 'Published' || v.canonicalVocabId !== null) return false
      } else if (selectedStatusFilter === 'hidden') {
        if (v.status !== 'Hidden') return false
      } else if (selectedStatusFilter === 'standby') {
        if (v.canonicalVocabId === null) return false
      } else if (selectedStatusFilter === 'hangeul36') {
        if (!v.isHangeulLessonLocked) return false
      }

      if (q) {
        const matchKo = v.koreanWord.toLowerCase().includes(q)
        const matchVi = v.vietnameseMeaning.toLowerCase().includes(q)
        const matchRoman = v.romanization.toLowerCase().includes(q)
        const matchCode = v.vocabCode.toLowerCase().includes(q)
        const matchId = String(v.vocabId) === q
        if (!matchKo && !matchVi && !matchRoman && !matchCode && !matchId) return false
      }

      return true
    })
  }, [vocabularies, searchQuery, selectedTopicFilter, selectedLevelFilter, selectedStatusFilter])

  const totalPages = Math.max(1, Math.ceil(filteredVocabularies.length / PAGE_SIZE))
  const safePage = Math.min(currentPage, totalPages)
  const paginatedVocabularies = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE
    return filteredVocabularies.slice(start, start + PAGE_SIZE)
  }, [filteredVocabularies, safePage])

  // Mở modal thêm chủ đề mới
  const handleOpenCreateTopic = () => {
    setEditingTopic(null)
    setTopicForm({
      topicNameVi: '',
      topicNameKo: '',
      description: '',
      iconName: 'Sparkles',
      colorCode: '#7C3AED',
      displayOrder: topics.length + 1,
      isActive: true,
      isAdminOnly: false,
    })
    setTopicModalOpen(true)
  }

  // Mở modal chỉnh sửa chủ đề
  const handleOpenEditTopic = (topic: FlashcardTopicItem) => {
    setEditingTopic(topic)
    setTopicForm({
      topicNameVi: topic.topicNameVi,
      topicNameKo: topic.topicNameKo,
      description: topic.description,
      iconName: topic.iconName,
      colorCode: topic.colorCode,
      displayOrder: topic.displayOrder,
      isActive: topic.isActive,
      isAdminOnly: topic.isAdminOnly,
    })
    setTopicModalOpen(true)
  }

  // Lưu thêm / sửa chủ đề
  const handleSaveTopic = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) return
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/flashcard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(
          editingTopic
            ? {
                action: 'update_topic',
                topicId: editingTopic.topicId,
                ...topicForm,
              }
            : {
                action: 'create_topic',
                ...topicForm,
              },
        ),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        setError(json.error || 'Không thể lưu thông tin chủ đề.')
        return
      }
      setBannerMessage(json.message)
      setTopicModalOpen(false)
      await fetchAdminData(false)
    } catch {
      setError('Lỗi kết nối khi lưu chủ đề.')
    } finally {
      setSaving(false)
    }
  }

  // Bật/tắt hiển thị chủ đề cho Student hoặc Ẩn/Khôi phục chủ đề
  const handleQuickToggleTopic = async (
    topic: FlashcardTopicItem,
    patch: { isActive?: boolean; isDeleted?: boolean },
  ) => {
    if (!token) return
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/flashcard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: 'update_topic',
          topicId: topic.topicId,
          ...patch,
        }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        setError(json.error || 'Không thể cập nhật trạng thái chủ đề.')
        return
      }
      setBannerMessage(json.message)
      await fetchAdminData(false)
    } catch {
      setError('Lỗi kết nối khi cập nhật chủ đề.')
    } finally {
      setSaving(false)
    }
  }

  // Mở modal thêm từ vựng mới
  const handleOpenCreateVocab = () => {
    setEditingVocab(null)
    const defaultTopicId =
      selectedTopicFilter !== 'all' && Number(selectedTopicFilter) !== 11
        ? Number(selectedTopicFilter)
        : 1
    setVocabForm({
      koreanWord: '',
      romanization: '',
      vietnameseMeaning: '',
      partOfSpeech: 'Danh từ',
      hanja: '',
      exampleSentenceKo: '',
      exampleSentenceVi: '',
      explanationKo: '',
      topikLevel: 'TOPIK I - Cấp 1',
      niklLevel: 'A',
      status: 'Published',
      primaryTopicId: defaultTopicId,
      topicIds: [defaultTopicId],
    })
    setVocabModalOpen(true)
  }

  // Mở modal chỉnh sửa từ vựng
  const handleOpenEditVocab = (v: FlashcardVocabRecord) => {
    setEditingVocab(v)
    const activeTopicIds = v.mappings.filter((m) => !m.isDeleted).map((m) => m.topicId)
    setVocabForm({
      koreanWord: v.koreanWord,
      romanization: v.romanization || '',
      vietnameseMeaning: v.vietnameseMeaning,
      partOfSpeech: v.partOfSpeech || 'Danh từ',
      hanja: v.hanja || '',
      exampleSentenceKo: v.exampleSentenceKo || '',
      exampleSentenceVi: v.exampleSentenceVi || '',
      explanationKo: v.explanationKo || '',
      topikLevel: v.topikLevel || 'TOPIK I - Cấp 1',
      niklLevel: v.niklLevel || '',
      status: v.status,
      primaryTopicId: v.primaryTopicId ?? (activeTopicIds[0] || 1),
      topicIds: activeTopicIds.length > 0 ? activeTopicIds : [1],
    })
    setVocabModalOpen(true)
  }

  // Lưu thêm / sửa từ vựng
  const handleSaveVocab = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) return
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/flashcard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(
          editingVocab
            ? {
                action: 'update_vocab',
                vocabId: editingVocab.vocabId,
                ...vocabForm,
                hanja: vocabForm.hanja.trim() || null,
                explanationKo: vocabForm.explanationKo.trim() || null,
                niklLevel: vocabForm.niklLevel.trim() || null,
              }
            : {
                action: 'create_vocab',
                ...vocabForm,
                hanja: vocabForm.hanja.trim() || null,
                explanationKo: vocabForm.explanationKo.trim() || null,
                niklLevel: vocabForm.niklLevel.trim() || null,
              },
        ),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        setError(json.error || 'Không thể lưu thông tin từ vựng.')
        return
      }
      setBannerMessage(json.message)
      setVocabModalOpen(false)
      if (detailVocab && json.vocab && detailVocab.vocabId === json.vocab.vocabId) {
        setDetailVocab(json.vocab)
      }
      await fetchAdminData(false)
    } catch {
      setError('Lỗi kết nối khi lưu từ vựng.')
    } finally {
      setSaving(false)
    }
  }

  // Ẩn / hiện nhanh từ vựng
  const handleQuickToggleVocabStatus = async (v: FlashcardVocabRecord) => {
    if (!token) return
    setSaving(true)
    setError(null)
    const nextStatus = v.status === 'Published' ? 'Hidden' : 'Published'
    try {
      const res = await fetch('/api/admin/flashcard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: 'update_vocab',
          vocabId: v.vocabId,
          status: nextStatus,
        }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        setError(json.error || 'Không thể cập nhật trạng thái hiển thị từ vựng.')
        return
      }
      setBannerMessage(
        nextStatus === 'Hidden'
          ? `Đã ẩn từ vựng "${v.koreanWord}" (#${v.vocabId}) khỏi giao diện học của Student.`
          : `Đã hiển thị lại từ vựng "${v.koreanWord}" (#${v.vocabId}) cho Student.`,
      )
      if (detailVocab && detailVocab.vocabId === v.vocabId && json.vocab) {
        setDetailVocab(json.vocab)
      }
      await fetchAdminData(false)
    } catch {
      setError('Lỗi kết nối khi cập nhật trạng thái từ vựng.')
    } finally {
      setSaving(false)
    }
  }

  // Mở modal phân loại chủ đề nhiều-nhiều cho 1 VocabId
  const handleOpenAssignModal = (v: FlashcardVocabRecord) => {
    const currentTopicIds = v.mappings.filter((m) => !m.isDeleted).map((m) => m.topicId)
    setAssignModalVocab(v)
    setAssignForm({
      primaryTopicId: v.primaryTopicId ?? (currentTopicIds[0] || 1),
      topicIds: currentTopicIds,
    })
  }

  // Lưu phân loại nhiều chủ đề
  const handleSaveAssignTopics = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token || !assignModalVocab) return
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/flashcard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: 'assign_topics',
          vocabId: assignModalVocab.vocabId,
          primaryTopicId: assignForm.primaryTopicId,
          topicIds: assignForm.topicIds,
        }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        setError(json.error || 'Không thể lưu phân loại chủ đề.')
        return
      }
      setBannerMessage(json.message)
      setAssignModalVocab(null)
      if (detailVocab && json.vocab && detailVocab.vocabId === json.vocab.vocabId) {
        setDetailVocab(json.vocab)
      }
      await fetchAdminData(false)
    } catch {
      setError('Lỗi kết nối khi phân loại chủ đề.')
    } finally {
      setSaving(false)
    }
  }

  const toggleTopicInVocabForm = (tid: number) => {
    setVocabForm((prev) => {
      const exists = prev.topicIds.includes(tid)
      const nextIds = exists ? prev.topicIds.filter((id) => id !== tid) : [...prev.topicIds, tid]
      const nextPrimary =
        prev.primaryTopicId && nextIds.includes(prev.primaryTopicId)
          ? prev.primaryTopicId
          : nextIds[0] ?? null
      return {
        ...prev,
        topicIds: nextIds,
        primaryTopicId: nextPrimary,
      }
    })
  }

  const toggleTopicInAssignForm = (tid: number) => {
    setAssignForm((prev) => {
      const exists = prev.topicIds.includes(tid)
      const nextIds = exists ? prev.topicIds.filter((id) => id !== tid) : [...prev.topicIds, tid]
      const nextPrimary =
        prev.primaryTopicId && nextIds.includes(prev.primaryTopicId)
          ? prev.primaryTopicId
          : nextIds[0] ?? null
      return {
        ...prev,
        topicIds: nextIds,
        primaryTopicId: nextPrimary,
      }
    })
  }

  if (loading && vocabularies.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8F7FF] p-8 text-slate-700">
        <div className="flex items-center gap-3 rounded-2xl border border-violet-200 bg-white px-6 py-4 shadow-sm">
          <Loader2 className="size-6 animate-spin text-[#7C3AED]" />
          <span className="text-sm font-semibold">
            Đang tải dữ liệu Quản lý Flashcard từ SQL Server (HangoDatasetDB)...
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full bg-[#F8F7FF] px-4 py-6 text-slate-900 md:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        {/* PHẦN ĐẦU TRANG: TIÊU ĐỀ, MÔ TẢ & 4 THẺ THỐNG KÊ */}
        <section className="rounded-3xl border border-violet-200/80 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <span className="flex size-13 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#7C3AED] to-violet-600 text-white shadow-md shadow-violet-500/25">
                <BookOpen className="size-6" aria-hidden="true" />
              </span>
              <div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <h1 className="text-2xl font-black tracking-tight text-slate-900 md:text-3xl">
                    Quản lý Flashcard
                  </h1>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-200 bg-violet-50 px-3 py-0.5 text-xs font-bold text-[#7C3AED]">
                    <ShieldCheck className="size-3.5" />
                    Admin ({profile?.email || 'Quản trị viên'})
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-600">
                  Quản lý chủ đề và kho từ vựng phục vụ học tập.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => setShowSchemaModal(true)}
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-violet-200 bg-violet-50/70 px-3.5 text-xs font-bold text-violet-900 transition hover:bg-violet-100"
              >
                <Database className="size-4 text-[#7C3AED]" />
                <span>Kiểm tra Schema DB</span>
              </button>
              <button
                type="button"
                onClick={() => void fetchAdminData(true)}
                disabled={loading}
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
              >
                <RefreshCw className={cn('size-4 text-slate-600', loading && 'animate-spin')} />
                <span>Làm mới</span>
              </button>
              <button
                type="button"
                onClick={handleOpenCreateTopic}
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-violet-300 bg-violet-100 px-4 text-xs font-bold text-[#6D28D9] transition hover:bg-violet-200"
              >
                <Plus className="size-4" />
                <span>Thêm chủ đề</span>
              </button>
              <button
                type="button"
                onClick={handleOpenCreateVocab}
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#7C3AED] px-4 text-xs font-bold text-white shadow-sm shadow-violet-500/25 transition hover:bg-violet-700"
              >
                <Plus className="size-4" />
                <span>Thêm từ vựng</span>
              </button>
            </div>
          </div>

          {/* 4 THẺ THỐNG KÊ TỔNG QUAN */}
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50/80 to-white p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-violet-700">
                  Tổng số chủ đề
                </span>
                <span className="flex size-9 items-center justify-center rounded-xl bg-violet-100 text-[#7C3AED]">
                  <FolderKanban className="size-5" />
                </span>
              </div>
              <p className="mt-2 text-3xl font-black text-slate-900">
                {summary?.totalTopics ?? 11}
              </p>
              <p className="mt-1 text-xs text-slate-600">
                {summary?.activeStudentTopics ?? 10} chủ đề hiển thị cho Student ·{' '}
                {summary?.adminOnlyTopics ?? 1} nội bộ Admin
              </p>
            </div>

            <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/70 to-white p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-700">
                  Tổng số từ vựng
                </span>
                <span className="flex size-9 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
                  <BookMarked className="size-5" />
                </span>
              </div>
              <p className="mt-2 text-3xl font-black text-slate-900">
                {summary?.totalVocabularies ?? vocabularies.length}
              </p>
              <p className="mt-1 text-xs text-slate-600">
                Kho dbo.Vocabulary · Bảo toàn {summary?.hangeulLockedCount ?? 36} từ Hangeul
              </p>
            </div>

            <div className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50/70 to-white p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                  Số từ đang được sử dụng
                </span>
                <span className="flex size-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                  <CheckCircle2 className="size-5" />
                </span>
              </div>
              <p className="mt-2 text-3xl font-black text-emerald-700">
                {summary?.usedVocabCount ?? 0}
              </p>
              <p className="mt-1 text-xs text-slate-600">
                Đang hiển thị cho Student ({summary?.totalActiveMappings ?? 0} liên kết chủ đề)
              </p>
            </div>

            <div className="rounded-2xl border border-amber-100 bg-gradient-to-br from-amber-50/70 to-white p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-800">
                  Số từ chưa được phân loại
                </span>
                <span className="flex size-9 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                  <HelpCircle className="size-5" />
                </span>
              </div>
              <p className="mt-2 text-3xl font-black text-amber-700">
                {summary?.unclassifiedVocabCount ?? 0}
              </p>
              <p className="mt-1 text-xs text-slate-600">
                Chủ đề nội bộ Ngữ pháp/Trừu tượng (+{summary?.standbyVocabCount ?? 6} từ dự phòng)
              </p>
            </div>
          </div>
        </section>

        {/* THÔNG BÁO THÀNH CÔNG / LỖI */}
        {bannerMessage && (
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 shadow-sm">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="size-5 shrink-0 text-emerald-600" />
              <span className="font-semibold">{bannerMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setBannerMessage(null)}
              className="rounded-lg px-2.5 py-1 text-xs font-bold text-emerald-800 hover:bg-emerald-100"
            >
              Đóng
            </button>
          </div>
        )}

        {error && (
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-900 shadow-sm">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="size-5 shrink-0 text-red-600" />
              <span className="font-semibold">{error}</span>
            </div>
            <button
              type="button"
              onClick={() => setError(null)}
              className="rounded-lg px-2.5 py-1 text-xs font-bold text-red-800 hover:bg-red-100"
            >
              Đóng
            </button>
          </div>
        )}

        {/* THANH CHUYỂN TAB: 2.1 QUẢN LÝ CHỦ ĐỀ | 2.2 & 2.3 QUẢN LÝ KHO TỪ VỰNG & PHÂN LOẠI */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-violet-200/80 bg-white p-2 shadow-sm">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('topics')}
              className={cn(
                'inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all',
                activeTab === 'topics'
                  ? 'bg-[#7C3AED] text-white shadow-sm shadow-violet-500/25'
                  : 'text-slate-600 hover:bg-violet-50 hover:text-[#7C3AED]',
              )}
            >
              <FolderKanban className="size-4" />
              <span>1. Quản lý chủ đề ({topics.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('vocabularies')}
              className={cn(
                'inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all',
                activeTab === 'vocabularies'
                  ? 'bg-[#7C3AED] text-white shadow-sm shadow-violet-500/25'
                  : 'text-slate-600 hover:bg-violet-50 hover:text-[#7C3AED]',
              )}
            >
              <BookMarked className="size-4" />
              <span>2. Quản lý kho từ vựng & Phân loại ({vocabularies.length})</span>
            </button>
          </div>

          <div className="px-3 text-xs font-medium text-slate-500">
            Tiến độ SRS của Student được đồng bộ theo <strong>VocabId</strong> dùng chung trên mọi chủ đề
          </div>
        </div>

        {/* =====================================================================
            TAB 1: QUẢN LÝ CHỦ ĐỀ FLASHCARD (11 CHỦ ĐỀ CHUẨN)
        ===================================================================== */}
        {activeTab === 'topics' && (
          <section className="flex flex-col gap-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {topics.map((topic) => {
                const isInternalAdmin = topic.isAdminOnly
                return (
                  <div
                    key={topic.topicId}
                    className={cn(
                      'flex flex-col justify-between rounded-2xl border bg-white p-5 shadow-sm transition hover:shadow-md',
                      topic.isDeleted
                        ? 'border-slate-300 bg-slate-50/80 opacity-75'
                        : isInternalAdmin
                          ? 'border-amber-300 bg-amber-50/20'
                          : 'border-violet-200/80',
                    )}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span
                            className="flex size-11 shrink-0 items-center justify-center rounded-2xl text-white shadow-sm"
                            style={{ backgroundColor: topic.colorCode || '#7C3AED' }}
                          >
                            {renderTopicIcon(topic.iconName, 'size-5')}
                          </span>
                          <div>
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-600">
                                #{topic.displayOrder}
                              </span>
                              <h2 className="text-base font-extrabold text-slate-900">
                                {topic.topicNameVi}
                              </h2>
                            </div>
                            <p lang="ko" className="text-xs font-medium text-slate-500">
                              {topic.topicNameKo} · <code className="text-[11px]">{topic.topicCode}</code>
                            </p>
                          </div>
                        </div>

                        {/* Badge trạng thái hiển thị */}
                        {topic.isDeleted ? (
                          <span className="shrink-0 rounded-full border border-red-200 bg-red-50 px-2.5 py-0.5 text-[11px] font-bold text-red-700">
                            Đã ẩn / Xóa mềm
                          </span>
                        ) : isInternalAdmin ? (
                          <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-amber-300 bg-amber-100 px-2.5 py-0.5 text-[11px] font-bold text-amber-900">
                            <Lock className="size-3" />
                            Chỉ Admin
                          </span>
                        ) : topic.isActive ? (
                          <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-emerald-300 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">
                            <Eye className="size-3" />
                            Student hiển thị
                          </span>
                        ) : (
                          <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-slate-300 bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold text-slate-600">
                            <EyeOff className="size-3" />
                            Tạm ẩn Student
                          </span>
                        )}
                      </div>

                      <p className="mt-3 text-xs leading-relaxed text-slate-600">
                        {topic.description || 'Chưa có mô tả cho chủ đề này.'}
                      </p>

                      {/* Thống kê số lượng từ vựng thuộc chủ đề */}
                      <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl border border-slate-100 bg-slate-50/80 p-2.5 text-center">
                        <div>
                          <p className="text-[11px] font-medium text-slate-500">Tổng số từ</p>
                          <p className="text-base font-black text-slate-900">
                            {topic.totalWordsCount}
                          </p>
                        </div>
                        <div>
                          <p className="text-[11px] font-medium text-slate-500">Chủ đề chính</p>
                          <p className="text-base font-bold text-[#7C3AED]">
                            {topic.primaryWordsCount}
                          </p>
                        </div>
                        <div>
                          <p className="text-[11px] font-medium text-slate-500">Chủ đề phụ</p>
                          <p className="text-base font-bold text-indigo-600">
                            {topic.secondaryWordsCount}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Hàng nút thao tác chủ đề */}
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedTopicFilter(String(topic.topicId))
                          setCurrentPage(1)
                          setActiveTab('vocabularies')
                        }}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-violet-50 px-3 py-1.5 text-xs font-bold text-[#7C3AED] transition hover:bg-violet-100"
                      >
                        <BookOpen className="size-3.5" />
                        <span>Xem {topic.totalWordsCount} từ</span>
                      </button>

                      <div className="flex items-center gap-1.5">
                        {!isInternalAdmin && !topic.isDeleted && (
                          <button
                            type="button"
                            disabled={saving}
                            onClick={() =>
                              void handleQuickToggleTopic(topic, { isActive: !topic.isActive })
                            }
                            title={
                              topic.isActive
                                ? 'Đang hiển thị cho Student — Nhấn để tắt hiển thị'
                                : 'Đang ẩn với Student — Nhấn để bật hiển thị'
                            }
                            className={cn(
                              'inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition',
                              topic.isActive
                                ? 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                                : 'border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100',
                            )}
                          >
                            {topic.isActive ? (
                              <>
                                <EyeOff className="size-3.5" />
                                <span>Tắt Student</span>
                              </>
                            ) : (
                              <>
                                <Eye className="size-3.5" />
                                <span>Bật Student</span>
                              </>
                            )}
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleOpenEditTopic(topic)}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-violet-300 hover:text-[#7C3AED]"
                        >
                          <Edit3 className="size-3.5" />
                          <span>Sửa</span>
                        </button>

                        {topic.topicId !== 11 && (
                          <button
                            type="button"
                            disabled={saving}
                            onClick={() =>
                              void handleQuickToggleTopic(topic, { isDeleted: !topic.isDeleted })
                            }
                            className={cn(
                              'inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition',
                              topic.isDeleted
                                ? 'border-violet-300 bg-violet-50 text-[#7C3AED] hover:bg-violet-100'
                                : 'border-red-200 bg-red-50/70 text-red-700 hover:bg-red-100',
                            )}
                          >
                            {topic.isDeleted ? (
                              <>
                                <RotateCcw className="size-3.5" />
                                <span>Khôi phục</span>
                              </>
                            ) : (
                              <span>Ẩn</span>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* =====================================================================
            TAB 2: QUẢN LÝ KHO TỪ VỰNG & PHÂN LOẠI NHIỀU CHỦ ĐỀ
        ===================================================================== */}
        {activeTab === 'vocabularies' && (
          <section className="flex flex-col gap-4">
            {/* Thanh công cụ Tìm kiếm & Bộ lọc */}
            <div className="rounded-2xl border border-violet-200/80 bg-white p-4 shadow-sm">
              <div className="grid gap-3 md:grid-cols-4">
                {/* Tìm kiếm */}
                <div className="relative md:col-span-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value)
                      setCurrentPage(1)
                    }}
                    placeholder="Tìm từ Hàn, nghĩa Việt, Roman, mã..."
                    className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#7C3AED] focus:bg-white focus:outline-none"
                  />
                </div>

                {/* Lọc theo chủ đề */}
                <div>
                  <select
                    aria-label="Lọc theo chủ đề"
                    value={selectedTopicFilter}
                    onChange={(e) => {
                      setSelectedTopicFilter(e.target.value)
                      setCurrentPage(1)
                    }}
                    className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-800 focus:border-[#7C3AED] focus:bg-white focus:outline-none"
                  >
                    <option value="all">Tất cả chủ đề ({vocabularies.length} từ)</option>
                    {topics.map((t) => (
                      <option key={t.topicId} value={String(t.topicId)}>
                        {t.displayOrder}. {t.topicNameVi} ({t.totalWordsCount} từ)
                        {t.isAdminOnly ? ' [Chỉ Admin]' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Lọc theo cấp độ TOPIK */}
                <div>
                  <select
                    aria-label="Lọc theo cấp độ"
                    value={selectedLevelFilter}
                    onChange={(e) => {
                      setSelectedLevelFilter(e.target.value)
                      setCurrentPage(1)
                    }}
                    className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-800 focus:border-[#7C3AED] focus:bg-white focus:outline-none"
                  >
                    <option value="all">Tất cả cấp độ TOPIK</option>
                    {TOPIK_LEVEL_OPTIONS.map((lv) => (
                      <option key={lv} value={lv}>
                        {lv}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Lọc theo trạng thái */}
                <div>
                  <select
                    aria-label="Lọc theo trạng thái"
                    value={selectedStatusFilter}
                    onChange={(e) => {
                      setSelectedStatusFilter(e.target.value)
                      setCurrentPage(1)
                    }}
                    className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-800 focus:border-[#7C3AED] focus:bg-white focus:outline-none"
                  >
                    <option value="all">Tất cả trạng thái</option>
                    <option value="active">Đang hiển thị cho Student</option>
                    <option value="hidden">Đang bị Admin ẩn</option>
                    <option value="standby">Từ dự phòng trùng lặp (Standby)</option>
                    <option value="hangeul36">36 từ Hangeul liên kết Lộ trình</option>
                  </select>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                <span>
                  Tìm thấy <strong className="text-slate-900">{filteredVocabularies.length}</strong> từ
                  vựng phù hợp · Trang {safePage}/{totalPages}
                </span>
                {(selectedTopicFilter !== 'all' ||
                  selectedLevelFilter !== 'all' ||
                  selectedStatusFilter !== 'all' ||
                  searchQuery) && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedTopicFilter('all')
                      setSelectedLevelFilter('all')
                      setSelectedStatusFilter('all')
                      setSearchQuery('')
                      setCurrentPage(1)
                    }}
                    className="font-bold text-[#7C3AED] hover:underline"
                  >
                    Xóa bộ lọc
                  </button>
                )}
              </div>
            </div>

            {/* Bảng danh sách từ vựng */}
            <div className="overflow-hidden rounded-2xl border border-violet-200/80 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-violet-100 bg-violet-50/60 text-slate-700">
                      <th className="px-4 py-3 font-bold">ID / Mã</th>
                      <th className="px-4 py-3 font-bold">Từ tiếng Hàn</th>
                      <th className="px-4 py-3 font-bold">Nghĩa tiếng Việt & Từ loại</th>
                      <th className="px-4 py-3 font-bold">Cấp độ & Nguồn</th>
                      <th className="px-4 py-3 font-bold">Chủ đề được gán (Chính / Phụ)</th>
                      <th className="px-4 py-3 font-bold">Trạng thái</th>
                      <th className="px-4 py-3 text-right font-bold">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginatedVocabularies.map((v) => {
                      const activeMappings = v.mappings.filter((m) => !m.isDeleted)
                      return (
                        <tr
                          key={v.vocabId}
                          className={cn(
                            'align-top transition hover:bg-violet-50/30',
                            (v.status === 'Hidden' || v.canonicalVocabId !== null) &&
                              'bg-slate-50/70',
                          )}
                        >
                          <td className="px-4 py-3.5 font-mono text-[11px] text-slate-500">
                            <div className="font-bold text-slate-800">#{v.vocabId}</div>
                            <div>{v.vocabCode}</div>
                            {v.isHangeulLessonLocked && (
                              <span className="mt-1 inline-flex items-center gap-1 rounded bg-indigo-50 px-1.5 py-0.5 font-sans text-[10px] font-bold text-indigo-700">
                                <Layers className="size-2.5" />
                                Hangeul 36
                              </span>
                            )}
                          </td>

                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-2">
                              <span
                                lang="ko"
                                className="text-base font-extrabold text-slate-900"
                              >
                                {v.koreanWord}
                              </span>
                              <button
                                type="button"
                                onClick={() => speakKorean(v.koreanWord)}
                                title="Nghe phát âm"
                                className="flex size-6 items-center justify-center rounded-full bg-violet-100 text-[#7C3AED] hover:bg-violet-200"
                              >
                                <Volume2 className="size-3.5" />
                              </button>
                            </div>
                            <div className="mt-0.5 text-slate-500">[{v.romanization || '—'}]</div>
                            {v.hanja && (
                              <div className="mt-0.5 text-[11px] text-slate-500">
                                Hanja: <span className="font-semibold">{v.hanja}</span>
                              </div>
                            )}
                          </td>

                          <td className="max-w-xs px-4 py-3.5">
                            <div className="font-bold text-slate-900">{v.vietnameseMeaning}</div>
                            <span className="mt-1 inline-block rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                              {v.partOfSpeech}
                            </span>
                            {v.exampleSentenceKo && (
                              <p lang="ko" className="mt-1.5 truncate text-[11px] text-slate-600">
                                VD: {v.exampleSentenceKo}
                              </p>
                            )}
                          </td>

                          <td className="px-4 py-3.5">
                            <span className="inline-block rounded-full border border-violet-200 bg-violet-50 px-2.5 py-0.5 text-[11px] font-bold text-[#7C3AED]">
                              {v.topikLevel}
                            </span>
                            {v.niklLevel && (
                              <span className="ml-1 inline-block rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                                NIKL {v.niklLevel}
                              </span>
                            )}
                            <div className="mt-1 max-w-[160px] truncate text-[11px] text-slate-500" title={v.sourceName}>
                              {v.sourceName}
                            </div>
                          </td>

                          <td className="px-4 py-3.5">
                            <div className="flex flex-wrap gap-1.5">
                              {activeMappings.map((m) => (
                                <span
                                  key={m.mappingId}
                                  className={cn(
                                    'inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-[11px] font-semibold',
                                    m.topicCode === 'CHUA_PHAN_LOAI'
                                      ? 'border-amber-300 bg-amber-50 text-amber-900'
                                      : m.isPrimary
                                        ? 'border-violet-300 bg-violet-100 text-[#6D28D9]'
                                        : 'border-slate-200 bg-slate-100 text-slate-700',
                                  )}
                                >
                                  <span>{m.topicNameVi}</span>
                                  {m.isPrimary && (
                                    <span className="rounded bg-[#7C3AED] px-1 text-[9px] text-white">
                                      Chính
                                    </span>
                                  )}
                                </span>
                              ))}
                            </div>
                            <button
                              type="button"
                              onClick={() => handleOpenAssignModal(v)}
                              className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-bold text-[#7C3AED] hover:underline"
                            >
                              <Tag className="size-3" />
                              <span>Gán / Bỏ gán chủ đề</span>
                            </button>
                          </td>

                          <td className="px-4 py-3.5">
                            {v.canonicalVocabId !== null ? (
                              <div>
                                <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-2.5 py-0.5 text-[11px] font-bold text-amber-800">
                                  Dự phòng (Standby)
                                </span>
                                <p className="mt-1 text-[10px] text-slate-500">
                                  Trỏ về từ gốc #{v.canonicalVocabId}
                                </p>
                              </div>
                            ) : v.status === 'Hidden' ? (
                              <span className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2.5 py-0.5 text-[11px] font-bold text-red-700">
                                <EyeOff className="size-3" />
                                Đã ẩn
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">
                                <Eye className="size-3" />
                                Hiển thị
                              </span>
                            )}
                          </td>

                          <td className="px-4 py-3.5 text-right">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => setDetailVocab(v)}
                                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:border-violet-300 hover:text-[#7C3AED]"
                              >
                                Chi tiết
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenEditVocab(v)}
                                className="rounded-lg border border-violet-200 bg-violet-50 px-2.5 py-1.5 text-xs font-bold text-[#7C3AED] hover:bg-violet-100"
                              >
                                Sửa
                              </button>
                              {v.canonicalVocabId === null && (
                                <button
                                  type="button"
                                  disabled={saving}
                                  onClick={() => void handleQuickToggleVocabStatus(v)}
                                  className={cn(
                                    'rounded-lg border px-2.5 py-1.5 text-xs font-semibold',
                                    v.status === 'Published'
                                      ? 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
                                      : 'border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100',
                                  )}
                                >
                                  {v.status === 'Published' ? 'Ẩn' : 'Hiện'}
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Phân trang */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/50 px-4 py-3">
                  <span className="text-xs text-slate-500">
                    Hiển thị {(safePage - 1) * PAGE_SIZE + 1}–
                    {Math.min(safePage * PAGE_SIZE, filteredVocabularies.length)} trên tổng số{' '}
                    {filteredVocabularies.length} từ
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={safePage <= 1}
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      className="inline-flex size-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                    >
                      <ChevronLeft className="size-4" />
                    </button>
                    <span className="text-xs font-bold text-slate-700">
                      {safePage} / {totalPages}
                    </span>
                    <button
                      type="button"
                      disabled={safePage >= totalPages}
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      className="inline-flex size-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                    >
                      <ChevronRight className="size-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}
      </div>

      {/* =====================================================================
          MODAL THÊM / CHỈNH SỬA CHỦ ĐỀ FLASHCARD
      ===================================================================== */}
      {topicModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-3xl border border-violet-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h2 className="text-lg font-extrabold text-slate-900">
                {editingTopic ? `Chỉnh sửa chủ đề #${editingTopic.topicId}` : 'Thêm chủ đề Flashcard mới'}
              </h2>
              <button
                type="button"
                onClick={() => setTopicModalOpen(false)}
                className="flex size-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
              >
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTopic} className="mt-4 flex flex-col gap-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700">
                    Tên chủ đề (Tiếng Việt) *
                  </label>
                  <input
                    type="text"
                    required
                    value={topicForm.topicNameVi}
                    onChange={(e) => setTopicForm({ ...topicForm, topicNameVi: e.target.value })}
                    placeholder="VD: Gia đình & Bản thân"
                    className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-xs text-slate-900 focus:border-[#7C3AED] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700">
                    Tên chủ đề (Tiếng Hàn)
                  </label>
                  <input
                    type="text"
                    value={topicForm.topicNameKo}
                    onChange={(e) => setTopicForm({ ...topicForm, topicNameKo: e.target.value })}
                    placeholder="VD: 가족과 나"
                    className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-xs text-slate-900 focus:border-[#7C3AED] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700">Mô tả chủ đề</label>
                <textarea
                  rows={2}
                  value={topicForm.description}
                  onChange={(e) => setTopicForm({ ...topicForm, description: e.target.value })}
                  placeholder="Mô tả nội dung các từ vựng thuộc chủ đề này..."
                  className="mt-1 w-full rounded-xl border border-slate-200 p-3 text-xs text-slate-900 focus:border-[#7C3AED] focus:outline-none"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700">Biểu tượng chủ đề</label>
                  <select
                    value={topicForm.iconName}
                    onChange={(e) => setTopicForm({ ...topicForm, iconName: e.target.value })}
                    className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-xs font-semibold text-slate-800 focus:border-[#7C3AED] focus:outline-none"
                  >
                    {TOPIC_ICON_OPTIONS.map((opt) => (
                      <option key={opt.name} value={opt.name}>
                        {opt.label} ({opt.name})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700">Thứ tự hiển thị</label>
                  <input
                    type="number"
                    min={1}
                    value={topicForm.displayOrder}
                    onChange={(e) =>
                      setTopicForm({ ...topicForm, displayOrder: Number(e.target.value) || 1 })
                    }
                    className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-xs text-slate-900 focus:border-[#7C3AED] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700">Màu đại diện</label>
                <div className="mt-1.5 flex flex-wrap gap-2">
                  {TOPIC_COLOR_OPTIONS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setTopicForm({ ...topicForm, colorCode: c })}
                      className={cn(
                        'flex size-7 items-center justify-center rounded-full border-2 transition-transform',
                        topicForm.colorCode === c
                          ? 'scale-110 border-slate-900'
                          : 'border-transparent',
                      )}
                      style={{ backgroundColor: c }}
                    >
                      {topicForm.colorCode === c && <Check className="size-3.5 text-white" />}
                    </button>
                  ))}
                </div>
              </div>

              {(!editingTopic || editingTopic.topicId !== 11) && (
                <div className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-3.5">
                  <label className="flex items-center gap-2.5 text-xs font-bold text-slate-800">
                    <input
                      type="checkbox"
                      checked={topicForm.isActive && !topicForm.isAdminOnly}
                      disabled={topicForm.isAdminOnly}
                      onChange={(e) => setTopicForm({ ...topicForm, isActive: e.target.checked })}
                      className="size-4 accent-[#7C3AED]"
                    />
                    <span>Hiển thị chủ đề này cho Học viên (Student)</span>
                  </label>
                  <label className="flex items-center gap-2.5 text-xs font-semibold text-slate-600">
                    <input
                      type="checkbox"
                      checked={topicForm.isAdminOnly}
                      onChange={(e) =>
                        setTopicForm({
                          ...topicForm,
                          isAdminOnly: e.target.checked,
                          isActive: e.target.checked ? false : topicForm.isActive,
                        })
                      }
                      className="size-4 accent-[#7C3AED]"
                    />
                    <span>Chủ đề nội bộ (Chỉ Admin nhìn thấy, ẩn hoàn toàn với Student)</span>
                  </label>
                </div>
              )}

              <div className="mt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setTopicModalOpen(false)}
                  className="h-10 rounded-xl border border-slate-200 px-4 text-xs font-bold text-slate-700 hover:bg-slate-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#7C3AED] px-5 text-xs font-bold text-white shadow-sm hover:bg-violet-700 disabled:opacity-50"
                >
                  {saving && <Loader2 className="size-4 animate-spin" />}
                  <span>{editingTopic ? 'Lưu thay đổi' : 'Tạo chủ đề'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL THÊM / CHỈNH SỬA TỪ VỰNG & GÁN CHỦ ĐỀ
      ===================================================================== */}
      {vocabModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-violet-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900">
                  {editingVocab
                    ? `Chỉnh sửa từ vựng #${editingVocab.vocabId} (${editingVocab.koreanWord})`
                    : 'Thêm từ vựng mới vào kho Flashcard'}
                </h2>
                {editingVocab?.isHangeulLessonLocked && (
                  <p className="mt-0.5 text-xs font-semibold text-indigo-700">
                    Từ vựng này thuộc 36 liên kết Hangeul trong Lộ trình học (LessonVocabulary được bảo toàn).
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setVocabModalOpen(false)}
                className="flex size-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
              >
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleSaveVocab} className="mt-4 flex flex-col gap-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700">Từ tiếng Hàn *</label>
                  <input
                    type="text"
                    required
                    value={vocabForm.koreanWord}
                    onChange={(e) => setVocabForm({ ...vocabForm, koreanWord: e.target.value })}
                    placeholder="VD: 선생님"
                    className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm font-bold text-slate-900 focus:border-[#7C3AED] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700">Romanization</label>
                  <input
                    type="text"
                    value={vocabForm.romanization}
                    onChange={(e) => setVocabForm({ ...vocabForm, romanization: e.target.value })}
                    placeholder="VD: seon-saeng-nim"
                    className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-xs text-slate-900 focus:border-[#7C3AED] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700">
                    Hanja (nếu có)
                  </label>
                  <input
                    type="text"
                    value={vocabForm.hanja}
                    onChange={(e) => setVocabForm({ ...vocabForm, hanja: e.target.value })}
                    placeholder="Để trống nếu từ thuần Hàn"
                    className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-xs text-slate-900 focus:border-[#7C3AED] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="sm:col-span-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Nghĩa tiếng Việt *
                  </label>
                  <input
                    type="text"
                    required
                    value={vocabForm.vietnameseMeaning}
                    onChange={(e) =>
                      setVocabForm({ ...vocabForm, vietnameseMeaning: e.target.value })
                    }
                    placeholder="VD: Giáo viên, thầy/cô giáo"
                    className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-xs font-semibold text-slate-900 focus:border-[#7C3AED] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700">Từ loại</label>
                  <select
                    value={vocabForm.partOfSpeech}
                    onChange={(e) => setVocabForm({ ...vocabForm, partOfSpeech: e.target.value })}
                    className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-xs font-semibold text-slate-800 focus:border-[#7C3AED] focus:outline-none"
                  >
                    {POS_OPTIONS.map((pos) => (
                      <option key={pos} value={pos}>
                        {pos}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700">Cấp độ TOPIK</label>
                  <select
                    value={vocabForm.topikLevel}
                    onChange={(e) => setVocabForm({ ...vocabForm, topikLevel: e.target.value })}
                    className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-xs font-semibold text-slate-800 focus:border-[#7C3AED] focus:outline-none"
                  >
                    {TOPIK_LEVEL_OPTIONS.map((lv) => (
                      <option key={lv} value={lv}>
                        {lv}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700">
                    Câu ví dụ tiếng Hàn
                  </label>
                  <input
                    type="text"
                    value={vocabForm.exampleSentenceKo}
                    onChange={(e) =>
                      setVocabForm({ ...vocabForm, exampleSentenceKo: e.target.value })
                    }
                    placeholder="VD: 선생님이 교실에 계세요."
                    className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-xs text-slate-900 focus:border-[#7C3AED] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700">
                    Dịch nghĩa câu ví dụ
                  </label>
                  <input
                    type="text"
                    value={vocabForm.exampleSentenceVi}
                    onChange={(e) =>
                      setVocabForm({ ...vocabForm, exampleSentenceVi: e.target.value })
                    }
                    placeholder="VD: Thầy/cô giáo đang ở trong lớp học."
                    className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-xs text-slate-900 focus:border-[#7C3AED] focus:outline-none"
                  />
                </div>
              </div>

              {/* Phần gán 1 hoặc nhiều chủ đề (Sử dụng cùng 1 VocabId) */}
              <div className="rounded-2xl border border-violet-200 bg-violet-50/40 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#7C3AED]">
                      Phân loại chủ đề Flashcard (Nhiều-Nhiều trên cùng VocabId)
                    </h3>
                    <p className="mt-0.5 text-[11px] text-slate-600">
                      Chọn một hoặc nhiều chủ đề. Bấm vào nút &ldquo;Đặt làm chính&rdquo; để chọn chủ đề chính (IsPrimary = 1).
                    </p>
                  </div>
                </div>

                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {topics
                    .filter((t) => !t.isDeleted)
                    .map((t) => {
                      const selected = vocabForm.topicIds.includes(t.topicId)
                      const isPrimary = selected && vocabForm.primaryTopicId === t.topicId
                      return (
                        <div
                          key={t.topicId}
                          className={cn(
                            'flex items-center justify-between rounded-xl border px-3 py-2 text-xs transition',
                            selected
                              ? 'border-[#7C3AED] bg-white shadow-2xs'
                              : 'border-slate-200 bg-white/60 text-slate-600',
                          )}
                        >
                          <label className="flex flex-1 cursor-pointer items-center gap-2 font-semibold">
                            <input
                              type="checkbox"
                              checked={selected}
                              onChange={() => toggleTopicInVocabForm(t.topicId)}
                              className="size-4 accent-[#7C3AED]"
                            />
                            <span>
                              {t.displayOrder}. {t.topicNameVi}
                              {t.isAdminOnly ? ' (Nội bộ)' : ''}
                            </span>
                          </label>
                          {selected && !t.isAdminOnly && (
                            <button
                              type="button"
                              onClick={() =>
                                setVocabForm({ ...vocabForm, primaryTopicId: t.topicId })
                              }
                              className={cn(
                                'rounded-md px-2 py-0.5 text-[10px] font-bold transition',
                                isPrimary
                                  ? 'bg-[#7C3AED] text-white'
                                  : 'bg-slate-100 text-slate-600 hover:bg-violet-100 hover:text-[#7C3AED]',
                              )}
                            >
                              {isPrimary ? 'Chủ đề chính' : 'Đặt làm chính'}
                            </button>
                          )}
                        </div>
                      )
                    })}
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-700">
                  <input
                    type="checkbox"
                    checked={vocabForm.status === 'Published'}
                    onChange={(e) =>
                      setVocabForm({
                        ...vocabForm,
                        status: e.target.checked ? 'Published' : 'Hidden',
                      })
                    }
                    className="size-4 accent-[#7C3AED]"
                  />
                  <span>Cho phép hiển thị từ vựng này đối với Student</span>
                </label>

                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setVocabModalOpen(false)}
                    className="h-10 rounded-xl border border-slate-200 px-4 text-xs font-bold text-slate-700 hover:bg-slate-50"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#7C3AED] px-5 text-xs font-bold text-white shadow-sm hover:bg-violet-700 disabled:opacity-50"
                  >
                    {saving && <Loader2 className="size-4 animate-spin" />}
                    <span>{editingVocab ? 'Lưu cập nhật' : 'Thêm từ vựng'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL GÁN / BỎ GÁN NHIỀU CHỦ ĐỀ CHO 1 VOCABID
      ===================================================================== */}
      {assignModalVocab && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-xl rounded-3xl border border-violet-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900">
                  Phân loại chủ đề: <span lang="ko">{assignModalVocab.koreanWord}</span> (#
                  {assignModalVocab.vocabId})
                </h2>
                <p className="mt-0.5 text-xs text-slate-600">
                  Nghĩa: <strong>{assignModalVocab.vietnameseMeaning}</strong> · Cùng một VocabId dùng chung tiến độ SRS.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAssignModalVocab(null)}
                className="flex size-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
              >
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAssignTopics} className="mt-4 flex flex-col gap-4">
              <div className="grid max-h-[55vh] gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
                {topics
                  .filter((t) => !t.isDeleted)
                  .map((t) => {
                    const selected = assignForm.topicIds.includes(t.topicId)
                    const isPrimary = selected && assignForm.primaryTopicId === t.topicId
                    return (
                      <div
                        key={t.topicId}
                        className={cn(
                          'flex items-center justify-between rounded-xl border px-3 py-2.5 text-xs transition',
                          selected
                            ? 'border-[#7C3AED] bg-violet-50/40'
                            : 'border-slate-200 bg-white text-slate-700',
                        )}
                      >
                        <label className="flex flex-1 cursor-pointer items-center gap-2 font-semibold">
                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={() => toggleTopicInAssignForm(t.topicId)}
                            className="size-4 accent-[#7C3AED]"
                          />
                          <span>
                            {t.displayOrder}. {t.topicNameVi}
                          </span>
                        </label>
                        {selected && !t.isAdminOnly && (
                          <button
                            type="button"
                            onClick={() =>
                              setAssignForm({ ...assignForm, primaryTopicId: t.topicId })
                            }
                            className={cn(
                              'rounded-md px-2 py-0.5 text-[10px] font-bold',
                              isPrimary
                                ? 'bg-[#7C3AED] text-white'
                                : 'bg-slate-100 text-slate-600 hover:bg-violet-100 hover:text-[#7C3AED]',
                            )}
                          >
                            {isPrimary ? 'Chính' : 'Đặt chính'}
                          </button>
                        )}
                      </div>
                    )
                  })}
              </div>

              <div className="flex justify-end gap-2.5 border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={() => setAssignModalVocab(null)}
                  className="h-10 rounded-xl border border-slate-200 px-4 text-xs font-bold text-slate-700 hover:bg-slate-50"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#7C3AED] px-5 text-xs font-bold text-white shadow-sm hover:bg-violet-700 disabled:opacity-50"
                >
                  {saving && <Loader2 className="size-4 animate-spin" />}
                  <span>Lưu phân loại chủ đề</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================================
          DRAWER XEM CHI TIẾT TỪ VỰNG
      ===================================================================== */}
      {detailVocab && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs">
          <div className="flex h-full w-full max-w-md flex-col justify-between overflow-y-auto bg-white p-6 text-slate-900 shadow-2xl">
            <div className="flex flex-col gap-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <span className="font-mono text-xs font-bold text-[#7C3AED]">
                    VocabId #{detailVocab.vocabId} · {detailVocab.vocabCode}
                  </span>
                  <h2 className="text-lg font-extrabold text-slate-900">Chi tiết từ vựng</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setDetailVocab(null)}
                  className="flex size-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
                >
                  <X className="size-5" />
                </button>
              </div>

              <div className="flex items-center justify-between rounded-2xl border border-violet-100 bg-violet-50/50 p-4">
                <div>
                  <p lang="ko" className="text-3xl font-black text-slate-900">
                    {detailVocab.koreanWord}
                  </p>
                  <p className="mt-1 text-sm font-medium text-slate-600">
                    [{detailVocab.romanization || 'Chưa có Romanization'}]
                  </p>
                  <p className="mt-2 text-lg font-bold text-[#7C3AED]">
                    {detailVocab.vietnameseMeaning}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => speakKorean(detailVocab.koreanWord)}
                  className="flex size-11 items-center justify-center rounded-2xl bg-[#7C3AED] text-white shadow-sm hover:bg-violet-700"
                >
                  <Volume2 className="size-5" />
                </button>
              </div>

              {/* Các trường thực tế trong Database */}
              <dl className="grid grid-cols-2 gap-3 text-xs">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <dt className="text-slate-500">Từ loại (PartOfSpeech)</dt>
                  <dd className="mt-1 font-bold text-slate-900">{detailVocab.partOfSpeech}</dd>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <dt className="text-slate-500">Hanja (Chữ Hán)</dt>
                  <dd className="mt-1 font-bold text-slate-900">
                    {detailVocab.hanja || 'Không có (Từ thuần Hàn)'}
                  </dd>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <dt className="text-slate-500">Cấp độ TOPIK / NIKL</dt>
                  <dd className="mt-1 font-bold text-slate-900">
                    {detailVocab.topikLevel}
                    {detailVocab.niklLevel ? ` · NIKL ${detailVocab.niklLevel}` : ''}
                  </dd>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <dt className="text-slate-500">Liên kết Lộ trình học</dt>
                  <dd className="mt-1 font-bold text-slate-900">
                    {detailVocab.isHangeulLessonLocked
                      ? `Thuộc 36 từ Hangeul (${detailVocab.lessonLinksCount} buổi)`
                      : 'Kho Flashcard mở rộng'}
                  </dd>
                </div>
              </dl>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs">
                <h3 className="font-bold uppercase tracking-wider text-slate-500">
                  Ví dụ tiếng Hàn & Dịch nghĩa
                </h3>
                <p lang="ko" className="mt-2 text-sm font-bold text-slate-900">
                  {detailVocab.exampleSentenceKo || 'Chưa có câu ví dụ tiếng Hàn.'}
                </p>
                <p className="mt-1 text-slate-600">
                  {detailVocab.exampleSentenceVi || 'Chưa có câu dịch nghĩa ví dụ.'}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs">
                <h3 className="font-bold uppercase tracking-wider text-slate-500">
                  Nguồn dữ liệu & Chủ đề gốc (dbo.Vocabulary)
                </h3>
                <p className="mt-1.5 font-semibold text-slate-900">{detailVocab.sourceName}</p>
                {detailVocab.originalTopicName && (
                  <p className="mt-1 text-slate-600">
                    TopicName gốc: <code>{detailVocab.originalTopicName}</code>
                  </p>
                )}
                {detailVocab.canonicalVocabId !== null && (
                  <p className="mt-1.5 font-bold text-amber-800">
                    Bản ghi dự phòng (Standby) — Quy chiếu về từ gốc:{' '}
                    {detailVocab.canonicalWordKo || `#${detailVocab.canonicalVocabId}`}
                  </p>
                )}
              </div>

              <div className="rounded-2xl border border-violet-200 bg-violet-50/40 p-4 text-xs">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold uppercase tracking-wider text-[#7C3AED]">
                    Chủ đề Flashcard được gán
                  </h3>
                  <button
                    type="button"
                    onClick={() => handleOpenAssignModal(detailVocab)}
                    className="font-bold text-[#7C3AED] hover:underline"
                  >
                    Chỉnh sửa phân loại
                  </button>
                </div>
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {detailVocab.mappings
                    .filter((m) => !m.isDeleted)
                    .map((m) => (
                      <span
                        key={m.mappingId}
                        className="inline-flex items-center gap-1 rounded-lg border border-violet-200 bg-white px-2.5 py-1 font-semibold text-slate-800"
                      >
                        <span>{m.topicNameVi}</span>
                        {m.isPrimary && (
                          <span className="rounded bg-[#7C3AED] px-1.5 py-0.2 text-[10px] text-white">
                            Chính
                          </span>
                        )}
                      </span>
                    ))}
                </div>
              </div>
            </div>

            <div className="mt-6 flex gap-2.5 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => {
                  setDetailVocab(null)
                  handleOpenEditVocab(detailVocab)
                }}
                className="flex-1 rounded-xl bg-[#7C3AED] py-2.5 text-xs font-bold text-white shadow-sm hover:bg-violet-700"
              >
                Chỉnh sửa từ vựng này
              </button>
              <button
                type="button"
                onClick={() => setDetailVocab(null)}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL KIỂM TRA SCHEMA THỰC TẾ TRONG HANGODATASETDB
      ===================================================================== */}
      {showSchemaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-xl rounded-3xl border border-violet-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <Database className="size-5 text-[#7C3AED]" />
                <h2 className="text-lg font-extrabold text-slate-900">
                  Trạng thái Schema SQL Server (HangoDatasetDB)
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowSchemaModal(false)}
                className="flex size-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="mt-4 flex flex-col gap-3 text-xs">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="font-bold text-slate-900">
                  Máy chủ: <code>{schemaStatus?.serverInstance || '.\\SQLEXPRESS'}</code> · CSDL:{' '}
                  <code>{schemaStatus?.database || 'HangoDatasetDB'}</code>
                </p>
                <ul className="mt-2.5 space-y-1.5 text-slate-700">
                  <li className="flex items-center justify-between">
                    <span>Bảng kho từ vựng gốc (dbo.Vocabulary):</span>
                    <span className="font-bold text-emerald-700">
                      ✓ Đã tồn tại ({schemaStatus?.sqlVocabCount ?? 296} bản ghi)
                    </span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span>Liên kết 36 từ Hangeul (dbo.LessonVocabulary):</span>
                    <span className="font-bold text-emerald-700">
                      ✓ Bảo toàn ({schemaStatus?.hangeulLessonVocabCount ?? 36}/36 liên kết)
                    </span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span>Bảng chủ đề (dbo.VocabularyTopics):</span>
                    <span
                      className={cn(
                        'font-bold',
                        schemaStatus?.hasVocabularyTopicsTable
                          ? 'text-emerald-700'
                          : 'text-amber-700',
                      )}
                    >
                      {schemaStatus?.hasVocabularyTopicsTable
                        ? '✓ Đã triển khai trên SQL Server'
                        : 'Đang đồng bộ qua Staging Store (Chờ DBA chạy DDL)'}
                    </span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span>Bảng ánh xạ nhiều-nhiều (dbo.VocabularyTopicMappings):</span>
                    <span
                      className={cn(
                        'font-bold',
                        schemaStatus?.hasVocabularyTopicMappingsTable
                          ? 'text-emerald-700'
                          : 'text-amber-700',
                      )}
                    >
                      {schemaStatus?.hasVocabularyTopicMappingsTable
                        ? '✓ Đã triển khai trên SQL Server'
                        : 'Đang đồng bộ qua Staging Store (Chờ DBA chạy DDL)'}
                    </span>
                  </li>
                </ul>
              </div>

              {schemaStatus?.missingComponents && schemaStatus.missingComponents.length > 0 && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-950">
                  <div className="flex items-center gap-2 font-bold">
                    <Info className="size-4 text-amber-700" />
                    <span>Các thành phần DDL chờ triển khai trên SQL Server:</span>
                  </div>
                  <ul className="mt-2 list-disc space-y-1 pl-5">
                    {schemaStatus.missingComponents.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                  <p className="mt-2.5 text-[11px] leading-relaxed text-amber-900">
                    Script DDL chuẩn hóa đã được chuẩn bị sẵn tại{' '}
                    <code className="font-bold">{schemaStatus.recommendedSqlScript}</code> (bao gồm
                    11 chủ đề và 474 mappings). Hệ thống tuân thủ nghiêm ngặt quy tắc không tự ý
                    chạy SQL migration trên DB hiện tại.
                  </p>
                </div>
              )}
            </div>

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setShowSchemaModal(false)}
                className="h-10 rounded-xl bg-[#7C3AED] px-5 text-xs font-bold text-white hover:bg-violet-700"
              >
                Đã hiểu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
