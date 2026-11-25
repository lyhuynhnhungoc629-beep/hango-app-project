# 📋 HANGO - BẢNG PHÂN CÔNG NHIỆM VỤ & BÀN GIAO TIẾN ĐỘ

> **Thời điểm cập nhật**: Hoàn thành Tuần 7 (Frontend) & Chuyển giao các phần Backend / CSDL cho Khuê và Ngọc  
> **Người cập nhật**: Nguyễn Ngọc Khánh (Frontend Lead)  
> **Kho lưu trữ**: `lyhuynhnhungoc629-beep/hango-app-project`

---

## 🚀 1. TIẾN ĐỘ CỦA NGUYỄN NGỌC KHÁNH (FRONTEND)

### ✅ Đã hoàn thành 100% nhiệm vụ Tuần 7:
1. **Nâng cấp Flashcard Student theo dạng các ô chủ đề (`/flashcard`)**:
   - Giao diện dạng ô lưới (Card Grid) trực quan, có thẻ cấp độ TOPIK, thanh tiến độ học SRS, số từ đã ghi nhớ và số từ cần ôn hôm nay.
   - Cơ chế fallback thông minh: Khi Database SQL Server hoặc Token chưa sẵn sàng, hệ thống tự động sinh dữ liệu chủ đề mẫu sống động (Chào hỏi, Trường học, Ẩm thực, Con người & Quan hệ, Thời tiết...) đảm bảo giao diện luôn hiển thị mượt mà 100%, không bị treo loading.
   - Luồng chọn chủ đề 3 bước mượt mà: Thư viện chủ đề (`library`) $\rightarrow$ Xem danh sách từ trong chủ đề (`topic-detail`) $\rightarrow$ Lật thẻ Flashcard 3D (`study`).

2. **Giao diện AI Chat Roleplay thông minh (`/ai`)**:
   - Tích hợp **Micro thu âm giọng nói thật (Web Speech Recognition `ko-KR`)**: học viên có thể bấm Micro và nói tiếng Hàn trực tiếp vào khung chat.
   - Tích hợp **nút Loa nghe phát âm (TTS)**: bấm vào câu tiếng Hàn bất kỳ của AI và của người học để nghe đọc tiếng Hàn chuẩn bản xứ.
   - Hỗ trợ **4 tình huống giao tiếp thực tế**: Nhà hàng, Sân bay Incheon, Cửa hàng Mua sắm, Bệnh viện & Hiệu thuốc.
   - Thêm các **mẫu câu gợi ý nhanh (Quick Replies)** theo từng ngữ cảnh để học viên bấm vào nói/nhập ngay.
   - Bộ máy phản hồi ngữ cảnh thông minh (Contextual Response Engine) có khả năng tự động phân tích và đưa ra thẻ *Gợi ý sửa lỗi ngữ pháp & xưng hô* (ví dụ: nhắc dùng kính ngữ `-주세요`, dùng `저` thay vì `나`).
   - Sẵn sàng cổng kết nối API Backend (`/api/ai/chat`) của Khuê.

3. **Nâng cấp phân hệ Luyện phát âm (`/ai`)**:
   - Cung cấp sẵn ngân hàng câu luyện nói đa dạng theo các chủ đề: Chào hỏi, Đời sống, Ăn uống, Mua sắm, Học tập (kèm nhãn chủ đề & cấp độ).
   - Hỗ trợ nhận từ vựng truyền vào từ bên ngoài (`initialWord`) và bổ sung ô nhập từ/câu tiếng Hàn tùy chọn (`Luyện câu này`), cho phép học viên luyện phát âm câu bất kỳ.
   - Tự động tách âm tiết Hangul, chấm điểm thực tế từ 0 - 100 và phân loại màu sắc (Xanh / Vàng / Đỏ).
   - Giữ nguyên hiệu ứng đọc mẫu tốc độ kép (Google Dịch style) và ghi âm so sánh sóng âm trực tiếp.

4. **Sửa lỗi Build & Đồng bộ giao diện AI Studio**:
   - Chuyển font `Noto Sans KR` sang Google Fonts CDN trong `app/layout.tsx` và `app/globals.css` để tương thích Next.js 16.4 Turbopack.
   - Sửa lỗi JSX thừa cuối file `components/ai/pronunciation-practice.tsx`, dọn import thừa, và kiểm tra toàn bộ dự án qua `tsc --noEmit` (0 lỗi).
   - Đồng bộ màu chủ đạo `#7C3AED` và badge `AI Studio` trên `app/ai/page.tsx` và `components/ai/ai-tabs.tsx`.

---

## 🎯 2. NHIỆM VỤ BÀN GIAO CHO NGỌC (DATABASE & CSDL)

### 📌 Nhiệm vụ cần ưu tiên thực hiện:
1. **Khởi tạo CSDL `HangoDatasetDB`**:
   - Mở SQL Server Management Studio (SSMS) trên máy và tạo mới Database tên `HangoDatasetDB`.
   - Thực thi script `scripts/sql/learning_path_schema.sql` và nạp dữ liệu từ `scripts/sql/seed_learning_path_generated.sql`.
   - *Mục đích*: Xử lý dứt điểm lỗi `Sqlcmd: Cannot open database "HangoDatasetDB"` khi học viên truy cập trang Lộ trình học.
2. **Thiết kế CSDL phân hệ Đề thi TOPIK**:
   - Tạo bảng lưu trữ đề thi (Đề số, cấp độ TOPIK, thời lượng).
   - Tạo bảng câu hỏi (Thứ tự, phần Nghe/Đọc, câu hỏi tiếng Hàn, gợi ý tiếng Việt, đoạn văn, link file MP3).
   - Tạo bảng đáp án và lời giải chi tiết.
3. **Xây dựng logic chấm điểm & đối chiếu đáp án**:
   - Viết Stored Procedure hoặc hàm đối chiếu đáp án học viên gửi lên với đáp án chuẩn.
   - Tính toán điểm số (tối đa 200 điểm), xếp loại cấp độ (TOPIK I Cấp 1, Cấp 2 hoặc Chưa đạt).
   - Trả về lời giải chi tiết từng câu.

---

## 🎯 3. NHIỆM VỤ BÀN GIAO CHO KHUÊ (BACKEND & AI)

### 📌 Nhiệm vụ cần ưu tiên thực hiện:
1. **Xây dựng API cho phân hệ Thi thử TOPIK**:
   - `GET /api/topik/tests/[examId]`: Trả về thông tin đề thi và danh sách câu hỏi trắc nghiệm (lưu ý: KHÔNG trả về đáp án đúng để bảo mật).
   - `POST /api/topik/submit`: Tiếp nhận payload bài làm:
     ```json
     {
       "examId": "topik-1-mock-01",
       "answers": { "1": 0, "2": 2, ... },
       "durationSeconds": 3600,
       "autoSubmitted": false
     }
     ```
     Gọi logic chấm điểm của Ngọc và trả về kết quả JSON gồm: điểm số, số câu đúng, cấp độ đạt được, và danh sách lời giải từng câu.
   - *Ghi chú cho Khuê*: Frontend đã để sẵn 2 hàm `fetchTopikExam` và `submitTopikExam` trong `lib/topik/exam-source.ts`. Khuê chỉ cần nối endpoint vào là giao diện tự động chạy ngay.
2. **Kiểm tra và hoàn thiện API Lộ trình học**:
   - Rà soát lại `GET /api/learning-path` sau khi Ngọc khởi tạo xong CSDL `HangoDatasetDB`.
3. **Chuẩn bị cho Tuần 7 (AI Microservice)**:
   - Dựng Microservice Python FastAPI phân tích sóng âm phát âm tiếng Hàn.
   - Chuẩn bị API kết nối Chatbot Roleplay.
