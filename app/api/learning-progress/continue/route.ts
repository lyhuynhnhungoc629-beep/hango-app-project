import { NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/backend/user-store'
import { getContinueLearningTargetForUser } from '@/lib/backend/learning-path-service'

/**
 * GET /api/learning-progress/continue
 * Xác định chính xác chặng, buổi học và hoạt động chưa hoàn thành gần nhất từ SQL Server.
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

  try {
    const target = await getContinueLearningTargetForUser(authResult.user.uid)
    return NextResponse.json({
      success: true,
      dataSource: 'SQL-Server-HangoDatasetDB',
      data: target,
    })
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error: (err as Error).message || 'Lỗi khi xác định vị trí học tiếp theo.',
      },
      { status: 500 },
    )
  }
}
