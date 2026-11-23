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
import { UsersTable, type AdminUserItem } from '@/components/admin/users-table'
import { QuickActions } from '@/components/admin/quick-actions'
import { AppShell } from '@/components/hango/app-shell'
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
      <AppShell>
        <div className="flex min-h-screen items-center justify-center p-8 text-sm font-semibold text-slate-600">
          Đang kiểm tra xác thực và quyền Quản trị viên...
        </div>
      </AppShell>
    )
  }

  // Chặn hoàn toàn nếu chưa đăng nhập hoặc tài khoản có Role = 'student'
  if (!profile || !isAdmin) {
    return (
      <AppShell>
        <div className="flex min-h-screen flex-col items-center justify-center p-4">
          <section className="mx-auto flex max-w-lg flex-col items-center rounded-2xl border-[1.5px] border-slate-800 bg-white p-8 text-center shadow-[0_2px_0_rgba(15,23,42,0.06)]">
            <span className="flex size-16 items-center justify-center rounded-2xl border-2 border-slate-900 bg-red-500 text-white">
              <ShieldAlert className="size-8" aria-hidden="true" />
            </span>
            <h1 className="mt-5 text-2xl font-black text-slate-900">403 — Truy cập bị từ chối</h1>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              {profile ? (
                <>
                  Tài khoản <strong>{profile.email}</strong> hiện có vai trò{' '}
                  <strong>Học viên (Student)</strong>. Trang Quản trị và các API quản lý người dùng chỉ dành riêng cho <strong>Quản trị viên (Admin)</strong>.
                </>
              ) : (
                <>Vui lòng đăng nhập hoặc đăng ký tài khoản học viên để sử dụng chức năng này</>
              )}
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link
                href="/"
                className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-800 bg-white px-5 text-sm font-bold text-slate-800 hover:bg-slate-50"
              >
                Về Trang chủ
              </Link>
              <Link
                href="/auth"
                className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-900 bg-[#2563EB] px-5 text-sm font-bold text-white shadow-sm hover:bg-blue-600"
              >
                Đăng nhập tài khoản khác
              </Link>
            </div>
          </section>
        </div>
      </AppShell>
    )
  }

  const statCards = [
    {
      label: 'Tổng số tài khoản',
      value: String(stats?.totalAccounts ?? users.length),
      unit: 'tài khoản',
      note: `${stats?.totalStudents ?? 0} Học viên · ${stats?.totalAdmins ?? 1} Admin`,
      icon: Users,
      iconBg: 'bg-[#3B82F6] text-white',
    },
    {
      label: 'Trạng thái tài khoản',
      value: `${stats?.activeAccounts ?? 0}`,
      unit: 'hoạt động',
      note: `${stats?.lockedAccounts ?? 0} tài khoản đang bị khóa`,
      icon: Lock,
      iconBg: 'bg-[#22C55E] text-slate-950',
    },
    {
      label: 'Tiến độ từ vựng & Giờ học',
      value: `${stats?.totalSystemLearnedVocab ?? 0}`,
      unit: 'từ đã học',
      note: `Tổng thời gian học: ${stats?.totalSystemStudyMinutes ?? 0} phút`,
      icon: BookOpen,
      iconBg: 'bg-[#8B5CF6] text-white',
    },
    {
      label: 'Tổng XP & Thi TOPIK',
      value: (stats?.totalSystemXp ?? 0).toLocaleString('vi-VN'),
      unit: 'XP toàn hệ thống',
      note: `${stats?.totalTopikSubmissions ?? 0} lượt nộp bài thi TOPIK`,
      icon: Activity,
      iconBg: 'bg-[#F59E0B] text-slate-950',
    },
  ]

  return (
    <AppShell>
      <div className="min-h-screen w-full px-3 py-6 text-slate-900 md:px-8">
        <main id="admin-overview" className="mx-auto flex w-full max-w-6xl flex-col gap-6">
          {/* Header Quản trị hệ thống đồng bộ Hình 1 */}
          <section className="rounded-2xl border-[1.5px] border-slate-800 bg-white p-5 shadow-[0_2px_0_rgba(15,23,42,0.06)] md:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-xl border border-slate-800 bg-[#2563EB] text-white shadow-sm">
                  <ShieldCheck className="size-6" aria-hidden="true" />
                </span>
                <div>
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h1 className="text-2xl font-black tracking-tight text-slate-900 md:text-3xl">
                      Tổng quan Quản trị Hệ thống
                    </h1>
                    <span className="rounded-md border border-amber-400 bg-[#FEF08A] px-2.5 py-0.5 text-xs font-bold text-amber-950">
                      {`Quản trị viên (${profile.email})`}
                    </span>
                  </div>
                  <p className="mt-1.5 max-w-3xl text-sm font-normal leading-relaxed text-slate-600">
                    {isRootAdmin
                      ? 'Bạn đang đăng nhập với quyền Admin gốc duy nhất: có toàn quyền cấp/thu hồi Admin, khóa, mở khóa, xóa đồng bộ tài khoản và theo dõi tiến độ học viên.'
                      : 'Bạn đang đăng nhập với quyền Quản trị viên: được phép quản lý học viên, khóa/mở khóa và theo dõi tiến độ học tập.'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => void fetchAdminDashboard()}
                disabled={fetching}
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-800 bg-white px-3.5 text-xs font-bold text-slate-800 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
              >
                <RefreshCw className={`size-4 ${fetching ? 'animate-spin' : ''}`} />
                <span>Làm mới dữ liệu</span>
              </button>
            </div>
          </section>

          {apiError && (
            <div className="rounded-xl border border-red-500 bg-red-50 p-4 text-sm font-semibold text-red-900">
              {apiError}
            </div>
          )}

          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {statCards.map(({ label, value, unit, note, icon: Icon, iconBg }) => (
              <li
                key={label}
                className="rounded-2xl border-[1.5px] border-slate-800 bg-white p-5 shadow-[0_2px_0_rgba(15,23,42,0.06)]"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                    {label}
                  </span>
                  <span
                    className={`flex size-10 items-center justify-center rounded-xl border-2 border-slate-900 shadow-[0_2px_0_rgba(15,23,42,0.15)] ${iconBg}`}
                  >
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                </div>
                <p className="mt-3 text-3xl font-black text-slate-900">
                  {value}{' '}
                  <span className="text-sm font-semibold text-slate-500">{unit}</span>
                </p>
                <p className="mt-1 text-xs font-semibold text-emerald-700">{note}</p>
              </li>
            ))}
          </ul>

          <div className="grid gap-6 2xl:grid-cols-[1fr_360px]">
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
    </AppShell>
  )
}
