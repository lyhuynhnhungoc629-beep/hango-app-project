'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Home } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BackButtonProps {
  fallbackHref?: string
  label?: string
  showHomeLink?: boolean
  className?: string
}

export function BackButton({
  fallbackHref = '/',
  label = 'Quay lại',
  showHomeLink = true,
  className,
}: BackButtonProps) {
  const router = useRouter()

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back()
    } else {
      router.push(fallbackHref)
    }
  }

  return (
    <div className={cn('inline-flex items-center gap-2', className)}>
      <button
        type="button"
        onClick={handleBack}
        className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-card px-3.5 text-sm font-medium text-foreground transition-colors hover:border-primary/50 hover:bg-white/5"
      >
        <ArrowLeft className="size-4 text-violet-400" aria-hidden="true" />
        <span>{label}</span>
      </button>
      {showHomeLink && (
        <Link
          href="/"
          title="Về Trang chủ"
          aria-label="Về Trang chủ"
          className="inline-flex size-10 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground transition-colors hover:border-primary/50 hover:bg-white/5 hover:text-foreground"
        >
          <Home className="size-4" aria-hidden="true" />
        </Link>
      )}
    </div>
  )
}
