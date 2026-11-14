import { NextResponse } from 'next/server'
import type { UserRole } from '@/lib/backend/security'
import {
  authenticateRequest,
  deleteAccountByAdmin,
  getAdminDashboardData,
  getUserByUid,
  getUserProgress,
  toPublicUserProfile,
  updateAccountLockByAdmin,
  updateAccountRoleByRootAdmin,
} from '@/lib/backend/user-store'

/**
 * GET /api/admin/users
 * - Yêu cầu xác thực quyền Admin tại Backend
 * - Nếu truyền ?uid=<uid>: trả về chi tiết hồ sơ và toàn bộ tiến độ học tập thực tế của học viên đó
 * - Nếu không truyền ?uid: trả về dữ liệu thống kê Dashboard quản trị, danh sách tài khoản, học viên nổi bật
 */
export async function GET(request: Request) {
  const authResult = await authenticateRequest(request, { requireAdmin: true })
  if (!authResult.ok) {
    return NextResponse.json(
      { success: false, code: authResult.code, error: authResult.error },
      { status: authResult.status },
    )
  }

  const { searchParams } = new URL(request.url)
  const targetUid = searchParams.get('uid')
  const search = (searchParams.get('q') || '').trim().toLowerCase()
  const roleFilter = searchParams.get('role') || 'all'
  const statusFilter = searchParams.get('status') || 'all'

  if (targetUid) {
    const user = getUserByUid(targetUid)
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Không tìm thấy tài khoản người dùng.' },
        { status: 404 },
      )
    }
    const progress = getUserProgress(targetUid)
    return NextResponse.json({
      success: true,
      user: toPublicUserProfile(user),
      progress,
    })
  }

  const dashboard = getAdminDashboardData()
  let filteredUsers = dashboard.users

  if (search) {
    filteredUsers = filteredUsers.filter(
      (u) =>
        u.displayName.toLowerCase().includes(search) ||
        u.email.toLowerCase().includes(search) ||
        u.uid.toLowerCase().includes(search),
    )
  }

  if (roleFilter === 'admin') {
    filteredUsers = filteredUsers.filter((u) => u.role === 'admin' || u.isRootAdmin)
  } else if (roleFilter === 'student') {
    filteredUsers = filteredUsers.filter((u) => u.role === 'student' && !u.isRootAdmin)
  }

  if (statusFilter === 'active') {
    filteredUsers = filteredUsers.filter((u) => !u.locked)
  } else if (statusFilter === 'locked') {
    filteredUsers = filteredUsers.filter((u) => u.locked)
  }

  return NextResponse.json({
    success: true,
    actor: toPublicUserProfile(authResult.user),
    stats: dashboard.stats,
    users: filteredUsers,
    topLearners: dashboard.topLearners,
    recentRegisteredUsers: dashboard.recentRegisteredUsers,
    recentActivities: dashboard.recentActivities,
  })
}

/**
 * PATCH /api/admin/users
 * - action = 'set_role': Cấp quyền 'admin' hoặc thu hồi về 'student' (CHỈ Admin gốc duy nhất được phép)
 * - action = 'set_lock': Khóa hoặc mở khóa tài khoản (Admin được phép, KHÔNG thể khóa Admin gốc)
 */
export async function PATCH(request: Request) {
  const authResult = await authenticateRequest(request, { requireAdmin: true })
  if (!authResult.ok) {
    return NextResponse.json(
      { success: false, code: authResult.code, error: authResult.error },
      { status: authResult.status },
    )
  }

  try {
    const body = await request.json()
    const action = String(body.action || '')
    const targetUid = String(body.targetUid || '').trim()

    if (!targetUid) {
      return NextResponse.json(
        { success: false, error: 'Thiếu mã định danh tài khoản (targetUid).' },
        { status: 400 },
      )
    }

    if (action === 'set_role') {
      const nextRole: UserRole = body.role === 'admin' ? 'admin' : 'student'
      const updated = await updateAccountRoleByRootAdmin(authResult.user, targetUid, nextRole)
      return NextResponse.json({
        success: true,
        message:
          updated.role === 'admin'
            ? `Đã cấp quyền Quản trị viên (Admin) cho ${updated.displayName} (${updated.email}).`
            : `Đã thu hồi quyền Admin, chuyển ${updated.displayName} (${updated.email}) về vai trò Học viên (Student).`,
        user: toPublicUserProfile(updated),
      })
    }

    if (action === 'set_lock') {
      const locked = Boolean(body.locked)
      const reason = body.reason ? String(body.reason) : undefined
      const updated = await updateAccountLockByAdmin(authResult.user, targetUid, locked, reason)
      return NextResponse.json({
        success: true,
        message: updated.locked
          ? `Đã khóa tài khoản ${updated.displayName} (${updated.email}). Tài khoản này không thể tiếp tục truy cập hệ thống.`
          : `Đã mở khóa tài khoản ${updated.displayName} (${updated.email}).`,
        user: toPublicUserProfile(updated),
      })
    }

    return NextResponse.json(
      { success: false, error: 'Hành động (action) không hợp lệ.' },
      { status: 400 },
    )
  } catch (err) {
    const code = (err as Error).message || ''
    switch (code) {
      case 'ONLY_ROOT_ADMIN_CAN_CHANGE_ROLE':
        return NextResponse.json(
          {
            success: false,
            code,
            error: 'Chỉ Tài khoản Admin gốc (Root Admin) mới được phép cấp hoặc thu hồi quyền Admin.',
          },
          { status: 403 },
        )
      case 'CANNOT_MODIFY_ROOT_ADMIN':
      case 'CANNOT_LOCK_ROOT_ADMIN':
        return NextResponse.json(
          {
            success: false,
            code,
            error: 'Vi phạm quy tắc bảo vệ: Không thể khóa hoặc thay đổi quyền của Tài khoản Admin gốc (Root Admin).',
          },
          { status: 403 },
        )
      case 'REGULAR_ADMIN_CANNOT_LOCK_ADMIN':
        return NextResponse.json(
          {
            success: false,
            code,
            error: 'Admin thông thường không được phép khóa tài khoản của một Admin khác.',
          },
          { status: 403 },
        )
      case 'TARGET_USER_NOT_FOUND':
        return NextResponse.json(
          { success: false, code, error: 'Không tìm thấy tài khoản mục tiêu.' },
          { status: 404 },
        )
      default:
        return NextResponse.json(
          { success: false, error: code || 'Lỗi khi cập nhật tài khoản.' },
          { status: 500 },
        )
    }
  }
}

/**
 * DELETE /api/admin/users?uid=<targetUid>
 * Xóa tài khoản đồng bộ khỏi Firebase Authentication, Cloud Firestore và toàn bộ tiến độ học tập
 * - Không thể xóa Admin gốc
 * - Admin thông thường không thể xóa Admin khác
 */
export async function DELETE(request: Request) {
  const authResult = await authenticateRequest(request, { requireAdmin: true })
  if (!authResult.ok) {
    return NextResponse.json(
      { success: false, code: authResult.code, error: authResult.error },
      { status: authResult.status },
    )
  }

  try {
    const { searchParams } = new URL(request.url)
    let targetUid = searchParams.get('uid') || ''
    if (!targetUid) {
      try {
        const body = await request.json()
        targetUid = String(body.targetUid || '')
      } catch {
        // ignore
      }
    }

    if (!targetUid) {
      return NextResponse.json(
        { success: false, error: 'Thiếu mã định danh tài khoản cần xóa (uid).' },
        { status: 400 },
      )
    }

    const deleted = await deleteAccountByAdmin(authResult.user, targetUid)
    return NextResponse.json({
      success: true,
      message: `Đã xóa đồng bộ tài khoản ${deleted.deletedEmail} và toàn bộ dữ liệu liên quan khỏi hệ thống.`,
      deleted,
    })
  } catch (err) {
    const code = (err as Error).message || ''
    switch (code) {
      case 'CANNOT_DELETE_ROOT_ADMIN':
        return NextResponse.json(
          {
            success: false,
            code,
            error: 'Vi phạm quy tắc bảo vệ: Tuyệt đối không thể xóa Tài khoản Admin gốc (Root Admin).',
          },
          { status: 403 },
        )
      case 'REGULAR_ADMIN_CANNOT_DELETE_ADMIN':
        return NextResponse.json(
          {
            success: false,
            code,
            error: 'Admin thông thường không được phép xóa tài khoản của Admin khác. Chỉ Admin gốc mới có quyền này.',
          },
          { status: 403 },
        )
      case 'CANNOT_DELETE_SELF':
        return NextResponse.json(
          { success: false, code, error: 'Bạn không thể tự xóa tài khoản đang đăng nhập của chính mình.' },
          { status: 400 },
        )
      case 'TARGET_USER_NOT_FOUND':
        return NextResponse.json(
          { success: false, code, error: 'Tài khoản cần xóa không tồn tại.' },
          { status: 404 },
        )
      default:
        return NextResponse.json(
          { success: false, error: code || 'Lỗi khi xóa tài khoản.' },
          { status: 500 },
        )
    }
  }
}
