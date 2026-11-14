import { NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/backend/user-store'
import {
  adminMutateCurriculumInSqlServer,
  getLearningPathForUser,
} from '@/lib/backend/learning-path-service'

/**
 * GET /api/learning-path
 * Trả về toàn bộ lộ trình 7 chặng từ SQL Server (HangoDatasetDB), tổng số chủ đề, tổng số buổi đã xuất bản,
 * trạng thái mở khóa và tiến độ cá nhân thực tế của học viên đang đăng nhập.
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

  // Chặn Student A xem tiến độ lộ trình của Student B
  if (requestedUid && requestedUid !== authResult.user.uid && !isAdmin) {
    return NextResponse.json(
      {
        success: false,
        code: 'FORBIDDEN_CROSS_USER_ACCESS',
        error: 'Truy cập bị từ chối: Bạn chỉ được phép xem lộ trình và tiến độ học tập của chính mình.',
      },
      { status: 403 },
    )
  }

  const targetUid = requestedUid && isAdmin ? requestedUid : authResult.user.uid
  const isSelfAdmin = isAdmin && (!requestedUid || requestedUid === authResult.user.uid)

  try {
    const data = await getLearningPathForUser(targetUid, isSelfAdmin)
    return NextResponse.json({
      success: true,
      dataSource: 'SQL-Server-HangoDatasetDB',
      ...data,
    })
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error: (err as Error).message || 'Lỗi khi truy xuất lộ trình học từ SQL Server.',
      },
      { status: 500 },
    )
  }
}

/**
 * POST /api/learning-path
 * Dành riêng cho Admin: Thêm/chỉnh sửa buổi học, cấu hình hoạt động bắt buộc, cấu hình điểm đạt (80%) và điều kiện mở khóa.
 */
export async function POST(request: Request) {
  const authResult = await authenticateRequest(request, { requireAdmin: true })
  if (!authResult.ok) {
    return NextResponse.json(
      {
        success: false,
        code: authResult.code,
        error: authResult.error,
      },
      { status: authResult.status },
    )
  }

  try {
    const body = await request.json()
    const result = await adminMutateCurriculumInSqlServer(body)
    return NextResponse.json({
      success: true,
      message: 'Đã cập nhật cấu hình lộ trình học trong SQL Server.',
      data: result,
    })
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error: (err as Error).message || 'Không thể cập nhật lộ trình học.',
      },
      { status: 400 },
    )
  }
}
