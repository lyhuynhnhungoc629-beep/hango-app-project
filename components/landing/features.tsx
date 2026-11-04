import Link from 'next/link'
import { ArrowUpRight, Brain, FileText, Mic, Timer } from 'lucide-react'

const features = [
  {
    icon: Brain,
    title: 'Flashcard 3D với SRS thông minh',
    description: 'Thuật toán lặp lại ngắt quãng nhắc bạn ôn đúng lúc sắp quên, giúp nhớ từ vựng lâu hơn.',
    href: '/flashcard',
  },
  {
    icon: FileText,
    title: 'Thi thử TOPIK I & II',
    description: 'Đề thi bám sát cấu trúc thật với phần Nghe, Đọc, đồng hồ đếm ngược và chấm điểm tức thì.',
    href: '/topik',
  },
  {
    icon: Mic,
    title: 'AI luyện phát âm',
    description: 'Thu âm giọng nói, nhận điểm và phân tích từng âm tiết để biết chính xác chỗ cần sửa.',
    href: '/ai',
  },
  {
    icon: Timer,
    title: 'Phòng học ảo Pomodoro',
    description: 'Tập trung sâu với đồng hồ Pomodoro, âm thanh môi trường và danh sách mục tiêu mỗi ngày.',
    href: '/study-room',
  },
]

export function Features() {
  return (
    <section id="tinh-nang" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-20 md:px-6">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-violet-400">Tính năng</p>
        <h2 className="mt-3 text-balance text-3xl font-bold md:text-4xl">Mọi công cụ bạn cần để giỏi tiếng Hàn</h2>
        <p className="mt-4 text-pretty text-muted-foreground">
          Được thiết kế cho người Việt, từ người mới bắt đầu đến người ôn thi TOPIK cấp cao.
        </p>
      </div>
      <ul className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {features.map(({ icon: Icon, title, description, href }) => (
          <li key={title}>
            <Link
              href={href}
              className="group flex h-full flex-col rounded-2xl border border-border bg-card p-6 transition-all hover:-translate-y-1 hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/10"
            >
              <span className="flex size-12 items-center justify-center rounded-xl bg-primary/15 text-violet-300 transition-colors group-hover:bg-primary group-hover:text-white">
                <Icon className="size-6" aria-hidden="true" />
              </span>
              <h3 className="mt-5 text-lg font-semibold leading-snug">{title}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{description}</p>
              <span className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-violet-300">
                Khám phá
                <ArrowUpRight className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
