export type DatasetCategory = 'common' | 'grammar' | 'topik1' | 'surname'

export interface HangulCharDatasetItem {
  char: string
  folder: string
  unicode: string
  roman: string
  meaning: string
  category: DatasetCategory
  strokes: number
  sampleCount: number
  augmentedCount: number
  jamo: {
    choseong: string
    jungseong: string
    jongseong?: string
  }
  tip: string
  datasetClassId: string
}

const CHOSEONG = [
  'ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ',
  'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ',
]
const JUNGSEONG = [
  'ㅏ', 'ㅐ', 'ㅑ', 'ㅒ', 'ㅓ', 'ㅔ', 'ㅕ', 'ㅖ', 'ㅗ', 'ㅘ',
  'ㅙ', 'ㅚ', 'ㅛ', 'ㅜ', 'ㅝ', 'ㅞ', 'ㅟ', 'ㅠ', 'ㅡ', 'ㅢ', 'ㅣ',
]
const JONGSEONG = [
  '', 'ㄱ', 'ㄲ', 'ㄳ', 'ㄴ', 'ㄵ', 'ㄶ', 'ㄷ', 'ㄹ', 'ㄺ', 'ㄻ',
  'ㄼ', 'ㄽ', 'ㄾ', 'ㄿ', 'ㅀ', 'ㅁ', 'ㅂ', 'ㅄ', 'ㅅ', 'ㅆ', 'ㅇ',
  'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ',
]

export function decomposeHangul(char: string): {
  choseong: string
  jungseong: string
  jongseong?: string
} | null {
  const code = char.charCodeAt(0)
  if (code < 0xac00 || code > 0xd7a3) return null
  const offset = code - 0xac00
  const jong = offset % 28
  const jung = ((offset - jong) / 28) % 21
  const cho = Math.floor((offset - jong) / 28 / 21)
  return {
    choseong: CHOSEONG[cho],
    jungseong: JUNGSEONG[jung],
    jongseong: JONGSEONG[jong] || undefined,
  }
}

interface RawClassDef {
  folder: string
  char: string
  roman: string
  meaning: string
  category: DatasetCategory
  strokes: number
}

/**
 * Toàn bộ 64 lớp âm tiết trong bộ dữ liệu Kaggle `jkim289/handwritten-korean-characters`
 * (60 âm tiết tần suất cao nhất theo GS. Kang Seung-sik + 4 họ phổ biến nhất Hàn Quốc: 김, 이, 박, 최)
 * Tổng cộng: 6.400 ảnh gốc (100 mẫu/lớp) & 128.000 ảnh mở rộng (2.000 mẫu/lớp)
 */
const RAW_CLASSES: RawClassDef[] = [
  { folder: 'ga', char: '가', roman: 'ga', meaning: 'Đi (가다) / Tiểu từ chủ ngữ', category: 'grammar', strokes: 4 },
  { folder: 'geos', char: '것', roman: 'geot', meaning: 'Cái, thứ, điều (Danh từ phụ thuộc)', category: 'grammar', strokes: 6 },
  { folder: 'geu', char: '그', roman: 'geu', meaning: 'Đó, ấy, anh ấy (그 사람)', category: 'common', strokes: 3 },
  { folder: 'gi', char: '기', roman: 'gi', meaning: 'Hậu tố danh từ hóa (-기) / Khí, kỳ', category: 'grammar', strokes: 3 },
  { folder: 'gim', char: '김', roman: 'kim', meaning: 'Họ Kim (김) / Rong biển', category: 'surname', strokes: 6 },
  { folder: 'go', char: '고', roman: 'go', meaning: 'Liên từ nối "và" (-고) / Cao', category: 'grammar', strokes: 4 },
  { folder: 'gong', char: '공', roman: 'gong', meaning: 'Số 0 / Quả bóng / Học tập (공부)', category: 'topik1', strokes: 5 },
  { folder: 'gu', char: '구', roman: 'gu', meaning: 'Số 9 (구) / Bạn bè (친구) / Quận', category: 'topik1', strokes: 4 },
  { folder: 'guk', char: '국', roman: 'guk', meaning: 'Quốc gia (한국) / Canh, súp', category: 'topik1', strokes: 6 },
  { folder: 'gwa', char: '과', roman: 'gwa', meaning: 'Và, với (Tiểu từ) / Khoa, bài học', category: 'grammar', strokes: 6 },
  { folder: 'gye', char: '계', roman: 'gye', meaning: 'Kế hoạch (계획) / Mùa (계절)', category: 'topik1', strokes: 5 },
  { folder: 'gyeong', char: '경', roman: 'gyeong', meaning: 'Kinh tế (경제) / Phong cảnh (경치)', category: 'topik1', strokes: 6 },
  { folder: 'na', char: '나', roman: 'na', meaning: 'Tôi, tớ (Đại từ ngôi thứ nhất)', category: 'common', strokes: 4 },
  { folder: 'neun', char: '는', roman: 'neun', meaning: 'Tiểu từ chủ đề (-는)', category: 'grammar', strokes: 5 },
  { folder: 'da', char: '다', roman: 'da', meaning: 'Tất cả / Đuôi kết thúc câu nguyên thể (-다)', category: 'grammar', strokes: 5 },
  { folder: 'dae', char: '대', roman: 'dae', meaning: 'Đại học (대학교) / To lớn', category: 'topik1', strokes: 6 },
  { folder: 'deul', char: '들', roman: 'deul', meaning: 'Hậu tố chỉ số nhiều (-들)', category: 'grammar', strokes: 7 },
  { folder: 'do', char: '도', roman: 'do', meaning: 'Cũng (Tiểu từ -도) / Đảo, tỉnh', category: 'grammar', strokes: 5 },
  { folder: 'dong', char: '동', roman: 'dong', meaning: 'Phía đông / Phường (동) / Động vật', category: 'topik1', strokes: 6 },
  { folder: 'ra', char: '라', roman: 'ra', meaning: 'Đất nước (나라) / Radio', category: 'common', strokes: 5 },
  { folder: 'reul', char: '를', roman: 'reul', meaning: 'Tiểu từ tân ngữ (-를)', category: 'grammar', strokes: 7 },
  { folder: 'ri', char: '리', roman: 'ri', meaning: 'Chúng tôi (우리) / Lý do, nấu ăn (요리)', category: 'common', strokes: 4 },
  { folder: 'ro', char: '로', roman: 'ro', meaning: 'Bằng, hướng về (Tiểu từ chỉ phương hướng/cách thức)', category: 'grammar', strokes: 5 },
  { folder: 'bak', char: '박', roman: 'park', meaning: 'Họ Park (박) / Bảo tàng (박물관)', category: 'surname', strokes: 8 },
  { folder: 'bo', char: '보', roman: 'bo', meaning: 'Nhìn, xem (보다)', category: 'common', strokes: 6 },
  { folder: 'bu', char: '부', roman: 'bu', meaning: 'Học tập (공부) / Bố mẹ (부모님)', category: 'topik1', strokes: 6 },
  { folder: 'sa', char: '사', roman: 'sa', meaning: 'Số 4 / Người (사람) / Tình yêu (사랑)', category: 'common', strokes: 4 },
  { folder: 'sang', char: '상', roman: 'sang', meaning: 'Trên / Bàn (책상) / Giải thưởng', category: 'topik1', strokes: 5 },
  { folder: 'seo', char: '서', roman: 'seo', meaning: 'Ở, tại (에서) / Seoul (서울) / Phía tây', category: 'common', strokes: 4 },
  { folder: 'seong', char: '성', roman: 'seong', meaning: 'Thành công (성공) / Tính cách / Họ tên', category: 'topik1', strokes: 5 },
  { folder: 'seu', char: '스', roman: 'seu', meaning: 'Xe buýt (버스) / Thể thao (스포츠)', category: 'common', strokes: 3 },
  { folder: 'si', char: '시', roman: 'si', meaning: 'Giờ (시간) / Thành phố (도시) / Bắt đầu', category: 'common', strokes: 3 },
  { folder: 'so', char: '소', roman: 'so', meaning: 'Địa điểm (장소) / Âm thanh (소리) / Con bò', category: 'topik1', strokes: 4 },
  { folder: 'su', char: '수', roman: 'su', meaning: 'Nước (수) / Thứ Tư (수요일) / Khả năng (-ㄹ 수 있다)', category: 'common', strokes: 4 },
  { folder: 'a', char: '아', roman: 'a', meaning: 'Em bé (아이) / Buổi sáng (아침)', category: 'common', strokes: 3 },
  { folder: 'eo', char: '어', roman: 'eo', meaning: 'Ngôn ngữ (한국어) / Đâu (어디)', category: 'common', strokes: 3 },
  { folder: 'e', char: '에', roman: 'e', meaning: 'Ở, vào lúc, đến (Tiểu từ vị trí/thời gian -에)', category: 'grammar', strokes: 4 },
  { folder: 'yeo', char: '여', roman: 'yeo', meaning: 'Du lịch (여행) / Phụ nữ (여자) / Ở đây (여기)', category: 'common', strokes: 4 },
  { folder: 'yeon', char: '연', roman: 'yeon', meaning: 'Luyện tập (연습) / Liên lạc (연락)', category: 'topik1', strokes: 6 },
  { folder: 'yong', char: '용', roman: 'yong', meaning: 'Sử dụng (사용) / Nội dung (내용)', category: 'topik1', strokes: 5 },
  { folder: 'won', char: '원', roman: 'won', meaning: 'Đồng Won (원) / Nhân viên (회사원) / Công viên', category: 'topik1', strokes: 7 },
  { folder: 'wi', char: '위', roman: 'wi', meaning: 'Phía trên (위) / Vì (위하다)', category: 'common', strokes: 5 },
  { folder: 'eu', char: '으', roman: 'eu', meaning: 'Thức ăn (음식) / Ngân hàng (은행)', category: 'common', strokes: 2 },
  { folder: 'eui', char: '의', roman: 'ui', meaning: 'Của (Tiểu từ sở hữu -의) / Bác sĩ (의사)', category: 'grammar', strokes: 3 },
  { folder: 'eun', char: '은', roman: 'eun', meaning: 'Tiểu từ chủ đề (-은) / Bạc', category: 'grammar', strokes: 4 },
  { folder: 'eul', char: '을', roman: 'eul', meaning: 'Tiểu từ tân ngữ (-을)', category: 'grammar', strokes: 5 },
  { folder: 'i', char: '이', roman: 'i', meaning: 'Họ Lee (이) / Số 2 / Này (이것) / Tiểu từ (-이)', category: 'surname', strokes: 2 },
  { folder: 'in', char: '인', roman: 'in', meaning: 'Người (한국인) / Lời chào (인사)', category: 'topik1', strokes: 4 },
  { folder: 'il', char: '일', roman: 'il', meaning: 'Số 1 / Ngày (일) / Công việc (일하다)', category: 'common', strokes: 5 },
  { folder: 'iss', char: '있', roman: 'it', meaning: 'Có, ở (있다)', category: 'common', strokes: 6 },
  { folder: 'ja', char: '자', roman: 'ja', meaning: 'Đàn ông (남자) / Tự động / Ngủ (자다)', category: 'common', strokes: 4 },
  { folder: 'jang', char: '장', roman: 'jang', meaning: 'Nơi chốn (장소) / Giám đốc (사장님) / Chợ (시장)', category: 'topik1', strokes: 5 },
  { folder: 'je', char: '제', roman: 'je', meaning: 'Của tôi (제 - kính ngữ) / Hôm qua (어제) / Vấn đề', category: 'common', strokes: 5 },
  { folder: 'jeok', char: '적', roman: 'jeok', meaning: 'Mang tính chất (-적) / Kinh nghiệm (-ㄴ 적이 있다)', category: 'topik1', strokes: 6 },
  { folder: 'jeon', char: '전', roman: 'jeon', meaning: 'Trước (전) / Điện thoại (전화) / Toàn bộ', category: 'topik1', strokes: 6 },
  { folder: 'jeong', char: '정', roman: 'jeong', meaning: 'Tình cảm (정) / Thông tin (정보) / Thật sự (정말)', category: 'topik1', strokes: 5 },
  { folder: 'jo', char: '조', roman: 'jo', meaning: 'Một chút (조금) / Buổi sáng / Điều kiện', category: 'common', strokes: 4 },
  { folder: 'ju', char: '주', roman: 'ju', meaning: 'Tuần (주말 - cuối tuần) / Cho, tặng (주다)', category: 'common', strokes: 4 },
  { folder: 'ji', char: '지', roman: 'ji', meaning: 'Không (-지 않다) / Bây giờ (지금)', category: 'grammar', strokes: 3 },
  { folder: 'choe', char: '최', roman: 'choi', meaning: 'Họ Choi (최) / Tối đa, nhất (최고)', category: 'surname', strokes: 6 },
  { folder: 'ha', char: '하', roman: 'ha', meaning: 'Làm (하다) / Số 1 (하나) / Mùa hè', category: 'common', strokes: 5 },
  { folder: 'hae', char: '해', roman: 'hae', meaning: 'Làm, yêu (사랑해) / Mặt trời, năm (올해)', category: 'common', strokes: 6 },
  { folder: 'han', char: '한', roman: 'han', meaning: 'Hàn Quốc (한국) / Một (한 개)', category: 'topik1', strokes: 7 },
  { folder: 'hwa', char: '화', roman: 'hwa', meaning: 'Văn hóa (문화) / Hội thoại (대화) / Thứ Ba (화요일)', category: 'topik1', strokes: 7 },
]

export const KOREAN_HANDWRITING_DATASET: HangulCharDatasetItem[] = RAW_CLASSES.map((raw, index) => {
  const jamo = decomposeHangul(raw.char) ?? { choseong: raw.char, jungseong: '' }
  const codeHex = raw.char.charCodeAt(0).toString(16).toUpperCase().padStart(4, '0')
  return {
    ...raw,
    unicode: `U+${codeHex}`,
    sampleCount: 100,
    augmentedCount: 2000,
    jamo,
    tip: jamo.jongseong
      ? `Cấu trúc 3 phần: viết phụ âm đầu "${jamo.choseong}" và nguyên âm "${jamo.jungseong}" ở 2/3 trên, đặt phụ âm cuối (batchim) "${jamo.jongseong}" cân đối ở 1/3 dưới.`
      : `Cấu trúc 2 phần: căn chỉnh phụ âm đầu "${jamo.choseong}" và nguyên âm "${jamo.jungseong}" cân đối quanh tâm giao điểm đường gióng.`,
    datasetClassId: `KANG_${String(index + 1).padStart(2, '0')}_${raw.folder.toUpperCase()}`,
  }
})

export function getDatasetItemForChar(char: string): HangulCharDatasetItem {
  const found = KOREAN_HANDWRITING_DATASET.find((item) => item.char === char)
  if (found) return found

  const jamo = decomposeHangul(char) ?? { choseong: char, jungseong: '' }
  const codeHex = char.charCodeAt(0).toString(16).toUpperCase().padStart(4, '0')
  return {
    char,
    folder: '',
    unicode: `U+${codeHex}`,
    roman: '',
    meaning: 'Âm tiết tiếng Hàn mở rộng',
    category: 'topik1',
    strokes: jamo.jongseong ? 7 : 5,
    sampleCount: 0,
    augmentedCount: 0,
    jamo,
    tip: `Căn chỉnh phụ âm đầu (${jamo.choseong}) và nguyên âm (${jamo.jungseong})${jamo.jongseong ? ` cùng phụ âm cuối (${jamo.jongseong})` : ''} cân đối trong tâm ô vuông.`,
    datasetClassId: `EXT_${codeHex}`,
  }
}
