'use client'

import { useState } from 'react'
import { Check, Plus, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const initial = [
  { id: 1, text: 'Ôn 30 từ vựng TOPIK I', done: true },
  { id: 2, text: 'Làm 1 đề thi thử phần Nghe', done: true },
  { id: 3, text: 'Luyện phát âm 15 phút', done: true },
  { id: 4, text: 'Học ngữ pháp -고 싶다', done: false },
  { id: 5, text: 'Roleplay AI: Nhà hàng', done: false },
]

export function GoalList() {
  const [goals, setGoals] = useState(initial)
  const [draft, setDraft] = useState('')
  const done = goals.filter((g) => g.done).length

  const add = () => {
    const text = draft.trim()
    if (!text) return
    setGoals((g) => [...g, { id: Date.now(), text, done: false }])
    setDraft('')
  }

  return (
    <section aria-labelledby="goals-title" className="flex flex-col rounded-2xl border border-border bg-card p-6">
      <h2 id="goals-title" className="font-semibold">
        Mục tiêu hôm nay
      </h2>
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
          placeholder="+ Thêm mục tiêu"
          className="h-11 flex-1 rounded-xl border border-white/10 bg-field px-4 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none"
        />
        <button type="submit" aria-label="Thêm" className="flex size-11 items-center justify-center rounded-xl bg-primary hover:bg-primary/90">
          <Plus className="size-5" aria-hidden="true" />
        </button>
      </form>
      <ul className="mt-4 flex flex-1 flex-col gap-2">
        {goals.map((g) => (
          <li key={g.id} className="group flex items-center gap-3 rounded-xl bg-background px-3 py-3">
            <button
              type="button"
              role="checkbox"
              aria-checked={g.done}
              aria-label={g.text}
              onClick={() => setGoals((list) => list.map((x) => (x.id === g.id ? { ...x, done: !x.done } : x)))}
              className={cn(
                'flex size-5 shrink-0 items-center justify-center rounded-md border-2 transition-colors',
                g.done ? 'border-primary bg-primary' : 'border-white/30 hover:border-primary',
              )}
            >
              {g.done && <Check className="size-3.5" strokeWidth={3} aria-hidden="true" />}
            </button>
            <span className={cn('flex-1 text-sm', g.done && 'text-muted-foreground line-through')}>{g.text}</span>
            <button
              type="button"
              aria-label={`Xóa ${g.text}`}
              onClick={() => setGoals((list) => list.filter((x) => x.id !== g.id))}
              className="text-muted-foreground opacity-60 hover:text-red-400 group-hover:opacity-100"
            >
              <Trash2 className="size-4" aria-hidden="true" />
            </button>
          </li>
        ))}
      </ul>
      <div className="mt-6">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Tiến độ</span>
          <span className="font-semibold">
            {done}/{goals.length} hoàn thành
          </span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${goals.length ? (done / goals.length) * 100 : 0}%` }} />
        </div>
      </div>
    </section>
  )
}
