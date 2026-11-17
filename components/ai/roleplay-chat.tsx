'use client'

import { useState } from 'react'
import { Hospital, Lightbulb, Plane, SendHorizontal, ShoppingBag, UtensilsCrossed, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

type Scenario = { id: string; title: string; short: string; icon: LucideIcon; desc: string }

const scenarios: Scenario[] = [
  { id: 'restaurant', title: 'Nhà hàng Hàn Quốc', short: 'Nhà hàng', icon: UtensilsCrossed, desc: 'Gọi món, hỏi giá, thanh toán' },
  { id: 'airport', title: 'Sân bay Incheon', short: 'Sân bay', icon: Plane, desc: 'Check-in, hải quan, hỏi đường' },
  { id: 'shopping', title: 'Mua sắm', short: 'Mua sắm', icon: ShoppingBag, desc: 'Hỏi size, mặc cả, đổi trả' },
  { id: 'hospital', title: 'Bệnh viện', short: 'Bệnh viện', icon: Hospital, desc: 'Mô tả triệu chứng, đặt lịch' },
]

type Message =
  | { role: 'ai'; ko: string; vi: string }
  | { role: 'user'; ko: string }
  | { role: 'tip'; text: string; wrong: string; right: string }

const seed: Message[] = [
  { role: 'ai', ko: '어서 오세요! 몇 분이세요?', vi: 'Xin mời vào! Quý khách đi mấy người ạ?' },
  { role: 'user', ko: '두 명이에요.' },
  { role: 'ai', ko: '이쪽으로 앉으세요. 뭐 드릴까요?', vi: 'Mời ngồi bên này. Quý khách dùng gì ạ?' },
  { role: 'user', ko: '비빔밥 두 개 주세요. 그리고 물 주어요.' },
  { role: 'tip', text: 'Khi yêu cầu lịch sự, hãy dùng đuôi -주세요.', wrong: '물 주어요', right: '물 주세요' },
  { role: 'ai', ko: '네, 비빔밥 두 개랑 물 드릴게요. 잠시만 기다려 주세요!', vi: 'Vâng, hai phần bibimbap và nước. Xin vui lòng đợi một chút!' },
]

export function RoleplayChat() {
  const [active, setActive] = useState('restaurant')
  const [messages, setMessages] = useState<Message[]>(seed)
  const [draft, setDraft] = useState('')
  const scenario = scenarios.find((s) => s.id === active)!

  const send = () => {
    const text = draft.trim()
    if (!text) return
    setMessages((m) => [...m, { role: 'user', ko: text }])
    setDraft('')
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
      <section aria-labelledby="scenario-title" className="rounded-2xl border border-border bg-card p-5">
        <h2 id="scenario-title" className="font-semibold">
          Chọn tình huống
        </h2>
        <ul className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-1">
          {scenarios.map(({ id, title, icon: Icon, desc }) => (
            <li key={id}>
              <button
                type="button"
                aria-pressed={active === id}
                onClick={() => setActive(id)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors',
                  active === id ? 'border-primary bg-primary/15' : 'border-border bg-background hover:border-primary/40',
                )}
              >
                <span className={cn('flex size-10 shrink-0 items-center justify-center rounded-lg', active === id ? 'bg-primary text-white' : 'bg-white/5 text-muted-foreground')}>
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold">{title}</span>
                  <span className="hidden truncate text-xs text-muted-foreground sm:block">{desc}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section aria-label="Hội thoại" className="flex h-[640px] flex-col overflow-hidden rounded-2xl border border-border bg-card">
        <header className="flex items-center gap-3 border-b border-border px-5 py-4">
          <span className="relative flex size-11 items-center justify-center rounded-full bg-white">
            <svg viewBox="0 0 36 24" className="h-5 w-7" aria-hidden="true">
              <circle cx="18" cy="12" r="5" fill="#cd2e3a" />
              <path d="M13 12a5 5 0 0 0 10 0 2.5 2.5 0 0 0-5 0 2.5 2.5 0 0 1-5 0Z" fill="#0047a0" />
            </svg>
            <span className="absolute bottom-0 right-0 size-3 rounded-full border-2 border-card bg-green-500" />
          </span>
          <div>
            <p className="font-semibold">AI Trợ lý - {scenario.short}</p>
            <p className="text-xs text-green-400">Đang trực tuyến</p>
          </div>
        </header>

        <ol className="flex flex-1 flex-col gap-4 overflow-y-auto p-5" aria-live="polite">
          {messages.map((m, i) => {
            if (m.role === 'ai')
              return (
                <li key={i} className="max-w-[80%] self-start rounded-2xl rounded-tl-sm bg-[#25253d] px-4 py-3">
                  <p lang="ko" className="font-medium">
                    {m.ko}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">{m.vi}</p>
                </li>
              )
            if (m.role === 'user')
              return (
                <li key={i} lang="ko" className="max-w-[80%] self-end rounded-2xl rounded-tr-sm bg-primary px-4 py-3 font-medium">
                  {m.ko}
                </li>
              )
            return (
              <li key={i} className="flex max-w-[90%] gap-3 self-end rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm">
                <Lightbulb className="size-5 shrink-0 text-amber-400" aria-hidden="true" />
                <div>
                  <p className="font-semibold text-amber-300">Gợi ý sửa lỗi</p>
                  <p className="mt-1 text-amber-100/90">
                    Bạn nên dùng{' '}
                    <span lang="ko" className="rounded bg-green-500/20 px-1.5 font-semibold text-green-300">
                      {m.right}
                    </span>{' '}
                    thay vì{' '}
                    <span lang="ko" className="rounded bg-red-500/20 px-1.5 text-red-300 line-through">
                      {m.wrong}
                    </span>
                    . {m.text}
                  </p>
                </div>
              </li>
            )
          })}
        </ol>

        <form
          className="flex gap-3 border-t border-border p-4"
          onSubmit={(e) => {
            e.preventDefault()
            send()
          }}
        >
          <label htmlFor="chat-input" className="sr-only">
            Nhập tiếng Hàn
          </label>
          <input
            id="chat-input"
            lang="ko"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.nativeEvent.isComposing || e.keyCode === 229)) e.preventDefault()
            }}
            placeholder="Nhập tiếng Hàn..."
            className="h-12 flex-1 rounded-xl border border-white/10 bg-field px-4 placeholder:text-muted-foreground focus:border-primary focus:outline-none"
          />
          <button type="submit" aria-label="Gửi" className="flex size-12 items-center justify-center rounded-xl bg-primary hover:bg-primary/90">
            <SendHorizontal className="size-5" aria-hidden="true" />
          </button>
        </form>
      </section>
    </div>
  )
}
