'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Activity,
  BookOpen,
  Lock,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Users,
} from 'lucide-react'
import { AdminSidebar } from '@/components/admin/admin-sidebar'
import { UsersTable, type AdminUserItem } from '@/components/admin/users-table'
import { QuickActions } from '@/components/admin/quick-actions'
import { BackButton } from '@/components/hango/back-button'
import { useAuth } from '@/lib/auth-context'
import type { StudyActivityItem } from '@/lib/backend/user-store'

interface AdminStats {
  totalAccounts: number
  totalStudents: number
  totalAdmins: number
  activeAccounts: number
  lockedAccounts: number
  totalSystemXp: number
  totalSystemStudyMinutes: number
  totalSystemLearnedVocab: number
  totalTopikSubmissions: number
}

export default function AdminPage() {
  const router = useRouter()
  const { user, profile, token, loading } = useAuth()
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [users, setUsers] = useState<AdminUserItem[]>([])
  const [topLearners, setTopLearners] = useState<AdminUserItem[]>([])
  const [recentActivities, setRecentActivities] = useState<
    Array<StudyActivityItem & { userName: string; userEmail: string; uid: string }>
  >([])
  const [fetching, setFetching] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)

  const isAuthenticated = Boolean(user || profile)
  const isAdmin = Boolean(profile && (profile.role === 'admin' || profile.isRootAdmin))
  const isRootAdmin = Boolean(profile?.isRootAdmin)

  const fetchAdminDashboard = useCallback(async () => {
    if (!token || !isAdmin) return
    setFetching(true)
    setApiError(null)
    try {
      const res = await fetch('/api/admin/users', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        setApiError(json.error || 'Không có quyền truy cập dữ liệu quản trị.')
        return
      }
      setStats(json.stats)
      setUsers(json.users || [])
      setTopLearners(json.topLearners || [])
      setRecentActivities(json.recentActivities || [])
    } catch {
      setApiError('Không thể kết nối tới API quản trị.')
    } finally {
      setFetching(false)
    }
  }, [isAdmin, token])

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace('/auth?notice=login_required&redirect=%2Fadmin')
      return
    }
    if (!loading && isAdmin && token) {
      void fetchAdminDashboard()
    }
  }, [loading, isAuthenticated, isAdmin, token, fetchAdminDashboard, router])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-panel text-sm text-muted-foreground">
        Đang kiểm tra xác thực và quyền Quản trị viên...
      </div>
    )
  }

  // Chặn hoàn toàn nếu chưa đăng nhập hoặc tài khoản có Role = 'student'
  if (!profile || !isAdmin) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-panel p-4">
        <section className="mx-auto flex max-w-lg flex-col items-center rounded-2xl border border-red-500/40 bg-card p-8 text-center shadow-2xl">
          <span className="flex size-16 items-center justify-center rounded-2xl bg-red-500/15 text-red-400">
            <ShieldAlert className="size-8" aria-hidden="true" />
          </span>
          <h1 className="mt-5 text-2xl font-bold">403 — Truy cập bị từ chối</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {profile ? (
              <>
                Tài khoản <strong>{profile.email}</strong> hiện có vai trò <strong>Học viên (Student)</strong>. Trang Quản trị và các API quản lý người dùng chỉ dành riêng cho <strong>Quản trị viên (Admin)</strong>.
              </>
            ) : (
              <>Vui lòng đăng nhập hoặc đăng ký tài khoản học viên để sử dụng chức năng này</>
            )}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href="/"
              className="inline-flex h-11 items-center justify-center rounded-xl border border-border bg-background px-5 text-sm font-semibold hover:bg-white/5"
            >
              Về Trang chủ
            </Link>
            <Link
              href="/auth"
              className="inline-flex h-11 items-center justify-center rounded-xl bg-primary px-5 text-sm font-semibold text-white shadow-lg shadow-primary/30 hover:bg-primary/90"
            >
              Đăng nhập tài khoản khác
            </Link>
          </div>
        </section>
      </div>
    )
  }

  const statCards = [
    {
      label: 'Tổng số tài khoản',
      value: String(stats?.totalAccounts ?? users.length),
      unit: 'tài khoản',
      note: `${stats?.totalStudents ?? 0} Học viên · ${stats?.totalAdmins ?? 1} Admin (1 Admin gốc)`,
      icon: Users,
      color: 'bg-primary/15 text-violet-400',
    },
    {
      label: 'Trạng thái tài khoản',
      value: `${stats?.activeAccounts ?? 0}`,
      unit: 'hoạt động',
      note: `${stats?.lockedAccounts ?? 0} tài khoản đang bị khóa`,
      icon: Lock,
      color: 'bg-emerald-500/15 text-emerald-400',
    },
    {
      label: 'Tiến độ từ vựng & Giờ học',
      value: `${stats?.totalSystemLearnedVocab ?? 0}`,
      unit: 'từ đã học',
      note: `Tổng thời gian học: ${stats?.totalSystemStudyMinutes ?? 0} phút`,
      icon: BookOpen,
      color: 'bg-sky-500/15 text-sky-400',
    },
    {
      label: 'Tổng XP & Thi TOPIK',
      value: (stats?.totalSystemXp ?? 0).toLocaleString('vi-VN'),
      unit: 'XP toàn hệ thống',
      note: `${stats?.totalTopikSubmissions ?? 0} lượt nộp bài thi TOPIK`,
      icon: Activity,
      color: 'bg-amber-500/15 text-amber-400',
    },
  ]

  return (
    <div className="flex min-h-screen bg-panel">
      <AdminSidebar />
      <main id="admin-overview" className="min-w-0 flex-1 p-4 md:p-8">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <BackButton />
          <div className="flex flex-wrap items-center gap-2.5">
            <span
              className={
                isRootAdmin
                  ? 'inline-flex items-center gap-1.5 rounded-xl border border-amber-400/40 bg-amber-500/15 px-3.5 py-2 text-xs font-bold text-amber-300'
                  : 'inline-flex items-center gap-1.5 rounded-xl border border-emerald-400/40 bg-emerald-500/15 px-3.5 py-2 text-xs font-bold text-emerald-300'
              }
            >
              <ShieldCheck className="size-4" />
              {`Quản trị viên (${profile.email})`}
            </span>
            <button
              type="button"
              onClick={() => void fetchAdminDashboard()}
              disabled={fetching}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-border bg-card px-3 text-xs font-semibold hover:border-primary/50 disabled:opacity-50"
            >
              <RefreshCw className={`size-3.5 ${fetching ? 'animate-spin' : ''}`} />
              Làm mới dữ liệu
            </button>
          </div>
        </div>

        <header className="mb-8">
          <h1 className="text-2xl font-bold md:text-3xl">Tổng quan Quản trị Hệ thống</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isRootAdmin
              ? 'Bạn đang đăng nhập với quyền Admin gốc duy nhất: có toàn quyền cấp/thu hồi Admin, khóa, mở khóa, xóa đồng bộ tài khoản và theo dõi tiến độ học viên.'
              : 'Bạn đang đăng nhập với quyền Quản trị viên (do Admin gốc cấp): được phép quản lý học viên, khóa/mở khóa và theo dõi tiến độ học tập.'}
          </p>
        </header>

        {apiError && (
          <div className="mb-6 rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-200">
            {apiError}
          </div>
        )}

        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {statCards.map(({ label, value, unit, note, icon: Icon, color }) => (
            <li key={label} className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{label}</span>
                <span className={`flex size-10 items-center justify-center rounded-xl ${color}`}>
                  <Icon className="size-5" aria-hidden="true" />
                </span>
              </div>
              <p className="mt-3 text-3xl font-bold">
                {value} <span className="text-base font-medium text-muted-foreground">{unit}</span>
              </p>
              <p className="mt-1 text-xs text-green-400">{note}</p>
            </li>
          ))}
        </ul>

        <div className="mt-6 grid gap-6 2xl:grid-cols-[1fr_360px]">
          <UsersTable
            users={users}
            actorIsRootAdmin={isRootAdmin}
            actorUid={profile.uid}
            token={token}
            onRefresh={fetchAdminDashboard}
          />
          <QuickActions topLearners={topLearners} recentActivities={recentActivities} />
        </div>
      </main>
    </div>
  )
}
