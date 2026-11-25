'use client'

import { useEffect, useState } from 'react'
import { MessageSquare, Mic, PenTool } from 'lucide-react'
import { cn } from '@/lib/utils'
import { RoleplayChat } from './roleplay-chat'
import { PronunciationPractice } from './pronunciation-practice'
import { HandwritingPractice } from './handwriting-practice'

export type AiTab = 'chat' | 'pronounce' | 'handwriting'

export function AiTabs({ initialTab, initialWord }: { initialTab: AiTab; initialWord?: string }) {
  const [tab, setTab] = useState<AiTab>(initialTab)

  useEffect(() => {
    setTab(initialTab)
  }, [initialTab])

  const tabs = [
    { id: 'chat' as const, label: 'Hội thoại tình huống', icon: MessageSquare },
    { id: 'pronounce' as const, label: 'Luyện phát âm', icon: Mic },
    { id: 'handwriting' as const, label: 'Luyện viết chữ Hàn', icon: PenTool },
  ]

  return (
    <>
      <div
        role="tablist"
        aria-label="Tính năng AI"
        className="flex flex-wrap gap-1.5 rounded-2xl border-[1.5px] border-slate-800 bg-white p-2 shadow-[0_2px_0_rgba(15,23,42,0.06)] sm:inline-flex"
      >
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            role="tab"
            id={`tab-${id}`}
            aria-selected={tab === id}
            aria-controls={`panel-${id}`}
            onClick={() => setTab(id)}
            className={cn(
              'flex h-10 items-center gap-2 rounded-xl px-4 text-xs font-bold transition-all md:text-sm',
              tab === id
                ? 'border-[1.5px] border-slate-900 bg-[#7C3AED] text-white shadow-[0_2px_0_rgba(15,23,42,0.12)]'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
            )}
          >
            <Icon className="size-4" aria-hidden="true" />
            {label}
          </button>
        ))}
      </div>
      <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`}>
        {tab === 'chat' && <RoleplayChat />}
        {tab === 'pronounce' && <PronunciationPractice initialWord={initialWord} />}
        {tab === 'handwriting' && <HandwritingPractice initialWord={initialWord} />}
      </div>
    </>
  )
}
