import React from 'react'

export interface TopicIllustrationTheme {
  gradientFrom: string
  gradientVia: string
  gradientTo: string
  accentColor: string
  emojiMain: string
  emojiAccents: [string, string]
  sceneLabel: string
  bgPhotoUrl: string
}

const TOPIC_THEMES: Record<string, TopicIllustrationTheme> = {
  GIA_DINH: {
    gradientFrom: '#FDF2F8',
    gradientVia: '#FCE7F3',
    gradientTo: '#F5F3FF',
    accentColor: '#EC4899',
    emojiMain: '👨‍👩‍👧‍👦',
    emojiAccents: ['🏠', '💖'],
    sceneLabel: 'Gia đình ấm áp',
    bgPhotoUrl: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=800&q=80',
  },
  TRUONG_HOC: {
    gradientFrom: '#EFF6FF',
    gradientVia: '#DBEAFE',
    gradientTo: '#EEF2FF',
    accentColor: '#3B82F6',
    emojiMain: '🎓',
    emojiAccents: ['📚', '🏫'],
    sceneLabel: 'Trường lớp & Tri thức',
    bgPhotoUrl: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=800&q=80',
  },
  AM_THUC: {
    gradientFrom: '#FFF7ED',
    gradientVia: '#FFEDD5',
    gradientTo: '#FEF2F2',
    accentColor: '#F97316',
    emojiMain: '🍱',
    emojiAccents: ['🍜', '☕'],
    sceneLabel: 'Ẩm thực Hàn Quốc',
    bgPhotoUrl: 'https://images.unsplash.com/photo-1590301157890-4810ed352733?auto=format&fit=crop&w=800&q=80',
  },
  DU_LICH: {
    gradientFrom: '#ECFEFF',
    gradientVia: '#CFFAFE',
    gradientTo: '#EFF6FF',
    accentColor: '#06B6D4',
    emojiMain: '✈️',
    emojiAccents: ['🗺️', '🌊'],
    sceneLabel: 'Khám phá & Dịch chuyển',
    bgPhotoUrl: 'https://images.unsplash.com/photo-1517154421773-0529f29ea451?auto=format&fit=crop&w=800&q=80',
  },
  MUA_SAM: {
    gradientFrom: '#ECFDF5',
    gradientVia: '#D1FAE5',
    gradientTo: '#F0FDF4',
    accentColor: '#10B981',
    emojiMain: '🛍️',
    emojiAccents: ['👗', '💳'],
    sceneLabel: 'Mua sắm & Đời sống',
    bgPhotoUrl: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=800&q=80',
  },
  NGHE_NGHIEP: {
    gradientFrom: '#F5F3FF',
    gradientVia: '#EDE9FE',
    gradientTo: '#EEF2FF',
    accentColor: '#8B5CF6',
    emojiMain: '💼',
    emojiAccents: ['🏢', '👨‍⚕️'],
    sceneLabel: 'Công sở & Sự nghiệp',
    bgPhotoUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80',
  },
  SUC_KHOE: {
    gradientFrom: '#FEF2F2',
    gradientVia: '#FEE2E2',
    gradientTo: '#FFF1F2',
    accentColor: '#EF4444',
    emojiMain: '🏃‍♂️',
    emojiAccents: ['⚾', '❤️‍🩹'],
    sceneLabel: 'Thể thao & Sức khỏe',
    bgPhotoUrl: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=800&q=80',
  },
  GIAO_TIEP: {
    gradientFrom: '#EEF2FF',
    gradientVia: '#E0E7FF',
    gradientTo: '#F5F3FF',
    accentColor: '#6366F1',
    emojiMain: '💬',
    emojiAccents: ['👋', '🤝'],
    sceneLabel: 'Hội thoại thường nhật',
    bgPhotoUrl: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=800&q=80',
  },
  THOI_GIAN: {
    gradientFrom: '#FFFBEB',
    gradientVia: '#FEF3C7',
    gradientTo: '#FFF7ED',
    accentColor: '#F59E0B',
    emojiMain: '⌚',
    emojiAccents: ['📅', '⏳'],
    sceneLabel: 'Thời gian & Con số',
    bgPhotoUrl: 'https://images.unsplash.com/photo-1501139083538-0139583c060f?auto=format&fit=crop&w=800&q=80',
  },
  DONG_VAT_THIEN_NHIEN: {
    gradientFrom: '#F0FDFA',
    gradientVia: '#CCFBF1',
    gradientTo: '#ECFDF5',
    accentColor: '#14B8A6',
    emojiMain: '🌿',
    emojiAccents: ['🐰', '🌸'],
    sceneLabel: 'Thiên nhiên & Muông thú',
    bgPhotoUrl: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=800&q=80',
  },
}

const DEFAULT_TOPIC_THEME: TopicIllustrationTheme = {
  gradientFrom: '#F5F3FF',
  gradientVia: '#EDE9FE',
  gradientTo: '#EFF6FF',
  accentColor: '#7C3AED',
  emojiMain: '🇰🇷',
  emojiAccents: ['📖', '✨'],
  sceneLabel: 'Từ vựng tiếng Hàn',
  bgPhotoUrl: 'https://images.unsplash.com/photo-1517154421773-0529f29ea451?auto=format&fit=crop&w=800&q=80',
}

export const TOPIC_PRESET_IMAGES: Array<{ label: string; url: string }> = [
  {
    label: 'Gia đình & Đời sống',
    url: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=800&q=80',
  },
  {
    label: 'Trường học & Giáo dục',
    url: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=800&q=80',
  },
  {
    label: 'Ẩm thực Hàn Quốc',
    url: 'https://images.unsplash.com/photo-1590301157890-4810ed352733?auto=format&fit=crop&w=800&q=80',
  },
  {
    label: 'Du lịch & Hàn Quốc',
    url: 'https://images.unsplash.com/photo-1517154421773-0529f29ea451?auto=format&fit=crop&w=800&q=80',
  },
  {
    label: 'Mua sắm & Phố xá',
    url: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=800&q=80',
  },
  {
    label: 'Công sở & Công nghệ',
    url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80',
  },
  {
    label: 'Thể thao & Sức khỏe',
    url: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=800&q=80',
  },
  {
    label: 'Giao tiếp & Bạn bè',
    url: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=800&q=80',
  },
  {
    label: 'Thời gian & Lịch trình',
    url: 'https://images.unsplash.com/photo-1501139083538-0139583c060f?auto=format&fit=crop&w=800&q=80',
  },
  {
    label: 'Thiên nhiên & Động vật',
    url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=800&q=80',
  },
]

export function getTopicIllustrationTheme(
  topicCode?: string,
  topicId?: number,
  customImageUrl?: string | null,
): TopicIllustrationTheme {
  let base = DEFAULT_TOPIC_THEME
  if (topicCode && TOPIC_THEMES[topicCode]) {
    base = TOPIC_THEMES[topicCode]
  } else {
    const byId: Record<number, string> = {
      1: 'GIA_DINH',
      2: 'TRUONG_HOC',
      3: 'AM_THUC',
      4: 'DU_LICH',
      5: 'MUA_SAM',
      6: 'NGHE_NGHIEP',
      7: 'SUC_KHOE',
      8: 'GIAO_TIEP',
      9: 'THOI_GIAN',
      10: 'DONG_VAT_THIEN_NHIEN',
    }
    if (topicId && byId[topicId] && TOPIC_THEMES[byId[topicId]]) {
      base = TOPIC_THEMES[byId[topicId]]
    }
  }
  if (customImageUrl && customImageUrl.trim()) {
    return {
      ...base,
      bgPhotoUrl: customImageUrl.trim(),
    }
  }
  return base
}

export interface VocabVisualInfo {
  emoji: string
  subEmoji: string
  bgFrom: string
  bgTo: string
  accent: string
  caption: string
  imageUrl?: string | null
}

/**
 * Ánh xạ chính xác hình ảnh minh họa theo nghĩa cho từng từ vựng trong kho từ vựng HANGO
 */
const EXACT_VOCAB_EMOJI_MAP: Record<string, { emoji: string; sub: string; bgFrom: string; bgTo: string; accent: string; caption?: string }> = {
  // 1..36: Nhập môn Hangeul
  '아이': { emoji: '👶', sub: '🎈', bgFrom: '#FDF2F8', bgTo: '#FCE7F3', accent: '#EC4899', caption: 'Em bé' },
  '오이': { emoji: '🥒', sub: '🥗', bgFrom: '#F0FDF4', bgTo: '#DCFCE7', accent: '#16A34A', caption: 'Dưa chuột' },
  '야구': { emoji: '⚾', sub: '🧢', bgFrom: '#EFF6FF', bgTo: '#DBEAFE', accent: '#2563EB', caption: 'Bóng chày' },
  '어머니': { emoji: '👩', sub: '💐', bgFrom: '#FDF2F8', bgTo: '#FCE7F3', accent: '#DB2777', caption: 'Người mẹ' },
  '우유': { emoji: '🥛', sub: '🐄', bgFrom: '#F0F9FF', bgTo: '#E0F2FE', accent: '#0284C7', caption: 'Sữa tươi' },
  '오리': { emoji: '🦆', sub: '🌊', bgFrom: '#FEFCE8', bgTo: '#FEF08A', accent: '#CA8A04', caption: 'Con vịt' },
  '요리': { emoji: '🍳', sub: '👩‍🍳', bgFrom: '#FFF7ED', bgTo: '#FFEDD5', accent: '#EA580C', caption: 'Nấu ăn' },
  '가방': { emoji: '🎒', sub: '👜', bgFrom: '#EFF6FF', bgTo: '#DBEAFE', accent: '#2563EB', caption: 'Cặp sách' },
  '나무': { emoji: '🌳', sub: '🍃', bgFrom: '#F0FDF4', bgTo: '#BBF7D0', accent: '#15803D', caption: 'Cây xanh' },
  '바다': { emoji: '🌊', sub: '🏖️', bgFrom: '#ECFEFF', bgTo: '#A5F3FC', accent: '#0891B2', caption: 'Biển xanh' },
  '사과': { emoji: '🍎', sub: '🍃', bgFrom: '#FEF2F2', bgTo: '#FECACA', accent: '#DC2626', caption: 'Quả táo' },
  '커피': { emoji: '☕', sub: '🥐', bgFrom: '#FFFBEB', bgTo: '#FDE68A', accent: '#B45309', caption: 'Cà phê' },
  '치마': { emoji: '👗', sub: '✨', bgFrom: '#FDF4FF', bgTo: '#F5D0FE', accent: '#C026D3', caption: 'Chân váy' },
  '포도': { emoji: '🍇', sub: '🍷', bgFrom: '#F5F3FF', bgTo: '#DDD6FE', accent: '#7C3AED', caption: 'Quả nho' },
  '타조': { emoji: '🦤', sub: '🏜️', bgFrom: '#FFFBEB', bgTo: '#FEF3C7', accent: '#D97706', caption: 'Đà điểu' },
  '토끼': { emoji: '🐰', sub: '🥕', bgFrom: '#FDF2F8', bgTo: '#FCE7F3', accent: '#EC4899', caption: 'Con thỏ' },
  '오빠': { emoji: '👦', sub: '💙', bgFrom: '#EFF6FF', bgTo: '#DBEAFE', accent: '#2563EB', caption: 'Anh trai' },
  '아빠': { emoji: '👨', sub: '👔', bgFrom: '#EFF6FF', bgTo: '#DBEAFE', accent: '#1D4ED8', caption: 'Bố, ba' },
  '쓰다': { emoji: '✍️', sub: '📝', bgFrom: '#F5F3FF', bgTo: '#EDE9FE', accent: '#6D28D9', caption: 'Viết chữ' },
  '시계': { emoji: '⌚', sub: '⏰', bgFrom: '#FFFBEB', bgTo: '#FEF3C7', accent: '#D97706', caption: 'Đồng hồ' },
  '과자': { emoji: '🍪', sub: '🥨', bgFrom: '#FFF7ED', bgTo: '#FFEDD5', accent: '#EA580C', caption: 'Bánh quy' },
  '세계': { emoji: '🌍', sub: '✈️', bgFrom: '#ECFEFF', bgTo: '#CFFAFE', accent: '#0891B2', caption: 'Thế giới' },
  '왜': { emoji: '🤔', sub: '❓', bgFrom: '#EEF2FF', bgTo: '#E0E7FF', accent: '#4F46E5', caption: 'Tại sao' },
  '의사': { emoji: '👨‍⚕️', sub: '🩺', bgFrom: '#F0FDFA', bgTo: '#CCFBF1', accent: '#0D9488', caption: 'Bác sĩ' },
  '의자': { emoji: '🪑', sub: '🛋️', bgFrom: '#FFFBEB', bgTo: '#FEF3C7', accent: '#B45309', caption: 'Cái ghế' },
  '회사': { emoji: '🏢', sub: '💼', bgFrom: '#F8FAFC', bgTo: '#E2E8F0', accent: '#475569', caption: 'Công ty' },
  '위': { emoji: '⬆️', sub: '📍', bgFrom: '#EFF6FF', bgTo: '#DBEAFE', accent: '#2563EB', caption: 'Phía trên' },
  '한국': { emoji: '🇰🇷', sub: '🏯', bgFrom: '#EFF6FF', bgTo: '#FCE7F3', accent: '#2563EB', caption: 'Hàn Quốc' },
  '책': { emoji: '📖', sub: '📚', bgFrom: '#EFF6FF', bgTo: '#DBEAFE', accent: '#1D4ED8', caption: 'Quyển sách' },
  '꽃': { emoji: '🌸', sub: '🌷', bgFrom: '#FDF2F8', bgTo: '#FCE7F3', accent: '#EC4899', caption: 'Bông hoa' },
  '물': { emoji: '💧', sub: '🥤', bgFrom: '#F0F9FF', bgTo: '#BAE6FD', accent: '#0284C7', caption: 'Nước uống' },
  '한글': { emoji: '🔤', sub: '🇰🇷', bgFrom: '#EEF2FF', bgTo: '#E0E7FF', accent: '#4F46E5', caption: 'Chữ Hangeul' },
  '선생님': { emoji: '👩‍🏫', sub: '📋', bgFrom: '#EFF6FF', bgTo: '#DBEAFE', accent: '#2563EB', caption: 'Giáo viên' },
  '학생': { emoji: '🧑‍🎓', sub: '🎒', bgFrom: '#EEF2FF', bgTo: '#E0E7FF', accent: '#4F46E5', caption: 'Học sinh' },
  '사랑해요': { emoji: '❤️', sub: '🫶', bgFrom: '#FFF1F2', bgTo: '#FFE4E6', accent: '#E11D48', caption: 'Yêu thương' },

  // 37..96: Giao tiếp & Biểu cảm
  '예!': { emoji: '🙋‍♂️', sub: '✅', bgFrom: '#ECFDF5', bgTo: '#D1FAE5', accent: '#059669' },
  '예.': { emoji: '🙇', sub: '✨', bgFrom: '#ECFDF5', bgTo: '#D1FAE5', accent: '#059669' },
  '응.': { emoji: '👌', sub: '😊', bgFrom: '#EEF2FF', bgTo: '#E0E7FF', accent: '#4F46E5' },
  '네': { emoji: '🙋‍♀️', sub: '💬', bgFrom: '#ECFDF5', bgTo: '#D1FAE5', accent: '#059669' },
  '가!': { emoji: '🚶‍♂️', sub: '💨', bgFrom: '#FFF7ED', bgTo: '#FFEDD5', accent: '#EA580C' },
  '네.': { emoji: '😊', sub: '👍', bgFrom: '#ECFDF5', bgTo: '#D1FAE5', accent: '#059669' },
  '아야!': { emoji: '🤕', sub: '⚡', bgFrom: '#FEF2F2', bgTo: '#FEE2E2', accent: '#DC2626' },
  '응?': { emoji: '🧐', sub: '❓', bgFrom: '#FFFBEB', bgTo: '#FEF3C7', accent: '#D97706' },
  '추워.': { emoji: '🥶', sub: '❄️', bgFrom: '#ECFEFF', bgTo: '#CFFAFE', accent: '#0891B2' },
  '추워요.': { emoji: '🧣', sub: '❄️', bgFrom: '#ECFEFF', bgTo: '#CFFAFE', accent: '#0891B2' },
  '아뇨.': { emoji: '🙅‍♀️', sub: '✋', bgFrom: '#FEF2F2', bgTo: '#FEE2E2', accent: '#E11D48' },
  '아니요.': { emoji: '🙅', sub: '✋', bgFrom: '#FEF2F2', bgTo: '#FEE2E2', accent: '#E11D48' },
  '아니.': { emoji: '🙅‍♂️', sub: '💭', bgFrom: '#FEF2F2', bgTo: '#FEE2E2', accent: '#E11D48' },
  '아니야.': { emoji: '↔️', sub: '🙅', bgFrom: '#FEF2F2', bgTo: '#FEE2E2', accent: '#E11D48' },
  '아냐.': { emoji: '🙌', sub: '😊', bgFrom: '#FFFBEB', bgTo: '#FEF3C7', accent: '#D97706' },
  '저어...': { emoji: '👉👈', sub: '💬', bgFrom: '#F5F3FF', bgTo: '#EDE9FE', accent: '#7C3AED' },
  '잘 가!': { emoji: '👋', sub: '🚶', bgFrom: '#EEF2FF', bgTo: '#E0E7FF', accent: '#4F46E5' },
  '잘 가요!': { emoji: '👋', sub: '✨', bgFrom: '#EEF2FF', bgTo: '#E0E7FF', accent: '#4F46E5' },
  '잘 있어!': { emoji: '🙋', sub: '🏡', bgFrom: '#EEF2FF', bgTo: '#E0E7FF', accent: '#4F46E5' },
  '바빠.': { emoji: '🏃‍♂️', sub: '💼', bgFrom: '#FFF7ED', bgTo: '#FFEDD5', accent: '#EA580C' },
  '제미!': { emoji: '😣', sub: '💢', bgFrom: '#FEF2F2', bgTo: '#FEE2E2', accent: '#DC2626' },
  '지금!': { emoji: '⚡', sub: '⏱️', bgFrom: '#FFFBEB', bgTo: '#FEF3C7', accent: '#D97706' },
  '당장!': { emoji: '🚨', sub: '⏱️', bgFrom: '#FEF2F2', bgTo: '#FEE2E2', accent: '#DC2626' },
  '제발...': { emoji: '🙏', sub: '🥺', bgFrom: '#F5F3FF', bgTo: '#EDE9FE', accent: '#7C3AED' },
  '숙여!': { emoji: '🙇‍♂️', sub: '⚠️', bgFrom: '#FFFBEB', bgTo: '#FEF3C7', accent: '#D97706' },
  '숨어.': { emoji: '🫣', sub: '🌳', bgFrom: '#F0FDF4', bgTo: '#DCFCE7', accent: '#16A34A' },
  '오키.': { emoji: '👌', sub: '✨', bgFrom: '#ECFDF5', bgTo: '#D1FAE5', accent: '#059669' },
  '빠이!': { emoji: '👋', sub: '😄', bgFrom: '#FDF2F8', bgTo: '#FCE7F3', accent: '#EC4899' },
  '있지.': { emoji: '💭', sub: '🗣️', bgFrom: '#EEF2FF', bgTo: '#E0E7FF', accent: '#4F46E5' },
  '잘 봐.': { emoji: '👀', sub: '🔍', bgFrom: '#EFF6FF', bgTo: '#DBEAFE', accent: '#2563EB' },
  '말해.': { emoji: '🗣️', sub: '💬', bgFrom: '#EEF2FF', bgTo: '#E0E7FF', accent: '#4F46E5' },
  '공격!': { emoji: '⚔️', sub: '🛡️', bgFrom: '#FEF2F2', bgTo: '#FEE2E2', accent: '#DC2626' },
  '들어.': { emoji: '👂', sub: '🎵', bgFrom: '#EFF6FF', bgTo: '#DBEAFE', accent: '#2563EB' },
  '잠깐!': { emoji: '✋', sub: '⏳', bgFrom: '#FFFBEB', bgTo: '#FEF3C7', accent: '#D97706' },
  '점프!': { emoji: '🤸', sub: '⬆️', bgFrom: '#ECFDF5', bgTo: '#D1FAE5', accent: '#059669' },
  '뛰어!': { emoji: '🏃', sub: '💨', bgFrom: '#FEF2F2', bgTo: '#FEE2E2', accent: '#EF4444' },
  '도망가!': { emoji: '🏃💨', sub: '⚡', bgFrom: '#FFF7ED', bgTo: '#FFEDD5', accent: '#EA580C' },
  '안녕.': { emoji: '👋', sub: '😊', bgFrom: '#EEF2FF', bgTo: '#E0E7FF', accent: '#4F46E5' },
  '안녕!': { emoji: '🙌', sub: '☀️', bgFrom: '#EEF2FF', bgTo: '#E0E7FF', accent: '#4F46E5' },
  '안녕?': { emoji: '👋', sub: '🌸', bgFrom: '#FDF2F8', bgTo: '#FCE7F3', accent: '#EC4899' },
  '설마!': { emoji: '😲', sub: '❗', bgFrom: '#FFF7ED', bgTo: '#FFEDD5', accent: '#EA580C' },
  '힘내.': { emoji: '💪', sub: '🔥', bgFrom: '#FEF2F2', bgTo: '#FEE2E2', accent: '#EF4444' },
  '에취!': { emoji: '🤧', sub: '🧻', bgFrom: '#F0F9FF', bgTo: '#E0F2FE', accent: '#0284C7' },
  '건배!': { emoji: '🥂', sub: '🍻', bgFrom: '#FFFBEB', bgTo: '#FEF3C7', accent: '#D97706' },
  '가자!': { emoji: '🚀', sub: '👟', bgFrom: '#EFF6FF', bgTo: '#DBEAFE', accent: '#2563EB' },
  '잘자.': { emoji: '🌙', sub: '💤', bgFrom: '#EEF2FF', bgTo: '#E0E7FF', accent: '#4F46E5' },
  '뭐?': { emoji: '😮', sub: '❓', bgFrom: '#FFFBEB', bgTo: '#FEF3C7', accent: '#D97706' },
  '네?': { emoji: '👂', sub: '❓', bgFrom: '#EFF6FF', bgTo: '#DBEAFE', accent: '#2563EB' },
  '왜?': { emoji: '🤔', sub: '❓', bgFrom: '#F5F3FF', bgTo: '#EDE9FE', accent: '#7C3AED' },
  '왜요?': { emoji: '🙋', sub: '❓', bgFrom: '#F5F3FF', bgTo: '#EDE9FE', accent: '#7C3AED' },
  '몰라.': { emoji: '🤷', sub: '💭', bgFrom: '#F8FAFC', bgTo: '#E2E8F0', accent: '#64748B' },
  '몰라요.': { emoji: '🤷‍♀️', sub: '💭', bgFrom: '#F8FAFC', bgTo: '#E2E8F0', accent: '#64748B' },
  '정말?': { emoji: '🤩', sub: '✨', bgFrom: '#FFFBEB', bgTo: '#FEF3C7', accent: '#D97706' },
  '저기요!': { emoji: '🙋‍♂️', sub: '🔔', bgFrom: '#FFF7ED', bgTo: '#FFEDD5', accent: '#EA580C' },
  '하지 마!': { emoji: '🚫', sub: '✋', bgFrom: '#FEF2F2', bgTo: '#FEE2E2', accent: '#DC2626' },
  '피곤해.': { emoji: '🥱', sub: '🔋', bgFrom: '#F5F3FF', bgTo: '#EDE9FE', accent: '#7C3AED' },

  // 298..497: Từ vựng NIKL tiêu biểu
  '사람': { emoji: '🧑', sub: '👥', bgFrom: '#FDF2F8', bgTo: '#FCE7F3', accent: '#EC4899' },
  '우리': { emoji: '👨‍👩‍👧‍👦', sub: '🤝', bgFrom: '#FDF2F8', bgTo: '#FCE7F3', accent: '#EC4899' },
  '나': { emoji: '🙋', sub: '✨', bgFrom: '#EEF2FF', bgTo: '#E0E7FF', accent: '#4F46E5' },
  '저': { emoji: '🙇', sub: '✨', bgFrom: '#EEF2FF', bgTo: '#E0E7FF', accent: '#4F46E5' },
  '너': { emoji: '👉', sub: '😊', bgFrom: '#EEF2FF', bgTo: '#E0E7FF', accent: '#4F46E5' },
  '그녀': { emoji: '👩', sub: '✨', bgFrom: '#FDF2F8', bgTo: '#FCE7F3', accent: '#EC4899' },
  '여자': { emoji: '👩', sub: '🌸', bgFrom: '#FDF2F8', bgTo: '#FCE7F3', accent: '#EC4899' },
  '여성': { emoji: '👩‍💼', sub: '🌷', bgFrom: '#FDF2F8', bgTo: '#FCE7F3', accent: '#EC4899' },
  '남자': { emoji: '👨', sub: '👔', bgFrom: '#EFF6FF', bgTo: '#DBEAFE', accent: '#2563EB' },
  '아버지': { emoji: '👨‍🦳', sub: '🏠', bgFrom: '#EFF6FF', bgTo: '#DBEAFE', accent: '#1D4ED8' },
  '친구': { emoji: '🧑‍🤝‍🧑', sub: '💬', bgFrom: '#FDF2F8', bgTo: '#FCE7F3', accent: '#EC4899' },
  '인간': { emoji: '🧍', sub: '🌏', bgFrom: '#FDF2F8', bgTo: '#FCE7F3', accent: '#DB2777' },
  '자신': { emoji: '🪞', sub: '✨', bgFrom: '#F5F3FF', bgTo: '#EDE9FE', accent: '#7C3AED' },
  '마음': { emoji: '💖', sub: '💭', bgFrom: '#FFF1F2', bgTo: '#FFE4E6', accent: '#E11D48' },
  '몸': { emoji: '🧘', sub: '💪', bgFrom: '#FEF2F2', bgTo: '#FEE2E2', accent: '#EF4444' },
  '얼굴': { emoji: '😊', sub: '✨', bgFrom: '#FFF7ED', bgTo: '#FFEDD5', accent: '#EA580C' },
  '눈': { emoji: '👁️', sub: '❄️', bgFrom: '#F0F9FF', bgTo: '#E0F2FE', accent: '#0284C7' },
  '손': { emoji: '🖐️', sub: '🤝', bgFrom: '#FFF7ED', bgTo: '#FFEDD5', accent: '#EA580C' },
  '집': { emoji: '🏠', sub: '🌳', bgFrom: '#ECFDF5', bgTo: '#D1FAE5', accent: '#059669' },
  '학교': { emoji: '🏫', sub: '🔔', bgFrom: '#EFF6FF', bgTo: '#DBEAFE', accent: '#2563EB' },
  '교육': { emoji: '🎓', sub: '📘', bgFrom: '#EFF6FF', bgTo: '#DBEAFE', accent: '#2563EB' },
  '문제': { emoji: '📝', sub: '❓', bgFrom: '#EFF6FF', bgTo: '#DBEAFE', accent: '#2563EB' },
  '생각': { emoji: '💡', sub: '💭', bgFrom: '#FFFBEB', bgTo: '#FEF3C7', accent: '#D97706' },
  '생각하다': { emoji: '🤔', sub: '💡', bgFrom: '#FFFBEB', bgTo: '#FEF3C7', accent: '#D97706' },
  '알다': { emoji: '💡', sub: '✅', bgFrom: '#ECFDF5', bgTo: '#D1FAE5', accent: '#059669' },
  '모르다': { emoji: '❓', sub: '🤷', bgFrom: '#F8FAFC', bgTo: '#E2E8F0', accent: '#64748B' },
  '보다': { emoji: '👀', sub: '🔭', bgFrom: '#EFF6FF', bgTo: '#DBEAFE', accent: '#2563EB' },
  '보이다': { emoji: '👁️', sub: '✨', bgFrom: '#EFF6FF', bgTo: '#DBEAFE', accent: '#2563EB' },
  '듣다': { emoji: '🎧', sub: '👂', bgFrom: '#EFF6FF', bgTo: '#DBEAFE', accent: '#2563EB' },
  '말': { emoji: '💬', sub: '🗣️', bgFrom: '#EEF2FF', bgTo: '#E0E7FF', accent: '#4F46E5' },
  '말하다': { emoji: '🗣️', sub: '💬', bgFrom: '#EEF2FF', bgTo: '#E0E7FF', accent: '#4F46E5' },
  '이야기': { emoji: '📖', sub: '💬', bgFrom: '#EEF2FF', bgTo: '#E0E7FF', accent: '#4F46E5' },
  '소리': { emoji: '🔊', sub: '🎶', bgFrom: '#EFF6FF', bgTo: '#DBEAFE', accent: '#2563EB' },
  '일': { emoji: '💼', sub: '📅', bgFrom: '#F5F3FF', bgTo: '#EDE9FE', accent: '#7C3AED' },
  '사회': { emoji: '🏙️', sub: '👥', bgFrom: '#F8FAFC', bgTo: '#E2E8F0', accent: '#475569' },
  '문화': { emoji: '🎎', sub: '🎨', bgFrom: '#FDF2F8', bgTo: '#FCE7F3', accent: '#EC4899' },
  '예술': { emoji: '🎨', sub: '🎭', bgFrom: '#FDF4FF', bgTo: '#F5D0FE', accent: '#C026D3' },
  '경제': { emoji: '📈', sub: '💹', bgFrom: '#ECFDF5', bgTo: '#D1FAE5', accent: '#059669' },
  '돈': { emoji: '💵', sub: '🪙', bgFrom: '#ECFDF5', bgTo: '#D1FAE5', accent: '#059669' },
  '원': { emoji: '💴', sub: '🇰🇷', bgFrom: '#ECFDF5', bgTo: '#D1FAE5', accent: '#059669' },
  '사다': { emoji: '🛒', sub: '🛍️', bgFrom: '#ECFDF5', bgTo: '#D1FAE5', accent: '#059669' },
  '대통령': { emoji: '🏛️', sub: '🎙️', bgFrom: '#EFF6FF', bgTo: '#DBEAFE', accent: '#1D4ED8' },
  '정부': { emoji: '🏛️', sub: '⚖️', bgFrom: '#F8FAFC', bgTo: '#E2E8F0', accent: '#475569' },
  '국가': { emoji: '🏳️', sub: '🗺️', bgFrom: '#ECFEFF', bgTo: '#CFFAFE', accent: '#0891B2' },
  '우리나라': { emoji: '🇰🇷', sub: '🗺️', bgFrom: '#EFF6FF', bgTo: '#DBEAFE', accent: '#2563EB' },
  '지역': { emoji: '📍', sub: '🗺️', bgFrom: '#ECFEFF', bgTo: '#CFFAFE', accent: '#0891B2' },
  '길': { emoji: '🛣️', sub: '🧭', bgFrom: '#ECFEFF', bgTo: '#CFFAFE', accent: '#0891B2' },
  '곳': { emoji: '📍', sub: '🏞️', bgFrom: '#ECFEFF', bgTo: '#CFFAFE', accent: '#0891B2' },
  '여기': { emoji: '📍', sub: '👇', bgFrom: '#ECFEFF', bgTo: '#CFFAFE', accent: '#0891B2' },
  '어디': { emoji: '🧭', sub: '❓', bgFrom: '#ECFEFF', bgTo: '#CFFAFE', accent: '#0891B2' },
  '앞': { emoji: '⬆️', sub: '🧭', bgFrom: '#ECFEFF', bgTo: '#CFFAFE', accent: '#0891B2' },
  '뒤': { emoji: '⬇️', sub: '🧭', bgFrom: '#ECFEFF', bgTo: '#CFFAFE', accent: '#0891B2' },
  '안': { emoji: '📥', sub: '🏠', bgFrom: '#EFF6FF', bgTo: '#DBEAFE', accent: '#2563EB' },
  '속': { emoji: '📦', sub: '✨', bgFrom: '#EFF6FF', bgTo: '#DBEAFE', accent: '#2563EB' },
  '가다': { emoji: '🚶', sub: '➡️', bgFrom: '#ECFEFF', bgTo: '#CFFAFE', accent: '#0891B2' },
  '오다': { emoji: '🚶‍♀️', sub: '⬅️', bgFrom: '#ECFEFF', bgTo: '#CFFAFE', accent: '#0891B2' },
  '나오다': { emoji: '🚪', sub: '🚶', bgFrom: '#ECFEFF', bgTo: '#CFFAFE', accent: '#0891B2' },
  '나가다': { emoji: '🚪', sub: '➡️', bgFrom: '#ECFEFF', bgTo: '#CFFAFE', accent: '#0891B2' },
  '들어가다': { emoji: '🚪', sub: '📥', bgFrom: '#ECFEFF', bgTo: '#CFFAFE', accent: '#0891B2' },
  '지나다': { emoji: '⏳', sub: '🚶', bgFrom: '#FFFBEB', bgTo: '#FEF3C7', accent: '#D97706' },
  '운동': { emoji: '🏋️', sub: '🏃', bgFrom: '#FEF2F2', bgTo: '#FEE2E2', accent: '#EF4444' },
  '살다': { emoji: '🏡', sub: '🌱', bgFrom: '#ECFDF5', bgTo: '#D1FAE5', accent: '#059669' },
  '삶': { emoji: '🌱', sub: '☀️', bgFrom: '#ECFDF5', bgTo: '#D1FAE5', accent: '#059669' },
  '생활': { emoji: '🏡', sub: '☕', bgFrom: '#FFFBEB', bgTo: '#FEF3C7', accent: '#D97706' },
  '시간': { emoji: '⏰', sub: '⏳', bgFrom: '#FFFBEB', bgTo: '#FEF3C7', accent: '#D97706' },
  '시': { emoji: '🕐', sub: '⌚', bgFrom: '#FFFBEB', bgTo: '#FEF3C7', accent: '#D97706' },
  '년': { emoji: '📅', sub: '🗓️', bgFrom: '#FFFBEB', bgTo: '#FEF3C7', accent: '#D97706' },
  '날': { emoji: '☀️', sub: '📅', bgFrom: '#FFFBEB', bgTo: '#FEF3C7', accent: '#D97706' },
  '때': { emoji: '⏳', sub: '⌚', bgFrom: '#FFFBEB', bgTo: '#FEF3C7', accent: '#D97706' },
  '그때': { emoji: '🕰️', sub: '💭', bgFrom: '#FFFBEB', bgTo: '#FEF3C7', accent: '#D97706' },
  '지금': { emoji: '⏱️', sub: '📍', bgFrom: '#FFFBEB', bgTo: '#FEF3C7', accent: '#D97706' },
  '시대': { emoji: '🏛️', sub: '⏳', bgFrom: '#FFFBEB', bgTo: '#FEF3C7', accent: '#D97706' },
  '전': { emoji: '⏪', sub: '⏳', bgFrom: '#FFFBEB', bgTo: '#FEF3C7', accent: '#D97706' },
  '후': { emoji: '⏩', sub: '⏳', bgFrom: '#FFFBEB', bgTo: '#FEF3C7', accent: '#D97706' },
  '다음': { emoji: '⏭️', sub: '➡️', bgFrom: '#EFF6FF', bgTo: '#DBEAFE', accent: '#2563EB' },
  '처음': { emoji: '1️⃣', sub: '🌱', bgFrom: '#ECFDF5', bgTo: '#D1FAE5', accent: '#059669' },
  '이번': { emoji: '📌', sub: '📅', bgFrom: '#FFFBEB', bgTo: '#FEF3C7', accent: '#D97706' },
  '번': { emoji: '🔢', sub: '🔁', bgFrom: '#FFFBEB', bgTo: '#FEF3C7', accent: '#D97706' },
  '하나': { emoji: '1️⃣', sub: '☝️', bgFrom: '#FFFBEB', bgTo: '#FEF3C7', accent: '#D97706' },
  '한': { emoji: '1️⃣', sub: '✨', bgFrom: '#FFFBEB', bgTo: '#FEF3C7', accent: '#D97706' },
  '두': { emoji: '2️⃣', sub: '✌️', bgFrom: '#FFFBEB', bgTo: '#FEF3C7', accent: '#D97706' },
  '퍼센트': { emoji: '📊', sub: '💯', bgFrom: '#ECFDF5', bgTo: '#D1FAE5', accent: '#059669' },
  '만나다': { emoji: '🤝', sub: '☕', bgFrom: '#FDF2F8', bgTo: '#FCE7F3', accent: '#EC4899' },
  '관계': { emoji: '🤝', sub: '🔗', bgFrom: '#EEF2FF', bgTo: '#E0E7FF', accent: '#4F46E5' },
  '사이': { emoji: '↔️', sub: '🤝', bgFrom: '#EEF2FF', bgTo: '#E0E7FF', accent: '#4F46E5' },
  '함께': { emoji: '🧑‍🤝‍🧑', sub: '✨', bgFrom: '#FDF2F8', bgTo: '#FCE7F3', accent: '#EC4899' },
  '같이': { emoji: '👯', sub: '💛', bgFrom: '#FDF2F8', bgTo: '#FCE7F3', accent: '#EC4899' },
  '주다': { emoji: '🎁', sub: '🤲', bgFrom: '#FFF1F2', bgTo: '#FFE4E6', accent: '#E11D48' },
  '받다': { emoji: '🤲', sub: '📩', bgFrom: '#ECFDF5', bgTo: '#D1FAE5', accent: '#059669' },
  '만들다': { emoji: '🛠️', sub: '✨', bgFrom: '#FFF7ED', bgTo: '#FFEDD5', accent: '#EA580C' },
  '시작하다': { emoji: '🏁', sub: '🚀', bgFrom: '#EFF6FF', bgTo: '#DBEAFE', accent: '#2563EB' },
  '찾다': { emoji: '🔍', sub: '💡', bgFrom: '#FFFBEB', bgTo: '#FEF3C7', accent: '#D97706' },
  '잡다': { emoji: '✊', sub: '🎯', bgFrom: '#FEF2F2', bgTo: '#FEE2E2', accent: '#EF4444' },
  '앉다': { emoji: '🪑', sub: '🧘', bgFrom: '#FFFBEB', bgTo: '#FEF3C7', accent: '#D97706' },
  '서다': { emoji: '🧍', sub: '⬆️', bgFrom: '#EFF6FF', bgTo: '#DBEAFE', accent: '#2563EB' },
  '들다': { emoji: '👜', sub: '🙌', bgFrom: '#ECFDF5', bgTo: '#D1FAE5', accent: '#059669' },
  '가지다': { emoji: '🤲', sub: '✨', bgFrom: '#ECFDF5', bgTo: '#D1FAE5', accent: '#059669' },
  '갖다': { emoji: '🎒', sub: '✨', bgFrom: '#ECFDF5', bgTo: '#D1FAE5', accent: '#059669' },
  '좋다': { emoji: '👍', sub: '🌟', bgFrom: '#ECFDF5', bgTo: '#D1FAE5', accent: '#059669' },
  '크다': { emoji: '🐘', sub: '⬆️', bgFrom: '#EFF6FF', bgTo: '#DBEAFE', accent: '#2563EB' },
  '많다': { emoji: '📚', sub: '✨', bgFrom: '#EFF6FF', bgTo: '#DBEAFE', accent: '#2563EB' },
  '많이': { emoji: '🌟', sub: '📈', bgFrom: '#ECFDF5', bgTo: '#D1FAE5', accent: '#059669' },
  '새롭다': { emoji: '✨', sub: '🌱', bgFrom: '#ECFDF5', bgTo: '#D1FAE5', accent: '#059669' },
  '다르다': { emoji: '🔀', sub: '🎨', bgFrom: '#F5F3FF', bgTo: '#EDE9FE', accent: '#7C3AED' },
  '같다': { emoji: '🟰', sub: '🤝', bgFrom: '#EEF2FF', bgTo: '#E0E7FF', accent: '#4F46E5' },
}

export function getVocabVisualInfo(
  ko: string,
  meaning: string,
  topicCode?: string,
  topicId?: number,
  customImageUrl?: string | null,
): VocabVisualInfo {
  const cleanKo = ko.trim()
  const imgUrl = customImageUrl && customImageUrl.trim() ? customImageUrl.trim() : null
  const exact = EXACT_VOCAB_EMOJI_MAP[cleanKo]
  if (exact) {
    return {
      emoji: exact.emoji,
      subEmoji: exact.sub,
      bgFrom: exact.bgFrom,
      bgTo: exact.bgTo,
      accent: exact.accent,
      caption: exact.caption || meaning.split(',')[0].split('/')[0].trim(),
      imageUrl: imgUrl,
    }
  }

  // Phân tích theo nghĩa tiếng Việt nếu là từ vựng mở rộng hoặc Admin thêm mới
  const m = meaning.toLowerCase()
  if (m.includes('mẹ') || m.includes('bố') || m.includes('anh') || m.includes('chị') || m.includes('em') || m.includes('gia đình')) {
    return { emoji: '👨‍👩‍👧', subEmoji: '💖', bgFrom: '#FDF2F8', bgTo: '#FCE7F3', accent: '#EC4899', caption: meaning.split(',')[0], imageUrl: imgUrl }
  }
  if (m.includes('trường') || m.includes('học') || m.includes('sách') || m.includes('giáo')) {
    return { emoji: '📚', subEmoji: '🎓', bgFrom: '#EFF6FF', bgTo: '#DBEAFE', accent: '#2563EB', caption: meaning.split(',')[0], imageUrl: imgUrl }
  }
  if (m.includes('ăn') || m.includes('uống') || m.includes('món') || m.includes('cơm') || m.includes('nước') || m.includes('quả')) {
    return { emoji: '🍱', subEmoji: '🥢', bgFrom: '#FFF7ED', bgTo: '#FFEDD5', accent: '#EA580C', caption: meaning.split(',')[0], imageUrl: imgUrl }
  }
  if (m.includes('đi') || m.includes('đến') || m.includes('đường') || m.includes('nơi') || m.includes('du lịch')) {
    return { emoji: '🧭', subEmoji: '✈️', bgFrom: '#ECFEFF', bgTo: '#CFFAFE', accent: '#0891B2', caption: meaning.split(',')[0], imageUrl: imgUrl }
  }
  if (m.includes('tiền') || m.includes('mua') || m.includes('giá') || m.includes('cửa hàng')) {
    return { emoji: '🛍️', subEmoji: '🪙', bgFrom: '#ECFDF5', bgTo: '#D1FAE5', accent: '#059669', caption: meaning.split(',')[0], imageUrl: imgUrl }
  }
  if (m.includes('việc') || m.includes('công ty') || m.includes('nghề')) {
    return { emoji: '💼', subEmoji: '🏢', bgFrom: '#F5F3FF', bgTo: '#EDE9FE', accent: '#7C3AED', caption: meaning.split(',')[0], imageUrl: imgUrl }
  }
  if (m.includes('cơ thể') || m.includes('tay') || m.includes('mắt') || m.includes('chạy') || m.includes('đau') || m.includes('khỏe')) {
    return { emoji: '🏃', subEmoji: '💪', bgFrom: '#FEF2F2', bgTo: '#FEE2E2', accent: '#EF4444', caption: meaning.split(',')[0], imageUrl: imgUrl }
  }
  if (m.includes('ngày') || m.includes('giờ') || m.includes('năm') || m.includes('lần') || m.includes('số') || m.includes('thời gian')) {
    return { emoji: '⏰', subEmoji: '📅', bgFrom: '#FFFBEB', bgTo: '#FEF3C7', accent: '#D97706', caption: meaning.split(',')[0], imageUrl: imgUrl }
  }
  if (m.includes('cây') || m.includes('hoa') || m.includes('biển') || m.includes('con ') || m.includes('thời tiết')) {
    return { emoji: '🌿', subEmoji: '🌸', bgFrom: '#F0FDFA', bgTo: '#CCFBF1', accent: '#0D9488', caption: meaning.split(',')[0], imageUrl: imgUrl }
  }

  const theme = getTopicIllustrationTheme(topicCode, topicId)
  return {
    emoji: theme.emojiMain,
    subEmoji: theme.emojiAccents[0],
    bgFrom: theme.gradientFrom,
    bgTo: theme.gradientVia,
    accent: theme.accentColor,
    caption: meaning.split(',')[0].split('/')[0].trim(),
    imageUrl: imgUrl,
  }
}
