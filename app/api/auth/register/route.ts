import { NextResponse } from 'next/server'
import { signToken } from '@/lib/backend/security'
import { registerNewStudentAccount, toPublicUserProfile } from '@/lib/backend/user-store'

/**
 * POST /api/auth/register
 * Đăng ký tài khoản mới:
 * - Băm mật khẩu bằng PBKDF2-HMAC-SHA256
 * - Bắt buộc 100% tài khoản đăng ký mới có Role = 'student' (Không cấp quyền Admin qua email hoặc tham số client)
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const name = String(body.name || '').trim()
    const email = String(body.email || '').trim().toLowerCase()
    const password = String(body.password || '')

    if (!name || name.length < 2) {
      return NextResponse.json(
        { success: false, error: 'Họ và tên phải có ít nhất 2 ký tự.' },
        { status: 400 },
      )
    }
    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { success: false, error: 'Địa chỉ email không hợp lệ.' },
        { status: 400 },
      )
    }
    if (!password || password.length < 6) {
      return NextResponse.json(
        { success: false, error: 'Mật khẩu phải có ít nhất 6 ký tự.' },
        { status: 400 },
      )
    }

    const newUser = await registerNewStudentAccount({
      uid: body.uid ? String(body.uid) : undefined,
      name,
      email,
      password,
      provider: 'password',
    })

    const token = signToken({
      uid: newUser.uid,
      email: newUser.email,
      role: 'student',
      isRootAdmin: false,
    })

    return NextResponse.json(
      {
        success: true,
        message: 'Đăng ký tài khoản học viên thành công.',
        token,
        user: toPublicUserProfile(newUser),
        security: {
          algorithm: 'PBKDF2-HMAC-SHA256',
          iterations: 100000,
          passwordHashed: true,
          defaultRole: 'student',
        },
      },
      { status: 201 },
    )
  } catch (err) {
    const msg = (err as Error).message || ''
    if (msg === 'EMAIL_ALREADY_EXISTS') {
      return NextResponse.json(
        { success: false, error: 'Email này đã được đăng ký trong hệ thống.' },
        { status: 409 },
      )
    }
    return NextResponse.json(
      { success: false, error: msg || 'Lỗi máy chủ khi đăng ký tài khoản.' },
      { status: 500 },
    )
  }
}
