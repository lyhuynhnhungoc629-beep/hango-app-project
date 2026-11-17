import { getApps, initializeApp, cert, type App } from 'firebase-admin/app'
import { getAuth, type Auth } from 'firebase-admin/auth'
import { getFirestore, type Firestore } from 'firebase-admin/firestore'
import {
  ROOT_ADMIN_UID,
  isRootAdminUid,
  verifyToken,
  type TokenPayload,
} from '@/lib/backend/security'

const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'hangoapp-9d328'
const FIREBASE_API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || ''

function initFirebaseAdmin(): App | null {
  try {
    const existing = getApps()
    if (existing.length > 0 && existing[0]) {
      return existing[0]
    }
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
    if (serviceAccountJson) {
      const credentials = JSON.parse(serviceAccountJson)
      return initializeApp({
        credential: cert(credentials),
        projectId: PROJECT_ID,
      })
    }
    return initializeApp({
      projectId: PROJECT_ID,
    })
  } catch {
    return null
  }
}

export const adminApp = initFirebaseAdmin()

export function getAdminAuth(): Auth | null {
  try {
    return adminApp ? getAuth(adminApp) : null
  } catch {
    return null
  }
}

export function getAdminFirestore(): Firestore | null {
  try {
    return adminApp ? getFirestore(adminApp) : null
  } catch {
    return null
  }
}

export interface VerifiedIdentity {
  uid: string
  email: string
  displayName?: string
  photoURL?: string | null
  isRootAdmin: boolean
  source: 'firebase-id-token' | 'backend-token'
}

/**
 * Xác minh Firebase ID Token (qua Firebase Admin SDK / Identity Toolkit) hoặc Backend Token
 */
export async function verifyIncomingAuthToken(token: string): Promise<VerifiedIdentity | null> {
  if (!token) return null

  // 1. Kiểm tra nếu là Backend Token đã ký HMAC-SHA256 (2 phần encoded.signature)
  const parts = token.split('.')
  if (parts.length === 2) {
    const payload: TokenPayload | null = verifyToken(token)
    if (!payload) return null
    return {
      uid: payload.uid,
      email: payload.email,
      isRootAdmin: isRootAdminUid(payload.uid),
      source: 'backend-token',
    }
  }

  // 2. Nếu là Firebase ID Token chuẩn JWT (3 phần header.payload.signature)
  if (parts.length === 3) {
    // 2a. Thử xác minh qua Firebase Admin SDK
    const auth = getAdminAuth()
    if (auth) {
      try {
        const decoded = await auth.verifyIdToken(token, true)
        return {
          uid: decoded.uid,
          email: (decoded.email || '').toLowerCase(),
          displayName: decoded.name,
          photoURL: decoded.picture || null,
          isRootAdmin: isRootAdminUid(decoded.uid),
          source: 'firebase-id-token',
        }
      } catch {
        // Fallback sang Google Identity Toolkit nếu chưa gắn Service Account Private Key
      }
    }

    // 2b. Xác minh trực tiếp với máy chủ Firebase Authentication (Identity Toolkit accounts:lookup)
    if (FIREBASE_API_KEY) {
      try {
        const res = await fetch(
          `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(FIREBASE_API_KEY)}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idToken: token }),
          },
        )
        if (res.ok) {
          const data = await res.json()
          const user = data?.users?.[0]
          if (user && user.localId && !user.disabled) {
            return {
              uid: String(user.localId),
              email: String(user.email || '').toLowerCase(),
              displayName: user.displayName || undefined,
              photoURL: user.photoUrl || null,
              isRootAdmin: isRootAdminUid(String(user.localId)),
              source: 'firebase-id-token',
            }
          }
        }
      } catch {
        // ignore network error
      }
    }
  }

  return null
}

/**
 * Khóa / Mở khóa tài khoản trên Firebase Authentication qua Firebase Admin SDK
 */
export async function syncFirebaseUserLockState(uid: string, locked: boolean): Promise<void> {
  if (uid === ROOT_ADMIN_UID) return
  const auth = getAdminAuth()
  if (!auth) return
  try {
    await auth.updateUser(uid, { disabled: locked })
    if (locked) {
      await auth.revokeRefreshTokens(uid)
    }
  } catch {
    // Bỏ qua nếu tài khoản chỉ tồn tại trên Firestore/Backend hoặc chưa cấu hình Service Account
  }
}

/**
 * Xóa đồng bộ tài khoản khỏi Firebase Authentication qua Firebase Admin SDK
 */
export async function deleteFirebaseAuthAccount(uid: string, idTokenIfAvailable?: string): Promise<void> {
  if (uid === ROOT_ADMIN_UID) return
  const auth = getAdminAuth()
  if (auth) {
    try {
      await auth.deleteUser(uid)
      return
    } catch {
      // Fallback nếu chưa cấu hình Service Account
    }
  }

  if (idTokenIfAvailable && FIREBASE_API_KEY) {
    try {
      await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:delete?key=${encodeURIComponent(FIREBASE_API_KEY)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken: idTokenIfAvailable }),
        },
      )
    } catch {
      // ignore
    }
  }
}
