import fs from 'fs'
import path from 'path'
import { execFileSync } from 'child_process'

const SERVER = process.env.SQL_SERVER_INSTANCE || '.\\SQLEXPRESS'
const DB = process.env.SQL_SERVER_DATABASE || 'HangoDatasetDB'
const RAW_DIR = 'c:/Đồ án chuyên ngành/hango-app-project/data/sources'
const TEMP_SQL = 'c:/Đồ án chuyên ngành/hango-app-project/scripts/sql/seed_learning_path_generated.sql'

function esc(val) {
  if (val === null || val === undefined) return 'NULL'
  return `N'${String(val).replace(/'/g, "''")}'`
}

// 1. Đọc & làm sạch dữ liệu thực tế từ julienshim_combined_korean_vocabulary_list.tsv
const tsvPath = path.join(RAW_DIR, 'julienshim_combined_korean_vocabulary_list.tsv')
const tsvLines = fs.readFileSync(tsvPath, 'utf8').trim().split(/\r?\n/)
const rawTsvCount = tsvLines.length - 1

const posMap = {
  '명사': 'Danh từ',
  '동사': 'Động từ',
  '형용사': 'Tính từ',
  '부사': 'Phó từ',
  '대명사': 'Đại từ',
  '수사': 'Số từ',
  '관형사': 'Định từ',
  '감탄사': 'Thán từ',
  '조사': 'Tiểu từ',
  '접사': 'Phụ tố',
  '어미': 'Vĩ tố',
  '의존 명사': 'Danh từ phụ thuộc',
  '보조 동사': 'Trợ động từ',
  '보조 형용사': 'Trợ tính từ',
}

const seenWords = new Set()
const cleanedSeedVocab = []
let skippedInvalidOrAffix = 0
let skippedDuplicate = 0

for (let i = 1; i < tsvLines.length; i++) {
  const cols = tsvLines[i].split('\t')
  if (cols.length < 7) {
    skippedInvalidOrAffix++
    continue
  }
  const [rankStr, rawWord, posKo, hanja, explanationKo, niklLevel, topikLevelKo] = cols
  const cleanWord = rawWord.replace(/\d+$/, '').trim()
  if (!cleanWord || cleanWord.startsWith('-') || cleanWord.endsWith('-')) {
    skippedInvalidOrAffix++
    continue
  }
  const dedupKey = `${cleanWord}|${posKo}`
  if (seenWords.has(dedupKey)) {
    skippedDuplicate++
    continue
  }
  seenWords.add(dedupKey)
  cleanedSeedVocab.push({
    rank: rankStr ? parseInt(rankStr, 10) : null,
    ko: cleanWord,
    posKo: posKo.trim(),
    posVi: posMap[posKo.trim()] || posKo.trim() || 'Từ vựng',
    hanja: hanja ? hanja.trim() : null,
    explanationKo: explanationKo ? explanationKo.trim() : null,
    niklLevel: niklLevel ? niklLevel.trim() : null,
    topikLevel:
      topikLevelKo.trim() === '초급'
        ? 'TOPIK I'
        : topikLevelKo.trim() === '중급'
          ? 'TOPIK II'
          : niklLevel === 'A'
            ? 'TOPIK I'
            : 'TOPIK II',
  })
}

// 2. Đọc dữ liệu thực tế từ Tatoeba Korean-Vietnamese
const tatoebaPath = path.join(RAW_DIR, 'tatoeba_kor_vie_cleaned.json')
const tatoebaPairs = JSON.parse(fs.readFileSync(tatoebaPath, 'utf8'))

console.log(`[DATA CHECK] Julienshim TSV: total=${rawTsvCount}, validUnique=${cleanedSeedVocab.length}, skippedAffix=${skippedInvalidOrAffix}, skippedDup=${skippedDuplicate}`)
console.log(`[DATA CHECK] Tatoeba KOR-VIE cleaned pairs: ${tatoebaPairs.length}`)

// 3. Định nghĩa 9 buổi học Hangeul đầy đủ + các buổi học của 6 chặng TOPIK I & II
const hangeulLessons = [
  {
    code: 'HG_LESSON_01',
    num: 1,
    topicCode: 'TOPIC_HG_1',
    title: 'Nguyên âm cơ bản 1: ㅏ ㅑ ㅓ ㅕ ㅗ',
    subtitle: '5 nguyên âm đầu tiên và cách phát âm.',
    estimatedMinutes: 30,
    charCountLabel: '5 chữ',
    hasWarmup: false,
    hasWritingSheet: true,
    jamoCards: [
      { ko: 'ㅏ', roman: 'a', vi: '아 · Mở rộng miệng tự nhiên như âm "a" tiếng Việt' },
      { ko: 'ㅑ', roman: 'ya', vi: '야 · Phát âm nhanh từ "i" sang "a" -> "ya"' },
      { ko: 'ㅓ', roman: 'eo · ơ', vi: '어 · Mở miệng vừa phải, gần giống âm "ơ" tiếng Việt' },
      { ko: 'ㅕ', roman: 'yeo · yơ', vi: '여 · Phát âm nhanh từ "i" sang "ơ" -> "yeo / yơ"' },
      { ko: 'ㅗ', roman: 'o · ô (ngắn)', vi: '오 · Tròn môi, chu nhẹ môi về phía trước như âm "ô" ngắn' },
    ],
    objective: 'Nhận diện, phát âm chuẩn và viết đúng thứ tự nét 5 nguyên âm ㅏ, ㅑ, ㅓ, ㅕ, ㅗ; ghép được âm tiết với phụ âm ㅇ.',
    chars: ['가', '나', '다'],
    theoryMd: `### 1. Nguyên lý cấu tạo nguyên âm Hangeul
Bảng chữ cái **Hangeul (한글)** do vua Sejong sáng제 năm 1443 dựa trên 3 yếu tố triết học phương Đông:
- **ㆍ (Thiên - Bầu trời)**: Điểm tròn (nay viết thành nét gạch ngắn)
- **ㅡ (Địa - Mặt đất)**: Nét ngang phẳng
- **ㅣ (Nhân - Con người)**: Nét sổ thẳng đứng

### 2. Chi tiết 5 nguyên âm cơ bản 1
| Nguyên âm | Phiên âm | Khẩu hình & Cách phát âm | Ghép với ㅇ |
|---|---|---|---|
| **ㅏ** | **a** | Mở rộng miệng tự nhiên như âm "a" tiếng Việt | **아** (a) |
| **ㅑ** | **ya** | Phát âm nhanh từ "i" sang "a" -> "ya" | **야** (ya) |
| **ㅓ** | **eo** | Mở miệng vừa phải, lưỡi hơi lùi về sau (gần giống âm "ơ" pha "o") | **어** (eo) |
| **ㅕ** | **yeo** | Phát âm nhanh từ "i" sang "ơ" -> "yeo" | **여** (yeo) |
| **ㅗ** | **o** | Tròn môi, chu nhẹ môi về phía trước như âm "ô" | **오** (o) |

### 3. Quy tắc ghép chữ cơ bản
Nguyên âm không bao giờ đứng một mình thành âm tiết hoàn chỉnh. Khi đọc nguyên âm độc lập, bắt buộc thêm phụ âm câm **ㅇ** ở bên trái (` + '`ㅏ -> 아`' + `) hoặc ở phía trên (` + '`ㅗ -> 오`' + `).`,
    examples: [
      { ko: '아이', roman: 'a-i', vi: 'Em bé, đứa trẻ' },
      { ko: '오이', roman: 'o-i', vi: 'Quả dưa chuột' },
      { ko: '여우', roman: 'yeo-u', vi: 'Con cáo' },
    ],
    vocabs: [
      { code: 'VC_HG01_01', ko: '아이', roman: 'a-i', vi: 'Trẻ em, em bé', pos: 'Danh từ', exKo: '아이가 웃어요.', exVi: 'Em bé đang cười.' },
      { code: 'VC_HG01_02', ko: '오이', roman: 'o-i', vi: 'Dưa chuột (dưa leo)', pos: 'Danh từ', exKo: '오이를 먹어요.', exVi: 'Tôi ăn dưa chuột.' },
      { code: 'VC_HG01_03', ko: '야구', roman: 'ya-gu', vi: 'Môn bóng chày', pos: 'Danh từ', exKo: '야구를 좋아해요.', exVi: 'Tôi thích bóng chày.' },
      { code: 'VC_HG01_04', ko: '어머니', roman: 'eo-meo-ni', vi: 'Mẹ', pos: 'Danh từ', exKo: '우리 어머니예요.', exVi: 'Đây là mẹ của tôi.' },
    ],
    questions: [
      {
        code: 'Q_HG01_1',
        prompt: 'Nguyên âm nào sau đây được phát âm là "eo" (gần giống âm "ơ" tiếng Việt)?',
        highlight: 'ㅓ / ㅏ / ㅗ / ㅑ',
        explanation: 'ㅏ phát âm là "a", ㅑ là "ya", ㅓ là "eo" (ơ), ㅗ là "o" (ô).',
        options: [
          { label: 'A', text: 'ㅏ', correct: false },
          { label: 'B', text: 'ㅓ', correct: true },
          { label: 'C', text: 'ㅗ', correct: false },
          { label: 'D', text: 'ㅑ', correct: false },
        ],
      },
      {
        code: 'Q_HG01_2',
        prompt: 'Khi viết nguyên âm đứng (ㅏ, ㅑ, ㅓ, ㅕ) thành âm tiết độc lập, phụ âm câm ㅇ được đặt ở vị trí nào?',
        highlight: '아, 야, 어, 여',
        explanation: 'Với các nguyên âm có trục dọc chính (ㅏ, ㅑ, ㅓ, ㅕ), phụ âm đầu ㅇ được đặt ở phía bên trái.',
        options: [
          { label: 'A', text: 'Đặt ở phía bên trái nguyên âm', correct: true },
          { label: 'B', text: 'Đặt ở phía dưới nguyên âm', correct: false },
          { label: 'C', text: 'Đặt ở phía bên phải nguyên âm', correct: false },
          { label: 'D', text: 'Không cần viết phụ âm ㅇ', correct: false },
        ],
      },
      {
        code: 'Q_HG01_3',
        prompt: 'Từ tiếng Hàn "오이" có nghĩa tiếng Việt là gì?',
        highlight: '오이',
        explanation: '오이 (o-i) có nghĩa là quả dưa chuột (dưa leo).',
        options: [
          { label: 'A', text: 'Em bé', correct: false },
          { label: 'B', text: 'Quả dưa chuột', correct: true },
          { label: 'C', text: 'Mẹ', correct: false },
          { label: 'D', text: 'Bóng chày', correct: false },
        ],
      },
    ],
  },
  {
    code: 'HG_LESSON_02',
    num: 2,
    topicCode: 'TOPIC_HG_1',
    title: 'Nguyên âm cơ bản 2: ㅛ ㅜ ㅠ ㅡ ㅣ',
    subtitle: '5 nguyên âm đơn tiếp theo và cách ghép chữ ngang - dọc.',
    estimatedMinutes: 38,
    charCountLabel: '5 chữ',
    hasWarmup: true,
    hasWritingSheet: true,
    jamoCards: [
      { ko: 'ㅛ', roman: 'yo · yô', vi: '요 · Chu môi tròn phát âm nhanh từ "i" sang "ô" -> "yo"' },
      { ko: 'ㅜ', roman: 'u', vi: '우 · Chu môi tròn như âm "u" tiếng Việt' },
      { ko: 'ㅠ', roman: 'yu', vi: '유 · Phát âm nhanh từ "i" sang "u" -> "yu"' },
      { ko: 'ㅡ', roman: 'eu · ư', vi: '으 · Kéo nhẹ khóe miệng sang hai bên như âm "ư"' },
      { ko: 'ㅣ', roman: 'i', vi: '이 · Kéo miệng ngang như âm "i" tiếng Việt' },
    ],
    objective: 'Phát âm chuẩn và viết đúng 5 nguyên âm ㅛ, ㅜ, ㅠ, ㅡ, ㅣ; nắm vững quy tắc ghép chữ ngang và dọc với 10 nguyên âm cơ bản.',
    chars: ['구', '기', '고'],
    theoryMd: `### 1. Chi tiết 5 nguyên âm cơ bản 2
| Nguyên âm | Phiên âm | Khẩu hình & Cách phát âm | Ghép với ㅇ |
|---|---|---|---|
| **ㅛ** | **yo** | Chu môi tròn, phát âm nhanh từ "i" sang "ô" -> "yo" | **요** (yo) |
| **ㅜ** | **u** | Chu môi tròn như âm "u" tiếng Việt | **우** (u) |
| **ㅠ** | **yu** | Phát âm nhanh từ "i" sang "u" -> "yu" | **유** (yu) |
| **ㅡ** | **eu** | Kéo nhẹ khóe miệng sang hai bên, phát âm như âm "ư" | **으** (eu) |
| **ㅣ** | **i** | Kéo miệng ngang, phát âm như âm "i" tiếng Việt | **이** (i) |

### 2. Phân loại nguyên âm dọc và nguyên âm ngang
- **Nguyên âm dọc** (\`ㅏ, ㅑ, ㅓ, ㅕ, ㅣ\`): Phụ âm đứng **bên trái** (예: 아, 이).
- **Nguyên âm ngang** (\`ㅗ, ㅛ, ㅜ, ㅠ, ㅡ\`): Phụ âm đứng **phía trên** (예: 오, 우, 으).`,
    examples: [
      { ko: '우유', roman: 'u-yu', vi: 'Sữa tươi' },
      { ko: '이유', roman: 'i-yu', vi: 'Lý do' },
      { ko: '여유', roman: 'yeo-yu', vi: 'Sự thong thả, dư dả' },
    ],
    vocabs: [
      { code: 'VC_HG02_01', ko: '우유', roman: 'u-yu', vi: 'Sữa', pos: 'Danh từ', exKo: '아침에 우유를 마셔요.', exVi: 'Buổi sáng tôi uống sữa.' },
      { code: 'VC_HG02_02', ko: '이', roman: 'i', vi: 'Số 2 / Cái răng', pos: 'Danh từ', exKo: '이를 닦아요.', exVi: 'Tôi đánh răng.' },
      { code: 'VC_HG02_03', ko: '오리', roman: 'o-ri', vi: 'Con vịt', pos: 'Danh từ', exKo: '호수에 오리가 있어요.', exVi: 'Ở hồ có con vịt.' },
      { code: 'VC_HG02_04', ko: '요리', roman: 'yo-ri', vi: 'Món ăn, việc nấu ăn', pos: 'Danh từ', exKo: '한국 요리를 배워요.', exVi: 'Tôi học nấu món Hàn.' },
    ],
    questions: [
      {
        code: 'Q_HG02_1',
        prompt: 'Từ tiếng Hàn nào dưới đây có nghĩa là "Sữa" (ghép từ nguyên âm ㅜ và ㅠ)?',
        highlight: '우유',
        explanation: '우 (u) + 유 (yu) = 우유 (sữa).',
        options: [
          { label: 'A', text: '오이', correct: false },
          { label: 'B', text: '우유', correct: true },
          { label: 'C', text: '아이', correct: false },
          { label: 'D', text: '요리', correct: false },
        ],
      },
      {
        code: 'Q_HG02_2',
        prompt: 'Nhóm nguyên âm nào sau đây đều là nguyên âm ngang (phụ âm đặt phía trên)?',
        highlight: 'ㅗ, ㅛ, ㅜ, ㅠ, ㅡ',
        explanation: 'Các nguyên âm có trục ngang chính gồm ㅗ, ㅛ, ㅜ, ㅠ, ㅡ luôn đặt phụ âm đầu ở phía trên.',
        options: [
          { label: 'A', text: 'ㅗ, ㅛ, ㅜ, ㅠ, ㅡ', correct: true },
          { label: 'B', text: 'ㅏ, ㅑ, ㅓ, ㅕ, ㅣ', correct: false },
          { label: 'C', text: 'ㅏ, ㅗ, ㅜ, ㅣ', correct: false },
          { label: 'D', text: 'ㅓ, ㅕ, ㅡ, ㅣ', correct: false },
        ],
      },
      {
        code: 'Q_HG02_3',
        prompt: 'Nguyên âm "ㅡ" được phát âm tương ứng với âm nào trong tiếng Việt?',
        highlight: 'ㅡ (으)',
        explanation: 'ㅡ được phát âm là "eu", tương đương với âm "ư" trong tiếng Việt.',
        options: [
          { label: 'A', text: 'Âm "u"', correct: false },
          { label: 'B', text: 'Âm "ư"', correct: true },
          { label: 'C', text: 'Âm "i"', correct: false },
          { label: 'D', text: 'Âm "ô"', correct: false },
        ],
      },
    ],
  },
  {
    code: 'HG_LESSON_03',
    num: 3,
    topicCode: 'TOPIC_HG_2',
    title: 'Phụ âm cơ bản 1: ㄱ ㄴ ㄷ ㄹ ㅁ ㅂ ㅅ',
    subtitle: '7 phụ âm đầu tiên mô phỏng hình dáng cơ quan phát âm.',
    estimatedMinutes: 38,
    charCountLabel: '7 chữ',
    hasWarmup: true,
    hasWritingSheet: true,
    jamoCards: [
      { ko: 'ㄱ', roman: 'g / k · gi-yeok', vi: '가 · Đứng đầu đọc nhẹ giữa k/g; ghép với ㅏ thành 가 (ga)' },
      { ko: 'ㄴ', roman: 'n · ni-eun', vi: '나 · Đầu lưỡi chạm chân răng trên như âm "n" (나 - na)' },
      { ko: 'ㄷ', roman: 'd / t · di-geut', vi: '다 · Đầu lưỡi chạm lợi trên như âm "t/đ" nhẹ (다 - da)' },
      { ko: 'ㄹ', roman: 'r / l · ri-eul', vi: '라 · Đầu lưỡi uốn nhẹ chạm vòm họng (라 - ra)' },
      { ko: 'ㅁ', roman: 'm · mi-eum', vi: '마 · Khép hai môi mở ra như âm "m" (마 - ma)' },
      { ko: 'ㅂ', roman: 'b / p · bi-eup', vi: '바 · Hai môi chạm nhẹ mở ra giữa b/p (바 - ba)' },
      { ko: 'ㅅ', roman: 's / x · si-ot', vi: '사 · Phát âm nhẹ như "s/x" (사 - sa)' },
    ],
    objective: 'Nhận biết, viết đúng thứ tự nét và ghép vần thành thạo 7 phụ âm ㄱ, ㄴ, ㄷ, ㄹ, ㅁ, ㅂ, ㅅ với 10 nguyên âm cơ bản.',
    chars: ['가', '나', '다', '라', '마', '바', '사'],
    theoryMd: `### 1. Bảng 7 phụ âm cơ bản 1
| Phụ âm | Tên gọi | Phiên âm | Gợi ý phát âm | Ghép với ㅏ |
|---|---|---|---|---|
| **ㄱ** | 기역 (gi-yeok) | **g / k** | Đứng đầu từ đọc nhẹ giữa k và g; đứng giữa từ đọc là g | **가** (ga) |
| **ㄴ** | 니은 (ni-eun) | **n** | Đầu lưỡi chạm chân răng trên như âm "n" | **나** (na) |
| **ㄷ** | 디귿 (di-geut) | **d / t** | Đầu lưỡi chạm lợi trên, tương đương âm "t/đ" nhẹ | **다** (da) |
| **ㄹ** | 리을 (ri-eul) | **r / l** | Đầu lưỡi uốn nhẹ chạm vòm họng (giữa r và l) | **라** (ra) |
| **ㅁ** | 미음 (mi-eum) | **m** | Khép hai môi rồi mở ra như âm "m" | **마** (ma) |
| **ㅂ** | 비읍 (bi-eup) | **b / p** | Hai môi chạm nhẹ mở ra phát âm giữa b và p | **바** (ba) |
| **ㅅ** | 시옷 (si-ot) | **s** | Phát âm nhẹ như "s/x"; khi ghép với ㅣ, ㅑ, ㅕ, ㅛ, ㅠ đọc cong lưỡi nhẹ [sh] | **사** (sa) |`,
    examples: [
      { ko: '가수', roman: 'ga-su', vi: 'Ca sĩ' },
      { ko: '나무', roman: 'na-mu', vi: 'Cái cây' },
      { ko: '바다', roman: 'ba-da', vi: 'Biển' },
    ],
    vocabs: [
      { code: 'VC_HG03_01', ko: '가방', roman: 'ga-bang', vi: 'Cặp sách, túi xách', pos: 'Danh từ', exKo: '가방이 커요.', exVi: 'Chiếc cặp sách to.' },
      { code: 'VC_HG03_02', ko: '나무', roman: 'na-mu', vi: 'Cây cối, gỗ', pos: 'Danh từ', exKo: '공원에 나무가 많아요.', exVi: 'Ở công viên có nhiều cây.' },
      { code: 'VC_HG03_03', ko: '바다', roman: 'ba-da', vi: 'Biển', pos: 'Danh từ', exKo: '바다에 가고 싶어요.', exVi: 'Tôi muốn đi biển.' },
      { code: 'VC_HG03_04', ko: '사과', roman: 'sa-gwa', vi: 'Quả táo', pos: 'Danh từ', exKo: '사과가 맛있어요.', exVi: 'Quả táo ngon.' },
    ],
    questions: [
      {
        code: 'Q_HG03_1',
        prompt: 'Khi ghép phụ âm "ㄴ" với nguyên âm "ㅏ" và phụ âm "ㅁ" với nguyên âm "ㅜ", ta được từ nào?',
        highlight: 'ㄴ + ㅏ / ㅁ + ㅜ',
        explanation: 'ㄴ + ㅏ = 나, ㅁ + ㅜ = 무 -> 나무 (cái cây).',
        options: [
          { label: 'A', text: '나무 (Cái cây)', correct: true },
          { label: 'B', text: '바다 (Biển)', correct: false },
          { label: 'C', text: '가수 (Ca sĩ)', correct: false },
          { label: 'D', text: '나비 (Con bướm)', correct: false },
        ],
      },
      {
        code: 'Q_HG03_2',
        prompt: 'Phụ âm nào sau đây mô phỏng hình dáng hai môi khép lại và mang âm "m"?',
        highlight: 'ㅁ (미음)',
        explanation: 'ㅁ (mi-eum) mô phỏng hình dáng miệng/hai môi và phát âm là "m".',
        options: [
          { label: 'A', text: 'ㄱ', correct: false },
          { label: 'B', text: 'ㄴ', correct: false },
          { label: 'C', text: 'ㅁ', correct: true },
          { label: 'D', text: 'ㅅ', correct: false },
        ],
      },
      {
        code: 'Q_HG03_3',
        prompt: 'Từ "바다" có nghĩa tiếng Việt là gì?',
        highlight: '바다 (ba-da)',
        explanation: '바다 (ba-da) nghĩa là Biển.',
        options: [
          { label: 'A', text: 'Cái cây', correct: false },
          { label: 'B', text: 'Biển', correct: true },
          { label: 'C', text: 'Ca sĩ', correct: false },
          { label: 'D', text: 'Cặp sách', correct: false },
        ],
      },
    ],
  },
  {
    code: 'HG_LESSON_04',
    num: 4,
    topicCode: 'TOPIC_HG_2',
    title: 'Phụ âm cơ bản 2: ㅇ ㅈ ㅊ ㅋ ㅌ ㅍ ㅎ',
    subtitle: 'Hoàn thiện 14 phụ âm cơ bản và làm chủ nhóm phụ âm bật hơi (거센소리).',
    estimatedMinutes: 38,
    charCountLabel: '7 chữ',
    hasWarmup: true,
    hasWritingSheet: true,
    jamoCards: [
      { ko: 'ㅇ', roman: 'câm / -ng', vi: '아 · Đứng đầu âm tiết là âm câm; đứng cuối đọc là -ng' },
      { ko: 'ㅈ', roman: 'j / ch · ji-eut', vi: '자 · Âm thường giống "ch" nhẹ trong tiếng Việt (자 - ja)' },
      { ko: 'ㅊ', roman: "ch' (bật hơi)", vi: '차 · Âm bật hơi của ㅈ, đẩy luồng hơi mạnh (차 - cha)' },
      { ko: 'ㅋ', roman: "k' (bật hơi)", vi: '카 · Âm bật hơi của ㄱ, bật hơi mạnh từ cuống họng (카 - ka)' },
      { ko: 'ㅌ', roman: "t' (bật hơi)", vi: '타 · Âm bật hơi của ㄷ, bật hơi mạnh đầu lưỡi (타 - ta)' },
      { ko: 'ㅍ', roman: "p' (bật hơi)", vi: '파 · Âm bật hơi của ㅂ, mím môi bật luồng hơi mạnh (파 - pa)' },
      { ko: 'ㅎ', roman: 'h · hi-eut', vi: '하 · Âm xát họng nhẹ như âm "h" tiếng Việt (하 - ha)' },
    ],
    objective: 'Phân biệt rõ âm thường (ㄱ, ㄷ, ㅂ, ㅈ) và âm bật hơi (ㅋ, ㅌ, ㅍ, ㅊ); đọc và viết thành thạo 14 phụ âm cơ bản.',
    chars: ['자', '차', '카', '타', '파', '하'],
    theoryMd: `### 1. Bảng 7 phụ âm cơ bản 2 (gồm nhóm âm bật hơi)
| Phụ âm | Phiên âm | Đặc điểm phát âm | Ghép với ㅏ |
|---|---|---|---|
| **ㅇ** | **câm / -ng** | Đứng đầu âm tiết là âm câm; đứng cuối âm tiết (Patchim) đọc là **-ng** | **아** (a) |
| **ㅈ** | **j / ch** | Âm thường, vị trí lưỡi giống "ch" nhẹ trong tiếng Việt | **자** (ja) |
| **ㅊ** | **ch'** | **Âm bật hơi** của ㅈ: đẩy luồng hơi mạnh ra khỏi miệng | **차** (cha) |
| **ㅋ** | **k'** | **Âm bật hơi** của ㄱ: bật hơi mạnh từ cuống họng | **카** (ka) |
| **ㅌ** | **t'** | **Âm bật hơi** của ㄷ: bật hơi mạnh đầu lưỡi (như âm "th" bật hơi) | **타** (ta) |
| **ㅍ** | **p'** | **Âm bật hơi** của ㅂ: mím môi và bật luồng hơi mạnh | **파** (pa) |
| **ㅎ** | **h** | Âm xát họng nhẹ như âm "h" tiếng Việt | **하** (ha) |`,
    examples: [
      { ko: '커피', roman: 'keo-pi', vi: 'Cà phê' },
      { ko: '치마', roman: 'chi-ma', vi: 'Chân váy' },
      { ko: '포도', roman: 'po-do', vi: 'Quả nho' },
    ],
    vocabs: [
      { code: 'VC_HG04_01', ko: '커피', roman: 'keo-pi', vi: 'Cà phê', pos: 'Danh từ', exKo: '커피를 마셔요.', exVi: 'Tôi uống cà phê.' },
      { code: 'VC_HG04_02', ko: '치마', roman: 'chi-ma', vi: 'Chân váy', pos: 'Danh từ', exKo: '예쁜 치마를 샀어요.', exVi: 'Tôi đã mua chiếc váy đẹp.' },
      { code: 'VC_HG04_03', ko: '포도', roman: 'po-do', vi: 'Quả nho', pos: 'Danh từ', exKo: '포도가 달아요.', exVi: 'Quả nho ngọt.' },
      { code: 'VC_HG04_04', ko: '타조', roman: 'ta-jo', vi: 'Đà điểu', pos: 'Danh từ', exKo: '타조가 빨라요.', exVi: 'Đà điểu chạy nhanh.' },
    ],
    questions: [
      {
        code: 'Q_HG04_1',
        prompt: 'Nhóm 4 phụ âm nào sau đây đều thuộc nhóm phụ âm bật hơi (거센소리)?',
        highlight: 'ㅊ, ㅋ, ㅌ, ㅍ',
        explanation: 'ㅊ, ㅋ, ㅌ, ㅍ được tạo bằng cách thêm nét vào ㅈ, ㄱ, ㄷ, ㅂ để biểu thị luồng hơi bật mạnh.',
        options: [
          { label: 'A', text: 'ㄱ, ㄷ, ㅂ, ㅈ', correct: false },
          { label: 'B', text: 'ㅊ, ㅋ, ㅌ, ㅍ', correct: true },
          { label: 'C', text: 'ㄴ, ㄹ, ㅁ, ㅇ', correct: false },
          { label: 'D', text: 'ㅅ, ㅇ, ㅈ, ㅎ', correct: false },
        ],
      },
      {
        code: 'Q_HG04_2',
        prompt: 'Từ "커피" (Cà phê) được tạo bởi hai phụ âm bật hơi nào?',
        highlight: '커피',
        explanation: '커 dùng phụ âm ㅋ (k\'), 피 dùng phụ âm ㅍ (p\').',
        options: [
          { label: 'A', text: 'ㅋ và ㅍ', correct: true },
          { label: 'B', text: 'ㄱ và ㅂ', correct: false },
          { label: 'C', text: 'ㅊ và ㅌ', correct: false },
          { label: 'D', text: 'ㅋ và ㅎ', correct: false },
        ],
      },
      {
        code: 'Q_HG04_3',
        prompt: 'Từ "포도" có nghĩa là gì?',
        highlight: '포도 (po-do)',
        explanation: '포도 (po-do) nghĩa là quả nho.',
        options: [
          { label: 'A', text: 'Chân váy', correct: false },
          { label: 'B', text: 'Quả nho', correct: true },
          { label: 'C', text: 'Đà điểu', correct: false },
          { label: 'D', text: 'Cà phê', correct: false },
        ],
      },
    ],
  },
  {
    code: 'HG_LESSON_05',
    num: 5,
    topicCode: 'TOPIC_HG_2',
    title: 'Phụ âm đôi (căng): ㄲ ㄸ ㅃ ㅆ ㅉ',
    subtitle: 'Làm chủ 5 phụ âm căng (된소리) và phân biệt bộ 3 đối lập: Âm thường – Âm bật hơi – Âm căng.',
    estimatedMinutes: 38,
    charCountLabel: '5 chữ',
    hasWarmup: true,
    hasWritingSheet: true,
    jamoCards: [
      { ko: 'ㄲ', roman: 'kk (căng)', vi: '까 · Âm căng của ㄱ, phát âm dứt khoát không bật hơi (까 - kka)' },
      { ko: 'ㄸ', roman: 'tt (căng)', vi: '따 · Âm căng của ㄷ, phát âm dứt khoát không bật hơi (따 - tta)' },
      { ko: 'ㅃ', roman: 'pp (căng)', vi: '빠 · Âm căng của ㅂ, phát âm dứt khoát không bật hơi (빠 - ppa)' },
      { ko: 'ㅆ', roman: 'ss (căng)', vi: '싸 · Âm căng của ㅅ, phát âm sắc và mạnh (싸 - ssa)' },
      { ko: 'ㅉ', roman: 'jj (căng)', vi: '짜 · Âm căng của ㅈ, phát âm dứt khoát không bật hơi (짜 - jja)' },
    ],
    objective: 'Phát âm chuẩn xác 5 phụ âm đôi ㄲ, ㄸ, ㅃ, ㅆ, ㅉ; phân biệt rõ 3 sắc thái ㄱ-ㅋ-ㄲ, ㄷ-ㅌ-ㄸ, ㅂ-ㅍ-ㅃ, ㅈ-ㅊ-ㅉ.',
    chars: ['까', '따', '빠', '싸', '짜'],
    theoryMd: `### 1. Bảng 5 phụ âm đôi (쌍자음 - Âm căng)
Khi phát âm phụ âm đôi, căng dây thanh quản, nén hơi rồi phát âm dứt khoát, cao giọng, **không bật hơi**:
| Phụ âm đôi | Tên gọi | Phiên âm | Đối chiếu bộ 3 (Thường - Bật hơi - Căng) |
|---|---|---|---|
| **ㄲ** | 쌍기역 | **kk** | 가 (ga) — 카 (k'a) — **까** (kka) |
| **ㄸ** | 쌍디귿 | **tt** | 다 (da) — 타 (t'a) — **따** (tta) |
| **ㅃ** | 쌍비읍 | **pp** | 바 (ba) — 파 (p'a) — **빠** (ppa) |
| **ㅆ** | 쌍시옷 | **ss** | 사 (sa) — **싸** (ssa) |
| **ㅉ** | 쌍지읒 | **jj** | 자 (ja) — 차 (ch'a) — **짜** (jja) |`,
    examples: [
      { ko: '토끼', roman: 'to-kki', vi: 'Con thỏ' },
      { ko: '오빠', roman: 'o-ppa', vi: 'Anh trai (em gái gọi)' },
      { ko: '아저씨', roman: 'a-jeo-ssi', vi: 'Chú, bác' },
    ],
    vocabs: [
      { code: 'VC_HG05_01', ko: '토끼', roman: 'to-kki', vi: 'Con thỏ', pos: 'Danh từ', exKo: '토끼가 귀여워요.', exVi: 'Con thỏ dễ thương.' },
      { code: 'VC_HG05_02', ko: '오빠', roman: 'o-ppa', vi: 'Anh trai (em gái gọi)', pos: 'Danh từ', exKo: '우리 오빠는 대학생이에요.', exVi: 'Anh trai tôi là sinh viên đại học.' },
      { code: 'VC_HG05_03', ko: '아빠', roman: 'a-ppa', vi: 'Bố, ba', pos: 'Danh từ', exKo: '아빠 사랑해요.', exVi: 'Con yêu bố.' },
      { code: 'VC_HG05_04', ko: '쓰다', roman: 'sseu-da', vi: 'Viết / Đắng / Đội (mũ)', pos: 'Động từ', exKo: '한글을 써요.', exVi: 'Tôi viết chữ Hangeul.' },
    ],
    questions: [
      {
        code: 'Q_HG05_1',
        prompt: 'Đặc điểm quan trọng nhất khi phát âm 5 phụ âm đôi (ㄲ, ㄸ, ㅃ, ㅆ, ㅉ) là gì?',
        highlight: 'ㄲ, ㄸ, ㅃ, ㅆ, ㅉ',
        explanation: 'Phụ âm đôi là âm căng (된소리): căng thanh quản, phát âm dứt khoát, cao giọng và không bật hơi.',
        options: [
          { label: 'A', text: 'Căng thanh quản, phát âm dứt khoát và không bật hơi', correct: true },
          { label: 'B', text: 'Đẩy luồng hơi thật mạnh ra ngoài môi', correct: false },
          { label: 'C', text: 'Đọc hoàn toàn giống phụ âm đơn', correct: false },
          { label: 'D', text: 'Không phát âm khi đứng đầu từ', correct: false },
        ],
      },
      {
        code: 'Q_HG05_2',
        prompt: 'Từ nào sau đây có nghĩa là "Con thỏ"?',
        highlight: '토끼',
        explanation: '토끼 (to-kki) có nghĩa là con thỏ.',
        options: [
          { label: 'A', text: '오빠', correct: false },
          { label: 'B', text: '토끼', correct: true },
          { label: 'C', text: '아빠', correct: false },
          { label: 'D', text: '치마', correct: false },
        ],
      },
      {
        code: 'Q_HG05_3',
        prompt: 'Trong từ "오빠" (Anh trai), âm tiết thứ hai sử dụng phụ âm đôi nào?',
        highlight: '빠 (ㅃ + ㅏ)',
        explanation: '빠 được tạo từ phụ âm đôi ㅃ (쌍비읍) ghép với nguyên âm ㅏ.',
        options: [
          { label: 'A', text: 'ㄲ', correct: false },
          { label: 'B', text: 'ㄸ', correct: false },
          { label: 'C', text: 'ㅃ', correct: true },
          { label: 'D', text: 'ㅉ', correct: false },
        ],
      },
    ],
  },
  {
    code: 'HG_LESSON_06',
    num: 6,
    topicCode: 'TOPIC_HG_3',
    title: 'Nguyên âm đôi 1: ㅐ ㅒ ㅔ ㅖ ㅘ ㅙ',
    subtitle: 'Nhóm 6 nguyên âm ghép đầu tiên và cách kết hợp nguyên âm ngang + dọc.',
    estimatedMinutes: 38,
    charCountLabel: '6 chữ',
    hasWarmup: true,
    hasWritingSheet: true,
    jamoCards: [
      { ko: 'ㅐ', roman: 'ae · e', vi: '애 · ㅏ + ㅣ -> phát âm như "e" mở miệng hơi rộng' },
      { ko: 'ㅒ', roman: 'yae · ye', vi: '얘 · ㅑ + ㅣ -> phát âm nhanh "ye"' },
      { ko: 'ㅔ', roman: 'e · ê', vi: '에 · ㅓ + ㅣ -> phát âm gần giống "ê" tiếng Việt' },
      { ko: 'ㅖ', roman: 'ye · yê', vi: '예 · ㅕ + ㅣ -> phát âm là "yê"' },
      { ko: 'ㅘ', roman: 'wa · oa', vi: '와 · ㅗ + ㅏ -> tròn môi "ô" mở sang "a" thành "wa/oa"' },
      { ko: 'ㅙ', roman: 'wae · uê', vi: '왜 · ㅗ + ㅐ -> tròn môi mở sang "e" thành "wae"' },
    ],
    objective: 'Nhận diện, phát âm và viết đúng thứ tự nét 6 nguyên âm đôi ㅐ, ㅒ, ㅔ, ㅖ, ㅘ, ㅙ.',
    chars: ['개', '네', '과'],
    theoryMd: `### 1. Bảng 6 nguyên âm đôi 1
| Nguyên âm đôi | Cấu tạo | Phiên âm | Cách phát âm & Lưu ý |
|---|---|---|---|
| **ㅐ** | ㅏ + ㅣ | **ae** | Mở miệng rộng hơn "ê", phát âm như "e" trong tiếng Việt |
| **ㅒ** | ㅑ + ㅣ | **yae** | Phát âm nhanh từ "i" sang "e" -> "ye" |
| **ㅔ** | ㅓ + ㅣ | **e** | Khẩu hình hẹp hơn ㅐ, phát âm gần giống "ê" (trong giao tiếp hiện đại ㅐ và ㅔ phát âm rất gần nhau) |
| **ㅖ** | ㅕ + ㅣ | **ye** | Phát âm là "yê"; khi ghép với phụ âm khác ㅇ/ㅎ thường đọc như ㅔ (예: 시계 [시게]) |
| **ㅘ** | ㅗ + ㅏ | **wa** | Tròn môi "ô" rồi mở sang "a" -> "wa" (예: 과일 - hoa quả) |
| **ㅙ** | ㅗ + ㅐ | **wae** | Tròn môi "ô" rồi mở sang "e" -> "we" (예: 왜 - tại sao) |`,
    examples: [
      { ko: '시계', roman: 'si-gye', vi: 'Đồng hồ' },
      { ko: '과자', roman: 'gwa-ja', vi: 'Bánh kẹo, snack' },
      { ko: '왜요', roman: 'wae-yo', vi: 'Tại sao vậy ạ?' },
    ],
    vocabs: [
      { code: 'VC_HG06_01', ko: '시계', roman: 'si-gye', vi: 'Đồng hồ', pos: 'Danh từ', exKo: '시계를 봐요.', exVi: 'Tôi xem đồng hồ.' },
      { code: 'VC_HG06_02', ko: '과자', roman: 'gwa-ja', vi: 'Bánh quy, snack', pos: 'Danh từ', exKo: '과자를 먹어요.', exVi: 'Tôi ăn bánh.' },
      { code: 'VC_HG06_03', ko: '세계', roman: 'se-gye', vi: 'Thế giới', pos: 'Danh từ', exKo: '세계 여행을 해요.', exVi: 'Tôi đi du lịch thế giới.' },
      { code: 'VC_HG06_04', ko: '왜', roman: 'wae', vi: 'Tại sao', pos: 'Phó từ', exKo: '왜 안 가요?', exVi: 'Tại sao bạn không đi?' },
    ],
    questions: [
      {
        code: 'Q_HG06_1',
        prompt: 'Nguyên âm đôi "ㅘ" được ghép từ hai nguyên âm đơn nào?',
        highlight: 'ㅘ (와)',
        explanation: 'ㅘ được ghép từ nguyên âm ngang ㅗ và nguyên âm dọc ㅏ (ㅗ + ㅏ = ㅘ).',
        options: [
          { label: 'A', text: 'ㅗ + ㅏ', correct: true },
          { label: 'B', text: 'ㅜ + ㅓ', correct: false },
          { label: 'C', text: 'ㅗ + ㅣ', correct: false },
          { label: 'D', text: 'ㅡ + ㅣ', correct: false },
        ],
      },
      {
        code: 'Q_HG06_2',
        prompt: 'Từ "시계" có nghĩa tiếng Việt là gì?',
        highlight: '시계 (si-gye)',
        explanation: '시계 có nghĩa là chiếc đồng hồ.',
        options: [
          { label: 'A', text: 'Bánh kẹo', correct: false },
          { label: 'B', text: 'Đồng hồ', correct: true },
          { label: 'C', text: 'Thế giới', correct: false },
          { label: 'D', text: 'Quả táo', correct: false },
        ],
      },
      {
        code: 'Q_HG06_3',
        prompt: 'Từ để hỏi "왜" (Tại sao) sử dụng nguyên âm đôi nào?',
        highlight: '왜 (ㅇ + ㅙ)',
        explanation: '왜 được tạo từ phụ âm ㅇ ghép với nguyên âm đôi ㅙ (ㅗ + ㅐ).',
        options: [
          { label: 'A', text: 'ㅘ', correct: false },
          { label: 'B', text: 'ㅙ', correct: true },
          { label: 'C', text: 'ㅐ', correct: false },
          { label: 'D', text: 'ㅖ', correct: false },
        ],
      },
    ],
  },
  {
    code: 'HG_LESSON_07',
    num: 7,
    topicCode: 'TOPIC_HG_3',
    title: 'Nguyên âm đôi 2: ㅚ ㅝ ㅞ ㅟ ㅢ',
    subtitle: 'Hoàn tất 11 nguyên âm đôi và nắm vững 3 cách phát âm đặc biệt của nguyên âm ㅢ.',
    estimatedMinutes: 38,
    charCountLabel: '5 chữ',
    hasWarmup: true,
    hasWritingSheet: true,
    jamoCards: [
      { ko: 'ㅚ', roman: 'oe · we', vi: '외 · ㅗ + ㅣ -> phát âm giống "we" [웨]' },
      { ko: 'ㅝ', roman: 'wo · uơ', vi: '워 · ㅜ + ㅓ -> chu môi "u" mở sang "ơ" thành "wo/uơ"' },
      { ko: 'ㅞ', roman: 'we · uê', vi: '웨 · ㅜ + ㅔ -> chu môi "u" mở sang "ê" thành "we/uê"' },
      { ko: 'ㅟ', roman: 'wi · uy', vi: '위 · ㅜ + ㅣ -> chu môi "u" kéo sang "i" thành "wi/uy"' },
      { ko: 'ㅢ', roman: 'ui · ưi / i / e', vi: '의 · ㅡ + ㅣ -> đầu từ đọc "ưi", sau phụ âm đọc "i", sở hữu đọc "e"' },
    ],
    objective: 'Đọc và viết chuẩn 5 nguyên âm đôi ㅚ, ㅝ, ㅞ, ㅟ, ㅢ; áp dụng đúng quy tắc phát âm ㅢ theo vị trí trong từ.',
    chars: ['외', '워', '위', '의'],
    theoryMd: `### 1. Bảng 5 nguyên âm đôi 2
| Nguyên âm đôi | Cấu tạo | Phiên âm | Cách phát âm |
|---|---|---|---|
| **ㅚ** | ㅗ + ㅣ | **oe (we)** | Phát âm giống "we" [웨] |
| **ㅝ** | ㅜ + ㅓ | **wo** | Chu môi "u" rồi mở sang "ơ" -> "uơ / wo" |
| **ㅞ** | ㅜ + ㅔ | **we** | Chu môi "u" rồi mở sang "ê" -> "uê / we" |
| **ㅟ** | ㅜ + ㅣ | **wi** | Chu môi "u" rồi kéo sang "i" -> "uy / wi" |
| **ㅢ** | ㅡ + ㅣ | **ui / i / e** | Xem 3 quy tắc phát âm đặc biệt bên dưới |

### 2. Ba quy tắc phát âm của nguyên âm ㅢ
1. **Đứng đầu từ (không có phụ âm đầu)**: Đọc nguyên bản **[의 - ưi]** (예: 의사 -> [의사] Bác sĩ).
2. **Đứng sau phụ âm (khác ㅇ) hoặc đứng ở âm tiết thứ 2 trở đi**: Đọc thành **[이 - i]** (예: 회의 -> [회이] Cuộc họp; 희망 -> [히망] Hy vọng).
3. **Làm tiểu từ sở hữu (của)**: Đọc thành **[에 - e]** (예: 나의 꿈 -> [나에 꿈] Ước mơ của tôi).`,
    examples: [
      { ko: '의사', roman: 'ui-sa', vi: 'Bác sĩ' },
      { ko: '의자', roman: 'ui-ja', vi: 'Cái ghế' },
      { ko: '귀', roman: 'gwi', vi: 'Đôi tai' },
    ],
    vocabs: [
      { code: 'VC_HG07_01', ko: '의사', roman: 'ui-sa', vi: 'Bác sĩ', pos: 'Danh từ', exKo: '언니는 의사예요.', exVi: 'Chị gái tôi là bác sĩ.' },
      { code: 'VC_HG07_02', ko: '의자', roman: 'ui-ja', vi: 'Cái ghế', pos: 'Danh từ', exKo: '의자에 앉으세요.', exVi: 'Xin mời ngồi xuống ghế.' },
      { code: 'VC_HG07_03', ko: '회사', roman: 'hoe-sa', vi: 'Công ty', pos: 'Danh từ', exKo: '회사에 가요.', exVi: 'Tôi đi đến công ty.' },
      { code: 'VC_HG07_04', ko: '위', roman: 'wi', vi: 'Phía trên / Dạ dày', pos: 'Danh từ', exKo: '책상 위에 있어요.', exVi: 'Nó ở phía trên bàn học.' },
    ],
    questions: [
      {
        code: 'Q_HG07_1',
        prompt: 'Khi "의" được dùng làm tiểu từ sở hữu (ví dụ: 나의 가방 - cặp của tôi), "의" thường được phát âm thành âm gì?',
        highlight: '나의 가방 -> [나에 가방]',
        explanation: 'Theo quy tắc chuẩn phát âm tiếng Hàn, tiểu từ sở hữu 의 được phép phát âm là [에].',
        options: [
          { label: 'A', text: 'Phát âm là [에]', correct: true },
          { label: 'B', text: 'Phát âm là [오]', correct: false },
          { label: 'C', text: 'Phát âm là [우]', correct: false },
          { label: 'D', text: 'Phát âm là [와]', correct: false },
        ],
      },
      {
        code: 'Q_HG07_2',
        prompt: 'Từ nào sau đây có nghĩa là "Bác sĩ"?',
        highlight: '의사',
        explanation: '의사 (ui-sa) nghĩa là bác sĩ; 의자 (ui-ja) nghĩa là cái ghế.',
        options: [
          { label: 'A', text: '의자', correct: false },
          { label: 'B', text: '의사', correct: true },
          { label: 'C', text: '회사', correct: false },
          { label: 'D', text: '과자', correct: false },
        ],
      },
      {
        code: 'Q_HG07_3',
        prompt: 'Nguyên âm đôi "ㅝ" được ghép từ hai nguyên âm đơn nào?',
        highlight: 'ㅝ (워)',
        explanation: 'ㅝ được tạo từ nguyên âm ngang ㅜ ghép với nguyên âm dọc ㅓ.',
        options: [
          { label: 'A', text: 'ㅗ + ㅏ', correct: false },
          { label: 'B', text: 'ㅜ + ㅓ', correct: true },
          { label: 'C', text: 'ㅜ + ㅣ', correct: false },
          { label: 'D', text: 'ㅡ + ㅣ', correct: false },
        ],
      },
    ],
  },
  {
    code: 'HG_LESSON_08',
    num: 8,
    topicCode: 'TOPIC_HG_4',
    title: 'Patchim (받침) — phụ âm cuối',
    subtitle: '7 nhóm âm đại diện của Patchim đơn, Patchim đôi và quy tắc nối âm (연음화).',
    estimatedMinutes: 38,
    charCountLabel: '7 chữ',
    hasWarmup: true,
    hasWritingSheet: true,
    jamoCards: [
      { ko: '악', roman: '-k (ㄱ,ㅋ,ㄲ)', vi: '악 · Nhóm Patchim ㄱ, ㅋ, ㄲ đọc ngắt âm [-k] (예: 책, 밖)' },
      { ko: '안', roman: '-n (ㄴ)', vi: '안 · Nhóm Patchim ㄴ đọc âm mũi [-n] (예: 산, 눈)' },
      { ko: '앋', roman: '-t (ㄷ,ㅅ,ㅆ,ㅈ,ㅊ,ㅌ,ㅎ)', vi: '앋 · 7 phụ âm ㄷ,ㅅ,ㅆ,ㅈ,ㅊ,ㅌ,ㅎ ở cuối quy về [-t] (예: 옷, 꽃)' },
      { ko: '알', roman: '-l (ㄹ)', vi: '알 · Nhóm Patchim ㄹ uốn lưỡi chạm hàm trên [-l] (예: 물, 달)' },
      { ko: '암', roman: '-m (ㅁ)', vi: '암 · Nhóm Patchim ㅁ khép môi [-m] (예: 봄, 마음)' },
      { ko: '압', roman: '-p (ㅂ,ㅍ)', vi: '압 · Nhóm Patchim ㅂ, ㅍ khép môi ngắt âm [-p] (예: 밥, 앞)' },
      { ko: '앙', roman: '-ng (ㅇ)', vi: '앙 · Nhóm Patchim ㅇ đọc âm ngân [-ng] (예: 강, 방)' },
    ],
    objective: 'Nắm vững 7 âm đại diện của Patchim [ㄱ, ㄴ, ㄷ, ㄹ, ㅁ, ㅂ, ㅇ] và áp dụng quy tắc nối âm khi sau Patchim là nguyên âm.',
    chars: ['각', '간', '갈', '감', '강'],
    theoryMd: `### 1. Khái niệm Patchim (받침)
**Patchim (받침)** là phụ âm đứng ở vị trí **dưới cùng** của một âm tiết tiếng Hàn (Cấu trúc: Phụ âm đầu + Nguyên âm + **Patchim**).

### 2. Bảng 7 nhóm âm đại diện của Patchim
Dù có nhiều phụ âm có thể viết ở vị trí cuối, khi phát âm độc lập chỉ quy về **7 âm đại diện**:
| Âm đại diện | Các phụ âm cuối thuộc nhóm | Ví dụ & Phát âm |
|---|---|---|
| **[ㄱ] (-k)** | **ㄱ, ㅋ, ㄲ** | 책 [책], 부엌 [부억], 밖 [박] |
| **[ㄴ] (-n)** | **ㄴ** | 산 [산], 눈 [눈] |
| **[ㄷ] (-t)** | **ㄷ, ㅅ, ㅆ, ㅈ, ㅊ, ㅌ, ㅎ** | 옷 [옫], 있다 [읻따], 꽃 [꼳], 끝 [끋] |
| **[ㄹ] (-l)** | **ㄹ** | 물 [물], 달 [달] |
| **[ㅁ] (-m)** | **ㅁ** | 마음 [마음], 봄 [봄] |
| **[ㅂ] (-p)** | **ㅂ, ㅍ** | 밥 [밥], 앞 [압] |
| **[ㅇ] (-ng)** | **ㅇ** | 강 [강], 방 [방] |

### 3. Quy tắc nối âm (연음화)
Khi âm tiết có Patchim đi liền trước một âm tiết bắt đầu bằng phụ âm câm **ㅇ**, phụ âm cuối sẽ nối sang vị trí của **ㅇ** để phát âm:
- **한국어** -> **[한구거]**
- **꽃이** -> **[꼬치]**`,
    examples: [
      { ko: '한국어', roman: 'han-gu-geo', vi: 'Tiếng Hàn Quốc (nối âm [한구거])' },
      { ko: '꽃', roman: 'kkot', vi: 'Bông hoa (phát âm [꼳])' },
      { ko: '밥', roman: 'bap', vi: 'Cơm' },
    ],
    vocabs: [
      { code: 'VC_HG08_01', ko: '한국', roman: 'han-guk', vi: 'Hàn Quốc', pos: 'Danh từ', exKo: '한국에 가요.', exVi: 'Tôi đi Hàn Quốc.' },
      { code: 'VC_HG08_02', ko: '책', roman: 'chaek', vi: 'Quyển sách', pos: 'Danh từ', exKo: '책을 읽어요.', exVi: 'Tôi đọc sách.' },
      { code: 'VC_HG08_03', ko: '꽃', roman: 'kkot', vi: 'Bông hoa', pos: 'Danh từ', exKo: '꽃이 예뻐요.', exVi: 'Bông hoa đẹp.' },
      { code: 'VC_HG08_04', ko: '물', roman: 'mul', vi: 'Nước', pos: 'Danh từ', exKo: '물을 마셔요.', exVi: 'Tôi uống nước.' },
    ],
    questions: [
      {
        code: 'Q_HG08_1',
        prompt: 'Khi đứng ở vị trí Patchim cuối từ, các phụ âm "ㄷ, ㅅ, ㅆ, ㅈ, ㅊ, ㅌ, ㅎ" đều được phát âm quy về âm đại diện nào?',
        highlight: '옷 -> [옫], 꽃 -> [꼳]',
        explanation: 'Tất cả 7 phụ âm ㄷ, ㅅ, ㅆ, ㅈ, ㅊ, ㅌ, ㅎ khi làm Patchim cuối âm tiết đều quy về âm đại diện [ㄷ] (-t).',
        options: [
          { label: 'A', text: 'Âm đại diện [ㄷ]', correct: true },
          { label: 'B', text: 'Âm đại diện [ㄱ]', correct: false },
          { label: 'C', text: 'Âm đại diện [ㅂ]', correct: false },
          { label: 'D', text: 'Âm đại diện [ㅇ]', correct: false },
        ],
      },
      {
        code: 'Q_HG08_2',
        prompt: 'Theo quy tắc nối âm (연음화), từ "한국어" (Tiếng Hàn) được phát âm chuẩn là gì?',
        highlight: '한국어',
        explanation: 'Patchim ㄱ của 국 gặp nguyên âm 어 (bắt đầu bằng ㅇ) nên nối sang thành [한구거].',
        options: [
          { label: 'A', text: '[한구거]', correct: true },
          { label: 'B', text: '[한국어]', correct: false },
          { label: 'C', text: '[항국어]', correct: false },
          { label: 'D', text: '[한궁어]', correct: false },
        ],
      },
      {
        code: 'Q_HG08_3',
        prompt: 'Từ "꽃" (Bông hoa) khi đứng một mình được phát âm như thế nào?',
        highlight: '꽃',
        explanation: 'Patchim ㅊ quy về âm đại diện [ㄷ], nên 꽃 được phát âm là [꼳].',
        options: [
          { label: 'A', text: '[꼳]', correct: true },
          { label: 'B', text: '[꼭]', correct: false },
          { label: 'C', text: '[꼽]', correct: false },
          { label: 'D', text: '[꽁]', correct: false },
        ],
      },
    ],
  },
  {
    code: 'HG_LESSON_09',
    num: 9,
    topicCode: 'TOPIC_HG_4',
    title: 'Tổng ôn bảng chữ cái Hangeul',
    subtitle: 'Hệ thống hóa toàn bộ 40 ký tự Hangeul (21 nguyên âm + 19 phụ âm), quy tắc biến âm cơ bản và kiểm tra mở khóa Chặng Sơ cấp 1.',
    estimatedMinutes: 70,
    charCountLabel: '40 chữ',
    hasWarmup: true,
    hasWritingSheet: false,
    jamoCards: [
      { ko: 'ㅏ', roman: 'a', vi: '아 · Nguyên âm đơn a' },
      { ko: 'ㅑ', roman: 'ya', vi: '야 · Nguyên âm đơn ya' },
      { ko: 'ㅓ', roman: 'eo · ơ', vi: '어 · Nguyên âm đơn eo/ơ' },
      { ko: 'ㅕ', roman: 'yeo · yơ', vi: '여 · Nguyên âm đơn yeo/yơ' },
      { ko: 'ㅗ', roman: 'o · ô', vi: '오 · Nguyên âm đơn o/ô' },
      { ko: 'ㅛ', roman: 'yo · yô', vi: '요 · Nguyên âm đơn yo/yô' },
      { ko: 'ㅜ', roman: 'u', vi: '우 · Nguyên âm đơn u' },
      { ko: 'ㅠ', roman: 'yu', vi: '유 · Nguyên âm đơn yu' },
      { ko: 'ㅡ', roman: 'eu · ư', vi: '으 · Nguyên âm đơn eu/ư' },
      { ko: 'ㅣ', roman: 'i', vi: '이 · Nguyên âm đơn i' },
      { ko: 'ㅐ', roman: 'ae · e', vi: '애 · Nguyên âm đôi ae/e' },
      { ko: 'ㅒ', roman: 'yae · ye', vi: '얘 · Nguyên âm đôi yae/ye' },
      { ko: 'ㅔ', roman: 'e · ê', vi: '에 · Nguyên âm đôi e/ê' },
      { ko: 'ㅖ', roman: 'ye · yê', vi: '예 · Nguyên âm đôi ye/yê' },
      { ko: 'ㅘ', roman: 'wa · oa', vi: '와 · Nguyên âm đôi wa/oa' },
      { ko: 'ㅙ', roman: 'wae · uê', vi: '왜 · Nguyên âm đôi wae/uê' },
      { ko: 'ㅚ', roman: 'oe · we', vi: '외 · Nguyên âm đôi oe/we' },
      { ko: 'ㅝ', roman: 'wo · uơ', vi: '워 · Nguyên âm đôi wo/uơ' },
      { ko: 'ㅞ', roman: 'we · uê', vi: '웨 · Nguyên âm đôi we/uê' },
      { ko: 'ㅟ', roman: 'wi · uy', vi: '위 · Nguyên âm đôi wi/uy' },
      { ko: 'ㅢ', roman: 'ui · ưi', vi: '의 · Nguyên âm đôi ui/ưi' },
      { ko: 'ㄱ', roman: 'g / k', vi: '가 · Phụ âm cơ bản gi-yeok' },
      { ko: 'ㄴ', roman: 'n', vi: '나 · Phụ âm cơ bản ni-eun' },
      { ko: 'ㄷ', roman: 'd / t', vi: '다 · Phụ âm cơ bản di-geut' },
      { ko: 'ㄹ', roman: 'r / l', vi: '라 · Phụ âm cơ bản ri-eul' },
      { ko: 'ㅁ', roman: 'm', vi: '마 · Phụ âm cơ bản mi-eum' },
      { ko: 'ㅂ', roman: 'b / p', vi: '바 · Phụ âm cơ bản bi-eup' },
      { ko: 'ㅅ', roman: 's / x', vi: '사 · Phụ âm cơ bản si-ot' },
      { ko: 'ㅇ', roman: 'câm / -ng', vi: '아 · Phụ âm cơ bản i-eung' },
      { ko: 'ㅈ', roman: 'j / ch', vi: '자 · Phụ âm cơ bản ji-eut' },
      { ko: 'ㅊ', roman: "ch'", vi: '차 · Phụ âm bật hơi chi-eut' },
      { ko: 'ㅋ', roman: "k'", vi: '카 · Phụ âm bật hơi ki-euk' },
      { ko: 'ㅌ', roman: "t'", vi: '타 · Phụ âm bật hơi ti-eut' },
      { ko: 'ㅍ', roman: "p'", vi: '파 · Phụ âm bật hơi pi-eup' },
      { ko: 'ㅎ', roman: 'h', vi: '하 · Phụ âm cơ bản hi-eut' },
      { ko: 'ㄲ', roman: 'kk (căng)', vi: '까 · Phụ âm đôi ssang-giyeok' },
      { ko: 'ㄸ', roman: 'tt (căng)', vi: '따 · Phụ âm đôi ssang-digeut' },
      { ko: 'ㅃ', roman: 'pp (căng)', vi: '빠 · Phụ âm đôi ssang-bieup' },
      { ko: 'ㅆ', roman: 'ss (căng)', vi: '싸 · Phụ âm đôi ssang-siot' },
      { ko: 'ㅉ', roman: 'jj (căng)', vi: '짜 · Phụ âm đôi ssang-jieut' },
    ],
    objective: 'Đọc thông viết thạo toàn bộ 40 chữ cái Hangeul, nắm vững quy tắc nối âm, biến âm mũi hóa và đạt >= 80% bài kiểm tra tổng kết để mở khóa Chặng Sơ cấp 1.',
    chars: ['한', '글', '가', '나', '다'],
    theoryMd: `### 1. Tổng kết 40 ký tự Hangeul (한글 40자)
- **10 Nguyên âm đơn**: \`ㅏ, ㅑ, ㅓ, ㅕ, ㅗ, ㅛ, ㅜ, ㅠ, ㅡ, ㅣ\`
- **11 Nguyên âm đôi**: \`ㅐ, ㅒ, ㅔ, ㅖ, ㅘ, ㅙ, ㅚ, ㅝ, ㅞ, ㅟ, ㅢ\`
- **14 Phụ âm đơn**: \`ㄱ, ㄴ, ㄷ, ㄹ, ㅁ, ㅂ, ㅅ, ㅇ, ㅈ, ㅊ, ㅋ, ㅌ, ㅍ, ㅎ\`
- **5 Phụ âm đôi**: \`ㄲ, ㄸ, ㅃ, ㅆ, ㅉ\`

### 2. Tổng hợp 3 quy tắc phát âm cốt lõi cần nhớ
1. **Nối âm (연음화)**: Patchim + \`ㅇ\` -> đọc nối phụ âm cuối sang âm tiết sau (예: 음악 -> [으막]).
2. **Bật hơi hóa (격음화)**: \`ㄱ, ㄷ, ㅂ, ㅈ\` gặp \`ㅎ\` -> biến thành âm bật hơi \`[ㅋ, ㅌ, ㅍ, ㅊ]\` (예: 축하 -> [추카], 좋다 -> [조타]).
3. **Mũi hóa (비음화)**: Patchim \`[ㄱ, ㄷ, ㅂ]\` gặp \`ㄴ, ㅁ\` -> biến thành \`[ㅇ, ㄴ, ㅁ]\` (예: 감사합니다 -> [감사함니다]).`,
    examples: [
      { ko: '안녕하세요', roman: 'an-nyeong-ha-se-yo', vi: 'Xin chào' },
      { ko: '감사합니다', roman: 'gam-sa-ham-ni-da', vi: 'Xin cảm ơn ([감사함니다])' },
      { ko: '축하합니다', roman: 'chuk-ha-ham-ni-da', vi: 'Xin chúc mừng ([추카함니다])' },
    ],
    vocabs: [
      { code: 'VC_HG09_01', ko: '한글', roman: 'han-geul', vi: 'Bảng chữ cái tiếng Hàn (Hangeul)', pos: 'Danh từ', exKo: '한글은 배우기 쉬워요.', exVi: 'Chữ Hangeul rất dễ học.' },
      { code: 'VC_HG09_02', ko: '선생님', roman: 'seon-saeng-nim', vi: 'Giáo viên, thầy/cô giáo', pos: 'Danh từ', exKo: '선생님, 안녕하세요!', exVi: 'Em chào thầy/cô ạ!' },
      { code: 'VC_HG09_03', ko: '학생', roman: 'hak-saeng', vi: 'Học sinh, sinh viên', pos: 'Danh từ', exKo: '저는 베트남 학생이에요.', exVi: 'Tôi là sinh viên Việt Nam.' },
      { code: 'VC_HG09_04', ko: '사랑해요', roman: 'sa-rang-hae-yo', vi: 'Tôi yêu bạn', pos: 'Biểu hiện', exKo: '가족을 사랑해요.', exVi: 'Tôi yêu gia đình.' },
    ],
    questions: [
      {
        code: 'Q_HG09_1',
        prompt: 'Bảng chữ cái tiếng Hàn Hangeul có tổng cộng bao nhiêu ký tự (gồm cả nguyên âm và phụ âm)?',
        highlight: '21 nguyên âm + 19 phụ âm',
        explanation: 'Hangeul gồm 21 nguyên âm (10 đơn + 11 đôi) và 19 phụ âm (14 đơn + 5 đôi) = 40 ký tự.',
        options: [
          { label: 'A', text: '24 ký tự', correct: false },
          { label: 'B', text: '40 ký tự (21 nguyên âm + 19 phụ âm)', correct: true },
          { label: 'C', text: '29 ký tự', correct: false },
          { label: 'D', text: '36 ký tự', correct: false },
        ],
      },
      {
        code: 'Q_HG09_2',
        prompt: 'Do quy tắc mũi hóa (ㅂ gặp ㄴ biến thành ㅁ), câu "감사합니다" (Xin cảm ơn) được phát âm chuẩn là gì?',
        highlight: '감사합니다',
        explanation: 'Patchim ㅂ của 합 đứng trước phụ âm ㄴ của 니 nên biến âm thành ㅁ -> [감사함니다].',
        options: [
          { label: 'A', text: '[감사함니다]', correct: true },
          { label: 'B', text: '[감사합니다]', correct: false },
          { label: 'C', text: '[감삽니다]', correct: false },
          { label: 'D', text: '[감사하니다]', correct: false },
        ],
      },
      {
        code: 'Q_HG09_3',
        prompt: 'Do quy tắc bật hơi hóa (ㄱ + ㅎ -> ㅋ), từ "축하해요" (Chúc mừng) được phát âm là gì?',
        highlight: '축하해요',
        explanation: 'Patchim ㄱ của 축 kết hợp với phụ âm ㅎ của 하 tạo thành âm bật hơi [ㅋ] -> [추카해요].',
        options: [
          { label: 'A', text: '[추카해요]', correct: true },
          { label: 'B', text: '[축아해요]', correct: false },
          { label: 'C', text: '[추가해요]', correct: false },
          { label: 'D', text: '[충하해요]', correct: false },
        ],
      },
    ],
  },
]

// 4. Định nghĩa các chủ đề & buổi học mở đầu cho 6 chặng còn lại (Sơ cấp 1 -> Cao cấp 2)
const higherLevelsData = [
  {
    levelCode: 'LEVEL_1_ELEM1',
    badge: '1급',
    color: 'blue',
    title: 'Sơ cấp 1',
    topik: 'TOPIK I',
    textbook: 'You Speak Korean! Book 1 & NIKL A',
    desc: 'Từ vựng & mẫu câu cơ bản, chào hỏi, giới thiệu bản thân, số đếm và giao tiếp đời thường.',
    skills: ['Từ vựng', 'Ngữ pháp', 'Luyện đề', 'Ôn tập & kiểm tra'],
    order: 2,
    topics: [
      {
        code: 'TOPIC_L1_1',
        title: 'Chủ đề 1: Chào hỏi & Giới thiệu bản thân (인사와 소개)',
        desc: 'Cách chào hỏi lịch sự, giới thiệu tên, quốc tịch và nghề nghiệp theo chuẩn TOPIK I.',
        lessons: [
          {
            code: 'L1_LESSON_01',
            num: 1,
            title: 'Bài 1: Xin chào! Tôi là học viên Việt Nam (안녕하세요, 저는 베트남 학생입니다)',
            subtitle: 'Ngữ pháp danh từ + 입니다/입니까, tiểu từ chủ ngữ 은/는 và từ vựng quốc gia - nghề nghiệp.',
            objective: 'Giới thiệu được tên, quốc tịch, nghề nghiệp bằng cấu trúc N-입니다 và N-이에요/예요.',
            grammar: {
              code: 'GR_L1_01',
              pattern: 'N + 입니다 / 입니까?',
              meaning: 'Là N / Có phải là N không? (Đuôi câu trang trọng)',
              usage: 'Gắn trực tiếp vào sau danh từ để giới thiệu hoặc hỏi thông tin trong bối cảnh lịch sự, trang trọng.',
              conj: 'Không phân biệt danh từ có hay không có Patchim: 학생 + 입니다 -> 학생입니다.',
              exKo: '저는 베트남 사람입니다.',
              exVi: 'Tôi là người Việt Nam.',
            },
            questions: [
              {
                code: 'Q_L1_01_1',
                prompt: 'Điền tiểu từ thích hợp vào chỗ trống: "저___ 학생입니다." (Tôi là học sinh)',
                highlight: '저___ 학생입니다.',
                explanation: '저 không có Patchim nên đi với tiểu từ chủ đề 는 -> 저는.',
                options: [
                  { label: 'A', text: '은', correct: false },
                  { label: 'B', text: '는', correct: true },
                  { label: 'C', text: '을', correct: false },
                  { label: 'D', text: '를', correct: false },
                ],
              },
              {
                code: 'Q_L1_01_2',
                prompt: 'Câu hỏi trang trọng của "학생입니다" (Là học sinh) là gì?',
                highlight: '학생___?',
                explanation: 'Đuôi câu nghi vấn trang trọng của 입니다 là 입니까?.',
                options: [
                  { label: 'A', text: '학생입니까?', correct: true },
                  { label: 'B', text: '학생이다?', correct: false },
                  { label: 'C', text: '학생을?', correct: false },
                  { label: 'D', text: '학생에서?', correct: false },
                ],
              },
            ],
          },
          {
            code: 'L1_LESSON_02',
            num: 2,
            title: 'Bài 2: Sinh hoạt hàng ngày & Địa điểm (일상생활과 장소)',
            subtitle: 'Cách chia đuôi câu thân mật lịch sự -아요/어요 và tiểu từ chỉ hướng/địa điểm 에, 에서.',
            objective: 'Chia đúng động từ/tính từ với -아요/어요 và phân biệt rõ 에 (đến/ở) với 에서 (làm gì tại đâu).',
            grammar: {
              code: 'GR_L1_02',
              pattern: 'V/A + -아요 / -어요 / -해요',
              meaning: 'Đuôi câu trần thuật/nghi vấn lịch sự thân mật ở thì hiện tại',
              usage: 'Gắn sau thân động từ hoặc tính từ. Nguyên âm ㅏ/ㅗ cộng -아요; nguyên âm khác cộng -어요; 하다 biến thành 해요.',
              conj: '가다 -> 가요, 먹다 -> 먹어요, 공부하다 -> 공부해요.',
              exKo: '도서관에서 한국어를 공부해요.',
              exVi: 'Tôi học tiếng Hàn ở thư viện.',
            },
            questions: [
              {
                code: 'Q_L1_02_1',
                prompt: 'Động từ "먹다" (ăn) khi chia với đuôi -아요/어요 sẽ thành dạng nào?',
                highlight: '먹다 + -아요/어요',
                explanation: 'Thân từ 먹 chứa nguyên âm ㅓ (khác ㅏ/ㅗ) nên cộng với -어요 -> 먹어요.',
                options: [
                  { label: 'A', text: '먹아요', correct: false },
                  { label: 'B', text: '먹어요', correct: true },
                  { label: 'C', text: '먹해요', correct: false },
                  { label: 'D', text: '먹여요', correct: false },
                ],
              },
              {
                code: 'Q_L1_02_2',
                prompt: 'Chọn tiểu từ đúng: "학교___ 공부를 해요." (Học bài ở trường)',
                highlight: '학교___ 공부를 해요.',
                explanation: 'Khi diễn tả hành động diễn ra tại một địa điểm, dùng tiểu từ 에서.',
                options: [
                  { label: 'A', text: '에서', correct: true },
                  { label: 'B', text: '를', correct: false },
                  { label: 'C', text: '은', correct: false },
                  { label: 'D', text: '과', correct: false },
                ],
              },
            ],
          },
        ],
      },
      {
        code: 'TOPIC_L1_2',
        title: 'Chủ đề 2: Mua sắm, Thời gian & Ẩm thực (쇼핑과 음식)',
        desc: 'Số Thuần Hàn, số Hán Hàn, hỏi giá cả, thời gian và gọi món tại nhà hàng.',
        lessons: [
          {
            code: 'L1_LESSON_03',
            num: 3,
            title: 'Bài 3: Cho tôi 2 phần Kimbap (김밥 두 줄 주세요)',
            subtitle: 'Cấu trúc yêu cầu N + 주세요, danh từ chỉ đơn vị (개, 명, 잔, 병) và số đếm.',
            objective: 'Sử dụng thành thạo số đếm và cấu trúc N 주세요 khi mua sắm và gọi món.',
            grammar: {
              code: 'GR_L1_03',
              pattern: 'N + 주세요',
              meaning: 'Làm ơn cho tôi N',
              usage: 'Dùng khi yêu cầu hoặc gọi món tại cửa hàng, quán ăn.',
              conj: 'Danh từ + 주세요 (예: 물 주세요, 커피 한 잔 주세요).',
              exKo: '사과 세 개하고 우유 한 병 주세요.',
              exVi: 'Làm ơn cho tôi 3 quả táo và 1 chai sữa.',
            },
            questions: [
              {
                code: 'Q_L1_03_1',
                prompt: 'Câu "물 주세요" có nghĩa là gì?',
                highlight: '물 주세요',
                explanation: '물 (nước) + 주세요 (làm ơn cho tôi) = Làm ơn cho tôi nước.',
                options: [
                  { label: 'A', text: 'Làm ơn cho tôi nước', correct: true },
                  { label: 'B', text: 'Nước rất ngon', correct: false },
                  { label: 'C', text: 'Tôi không uống nước', correct: false },
                  { label: 'D', text: 'Nước giá bao nhiêu?', correct: false },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    levelCode: 'LEVEL_2_ELEM2',
    badge: '2급',
    color: 'sky',
    title: 'Sơ cấp 2',
    topik: 'TOPIK I',
    textbook: 'You Speak Korean! Book 2 & NIKL A-B',
    desc: 'Mở rộng vốn từ, ngữ pháp sơ cấp nâng cao, kính ngữ, thời tiết, du lịch và hội thoại tình huống.',
    skills: ['Từ vựng', 'Ngữ pháp', 'Luyện đề', 'Ôn tập & kiểm tra'],
    order: 3,
    topics: [
      {
        code: 'TOPIC_L2_1',
        title: 'Chủ đề 1: Kế hoạch, Kinh nghiệm & Du lịch (여행과 경험)',
        desc: 'Biểu hiện mong muốn -고 싶다, dự định -(으)ㄹ 거예요 và kinh nghiệm -(으)ㄴ 적이 있다.',
        lessons: [
          {
            code: 'L2_LESSON_01',
            num: 1,
            title: 'Bài 1: Kỳ nghỉ này tôi định đi đảo Jeju (방학에 제주도에 갈 거예요)',
            subtitle: 'Thì tương lai dự định -(으)ㄹ 거예요 và biểu hiện mong muốn -고 싶다.',
            objective: 'Trình bày kế hoạch tương lai và mong muốn cá nhân bằng tiếng Hàn.',
            grammar: {
              code: 'GR_L2_01',
              pattern: 'V + -고 싶다',
              meaning: 'Muốn làm V',
              usage: 'Gắn vào sau thân động từ để bày tỏ mong muốn, nguyện vọng của người nói.',
              conj: 'Không phân biệt Patchim: 가다 -> 가고 싶다, 먹다 -> 먹고 싶다.',
              exKo: '방학에 제주도로 여행하고 싶어요.',
              exVi: 'Tôi muốn đi du lịch đảo Jeju vào kỳ nghỉ.',
            },
            questions: [
              {
                code: 'Q_L2_01_1',
                prompt: 'Để nói "Tôi muốn xem phim", ta chọn câu nào đúng ngữ pháp?',
                highlight: '보다 (xem) + -고 싶다',
                explanation: '영화를 보다 -> 영화를 보고 싶어요.',
                options: [
                  { label: 'A', text: '영화를 보고 싶어요.', correct: true },
                  { label: 'B', text: '영화를 봐고 싶어요.', correct: false },
                  { label: 'C', text: '영화를 보은 싶어요.', correct: false },
                  { label: 'D', text: '영화를 볼 싶어요.', correct: false },
                ],
              },
            ],
          },
          {
            code: 'L2_LESSON_02',
            num: 2,
            title: 'Bài 2: Cuộc hẹn & Lý do (약속과 이유)',
            subtitle: 'Liên từ chỉ nguyên nhân -아서/어서 và cấu trúc rủ rê -(으)ㄹ까요?.',
            objective: 'Đặt lịch hẹn, nêu lý do từ chối lịch sự và đề xuất hoạt động chung.',
            grammar: {
              code: 'GR_L2_02',
              pattern: 'V/A + -아서 / -어서 / -해서',
              meaning: 'Vì ... nên ... / Làm V1 rồi làm V2',
              usage: 'Biểu thị nguyên nhân - kết quả hoặc trình tự hai hành động có liên hệ chặt chẽ.',
              conj: '바쁘다 -> 바빠서, 늦다 -> 늦어서, 피곤하다 -> 피곤해서.',
              exKo: '비가 와서 집에 있었어요.',
              exVi: 'Vì trời mưa nên tôi đã ở nhà.',
            },
            questions: [
              {
                code: 'Q_L2_02_1',
                prompt: 'Tính từ "바쁘다" (bận rộn) khi kết hợp với -아서/어서 biến đổi thành gì?',
                highlight: '바쁘다 + -아서/어서',
                explanation: 'Bất quy tắc ㅡ: bỏ ㅡ, nguyên âm trước là ㅏ nên cộng -아서 -> 바빠서.',
                options: [
                  { label: 'A', text: '바빠서', correct: true },
                  { label: 'B', text: '바뻐서', correct: false },
                  { label: 'C', text: '바쁘아서', correct: false },
                  { label: 'D', text: '바쁘해서', correct: false },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    levelCode: 'LEVEL_3_INTER1',
    badge: '3급',
    color: 'amber',
    title: 'Trung cấp 1',
    topik: 'TOPIK II',
    textbook: 'You Speak Korean! Book 3, NIKL B & Tatoeba',
    desc: 'Đọc hiểu đoạn văn, ngữ pháp trung cấp, câu gián tiếp và sắc thái lịch sự.',
    skills: ['Từ vựng', 'Ngữ pháp', 'Luyện đề', 'Ôn tập & kiểm tra'],
    order: 4,
    topics: [
      {
        code: 'TOPIC_L3_1',
        title: 'Chủ đề 1: Đời sống học đường & Công sở (대학 생활과 직장)',
        desc: 'Biểu hiện biến đổi trạng thái -게 되다, lời khuyên -(으)면 좋겠다 và trích dẫn gián tiếp.',
        lessons: [
          {
            code: 'L3_LESSON_01',
            num: 1,
            title: 'Bài 1: Thích nghi môi trường mới (새로운 환경에 적응하게 되었어요)',
            subtitle: 'Cấu trúc chỉ sự thay đổi hoàn cảnh V-게 되다 và từ vựng TOPIK II cấp 3.',
            objective: 'Sử dụng V-게 되다 để diễn tả kết quả hoặc sự chuyển biến khách quan.',
            grammar: {
              code: 'GR_L3_01',
              pattern: 'V + -게 되다',
              meaning: 'Trở nên / Được (hoặc phải) làm gì do hoàn cảnh khách quan',
              usage: 'Diễn tả một sự thay đổi trạng thái hoặc quyết định xảy ra do tác động bên ngoài.',
              conj: 'Gắn trực tiếp -게 되다 sau thân động từ: 알게 되다, 일하게 되다.',
              exKo: '한국 회사에서 일하게 되었어요.',
              exVi: 'Tôi đã được vào làm việc tại một công ty Hàn Quốc.',
            },
            questions: [
              {
                code: 'Q_L3_01_1',
                prompt: 'Cấu trúc "V + -게 되다" dùng để diễn tả ý nghĩa nào sau đây?',
                highlight: '한국어를 좋아하게 되었어요.',
                explanation: 'V + -게 되다 diễn tả sự thay đổi trạng thái hoặc kết quả dẫn đến do hoàn cảnh.',
                options: [
                  { label: 'A', text: 'Sự thay đổi trạng thái hoặc hoàn cảnh dẫn đến hành động', correct: true },
                  { label: 'B', text: 'Sự cấm đoán tuyệt đối', correct: false },
                  { label: 'C', text: 'Hành động đang diễn ra ngay lúc nói', correct: false },
                  { label: 'D', text: 'Sự hối tiếc về quá khứ', correct: false },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    levelCode: 'LEVEL_4_INTER2',
    badge: '4급',
    color: 'violet',
    title: 'Trung cấp 2',
    topik: 'TOPIK II',
    textbook: 'You Speak Korean! Book 4, NIKL B-C & Tatoeba',
    desc: 'Văn viết, tin tức cơ bản, biểu đồ câu 53 TOPIK II và ngữ pháp nâng cao dần.',
    skills: ['Từ vựng', 'Ngữ pháp', 'Luyện đề', 'Ôn tập & kiểm tra'],
    order: 5,
    topics: [
      {
        code: 'TOPIC_L4_1',
        title: 'Chủ đề 1: Văn hóa, Truyền thông & Phân tích biểu đồ (문화와 언론)',
        desc: 'Ngữ pháp nguyên nhân khách quan -(으)로 인해 và mẫu câu mô tả số liệu TOPIK II Viết câu 53.',
        lessons: [
          {
            code: 'L4_LESSON_01',
            num: 1,
            title: 'Bài 1: Phân tích xu hướng tiêu dùng & Biểu đồ (소비 변화와 그래프 분석)',
            subtitle: 'Cấu trúc N-(으)로 인해 và từ vựng tăng/giảm số liệu (증가하다, 감소하다, 차지하다).',
            objective: 'Viết được đoạn văn 200–300 chữ phân tích biểu đồ theo chuẩn TOPIK II câu 53.',
            grammar: {
              code: 'GR_L4_01',
              pattern: 'N + -(으)로 인해(서)',
              meaning: 'Do, bởi vì N (dùng trong văn viết và tin tức)',
              usage: 'Biểu thị nguyên nhân mang tính xã hội, khách quan trong văn bản báo chí hoặc bài viết học thuật.',
              conj: 'Danh từ có Patchim (trừ ㄹ) + -으로 인해; không có Patchim hoặc Patchim ㄹ + -로 인해.',
              exKo: '기술 발전으로 인해 생활이 편리해졌다.',
              exVi: 'Do sự phát triển công nghệ nên cuộc sống đã trở nên tiện lợi hơn.',
            },
            questions: [
              {
                code: 'Q_L4_01_1',
                prompt: 'Từ vựng nào thường dùng để diễn tả "tăng lên" trong bài viết phân tích biểu đồ TOPIK II?',
                highlight: '매출이 크게 ___했다.',
                explanation: '증가하다 là tăng lên; 감소하다 là giảm xuống.',
                options: [
                  { label: 'A', text: '증가하다', correct: true },
                  { label: 'B', text: '감소하다', correct: false },
                  { label: 'C', text: '포기하다', correct: false },
                  { label: 'D', text: '거절하다', correct: false },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    levelCode: 'LEVEL_5_ADV1',
    badge: '5급',
    color: 'rose',
    title: 'Cao cấp 1',
    topik: 'TOPIK II',
    textbook: 'NIKL C & HANGO Học thuật',
    desc: 'Từ vựng học thuật, văn phong trang trọng, nghị luận câu 54 và chủ đề xã hội.',
    skills: ['Từ vựng', 'Ngữ pháp', 'Luyện đề', 'Ôn tập & kiểm tra'],
    order: 6,
    topics: [
      {
        code: 'TOPIC_L5_1',
        title: 'Chủ đề 1: Kinh tế, Môi trường & Nghị luận xã hội (경제와 환경 논술)',
        desc: 'Ngữ pháp học thuật -는 바이다, -(으)ㄹ 따름이다 và lập luận đa chiều.',
        lessons: [
          {
            code: 'L5_LESSON_01',
            num: 1,
            title: 'Bài 1: Phát triển bền vững và Bảo vệ môi trường (지속 가능한 발전과 환경 보호)',
            subtitle: 'Từ vựng học thuật NIKL C và cấu trúc nhấn mạnh điều kiện N-에 달려 있다.',
            objective: 'Đọc hiểu văn bản nghị luận xã hội và sử dụng cấu trúc N-에 달려 있다.',
            isAi: 1,
            needsReview: 1,
            grammar: {
              code: 'GR_L5_01',
              pattern: 'N + -에 달려 있다',
              meaning: 'Phụ thuộc vào N / Tùy thuộc vào N',
              usage: 'Nhấn mạnh kết quả của một vấn đề phụ thuộc hoàn toàn vào yếu tố N đứng trước.',
              conj: 'Danh từ + -에 달려 있다 (예: 성공은 노력에 달려 있다).',
              exKo: '환경 보호의 성공은 시민들의 의식에 달려 있다.',
              exVi: 'Sự thành công của việc bảo vệ môi trường phụ thuộc vào ý thức của người dân.',
            },
            questions: [
              {
                code: 'Q_L5_01_1',
                prompt: 'Biểu hiện "성공은 노력에 달려 있다" có nghĩa là gì?',
                highlight: '노력에 달려 있다',
                explanation: '-에 달려 있다 có nghĩa là phụ thuộc/tùy thuộc vào điều gì đó.',
                options: [
                  { label: 'A', text: 'Thành công phụ thuộc vào sự nỗ lực', correct: true },
                  { label: 'B', text: 'Thành công không liên quan đến nỗ lực', correct: false },
                  { label: 'C', text: 'Cần từ bỏ nỗ lực để thành công', correct: false },
                  { label: 'D', text: 'Đã thành công nhờ may mắn', correct: false },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    levelCode: 'LEVEL_6_ADV2',
    badge: '6급',
    color: 'red',
    title: 'Cao cấp 2',
    topik: 'TOPIK II',
    textbook: 'NIKL C Nâng cao & HANGO Biên soạn',
    desc: 'Ngôn ngữ học thuật chuyên sâu, thành ngữ Hán Hàn (사자성어), văn bản pháp lý - khoa học và làm chủ TOPIK 6급.',
    skills: ['Từ vựng', 'Ngữ pháp', 'Luyện đề', 'Ôn tập & kiểm tra'],
    order: 7,
    topics: [
      {
        code: 'TOPIC_L6_1',
        title: 'Chủ đề 1: Tư duy phản biện & Văn bản học thuật chuyên sâu (학술 담화와 사자성어)',
        desc: 'Đọc hiểu chuyên ngành, thành ngữ 4 chữ (사자성어) và hoàn thiện kỹ năng viết 600–700 chữ.',
        lessons: [
          {
            code: 'L6_LESSON_01',
            num: 1,
            title: 'Bài 1: Đạo đức AI và Xã hội tương lai (인공지능 윤리와 미래 사회)',
            subtitle: 'Phân tích lập luận học thuật và cấu trúc nhượng bộ nâng cao -(으)ㄹ지언정.',
            objective: 'Nắm vững từ vựng học thuật cấp 6 và cấu trúc -(으)ㄹ지언정 trong bài luận TOPIK II.',
            isAi: 1,
            needsReview: 1,
            grammar: {
              code: 'GR_L6_01',
              pattern: 'V/A + -(으)ㄹ지언정',
              meaning: 'Thà rằng ... chứ quyết không ... / Dù có ... đi chăng nữa',
              usage: 'Biểu thị quyết tâm mạnh mẽ hoặc sự nhượng bộ giả định trong văn viết trang trọng.',
              conj: 'Có Patchim + -을지언정; không Patchim hoặc ㄹ + -ㄹ지언정.',
              exKo: '실패할지언정 결코 포기하지 않겠다.',
              exVi: 'Dù có thất bại đi chăng nữa tôi cũng quyết không bỏ cuộc.',
            },
            questions: [
              {
                code: 'Q_L6_01_1',
                prompt: 'Cấu trúc "-(으)ㄹ지언정" mang sắc thái ngữ nghĩa nào trong văn phong cao cấp?',
                highlight: '실패할지언정 포기하지 않겠다.',
                explanation: '-(으)ㄹ지언정 nhấn mạnh dù thừa nhận giả định vế trước nhưng quyết không để vế sau xảy ra.',
                options: [
                  { label: 'A', text: 'Dù có ... đi chăng nữa thì vẫn quyết tâm ...', correct: true },
                  { label: 'B', text: 'Vừa mới làm xong hành động', correct: false },
                  { label: 'C', text: 'Do không biết nên mới làm', correct: false },
                  { label: 'D', text: 'Hỏi ý kiến người nghe', correct: false },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
]

// 5. Sinh file SQL giao dịch (Transaction + Idempotent MERGE/IF NOT EXISTS)
const sql = []
sql.push('USE [HangoDatasetDB];')
sql.push('SET NOCOUNT ON;')
sql.push('ALTER TABLE dbo.ContentSources ALTER COLUMN DataFormat NVARCHAR(255) NOT NULL;')
sql.push('ALTER TABLE dbo.ContentSources ALTER COLUMN AvailabilityStatus NVARCHAR(500) NOT NULL;')
sql.push('ALTER TABLE dbo.ContentSources ALTER COLUMN DataType NVARCHAR(500) NOT NULL;')
sql.push('SET XACT_ABORT ON;')
sql.push('BEGIN TRANSACTION;')
sql.push("DELETE FROM dbo.Vocabulary WHERE VocabCode LIKE 'NIKL_SEED_R%_%?%';")

// 5.1. ContentSources
const sources = [
  {
    code: 'SOURCE_NIKL',
    name: 'Korean Learners Dictionary – NIKL',
    dataset: '국립국어원 한국어기초사전 Open API (krdict)',
    url: 'https://krdict.korean.go.kr/openApi/openApiInfo',
    type: 'Từ vựng, từ loại, phát âm, giải thích & ví dụ song ngữ Hàn - Việt',
    count: 50000,
    format: 'XML / JSON REST API',
    levels: 'Sơ cấp 1, Sơ cấp 2, Trung cấp 1, Trung cấp 2, Cao cấp 1, Cao cấp 2',
    license: 'CC BY-SA 2.0 KR (National Institute of Korean Language)',
    org: 'National Institute of Korean Language (국립국어원)',
    table: 'dbo.Vocabulary',
    status: 'Cần API Key cá nhân khi gọi trực tiếp; đã tích hợp phân loại NIKL A/B/C qua Combined Seed',
    notes: 'API chính thức yêu cầu đăng ký key tại krdict.korean.go.kr. Dữ liệu phân cấp NIKL A/B/C đã được nạp vào dbo.Vocabulary.',
  },
  {
    code: 'SOURCE_TATOEBA',
    name: 'Tatoeba Parallel Corpus (Korean - Vietnamese)',
    dataset: 'Tatoeba API v0 & Downloads (kor-vie)',
    url: 'https://tatoeba.org/en/api_v0/search?from=kor&to=vie',
    type: 'Câu ví dụ tiếng Hàn và bản dịch tiếng Việt',
    count: tatoebaPairs.length,
    format: 'JSON / TSV',
    levels: 'Sơ cấp 1, Sơ cấp 2, Trung cấp 1, Trung cấp 2',
    license: 'CC BY 2.0 FR',
    org: 'Tatoeba Community Contributors',
    table: 'dbo.Vocabulary, dbo.LessonSections',
    status: 'Đã tải bản gốc & làm sạch 60 cặp câu song ngữ Hàn-Việt (trên tổng 1.000 câu của Tatoeba)',
    notes: 'Lưu bản gốc tại data/sources/tatoeba_kor_vie_cleaned.json.',
  },
  {
    code: 'SOURCE_UPENN',
    name: 'You Speak Korean! Book 1–4 – University of Pennsylvania',
    dataset: 'UPenn Korean Language Program Curriculum Reference',
    url: 'https://www.sas.upenn.edu/korean/',
    type: 'Khung chủ đề, cấu trúc bài học, ngữ pháp & hội thoại mẫu',
    count: 4,
    format: 'Giáo trình tham khảo (Book 1–4)',
    levels: 'Sơ cấp 1, Sơ cấp 2, Trung cấp 1, Trung cấp 2',
    license: 'Academic Fair Use (Chỉ tham khảo khung chủ đề & biên soạn lại nội dung, ghi rõ nguồn)',
    org: 'University of Pennsylvania Korean Language Program',
    table: 'dbo.LearningTopics, dbo.Lessons, dbo.Grammar',
    status: 'Đã đối chiếu khung chủ đề Book 1–4 và biên soạn lại nội dung hợp lệ',
    notes: 'Không sao chép nguyên văn tài liệu bản quyền; biên soạn lại ví dụ và ghi nguồn rõ ràng.',
  },
  {
    code: 'SOURCE_JULIENSHIM',
    name: 'Korean Vocabulary Database Seed (NIKL + TOPIK)',
    dataset: 'julienshim/combined_korean_vocabulary_list (results.tsv)',
    url: 'https://github.com/julienshim/combined_korean_vocabulary_list',
    type: 'Từ vựng tiếng Hàn, từ loại, Hanja, giải thích tiếng Hàn, cấp độ NIKL (A/B/C) & TOPIK (초급/중급)',
    count: cleanedSeedVocab.length,
    format: 'TSV (UTF-8)',
    levels: 'Sơ cấp 1, Sơ cấp 2, Trung cấp 1, Trung cấp 2, Cao cấp 1, Cao cấp 2',
    license: 'MIT License',
    org: 'Julien Shim (Open Source Contributors)',
    table: 'dbo.Vocabulary',
    status: 'Đã tải file gốc results.tsv (337 KB), làm sạch và import vào SQL Server',
    notes: 'Lưu bản gốc tại data/sources/julienshim_combined_korean_vocabulary_list.tsv.',
  },
  {
    code: 'SOURCE_VI_KO_CSV',
    name: 'Vietnamese - Korean.csv',
    dataset: 'File CSV từ vựng Hàn - Việt nội bộ',
    url: 'N/A (Kiểm tra toàn bộ ổ đĩa dự án)',
    type: 'Từ vựng tiếng Hàn - tiếng Việt',
    count: 0,
    format: 'CSV',
    levels: 'Sơ cấp 1, Sơ cấp 2',
    license: 'Internal Project Asset',
    org: 'HANGO Project',
    table: 'dbo.Vocabulary',
    status: 'Không tìm thấy file Vietnamese - Korean.csv trong thư mục dự án; đã thay thế bằng bộ từ vựng Hàn-Việt chuẩn hóa + Julienshim TSV + Tatoeba',
    notes: 'Đã kiểm tra thực tế toàn bộ thư mục dự án theo đúng yêu cầu mục 5.1.',
  },
  {
    code: 'SOURCE_HANGO_CURATED',
    name: 'HANGO Standard Hangeul & TOPIK Curriculum + PE92 Handwriting',
    dataset: 'HANGO Curated Korean-Vietnamese Curriculum & SQL Server PE92 Dataset',
    url: 'local://HangoDatasetDB/dbo.HangulCharacterClasses',
    type: 'Lý thuyết 9 buổi Hangeul, quy tắc phát âm, từ vựng Hàn-Việt, bài tập trắc nghiệm & 134.400 mẫu chữ viết tay',
    count: 134400,
    format: 'SQL Server Relational & VARBINARY(MAX)',
    levels: 'Hangeul, Sơ cấp 1, Sơ cấp 2, Trung cấp 1, Trung cấp 2, Cao cấp 1, Cao cấp 2',
    license: 'HANGO Educational Content (Nội dung Cao cấp 1 & 2 đánh dấu cần chuyên gia kiểm duyệt)',
    org: 'HANGO Curriculum Team',
    table: 'dbo.LearningLevels, dbo.Lessons, dbo.Exercises, dbo.Questions, dbo.HangulCharacterClasses',
    status: 'Đã có đầy đủ trong SQL Server HangoDatasetDB',
    notes: 'Tích hợp trực tiếp với 64 lớp chữ viết tay tiếng Hàn trong HangoDatasetDB.',
  },
]

for (const s of sources) {
  sql.push(`
IF NOT EXISTS (SELECT 1 FROM dbo.ContentSources WHERE SourceCode = ${esc(s.code)})
BEGIN
    INSERT INTO dbo.ContentSources (
        SourceCode, SourceName, DatasetOrApiName, SourceUrl, DataType,
        VerifiedRecordCount, DataFormat, TargetLevels, LicenseName,
        AuthorOrOrganization, TargetTable, AvailabilityStatus, Notes
    ) VALUES (
        ${esc(s.code)}, ${esc(s.name)}, ${esc(s.dataset)}, ${esc(s.url)}, ${esc(s.type)},
        ${s.count}, ${esc(s.format)}, ${esc(s.levels)}, ${esc(s.license)},
        ${esc(s.org)}, ${esc(s.table)}, ${esc(s.status)}, ${esc(s.notes)}
    );
END
ELSE
BEGIN
    UPDATE dbo.ContentSources
    SET VerifiedRecordCount = ${s.count},
        AvailabilityStatus = ${esc(s.status)},
        UpdatedAt = SYSUTCDATETIME()
    WHERE SourceCode = ${esc(s.code)};
END`)
}

// 5.2. LearningPaths
sql.push(`
IF NOT EXISTS (SELECT 1 FROM dbo.LearningPaths WHERE PathCode = 'HANGO_MAIN_PATH')
BEGIN
    INSERT INTO dbo.LearningPaths (PathCode, Title, Subtitle, Description, Status)
    VALUES (
        'HANGO_MAIN_PATH',
        N'Lộ trình học tiếng Hàn',
        N'Một con đường liền mạch từ bảng chữ cái Hangeul đến TOPIK II.',
        N'Một con đường liền mạch từ bảng chữ cái Hangeul đến TOPIK II. Mỗi chặng TOPIK bám sát giáo trình chuẩn, kèm luyện Nghe · Đọc · Viết, Flashcard SRS, Luyện viết PE92 và bài kiểm tra mở khóa tuần tự.',
        'Published'
    );
END
DECLARE @PathId INT = (SELECT TOP 1 PathId FROM dbo.LearningPaths WHERE PathCode = 'HANGO_MAIN_PATH');
DECLARE @SourceHango INT = (SELECT TOP 1 SourceId FROM dbo.ContentSources WHERE SourceCode = 'SOURCE_HANGO_CURATED');
DECLARE @SourceJulien INT = (SELECT TOP 1 SourceId FROM dbo.ContentSources WHERE SourceCode = 'SOURCE_JULIENSHIM');
DECLARE @SourceTatoeba INT = (SELECT TOP 1 SourceId FROM dbo.ContentSources WHERE SourceCode = 'SOURCE_TATOEBA');
DECLARE @SourceUpenn INT = (SELECT TOP 1 SourceId FROM dbo.ContentSources WHERE SourceCode = 'SOURCE_UPENN');
`)

// 5.3. Chặng 1: Hangeul (LEVEL_0_HANGEUL)
sql.push(`
IF NOT EXISTS (SELECT 1 FROM dbo.LearningLevels WHERE LevelCode = 'LEVEL_0_HANGEUL')
BEGIN
    INSERT INTO dbo.LearningLevels (
        PathId, LevelCode, BadgeText, BadgeColor, Title, TopikLevel,
        TextbookName, Description, SkillTagsJson, DisplayOrder, Status
    ) VALUES (
        @PathId, 'LEVEL_0_HANGEUL', N'한글', 'emerald', N'Bảng chữ cái Hangeul', N'Nhập môn',
        N'Quy tắc chuẩn Hangeul (국립국어원)',
        N'Nền tảng: nguyên âm, phụ âm, patchim và quy tắc phát âm cơ bản.',
        N'["Từ vựng","Nghe hiểu"]',
        1, 'Published'
    );
END
ELSE
BEGIN
    UPDATE dbo.LearningLevels
    SET SkillTagsJson = N'["Từ vựng","Nghe hiểu"]',
        Description = N'Nền tảng: nguyên âm, phụ âm, patchim và quy tắc phát âm cơ bản.',
        UpdatedAt = SYSUTCDATETIME()
    WHERE LevelCode = 'LEVEL_0_HANGEUL';
END
DECLARE @Level0Id INT = (SELECT TOP 1 LevelId FROM dbo.LearningLevels WHERE LevelCode = 'LEVEL_0_HANGEUL');
IF NOT EXISTS (SELECT 1 FROM dbo.LevelUnlockRules WHERE LevelId = @Level0Id)
BEGIN
    INSERT INTO dbo.LevelUnlockRules (LevelId, PrerequisiteLevelId, RequiredCompletedLessonsPercent, MinAverageQuizScorePercent, IsDefaultUnlocked)
    VALUES (@Level0Id, NULL, 100, 80, 1);
END
`)

const hangeulTopics = [
  { code: 'TOPIC_HG_1', title: 'Chủ đề 1: 10 Nguyên âm đơn cơ bản (기본 모음)', desc: 'Làm quen triết lý Thiên - Địa - Nhân và 10 nguyên âm đơn ㅏ, ㅑ, ㅓ, ㅕ, ㅗ, ㅛ, ㅜ, ㅠ, ㅡ, ㅣ.', order: 1 },
  { code: 'TOPIC_HG_2', title: 'Chủ đề 2: 19 Phụ âm đơn, Bật hơi & Phụ âm đôi (자음과 쌍자음)', desc: 'Làm chủ 14 phụ âm cơ bản và 5 phụ âm căng ㄲ, ㄸ, ㅃ, ㅆ, ㅉ.', order: 2 },
  { code: 'TOPIC_HG_3', title: 'Chủ đề 3: 11 Nguyên âm đôi / Nguyên âm ghép (복합 모음)', desc: 'Cách ghép và phát âm chuẩn 11 nguyên âm đôi ㅐ, ㅒ, ㅔ, ㅖ, ㅘ, ㅙ, ㅚ, ㅝ, ㅞ, ㅟ, ㅢ.', order: 3 },
  { code: 'TOPIC_HG_4', title: 'Chủ đề 4: Phụ âm cuối Patchim & Tổng ôn Hangeul (받침과 총정리)', desc: '7 nhóm âm đại diện của Patchim, quy tắc nối âm, biến âm và tổng ôn 40 ký tự Hangeul.', order: 4 },
]

for (const t of hangeulTopics) {
  sql.push(`
IF NOT EXISTS (SELECT 1 FROM dbo.LearningTopics WHERE TopicCode = ${esc(t.code)})
BEGIN
    INSERT INTO dbo.LearningTopics (LevelId, TopicCode, Title, Description, DisplayOrder, Status)
    VALUES (@Level0Id, ${esc(t.code)}, ${esc(t.title)}, ${esc(t.desc)}, ${t.order}, 'Published');
END`)
}

// Sinh SQL cho 9 buổi học Hangeul
for (const l of hangeulLessons) {
  sql.push(`
DECLARE @TopicId_${l.code} INT = (SELECT TOP 1 TopicId FROM dbo.LearningTopics WHERE TopicCode = ${esc(l.topicCode)});
IF NOT EXISTS (SELECT 1 FROM dbo.Lessons WHERE LessonCode = ${esc(l.code)})
BEGIN
    INSERT INTO dbo.Lessons (
        TopicId, LevelId, LessonCode, LessonNumber, Title, Subtitle,
        LearningObjective, EstimatedMinutes, DisplayOrder, Status, IsAiCompiled, NeedsExpertReview
    ) VALUES (
        @TopicId_${l.code}, @Level0Id, ${esc(l.code)}, ${l.num}, ${esc(l.title)}, ${esc(l.subtitle)},
        ${esc(l.objective)}, ${l.estimatedMinutes || 30}, ${l.num}, 'Published', 0, 0
    );
END
ELSE
BEGIN
    UPDATE dbo.Lessons
    SET Title = ${esc(l.title)},
        Subtitle = ${esc(l.subtitle)},
        LearningObjective = ${esc(l.objective)},
        EstimatedMinutes = ${l.estimatedMinutes || 30},
        UpdatedAt = SYSUTCDATETIME()
    WHERE LessonCode = ${esc(l.code)};
END
DECLARE @LessonId_${l.code} INT = (SELECT TOP 1 LessonId FROM dbo.Lessons WHERE LessonCode = ${esc(l.code)});

IF NOT EXISTS (SELECT 1 FROM dbo.LessonCompletionRules WHERE LessonId = @LessonId_${l.code})
BEGIN
    INSERT INTO dbo.LessonCompletionRules (LessonId, RequireAllMandatoryActivities, RequireFinalQuizPass, MinQuizPassPercent, AllowUnlimitedRetakes, UnlockNextLessonOnComplete)
    VALUES (@LessonId_${l.code}, 1, 1, 80, 1, 1);
END

IF NOT EXISTS (SELECT 1 FROM dbo.LessonSections WHERE SectionCode = ${esc(l.code + '_SEC_JAMO')})
BEGIN
    INSERT INTO dbo.LessonSections (LessonId, SectionCode, SectionType, Title, ContentHtmlOrMd, ExamplesJson, DisplayOrder, Status)
    VALUES (
        @LessonId_${l.code},
        ${esc(l.code + '_SEC_JAMO')},
        'jamo_cards',
        N'Bảng chữ cái & Phát âm tương tác',
        N'Bấm vào từng chữ để nghe âm đọc. Học thuộc mặt chữ + cách đọc rồi thử Flashcard / Trắc nghiệm, hoặc mở File viết để in phiếu tô chữ.',
        ${esc(JSON.stringify(l.jamoCards || []))},
        1,
        'Published'
    );
END
ELSE
BEGIN
    UPDATE dbo.LessonSections
    SET ExamplesJson = ${esc(JSON.stringify(l.jamoCards || []))},
        ContentHtmlOrMd = N'Bấm vào từng chữ để nghe âm đọc. Học thuộc mặt chữ + cách đọc rồi thử Flashcard / Trắc nghiệm, hoặc mở File viết để in phiếu tô chữ.',
        DisplayOrder = 1,
        UpdatedAt = SYSUTCDATETIME()
    WHERE SectionCode = ${esc(l.code + '_SEC_JAMO')};
END

IF NOT EXISTS (SELECT 1 FROM dbo.LessonSections WHERE SectionCode = ${esc(l.code + '_SEC_THEORY')})
BEGIN
    INSERT INTO dbo.LessonSections (LessonId, SectionCode, SectionType, Title, ContentHtmlOrMd, ExamplesJson, DisplayOrder, Status)
    VALUES (
        @LessonId_${l.code},
        ${esc(l.code + '_SEC_THEORY')},
        'theory',
        N'Lý thuyết & Quy tắc phát âm trọng tâm',
        ${esc(l.theoryMd)},
        ${esc(JSON.stringify(l.examples))},
        2,
        'Published'
    );
END
ELSE
BEGIN
    UPDATE dbo.LessonSections
    SET DisplayOrder = 2,
        ContentHtmlOrMd = ${esc(l.theoryMd)},
        ExamplesJson = ${esc(JSON.stringify(l.examples))},
        UpdatedAt = SYSUTCDATETIME()
    WHERE SectionCode = ${esc(l.code + '_SEC_THEORY')};
END

IF NOT EXISTS (SELECT 1 FROM dbo.LessonResources WHERE ResourceCode = ${esc(l.code + '_RES_WRITE')})
BEGIN
    INSERT INTO dbo.LessonResources (LessonId, ResourceCode, ResourceType, Title, Description, ResourceUrl, TargetCharsJson, DisplayOrder, Status)
    VALUES (
        @LessonId_${l.code},
        ${esc(l.code + '_RES_WRITE')},
        'writing_sheet',
        ${esc('Phiếu luyện viết ô ly & Mẫu chữ viết tay PE92 - ' + l.title)},
        N'Đối chiếu trực tiếp với mẫu chữ viết tay SQL Server (dbo.HangulCharacterClasses) và luyện viết trên bảng ô ly.',
        N'/ai?tab=handwriting',
        ${esc(JSON.stringify(l.chars))},
        1,
        'Published'
    );
END
DECLARE @ResId_${l.code} INT = (SELECT TOP 1 ResourceId FROM dbo.LessonResources WHERE ResourceCode = ${esc(l.code + '_RES_WRITE')});
`)

  // Từ vựng của buổi học Hangeul
  let vOrder = 1
  for (const v of l.vocabs) {
    sql.push(`
IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = ${esc(v.code)})
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Romanization, VietnameseMeaning, PartOfSpeech,
        ExampleSentenceKo, ExampleSentenceVi, NiklLevel, TopikLevel, TopicName, SourceId, Status
    ) VALUES (
        ${esc(v.code)}, ${esc(v.ko)}, ${esc(v.roman)}, ${esc(v.vi)}, ${esc(v.pos)},
        ${esc(v.exKo)}, ${esc(v.exVi)}, 'A', N'Nhập môn', ${esc(l.title)}, @SourceHango, 'Published'
    );
END
DECLARE @VocabId_${v.code} INT = (SELECT TOP 1 VocabId FROM dbo.Vocabulary WHERE VocabCode = ${esc(v.code)});
IF NOT EXISTS (SELECT 1 FROM dbo.LessonVocabulary WHERE LessonId = @LessonId_${l.code} AND VocabId = @VocabId_${v.code})
BEGIN
    INSERT INTO dbo.LessonVocabulary (LessonId, VocabId, DisplayOrder, IsCoreTerm)
    VALUES (@LessonId_${l.code}, @VocabId_${v.code}, ${vOrder}, 1);
END`)
    vOrder++
  }

  // Bài kiểm tra cuối buổi (Exercise + Questions + Options)
  const exCode = `${l.code}_FINAL_EX`
  sql.push(`
IF NOT EXISTS (SELECT 1 FROM dbo.Exercises WHERE ExerciseCode = ${esc(exCode)})
BEGIN
    INSERT INTO dbo.Exercises (LessonId, ExerciseCode, ExerciseType, Title, Description, PassingScorePercent, TimeLimitSeconds, DisplayOrder, Status)
    VALUES (
        @LessonId_${l.code},
        ${esc(exCode)},
        'final_test',
        ${esc('Bài kiểm tra cuối buổi — ' + l.title)},
        N'Hoàn thành đúng từ 80% trở lên để hoàn thành buổi học và mở khóa buổi tiếp theo.',
        80,
        300,
        1,
        'Published'
    );
END
DECLARE @ExId_${l.code} INT = (SELECT TOP 1 ExerciseId FROM dbo.Exercises WHERE ExerciseCode = ${esc(exCode)});
`)

  let qOrder = 1
  for (const q of l.questions) {
    sql.push(`
IF NOT EXISTS (SELECT 1 FROM dbo.Questions WHERE QuestionCode = ${esc(q.code)})
BEGIN
    INSERT INTO dbo.Questions (ExerciseId, QuestionCode, QuestionType, PromptText, KoreanHighlight, ExplanationVi, Points, DisplayOrder, Status)
    VALUES (
        @ExId_${l.code},
        ${esc(q.code)},
        'multiple_choice',
        ${esc(q.prompt)},
        ${esc(q.highlight)},
        ${esc(q.explanation)},
        20,
        ${qOrder},
        'Published'
    );
END
DECLARE @QId_${q.code} INT = (SELECT TOP 1 QuestionId FROM dbo.Questions WHERE QuestionCode = ${esc(q.code)});
IF NOT EXISTS (SELECT 1 FROM dbo.QuestionOptions WHERE QuestionId = @QId_${q.code})
BEGIN`)
    let optOrder = 1
    for (const opt of q.options) {
      sql.push(`
    INSERT INTO dbo.QuestionOptions (QuestionId, OptionLabel, OptionText, IsCorrect, DisplayOrder)
    VALUES (@QId_${q.code}, ${esc(opt.label)}, ${esc(opt.text)}, ${opt.correct ? 1 : 0}, ${optOrder});`)
      optOrder++
    }
    sql.push(`END`)
    qOrder++
  }

  // Danh sách hoạt động chuẩn theo đúng giao diện mẫu cho từng buổi học Hangeul
  const activities = []
  let actOrder = 1
  if (l.hasWarmup) {
    activities.push({
      code: `${l.code}_ACT_WARMUP`,
      type: 'warmup_quiz',
      title: 'Kiểm tra đầu buổi',
      desc: 'Khởi động nhanh ôn lại các chữ cái đã học ở buổi trước.',
      req: 1,
      exRef: 'NULL',
      resRef: 'NULL',
      order: actOrder++,
      xp: 10,
    })
  }
  activities.push({
    code: `${l.code}_ACT_THEORY`,
    type: 'theory',
    title: `Học (${l.charCountLabel || '5 chữ'})`,
    desc: 'Bấm vào từng chữ để nghe âm đọc và xem quy tắc phát âm, từ vựng.',
    req: 1,
    exRef: 'NULL',
    resRef: 'NULL',
    order: actOrder++,
    xp: 15,
  })
  activities.push({
    code: `${l.code}_ACT_FLASHCARD`,
    type: 'flashcard',
    title: 'Flashcard',
    desc: 'Lật thẻ 3D ghi nhớ mặt chữ, cách phát âm và từ vựng ứng dụng.',
    req: 1,
    exRef: 'NULL',
    resRef: 'NULL',
    order: actOrder++,
    xp: 15,
  })
  activities.push({
    code: `${l.code}_ACT_PRACTICE`,
    type: 'practice_quiz',
    title: 'Trắc nghiệm',
    desc: 'Luyện phản xạ chọn nhanh âm đọc và mặt chữ Hangeul.',
    req: 1,
    exRef: 'NULL',
    resRef: 'NULL',
    order: actOrder++,
    xp: 20,
  })
  if (l.hasWritingSheet) {
    activities.push({
      code: `${l.code}_ACT_WRITING`,
      type: 'writing_sheet',
      title: 'Phiếu luyện viết',
      desc: 'In phiếu tô chữ ô ly và đối chiếu mẫu chữ viết tay PE92 từ SQL Server.',
      req: 1,
      exRef: 'NULL',
      resRef: `@ResId_${l.code}`,
      order: actOrder++,
      xp: 20,
    })
  }
  activities.push({
    code: `${l.code}_ACT_QUIZ`,
    type: 'final_test',
    title: 'Bài kiểm tra',
    desc: 'Hoàn thành bài kiểm tra cuối buổi (đạt >= 80%) để mở khóa buổi học tiếp theo.',
    req: 1,
    exRef: `@ExId_${l.code}`,
    resRef: 'NULL',
    order: actOrder++,
    xp: 50,
  })

  // Ẩn các hoạt động cũ không còn nằm trong danh sách chuẩn của buổi Hangeul
  sql.push(`
UPDATE dbo.LessonActivities
SET Status = 'Archived', IsRequired = 0
WHERE LessonId = @LessonId_${l.code} AND ActivityCode = ${esc(l.code + '_ACT_VOCAB')};
`)

  for (const act of activities) {
    sql.push(`
IF NOT EXISTS (SELECT 1 FROM dbo.LessonActivities WHERE ActivityCode = ${esc(act.code)})
BEGIN
    INSERT INTO dbo.LessonActivities (
        LessonId, ActivityCode, ActivityType, Title, Description,
        IsRequired, ExerciseId, ResourceId, DisplayOrder, XpReward, Status
    ) VALUES (
        @LessonId_${l.code}, ${esc(act.code)}, ${esc(act.type)}, ${esc(act.title)}, ${esc(act.desc)},
        ${act.req}, ${act.exRef}, ${act.resRef}, ${act.order}, ${act.xp}, 'Published'
    );
END
ELSE
BEGIN
    UPDATE dbo.LessonActivities
    SET ActivityType = ${esc(act.type)},
        Title = ${esc(act.title)},
        Description = ${esc(act.desc)},
        IsRequired = ${act.req},
        DisplayOrder = ${act.order},
        Status = 'Published',
        UpdatedAt = SYSUTCDATETIME()
    WHERE ActivityCode = ${esc(act.code)};
END`)
  }
}

// 5.4. Sinh SQL cho 6 chặng còn lại (Sơ cấp 1 -> Cao cấp 2)
let prevLevelVar = '@Level0Id'
for (const lvl of higherLevelsData) {
  const lvlVar = `@Level_${lvl.order}`
  sql.push(`
IF NOT EXISTS (SELECT 1 FROM dbo.LearningLevels WHERE LevelCode = ${esc(lvl.levelCode)})
BEGIN
    INSERT INTO dbo.LearningLevels (
        PathId, LevelCode, BadgeText, BadgeColor, Title, TopikLevel,
        TextbookName, Description, SkillTagsJson, DisplayOrder, Status
    ) VALUES (
        @PathId, ${esc(lvl.levelCode)}, ${esc(lvl.badge)}, ${esc(lvl.color)}, ${esc(lvl.title)}, ${esc(lvl.topik)},
        ${esc(lvl.textbook)}, ${esc(lvl.desc)}, ${esc(JSON.stringify(lvl.skills))}, ${lvl.order}, 'Published'
    );
END
DECLARE ${lvlVar} INT = (SELECT TOP 1 LevelId FROM dbo.LearningLevels WHERE LevelCode = ${esc(lvl.levelCode)});
IF NOT EXISTS (SELECT 1 FROM dbo.LevelUnlockRules WHERE LevelId = ${lvlVar})
BEGIN
    INSERT INTO dbo.LevelUnlockRules (LevelId, PrerequisiteLevelId, RequiredCompletedLessonsPercent, MinAverageQuizScorePercent, IsDefaultUnlocked)
    VALUES (${lvlVar}, ${prevLevelVar}, 100, 80, 0);
END`)
  prevLevelVar = lvlVar

  let tOrder = 1
  for (const t of lvl.topics) {
    sql.push(`
IF NOT EXISTS (SELECT 1 FROM dbo.LearningTopics WHERE TopicCode = ${esc(t.code)})
BEGIN
    INSERT INTO dbo.LearningTopics (LevelId, TopicCode, Title, Description, DisplayOrder, Status)
    VALUES (${lvlVar}, ${esc(t.code)}, ${esc(t.title)}, ${esc(t.desc)}, ${tOrder}, 'Published');
END
DECLARE @Top_${t.code} INT = (SELECT TOP 1 TopicId FROM dbo.LearningTopics WHERE TopicCode = ${esc(t.code)});`)
    tOrder++

    for (const les of t.lessons) {
      sql.push(`
IF NOT EXISTS (SELECT 1 FROM dbo.Lessons WHERE LessonCode = ${esc(les.code)})
BEGIN
    INSERT INTO dbo.Lessons (
        TopicId, LevelId, LessonCode, LessonNumber, Title, Subtitle,
        LearningObjective, EstimatedMinutes, DisplayOrder, Status, IsAiCompiled, NeedsExpertReview
    ) VALUES (
        @Top_${t.code}, ${lvlVar}, ${esc(les.code)}, ${les.num}, ${esc(les.title)}, ${esc(les.subtitle)},
        ${esc(les.objective)}, 30, ${les.num}, 'Published', ${les.isAi || 0}, ${les.needsReview || 0}
    );
END
DECLARE @Les_${les.code} INT = (SELECT TOP 1 LessonId FROM dbo.Lessons WHERE LessonCode = ${esc(les.code)});
IF NOT EXISTS (SELECT 1 FROM dbo.LessonCompletionRules WHERE LessonId = @Les_${les.code})
BEGIN
    INSERT INTO dbo.LessonCompletionRules (LessonId, RequireAllMandatoryActivities, RequireFinalQuizPass, MinQuizPassPercent, AllowUnlimitedRetakes, UnlockNextLessonOnComplete)
    VALUES (@Les_${les.code}, 1, 1, 80, 1, 1);
END
IF NOT EXISTS (SELECT 1 FROM dbo.LessonSections WHERE SectionCode = ${esc(les.code + '_SEC1')})
BEGIN
    INSERT INTO dbo.LessonSections (LessonId, SectionCode, SectionType, Title, ContentHtmlOrMd, ExamplesJson, DisplayOrder, Status)
    VALUES (
        @Les_${les.code},
        ${esc(les.code + '_SEC1')},
        'theory',
        ${esc('Kiến thức trọng tâm & Ngữ pháp: ' + les.grammar.pattern)},
        ${esc(`### Ngữ pháp trọng tâm: ${les.grammar.pattern}\n- **Ý nghĩa**: ${les.grammar.meaning}\n- **Cách dùng**: ${les.grammar.usage}\n- **Quy tắc chia**: ${les.grammar.conj}\n- **Ví dụ**: ${les.grammar.exKo} (${les.grammar.exVi})`)},
        ${esc(JSON.stringify([{ ko: les.grammar.exKo, roman: '', vi: les.grammar.exVi }]))},
        1,
        'Published'
    );
END`)

      // Grammar
      const gr = les.grammar
      sql.push(`
IF NOT EXISTS (SELECT 1 FROM dbo.Grammar WHERE GrammarCode = ${esc(gr.code)})
BEGIN
    INSERT INTO dbo.Grammar (
        GrammarCode, GrammarPattern, MeaningVi, UsageExplanation, ConjugationRule,
        ExampleKo, ExampleVi, TopikLevel, SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        ${esc(gr.code)}, ${esc(gr.pattern)}, ${esc(gr.meaning)}, ${esc(gr.usage)}, ${esc(gr.conj)},
        ${esc(gr.exKo)}, ${esc(gr.exVi)}, ${esc(lvl.topik)}, @SourceUpenn, ${les.isAi || 0}, ${les.needsReview || 0}, 'Published'
    );
END
DECLARE @Gr_${gr.code} INT = (SELECT TOP 1 GrammarId FROM dbo.Grammar WHERE GrammarCode = ${esc(gr.code)});
IF NOT EXISTS (SELECT 1 FROM dbo.LessonGrammar WHERE LessonId = @Les_${les.code} AND GrammarId = @Gr_${gr.code})
BEGIN
    INSERT INTO dbo.LessonGrammar (LessonId, GrammarId, DisplayOrder)
    VALUES (@Les_${les.code}, @Gr_${gr.code}, 1);
END`)

      // Exercise & Questions
      const exCode = `${les.code}_FINAL_EX`
      sql.push(`
IF NOT EXISTS (SELECT 1 FROM dbo.Exercises WHERE ExerciseCode = ${esc(exCode)})
BEGIN
    INSERT INTO dbo.Exercises (LessonId, ExerciseCode, ExerciseType, Title, Description, PassingScorePercent, TimeLimitSeconds, DisplayOrder, Status)
    VALUES (@Les_${les.code}, ${esc(exCode)}, 'final_test', ${esc('Kiểm tra cuối bài — ' + les.title)}, N'Đạt từ 80% trở lên để mở khóa bài tiếp theo.', 80, 300, 1, 'Published');
END
DECLARE @Ex_${les.code} INT = (SELECT TOP 1 ExerciseId FROM dbo.Exercises WHERE ExerciseCode = ${esc(exCode)});`)

      let qOrd = 1
      for (const q of les.questions) {
        sql.push(`
IF NOT EXISTS (SELECT 1 FROM dbo.Questions WHERE QuestionCode = ${esc(q.code)})
BEGIN
    INSERT INTO dbo.Questions (ExerciseId, QuestionCode, QuestionType, PromptText, KoreanHighlight, ExplanationVi, Points, DisplayOrder, Status)
    VALUES (@Ex_${les.code}, ${esc(q.code)}, 'multiple_choice', ${esc(q.prompt)}, ${esc(q.highlight)}, ${esc(q.explanation)}, 20, ${qOrd}, 'Published');
END
DECLARE @Q_${q.code} INT = (SELECT TOP 1 QuestionId FROM dbo.Questions WHERE QuestionCode = ${esc(q.code)});
IF NOT EXISTS (SELECT 1 FROM dbo.QuestionOptions WHERE QuestionId = @Q_${q.code})
BEGIN`)
        let oOrd = 1
        for (const opt of q.options) {
          sql.push(`
    INSERT INTO dbo.QuestionOptions (QuestionId, OptionLabel, OptionText, IsCorrect, DisplayOrder)
    VALUES (@Q_${q.code}, ${esc(opt.label)}, ${esc(opt.text)}, ${opt.correct ? 1 : 0}, ${oOrd});`)
          oOrd++
        }
        sql.push(`END`)
        qOrd++
      }

      // Activities
      sql.push(`
IF NOT EXISTS (SELECT 1 FROM dbo.LessonActivities WHERE ActivityCode = ${esc(les.code + '_ACT_THEORY')})
BEGIN
    INSERT INTO dbo.LessonActivities (LessonId, ActivityCode, ActivityType, Title, Description, IsRequired, DisplayOrder, XpReward, Status)
    VALUES (@Les_${les.code}, ${esc(les.code + '_ACT_THEORY')}, 'theory', N'Lý thuyết & Ngữ pháp trọng tâm', N'Nắm vững cấu trúc ngữ pháp và ví dụ hội thoại.', 1, 1, 20, 'Published');
END
IF NOT EXISTS (SELECT 1 FROM dbo.LessonActivities WHERE ActivityCode = ${esc(les.code + '_ACT_GRAMMAR')})
BEGIN
    INSERT INTO dbo.LessonActivities (LessonId, ActivityCode, ActivityType, Title, Description, IsRequired, DisplayOrder, XpReward, Status)
    VALUES (@Les_${les.code}, ${esc(les.code + '_ACT_GRAMMAR')}, 'grammar', N'Phân tích cấu trúc & Câu mẫu', N'Đối chiếu cách chia và ngữ cảnh sử dụng.', 1, 2, 20, 'Published');
END
IF NOT EXISTS (SELECT 1 FROM dbo.LessonActivities WHERE ActivityCode = ${esc(les.code + '_ACT_QUIZ')})
BEGIN
    INSERT INTO dbo.LessonActivities (LessonId, ActivityCode, ActivityType, Title, Description, IsRequired, ExerciseId, DisplayOrder, XpReward, Status)
    VALUES (@Les_${les.code}, ${esc(les.code + '_ACT_QUIZ')}, 'final_test', N'Bài kiểm tra cuối buổi (Đạt >= 80%)', N'Vượt qua bài kiểm tra để hoàn thành buổi học.', 1, @Ex_${les.code}, 3, 50, 'Published');
END`)
    }
  }
}

// 5.5. Import 60 cặp câu song ngữ Hàn-Việt thực tế từ Tatoeba + 250 từ vựng có thứ hạng tần suất cao nhất từ Julienshim Combined Seed vào dbo.Vocabulary
let tatIdx = 1
for (const pair of tatoebaPairs) {
  const vCode = `TAT_KOR_VIE_${String(pair.tatoebaId)}`
  sql.push(`
IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = ${esc(vCode)})
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, VietnameseMeaning, PartOfSpeech,
        ExampleSentenceKo, ExampleSentenceVi, NiklLevel, TopikLevel,
        TopicName, SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        ${esc(vCode)}, ${esc(pair.ko)}, ${esc(pair.vi)}, N'Biểu hiện / Câu mẫu',
        ${esc(pair.ko)}, ${esc(pair.vi)}, 'A', N'TOPIK I',
        N'Giao tiếp Tatoeba (CC BY 2.0 FR)', @SourceTatoeba, 0, 0, 'Published'
    );
END`)
  tatIdx++
}

// Lấy 250 từ vựng có rank cao nhất (1..250) từ Julienshim Combined Seed
const topRankedSeed = cleanedSeedVocab
  .filter((x) => x.rank !== null && x.rank >= 1 && x.rank <= 300)
  .sort((a, b) => a.rank - b.rank)
  .slice(0, 200)

let seedSeq = 1
for (const item of topRankedSeed) {
  const vCode = `NIKL_SEED_R${String(item.rank).padStart(4, '0')}_${String(seedSeq).padStart(3, '0')}`
  seedSeq++
  const meaningVi = item.hanja
    ? `${item.posVi} (Hán Hàn: ${item.hanja}${item.explanationKo ? ' · ' + item.explanationKo : ''})`
    : `${item.posVi}${item.explanationKo ? ' (' + item.explanationKo + ')' : ''}`
  sql.push(`
IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = ${esc(vCode)})
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Hanja, VietnameseMeaning, PartOfSpeech,
        ExplanationKo, NiklLevel, TopikLevel, TopicName, FrequencyRank,
        SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        ${esc(vCode)}, ${esc(item.ko)}, ${esc(item.hanja)}, ${esc(meaningVi)}, ${esc(item.posVi)},
        ${esc(item.explanationKo)}, ${esc(item.niklLevel)}, ${esc(item.topikLevel)},
        N'Từ vựng cốt lõi NIKL & TOPIK', ${item.rank},
        @SourceJulien, 0, 0, 'Published'
    );
END`)
}

sql.push('COMMIT TRANSACTION;')
sql.push(`
SELECT
  (SELECT COUNT(*) FROM dbo.LearningPaths) AS LearningPathsCount,
  (SELECT COUNT(*) FROM dbo.LearningLevels) AS LearningLevelsCount,
  (SELECT COUNT(*) FROM dbo.LearningTopics) AS LearningTopicsCount,
  (SELECT COUNT(*) FROM dbo.Lessons) AS LessonsCount,
  (SELECT COUNT(*) FROM dbo.LessonSections) AS LessonSectionsCount,
  (SELECT COUNT(*) FROM dbo.LessonResources) AS LessonResourcesCount,
  (SELECT COUNT(*) FROM dbo.ContentSources) AS ContentSourcesCount,
  (SELECT COUNT(*) FROM dbo.Vocabulary) AS VocabularyCount,
  (SELECT COUNT(*) FROM dbo.Grammar) AS GrammarCount,
  (SELECT COUNT(*) FROM dbo.LessonActivities) AS LessonActivitiesCount,
  (SELECT COUNT(*) FROM dbo.Exercises) AS ExercisesCount,
  (SELECT COUNT(*) FROM dbo.Questions) AS QuestionsCount,
  (SELECT COUNT(*) FROM dbo.QuestionOptions) AS QuestionOptionsCount,
  (SELECT COUNT(*) FROM dbo.LessonCompletionRules) AS LessonCompletionRulesCount,
  (SELECT COUNT(*) FROM dbo.LevelUnlockRules) AS LevelUnlockRulesCount
FOR JSON PATH;
`)

fs.writeFileSync(TEMP_SQL, sql.join('\n'), 'utf8')
console.log('Generated SQL script:', TEMP_SQL, 'Size:', fs.statSync(TEMP_SQL).size, 'bytes')

const out = execFileSync(
  'sqlcmd',
  ['-S', SERVER, '-d', DB, '-E', '-C', '-f', '65001', '-y', '0', '-i', TEMP_SQL],
  { encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 },
)
console.log('=== SQL IMPORT RESULT ===')
console.log(out.trim())
