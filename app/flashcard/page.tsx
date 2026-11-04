import type { Metadata } from 'next'
import { FlashcardStudy } from '@/components/flashcard/flashcard-study'

export const metadata: Metadata = { title: 'Học từ vựng | HANGO' }

export default function FlashcardPage() {
  return <FlashcardStudy />
}
