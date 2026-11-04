'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
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
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import {
  auth,
  db,
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
  role: 'student' | 'admin'
}

interface AuthContextValue {
  user: User | null
  profile: UserProfile | null
  loading: boolean
  isConfigured: boolean
  loginWithEmail: (email: string, password: string) => Promise<void>
  registerWithEmail: (name: string, email: string, password: string) => Promise<void>
  loginWithGoogle: () => Promise<void>
  loginWithFacebook: () => Promise<void>
  loginWithApple: () => Promise<void>
  sendResetPassword: (email: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

async function syncUserToFirestore(firebaseUser: User, fallbackName?: string): Promise<UserProfile> {
  const defaultProfile: UserProfile = {
    uid: firebaseUser.uid,
    displayName: firebaseUser.displayName || fallbackName || firebaseUser.email?.split('@')[0] || 'Học viên HANGO',
    email: firebaseUser.email || '',
    photoURL: firebaseUser.photoURL || null,
    provider: firebaseUser.providerData[0]?.providerId || 'password',
    level: 1,
    xp: 0,
    streak: 1,
    role: 'student',
  }

  if (!db) return defaultProfile

  try {
    const userRef = doc(db, 'users', firebaseUser.uid)
    const snap = await getDoc(userRef)

    if (!snap.exists()) {
      await setDoc(userRef, {
        ...defaultProfile,
        createdAt: serverTimestamp(),
        lastLoginAt: serverTimestamp(),
      })
      return defaultProfile
    } else {
      const data = snap.data() as Partial<UserProfile>
      await setDoc(
        userRef,
        {
          displayName: firebaseUser.displayName || data.displayName || defaultProfile.displayName,
          email: firebaseUser.email || data.email || '',
          photoURL: firebaseUser.photoURL || data.photoURL || null,
          lastLoginAt: serverTimestamp(),
        },
        { merge: true },
      )
      return {
        ...defaultProfile,
        ...data,
        displayName: firebaseUser.displayName || data.displayName || defaultProfile.displayName,
      }
    }
  } catch {
    return defaultProfile
  }
}

function ensureConfigured() {
  if (!isFirebaseConfigured || !auth) {
    throw new Error('FIREBASE_NOT_CONFIGURED')
  }
  return auth
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState<boolean>(isFirebaseConfigured)

  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      setLoading(false)
      return
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser)
      if (firebaseUser) {
        const userProfile = await syncUserToFirestore(firebaseUser)
        setProfile(userProfile)
      } else {
        setProfile(null)
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const loginWithEmail = async (email: string, password: string) => {
    const firebaseAuth = ensureConfigured()
    const cred = await signInWithEmailAndPassword(firebaseAuth, email, password)
    const userProfile = await syncUserToFirestore(cred.user)
    setProfile(userProfile)
  }

  const registerWithEmail = async (name: string, email: string, password: string) => {
    const firebaseAuth = ensureConfigured()
    const cred = await createUserWithEmailAndPassword(firebaseAuth, email, password)
    if (name.trim()) {
      await updateProfile(cred.user, { displayName: name.trim() })
    }
    const userProfile = await syncUserToFirestore(cred.user, name.trim())
    setProfile(userProfile)
  }

  const loginWithGoogle = async () => {
    const firebaseAuth = ensureConfigured()
    const cred = await signInWithPopup(firebaseAuth, googleProvider)
    const userProfile = await syncUserToFirestore(cred.user)
    setProfile(userProfile)
  }

  const loginWithFacebook = async () => {
    const firebaseAuth = ensureConfigured()
    const cred = await signInWithPopup(firebaseAuth, facebookProvider)
    const userProfile = await syncUserToFirestore(cred.user)
    setProfile(userProfile)
  }

  const loginWithApple = async () => {
    const firebaseAuth = ensureConfigured()
    const cred = await signInWithPopup(firebaseAuth, appleProvider)
    const userProfile = await syncUserToFirestore(cred.user)
    setProfile(userProfile)
  }

  const sendResetPassword = async (email: string) => {
    const firebaseAuth = ensureConfigured()
    await sendPasswordResetEmail(firebaseAuth, email)
  }

  const logout = async () => {
    if (!auth) return
    await signOut(auth)
    setUser(null)
    setProfile(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        isConfigured: isFirebaseConfigured,
        loginWithEmail,
        registerWithEmail,
        loginWithGoogle,
        loginWithFacebook,
        loginWithApple,
        sendResetPassword,
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
