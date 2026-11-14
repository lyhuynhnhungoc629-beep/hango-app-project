import { NextResponse } from 'next/server'
import {
  buildUnifiedFlashcardDataset,
  createFlashcardTopic,
  createFlashcardVocabulary,
  setVocabularyTopicAssignments,
  updateFlashcardTopic,
  updateFlashcardVocabulary,
} from '@/lib/backend/flashcard-service'
import { authenticateRequest } from '@/lib/backend/user-store'

/**
 * GET /api/admin/flashcard
 * Truy xuất toàn bộ dữ liệu Quản lý Flashcard dành riêng cho Admin:
 * - Kiểm tra trạng thái Schema thực tế trên SQL Server (HangoDatasetDB)
 * - Thống kê tổng quan (Tổng chủ đề, Tổng từ vựng, Từ đang sử dụng, Từ chưa phân loại)
 * - Danh sách 11+ chủ đề (bao gồm chủ đề nội bộ Admin)
 * - Kho từ vựng đầy đủ từ dbo.Vocabulary và liên kết nhiều-nhiều VocabularyTopicMappings
 */
export async function GET(request: Request) {
  const authResult = await authenticateRequest(request, { requireAdmin: true })
  if (!authResult.ok) {
    return NextResponse.json(
      {
        success: false,
        code: authResult.code,
        error: 'Từ chối truy cập: Chỉ Quản trị viên (Admin) mới được phép truy cập phân hệ Quản lý Flashcard.',
        detail: authResult.error,
      },
      { status: authResult.status },
    )
  }

  try {
    const { searchParams } = new URL(request.url)
    const forceRefresh = searchParams.get('refresh') === '1'
    const dataset = await buildUnifiedFlashcardDataset(forceRefresh)

    return NextResponse.json({
      success: true,
      schemaStatus: dataset.schemaStatus,
      summary: dataset.summary,
      topics: dataset.topics,
      vocabularies: dataset.vocabularies,
    })
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error: (err as Error).message || 'Không thể tải dữ liệu Quản lý Flashcard.',
      },
      { status: 500 },
    )
  }
}

/**
 * POST /api/admin/flashcard
 * Thực thi các thao tác quản trị Chủ đề, Từ vựng và Phân loại chủ đề (Bắt buộc quyền Admin tại Backend)
 */
export async function POST(request: Request) {
  const authResult = await authenticateRequest(request, { requireAdmin: true })
  if (!authResult.ok) {
    return NextResponse.json(
      {
        success: false,
        code: authResult.code,
        error: 'Từ chối truy cập: Tài khoản Học viên (Student) không được phép thực hiện thao tác quản trị Flashcard.',
        detail: authResult.error,
      },
      { status: authResult.status },
    )
  }

  try {
    const body = await request.json()
    const action = String(body.action || '').trim()

    if (action === 'create_topic') {
      const topic = await createFlashcardTopic({
        topicNameVi: body.topicNameVi,
        topicNameKo: body.topicNameKo,
        topicCode: body.topicCode,
        description: body.description,
        iconName: body.iconName,
        colorCode: body.colorCode,
        displayOrder: body.displayOrder,
        isActive: body.isActive,
        isAdminOnly: body.isAdminOnly,
      })
      const dataset = await buildUnifiedFlashcardDataset(false)
      return NextResponse.json({
        success: true,
        message: `Đã thêm chủ đề "${topic.topicNameVi}" thành công.`,
        topic,
        summary: dataset.summary,
        topics: dataset.topics,
      })
    }

    if (action === 'update_topic') {
      const topicId = Number(body.topicId)
      if (!Number.isFinite(topicId) || topicId <= 0) {
        return NextResponse.json({ success: false, error: 'TopicId không hợp lệ.' }, { status: 400 })
      }
      const topic = await updateFlashcardTopic(topicId, {
        topicNameVi: body.topicNameVi,
        topicNameKo: body.topicNameKo,
        description: body.description,
        iconName: body.iconName,
        colorCode: body.colorCode,
        displayOrder: body.displayOrder,
        isActive: body.isActive,
        isAdminOnly: body.isAdminOnly,
        isDeleted: body.isDeleted,
      })
      const dataset = await buildUnifiedFlashcardDataset(false)
      return NextResponse.json({
        success: true,
        message: `Đã cập nhật chủ đề "${topic.topicNameVi}" thành công.`,
        topic,
        summary: dataset.summary,
        topics: dataset.topics,
      })
    }

    if (action === 'create_vocab') {
      const vocab = await createFlashcardVocabulary({
        koreanWord: body.koreanWord,
        romanization: body.romanization,
        vietnameseMeaning: body.vietnameseMeaning,
        partOfSpeech: body.partOfSpeech,
        hanja: body.hanja,
        explanationKo: body.explanationKo,
        exampleSentenceKo: body.exampleSentenceKo,
        exampleSentenceVi: body.exampleSentenceVi,
        topikLevel: body.topikLevel,
        niklLevel: body.niklLevel,
        primaryTopicId: body.primaryTopicId ? Number(body.primaryTopicId) : null,
        topicIds: Array.isArray(body.topicIds) ? body.topicIds.map(Number) : undefined,
      })
      const dataset = await buildUnifiedFlashcardDataset(false)
      return NextResponse.json({
        success: true,
        message: `Đã thêm từ vựng "${vocab.koreanWord}" (#${vocab.vocabId}) thành công.`,
        vocab,
        summary: dataset.summary,
        topics: dataset.topics,
      })
    }

    if (action === 'update_vocab') {
      const vocabId = Number(body.vocabId)
      if (!Number.isFinite(vocabId) || vocabId <= 0) {
        return NextResponse.json({ success: false, error: 'VocabId không hợp lệ.' }, { status: 400 })
      }
      const vocab = await updateFlashcardVocabulary(vocabId, {
        koreanWord: body.koreanWord,
        romanization: body.romanization,
        vietnameseMeaning: body.vietnameseMeaning,
        partOfSpeech: body.partOfSpeech,
        hanja: body.hanja,
        explanationKo: body.explanationKo,
        exampleSentenceKo: body.exampleSentenceKo,
        exampleSentenceVi: body.exampleSentenceVi,
        topikLevel: body.topikLevel,
        niklLevel: body.niklLevel,
        status: body.status,
        primaryTopicId: body.primaryTopicId !== undefined ? Number(body.primaryTopicId) : undefined,
        topicIds: Array.isArray(body.topicIds) ? body.topicIds.map(Number) : undefined,
      })
      const dataset = await buildUnifiedFlashcardDataset(false)
      return NextResponse.json({
        success: true,
        message: `Đã cập nhật từ vựng "${vocab.koreanWord}" (#${vocab.vocabId}) thành công.`,
        vocab,
        summary: dataset.summary,
        topics: dataset.topics,
      })
    }

    if (action === 'assign_topics') {
      const vocabId = Number(body.vocabId)
      if (!Number.isFinite(vocabId) || vocabId <= 0 || !Array.isArray(body.topicIds)) {
        return NextResponse.json(
          { success: false, error: 'Cần truyền VocabId và danh sách TopicIds hợp lệ.' },
          { status: 400 },
        )
      }
      const vocab = await setVocabularyTopicAssignments(vocabId, {
        primaryTopicId: body.primaryTopicId ? Number(body.primaryTopicId) : null,
        topicIds: body.topicIds.map(Number),
        classificationReason: body.classificationReason,
      })
      const dataset = await buildUnifiedFlashcardDataset(false)
      return NextResponse.json({
        success: true,
        message: `Đã cập nhật phân loại chủ đề cho từ "${vocab.koreanWord}" (#${vocab.vocabId}).`,
        vocab,
        summary: dataset.summary,
        topics: dataset.topics,
      })
    }

    return NextResponse.json(
      { success: false, error: `Hành động không hợp lệ: "${action}".` },
      { status: 400 },
    )
  } catch (err) {
    return NextResponse.json(
      { success: false, error: (err as Error).message || 'Lỗi khi thực thi thao tác quản trị Flashcard.' },
      { status: 400 },
    )
  }
}
