import Link from 'next/link'
import { cn } from '@/lib/utils'

export function KoreanFlag({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 36 24" className={cn('h-4 w-6 rounded-[3px]', className)} aria-hidden="true">
      <rect width="36" height="24" fill="#fff" />
      <g transform="translate(18 12)">
        <path d="M-6 0a6 6 0 0 1 12 0a3 3 0 0 1-6 0a3 3 0 0 0-6 0z" fill="#CD2E3A" />
        <path d="M-6 0a6 6 0 0 0 12 0a3 3 0 0 0-6 0a3 3 0 0 1-6 0z" fill="#0047A0" />
      </g>
      <g fill="#000">
        <rect x="4" y="3" width="5" height="1" transform="rotate(-34 6.5 3.5)" />
        <rect x="4.6" y="4.4" width="5" height="1" transform="rotate(-34 7 5)" />
        <rect x="27" y="3" width="5" height="1" transform="rotate(34 29.5 3.5)" />
        <rect x="26.4" y="4.4" width="5" height="1" transform="rotate(34 29 5)" />
        <rect x="4" y="19" width="5" height="1" transform="rotate(34 6.5 19.5)" />
        <rect x="4.6" y="17.6" width="5" height="1" transform="rotate(34 7 18)" />
        <rect x="27" y="19" width="5" height="1" transform="rotate(-34 29.5 19.5)" />
        <rect x="26.4" y="17.6" width="5" height="1" transform="rotate(-34 29 18)" />
      </g>
    </svg>
  )
}

export function Logo({ className, href = '/', suffix }: { className?: string; href?: string; suffix?: string }) {
  return (
    <Link href={href} className={cn('flex items-center gap-2', className)} aria-label="HANGO trang chủ">
      <span className="text-xl font-extrabold tracking-tight text-foreground">
        HAN<span className="text-primary">GO</span>
      </span>
      <KoreanFlag />
      {suffix ? <span className="text-sm font-medium text-muted-foreground">{suffix}</span> : null}
    </Link>
  )
}
