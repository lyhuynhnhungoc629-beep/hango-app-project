'use client'

import { useEffect, useState } from 'react'
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  BookOpen,
  Check,
  CheckCircle2,
  Clock,
  Edit3,
  Eye,
  FileSpreadsheet,
  FileText,
  HelpCircle,
  Layers,
  Loader2,
  Lock,
  Plus,
  RotateCcw,
  Save,
  ShieldCheck,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react'

interface LevelItem {
  levelId: number
  levelCode: string
  badgeText: string
  badgeColor: string
  title: string
  topikLevel: string
  textbookName: string
  description: string
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
  unlockStatus?: string
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

interface AdminCurriculumModalProps {
  isOpen: boolean
  onClose: () => void
  token: string | null
  levels: LevelItem[]
  onRefreshCurriculum: () => Promise<void>
  onPreviewLesson: (lessonId: number) => void
}

export function AdminCurriculumModal({
  isOpen,
  onClose,
  token,
  levels,
  onRefreshCurriculum,
  onPreviewLesson,
}: AdminCurriculumModalProps) {
  const [activeTab, setActiveTab] = useState<'curriculum' | 'content'>('curriculum')
  const [selectedLevelId, setSelectedLevelId] = useState<number>(levels[0]?.levelId || 1)
  const [topics, setTopics] = useState<TopicItem[]>([])
  const [loadingLevel, setLoadingLevel] = useState(false)
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Forms thêm mới / chỉnh sửa
  const [showAddTopicForm, setShowAddTopicForm] = useState(false)
  const [newTopicTitle, setNewTopicTitle] = useState('')
  const [newTopicDesc, setNewTopicDesc] = useState('')

  const [showAddLessonForm, setShowAddLessonForm] = useState(false)
  const [targetTopicIdForNewLesson, setTargetTopicIdForNewLesson] = useState<number | null>(null)
  const [newLessonTitle, setNewLessonTitle] = useState('')
  const [newLessonSubtitle, setNewLessonSubtitle] = useState('')
  const [newLessonObjective, setNewLessonObjective] = useState('')
  const [newLessonMinutes, setNewLessonMinutes] = useState(25)
  const [newLessonStatus, setNewLessonStatus] = useState<'Published' | 'Draft'>('Published')

  // Content Editor State
  const [editorLessonId, setEditorLessonId] = useState<number | null>(null)
  const [editorContentTab, setEditorContentTab] = useState<'sections' | 'vocab' | 'grammar' | 'questions' | 'resources' | 'rules'>('sections')
  const [lessonDetail, setLessonDetail] = useState<any | null>(null)
  const [loadingLessonDetail, setLoadingLessonDetail] = useState(false)

  // Form states inside editor
  const [newSectionTitle, setNewSectionTitle] = useState('')
  const [newSectionType, setNewSectionType] = useState('content')
  const [newSectionContent, setNewSectionContent] = useState('')

  const [newVocabWordKo, setNewVocabWordKo] = useState('')
  const [newVocabPron, setNewVocabPron] = useState('')
  const [newVocabMeaningVi, setNewVocabMeaningVi] = useState('')
  const [newVocabWordType, setNewVocabWordType] = useState('noun')
  const [newVocabExKo, setNewVocabExKo] = useState('')
  const [newVocabExVi, setNewVocabExVi] = useState('')

  const [newGrammarPatternKo, setNewGrammarPatternKo] = useState('')
  const [newGrammarMeaningVi, setNewGrammarMeaningVi] = useState('')
  const [newGrammarExpVi, setNewGrammarExpVi] = useState('')
  const [newGrammarExKo, setNewGrammarExKo] = useState('')
  const [newGrammarExVi, setNewGrammarExVi] = useState('')

  const [newQuestionPrompt, setNewQuestionPrompt] = useState('')
  const [newQuestionExpVi, setNewQuestionExpVi] = useState('')
  const [newOptionA, setNewOptionA] = useState('')
  const [newOptionB, setNewOptionB] = useState('')
  const [newOptionC, setNewOptionC] = useState('')
  const [newOptionD, setNewOptionD] = useState('')
  const [correctOptionIdx, setCorrectOptionIdx] = useState(0)

  const [newResourceTitle, setNewResourceTitle] = useState('')
  const [newResourceType, setNewResourceType] = useState('worksheet_pdf')
  const [newResourceUrl, setNewResourceUrl] = useState('')

  const [ruleMinScore, setRuleMinScore] = useState(80)
  const [ruleReqMandatory, setRuleReqMandatory] = useState(true)

  const fetchLevelTopics = async (levelId: number) => {
    if (!token) return
    setLoadingLevel(true)
    setStatusMsg(null)
    try {
      const res = await fetch(`/api/learning-levels/${levelId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const json = await res.json()
      if (res.ok && json.success) {
        setTopics(json.topics || [])
        if (!targetTopicIdForNewLesson && json.topics?.[0]) {
          setTargetTopicIdForNewLesson(json.topics[0].topicId)
        }
      }
    } catch {
      setStatusMsg({ type: 'error', text: 'Lỗi tải chủ đề chặng học.' })
    } finally {
      setLoadingLevel(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      void fetchLevelTopics(selectedLevelId)
    }
  }, [isOpen, selectedLevelId])

  const fetchEditorLesson = async (lessonId: number) => {
    if (!token) return
    setLoadingLessonDetail(true)
    try {
      const res = await fetch(`/api/lessons/${lessonId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const json = await res.json()
      if (res.ok && json.success) {
        setLessonDetail(json)
        setRuleMinScore(json.lesson?.minQuizPassPercent ?? 80)
        setRuleReqMandatory(json.lesson?.requireAllMandatoryActivities !== false)
      }
    } catch {
      setStatusMsg({ type: 'error', text: 'Lỗi tải chi tiết buổi học.' })
    } finally {
      setLoadingLessonDetail(false)
    }
  }

  const handleAdminMutate = async (payload: Record<string, unknown>, successText: string) => {
    if (!token) return
    setStatusMsg(null)
    try {
      const res = await fetch('/api/learning-path', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (res.ok && json.success) {
        setStatusMsg({ type: 'success', text: successText })
        await fetchLevelTopics(selectedLevelId)
        if (editorLessonId) {
          await fetchEditorLesson(editorLessonId)
        }
        await onRefreshCurriculum()
      } else {
        setStatusMsg({ type: 'error', text: json.error || 'Cập nhật thất bại.' })
      }
    } catch {
      setStatusMsg({ type: 'error', text: 'Lỗi kết nối máy chủ SQL Server.' })
    }
  }

  const handleCreateTopic = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTopicTitle.trim()) return
    await handleAdminMutate(
      {
        action: 'create_topic',
        levelId: selectedLevelId,
        title: newTopicTitle.trim(),
        description: newTopicDesc.trim(),
        status: 'Published',
      },
      'Đã thêm chủ đề mới vào SQL Server.',
    )
    setNewTopicTitle('')
    setNewTopicDesc('')
    setShowAddTopicForm(false)
  }

  const handleCreateLesson = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newLessonTitle.trim() || !targetTopicIdForNewLesson) return
    await handleAdminMutate(
      {
        action: 'create_lesson',
        levelId: selectedLevelId,
        topicId: targetTopicIdForNewLesson,
        title: newLessonTitle.trim(),
        subtitle: newLessonSubtitle.trim(),
        learningObjective: newLessonObjective.trim(),
        estimatedMinutes: Number(newLessonMinutes) || 25,
        status: newLessonStatus,
      },
      'Đã tạo buổi học mới trong SQL Server.',
    )
    setNewLessonTitle('')
    setNewLessonSubtitle('')
    setNewLessonObjective('')
    setShowAddLessonForm(false)
  }

  const handleTogglePublishLesson = async (lessonId: number, currentStatus?: string) => {
    const nextStatus = currentStatus === 'Published' ? 'Draft' : 'Published'
    await handleAdminMutate(
      {
        action: 'toggle_publish_status',
        target: 'lesson',
        id: lessonId,
        status: nextStatus,
      },
      `Đã chuyển trạng thái buổi học thành: ${nextStatus === 'Published' ? 'Xuất bản' : 'Bản nháp'}.`,
    )
  }

  const handleDeleteLesson = async (lessonId: number) => {
    if (!confirm('Bạn có chắc chắn muốn lưu trữ / ẩn buổi học này không?')) return
    await handleAdminMutate(
      {
        action: 'delete_lesson',
        lessonId,
      },
      'Đã lưu trữ buổi học trong SQL Server.',
    )
  }

  const handleReorderLesson = async (topic: TopicItem, lessonIdx: number, direction: 'up' | 'down') => {
    const list = [...topic.lessons]
    const targetIdx = direction === 'up' ? lessonIdx - 1 : lessonIdx + 1
    if (targetIdx < 0 || targetIdx >= list.length) return
    const temp = list[lessonIdx]
    list[lessonIdx] = list[targetIdx]
    list[targetIdx] = temp

    const orders = list.map((l, idx) => ({
      lessonId: l.lessonId,
      displayOrder: idx + 1,
    }))

    await handleAdminMutate(
      {
        action: 'reorder_lessons',
        orders,
      },
      'Đã cập nhật thứ tự các buổi học.',
    )
  }

  if (!isOpen) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 sm:p-6 backdrop-blur-md"
    >
      <div className="flex max-h-[92vh] w-full max-w-6xl flex-col rounded-3xl border-2 border-amber-400/40 bg-[#0E0E1E] text-white shadow-2xl">
        {/* Header Modal */}
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-300">
              <ShieldCheck className="size-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">Quản trị Lộ trình & Nội dung học tập</h2>
                <span className="rounded-full bg-amber-500/20 px-2.5 py-0.5 text-xs font-semibold text-amber-300">
                  SQL Server: HangoDatasetDB
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Quản lý 7 chặng, chủ đề, buổi học, lý thuyết, từ vựng, ngữ pháp, trắc nghiệm và điều kiện mở khóa.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-9 items-center justify-center rounded-xl bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-white"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Status Msg */}
        {statusMsg && (
          <div
            className={`border-b px-6 py-2.5 text-xs font-semibold ${
              statusMsg.type === 'success'
                ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-200'
                : 'border-rose-500/40 bg-rose-500/15 text-rose-200'
            }`}
          >
            {statusMsg.text}
          </div>
        )}

        {/* Tab Switcher */}
        <div className="flex border-b border-white/10 px-6 pt-2">
          <button
            type="button"
            onClick={() => setActiveTab('curriculum')}
            className={`border-b-2 px-5 py-3 text-xs font-bold transition ${
              activeTab === 'curriculum'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-muted-foreground hover:text-white'
            }`}
          >
            1. Cấu trúc Lộ trình (Chủ đề & Buổi học)
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('content')
              if (!editorLessonId && topics[0]?.lessons[0]) {
                setEditorLessonId(topics[0].lessons[0].lessonId)
                void fetchEditorLesson(topics[0].lessons[0].lessonId)
              }
            }}
            className={`border-b-2 px-5 py-3 text-xs font-bold transition ${
              activeTab === 'content'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-muted-foreground hover:text-white'
            }`}
          >
            2. Soạn thảo Nội dung (Lý thuyết, Từ vựng, Ngữ pháp, Bài thi)
          </button>
        </div>

        {/* Body TAB 1: CURRICULUM */}
        {activeTab === 'curriculum' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            {/* Stage Selector Pills */}
            <div className="flex flex-wrap gap-2 pb-4">
              {levels.map((lv) => (
                <button
                  key={lv.levelId}
                  type="button"
                  onClick={() => setSelectedLevelId(lv.levelId)}
                  className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-bold transition ${
                    selectedLevelId === lv.levelId
                      ? 'border-amber-400 bg-amber-500/20 text-amber-200 shadow-md'
                      : 'border-white/10 bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <span className="rounded bg-black/40 px-1.5 py-0.5 text-[10px] font-black">{lv.badgeText}</span>
                  <span>{lv.title}</span>
                </button>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-y border-white/10 py-3">
              <span className="text-xs font-bold text-white/90">
                Đang quản lý: {levels.find((l) => l.levelId === selectedLevelId)?.title} ({topics.length} chủ đề)
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddTopicForm((v) => !v)}
                  className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-white/20 bg-white/5 px-3 text-xs font-bold text-white hover:bg-white/10"
                >
                  <Plus className="size-3.5 text-amber-400" />
                  <span>{showAddTopicForm ? 'Hủy thêm chủ đề' : 'Thêm chủ đề mới'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddLessonForm((v) => !v)}
                  className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-amber-500 px-3.5 text-xs font-bold text-[#1A1200] hover:bg-amber-400"
                >
                  <Plus className="size-3.5" />
                  <span>{showAddLessonForm ? 'Hủy thêm buổi' : 'Thêm buổi học mới'}</span>
                </button>
              </div>
            </div>

            {/* Form Thêm Chủ đề Mới */}
            {showAddTopicForm && (
              <form onSubmit={handleCreateTopic} className="mb-4 rounded-2xl border border-amber-400/30 bg-amber-500/5 p-4 text-xs">
                <h4 className="font-bold text-amber-300">Thêm chủ đề mới vào chặng hiện tại</h4>
                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="font-semibold text-white/80">Tên chủ đề *</label>
                    <input
                      type="text"
                      required
                      value={newTopicTitle}
                      onChange={(e) => setNewTopicTitle(e.target.value)}
                      placeholder="Ví dụ: Phụ âm kép & Phát âm nâng cao"
                      className="mt-1 h-9 w-full rounded-xl border border-white/15 bg-[#0A0A16] px-3 text-white"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-white/80">Mô tả chủ đề</label>
                    <input
                      type="text"
                      value={newTopicDesc}
                      onChange={(e) => setNewTopicDesc(e.target.value)}
                      placeholder="Mô tả ngắn"
                      className="mt-1 h-9 w-full rounded-xl border border-white/15 bg-[#0A0A16] px-3 text-white"
                    />
                  </div>
                </div>
                <div className="mt-3 flex justify-end gap-2">
                  <button
                    type="submit"
                    className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-amber-400 px-4 font-bold text-[#1A1200] hover:bg-amber-300"
                  >
                    <span>Lưu chủ đề</span>
                  </button>
                </div>
              </form>
            )}

            {/* Form Thêm Buổi học Mới */}
            {showAddLessonForm && (
              <form onSubmit={handleCreateLesson} className="mb-4 rounded-2xl border border-amber-400/30 bg-amber-500/5 p-4 text-xs">
                <h4 className="font-bold text-amber-300">Thêm buổi học mới</h4>
                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div>
                    <label className="font-semibold text-white/80">Thuộc chủ đề *</label>
                    <select
                      value={targetTopicIdForNewLesson || ''}
                      onChange={(e) => setTargetTopicIdForNewLesson(Number(e.target.value))}
                      className="mt-1 h-9 w-full rounded-xl border border-white/15 bg-[#0A0A16] px-3 text-white"
                    >
                      {topics.map((t) => (
                        <option key={t.topicId} value={t.topicId}>
                          {t.title}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="font-semibold text-white/80">Tiêu đề buổi học *</label>
                    <input
                      type="text"
                      required
                      value={newLessonTitle}
                      onChange={(e) => setNewLessonTitle(e.target.value)}
                      placeholder="Ví dụ: Buổi 5: Phụ âm đôi (căng)"
                      className="mt-1 h-9 w-full rounded-xl border border-white/15 bg-[#0A0A16] px-3 text-white"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-white/80">Thời lượng (phút)</label>
                    <input
                      type="number"
                      value={newLessonMinutes}
                      onChange={(e) => setNewLessonMinutes(Number(e.target.value))}
                      className="mt-1 h-9 w-full rounded-xl border border-white/15 bg-[#0A0A16] px-3 text-white"
                    />
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="font-semibold text-white/80">Mô tả tóm tắt</label>
                    <input
                      type="text"
                      value={newLessonSubtitle}
                      onChange={(e) => setNewLessonSubtitle(e.target.value)}
                      placeholder="Nội dung tóm tắt buổi học"
                      className="mt-1 h-9 w-full rounded-xl border border-white/15 bg-[#0A0A16] px-3 text-white"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-white/80">Trạng thái phát hành</label>
                    <select
                      value={newLessonStatus}
                      onChange={(e) => setNewLessonStatus(e.target.value as 'Published' | 'Draft')}
                      className="mt-1 h-9 w-full rounded-xl border border-white/15 bg-[#0A0A16] px-3 text-white"
                    >
                      <option value="Published">Xuất bản ngay (Published)</option>
                      <option value="Draft">Lưu nháp (Draft - Ẩn với học viên)</option>
                    </select>
                  </div>
                </div>
                <div className="mt-3 flex justify-end gap-2">
                  <button
                    type="submit"
                    className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-amber-400 px-4 font-bold text-[#1A1200] hover:bg-amber-300"
                  >
                    <span>Lưu buổi học vào SQL Server</span>
                  </button>
                </div>
              </form>
            )}

            {/* Danh sách Chủ đề & Buổi học */}
            {loadingLevel ? (
              <div className="flex h-48 flex-col items-center justify-center gap-2 text-muted-foreground">
                <Loader2 className="size-6 animate-spin text-amber-400" />
                <p className="text-xs">Đang tải chủ đề và buổi học...</p>
              </div>
            ) : topics.length === 0 ? (
              <p className="text-center text-xs text-muted-foreground">Chặng này chưa có chủ đề nào.</p>
            ) : (
              <div className="space-y-4">
                {topics.map((tp) => (
                  <div key={tp.topicId} className="rounded-2xl border border-white/10 bg-[#121226] p-4">
                    <div className="flex items-center justify-between border-b border-white/10 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="rounded bg-amber-400/20 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                            Chủ đề {tp.displayOrder}
                          </span>
                          <h4 className="font-bold text-white">{tp.title}</h4>
                        </div>
                        {tp.description && <p className="mt-0.5 text-xs text-muted-foreground">{tp.description}</p>}
                      </div>
                      <span className="text-xs font-semibold text-muted-foreground">{tp.lessons.length} buổi học</span>
                    </div>

                    {/* Lessons list */}
                    <div className="mt-3 space-y-2">
                      {tp.lessons.map((ls, idx) => (
                        <div
                          key={ls.lessonId}
                          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-3 text-xs transition hover:bg-white/[0.04]"
                        >
                          <div className="flex items-center gap-3">
                            <span className="flex size-7 items-center justify-center rounded-lg bg-white/10 font-bold text-white">
                              {ls.lessonNumber}
                            </span>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-bold text-white">{ls.title}</p>
                                <span
                                  className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                                    ls.status === 'Draft'
                                      ? 'bg-amber-500/20 text-amber-300'
                                      : 'bg-emerald-500/20 text-emerald-300'
                                  }`}
                                >
                                  {ls.status === 'Draft' ? 'Bản nháp' : 'Đã xuất bản'}
                                </span>
                              </div>
                              <p className="text-[11px] text-muted-foreground">
                                {ls.subtitle || 'Không có mô tả phụ'} · ~{ls.estimatedMinutes} phút
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5">
                            {/* Reorder buttons */}
                            <button
                              type="button"
                              title="Di chuyển lên"
                              disabled={idx === 0}
                              onClick={() => void handleReorderLesson(tp, idx, 'up')}
                              className="flex size-7 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-muted-foreground hover:text-white disabled:opacity-30"
                            >
                              <ArrowUp className="size-3.5" />
                            </button>
                            <button
                              type="button"
                              title="Di chuyển xuống"
                              disabled={idx === tp.lessons.length - 1}
                              onClick={() => void handleReorderLesson(tp, idx, 'down')}
                              className="flex size-7 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-muted-foreground hover:text-white disabled:opacity-30"
                            >
                              <ArrowDown className="size-3.5" />
                            </button>

                            {/* Toggle Publish / Draft */}
                            <button
                              type="button"
                              onClick={() => void handleTogglePublishLesson(ls.lessonId, ls.status)}
                              className="rounded-lg border border-white/15 bg-white/5 px-2.5 py-1.5 text-[11px] font-semibold text-muted-foreground hover:bg-white/10 hover:text-white"
                            >
                              {ls.status === 'Draft' ? 'Xuất bản' : 'Lưu nháp'}
                            </button>

                            {/* Xem trước (Preview) */}
                            <button
                              type="button"
                              onClick={() => {
                                onPreviewLesson(ls.lessonId)
                                onClose()
                              }}
                              className="inline-flex items-center gap-1 rounded-lg border border-blue-400/30 bg-blue-500/20 px-2.5 py-1.5 text-[11px] font-bold text-blue-200 hover:bg-blue-500/30"
                            >
                              <Eye className="size-3.5 text-blue-300" />
                              <span>Xem trước</span>
                            </button>

                            {/* Chỉnh sửa nội dung */}
                            <button
                              type="button"
                              onClick={() => {
                                setEditorLessonId(ls.lessonId)
                                void fetchEditorLesson(ls.lessonId)
                                setActiveTab('content')
                              }}
                              className="inline-flex items-center gap-1 rounded-lg border border-amber-400/30 bg-amber-500/20 px-2.5 py-1.5 text-[11px] font-bold text-amber-200 hover:bg-amber-500/30"
                            >
                              <Edit3 className="size-3.5 text-amber-300" />
                              <span>Soạn nội dung</span>
                            </button>

                            {/* Xóa */}
                            <button
                              type="button"
                              onClick={() => void handleDeleteLesson(ls.lessonId)}
                              className="flex size-7 items-center justify-center rounded-lg text-rose-400 hover:bg-rose-500/20"
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Body TAB 2: CONTENT EDITOR */}
        {activeTab === 'content' && (
          <div className="flex flex-1 flex-col overflow-hidden">
            {/* Header Editor: Lesson Picker */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-white/[0.02] p-4 sm:px-6">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-muted-foreground">Đang soạn:</span>
                <select
                  value={editorLessonId || ''}
                  onChange={(e) => {
                    const id = Number(e.target.value)
                    setEditorLessonId(id)
                    void fetchEditorLesson(id)
                  }}
                  className="h-9 rounded-xl border border-white/15 bg-[#121226] px-3 text-xs font-bold text-white"
                >
                  {topics.flatMap((t) => t.lessons).map((ls) => (
                    <option key={ls.lessonId} value={ls.lessonId}>
                      Buổi {ls.lessonNumber}: {ls.title} ({ls.status === 'Draft' ? 'Nháp' : 'Xuất bản'})
                    </option>
                  ))}
                </select>
              </div>

              {editorLessonId && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      onPreviewLesson(editorLessonId)
                      onClose()
                    }}
                    className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-blue-400/40 bg-blue-500/20 px-3.5 text-xs font-bold text-blue-200 hover:bg-blue-500/30"
                  >
                    <Eye className="size-3.5" />
                    <span>Xem trước bài học ngay</span>
                  </button>
                </div>
              )}
            </div>

            {/* Sub-Tab Navigation for Editor */}
            <div className="flex border-b border-white/10 px-6 pt-2 text-xs font-bold">
              <button
                type="button"
                onClick={() => setEditorContentTab('sections')}
                className={`border-b-2 px-3 py-2 transition ${
                  editorContentTab === 'sections'
                    ? 'border-amber-400 text-amber-300'
                    : 'border-transparent text-muted-foreground hover:text-white'
                }`}
              >
                1. Lý thuyết ({lessonDetail?.sections?.length || 0})
              </button>
              <button
                type="button"
                onClick={() => setEditorContentTab('vocab')}
                className={`border-b-2 px-3 py-2 transition ${
                  editorContentTab === 'vocab'
                    ? 'border-amber-400 text-amber-300'
                    : 'border-transparent text-muted-foreground hover:text-white'
                }`}
              >
                2. Từ vựng & Flashcard ({lessonDetail?.vocabulary?.length || 0})
              </button>
              <button
                type="button"
                onClick={() => setEditorContentTab('grammar')}
                className={`border-b-2 px-3 py-2 transition ${
                  editorContentTab === 'grammar'
                    ? 'border-amber-400 text-amber-300'
                    : 'border-transparent text-muted-foreground hover:text-white'
                }`}
              >
                3. Ngữ pháp ({lessonDetail?.grammar?.length || 0})
              </button>
              <button
                type="button"
                onClick={() => setEditorContentTab('questions')}
                className={`border-b-2 px-3 py-2 transition ${
                  editorContentTab === 'questions'
                    ? 'border-amber-400 text-amber-300'
                    : 'border-transparent text-muted-foreground hover:text-white'
                }`}
              >
                4. Trắc nghiệm & Kiểm tra ({lessonDetail?.exercises?.[0]?.questions?.length || 0})
              </button>
              <button
                type="button"
                onClick={() => setEditorContentTab('resources')}
                className={`border-b-2 px-3 py-2 transition ${
                  editorContentTab === 'resources'
                    ? 'border-amber-400 text-amber-300'
                    : 'border-transparent text-muted-foreground hover:text-white'
                }`}
              >
                5. Tài liệu & Phiếu viết ({lessonDetail?.resources?.length || 0})
              </button>
              <button
                type="button"
                onClick={() => setEditorContentTab('rules')}
                className={`border-b-2 px-3 py-2 transition ${
                  editorContentTab === 'rules'
                    ? 'border-amber-400 text-amber-300'
                    : 'border-transparent text-muted-foreground hover:text-white'
                }`}
              >
                6. Quy tắc hoàn thành
              </button>
            </div>

            {/* Sub-Tab Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 text-xs">
              {loadingLessonDetail ? (
                <div className="flex h-48 flex-col items-center justify-center gap-2 text-muted-foreground">
                  <Loader2 className="size-6 animate-spin text-amber-400" />
                  <p>Đang tải dữ liệu nội dung từ SQL Server...</p>
                </div>
              ) : !lessonDetail ? (
                <p className="text-center text-muted-foreground">Vui lòng chọn buổi học để bắt đầu soạn.</p>
              ) : (
                <>
                  {/* TAB: LÝ THUYẾT */}
                  {editorContentTab === 'sections' && (
                    <div className="space-y-4">
                      <div className="rounded-2xl border border-white/10 bg-[#141428] p-4">
                        <h4 className="font-bold text-amber-300">Thêm mục lý thuyết mới</h4>
                        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <div>
                            <label className="font-semibold text-white/80">Tiêu đề mục</label>
                            <input
                              type="text"
                              value={newSectionTitle}
                              onChange={(e) => setNewSectionTitle(e.target.value)}
                              placeholder="Ví dụ: Quy tắc ghép phụ âm và nguyên âm"
                              className="mt-1 h-9 w-full rounded-xl border border-white/15 bg-[#0A0A16] px-3 text-white"
                            />
                          </div>
                          <div>
                            <label className="font-semibold text-white/80">Loại mục</label>
                            <select
                              value={newSectionType}
                              onChange={(e) => setNewSectionType(e.target.value)}
                              className="mt-1 h-9 w-full rounded-xl border border-white/15 bg-[#0A0A16] px-3 text-white"
                            >
                              <option value="content">Nội dung chính (content)</option>
                              <option value="intro">Giới thiệu (intro)</option>
                              <option value="pronunciation_rule">Quy tắc phát âm (pronunciation_rule)</option>
                              <option value="summary">Tổng kết (summary)</option>
                            </select>
                          </div>
                        </div>
                        <div className="mt-3">
                          <label className="font-semibold text-white/80">Nội dung (Markdown hoặc HTML)</label>
                          <textarea
                            rows={3}
                            value={newSectionContent}
                            onChange={(e) => setNewSectionContent(e.target.value)}
                            placeholder="Nhập nội dung giảng dạy chi tiết..."
                            className="mt-1 w-full rounded-xl border border-white/15 bg-[#0A0A16] p-3 text-white"
                          />
                        </div>
                        <div className="mt-2 flex justify-end">
                          <button
                            type="button"
                            onClick={async () => {
                              if (!newSectionTitle || !editorLessonId) return
                              await handleAdminMutate(
                                {
                                  action: 'save_section',
                                  lessonId: editorLessonId,
                                  title: newSectionTitle,
                                  sectionType: newSectionType,
                                  contentHtmlOrMd: newSectionContent,
                                  displayOrder: (lessonDetail.sections?.length || 0) + 1,
                                },
                                'Đã thêm mục lý thuyết mới.',
                              )
                              setNewSectionTitle('')
                              setNewSectionContent('')
                            }}
                            className="rounded-lg bg-amber-400 px-4 py-1.5 font-bold text-[#1A1200] hover:bg-amber-300"
                          >
                            Lưu mục lý thuyết
                          </button>
                        </div>
                      </div>

                      {/* List existing sections */}
                      <div className="space-y-2">
                        {lessonDetail.sections?.map((sec: any) => (
                          <div key={sec.sectionId} className="flex items-start justify-between rounded-xl border border-white/10 bg-white/[0.02] p-3">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-bold">{sec.sectionType}</span>
                                <p className="font-bold text-white">{sec.title}</p>
                              </div>
                              <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{sec.contentHtmlOrMd}</p>
                            </div>
                            <button
                              type="button"
                              onClick={async () => {
                                if (!confirm('Xóa mục lý thuyết này?')) return
                                await handleAdminMutate(
                                  { action: 'delete_section', sectionId: sec.sectionId },
                                  'Đã xóa mục lý thuyết.',
                                )
                              }}
                              className="text-rose-400 hover:text-rose-300 p-1"
                            >
                              <Trash2 className="size-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* TAB: TỪ VỰNG */}
                  {editorContentTab === 'vocab' && (
                    <div className="space-y-4">
                      <div className="rounded-2xl border border-white/10 bg-[#141428] p-4">
                        <h4 className="font-bold text-amber-300">Thêm từ vựng mới vào buổi học</h4>
                        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                          <div>
                            <label className="font-semibold text-white/80">Từ tiếng Hàn *</label>
                            <input
                              type="text"
                              value={newVocabWordKo}
                              onChange={(e) => setNewVocabWordKo(e.target.value)}
                              placeholder="Ví dụ: 학교"
                              className="mt-1 h-9 w-full rounded-xl border border-white/15 bg-[#0A0A16] px-3 text-white"
                            />
                          </div>
                          <div>
                            <label className="font-semibold text-white/80">Phiên âm</label>
                            <input
                              type="text"
                              value={newVocabPron}
                              onChange={(e) => setNewVocabPron(e.target.value)}
                              placeholder="Ví dụ: hak-gyo"
                              className="mt-1 h-9 w-full rounded-xl border border-white/15 bg-[#0A0A16] px-3 text-white"
                            />
                          </div>
                          <div>
                            <label className="font-semibold text-white/80">Ý nghĩa tiếng Việt *</label>
                            <input
                              type="text"
                              value={newVocabMeaningVi}
                              onChange={(e) => setNewVocabMeaningVi(e.target.value)}
                              placeholder="Ví dụ: Trường học"
                              className="mt-1 h-9 w-full rounded-xl border border-white/15 bg-[#0A0A16] px-3 text-white"
                            />
                          </div>
                        </div>
                        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <div>
                            <label className="font-semibold text-white/80">Câu ví dụ tiếng Hàn</label>
                            <input
                              type="text"
                              value={newVocabExKo}
                              onChange={(e) => setNewVocabExKo(e.target.value)}
                              placeholder="Ví dụ: 저는 학교에 갑니다."
                              className="mt-1 h-9 w-full rounded-xl border border-white/15 bg-[#0A0A16] px-3 text-white"
                            />
                          </div>
                          <div>
                            <label className="font-semibold text-white/80">Dịch nghĩa ví dụ</label>
                            <input
                              type="text"
                              value={newVocabExVi}
                              onChange={(e) => setNewVocabExVi(e.target.value)}
                              placeholder="Ví dụ: Tôi đi đến trường."
                              className="mt-1 h-9 w-full rounded-xl border border-white/15 bg-[#0A0A16] px-3 text-white"
                            />
                          </div>
                        </div>
                        <div className="mt-2 flex justify-end">
                          <button
                            type="button"
                            onClick={async () => {
                              if (!newVocabWordKo || !newVocabMeaningVi || !editorLessonId) return
                              await handleAdminMutate(
                                {
                                  action: 'save_vocab',
                                  lessonId: editorLessonId,
                                  wordKo: newVocabWordKo,
                                  pronunciation: newVocabPron,
                                  meaningVi: newVocabMeaningVi,
                                  wordType: newVocabWordType,
                                  exampleSentenceKo: newVocabExKo,
                                  exampleSentenceVi: newVocabExVi,
                                  displayOrder: (lessonDetail.vocabulary?.length || 0) + 1,
                                },
                                'Đã thêm từ vựng mới vào SQL Server.',
                              )
                              setNewVocabWordKo('')
                              setNewVocabPron('')
                              setNewVocabMeaningVi('')
                              setNewVocabExKo('')
                              setNewVocabExVi('')
                            }}
                            className="rounded-lg bg-amber-400 px-4 py-1.5 font-bold text-[#1A1200] hover:bg-amber-300"
                          >
                            Lưu từ vựng
                          </button>
                        </div>
                      </div>

                      {/* List vocab */}
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        {lessonDetail.vocabulary?.map((v: any) => (
                          <div key={v.vocabId} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.02] p-3">
                            <div>
                              <p className="font-bold text-white text-sm">{v.wordKo} <span className="font-normal text-xs text-muted-foreground">({v.pronunciation})</span></p>
                              <p className="text-xs text-amber-300">{v.meaningVi}</p>
                            </div>
                            <button
                              type="button"
                              onClick={async () => {
                                if (!confirm('Xóa từ vựng này khỏi buổi học?')) return
                                await handleAdminMutate(
                                  { action: 'delete_vocab', lessonId: editorLessonId, vocabId: v.vocabId },
                                  'Đã xóa từ vựng.',
                                )
                              }}
                              className="text-rose-400 hover:text-rose-300 p-1"
                            >
                              <Trash2 className="size-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* TAB: NGỮ PHÁP */}
                  {editorContentTab === 'grammar' && (
                    <div className="space-y-4">
                      <div className="rounded-2xl border border-white/10 bg-[#141428] p-4">
                        <h4 className="font-bold text-amber-300">Thêm ngữ pháp mới</h4>
                        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <div>
                            <label className="font-semibold text-white/80">Cấu trúc ngữ pháp *</label>
                            <input
                              type="text"
                              value={newGrammarPatternKo}
                              onChange={(e) => setNewGrammarPatternKo(e.target.value)}
                              placeholder="Ví dụ: -아요/어요"
                              className="mt-1 h-9 w-full rounded-xl border border-white/15 bg-[#0A0A16] px-3 text-white"
                            />
                          </div>
                          <div>
                            <label className="font-semibold text-white/80">Ý nghĩa tóm tắt *</label>
                            <input
                              type="text"
                              value={newGrammarMeaningVi}
                              onChange={(e) => setNewGrammarMeaningVi(e.target.value)}
                              placeholder="Ví dụ: Đuôi câu trần thuật thân mật"
                              className="mt-1 h-9 w-full rounded-xl border border-white/15 bg-[#0A0A16] px-3 text-white"
                            />
                          </div>
                        </div>
                        <div className="mt-3">
                          <label className="font-semibold text-white/80">Giải thích chi tiết cách dùng</label>
                          <textarea
                            rows={2}
                            value={newGrammarExpVi}
                            onChange={(e) => setNewGrammarExpVi(e.target.value)}
                            placeholder="Quy tắc chia với nguyên âm dương/âm..."
                            className="mt-1 w-full rounded-xl border border-white/15 bg-[#0A0A16] p-3 text-white"
                          />
                        </div>
                        <div className="mt-2 flex justify-end">
                          <button
                            type="button"
                            onClick={async () => {
                              if (!newGrammarPatternKo || !newGrammarMeaningVi || !editorLessonId) return
                              await handleAdminMutate(
                                {
                                  action: 'save_grammar',
                                  lessonId: editorLessonId,
                                  patternKo: newGrammarPatternKo,
                                  meaningVi: newGrammarMeaningVi,
                                  explanationVi: newGrammarExpVi,
                                  exampleSentenceKo: newGrammarExKo,
                                  exampleSentenceVi: newGrammarExVi,
                                  displayOrder: (lessonDetail.grammar?.length || 0) + 1,
                                },
                                'Đã thêm ngữ pháp mới.',
                              )
                              setNewGrammarPatternKo('')
                              setNewGrammarMeaningVi('')
                              setNewGrammarExpVi('')
                            }}
                            className="rounded-lg bg-amber-400 px-4 py-1.5 font-bold text-[#1A1200] hover:bg-amber-300"
                          >
                            Lưu ngữ pháp
                          </button>
                        </div>
                      </div>

                      {/* List grammar */}
                      <div className="space-y-2">
                        {lessonDetail.grammar?.map((g: any) => (
                          <div key={g.grammarId} className="flex items-start justify-between rounded-xl border border-white/10 bg-white/[0.02] p-3">
                            <div>
                              <p className="font-bold text-white text-sm">{g.patternKo} — <span className="font-normal text-amber-300 text-xs">{g.meaningVi}</span></p>
                              <p className="mt-1 text-xs text-muted-foreground">{g.explanationVi}</p>
                            </div>
                            <button
                              type="button"
                              onClick={async () => {
                                if (!confirm('Xóa ngữ pháp này khỏi buổi học?')) return
                                await handleAdminMutate(
                                  { action: 'delete_grammar', lessonId: editorLessonId, grammarId: g.grammarId },
                                  'Đã xóa ngữ pháp.',
                                )
                              }}
                              className="text-rose-400 hover:text-rose-300 p-1"
                            >
                              <Trash2 className="size-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* TAB: TRẮC NGHIỆM */}
                  {editorContentTab === 'questions' && (
                    <div className="space-y-4">
                      <div className="rounded-2xl border border-white/10 bg-[#141428] p-4">
                        <h4 className="font-bold text-amber-300">Thêm câu hỏi trắc nghiệm mới</h4>
                        <div className="mt-3">
                          <label className="font-semibold text-white/80">Câu hỏi (Prompt) *</label>
                          <input
                            type="text"
                            value={newQuestionPrompt}
                            onChange={(e) => setNewQuestionPrompt(e.target.value)}
                            placeholder="Ví dụ: Chữ cái nào sau đây phát âm là [a]?"
                            className="mt-1 h-9 w-full rounded-xl border border-white/15 bg-[#0A0A16] px-3 text-white"
                          />
                        </div>

                        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                          {[
                            { label: 'A', val: newOptionA, set: setNewOptionA, idx: 0 },
                            { label: 'B', val: newOptionB, set: setNewOptionB, idx: 1 },
                            { label: 'C', val: newOptionC, set: setNewOptionC, idx: 2 },
                            { label: 'D', val: newOptionD, set: setNewOptionD, idx: 3 },
                          ].map((opt) => (
                            <div key={opt.label} className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-2">
                              <input
                                type="radio"
                                name="correctOptionRadio"
                                checked={correctOptionIdx === opt.idx}
                                onChange={() => setCorrectOptionIdx(opt.idx)}
                                className="size-4 accent-amber-400"
                              />
                              <span className="font-bold text-amber-300">{opt.label}:</span>
                              <input
                                type="text"
                                value={opt.val}
                                onChange={(e) => opt.set(e.target.value)}
                                placeholder={`Đáp án ${opt.label}`}
                                className="h-8 flex-1 rounded-lg border border-white/10 bg-[#0A0A16] px-2 text-white"
                              />
                            </div>
                          ))}
                        </div>

                        <div className="mt-3">
                          <label className="font-semibold text-white/80">Giải thích đáp án</label>
                          <input
                            type="text"
                            value={newQuestionExpVi}
                            onChange={(e) => setNewQuestionExpVi(e.target.value)}
                            placeholder="Giải thích vì sao đáp án này đúng..."
                            className="mt-1 h-9 w-full rounded-xl border border-white/15 bg-[#0A0A16] px-3 text-white"
                          />
                        </div>

                        <div className="mt-2 flex justify-end">
                          <button
                            type="button"
                            onClick={async () => {
                              const exId = lessonDetail.exercises?.[0]?.exerciseId
                              if (!newQuestionPrompt || !exId) return
                              const options = [
                                { optionLabel: 'A', optionText: newOptionA, isCorrect: correctOptionIdx === 0 },
                                { optionLabel: 'B', optionText: newOptionB, isCorrect: correctOptionIdx === 1 },
                                { optionLabel: 'C', optionText: newOptionC, isCorrect: correctOptionIdx === 2 },
                                { optionLabel: 'D', optionText: newOptionD, isCorrect: correctOptionIdx === 3 },
                              ].filter((o) => o.optionText.trim())

                              await handleAdminMutate(
                                {
                                  action: 'save_question',
                                  exerciseId: exId,
                                  promptText: newQuestionPrompt,
                                  explanationVi: newQuestionExpVi,
                                  options,
                                  displayOrder: (lessonDetail.exercises?.[0]?.questions?.length || 0) + 1,
                                },
                                'Đã thêm câu hỏi trắc nghiệm mới.',
                              )
                              setNewQuestionPrompt('')
                              setNewQuestionExpVi('')
                              setNewOptionA('')
                              setNewOptionB('')
                              setNewOptionC('')
                              setNewOptionD('')
                            }}
                            className="rounded-lg bg-amber-400 px-4 py-1.5 font-bold text-[#1A1200] hover:bg-amber-300"
                          >
                            Lưu câu hỏi
                          </button>
                        </div>
                      </div>

                      {/* List existing questions */}
                      <div className="space-y-2">
                        {lessonDetail.exercises?.[0]?.questions?.map((q: any, idx: number) => (
                          <div key={q.questionId} className="flex items-start justify-between rounded-xl border border-white/10 bg-white/[0.02] p-3">
                            <div>
                              <p className="font-bold text-white">Câu {idx + 1}: {q.promptText}</p>
                              <div className="mt-1 flex flex-wrap gap-2 text-xs">
                                {q.options?.map((o: any) => (
                                  <span
                                    key={o.optionId}
                                    className={`rounded px-2 py-0.5 ${
                                      o.isCorrect ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40' : 'bg-white/5 text-muted-foreground'
                                    }`}
                                  >
                                    {o.optionLabel}. {o.optionText} {o.isCorrect ? '✓' : ''}
                                  </span>
                                ))}
                              </div>
                              {q.explanationVi && (
                                <p className="mt-1 text-[11px] text-amber-300/80">Giải thích: {q.explanationVi}</p>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={async () => {
                                if (!confirm('Xóa câu hỏi này?')) return
                                await handleAdminMutate(
                                  { action: 'delete_question', questionId: q.questionId },
                                  'Đã xóa câu hỏi trắc nghiệm.',
                                )
                              }}
                              className="text-rose-400 hover:text-rose-300 p-1"
                            >
                              <Trash2 className="size-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* TAB: TÀI LIỆU & PHIẾU VIẾT */}
                  {editorContentTab === 'resources' && (
                    <div className="space-y-4">
                      <div className="rounded-2xl border border-white/10 bg-[#141428] p-4">
                        <h4 className="font-bold text-amber-300">Thêm tài liệu hoặc Phiếu luyện viết</h4>
                        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <div>
                            <label className="font-semibold text-white/80">Tiêu đề tài liệu *</label>
                            <input
                              type="text"
                              value={newResourceTitle}
                              onChange={(e) => setNewResourceTitle(e.target.value)}
                              placeholder="Ví dụ: Phiếu tập viết nguyên âm cơ bản (PDF)"
                              className="mt-1 h-9 w-full rounded-xl border border-white/15 bg-[#0A0A16] px-3 text-white"
                            />
                          </div>
                          <div>
                            <label className="font-semibold text-white/80">Đường dẫn tệp (URL / Key)</label>
                            <input
                              type="text"
                              value={newResourceUrl}
                              onChange={(e) => setNewResourceUrl(e.target.value)}
                              placeholder="/resources/hangeul_worksheet_01.pdf"
                              className="mt-1 h-9 w-full rounded-xl border border-white/15 bg-[#0A0A16] px-3 text-white"
                            />
                          </div>
                        </div>
                        <div className="mt-2 flex justify-end">
                          <button
                            type="button"
                            onClick={async () => {
                              if (!newResourceTitle || !editorLessonId) return
                              await handleAdminMutate(
                                {
                                  action: 'save_resource',
                                  lessonId: editorLessonId,
                                  title: newResourceTitle,
                                  resourceType: newResourceType,
                                  fileUrlOrStorageKey: newResourceUrl,
                                  displayOrder: (lessonDetail.resources?.length || 0) + 1,
                                },
                                'Đã thêm tài liệu mới.',
                              )
                              setNewResourceTitle('')
                              setNewResourceUrl('')
                            }}
                            className="rounded-lg bg-amber-400 px-4 py-1.5 font-bold text-[#1A1200] hover:bg-amber-300"
                          >
                            Lưu tài liệu
                          </button>
                        </div>
                      </div>

                      {/* List resources */}
                      <div className="space-y-2">
                        {lessonDetail.resources?.map((r: any) => (
                          <div key={r.resourceId} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.02] p-3">
                            <div>
                              <p className="font-bold text-white">{r.title}</p>
                              <p className="text-[11px] text-muted-foreground">{r.fileUrlOrStorageKey || 'Không có đường dẫn tệp'}</p>
                            </div>
                            <button
                              type="button"
                              onClick={async () => {
                                if (!confirm('Xóa tài liệu này?')) return
                                await handleAdminMutate(
                                  { action: 'delete_resource', resourceId: r.resourceId },
                                  'Đã xóa tài liệu.',
                                )
                              }}
                              className="text-rose-400 hover:text-rose-300 p-1"
                            >
                              <Trash2 className="size-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* TAB: QUY TẮC HOÀN THÀNH */}
                  {editorContentTab === 'rules' && (
                    <div className="rounded-2xl border border-white/10 bg-[#141428] p-5 space-y-4">
                      <h4 className="font-bold text-amber-300 text-sm">Cấu hình điều kiện hoàn thành buổi học</h4>
                      <div>
                        <label className="font-semibold text-white/80">Điểm tối thiểu đạt bài kiểm tra (%)</label>
                        <input
                          type="number"
                          min={50}
                          max={100}
                          value={ruleMinScore}
                          onChange={(e) => setRuleMinScore(Number(e.target.value))}
                          className="mt-1 h-10 w-48 rounded-xl border border-white/15 bg-[#0A0A16] px-3 text-white font-bold"
                        />
                        <p className="mt-1 text-[11px] text-muted-foreground">Mặc định: 80%. Học viên cần đạt từ điểm này trở lên để mở khóa buổi học tiếp theo.</p>
                      </div>

                      <div className="flex items-center gap-2 pt-2">
                        <input
                          type="checkbox"
                          id="reqMandatoryCheck"
                          checked={ruleReqMandatory}
                          onChange={(e) => setRuleReqMandatory(e.target.checked)}
                          className="size-4 accent-amber-400"
                        />
                        <label htmlFor="reqMandatoryCheck" className="font-bold text-white">
                          Bắt buộc hoàn thành tất cả hoạt động lý thuyết, từ vựng, trắc nghiệm trước khi mở bài kiểm tra cuối buổi
                        </label>
                      </div>

                      <div className="pt-3">
                        <button
                          type="button"
                          onClick={async () => {
                            if (!editorLessonId) return
                            await handleAdminMutate(
                              {
                                action: 'update_lesson_rule',
                                lessonId: editorLessonId,
                                minQuizPassPercent: ruleMinScore,
                                requireAllMandatoryActivities: ruleReqMandatory,
                              },
                              'Đã cập nhật quy tắc hoàn thành buổi học.',
                            )
                          }}
                          className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-amber-400 px-5 font-bold text-[#1A1200] hover:bg-amber-300"
                        >
                          <Save className="size-4" />
                          <span>Lưu quy tắc vào SQL Server</span>
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-white/10 px-6 py-3 text-xs text-muted-foreground">
          <span>Tất cả thay đổi lưu trực tiếp vào SQL Server và có hiệu lực tức thì.</span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-white/15 px-4 py-1.5 font-bold text-white hover:bg-white/10"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  )
}
