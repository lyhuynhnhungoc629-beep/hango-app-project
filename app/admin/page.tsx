import type { Metadata } from 'next'
import { Activity, BookOpen, FileText, Users } from 'lucide-react'
import { AdminSidebar } from '@/components/admin/admin-sidebar'
import { UsersTable } from '@/components/admin/users-table'
import { QuickActions } from '@/components/admin/quick-actions'
import { BackButton } from '@/components/hango/back-button'

export const metadata: Metadata = { title: 'Admin | HANGO' }

const stats = [
  { label: 'Tổng học viên', value: '1,234', unit: 'học viên', note: '+12 hôm nay', icon: Users, color: 'bg-primary/15 text-violet-400' },
  { label: 'Từ vựng', value: '5,680', unit: 'từ vựng', note: '+120 tuần này', icon: BookOpen, color: 'bg-sky-500/15 text-sky-400' },
  { label: 'Đề thi', value: '24', unit: 'đề thi', note: 'TOPIK I & II', icon: FileText, color: 'bg-amber-500/15 text-amber-400' },
  { label: 'Hoạt động hôm nay', value: '89', unit: 'người', note: '7.2% tổng số', icon: Activity, color: 'bg-green-500/15 text-green-400' },
]

export default function AdminPage() {
  return (
    <div className="flex min-h-screen bg-panel">
      <AdminSidebar />
      <main className="min-w-0 flex-1 p-4 md:p-8">
        <div className="mb-4">
          <BackButton />
        </div>
        <header className="mb-8">
          <h1 className="text-2xl font-bold md:text-3xl">Tổng quan</h1>
          <p className="mt-1 text-muted-foreground">Chào mừng trở lại! Đây là tình hình hệ thống hôm nay.</p>
        </header>
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map(({ label, value, unit, note, icon: Icon, color }) => (
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
              <p className="mt-1 text-sm text-green-400">{note}</p>
            </li>
          ))}
        </ul>
        <div className="mt-6 grid gap-6 2xl:grid-cols-[1fr_360px]">
          <UsersTable />
          <QuickActions />
        </div>
      </main>
    </div>
  )
}
