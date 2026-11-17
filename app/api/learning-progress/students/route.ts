import { NextResponse } from 'next/server'
import { authenticateRequest, getUserByUid, toPublicUserProfile } from '@/lib/backend/user-store'
import {
  getAllStudentsLearningTracking,
  getStudentDetailedLearningHistory,
} from '@/lib/backend/learning-path-service'

/**
 * GET /api/learning-progress/students
 * Dành riêng cho Quản trị viên (Admin):
 * - Nếu không truyền ?uid: Lấy danh sách tất cả học viên kèm số liệu tiến độ SQL Server thực tế (chặng hiện tại, buổi, hoạt động, số buổi hoàn thành, %, điểm kiểm tra)
 * - Nếu truyền ?uid=<targetUid>: Lấy chi tiết lịch sử học tập, hoạt động, bài thi và tiến độ từng chặng của học viên đó
 */
export async function GET(request: Request) {
  const authResult = await authenticateRequest(request, { requireAdmin: true })
  if (!authResult.ok) {
    return NextResponse.json(
      {
        success: false,
        code: authResult.code,
        error: authResult.error || 'Yêu cầu quyền Quản trị viên để theo dõi học viên.',
      },
      { status: authResult.status },
    )
  }

  const { searchParams } = new URL(request.url)
  const targetUid = searchParams.get('uid')?.trim()
  const searchQuery = searchParams.get('q')?.trim() || ''

  try {
    if (targetUid) {
      const studentAccount = getUserByUid(targetUid)
      if (!studentAccount) {
        return NextResponse.json(
          {
            success: false,
            code: 'STUDENT_NOT_FOUND',
            error: 'Không tìm thấy tài khoản học viên.',
          },
          { status: 404 },
        )
      }

      const history = await getStudentDetailedLearningHistory(targetUid)
      return NextResponse.json({
        success: true,
        student: toPublicUserProfile(studentAccount),
        history,
      })
    }

    const students = await getAllStudentsLearningTracking(searchQuery)
    return NextResponse.json({
      success: true,
      total: students.length,
      students,
    })
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error: (err as Error).message || 'Lỗi khi truy xuất dữ liệu theo dõi học viên.',
      },
      { status: 500 },
    )
  }
}
