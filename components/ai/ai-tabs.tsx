'use client'

import { useState } from 'react'
import { MessageSquare, Mic } from 'lucide-react'
import { cn } from '@/lib/utils'
import { RoleplayChat } from './roleplay-chat'
import { PronunciationPractice } from './pronunciation-practice'

type Tab = 'chat' | 'pronounce'

export function AiTabs({ initialTab }: { initialTab: Tab }) {
  const [tab, setTab] = useState<Tab>(initialTab)
  const tabs = [
    { id: 'chat' as const, label: 'AI Roleplay Chat', icon: MessageSquare },
    { id: 'pronounce' as const, label: 'Luyện phát âm', icon: Mic },
  ]

  return (
    <>
      <div role="tablist" aria-label="Tính năng AI" className="mb-6 inline-flex rounded-xl border border-border bg-card p-1">
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
              'flex h-10 items-center gap-2 rounded-lg px-4 text-sm font-semibold transition-colors',
              tab === id ? 'bg-primary text-white' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <Icon className="size-4" aria-hidden="true" />
            {label}
          </button>
        ))}
      </div>
      <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`}>
        {tab === 'chat' ? <RoleplayChat /> : <PronunciationPractice />}
      </div>
    </>
  )
}
