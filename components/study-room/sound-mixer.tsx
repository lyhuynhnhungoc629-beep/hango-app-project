'use client'

import { useState } from 'react'
import { CloudRain, Coffee, Music, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

type Sound = { id: string; label: string; icon: LucideIcon; on: boolean; volume: number }

const initial: Sound[] = [
  { id: 'rain', label: 'Tiếng mưa', icon: CloudRain, on: true, volume: 65 },
  { id: 'cafe', label: 'Quán cà phê', icon: Coffee, on: false, volume: 40 },
  { id: 'lofi', label: 'Lofi nhạc nền', icon: Music, on: true, volume: 50 },
]

export function SoundMixer() {
  const [sounds, setSounds] = useState(initial)
  const update = (id: string, patch: Partial<Sound>) => setSounds((list) => list.map((s) => (s.id === id ? { ...s, ...patch } : s)))

  return (
    <section aria-labelledby="mixer-title" className="rounded-2xl border border-border bg-card p-6">
      <h2 id="mixer-title" className="font-semibold">
        Âm thanh môi trường
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">Kết hợp âm thanh để tạo không gian học tập.</p>
      <ul className="mt-6 flex flex-col gap-4">
        {sounds.map(({ id, label, icon: Icon, on, volume }) => (
          <li key={id} className={cn('rounded-xl border p-4 transition-colors', on ? 'border-primary/40 bg-primary/5' : 'border-border bg-background')}>
            <div className="flex items-center gap-3">
              <span className={cn('flex size-10 items-center justify-center rounded-lg', on ? 'bg-primary text-white' : 'bg-white/5 text-muted-foreground')}>
                <Icon className="size-5" aria-hidden="true" />
              </span>
              <span className="flex-1 font-medium">{label}</span>
              <button
                type="button"
                role="switch"
                aria-checked={on}
                aria-label={`Bật ${label}`}
                onClick={() => update(id, { on: !on })}
                className={cn('relative h-6 w-11 rounded-full transition-colors', on ? 'bg-primary' : 'bg-white/15')}
              >
                <span className={cn('absolute top-0.5 size-5 rounded-full bg-white transition-all', on ? 'left-[22px]' : 'left-0.5')} />
              </button>
            </div>
            <div className="mt-4 flex items-center gap-3">
              <input
                type="range"
                min={0}
                max={100}
                value={volume}
                disabled={!on}
                aria-label={`Âm lượng ${label}`}
                onChange={(e) => update(id, { volume: Number(e.target.value) })}
                className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full accent-primary disabled:opacity-40"
                style={{ background: `linear-gradient(to right, #7c3aed ${volume}%, rgba(255,255,255,0.12) ${volume}%)` }}
              />
              <span className="w-9 text-right text-xs tabular-nums text-muted-foreground">{volume}%</span>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
