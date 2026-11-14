import { NextResponse } from 'next/server'
import {
  createFlashcardVocabulary,
  getStudentFlashcards,
} from '@/lib/backend/flashcard-service'
import { authenticateRequest } from '@/lib/backend/user-store'

/**
 * GET /api/vocabularies
 * Truy xuất danh sách từ vựng Flashcard cho Học viên từ dbo.Vocabulary (SQL Server HangoDatasetDB)
 * - Tự động loại bỏ chủ đề nội bộ Admin (IsAdminOnly = 1), chủ đề bị ẩn/xóa (IsActive = 0, IsDeleted = 1)
 * - Tự động loại bỏ từ vựng dự phòng trùng lặp (CanonicalVocabId IS NOT NULL) và từ bị ẩn
 * - Dùng chung VocabId duy nhất giữa các chủ đề để đồng bộ tiến độ SRS
 */
export async function GET(request: Request) {
  const authResult = await authenticateRequest(request)
  if (!authResult.ok) {
    return NextResponse.json(
      {
        success: false,
        code: authResult.code,
        error: 'Vui lòng đăng nhập hoặc đăng ký tài khoản học viên để sử dụng chức năng này',
        detail: authResult.error,
      },
      { status: authResult.status },
    )
  }

  try {
    const { searchParams } = new URL(request.url)
    const level = searchParams.get('level')
    const pos = searchParams.get('pos')
    const topic = searchParams.get('topic')
    const topicIdParam = searchParams.get('topicId')
    const topicId = topicIdParam && Number.isFinite(Number(topicIdParam)) ? Number(topicIdParam) : null
    const q = searchParams.get('q')

    const result = await getStudentFlashcards({
      level,
      pos,
      topic,
      topicId,
      q,
    })

    return NextResponse.json({
      success: true,
      total: result.data.length,
      topics: result.topics,
      levels: result.levels,
      data: result.data,
    })
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error: (err as Error).message || 'Lỗi khi truy xuất kho từ vựng Flashcard.',
      },
      { status: 500 },
    )
  }
}

/**
 * POST /api/vocabularies
 * Thêm từ vựng mới vào hệ thống (Yêu cầu xác thực Token và kiểm tra quyền Admin tại Backend)
 */
export async function POST(request: Request) {
  const authResult = await authenticateRequest(request, { requireAdmin: true })
  if (!authResult.ok) {
    return NextResponse.json(
      {
        success: false,
        code: authResult.code,
        error: 'Từ chối truy cập: Chỉ Quản trị viên (Admin) mới được phép thêm từ vựng mới.',
        detail: authResult.error,
      },
      { status: authResult.status },
    )
  }

  try {
    const body = await request.json()
    const koreanWord = String(body.koreanWord || body.ko || '').trim()
    const vietnameseMeaning = String(body.vietnameseMeaning || body.meaning || '').trim()

    if (!koreanWord || !vietnameseMeaning) {
      return NextResponse.json(
        { success: false, error: 'Từ tiếng Hàn và Nghĩa tiếng Việt là bắt buộc.' },
        { status: 400 },
      )
    }

    const created = await createFlashcardVocabulary({
      koreanWord,
      romanization: body.romanization ?? body.roman ?? '',
      vietnameseMeaning,
      partOfSpeech: body.partOfSpeech ?? body.pos ?? 'Danh từ',
      hanja: body.hanja ?? null,
      explanationKo: body.explanationKo ?? body.grammarNote ?? null,
      exampleSentenceKo: body.exampleSentenceKo ?? body.exKo ?? '',
      exampleSentenceVi: body.exampleSentenceVi ?? body.exVi ?? '',
      topikLevel: body.topikLevel ?? body.level ?? 'TOPIK I - Cấp 1',
      niklLevel: body.niklLevel ?? null,
      primaryTopicId: body.primaryTopicId ? Number(body.primaryTopicId) : null,
      topicIds: Array.isArray(body.topicIds) ? body.topicIds.map(Number) : undefined,
    })

    return NextResponse.json(
      {
        success: true,
        message: 'Đã thêm từ vựng mới thành công.',
        data: created,
      },
      { status: 201 },
    )
  } catch (err) {
    return NextResponse.json(
      { success: false, error: (err as Error).message || 'Lỗi khi thêm từ vựng.' },
      { status: 400 },
    )
  }
}
