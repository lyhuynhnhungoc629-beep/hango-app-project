import { NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/backend/user-store'
import { getLearningLevelDetailForUser } from '@/lib/backend/learning-path-service'

/**
 * GET /api/learning-levels/[levelId]
 * Trả về chi tiết 1 chặng kèm danh sách các chủ đề và buổi học, thứ tự, trạng thái khóa/mở khóa và tiến độ.
 */
export async function GET(
  request: Request,
  context: { params: Promise<{ levelId: string }> },
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

  const { levelId } = await context.params
  const { searchParams } = new URL(request.url)
  const requestedUid = searchParams.get('uid')?.trim()
  const isAdmin = Boolean(authResult.user.role === 'admin' || authResult.user.isRootAdmin)

  // Chặn Student A xem chặng học của Student B
  if (requestedUid && requestedUid !== authResult.user.uid && !isAdmin) {
    return NextResponse.json(
      {
        success: false,
        code: 'FORBIDDEN_CROSS_USER_ACCESS',
        error: 'Truy cập bị từ chối: Bạn chỉ được phép xem lộ trình và tiến độ của chính mình.',
      },
      { status: 403 },
    )
  }

  const targetUid = requestedUid && isAdmin ? requestedUid : authResult.user.uid
  const isSelfAdmin = isAdmin && targetUid === authResult.user.uid

  try {
    const data = await getLearningLevelDetailForUser(targetUid, levelId, isAdmin, isSelfAdmin)
    if (!data) {
      return NextResponse.json(
        {
          success: false,
          code: 'LEVEL_NOT_FOUND',
          error: `Không tìm thấy chặng học "${levelId}" trong SQL Server.`,
        },
        { status: 404 },
      )
    }

    return NextResponse.json({
      success: true,
      dataSource: 'SQL-Server-HangoDatasetDB',
      ...data,
    })
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error: (err as Error).message || 'Lỗi khi truy xuất chi tiết chặng học.',
      },
      { status: 500 },
    )
  }
}
