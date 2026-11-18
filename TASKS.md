# 📋 HANGO - BẢNG PHÂN CÔNG NHIỆM VỤ & BÀN GIAO TIẾN ĐỘ

> **Thời điểm cập nhật**: Hoàn thành Tuần 6 (Giai đoạn chuyển giao sang Tuần 7)  
> **Người cập nhật**: Nguyễn Ngọc Khánh (Frontend Lead)  
> **Kho lưu trữ**: `lyhuynhnhungoc629-beep/hango-app-project`

---

## 🚀 1. TIẾN ĐỘ CỦA NGUYỄN NGỌC KHÁNH (FRONTEND)

### ✅ Đã hoàn thành 100% nhiệm vụ Tuần 6:
1. **Phân hệ Thi thử TOPIK (`/topik`)**:
   - Giao diện làm bài thi chuẩn hóa TOPIK I (`components/topik/topik-test.tsx`).
   - Đồng hồ đếm ngược 100 phút (chuyển cảnh báo đỏ dưới 5 phút, **tự động nộp bài khi hết giờ**).
   - Trình phát âm thanh phần Nghe: play/pause, tua seekbar, chọn tốc độ (0.75x, 1x, 1.25x), giới hạn tối đa 2 lượt nghe mỗi câu.
   - Bảng ma trận 40 câu hỏi trắc nghiệm, hiển thị trạng thái đã làm, chưa làm, đánh dấu xem lại (phím tắt `F`).
   - Phím tắt tiện lợi: `←` `→` chuyển câu, `1` `2` `3` `4` chọn đáp án.
   - Cơ chế tự động lưu bài làm vào `localStorage` (f5 tải lại trang không mất tiến độ).
   - Hộp thoại xác nhận nộp bài (liệt kê danh sách các câu chưa làm để học viên bấm vào xem lại).
   - Tách riêng lớp nạp dữ liệu tại `lib/topik/exam-source.ts`, sẵn sàng đón API thật từ Backend.
2. **Giao diện Lộ trình học 7 Chặng (`/learning-path`)**:
   - Giao diện Timeline 7 chặng chuẩn hóa.
   - Hiển thị chi tiết từng buổi học: Lý thuyết, Từ vựng kèm phát âm, Bài tập thực hành.
3. *(Làm vượt tiến độ Tuần 7)* **AI Luyện phát âm (`/ai`)**:
   - Tích hợp ghi âm giọng thật (`MediaRecorder`) kèm hiển thị sóng âm trực tiếp (Live Waveform).
   - Chức năng "Nghe lại giọng tôi" và "So sánh với mẫu" sau khi đọc.

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
