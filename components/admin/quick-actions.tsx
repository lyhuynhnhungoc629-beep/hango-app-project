'use client'

import { useRef, useState } from 'react'
import { FilePlus2, FileSpreadsheet, Lock, Plus, Upload, UserPlus } from 'lucide-react'
import { cn } from '@/lib/utils'

const activity = [
  { icon: UserPlus, text: 'Trần Minh Anh vừa đăng ký', time: '5 phút trước', color: 'text-green-400 bg-green-500/15' },
  { icon: FileSpreadsheet, text: 'Import 120 từ vựng TOPIK II', time: '1 giờ trước', color: 'text-sky-400 bg-sky-500/15' },
  { icon: FilePlus2, text: 'Thêm đề thi TOPIK I - Số 24', time: '3 giờ trước', color: 'text-violet-400 bg-primary/15' },
  { icon: Lock, text: 'Khóa tài khoản Đỗ Quang Huy', time: 'Hôm qua', color: 'text-red-400 bg-red-500/15' },
]

export function QuickActions() {
  const [dragging, setDragging] = useState(false)
  const [fileName, setFileName] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <div className="grid content-start gap-6 md:grid-cols-2 2xl:grid-cols-1">
      <section aria-labelledby="import-title" className="rounded-2xl border border-border bg-card p-5">
        <h2 id="import-title" className="flex items-center gap-2 font-semibold">
          <Upload className="size-4 text-violet-400" aria-hidden="true" />
          Import từ vựng
        </h2>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault()
            setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDragging(false)
            const f = e.dataTransfer.files[0]
            if (f) setFileName(f.name)
          }}
          className={cn(
            'mt-4 flex w-full flex-col items-center rounded-xl border-2 border-dashed px-4 py-8 text-center transition-colors',
            dragging ? 'border-primary bg-primary/10' : 'border-white/15 hover:border-primary/50',
          )}
        >
          <span className="flex size-12 items-center justify-center rounded-full bg-primary/15">
            <Upload className="size-5 text-violet-400" aria-hidden="true" />
          </span>
          <span className="mt-3 text-sm font-medium">{fileName ?? 'Kéo thả file vào đây'}</span>
          <span className="mt-1 text-xs text-muted-foreground">hoặc bấm để chọn · CSV, XLSX (tối đa 10MB)</span>
        </button>
        <input
          ref={inputRef}
          type="file"
          accept=".csv,.xlsx"
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
          onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
        />
        <div className="mt-4 grid grid-cols-2 gap-3">
          <button type="button" className="flex h-11 items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold hover:bg-primary/90">
            <Plus className="size-4" aria-hidden="true" />
            Thêm đề thi mới
          </button>
          <button type="button" className="flex h-11 items-center justify-center gap-2 rounded-xl border border-border text-sm font-semibold hover:border-primary/50">
            <Plus className="size-4" aria-hidden="true" />
            Thêm từ vựng
          </button>
        </div>
      </section>

      <section aria-labelledby="activity-title" className="rounded-2xl border border-border bg-card p-5">
        <h2 id="activity-title" className="font-semibold">
          Hoạt động gần đây
        </h2>
        <ol className="mt-4 flex flex-col gap-4">
          {activity.map(({ icon: Icon, text, time, color }) => (
            <li key={text} className="flex items-start gap-3">
              <span className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${color}`}>
                <Icon className="size-4" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="text-sm">{text}</p>
                <p className="text-xs text-muted-foreground">{time}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </div>
  )
}
