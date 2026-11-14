'use client'

import { useEffect, useState } from 'react'
import { Check, Plus, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Goal {
  id: number
  text: string
  done: boolean
}

const defaultGoals: Goal[] = [
  { id: 1, text: 'Ôn 30 từ vựng TOPIK I', done: true },
  { id: 2, text: 'Làm 1 đề thi thử phần Nghe', done: false },
  { id: 3, text: 'Luyện phát âm 15 phút', done: true },
  { id: 4, text: 'Học ngữ pháp -고 싶다', done: false },
  { id: 5, text: 'Roleplay AI: Nhà hàng Hàn Quốc', done: false },
]

export function GoalList() {
  const [goals, setGoals] = useState<Goal[]>(defaultGoals)
  const [draft, setDraft] = useState('')
  const [isLoaded, setIsLoaded] = useState(false)

  // Đọc từ localStorage khi mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('hango_study_goals')
      if (saved) {
        setGoals(JSON.parse(saved))
      }
    } catch {
      // storage error
    } finally {
      setIsLoaded(true)
    }
  }, [])

  // Ghi vào localStorage khi goals thay đổi
  useEffect(() => {
    if (!isLoaded) return
    try {
      localStorage.setItem('hango_study_goals', JSON.stringify(goals))
    } catch {
      // storage error
    }
  }, [goals, isLoaded])

  const doneCount = goals.filter((g) => g.done).length

  const add = () => {
    const text = draft.trim()
    if (!text) return
    setGoals((g) => [...g, { id: Date.now(), text, done: false }])
    setDraft('')
  }

  const toggle = (id: number) => {
    setGoals((list) => list.map((x) => (x.id === id ? { ...x, done: !x.done } : x)))
  }

  const remove = (id: number) => {
    setGoals((list) => list.filter((x) => x.id !== id))
  }

  return (
    <section aria-labelledby="goals-title" className="flex flex-col rounded-2xl border border-border bg-card p-6 shadow-md">
      <div className="flex items-center justify-between">
        <h2 id="goals-title" className="font-semibold">
          Mục tiêu hôm nay
        </h2>
        <span className="text-xs text-muted-foreground font-medium">Tự động lưu</span>
      </div>

      <form
        className="mt-4 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          add()
        }}
      >
        <label htmlFor="new-goal" className="sr-only">
          Thêm mục tiêu
        </label>
        <input
          id="new-goal"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="+ Thêm mục tiêu học tập..."
          className="h-11 flex-1 rounded-xl border border-white/10 bg-field px-4 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none"
        />
        <button
          type="submit"
          aria-label="Thêm mục tiêu"
          disabled={!draft.trim()}
          className="flex size-11 items-center justify-center rounded-xl bg-primary hover:bg-primary/90 disabled:opacity-50 transition-opacity"
        >
          <Plus className="size-5" aria-hidden="true" />
        </button>
      </form>

      <ul className="mt-4 flex flex-1 flex-col gap-2 max-h-[300px] overflow-y-auto pr-1">
        {goals.map((g) => (
          <li key={g.id} className="group flex items-center gap-3 rounded-xl bg-background px-3 py-3 border border-border/50 hover:border-primary/40 transition-colors">
            <button
              type="button"
              role="checkbox"
              aria-checked={g.done}
              aria-label={g.text}
              onClick={() => toggle(g.id)}
              className={cn(
                'flex size-5 shrink-0 items-center justify-center rounded-md border-2 transition-colors cursor-pointer',
                g.done ? 'border-primary bg-primary' : 'border-white/30 hover:border-primary',
              )}
            >
              {g.done && <Check className="size-3.5 text-white" strokeWidth={3} aria-hidden="true" />}
            </button>
            <span className={cn('flex-1 text-sm font-medium transition-colors', g.done && 'text-muted-foreground line-through')}>
              {g.text}
            </span>
            <button
              type="button"
              aria-label={`Xóa ${g.text}`}
              onClick={() => remove(g.id)}
              className="text-muted-foreground opacity-60 hover:text-red-400 group-hover:opacity-100 transition-opacity p-1"
            >
              <Trash2 className="size-4" aria-hidden="true" />
            </button>
          </li>
        ))}
        {goals.length === 0 && (
          <li className="py-8 text-center text-sm text-muted-foreground">
            Chưa có mục tiêu nào. Hãy thêm mục tiêu ở trên!
          </li>
        )}
      </ul>

      <div className="mt-6 border-t border-border pt-4">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Tiến độ</span>
          <span className="font-semibold text-primary">
            {doneCount}/{goals.length} ({goals.length ? Math.round((doneCount / goals.length) * 100) : 0}%)
          </span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{ width: `${goals.length ? (doneCount / goals.length) * 100 : 0}%` }}
          />
        </div>
      </div>
    </section>
  )
}
