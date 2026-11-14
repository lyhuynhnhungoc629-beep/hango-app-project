# TÀI LIỆU ĐẶC TẢ GIAO TIẾP HỆ THỐNG HANGO (API CONTRACT)

> **Dành cho nhóm phát triển:**
> - **Frontend (UI/UX):** Nguyễn Ngọc Khánh
> - **Backend & Microservices (C#/Node.js/Python):** Nguyễn Như Khuê
> - **Database & Fullstack hỗ trợ (SQL Server):** Ngọc

Tài liệu này quy định cấu trúc dữ liệu JSON giữa Frontend và Backend để đảm bảo hai bên làm việc độc lập và ráp nối dễ dàng vào Tuần 9.

---

## 1. Chuẩn giao tiếp chung
- **Base URL:** `https://api.hango.edu.vn/api/v1` (hoặc `http://localhost:5000/api/v1`)
- **Headers:**
  ```http
  Content-Type: application/json
  Authorization: Bearer <ACCESS_TOKEN>
  ```
- **Chuẩn phản hồi chung (Response Envelope):**
  ```json
  {
    "success": true,
    "message": "Thành công",
    "data": { ... }
  }
  ```

---

## 2. Phân hệ 1: Xác thực & Người dùng (Auth & Users)

### 2.1. Đăng ký tài khoản
- **Method:** `POST /auth/register`
- **Body:**
  ```json
  {
    "fullName": "Nguyễn Văn A",
    "email": "user@example.com",
    "password": "Password123@"
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "data": {
      "token": "jwt_token_string",
      "user": {
        "id": "usr_01",
        "email": "user@example.com",
        "displayName": "Nguyễn Văn A",
        "role": "student",
        "level": 1,
        "xp": 0,
        "streak": 1
      }
    }
  }
  ```

### 2.2. Đăng nhập
- **Method:** `POST /auth/login`
- **Body:**
  ```json
  {
    "email": "user@example.com",
    "password": "Password123@"
  }
  ```

### 2.3. Lấy thông tin cá nhân
- **Method:** `GET /users/me`

---

## 3. Phân hệ 2: Học liệu & Flashcard SRS (Tuần 3 & 4)

### 3.1. Lấy danh sách từ vựng cần ôn tập hôm nay (Smart SRS)
- **Method:** `GET /flashcards/study-set?level=topik1`
- **Response:**
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "w_001",
        "korean": "안녕하세요",
        "roman": "an-nyeong-ha-se-yo",
        "meaning": "Xin chào",
        "partOfSpeech": "Thán từ",
        "exampleKo": "선생님, 안녕하세요!",
        "exampleVi": "Chào thầy/cô ạ!",
        "audioUrl": "https://cdn.hango.edu.vn/audio/w_001.mp3",
        "srsLevel": 2
      }
    ]
  }
  ```

### 3.2. Cập nhật kết quả ghi nhớ (SRS Review)
- **Method:** `POST /flashcards/review`
- **Body:**
  ```json
  {
    "wordId": "w_001",
    "rating": "remembered" // "forgot" | "hard" | "remembered"
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "data": {
      "nextReviewDate": "2026-11-14T00:00:00Z",
      "xpGained": 10
    }
  }
  ```

---

## 4. Phân hệ 3: Không gian học tập (Virtual Room & Pomodoro - Tuần 5)

### 4.1. Lưu phiên học Pomodoro & Cộng điểm Gamification
- **Method:** `POST /study/sessions`
- **Body:**
  ```json
  {
    "durationMinutes": 25,
    "mode": "focus",
    "timestamp": "2026-11-10T22:00:00Z"
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "data": {
      "totalMinutesToday": 100,
      "xpAdded": 25,
      "currentStreak": 7
    }
  }
  ```

---

## 5. Phân hệ 4: Thi thử TOPIK (Mock Test - Tuần 6)

### 5.1. Lấy đề thi TOPIK
- **Method:** `GET /topik/tests/{testId}`
- **Response:**
  ```json
  {
    "success": true,
    "data": {
      "id": "topik_test_01",
      "title": "Đề thi thử TOPIK I số 1",
      "timeLimitMinutes": 100,
      "totalQuestions": 40,
      "questions": [
        {
          "questionNumber": 1,
          "type": "listening", // "listening" | "reading"
          "prompt": "다음을 듣고 알맞은 것을 고르십시오.",
          "audioUrl": "https://cdn.hango.edu.vn/audio/topik1_q1.mp3",
          "options": [
            "네, 지금 바로 갈게요.",
            "아니요, 어제 만났어요.",
            "네, 커피를 좋아해요.",
            "아니요, 학생이 아니에요."
          ]
        }
      ]
    }
  }
  ```

### 5.2. Nộp bài thi & Nhận kết quả
- **Method:** `POST /topik/tests/{testId}/submit`
- **Body:**
  ```json
  {
    "answers": {
      "1": 0,
      "2": 2,
      "3": 1
    },
    "durationSeconds": 3600
  }
  ```

---

## 6. Phân hệ 5: AI Microservice (FastAPI - Tuần 7)

### 6.1. AI Roleplay Chatbot
- **Method:** `POST /ai/roleplay`
- **Body:**
  ```json
  {
    "scenarioId": "restaurant",
    "messages": [
      { "role": "user", "content": "비빔밥 두 개 주세요." }
    ]
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "data": {
      "replyKo": "네, 비빔밥 두 개 주문 받았습니다! 음료는 필요 없으세요?",
      "replyVi": "Vâng, tôi đã nhận 2 phần bibimbap! Bạn có cần đồ uống không?",
      "grammarTip": null
    }
  }
  ```

### 6.2. Phân tích phát âm (FastAPI Speech Analysis)
- **Method:** `POST /ai/pronounce/evaluate` (Multipart Form-Data)
- **Body:**
  - `targetText`: `"오늘 날씨가 좋네요"`
  - `audioFile`: `<file.wav hoặc file.webm>`
- **Response:**
  ```json
  {
    "success": true,
    "data": {
      "overallScore": 88,
      "transcribedText": "오늘 날씨가 좋네요",
      "syllables": [
        { "syllable": "오늘", "status": "good" },
        { "syllable": "날씨", "status": "warn" },
        { "syllable": "가", "status": "good" },
        { "syllable": "좋네요", "status": "good" }
      ],
      "feedback": "Âm ㅆ trong 날씨 phát âm cần mạnh hơn."
    }
  }
  ```

---

## 7. Gợi ý cấu trúc bảng SQL Server (Dành cho Ngọc)
- `NGUOIDUNG` (`MaND`, `HoTen`, `Email`, `MatKhauHash`, `VaiTro`, `DiemXP`, `CapDo`, `ChuoiStreak`, `NgayTao`)
- `TUVUNG` (`MaTu`, `TuTiengHan`, `PhienAm`, `NghiaTiengViet`, `TuLoai`, `ViDuHan`, `ViDuViet`, `CapDoTopik`)
- `TIENDO_SRS` (`MaND`, `MaTu`, `KhoangCachNgay`, `NgayOnTiepTheo`, `TrangThai`)
- `DETHI_TOPIK` (`MaDe`, `TieuDe`, `ThoiGianThi`, `TongSoCau`)
- `CAUHOI_TOPIK` (`MaCau`, `MaDe`, `SoThuTu`, `LoaiCau`, `NoiDung`, `FileAudioUrl`, `DapAnDung`)
- `LICHSU_HOC` (`MaLS`, `MaND`, `LoaiHoc`, `SoPhut`, `NgayHoc`, `XPNhanDuoc`)
