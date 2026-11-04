import Link from 'next/link'
import { BookOpen, FileText, LayoutDashboard, Settings, ShieldCheck, Upload, Users } from 'lucide-react'
import { cn } from '@/lib/utils'

const items = [
  { label: 'Tổng quan', icon: LayoutDashboard, active: true },
  { label: 'Quản lý học viên', icon: Users },
  { label: 'Quản lý từ vựng', icon: BookOpen },
  { label: 'Quản lý đề thi', icon: FileText },
  { label: 'Import từ vựng', icon: Upload },
  { label: 'Cài đặt hệ thống', icon: Settings },
]

export function AdminSidebar() {
  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-sidebar-border bg-[#0D0D1A] p-4 lg:flex">
      <Link href="/admin" className="flex items-center gap-2 px-2 py-1">
        <span className="flex size-9 items-center justify-center rounded-lg bg-primary">
          <ShieldCheck className="size-5" aria-hidden="true" />
        </span>
        <span className="text-lg font-extrabold tracking-tight">
          HAN<span className="text-primary">GO</span> <span className="font-medium text-muted-foreground">Admin</span>
        </span>
      </Link>
      <nav aria-label="Quản trị" className="mt-8 flex flex-col gap-1">
        {items.map(({ label, icon: Icon, active }) => (
          <a
            key={label}
            href="#"
            aria-current={active ? 'page' : undefined}
            className={cn(
              'flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground',
              active && 'bg-primary/15 text-white ring-1 ring-primary/40',
            )}
          >
            <Icon className={cn('size-5', active && 'text-violet-400')} aria-hidden="true" />
            {label}
          </a>
        ))}
      </nav>
      <div className="mt-auto flex items-center gap-3 rounded-xl bg-white/5 p-3">
        <span className="flex size-9 items-center justify-center rounded-full bg-gradient-to-br from-violet-400 to-primary text-sm font-bold">AD</span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold">Quản trị viên</span>
          <span className="block truncate text-xs text-muted-foreground">admin@hango.vn</span>
        </span>
      </div>
    </aside>
  )
}
