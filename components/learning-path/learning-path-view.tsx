'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Clock,
  Database,
  FileText,
  Flag,
  Headphones,
  Layers,
  Loader2,
  Lock,
  PenTool,
  Plus,
  Printer,
  RotateCcw,
  Settings2,
  ShieldCheck,
  Sparkles,
  Unlock,
  Users,
  Volume2,
  X,
  Zap,
} from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { cn } from '@/lib/utils'
import { AdminCurriculumModal } from './admin-curriculum-modal'
import { StudentTrackingModal, type StudentTrackingItem } from './student-tracking-modal'

type UnlockStatus = 'Locked' | 'Available' | 'InProgress' | 'Completed'
type ViewMode = 'all' | 'stage' | 'lesson'

interface LevelItem {
  levelId: number
  levelCode: string
  badgeText: string
  badgeColor: string
  title: string
  topikLevel: string
  textbookName: string
  description: string
  skills: string[]
  displayOrder: number
  topicsCount: number
  lessonsCount: number
  unlockStatus: UnlockStatus
  unlockStatusLabelVi: string
  completedLessonsCount: number
  progressPercent: number
  unlockRule: {
    requiredCompletedLessonsPercent: number
    minAverageQuizScorePercent: number
  }
}

interface ContentSourceItem {
  SourceId: number
  SourceCode: string
  SourceName: string
  DatasetOrApiName: string
  SourceUrl: string
  DataType: string
  VerifiedRecordCount: number
  DataFormat: string
  TargetLevels: string
  LicenseName: string
  AuthorOrOrganization: string
  TargetTable: string
  AvailabilityStatus: string
  Notes: string | null
}

interface TopicLessonActivityTag {
  title: string
  activityType: string
  displayOrder: number
}

interface TopicLessonItem {
  lessonId: number
  lessonCode: string
  lessonNumber: number
  title: string
  subtitle: string
  learningObjective: string
  estimatedMinutes: number
  displayOrder: number
  status?: string
  isAiCompiled: boolean
  needsExpertReview: boolean
  unlockStatus: UnlockStatus
  unlockStatusLabelVi: string
  completedRequiredActivities: number
  totalRequiredActivities: number
  bestQuizScorePercent: number
  quizAttemptsCount: number
  progressPercent: number
  activities?: TopicLessonActivityTag[]
}

interface TopicItem {
  topicId: number
  topicCode: string
  title: string
  description: string
  displayOrder: number
  lessonsCount: number
  lessons: TopicLessonItem[]
}

interface LessonDetailData {
  lesson: {
    lessonId: number
    lessonCode: string
    lessonNumber: number
    levelId: number
    levelTitle: string
    levelBadge: string
    totalLessonsInLevel?: number
    topicId: number
    topicTitle: string
    title: string
    subtitle: string
    learningObjective: string
    estimatedMinutes: number
    isAiCompiled: boolean
    needsExpertReview: boolean
    unlockStatus: UnlockStatus
    unlockStatusLabelVi: string
    completedRequiredActivities: number
    totalRequiredActivities: number
    bestQuizScorePercent: number
    quizAttemptsCount: number
    progressPercent: number
    canTakeFinalQuiz: boolean
    completionRule: {
      requireAllMandatoryActivities: boolean
      requireFinalQuizPass: boolean
      minQuizPassPercent: number
      allowUnlimitedRetakes: boolean
    }
  }
  sections: Array<{
    sectionId: number
    sectionCode: string
    sectionType: string
    title: string
    contentMd: string
    examples: Array<{ ko: string; roman?: string; vi: string }>
    displayOrder: number
  }>
  vocabularies: Array<{
    vocabId: number
    vocabCode: string
    ko: string
    hanja: string | null
    roman: string
    vi: string
    pos: string
    exKo: string
    exVi: string
    topikLevel: string
  }>
  grammars: Array<{
    grammarId: number
    grammarCode: string
    pattern: string
    meaningVi: string
    usage: string
    conjugation: string
    exKo: string
    exVi: string
  }>
  resources: Array<{
    resourceId: number
    resourceCode: string
    resourceType: string
    title: string
    description: string
    resourceUrl: string
    targetChars: string[]
  }>
  activities: Array<{
    activityId: number
    activityCode: string
    activityType: string
    title: string
    description: string
    isRequired: boolean
    exerciseId: number | null
    resourceId: number | null
    displayOrder: number
    xpReward: number
    isCompleted: boolean
    scorePercent: number | null
    completedAt: string | null
  }>
  exercises: Array<{
    exerciseId: number
    exerciseCode: string
    exerciseType: string
    title: string
    description: string
    passingScorePercent: number
    timeLimitSeconds: number
    questions: Array<{
      questionId: number
      questionCode: string
      questionType: string
      promptText: string
      koreanHighlight: string | null
      points: number
      displayOrder: number
      options: Array<{
        optionId: number
        optionLabel: string
        optionText: string
      }>
    }>
  }>
}

function getBadgeStyle(color: string) {
  switch (color) {
    case 'emerald':
      return 'bg-[#22C55E] text-slate-950 border-2 border-slate-900 shadow-[0_2px_0_rgba(15,23,42,0.15)]'
    case 'blue':
      return 'bg-[#3B82F6] text-white border-2 border-slate-900 shadow-[0_2px_0_rgba(15,23,42,0.15)]'
    case 'sky':
      return 'bg-[#06B6D4] text-white border-2 border-slate-900 shadow-[0_2px_0_rgba(15,23,42,0.15)]'
    case 'amber':
      return 'bg-[#F59E0B] text-slate-950 border-2 border-slate-900 shadow-[0_2px_0_rgba(15,23,42,0.15)]'
    case 'violet':
      return 'bg-[#8B5CF6] text-white border-2 border-slate-900 shadow-[0_2px_0_rgba(15,23,42,0.15)]'
    case 'rose':
      return 'bg-[#EC4899] text-white border-2 border-slate-900 shadow-[0_2px_0_rgba(15,23,42,0.15)]'
    case 'red':
      return 'bg-[#EF4444] text-white border-2 border-slate-900 shadow-[0_2px_0_rgba(15,23,42,0.15)]'
    default:
      return 'bg-[#2563EB] text-white border-2 border-slate-900 shadow-[0_2px_0_rgba(15,23,42,0.15)]'
  }
}

function getStatusBadgeStyle(status: UnlockStatus) {
  switch (status) {
    case 'Completed':
      return 'border-emerald-500 bg-emerald-100 text-emerald-900'
    case 'InProgress':
      return 'border-blue-600 bg-[#2563EB] text-white shadow-sm'
    case 'Available':
      return 'border-slate-800 bg-white text-slate-800 hover:bg-slate-50'
    default:
      return 'border-slate-400 bg-slate-100 text-slate-500'
  }
}

function getSkillIcon(skill: string) {
  if (skill.includes('Từ vựng')) return BookOpen
  if (skill.includes('Nghe')) return Headphones
  if (skill.includes('viết')) return PenTool
  if (skill.includes('kiểm tra')) return ClipboardCheck
  return FileText
}

function formatEstimatedTime(minutes: number) {
  if (minutes === 70) return '~1g10'
  if (minutes >= 60) {
    const h = Math.floor(minutes / 60)
    const m = minutes % 60
    return m > 0 ? `~${h}g${m}` : `~${h} giờ`
  }
  return `~${minutes} phút`
}

function getStepperButtonMeta(activityType: string, rawTitle: string) {
  switch (activityType) {
    case 'warmup_quiz':
      return { label: 'Kiểm tra đầu buổi', icon: Zap }
    case 'theory':
      return { label: 'Học', icon: BookOpen }
    case 'vocabulary':
      return { label: 'Từ vựng', icon: BookOpen }
    case 'grammar':
      return { label: 'Ngữ pháp', icon: FileText }
    case 'flashcard':
      return { label: 'Flashcard', icon: Layers }
    case 'practice_quiz':
      return { label: 'Trắc nghiệm', icon: Zap }
    case 'writing_sheet':
      return { label: 'File viết', icon: PenTool }
    case 'final_test':
      return { label: 'Bài kiểm tra', icon: ClipboardCheck }
    default:
      return { label: rawTitle, icon: BookOpen }
  }
}

// Chuyển nguyên âm/phụ âm đơn sang âm tiết phát âm chuẩn khi người dùng bấm vào thẻ chữ
const JAMO_SPEAK_MAP: Record<string, string> = {
  ㅏ: '아',
  ㅑ: '야',
  ㅓ: '어',
  ㅕ: '여',
  ㅗ: '오',
  ㅛ: '요',
  ㅜ: '우',
  ㅠ: '유',
  ㅡ: '으',
  ㅣ: '이',
  ㅐ: '애',
  ㅒ: '얘',
  ㅔ: '에',
  ㅖ: '예',
  ㅘ: '와',
  ㅙ: '왜',
  ㅚ: '외',
  ㅝ: '워',
  ㅞ: '웨',
  ㅟ: '위',
  ㅢ: '의',
  ㄱ: '가',
  ㄴ: '나',
  ㄷ: '다',
  ㄹ: '라',
  ㅁ: '마',
  ㅂ: '바',
  ㅅ: '사',
  ㅇ: '아',
  ㅈ: '자',
  ㅊ: '차',
  ㅋ: '카',
  ㅌ: '타',
  ㅍ: '파',
  ㅎ: '하',
  ㄲ: '까',
  ㄸ: '따',
  ㅃ: '빠',
  ㅆ: '싸',
  ㅉ: '짜',
}

const CHAR_FOLDER_MAP: Record<string, string> = {
  가: 'ga',
  나: 'na',
  다: 'da',
  라: 'ra',
  마: 'ma',
  바: 'ba',
  사: 'sa',
  아: 'a',
  자: 'ja',
  차: 'cha',
  카: 'ka',
  타: 'ta',
  파: 'pa',
  하: 'ha',
  구: 'gu',
  기: 'gi',
  고: 'go',
  개: 'gae',
  네: 'ne',
  과: 'gwa',
  외: 'oe',
  워: 'wo',
  위: 'wi',
  의: 'ui',
  각: 'gak',
  간: 'gan',
  갈: 'gal',
  감: 'gam',
  강: 'gang',
  한: 'han',
  글: 'geul',
}

export function LearningPathView() {
  const { token, profile, refreshProfile } = useAuth()
  const isAdmin = Boolean(profile?.role === 'admin' || profile?.isRootAdmin)

  const [viewMode, setViewMode] = useState<ViewMode>('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pathTitle, setPathTitle] = useState('Lộ trình học tiếng Hàn')
  const [pathDescription, setPathDescription] = useState('')
  const [journey, setJourney] = useState<{
    currentLevelId: number
    currentLevelBadge: string
    currentLevelTitle: string
    currentLessonId: number
    currentLessonCode: string
    currentLessonTitle: string
    completedLessonsCount: number
    totalPublishedLessons: number
    overallProgressPercent: number
    totalXpEarned: number
  } | null>(null)
  const [levels, setLevels] = useState<LevelItem[]>([])
  const [contentSources, setContentSources] = useState<ContentSourceItem[]>([])

  // Quản lý Chặng đang chọn (View 2: Stage Detail Alternating Spine)
  const [selectedLevelId, setSelectedLevelId] = useState<number>(1)
  const [levelTopicsMap, setLevelTopicsMap] = useState<Record<number, TopicItem[]>>({})
  const [loadingLevelId, setLoadingLevelId] = useState<number | null>(null)
  const [stageSubView, setStageSubView] = useState<'spine' | 'topics'>('spine')

  // Quản lý Buổi học đang mở (View 3: Lesson Detail Stepper View)
  const [activeLessonData, setActiveLessonData] = useState<LessonDetailData | null>(null)
  const [loadingLesson, setLoadingLesson] = useState(false)
  const [lessonError, setLessonError] = useState<string | null>(null)
  const [activeStepIndex, setActiveStepIndex] = useState<number>(0)
  const [selectedJamoIndex, setSelectedJamoIndex] = useState<number | null>(null)
  const [completingActivityId, setCompletingActivityId] = useState<number | null>(null)
  const [flashcardIndex, setFlashcardIndex] = useState(0)
  const [flashcardFlipped, setFlashcardFlipped] = useState(false)

  // Trắc nghiệm luyện tập nhanh (Practice Quiz & Warmup Quiz)
  const [practiceIdx, setPracticeIdx] = useState(0)
  const [practicePickedOption, setPracticePickedOption] = useState<string | null>(null)
  const [practiceScore, setPracticeScore] = useState(0)

  // Bài kiểm tra cuối buổi (Final Test)
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({})
  const [submittingQuiz, setSubmittingQuiz] = useState(false)
  const [quizResult, setQuizResult] = useState<{
    scorePercent: number
    passingScorePercent: number
    correctCount: number
    totalQuestions: number
    passed: boolean
    message: string
    unlockedNextLessonId: number | null
    unlockedNextLessonTitle: string | null
    questionsReview: Array<{
      questionId: number
      promptText: string
      selectedOptionId: number | null
      correctOptionId: number | null
      correctOptionLabel: string
      correctOptionText: string
      isCorrect: boolean
      explanationVi: string
    }>
  } | null>(null)

  // Quản lý Nguồn dữ liệu & Admin Modals
  const [showSourcesPanel, setShowSourcesPanel] = useState(false)
  const [showAdminModal, setShowAdminModal] = useState(false)
  const [showStudentTrackingModal, setShowStudentTrackingModal] = useState(false)
  const [inspectingStudent, setInspectingStudent] = useState<StudentTrackingItem | null>(null)
  const showStudentProgress = !isAdmin || Boolean(inspectingStudent)

  const speakKorean = (rawText: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
    const clean = rawText.trim()
    const spoken = JAMO_SPEAK_MAP[clean] || clean
    window.speechSynthesis.cancel()
    const utter = new SpeechSynthesisUtterance(spoken)
    utter.lang = 'ko-KR'
    utter.rate = 0.85
    window.speechSynthesis.speak(utter)
  }

  const fetchLevelDetail = useCallback(
    async (levelId: number, targetUid?: string) => {
      if (!token) return
      setLoadingLevelId(levelId)
      try {
        const uidParam = targetUid !== undefined ? (targetUid ? `?uid=${encodeURIComponent(targetUid)}` : '') : inspectingStudent?.uid ? `?uid=${encodeURIComponent(inspectingStudent.uid)}` : ''
        const res = await fetch(`/api/learning-levels/${levelId}${uidParam}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const json = await res.json()
        if (res.ok && json.success && Array.isArray(json.topics)) {
          setLevelTopicsMap((prev) => ({ ...prev, [levelId]: json.topics }))
        }
      } catch {
        // ignore
      } finally {
        setLoadingLevelId(null)
      }
    },
    [token, inspectingStudent],
  )

  const fetchLearningPath = useCallback(
    async (targetUid?: string) => {
      if (!token) return
      setLoading(true)
      setError(null)
      try {
        const uidParam = targetUid !== undefined ? (targetUid ? `?uid=${encodeURIComponent(targetUid)}` : '') : inspectingStudent?.uid ? `?uid=${encodeURIComponent(inspectingStudent.uid)}` : ''
        const res = await fetch(`/api/learning-path${uidParam}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const json = await res.json()
        if (!res.ok || !json.success) {
          setError(json.error || 'Không thể tải lộ trình học từ SQL Server.')
          return
        }
        setPathTitle(json.path?.title || 'Lộ trình học tiếng Hàn')
        setPathDescription(json.path?.description || '')
        setJourney(json.journey || null)
        setLevels(json.levels || [])
        setContentSources(json.contentSources || [])

        const initialLevelId = json.journey?.currentLevelId || json.levels?.[0]?.levelId || 1
        setSelectedLevelId(initialLevelId)
        void fetchLevelDetail(initialLevelId, targetUid)
      } catch {
        setError('Không thể kết nối tới máy chủ lộ trình học.')
      } finally {
        setLoading(false)
      }
    },
    [token, inspectingStudent, fetchLevelDetail],
  )

  useEffect(() => {
    void fetchLearningPath()
  }, [fetchLearningPath])

  const handleOpenStage = async (levelId: number) => {
    setSelectedLevelId(levelId)
    setLessonError(null)
    setViewMode('stage')
    if (!levelTopicsMap[levelId]) {
      await fetchLevelDetail(levelId)
    }
  }

  const handleOpenLesson = async (
    lessonIdOrCode: number | string,
    preferredActivityType?: string,
  ) => {
    if (!token) return
    setLoadingLesson(true)
    setLessonError(null)
    setQuizResult(null)
    setSelectedAnswers({})
    setFlashcardIndex(0)
    setFlashcardFlipped(false)
    setSelectedJamoIndex(null)
    setPracticeIdx(0)
    setPracticePickedOption(null)
    setPracticeScore(0)

    try {
      const uidParam = inspectingStudent ? `?uid=${encodeURIComponent(inspectingStudent.uid)}` : ''
      const res = await fetch(`/api/lessons/${encodeURIComponent(String(lessonIdOrCode))}${uidParam}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        setLessonError(json.error || 'Buổi học chưa được mở khóa.')
        return
      }
      const detail = json as LessonDetailData
      setActiveLessonData(detail)
      setSelectedLevelId(detail.lesson.levelId)

      // Chọn bước học đầu tiên là bước "Học" (theory) hoặc theo preferredActivityType
      const acts = detail.activities || []
      if (preferredActivityType) {
        const foundIdx = acts.findIndex((a) => a.activityType === preferredActivityType)
        setActiveStepIndex(foundIdx >= 0 ? foundIdx : 0)
      } else {
        const theoryIdx = acts.findIndex((a) => a.activityType === 'theory')
        setActiveStepIndex(theoryIdx >= 0 ? theoryIdx : 0)
      }
      setViewMode('lesson')
    } catch {
      setLessonError('Lỗi khi tải nội dung buổi học.')
    } finally {
      setLoadingLesson(false)
    }
  }

  const handleContinueLearning = async () => {
    if (!token) return
    try {
      const res = await fetch('/api/learning-progress/continue', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const json = await res.json()
      if (res.ok && json.success && json.data?.lessonId) {
        const target = json.data
        setSelectedLevelId(target.levelId)
        await fetchLevelDetail(target.levelId)
        await handleOpenLesson(target.lessonId, target.activityType)
      }
    } catch {
      // ignore
    }
  }

  const handleCompleteActivity = async (activityId: number, moveToNextStep = false) => {
    if (!token || !activeLessonData) return
    setCompletingActivityId(activityId)
    setLessonError(null)
    const isPreview = Boolean(isAdmin || inspectingStudent)
    try {
      const res = await fetch('/api/learning-progress/activities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          lessonId: activeLessonData.lesson.lessonId,
          activityId,
          timeSpentSeconds: 60,
          preview: isPreview,
        }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        setLessonError(json.error || 'Không thể cập nhật tiến độ hoạt động.')
        return
      }

      // Cập nhật lại dữ liệu buổi học từ SQL Server
      const uidParam = inspectingStudent ? `?uid=${encodeURIComponent(inspectingStudent.uid)}` : ''
      const lessonRes = await fetch(`/api/lessons/${activeLessonData.lesson.lessonId}${uidParam}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const lessonJson = await lessonRes.json()
      if (lessonRes.ok && lessonJson.success) {
        setActiveLessonData(lessonJson as LessonDetailData)
      }

      if (moveToNextStep && activeStepIndex < activeLessonData.activities.length - 1) {
        setActiveStepIndex((prev) => prev + 1)
      }

      if (!isPreview) {
        await fetchLevelDetail(activeLessonData.lesson.levelId)
        await fetchLearningPath()
        void refreshProfile()
      }
    } finally {
      setCompletingActivityId(null)
    }
  }

  const handleNextStepButton = async () => {
    if (!activeLessonData) return
    const currentAct = activeLessonData.activities[activeStepIndex]
    if (
      currentAct &&
      !currentAct.isCompleted &&
      currentAct.activityType !== 'final_test'
    ) {
      await handleCompleteActivity(currentAct.activityId, true)
      return
    }
    if (activeStepIndex < activeLessonData.activities.length - 1) {
      setActiveStepIndex((prev) => prev + 1)
    }
  }

  const handleSubmitQuiz = async (exerciseId: number) => {
    if (!token || !activeLessonData) return
    setSubmittingQuiz(true)
    setLessonError(null)
    const isPreview = Boolean(isAdmin || inspectingStudent)
    try {
      const res = await fetch(`/api/exercises/${exerciseId}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          answers: selectedAnswers,
          durationSeconds: 90,
          preview: isPreview,
        }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        setLessonError(json.error || 'Không thể nộp bài kiểm tra.')
        return
      }
      setQuizResult({
        passed: Boolean(json.passed),
        scorePercent: Number(json.scorePercent || 0),
        passingScorePercent: Number(json.passThreshold || json.passingScorePercent || 80),
        correctCount: Number(json.correctCount || 0),
        totalQuestions: Number(json.totalQuestions || 0),
        message:
          json.message ||
          (json.passed
            ? 'Chúc mừng! Bạn đã hoàn thành bài kiểm tra cuối buổi.'
            : 'Bạn chưa đạt điểm yêu cầu (tối thiểu 80%). Hãy ôn tập và làm lại nhé!'),
        unlockedNextLessonId: json.unlockedNextLesson?.lessonId ?? json.progression?.unlockedNextLessonId ?? null,
        unlockedNextLessonTitle: json.unlockedNextLesson?.title ?? json.progression?.unlockedNextLessonTitle ?? null,
        questionsReview: Array.isArray(json.details)
          ? json.details
          : Array.isArray(json.questionsReview)
            ? json.questionsReview
            : [],
      })

      // Cập nhật lại dữ liệu buổi học từ SQL Server
      const uidParam = inspectingStudent ? `?uid=${encodeURIComponent(inspectingStudent.uid)}` : ''
      const lessonRes = await fetch(`/api/lessons/${activeLessonData.lesson.lessonId}${uidParam}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const lessonJson = await lessonRes.json()
      if (lessonRes.ok && lessonJson.success) {
        setActiveLessonData(lessonJson as LessonDetailData)
      }

      if (!isPreview) {
        await fetchLevelDetail(activeLessonData.lesson.levelId)
        await fetchLearningPath()
        void refreshProfile()
      }
    } catch {
      setLessonError('Lỗi khi nộp bài kiểm tra.')
    } finally {
      setSubmittingQuiz(false)
    }
  }

  // Dữ liệu Chặng đang xem ở View 2
  const selectedLevel = useMemo(
    () => levels.find((l) => l.levelId === selectedLevelId) || levels[0] || null,
    [levels, selectedLevelId],
  )

  const selectedStageTopics = useMemo(
    () => (selectedLevel ? levelTopicsMap[selectedLevel.levelId] || [] : []),
    [selectedLevel, levelTopicsMap],
  )

  const selectedStageLessons = useMemo(() => {
    const all: Array<TopicLessonItem & { topicTitle: string }> = []
    for (const tp of selectedStageTopics) {
      for (const ls of tp.lessons) {
        all.push({ ...ls, topicTitle: tp.title })
      }
    }
    return all.sort((a, b) => a.lessonNumber - b.lessonNumber)
  }, [selectedStageTopics])

  // Dữ liệu Thẻ chữ cái (jamo_cards) & Thẻ Flashcard của Buổi học đang xem ở View 3
  const jamoSection = useMemo(
    () => activeLessonData?.sections.find((s) => s.sectionType === 'jamo_cards') || null,
    [activeLessonData],
  )

  const theorySections = useMemo(
    () => activeLessonData?.sections.filter((s) => s.sectionType !== 'jamo_cards') || [],
    [activeLessonData],
  )

  const combinedFlashcards = useMemo(() => {
    if (!activeLessonData) return []
    const cards: Array<{
      front: string
      roman: string
      backTitle: string
      backSub: string
      typeLabel: string
    }> = []
    if (jamoSection?.examples) {
      for (const j of jamoSection.examples) {
        cards.push({
          front: j.ko,
          roman: j.roman || '',
          backTitle: `Âm đọc: ${j.roman || j.ko}`,
          backSub: j.vi,
          typeLabel: 'Chữ cái Hangeul',
        })
      }
    }
    for (const v of activeLessonData.vocabularies) {
      cards.push({
        front: v.ko,
        roman: v.roman,
        backTitle: v.vi,
        backSub: v.exKo ? `${v.exKo} — ${v.exVi}` : v.pos,
        typeLabel: 'Từ vựng ứng dụng',
      })
    }
    return cards
  }, [activeLessonData, jamoSection])

  // Danh sách câu hỏi phản xạ nhanh cho bước "Kiểm tra đầu buổi" và "Trắc nghiệm"
  const interactivePracticeQuestions = useMemo(() => {
    if (!activeLessonData) return []
    const list: Array<{
      prompt: string
      highlight: string
      correctText: string
      options: string[]
      explanation: string
    }> = []

    const jamos = jamoSection?.examples || []
    for (let i = 0; i < jamos.length; i++) {
      const target = jamos[i]
      const distractors = jamos
        .filter((_, idx) => idx !== i)
        .map((x) => x.roman || x.vi)
        .slice(0, 3)
      while (distractors.length < 3) {
        const fallback = ['a', 'eo · ơ', 'o · ô', 'u', 'eu · ư', 'i'][distractors.length]
        if (!distractors.includes(fallback) && fallback !== target.roman) {
          distractors.push(fallback)
        } else {
          distractors.push(`âm #${distractors.length + 1}`)
        }
      }
      const opts = [target.roman || target.vi, ...distractors].sort((a, b) =>
        a.localeCompare(b),
      )
      list.push({
        prompt: `Chữ cái "${target.ko}" có âm đọc chuẩn là gì?`,
        highlight: target.ko,
        correctText: target.roman || target.vi,
        options: opts,
        explanation: target.vi,
      })
    }

    for (let i = 0; i < activeLessonData.vocabularies.length; i++) {
      const v = activeLessonData.vocabularies[i]
      const distractors = activeLessonData.vocabularies
        .filter((_, idx) => idx !== i)
        .map((x) => x.vi)
        .slice(0, 3)
      const opts = [v.vi, ...distractors].sort((a, b) => a.localeCompare(b))
      list.push({
        prompt: `Từ tiếng Hàn "${v.ko}" (${v.roman}) có nghĩa tiếng Việt là gì?`,
        highlight: v.ko,
        correctText: v.vi,
        options: opts,
        explanation: `${v.ko} [${v.roman}]: ${v.vi}. Ví dụ: ${v.exKo} (${v.exVi})`,
      })
    }

    return list
  }, [activeLessonData, jamoSection])

  if (loading && levels.length === 0) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 p-8 text-sm text-muted-foreground">
        <Loader2 className="size-7 animate-spin text-primary" />
        <span>Đang tải Lộ trình 7 chặng và tiến độ cá nhân từ SQL Server (HangoDatasetDB)...</span>
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full bg-[#EEF5FB] bg-[linear-gradient(to_right,#D8E6F5_1px,transparent_1px),linear-gradient(to_bottom,#D8E6F5_1px,transparent_1px)] bg-[size:24px_24px] px-3 py-6 text-slate-900 md:px-8">
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        {/* Thông báo lỗi nếu học viên bấm vào buổi học hoặc chặng chưa mở khóa */}
        {lessonError && (
          <div className="flex items-center justify-between gap-3 rounded-2xl border-[1.5px] border-amber-500 bg-amber-50 p-4 text-sm text-amber-950 shadow-sm">
            <div className="flex items-center gap-3">
              <Lock className="size-5 shrink-0 text-amber-600" />
              <span className="font-semibold">{lessonError}</span>
            </div>
            <button
              type="button"
              onClick={() => setLessonError(null)}
              className="rounded-lg bg-amber-200/80 px-3 py-1 text-xs font-bold text-amber-950 hover:bg-amber-300"
            >
              Đóng
            </button>
          </div>
        )}

        {/* =====================================================================
            VIEW 1: TẤT CẢ LỘ TRÌNH (7 CHẶNG VERTICAL TIMELINE - HÌNH 1 & 2)
        ===================================================================== */}
        {viewMode === 'all' && (
          <>
            {/* 1.1 Header Lộ trình học tiếng Hàn */}
            <section className="rounded-2xl border-[1.5px] border-slate-800 bg-white p-5 shadow-[0_2px_0_rgba(15,23,42,0.06)] md:p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <span className="flex size-12 shrink-0 items-center justify-center rounded-xl border border-slate-800 bg-[#2563EB] text-white shadow-sm">
                    <Layers className="size-6" aria-hidden="true" />
                  </span>
                  <div>
                    <div className="flex flex-wrap items-center gap-2.5">
                      <h1 className="text-2xl font-black tracking-tight text-slate-900 md:text-3xl">
                        {pathTitle}
                      </h1>
                    </div>
                    <p className="mt-1.5 max-w-3xl text-sm font-normal leading-relaxed text-slate-600">
                      {pathDescription ||
                        'Một con đường liền mạch từ bảng chữ cái Hangeul đến TOPIK II. Mỗi chặng TOPIK bạn tự chọn giáo trình muốn theo — lộ trình 35–80 buổi bám đúng giáo trình đó, kèm luyện Nghe · Đọc · Viết bóc từ đề TOPIK thật và đề mix ở các buổi mốc. Đã có nền tảng? Vào thẳng chặng bạn muốn.'}
                    </p>
                  </div>
                </div>

                {isAdmin && (
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowAdminModal(true)}
                      className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-800 bg-[#FEF08A] px-3.5 text-xs font-bold text-amber-950 shadow-sm transition hover:bg-amber-200"
                    >
                      <Settings2 className="size-4 text-amber-800" />
                      <span>Quản lý Lộ trình (Admin)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowStudentTrackingModal(true)}
                      className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-800 bg-[#DCFCE7] px-3.5 text-xs font-bold text-emerald-950 shadow-sm transition hover:bg-emerald-200"
                    >
                      <Users className="size-4 text-emerald-800" />
                      <span>Theo dõi học viên</span>
                    </button>
                  </div>
                )}
              </div>

              {showSourcesPanel && (
                <div className="mt-5 overflow-x-auto rounded-xl border border-slate-800 bg-slate-50 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <h2 className="text-sm font-bold text-slate-900">
                      Thống kê Nguồn dữ liệu Giáo trình & Giấy phép trong SQL Server (dbo.ContentSources)
                    </h2>
                    <button
                      type="button"
                      onClick={() => setShowSourcesPanel(false)}
                      className="text-xs font-semibold text-slate-500 hover:text-slate-900"
                    >
                      Đóng
                    </button>
                  </div>
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-300 text-slate-600">
                        <th className="py-2 pr-3">Tên nguồn</th>
                        <th className="py-2 pr-3">Loại dữ liệu</th>
                        <th className="py-2 pr-3">Số bản ghi thực tế</th>
                        <th className="py-2 pr-3">Định dạng</th>
                        <th className="py-2 pr-3">Giấy phép</th>
                        <th className="py-2 pr-3">Bảng đích</th>
                        <th className="py-2">Tình trạng</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {contentSources.map((src) => (
                        <tr key={src.SourceCode} className="align-top">
                          <td className="py-2.5 pr-3 font-semibold text-slate-900">
                            <div>{src.SourceName}</div>
                            <div className="mt-0.5 text-[11px] font-normal text-slate-500">
                              {src.DatasetOrApiName}
                            </div>
                          </td>
                          <td className="py-2.5 pr-3 text-slate-600">{src.DataType}</td>
                          <td className="py-2.5 pr-3 font-mono font-bold text-emerald-700">
                            {src.VerifiedRecordCount.toLocaleString('vi-VN')}
                          </td>
                          <td className="py-2.5 pr-3 text-slate-600">{src.DataFormat}</td>
                          <td className="py-2.5 pr-3 font-semibold text-amber-800">{src.LicenseName}</td>
                          <td className="py-2.5 pr-3 font-mono text-sky-800">{src.TargetTable}</td>
                          <td className="py-2.5 text-slate-600">{src.AvailabilityStatus}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {/* Banner Thông báo Admin đang theo dõi tiến độ học viên cụ thể */}
            {inspectingStudent && (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border-[1.5px] border-emerald-600 bg-emerald-50 p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex size-11 items-center justify-center rounded-xl border border-emerald-600 bg-emerald-200 text-emerald-900">
                    <Users className="size-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
                        Chế độ Quản trị viên
                      </span>
                      <span className="rounded-full bg-emerald-200 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-900">
                        Đang xem tiến độ thực tế học viên
                      </span>
                    </div>
                    <p className="mt-0.5 text-sm font-bold text-slate-900">
                      {inspectingStudent.displayName}{' '}
                      <span className="font-normal text-slate-600">({inspectingStudent.email})</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowStudentTrackingModal(true)}
                    className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-800 bg-white px-3.5 text-xs font-bold text-slate-800 shadow-sm transition hover:bg-slate-50"
                  >
                    <Users className="size-3.5" />
                    <span>Chọn học viên khác</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setInspectingStudent(null)
                      void fetchLearningPath('')
                    }}
                    className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-800 bg-white px-3.5 text-xs font-bold text-slate-800 shadow-sm transition hover:bg-slate-50"
                  >
                    <X className="size-3.5" />
                    <span>Thoát xem học viên</span>
                  </button>
                </div>
              </div>
            )}

            {/* 1.2 Khu vực "Hành trình của bạn 🚩" (Ẩn trên giao diện Admin; chỉ hiển thị cho Học viên) */}
            {showStudentProgress && journey && (
              <section
                aria-label="Hành trình của bạn"
                className="rounded-2xl border-[1.5px] border-slate-800 bg-white p-5 shadow-[0_2px_0_rgba(15,23,42,0.06)] md:p-6"
              >
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-extrabold text-slate-900 md:text-lg">
                        Hành trình của bạn
                      </h2>
                      <Flag className="size-4 fill-rose-500 text-rose-500" aria-hidden="true" />
                    </div>
                    <p className="mt-1 text-sm text-slate-600">
                      Bạn đang ở{' '}
                      <strong className="font-bold text-slate-900">
                        {journey.currentLevelBadge} · {journey.currentLevelTitle}.
                      </strong>
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleContinueLearning}
                    className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-900 bg-[#2563EB] px-6 text-sm font-bold text-white shadow-sm transition-all hover:bg-blue-600"
                  >
                    <span>Tiếp tục học</span>
                    <ChevronRight className="size-4" aria-hidden="true" />
                  </button>
                </div>

                <div className="mt-4 flex items-center gap-4">
                  <div className="h-3 flex-1 overflow-hidden rounded-full border border-slate-800 bg-white">
                    <div
                      className="h-full rounded-full bg-[#2563EB] transition-all duration-500"
                      style={{
                        width: `${Math.max(journey.overallProgressPercent > 0 ? 3 : 0, journey.overallProgressPercent)}%`,
                      }}
                    />
                  </div>
                  <span className="shrink-0 text-xs font-bold text-slate-900">
                    {journey.overallProgressPercent}% toàn lộ trình
                  </span>
                </div>
              </section>
            )}

            {error && (
              <div className="flex items-center gap-3 rounded-xl border border-red-500 bg-red-50 p-4 text-sm text-red-900">
                <AlertCircle className="size-5 shrink-0 text-red-600" />
                <span>{error}</span>
              </div>
            )}

            {/* 1.3 Hành trình dọc 7 chặng (Vertical Timeline chuẩn Hình 1 & 2) */}
            <section aria-label="Danh sách 7 chặng lộ trình" className="relative flex flex-col gap-6">
              {levels.map((lv, idx) => {
                const isLast = idx === levels.length - 1
                return (
                  <div key={lv.levelCode} className="relative flex items-stretch gap-4 md:gap-6">
                    {/* Cột trái: Biểu tượng chặng (한글, 1급..6급) + Đường nối dọc */}
                    <div className="flex flex-col items-center">
                      <button
                        type="button"
                        onClick={() => handleOpenStage(lv.levelId)}
                        className={cn(
                          'flex size-14 shrink-0 items-center justify-center rounded-2xl text-base font-black transition-transform hover:scale-105 md:size-16 md:text-lg',
                          getBadgeStyle(lv.badgeColor),
                        )}
                        title={`Xem chi tiết chặng ${lv.title}`}
                      >
                        {lv.badgeText}
                      </button>
                      {!isLast && (
                        <div
                          aria-hidden="true"
                          className="my-1.5 w-1 flex-1 rounded-full bg-[#60A5FA]"
                        />
                      )}
                    </div>

                    {/* Cột phải: Thẻ thông tin chặng */}
                    <div className="min-w-0 flex-1">
                      <div
                        onClick={() => handleOpenStage(lv.levelId)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            void handleOpenStage(lv.levelId)
                          }
                        }}
                        className="cursor-pointer rounded-2xl border-[1.5px] border-slate-800 bg-white p-5 shadow-[0_2px_0_rgba(15,23,42,0.06)] transition-all hover:shadow-md md:p-6"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-lg font-extrabold text-slate-900 md:text-xl">
                                {lv.title}
                              </h3>
                              <span className="rounded-md border border-amber-400 bg-[#FEF08A] px-2.5 py-0.5 text-xs font-bold text-amber-950">
                                {lv.topikLevel}
                              </span>
                              {lv.displayOrder > 1 && (
                                <span className="inline-flex items-center gap-1 rounded-md border border-emerald-400 bg-[#DCFCE7] px-2.5 py-0.5 text-xs font-bold text-emerald-900">
                                  <BookOpen className="size-3.5" aria-hidden="true" />
                                  {lv.textbookName}
                                </span>
                              )}
                              <span className="text-xs font-semibold text-slate-500">
                                {lv.lessonsCount === 9
                                  ? '9 buổi'
                                  : lv.displayOrder === 2
                                    ? '45 buổi'
                                    : lv.displayOrder === 3
                                      ? '35–80 buổi'
                                      : '60–80 buổi'}
                              </span>
                            </div>
                            <p className="mt-1.5 text-sm font-normal leading-relaxed text-slate-600">{lv.description}</p>
                          </div>

                          {/* Nút Trạng thái & Nút (>) mở Chi tiết Chặng */}
                          <div className="flex items-center gap-2">
                            {showStudentProgress ? (
                              <>
                                {lv.unlockStatus === 'InProgress' ? (
                                  <span className="inline-flex h-8 items-center gap-1.5 rounded-full bg-[#2563EB] px-3.5 text-xs font-bold text-white shadow-sm">
                                    Đang học
                                  </span>
                                ) : (
                                  <span className="inline-flex h-8 items-center gap-1.5 rounded-md border border-slate-800 bg-white px-3.5 text-xs font-semibold text-slate-800 hover:bg-slate-50">
                                    {lv.unlockStatus === 'Completed' ? '✓ Đã học' : 'Vào học'}
                                  </span>
                                )}
                              </>
                            ) : (
                              <span className="inline-flex h-8 items-center gap-1.5 rounded-md border border-slate-800 bg-white px-3.5 text-xs font-semibold text-slate-800 hover:bg-slate-50">
                                Xem nội dung
                              </span>
                            )}

                            <span
                              className={cn(
                                'flex size-8 items-center justify-center rounded-lg border border-slate-800 transition-colors',
                                showStudentProgress && lv.unlockStatus === 'InProgress'
                                  ? 'bg-white text-slate-900'
                                  : 'bg-[#2563EB] text-white',
                              )}
                              aria-hidden="true"
                            >
                              <ChevronRight className="size-4" />
                            </span>
                          </div>
                        </div>

                        {/* Các thẻ kỹ năng (Từ vựng, Nghe hiểu, Ngữ pháp, Luyện đề, Ôn tập & kiểm tra) */}
                        <div className="mt-4 flex flex-wrap gap-2">
                          {lv.skills.map((skill) => {
                            const Icon = getSkillIcon(skill)
                            return (
                              <span
                                key={skill}
                                className="inline-flex items-center gap-1.5 rounded-md border border-slate-700/80 bg-white px-2.5 py-1 text-xs font-semibold text-slate-800"
                              >
                                <Icon className="size-3.5 text-slate-600" aria-hidden="true" />
                                {skill}
                              </span>
                            )
                          })}
                        </div>

                        {/* Thanh tiến độ từng chặng (chỉ hiển thị cho Học viên) */}
                        {showStudentProgress && (
                          <div className="mt-4 flex items-center gap-3">
                            <div className="h-2 flex-1 overflow-hidden rounded-full border border-slate-800 bg-slate-100">
                              <div
                                className="h-full rounded-full bg-[#2563EB] transition-all duration-500"
                                style={{
                                  width: `${Math.max(lv.progressPercent > 0 ? 3 : 0, lv.progressPercent)}%`,
                                }}
                              />
                            </div>
                            <span className="shrink-0 text-xs font-medium text-slate-500">
                              {lv.completedLessonsCount === 0 && lv.progressPercent === 0
                                ? 'Chưa bắt đầu'
                                : `${lv.completedLessonsCount}/${lv.lessonsCount} buổi (${lv.progressPercent}%)`}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </section>
          </>
        )}

      {/* =====================================================================
          VIEW 2: MÀN HÌNH CHI TIẾT CHẶNG (TIMELINE TRỤC GIỮA SO LE TRÁI/PHẢI - HÌNH 3 & 4)
      ===================================================================== */}
      {viewMode === 'stage' && selectedLevel && (
        <div className="flex flex-col gap-6">
          {/* Nút quay lại Tất cả lộ trình */}
          <div>
            <button
              type="button"
              onClick={() => setViewMode('all')}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 transition-colors hover:text-slate-900"
            >
              <ChevronLeft className="size-4" />
              <span>Tất cả lộ trình</span>
            </button>
          </div>

          {/* Header Chặng (Hình 3: [한글] Bảng chữ cái Hangeul [Nhập môn]) */}
          <section className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div
                className={cn(
                  'flex size-14 shrink-0 items-center justify-center rounded-2xl border-2 text-xl font-black shadow-[0_2px_0_rgba(15,23,42,0.12)] md:size-16',
                  getBadgeStyle(selectedLevel.badgeColor),
                )}
              >
                {selectedLevel.badgeText}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <h1 className="text-2xl font-black text-slate-900 md:text-3xl">
                    {selectedLevel.title}
                  </h1>
                  <span className="rounded-md border border-amber-400 bg-[#FEF08A] px-2.5 py-0.5 text-xs font-bold text-amber-950">
                    {selectedLevel.topikLevel}
                  </span>
                </div>
                <p className="mt-1.5 text-sm font-normal text-slate-600">
                  {selectedLevel.description}
                </p>
              </div>
            </div>

            {/* Chuyển đổi nhanh giữa các chặng hoặc xem theo chủ đề */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  setStageSubView((prev) => (prev === 'spine' ? 'topics' : 'spine'))
                }
                className="rounded-xl border border-slate-800 bg-white px-3.5 py-2 text-xs font-bold text-slate-800 shadow-sm transition hover:bg-slate-50"
              >
                {stageSubView === 'spine'
                  ? `Xem theo ${selectedLevel.topicsCount} chủ đề`
                  : `Xem hành trình ${selectedLevel.lessonsCount} buổi`}
              </button>
            </div>
          </section>

          {/* Hộp tiến độ Chặng (Chỉ hiển thị cho Học viên) */}
          {showStudentProgress && (
            <section className="rounded-2xl border-[1.5px] border-slate-800 bg-white p-5 shadow-[0_2px_0_rgba(15,23,42,0.06)] md:p-6">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900">
                    {selectedLevel.lessonsCount} buổi học
                  </h2>
                  <p className="mt-0.5 text-sm text-slate-600">
                    Đã hoàn thành{' '}
                    <strong className="font-bold text-slate-900">
                      {selectedLevel.completedLessonsCount}/{selectedLevel.lessonsCount}
                    </strong>{' '}
                    buổi trong chặng này.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const nextLesson =
                      selectedStageLessons.find(
                        (l) => l.unlockStatus === 'InProgress' || l.unlockStatus === 'Available',
                      ) || selectedStageLessons[0]
                    if (nextLesson) {
                      void handleOpenLesson(nextLesson.lessonId)
                    }
                  }}
                  className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-900 bg-[#2563EB] px-6 text-sm font-bold text-white shadow-sm transition-all hover:bg-blue-600"
                >
                  <span>Tiếp tục học</span>
                  <ChevronRight className="size-4" />
                </button>
              </div>

              <div className="mt-4 flex items-center gap-4">
                <div className="h-3 flex-1 overflow-hidden rounded-full border border-slate-800 bg-white">
                  <div
                    className="h-full rounded-full bg-[#2563EB] transition-all duration-500"
                    style={{
                      width: `${Math.max(selectedLevel.progressPercent > 0 ? 3 : 0, selectedLevel.progressPercent)}%`,
                    }}
                  />
                </div>
                <span className="shrink-0 text-xs font-bold text-slate-900">
                  {selectedLevel.progressPercent}%
                </span>
              </div>
            </section>
          )}

          {loadingLevelId === selectedLevel.levelId ? (
            <div className="flex items-center justify-center gap-2 py-12 text-sm text-slate-500">
              <Loader2 className="size-5 animate-spin text-[#2563EB]" />
              <span>Đang tải danh sách buổi học từ SQL Server...</span>
            </div>
          ) : stageSubView === 'topics' ? (
            /* Chế độ xem gom theo Chủ đề (Topics) */
            <div className="flex flex-col gap-4">
              {selectedStageTopics.map((tp) => (
                <div
                  key={tp.topicCode}
                  className="rounded-2xl border-[1.5px] border-slate-800 bg-white p-5 shadow-sm"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h3 className="text-base font-extrabold text-slate-900">{tp.title}</h3>
                      <p className="mt-0.5 text-xs text-slate-600">{tp.description}</p>
                    </div>
                    <span className="rounded-full border border-slate-800 bg-slate-100 px-3 py-1 text-xs font-bold text-slate-800">
                      {tp.lessonsCount} buổi học
                    </span>
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {tp.lessons.map((les) => (
                      <button
                        key={les.lessonCode}
                        type="button"
                        onClick={() => handleOpenLesson(les.lessonId)}
                        className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-50 p-4 text-left transition-all hover:border-[#2563EB]"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="rounded bg-[#FEF08A] border border-amber-400 px-2 py-0.5 text-[11px] font-extrabold text-amber-950">
                              Buổi {les.lessonNumber}
                            </span>
                            {showStudentProgress && (
                              <span className="text-xs text-slate-500">
                                {les.unlockStatusLabelVi}
                              </span>
                            )}
                          </div>
                          <p className="mt-1.5 text-sm font-bold text-slate-900">{les.title}</p>
                        </div>
                        <ChevronRight className="size-4 shrink-0 text-slate-400" />
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Chế độ Mặc định: Hành trình Trục giữa So le Trái/Phải chuẩn Hình 3 & 4 */
            <section
              aria-label={`Danh sách ${selectedStageLessons.length} buổi học`}
              className="relative py-2"
            >
              <div className="flex flex-col gap-6">
                {selectedStageLessons.map((les, idx) => {
                  const isOdd = les.lessonNumber % 2 === 1
                  const isActive =
                    les.unlockStatus === 'InProgress' ||
                    (idx === 0 && les.unlockStatus === 'Available')
                  const isCompleted = les.unlockStatus === 'Completed'
                  const isLocked = les.unlockStatus === 'Locked' && !isAdmin
                  const isListeningLesson =
                    les.title.toLowerCase().includes('tổng ôn') || les.lessonNumber === 9
                  const categoryLabel = isListeningLesson ? 'Nghe hiểu' : 'Từ vựng'

                  const activityPills =
                    les.activities && les.activities.length > 0
                      ? les.activities.map((a) => a.title)
                      : ['Học', 'Flashcard', 'Trắc nghiệm', 'Bài kiểm tra']

                  const cardNode = (
                    <div
                      onClick={() => handleOpenLesson(les.lessonId)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          void handleOpenLesson(les.lessonId)
                        }
                      }}
                      className={cn(
                        'group relative flex w-full cursor-pointer items-center justify-between gap-3 rounded-2xl border-[1.5px] border-slate-800 bg-white p-4 shadow-[0_2px_0_rgba(15,23,42,0.06)] transition-all hover:border-blue-500 hover:shadow-md md:p-5',
                        isActive && 'border-2 border-blue-600 shadow-md',
                        isCompleted && 'border-emerald-600',
                      )}
                    >
                      <div className="flex min-w-0 flex-1 items-start gap-3.5">
                        {/* Icon trái (Quyển sách hoặc Tai nghe) */}
                        <div className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl border border-slate-800 bg-slate-50 text-slate-800">
                          {isListeningLesson ? (
                            <Headphones className="size-5 text-slate-800" />
                          ) : (
                            <BookOpen className="size-5 text-slate-800" />
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          {/* Hàng badge: [Buổi X] + [Đang học] */}
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-md border border-amber-400 bg-[#FEF08A] px-2 py-0.5 text-xs font-bold text-amber-950">
                              Buổi {les.lessonNumber}
                            </span>
                            {showStudentProgress && isActive && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-[#2563EB] px-2.5 py-0.5 text-xs font-bold text-white shadow-sm">
                                Đang học
                              </span>
                            )}
                            {showStudentProgress && isCompleted && (
                              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400 bg-[#DCFCE7] px-2.5 py-0.5 text-xs font-bold text-emerald-900">
                                ✓ Đã hoàn thành
                              </span>
                            )}
                            {isLocked && (
                              <span className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-500">
                                <Lock className="size-3" />
                                Chưa mở khóa
                              </span>
                            )}
                          </div>

                          {/* Tiêu đề buổi học */}
                          <h3 className="mt-1 text-sm font-extrabold text-slate-900 md:text-base">
                            {les.title}
                          </h3>

                          {/* Nhãn phân loại (Từ vựng / Nghe hiểu) */}
                          <p className="mt-0.5 text-xs font-semibold text-slate-500">{categoryLabel}</p>

                          {/* Hàng Pills: [⏱ ~30 phút] [Học (5 chữ)] [Flashcard] [Trắc nghiệm] [Bài kiểm tra] [Phiếu luyện viết] */}
                          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                            <span className="inline-flex items-center gap-1 rounded-full bg-[#2563EB] px-2.5 py-0.5 text-xs font-medium text-white">
                              <Clock className="size-3" />
                              {formatEstimatedTime(les.estimatedMinutes)}
                            </span>
                            {activityPills.map((pillTitle, pIdx) => (
                              <span
                                key={pIdx}
                                className="rounded-md border border-slate-700/80 bg-white px-2 py-0.5 text-xs font-medium text-slate-800"
                              >
                                {pillTitle}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Nút mũi tên phải [>] */}
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-slate-800 bg-white text-slate-800 transition-colors group-hover:bg-slate-100">
                        <ChevronRight className="size-4" />
                      </span>
                    </div>
                  )

                  return (
                    <div
                      key={les.lessonCode}
                      className="grid grid-cols-1 items-center gap-4 md:grid-cols-[1fr_auto_1fr]"
                    >
                      {/* Cột trái (Dành cho Buổi lẻ: 1, 3, 5, 7, 9) */}
                      <div className={cn(!isOdd && 'hidden md:block')}>
                        {isOdd ? cardNode : <div />}
                      </div>

                      {/* Cột Trục giữa (Số thứ tự 1..9 + đường kẻ dọc) */}
                      <div className="hidden flex-col items-center self-stretch md:flex">
                        <div className="flex items-center">
                          {isOdd && <div className="h-0.5 w-5 bg-slate-500" />}
                          <button
                            type="button"
                            onClick={() => handleOpenLesson(les.lessonId)}
                            className={cn(
                              'flex size-10 items-center justify-center rounded-lg border-2 border-slate-900 text-sm font-black shadow-sm transition-transform hover:scale-105',
                              showStudentProgress && isActive
                                ? 'bg-[#2563EB] text-white'
                                : showStudentProgress && isCompleted
                                  ? 'bg-[#22C55E] text-slate-950'
                                  : 'bg-white text-slate-900',
                            )}
                          >
                            {les.lessonNumber}
                          </button>
                          {!isOdd && <div className="h-0.5 w-5 bg-slate-500" />}
                        </div>
                        <div className="my-1 w-0.5 flex-1 bg-slate-400" />
                      </div>

                      {/* Cột phải (Dành cho Buổi chẵn: 2, 4, 6, 8; trên mobile hiển thị luôn) */}
                      <div className={cn(isOdd && 'hidden md:block')}>
                        {!isOdd ? cardNode : <div />}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Hộp Cột mốc Hoàn thành Chặng ở đáy trục (Hình 4: "🏁 9 buổi · Hoàn thành chặng Bảng chữ cái Hangeul") */}
              <div className="mt-6 flex justify-center">
                <div className="inline-flex items-center gap-2.5 rounded-2xl border-2 border-dashed border-slate-400 bg-white/90 px-6 py-3.5 text-xs font-bold text-slate-700 shadow-sm">
                  <Flag className="size-4 text-emerald-600" />
                  <span>
                    {selectedLevel.lessonsCount} buổi · Hoàn thành chặng {selectedLevel.title}
                  </span>
                </div>
              </div>
            </section>
          )}
        </div>
      )}

      {/* =====================================================================
          VIEW 3: MÀN HÌNH CHI TIẾT BUỔI HỌC (STEPPER NGANG + THẺ CHỮ PHÁT ÂM - HÌNH 5)
      ===================================================================== */}
      {viewMode === 'lesson' && (
        <div className="flex flex-col gap-5">
          {/* Nút quay lại Chặng */}
          <div>
            <button
              type="button"
              onClick={() => setViewMode('stage')}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 transition-colors hover:text-slate-900"
            >
              <ChevronLeft className="size-4" />
              <span>
                Chặng {activeLessonData?.lesson.levelTitle || selectedLevel?.title || 'Bảng chữ cái Hangeul'}
              </span>
            </button>
          </div>

          {/* Banner Chế độ Xem trước dành cho Quản trị viên */}
          {(isAdmin || inspectingStudent) && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border-[1.5px] border-amber-500 bg-amber-50 p-3.5 shadow-sm text-amber-950">
              <div className="flex items-center gap-2.5">
                <div className="flex size-9 items-center justify-center rounded-xl bg-amber-200 text-amber-800">
                  <ShieldCheck className="size-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-amber-900">
                      Chế độ Xem trước của Quản trị viên (Admin Preview Mode)
                    </span>
                    <span className="rounded bg-amber-200 px-2 py-0.5 text-[10px] font-extrabold uppercase text-amber-950">
                      Bảo vệ dữ liệu
                    </span>
                  </div>
                  <p className="text-[11px] text-amber-800 mt-0.5">
                    Bạn có thể trải nghiệm toàn bộ bài giảng, Flashcard và bài kiểm tra. Khi nộp bài, hệ thống sẽ chấm điểm chi tiết nhưng <strong>KHÔNG</strong> ghi đè tiến độ thật hay cộng điểm XP ảo.
                  </p>
                </div>
              </div>
            </div>
          )}

          {loadingLesson || !activeLessonData ? (
            <div className="flex items-center justify-center gap-3 rounded-2xl border border-slate-800 bg-white p-12 text-sm text-slate-500 shadow-sm">
              <Loader2 className="size-6 animate-spin text-[#2563EB]" />
              <span>Đang tải nội dung buổi học từ SQL Server...</span>
            </div>
          ) : (
            <>
              {/* 3.1 Thẻ Header Buổi học + Thanh Stepper Hoạt động Ngang (Chuẩn Hình 5) */}
              <section className="rounded-2xl border-[1.5px] border-slate-800 bg-white p-5 shadow-[0_2px_0_rgba(15,23,42,0.06)] md:p-6">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="flex size-9 items-center justify-center rounded-lg border-2 border-slate-900 bg-[#22C55E] text-xs font-black text-slate-950 shadow-sm">
                      {activeLessonData.lesson.levelBadge}
                    </span>
                    <span className="rounded-md border border-amber-400 bg-[#FEF08A] px-2.5 py-1 text-xs font-bold text-amber-950">
                      Buổi {activeLessonData.lesson.lessonNumber}/
                      {activeLessonData.lesson.totalLessonsInLevel ||
                        selectedLevel?.lessonsCount ||
                        9}
                    </span>
                  </div>

                  {showStudentProgress && (
                    <span className="rounded-full border border-emerald-400 bg-[#DCFCE7] px-3 py-0.5 text-xs font-bold text-emerald-900">
                      {activeLessonData.lesson.unlockStatusLabelVi} (
                      {activeLessonData.lesson.progressPercent}%)
                    </span>
                  )}
                </div>

                <h1 className="mt-3 text-xl font-black text-slate-900 md:text-2xl tracking-tight">
                  {activeLessonData.lesson.title}
                </h1>
                <p className="mt-1 text-xs font-medium text-slate-600 md:text-sm">
                  {activeLessonData.lesson.subtitle} ·{' '}
                  {formatEstimatedTime(activeLessonData.lesson.estimatedMinutes)}
                </p>

                {/* Hàng Stepper Ngang: [📖 Học ✓] [🗂 Flashcard ✓] [⚡ Trắc nghiệm ✓] [✏️ File viết ✓] [📋 Bài kiểm tra ✓] */}
                <div className="mt-5 flex flex-wrap items-center gap-2.5">
                  {activeLessonData.activities.map((act, idx) => {
                    const meta = getStepperButtonMeta(act.activityType, act.title)
                    const Icon = meta.icon
                    const isCurrent = activeStepIndex === idx
                    return (
                      <button
                        key={act.activityId}
                        type="button"
                        onClick={() => setActiveStepIndex(idx)}
                        className={cn(
                          'inline-flex h-10 items-center gap-2 rounded-xl border px-4 text-xs font-bold transition-all shadow-sm',
                          isCurrent
                            ? 'border-slate-900 bg-[#2563EB] text-white shadow'
                            : 'border-slate-800 bg-white text-slate-800 hover:bg-slate-50',
                        )}
                      >
                        <Icon className="size-4" />
                        <span>{meta.label}</span>
                        {act.isCompleted && (
                          <CheckCircle2
                            className={cn(
                              'size-4',
                              isCurrent ? 'text-emerald-300' : 'text-emerald-600',
                            )}
                          />
                        )}
                      </button>
                    )
                  })}
                </div>
              </section>

              {/* 3.2 Thẻ Nội dung Tương tác theo từng Bước (Step Content Card) */}
              {(() => {
                const currentAct =
                  activeLessonData.activities[activeStepIndex] ||
                  activeLessonData.activities[0]
                const stepType = currentAct?.activityType || 'theory'

                return (
                  <section className="rounded-2xl border-[1.5px] border-slate-800 bg-white p-5 shadow-[0_2px_0_rgba(15,23,42,0.06)] md:p-6">
                    {/* BƯỚC "HỌC" (theory): Lưới thẻ chữ cái Hangeul bấm nghe âm đọc (Chuẩn Hình 5) + Lý thuyết & Từ vựng */}
                    {(stepType === 'theory' || stepType === 'grammar' || stepType === 'vocabulary') && (
                      <div className="flex flex-col gap-6">
                        {jamoSection && jamoSection.examples.length > 0 && (
                          <div>
                            <p className="text-xs font-medium text-slate-600 md:text-sm leading-relaxed">
                              {jamoSection.contentMd ||
                                'Bấm vào từng chữ để nghe âm đọc. Học thuộc mặt chữ + cách đọc rồi thử Flashcard / Trắc nghiệm, hoặc mở File viết để in phiếu tập chữ.'}
                            </p>

                            <div className="mt-4 grid grid-cols-2 gap-3.5 sm:grid-cols-3 md:grid-cols-5">
                              {jamoSection.examples.map((item, jIdx) => {
                                const isSelected = selectedJamoIndex === jIdx
                                return (
                                  <button
                                    key={jIdx}
                                    type="button"
                                    onClick={() => {
                                      setSelectedJamoIndex(jIdx)
                                      speakKorean(item.ko)
                                    }}
                                    className={cn(
                                      'flex min-h-32 flex-col items-center justify-center rounded-2xl border-[1.5px] border-slate-800 bg-white p-5 text-center transition-all hover:bg-blue-50/70 shadow-sm',
                                      isSelected
                                        ? 'border-2 border-[#2563EB] bg-blue-50 shadow-md'
                                        : 'hover:border-blue-500',
                                    )}
                                  >
                                    <span
                                      lang="ko"
                                      className="text-4xl font-black tracking-tight text-slate-900 md:text-5xl"
                                    >
                                      {item.ko}
                                    </span>
                                    <span className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                                      <Volume2 className="size-3.5 text-[#2563EB]" />
                                      <span>{item.roman}</span>
                                    </span>
                                  </button>
                                )
                              })}
                            </div>

                            {/* Gợi ý khẩu hình & phát âm chi tiết khi bấm vào 1 chữ */}
                            {selectedJamoIndex !== null &&
                              jamoSection.examples[selectedJamoIndex] && (
                                <div className="mt-4 flex items-center justify-between gap-4 rounded-xl border border-blue-400 bg-blue-50 p-4 text-xs text-blue-950">
                                  <div>
                                    <span className="font-extrabold text-slate-900">
                                      Chữ {jamoSection.examples[selectedJamoIndex].ko} [
                                      {jamoSection.examples[selectedJamoIndex].roman}]:
                                    </span>{' '}
                                    <span className="text-slate-700">{jamoSection.examples[selectedJamoIndex].vi}</span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      speakKorean(jamoSection.examples[selectedJamoIndex].ko)
                                    }
                                    className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-900 bg-[#2563EB] px-3 py-1.5 font-bold text-white hover:bg-blue-600 shadow-sm"
                                  >
                                    <Volume2 className="size-4" />
                                    Nghe lại
                                  </button>
                                </div>
                              )}
                          </div>
                        )}

                        {/* Phần Lý thuyết chi tiết & Từ vựng ứng dụng của buổi học */}
                        {theorySections.map((sec) => (
                          <div
                            key={sec.sectionId}
                            className="rounded-xl border border-slate-300 bg-slate-50 p-5 text-slate-900"
                          >
                            <h3 className="text-sm font-extrabold text-slate-900">{sec.title}</h3>
                            <div className="mt-2.5 whitespace-pre-line text-xs leading-relaxed text-slate-700 md:text-sm font-normal">
                              {sec.contentMd}
                            </div>
                          </div>
                        ))}

                        {activeLessonData.grammars.length > 0 && (
                          <div className="rounded-xl border border-slate-300 bg-slate-50 p-5 text-slate-900">
                            <h3 className="text-sm font-extrabold text-emerald-900">
                              Cấu trúc Ngữ pháp trọng tâm
                            </h3>
                            <div className="mt-3 grid gap-3">
                              {activeLessonData.grammars.map((gr) => (
                                <div
                                  key={gr.grammarId}
                                  className="rounded-xl border border-slate-800 bg-white p-4 shadow-sm"
                                >
                                  <div className="flex flex-wrap items-center justify-between gap-2">
                                    <span className="text-base font-extrabold text-slate-900">
                                      {gr.pattern}
                                    </span>
                                    <span className="rounded-lg border border-emerald-400 bg-[#DCFCE7] px-2.5 py-0.5 text-xs font-bold text-emerald-900">
                                      {gr.meaningVi}
                                    </span>
                                  </div>
                                  <p className="mt-1.5 text-xs text-slate-600">{gr.usage}</p>
                                  {gr.conjugation && (
                                    <p className="mt-1 text-xs text-violet-800">
                                      <strong>Cách chia:</strong> {gr.conjugation}
                                    </p>
                                  )}
                                  <p className="mt-2 text-xs font-semibold text-slate-900">
                                    예: {gr.exKo} →{' '}
                                    <span className="text-slate-600">{gr.exVi}</span>
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {activeLessonData.vocabularies.length > 0 && (
                          <div>
                            <h3 className="text-sm font-extrabold text-slate-900">
                              Từ vựng ghép vần ứng dụng ({activeLessonData.vocabularies.length} từ)
                            </h3>
                            <div className="mt-3 grid gap-3 sm:grid-cols-2 md:grid-cols-4">
                              {activeLessonData.vocabularies.map((v) => (
                                <button
                                  key={v.vocabId}
                                  type="button"
                                  onClick={() => speakKorean(v.ko)}
                                  className="flex flex-col justify-between rounded-xl border border-slate-800 bg-white p-3.5 text-left transition-colors hover:border-[#2563EB] shadow-sm"
                                >
                                  <div className="flex items-start justify-between gap-2">
                                    <span lang="ko" className="text-xl font-black text-slate-900">
                                      {v.ko}
                                    </span>
                                    <Volume2 className="size-4 text-[#2563EB]" />
                                  </div>
                                  <p className="mt-1 text-xs font-bold text-emerald-800">{v.vi}</p>
                                  <p className="mt-0.5 text-[11px] text-slate-500">
                                    [{v.roman}] · {v.exKo}
                                  </p>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* BƯỚC "FLASHCARD": Lật thẻ 3D chữ cái + từ vựng */}
                    {stepType === 'flashcard' && (
                      <div className="flex flex-col items-center py-4">
                        {combinedFlashcards.length === 0 ? (
                          <p className="text-sm text-slate-500">
                            Không có thẻ Flashcard trong buổi học này.
                          </p>
                        ) : (
                          (() => {
                            const safeIdx =
                              ((flashcardIndex % combinedFlashcards.length) +
                                combinedFlashcards.length) %
                              combinedFlashcards.length
                            const card = combinedFlashcards[safeIdx]
                            return (
                              <div className="w-full max-w-lg">
                                <div className="mb-3 flex items-center justify-between text-xs font-semibold text-slate-500">
                                  <span>{card.typeLabel}</span>
                                  <span>
                                    Thẻ {safeIdx + 1} / {combinedFlashcards.length}
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setFlashcardFlipped((f) => !f)}
                                  className="flex min-h-60 w-full flex-col items-center justify-center rounded-2xl border-2 border-slate-800 bg-white p-8 text-center shadow-md transition-transform hover:scale-[1.01]"
                                >
                                  {!flashcardFlipped ? (
                                    <>
                                      <span className="text-xs font-semibold uppercase tracking-widest text-[#2563EB]">
                                        Bấm vào thẻ để lật xem đáp án
                                      </span>
                                      <p lang="ko" className="mt-5 text-6xl font-black text-slate-900">
                                        {card.front}
                                      </p>
                                    </>
                                  ) : (
                                    <>
                                      <span className="text-xs font-semibold uppercase tracking-widest text-emerald-700">
                                        Cách đọc & Ý nghĩa
                                      </span>
                                      <p className="mt-3 text-2xl font-black text-[#2563EB]">
                                        {card.backTitle}
                                      </p>
                                      <p className="mt-2 text-sm text-slate-700 font-medium">{card.backSub}</p>
                                    </>
                                  )}
                                </button>

                                <div className="mt-4 flex items-center justify-between gap-3">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setFlashcardFlipped(false)
                                      setFlashcardIndex((i) => i - 1)
                                    }}
                                    className="h-10 flex-1 rounded-xl border border-slate-800 bg-white text-xs font-bold text-slate-800 hover:bg-slate-50 shadow-sm"
                                  >
                                    ← Thẻ trước
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => speakKorean(card.front)}
                                    className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-slate-900 bg-[#2563EB] px-5 text-xs font-bold text-white hover:bg-blue-600 shadow-sm"
                                  >
                                    <Volume2 className="size-4" />
                                    Nghe âm đọc
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setFlashcardFlipped(false)
                                      setFlashcardIndex((i) => i + 1)
                                    }}
                                    className="h-10 flex-1 rounded-xl border border-slate-800 bg-white text-xs font-bold text-slate-800 hover:bg-slate-50 shadow-sm"
                                  >
                                    Thẻ tiếp →
                                  </button>
                                </div>
                              </div>
                            )
                          })()
                        )}
                      </div>
                    )}

                    {/* BƯỚC "KIỂM TRA ĐẦU BUỔI" (warmup_quiz) HOẶC "TRẮC NGHIỆM" (practice_quiz) */}
                    {(stepType === 'warmup_quiz' || stepType === 'practice_quiz') && (
                      <div className="flex flex-col gap-5">
                        {interactivePracticeQuestions.length === 0 ? (
                          <p className="text-sm text-slate-500">
                            Bạn đã sẵn sàng! Hãy bấm &ldquo;Bước tiếp theo&rdquo; để tiếp tục.
                          </p>
                        ) : (
                          (() => {
                            const safeQIdx =
                              ((practiceIdx % interactivePracticeQuestions.length) +
                                interactivePracticeQuestions.length) %
                              interactivePracticeQuestions.length
                            const q = interactivePracticeQuestions[safeQIdx]
                            return (
                              <div className="mx-auto w-full max-w-2xl">
                                <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
                                  <span className="font-bold text-[#2563EB]">
                                    {stepType === 'warmup_quiz'
                                      ? '⚡ Khởi động kiểm tra đầu buổi'
                                      : '⚡ Luyện phản xạ Trắc nghiệm mặt chữ & từ vựng'}
                                  </span>
                                  <span>
                                    Câu {safeQIdx + 1}/{interactivePracticeQuestions.length} · Đúng:{' '}
                                    <strong className="text-emerald-700">{practiceScore}</strong>
                                  </span>
                                </div>

                                <div className="mt-3 rounded-2xl border border-slate-800 bg-white p-6 text-center shadow-sm">
                                  <button
                                    type="button"
                                    onClick={() => speakKorean(q.highlight)}
                                    className="mx-auto inline-flex items-center gap-2 rounded-2xl border border-blue-400 bg-blue-50 px-6 py-4 text-4xl font-black text-slate-900 hover:bg-blue-100 transition shadow-sm"
                                  >
                                    <span lang="ko">{q.highlight}</span>
                                    <Volume2 className="size-5 text-[#2563EB]" />
                                  </button>
                                  <p className="mt-4 text-sm font-bold text-slate-900">{q.prompt}</p>

                                  <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
                                    {q.options.map((opt) => {
                                      const picked = practicePickedOption === opt
                                      const isCorrect = opt === q.correctText
                                      return (
                                        <button
                                          key={opt}
                                          type="button"
                                          onClick={() => {
                                            if (practicePickedOption) return
                                            setPracticePickedOption(opt)
                                            if (opt === q.correctText) {
                                              setPracticeScore((s) => s + 1)
                                            }
                                          }}
                                          className={cn(
                                            'rounded-xl border p-3.5 text-sm font-bold transition-all shadow-sm',
                                            practicePickedOption
                                              ? isCorrect
                                                ? 'border-emerald-500 bg-emerald-100 text-emerald-900'
                                                : picked
                                                  ? 'border-red-500 bg-red-100 text-red-900'
                                                  : 'border-slate-300 bg-slate-100 text-slate-400'
                                              : 'border-slate-800 bg-white text-slate-900 hover:border-[#2563EB]',
                                          )}
                                        >
                                          {opt}
                                        </button>
                                      )
                                    })}
                                  </div>

                                  {practicePickedOption && (
                                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-300 bg-slate-50 p-3.5 text-left text-xs">
                                      <div>
                                        <p className="font-bold text-emerald-800">
                                          Đáp án đúng: {q.correctText}
                                        </p>
                                        <p className="mt-0.5 text-slate-600">
                                          {q.explanation}
                                        </p>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setPracticePickedOption(null)
                                          setPracticeIdx((i) => i + 1)
                                        }}
                                        className="rounded-lg border border-slate-900 bg-[#2563EB] px-4 py-2 font-bold text-white hover:bg-blue-600 shadow-sm"
                                      >
                                        Câu tiếp theo →
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )
                          })()
                        )}
                      </div>
                    )}

                    {/* BƯỚC "FILE VIẾT" (writing_sheet): Phiếu tô chữ ô ly Hangeul + Mẫu PE92 SQL Server */}
                    {stepType === 'writing_sheet' && (
                      <div className="flex flex-col gap-6">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <h3 className="text-base font-extrabold text-slate-900">
                              Phiếu luyện viết tô chữ ô ly — {activeLessonData.lesson.title}
                            </h3>
                            <p className="mt-0.5 text-xs text-slate-600">
                              Tập viết theo thứ tự nét từ trái sang phải, từ trên xuống dưới. Có thể in phiếu hoặc mở Bảng viết AI.
                            </p>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={() => window.print()}
                              className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-800 bg-white px-4 text-xs font-bold text-slate-800 hover:bg-slate-50 shadow-sm"
                            >
                              <Printer className="size-4 text-blue-600" />
                              <span>In phiếu tô chữ</span>
                            </button>
                            <Link
                              href="/ai?tab=handwriting"
                              className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-900 bg-[#2563EB] px-4 text-xs font-bold text-white shadow-sm hover:bg-blue-600"
                            >
                              <PenTool className="size-4" />
                              <span>Mở Bảng Ô Ly Luyện Viết AI</span>
                            </Link>
                          </div>
                        </div>

                        {/* Bảng Ô Ly Tô Chữ trực tiếp cho các chữ cái của buổi học */}
                        {jamoSection && jamoSection.examples.length > 0 && (
                          <div className="overflow-x-auto rounded-xl border border-slate-300 bg-white p-4 shadow-sm">
                            <table className="w-full border-collapse text-center">
                              <thead>
                                <tr className="border-b border-slate-300 text-xs text-slate-600">
                                  <th className="p-2 text-left">Chữ mẫu</th>
                                  <th className="p-2 text-left">Âm đọc</th>
                                  <th className="p-2">Ô tô mẫu 1</th>
                                  <th className="p-2">Ô tô mẫu 2</th>
                                  <th className="p-2">Ô tự viết 1</th>
                                  <th className="p-2">Ô tự viết 2</th>
                                  <th className="p-2">Ô tự viết 3</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-200">
                                {jamoSection.examples.slice(0, 8).map((item, idx) => (
                                  <tr key={idx}>
                                    <td className="p-2 text-left">
                                      <span
                                        lang="ko"
                                        className="inline-flex size-12 items-center justify-center rounded-xl border border-slate-800 bg-blue-50 text-2xl font-black text-slate-900 shadow-sm"
                                      >
                                        {item.ko}
                                      </span>
                                    </td>
                                    <td className="p-2 text-left text-xs font-bold text-[#2563EB]">
                                      {item.roman}
                                    </td>
                                    {[0, 1].map((cell) => (
                                      <td key={cell} className="p-2">
                                        <span
                                          lang="ko"
                                          className="inline-flex size-12 items-center justify-center rounded-lg border border-dashed border-slate-400 bg-slate-50 text-2xl font-black text-slate-300"
                                        >
                                          {item.ko}
                                        </span>
                                      </td>
                                    ))}
                                    {[0, 1, 2].map((cell) => (
                                      <td key={cell} className="p-2">
                                        <span className="inline-flex size-12 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white" />
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}

                        {/* Mẫu chữ viết tay thực tế từ SQL Server PE92 */}
                        {activeLessonData.resources.map((res) => (
                          <div
                            key={res.resourceId}
                            className="rounded-xl border border-slate-300 bg-slate-50 p-4 text-slate-900"
                          >
                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                              Mẫu chữ viết tay thực tế từ SQL Server (dbo.HangulCharacterClasses)
                            </h4>
                            <div className="mt-3 grid gap-3 sm:grid-cols-3 md:grid-cols-5">
                              {res.targetChars.map((ch) => {
                                const folder = CHAR_FOLDER_MAP[ch] || 'ga'
                                return (
                                  <div
                                    key={ch}
                                    className="flex flex-col items-center rounded-xl border border-slate-800 bg-white p-3 shadow-sm"
                                  >
                                    <span lang="ko" className="text-2xl font-black text-slate-900">
                                      {ch}
                                    </span>
                                    <img
                                      src={`/api/dataset/handwriting/image?folder=${folder}&index=0`}
                                      alt={`Mẫu viết tay chữ ${ch}`}
                                      className="mt-2 size-14 rounded-lg border border-slate-300 bg-white object-contain p-1"
                                    />
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* BƯỚC "BÀI KIỂM TRA" (final_test): Chấm điểm Backend >= 80% mở khóa buổi tiếp theo */}
                    {stepType === 'final_test' && (
                      <div className="flex flex-col gap-5">
                        {!activeLessonData.lesson.canTakeFinalQuiz && (
                          <div className="flex items-start justify-between gap-3 rounded-xl border border-amber-500 bg-amber-50 p-4 text-xs text-amber-950 shadow-sm">
                            <div className="flex items-start gap-2.5">
                              <AlertCircle className="mt-0.5 size-4 shrink-0 text-amber-600" />
                              <div>
                                <p className="font-bold">
                                  Bạn còn hoạt động bắt buộc trước bài kiểm tra chưa đánh dấu hoàn thành!
                                </p>
                                <p className="mt-0.5 text-amber-800">
                                  Hãy dùng nút <strong>&ldquo;Bước tiếp theo&rdquo;</strong> ở từng bước trước hoặc bấm nút bên phải để hoàn thành nhanh các bước lý thuyết trước khi nộp bài.
                                </p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={async () => {
                                for (const act of activeLessonData.activities) {
                                  if (act.isRequired && act.activityType !== 'final_test' && !act.isCompleted) {
                                    await handleCompleteActivity(act.activityId, false)
                                  }
                                }
                              }}
                              className="shrink-0 rounded-lg border border-slate-900 bg-[#FEF08A] px-3 py-1.5 font-bold text-amber-950 hover:bg-amber-200 shadow-sm"
                            >
                              Đánh dấu đã học các bước trước
                            </button>
                          </div>
                        )}

                        {activeLessonData.exercises.map((ex) => (
                          <div key={ex.exerciseId} className="flex flex-col gap-4">
                            <div className="rounded-xl border border-slate-300 bg-slate-50 p-4 text-slate-900">
                              <h3 className="text-base font-extrabold text-slate-900">{ex.title}</h3>
                              <p className="mt-1 text-xs text-slate-600">
                                {ex.description} · Ngưỡng đạt:{' '}
                                <strong className="text-emerald-700">{ex.passingScorePercent}%</strong>
                              </p>
                            </div>

                            {ex.questions.map((q, qIdx) => {
                              const reviewItem = quizResult?.questionsReview.find(
                                (r) => r.questionId === q.questionId,
                              )
                              return (
                                <div
                                  key={q.questionId}
                                  className="rounded-2xl border border-slate-300 bg-slate-50 p-5 text-slate-900"
                                >
                                  <div className="flex items-start justify-between gap-2">
                                    <p className="text-sm font-bold text-slate-900">
                                      Câu {qIdx + 1}: {q.promptText}
                                    </p>
                                    {q.koreanHighlight && (
                                      <span
                                        lang="ko"
                                        className="shrink-0 rounded-lg border border-blue-400 bg-blue-100 px-2.5 py-1 text-sm font-extrabold text-blue-900 shadow-sm"
                                      >
                                        {q.koreanHighlight}
                                      </span>
                                    )}
                                  </div>

                                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                                    {q.options.map((opt) => {
                                      const selected = selectedAnswers[q.questionId] === opt.optionId
                                      const isCorrectOpt =
                                        reviewItem && reviewItem.correctOptionId === opt.optionId
                                      const isWrongSelected =
                                        reviewItem && selected && !reviewItem.isCorrect

                                      return (
                                        <button
                                          key={opt.optionId}
                                          type="button"
                                          onClick={() =>
                                            setSelectedAnswers((prev) => ({
                                              ...prev,
                                              [q.questionId]: opt.optionId,
                                            }))
                                          }
                                          className={cn(
                                            'flex items-center gap-2.5 rounded-xl border p-3 text-left text-xs font-semibold transition-all shadow-sm',
                                            isCorrectOpt
                                              ? 'border-emerald-500 bg-emerald-100 text-emerald-950 font-bold'
                                              : isWrongSelected
                                                ? 'border-red-500 bg-red-100 text-red-950'
                                                : selected
                                                  ? 'border-slate-900 bg-[#2563EB] text-white font-bold'
                                                  : 'border-slate-800 bg-white text-slate-900 hover:border-blue-500',
                                          )}
                                        >
                                          <span className={cn(
                                            'flex size-6 shrink-0 items-center justify-center rounded-lg font-bold',
                                            selected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-800'
                                          )}>
                                            {opt.optionLabel}
                                          </span>
                                          <span>{opt.optionText}</span>
                                        </button>
                                      )
                                    })}
                                  </div>

                                  {reviewItem && (
                                    <div
                                      className={cn(
                                        'mt-3 rounded-xl border p-3 text-xs',
                                        reviewItem.isCorrect
                                          ? 'border-emerald-500 bg-emerald-50 text-emerald-950'
                                          : 'border-amber-500 bg-amber-50 text-amber-950',
                                      )}
                                    >
                                      <p className="font-bold">
                                        {reviewItem.isCorrect
                                          ? '✓ Chính xác!'
                                          : `✗ Chưa đúng — Đáp án đúng là ${reviewItem.correctOptionLabel}: ${reviewItem.correctOptionText}`}
                                      </p>
                                      <p className="mt-1 text-slate-700">
                                        💡 Giải thích: {reviewItem.explanationVi}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              )
                            })}

                            {quizResult && (
                              <div
                                className={cn(
                                  'rounded-2xl border-2 p-5 shadow-sm',
                                  quizResult.passed
                                    ? 'border-emerald-600 bg-emerald-50 text-emerald-950'
                                    : 'border-amber-600 bg-amber-50 text-amber-950',
                                )}
                              >
                                <div className="flex flex-wrap items-center justify-between gap-4">
                                  <div>
                                    <h4 className="text-base font-extrabold">
                                      Kết quả: {quizResult.scorePercent}% ({quizResult.correctCount}/
                                      {quizResult.totalQuestions} câu đúng) —{' '}
                                      {quizResult.passed ? 'ĐẠT (>= 80%)' : 'CHƯA ĐẠT (< 80%)'}
                                    </h4>
                                    <p className="mt-1 text-xs">{quizResult.message}</p>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    {!quizResult.passed && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setQuizResult(null)
                                          setSelectedAnswers({})
                                        }}
                                        className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-slate-900 bg-[#FEF08A] px-4 text-xs font-extrabold text-amber-950 shadow-sm hover:bg-amber-200"
                                      >
                                        <RotateCcw className="size-4" />
                                        Làm lại bài kiểm tra
                                      </button>
                                    )}
                                    {quizResult.passed && quizResult.unlockedNextLessonId && (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleOpenLesson(quizResult.unlockedNextLessonId!)
                                        }
                                        className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-slate-900 bg-[#22C55E] px-4 text-xs font-extrabold text-slate-950 shadow-sm hover:bg-emerald-400"
                                      >
                                        <span>Sang buổi học tiếp theo</span>
                                        <ChevronRight className="size-4" />
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}

                            <div className="flex justify-end">
                              <button
                                type="button"
                                disabled={submittingQuiz}
                                onClick={() => handleSubmitQuiz(ex.exerciseId)}
                                className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-900 bg-[#2563EB] px-6 text-sm font-bold text-white shadow-sm hover:bg-blue-600 disabled:opacity-50"
                              >
                                <Sparkles className="size-4" />
                                <span>
                                  {submittingQuiz
                                    ? 'Đang chấm điểm tại Backend...'
                                    : 'Nộp bài kiểm tra cuối buổi'}
                                </span>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>
                )
              })()}

              {/* 3.3 Thanh điều hướng dưới cùng: [< Bước trước] và [Bước tiếp theo ->] (Chuẩn Hình 5) */}
              <div className="flex items-center justify-between gap-4 pt-1">
                <button
                  type="button"
                  disabled={activeStepIndex <= 0}
                  onClick={() => setActiveStepIndex((prev) => Math.max(0, prev - 1))}
                  className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-800 bg-white px-5 text-xs font-bold text-slate-400 transition-colors hover:text-slate-700 disabled:opacity-40 shadow-sm"
                >
                  <ArrowLeft className="size-4" />
                  <span>Bước trước</span>
                </button>

                {activeStepIndex < activeLessonData.activities.length - 1 ? (
                  <button
                    type="button"
                    disabled={completingActivityId !== null}
                    onClick={handleNextStepButton}
                    className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-900 bg-[#2563EB] px-6 text-xs font-bold text-white shadow-sm transition-all hover:bg-blue-600 disabled:opacity-50"
                  >
                    <span>
                      {completingActivityId !== null ? 'Đang lưu tiến độ...' : 'Bước tiếp theo'}
                    </span>
                    <ArrowRight className="size-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setViewMode('stage')}
                    className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-800 bg-white px-6 text-xs font-bold text-slate-800 hover:bg-slate-50 shadow-sm"
                  >
                    <span>Về danh sách buổi học</span>
                    <ChevronRight className="size-4" />
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* Modal Quản trị Nội dung Lộ trình dành cho Admin */}
      {isAdmin && (
        <AdminCurriculumModal
          isOpen={showAdminModal}
          onClose={() => setShowAdminModal(false)}
          token={token}
          levels={levels}
          onRefreshCurriculum={async () => {
            await fetchLearningPath()
            if (selectedLevelId) {
              await fetchLevelDetail(selectedLevelId)
            }
          }}
          onPreviewLesson={(lessonId) => {
            void handleOpenLesson(lessonId)
          }}
        />
      )}

      {/* Modal Theo dõi Tiến độ Học viên dành cho Admin */}
      {isAdmin && (
        <StudentTrackingModal
          isOpen={showStudentTrackingModal}
          onClose={() => setShowStudentTrackingModal(false)}
          token={token}
          onInspectStudent={(st) => {
            setInspectingStudent(st)
            setViewMode('all')
            void fetchLearningPath(st.uid)
          }}
        />
      )}
    </main>
  </div>
)
}
