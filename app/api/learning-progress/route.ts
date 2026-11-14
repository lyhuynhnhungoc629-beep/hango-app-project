import { NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/backend/user-store'
import { getUserLearningProgressDetail } from '@/lib/backend/learning-path-service'

/**
 * GET /api/learning-progress
 * Trả về chặng hiện tại, buổi hiện tại, hoạt động đang học, số buổi hoàn thành, tiến độ tổng thể và lịch sử làm bài.
 * - Ngăn chặn tuyệt đối Student A xem tiến độ của Student B (403 FORBIDDEN_CROSS_USER_ACCESS).
 */
export async function GET(request: Request) {
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

  const { searchParams } = new URL(request.url)
  const requestedUid = searchParams.get('uid')?.trim()
  const isAdmin = Boolean(authResult.user.role === 'admin' || authResult.user.isRootAdmin)

  if (requestedUid && requestedUid !== authResult.user.uid && !isAdmin) {
    return NextResponse.json(
      {
        success: false,
        code: 'FORBIDDEN_CROSS_USER_ACCESS',
        error: 'Truy cập bị từ chối: Học viên không được phép xem tiến độ học tập của tài khoản khác.',
      },
      { status: 403 },
    )
  }

  const targetUid = requestedUid && isAdmin ? requestedUid : authResult.user.uid

  try {
    const data = await getUserLearningProgressDetail(targetUid)
    return NextResponse.json({
      success: true,
      dataSource: 'SQL-Server-HangoDatasetDB',
      ...data,
    })
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error: (err as Error).message || 'Lỗi khi truy xuất tiến độ học tập từ SQL Server.',
      },
      { status: 500 },
    )
  }
}
