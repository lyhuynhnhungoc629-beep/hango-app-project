'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  Activity,
  ArrowLeft,
  BookMarked,
  BookOpen,
  Briefcase,
  CalendarClock,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Compass,
  FolderKanban,
  FolderLock,
  GraduationCap,
  Heart,
  HeartHandshake,
  HeartPulse,
  HelpCircle,
  Home,
  Info,
  Layers,
  MessageCircle,
  PenTool,
  Plane,
  Play,
  RotateCw,
  Search,
  ShoppingBag,
  Sparkles,
  Sun,
  TreePine,
  Users,
  Utensils,
  Volume2,
  X,
} from 'lucide-react'
import { FlashcardAdminView } from '@/components/flashcard/flashcard-admin-view'
import { AppShell } from '@/components/hango/app-shell'
import { useAuth } from '@/lib/auth-context'
import { INITIAL_VOCABULARIES, type VocabularyItem } from '@/lib/backend/vocabulary-data'
import {
  calculateSrsSchedule,
  previewSrsIntervals,
  type SrsRating,
  type SrsState,
} from '@/lib/backend/srs'
import { cn } from '@/lib/utils'

const LEVELS = [
  'Tất cả',
  'Nhập môn',
  'TOPIK I - Cấp 1',
  'TOPIK I - Cấp 2',
  'TOPIK II - Cấp 3',
] as const

type StudentViewMode = 'library' | 'topic-detail' | 'study'
type WordSrsFilter = 'all' | 'unlearned' | 'learned' | 'due'

interface StudentTopicOption {
  topicId: number
  topicCode: string
  topicNameVi: string
  topicNameKo: string
  description: string
  iconName: string
  colorCode: string
  activeWordsCount: number
  levels?: string[]
  levelCounts?: Record<string, number>
  vocabIds?: number[]
}

type ExtendedVocabularyItem = VocabularyItem & {
  vocabId?: number
  vocabCode?: string
  hanja?: string | null
  niklLevel?: string | null
  sourceName?: string
  topicId?: number
  topicCode?: string
  topics?: Array<{ topicId: number; topicCode: string; topicNameVi: string; isPrimary: boolean }>
}

const responses: {
  rating: SrsRating
  label: string
  emoji: string
  className: string
}[] = [
  {
    rating: 'forgot',
    label: 'Quên',
    emoji: '😰',
    className: 'bg-red-500/15 text-red-300 border-red-500/40 hover:bg-red-500 hover:text-white',
  },
  {
    rating: 'hard',
    label: 'Khó',
    emoji: '🤔',
    className: 'bg-amber-500/15 text-amber-300 border-amber-500/40 hover:bg-amber-500 hover:text-[#0F0F1A]',
  },
  {
    rating: 'remember',
    label: 'Nhớ',
    emoji: '✅',
    className: 'bg-green-500/15 text-green-300 border-green-500/40 hover:bg-green-500 hover:text-[#0F0F1A]',
  },
]

function renderTopicIcon(iconName: string, className = 'size-5') {
  switch (iconName) {
    case 'Users':
      return <Users className={className} aria-hidden="true" />
    case 'GraduationCap':
      return <GraduationCap className={className} aria-hidden="true" />
    case 'Utensils':
      return <Utensils className={className} aria-hidden="true" />
    case 'Plane':
      return <Plane className={className} aria-hidden="true" />
    case 'ShoppingBag':
      return <ShoppingBag className={className} aria-hidden="true" />
    case 'Briefcase':
      return <Briefcase className={className} aria-hidden="true" />
    case 'HeartPulse':
      return <HeartPulse className={className} aria-hidden="true" />
    case 'MessageCircle':
      return <MessageCircle className={className} aria-hidden="true" />
    case 'Clock':
      return <Clock className={className} aria-hidden="true" />
    case 'TreePine':
      return <TreePine className={className} aria-hidden="true" />
    case 'HelpCircle':
      return <HelpCircle className={className} aria-hidden="true" />
    case 'Heart':
      return <Heart className={className} aria-hidden="true" />
    case 'Sun':
      return <Sun className={className} aria-hidden="true" />
    case 'BookOpen':
      return <BookOpen className={className} aria-hidden="true" />
    case 'Activity':
      return <Activity className={className} aria-hidden="true" />
    case 'FolderLock':
      return <FolderLock className={className} aria-hidden="true" />
    case 'Home':
      return <Home className={className} aria-hidden="true" />
    case 'HeartHandshake':
      return <HeartHandshake className={className} aria-hidden="true" />
    case 'Compass':
      return <Compass className={className} aria-hidden="true" />
    default:
      return <Sparkles className={className} aria-hidden="true" />
  }
}

function isSrsDueToday(state?: SrsState): boolean {
  if (!state?.NgayOnTiepTheo) return false
  const today = new Date().toISOString().slice(0, 10)
  return state.NgayOnTiepTheo <= today
}

const WORDS_PER_PAGE = 12

export function FlashcardStudy() {
  const { user, profile, token, refreshProfile } = useAuth()
  const isAdmin = Boolean(profile?.role === 'admin' || profile?.isRootAdmin)

  // Quy trình 3 bước cho Student: library (Chọn chủ đề) -> topic-detail (Danh sách từ trong chủ đề) -> study (Học Flashcard 3D)
  const [viewMode, setViewMode] = useState<StudentViewMode>('library')
  const [selectedTopic, setSelectedTopic] = useState<StudentTopicOption | null>(null)

  // Bộ lọc tại Màn hình 1: Thư viện chủ đề
  const [topicSearchQuery, setTopicSearchQuery] = useState('')
  const [libraryLevelFilter, setLibraryLevelFilter] = useState<string>('Tất cả')

  // Bộ lọc tại Màn hình 2: Danh sách từ vựng trong chủ đề
  const [wordSearchQuery, setWordSearchQuery] = useState('')
  const [wordLevelFilter, setWordLevelFilter] = useState<string>('Tất cả')
  const [wordSrsFilter, setWordSrsFilter] = useState<WordSrsFilter>('all')
  const [wordListPage, setWordListPage] = useState(1)

  // Dữ liệu từ API /api/vocabularies
  const [allStudentVocab, setAllStudentVocab] = useState<ExtendedVocabularyItem[]>(INITIAL_VOCABULARIES)
  const [studentTopics, setStudentTopics] = useState<StudentTopicOption[]>([])
  const [loadingLibrary, setLoadingLibrary] = useState(true)

  // Trạng thái học Flashcard 3D & Ngăn chi tiết từ vựng
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [panelOpen, setPanelOpen] = useState(false)
  const [inspectedWord, setInspectedWord] = useState<ExtendedVocabularyItem | null>(null)
  const [srsMap, setSrsMap] = useState<Record<string, SrsState>>({})
  const [lastSrsBanner, setLastSrsBanner] = useState<{
    wordKo: string
    state: SrsState
  } | null>(null)
  const [detailData, setDetailData] = useState<{
    hanja?: string | null
    niklLevel?: string | null
    sourceName?: string
    mappings?: Array<{ topicId: number; topicNameVi: string; isPrimary: boolean }>
    syllables?: { char: string; jamo: { choseong: string; jungseong: string; jongseong?: string } | null }[]
  } | null>(null)
  const [isSlowAudio, setIsSlowAudio] = useState(false)
  const [lastSpokenText, setLastSpokenText] = useState('')
  const [lastSpokenTime, setLastSpokenTime] = useState(0)

  // Nạp toàn bộ danh sách chủ đề & kho từ vựng hợp lệ dành cho Student từ API /api/vocabularies
  useEffect(() => {
    if (!token || isAdmin) return
    const controller = new AbortController()
    setLoadingLibrary(true)

    fetch('/api/vocabularies', {
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((json) => {
        if (json.success) {
          if (Array.isArray(json.topics)) {
            setStudentTopics(json.topics)
            setSelectedTopic((prev) => {
              if (!prev) return null
              return json.topics.find((t: StudentTopicOption) => t.topicId === prev.topicId) || prev
            })
          }
          if (Array.isArray(json.data)) {
            setAllStudentVocab(json.data)
          }
        }
      })
      .catch(() => {
        // ignore abort
      })
      .finally(() => {
        setLoadingLibrary(false)
      })

    return () => controller.abort()
  }, [token, isAdmin])

  // Nạp dữ liệu SRS đã lưu trong localStorage & đồng bộ từ Backend (/api/srs/review) theo VocabId
  useEffect(() => {
    if (isAdmin) return
    let localData: Record<string, SrsState> = {}
    try {
      const saved = localStorage.getItem('hango_srs_progress')
      if (saved) {
        localData = JSON.parse(saved)
        setSrsMap(localData)
      }
    } catch {
      // ignore
    }

    if (!token) return
    fetch('/api/srs/review', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((r) => r.json())
      .then((json) => {
        if (json.success && json.progress?.srsProgress) {
          const merged = { ...localData, ...json.progress.srsProgress }
          setSrsMap(merged)
          try {
            localStorage.setItem('hango_srs_progress', JSON.stringify(merged))
          } catch {
            // ignore
          }
        }
      })
      .catch(() => {
        // ignore
      })
  }, [token, isAdmin])

  // Lọc danh sách chủ đề trên màn hình Thư viện chủ đề (Step 1)
  const filteredTopics = useMemo(() => {
    const q = topicSearchQuery.trim().toLowerCase()
    return studentTopics.filter((tp) => {
      if (tp.activeWordsCount <= 0) return false
      if (libraryLevelFilter !== 'Tất cả') {
        const countAtLevel = tp.levelCounts
          ? tp.levelCounts[libraryLevelFilter] || 0
          : allStudentVocab.filter(
              (v) =>
                v.level === libraryLevelFilter &&
                (v.topicId === tp.topicId || v.topics?.some((m) => m.topicId === tp.topicId)),
            ).length
        if (countAtLevel <= 0) return false
      }
      if (q) {
        const matchVi = tp.topicNameVi.toLowerCase().includes(q)
        const matchKo = tp.topicNameKo.toLowerCase().includes(q)
        const matchDesc = tp.description.toLowerCase().includes(q)
        const matchCode = tp.topicCode.toLowerCase().includes(q)
        if (!matchVi && !matchKo && !matchDesc && !matchCode) return false
      }
      return true
    })
  }, [studentTopics, topicSearchQuery, libraryLevelFilter, allStudentVocab])

  // Toàn bộ từ vựng thuộc chủ đề đang chọn
  const wordsInSelectedTopic = useMemo(() => {
    if (!selectedTopic) return []
    return allStudentVocab.filter(
      (v) =>
        v.topicId === selectedTopic.topicId ||
        v.topics?.some((m) => m.topicId === selectedTopic.topicId),
    )
  }, [allStudentVocab, selectedTopic])

  // Danh sách từ vựng trong chủ đề sau khi áp dụng bộ lọc tìm kiếm / cấp độ / trạng thái SRS (dùng cho cả Step 2 và Step 3)
  const filteredTopicWords = useMemo(() => {
    const q = wordSearchQuery.trim().toLowerCase()
    return wordsInSelectedTopic.filter((v) => {
      if (wordLevelFilter !== 'Tất cả' && v.level !== wordLevelFilter) return false
      const srs = srsMap[v.id]
      if (wordSrsFilter === 'learned' && !srs) return false
      if (wordSrsFilter === 'unlearned' && Boolean(srs)) return false
      if (wordSrsFilter === 'due' && !isSrsDueToday(srs)) return false
      if (q) {
        const matchKo = v.ko.toLowerCase().includes(q)
        const matchVi = v.meaning.toLowerCase().includes(q)
        const matchRoman = v.roman.toLowerCase().includes(q)
        if (!matchKo && !matchVi && !matchRoman) return false
      }
      return true
    })
  }, [wordsInSelectedTopic, wordSearchQuery, wordLevelFilter, wordSrsFilter, srsMap])

  // Danh sách thẻ đang học ở Màn hình 3 (ưu tiên bộ lọc hiện tại trong chủ đề, nếu rỗng thì dùng toàn bộ từ trong chủ đề)
  const studyDeck = filteredTopicWords.length > 0 ? filteredTopicWords : wordsInSelectedTopic
  const total = studyDeck.length
  const safeIndex = total > 0 ? ((index % total) + total) % total : 0
  const activeStudyWord: ExtendedVocabularyItem =
    studyDeck[safeIndex] || wordsInSelectedTopic[0] || allStudentVocab[0] || INITIAL_VOCABULARIES[0]
  const drawerWord: ExtendedVocabularyItem = inspectedWord || activeStudyWord
  const position = total > 0 ? safeIndex + 1 : 0
  const percent = total > 0 ? Math.round((position / total) * 100) : 0

  const currentSrs = srsMap[activeStudyWord.id]
  const drawerSrs = srsMap[drawerWord.id]
  const intervalsPreview = previewSrsIntervals(activeStudyWord.id, currentSrs)

  // Gọi API GET /api/vocabularies/[id] khi mở ngăn Chi tiết từ vựng
  useEffect(() => {
    if (!panelOpen || !drawerWord || !token || isAdmin) return
    fetch(`/api/vocabularies/${encodeURIComponent(drawerWord.id)}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((r) => r.json())
      .then((json) => {
        if (json.success && json.data) {
          setDetailData(json.data)
        }
      })
      .catch(() => {
        // ignore
      })
  }, [panelOpen, drawerWord, token, isAdmin])

  // Nếu người dùng có role Admin: mở giao diện Quản lý Flashcard trên cùng mục sidebar /flashcard
  if (isAdmin) {
    return (
      <AppShell>
        <FlashcardAdminView />
      </AppShell>
    )
  }

  // Hàm tính tiến độ SRS của một chủ đề dựa trên VocabId dùng chung
  const getTopicProgress = (tp: StudentTopicOption) => {
    const ids =
      tp.vocabIds && tp.vocabIds.length > 0
        ? tp.vocabIds.map(String)
        : allStudentVocab
            .filter(
              (v) => v.topicId === tp.topicId || v.topics?.some((m) => m.topicId === tp.topicId),
            )
            .map((v) => v.id)
    const totalCount = ids.length || tp.activeWordsCount
    const learnedCount = ids.filter((id) => Boolean(srsMap[id])).length
    const dueCount = ids.filter((id) => isSrsDueToday(srsMap[id])).length
    const pct = totalCount > 0 ? Math.round((learnedCount / totalCount) * 100) : 0
    return { totalCount, learnedCount, dueCount, pct }
  }

  // Chọn chủ đề từ Thư viện -> chuyển sang Màn hình 2 (Xem danh sách từ vựng trong chủ đề)
  const handleSelectTopic = (tp: StudentTopicOption) => {
    setSelectedTopic(tp)
    setWordSearchQuery('')
    setWordLevelFilter(libraryLevelFilter !== 'Tất cả' ? libraryLevelFilter : 'Tất cả')
    setWordSrsFilter('all')
    setWordListPage(1)
    setIndex(0)
    setFlipped(false)
    setLastSrsBanner(null)
    setViewMode('topic-detail')
  }

  // Bắt đầu học Flashcard 3D từ Màn hình 2 -> chuyển sang Màn hình 3
  const handleStartStudy = (startAtWordId?: string) => {
    if (startAtWordId) {
      const idx = studyDeck.findIndex((w) => w.id === startAtWordId)
      setIndex(idx >= 0 ? idx : 0)
    } else {
      setIndex(0)
    }
    setFlipped(false)
    setLastSrsBanner(null)
    setViewMode('study')
  }

  const openWordDetailDrawer = (targetWord: ExtendedVocabularyItem) => {
    setInspectedWord(targetWord)
    setPanelOpen(true)
  }

  const go = (delta: number) => {
    if (total <= 0) return
    setFlipped(false)
    setInspectedWord(null)
    setIndex((i) => {
      const next = i + delta
      if (next < 0) return total - 1
      if (next >= total) return 0
      return next
    })
  }

  const speakWord = (e: React.MouseEvent, text: string) => {
    e.stopPropagation()
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
    window.speechSynthesis.cancel()

    const now = Date.now()
    const isRepeat = text === lastSpokenText && now - lastSpokenTime < 5000
    const nextSlow = isRepeat ? !isSlowAudio : false

    setIsSlowAudio(nextSlow)
    setLastSpokenText(text)
    setLastSpokenTime(now)

    const utter = new SpeechSynthesisUtterance(text)
    utter.lang = 'ko-KR'

    const voices = window.speechSynthesis.getVoices()
    const koVoice = voices.find((v) => v.lang.includes('ko') || v.lang.includes('KR'))
    if (koVoice) utter.voice = koVoice

    utter.rate = nextSlow ? 0.55 : 0.9
    window.speechSynthesis.speak(utter)
  }

  // Xử lý đánh giá SRS: Tính KhoangCachNgay và NgayOnTiepTheo + Gọi POST /api/srs/review (dùng chung theo VocabId)
  const handleSrsReview = async (rating: SrsRating) => {
    const newState = calculateSrsSchedule(activeStudyWord.id, rating, currentSrs)
    const nextMap = { ...srsMap, [activeStudyWord.id]: newState }
    setSrsMap(nextMap)
    setLastSrsBanner({ wordKo: activeStudyWord.ko, state: newState })

    try {
      localStorage.setItem('hango_srs_progress', JSON.stringify(nextMap))
    } catch {
      // ignore
    }

    try {
      await fetch('/api/srs/review', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          vocabId: activeStudyWord.id,
          wordKo: activeStudyWord.ko,
          meaning: activeStudyWord.meaning,
          rating,
          uid: profile?.uid || user?.uid || null,
          previous: currentSrs,
        }),
      })
      void refreshProfile()
    } catch {
      // ignore network error
    }

    go(1)
  }

  const totalLearnedAllTopics = useMemo(
    () => allStudentVocab.filter((v) => Boolean(srsMap[v.id])).length,
    [allStudentVocab, srsMap],
  )
  const totalDueAllTopics = useMemo(
    () => allStudentVocab.filter((v) => isSrsDueToday(srsMap[v.id])).length,
    [allStudentVocab, srsMap],
  )

  const totalWordPages = Math.max(1, Math.ceil(filteredTopicWords.length / WORDS_PER_PAGE))
  const safeWordPage = Math.min(wordListPage, totalWordPages)
  const paginatedTopicWords = filteredTopicWords.slice(
    (safeWordPage - 1) * WORDS_PER_PAGE,
    safeWordPage * WORDS_PER_PAGE,
  )

  const selectedTopicProgress = selectedTopic ? getTopicProgress(selectedTopic) : null

  return (
    <AppShell>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        {/* =====================================================================
            MÀN HÌNH 1: THƯ VIỆN CHỦ ĐỀ TỪ VỰNG (VOCABULARY TOPIC LIBRARY)
           ===================================================================== */}
        {viewMode === 'library' && (
          <>
            {/* PHẦN ĐẦU TRANG: TIÊU ĐỀ, MÔ TẢ & 3 THẺ THỐNG KÊ (Đồng bộ bố cục với Admin) */}
            <section className="rounded-3xl border border-violet-500/25 bg-card p-6 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <span className="flex size-13 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#7C3AED] to-violet-600 text-white shadow-md shadow-violet-500/25">
                    <BookOpen className="size-6" aria-hidden="true" />
                  </span>
                  <div>
                    <h1 className="text-2xl font-black tracking-tight text-foreground md:text-3xl">
                      Khám phá từ vựng tiếng Hàn
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Chọn chủ đề yêu thích để xem danh sách từ vựng, nghe phát âm và luyện tập ghi nhớ mỗi ngày.
                    </p>
                  </div>
                </div>
              </div>

              {/* 3 THẺ THỐNG KÊ TỔNG QUAN */}
              <div className="mt-5 grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-violet-500/25 bg-gradient-to-br from-violet-500/10 to-card p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-violet-300">
                      Chủ đề từ vựng
                    </span>
                    <span className="flex size-9 items-center justify-center rounded-xl bg-violet-500/20 text-violet-300">
                      <FolderKanban className="size-5" aria-hidden="true" />
                    </span>
                  </div>
                  <p className="mt-2 text-3xl font-black text-foreground">
                    {studentTopics.filter((t) => t.activeWordsCount > 0).length}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Chủ đề đang mở theo lộ trình TOPIK
                  </p>
                </div>

                <div className="rounded-2xl border border-indigo-500/25 bg-gradient-to-br from-indigo-500/10 to-card p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-300">
                      Tổng số từ vựng
                    </span>
                    <span className="flex size-9 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-300">
                      <BookMarked className="size-5" aria-hidden="true" />
                    </span>
                  </div>
                  <p className="mt-2 text-3xl font-black text-foreground">
                    {allStudentVocab.length}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Từ vựng chuẩn kèm phiên âm & câu ví dụ
                  </p>
                </div>

                <div className="rounded-2xl border border-emerald-500/25 bg-gradient-to-br from-emerald-500/10 to-card p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">
                      Tiến độ ôn tập SRS
                    </span>
                    <span className="flex size-9 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-300">
                      <CheckCircle2 className="size-5" aria-hidden="true" />
                    </span>
                  </div>
                  <p className="mt-2 text-3xl font-black text-emerald-400">
                    {totalLearnedAllTopics}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {totalDueAllTopics > 0
                      ? `${totalDueAllTopics} từ đến hạn cần ôn tập hôm nay`
                      : 'Số từ bạn đã học và ghi nhớ'}
                  </p>
                </div>
              </div>
            </section>

            {/* THANH BỘ LỌC CẤP ĐỘ & TÌM KIẾM CHỦ ĐỀ (Cùng một hàng giống Admin) */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-violet-500/25 bg-card p-2.5 shadow-sm">
              <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Bộ lọc cấp độ TOPIK">
                {LEVELS.map((lv) => (
                  <button
                    key={lv}
                    type="button"
                    onClick={() => setLibraryLevelFilter(lv)}
                    className={cn(
                      'inline-flex items-center rounded-xl px-3.5 py-2 text-xs font-bold transition-all',
                      libraryLevelFilter === lv
                        ? 'bg-[#7C3AED] text-white shadow-sm shadow-violet-500/25'
                        : 'text-muted-foreground hover:bg-violet-500/10 hover:text-violet-300',
                    )}
                  >
                    {lv}
                  </button>
                ))}
              </div>

              <div className="relative w-full sm:w-72">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="search"
                  value={topicSearchQuery}
                  onChange={(e) => setTopicSearchQuery(e.target.value)}
                  placeholder="Tìm kiếm chủ đề tiếng Hàn / Việt..."
                  aria-label="Tìm kiếm chủ đề"
                  className="h-9 w-full rounded-xl border border-white/10 bg-background/80 pl-10 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-[#7C3AED] focus:outline-none"
                />
              </div>
            </div>

            {/* Danh sách chủ đề dạng Card Grid (Đồng bộ kiểu Card của Admin trên nền Dark Mode) */}
            {loadingLibrary && studentTopics.length === 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, idx) => (
                  <div
                    key={idx}
                    className="h-60 animate-pulse rounded-2xl border border-violet-500/20 bg-card/60 p-5"
                  />
                ))}
              </div>
            ) : filteredTopics.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-violet-500/25 bg-card p-10 text-center shadow-sm">
                <FolderKanban className="size-10 text-violet-400" aria-hidden="true" />
                <p className="mt-3 text-base font-bold">Không tìm thấy chủ đề phù hợp</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Hãy thử chọn lại cấp độ &ldquo;Tất cả&rdquo; hoặc xóa từ khóa tìm kiếm chủ đề.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setLibraryLevelFilter('Tất cả')
                    setTopicSearchQuery('')
                  }}
                  className="mt-4 rounded-xl bg-[#7C3AED] px-4 py-2 text-xs font-bold text-white shadow-sm shadow-violet-500/25 hover:bg-violet-600"
                >
                  Hiển thị tất cả chủ đề
                </button>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredTopics.map((tp) => {
                  const progress = getTopicProgress(tp)
                  const matchingWordsCount =
                    libraryLevelFilter === 'Tất cả'
                      ? progress.totalCount
                      : tp.levelCounts?.[libraryLevelFilter] ?? progress.totalCount
                  const topicLevels =
                    tp.levels && tp.levels.length > 0 ? tp.levels : ['Nhập môn', 'TOPIK I - Cấp 1']

                  return (
                    <article
                      key={tp.topicId}
                      onClick={() => handleSelectTopic(tp)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          handleSelectTopic(tp)
                        }
                      }}
                      role="button"
                      tabIndex={0}
                      className="group flex cursor-pointer flex-col justify-between rounded-2xl border border-violet-500/25 bg-card p-5 shadow-sm transition hover:border-violet-500/50 hover:shadow-md"
                    >
                      <div>
                        {/* Đầu thẻ: Icon màu chủ đề + Tên chủ đề + Badge số lượng từ */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <span
                              className="flex size-11 shrink-0 items-center justify-center rounded-2xl text-white shadow-sm"
                              style={{ backgroundColor: tp.colorCode || '#7C3AED' }}
                            >
                              {renderTopicIcon(tp.iconName, 'size-5')}
                            </span>
                            <div>
                              <h2 className="text-base font-extrabold text-foreground transition-colors group-hover:text-violet-300">
                                {tp.topicNameVi}
                              </h2>
                              <p lang="ko" className="text-xs font-medium text-muted-foreground">
                                {tp.topicNameKo}
                              </p>
                            </div>
                          </div>

                          <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-violet-500/30 bg-violet-500/10 px-2.5 py-0.5 text-[11px] font-bold text-violet-300">
                            <BookOpen className="size-3" aria-hidden="true" />
                            {matchingWordsCount} từ
                          </span>
                        </div>

                        {/* Mô tả chủ đề */}
                        <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                          {tp.description || 'Chủ đề từ vựng tiếng Hàn thông dụng theo chuẩn TOPIK.'}
                        </p>

                        {/* Khung thông tin cấp độ TOPIK & Tiến độ ôn tập SRS */}
                        <div className="mt-4 rounded-xl border border-white/10 bg-background/60 p-3">
                          <div className="flex flex-wrap items-center gap-1.5">
                            {topicLevels.map((lv) => (
                              <span
                                key={lv}
                                className={cn(
                                  'rounded-md px-2 py-0.5 text-[11px] font-semibold',
                                  libraryLevelFilter === lv
                                    ? 'bg-[#7C3AED]/25 text-violet-200 ring-1 ring-[#7C3AED]/50'
                                    : 'bg-white/5 text-muted-foreground',
                                )}
                              >
                                {lv}
                              </span>
                            ))}
                          </div>

                          <div className="mt-3 border-t border-white/10 pt-2.5">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground">
                                Tiến độ SRS:{' '}
                                <strong className="text-foreground">
                                  {progress.learnedCount}/{progress.totalCount} từ
                                </strong>
                              </span>
                              <span className="font-bold text-violet-300">{progress.pct}%</span>
                            </div>
                            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                              <div
                                className="h-full rounded-full bg-gradient-to-r from-violet-400 to-[#7C3AED] transition-all"
                                style={{ width: `${progress.pct}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Hàng nút thao tác dưới cùng của Card */}
                      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-3">
                        {progress.dueCount > 0 ? (
                          <span className="inline-flex items-center gap-1 rounded-lg bg-amber-500/15 px-2.5 py-1 text-[11px] font-semibold text-amber-300">
                            <CalendarClock className="size-3.5" />
                            Cần ôn: {progress.dueCount} từ
                          </span>
                        ) : progress.learnedCount > 0 ? (
                          <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/15 px-2.5 py-1 text-[11px] font-semibold text-emerald-300">
                            <CheckCircle2 className="size-3.5" />
                            Đã học {progress.learnedCount} từ
                          </span>
                        ) : (
                          <span className="text-[11px] font-medium text-muted-foreground">
                            Chưa bắt đầu học
                          </span>
                        )}

                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#7C3AED] px-3.5 py-1.5 text-xs font-bold text-white shadow-sm shadow-violet-500/25 transition group-hover:bg-violet-600">
                          <span>Bắt đầu học</span>
                          <ChevronRight className="size-3.5" aria-hidden="true" />
                        </span>
                      </div>
                    </article>
                  )
                })}
              </div>
            )}
          </>
        )}

        {/* =====================================================================
            MÀN HÌNH 2: CHI TIẾT CHỦ ĐỀ & DANH SÁCH TỪ VỰNG TRONG CHỦ ĐỀ
           ===================================================================== */}
        {viewMode === 'topic-detail' && selectedTopic && (
          <>
            {/* Thanh điều hướng quay lại Thư viện chủ đề */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setViewMode('library')}
                className="inline-flex items-center gap-2 rounded-xl border border-violet-500/25 bg-card px-3.5 py-2 text-xs font-bold text-foreground shadow-sm transition hover:border-violet-500/50 hover:bg-white/5"
              >
                <ArrowLeft className="size-4 text-violet-400" aria-hidden="true" />
                <span>Quay lại thư viện chủ đề</span>
              </button>

              <nav aria-label="Breadcrumb" className="text-xs text-muted-foreground">
                <ol className="flex items-center gap-2">
                  <li>
                    <button
                      type="button"
                      onClick={() => setViewMode('library')}
                      className="hover:text-foreground"
                    >
                      Khám phá từ vựng
                    </button>
                  </li>
                  <li aria-hidden="true">/</li>
                  <li className="font-bold text-violet-300">{selectedTopic.topicNameVi}</li>
                </ol>
              </nav>
            </div>

            {/* Phần đầu chủ đề đã chọn + Nút Bắt đầu học Flashcard */}
            <section className="rounded-3xl border border-violet-500/25 bg-card p-6 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <span
                    className="flex size-13 shrink-0 items-center justify-center rounded-2xl text-white shadow-md"
                    style={{ backgroundColor: selectedTopic.colorCode || '#7C3AED' }}
                  >
                    {renderTopicIcon(selectedTopic.iconName, 'size-6')}
                  </span>
                  <div>
                    <div className="flex flex-wrap items-center gap-2.5">
                      <h1 className="text-2xl font-black tracking-tight text-foreground md:text-3xl">
                        {selectedTopic.topicNameVi}
                      </h1>
                      <span
                        lang="ko"
                        className="inline-flex items-center rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-0.5 text-xs font-bold text-violet-300"
                      >
                        {selectedTopic.topicNameKo}
                      </span>
                      <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-0.5 text-xs font-semibold text-muted-foreground">
                        {wordsInSelectedTopic.length} từ vựng
                      </span>
                    </div>
                    <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                      {selectedTopic.description}
                    </p>

                    {selectedTopicProgress && (
                      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
                        <span className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-background/60 px-3 py-1.5">
                          <CheckCircle2 className="size-4 text-emerald-400" />
                          Đã ôn SRS:{' '}
                          <strong>
                            {selectedTopicProgress.learnedCount}/{selectedTopicProgress.totalCount} từ (
                            {selectedTopicProgress.pct}%)
                          </strong>
                        </span>
                        {selectedTopicProgress.dueCount > 0 && (
                          <span className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-amber-300">
                            <CalendarClock className="size-4" />
                            Cần ôn tập hôm nay: <strong>{selectedTopicProgress.dueCount} từ</strong>
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  disabled={studyDeck.length === 0}
                  onClick={() => handleStartStudy()}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#7C3AED] px-5 text-xs font-bold text-white shadow-sm shadow-violet-500/25 transition hover:bg-violet-600 disabled:opacity-50"
                >
                  <Play className="size-4 fill-current" aria-hidden="true" />
                  <span>Bắt đầu học Flashcard ({studyDeck.length} từ)</span>
                </button>
              </div>
            </section>

            {/* Thanh lọc & tìm kiếm từ vựng trong chủ đề (Cùng một hàng giống Admin) */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-violet-500/25 bg-card p-2.5 shadow-sm">
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex flex-wrap items-center gap-1">
                  {(
                    [
                      { id: 'all', label: `Tất cả (${wordsInSelectedTopic.length})` },
                      {
                        id: 'unlearned',
                        label: `Chưa học (${wordsInSelectedTopic.filter((w) => !srsMap[w.id]).length})`,
                      },
                      {
                        id: 'learned',
                        label: `Đã ôn SRS (${wordsInSelectedTopic.filter((w) => Boolean(srsMap[w.id])).length})`,
                      },
                      {
                        id: 'due',
                        label: `Cần ôn (${wordsInSelectedTopic.filter((w) => isSrsDueToday(srsMap[w.id])).length})`,
                      },
                    ] as const
                  ).map((st) => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => {
                        setWordSrsFilter(st.id)
                        setWordListPage(1)
                      }}
                      className={cn(
                        'rounded-xl px-3 py-2 text-xs font-bold transition-all',
                        wordSrsFilter === st.id
                          ? 'bg-[#7C3AED] text-white shadow-sm shadow-violet-500/25'
                          : 'text-muted-foreground hover:bg-violet-500/10 hover:text-violet-300',
                      )}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>

                <select
                  aria-label="Lọc theo cấp độ TOPIK trong chủ đề"
                  value={wordLevelFilter}
                  onChange={(e) => {
                    setWordLevelFilter(e.target.value)
                    setWordListPage(1)
                  }}
                  className="h-9 rounded-xl border border-white/10 bg-background/80 px-3 text-xs font-semibold text-foreground focus:border-[#7C3AED] focus:outline-none"
                >
                  {LEVELS.map((lv) => (
                    <option key={lv} value={lv}>
                      Cấp độ: {lv}
                    </option>
                  ))}
                </select>
              </div>

              <div className="relative w-full sm:w-72">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="search"
                  value={wordSearchQuery}
                  onChange={(e) => {
                    setWordSearchQuery(e.target.value)
                    setWordListPage(1)
                  }}
                  placeholder="Tìm từ tiếng Hàn, phiên âm, nghĩa Việt..."
                  aria-label="Tìm từ trong chủ đề"
                  className="h-9 w-full rounded-xl border border-white/10 bg-background/80 pl-10 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-[#7C3AED] focus:outline-none"
                />
              </div>
            </div>

            {/* Danh sách từ vựng thuộc chủ đề */}
            {filteredTopicWords.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-3xl border border-border bg-card p-10 text-center">
                <p className="text-base font-bold">Không có từ vựng nào khớp bộ lọc hiện tại</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Hãy thử chuyển về bộ lọc &ldquo;Tất cả&rdquo; hoặc xóa từ khóa tìm kiếm.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setWordSearchQuery('')
                    setWordLevelFilter('Tất cả')
                    setWordSrsFilter('all')
                    setWordListPage(1)
                  }}
                  className="mt-4 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-white hover:bg-primary/90"
                >
                  Đặt lại bộ lọc trong chủ đề
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {paginatedTopicWords.map((item) => {
                    const itemSrs = srsMap[item.id]
                    const due = isSrsDueToday(itemSrs)
                    return (
                      <article
                        key={item.id}
                        className="flex flex-col justify-between rounded-2xl border border-white/10 bg-card p-5 transition-colors hover:border-violet-500/40"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <h2 lang="ko" className="text-2xl font-extrabold text-foreground">
                                  {item.ko}
                                </h2>
                                <button
                                  type="button"
                                  onClick={(e) => speakWord(e, item.ko)}
                                  aria-label={`Nghe phát âm từ ${item.ko}`}
                                  className="flex size-8 items-center justify-center rounded-lg bg-primary/15 text-violet-300 transition-colors hover:bg-primary hover:text-white"
                                >
                                  <Volume2 className="size-4" aria-hidden="true" />
                                </button>
                              </div>
                              <p className="mt-0.5 text-xs text-muted-foreground">[{item.roman}]</p>
                            </div>

                            <div className="flex flex-col items-end gap-1">
                              <span className="rounded-lg bg-white/10 px-2.5 py-0.5 text-[11px] font-semibold text-violet-200">
                                {item.pos}
                              </span>
                              <span className="text-[10px] text-muted-foreground">{item.level}</span>
                            </div>
                          </div>

                          <p className="mt-3 text-base font-bold text-violet-200">{item.meaning}</p>

                          {item.exKo && (
                            <div className="mt-3 rounded-xl bg-background/70 p-3 text-xs">
                              <p lang="ko" className="font-medium text-foreground">
                                {item.exKo}
                              </p>
                              {item.exVi && (
                                <p className="mt-1 text-muted-foreground">{item.exVi}</p>
                              )}
                            </div>
                          )}

                          {/* Hiển thị các chủ đề liên quan nếu từ vựng thuộc nhiều chủ đề (cùng VocabId) */}
                          {item.topics && item.topics.length > 1 && (
                            <div className="mt-3 flex flex-wrap items-center gap-1">
                              <Layers className="mr-1 size-3 text-muted-foreground" />
                              {item.topics.map((tp) => (
                                <span
                                  key={tp.topicId}
                                  className={cn(
                                    'rounded px-1.5 py-0.5 text-[10px]',
                                    tp.topicId === selectedTopic.topicId
                                      ? 'bg-primary/20 font-semibold text-violet-200'
                                      : 'bg-white/5 text-muted-foreground',
                                  )}
                                >
                                  {tp.topicNameVi}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="mt-4 flex items-center justify-between gap-2 border-t border-white/10 pt-3">
                          {itemSrs ? (
                            <span
                              className={cn(
                                'inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-semibold',
                                due
                                  ? 'bg-amber-500/15 text-amber-300'
                                  : 'bg-emerald-500/15 text-emerald-300',
                              )}
                            >
                              <CalendarClock className="size-3.5" />
                              Ôn tiếp: {itemSrs.NgayOnTiepTheoHienThi}
                            </span>
                          ) : (
                            <span className="rounded-lg bg-white/5 px-2.5 py-1 text-[11px] text-muted-foreground">
                              Chưa học SRS
                            </span>
                          )}

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => openWordDetailDrawer(item)}
                              className="rounded-lg border border-white/10 bg-background px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:border-violet-500/40 hover:text-foreground"
                            >
                              Chi tiết
                            </button>
                            <button
                              type="button"
                              onClick={() => handleStartStudy(item.id)}
                              className="inline-flex items-center gap-1 rounded-lg bg-primary/20 px-2.5 py-1.5 text-xs font-semibold text-violet-200 hover:bg-primary hover:text-white"
                            >
                              <Play className="size-3 fill-current" />
                              <span>Học thẻ này</span>
                            </button>
                          </div>
                        </div>
                      </article>
                    )
                  })}
                </div>

                {/* Phân trang danh sách từ trong chủ đề */}
                {totalWordPages > 1 && (
                  <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-card px-4 py-3 text-xs">
                    <span className="text-muted-foreground">
                      Hiển thị{' '}
                      <strong className="text-foreground">
                        {(safeWordPage - 1) * WORDS_PER_PAGE + 1}–
                        {Math.min(safeWordPage * WORDS_PER_PAGE, filteredTopicWords.length)}
                      </strong>{' '}
                      trong tổng số <strong className="text-foreground">{filteredTopicWords.length}</strong> từ
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={safeWordPage <= 1}
                        onClick={() => setWordListPage((p) => Math.max(1, p - 1))}
                        className="rounded-lg border border-white/10 bg-background px-3 py-1.5 font-semibold disabled:opacity-40"
                      >
                        Trang trước
                      </button>
                      <span className="font-semibold">
                        Trang {safeWordPage} / {totalWordPages}
                      </span>
                      <button
                        type="button"
                        disabled={safeWordPage >= totalWordPages}
                        onClick={() => setWordListPage((p) => Math.min(totalWordPages, p + 1))}
                        className="rounded-lg border border-white/10 bg-background px-3 py-1.5 font-semibold disabled:opacity-40"
                      >
                        Trang sau
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* =====================================================================
            MÀN HÌNH 3: GIAO DIỆN HỌC FLASHCARD 3D (STUDY MODE)
           ===================================================================== */}
        {viewMode === 'study' && (
          <div className="flex flex-col gap-6">
            {/* Thanh điều hướng quay lại Danh sách từ hoặc Thư viện chủ đề + Thanh tiến độ */}
            <header className="rounded-2xl border border-white/10 bg-card p-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setViewMode('topic-detail')}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-background px-3.5 py-2 text-xs font-semibold text-foreground transition-colors hover:border-violet-500/40"
                  >
                    <ArrowLeft className="size-4 text-violet-400" aria-hidden="true" />
                    <span>Quay lại danh sách từ</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('library')}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-background/60 px-3.5 py-2 text-xs font-medium text-muted-foreground transition-colors hover:border-violet-500/40 hover:text-foreground"
                  >
                    <FolderKanban className="size-3.5 text-violet-400" aria-hidden="true" />
                    <span>Thư viện chủ đề</span>
                  </button>
                </div>

                <div className="flex flex-1 items-center justify-end gap-3 sm:max-w-md">
                  <div
                    className="h-2.5 flex-1 overflow-hidden rounded-full bg-white/10"
                    role="progressbar"
                    aria-valuenow={position}
                    aria-valuemin={0}
                    aria-valuemax={total}
                    aria-label="Tiến độ học trong chủ đề"
                  >
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-violet-400 to-primary transition-all"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    <strong className="text-foreground">
                      {position}/{total} từ
                    </strong>{' '}
                    · Chủ đề: <strong className="text-violet-300">{selectedTopic?.topicNameVi || activeStudyWord.topic}</strong>
                  </span>
                </div>
              </div>
            </header>

            <main className="relative flex flex-col items-center justify-center gap-6 py-2">
              {/* Thông báo kết quả tính toán SRS vừa thực hiện */}
              {lastSrsBanner && (
                <div
                  role="status"
                  className="flex flex-wrap items-center gap-3 rounded-2xl border border-violet-500/40 bg-violet-500/10 px-4 py-2.5 text-xs text-violet-100"
                >
                  <Sparkles className="size-4 shrink-0 text-violet-400" aria-hidden="true" />
                  <span>
                    SRS cho từ <strong lang="ko">{lastSrsBanner.wordKo}</strong>:{' '}
                    <code className="rounded bg-white/10 px-1.5 py-0.5 text-emerald-300">
                      KhoangCachNgay = {lastSrsBanner.state.KhoangCachNgay} ngày
                    </code>{' '}
                    ·{' '}
                    <code className="rounded bg-white/10 px-1.5 py-0.5 text-sky-300">
                      NgayOnTiepTheo = {lastSrsBanner.state.NgayOnTiepTheoHienThi}
                    </code>{' '}
                    (Lặp: {lastSrsBanner.state.SoLanLap}, EF: {lastSrsBanner.state.HeSoGhiNho})
                  </span>
                </div>
              )}

              {/* Cụm nút Luyện viết & Xem chi tiết từ */}
              <div className="flex flex-wrap items-center justify-center gap-2">
                <Link
                  href={`/ai?tab=handwriting&word=${encodeURIComponent(activeStudyWord.ko)}`}
                  className="flex items-center gap-2 rounded-xl border border-primary/40 bg-primary/15 px-3.5 py-2 text-xs font-semibold text-violet-200 transition-colors hover:bg-primary hover:text-white"
                >
                  <PenTool className="size-4" aria-hidden="true" />
                  <span>Luyện viết từ này</span>
                </Link>
                <button
                  type="button"
                  onClick={() => openWordDetailDrawer(activeStudyWord)}
                  className="flex items-center gap-2 rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-semibold hover:border-primary/50"
                  aria-expanded={panelOpen}
                  aria-controls="word-details"
                >
                  <Info className="size-4 text-violet-400" aria-hidden="true" />
                  <span>Chi tiết từ & Âm tiết</span>
                </button>
              </div>

              {/* Thẻ lật Flashcard 3D */}
              <div className="perspective-1000 w-full max-w-md">
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => setFlipped((f) => !f)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      setFlipped((f) => !f)
                    }
                  }}
                  aria-label={flipped ? 'Lật về mặt trước' : 'Lật thẻ để xem nghĩa'}
                  className={cn(
                    'preserve-3d relative aspect-[4/5] w-full cursor-pointer rounded-3xl transition-transform duration-500 sm:aspect-[5/4]',
                    flipped && 'rotate-y-180',
                  )}
                >
                  {/* Mặt trước: Từ tiếng Hàn + Phiên âm + Nút phát âm */}
                  <span className="backface-hidden absolute inset-0 rounded-3xl bg-gradient-to-br from-violet-400 via-primary to-fuchsia-500 p-[3px] shadow-[0_30px_80px_-20px_rgba(124,58,237,0.6)]">
                    <span className="flex h-full flex-col rounded-[22px] bg-white p-6 text-[#0F0F1A]">
                      <span className="flex items-center justify-between gap-2">
                        <span className="truncate rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                          {selectedTopic?.topicNameVi || activeStudyWord.topic}
                        </span>
                        <span className="shrink-0 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                          {activeStudyWord.level}
                        </span>
                      </span>
                      <span className="flex flex-1 flex-col items-center justify-center gap-3">
                        <span lang="ko" className="text-5xl font-extrabold md:text-6xl">
                          {activeStudyWord.ko}
                        </span>
                        <span className="text-lg text-slate-500">{activeStudyWord.roman}</span>
                        {currentSrs && (
                          <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                            <CalendarClock className="size-3.5" />
                            Ôn tiếp: {currentSrs.NgayOnTiepTheoHienThi} ({currentSrs.KhoangCachNgay} ngày)
                          </span>
                        )}
                      </span>
                      <span className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={(e) => speakWord(e, activeStudyWord.ko)}
                            aria-label="Nghe phát âm"
                            title="Nhấn lần 1 đọc chuẩn, nhấn lần 2 để đọc chậm"
                            className="flex size-11 items-center justify-center rounded-full bg-primary/10 text-primary transition-transform hover:scale-105"
                          >
                            <Volume2 className="size-5" aria-hidden="true" />
                          </button>
                          {lastSpokenText === activeStudyWord.ko && isSlowAudio && (
                            <span className="animate-fade-in rounded-md bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-600">
                              🐢 0.6x Đọc chậm
                            </span>
                          )}
                        </div>
                        <span className="flex items-center gap-1.5 text-sm text-slate-400">
                          <RotateCw className="size-4" aria-hidden="true" />
                          Nhấn để lật
                        </span>
                      </span>
                    </span>
                  </span>

                  {/* Mặt sau: Từ loại + Nghĩa tiếng Việt + Câu ví dụ */}
                  <span className="backface-hidden rotate-y-180 absolute inset-0 rounded-3xl bg-gradient-to-br from-violet-400 via-primary to-fuchsia-500 p-[3px]">
                    <span className="flex h-full flex-col items-center justify-center gap-3 rounded-[22px] bg-white p-6 text-center text-[#0F0F1A]">
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                        {activeStudyWord.pos}
                      </span>
                      <span className="text-3xl font-bold md:text-4xl">{activeStudyWord.meaning}</span>
                      <span lang="ko" className="mt-1 text-base font-medium text-slate-700">
                        {activeStudyWord.exKo}
                      </span>
                      <span className="text-sm text-slate-500">{activeStudyWord.exVi}</span>
                    </span>
                  </span>
                </div>
              </div>

              {/* 3 nút đánh giá SRS hiển thị trực tiếp KhoangCachNgay dự kiến */}
              <div className="grid w-full max-w-md grid-cols-3 gap-3">
                {responses.map((r) => {
                  const previewDays = intervalsPreview[r.rating]
                  return (
                    <button
                      key={r.rating}
                      type="button"
                      onClick={() => handleSrsReview(r.rating)}
                      className={cn(
                        'flex h-20 flex-col items-center justify-center gap-1 rounded-2xl border font-semibold transition-colors',
                        r.className,
                      )}
                    >
                      <div className="flex items-center gap-1.5 text-base">
                        <span aria-hidden="true">{r.emoji}</span>
                        <span>{r.label}</span>
                      </div>
                      <span className="text-[11px] font-medium opacity-85">
                        KhoangCachNgay: {previewDays} ngày
                      </span>
                    </button>
                  )
                })}
              </div>
            </main>

            {/* Điều hướng thẻ trước / thẻ tiếp theo */}
            <footer className="rounded-2xl border border-white/10 bg-card px-5 py-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => go(-1)}
                    aria-label="Thẻ trước"
                    className="flex size-10 items-center justify-center rounded-xl border border-border bg-background hover:border-primary/50"
                  >
                    <ChevronLeft className="size-5" aria-hidden="true" />
                  </button>
                  <span className="min-w-20 text-center text-sm font-semibold tabular-nums">
                    {position} / {total}
                  </span>
                  <button
                    type="button"
                    onClick={() => go(1)}
                    aria-label="Thẻ tiếp theo"
                    className="flex size-10 items-center justify-center rounded-xl border border-border bg-background hover:border-primary/50"
                  >
                    <ChevronRight className="size-5" aria-hidden="true" />
                  </button>
                </div>

                <span className="rounded-full border border-orange-500/30 bg-orange-500/10 px-4 py-1.5 text-xs font-semibold text-orange-300">
                  <span aria-hidden="true">🔥</span> Đã ôn {totalLearnedAllTopics} từ bằng thuật toán SRS
                </span>
              </div>
            </footer>
          </div>
        )}
      </div>

      {/* =====================================================================
          NGĂN CHI TIẾT TỪ VỰNG (DÙNG CHUNG CHO MÀN HÌNH 2 & MÀN HÌNH 3)
         ===================================================================== */}
      <div
        aria-hidden="true"
        onClick={() => setPanelOpen(false)}
        className={cn(
          'fixed inset-0 z-40 bg-black/50 transition-opacity',
          panelOpen ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
      />
      <aside
        id="word-details"
        aria-label="Chi tiết từ vựng"
        inert={!panelOpen}
        className={cn(
          'fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col gap-5 overflow-y-auto border-l border-border bg-card p-6 shadow-2xl transition-transform duration-300',
          panelOpen ? 'translate-x-0' : 'translate-x-full',
        )}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Thông tin chi tiết từ vựng</h2>
          <button
            type="button"
            onClick={() => setPanelOpen(false)}
            aria-label="Đóng"
            className="flex size-9 items-center justify-center rounded-lg hover:bg-white/5"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p lang="ko" className="text-3xl font-bold">
              {drawerWord.ko}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">[{drawerWord.roman}]</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <span className="inline-block rounded-full bg-primary/15 px-3 py-1 text-xs font-semibold text-violet-300">
                {drawerWord.pos}
              </span>
              <span className="inline-block rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-muted-foreground">
                {drawerWord.level}
              </span>
              {(drawerWord.niklLevel || detailData?.niklLevel) && (
                <span className="inline-block rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-muted-foreground">
                  NIKL {drawerWord.niklLevel || detailData?.niklLevel}
                </span>
              )}
              {(drawerWord.hanja || detailData?.hanja) && (
                <span className="inline-block rounded-full bg-amber-500/15 px-3 py-1 text-xs font-medium text-amber-300">
                  Hanja: {drawerWord.hanja || detailData?.hanja}
                </span>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={(e) => speakWord(e, drawerWord.ko)}
            className="flex size-11 items-center justify-center rounded-xl bg-primary/15 text-violet-300 hover:bg-primary hover:text-white"
            aria-label="Nghe phát âm"
          >
            <Volume2 className="size-5" />
          </button>
        </div>

        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Nghĩa tiếng Việt</h3>
          <p className="mt-1.5 text-xl font-semibold">{drawerWord.meaning}</p>
        </section>

        <section className="rounded-2xl bg-background p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Câu ví dụ</h3>
          <p lang="ko" className="mt-2 text-base font-medium">
            {drawerWord.exKo}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">{drawerWord.exVi}</p>
        </section>

        {drawerWord.topics && drawerWord.topics.length > 0 && (
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Chủ đề liên quan (Cùng VocabId #{drawerWord.id})
            </h3>
            <div className="mt-2 flex flex-wrap gap-2">
              {drawerWord.topics.map((tp) => (
                <span
                  key={tp.topicId}
                  className="rounded-lg border border-border bg-background px-2.5 py-1 text-xs font-medium"
                >
                  {tp.topicNameVi}
                </span>
              ))}
            </div>
          </section>
        )}

        {drawerWord.grammarNote && (
          <section className="rounded-2xl border border-border bg-background p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-violet-300">Ghi chú ngữ pháp & Phát âm</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{drawerWord.grammarNote}</p>
          </section>
        )}

        {/* Thông số thuật toán SRS (KhoangCachNgay & NgayOnTiepTheo) */}
        <section className="rounded-2xl border border-primary/30 bg-primary/10 p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-violet-300">
            Trạng thái thuật toán SRS (SM-2)
          </h3>
          {drawerSrs ? (
            <dl className="mt-3 grid grid-cols-2 gap-2.5 text-xs">
              <div className="rounded-xl bg-card p-2.5">
                <dt className="text-muted-foreground">KhoangCachNgay</dt>
                <dd className="mt-1 text-base font-bold text-emerald-400">{drawerSrs.KhoangCachNgay} ngày</dd>
              </div>
              <div className="rounded-xl bg-card p-2.5">
                <dt className="text-muted-foreground">NgayOnTiepTheo</dt>
                <dd className="mt-1 text-base font-bold text-sky-400">{drawerSrs.NgayOnTiepTheoHienThi}</dd>
              </div>
              <div className="rounded-xl bg-card p-2.5">
                <dt className="text-muted-foreground">Số lần lặp (SoLanLap)</dt>
                <dd className="mt-1 font-bold">{drawerSrs.SoLanLap} lần</dd>
              </div>
              <div className="rounded-xl bg-card p-2.5">
                <dt className="text-muted-foreground">Hệ số nhớ (EF)</dt>
                <dd className="mt-1 font-bold">{drawerSrs.HeSoGhiNho}</dd>
              </div>
            </dl>
          ) : (
            <p className="mt-2 text-xs text-muted-foreground">
              Từ này chưa được ôn tập trong phiên hiện tại. Hãy bấm <strong>Quên / Khó / Nhớ</strong> trong màn hình học Flashcard để thuật toán SRS tính toán <code>KhoangCachNgay</code> và <code>NgayOnTiepTheo</code>.
            </p>
          )}
        </section>

        {detailData?.syllables && detailData.syllables.length > 0 && (
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Phân tách âm tiết (API /api/vocabularies/{drawerWord.id})
            </h3>
            <div className="mt-2 flex flex-wrap gap-2">
              {detailData.syllables.map((s, idx) => (
                <div key={idx} className="rounded-xl border border-border bg-background px-3 py-2 text-center text-xs">
                  <p lang="ko" className="text-lg font-bold text-violet-300">
                    {s.char}
                  </p>
                  {s.jamo && (
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      {s.jamo.choseong} + {s.jamo.jungseong}
                      {s.jamo.jongseong ? ` + ${s.jamo.jongseong}` : ''}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        <Link
          href={`/ai?tab=handwriting&word=${encodeURIComponent(drawerWord.ko)}`}
          className="mt-auto flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-primary font-semibold text-white shadow-lg shadow-primary/30 transition-colors hover:bg-primary/90"
        >
          <PenTool className="size-4" aria-hidden="true" />
          Luyện viết tay chữ &ldquo;{drawerWord.ko}&rdquo;
        </Link>
      </aside>
    </AppShell>
  )
}
