import { NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/backend/user-store'
import { submitExerciseForUser } from '@/lib/backend/learning-path-service'

/**
 * POST /api/exercises/[exerciseId]/submit
 * Chấm điểm bài kiểm tra ở Backend, lưu lịch sử làm bài (dbo.ExerciseAttempts, dbo.QuestionAnswers),
 * kiểm tra điều kiện hoàn thành hoạt động bắt buộc và mở khóa buổi/chặng tiếp theo nếu đạt >= 80%.
 */
export async function POST(
  request: Request,
  context: { params: Promise<{ exerciseId: string }> },
) {
  const authResult = await authenticateRequest(request)
  if (!authResult.ok) {
    return NextResponse.json(
      {
        success: false,
        code: authResult.code,
        error: 'Vui lòng đăng nhập hoặc đăng ký tài khoản học viên để sử dụng chức năng này',
      },
      { status: authResult.status },
    )
  }

  const { exerciseId } = await context.params

  try {
    const body = await request.json()
    if (body.uid && String(body.uid) !== authResult.user.uid) {
      return NextResponse.json(
        {
          success: false,
          code: 'FORBIDDEN_CROSS_USER_ACCESS',
          error: 'Truy cập bị từ chối: Không được phép nộp bài thay cho tài khoản khác.',
        },
        { status: 403 },
      )
    }

    const isAdmin = Boolean(authResult.user.role === 'admin' || authResult.user.isRootAdmin)
    const isPreview = Boolean(body.preview && isAdmin)
    const result = await submitExerciseForUser(
      authResult.user.uid,
      exerciseId,
      {
        answers: body.answers || {},
        durationSeconds: Number(body.durationSeconds) || 90,
        preview: isPreview,
      },
      isAdmin,
    )

    if (!result.ok) {
      return NextResponse.json(
        {
          success: false,
          code: result.code,
          error: result.error,
        },
        { status: result.status },
      )
    }

    return NextResponse.json({
      success: true,
      dataSource: 'SQL-Server-HangoDatasetDB',
      ...result.data,
    })
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error: (err as Error).message || 'Lỗi khi chấm điểm bài kiểm tra.',
      },
      { status: 500 },
    )
  }
}
