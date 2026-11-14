import { NextResponse } from 'next/server'
import {
  calculatePomodoroReward,
  type PomodoroSessionInput,
} from '@/lib/backend/pomodoro-gamification'
import {
  authenticateRequest,
  getUserByUid,
  recordUserPomodoroSession,
  toPublicUserProfile,
} from '@/lib/backend/user-store'

/**
 * POST /api/study-room/pomodoro
 * API lưu trữ phiên học Pomodoro, tính toán điểm XP (DiemXPNhanDuoc, TongXP, CapDo) và Chuỗi Streak (ChuoiStreak)
 * - Kiểm tra Token và chặn nếu tài khoản bị khóa
 * - Không cho phép chỉnh sửa tiến độ của tài khoản khác
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
    if (body.uid && String(body.uid) !== authResult.user.uid) {
      return NextResponse.json(
        {
          success: false,
          code: 'FORBIDDEN_CROSS_USER_ACCESS',
          error: 'Truy cập bị từ chối: Không được phép chỉnh sửa tiến độ học tập của tài khoản khác.',
        },
        { status: 403 },
      )
    }

    const effectiveUid = authResult.user.uid
    const storedUser = getUserByUid(effectiveUid) || authResult.user
    if (storedUser && storedUser.locked && !storedUser.isRootAdmin) {
      return NextResponse.json(
        {
          success: false,
          code: 'ACCOUNT_LOCKED',
          error: 'Tài khoản của bạn đã bị khóa bởi Quản trị viên.',
        },
        { status: 403 },
      )
    }

    const input: PomodoroSessionInput = {
      uid: effectiveUid,
      durationMinutes: Number(body.durationMinutes) || 25,
      completedSessionsToday: Number(body.completedSessionsToday) || 1,
      currentXp: storedUser ? storedUser.xp : Number(body.currentXp) || 0,
      currentStreak: storedUser ? storedUser.streak : Number(body.currentStreak) || 0,
      lastStudyDate: storedUser ? storedUser.lastStudyDate : body.lastStudyDate || null,
      taskTitle: String(body.taskTitle || 'Phiên tập trung Pomodoro 25 phút'),
    }

    const result = calculatePomodoroReward(input)
    let updatedUserProfile = null

    if (effectiveUid) {
      const updated = recordUserPomodoroSession(effectiveUid, input.taskTitle!, result)
      if (updated) {
        updatedUserProfile = toPublicUserProfile(updated.user)
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: `Hoàn thành phiên Pomodoro ${result.durationMinutes} phút! Nhận +${result.DiemXPNhanDuoc} XP · Chuỗi Streak: ${result.ChuoiStreak} ngày.`,
        data: result,
        user: updatedUserProfile,
      },
      { status: 201 },
    )
  } catch (err) {
    return NextResponse.json(
      { success: false, error: (err as Error).message || 'Lỗi khi lưu phiên học Pomodoro.' },
      { status: 500 },
    )
  }
}
