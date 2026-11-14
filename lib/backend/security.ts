import crypto from 'crypto'

const PBKDF2_ITERATIONS = 100_000
const KEY_LENGTH = 64
const DIGEST = 'sha256'
const TOKEN_SECRET = process.env.JWT_SECRET || process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'hango-secret-key-2026'

export const ROOT_ADMIN_UID = process.env.ROOT_ADMIN_UID || 'hango_root_admin_001'
export const ROOT_ADMIN_EMAIL = (process.env.ROOT_ADMIN_EMAIL || 'admin@gmail.com').toLowerCase()
export const ROOT_ADMIN_DEFAULT_PASSWORD = process.env.ROOT_ADMIN_DEFAULT_PASSWORD || '123456'
export const ROOT_ADMIN_RECOVERY_KEY = process.env.ROOT_ADMIN_RECOVERY_KEY || 'HANGO-ROOT-RECOVERY-2026-KEY'

export type UserRole = 'student' | 'admin'

export interface TokenPayload {
  uid: string
  email: string
  role: UserRole
  isRootAdmin?: boolean
  exp: number
}

export function isRootAdminUid(uid?: string | null): boolean {
  return Boolean(uid && uid === ROOT_ADMIN_UID)
}

/**
 * Mã hóa mật khẩu bằng thuật toán PBKDF2-HMAC-SHA256 kèm chuỗi Salt ngẫu nhiên 16 bytes
 */
export function hashPassword(password: string, customSalt?: string): string {
  const salt = customSalt || crypto.randomBytes(16).toString('hex')
  const hash = crypto
    .pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, KEY_LENGTH, DIGEST)
    .toString('hex')
  return `${salt}:${PBKDF2_ITERATIONS}:${hash}`
}

/**
 * Kiểm tra mật khẩu người dùng nhập vào so với chuỗi băm đã lưu
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  const parts = storedHash.split(':')
  if (parts.length !== 3) return false
  const [salt, iterationsStr, originalHash] = parts
  const iterations = Number(iterationsStr) || PBKDF2_ITERATIONS
  const hash = crypto
    .pbkdf2Sync(password, salt, iterations, KEY_LENGTH, DIGEST)
    .toString('hex')
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(originalHash, 'hex'))
}

/**
 * Ký Token xác thực và phân quyền (HMAC-SHA256)
 */
export function signToken(payload: Omit<TokenPayload, 'exp'>, expiresInSeconds = 7 * 24 * 3600): string {
  const isRoot = isRootAdminUid(payload.uid)
  const fullPayload: TokenPayload = {
    ...payload,
    role: isRoot ? 'admin' : payload.role,
    isRootAdmin: isRoot,
    exp: Math.floor(Date.now() / 1000) + expiresInSeconds,
  }
  const encoded = Buffer.from(JSON.stringify(fullPayload)).toString('base64url')
  const signature = crypto
    .createHmac('sha256', TOKEN_SECRET)
    .update(encoded)
    .digest('base64url')
  return `${encoded}.${signature}`
}

/**
 * Giải mã và kiểm tra tính hợp lệ của Token
 */
export function verifyToken(token: string): TokenPayload | null {
  try {
    const [encoded, signature] = token.split('.')
    if (!encoded || !signature) return null
    const expectedSig = crypto
      .createHmac('sha256', TOKEN_SECRET)
      .update(encoded)
      .digest('base64url')
    if (signature !== expectedSig) return null

    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as TokenPayload
    if (payload.exp < Math.floor(Date.now() / 1000)) return null
    if (isRootAdminUid(payload.uid)) {
      payload.role = 'admin'
      payload.isRootAdmin = true
    }
    return payload
  } catch {
    return null
  }
}

/**
 * Kiểm tra phân quyền từ Request Header (Chỉ chấp nhận Bearer Token đã ký, KHÔNG tin tưởng header x-user-role tự sửa từ client)
 */
export function checkRoleAuthorization(request: Request, allowedRoles: UserRole[]): {
  authorized: boolean
  role: UserRole
  uid?: string
  isRootAdmin?: boolean
  reason?: string
} {
  const authHeader = request.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7)
    const payload = verifyToken(token)
    if (payload) {
      if (allowedRoles.includes(payload.role)) {
        return {
          authorized: true,
          role: payload.role,
          uid: payload.uid,
          isRootAdmin: Boolean(payload.isRootAdmin),
        }
      }
      return {
        authorized: false,
        role: payload.role,
        uid: payload.uid,
        isRootAdmin: Boolean(payload.isRootAdmin),
        reason: `Yêu cầu quyền [${allowedRoles.join(', ')}], nhưng tài khoản hiện tại có quyền [${payload.role}].`,
      }
    }
  }

  return {
    authorized: false,
    role: 'student',
    reason: 'Không tìm thấy Token xác thực hợp lệ hoặc phiên đăng nhập đã hết hạn.',
  }
}
