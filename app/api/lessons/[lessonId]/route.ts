import { NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/backend/user-store'
import { getLessonDetailForUser } from '@/lib/backend/learning-path-service'

/**
 * GET /api/lessons/[lessonId]
 * Trả về lý thuyết, từ vựng, ngữ pháp, ví dụ, hoạt động, tài liệu luyện viết, bài kiểm tra và trạng thái hoàn thành.
 * - Chặn truy cập trực tiếp bằng API (403 LESSON_LOCKED) nếu buổi học chưa được mở khóa đối với học viên hiện tại.
 */
export async function GET(
  request: Request,
  context: { params: Promise<{ lessonId: string }> },
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

  const { lessonId } = await context.params
  const { searchParams } = new URL(request.url)
  const requestedUid = searchParams.get('uid')?.trim()
  const isAdmin = Boolean(authResult.user.role === 'admin' || authResult.user.isRootAdmin)

  // Chặn Student A xem bài học của Student B
  if (requestedUid && requestedUid !== authResult.user.uid && !isAdmin) {
    return NextResponse.json(
      {
        success: false,
        code: 'FORBIDDEN_CROSS_USER_ACCESS',
        error: 'Truy cập bị từ chối: Bạn chỉ được phép xem buổi học của chính mình.',
      },
      { status: 403 },
    )
  }

  const targetUid = requestedUid && isAdmin ? requestedUid : authResult.user.uid

  try {
    const result = await getLessonDetailForUser(targetUid, lessonId, isAdmin)
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
        error: (err as Error).message || 'Lỗi khi truy xuất nội dung buổi học.',
      },
      { status: 500 },
    )
  }
}
