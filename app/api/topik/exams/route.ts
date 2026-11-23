import { NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/backend/user-store'
import {
  deleteTopikExamById,
  getActiveTopikExamsForStudent,
  getAllTopikExamsForAdmin,
  getTopikExamById,
  importTopikExamsBatch,
  toggleTopikExamStatus,
  upsertTopikExam,
} from '@/lib/backend/topik-exam-store'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const isAdminMode = searchParams.get('admin') === '1'
    const examId = searchParams.get('examId')

    if (isAdminMode) {
      const auth = await authenticateRequest(request, { requireAdmin: true })
      if (!auth.ok) {
        return NextResponse.json({ success: false, error: auth.error }, { status: auth.status })
      }
      const adminData = getAllTopikExamsForAdmin()
      return NextResponse.json({
        success: true,
        ...adminData,
      })
    }

    if (examId) {
      const exam = getTopikExamById(examId)
      if (!exam) {
        return NextResponse.json(
          { success: false, error: 'Không tìm thấy đề thi thử.' },
          { status: 404 },
        )
      }
      return NextResponse.json({
        success: true,
        exam,
      })
    }

    const exams = getActiveTopikExamsForStudent()
    return NextResponse.json({
      success: true,
      exams,
    })
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : 'Lỗi tải danh sách đề thi TOPIK.',
      },
      { status: 500 },
    )
  }
}

export async function POST(request: Request) {
  try {
    const auth = await authenticateRequest(request, { requireAdmin: true })
    if (!auth.ok) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status })
    }

    const body = await request.json()
    const action = String(body.action || '').trim()

    if (action === 'create' || action === 'update') {
      const saved = upsertTopikExam({
        examId: body.examId,
        title: body.title,
        description: body.description,
        level: body.level,
        durationMinutes: Number(body.durationMinutes) || 60,
        maxListenCount: Number(body.maxListenCount) || 2,
        isActive: body.isActive,
        questions: body.questions || [],
      })
      return NextResponse.json({
        success: true,
        message:
          action === 'create'
            ? `Đã tạo đề thi "${saved.title}" thành công.`
            : `Đã cập nhật đề thi "${saved.title}" thành công.`,
        exam: saved,
      })
    }

    if (action === 'import') {
      const imported = importTopikExamsBatch(body.exams || [])
      return NextResponse.json({
        success: true,
        message: `Đã import thành công ${imported.length} đề thi thử TOPIK.`,
        imported,
      })
    }

    if (action === 'toggle_active') {
      const updated = toggleTopikExamStatus(String(body.examId || ''), Boolean(body.isActive))
      return NextResponse.json({
        success: true,
        message: updated.isActive
          ? `Đã mở hiển thị đề thi "${updated.title}" cho học viên.`
          : `Đã tạm ẩn đề thi "${updated.title}" khỏi danh sách của học viên.`,
        exam: updated,
      })
    }

    if (action === 'delete') {
      deleteTopikExamById(String(body.examId || ''))
      return NextResponse.json({
        success: true,
        message: 'Đã xóa đề thi thử thành công.',
      })
    }

    return NextResponse.json(
      { success: false, error: 'Thao tác không hợp lệ.' },
      { status: 400 },
    )
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : 'Lỗi xử lý quản trị đề thi TOPIK.',
      },
      { status: 400 },
    )
  }
}
