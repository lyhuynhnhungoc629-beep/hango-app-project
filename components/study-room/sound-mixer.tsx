'use client'

import { useEffect, useRef, useState } from 'react'
import { CloudRain, Coffee, Music, Volume2, type LucideIcon, Sparkles, Folder } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Sound {
  id: 'rain' | 'cafe' | 'lofi'
  label: string
  sublabel: string
  icon: LucideIcon
  on: boolean
  volume: number
  primaryUrl?: string
  fallbackUrl?: string
}

const initial: Sound[] = [
  {
    id: 'rain',
    label: 'Tiếng mưa rơi thật',
    sublabel: 'Bản thu âm tiếng mưa tự nhiên chất lượng cao',
    icon: CloudRain,
    on: false,
    volume: 75,
    primaryUrl: '/audio/rain.mp3',
    fallbackUrl: 'https://cdn.jsdelivr.net/gh/karthiknvd/noctune@main/sounds/rain.mp3',
  },
  {
    id: 'cafe',
    label: 'Góc quán cà phê sách',
    sublabel: 'Không gian tĩnh lặng, cách âm êm đềm',
    icon: Coffee,
    on: false,
    volume: 35,
  },
  {
    id: 'lofi',
    label: 'Lofi Chill Piano',
    sublabel: 'Hợp âm Rhodes ấm áp, thư giãn tinh thần',
    icon: Music,
    on: false,
    volume: 70,
  },
]

export function SoundMixer() {
  const [sounds, setSounds] = useState<Sound[]>(initial)
  const audioElementsRef = useRef<{ [key: string]: HTMLAudioElement }>({})
  const audioCtxRef = useRef<AudioContext | null>(null)
  const webAudioNodesRef = useRef<{
    [key: string]: {
      masterGain: GainNode
      cleanups: (() => void)[]
    }
  }>({})

  const getAudioContext = () => {
    if (!audioCtxRef.current) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
      audioCtxRef.current = new AudioCtx()
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume()
    }
    return audioCtxRef.current
  }

  // Fallback tiếng mưa bằng Web Audio nếu không có mạng tải mp3
  const createRainFallback = (ctx: AudioContext, masterGain: GainNode) => {
    const cleanups: (() => void)[] = []

    const bufferSize = ctx.sampleRate * 2
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
    const output = buffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * 0.08
    }
    const bg = ctx.createBufferSource()
    bg.buffer = buffer
    bg.loop = true

    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.setValueAtTime(550, ctx.currentTime)

    bg.connect(filter)
    filter.connect(masterGain)
    bg.start()

    cleanups.push(() => {
      try {
        bg.stop()
        bg.disconnect()
        filter.disconnect()
      } catch {}
    })

    return cleanups
  }

  // Quán cà phê sách tĩnh lặng (Web Audio êm đềm, không hề ồn ào)
  const createCafeSound = (ctx: AudioContext, masterGain: GainNode) => {
    const cleanups: (() => void)[] = []

    const bufferSize = ctx.sampleRate * 2
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
    const output = buffer.getChannelData(0)
    let lastOut = 0.0
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1
      output[i] = (lastOut + 0.02 * white) / 1.02
      lastOut = output[i]
      output[i] *= 0.45
    }

    const brownSource = ctx.createBufferSource()
    brownSource.buffer = buffer
    brownSource.loop = true

    const lowpass = ctx.createBiquadFilter()
    lowpass.type = 'lowpass'
    lowpass.frequency.setValueAtTime(130, ctx.currentTime)

    brownSource.connect(lowpass)
    lowpass.connect(masterGain)
    brownSource.start()

    cleanups.push(() => {
      try {
        brownSource.stop()
        brownSource.disconnect()
        lowpass.disconnect()
      } catch {}
    })

    const cupInterval = window.setInterval(() => {
      if (ctx.state === 'closed' || Math.random() > 0.3) return
      try {
        const chime = ctx.createOscillator()
        const chimeGain = ctx.createGain()
        chime.type = 'sine'
        chime.frequency.setValueAtTime(1500 + Math.random() * 400, ctx.currentTime)
        chimeGain.gain.setValueAtTime(0.002, ctx.currentTime)
        chimeGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.15)

        chime.connect(chimeGain)
        chimeGain.connect(masterGain)
        chime.start()
        chime.stop(ctx.currentTime + 0.15)
      } catch {}
    }, 3200)

    cleanups.push(() => clearInterval(cupInterval))

    return cleanups
  }

  // Lofi Chill Piano (Hợp âm Rhodes ấm áp)
  const createLofiSound = (ctx: AudioContext, masterGain: GainNode) => {
    const cleanups: (() => void)[] = []

    const chords = [
      [174.61, 220.0, 261.63, 329.63], // Fmaj7
      [164.81, 196.0, 246.94, 293.66], // Em7
      [146.83, 174.61, 220.0, 261.63], // Dm7
      [130.81, 164.81, 196.0, 246.94], // Cmaj7
    ]

    let chordIdx = 0

    const playNextChord = () => {
      if (ctx.state === 'closed') return
      try {
        const currentChord = chords[chordIdx]
        chordIdx = (chordIdx + 1) % chords.length

        currentChord.forEach((freq, i) => {
          const osc = ctx.createOscillator()
          const noteGain = ctx.createGain()
          const filter = ctx.createBiquadFilter()

          osc.type = i === 0 ? 'sine' : 'triangle'
          osc.frequency.setValueAtTime(freq, ctx.currentTime)

          filter.type = 'lowpass'
          filter.frequency.setValueAtTime(950, ctx.currentTime)

          const noteTime = ctx.currentTime + i * 0.07
          noteGain.gain.setValueAtTime(0.0001, noteTime)
          noteGain.gain.linearRampToValueAtTime(0.09, noteTime + 0.25)
          noteGain.gain.exponentialRampToValueAtTime(0.0001, noteTime + 3.9)

          osc.connect(filter)
          filter.connect(noteGain)
          noteGain.connect(masterGain)

          osc.start(noteTime)
          osc.stop(noteTime + 4.0)
        })
      } catch {}
    }

    playNextChord()
    const lofiInterval = window.setInterval(playNextChord, 4000)
    cleanups.push(() => clearInterval(lofiInterval))

    return cleanups
  }

  const handleToggle = (id: 'rain' | 'cafe' | 'lofi') => {
    const target = sounds.find((s) => s.id === id)
    if (!target) return
    const nextOn = !target.on

    if (id === 'rain') {
      if (nextOn) {
        // Ưu tiên phát file MP3 thu âm thật
        const audio = new Audio(target.primaryUrl)
        audio.loop = true
        audio.volume = target.volume / 100

        // Nếu file cục bộ chưa có -> tự động dùng link CDN thu âm thật của Noctune
        audio.onerror = () => {
          if (target.fallbackUrl && audio.src !== target.fallbackUrl) {
            audio.src = target.fallbackUrl
            audio.play().catch(() => {
              // Nếu cả 2 đều không tải được -> fallback sang Web Audio
              const ctx = getAudioContext()
              const masterGain = ctx.createGain()
              masterGain.gain.setValueAtTime(target.volume / 100, ctx.currentTime)
              masterGain.connect(ctx.destination)
              const cleanups = createRainFallback(ctx, masterGain)
              webAudioNodesRef.current['rain'] = { masterGain, cleanups }
            })
          }
        }

        audio.play().catch(() => {
          if (target.fallbackUrl) {
            audio.src = target.fallbackUrl
            audio.play().catch(() => {})
          }
        })

        audioElementsRef.current['rain'] = audio
      } else {
        const audio = audioElementsRef.current['rain']
        if (audio) {
          audio.pause()
          audio.currentTime = 0
        }
        if (webAudioNodesRef.current['rain']) {
          webAudioNodesRef.current['rain'].cleanups.forEach((c) => c())
          webAudioNodesRef.current['rain'].masterGain.disconnect()
          delete webAudioNodesRef.current['rain']
        }
      }
    } else {
      // Cafe và Lofi chạy bằng Web Audio
      const ctx = getAudioContext()
      if (nextOn) {
        const masterGain = ctx.createGain()
        masterGain.gain.setValueAtTime(target.volume / 100, ctx.currentTime)
        masterGain.connect(ctx.destination)

        let cleanups: (() => void)[] = []
        if (id === 'cafe') cleanups = createCafeSound(ctx, masterGain)
        if (id === 'lofi') cleanups = createLofiSound(ctx, masterGain)

        webAudioNodesRef.current[id] = { masterGain, cleanups }
      } else {
        if (webAudioNodesRef.current[id]) {
          try {
            webAudioNodesRef.current[id].cleanups.forEach((cleanup) => cleanup())
            webAudioNodesRef.current[id].masterGain.disconnect()
          } catch {}
          delete webAudioNodesRef.current[id]
        }
      }
    }

    setSounds((list) => list.map((s) => (s.id === id ? { ...s, on: nextOn } : s)))
  }

  const handleVolumeChange = (id: 'rain' | 'cafe' | 'lofi', newVolume: number) => {
    setSounds((list) => list.map((s) => (s.id === id ? { ...s, volume: newVolume } : s)))

    if (id === 'rain') {
      const audio = audioElementsRef.current['rain']
      if (audio) {
        audio.volume = newVolume / 100
      }
      if (webAudioNodesRef.current['rain'] && audioCtxRef.current) {
        webAudioNodesRef.current['rain'].masterGain.gain.setValueAtTime(
          newVolume / 100,
          audioCtxRef.current.currentTime,
        )
      }
    } else {
      if (webAudioNodesRef.current[id] && audioCtxRef.current) {
        webAudioNodesRef.current[id].masterGain.gain.setValueAtTime(
          newVolume / 100,
          audioCtxRef.current.currentTime,
        )
      }
    }
  }

  useEffect(() => {
    return () => {
      Object.values(audioElementsRef.current).forEach((audio) => {
        try {
          audio.pause()
        } catch {}
      })
      Object.keys(webAudioNodesRef.current).forEach((key) => {
        try {
          webAudioNodesRef.current[key].cleanups.forEach((c) => c())
          webAudioNodesRef.current[key].masterGain.disconnect()
        } catch {}
      })
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close().catch(() => {})
      }
    }
  }, [])

  return (
    <section aria-labelledby="mixer-title" className="rounded-2xl border border-border bg-card p-6 shadow-md">
      <div className="flex items-center justify-between">
        <h2 id="mixer-title" className="font-semibold flex items-center gap-2">
          Âm thanh môi trường
        </h2>
        <span className="flex items-center gap-1 text-xs text-violet-300 font-medium">
          <Sparkles className="size-3.5 text-primary" /> MP3 thu âm thật
        </span>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">Bật kết hợp các âm thanh tự nhiên để tăng tối đa độ tập trung.</p>

      <ul className="mt-6 flex flex-col gap-4">
        {sounds.map(({ id, label, sublabel, icon: Icon, on, volume }) => (
          <li
            key={id}
            className={cn(
              'rounded-xl border p-4 transition-all',
              on ? 'border-primary/50 bg-primary/10 shadow-sm' : 'border-border bg-background',
            )}
          >
            <div className="flex items-center gap-3">
              <span
                className={cn(
                  'flex size-11 items-center justify-center rounded-xl transition-colors',
                  on ? 'bg-primary text-white shadow-md shadow-primary/30' : 'bg-white/5 text-muted-foreground',
                )}
              >
                <Icon className="size-5" aria-hidden="true" />
              </span>
              <div className="flex-1 min-w-0">
                <span className="font-medium text-sm md:text-base block">{label}</span>
                <span className="text-xs text-muted-foreground block truncate">{sublabel}</span>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={on}
                aria-label={`Bật ${label}`}
                onClick={() => handleToggle(id)}
                className={cn(
                  'relative h-6 w-11 rounded-full transition-colors cursor-pointer shrink-0',
                  on ? 'bg-primary' : 'bg-white/15',
                )}
              >
                <span
                  className={cn(
                    'absolute top-0.5 size-5 rounded-full bg-white transition-all shadow-sm',
                    on ? 'left-[22px]' : 'left-0.5',
                  )}
                />
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
                onChange={(e) => handleVolumeChange(id, Number(e.target.value))}
                className="h-1.5 flex-1 cursor-pointer appearance-none rounded-lg bg-white/15 accent-primary disabled:opacity-40"
              />
              <span className="w-9 text-right text-xs font-mono tabular-nums text-muted-foreground">
                {volume}%
              </span>
            </div>
          </li>
        ))}
      </ul>

      {/* Mẹo thêm file âm thanh cục bộ */}
      <div className="mt-5 rounded-xl bg-background/60 border border-border/60 p-3.5 flex items-start gap-2.5 text-xs text-muted-foreground">
        <Folder className="size-4 shrink-0 text-violet-400 mt-0.5" />
        <p>
          <strong>Mẹo âm thanh:</strong> Đang phát bản thu âm MP3 thật. Bạn có thể tải bất kỳ file MP3 tiếng mưa nào bạn thích và lưu vào thư mục <code>public/audio/rain.mp3</code>, ứng dụng sẽ tự động ưu tiên phát file của bạn!
        </p>
      </div>
    </section>
  )
}
