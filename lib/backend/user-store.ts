import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import { doc, setDoc, deleteDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import {
  ROOT_ADMIN_UID,
  ROOT_ADMIN_EMAIL,
  ROOT_ADMIN_DEFAULT_PASSWORD,
  ROOT_ADMIN_RECOVERY_KEY,
  hashPassword,
  verifyPassword,
  isRootAdminUid,
  type UserRole,
} from '@/lib/backend/security'
import {
  verifyIncomingAuthToken,
  syncFirebaseUserLockState,
  deleteFirebaseAuthAccount,
  getAdminFirestore,
} from '@/lib/backend/firebase-admin'
import type { SrsState } from '@/lib/backend/srs'
import { calculateLevelFromXp, calculateStreak, type PomodoroGamificationResult } from '@/lib/backend/pomodoro-gamification'

export interface UserAccountRecord {
  uid: string
  displayName: string
  email: string
  passwordHash?: string
  photoURL: string | null
  provider: string
  role: UserRole
  isRootAdmin: boolean
  locked: boolean
  lockedReason?: string
  level: number
  xp: number
  streak: number
  lastStudyDate: string | null
  totalStudyMinutes: number
  learnedVocabCount: number
  createdAt: string
  lastLoginAt: string
  updatedAt: string
}

export interface StudyActivityItem {
  id: string
  type: 'srs' | 'pomodoro' | 'handwriting' | 'topik' | 'account'
  title: string
  detail: string
  xpEarned: number
  timestamp: string
}

export interface TopikExamResultItem {
  examId: string
  examTitle: string
  score: number
  maxScore: number
  correctCount: number
  totalQuestions: number
  levelAchieved: string
  durationSeconds: number
  submittedAt: string
}

export interface HandwritingProgressItem {
  char: string
  unicode: string
  datasetClassId: string
  lastScore: number
  bestScore: number
  attempts: number
  updatedAt: string
}

export interface UserLearningProgress {
  uid: string
  srsProgress: Record<
    string,
    SrsState & {
      wordKo?: string
      meaning?: string
      updatedAt: string
    }
  >
  pomodoroSessions: Array<
    PomodoroGamificationResult & {
      taskTitle: string
      createdAt: string
    }
  >
  handwritingRecords: Record<string, HandwritingProgressItem>
  topikResults: TopikExamResultItem[]
  studyHistory: StudyActivityItem[]
}

interface PersistentStoreData {
  users: Record<string, UserAccountRecord>
  progress: Record<string, UserLearningProgress>
}

const DATA_DIR = path.join(process.cwd(), 'data')
const STORE_PATH = path.join(DATA_DIR, 'hango-users-db.json')

/**
 * Đồng bộ không chặn (non-blocking) lên Cloud Firestore với timeout ngắn (1.5s)
 */
async function syncDocToFirestoreWithTimeout(
  collectionName: string,
  docId: string,
  data: Record<string, unknown>,
): Promise<void> {
  const timeoutPromise = new Promise<void>((resolve) => setTimeout(resolve, 1200))
  const workPromise = (async () => {
    try {
      const adminDb = getAdminFirestore()
      if (adminDb) {
        await adminDb.collection(collectionName).doc(docId).set(data, { merge: true })
        return
      }
      if (db) {
        await setDoc(doc(db, collectionName, docId), data, { merge: true })
      }
    } catch {
      // Bỏ qua nếu Firestore chưa bật trên Console hoặc offline
    }
  })()
  await Promise.race([workPromise, timeoutPromise])
}

async function deleteDocFromFirestoreWithTimeout(uid: string): Promise<void> {
  const timeoutPromise = new Promise<void>((resolve) => setTimeout(resolve, 1200))
  const workPromise = (async () => {
    try {
      const adminDb = getAdminFirestore()
      if (adminDb) {
        await adminDb.collection('users').doc(uid).delete()
        return
      }
      if (db) {
        await deleteDoc(doc(db, 'users', uid))
      }
    } catch {
      // Bỏ qua nếu offline
    }
  })()
  await Promise.race([workPromise, timeoutPromise])
}

function createEmptyProgress(uid: string): UserLearningProgress {
  return {
    uid,
    srsProgress: {},
    pomodoroSessions: [],
    handwritingRecords: {},
    topikResults: [],
    studyHistory: [],
  }
}

function loadStore(): PersistentStoreData {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true })
  }

  let data: PersistentStoreData = { users: {}, progress: {} }
  if (fs.existsSync(STORE_PATH)) {
    try {
      const raw = fs.readFileSync(STORE_PATH, 'utf8')
      const parsed = JSON.parse(raw) as PersistentStoreData
      if (parsed && typeof parsed === 'object') {
        data = {
          users: parsed.users || {},
          progress: parsed.progress || {},
        }
      }
    } catch {
      data = { users: {}, progress: {} }
    }
  }

  // Luôn đảm bảo duy nhất 1 tài khoản Admin gốc (Root Admin) tồn tại và bất biến về quyền/trạng thái khóa
  const now = new Date().toISOString()
  const existingRoot = data.users[ROOT_ADMIN_UID]
  if (!existingRoot) {
    data.users[ROOT_ADMIN_UID] = {
      uid: ROOT_ADMIN_UID,
      displayName: 'Quản trị viên',
      email: ROOT_ADMIN_EMAIL,
      passwordHash: hashPassword(ROOT_ADMIN_DEFAULT_PASSWORD),
      photoURL: null,
      provider: 'password',
      role: 'admin',
      isRootAdmin: true,
      locked: false,
      level: 1,
      xp: 0,
      streak: 0,
      lastStudyDate: null,
      totalStudyMinutes: 0,
      learnedVocabCount: 0,
      createdAt: now,
      lastLoginAt: now,
      updatedAt: now,
    }
    data.progress[ROOT_ADMIN_UID] = createEmptyProgress(ROOT_ADMIN_UID)
    saveStore(data)
  } else {
    let mutated = false
    if (existingRoot.displayName !== 'Quản trị viên') {
      existingRoot.displayName = 'Quản trị viên'
      mutated = true
    }
    if (existingRoot.email !== ROOT_ADMIN_EMAIL) {
      existingRoot.email = ROOT_ADMIN_EMAIL
      mutated = true
    }
    if (!verifyPassword(ROOT_ADMIN_DEFAULT_PASSWORD, existingRoot.passwordHash || '')) {
      existingRoot.passwordHash = hashPassword(ROOT_ADMIN_DEFAULT_PASSWORD)
      mutated = true
    }
    if (existingRoot.role !== 'admin' || !existingRoot.isRootAdmin || existingRoot.locked) {
      existingRoot.role = 'admin'
      existingRoot.isRootAdmin = true
      existingRoot.locked = false
      delete existingRoot.lockedReason
      mutated = true
    }
    if (!data.progress[ROOT_ADMIN_UID]) {
      data.progress[ROOT_ADMIN_UID] = createEmptyProgress(ROOT_ADMIN_UID)
      mutated = true
    }
    if (mutated) saveStore(data)
  }

  return data
}

function saveStore(data: PersistentStoreData): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true })
  }
  // Đảm bảo quy tắc bảo vệ Admin gốc trước mọi thao tác ghi
  if (data.users[ROOT_ADMIN_UID]) {
    data.users[ROOT_ADMIN_UID].role = 'admin'
    data.users[ROOT_ADMIN_UID].isRootAdmin = true
    data.users[ROOT_ADMIN_UID].locked = false
    delete data.users[ROOT_ADMIN_UID].lockedReason
  }
  fs.writeFileSync(STORE_PATH, JSON.stringify(data, null, 2), 'utf8')
}

export function toPublicUserProfile(u: UserAccountRecord) {
  return {
    uid: u.uid,
    displayName: u.displayName,
    email: u.email,
    photoURL: u.photoURL,
    provider: u.provider,
    role: u.isRootAdmin ? ('admin' as UserRole) : u.role,
    isRootAdmin: Boolean(u.isRootAdmin || isRootAdminUid(u.uid)),
    locked: u.isRootAdmin ? false : Boolean(u.locked),
    lockedReason: u.lockedReason || null,
    level: u.level,
    xp: u.xp,
    streak: u.streak,
    lastStudyDate: u.lastStudyDate,
    totalStudyMinutes: u.totalStudyMinutes,
    learnedVocabCount: u.learnedVocabCount,
    createdAt: u.createdAt,
    lastLoginAt: u.lastLoginAt,
    updatedAt: u.updatedAt,
  }
}

export function getUserByUid(uid: string): UserAccountRecord | null {
  const store = loadStore()
  return store.users[uid] || null
}

export function getUserByEmail(email: string): UserAccountRecord | null {
  const normalized = email.trim().toLowerCase()
  const store = loadStore()
  return Object.values(store.users).find((u) => u.email.toLowerCase() === normalized) || null
}

export function getUserProgress(uid: string): UserLearningProgress {
  const store = loadStore()
  if (!store.progress[uid]) {
    store.progress[uid] = createEmptyProgress(uid)
    saveStore(store)
  }
  return store.progress[uid]
}

/**
 * Đăng ký tài khoản mới:
 * - Bắt buộc mọi tài khoản đăng ký mới có Role = 'student' (KHÔNG cấp quyền Admin qua email bắt đầu bằng 'admin')
 * - Không cho phép đăng ký trùng email với Admin gốc hoặc tài khoản đã tồn tại
 */
export async function registerNewStudentAccount(params: {
  uid?: string
  name: string
  email: string
  password?: string
  provider?: string
  photoURL?: string | null
}): Promise<UserAccountRecord> {
  const store = loadStore()
  const email = params.email.trim().toLowerCase()
  const existingByEmail = Object.values(store.users).find((u) => u.email.toLowerCase() === email)
  if (existingByEmail) {
    throw new Error('EMAIL_ALREADY_EXISTS')
  }

  const uid =
    params.uid && params.uid !== ROOT_ADMIN_UID
      ? params.uid
      : `usr_${crypto.createHash('sha256').update(email).digest('hex').slice(0, 20)}`

  if (store.users[uid]) {
    throw new Error('EMAIL_ALREADY_EXISTS')
  }

  const now = new Date().toISOString()
  const newUser: UserAccountRecord = {
    uid,
    displayName: params.name.trim(),
    email,
    passwordHash: params.password ? hashPassword(params.password) : undefined,
    photoURL: params.photoURL || null,
    provider: params.provider || 'password',
    role: 'student', // Tất cả tài khoản đăng ký mới mặc định là student
    isRootAdmin: false,
    locked: false,
    level: 1,
    xp: 0,
    streak: 0,
    lastStudyDate: null,
    totalStudyMinutes: 0,
    learnedVocabCount: 0,
    createdAt: now,
    lastLoginAt: now,
    updatedAt: now,
  }

  store.users[uid] = newUser
  store.progress[uid] = {
    ...createEmptyProgress(uid),
    studyHistory: [
      {
        id: `act_${Date.now()}`,
        type: 'account',
        title: 'Đăng ký tài khoản HANGO',
        detail: `Tài khoản học viên (${email}) được khởi tạo.`,
        xpEarned: 0,
        timestamp: now,
      },
    ],
  }
  saveStore(store)

  const publicData = toPublicUserProfile(newUser)
  void syncDocToFirestoreWithTimeout('users', uid, publicData)

  return newUser
}

/**
 * Xác thực đăng nhập bằng Email & Password hoặc đồng bộ từ Firebase Auth
 */
export async function authenticateUserCredentials(params: {
  email: string
  password?: string
  firebaseUid?: string
  displayName?: string
  photoURL?: string | null
  provider?: string
  verifiedByFirebase?: boolean
}): Promise<UserAccountRecord> {
  const store = loadStore()
  const email = params.email.trim().toLowerCase()

  let user = Object.values(store.users).find((u) => u.email.toLowerCase() === email)
  if (!user && params.firebaseUid) {
    user = store.users[params.firebaseUid]
  }

  // Nếu người dùng đăng nhập qua Google / Firebase Auth lần đầu tiên mà chưa có bản ghi trong store
  if (!user && params.verifiedByFirebase) {
    user = await registerNewStudentAccount({
      uid: params.firebaseUid,
      name: params.displayName || email.split('@')[0] || 'Học viên HANGO',
      email,
      password: params.password,
      provider: params.provider || 'google.com',
      photoURL: params.photoURL || null,
    })
    return user
  }

  if (!user) {
    throw new Error('INVALID_CREDENTIALS')
  }

  // Kiểm tra trạng thái khóa tài khoản (Admin gốc không bao giờ bị khóa)
  if (user.locked && !user.isRootAdmin && !isRootAdminUid(user.uid)) {
    throw new Error('ACCOUNT_LOCKED')
  }

  // Nếu đăng nhập bằng mật khẩu trực tiếp, kiểm tra băm mật khẩu PBKDF2-HMAC-SHA256
  if (!params.verifiedByFirebase) {
    if (!params.password || !user.passwordHash || !verifyPassword(params.password, user.passwordHash)) {
      throw new Error('INVALID_CREDENTIALS')
    }
  }

  const now = new Date().toISOString()
  user.lastLoginAt = now
  user.updatedAt = now
  if (params.displayName && !user.displayName) {
    user.displayName = params.displayName
  }
  if (params.photoURL) {
    user.photoURL = params.photoURL
  }

  // Bảo vệ bất biến cho Admin gốc
  if (user.uid === ROOT_ADMIN_UID || user.isRootAdmin) {
    user.role = 'admin'
    user.isRootAdmin = true
    user.locked = false
  }

  store.users[user.uid] = user
  saveStore(store)
  void syncDocToFirestoreWithTimeout('users', user.uid, toPublicUserProfile(user))

  return user
}

/**
 * Xác minh Request từ Header Authorization: Bearer <token>
 * - Kiểm tra tính hợp lệ của Firebase ID Token hoặc Backend Token
 * - Đối chiếu trực tiếp với Database để kiểm tra tài khoản còn tồn tại không, có bị khóa (locked) không, và lấy Role thực tế
 */
export async function authenticateRequest(
  request: Request,
  options?: { requireAdmin?: boolean; requireRootAdmin?: boolean },
): Promise<
  | { ok: true; user: UserAccountRecord }
  | { ok: false; status: number; code: string; error: string }
> {
  const authHeader = request.headers.get('authorization')
  let rawToken = ''

  if (authHeader && authHeader.startsWith('Bearer ')) {
    rawToken = authHeader.slice(7).trim()
  }

  if (!rawToken) {
    const cookieHeader = request.headers.get('cookie') || ''
    const match = cookieHeader.match(/(?:^|;\s*)hango_auth_token=([^;]+)/)
    if (match && match[1]) {
      try {
        rawToken = decodeURIComponent(match[1].trim())
      } catch {
        rawToken = match[1].trim()
      }
    }
  }

  if (!rawToken) {
    try {
      const { searchParams } = new URL(request.url)
      const qToken = searchParams.get('token')?.trim()
      if (qToken) {
        rawToken = qToken
      }
    } catch {
      // ignore invalid URL
    }
  }

  if (!rawToken) {
    return {
      ok: false,
      status: 401,
      code: 'UNAUTHORIZED',
      error: 'Vui lòng đăng nhập hoặc đăng ký tài khoản học viên để sử dụng chức năng này',
    }
  }

  const verified = await verifyIncomingAuthToken(rawToken)
  if (!verified) {
    return {
      ok: false,
      status: 401,
      code: 'INVALID_TOKEN',
      error: 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.',
    }
  }

  const store = loadStore()
  let user: UserAccountRecord | undefined = store.users[verified.uid]
  if (!user && verified.email) {
    user = Object.values(store.users).find((u) => u.email.toLowerCase() === verified.email.toLowerCase())
  }

  // Nếu xác thực bằng Firebase ID Token hợp lệ nhưng chưa đồng bộ vào store, tự động tạo tài khoản student
  if (!user && verified.source === 'firebase-id-token' && verified.email) {
    try {
      user = await registerNewStudentAccount({
        uid: verified.uid,
        name: verified.displayName || verified.email.split('@')[0],
        email: verified.email,
        photoURL: verified.photoURL,
        provider: 'firebase',
      })
    } catch {
      user = getUserByEmail(verified.email) || undefined
    }
  }

  if (!user) {
    return {
      ok: false,
      status: 401,
      code: 'ACCOUNT_NOT_FOUND',
      error: 'Tài khoản không còn tồn tại trong hệ thống.',
    }
  }

  // Kiểm tra khóa tài khoản thực tế tại Backend
  if (user.locked && !user.isRootAdmin && !isRootAdminUid(user.uid)) {
    return {
      ok: false,
      status: 403,
      code: 'ACCOUNT_LOCKED',
      error: 'Tài khoản của bạn đã bị khóa bởi Quản trị viên và không thể tiếp tục sử dụng hệ thống.',
    }
  }

  const effectiveRole: UserRole = user.isRootAdmin || isRootAdminUid(user.uid) ? 'admin' : user.role
  const effectiveIsRoot = Boolean(user.isRootAdmin || isRootAdminUid(user.uid))

  if (options?.requireRootAdmin && !effectiveIsRoot) {
    return {
      ok: false,
      status: 403,
      code: 'FORBIDDEN_ROOT_ADMIN_ONLY',
      error: 'Chỉ Tài khoản Admin gốc (Root Admin) mới được phép thực hiện thao tác này.',
    }
  }

  if (options?.requireAdmin && effectiveRole !== 'admin') {
    return {
      ok: false,
      status: 403,
      code: 'FORBIDDEN_ADMIN_ONLY',
      error: 'Truy cập bị từ chối. Chức năng này chỉ dành cho Quản trị viên (Admin).',
    }
  }

  return { ok: true, user }
}

/**
 * Cấp quyền Admin hoặc thu hồi quyền về Student (Chỉ dành riêng cho Admin gốc duy nhất)
 */
export async function updateAccountRoleByRootAdmin(
  actor: UserAccountRecord,
  targetUid: string,
  nextRole: UserRole,
): Promise<UserAccountRecord> {
  if (!actor.isRootAdmin && !isRootAdminUid(actor.uid)) {
    throw new Error('ONLY_ROOT_ADMIN_CAN_CHANGE_ROLE')
  }

  if (targetUid === ROOT_ADMIN_UID || isRootAdminUid(targetUid)) {
    throw new Error('CANNOT_MODIFY_ROOT_ADMIN')
  }

  const store = loadStore()
  const target = store.users[targetUid]
  if (!target) {
    throw new Error('TARGET_USER_NOT_FOUND')
  }

  if (target.isRootAdmin) {
    throw new Error('CANNOT_MODIFY_ROOT_ADMIN')
  }

  const now = new Date().toISOString()
  target.role = nextRole === 'admin' ? 'admin' : 'student'
  target.updatedAt = now
  store.users[targetUid] = target

  if (!store.progress[targetUid]) {
    store.progress[targetUid] = createEmptyProgress(targetUid)
  }
  store.progress[targetUid].studyHistory.unshift({
    id: `act_${Date.now()}`,
    type: 'account',
    title: target.role === 'admin' ? 'Được cấp quyền Quản trị viên (Admin)' : 'Thu hồi quyền Admin về Học viên (Student)',
    detail: `Thực hiện bởi Admin gốc (${actor.email}).`,
    xpEarned: 0,
    timestamp: now,
  })

  saveStore(store)
  void syncDocToFirestoreWithTimeout('users', targetUid, toPublicUserProfile(target))
  return target
}

/**
 * Khóa hoặc mở khóa tài khoản người dùng
 * - Bảo vệ tuyệt đối Admin gốc (không thể bị khóa)
 * - Admin thông thường không thể khóa một Admin khác
 */
export async function updateAccountLockByAdmin(
  actor: UserAccountRecord,
  targetUid: string,
  locked: boolean,
  reason?: string,
): Promise<UserAccountRecord> {
  if (actor.role !== 'admin' && !actor.isRootAdmin) {
    throw new Error('FORBIDDEN_ADMIN_ONLY')
  }

  if (targetUid === ROOT_ADMIN_UID || isRootAdminUid(targetUid)) {
    throw new Error('CANNOT_LOCK_ROOT_ADMIN')
  }

  const store = loadStore()
  const target = store.users[targetUid]
  if (!target) {
    throw new Error('TARGET_USER_NOT_FOUND')
  }

  if (target.isRootAdmin) {
    throw new Error('CANNOT_LOCK_ROOT_ADMIN')
  }

  // Admin thông thường không được phép khóa Admin khác
  if (target.role === 'admin' && !actor.isRootAdmin && !isRootAdminUid(actor.uid)) {
    throw new Error('REGULAR_ADMIN_CANNOT_LOCK_ADMIN')
  }

  const now = new Date().toISOString()
  target.locked = Boolean(locked)
  if (target.locked) {
    target.lockedReason = reason?.trim() || 'Tài khoản bị khóa bởi Quản trị viên.'
  } else {
    delete target.lockedReason
  }
  target.updatedAt = now
  store.users[targetUid] = target

  if (!store.progress[targetUid]) {
    store.progress[targetUid] = createEmptyProgress(targetUid)
  }
  store.progress[targetUid].studyHistory.unshift({
    id: `act_${Date.now()}`,
    type: 'account',
    title: target.locked ? 'Tài khoản bị khóa' : 'Tài khoản được mở khóa',
    detail: target.locked ? target.lockedReason! : `Mở khóa bởi Quản trị viên (${actor.email}).`,
    xpEarned: 0,
    timestamp: now,
  })

  saveStore(store)
  await syncFirebaseUserLockState(targetUid, target.locked)
  void syncDocToFirestoreWithTimeout('users', targetUid, toPublicUserProfile(target))

  return target
}

/**
 * Xóa tài khoản đồng bộ (Firebase Auth + Cloud Firestore + Toàn bộ tiến độ học tập, chống dữ liệu mồ côi)
 */
export async function deleteAccountByAdmin(
  actor: UserAccountRecord,
  targetUid: string,
): Promise<{ deletedUid: string; deletedEmail: string }> {
  if (actor.role !== 'admin' && !actor.isRootAdmin) {
    throw new Error('FORBIDDEN_ADMIN_ONLY')
  }

  if (targetUid === ROOT_ADMIN_UID || isRootAdminUid(targetUid)) {
    throw new Error('CANNOT_DELETE_ROOT_ADMIN')
  }

  if (actor.uid === targetUid) {
    throw new Error('CANNOT_DELETE_SELF')
  }

  const store = loadStore()
  const target = store.users[targetUid]
  if (!target) {
    throw new Error('TARGET_USER_NOT_FOUND')
  }

  if (target.isRootAdmin) {
    throw new Error('CANNOT_DELETE_ROOT_ADMIN')
  }

  // Admin thông thường không được xóa Admin khác
  if (target.role === 'admin' && !actor.isRootAdmin && !isRootAdminUid(actor.uid)) {
    throw new Error('REGULAR_ADMIN_CANNOT_DELETE_ADMIN')
  }

  const deletedEmail = target.email

  // 1. Xóa tài khoản trên Firebase Authentication (Firebase Admin SDK)
  await deleteFirebaseAuthAccount(targetUid)

  // 2. Xóa tài liệu người dùng trên Cloud Firestore
  await deleteDocFromFirestoreWithTimeout(targetUid)

  // 3. Xóa đồng bộ tài khoản và toàn bộ dữ liệu học tập liên quan (SRS, Pomodoro, Handwriting, TOPIK) để tránh dữ liệu mồ côi
  delete store.users[targetUid]
  delete store.progress[targetUid]
  saveStore(store)

  return { deletedUid: targetUid, deletedEmail }
}

/**
 * Phương án khôi phục an toàn cho Admin gốc từ phía quản trị hệ thống
 */
export function recoverRootAdminAccess(recoveryKey: string, newPassword?: string): UserAccountRecord {
  if (!recoveryKey || recoveryKey !== ROOT_ADMIN_RECOVERY_KEY) {
    throw new Error('INVALID_RECOVERY_KEY')
  }

  const store = loadStore()
  const now = new Date().toISOString()
  const passwordToSet = newPassword && newPassword.length >= 6 ? newPassword : ROOT_ADMIN_DEFAULT_PASSWORD

  const rootUser = store.users[ROOT_ADMIN_UID] || {
    uid: ROOT_ADMIN_UID,
    displayName: 'Quản trị viên',
    email: ROOT_ADMIN_EMAIL,
    photoURL: null,
    provider: 'password',
    role: 'admin',
    isRootAdmin: true,
    locked: false,
    level: 1,
    xp: 0,
    streak: 0,
    lastStudyDate: null,
    totalStudyMinutes: 0,
    learnedVocabCount: 0,
    createdAt: now,
    lastLoginAt: now,
    updatedAt: now,
  }

  rootUser.role = 'admin'
  rootUser.isRootAdmin = true
  rootUser.locked = false
  delete rootUser.lockedReason
  rootUser.passwordHash = hashPassword(passwordToSet)
  rootUser.updatedAt = now

  store.users[ROOT_ADMIN_UID] = rootUser
  if (!store.progress[ROOT_ADMIN_UID]) {
    store.progress[ROOT_ADMIN_UID] = createEmptyProgress(ROOT_ADMIN_UID)
  }
  saveStore(store)
  void syncDocToFirestoreWithTimeout('users', ROOT_ADMIN_UID, toPublicUserProfile(rootUser))

  return rootUser
}

/**
 * Ghi nhận kết quả ôn tập từ vựng SRS vào tiến độ thực tế của tài khoản
 */
export function recordUserSrsReview(
  uid: string,
  vocabId: string,
  wordKo: string,
  meaning: string,
  srsState: SrsState,
): { user: UserAccountRecord; progress: UserLearningProgress } | null {
  const store = loadStore()
  const user = store.users[uid]
  if (!user) return null

  if (!store.progress[uid]) {
    store.progress[uid] = createEmptyProgress(uid)
  }

  const now = new Date().toISOString()
  const todayStr = now.slice(0, 10)
  const isNewWord = !store.progress[uid].srsProgress[vocabId]

  store.progress[uid].srsProgress[vocabId] = {
    ...srsState,
    wordKo,
    meaning,
    updatedAt: now,
  }

  const xpEarned = 15
  user.xp += xpEarned
  user.level = calculateLevelFromXp(user.xp)
  const streakInfo = calculateStreak(user.streak, user.lastStudyDate)
  user.streak = streakInfo.ChuoiStreak
  user.lastStudyDate = streakInfo.todayKey || todayStr
  user.learnedVocabCount = Object.keys(store.progress[uid].srsProgress).length
  user.updatedAt = now

  store.progress[uid].studyHistory.unshift({
    id: `srs_${Date.now()}_${vocabId}`,
    type: 'srs',
    title: `${isNewWord ? 'Học từ mới' : 'Ôn tập SRS'}: ${wordKo} (${meaning})`,
    detail: `Khoảng cách ôn: ${srsState.KhoangCachNgay} ngày · Ôn tiếp: ${srsState.NgayOnTiepTheoHienThi}`,
    xpEarned,
    timestamp: now,
  })
  store.progress[uid].studyHistory = store.progress[uid].studyHistory.slice(0, 50)

  store.users[uid] = user
  saveStore(store)
  void syncDocToFirestoreWithTimeout('users', uid, toPublicUserProfile(user))

  return { user, progress: store.progress[uid] }
}

/**
 * Ghi nhận phiên học Pomodoro vào tiến độ thực tế của tài khoản
 */
export function recordUserPomodoroSession(
  uid: string,
  taskTitle: string,
  reward: PomodoroGamificationResult,
): { user: UserAccountRecord; progress: UserLearningProgress } | null {
  const store = loadStore()
  const user = store.users[uid]
  if (!user) return null

  if (!store.progress[uid]) {
    store.progress[uid] = createEmptyProgress(uid)
  }

  const now = new Date().toISOString()
  store.progress[uid].pomodoroSessions.unshift({
    ...reward,
    taskTitle,
    createdAt: now,
  })
  store.progress[uid].pomodoroSessions = store.progress[uid].pomodoroSessions.slice(0, 50)

  user.xp = reward.TongXP
  user.level = reward.CapDo
  user.streak = reward.ChuoiStreak
  user.lastStudyDate = reward.NgayHoc
  user.totalStudyMinutes += reward.durationMinutes
  user.updatedAt = now

  store.progress[uid].studyHistory.unshift({
    id: reward.sessionId,
    type: 'pomodoro',
    title: `Hoàn thành Pomodoro: ${taskTitle}`,
    detail: `Thời lượng: ${reward.durationMinutes} phút · Chuỗi Streak: ${reward.ChuoiStreak} ngày`,
    xpEarned: reward.DiemXPNhanDuoc,
    timestamp: now,
  })
  store.progress[uid].studyHistory = store.progress[uid].studyHistory.slice(0, 50)

  store.users[uid] = user
  saveStore(store)
  void syncDocToFirestoreWithTimeout('users', uid, toPublicUserProfile(user))

  return { user, progress: store.progress[uid] }
}

/**
 * Ghi nhận kết quả luyện viết chữ Hàn vào tiến độ thực tế của tài khoản
 */
export function recordUserHandwritingAttempt(
  uid: string,
  item: {
    char: string
    unicode: string
    datasetClassId: string
    score: number
  },
): { user: UserAccountRecord; progress: UserLearningProgress } | null {
  const store = loadStore()
  const user = store.users[uid]
  if (!user) return null

  if (!store.progress[uid]) {
    store.progress[uid] = createEmptyProgress(uid)
  }

  const now = new Date().toISOString()
  const todayStr = now.slice(0, 10)
  const prev = store.progress[uid].handwritingRecords[item.char]
  const bestScore = Math.max(prev?.bestScore ?? 0, item.score)
  const attempts = (prev?.attempts ?? 0) + 1

  store.progress[uid].handwritingRecords[item.char] = {
    char: item.char,
    unicode: item.unicode,
    datasetClassId: item.datasetClassId,
    lastScore: item.score,
    bestScore,
    attempts,
    updatedAt: now,
  }

  const xpEarned = item.score >= 80 ? 20 : 10
  user.xp += xpEarned
  user.level = calculateLevelFromXp(user.xp)
  const streakInfo = calculateStreak(user.streak, user.lastStudyDate)
  user.streak = streakInfo.ChuoiStreak
  user.lastStudyDate = streakInfo.todayKey || todayStr
  user.updatedAt = now

  store.progress[uid].studyHistory.unshift({
    id: `hw_${Date.now()}_${item.char}`,
    type: 'handwriting',
    title: `Luyện viết chữ Hàn "${item.char}" (${item.unicode})`,
    detail: `Điểm đạt được: ${item.score}/100 (Cao nhất: ${bestScore}/100 · Lần thử #${attempts})`,
    xpEarned,
    timestamp: now,
  })
  store.progress[uid].studyHistory = store.progress[uid].studyHistory.slice(0, 50)

  store.users[uid] = user
  saveStore(store)
  void syncDocToFirestoreWithTimeout('users', uid, toPublicUserProfile(user))

  return { user, progress: store.progress[uid] }
}

/**
 * Ghi nhận kết quả bài thi thử TOPIK vào tiến độ thực tế của tài khoản
 */
export function recordUserTopikResult(
  uid: string,
  exam: {
    examId: string
    examTitle: string
    correctCount: number
    totalQuestions: number
    durationSeconds: number
  },
): { user: UserAccountRecord; result: TopikExamResultItem } | null {
  const store = loadStore()
  const user = store.users[uid]
  if (!user) return null

  if (!store.progress[uid]) {
    store.progress[uid] = createEmptyProgress(uid)
  }

  const now = new Date().toISOString()
  const todayStr = now.slice(0, 10)
  const maxScore = 200
  const score = Math.round((exam.correctCount / Math.max(1, exam.totalQuestions)) * maxScore)
  const levelAchieved = score >= 140 ? 'TOPIK I - Cấp 2' : score >= 80 ? 'TOPIK I - Cấp 1' : 'Chưa đạt cấp'

  const resultItem: TopikExamResultItem = {
    examId: exam.examId,
    examTitle: exam.examTitle,
    score,
    maxScore,
    correctCount: exam.correctCount,
    totalQuestions: exam.totalQuestions,
    levelAchieved,
    durationSeconds: exam.durationSeconds,
    submittedAt: now,
  }

  store.progress[uid].topikResults.unshift(resultItem)
  store.progress[uid].topikResults = store.progress[uid].topikResults.slice(0, 30)

  const xpEarned = Math.max(25, Math.round(score / 2))
  user.xp += xpEarned
  user.level = calculateLevelFromXp(user.xp)
  const streakInfo = calculateStreak(user.streak, user.lastStudyDate)
  user.streak = streakInfo.ChuoiStreak
  user.lastStudyDate = streakInfo.todayKey || todayStr
  user.totalStudyMinutes += Math.max(1, Math.round(exam.durationSeconds / 60))
  user.updatedAt = now

  store.progress[uid].studyHistory.unshift({
    id: `topik_${Date.now()}`,
    type: 'topik',
    title: `Nộp bài thi: ${exam.examTitle}`,
    detail: `Điểm: ${score}/${maxScore} (${exam.correctCount}/${exam.totalQuestions} câu đúng · ${levelAchieved})`,
    xpEarned,
    timestamp: now,
  })
  store.progress[uid].studyHistory = store.progress[uid].studyHistory.slice(0, 50)

  store.users[uid] = user
  saveStore(store)
  void syncDocToFirestoreWithTimeout('users', uid, toPublicUserProfile(user))

  return { user, result: resultItem }
}

/**
 * Truy xuất danh sách tất cả tài khoản và số liệu thống kê thực tế cho Dashboard Quản trị (/admin)
 */
export function getAdminDashboardData() {
  const store = loadStore()
  const allUsers = Object.values(store.users).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )

  const totalAccounts = allUsers.length
  const totalAdmins = allUsers.filter((u) => u.role === 'admin' || u.isRootAdmin).length
  const totalStudents = allUsers.filter((u) => u.role === 'student' && !u.isRootAdmin).length
  const activeAccounts = allUsers.filter((u) => !u.locked).length
  const lockedAccounts = allUsers.filter((u) => u.locked).length

  let totalSystemXp = 0
  let totalSystemStudyMinutes = 0
  let totalSystemLearnedVocab = 0
  let totalTopikSubmissions = 0

  const recentSystemActivities: Array<StudyActivityItem & { userName: string; userEmail: string; uid: string }> = []

  for (const u of allUsers) {
    totalSystemXp += u.xp
    totalSystemStudyMinutes += u.totalStudyMinutes
    totalSystemLearnedVocab += u.learnedVocabCount

    const prog = store.progress[u.uid]
    if (prog) {
      totalTopikSubmissions += prog.topikResults.length
      for (const act of prog.studyHistory.slice(0, 10)) {
        recentSystemActivities.push({
          ...act,
          uid: u.uid,
          userName: u.displayName,
          userEmail: u.email,
        })
      }
    }
  }

  recentSystemActivities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

  const topLearners = [...allUsers]
    .filter((u) => u.xp > 0 || u.totalStudyMinutes > 0 || u.learnedVocabCount > 0)
    .sort((a, b) => b.xp - a.xp || b.totalStudyMinutes - a.totalStudyMinutes)
    .slice(0, 5)
    .map(toPublicUserProfile)

  const recentRegisteredUsers = allUsers.slice(0, 6).map(toPublicUserProfile)

  return {
    stats: {
      totalAccounts,
      totalStudents,
      totalAdmins,
      activeAccounts,
      lockedAccounts,
      totalSystemXp,
      totalSystemStudyMinutes,
      totalSystemLearnedVocab,
      totalTopikSubmissions,
    },
    users: allUsers.map((u) => {
      const prog = store.progress[u.uid] || createEmptyProgress(u.uid)
      return {
        ...toPublicUserProfile(u),
        pomodoroCount: prog.pomodoroSessions.length,
        topikCount: prog.topikResults.length,
        handwritingCount: Object.keys(prog.handwritingRecords).length,
      }
    }),
    topLearners,
    recentRegisteredUsers,
    recentActivities: recentSystemActivities.slice(0, 12),
  }
}

/**
 * Lấy danh sách tất cả tài khoản học viên (Student) từ kho lưu trữ
 */
export function getAllStudentAccounts(): UserAccountRecord[] {
  const store = loadStore()
  return Object.values(store.users).filter((u) => u.role === 'student' && !u.isRootAdmin)
}
