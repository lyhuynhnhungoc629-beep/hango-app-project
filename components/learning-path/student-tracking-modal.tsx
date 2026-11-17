'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Activity,
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  Compass,
  FileText,
  GraduationCap,
  History,
  Layers,
  Loader2,
  Lock,
  Search,
  Sparkles,
  TrendingUp,
  User,
  Users,
  X,
} from 'lucide-react'

export interface StudentTrackingItem {
  uid: string
  displayName: string
  email: string
  photoURL: string | null
  locked: boolean
  createdAt: string
  lastLoginAt: string
  currentLevelId: number
  currentLevelNumber: number
  currentLevelBadge: string
  currentLevelTitle: string
  currentTopicTitle: string
  currentLessonId: number
  currentLessonNumber: number
  currentLessonCode: string
  currentLessonTitle: string
  completedLessonsCount: number
  totalLessonsCount: number
  overallProgressPercent: number
  totalXp: number
  completedActivitiesCount: number
  inProgressActivitiesCount: number
  totalQuizAttempts: number
  averageQuizScorePercent: number
  lastAccessedAt: string | null
}

export interface StudentHistoryDetail {
  pathData: {
    journey: Record<string, unknown>
    levels: Array<{
      levelId: number
      badgeText: string
      title: string
      unlockStatus: string
      completedLessonsCount: number
      lessonsCount: number
      progressPercent: number
    }>
  }
  quizAttempts: Array<{
    AttemptId: number
    LessonId: number
    LessonNumber: number
    LessonTitle: string
    LevelTitle: string
    LevelBadge: string
    TotalQuestions: number
    CorrectCount: number
    ScorePercent: number
    Passed: boolean
    DurationSeconds: number
    AttemptedAt: string
  }>
  activityProgress: Array<{
    ActivityId: number
    LessonId: number
    LessonTitle: string
    ActivityTitle: string
    ActivityType: string
    IsCompleted: boolean
    ScorePercent: number | null
    TimeSpentSeconds: number
    CompletedAt: string | null
    UpdatedAt: string
  }>
  studySessions: Array<{
    SessionId: number
    LessonId: number
    ActivityId: number | null
    SessionType: string
    DurationSeconds: number
    XpEarned: number
    SummaryText: string
    StartedAt: string
  }>
}

interface StudentTrackingModalProps {
  isOpen: boolean
  onClose: () => void
  token: string | null
  onInspectStudent: (student: StudentTrackingItem) => void
}

export function StudentTrackingModal({
  isOpen,
  onClose,
  token,
  onInspectStudent,
}: StudentTrackingModalProps) {
  const [students, setStudents] = useState<StudentTrackingItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  // Drawer xem chi tiết lịch sử học viên
  const [selectedStudent, setSelectedStudent] = useState<StudentTrackingItem | null>(null)
  const [historyDetail, setHistoryDetail] = useState<StudentHistoryDetail | null>(null)
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [historyTab, setHistoryTab] = useState<'quizzes' | 'activities' | 'sessions'>('quizzes')

  const fetchStudents = async (query = '') => {
    if (!token) return
    setLoading(true)
    setError(null)
    try {
      const qParam = query ? `?q=${encodeURIComponent(query)}` : ''
      const res = await fetch(`/api/learning-progress/students${qParam}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const json = await res.json()
      if (res.ok && json.success) {
        setStudents(json.students || [])
      } else {
        setError(json.error || 'Không thể tải danh sách học viên.')
      }
    } catch {
      setError('Lỗi kết nối khi tải danh sách theo dõi học viên.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      void fetchStudents(searchQuery)
    }
  }, [isOpen])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    void fetchStudents(searchQuery)
  }

  const handleOpenStudentHistory = async (student: StudentTrackingItem) => {
    setSelectedStudent(student)
    setHistoryDetail(null)
    setLoadingHistory(true)
    try {
      const res = await fetch(`/api/learning-progress/students?uid=${encodeURIComponent(student.uid)}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const json = await res.json()
      if (res.ok && json.success) {
        setHistoryDetail(json.history || null)
      }
    } catch {
      // ignore
    } finally {
      setLoadingHistory(false)
    }
  }

  const kpiStats = useMemo(() => {
    const total = students.length
    const active = students.filter((s) => s.overallProgressPercent > 0).length
    const avgScore =
      total > 0
        ? Math.round(students.reduce((acc, s) => acc + (s.averageQuizScorePercent || 0), 0) / total)
        : 0
    const avgProgress =
      total > 0
        ? Math.round(students.reduce((acc, s) => acc + (s.overallProgressPercent || 0), 0) / total)
        : 0
    return { total, active, avgScore, avgProgress }
  }, [students])

  if (!isOpen) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-6 backdrop-blur-md"
    >
      <div className="flex max-h-[92vh] w-full max-w-6xl flex-col rounded-3xl border-2 border-emerald-500/40 bg-[#0E0E1E] text-white shadow-2xl">
        {/* Header Modal */}
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-300">
              <Users className="size-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">Theo dõi tiến độ học viên</h2>
                <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-semibold text-emerald-300">
                  SQL Server & Firestore
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Dữ liệu thực tế 7 chặng, số buổi hoàn thành, hoạt động và điểm kiểm tra tuần tự.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-9 items-center justify-center rounded-xl bg-white/5 text-muted-foreground transition hover:bg-white/10 hover:text-white"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* KPI Strip */}
        <div className="grid grid-cols-2 gap-3 border-b border-white/10 bg-white/[0.02] p-4 sm:grid-cols-4 sm:px-6">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Tổng số học viên
            </p>
            <p className="mt-1 text-2xl font-extrabold text-white">{kpiStats.total}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Đang học tích cực
            </p>
            <p className="mt-1 text-2xl font-extrabold text-emerald-400">{kpiStats.active}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Điểm kiểm tra TB
            </p>
            <p className="mt-1 text-2xl font-extrabold text-amber-300">{kpiStats.avgScore}%</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Tiến độ toàn khóa TB
            </p>
            <p className="mt-1 text-2xl font-extrabold text-blue-400">{kpiStats.avgProgress}%</p>
          </div>
        </div>

        {/* Thanh tìm kiếm */}
        <div className="border-b border-white/10 p-4 sm:px-6">
          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm học viên theo tên, email hoặc UID..."
                className="h-10 w-full rounded-xl border border-white/15 bg-white/5 pl-10 pr-4 text-xs text-white placeholder-muted-foreground focus:border-emerald-400 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-emerald-600 px-4 text-xs font-bold text-white transition hover:bg-emerald-500"
            >
              <span>Tìm kiếm</span>
            </button>
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('')
                  void fetchStudents('')
                }}
                className="inline-flex h-10 items-center rounded-xl border border-white/15 bg-white/5 px-3 text-xs font-semibold text-muted-foreground hover:bg-white/10 hover:text-white"
              >
                Đặt lại
              </button>
            )}
          </form>
        </div>

        {/* Body Modal: Danh sách học viên */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {loading ? (
            <div className="flex h-64 flex-col items-center justify-center gap-2 text-muted-foreground">
              <Loader2 className="size-8 animate-spin text-emerald-400" />
              <p className="text-xs">Đang tải dữ liệu tiến độ học viên từ SQL Server...</p>
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-rose-500/40 bg-rose-500/15 p-4 text-xs text-rose-200">
              {error}
            </div>
          ) : students.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center text-center">
              <User className="size-10 text-muted-foreground/50" />
              <p className="mt-2 text-sm font-semibold text-white/80">Không tìm thấy học viên phù hợp</p>
              <p className="text-xs text-muted-foreground">Thử tìm kiếm với từ khóa khác.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {students.map((st) => (
                <div
                  key={st.uid}
                  className="flex flex-col justify-between rounded-2xl border-2 border-white/10 bg-[#141428] p-4 transition-all hover:border-emerald-500/50 hover:bg-[#16162e]"
                >
                  <div>
                    {/* Header học viên */}
                    <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-3">
                      <div className="flex items-center gap-3">
                        {st.photoURL ? (
                          <img
                            src={st.photoURL}
                            alt={st.displayName}
                            className="size-10 rounded-full border border-white/20 object-cover"
                          />
                        ) : (
                          <div className="flex size-10 items-center justify-center rounded-full bg-emerald-500/20 text-sm font-bold text-emerald-300">
                            {st.displayName ? st.displayName[0]?.toUpperCase() : 'H'}
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-white">{st.displayName}</h3>
                            {st.locked && (
                              <span className="rounded bg-rose-500/20 px-1.5 py-0.5 text-[10px] font-bold text-rose-300">
                                Đã khóa
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">{st.email}</p>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="inline-block rounded-lg bg-emerald-500/20 px-2.5 py-1 text-xs font-extrabold text-emerald-300">
                          {st.currentLevelBadge} · Chặng {st.currentLevelNumber}/7
                        </span>
                        <p className="mt-1 text-[11px] text-muted-foreground">
                          {st.currentLevelTitle}
                        </p>
                      </div>
                    </div>

                    {/* Vị trí hiện tại & Tiến độ */}
                    <div className="mt-3 space-y-2.5 text-xs">
                      <div className="rounded-xl border border-white/5 bg-white/[0.02] p-2.5">
                        <p className="text-[11px] font-semibold text-muted-foreground">
                          Buổi học đang học:
                        </p>
                        <p className="font-bold text-white">
                          {st.currentLessonTitle}
                        </p>
                        <p className="text-[11px] text-white/60">
                          Chủ đề: {st.currentTopicTitle}
                        </p>
                      </div>

                      <div>
                        <div className="flex justify-between text-[11px] font-semibold">
                          <span className="text-muted-foreground">
                            Đã hoàn thành: {st.completedLessonsCount}/{st.totalLessonsCount} buổi
                          </span>
                          <span className="font-extrabold text-emerald-300">
                            {st.overallProgressPercent}%
                          </span>
                        </div>
                        <div className="mt-1 h-2 overflow-hidden rounded-full bg-white/10">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300"
                            style={{ width: `${Math.min(100, Math.max(0, st.overallProgressPercent))}%` }}
                          />
                        </div>
                      </div>

                      {/* Thống kê Hoạt động & Bài kiểm tra */}
                      <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
                        <div className="rounded-lg border border-white/10 bg-white/5 p-2">
                          <p className="text-muted-foreground">Hoạt động buổi học:</p>
                          <p className="mt-0.5 font-bold text-white">
                            <span className="text-emerald-400">✓ {st.completedActivitiesCount} xong</span>
                            <span className="mx-1 text-white/30">·</span>
                            <span className="text-amber-300">{st.inProgressActivitiesCount} dở</span>
                          </p>
                        </div>
                        <div className="rounded-lg border border-white/10 bg-white/5 p-2">
                          <p className="text-muted-foreground">Kiểm tra cuối buổi:</p>
                          <p className="mt-0.5 font-bold text-white">
                            <span className="text-amber-300">{st.averageQuizScorePercent}% TB</span>
                            <span className="mx-1 text-white/30">·</span>
                            <span className="text-muted-foreground">{st.totalQuizAttempts} lần</span>
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Hành động Quản trị viên */}
                  <div className="mt-4 flex items-center justify-end gap-2 border-t border-white/10 pt-3">
                    <button
                      type="button"
                      onClick={() => void handleOpenStudentHistory(st)}
                      className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-3 text-xs font-semibold text-white transition hover:bg-white/10"
                    >
                      <History className="size-3.5 text-violet-300" />
                      <span>Lịch sử chi tiết</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onInspectStudent(st)
                        onClose()
                      }}
                      className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-emerald-400/40 bg-emerald-500/20 px-3.5 text-xs font-bold text-emerald-200 shadow-sm transition hover:bg-emerald-500/30"
                    >
                      <Compass className="size-3.5 text-emerald-300" />
                      <span>Xem hành trình 7 chặng</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-white/10 px-6 py-3 text-xs text-muted-foreground">
          <span>Tổng số {students.length} tài khoản học viên trong cơ sở dữ liệu.</span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-white/15 px-4 py-1.5 font-bold text-white hover:bg-white/10"
          >
            Đóng
          </button>
        </div>
      </div>

      {/* Sub-Drawer / Modal Chi tiết Lịch sử Học viên */}
      {selectedStudent && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-60 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md"
        >
          <div className="flex max-h-[88vh] w-full max-w-3xl flex-col rounded-3xl border-2 border-violet-500/40 bg-[#121226] text-white shadow-2xl">
            {/* Header Drawer */}
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-violet-500/20 text-violet-300">
                  <Activity className="size-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white">
                    Lịch sử học tập: {selectedStudent.displayName}
                  </h3>
                  <p className="text-xs text-muted-foreground">{selectedStudent.email}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedStudent(null)}
                className="flex size-8 items-center justify-center rounded-lg bg-white/5 text-muted-foreground hover:text-white"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Sub-Tabs */}
            <div className="flex border-b border-white/10 px-6 pt-2">
              <button
                type="button"
                onClick={() => setHistoryTab('quizzes')}
                className={`border-b-2 px-4 py-2.5 text-xs font-bold transition ${
                  historyTab === 'quizzes'
                    ? 'border-violet-400 text-violet-300'
                    : 'border-transparent text-muted-foreground hover:text-white'
                }`}
              >
                Bài kiểm tra ({historyDetail?.quizAttempts.length || 0})
              </button>
              <button
                type="button"
                onClick={() => setHistoryTab('activities')}
                className={`border-b-2 px-4 py-2.5 text-xs font-bold transition ${
                  historyTab === 'activities'
                    ? 'border-violet-400 text-violet-300'
                    : 'border-transparent text-muted-foreground hover:text-white'
                }`}
              >
                Hoạt động ({historyDetail?.activityProgress.length || 0})
              </button>
              <button
                type="button"
                onClick={() => setHistoryTab('sessions')}
                className={`border-b-2 px-4 py-2.5 text-xs font-bold transition ${
                  historyTab === 'sessions'
                    ? 'border-violet-400 text-violet-300'
                    : 'border-transparent text-muted-foreground hover:text-white'
                }`}
              >
                Phiên học tập ({historyDetail?.studySessions.length || 0})
              </button>
            </div>

            {/* Content Drawer */}
            <div className="flex-1 overflow-y-auto p-6 text-xs">
              {loadingHistory ? (
                <div className="flex h-48 flex-col items-center justify-center gap-2 text-muted-foreground">
                  <Loader2 className="size-6 animate-spin text-violet-400" />
                  <p>Đang tải chi tiết từ SQL Server...</p>
                </div>
              ) : historyTab === 'quizzes' ? (
                historyDetail?.quizAttempts && historyDetail.quizAttempts.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-white/10 text-[11px] font-semibold uppercase text-muted-foreground">
                          <th className="pb-2">Buổi học</th>
                          <th className="pb-2">Điểm số</th>
                          <th className="pb-2">Kết quả</th>
                          <th className="pb-2">Thời gian làm</th>
                          <th className="pb-2">Ngày làm bài</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {historyDetail.quizAttempts.map((q) => (
                          <tr key={q.AttemptId} className="hover:bg-white/[0.02]">
                            <td className="py-2.5 font-medium text-white">
                              {q.LevelBadge} · Buổi {q.LessonNumber}: {q.LessonTitle}
                            </td>
                            <td className="py-2.5 font-bold">
                              {q.ScorePercent}% ({q.CorrectCount}/{q.TotalQuestions})
                            </td>
                            <td className="py-2.5">
                              {q.Passed ? (
                                <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                                  ĐẠT (≥80%)
                                </span>
                              ) : (
                                <span className="rounded bg-rose-500/20 px-2 py-0.5 text-[10px] font-bold text-rose-300">
                                  CHƯA ĐẠT
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 text-muted-foreground">{q.DurationSeconds}s</td>
                            <td className="py-2.5 text-muted-foreground">
                              {new Date(q.AttemptedAt).toLocaleString('vi-VN')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground">Học viên chưa làm bài kiểm tra nào.</p>
                )
              ) : historyTab === 'activities' ? (
                historyDetail?.activityProgress && historyDetail.activityProgress.length > 0 ? (
                  <div className="space-y-2">
                    {historyDetail.activityProgress.map((act) => (
                      <div
                        key={act.ActivityId}
                        className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] p-3"
                      >
                        <div>
                          <p className="font-bold text-white">{act.ActivityTitle}</p>
                          <p className="text-[11px] text-muted-foreground">
                            {act.LessonTitle} · Loại: {act.ActivityType} · {act.TimeSpentSeconds}s
                          </p>
                        </div>
                        <div>
                          {act.IsCompleted ? (
                            <span className="rounded bg-emerald-500/20 px-2.5 py-1 text-[11px] font-bold text-emerald-300">
                              ✓ Hoàn thành
                            </span>
                          ) : (
                            <span className="rounded bg-amber-500/20 px-2.5 py-1 text-[11px] font-bold text-amber-300">
                              ⏳ Đang dở
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground">Chưa có hoạt động nào được ghi nhận.</p>
                )
              ) : historyDetail?.studySessions && historyDetail.studySessions.length > 0 ? (
                <div className="space-y-2">
                  {historyDetail.studySessions.map((sess) => (
                    <div
                      key={sess.SessionId}
                      className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] p-3"
                    >
                      <div>
                        <p className="font-medium text-white">{sess.SummaryText}</p>
                        <p className="text-[11px] text-muted-foreground">
                          Thời gian: {sess.DurationSeconds}s · Bắt đầu:{' '}
                          {new Date(sess.StartedAt).toLocaleString('vi-VN')}
                        </p>
                      </div>
                      <span className="rounded bg-amber-400/20 px-2 py-0.5 font-bold text-amber-300">
                        +{sess.XpEarned} XP
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground">Chưa có phiên học tập nào.</p>
              )}
            </div>

            {/* Footer Drawer */}
            <div className="flex justify-end border-t border-white/10 p-4">
              <button
                type="button"
                onClick={() => setSelectedStudent(null)}
                className="rounded-xl border border-white/15 px-4 py-1.5 font-bold text-white hover:bg-white/10"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
