'use client'

import { useState } from 'react'
import {
  AlertTriangle,
  Award,
  BookOpen,
  Calendar,
  Clock,
  Eye,
  Flame,
  Lock,
  LockOpen,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  ShieldOff,
  Trash2,
  Trophy,
  X,
} from 'lucide-react'
import type { UserLearningProgress } from '@/lib/backend/user-store'
import { cn } from '@/lib/utils'

export interface AdminUserItem {
  uid: string
  displayName: string
  email: string
  photoURL: string | null
  provider: string
  role: 'student' | 'admin'
  isRootAdmin: boolean
  locked: boolean
  lockedReason: string | null
  level: number
  xp: number
  streak: number
  lastStudyDate: string | null
  totalStudyMinutes: number
  learnedVocabCount: number
  createdAt: string
  lastLoginAt: string
  updatedAt: string
  pomodoroCount?: number
  topikCount?: number
  handwritingCount?: number
}

interface UsersTableProps {
  users: AdminUserItem[]
  actorIsRootAdmin: boolean
  actorUid: string
  token: string | null
  onRefresh: () => Promise<void>
}

const initials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(-2)
    .map((p) => p[0]?.toUpperCase() || '')
    .join('') || 'HG'

function formatDateTime(iso?: string | null) {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}

export function UsersTable({ users, actorIsRootAdmin, actorUid, token, onRefresh }: UsersTableProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'student'>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'locked'>('all')
  const [busyUid, setBusyUid] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  // Modal xác nhận xóa tài khoản
  const [confirmDeleteUser, setConfirmDeleteUser] = useState<AdminUserItem | null>(null)

  // Modal / Drawer xem chi tiết hồ sơ và tiến độ học tập thực tế của học viên
  const [selectedUserDetail, setSelectedUserDetail] = useState<{
    user: AdminUserItem
    progress: UserLearningProgress
  } | null>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)

  const filteredUsers = users.filter((u) => {
    const q = searchQuery.trim().toLowerCase()
    if (
      q &&
      !u.displayName.toLowerCase().includes(q) &&
      !u.email.toLowerCase().includes(q) &&
      !u.uid.toLowerCase().includes(q)
    ) {
      return false
    }
    if (roleFilter === 'admin' && u.role !== 'admin' && !u.isRootAdmin) return false
    if (roleFilter === 'student' && (u.role !== 'student' || u.isRootAdmin)) return false
    if (statusFilter === 'active' && u.locked) return false
    if (statusFilter === 'locked' && !u.locked) return false
    return true
  })

  const handleToggleRole = async (target: AdminUserItem) => {
    if (!actorIsRootAdmin || target.isRootAdmin) return
    setFeedback(null)
    setBusyUid(target.uid)
    const nextRole = target.role === 'admin' ? 'student' : 'admin'
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          action: 'set_role',
          targetUid: target.uid,
          role: nextRole,
        }),
      })
      const json = await res.json()
      if (res.ok && json.success) {
        setFeedback({ type: 'ok', text: json.message })
        await onRefresh()
      } else {
        setFeedback({ type: 'err', text: json.error || 'Không thể thay đổi quyền tài khoản.' })
      }
    } catch {
      setFeedback({ type: 'err', text: 'Lỗi kết nối máy chủ khi thay đổi quyền.' })
    } finally {
      setBusyUid(null)
    }
  }

  const handleToggleLock = async (target: AdminUserItem) => {
    if (target.isRootAdmin) return
    setFeedback(null)
    setBusyUid(target.uid)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          action: 'set_lock',
          targetUid: target.uid,
          locked: !target.locked,
          reason: !target.locked ? 'Tài khoản bị khóa bởi Quản trị viên hệ thống.' : undefined,
        }),
      })
      const json = await res.json()
      if (res.ok && json.success) {
        setFeedback({ type: 'ok', text: json.message })
        await onRefresh()
      } else {
        setFeedback({ type: 'err', text: json.error || 'Không thể khóa/mở khóa tài khoản.' })
      }
    } catch {
      setFeedback({ type: 'err', text: 'Lỗi kết nối máy chủ.' })
    } finally {
      setBusyUid(null)
    }
  }

  const handleConfirmDelete = async () => {
    if (!confirmDeleteUser || confirmDeleteUser.isRootAdmin) return
    const target = confirmDeleteUser
    setFeedback(null)
    setBusyUid(target.uid)
    try {
      const res = await fetch(`/api/admin/users?uid=${encodeURIComponent(target.uid)}`, {
        method: 'DELETE',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      })
      const json = await res.json()
      if (res.ok && json.success) {
        setFeedback({ type: 'ok', text: json.message })
        setConfirmDeleteUser(null)
        if (selectedUserDetail?.user.uid === target.uid) {
          setSelectedUserDetail(null)
        }
        await onRefresh()
      } else {
        setFeedback({ type: 'err', text: json.error || 'Không thể xóa tài khoản.' })
        setConfirmDeleteUser(null)
      }
    } catch {
      setFeedback({ type: 'err', text: 'Lỗi kết nối máy chủ khi xóa tài khoản.' })
      setConfirmDeleteUser(null)
    } finally {
      setBusyUid(null)
    }
  }

  const handleInspectProgress = async (target: AdminUserItem) => {
    setLoadingDetail(true)
    try {
      const res = await fetch(`/api/admin/users?uid=${encodeURIComponent(target.uid)}`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      })
      const json = await res.json()
      if (res.ok && json.success && json.user && json.progress) {
        setSelectedUserDetail({
          user: json.user,
          progress: json.progress,
        })
      }
    } catch {
      // ignore
    } finally {
      setLoadingDetail(false)
    }
  }

  return (
    <section aria-labelledby="users-title" className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="flex flex-col gap-4 border-b border-border p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 id="users-title" className="text-lg font-semibold">
              Quản lý tài khoản & Tiến độ học viên ({filteredUsers.length}/{users.length})
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Dữ liệu tài khoản thực tế. Chọn biểu tượng con mắt để xem chi tiết hồ sơ và toàn bộ tiến độ học tập.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Bộ lọc vai trò */}
            <select
              aria-label="Lọc theo vai trò"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as 'all' | 'admin' | 'student')}
              className="h-9 rounded-xl border border-white/10 bg-field px-3 text-xs font-medium text-foreground focus:border-primary focus:outline-none"
            >
              <option value="all">Tất cả vai trò ({users.length})</option>
              <option value="admin">Admin ({users.filter((u) => u.role === 'admin' || u.isRootAdmin).length})</option>
              <option value="student">Student ({users.filter((u) => u.role === 'student' && !u.isRootAdmin).length})</option>
            </select>

            {/* Bộ lọc trạng thái */}
            <select
              aria-label="Lọc theo trạng thái"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'locked')}
              className="h-9 rounded-xl border border-white/10 bg-field px-3 text-xs font-medium text-foreground focus:border-primary focus:outline-none"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="active">Đang hoạt động ({users.filter((u) => !u.locked).length})</option>
              <option value="locked">Đang bị khóa ({users.filter((u) => u.locked).length})</option>
            </select>

            {/* Ô tìm kiếm theo tên hoặc email */}
            <div className="relative w-full sm:w-60">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm theo tên hoặc email..."
                className="h-9 w-full rounded-xl border border-white/10 bg-field pl-9 pr-3 text-xs placeholder:text-muted-foreground focus:border-primary focus:outline-none"
              />
            </div>
          </div>
        </div>

        {feedback && (
          <div
            role="status"
            className={cn(
              'flex items-center justify-between rounded-xl border px-3.5 py-2.5 text-xs font-medium',
              feedback.type === 'ok'
                ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200'
                : 'border-red-500/40 bg-red-500/10 text-red-200',
            )}
          >
            <span>{feedback.text}</span>
            <button type="button" onClick={() => setFeedback(null)} className="ml-2 text-muted-foreground hover:text-white">
              <X className="size-4" />
            </button>
          </div>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[880px] whitespace-nowrap text-sm">
          <thead>
            <tr className="border-b border-border bg-white/[0.02] text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th scope="col" className="px-5 py-3 font-medium">Tài khoản</th>
              <th scope="col" className="px-4 py-3 font-medium">Vai trò</th>
              <th scope="col" className="px-4 py-3 font-medium">Tiến độ thực tế</th>
              <th scope="col" className="px-4 py-3 font-medium">Ngày đăng ký</th>
              <th scope="col" className="px-4 py-3 font-medium">Trạng thái</th>
              <th scope="col" className="px-5 py-3 text-right font-medium">Thao tác quản trị</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-sm text-muted-foreground">
                  Không tìm thấy tài khoản nào khớp với bộ lọc hiện tại.
                </td>
              </tr>
            ) : (
              filteredUsers.map((u) => {
                const isBusy = busyUid === u.uid
                const canLockOrDelete =
                  !u.isRootAdmin &&
                  u.uid !== actorUid &&
                  (actorIsRootAdmin || u.role === 'student')

                return (
                  <tr key={u.uid} className="border-b border-border last:border-0 hover:bg-white/[0.02]">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <span
                          className={cn(
                            'flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                            u.isRootAdmin
                              ? 'bg-gradient-to-br from-amber-400 to-orange-600 text-[#0F0F1A]'
                              : u.role === 'admin'
                                ? 'bg-gradient-to-br from-emerald-400 to-teal-600 text-[#0F0F1A]'
                                : 'bg-gradient-to-br from-violet-400 to-primary text-white',
                          )}
                        >
                          {initials(u.displayName)}
                        </span>
                        <div>
                          <p className="font-medium text-foreground">{u.displayName}</p>
                          <p className="text-xs text-muted-foreground">{u.email}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      {u.isRootAdmin ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/40 bg-amber-500/20 px-2.5 py-1 text-xs font-bold text-amber-300">
                          <ShieldCheck className="size-3.5" />
                          Quản trị viên
                        </span>
                      ) : u.role === 'admin' ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/40 bg-emerald-500/15 px-2.5 py-1 text-xs font-semibold text-emerald-300">
                          <Shield className="size-3.5" />
                          Quản trị viên
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full border border-sky-400/30 bg-sky-500/15 px-2.5 py-1 text-xs font-medium text-sky-300">
                          Student
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3.5">
                      {u.isRootAdmin || u.role === 'admin' ? (
                        <div className="flex flex-col gap-0.5 text-xs text-muted-foreground">
                          <span className="font-semibold text-amber-300">Tài khoản Quản trị</span>
                          <span>Toàn quyền quản trị hệ thống HANGO</span>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-0.5 text-xs">
                          <span className="font-semibold text-foreground">
                            Cấp {u.level} · {u.xp.toLocaleString('vi-VN')} XP · 🔥 {u.streak} ngày
                          </span>
                          <span className="text-muted-foreground">
                            {u.totalStudyMinutes} phút học · {u.learnedVocabCount} từ vựng · {u.topikCount ?? 0} bài thi TOPIK
                          </span>
                        </div>
                      )}
                    </td>

                    <td className="px-4 py-3.5 text-xs text-muted-foreground">
                      {formatDateTime(u.createdAt)}
                    </td>

                    <td className="px-4 py-3.5">
                      <span
                        className={cn(
                          'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
                          u.locked ? 'bg-red-500/15 text-red-400' : 'bg-green-500/15 text-green-400',
                        )}
                      >
                        <span className={cn('size-1.5 rounded-full', u.locked ? 'bg-red-400' : 'bg-green-400')} />
                        {u.locked ? 'Bị khóa' : 'Hoạt động'}
                      </span>
                    </td>

                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Xem chi tiết hồ sơ & tiến độ học tập */}
                        <button
                          type="button"
                          onClick={() => handleInspectProgress(u)}
                          title={`Xem chi tiết tiến độ của ${u.displayName}`}
                          aria-label={`Xem chi tiết tiến độ của ${u.displayName}`}
                          className="inline-flex h-8 items-center gap-1 rounded-lg border border-border bg-background px-2.5 text-xs font-medium text-violet-300 hover:border-primary/50 hover:text-white"
                        >
                          <Eye className="size-3.5" aria-hidden="true" />
                          <span>Tiến độ</span>
                        </button>

                        {u.isRootAdmin ? (
                          <span
                            title="Tài khoản Admin gốc được bảo vệ tuyệt đối (Không thể khóa, xóa hoặc thu hồi quyền)"
                            className="inline-flex h-8 items-center gap-1 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 text-[11px] font-semibold text-amber-300"
                          >
                            <ShieldCheck className="size-3.5" />
                            Bảo vệ gốc
                          </span>
                        ) : (
                          <>
                            {/* Nút Cấp / Thu hồi quyền Admin (Chỉ hiển thị cho Admin gốc) */}
                            {actorIsRootAdmin && (
                              <button
                                type="button"
                                disabled={isBusy}
                                onClick={() => handleToggleRole(u)}
                                title={
                                  u.role === 'admin'
                                    ? 'Thu hồi quyền Admin (Chuyển về Student)'
                                    : 'Cấp quyền Quản trị viên (Admin)'
                                }
                                className={cn(
                                  'inline-flex h-8 items-center gap-1 rounded-lg border px-2.5 text-xs font-semibold transition-colors disabled:opacity-50',
                                  u.role === 'admin'
                                    ? 'border-amber-500/40 bg-amber-500/15 text-amber-300 hover:bg-amber-500 hover:text-[#0F0F1A]'
                                    : 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500 hover:text-[#0F0F1A]',
                                )}
                              >
                                {u.role === 'admin' ? (
                                  <>
                                    <ShieldOff className="size-3.5" />
                                    <span>Thu hồi Admin</span>
                                  </>
                                ) : (
                                  <>
                                    <ShieldCheck className="size-3.5" />
                                    <span>Cấp Admin</span>
                                  </>
                                )}
                              </button>
                            )}

                            {/* Nút Khóa / Mở khóa tài khoản */}
                            {canLockOrDelete && (
                              <button
                                type="button"
                                disabled={isBusy}
                                onClick={() => handleToggleLock(u)}
                                title={u.locked ? `Mở khóa ${u.displayName}` : `Khóa tài khoản ${u.displayName}`}
                                aria-label={u.locked ? `Mở khóa ${u.displayName}` : `Khóa tài khoản ${u.displayName}`}
                                className={cn(
                                  'flex size-8 items-center justify-center rounded-lg border transition-colors disabled:opacity-50',
                                  u.locked
                                    ? 'border-green-500/40 bg-green-500/15 text-green-300 hover:bg-green-500 hover:text-[#0F0F1A]'
                                    : 'border-border bg-background text-muted-foreground hover:border-amber-500/50 hover:text-amber-300',
                                )}
                              >
                                {u.locked ? <LockOpen className="size-4" /> : <Lock className="size-4" />}
                              </button>
                            )}

                            {/* Nút Xóa tài khoản (kèm xác nhận) */}
                            {canLockOrDelete && (
                              <button
                                type="button"
                                disabled={isBusy}
                                onClick={() => setConfirmDeleteUser(u)}
                                title={`Xóa tài khoản ${u.displayName}`}
                                aria-label={`Xóa tài khoản ${u.displayName}`}
                                className="flex size-8 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground transition-colors hover:border-red-500/50 hover:bg-red-500/15 hover:text-red-400 disabled:opacity-50"
                              >
                                <Trash2 className="size-4" />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal xác nhận xóa tài khoản */}
      {confirmDeleteUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-dialog-title"
            className="w-full max-w-md rounded-2xl border border-red-500/40 bg-card p-6 shadow-2xl"
          >
            <div className="flex items-center gap-3 text-red-400">
              <span className="flex size-11 items-center justify-center rounded-xl bg-red-500/15">
                <AlertTriangle className="size-6" />
              </span>
              <div>
                <h3 id="delete-dialog-title" className="text-lg font-bold text-foreground">
                  Xác nhận xóa tài khoản
                </h3>
                <p className="text-xs text-muted-foreground">Hành động này không thể hoàn tác</p>
              </div>
            </div>

            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              Bạn có chắc chắn muốn xóa tài khoản của{' '}
              <strong className="text-foreground">{confirmDeleteUser.displayName}</strong> (
              <code>{confirmDeleteUser.email}</code>)?
            </p>
            <p className="mt-2 rounded-xl bg-red-500/10 p-3 text-xs text-red-200">
              Hệ thống sẽ xóa đồng bộ tài khoản khỏi <strong>Firebase Authentication</strong>, hồ sơ người dùng trên{' '}
              <strong>Cloud Firestore</strong> và toàn bộ lịch sử học tập (SRS, Pomodoro, Luyện viết, kết quả thi TOPIK) để tránh dữ liệu mồ côi.
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmDeleteUser(null)}
                className="h-10 rounded-xl border border-border bg-background px-4 text-xs font-semibold hover:bg-white/5"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={busyUid === confirmDeleteUser.uid}
                onClick={handleConfirmDelete}
                className="h-10 rounded-xl bg-red-500 px-4 text-xs font-semibold text-white hover:bg-red-600 disabled:opacity-50"
              >
                {busyUid === confirmDeleteUser.uid ? 'Đang xóa đồng bộ...' : 'Xác nhận xóa vĩnh viễn'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal xem chi tiết Hồ sơ & Tiến độ học tập thực tế của Học viên */}
      {(selectedUserDetail || loadingDetail) && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60">
          <aside
            aria-label="Chi tiết hồ sơ và tiến độ học tập"
            className="flex h-full w-full max-w-2xl flex-col gap-6 overflow-y-auto border-l border-border bg-card p-6 shadow-2xl"
          >
            {loadingDetail || !selectedUserDetail ? (
              <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
                Đang tải dữ liệu tiến độ học tập thực tế...
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between gap-4 border-b border-border pb-4">
                  <div className="flex items-center gap-3.5">
                    <span className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-400 to-primary text-lg font-bold text-white">
                      {initials(selectedUserDetail.user.displayName)}
                    </span>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-xl font-bold">{selectedUserDetail.user.displayName}</h3>
                        <span className="rounded-full bg-primary/20 px-2.5 py-0.5 text-xs font-bold text-violet-300">
                          Cấp {selectedUserDetail.user.level}
                        </span>
                        {selectedUserDetail.user.locked && (
                          <span className="rounded-full bg-red-500/20 px-2.5 py-0.5 text-xs font-bold text-red-300">
                            Đang bị khóa
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {selectedUserDetail.user.email} · UID: <code>{selectedUserDetail.user.uid}</code>
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Đăng ký: {formatDateTime(selectedUserDetail.user.createdAt)} · Đăng nhập gần nhất:{' '}
                        {formatDateTime(selectedUserDetail.user.lastLoginAt)}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedUserDetail(null)}
                    aria-label="Đóng chi tiết"
                    className="flex size-9 items-center justify-center rounded-lg hover:bg-white/10"
                  >
                    <X className="size-5" />
                  </button>
                </div>

                {/* 4 chỉ số tổng quan tiến độ của học viên */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div className="rounded-xl border border-border bg-background p-3.5">
                    <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Trophy className="size-3.5 text-emerald-400" />
                      Tổng XP & Cấp độ
                    </p>
                    <p className="mt-1.5 text-lg font-bold text-emerald-400">
                      {selectedUserDetail.user.xp.toLocaleString('vi-VN')} XP
                    </p>
                    <p className="text-[11px] text-muted-foreground">Cấp độ hiện tại: {selectedUserDetail.user.level}</p>
                  </div>

                  <div className="rounded-xl border border-border bg-background p-3.5">
                    <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock className="size-3.5 text-sky-400" />
                      Tổng thời gian học
                    </p>
                    <p className="mt-1.5 text-lg font-bold text-sky-400">
                      {selectedUserDetail.user.totalStudyMinutes} phút
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {selectedUserDetail.progress.pomodoroSessions.length} phiên Pomodoro
                    </p>
                  </div>

                  <div className="rounded-xl border border-border bg-background p-3.5">
                    <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <BookOpen className="size-3.5 text-violet-400" />
                      Số từ vựng đã học
                    </p>
                    <p className="mt-1.5 text-lg font-bold text-violet-300">
                      {selectedUserDetail.user.learnedVocabCount} từ
                    </p>
                    <p className="text-[11px] text-muted-foreground">Thuật toán SRS (SM-2)</p>
                  </div>

                  <div className="rounded-xl border border-border bg-background p-3.5">
                    <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Flame className="size-3.5 text-orange-400" />
                      Chuỗi ngày Streak
                    </p>
                    <p className="mt-1.5 text-lg font-bold text-orange-400">
                      🔥 {selectedUserDetail.user.streak} ngày
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      Học gần nhất: {selectedUserDetail.user.lastStudyDate || 'Chưa có'}
                    </p>
                  </div>
                </div>

                {/* Kết quả và điểm thi TOPIK thực tế */}
                <section className="rounded-xl border border-border bg-background p-4">
                  <h4 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-violet-300">
                    <Award className="size-4" />
                    Kết quả và điểm thi thử TOPIK ({selectedUserDetail.progress.topikResults.length})
                  </h4>
                  {selectedUserDetail.progress.topikResults.length === 0 ? (
                    <p className="mt-2 text-xs text-muted-foreground">
                      Học viên này chưa nộp bài thi thử TOPIK nào.
                    </p>
                  ) : (
                    <ul className="mt-3 flex flex-col gap-2">
                      {selectedUserDetail.progress.topikResults.map((res, idx) => (
                        <li
                          key={`${res.examId}-${idx}`}
                          className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-card px-3.5 py-2.5 text-xs"
                        >
                          <div>
                            <p className="font-semibold text-foreground">{res.examTitle}</p>
                            <p className="text-muted-foreground">
                              Đúng {res.correctCount}/{res.totalQuestions} câu · Thời gian nộp: {formatDateTime(res.submittedAt)}
                            </p>
                          </div>
                          <div className="text-right">
                            <span className="rounded-md bg-emerald-500/15 px-2.5 py-1 font-bold text-emerald-300">
                              {res.score}/{res.maxScore} điểm ({res.levelAchieved})
                            </span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>

                {/* Từ vựng đã học SRS & Chữ Hàn đã luyện viết */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <section className="rounded-xl border border-border bg-background p-4">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-sky-300">
                      Từ vựng đã học SRS ({Object.keys(selectedUserDetail.progress.srsProgress).length})
                    </h4>
                    {Object.keys(selectedUserDetail.progress.srsProgress).length === 0 ? (
                      <p className="mt-2 text-xs text-muted-foreground">Chưa có từ vựng nào được ôn tập.</p>
                    ) : (
                      <ul className="mt-2.5 flex max-h-44 flex-col gap-1.5 overflow-y-auto pr-1 text-xs">
                        {Object.values(selectedUserDetail.progress.srsProgress).map((srs) => (
                          <li key={srs.vocabId} className="flex items-center justify-between rounded-lg bg-card px-3 py-2">
                            <span className="font-semibold">
                              <span lang="ko">{srs.wordKo || srs.vocabId}</span>{' '}
                              {srs.meaning && <span className=" font-normal text-muted-foreground">({srs.meaning})</span>}
                            </span>
                            <span className="text-[11px] text-emerald-300">
                              Ôn: {srs.NgayOnTiepTheoHienThi} ({srs.KhoangCachNgay}d)
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>

                  <section className="rounded-xl border border-border bg-background p-4">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-rose-300">
                      Chữ Hàn đã luyện viết ({Object.keys(selectedUserDetail.progress.handwritingRecords).length})
                    </h4>
                    {Object.keys(selectedUserDetail.progress.handwritingRecords).length === 0 ? (
                      <p className="mt-2 text-xs text-muted-foreground">Chưa có lượt chấm điểm luyện viết chữ Hàn.</p>
                    ) : (
                      <ul className="mt-2.5 flex max-h-44 flex-col gap-1.5 overflow-y-auto pr-1 text-xs">
                        {Object.values(selectedUserDetail.progress.handwritingRecords).map((hw) => (
                          <li key={hw.char} className="flex items-center justify-between rounded-lg bg-card px-3 py-2">
                            <span className="font-semibold">
                              Chữ <strong lang="ko">{hw.char}</strong> ({hw.unicode})
                            </span>
                            <span className="text-[11px] text-amber-300">
                              Cao nhất: {hw.bestScore}/100 ({hw.attempts} lần)
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>
                </div>

                {/* Lịch sử học tập và hoạt động gần đây của học viên */}
                <section className="rounded-xl border border-border bg-background p-4">
                  <h4 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <Calendar className="size-4 text-violet-400" />
                    Lịch sử học tập & Hoạt động gần đây ({selectedUserDetail.progress.studyHistory.length})
                  </h4>
                  {selectedUserDetail.progress.studyHistory.length === 0 ? (
                    <p className="mt-2 text-xs text-muted-foreground">Chưa có hoạt động học tập nào.</p>
                  ) : (
                    <ol className="mt-3 flex max-h-60 flex-col gap-2.5 overflow-y-auto pr-1 text-xs">
                      {selectedUserDetail.progress.studyHistory.map((act) => (
                        <li key={act.id} className="flex items-start justify-between gap-3 rounded-lg bg-card p-3">
                          <div>
                            <p className="font-semibold text-foreground">{act.title}</p>
                            <p className="mt-0.5 text-muted-foreground">{act.detail}</p>
                          </div>
                          <div className="shrink-0 text-right">
                            {act.xpEarned > 0 && (
                              <span className="inline-block rounded bg-emerald-500/15 px-2 py-0.5 font-bold text-emerald-300">
                                +{act.xpEarned} XP
                              </span>
                            )}
                            <p className="mt-1 text-[10px] text-muted-foreground">{formatDateTime(act.timestamp)}</p>
                          </div>
                        </li>
                      ))}
                    </ol>
                  )}
                </section>
              </>
            )}
          </aside>
        </div>
      )}
    </section>
  )
}
