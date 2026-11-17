import { NextResponse } from 'next/server'
import { signToken } from '@/lib/backend/security'
import { verifyIncomingAuthToken } from '@/lib/backend/firebase-admin'
import {
  authenticateRequest,
  authenticateUserCredentials,
  getUserProgress,
  recoverRootAdminAccess,
  toPublicUserProfile,
} from '@/lib/backend/user-store'

/**
 * GET /api/auth/login
 * Xác minh phiên đăng nhập hiện tại từ Token (Firebase ID Token hoặc Backend Token),
 * kiểm tra trạng thái khóa tài khoản (locked) và trả về hồ sơ + tiến độ thực tế của tài khoản.
 */
export async function GET(request: Request) {
  const authResult = await authenticateRequest(request)
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

  const progress = getUserProgress(authResult.user.uid)
  return NextResponse.json({
    success: true,
    user: toPublicUserProfile(authResult.user),
    progress,
  })
}

/**
 * POST /api/auth/login
 * - Đăng nhập bằng Email/Mật khẩu hoặc xác minh Firebase ID Token
 * - Chặn đăng nhập nếu tài khoản đang bị khóa (locked === true)
 * - Hỗ trợ phương án khôi phục an toàn cho Admin gốc khi truyền action = 'recover_root_admin' kèm recoveryKey
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Phương án khôi phục an toàn cho Admin gốc từ phía quản trị hệ thống
    if (body.action === 'recover_root_admin') {
      try {
        const recovered = recoverRootAdminAccess(
          String(body.recoveryKey || ''),
          body.newPassword ? String(body.newPassword) : undefined,
        )
        const token = signToken({
          uid: recovered.uid,
          email: recovered.email,
          role: 'admin',
          isRootAdmin: true,
        })
        return NextResponse.json({
          success: true,
          message: 'Đã khôi phục quyền truy cập an toàn cho Tài khoản Admin gốc (Root Admin).',
          token,
          user: toPublicUserProfile(recovered),
        })
      } catch (e) {
        const code = (e as Error).message
        return NextResponse.json(
          {
            success: false,
            error:
              code === 'INVALID_RECOVERY_KEY'
                ? 'Mã khóa khôi phục hệ thống (ROOT_ADMIN_RECOVERY_KEY) không chính xác.'
                : 'Không thể khôi phục tài khoản Admin gốc.',
          },
          { status: 403 },
        )
      }
    }

    // Nếu client gửi kèm Firebase ID Token từ Firebase Authentication
    if (body.firebaseIdToken) {
      const verified = await verifyIncomingAuthToken(String(body.firebaseIdToken))
      if (!verified) {
        return NextResponse.json(
          { success: false, error: 'Firebase ID Token không hợp lệ.' },
          { status: 401 },
        )
      }
      const user = await authenticateUserCredentials({
        email: verified.email || String(body.email || ''),
        firebaseUid: verified.uid,
        displayName: verified.displayName || body.displayName,
        photoURL: verified.photoURL,
        provider: body.provider || 'firebase',
        verifiedByFirebase: true,
      })
      const token = signToken({
        uid: user.uid,
        email: user.email,
        role: user.role,
        isRootAdmin: user.isRootAdmin,
      })
      return NextResponse.json({
        success: true,
        message: 'Đăng nhập thành công.',
        token,
        user: toPublicUserProfile(user),
      })
    }

    const email = String(body.email || '').trim().toLowerCase()
    const password = String(body.password || '')

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Vui lòng nhập đầy đủ Email và Mật khẩu.' },
        { status: 400 },
      )
    }

    const user = await authenticateUserCredentials({
      email,
      password,
      firebaseUid: body.uid ? String(body.uid) : undefined,
      verifiedByFirebase: false,
    })

    const token = signToken({
      uid: user.uid,
      email: user.email,
      role: user.role,
      isRootAdmin: user.isRootAdmin,
    })

    return NextResponse.json({
      success: true,
      message: 'Đăng nhập thành công.',
      token,
      user: toPublicUserProfile(user),
    })
  } catch (err) {
    const code = (err as Error).message || ''
    if (code === 'ACCOUNT_LOCKED') {
      return NextResponse.json(
        {
          success: false,
          code: 'ACCOUNT_LOCKED',
          error: 'Tài khoản của bạn đã bị khóa bởi Quản trị viên. Bạn không thể tiếp tục sử dụng hệ thống.',
        },
        { status: 403 },
      )
    }
    if (code === 'INVALID_CREDENTIALS') {
      return NextResponse.json(
        { success: false, error: 'Email hoặc mật khẩu không chính xác.' },
        { status: 401 },
      )
    }
    return NextResponse.json(
      { success: false, error: code || 'Lỗi máy chủ khi đăng nhập.' },
      { status: 500 },
    )
  }
}
