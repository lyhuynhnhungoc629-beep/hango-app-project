import { NextResponse } from 'next/server'
import { findFlashcardVocabularyByIdOrWord } from '@/lib/backend/flashcard-service'
import { INITIAL_VOCABULARIES } from '@/lib/backend/vocabulary-data'
import {
  calculateSrsSchedule,
  previewSrsIntervals,
  type SrsRating,
  type SrsState,
} from '@/lib/backend/srs'
import {
  authenticateRequest,
  getUserProgress,
  recordUserHandwritingAttempt,
  recordUserSrsReview,
  recordUserTopikResult,
  toPublicUserProfile,
} from '@/lib/backend/user-store'

/**
 * GET /api/srs/review?uid=<uid>
 * Truy xuất tiến độ học tập thực tế của người dùng đang đăng nhập.
 * - Ngăn chặn tuyệt đối các tài khoản Student xem tiến độ học tập của tài khoản khác (403 Forbidden).
 * - Chỉ Admin mới được phép xem tiến độ của học viên khác.
 */
export async function GET(request: Request) {
  const authResult = await authenticateRequest(request)
  if (!authResult.ok) {
    return NextResponse.json(
      { success: false, code: authResult.code, error: authResult.error },
      { status: authResult.status },
    )
  }

  const { searchParams } = new URL(request.url)
  const requestedUid = searchParams.get('uid') || authResult.user.uid

  if (requestedUid !== authResult.user.uid && authResult.user.role !== 'admin' && !authResult.user.isRootAdmin) {
    return NextResponse.json(
      {
        success: false,
        code: 'FORBIDDEN_CROSS_USER_ACCESS',
        error: 'Truy cập bị từ chối: Bạn không có quyền xem tiến độ học tập của tài khoản khác.',
      },
      { status: 403 },
    )
  }

  const progress = getUserProgress(requestedUid)
  return NextResponse.json({
    success: true,
    user: toPublicUserProfile(authResult.user),
    progress,
  })
}

/**
 * POST /api/srs/review
 * - Thực thi thuật toán SRS tính toán KhoangCachNgay và NgayOnTiepTheo
 * - Ghi nhận tiến độ học tập thực tế (SRS, Luyện viết chữ Hàn, Kết quả thi thử TOPIK)
 * - Ngăn chặn tài khoản bị khóa hoặc chỉnh sửa tiến độ của tài khoản khác
 */
export async function POST(request: Request) {
  try {
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

    const body = await request.json()
    const authenticatedUid = authResult.user.uid

    // Chặn chỉnh sửa tiến độ học tập của người dùng khác
    if (body.uid && String(body.uid) !== authenticatedUid) {
      return NextResponse.json(
        {
          success: false,
          code: 'FORBIDDEN_CROSS_USER_ACCESS',
          error: 'Truy cập bị từ chối: Không được phép chỉnh sửa tiến độ học tập của tài khoản khác.',
        },
        { status: 403 },
      )
    }

    const effectiveUid = authenticatedUid

    // 1. Ghi nhận kết quả luyện viết chữ Hàn
    if (body.activityType === 'handwriting') {
      if (!effectiveUid) {
        return NextResponse.json({ success: false, error: 'Cần đăng nhập để lưu tiến độ luyện viết.' }, { status: 401 })
      }
      const updated = recordUserHandwritingAttempt(effectiveUid, {
        char: String(body.char || '가'),
        unicode: String(body.unicode || 'U+AC00'),
        datasetClassId: String(body.datasetClassId || 'KANG_01_GA'),
        score: Number(body.score) || 0,
      })
      return NextResponse.json({
        success: true,
        message: 'Đã lưu tiến độ luyện viết chữ Hàn.',
        user: updated ? toPublicUserProfile(updated.user) : null,
      })
    }

    // 2. Ghi nhận kết quả nộp bài thi thử TOPIK
    if (body.activityType === 'topik') {
      if (!effectiveUid) {
        return NextResponse.json({ success: false, error: 'Cần đăng nhập để nộp bài và lưu kết quả thi TOPIK.' }, { status: 401 })
      }
      const updated = recordUserTopikResult(effectiveUid, {
        examId: String(body.examId || 'topik-1-de-03'),
        examTitle: String(body.examTitle || 'Đề thi thử TOPIK I - Số 03'),
        correctCount: Number(body.correctCount) || 0,
        totalQuestions: Number(body.totalQuestions) || 40,
        durationSeconds: Number(body.durationSeconds) || 600,
      })
      return NextResponse.json({
        success: true,
        message: 'Đã lưu kết quả bài thi TOPIK.',
        user: updated ? toPublicUserProfile(updated.user) : null,
        result: updated?.result || null,
      })
    }

    // 3. Mặc định: Đánh giá ôn tập từ vựng bằng thuật toán SRS (dùng chung VocabId gốc trên mọi chủ đề)
    const rawVocabId = String(body.vocabId || '').trim()
    const rating = body.rating as SrsRating
    const previous: Partial<SrsState> | undefined = body.previous

    if (!rawVocabId || !['forgot', 'hard', 'remember'].includes(rating)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Tham số không hợp lệ. Cần truyền vocabId và rating (forgot | hard | remember).',
        },
        { status: 400 },
      )
    }

    const foundSqlVocab = await findFlashcardVocabularyByIdOrWord(rawVocabId)
    const canonicalVocabId = foundSqlVocab
      ? String(foundSqlVocab.resolvedCanonicalVocabId)
      : rawVocabId

    const srsResult = calculateSrsSchedule(canonicalVocabId, rating, previous)
    const nextPreview = previewSrsIntervals(canonicalVocabId, srsResult)

    let updatedUserProfile = null
    if (effectiveUid) {
      const vocabInfo = INITIAL_VOCABULARIES.find((v) => v.id === canonicalVocabId)
      const wordKo = String(
        body.wordKo || foundSqlVocab?.vocab.koreanWord || vocabInfo?.ko || canonicalVocabId,
      )
      const meaning = String(
        body.meaning || foundSqlVocab?.vocab.vietnameseMeaning || vocabInfo?.meaning || '',
      )
      const updated = recordUserSrsReview(
        effectiveUid,
        canonicalVocabId,
        wordKo,
        meaning,
        srsResult,
      )
      if (updated) {
        updatedUserProfile = toPublicUserProfile(updated.user)
      }
    }

    return NextResponse.json({
      success: true,
      message: `Đã cập nhật lịch ôn SRS: KhoangCachNgay = ${srsResult.KhoangCachNgay} ngày, NgayOnTiepTheo = ${srsResult.NgayOnTiepTheoHienThi}`,
      canonicalVocabId,
      data: srsResult,
      nextIntervalsPreview: nextPreview,
      user: updatedUserProfile,
    })
  } catch (err) {
    return NextResponse.json(
      { success: false, error: (err as Error).message || 'Lỗi khi tính toán SRS.' },
      { status: 500 },
    )
  }
}
