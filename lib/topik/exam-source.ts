/**
 * Nguồn dữ liệu đề thi TOPIK cho giao diện.
 *
 * HIỆN TẠI: dùng đề mẫu cục bộ (MOCK_EXAM) để dựng giao diện tuần 6.
 * KHI API CỦA BACKEND SẴN SÀNG: chỉ cần thay phần thân hàm `fetchTopikExam`
 * (ví dụ gọi `GET /api/topik/tests/:id`) – giao diện không phải sửa.
 *
 * Lưu ý: đề mẫu KHÔNG chứa đáp án; việc chấm điểm & lời giải do Backend xử lý.
 */

export type TopikSection = 'listening' | 'reading'

export interface TopikQuestion {
  /** Số thứ tự câu hiển thị (1..n) */
  number: number
  section: TopikSection
  /** Câu hỏi / yêu cầu bằng tiếng Hàn */
  prompt: string
  /** Gợi ý dịch tiếng Việt (tùy chọn) */
  hint?: string
  /** Đoạn văn cho phần Đọc (tùy chọn) */
  passage?: string
  /** File MP3 cho phần Nghe (tùy chọn) */
  audioUrl?: string
  /** Lời thoại dự phòng – đọc bằng giọng trình duyệt khi chưa có file MP3 */
  audioScript?: string
  options: string[]
}

export interface TopikExam {
  examId: string
  title: string
  level: 'TOPIK I' | 'TOPIK II'
  durationMinutes: number
  /** Số lần được nghe tối đa cho mỗi câu phần Nghe */
  maxListenCount: number
  questions: TopikQuestion[]
}

export interface TopikSubmission {
  examId: string
  answers: Record<number, number>
  durationSeconds: number
  autoSubmitted: boolean
}

const MOCK_EXAM: TopikExam = {
  examId: 'topik-1-mock-01',
  title: 'Đề thi thử TOPIK I - Đề mẫu 01',
  level: 'TOPIK I',
  durationMinutes: 100,
  maxListenCount: 2,
  questions: [
    {
      number: 1,
      section: 'listening',
      prompt: '다음을 듣고 물음에 맞는 대답을 고르십시오.',
      hint: 'Nghe và chọn câu trả lời phù hợp với câu hỏi.',
      audioScript: '남자: 사과가 있어요?',
      options: ['네, 사과가 있어요.', '네, 사과가 커요.', '아니요, 사과를 좋아해요.', '아니요, 사과가 맛있어요.'],
    },
    {
      number: 2,
      section: 'listening',
      prompt: '다음을 듣고 물음에 맞는 대답을 고르십시오.',
      hint: 'Nghe và chọn câu trả lời phù hợp với câu hỏi.',
      audioScript: '여자: 주말에 뭐 했어요?',
      options: ['친구를 만났어요.', '주말이 좋아요.', '내일 갈 거예요.', '집이 멀어요.'],
    },
    {
      number: 3,
      section: 'listening',
      prompt: '다음을 듣고 이어지는 말을 고르십시오.',
      hint: 'Nghe và chọn câu nói tiếp theo.',
      audioScript: '남자: 늦어서 죄송합니다.',
      options: ['괜찮아요.', '고맙습니다.', '반갑습니다.', '잘 먹겠습니다.'],
    },
    {
      number: 4,
      section: 'listening',
      prompt: '여기는 어디입니까? 알맞은 것을 고르십시오.',
      hint: 'Đây là đâu? Chọn đáp án phù hợp.',
      audioScript: '여자: 이 책을 빌리고 싶어요. 남자: 학생증을 보여 주세요.',
      options: ['은행', '도서관', '식당', '병원'],
    },
    {
      number: 5,
      section: 'listening',
      prompt: '다음을 듣고 남자가 이어서 할 말로 가장 알맞은 것을 고르십시오.',
      hint: 'Nghe và chọn câu người đàn ông sẽ nói tiếp.',
      audioScript: '여자: 민수 씨, 회의가 곧 시작해요. 빨리 오세요.',
      options: ['네, 지금 바로 갈게요.', '아니요, 어제 만났어요.', '네, 커피를 좋아해요.', '아니요, 학생이 아니에요.'],
    },
    {
      number: 6,
      section: 'reading',
      prompt: '무엇에 대한 내용입니까? 알맞은 것을 고르십시오.',
      hint: 'Nội dung nói về điều gì?',
      passage: '저는 사과를 좋아합니다. 바나나도 좋아합니다.',
      options: ['과일', '날씨', '취미', '가족'],
    },
    {
      number: 7,
      section: 'reading',
      prompt: '(   )에 들어갈 가장 알맞은 것을 고르십시오.',
      hint: 'Chọn từ phù hợp nhất điền vào chỗ trống.',
      passage: '배가 고픕니다. (   )을 먹습니다.',
      options: ['물', '밥', '책', '옷'],
    },
    {
      number: 8,
      section: 'reading',
      prompt: '다음을 읽고 내용이 같은 것을 고르십시오.',
      hint: 'Đọc và chọn nội dung giống với đoạn văn.',
      passage: '저는 매일 아침 7시에 일어납니다. 그리고 공원에서 30분 동안 운동을 합니다.',
      options: ['저는 저녁에 운동을 합니다.', '저는 아침마다 운동을 합니다.', '저는 7시에 잠을 잡니다.', '저는 공원에 가지 않습니다.'],
    },
    {
      number: 9,
      section: 'reading',
      prompt: '다음을 읽고 중심 생각을 고르십시오.',
      hint: 'Đọc và chọn ý chính.',
      passage: '저는 한국어를 배우고 있습니다. 한국 드라마를 자막 없이 보고 싶어서 매일 열심히 공부합니다.',
      options: [
        '한국 드라마는 재미없습니다.',
        '자막 없이 드라마를 보고 싶어서 한국어를 공부합니다.',
        '저는 한국에 살고 있습니다.',
        '한국어는 배우기 쉽습니다.',
      ],
    },
    {
      number: 10,
      section: 'reading',
      prompt: '다음 글을 읽고 물음에 답하십시오. 이 사람은 왜 병원에 갔습니까?',
      hint: 'Vì sao người này đi bệnh viện?',
      passage: '어제 비를 맞고 집에 왔습니다. 오늘 아침에 머리가 아프고 열이 났습니다. 그래서 병원에 갔습니다.',
      options: ['친구를 만나려고', '감기에 걸려서', '일을 하려고', '약을 사려고'],
    },
  ],
}

/** Lấy đề thi. TODO(Backend): thay bằng `fetch('/api/topik/tests/' + examId)` khi API sẵn sàng. */
export async function fetchTopikExam(_examId?: string): Promise<TopikExam> {
  return MOCK_EXAM
}

/**
 * Nộp bài thi. TODO(Backend): gọi `POST /api/topik/submit` và trả về kết quả chấm điểm.
 * Hiện trả về `null` – giao diện sẽ hiển thị trạng thái "Đã nộp, chờ chấm điểm".
 */
export async function submitTopikExam(_submission: TopikSubmission, _token?: string | null): Promise<null> {
  return null
}
