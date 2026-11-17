import { NextResponse } from 'next/server'
import {
  findFlashcardVocabularyByIdOrWord,
  updateFlashcardVocabulary,
} from '@/lib/backend/flashcard-service'
import { decomposeHangul } from '@/lib/handwriting-dataset'
import { authenticateRequest } from '@/lib/backend/user-store'

/**
 * GET /api/vocabularies/[id]
 * Truy xuất thông tin chi tiết của 1 từ vựng theo VocabId, VocabCode hoặc KoreanWord
 */
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
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

  const { id } = await context.params
  const foundResult = await findFlashcardVocabularyByIdOrWord(id)

  if (!foundResult) {
    return NextResponse.json(
      { success: false, error: `Không tìm thấy từ vựng với mã "${id}".` },
      { status: 404 },
    )
  }

  const isAdmin = Boolean(authResult.user.role === 'admin' || authResult.user.isRootAdmin)
  const v = foundResult.vocab

  // Nếu là Student và từ đang bị ẩn hoặc là từ dự phòng -> chặn hiển thị
  if (!isAdmin && (v.status !== 'Published' || v.canonicalVocabId !== null)) {
    return NextResponse.json(
      { success: false, error: 'Từ vựng này hiện không khả dụng.' },
      { status: 404 },
    )
  }

  const syllables = v.koreanWord.split('').map((ch) => ({
    char: ch,
    jamo: decomposeHangul(ch),
  }))

  return NextResponse.json({
    success: true,
    data: {
      id: String(v.vocabId),
      vocabId: v.vocabId,
      vocabCode: v.vocabCode,
      ko: v.koreanWord,
      roman: v.romanization,
      meaning: v.vietnameseMeaning,
      pos: v.partOfSpeech,
      hanja: v.hanja,
      level: v.topikLevel,
      niklLevel: v.niklLevel,
      topic: v.primaryTopicNameVi || v.originalTopicName || 'Từ vựng',
      exKo: v.exampleSentenceKo,
      exVi: v.exampleSentenceVi,
      grammarNote: v.explanationKo || '',
      sourceName: v.sourceName,
      mappings: isAdmin
        ? v.mappings
        : v.mappings.filter((m) => !m.isDeleted && m.reviewStatus === 'ACTIVE' && m.topicCode !== 'CHUA_PHAN_LOAI'),
      syllables,
    },
  })
}

/**
 * PUT / PATCH /api/vocabularies/[id]
 * Cập nhật thông tin từ vựng, ẩn/hiện hoặc gán chủ đề (Bắt buộc quyền Admin tại Backend)
 */
async function handleAdminUpdate(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const authResult = await authenticateRequest(request, { requireAdmin: true })
  if (!authResult.ok) {
    return NextResponse.json(
      {
        success: false,
        code: authResult.code,
        error: 'Từ chối truy cập: Chỉ Quản trị viên (Admin) mới được phép chỉnh sửa từ vựng.',
        detail: authResult.error,
      },
      { status: authResult.status },
    )
  }

  try {
    const { id } = await context.params
    const vocabId = Number(id)
    if (!Number.isFinite(vocabId) || vocabId <= 0) {
      return NextResponse.json(
        { success: false, error: 'VocabId không hợp lệ.' },
        { status: 400 },
      )
    }

    const body = await request.json()
    const updated = await updateFlashcardVocabulary(vocabId, {
      koreanWord: body.koreanWord ?? body.ko,
      romanization: body.romanization ?? body.roman,
      vietnameseMeaning: body.vietnameseMeaning ?? body.meaning,
      partOfSpeech: body.partOfSpeech ?? body.pos,
      hanja: body.hanja,
      explanationKo: body.explanationKo ?? body.grammarNote,
      exampleSentenceKo: body.exampleSentenceKo ?? body.exKo,
      exampleSentenceVi: body.exampleSentenceVi ?? body.exVi,
      topikLevel: body.topikLevel ?? body.level,
      niklLevel: body.niklLevel,
      status: body.status,
      primaryTopicId: body.primaryTopicId !== undefined ? Number(body.primaryTopicId) : undefined,
      topicIds: Array.isArray(body.topicIds) ? body.topicIds.map(Number) : undefined,
    })

    return NextResponse.json({
      success: true,
      message: 'Đã cập nhật thông tin từ vựng thành công.',
      data: updated,
    })
  } catch (err) {
    return NextResponse.json(
      { success: false, error: (err as Error).message || 'Lỗi khi cập nhật từ vựng.' },
      { status: 400 },
    )
  }
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  return handleAdminUpdate(request, context)
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  return handleAdminUpdate(request, context)
}
