'use client'

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  type User,
} from 'firebase/auth'
import {
  auth,
  googleProvider,
  facebookProvider,
  appleProvider,
  isFirebaseConfigured,
} from '@/lib/firebase'

export interface UserProfile {
  uid: string
  displayName: string
  email: string
  photoURL: string | null
  provider: string
  level: number
  xp: number
  streak: number
  totalStudyMinutes?: number
  learnedVocabCount?: number
  role: 'student' | 'admin'
  isRootAdmin?: boolean
  locked?: boolean
  lockedReason?: string | null
  createdAt?: string
  lastLoginAt?: string
}

interface AuthContextValue {
  user: User | null
  profile: UserProfile | null
  token: string | null
  loading: boolean
  lockedMessage: string | null
  isConfigured: boolean
  loginWithEmail: (email: string, password: string) => Promise<UserProfile>
  registerWithEmail: (name: string, email: string, password: string) => Promise<UserProfile>
  loginWithGoogle: () => Promise<void>
  loginWithFacebook: () => Promise<void>
  loginWithApple: () => Promise<void>
  sendResetPassword: (email: string) => Promise<void>
  refreshProfile: () => Promise<void>
  updateGamification: (stats: { xp: number; level: number; streak: number }) => void
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

function ensureConfigured() {
  if (!isFirebaseConfigured || !auth) {
    throw new Error('FIREBASE_NOT_CONFIGURED')
  }
  return auth
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [lockedMessage, setLockedMessage] = useState<string | null>(null)

  const persistTokenClientSide = useCallback((nextToken: string) => {
    try {
      localStorage.setItem('hango_auth_token', nextToken)
      document.cookie = `hango_auth_token=${encodeURIComponent(nextToken)}; path=/; max-age=604800; SameSite=Lax`
    } catch {
      // ignore
    }
  }, [])

  const clearAuthSession = useCallback(async (lockNotice?: string) => {
    if (auth) {
      try {
        await signOut(auth)
      } catch {
        // ignore
      }
    }
    setUser(null)
    setProfile(null)
    setToken(null)
    if (lockNotice) {
      setLockedMessage(lockNotice)
    }
    try {
      localStorage.removeItem('hango_auth_token')
      document.cookie = 'hango_auth_token=; path=/; max-age=0; SameSite=Lax'
    } catch {
      // ignore
    }
  }, [])

  const verifyBackendSession = useCallback(
    async (activeToken: string): Promise<UserProfile | null> => {
      try {
        const res = await fetch('/api/auth/login', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${activeToken}`,
          },
        })
        const data = await res.json()
        if (res.status === 403 && data.code === 'ACCOUNT_LOCKED') {
          await clearAuthSession(data.error || 'Tài khoản của bạn đã bị khóa bởi Quản trị viên.')
          return null
        }
        if (!res.ok || !data.success || !data.user) {
          await clearAuthSession()
          return null
        }
        setProfile(data.user)
        setLockedMessage(null)
        return data.user as UserProfile
      } catch {
        return null
      }
    },
    [clearAuthSession],
  )

  const refreshProfile = useCallback(async () => {
    const savedToken = token || (typeof window !== 'undefined' ? localStorage.getItem('hango_auth_token') : null)
    if (savedToken) {
      await verifyBackendSession(savedToken)
    }
  }, [token, verifyBackendSession])

  useEffect(() => {
    let mounted = true
    const init = async () => {
      let savedToken: string | null = null
      try {
        savedToken = localStorage.getItem('hango_auth_token')
      } catch {
        // ignore
      }

      if (savedToken) {
        setToken(savedToken)
        persistTokenClientSide(savedToken)
        await verifyBackendSession(savedToken)
      }

      if (mounted) {
        setLoading(false)
      }
    }

    void init()

    if (!isFirebaseConfigured || !auth) {
      return
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!mounted) return
      setUser(firebaseUser)
      if (firebaseUser) {
        try {
          const idToken = await firebaseUser.getIdToken()
          const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              firebaseIdToken: idToken,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName,
              provider: firebaseUser.providerData[0]?.providerId || 'firebase',
            }),
          })
          const data = await res.json()
          if (res.status === 403 && data.code === 'ACCOUNT_LOCKED') {
            await clearAuthSession(data.error)
            return
          }
          if (data.success && data.token && data.user) {
            setToken(data.token)
            setProfile(data.user)
            persistTokenClientSide(data.token)
          }
        } catch {
          // ignore
        }
      }
    })

    return () => {
      mounted = false
      unsubscribe()
    }
  }, [clearAuthSession, verifyBackendSession])

  const loginWithEmail = async (email: string, password: string): Promise<UserProfile> => {
    setLockedMessage(null)
    let firebaseUid: string | undefined

    if (isFirebaseConfigured && auth) {
      try {
        const cred = await signInWithEmailAndPassword(auth, email, password)
        firebaseUid = cred.user.uid
      } catch {
        // Tiếp tục xác thực qua Backend API nếu Firebase Console chưa bật Email/Password provider
      }
    }

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid: firebaseUid, email, password }),
    })
    const data = await res.json()

    if (!res.ok || !data.success) {
      if (data.code === 'ACCOUNT_LOCKED') {
        await clearAuthSession(data.error)
        throw new Error(data.error || 'Tài khoản của bạn đã bị khóa bởi Quản trị viên.')
      }
      throw new Error(data.error || 'Email hoặc mật khẩu không chính xác.')
    }

    setToken(data.token)
    setProfile(data.user)
    persistTokenClientSide(data.token)
    return data.user as UserProfile
  }

  const registerWithEmail = async (
    name: string,
    email: string,
    password: string,
  ): Promise<UserProfile> => {
    setLockedMessage(null)
    let firebaseUid: string | undefined

    if (isFirebaseConfigured && auth) {
      try {
        const cred = await createUserWithEmailAndPassword(auth, email, password)
        if (name.trim()) {
          await updateProfile(cred.user, { displayName: name.trim() })
        }
        firebaseUid = cred.user.uid
      } catch {
        // Tiếp tục đăng ký qua Backend API nếu Firebase Console chưa bật Email/Password provider
      }
    }

    // Mọi tài khoản đăng ký mới đều bắt buộc có Role = 'student' tại Backend
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        uid: firebaseUid,
        name: name.trim(),
        email,
        password,
      }),
    })
    const data = await res.json()

    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Không thể đăng ký tài khoản.')
    }

    setToken(data.token)
    setProfile(data.user)
    persistTokenClientSide(data.token)
    return data.user as UserProfile
  }

  const syncPopupUserWithBackend = async (firebaseUser: User) => {
    const idToken = await firebaseUser.getIdToken()
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firebaseIdToken: idToken,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        provider: firebaseUser.providerData[0]?.providerId || 'google.com',
      }),
    })
    const data = await res.json()
    if (!res.ok || !data.success) {
      if (data.code === 'ACCOUNT_LOCKED') {
        await clearAuthSession(data.error)
      }
      throw new Error(data.error || 'Không thể đăng nhập.')
    }
    setToken(data.token)
    setProfile(data.user)
    persistTokenClientSide(data.token)
    localStorage.setItem('hango_auth_token', data.token)
  }

  const loginWithGoogle = async () => {
    const firebaseAuth = ensureConfigured()
    const cred = await signInWithPopup(firebaseAuth, googleProvider)
    await syncPopupUserWithBackend(cred.user)
  }

  const loginWithFacebook = async () => {
    const firebaseAuth = ensureConfigured()
    const cred = await signInWithPopup(firebaseAuth, facebookProvider)
    await syncPopupUserWithBackend(cred.user)
  }

  const loginWithApple = async () => {
    const firebaseAuth = ensureConfigured()
    const cred = await signInWithPopup(firebaseAuth, appleProvider)
    await syncPopupUserWithBackend(cred.user)
  }

  const sendResetPassword = async (email: string) => {
    const firebaseAuth = ensureConfigured()
    await sendPasswordResetEmail(firebaseAuth, email)
  }

  const updateGamification = (stats: { xp: number; level: number; streak: number }) => {
    setProfile((prev) =>
      prev
        ? {
            ...prev,
            xp: stats.xp,
            level: stats.level,
            streak: stats.streak,
          }
        : null,
    )
  }

  const logout = async () => {
    await clearAuthSession()
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        token,
        loading,
        lockedMessage,
        isConfigured: isFirebaseConfigured,
        loginWithEmail,
        registerWithEmail,
        loginWithGoogle,
        loginWithFacebook,
        loginWithApple,
        sendResetPassword,
        refreshProfile,
        updateGamification,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth phải được dùng bên trong <AuthProvider>')
  }
  return ctx
}
