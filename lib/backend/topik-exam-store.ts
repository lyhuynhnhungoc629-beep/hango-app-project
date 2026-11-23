import fs from 'fs'
import path from 'path'
import type { TopikExam, TopikQuestion } from '@/lib/topik/exam-source'

export interface ExtendedTopikQuestion extends TopikQuestion {
  /** Chỉ số đáp án đúng (0 = A, 1 = B, 2 = C, 3 = D) */
  correctIndex: number
  /** Giải thích đáp án bằng tiếng Việt */
  explanation?: string
}

export interface ManagedTopikExam extends Omit<TopikExam, 'questions'> {
  description: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  questions: ExtendedTopikQuestion[]
}

interface TopikExamStoreData {
  version: string
  updatedAt: string
  exams: ManagedTopikExam[]
}

const DATA_DIR = path.join(process.cwd(), 'data')
const STORE_PATH = path.join(DATA_DIR, 'topik-exams-store.json')

const DEFAULT_EXAMS: ManagedTopikExam[] = []

function loadStore(): TopikExamStoreData {
  try {
    if (fs.existsSync(STORE_PATH)) {
      const raw = JSON.parse(fs.readFileSync(STORE_PATH, 'utf8')) as TopikExamStoreData
      if (raw && Array.isArray(raw.exams)) {
        return raw
      }
    }
  } catch {
    // ignore read error and initialize empty store
  }

  const seeded: TopikExamStoreData = {
    version: '1.0.0',
    updatedAt: new Date().toISOString(),
    exams: DEFAULT_EXAMS,
  }
  saveStore(seeded)
  return seeded
}

function saveStore(store: TopikExamStoreData): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true })
    }
    store.updatedAt = new Date().toISOString()
    fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2), 'utf8')
  } catch {
    // ignore write error
  }
}

function normalizeQuestion(q: Partial<ExtendedTopikQuestion>, index: number): ExtendedTopikQuestion {
  const rawOptions = Array.isArray(q.options) ? q.options.map((o) => String(o || '').trim()) : []
  while (rawOptions.length < 4) {
    rawOptions.push(`Phương án ${rawOptions.length + 1}`)
  }
  const options = rawOptions.slice(0, 4)
  const correctIndex =
    typeof q.correctIndex === 'number' && q.correctIndex >= 0 && q.correctIndex <= 3
      ? q.correctIndex
      : 0

  return {
    number: index + 1,
    section:
      q.section === 'listening'
        ? 'listening'
        : q.section === 'writing'
          ? 'writing'
          : 'reading',
    prompt: String(q.prompt || '다음을 읽고 물음에 답하십시오.').trim(),
    hint: q.hint ? String(q.hint).trim() : undefined,
    passage: q.passage ? String(q.passage).trim() : undefined,
    audioUrl: q.audioUrl ? String(q.audioUrl).trim() : undefined,
    audioScript: q.audioScript ? String(q.audioScript).trim() : undefined,
    options,
    correctIndex,
    explanation: q.explanation ? String(q.explanation).trim() : undefined,
  }
}

export function getAllTopikExamsForAdmin() {
  const store = loadStore()
  const exams = store.exams
  const totalExams = exams.length
  const activeExams = exams.filter((e) => e.isActive).length
  const topik1Count = exams.filter((e) => e.level === 'TOPIK I').length
  const topik2Count = exams.filter((e) => e.level === 'TOPIK II').length
  const totalQuestions = exams.reduce((sum, e) => sum + e.questions.length, 0)

  return {
    summary: {
      totalExams,
      activeExams,
      topik1Count,
      topik2Count,
      totalQuestions,
    },
    exams,
  }
}

export function getActiveTopikExamsForStudent(): ManagedTopikExam[] {
  const store = loadStore()
  return store.exams.filter((e) => e.isActive && e.questions.length > 0)
}

export function getTopikExamById(examId: string): ManagedTopikExam | null {
  const store = loadStore()
  return store.exams.find((e) => e.examId === examId) || null
}

export function upsertTopikExam(input: {
  examId?: string
  title: string
  description?: string
  level: 'TOPIK I' | 'TOPIK II'
  durationMinutes: number
  maxListenCount?: number
  isActive?: boolean
  questions: Array<Partial<ExtendedTopikQuestion>>
}): ManagedTopikExam {
  const title = String(input.title || '').trim()
  if (!title) {
    throw new Error('Tên đề thi không được để trống.')
  }
  if (!Array.isArray(input.questions) || input.questions.length === 0) {
    throw new Error('Đề thi phải có ít nhất 1 câu hỏi.')
  }

  const store = loadStore()
  const now = new Date().toISOString()
  const normalizedQuestions = input.questions.map((q, idx) => normalizeQuestion(q, idx))

  const existingIndex = input.examId
    ? store.exams.findIndex((e) => e.examId === input.examId)
    : -1

  if (existingIndex >= 0) {
    const existing = store.exams[existingIndex]
    const updated: ManagedTopikExam = {
      ...existing,
      title,
      description: String(input.description ?? existing.description ?? '').trim(),
      level: input.level === 'TOPIK II' ? 'TOPIK II' : 'TOPIK I',
      durationMinutes: Math.max(5, Number(input.durationMinutes) || 60),
      maxListenCount: Math.max(1, Number(input.maxListenCount) || 2),
      isActive: input.isActive !== undefined ? Boolean(input.isActive) : existing.isActive,
      updatedAt: now,
      questions: normalizedQuestions,
    }
    store.exams[existingIndex] = updated
    saveStore(store)
    return updated
  }

  const slug =
    input.examId?.trim() ||
    `topik-${input.level === 'TOPIK II' ? '2' : '1'}-${Date.now().toString(36)}`

  const created: ManagedTopikExam = {
    examId: slug,
    title,
    description:
      String(input.description || '').trim() ||
      `Đề thi thử ${input.level} gồm ${normalizedQuestions.length} câu hỏi.`,
    level: input.level === 'TOPIK II' ? 'TOPIK II' : 'TOPIK I',
    durationMinutes: Math.max(5, Number(input.durationMinutes) || 60),
    maxListenCount: Math.max(1, Number(input.maxListenCount) || 2),
    isActive: input.isActive !== undefined ? Boolean(input.isActive) : true,
    createdAt: now,
    updatedAt: now,
    questions: normalizedQuestions,
  }

  store.exams.unshift(created)
  saveStore(store)
  return created
}

export function importTopikExamsBatch(
  rawExams: Array<{
    examId?: string
    title: string
    description?: string
    level?: 'TOPIK I' | 'TOPIK II' | string
    durationMinutes?: number
    maxListenCount?: number
    isActive?: boolean
    questions: Array<Partial<ExtendedTopikQuestion>>
  }>,
): ManagedTopikExam[] {
  if (!Array.isArray(rawExams) || rawExams.length === 0) {
    throw new Error('Không tìm thấy dữ liệu đề thi hợp lệ để import.')
  }

  const imported: ManagedTopikExam[] = []
  for (const item of rawExams) {
    const lv = String(item.level || '').toUpperCase().includes('II') ? 'TOPIK II' : 'TOPIK I'
    const saved = upsertTopikExam({
      examId: item.examId,
      title: item.title,
      description: item.description,
      level: lv,
      durationMinutes: Number(item.durationMinutes) || (lv === 'TOPIK II' ? 110 : 100),
      maxListenCount: Number(item.maxListenCount) || 2,
      isActive: item.isActive !== undefined ? Boolean(item.isActive) : true,
      questions: item.questions || [],
    })
    imported.push(saved)
  }
  return imported
}

export function toggleTopikExamStatus(examId: string, isActive: boolean): ManagedTopikExam {
  const store = loadStore()
  const found = store.exams.find((e) => e.examId === examId)
  if (!found) {
    throw new Error('Không tìm thấy đề thi cần cập nhật.')
  }
  found.isActive = Boolean(isActive)
  found.updatedAt = new Date().toISOString()
  saveStore(store)
  return found
}

export function deleteTopikExamById(examId: string): void {
  const store = loadStore()
  const idx = store.exams.findIndex((e) => e.examId === examId)
  if (idx === -1) {
    throw new Error('Không tìm thấy đề thi cần xóa.')
  }
  store.exams.splice(idx, 1)
  saveStore(store)
}
