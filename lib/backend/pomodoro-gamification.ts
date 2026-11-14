export interface PomodoroSessionInput {
  uid?: string | null
  durationMinutes: number
  completedSessionsToday: number
  currentXp: number
  currentStreak: number
  lastStudyDate?: string | null // Định dạng YYYY-MM-DD
  taskTitle?: string
}

export interface PomodoroGamificationResult {
  sessionId: string
  durationMinutes: number
  /** Điểm XP cộng thêm trong phiên học này */
  DiemXPNhanDuoc: number
  /** Chi tiết điểm XP (cơ bản + thưởng chuỗi + thưởng chu kỳ) */
  chiTietXP: {
    xpCoBan: number
    xpThuongStreak: number
    xpThuongChuKy4Phien: number
  }
  /** Tổng điểm XP mới của học viên */
  TongXP: number
  /** Cấp độ (Level) hiện tại sau khi cộng XP */
  CapDo: number
  /** Có vừa thăng cấp hay không */
  thangCap: boolean
  /** Chuỗi ngày học liên tiếp (Streak) */
  ChuoiStreak: number
  /** Trạng thái cập nhật Streak */
  trangThaiStreak: 'tang_moi' | 'giu_nguyen_hom_nay' | 'bat_dau_lai'
  /** Ngày ghi nhận phiên học (YYYY-MM-DD) */
  NgayHoc: string
  /** Thời gian hoàn thành phiên (ISO) */
  ThoiGianHoanThanh: string
}

export function getDateKey(date: Date = new Date()): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/**
 * Tính toán Cấp độ (Level) từ Tổng điểm XP
 * Mỗi cấp độ cần 250 XP (VD: 0..249 -> Cấp 1, 2450 XP -> Cấp 10..12)
 */
export function calculateLevelFromXp(xp: number): number {
  return Math.max(1, Math.floor(xp / 250) + 1)
}

/**
 * Thuật toán tính toán Chuỗi ngày học liên tiếp (Streak)
 * So sánh ngày học gần nhất (lastStudyDate) với ngày hiện tại (todayKey)
 */
export function calculateStreak(
  currentStreak: number,
  lastStudyDate?: string | null,
  now: Date = new Date(),
): {
  ChuoiStreak: number
  trangThaiStreak: 'tang_moi' | 'giu_nguyen_hom_nay' | 'bat_dau_lai'
  todayKey: string
} {
  const todayKey = getDateKey(now)

  if (!lastStudyDate) {
    return {
      ChuoiStreak: Math.max(1, currentStreak + 1),
      trangThaiStreak: 'tang_moi',
      todayKey,
    }
  }

  if (lastStudyDate === todayKey) {
    return {
      ChuoiStreak: Math.max(1, currentStreak),
      trangThaiStreak: 'giu_nguyen_hom_nay',
      todayKey,
    }
  }

  const yesterday = new Date(now.getTime())
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayKey = getDateKey(yesterday)

  if (lastStudyDate === yesterdayKey) {
    return {
      ChuoiStreak: currentStreak + 1,
      trangThaiStreak: 'tang_moi',
      todayKey,
    }
  }

  // Nếu nghỉ quá 1 ngày thì chuỗi Streak quay về 1
  return {
    ChuoiStreak: 1,
    trangThaiStreak: 'bat_dau_lai',
    todayKey,
  }
}

/**
 * Thuật toán tính toán Điểm XP và Chuỗi Streak khi hoàn thành 1 phiên học Pomodoro
 */
export function calculatePomodoroReward(
  input: PomodoroSessionInput,
  now: Date = new Date(),
): PomodoroGamificationResult {
  const duration = Math.max(1, input.durationMinutes || 25)
  const { ChuoiStreak, trangThaiStreak, todayKey } = calculateStreak(
    input.currentStreak ?? 1,
    input.lastStudyDate,
    now,
  )

  // 1. Điểm XP cơ bản: 4 XP cho mỗi phút tập trung (25 phút = 100 XP)
  const xpCoBan = duration * 4

  // 2. Điểm thưởng duy trì Streak: +5 XP cho mỗi ngày Streak (tối đa +50 XP)
  const xpThuongStreak = Math.min(50, ChuoiStreak * 5)

  // 3. Điểm thưởng khi hoàn thành đủ chu kỳ 4 phiên Pomodoro trong ngày: +50 XP
  const isFourthSession = input.completedSessionsToday > 0 && input.completedSessionsToday % 4 === 0
  const xpThuongChuKy4Phien = isFourthSession ? 50 : 0

  const DiemXPNhanDuoc = xpCoBan + xpThuongStreak + xpThuongChuKy4Phien
  const prevLevel = calculateLevelFromXp(input.currentXp)
  const TongXP = input.currentXp + DiemXPNhanDuoc
  const CapDo = calculateLevelFromXp(TongXP)
  const thangCap = CapDo > prevLevel

  return {
    sessionId: `pomo-${now.getTime()}`,
    durationMinutes: duration,
    DiemXPNhanDuoc,
    chiTietXP: {
      xpCoBan,
      xpThuongStreak,
      xpThuongChuKy4Phien,
    },
    TongXP,
    CapDo,
    thangCap,
    ChuoiStreak,
    trangThaiStreak,
    NgayHoc: todayKey,
    ThoiGianHoanThanh: now.toISOString(),
  }
}
