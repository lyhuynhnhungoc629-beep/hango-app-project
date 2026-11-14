import { NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/backend/user-store'
import { completeLessonActivityForUser } from '@/lib/backend/learning-path-service'

/**
 * POST /api/learning-progress/activities
 * Kiểm tra điều kiện mở khóa và lưu tiến độ hoàn thành hoạt động vào SQL Server.
 * - Không tin tưởng UID do Frontend gửi lên (nếu truyền uid khác với uid trong Token sẽ bị từ chối 403).
 */
export async function POST(request: Request) {
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

  try {
    const body = await request.json()
    if (body.uid && String(body.uid) !== authResult.user.uid) {
      return NextResponse.json(
        {
          success: false,
          code: 'FORBIDDEN_CROSS_USER_ACCESS',
          error: 'Truy cập bị từ chối: Không được phép cập nhật tiến độ học tập của tài khoản khác.',
        },
        { status: 403 },
      )
    }

    const lessonId = Number(body.lessonId)
    const activityId = Number(body.activityId)
    if (!lessonId || !activityId) {
      return NextResponse.json(
        {
          success: false,
          code: 'INVALID_PARAMS',
          error: 'Cần truyền đầy đủ lessonId và activityId hợp lệ.',
        },
        { status: 400 },
      )
    }

    const isAdmin = Boolean(authResult.user.role === 'admin' || authResult.user.isRootAdmin)
    const isPreview = Boolean(body.preview && isAdmin)
    const result = await completeLessonActivityForUser(
      authResult.user.uid,
      {
        lessonId,
        activityId,
        timeSpentSeconds: Number(body.timeSpentSeconds) || 45,
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
      message: `Đã hoàn thành hoạt động "${result.data.activityTitle}".`,
      data: result.data,
    })
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error: (err as Error).message || 'Lỗi khi cập nhật tiến độ hoạt động.',
      },
      { status: 500 },
    )
  }
}
