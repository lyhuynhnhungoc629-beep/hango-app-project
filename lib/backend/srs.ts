export type SrsRating = 'forgot' | 'hard' | 'remember'

export interface SrsState {
  vocabId: string
  /** Số ngày cách quãng đến lần ôn tiếp theo (theo đề cương: KhoangCachNgay) */
  KhoangCachNgay: number
  /** Ngày ôn tập tiếp theo dạng ISO string (theo đề cương: NgayOnTiepTheo) */
  NgayOnTiepTheo: string
  /** Ngày ôn tập tiếp theo định dạng dd/mm/yyyy để hiển thị */
  NgayOnTiepTheoHienThi: string
  /** Số lần nhớ liên tiếp (Repetition count) */
  SoLanLap: number
  /** Hệ số dễ (Easiness Factor - chuẩn SM-2, mặc định 2.5, tối thiểu 1.3) */
  HeSoGhiNho: number
  /** Đánh giá gần nhất: forgot (Quên) | hard (Khó) | remember (Nhớ) */
  MucDoNho: SrsRating
  /** Thời điểm ôn tập vừa thực hiện */
  NgayOnGanNhat: string
}

export function formatDateVN(date: Date): string {
  const d = String(date.getDate()).padStart(2, '0')
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const y = date.getFullYear()
  return `${d}/${m}/${y}`
}

/**
 * Thuật toán SRS (Spaced Repetition System - biến thể SM-2)
 * Tính toán KhoangCachNgay và NgayOnTiepTheo dựa trên mức độ ghi nhớ của học viên:
 * - 'forgot' (Quên - Chất lượng q = 1): Reset SoLanLap = 0, KhoangCachNgay = 1 ngày
 * - 'hard' (Khó - Chất lượng q = 3): Tăng nhẹ KhoangCachNgay, giảm nhẹ HeSoGhiNho
 * - 'remember' (Nhớ - Chất lượng q = 5): Tăng mạnh KhoangCachNgay theo cấp số nhân (1 -> 3 -> round(I * EF))
 */
export function calculateSrsSchedule(
  vocabId: string,
  rating: SrsRating,
  previous?: Partial<SrsState>,
  now: Date = new Date(),
): SrsState {
  const prevInterval = previous?.KhoangCachNgay ?? 0
  const prevReps = previous?.SoLanLap ?? 0
  const prevEf = previous?.HeSoGhiNho ?? 2.5

  // Quy đổi mức đánh giá sang thang điểm chất lượng q của thuật toán SM-2 (0..5)
  const quality = rating === 'forgot' ? 1 : rating === 'hard' ? 3 : 5

  // Cập nhật hệ số ghi nhớ EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
  let nextEf = prevEf + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  nextEf = Math.max(1.3, Number(nextEf.toFixed(2)))

  let KhoangCachNgay = 1
  let SoLanLap = 0

  if (rating === 'forgot') {
    // Nếu quên: đưa về ôn lại vào ngày hôm sau (KhoangCachNgay = 1)
    SoLanLap = 0
    KhoangCachNgay = 1
  } else if (rating === 'hard') {
    // Nếu khó: giữ tiến độ tăng chậm
    SoLanLap = prevReps + 1
    if (prevReps === 0) {
      KhoangCachNgay = 1
    } else if (prevReps === 1) {
      KhoangCachNgay = 2
    } else {
      KhoangCachNgay = Math.max(prevInterval + 1, Math.round(prevInterval * 1.4))
    }
  } else {
    // Nếu nhớ tốt ('remember'): tăng khoảng cách ngày theo cấp số nhân SM-2
    SoLanLap = prevReps + 1
    if (SoLanLap === 1) {
      KhoangCachNgay = 1
    } else if (SoLanLap === 2) {
      KhoangCachNgay = 3
    } else {
      KhoangCachNgay = Math.max(prevInterval + 1, Math.round(prevInterval * nextEf))
    }
  }

  const nextDate = new Date(now.getTime())
  nextDate.setDate(nextDate.getDate() + KhoangCachNgay)

  return {
    vocabId,
    KhoangCachNgay,
    NgayOnTiepTheo: nextDate.toISOString(),
    NgayOnTiepTheoHienThi: formatDateVN(nextDate),
    SoLanLap,
    HeSoGhiNho: nextEf,
    MucDoNho: rating,
    NgayOnGanNhat: now.toISOString(),
  }
}

/**
 * Dự tính trước KhoangCachNgay cho cả 3 nút (Quên / Khó / Nhớ) để hiển thị gợi ý trên giao diện
 */
export function previewSrsIntervals(
  vocabId: string,
  previous?: Partial<SrsState>,
): Record<SrsRating, number> {
  return {
    forgot: calculateSrsSchedule(vocabId, 'forgot', previous).KhoangCachNgay,
    hard: calculateSrsSchedule(vocabId, 'hard', previous).KhoangCachNgay,
    remember: calculateSrsSchedule(vocabId, 'remember', previous).KhoangCachNgay,
  }
}
