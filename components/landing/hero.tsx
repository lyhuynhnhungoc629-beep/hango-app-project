import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Sparkles } from 'lucide-react'

const stats = [
  { value: '5.600+', label: 'Từ vựng TOPIK' },
  { value: '24', label: 'Đề thi thử' },
  { value: '0đ', label: 'Mãi mãi' },
]

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 right-0 h-[520px] w-[520px] rounded-full bg-primary/25 blur-[140px]"
      />
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 md:px-6 md:py-24 lg:grid-cols-2">
        <div className="relative">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-violet-300">
            <Sparkles className="size-3.5" aria-hidden="true" />
            Nền tảng học tiếng Hàn có AI
          </span>
          <h1 className="mt-6 text-balance text-4xl font-extrabold leading-tight tracking-tight md:text-6xl">
            Học tiếng Hàn thông minh -{' '}
            <span className="bg-gradient-to-r from-violet-400 to-primary bg-clip-text text-transparent">
              Hoàn toàn miễn phí
            </span>
          </h1>
          <p className="mt-6 max-w-xl text-pretty text-lg leading-relaxed text-muted-foreground">
            Ghi nhớ từ vựng bằng Flashcard SRS, luyện đề TOPIK như thi thật và luyện phát âm cùng AI. Mọi thứ bạn cần để
            chinh phục tiếng Hàn, ở cùng một nơi.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/auth?tab=register"
              className="inline-flex h-12 items-center gap-2 rounded-xl bg-primary px-6 font-semibold text-primary-foreground shadow-xl shadow-primary/30 transition-colors hover:bg-primary/90"
            >
              Bắt đầu học ngay
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
            <Link
              href="#tinh-nang"
              className="inline-flex h-12 items-center rounded-xl border border-white/15 px-6 font-semibold transition-colors hover:bg-white/5"
            >
              Xem tính năng
            </Link>
          </div>
          <dl className="mt-12 flex gap-10">
            {stats.map((s) => (
              <div key={s.label}>
                <dt className="sr-only">{s.label}</dt>
                <dd className="text-2xl font-bold">{s.value}</dd>
                <dd className="text-sm text-muted-foreground">{s.label}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="relative mx-auto w-full max-w-lg">
          <div className="animate-float relative aspect-square overflow-hidden rounded-3xl">
            <Image
              src="/images/hero-flashcards.png"
              alt="Minh họa flashcard 3D với chữ Hàn đang lơ lửng"
              fill
              priority
              sizes="(min-width: 1024px) 512px, 100vw"
              className="object-cover"
            />
          </div>
          <div className="animate-drift absolute -left-4 bottom-10 rounded-2xl border border-border bg-card/90 px-4 py-3 shadow-2xl backdrop-blur md:-left-10">
            <p className="text-lg font-bold">사랑해요</p>
            <p className="text-xs text-muted-foreground">Anh yêu em / Em yêu anh</p>
          </div>
          <div className="absolute -right-2 top-8 rounded-2xl border border-border bg-card/90 px-4 py-3 shadow-2xl backdrop-blur md:-right-6">
            <p className="text-xs text-muted-foreground">Chuỗi ngày học</p>
            <p className="font-bold text-amber-400">15 ngày liên tiếp</p>
          </div>
        </div>
      </div>
    </section>
  )
}
