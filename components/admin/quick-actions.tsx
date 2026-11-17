'use client'

import { useRef, useState } from 'react'
import {
  Activity,
  CheckCircle2,
  Flame,
  Plus,
  Trophy,
  Upload,
} from 'lucide-react'
import type { AdminUserItem } from '@/components/admin/users-table'
import type { StudyActivityItem } from '@/lib/backend/user-store'
import { useAuth } from '@/lib/auth-context'
import { cn } from '@/lib/utils'

interface QuickActionsProps {
  topLearners: AdminUserItem[]
  recentActivities: Array<StudyActivityItem & { userName: string; userEmail: string; uid: string }>
}

function formatDateTime(iso?: string) {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}

export function QuickActions({ topLearners, recentActivities }: QuickActionsProps) {
  const { token } = useAuth()
  const [dragging, setDragging] = useState(false)
  const [fileName, setFileName] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [ko, setKo] = useState('')
  const [roman, setRoman] = useState('')
  const [meaning, setMeaning] = useState('')
  const [exKo, setExKo] = useState('')
  const [exVi, setExVi] = useState('')
  const [statusMsg, setStatusMsg] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleAddVocab = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatusMsg(null)
    const res = await fetch('/api/vocabularies', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        ko,
        roman,
        meaning,
        exKo,
        exVi,
        pos: 'Danh từ',
        level: 'TOPIK I - Cấp 1',
        topic: 'Đời sống',
      }),
    })
    const json = await res.json()
    if (json.success) {
      setStatusMsg(`Đã thêm từ "${ko}" (${meaning}) qua API POST /api/vocabularies!`)
      setKo('')
      setRoman('')
      setMeaning('')
      setExKo('')
      setExVi('')
      setShowAddForm(false)
    } else {
      setStatusMsg(json.error || 'Lỗi khi thêm từ vựng.')
    }
  }

  return (
    <div className="grid content-start gap-6 md:grid-cols-2 2xl:grid-cols-1">
      {/* Bảng xếp hạng Học viên có tiến độ nổi bật thực tế */}
      <section aria-labelledby="top-learners-title" className="rounded-2xl border border-border bg-card p-5">
        <h2 id="top-learners-title" className="flex items-center gap-2 font-semibold">
          <Trophy className="size-4 text-amber-400" aria-hidden="true" />
          Học viên có tiến độ nổi bật
        </h2>
        {topLearners.length === 0 ? (
          <p className="mt-3 text-xs text-muted-foreground">
            Chưa có học viên nào tích lũy XP. Khi học viên ôn từ vựng SRS, học Pomodoro, luyện viết hoặc làm đề TOPIK, bảng xếp hạng sẽ tự động cập nhật.
          </p>
        ) : (
          <ol className="mt-4 flex flex-col gap-3">
            {topLearners.map((learner, index) => (
              <li
                key={learner.uid}
                className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs"
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/20 font-bold text-violet-300">
                    #{index + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-foreground">{learner.displayName}</p>
                    <p className="truncate text-[11px] text-muted-foreground">
                      {learner.totalStudyMinutes} phút · {learner.learnedVocabCount} từ vựng
                    </p>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-bold text-emerald-400">{learner.xp.toLocaleString('vi-VN')} XP</p>
                  <p className="flex items-center justify-end gap-0.5 text-[11px] text-orange-300">
                    <Flame className="size-3" /> {learner.streak} ngày
                  </p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section aria-labelledby="import-title" className="rounded-2xl border border-border bg-card p-5">
        <h2 id="import-title" className="flex items-center gap-2 font-semibold">
          <Upload className="size-4 text-violet-400" aria-hidden="true" />
          Import & Thêm từ vựng (API /api/vocabularies)
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
            'mt-4 flex w-full flex-col items-center rounded-xl border-2 border-dashed px-4 py-6 text-center transition-colors',
            dragging ? 'border-primary bg-primary/10' : 'border-white/15 hover:border-primary/50',
          )}
        >
          <span className="flex size-10 items-center justify-center rounded-full bg-primary/15">
            <Upload className="size-5 text-violet-400" aria-hidden="true" />
          </span>
          <span className="mt-2.5 text-sm font-medium">{fileName ?? 'Kéo thả file vào đây'}</span>
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
        <div className="mt-4">
          <button
            type="button"
            onClick={() => setShowAddForm((s) => !s)}
            className="flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-primary/40 bg-primary/15 text-xs font-semibold text-violet-200 hover:bg-primary hover:text-white"
          >
            <Plus className="size-4" aria-hidden="true" />
            Thêm từ vựng mới vào hệ thống
          </button>
        </div>

        {statusMsg && (
          <p className="mt-3 flex items-center gap-1.5 rounded-xl bg-emerald-500/10 p-2.5 text-xs text-emerald-300">
            <CheckCircle2 className="size-4 shrink-0" />
            {statusMsg}
          </p>
        )}

        {showAddForm && (
          <form onSubmit={handleAddVocab} className="mt-4 flex flex-col gap-2.5 rounded-xl border border-border bg-background p-4">
            <p className="text-xs font-semibold text-violet-300">Thêm từ vựng mới</p>
            <input
              required
              value={ko}
              onChange={(e) => setKo(e.target.value)}
              placeholder="Từ tiếng Hàn (VD: 도서관)"
              className="h-9 rounded-lg border border-white/10 bg-field px-3 text-xs"
            />
            <input
              value={roman}
              onChange={(e) => setRoman(e.target.value)}
              placeholder="Phiên âm (VD: do-seo-gwan)"
              className="h-9 rounded-lg border border-white/10 bg-field px-3 text-xs"
            />
            <input
              required
              value={meaning}
              onChange={(e) => setMeaning(e.target.value)}
              placeholder="Nghĩa tiếng Việt (VD: Thư viện)"
              className="h-9 rounded-lg border border-white/10 bg-field px-3 text-xs"
            />
            <input
              value={exKo}
              onChange={(e) => setExKo(e.target.value)}
              placeholder="Câu ví dụ tiếng Hàn"
              className="h-9 rounded-lg border border-white/10 bg-field px-3 text-xs"
            />
            <input
              value={exVi}
              onChange={(e) => setExVi(e.target.value)}
              placeholder="Nghĩa câu ví dụ"
              className="h-9 rounded-lg border border-white/10 bg-field px-3 text-xs"
            />
            <button
              type="submit"
              className="mt-1 h-9 rounded-lg bg-primary text-xs font-semibold text-white hover:bg-primary/90"
            >
              Lưu vào hệ thống (POST /api/vocabularies)
            </button>
          </form>
        )}
      </section>

      <section aria-labelledby="activity-title" className="rounded-2xl border border-border bg-card p-5">
        <h2 id="activity-title" className="flex items-center gap-2 font-semibold">
          <Activity className="size-4 text-emerald-400" aria-hidden="true" />
          Hoạt động thực tế gần đây
        </h2>
        {recentActivities.length === 0 ? (
          <p className="mt-3 text-xs text-muted-foreground">Chưa có hoạt động nào được ghi nhận.</p>
        ) : (
          <ol className="mt-4 flex flex-col gap-3.5">
            {recentActivities.slice(0, 6).map((act) => (
              <li key={act.id} className="flex items-start justify-between gap-3 border-b border-border pb-3 last:border-0 last:pb-0">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-foreground">
                    {act.userName}: <span className="font-normal text-violet-200">{act.title}</span>
                  </p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">{act.detail}</p>
                </div>
                <span className="shrink-0 text-[10px] text-muted-foreground">{formatDateTime(act.timestamp)}</span>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  )
}
