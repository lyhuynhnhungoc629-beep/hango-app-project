# 🇰🇷 HANGO - Nền Tảng Học Tiếng Hàn Trực Tuyến Thông Minh

<p align="center">
  <img src="public/placeholder-logo.svg" alt="HANGO Logo" width="120" />
</p>

<p align="center">
  <b>Nền tảng học tiếng Hàn toàn diện: Flashcard Smart SRS 3D, Thi thử TOPIK chuẩn hóa, AI Luyện phát âm thông minh & Không gian học tập ảo Pomodoro.</b>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16.4-black?style=for-the-badge&logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/React-19-blue?style=for-the-badge&logo=react" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5.7-blue?style=for-the-badge&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=for-the-badge&logo=tailwind-css" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Web_Speech_API-Ready-purple?style=for-the-badge" alt="Web Speech" />
  <img src="https://img.shields.io/badge/Web_Audio_API-Synthesizer-indigo?style=for-the-badge" alt="Web Audio" />
</p>

---

## 👥 1. Đội Ngũ Phát Triển & Phân Công Nhiệm Vụ (Kế Hoạch 10 Tuần)

| Thành viên | Vai trò | Nhiệm vụ chi tiết trong lộ trình |
| :--- | :--- | :--- |
| **Nguyễn Ngọc Khánh** | **Frontend Lead (UI/UX)** | • Thiết kế toàn bộ giao diện UI/UX trên Next.js 16 & Tailwind CSS v4.<br>• Lập trình Flashcard 3D với công nghệ đọc tiếng Hàn tốc độ kép kiểu Google Dịch.<br>• Tích hợp Web Speech Recognition nhận diện giọng nói tiếng Hàn thời gian thực.<br>• Xây dựng bộ trộn âm thanh môi trường (Sound Mixer) và đồng hồ Pomodoro.<br>• Xây dựng cơ chế Demo Mode và soạn thảo tài liệu đặc tả [API_CONTRACT.md](./API_CONTRACT.md). |
| **Nguyễn Như Khuê** | **Backend Lead & AI** | • Kiến trúc Microservices (C#/Node.js) & xây dựng RESTful API.<br>• Lập trình thuật toán Smart SRS tính khoảng cách ngày ôn tập.<br>• Dựng Microservice Python FastAPI để phân tích sóng âm và chấm điểm phát âm tiếng Hàn. |
| **Ngọc** | **Database & Fullstack** | • Thiết kế cơ sở dữ liệu chuẩn BCNF trên SQL Server (`NGUOIDUNG`, `TUVUNG`, `TIENDO_SRS`, `DETHI_TOPIK`).<br>• Tích hợp logic Gamification (XP, Streak, Level) và viết kịch bản kiểm thử End-to-End. |

---

## 🛠️ 2. Chi Tiết Các Công Việc Kỹ Thuật Đã Hoàn Thiện (Frontend)

### 🎴 2.1. Phân hệ Flashcard 3D & Smart SRS (`/flashcard`)
- **Hiệu ứng lật thẻ 3D chân thực:** Sử dụng thuộc tính CSS `perspective: 1000px`, `transform-style: preserve-3d` và `rotateY(180deg)` cho phép lật mặt trước/sau mượt mà khi nhấn chuột hoặc phím Space/Enter.
- **Phát âm tiếng Hàn tốc độ kép (Google Translate style):** 
  - Tích hợp `window.speechSynthesis` lọc giọng đọc chuẩn tự nhiên nhất (*Google 한국어, Microsoft Heami, Yuna Natural*).
  - Bấm lần 1: Đọc tốc độ tự nhiên (`0.9x`).
  - Bấm lần 2 trong vòng 5 giây: Tự động chuyển sang đọc **chậm rãi từng âm tiết** (`0.55x` có huy hiệu `🐢 0.6x Đọc chậm`).
- **Thuật toán Spaced Repetition (SRS):** Bộ 3 nút phản hồi (*Quên / Khó / Nhớ*) ghi nhận và lưu số từ đã thuộc vào `localStorage` (`hango_flashcard_stats`), hiển thị thanh tiến độ trực quan.
- **Drawer chi tiết từ:** Bảng trượt bên phải hiển thị từ loại, phát âm, câu ví dụ tiếng Hàn và nghĩa dịch tiếng Việt.

### 🎙️ 2.2. Phân hệ AI Luyện Phát Âm & Roleplay Chat (`/ai`)
- **Nhận diện giọng nói thời gian thực (Live Transcript):**
  - Tích hợp `SpeechRecognition` với ngôn ngữ tiếng Hàn (`ko-KR`).
  - Kích hoạt `interimResults: true` giúp chữ người dùng nói xuất hiện ngay lập tức trên màn hình.
- **Thuật toán chấm điểm chuẩn xác:**
  - So khớp từng âm tiết mục tiêu (`오늘`, `날씨`, `가`, `좋`, `네`, `요`).
  - Tính điểm phần trăm thực tế (0 - 100 điểm) và đổi màu trạng thái từng âm tiết (*Xanh: Chính xác / Vàng: Cần cải thiện / Đỏ: Chưa đúng*).
  - Có các nút bấm test nhanh thuật toán (*Đúng 100đ / Gần đúng 60đ / Sai 0đ*).
- **AI Roleplay:** Mô phỏng các tình huống hội thoại thực tế tại Nhà hàng, Sân bay, Mua sắm, Bệnh viện.

### ⏳ 2.3. Không Gian Tự Học Virtual Room (`/study-room`)
- **Bộ trộn âm thanh môi trường (Sound Mixer):**
  - **Tiếng mưa:** Hỗ trợ phát file bản thu âm MP3 thật tự nhiên, kèm cơ chế tự động đọc file cục bộ từ thư mục `public/audio/rain.mp3`.
  - **Quán cà phê sách:** Sử dụng Web Audio API lọc dải siêu trầm `130Hz`, tạo không gian cách âm ấm áp, tĩnh lặng, không bị ồn ào.
  - **Lofi Chill Piano:** Tổng hợp chuỗi hợp âm Rhodes jazz ấm áp (*Fmaj7 - Em7 - Dm7 - Cmaj7*) du dương giúp tập trung học bài.
- **Đồng hồ Pomodoro:** 
  - Hỗ trợ 3 chế độ: *Học tập (25p)*, *Nghỉ ngắn (5p)* và *Nghỉ dài (15p)*.
  - Tích hợp chuông báo Web Audio Synthesizer (ding-dong chime) tự giải phóng bộ nhớ khi hết giờ.
  - Lưu trữ số phút học hôm nay vào `localStorage`.
- **Mục tiêu học hôm nay (Goal List):** Thêm, xóa, đánh dấu hoàn thành mục tiêu, lưu tự động và tính phần trăm hoàn thành.

### 📝 2.4. Phân hệ Thi Thử TOPIK (`/topik`)
- Đồng hồ đếm ngược bài thi chuẩn hóa 100 phút.
- Giao diện bài thi Nghe kèm biểu đồ sóng âm (audio waveform) và bài thi Đọc.
- Bảng ma trận 40 câu hỏi trắc nghiệm, tự động cập nhật trạng thái đã làm.

### 🔐 2.5. Xác Thực & Chế Độ Demo Mode (`/auth`)
- **Tích hợp Firebase Auth sẵn sàng:** Hỗ trợ Email/Mật khẩu, Google, Facebook, Apple và đồng bộ thông tin `users` profile Firestore.
- **Chế độ Demo Mode:** Cho phép trải nghiệm, đăng nhập và đăng ký tài khoản học viên ngay lập tức mà không bị chặn khi chưa cấu hình Firebase.

### 📑 2.6. Thiết Kế Tài Liệu Đặc Tả Hệ Thống ([API_CONTRACT.md](./API_CONTRACT.md))
- Soạn thảo hợp đồng giao tiếp dữ liệu chuẩn RESTful JSON giữa Frontend và Backend gồm 7 phân hệ lớn.
- Thiết kế sẵn lược đồ các bảng cho SQL Server (`NGUOIDUNG`, `TUVUNG`, `TIENDO_SRS`, `DETHI_TOPIK`, `CAUHOI_TOPIK`, `LICHSU_HOC`).

---

## 💻 3. Công Nghệ Sử Dụng (Tech Stack)

| Lớp kiến trúc | Công nghệ |
| :--- | :--- |
| **Framework** | Next.js 16.4 (App Router) + React 19 + TypeScript 5.7 |
| **Styling & UI** | Tailwind CSS v4, Lucide React, Base UI / Shadcn UI |
| **Biểu đồ** | Recharts (vẽ biểu đồ học tập trong Dashboard) |
| **Âm thanh & Speech** | Web Audio API (Synthesizer & Filters), Web Speech API (Synthesis & Recognition) |
| **Xác thực & Dữ liệu** | Firebase Authentication, Cloud Firestore & SQL Server |

---

## 🚀 4. Hướng Dẫn Cài Đặt & Chạy Cục Bộ

1. **Di chuyển vào thư mục dự án:**
   ```bash
   cd hango-app-project-main
   ```

2. **Cài đặt thư viện:**
   ```bash
   npm install
   ```

3. **Khởi động server phát triển:**
   ```bash
   npm run dev
   ```

4. **Truy cập:** Mở trình duyệt tại [http://localhost:3000](http://localhost:3000)

---

## 📁 5. Cấu Trúc Thư Mục Dự Án

```text
hango-app-project-main/
├── app/                  # Next.js App Router (admin, ai, auth, dashboard, flashcard, study-room, topik)
├── components/           # Các component theo từng module tính năng
│   ├── admin/            # Quản trị viên & bảng người dùng
│   ├── ai/               # AI Roleplay & Luyện phát âm
│   ├── auth/             # Form đăng nhập/đăng ký
│   ├── dashboard/        # Biểu đồ tiến độ & profile banner
│   ├── flashcard/        # Lật thẻ từ vựng 3D & SRS
│   ├── study-room/       # Pomodoro, Sound Mixer, Goal list
│   └── topik/            # Giao diện thi thử TOPIK
├── lib/
│   ├── auth-context.tsx  # Auth Provider, đồng bộ Firestore & Demo Mode
│   ├── firebase.ts       # Cấu hình SDK Firebase an toàn có try/catch
│   └── utils.ts          # Tiện ích Tailwind merge (cn)
├── public/               # Ảnh và tài nguyên âm thanh (public/audio/)
├── API_CONTRACT.md       # Đặc tả giao thức API cho Backend & Database
└── README.md             # Giới thiệu & hướng dẫn toàn diện dự án
```

---

<p align="center">
  <b>HANGO Project © 2026</b>
</p>
